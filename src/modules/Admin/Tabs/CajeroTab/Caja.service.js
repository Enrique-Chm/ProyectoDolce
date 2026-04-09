// Archivo: src/modules/Admin/Tabs/CajeroTab/Caja.service.js
import { supabase } from '../../../../lib/supabaseClient';
import { hasPermission } from '../../../../utils/checkPermiso'; 

export const CajaService = {

  /* ==========================================
     1. CATÁLOGOS (cat_motivos_inventario y cat_tipos_descuento)
     ========================================== */

  getMotivosInventario: async () => {
    const { data, error } = await supabase
      .from('cat_motivos_inventario')
      .select('id, nombre_motivo, tipo, descripcion, origen')
      .eq('activo', true)
      .eq('origen', 'Caja');
      
    return { data, error };
  },

  getTiposDescuento: async () => {
    const { data, error } = await supabase
      .from('cat_tipos_descuento')
      .select('id, nombre, tipo_calculo, valor_defecto, requiere_autorizacion')
      .eq('activo', true)
      .order('id', { ascending: true });
      
    return { data, error };
  },

  /* ==========================================
     2. GESTIÓN DE SESIONES (cajas_sesiones)
     ========================================== */

  getSesionActiva: async (sucursalId) => {
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .select('*')
      .is('fecha_cierre', null)
      .eq('sucursal_id', sucursalId) 
      .eq('estado', 'abierto')       
      .maybeSingle();
    return { data, error };
  },

  abrirCaja: async (datos) => {
    if (!hasPermission('editar_ventas')) {
      return { data: null, error: { message: "No tienes permisos para abrir la caja." } };
    }

    const { data, error } = await supabase
      .from('cajas_sesiones')
      .insert([{ 
        usuario_id: datos.usuario_id, 
        sucursal_id: datos.sucursal_id, 
        monto_apertura: parseFloat(datos.monto_apertura),
        estado: 'abierto',             
        fecha_apertura: new Date().toISOString() 
      }])
      .select()
      .single();
    return { data, error };
  },

  cerrarCaja: async (sesionId, datosCierre) => {
    if (!hasPermission('editar_ventas')) {
      return { data: null, error: { message: "No tienes permisos para cerrar la caja." } };
    }

    const { data, error } = await supabase
      .from('cajas_sesiones')
      .update({ 
        monto_cierre_real: parseFloat(datosCierre.monto_cierre_real),
        monto_cierre_esperado: parseFloat(datosCierre.monto_cierre_esperado),
        diferencia: parseFloat(datosCierre.diferencia),
        monto_cierre_tarjeta: parseFloat(datosCierre.monto_cierre_tarjeta || 0), 
        estado: 'cerrado', 
        fecha_cierre: new Date().toISOString() 
      })
      .eq('id', sesionId)
      .select();
    return { data, error };
  },

  /* ==========================================
     3. MOVIMIENTOS DE CAJA (caja_movimientos)
     ========================================== */

  registrarMovimiento: async (movimiento) => {
    if (!hasPermission('editar_ventas')) {
      return { data: null, error: { message: "No tienes permisos para registrar movimientos." } };
    }

    const { data, error } = await supabase
      .from('caja_movimientos')
      .insert([{
        turno_id: movimiento.turno_id,
        usuario_id: movimiento.usuario_id,
        tipo: movimiento.tipo, 
        monto: parseFloat(movimiento.monto),
        motivo: movimiento.motivo 
      }])
      .select();
    return { data, error };
  },

  getMovimientosSesion: async (turnoId) => {
    if (!hasPermission('ver_ventas')) return { data: [], error: null };

    const { data, error } = await supabase
      .from('caja_movimientos')
      .select(`
        *,
        usuarios_internos!caja_movimientos_usuario_id_fkey(nombre)
      `)
      .eq('turno_id', turnoId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  /* ==========================================
     4. CÁLCULOS DE ARQUEO Y VENTAS
     ========================================== */

  getTotalesEfectivoSesion: async (fechaApertura, sucursalId) => {
    let query = supabase
      .from('ventas')
      .select('total')
      .gte('hora_cierre', fechaApertura) 
      .eq('metodo_pago', 'efectivo')
      .eq('estado', 'pagado');

    if (sucursalId) {
      query = query.eq('sucursal_id', sucursalId);
    }

    const { data, error } = await query;
    const totalVentas = data?.reduce((acc, curr) => acc + curr.total, 0) || 0;
    return { totalVentas, error };
  },

  getHistorialSesiones: async (sucursalId, limit = 20) => {
    if (!hasPermission('ver_ventas')) return { data: [], error: null };

    let query = supabase
      .from('cajas_sesiones')
      .select(`
        *,
        usuarios_internos!turnos_usuario_id_fkey(nombre)
      `)
      .not('fecha_cierre', 'is', null)
      .order('fecha_apertura', { ascending: false })
      .limit(limit);

    if (sucursalId) {
      query = query.eq('sucursal_id', sucursalId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  /* ==========================================
     5. COBROS Y GESTIÓN DE CUENTAS 
     ========================================== */

  getVentasPendientes: async (sucursalId, sesionId) => {
    if (!hasPermission('ver_ventas')) return { data: [], error: null };

    let query = supabase
      .from('ventas')
      .select('*')
      .eq('id_sesion_caja', sesionId) 
      .in('estado', ['pendiente', 'cocina', 'entregado', 'por_cobrar'])
      .order('created_at', { ascending: false });

    if (sucursalId) {
      query = query.eq('sucursal_id', sucursalId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * 🚀 ACTUALIZADO: Finaliza la venta y ejecuta el DESCUENTO HÍBRIDO DE INVENTARIO.
   * Ahora requiere el sucursalId para procesar correctamente el stock.
   */
  finalizarVenta: async (idVenta, datos, sucursalId) => {
    if (!hasPermission('editar_ventas')) {
      return { data: null, error: { message: "No tienes permisos para cobrar cuentas." } };
    }

    try {
      // 1. Actualizamos los datos de la venta (pago, estado, cierre)
      const updatePayload = {
        estado: datos.estado || 'pagado',
        metodo_pago: datos.metodo_pago,
        hora_cierre: new Date().toISOString()
      };

      if (datos.tipo_descuento_id !== undefined) updatePayload.tipo_descuento_id = datos.tipo_descuento_id;
      if (datos.descuento !== undefined) updatePayload.descuento = parseFloat(datos.descuento);
      if (datos.motivo_descuento !== undefined) updatePayload.motivo_descuento = datos.motivo_descuento;
      if (datos.total !== undefined) updatePayload.total = parseFloat(datos.total);

      const { data: ventaActualizada, error: errorVenta } = await supabase
        .from('ventas')
        .update(updatePayload)
        .eq('id', idVenta)
        .select()
        .single();

      if (errorVenta) throw errorVenta;

      // 2. Recuperamos los productos del ticket para descontar inventario
      const { data: detalles, error: errorDetalle } = await supabase
        .from('ventas_detalle')
        .select('producto_id, cantidad')
        .eq('venta_id', idVenta);

      if (errorDetalle) throw errorDetalle;

      // 3. Ejecutamos el Descuento Híbrido mediante RPC
      if (detalles && detalles.length > 0) {
        const promesasDescuento = detalles.map(item => 
          supabase.rpc('procesar_descuento_hibrido', {
            p_producto_id: item.producto_id,
            p_sucursal_id: sucursalId,
            p_cantidad_vendida: item.cantidad
          })
        );

        // Esperamos a que todos los procesos de inventario terminen
        await Promise.all(promesasDescuento);
      }

      return { data: ventaActualizada, error: null };

    } catch (err) {
      console.error("Error crítico en finalizarVenta con inventario:", err);
      return { data: null, error: err };
    }
  },

  getDetalleVenta: async (idVenta) => {
    if (!hasPermission('ver_ventas')) return { data: [], error: null };

    const { data, error } = await supabase
      .from('ventas_detalle')
      .select('*, productosmenu(nombre)') 
      .eq('venta_id', idVenta);
    return { data, error };
  },

  getVentasCobradas: async (sucursalId, sesionId, limit = 15) => {
    if (!hasPermission('ver_ventas')) return { data: [], error: null };

    let query = supabase
      .from('ventas')
      .select('*')
      .eq('id_sesion_caja', sesionId) 
      .eq('estado', 'pagado')
      .order('hora_cierre', { ascending: false })
      .limit(limit);

    if (sucursalId) {
      query = query.eq('sucursal_id', sucursalId);
    }

    const { data, error } = await query;
    return { data, error };
  }
};