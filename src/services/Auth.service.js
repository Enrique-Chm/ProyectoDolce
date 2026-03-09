import { supabase } from '../lib/supabaseClient';

export const authService = {
  /**
   * Intenta iniciar sesión con username y password
   * Nota: En un entorno real usarías supabase.auth, pero basándonos 
   * en tus tablas de usuarios_internos, lo manejamos así:
   */
  async login(username, password) {
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios_internos')
        .select(`
          id, 
          nombre, 
          rol_id, 
          pin_seguridad,
          roles (nombre_rol)
        `)
        .eq('username', username)
        .eq('password_hash', password) // Aquí deberías usar hash en producción
        .eq('status', 'activo')
        .single();

      if (error || !usuario) throw new Error('Usuario o contraseña incorrectos');

      // Una vez tenemos el usuario, obtenemos sus permisos
      const permisos = await this.getPermisosByRol(usuario.rol_id);

      const sessionData = {
        user: usuario,
        permisos: permisos
      };

      // Guardamos en localStorage para persistencia simple
      localStorage.setItem('cloudkitchen_session', JSON.stringify(sessionData));
      
      return sessionData;
    } catch (error) {
      console.error("Error en login:", error.message);
      throw error;
    }
  },

  /**
   * Obtiene la lista de claves de permiso (ej: ['ver_recetas', 'ver_insumos'])
   */
  async getPermisosByRol(rolId) {
    const { data, error } = await supabase
      .from('rol_permisos')
      .select(`
        permisos (clave_permiso)
      `)
      .eq('rol_id', rolId);

    if (error) return [];
    // Limpiamos el array para que solo devuelva los strings de las claves
    return data.map(p => p.permisos.clave_permiso);
  },

  getCurrentSession() {
    const session = localStorage.getItem('cloudkitchen_session');
    return session ? JSON.parse(session) : null;
  },

  logout() {
    localStorage.removeItem('cloudkitchen_session');
    window.location.reload();
  }
};