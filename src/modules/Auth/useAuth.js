// src/modules/Auth/useAuth.js
import { useState } from 'react';
import { AuthService } from './Auth.service';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  
  // Inicializamos el estado con la sesión guardada en localStorage (si existe)
  // Ahora el objeto 'usuario' contendrá: id, nombre_completo, usuario, rol_nombre, permisos, etc.
  const [usuario, setUsuario] = useState(AuthService.getSesion());

  /**
   * Procesa el inicio de sesión
   * @param {string} usuarioIdentidad - El ID de usuario (alias o login)
   * @param {string} password - Contraseña en texto plano
   */
  const iniciarSesion = async (usuarioIdentidad, password) => {
    setLoading(true);
    
    // Llamamos al servicio de autenticación actualizado
    const { data, error } = await AuthService.login(usuarioIdentidad, password);
    setLoading(false);

    if (error) {
      toast.error(error);
      return false;
    }

    // Actualizamos el estado global del usuario en la aplicación
    // 'data' ya trae el objeto de permisos desde Cat_Roles
    setUsuario(data);

    // Notificación amigable usando el nombre completo del trabajador
    toast.success(`¡Bienvenido, ${data.nombre_completo}!`, {
      icon: '👋',
      style: {
        borderRadius: '12px',
        background: 'var(--color-surface-container-highest, #333)',
        color: 'var(--color-on-surface, #fff)',
        border: '1px solid var(--border-color, #444)'
      },
    });
    
    return true;
  };

  /**
   * Finaliza la sesión del usuario limpiando el storage y el estado
   */
  const cerrarSesion = () => {
    AuthService.logout();
    setUsuario(null);
  };

  return {
    loading,
    usuario,
    iniciarSesion,
    cerrarSesion
  };
};