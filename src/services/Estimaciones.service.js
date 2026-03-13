import { supabase } from '../lib/supabaseClient';

export const estimacionesService = {
  async getSugerenciasCompra() {
    try {
      const { data, error } = await supabase
        .from('vista_proyeccion_compras') // 👈 Nombre exacto del SQL
        .select('*');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getProveedoresActivos() {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('id, nombre_empresa')
        .eq('status', 'activo');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async actualizarPoliticaCompra(insumoId, diasCobertura, diasSeguridad) {
    try {
      const { error } = await supabase
        .from('lista_insumo')
        .update({ 
          dias_cobertura_objetivo: diasCobertura, 
          dias_stock_seguridad: diasSeguridad 
        })
        .eq('id', insumoId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async registrarCompraRealizada(insumoId, cantidadCajas, costoTotal, usuarioId, sucursalId) {
    try {
      const { data: stockData } = await supabase
        .from('stock_sucursal')
        .select('cantidad_actual')
        .eq('insumo_id', insumoId)
        .eq('sucursal_id', sucursalId)
        .single();

      const stockAntes = stockData ? parseFloat(stockData.cantidad_actual) : 0;
      const stockDespues = stockAntes + parseFloat(cantidadCajas);

      const { error: errorMov } = await supabase
        .from('inventario_movimientos')
        .insert([{
          insumo_id: insumoId,
          sucursal_id: sucursalId,
          usuario_id: usuarioId,
          tipo: 'ENTRADA',
          cantidad_afectada: parseFloat(cantidadCajas),
          stock_antes: stockAntes,
          stock_despues: stockDespues,
          motivo: 'Compra desde Proyecciones',
          created_at: new Date().toISOString()
        }]);

      if (errorMov) throw errorMov;

      const { error: errorUpsert } = await supabase
        .from('stock_sucursal')
        .upsert({ 
          sucursal_id: sucursalId,
          insumo_id: insumoId,
          cantidad_actual: stockDespues,
          updated_at: new Date().toISOString()
        }, { onConflict: 'sucursal_id, insumo_id' });

      if (errorUpsert) throw errorUpsert;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};