// src/modules/Auth/AuthContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthService } from './Auth.service';
import toast from 'react-hot-toast';

// Intervalo de verificación de expiración: cada 60 segundos
const INTERVALO_VERIFICACION_MS = 60 * 1000;

// Creamos el contexto central de autenticación
const AuthContext = createContext(null);

/**
 * AuthProvider envuelve toda la aplicación y expone el estado de sesión
 * a cualquier componente que lo consuma via useAuth().
 * Al vivir aquí, el estado es UNO SOLO — ya no hay instancias desconectadas
 * entre AdminPage, Login y cualquier otro componente futuro.
 */
export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(false);

  /**
   * Estado global del usuario.
   * Se inicializa leyendo localStorage al montar la app, recuperando
   * la sesión aunque el usuario haya recargado la página.
   * getSesion() ya valida la expiración al leer, así que si la sesión
   * venció antes de que el usuario volviera a abrir la app, arranca en null.
   */
  const [usuario, setUsuario] = useState(AuthService.getSesion());

  /**
   * Verificación activa de expiración mientras la app está abierta.
   * Se ejecuta cada INTERVALO_VERIFICACION_MS segundos y también
   * cuando el tab vuelve a estar visible (el usuario regresa de otra pestaña).
   * Si detecta que la sesión expiró, limpia el estado y avisa al usuario.
   */
  useEffect(() => {
    if (!usuario) return;

    const verificarExpiracion = () => {
      const sesionActual = AuthService.getSesion();
      if (!sesionActual) {
        // La sesión expiró mientras la app estaba abierta
        setUsuario(null);
        toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', {
          duration: 2000,
       
          style: {
            borderRadius: '12px',
            fontSize: '0.875rem'
          }
        });
      }
    };

    // Verificación periódica en segundo plano
    const intervalo = setInterval(verificarExpiracion, INTERVALO_VERIFICACION_MS);

    // Verificación inmediata al recuperar el foco del tab
    // (cubre el caso: usuario deja la app abierta horas y vuelve)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verificarExpiracion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Limpieza al desmontar o cuando el usuario cambia
    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [usuario]);

  /**
   * Procesa el inicio de sesión.
   * @param {string} usuarioIdentidad - El login del trabajador
   * @param {string} password - Contraseña en texto plano (el hash se compara en el servidor via RPC)
   */
  const iniciarSesion = async (usuarioIdentidad, password) => {
    if (!usuarioIdentidad || !password) {
      toast.error('Por favor, completa todos los campos'),{ duration: 2000 };
      return false;
    }

    setLoading(true);
    const { data, error } = await AuthService.login(usuarioIdentidad, password);
    setLoading(false);

    if (error) {
      toast.error(error);
      return false;
    }

    // Al actualizar el estado aquí, TODOS los componentes suscritos al contexto
    // reciben el nuevo usuario automáticamente. AdminPage detecta que usuario
    // ya no es null y deja de renderizar Login — sin necesidad de reload().
    setUsuario(data);

    toast.success(`¡Bienvenido, ${data.nombre_completo}!`, {
      duration: 2000,
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
   * Limpia el storage y actualiza el estado global a null.
   * El Context propaga el cambio automáticamente — AdminPage vuelve a mostrar
   * el Login sin necesidad de window.location.reload().
   */
  const cerrarSesion = useCallback(() => {
    localStorage.removeItem('sesion_compra');
    localStorage.removeItem('sesion_simulada');
    setUsuario(null);
  }, []);

  /**
   * Helper para verificar si el usuario activo tiene un permiso específico.
   * Se recalcula automáticamente cuando el usuario cambia (login, simulación, logout).
   * @param {string} modulo - Nombre del módulo (ej: 'pedidos')
   * @param {string} accion - Acción a verificar (ej: 'crear')
   */
  const tienePermiso = useCallback((modulo, accion) => {
    return usuario?.permisos?.[modulo]?.[accion] === true;
  }, [usuario]);

  return (
    <AuthContext.Provider value={{ loading, usuario, iniciarSesion, cerrarSesion, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para consumir el contexto de autenticación.
 * Lanza un error descriptivo si se usa fuera del AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>. Verifica que App.jsx lo incluya.');
  }
  return context;
};