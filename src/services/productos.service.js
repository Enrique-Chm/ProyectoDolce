import { supabase } from '../lib/supabaseClient';

export const productosService = {
  async getInitialData() {
    try {
      const [prod, cat, rec, lista] = await Promise.all([
        // Ajustado a tu tabla real 'productosmenu' a través de la vista
        supabase.from('vista_productos_costos').select('*').order('nombre'),
        supabase.from('cat_categorias_menu').select('*').order('nombre'),
        supabase.from('vista_recetas_completas').select('*'),
        supabase.from('recetas').select('nombre, subreceta')
      ]);

      if (prod.error) throw prod.error;

      const costosMap = (rec.data || []).map(r => ({
        nombre: r.nombre,
        costo_final: r.costo_total_receta || 0
      }));

      return {
        productos: prod.data || [],
        categorias: cat.data || [],
        costosMap,
        listaRecetas: lista.data || []
      };
    } catch (error) {
      console.error("Error en productosService:", error);
      throw error;
    }
  },

  async saveProducto(payload, id = null) {
    // Usamos el nombre exacto de tu tabla: productosmenu
    if (id) {
      return await supabase.from('productosmenu').update(payload).eq('id', id);
    }
    return await supabase.from('productosmenu').insert([payload]);
  },

  async deleteProducto(id) {
    return await supabase.from('productosmenu').delete().eq('id', id);
  }
};