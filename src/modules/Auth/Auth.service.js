// src/modules/Auth/Auth.service.js
import { supabase } from '../../lib/supabaseClient';

// Duración de la sesión: 8 horas en milisegundos.
// Ajusta este valor si los turnos de trabajo requieren otro tiempo.
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export const AuthService = {
  /**
   * Valida credenciales contra la tabla de Trabajadores usando el nombre de usuario.
   * SEGURIDAD: Utiliza la función RPC 'login_trabajador' con pgcrypto.
   * - La contraseña NUNCA se compara en el cliente.
   * - pgcrypto realiza la comparación de hash en el servidor.
   * - La columna 'password' nunca viaja al front-end.
   * @param {string} usuario - El ID de usuario (ej: jorge_cocina)
   * @param {string} password - Contraseña en texto plano (el hash se compara en el servidor via RPC)
   */
  async login(usuario, password) {
    const { data, error } = await supabase.rpc('login_trabajador', {
      p_usuario: usuario,
      p_password: password
    });

    // Si hay error de Supabase o no hay datos, las credenciales son inválidas.
    // La función RPC retorna NULL cuando no hay coincidencia, lo que también
    // cae en esta condición gracias al !data.
    if (error || !data) {
      console.error("Error en login:", error?.message);
      return { 
        data: null, 
        error: 'ID de Usuario o contraseña incorrectos' 
      };
    }

    /**
     * Preparamos el objeto de sesión con la información necesaria para el Front-End.
     * Adaptamos la estructura para manejar múltiples sucursales y turnos fijos.
     * Se agrega 'expires_at' para controlar la expiración automática de sesión.
     */
    const numSucs = data.sucursales_ids?.length || 0;

    const sesion = {
      id: data.id,
      nombre_completo: data.nombre_completo,
      usuario: data.usuario,
      rol_id: data.rol?.id,
      rol_nombre: data.rol?.nombre || 'Sin Rol',
      permisos: data.rol?.permisos || {},
      // Guardamos el arreglo completo de IDs de sucursales asignadas
      sucursales_ids: data.sucursales_ids || [],
      // Mantenemos sucursal_id por compatibilidad (usando la primera del array)
      sucursal_id: data.sucursales_ids?.[0] || null,
      sucursal_nombre: numSucs > 1 
        ? `${numSucs} Sucursales` 
        : (numSucs === 1 ? 'Sucursal Asignada' : 'Sin Sucursal'),
      // Almacenamos el turno ('AM', 'PM' o 'Ambos') de manera segura
      turno: data.turno || 'Ambos',
      // Marca de tiempo de expiración: la sesión dura SESSION_DURATION_MS desde el login
      expires_at: Date.now() + SESSION_DURATION_MS
    };

    // Guardamos la sesión real en el navegador
    localStorage.setItem('sesion_compra', JSON.stringify(sesion));
    return { data: sesion, error: null };
  },

  /**
   * Recupera la sesión persistida en el localStorage al recargar la app.
   * Valida primero que la sesión real no haya expirado antes de retornarla.
   * Si expiró, limpia el storage y retorna null para forzar un nuevo login.
   */
  getSesion() {
    // Primero validamos que la sesión REAL sea vigente,
    // incluso si después vamos a retornar la sesión simulada.
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

    // Verificamos si la sesión real ha expirado
    if (parsed.expires_at && Date.now() > parsed.expires_at) {
      console.warn("Sesión expirada. Limpiando storage.");
      localStorage.removeItem('sesion_compra');
      localStorage.removeItem('sesion_simulada');
      return null;
    }

    // La sesión real es válida. Ahora verificamos si hay una sesión simulada activa.
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

      // Validamos expiración también en la sesión real directa
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