// Archivo: src/services/sucursales.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Nuestra última línea de defensa

export const sucursalesService = {
  
  // Obtener todas las sucursales
  getAll: async () => {
    // Validamos si tiene permiso de ver antes de gastar recursos de red
    if (!hasPermission('ver_sucursales')) {
      return { data: [], error: { message: 'Acceso denegado: No tienes permiso para consultar el catálogo de sucursales.' } };
    }

    return await supabase
      .from('cat_sucursales')
      .select('*')
      .order('id', { ascending: true });
  },
  
  // Guardar o Actualizar
  save: async (payload, id = null) => {
    if (id) {
      // 🛡️ Blindaje de edición (Update)
      if (!hasPermission('editar_sucursales')) {
        return { data: null, error: { message: 'Acceso denegado: No tienes facultades para modificar sucursales.' } };
      }
      return await supabase.from('cat_sucursales').update(payload).eq('id', id);
    } else {
      // 🛡️ Blindaje de creación (Insert)
      if (!hasPermission('crear_sucursales')) {
        return { data: null, error: { message: 'Acceso denegado: No tienes facultades para crear nuevas sucursales.' } };
      }
      return await supabase.from('cat_sucursales').insert([payload]);
    }
  },

  // Eliminar (solo si no tiene usuarios vinculados)
  delete: async (id) => {
    // 🛡️ Blindaje de borrado
    if (!hasPermission('borrar_sucursales')) {
      return { data: null, error: { message: 'Acceso denegado: Se requiere permiso específico para borrar sucursales.' } };
    }

    return await supabase.from('cat_sucursales').delete().eq('id', id);
  }
};