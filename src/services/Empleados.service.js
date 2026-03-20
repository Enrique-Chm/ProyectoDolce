// Archivo: src/services/empleados.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; 

export const empleadosService = {
  // --- USUARIOS (EQUIPO) ---
  async getUsuarios() {
    if (!hasPermission('ver_usuarios')) return [];

    // 💡 CORRECCIÓN: Cambiamos 'sucursales' por 'cat_sucursales' según el hint del error
    const { data, error } = await supabase
      .from('usuarios_internos')
      .select('*,roles(id,nombre_rol),cat_sucursales(id,nombre)')
      .order('nombre', { ascending: true });
      
    if (error) {
        console.error("Detalle del error Supabase:", error);
        throw error;
    }
    return data || [];
  },

  async saveUsuario(payload, id = null) {
    // 🛡️ LIMPIEZA: Eliminamos objetos de relación para que Supabase no dé error 400 al guardar
    const cleanPayload = { ...payload };
    delete cleanPayload.roles;
    delete cleanPayload.sucursales;
    delete cleanPayload.cat_sucursales; // 👈 Añadimos esta limpieza también

    if (id) {
      if (!hasPermission('editar_usuarios')) {
        throw new Error("Acceso denegado: No tienes permisos para editar.");
      }
      const { data, error } = await supabase
        .from('usuarios_internos')
        .update(cleanPayload)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    } else {
      if (!hasPermission('crear_usuarios')) {
        throw new Error("Acceso denegado: No tienes permisos para crear.");
      }
      const { data, error } = await supabase
        .from('usuarios_internos')
        .insert([cleanPayload])
        .select();
      if (error) throw error;
      return data;
    }
  },

  async deleteUsuario(id) {
    if (!hasPermission('borrar_usuarios')) {
      throw new Error("Acceso denegado.");
    }
    return await supabase.from('usuarios_internos').delete().eq('id', id);
  },

  // --- ROLES ---
  async getRoles() {
    if (!hasPermission('ver_configuracion')) return [];
    const { data, error } = await supabase.from('roles').select('*').order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async saveRol(payload, id = null) {
    if (id) {
      if (!hasPermission('editar_configuracion')) throw new Error("Acceso denegado.");
      return await supabase.from('roles').update(payload).eq('id', id).select();
    } else {
      if (!hasPermission('crear_configuracion')) throw new Error("Acceso denegado.");
      return await supabase.from('roles').insert([payload]).select();
    }
  },

  async deleteRol(id) {
    if (!hasPermission('borrar_configuracion')) throw new Error("Acceso denegado.");
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- PERMISOS Y MATRIZ ---
  async getPermisos() {
    if (!hasPermission('ver_configuracion')) return [];
    const { data, error } = await supabase.from('permisos').select('*').order('clave_permiso', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getIdsPermisosPorRol(rolId) {
    if (!hasPermission('ver_configuracion')) return [];
    const { data, error } = await supabase.from('rol_permisos').select('permiso_id').eq('rol_id', rolId);
    if (error) throw error;
    return data.map(item => item.permiso_id);
  },

  async actualizarPermisosRol(rolId, listaPermisosIds) {
    if (!hasPermission('editar_configuracion')) throw new Error("Acceso denegado.");
    
    await supabase.from('rol_permisos').delete().eq('rol_id', rolId);
    
    if (listaPermisosIds.length > 0) {
      const payload = listaPermisosIds.map(pId => ({ rol_id: rolId, permiso_id: pId }));
      const { error } = await supabase.from('rol_permisos').insert(payload);
      if (error) throw error;
    }
    return { success: true };
  }
};