// src/modules/Auth/useAuth.js
import { useState, useCallback } from 'react';
import { AuthService } from './Auth.service';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  
  /**
   * Inicializamos el estado con la sesión guardada en localStorage (si existe).
   * Tras la actualización del Service, este objeto 'usuario' ahora incluye:
   * - id, nombre_completo, usuario
   * - rol_id, rol_nombre, permisos (objeto de acceso)
   * - sucursales_ids (Arreglo de UUIDs)
   * - sucursal_id (ID de la primera sucursal para compatibilidad)
   */
  const [usuario, setUsuario] = useState(AuthService.getSesion());

  /**
   * Procesa el inicio de sesión
   * @param {string} usuarioIdentidad - El login del trabajador
   * @param {string} password - Contraseña en texto plano
   */
  const iniciarSesion = async (usuarioIdentidad, password) => {
    if (!usuarioIdentidad || !password) {
      toast.error('Por favor, completa todos los campos');
      return false;
    }

    setLoading(true);
    
    // El servicio ahora retorna el objeto de sesión ya procesado y aplanado
    const { data, error } = await AuthService.login(usuarioIdentidad, password);
    setLoading(false);

    if (error) {
      toast.error(error);
      return false;
    }

    // Actualizamos el estado global del usuario. 
    // Esto disparará la reactividad en toda la app (menús, rutas protegidas, etc.)
    setUsuario(data);

    // Notificación elegante con el nombre del trabajador
    toast.success(`¡Bienvenido, ${data.nombre_completo}!`, {
      icon: '👋',
      style: {
        borderRadius: '12px',
        background: 'var(--color-surface-container-highest, #333)',
        color: 'var(--color-on-surface, #fff)',
        border: '1px solid var(--border-color, #444)',
        fontSize: '0.9rem'
      },
    });
    
    return true;
  };

  /**
   * Finaliza la sesión del usuario.
   * AuthService.logout() limpia el storage y recarga la página para resetear
   * todos los estados de los hooks en memoria.
   */
  const cerrarSesion = useCallback(() => {
    AuthService.logout();
    setUsuario(null);
  }, []);

  /**
   * Helper para verificar si el usuario tiene un permiso específico
   * @param {string} modulo - Nombre del módulo (ej: 'pedidos')
   * @param {string} accion - Acción a realizar (ej: 'crear')
   */
  const tienePermiso = (modulo, accion) => {
    return usuario?.permisos?.[modulo]?.[accion] === true;
  };

  return {
    loading,
    usuario,
    iniciarSesion,
    cerrarSesion,
    tienePermiso // Exportamos esta utilidad para usarla en los componentes JSX
  };
};