// Archivo: src/services/auth.service.js
import { supabase } from '../lib/supabaseClient';

export const authService = {
  /**
   * Intenta iniciar sesión y registra un ID de instancia único.
   */
  async login(username, password) {
    try {
      // 1. Buscamos al usuario (Mantenemos tu lógica de tabla personalizada)
      // Agregamos una limpieza básica de strings para evitar espacios accidentales
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
        .eq('password_hash', password) // 🛡️ Asumimos que el hash se maneja antes de llegar aquí
        .eq('status', 'activo')
        .single();

      if (error || !usuario) {
        throw new Error('Credenciales inválidas o usuario inactivo.');
      }

      // 2. GENERAMOS UN ID DE SESIÓN ÚNICO (Prevención de secuestro de sesión)
      const uniqueSessionId = crypto.randomUUID();

      // 3. ACTUALIZAMOS LA DB: Esto permite invalidar sesiones viejas en otros dispositivos
      const { error: updateError } = await supabase
        .from('usuarios_internos')
        .update({ session_id: uniqueSessionId })
        .eq('id', usuario.id);

      if (updateError) throw updateError;

      // 4. Obtenemos permisos (La base del blindaje de los otros servicios)
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

      // Guardamos en localStorage (Blindaje: Solo guardamos lo necesario)
      localStorage.setItem('cloudkitchen_session', JSON.stringify(sessionData));
      
      return sessionData;
    } catch (error) {
      console.error("🛡️ Error crítico en Auth:", error.message);
      throw error;
    }
  },

  /**
   * Obtiene las claves de permiso del rol (Maestro de permisos)
   */
  async getPermisosByRol(rolId) {
    const { data, error } = await supabase
      .from('rol_permisos')
      .select(`permisos (clave_permiso)`)
      .eq('rol_id', rolId);

    if (error) {
      console.error("Error cargando matriz de permisos:", error);
      return [];
    }
    // Aplanamos el array para que hasPermission pueda hacer .includes() fácilmente
    return data.map(p => p.permisos.clave_permiso);
  },

  /**
   * Recupera la sesión actual del almacenamiento local
   */
  getCurrentSession() {
    try {
      const session = localStorage.getItem('cloudkitchen_session');
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  },

  /**
   * Finaliza la sesión y limpia el rastro local
   */
  logout() {
    // 🛡️ Seguridad: Limpiamos todo el almacenamiento relacionado
    localStorage.removeItem('cloudkitchen_session');
    
    // Opcional: Podrías llamar a Supabase aquí para borrar el session_id de la DB
    // si quisieras invalidar la sesión también en el servidor.

    window.location.href = '/login'; // Redirección limpia
  }
};