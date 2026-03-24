// Archivo: src/services/Mesero.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; 

export const MeseroService = {
  
  /**
   * 🛡️ Verifica si existe una sesión de caja abierta para la sucursal.
   * Es vital para cumplir con la restricción de la base de datos y obtener el ID de sesión.
   */
  verificarCajaAbierta: async (sucursalId) => {
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .select('id')
      .eq('sucursal_id', sucursalId)
      .eq('estado', 'abierto') // Aseguramos coincidencia con el término de CajaService
      .is('fecha_cierre', null)
      .maybeSingle();
    
    if (error) {
        console.error("Error al verificar caja:", error);
        return { abierta: false, error };
    }
    return { abierta: !!data, sesionId: data?.id, error: null };
  },

  getCuentasAbiertas: async (sucursalId) => {
    if (!hasPermission('ver_comandas')) {
      return { data: [], error: { message: 'No tienes permisos para ver cuentas abiertas.' } };
    }

    let query = supabase
      .from('ventas')
      .select(`
        *,
        ventas_detalle!venta_id (*)
      `)
      .in('estado', ['pendiente', 'por_cobrar', 'abierta'])
      .order('created_at', { ascending: false });

    if (sucursalId) {
      query = query.eq('sucursal_id', sucursalId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  getHistorialCobradas: async (sucursalId) => {
    if (!hasPermission('ver_comandas')) {
      return { data: [], error: { message: 'No tienes permisos para ver el historial.' } };
    }

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
    if (!hasPermission('editar_comandas')) {
      return { success: false, error: 'No tienes facultades para solicitar la cuenta.' };
    }

    const { error } = await supabase
      .from('ventas')
      .update({ estado: 'por_cobrar' })
      .eq('id', ventaId);
      
    return { success: !error, error: error?.message };
  },

  /**
   * 🚀 PROCESAR VENTA (MÉTODO MAESTRO)
   * Maneja la creación de la venta padre, inserción de detalles y actualización de totales.
   */
  procesarVenta: async (ventaData, carrito) => {
    if (!hasPermission('crear_comandas')) {
      return { success: false, error: 'Acceso denegado: No puedes registrar nuevas órdenes.' };
    }

    try {
      let ventaId = ventaData.id;

      // 1. 🛡️ SIEMPRE VERIFICAR CAJA ANTES DE PROCESAR
      // Obtenemos el sesionId dinámicamente para asegurar que la venta se vincule al turno actual.
      const { abierta, sesionId, error: errSesion } = await MeseroService.verificarCajaAbierta(ventaData.sucursal_id);

      if (errSesion || !abierta) {
        throw new Error("No se puede procesar la orden: No hay una sesión de caja abierta en esta sucursal. Avisa al cajero.");
      }

      // 2. SI ES UNA MESA NUEVA (Insertar Venta Padre)
      if (!ventaId) {
        const totalInicial = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0);
        
        const nuevaVentaPayload = {
          usuario_id: ventaData.usuario_id || null, 
          mesa: ventaData.mesa ? String(ventaData.mesa) : 'S/N',
          estado: 'pendiente',
          subtotal: parseFloat(totalInicial), 
          total: parseFloat(totalInicial),
          sucursal_id: ventaData.sucursal_id,
          id_sesion_caja: sesionId // 👈 VINCULACIÓN CRÍTICA: Previene el error P0001
        };

        // Debug para verificar en consola antes de enviar
        console.log("Insertando Venta Padre:", nuevaVentaPayload);

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

      // 3. PREPARAR DETALLES DE PRODUCTOS
      const detalles = carrito.map(item => ({
        venta_id: ventaId, 
        producto_id: parseInt(item.id),
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precio_venta),
        costo_unitario_historico: parseFloat(item.costo_actual || 0), 
        subtotal: parseFloat(item.cantidad * item.precio_venta),
        notes: item.notes || item.notas || ''
      }));

      // 4. INSERTAR DETALLES
      const { error: errDetalles } = await supabase
        .from('ventas_detalle')
        .insert(detalles);
        
      if (errDetalles) {
        console.error("Error al insertar los detalles:", errDetalles);
        throw new Error(errDetalles.message);
      }

      // 5. RECALCULAR TOTALES Y ASEGURAR SESIÓN (Sync final)
      const { data: allDetails, error: errCalc } = await supabase
        .from('ventas_detalle')
        .select('subtotal')
        .eq('venta_id', ventaId);
          
      if (errCalc) throw new Error("Error al recalcular totales.");

      const nuevoTotal = allDetails.reduce((sum, item) => sum + item.subtotal, 0);
        
      // Actualizamos la venta padre con el nuevo total y nos aseguramos de enviar el id_sesion_caja
      // por si el Trigger de actualización también lo requiere.
      const { error: errUpdate } = await supabase
        .from('ventas')
        .update({ 
          subtotal: parseFloat(nuevoTotal),
          total: parseFloat(nuevoTotal),
          id_sesion_caja: sesionId // Re-aseguramos la sesión activa en el update
        })
        .eq('id', ventaId);
          
      if (errUpdate) throw new Error("Error al actualizar el total de la mesa.");

      return { success: true, ventaId };
    } catch (error) {
      console.error("Error en procesarVenta (MeseroService):", error);
      return { success: false, error: error.message || "Error desconocido al procesar la venta." };
    }
  }
};