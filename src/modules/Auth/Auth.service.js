// src/modules/Auth/Auth.service.js
import { supabase } from '../../lib/supabaseClient';

// Duración de la sesión: 4 horas en milisegundos.
const SESSION_DURATION_MS = 4 * 60 * 60 * 1000;

export const AuthService = {
  /**
   * Valida credenciales contra la tabla de Trabajadores usando el nombre de usuario.
   * SEGURIDAD:
   * - Utiliza la función RPC 'login_trabajador' con pgcrypto.
   * - La contraseña NUNCA se compara en el cliente.
   * - RATE LIMITING: Máximo 5 intentos fallidos en 15 minutos.
   *   Después del límite, la cuenta se bloquea temporalmente.
   * @param {string} usuario - El ID de usuario (ej: jorge_cocina)
   * @param {string} password - Contraseña en texto plano (el hash se compara en el servidor via RPC)
   */
  async login(usuario, password) {
    const { data, error } = await supabase.rpc('login_trabajador', {
      p_usuario: usuario,
      p_password: password
    });

    // Error de conexión con Supabase
    if (error) {
      console.error("Error en login:", error.message);
      return {
        data: null,
        error: 'Error de conexión. Intenta de nuevo.'
      };
    }

    // La RPC ahora retorna un JSON con campo 'error' para rate limiting y credenciales inválidas
    if (!data || data.error) {
      return {
        data: null,
        error: data?.mensaje || 'ID de Usuario o contraseña incorrectos'
      };
    }

    /**
     * Preparamos el objeto de sesión con la información necesaria para el Front-End.
     */
    const numSucs = data.sucursales_ids?.length || 0;

    const sesion = {
      id: data.id,
      nombre_completo: data.nombre_completo,
      usuario: data.usuario,
      rol_id: data.rol?.id,
      rol_nombre: data.rol?.nombre || 'Sin Rol',
      permisos: data.rol?.permisos || {},
      sucursales_ids: data.sucursales_ids || [],
      sucursal_id: data.sucursales_ids?.[0] || null,
      sucursal_nombre: numSucs > 1
        ? `${numSucs} Sucursales`
        : (numSucs === 1 ? 'Sucursal Asignada' : 'Sin Sucursal'),
      turno: data.turno || 'Ambos',
      expires_at: Date.now() + SESSION_DURATION_MS
    };

    localStorage.setItem('sesion_compra', JSON.stringify(sesion));
    return { data: sesion, error: null };
  },

  /**
   * Recupera la sesión persistida en el localStorage al recargar la app.
   * Valida primero que la sesión real no haya expirado antes de retornarla.
   * Si expiró, limpia el storage y retorna null para forzar un nuevo login.
   */
  getSesion() {
    const saved = localStorage.getItem('sesion_compra');
    if (!saved) return null;

    let parsed;
    try {
      parsed = JSON.parse(saved);
    } catch (e) {
      console.error("Error al recuperar sesión:", e);
      localStorage.removeItem('sesion_compra');
      localStorage.removeItem('sesion_simulada');
      return null;
    }

    if (!parsed?.id) {
      localStorage.removeItem('sesion_compra');
      return null;
    }

    if (parsed.expires_at && Date.now() > parsed.expires_at) {
      console.warn("Sesión expirada. Limpiando storage.");
      localStorage.removeItem('sesion_compra');
      localStorage.removeItem('sesion_simulada');
      return null;
    }

    const simulada = localStorage.getItem('sesion_simulada');
    if (simulada) {
      try {
        return JSON.parse(simulada);
      } catch (e) {
        console.error("Error al parsear sesión simulada:", e);
        localStorage.removeItem('sesion_simulada');
      }
    }

    return parsed;
  },

  /**
   * Limpia los datos de navegación y fuerza un refresco.
   */
  logout() {
    localStorage.removeItem('sesion_compra');
    localStorage.removeItem('sesion_simulada');
    window.location.reload();
  },

  // ==========================================
  // MÉTODOS PARA SIMULACIÓN DE ROLES (IMPERSONATE)
  // ==========================================

  iniciarSimulacion(rolSimulado) {
    const sesionReal = this.getSesionReal();
    if (!sesionReal) return;

    const nuevaSesion = {
      ...sesionReal,
      rolSimulado: true,
      rol_nombre: rolSimulado.nombre,
      rol_id: rolSimulado.id,
      permisos: rolSimulado.permisos
    };

    localStorage.setItem('sesion_simulada', JSON.stringify(nuevaSesion));
    window.location.reload();
  },

  detenerSimulacion() {
    localStorage.removeItem('sesion_simulada');
    window.location.reload();
  },

  /**
   * Recupera únicamente la sesión real (no simulada).
   * También valida que no haya expirado.
   */
  getSesionReal() {
    const saved = localStorage.getItem('sesion_compra');
    try {
      if (!saved) return null;
      const parsed = JSON.parse(saved);

      if (parsed?.expires_at && Date.now() > parsed.expires_at) {
        localStorage.removeItem('sesion_compra');
        localStorage.removeItem('sesion_simulada');
        return null;
      }

      return parsed || null;
    } catch (e) {
      return null;
    }
  },

  estaSimulando() {
    return localStorage.getItem('sesion_simulada') !== null;
  }
};