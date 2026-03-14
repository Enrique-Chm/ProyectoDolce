import { supabase } from '../lib/supabaseClient';

export const cajaService = {
  /**
   * Verifica si existe una sesión abierta para la sucursal.
   */
  async getSesionActiva(sucursalId) {
    const { data, error } = await supabase
      .from('caja_sesiones')
      .select('*')
      .eq('sucursal_id', sucursalId)
      .eq('estado', 'abierta')
      .maybeSingle();
    return { data, error };
  },

  /**
   * Crea un nuevo registro en caja_sesiones.
   */
  async abrirCaja(sucursalId, montoApertura, usuarioId) {
    const { data, error } = await supabase
      .from('caja_sesiones')
      .insert([{
        sucursal_id: sucursalId,
        monto_apertura: parseFloat(montoApertura),
        usuario_id: usuarioId, // UUID del cajero
        estado: 'abierta',
        fecha_apertura: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  /**
   * Registra entradas o salidas manuales en la tabla caja_movimientos.
   */
  async registrarMovimiento(idSesion, tipo, monto, descripcion) {
    const { data, error } = await supabase
      .from('caja_movimientos')
      .insert([{
        id_sesion: idSesion,
        tipo, // 'ingreso' o 'egreso'
        monto: parseFloat(monto),
        descripcion,
        fecha: new Date().toISOString()
      }])
      .select();
    return { data, error };
  },

  /**
   * Recupera los movimientos manuales del turno actual.
   */
  async getMovimientos(idSesion) {
    const { data, error } = await supabase
      .from('caja_movimientos')
      .select('*')
      .eq('id_sesion', idSesion)
      .order('fecha', { ascending: false });
    return { data, error };
  },

  /**
   * LÓGICA DE ARQUEO: Suma ventas y movimientos vinculados al id_sesion_caja.
   */
  async obtenerEstadoArqueo(idSesion) {
    try {
      // 1. Obtener monto inicial
      const { data: sesion } = await supabase
        .from('caja_sesiones')
        .select('monto_apertura')
        .eq('id', idSesion)
        .single();

      // 2. Obtener todas las ventas pagadas de esta sesión específica
      const { data: ventas } = await supabase
        .from('ventas')
        .select('total, metodo_pago, propina')
        .eq('id_sesion_caja', idSesion)
        .eq('estado', 'pagado');

      // 3. Obtener movimientos manuales (gastos/refuerzos)
      const { data: movimientos } = await supabase
        .from('caja_movimientos')
        .select('tipo, monto')
        .eq('id_sesion', idSesion);

      const apertura = parseFloat(sesion?.monto_apertura || 0);

      // Procesar totales de ventas por método de pago
      const totalesVentas = ventas?.reduce((acc, v) => {
        const totalVenta = parseFloat(v.total) || 0;
        const propina = parseFloat(v.propina) || 0;
        const neto = totalVenta - propina;

        if (v.metodo_pago === 'efectivo') acc.efectivo += neto;
        if (v.metodo_pago === 'tarjeta') acc.tarjeta += neto;
        return acc;
      }, { efectivo: 0, tarjeta: 0 }) || { efectivo: 0, tarjeta: 0 };

      // Procesar totales de movimientos manuales
      const movs = movimientos?.reduce((acc, m) => {
        if (m.tipo === 'ingreso') acc.ingresos += parseFloat(m.monto);
        if (m.tipo === 'egreso') acc.egresos += parseFloat(m.monto);
        return acc;
      }, { ingresos: 0, egresos: 0 }) || { ingresos: 0, egresos: 0 };

      // Cálculo final de lo que debe haber físicamente en efectivo
      const montoEsperado = apertura + totalesVentas.efectivo + movs.ingresos - movs.egresos;

      return {
        data: {
          apertura,
          ventasEfectivo: totalesVentas.efectivo,
          ventasTarjeta: totalesVentas.tarjeta,
          entradasManuales: movs.ingresos,
          salidasManuales: movs.egresos,
          montoEsperado
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  /**
   * CIERRE DEFINITIVO: Actualiza caja_sesiones con los totales finales y la diferencia.
   */
  async cerrarCaja(idSesion, montoCierre, notas = '') {
    try {
      const { data: arqueo } = await this.obtenerEstadoArqueo(idSesion);
      const diferencia = parseFloat(montoCierre) - arqueo.montoEsperado;

      const { data, error } = await supabase
        .from('caja_sesiones')
        .update({
          monto_cierre: parseFloat(montoCierre),
          diferencia: diferencia,
          notas: notas,
          estado: 'cerrada',
          fecha_cierre: new Date().toISOString(),
          // Columnas de resumen de tu tabla caja_sesiones
          total_ventas_efectivo: arqueo.ventasEfectivo,
          total_ventas_tarjeta: arqueo.ventasTarjeta,
          total_ingresos: arqueo.entradasManuales,
          total_egresos: arqueo.salidasManuales
        })
        .eq('id', idSesion)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error al cerrar caja:", error.message);
      return { success: false, error: error.message };
    }
  }
};