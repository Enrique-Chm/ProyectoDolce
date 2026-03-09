import { supabase } from '../lib/supabaseClient';

export const sucursalesService = {
  // Obtener todas las sucursales
  getAll: async () => {
    return await supabase
      .from('cat_sucursales')
      .select('*')
      .order('id', { ascending: true });
  },
  
  // Guardar o Actualizar
  save: async (payload, id = null) => {
    if (id) {
      return await supabase.from('cat_sucursales').update(payload).eq('id', id);
    }
    return await supabase.from('cat_sucursales').insert([payload]);
  },

  // Eliminar (solo si no tiene usuarios vinculados)
  delete: async (id) => {
    return await supabase.from('cat_sucursales').delete().eq('id', id);
  }
};