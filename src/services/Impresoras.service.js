// Archivo: src/services/impresoras.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Importación de seguridad

export const impresorasService = {
  /**
   * Obtiene todas las impresoras configuradas para una sucursal específica
   */
  async getAll(sucursalId) {
    try {
      // 🛡️ Blindaje: Verificación de lectura de configuración
      if (!hasPermission('ver_configuracion')) {
        return { data: [], error: { message: 'No tienes permisos para ver la configuración de hardware.' } };
      }

      const { data, error } = await supabase
        .from('cat_impresoras') // Asegúrate de que el nombre coincida con tu tabla SQL
        .select('*')
        .eq('sucursal_id', sucursalId)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error en impresorasService.getAll:", error.message);
      return { data: [], error };
    }
  },

  /**
   * Guarda o actualiza la configuración de una impresora
   * @param {Object} datos - Objeto con nombre, origen, formato, sucursal_id, etc.
   */
  async save(datos) {
    try {
      // 🛡️ Blindaje: Verificación de edición de configuración
      if (!hasPermission('editar_configuracion')) {
        return { data: null, error: { message: 'Acceso denegado: No puedes alterar la configuración de impresión.' } };
      }

      // Usamos upsert para que si el registro tiene ID lo actualice, 
      // y si no lo tiene, lo cree.
      const { data, error } = await supabase
        .from('cat_impresoras')
        .upsert([datos])
        .select();

      if (error) throw error;
      return { data: data[0], error: null };
    } catch (error) {
      console.error("Error en impresorasService.save:", error.message);
      return { data: null, error };
    }
  },

  /**
   * Elimina una configuración de impresora por su ID
   */
  async delete(id) {
    try {
      // 🛡️ Blindaje: Verificación de borrado (Nivel Administrativo)
      if (!hasPermission('borrar_registros')) {
        return { error: { message: 'Acceso denegado: Se requiere permiso de administrador para eliminar hardware.' } };
      }

      const { error } = await supabase
        .from('cat_impresoras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error en impresorasService.delete:", error.message);
      return { error };
    }
  }
};