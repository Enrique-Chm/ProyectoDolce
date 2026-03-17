// Archivo: src/services/sucursales.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Nuestra última línea de defensa

export const sucursalesService = {
  
  // Obtener todas las sucursales
  getAll: async () => {
    // Validamos si tiene permiso de ver antes de gastar recursos de red
    if (!hasPermission('ver_sucursales')) {
      return { data: [], error: { message: 'No tienes permiso para consultar el catálogo.' } };
    }

    return await supabase
      .from('cat_sucursales')
      .select('*')
      .order('id', { ascending: true });
  },
  
  // Guardar o Actualizar
  save: async (payload, id = null) => {
    // 🛡️ Bloqueo de seguridad: Si no puede editar, la petición no sale
    if (!hasPermission('editar_sucursales')) {
      return { data: null, error: { message: 'Acceso denegado: No tienes facultades para modificar sucursales.' } };
    }

    if (id) {
      return await supabase.from('cat_sucursales').update(payload).eq('id', id);
    }
    return await supabase.from('cat_sucursales').insert([payload]);
  },

  // Eliminar (solo si no tiene usuarios vinculados)
  delete: async (id) => {
    // 🛡️ Bloqueo de seguridad: El borrado es la acción más crítica
    if (!hasPermission('borrar_registros')) {
      return { data: null, error: { message: 'Acceso denegado: Se requiere permiso de nivel administrador para borrar registros.' } };
    }

    return await supabase.from('cat_sucursales').delete().eq('id', id);
  }
};