// Archivo: src/services/empleados.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ El guardián de la seguridad

export const empleadosService = {
  // --- USUARIOS (EQUIPO) ---
  async getUsuarios() {
    // 🛡️ Solo personal autorizado puede ver la lista de empleados
    if (!hasPermission('ver_usuarios')) return [];

    const { data, error } = await supabase
      .from('usuarios_internos')
      .select('*, roles(id, nombre_rol)')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async saveUsuario(payload, id = null) {
    if (id) {
      // 🛡️ Blindaje contra edición no autorizada de personal
      if (!hasPermission('editar_usuarios')) {
        throw new Error("Acceso denegado: No tienes permisos para gestionar (editar) el equipo.");
      }
      return await supabase.from('usuarios_internos').update(payload).eq('id', id);
    } else {
      // 🛡️ Blindaje contra creación no autorizada de personal
      if (!hasPermission('crear_usuarios')) {
        throw new Error("Acceso denegado: No tienes permisos para registrar nuevo personal.");
      }
      return await supabase.from('usuarios_internos').insert([payload]);
    }
  },

  async deleteUsuario(id) {
    // 🛡️ Permiso específico para eliminar cuentas de acceso
    if (!hasPermission('borrar_usuarios')) {
      throw new Error("Acceso denegado: Se requiere permiso para eliminar usuarios.");
    }

    return await supabase.from('usuarios_internos').delete().eq('id', id);
  },

  // --- ROLES ---
  async getRoles() {
    // 🛡️ Leer la estructura de roles es parte de la configuración
    if (!hasPermission('ver_configuracion')) return [];

    const { data, error } = await supabase.from('roles').select('*').order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async saveRol(payload, id = null) {
    if (id) {
      // 🛡️ Blindaje crítico: Modificar roles
      if (!hasPermission('editar_configuracion')) {
        throw new Error("Acceso denegado: No puedes modificar la estructura de roles.");
      }
      return await supabase.from('roles').update(payload).eq('id', id).select();
    } else {
      // 🛡️ Blindaje crítico: Crear nuevos perfiles de acceso
      if (!hasPermission('crear_configuracion')) {
        throw new Error("Acceso denegado: No tienes permisos para crear nuevos roles.");
      }
      return await supabase.from('roles').insert([payload]).select();
    }
  },

  async deleteRol(id) {
    // 🛡️ Protección de integridad: Borrar un rol puede dejar usuarios sin acceso
    if (!hasPermission('borrar_configuracion')) {
      throw new Error("Acceso denegado: No tienes facultades para eliminar roles.");
    }

    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- PERMISOS Y MATRIZ ---
  async getPermisos() {
    // 🛡️ Ver el catálogo maestro de permisos
    if (!hasPermission('ver_configuracion')) return [];

    const { data, error } = await supabase.from('permisos').select('*').order('clave_permiso', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getIdsPermisosPorRol(rolId) {
    // 🛡️ Ver la matriz de seguridad de un rol específico
    if (!hasPermission('ver_configuracion')) return [];

    const { data, error } = await supabase.from('rol_permisos').select('permiso_id').eq('rol_id', rolId);
    if (error) throw error;
    return data.map(item => item.permiso_id);
  },

  async actualizarPermisosRol(rolId, listaPermisosIds) {
    // 🛡️ BLINDAJE MÁXIMO: Esta función define quién manda en el sistema
    if (!hasPermission('editar_configuracion')) {
      throw new Error("ALERTA DE SEGURIDAD: No tienes permiso para reconfigurar la matriz de acceso.");
    }

    // Proceso de sincronización original
    await supabase.from('rol_permisos').delete().eq('rol_id', rolId);
    
    if (listaPermisosIds.length > 0) {
      const payload = listaPermisosIds.map(pId => ({ rol_id: rolId, permiso_id: pId }));
      const { error } = await supabase.from('rol_permisos').insert(payload);
      if (error) throw error;
    }
    return { success: true };
  }
};