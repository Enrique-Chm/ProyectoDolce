import { supabase } from '../lib/supabaseClient';

export const ventasService = {
  
  // Obtener cuentas que el cajero debe ver
  async getCuentasAbiertas(sucursalId) {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        mesero:usuario_id ( nombre )
      `)
      .eq('sucursal_id', sucursalId)
      // Filtramos por los estados que necesitan atención en caja
      .in('estado', ['entregado', 'por_cobrar'])
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // PROCESO DE COBRO (Cierre de cuenta)
  async cerrarCuenta(ventaId, datosPago, cajeroId) {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .update({ 
          estado: 'pagado',
          metodo_pago: datosPago.metodo_pago,
          propina: parseFloat(datosPago.propina) || 0,
          total: parseFloat(datosPago.totalFinal), // El total que incluye propina
          pagado_con: parseFloat(datosPago.pagado_con) || 0,
          cambio: parseFloat(datosPago.cambio) || 0,
          cajero_id: cajeroId, // UUID del cajero (autenticado)
          // Si no tienes columna 'hora_cierre', usamos la sesión para el reporte
        })
        .eq('id', ventaId)
        .select(); 

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error en cerrarCuenta:", error.message);
      return { success: false, error: error.message };
    }
  },

  // REPORTE DE CAJA (Usando id_sesion_caja de tu tabla)
  async getResumenCaja(sucursalId, idSesion) {
    const { data, error } = await supabase
      .from('ventas')
      .select('total, metodo_pago, propina')
      .eq('sucursal_id', sucursalId)
      .eq('id_sesion_caja', idSesion) // Filtro exacto por sesión
      .eq('estado', 'pagado');

    if (error) return { error };

    const resumen = data.reduce((acc, v) => {
      const propina = parseFloat(v.propina) || 0;
      const totalVenta = parseFloat(v.total) || 0;
      const neto = totalVenta - propina;

      if (v.metodo_pago === 'efectivo') acc.efectivo += neto;
      else if (v.metodo_pago === 'tarjeta') acc.tarjeta += neto;
      
      acc.totalPropinas += propina;
      return acc;
    }, { efectivo: 0, tarjeta: 0, totalPropinas: 0 });

    return { data: resumen, error: null };
  }
};