import { supabase } from '../lib/supabaseClient';

export const empleadosService = {
  
  // --- GESTIÓN DE USUARIOS ---
  async getUsuarios() {
    try {
      const { data, error } = await supabase
        .from('usuarios_internos')
        .select(`
          *,
          roles (nombre_rol)
        `)
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error en getUsuarios:", error);
      throw error;
    }
  },

  async saveUsuario(payload, id = null) {
    if (id) {
      return await supabase.from('usuarios_internos').update(payload).eq('id', id);
    }
    return await supabase.from('usuarios_internos').insert([payload]);
  },

  async deleteUsuario(id) {
    return await supabase.from('usuarios_internos').delete().eq('id', id);
  },

  // --- GESTIÓN DE ROLES ---
  async getRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async saveRol(payload, id = null) {
    if (id) {
      return await supabase.from('roles').update(payload).eq('id', id);
    }
    return await supabase.from('roles').insert([payload]);
  },

  // --- GESTIÓN DE PERMISOS ---
  async getPermisos() {
    const { data, error } = await supabase
      .from('permisos')
      .select('*')
      .order('clave_permiso', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // --- RELACIÓN ROL-PERMISOS (La "llave" del acceso) ---
  
  /**
   * Obtiene solo los IDs de los permisos que tiene asignados un rol específico.
   */
  async getIdsPermisosPorRol(rolId) {
    try {
      const { data, error } = await supabase
        .from('rol_permisos')
        .select('permiso_id')
        .eq('rol_id', rolId);

      if (error) throw error;
      return data.map(item => item.permiso_id);
    } catch (error) {
      console.error("Error en getIdsPermisosPorRol:", error);
      return [];
    }
  },

  /**
   * Sincroniza los permisos de un rol: borra los anteriores e inserta los nuevos.
   */
  async actualizarPermisosRol(rolId, listaPermisosIds) {
    try {
      // 1. Limpiamos permisos actuales para ese rol
      await supabase.from('rol_permisos').delete().eq('rol_id', rolId);

      // 2. Si hay nuevos permisos seleccionados, los insertamos
      if (listaPermisosIds.length > 0) {
        const payload = listaPermisosIds.map(pId => ({
          rol_id: rolId,
          permiso_id: pId
        }));
        const { error } = await supabase.from('rol_permisos').insert(payload);
        if (error) throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error en actualizarPermisosRol:", error);
      throw error;
    }
  },

  // --- SUCURSALES (Extra por si lo necesitas en el formulario) ---
  async getSucursales() {
    const { data } = await supabase.from('sucursal').select('*').order('nombre');
    return data || [];
  }
};