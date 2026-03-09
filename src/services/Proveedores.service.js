import { supabase } from '../lib/supabaseClient';

/**
 * SERVICIO DE PROVEEDORES
 * Centraliza la lógica de persistencia para el directorio de contactos.
 */
export const proveedoresService = {
  
  /**
   * Obtiene la lista completa de proveedores ordenada alfabéticamente.
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .order('nombre_empresa', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error en proveedoresService.getAll:", error);
      throw error;
    }
  },

  /**
   * Crea o actualiza un registro de proveedor.
   */
  async save(payload, id = null) {
    try {
      if (id) {
        // Actualización
        return await supabase
          .from('proveedores')
          .update(payload)
          .eq('id', id);
      } else {
        // Inserción
        return await supabase
          .from('proveedores')
          .insert([payload]);
      }
    } catch (error) {
      console.error("Error en proveedoresService.save:", error);
      throw error;
    }
  },

  /**
   * Elimina un proveedor por su ID.
   */
  async delete(id) {
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error en proveedoresService.delete:", error);
      return { data: null, error };
    }
  }
};