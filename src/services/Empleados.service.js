import { supabase } from '../lib/supabaseClient';

export const empleadosService = {
  // --- USUARIOS (EQUIPO) ---
  async getUsuarios() {
    const { data, error } = await supabase
      .from('usuarios_internos')
      .select('*, roles(id, nombre_rol)')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
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

  // --- ROLES ---
  async getRoles() {
    const { data, error } = await supabase.from('roles').select('*').order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async saveRol(payload, id = null) {
    if (id) return await supabase.from('roles').update(payload).eq('id', id).select();
    return await supabase.from('roles').insert([payload]).select();
  },

  async deleteRol(id) {
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- PERMISOS Y MATRIZ ---
  async getPermisos() {
    const { data, error } = await supabase.from('permisos').select('*').order('clave_permiso', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getIdsPermisosPorRol(rolId) {
    const { data, error } = await supabase.from('rol_permisos').select('permiso_id').eq('rol_id', rolId);
    if (error) throw error;
    return data.map(item => item.permiso_id);
  },

  async actualizarPermisosRol(rolId, listaPermisosIds) {
    await supabase.from('rol_permisos').delete().eq('rol_id', rolId);
    if (listaPermisosIds.length > 0) {
      const payload = listaPermisosIds.map(pId => ({ rol_id: rolId, permiso_id: pId }));
      const { error } = await supabase.from('rol_permisos').insert(payload);
      if (error) throw error;
    }
    return { success: true };
  }
};