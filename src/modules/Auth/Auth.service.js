// src/modules/Auth/Auth.service.js
import { supabase } from '../../lib/supabaseClient';

export const AuthService = {
  /**
   * Valida credenciales contra la tabla de Trabajadores usando el nombre de usuario
   * @param {string} usuario - El ID de usuario (ej: jorge_cocina)
   * @param {string} password - Contraseña en texto plano
   */
  async login(usuario, password) {
    const { data, error } = await supabase
      .from('Cat_Trabajadores')
      .select(`
        id, 
        nombre_completo, 
        usuario, 
        password, 
        estatus,
        sucursal_id,
        sucursal:Cat_sucursales(nombre),
        rol:Cat_Roles(
          id,
          nombre,
          permisos
        )
      `)
      .eq('usuario', usuario)    // Búsqueda por la columna 'usuario'
      .eq('password', password)  // Comparación directa de contraseña
      .eq('estatus', 'Activo')   // Solo usuarios permitidos
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
     * Ahora incluimos el objeto 'permisos' para habilitar/deshabilitar funciones
     * dinámicamente en la interfaz.
     */
    const sesion = {
      id: data.id,
      nombre_completo: data.nombre_completo,
      usuario: data.usuario,
      rol_id: data.rol?.id,
      rol_nombre: data.rol?.nombre || 'Sin Rol',
      permisos: data.rol?.permisos || {}, // <--- Aquí inyectamos el JSON de permisos
      sucursal_id: data.sucursal_id,
      sucursal_nombre: data.sucursal?.nombre || 'Sin Sucursal Asignada'
    };

    // Guardamos la sesión en el navegador para evitar logueos constantes
    localStorage.setItem('sesion_compra', JSON.stringify(sesion));

    return { data: sesion, error: null };
  },

  /**
   * Recupera la sesión persistida en el localStorage al recargar la app
   */
  getSesion() {
    const saved = localStorage.getItem('sesion_compra');
    try {
      if (!saved) return null;
      
      const parsed = JSON.parse(saved);
      // Validamos que tenga la estructura mínima esperada
      return parsed.id ? parsed : null;
    } catch (e) {
      console.error("Error al recuperar sesión:", e);
      localStorage.removeItem('sesion_compra');
      return null;
    }
  },

  /**
   * Limpia los datos de navegación y fuerza un refresco para resetear el estado de React
   */
  logout() {
    localStorage.removeItem('sesion_compra');
    // Forzamos el reload para limpiar todos los estados de los hooks en memoria
    window.location.reload(); 
  }
};