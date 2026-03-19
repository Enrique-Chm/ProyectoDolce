// Archivo: src/services/proveedores.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Importación de seguridad

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
      // 🛡️ Blindaje: Validación de lectura
      if (!hasPermission('ver_proveedores')) {
        return [];
      }

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
        // 🛡️ Blindaje: Validación de edición
        if (!hasPermission('editar_proveedores')) {
          return { data: null, error: { message: "Acceso denegado: No tienes facultades para editar proveedores." } };
        }
        // Actualización
        return await supabase
          .from('proveedores')
          .update(payload)
          .eq('id', id);
      } else {
        // 🛡️ Blindaje: Validación de creación
        if (!hasPermission('crear_proveedores')) {
          return { data: null, error: { message: "Acceso denegado: No tienes facultades para crear proveedores." } };
        }
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
      // 🛡️ Blindaje: Validación de borrado crítico
      if (!hasPermission('borrar_proveedores')) {
        return { data: null, error: { message: "Acceso denegado: Se requiere permiso para eliminar proveedores." } };
      }

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