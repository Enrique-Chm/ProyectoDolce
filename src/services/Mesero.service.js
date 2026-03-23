// Archivo: src/services/Mesero.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Importación de seguridad

export const MeseroService = {
  
  // 🛡️ Función para verificar estado de caja antes de cualquier acción (preventivo)
  verificarCajaAbierta: async (sucursalId) => {
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .select('id')
      .eq('sucursal_id', sucursalId)
      .eq('estado', 'abierto') // ✅ Corregido a 'abierto' (masculino) según DB
      .maybeSingle();
    
    if (error) return { abierta: false, error };
    return { abierta: !!data, sesionId: data?.id, error: null };
  },

  getCuentasAbiertas: async (sucursalId) => {
    // 🛡️ Blindaje: Solo personal con permiso de lectura de ventas
    if (!hasPermission('ver_ventas')) {
      return { data: [], error: { message: 'No tienes permisos para ver cuentas abiertas.' } };
    }

    // 🔴 CORRECCIÓN: Se agrega !venta_id para resolver la ambigüedad de relaciones detectada por PostgREST
    let query = supabase
      .from('ventas')
      .select(`
        *,
        ventas_detalle!venta_id (*)
      `)
      .in('estado', ['pendiente', 'por_cobrar'])
      .order('created_at', { ascending: false });

    // Filtrar por sucursal si existe
    if (sucursalId) {
      query = query.eq('sucursal_id', sucursalId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  getHistorialCobradas: async (sucursalId) => {
    // 🛡️ Blindaje: Permiso para ver historial
    if (!hasPermission('ver_ventas')) {
      return { data: [], error: { message: 'No tienes permisos para ver el historial.' } };
    }

    // 🔴 CORRECCIÓN: Filtrado por sucursal
    let query = supabase
      .from('ventas')
      .select('*')
      .eq('estado', 'pagado')
      .order('hora_cierre', { ascending: false })
      .limit(50);

    if (sucursalId) {
      query = query.eq('sucursal_id', sucursalId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  marcarPorCobrar: async (ventaId) => {
    // 🛡️ Blindaje: Permiso para editar estados de venta
    if (!hasPermission('editar_ventas')) {
      return { success: false, error: 'No tienes facultades para solicitar la cuenta.' };
    }

    const { error } = await supabase
      .from('ventas')
      .update({ estado: 'por_cobrar' })
      .eq('id', ventaId);
      
    return { success: !error, error: error?.message };
  },

  procesarVenta: async (ventaData, carrito) => {
    // 🛡️ Blindaje: Crear ventas es una acción crítica
    if (!hasPermission('crear_ventas')) {
      return { success: false, error: 'Acceso denegado: No puedes registrar nuevas órdenes.' };
    }

    try {
      let ventaId = ventaData.id;
      
      // 1. SI ES UNA MESA NUEVA (No tiene ID de venta previo)
      if (!ventaId) {
        // 🔒 VALIDACIÓN DE CAJA (Backend Safety): Buscar sesión abierta para la sucursal 
        const { abierta, sesionId, error: errSesion } = await MeseroService.verificarCajaAbierta(ventaData.sucursal_id);

        if (errSesion || !abierta) {
          throw new Error("No se puede abrir la mesa: No hay una sesión de caja abierta en esta sucursal.");
        }

        const totalInicial = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0);
        
        // 🟡 MEJORA: Se incluye id_sesion_caja obligatorio para trazabilidad 
        const nuevaVentaPayload = {
          usuario_id: ventaData.usuario_id || null, 
          mesa: ventaData.mesa ? String(ventaData.mesa) : 'S/N',
          estado: 'pendiente',
          subtotal: parseFloat(totalInicial), 
          total: parseFloat(totalInicial),
          sucursal_id: ventaData.sucursal_id || null,
          id_sesion_caja: sesionId // <--- Relación obligatoria con la caja
        };

        const { data: nuevaVenta, error: errVenta } = await supabase
          .from('ventas')
          .insert([nuevaVentaPayload])
          .select()
          .single();
          
        if (errVenta) {
          console.error("Error al crear la venta padre:", errVenta);
          throw new Error(errVenta.message); 
        }
        ventaId = nuevaVenta.id;
      }

      // 2. PREPARAR DETALLES DE LOS PRODUCTOS
      const detalles = carrito.map(item => ({
        venta_id: ventaId, 
        producto_id: parseInt(item.id),
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precio_venta),
        costo_unitario_historico: parseFloat(item.costo_actual || 0), 
        subtotal: parseFloat(item.cantidad * item.precio_venta),
        notes: item.notas || ''
      }));

      // 3. INSERTAR DETALLES EN LA BASE DE DATOS
      const { error: errDetalles } = await supabase
        .from('ventas_detalle')
        .insert(detalles);
        
      if (errDetalles) {
        console.error("Error al insertar los detalles:", errDetalles);
        throw new Error(errDetalles.message);
      }

      // 4. RECALCULAR EL TOTAL DE LA MESA (Si ya existía y le agregaron más cosas)
      if (ventaData.id) {
        const { data: allDetails, error: errCalc } = await supabase
          .from('ventas_detalle')
          .select('subtotal')
          .eq('venta_id', ventaId);
          
        if (errCalc) throw new Error("Error al recalcular totales.");

        const nuevoTotal = allDetails.reduce((sum, item) => sum + item.subtotal, 0);
        
        const { error: errUpdate } = await supabase
          .from('ventas')
          .update({ 
            subtotal: parseFloat(nuevoTotal),
            total: parseFloat(nuevoTotal) 
          })
          .eq('id', ventaId);
          
        if (errUpdate) throw new Error("Error al actualizar el total de la mesa.");
      }

      return { success: true };
    } catch (error) {
      console.error("Error en procesarVenta (MeseroService):", error);
      return { success: false, error: error.message || "Error desconocido al procesar la venta." };
    }
  }
};