// Archivo: src/services/sucursales.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; 

export const sucursalesService = {
  
  // Obtener todas las sucursales
  getAll: async () => {
    if (!hasPermission('ver_sucursales')) {
      return { data: [], error: { message: 'Acceso denegado: No tienes permiso para ver sucursales.' } };
    }

    // Usamos try/catch para capturar errores de red o base de datos
    try {
      const { data, error } = await supabase
        .from('cat_sucursales')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: [], error };
    }
  },
  
  // Guardar o Actualizar
  save: async (payload, id = null) => {
    try {
      if (id) {
        // 🛡️ Blindaje de edición
        if (!hasPermission('editar_sucursales')) {
          throw new Error('Acceso denegado: No tienes facultades para modificar sucursales.');
        }

        // 💡 IMPORTANTE: .select().single() devuelve el objeto actualizado
        const { data, error } = await supabase
          .from('cat_sucursales')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return { data, error: null };

      } else {
        // 🛡️ Blindaje de creación
        if (!hasPermission('crear_sucursales')) {
          throw new Error('Acceso denegado: No tienes facultades para crear nuevas sucursales.');
        }

        const { data, error } = await supabase
          .from('cat_sucursales')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        return { data, error: null };
      }
    } catch (error) {
      return { data: null, error };
    }
  },

  // Eliminar (la DB impedirá el borrado si hay FK activas)
  delete: async (id) => {
    if (!hasPermission('borrar_sucursales')) {
      return { error: { message: 'Acceso denegado: Permiso de borrado requerido.' } };
    }

    try {
      const { error } = await supabase
        .from('cat_sucursales')
        .delete()
        .eq('id', id);

      if (error) {
        // 💡 Manejo específico para violación de llave foránea (Error 23503 en Postgres)
        if (error.code === '23503') {
          throw new Error('No se puede eliminar la sucursal porque tiene empleados o registros vinculados.');
        }
        throw error;
      }
      return { error: null };
    } catch (error) {
      return { error };
    }
  }
};