import { supabase } from '../lib/supabaseClient';

export const CajaService = {
  
  /* ==========================================
     1. CATÁLOGOS (cat_motivos_inventario)
     ========================================== */

  /**
   * Obtiene los motivos configurados en el catálogo de inventario
   * para alimentar el select de movimientos de caja.
   */
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

  /**
   * Busca si el usuario tiene una sesión abierta actualmente.
   */
  getSesionActiva: async (usuarioId) => {
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .select('*')
      .is('fecha_cierre', null)
      .eq('usuario_id', parseInt(usuarioId)) // Asegura int4 para la comparación
      .maybeSingle();
    return { data, error };
  },

  /**
   * Registra la apertura de una nueva caja.
   */
  abrirCaja: async (datos) => {
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .insert([{ 
        usuario_id: parseInt(datos.usuario_id),
        monto_apertura: parseFloat(datos.monto_apertura),
        estado: 'abierta',
        fecha_apertura: new Date().toISOString() 
      }])
      .select()
      .single();
    return { data, error };
  },

  /**
   * Finaliza la sesión de caja con los datos del arqueo.
   * Actualizado según las columnas reales de la DB: monto_cierre_real, monto_cierre_esperado
   */
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

  /**
   * Registra un ingreso o egreso vinculado a un turno.
   */
  registrarMovimiento: async (movimiento) => {
    const { data, error } = await supabase
      .from('caja_movimientos')
      .insert([{
        turno_id: movimiento.turno_id,
        usuario_id: parseInt(movimiento.usuario_id),
        tipo: movimiento.tipo, // 'ingreso' o 'egreso' validado por el catálogo
        monto: parseFloat(movimiento.monto),
        motivo: movimiento.motivo 
      }])
      .select();
    return { data, error };
  },

  /**
   * Lista todos los movimientos de la sesión actual.
   */
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

  /**
   * Suma todas las ventas pagadas en efectivo para el cálculo del balance.
   */
  getTotalesEfectivoSesion: async (turnoId) => {
    const { data, error } = await supabase
      .from('ventas')
      .select('total')
      .eq('turno_id', turnoId)
      .eq('metodo_pago', 'efectivo')
      .eq('estado', 'pagado');
    
    const totalVentas = data?.reduce((acc, curr) => acc + curr.total, 0) || 0;
    return { totalVentas, error };
  },

  /**
   * Obtiene las últimas sesiones para la pestaña de Historial.
   */
  getHistorialSesiones: async (limit = 20) => {
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .select('*')
      .not('fecha_cierre', 'is', null)
      .order('fecha_apertura', { ascending: false })
      .limit(limit);
    return { data, error };
  }
};