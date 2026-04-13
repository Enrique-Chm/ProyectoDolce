// src/modules/Auth/useAuth.js
import { useState } from 'react';
import { AuthService } from './Auth.service';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  // Inicializamos el estado con la sesión guardada (si existe)
  const [usuario, setUsuario] = useState(AuthService.getSesion());

  /**
   * Procesa el inicio de sesión
   * @param {string} usuarioIdentidad - El ID de usuario (alias)
   * @param {string} password - Contraseña
   */
  const iniciarSesion = async (usuarioIdentidad, password) => {
    setLoading(true);
    
    // Llamamos al servicio con el nuevo campo de usuario
    const { data, error } = await AuthService.login(usuarioIdentidad, password);
    setLoading(false);

    if (error) {
      toast.error(error);
      return false;
    }

    // Actualizamos el estado global del usuario en la app
    setUsuario(data);
    toast.success(`¡Bienvenido, ${data.nombre}!`, {
      icon: '👋',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
    
    return true;
  };

  /**
   * Finaliza la sesión del usuario
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