// src/modules/Auth/Auth.service.js
import { supabase } from '../../lib/supabaseClient';

export const AuthService = {
  /**
   * Valida credenciales contra la tabla de Trabajadores usando el nombre de usuario
   * @param {string} usuario - El ID de usuario (ej: jorge_cocina)
   * @param {string} password - Contraseña en texto plano
   */
  async login(usuario, password) {
    /**
     * ACTUALIZACIÓN: Cambiamos sucursal_id por sucursales_ids.
     * Eliminamos el join sucursal:Cat_sucursales ya que al ser un array, 
     * PostgREST no puede resolver la relación automáticamente en este select.
     */
    const { data, error } = await supabase
      .from('Cat_Trabajadores')
      .select(`
        id, 
        nombre_completo, 
        usuario, 
        password, 
        estatus,
        sucursales_ids,
        rol:Cat_Roles(
          id,
          nombre,
          permisos
        )
      `)
      .eq('usuario', usuario)    
      .eq('password', password)  
      .eq('estatus', 'Activo')   
      .single();

    // Si hay error de Supabase o no hay datos, las credenciales son inválidas
    if (error || !data) {
      console.error("Error en login:", error?.message);
      return { 
        data: null, 
        error: 'ID de Usuario o contraseña incorrectos' 
      };
    }

    /**
     * Preparamos el objeto de sesión con la información necesaria para el Front-End.
     * Adaptamos la estructura para manejar múltiples sucursales.
     */
    const numSucs = data.sucursales_ids?.length || 0;
    
    const sesion = {
      id: data.id,
      nombre_completo: data.nombre_completo,
      usuario: data.usuario,
      rol_id: data.rol?.id,
      rol_nombre: data.rol?.nombre || 'Sin Rol',
      permisos: data.rol?.permisos || {},
      // Ahora guardamos el arreglo completo de IDs
      sucursales_ids: data.sucursales_ids || [],
      // Mantenemos sucursal_id por compatibilidad (usando la primera del array)
      sucursal_id: data.sucursales_ids?.[0] || null,
      sucursal_nombre: numSucs > 1 ? `${numSucs} Sucursales` : (numSucs === 1 ? 'Sucursal Asignada' : 'Sin Sucursal')
    };

    // Guardamos la sesión real en el navegador
    localStorage.setItem('sesion_compra', JSON.stringify(sesion));

    return { data: sesion, error: null };
  },

  /**
   * Recupera la sesión persistida en el localStorage al recargar la app.
   */
  getSesion() {
    const simulada = localStorage.getItem('sesion_simulada');
    if (simulada) {
      try {
        return JSON.parse(simulada);
      } catch (e) {
        console.error("Error al parsear sesión simulada:", e);
        localStorage.removeItem('sesion_simulada');
      }
    }

    const saved = localStorage.getItem('sesion_compra');
    try {
      if (!saved) return null;
      
      const parsed = JSON.parse(saved);
      return parsed.id ? parsed : null;
    } catch (e) {
      console.error("Error al recuperar sesión:", e);
      localStorage.removeItem('sesion_compra');
      return null;
    }
  },

  /**
   * Limpia los datos de navegación y fuerza un refresco
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

  getSesionReal() {
    const saved = localStorage.getItem('sesion_compra');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },

  estaSimulando() {
    return localStorage.getItem('sesion_simulada') !== null;
  }
};