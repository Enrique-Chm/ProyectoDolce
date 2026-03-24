// Archivo: src/services/Auth.service.js
import { supabase } from '../lib/supabaseClient';

export const authService = {
  async login(username, password) {
    try {
      const cleanUsername = username.trim();

      const { data: usuario, error } = await supabase
        .from('usuarios_internos')
        .select(`
          id, 
          nombre, 
          rol_id, 
          sucursal_id,
          pin_seguridad,
          username,
          password_hash,
          roles (nombre_rol)
        `)
        .eq('username', cleanUsername)
        .eq('password_hash', password) 
        .eq('status', 'activo')
        .single();

      if (error || !usuario) throw new Error('Credenciales inválidas o usuario inactivo.');

      const uniqueSessionId = crypto.randomUUID();

      const { error: updateError } = await supabase
        .from('usuarios_internos')
        .update({ session_id: uniqueSessionId })
        .eq('id', usuario.id);

      if (updateError) throw updateError;

      // 4. Obtenemos permisos con la técnica a prueba de fallos
      const permisos = await this.getPermisosByRol(usuario.rol_id);

      const sessionData = {
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          rol: usuario.roles?.nombre_rol,
          rol_id: usuario.rol_id,
          sucursal_id: usuario.sucursal_id
        },
        permisos: permisos,
        sessionId: uniqueSessionId,
        loginAt: new Date().toISOString()
      };

      localStorage.setItem('cloudkitchen_session', JSON.stringify(sessionData));
      return sessionData;
    } catch (error) {
      console.error("🛡️ Error crítico en Auth:", error.message);
      throw error;
    }
  },

  async getPermisosByRol(rolId) {
    try {
      // PASO 1: Consulta 100% plana. Imposible que dé error PGRST200 o PGRST201
      const { data: rolPermisos, error: err1 } = await supabase
        .from('rol_permisos')
        .select('permiso_id')
        .eq('rol_id', rolId);

      if (err1) throw err1;
      if (!rolPermisos || rolPermisos.length === 0) return [];

      const permisosIds = rolPermisos.map(rp => rp.permiso_id);

      // PASO 2: Consulta plana a la tabla de permisos
      const { data: permisosData, error: err2 } = await supabase
        .from('permisos')
        .select('clave_permiso')
        .in('id', permisosIds);

      if (err2) throw err2;

      return permisosData.map(p => p.clave_permiso);
    } catch (error) {
      console.error("Error cargando matriz de permisos en 2 pasos:", error);
      return [];
    }
  },

  getCurrentSession() {
    try {
      const session = localStorage.getItem('cloudkitchen_session');
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('cloudkitchen_session');
    window.location.href = '/login'; 
  }
};