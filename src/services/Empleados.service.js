// Archivo: src/services/empleados.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; 

export const empleadosService = {
  // --- USUARIOS (EQUIPO) ---
  async getUsuarios() {
    // 🛡️ Blindaje de lectura
    if (!hasPermission('ver_usuarios')) return [];

    /**
     * 🔴 FIX PGRST201 DEFINITIVO:
     * Forzamos el puente exacto usando los nombres de constraint reales de tu DB
     * (!fk_usuarios_roles y !fk_usuarios_sucursal).
     * Esto elimina la ambigüedad y evita que el caché de Supabase rompa la petición.
     */
    const { data, error } = await supabase
      .from('usuarios_internos')
      .select(`
        *,
        roles!fk_usuarios_roles (id, nombre_rol),
        cat_sucursales!fk_usuarios_sucursal (id, nombre)
      `)
      .order('nombre', { ascending: true });
      
    if (error) {
      console.error("Detalle del error Supabase:", error);
      throw error;
    }
    return data || [];
  },

  async saveUsuario(payload, id = null) {
    /**
     * 🛡️ LIMPIEZA DE PAYLOAD: 
     * Eliminamos los objetos de relación (roles, cat_sucursales) antes de enviar.
     * Supabase daría error 400 si intentamos guardar un objeto en una columna de ID.
     */
    const cleanPayload = { ...payload };
    delete cleanPayload.roles;
    delete cleanPayload.sucursales;
    delete cleanPayload.cat_sucursales; 

    if (id) {
      // 🛡️ Blindaje de edición
      if (!hasPermission('editar_usuarios')) {
        throw new Error("Acceso denegado: No tienes permisos para editar usuarios.");
      }
      const { data, error } = await supabase
        .from('usuarios_internos')
        .update(cleanPayload)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    } else {
      // 🛡️ Blindaje de creación
      if (!hasPermission('crear_usuarios')) {
        throw new Error("Acceso denegado: No tienes permisos para crear usuarios.");
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
    // 🛡️ Blindaje de borrado
    if (!hasPermission('borrar_usuarios')) {
      throw new Error("Acceso denegado: No tienes facultades para eliminar personal.");
    }
    const { error } = await supabase
      .from('usuarios_internos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // --- ROLES (CATÁLOGO) ---
  async getRoles() {
    if (!hasPermission('ver_configuracion')) return [];
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('id', { ascending: true });
    
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
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // --- PERMISOS Y MATRIZ DE ACCESO ---
  async getPermisos() {
    if (!hasPermission('ver_configuracion')) return [];
    const { data, error } = await supabase
      .from('permisos')
      .select('*')
      .order('clave_permiso', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getIdsPermisosPorRol(rolId) {
    if (!hasPermission('ver_configuracion')) return [];
    const { data, error } = await supabase
      .from('rol_permisos')
      .select('permiso_id')
      .eq('rol_id', rolId);
    
    if (error) throw error;
    return data.map(item => item.permiso_id);
  },

  async actualizarPermisosRol(rolId, listaPermisosIds) {
    if (!hasPermission('editar_configuracion')) {
      throw new Error("Acceso denegado: No puedes modificar la matriz de seguridad.");
    }
    
    // 1. Limpiamos permisos actuales del rol
    const { error: errorDel } = await supabase
      .from('rol_permisos')
      .delete()
      .eq('rol_id', rolId);
    
    if (errorDel) throw errorDel;
    
    // 2. Insertamos la nueva selección si existe
    if (listaPermisosIds.length > 0) {
      const payload = listaPermisosIds.map(pId => ({ 
        rol_id: rolId, 
        permiso_id: pId 
      }));
      const { error: errorIns } = await supabase
        .from('rol_permisos')
        .insert(payload);
      if (errorIns) throw errorIns;
    }
    
    return { success: true };
  }
};