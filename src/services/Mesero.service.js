// Archivo: src/services/Mesero.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; 

export const MeseroService = {
  
  /**
   * 🛡️ Verifica si existe una sesión de caja abierta para la sucursal.
   * Al no haber triggers, este método es el encargado de obtener el UUID 
   * necesario para vincular la venta con el turno del cajero.
   */
  verificarCajaAbierta: async (sucursalId) => {
    try {
      const { data, error } = await supabase
        .from('cajas_sesiones')
        .select('id')
        .eq('sucursal_id', Number(sucursalId))
        .eq('estado', 'abierto') 
        .is('fecha_cierre', null)
        .maybeSingle();
      
      if (error) {
          console.error("Error al verificar caja:", error);
          return { abierta: false, error };
      }
      return { abierta: !!data, sesionId: data?.id, error: null };
    } catch (err) {
      return { abierta: false, error: err.message };
    }
  },

  /**
   * Obtiene las mesas activas filtradas por sucursal.
   */
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
      .in('estado', ['pendiente', 'cocina', 'entregado', 'por_cobrar', 'abierta'])
      .order('created_at', { ascending: false });

    if (sucursalId) {
      query = query.eq('sucursal_id', Number(sucursalId));
    }

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Obtiene el historial de ventas pagadas de la sucursal.
   */
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
      query = query.eq('sucursal_id', Number(sucursalId));
    }

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Cambia el estado de una mesa a 'por_cobrar' para notificar a caja.
   */
  marcarPorCobrar: async (ventaId) => {
    if (!hasPermission('editar_comandas')) {
      return { success: false, error: 'No tienes facultades para solicitar la cuenta.' };
    }

    const { error } = await supabase
      .from('ventas')
      .update({ 
        estado: 'por_cobrar',
        hora_por_cobrar: new Date().toISOString()
      })
      .eq('id', ventaId);
      
    return { success: !error, error: error?.message };
  },

  /**
   * 🚀 PROCESAR VENTA (MÉTODO MAESTRO)
   * Ahora que los triggers no existen, el service valida manualmente la caja
   * antes de realizar el insert para asegurar la integridad de los datos.
   */
  procesarVenta: async (ventaData, carrito) => {
    if (!hasPermission('crear_comandas')) {
      return { success: false, error: 'Acceso denegado: No puedes registrar nuevas órdenes.' };
    }

    try {
      let ventaId = ventaData.id;

      // 1. 🛡️ VERIFICACIÓN MANUAL DE CAJA (Sustituye la seguridad del Trigger)
      const { abierta, sesionId, error: errSesion } = await MeseroService.verificarCajaAbierta(ventaData.sucursal_id);

      if (errSesion || !abierta) {
        throw new Error(`Operación cancelada: No se encontró una sesión de caja abierta para la sucursal ${ventaData.sucursal_id}. El cajero debe iniciar turno.`);
      }

      // 2. SI ES UNA MESA NUEVA (Crear registro en 'ventas')
      if (!ventaId) {
        const totalInicial = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0);
        
        const nuevaVentaPayload = {
          usuario_id: Number(ventaData.usuario_id), 
          mesa: ventaData.mesa ? String(ventaData.mesa) : 'S/N',
          estado: 'pendiente', 
          subtotal: parseFloat(totalInicial), 
          total: parseFloat(totalInicial),
          sucursal_id: Number(ventaData.sucursal_id),
          id_sesion_caja: sesionId // Vinculamos manualmente el ID de sesión encontrado
        };

        const { data: nuevaVenta, error: errVenta } = await supabase
          .from('ventas')
          .insert([nuevaVentaPayload])
          .select()
          .single();
          
        if (errVenta) {
          console.error("Error al crear la venta padre:", errVenta);
          throw new Error(`Error de base de datos: ${errVenta.message}`); 
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
        notas: item.notes || item.notas || ''
      }));

      // 4. INSERTAR DETALLES EN 'ventas_detalle'
      const { error: errDetalles } = await supabase
        .from('ventas_detalle')
        .insert(detalles);
        
      if (errDetalles) {
        console.error("Error al insertar los detalles:", errDetalles);
        throw new Error(`Error al registrar productos: ${errDetalles.message}`);
      }

      // 5. RECALCULAR TOTALES (Sincronización final)
      const { data: allDetails, error: errCalc } = await supabase
        .from('ventas_detalle')
        .select('subtotal')
        .eq('venta_id', ventaId);
          
      if (errCalc) throw new Error("Error al recalcular totales.");

      const nuevoTotal = (allDetails || []).reduce((sum, item) => sum + item.subtotal, 0);
        
      // Actualizamos el registro padre con los totales finales y re-aseguramos el id_sesion_caja
      const { error: errUpdate } = await supabase
        .from('ventas')
        .update({ 
          subtotal: parseFloat(nuevoTotal),
          total: parseFloat(nuevoTotal),
          id_sesion_caja: sesionId 
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