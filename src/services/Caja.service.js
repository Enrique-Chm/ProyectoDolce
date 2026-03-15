import { supabase } from '../lib/supabaseClient';

export const CajaService = {
  
  /* ==========================================
     1. CATÁLOGOS (cat_motivos_inventario)
     ========================================== */

  getMotivosInventario: async () => {
    const { data, error } = await supabase
      .from('cat_motivos_inventario')
      .select('id, nombre_motivo, tipo, descripcion')
      .eq('activo', true);
    return { data, error };
  },

  /* ==========================================
     2. GESTIÓN DE SESIONES (cajas_sesiones)
     ========================================== */

  getSesionActiva: async (usuarioId) => {
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .select('*')
      .is('fecha_cierre', null)
      .eq('usuario_id', parseInt(usuarioId)) 
      .maybeSingle();
    return { data, error };
  },

  abrirCaja: async (datos) => {
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .insert([{ 
        usuario_id: parseInt(datos.usuario_id),
        monto_apertura: parseFloat(datos.monto_apertura),
        estado: 'abierto',
        fecha_apertura: new Date().toISOString() 
      }])
      .select()
      .single();
    return { data, error };
  },

  cerrarCaja: async (sesionId, datosCierre) => {
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .update({ 
        monto_cierre_real: parseFloat(datosCierre.monto_cierre_real),
        monto_cierre_esperado: parseFloat(datosCierre.monto_cierre_esperado),
        diferencia: parseFloat(datosCierre.diferencia),
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
    const { data, error } = await supabase
      .from('caja_movimientos')
      .insert([{
        turno_id: movimiento.turno_id,
        usuario_id: parseInt(movimiento.usuario_id),
        tipo: movimiento.tipo, 
        monto: parseFloat(movimiento.monto),
        motivo: movimiento.motivo 
      }])
      .select();
    return { data, error };
  },

  getMovimientosSesion: async (turnoId) => {
    const { data, error } = await supabase
      .from('caja_movimientos')
      .select('*')
      .eq('turno_id', turnoId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  /* ==========================================
     4. CÁLCULOS DE ARQUEO Y VENTAS
     ========================================== */

  getTotalesEfectivoSesion: async (turnoId) => {
    const { data, error } = await supabase
      .from('ventas')
      .select('total')
      // .eq('turno_id', turnoId) <--- ATENCIÓN: Lo comenté porque borraste la columna en tu BD
      .eq('metodo_pago', 'efectivo')
      .eq('estado', 'pagado');
    
    const totalVentas = data?.reduce((acc, curr) => acc + curr.total, 0) || 0;
    return { totalVentas, error };
  },

  getHistorialSesiones: async (limit = 20) => {
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .select('*')
      .not('fecha_cierre', 'is', null)
      .order('fecha_apertura', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  /* ==========================================
     5. COBROS Y GESTIÓN DE CUENTAS 
     ========================================== */

  getVentasPendientes: async () => {
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .in('estado', ['pendiente', 'por_cobrar'])
      .order('created_at', { ascending: false });
    return { data, error };
  },

  finalizarVenta: async (idVenta, datos) => {
    const { data, error } = await supabase
      .from('ventas')
      .update({
        estado: datos.estado || 'pagado',
        metodo_pago: datos.metodo_pago,
        // SE ELIMINÓ cajero_id y turno_id PORQUE LOS BORRASTE DE TU BASE DE DATOS
        hora_cierre: new Date().toISOString()
      })
      .eq('id', idVenta)
      .select();
    return { data, error };
  },

  getDetalleVenta: async (idVenta) => {
    const { data, error } = await supabase
      .from('ventas_detalle')
      .select('*')
      .eq('venta_id', idVenta);
    return { data, error };
  }
};