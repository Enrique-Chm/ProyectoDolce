import { supabase } from '../lib/supabaseClient';

export const VentasService = {
  /**
   * Obtiene todas las ventas con estado 'pendiente'.
   * Estas son las órdenes que los meseros han enviado pero no se han cobrado.
   */
  getVentasPendientes: async () => {
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  /**
   * Finaliza una venta (proceso de cobro).
   * @param {string|number} idVenta - El ID de la venta a actualizar.
   * @param {object} datos - Objeto con estado, metodo_pago, cajero_id y turno_id.
   */
  finalizarVenta: async (idVenta, datos) => {
    const { data, error } = await supabase
      .from('ventas')
      .update({
        estado: datos.estado || 'pagado',
        metodo_pago: datos.metodo_pago,
        cajero_id: datos.cajero_id,
        turno_id: datos.turno_id, // Columna nueva del SQL
        hora_cierre: new Date().toISOString()
      })
      .eq('id', idVenta)
      .select();

    return { data, error };
  },

  /**
   * Obtiene el detalle de productos de una venta específica.
   * Útil si el cajero quiere ver qué se está cobrando antes de finalizar.
   */
  getDetalleVenta: async (idVenta) => {
    const { data, error } = await supabase
      .from('detalles_ventas')
      .select('*')
      .eq('id_venta', idVenta);
    
    return { data, error };
  }
};