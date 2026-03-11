import { supabase } from '../lib/supabaseClient';

export const authService = {
  /**
   * Intenta iniciar sesión y registra un ID de instancia único.
   */
  async login(username, password) {
    try {
      // 1. Buscamos al usuario con TODOS los campos necesarios
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
        .eq('username', username)
        .eq('password_hash', password)
        .eq('status', 'activo')
        .single();

      if (error || !usuario) throw new Error('Usuario o contraseña incorrectos');

      // 2. GENERAMOS UN ID DE SESIÓN ÚNICO
      const uniqueSessionId = crypto.randomUUID();

      // 3. ACTUALIZAMOS LA DB: Esto dispara la señal de Realtime
      const { error: updateError } = await supabase
        .from('usuarios_internos')
        .update({ session_id: uniqueSessionId })
        .eq('id', usuario.id);

      if (updateError) throw updateError;

      // 4. Obtenemos permisos
      const permisos = await this.getPermisosByRol(usuario.rol_id);

      const sessionData = {
        user: usuario,
        permisos: permisos,
        sessionId: uniqueSessionId 
      };

      // Guardamos en localStorage
      localStorage.setItem('cloudkitchen_session', JSON.stringify(sessionData));
      
      return sessionData;
    } catch (error) {
      console.error("Error en login:", error.message);
      throw error;
    }
  },

  async getPermisosByRol(rolId) {
    const { data, error } = await supabase
      .from('rol_permisos')
      .select(`permisos (clave_permiso)`)
      .eq('rol_id', rolId);

    if (error) return [];
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