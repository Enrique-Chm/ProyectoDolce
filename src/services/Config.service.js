import { supabase } from '../lib/supabaseClient';

export const configService = {
  // --- UNIDADES DE MEDIDA ---
  async getUnidades() {
    return await supabase
      .from('cat_unidades_medida')
      .select('*')
      .order('nombre');
  },

  async saveUnidad(payload, id = null) {
    if (id) {
      return await supabase
        .from('cat_unidades_medida')
        .update(payload)
        .eq('id', id);
    }
    return await supabase
      .from('cat_unidades_medida')
      .insert([payload]);
  },

  async deleteUnidad(id) {
    return await supabase
      .from('cat_unidades_medida')
      .delete()
      .eq('id', id);
  },

  // --- CATEGORÍAS DE MENÚ (PLATILLOS) ---
  async getMenu() {
    return await supabase
      .from('cat_categorias_menu')
      .select('*')
      .order('nombre');
  },

  async saveMenu(payload, id = null) {
    if (id) {
      return await supabase
        .from('cat_categorias_menu')
        .update(payload)
        .eq('id', id);
    }
    return await supabase
      .from('cat_categorias_menu')
      .insert([payload]);
  },

  async deleteMenu(id) {
    return await supabase
      .from('cat_categorias_menu')
      .delete()
      .eq('id', id);
  },

  // --- CATEGORÍAS DE INSUMOS (ALMACÉN) ---
  async getInsumos() {
    return await supabase
      .from('cat_categoria_insumos')
      .select('*')
      .order('nombre');
  },

  async saveInsumo(payload, id = null) {
    if (id) {
      return await supabase
        .from('cat_categoria_insumos')
        .update(payload)
        .eq('id', id);
    }
    return await supabase
      .from('cat_categoria_insumos')
      .insert([payload]);
  },

  async deleteInsumo(id) {
    return await supabase
      .from('cat_categoria_insumos')
      .delete()
      .eq('id', id);
  }
};