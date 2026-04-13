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
        rol:Cat_Roles(nombre)
      `)
      .eq('usuario', usuario)    // Búsqueda por la columna 'usuario'
      .eq('password', password)  // Comparación directa de contraseña
      .eq('estatus', 'Activo')   // Solo usuarios permitidos
      .single();

    // Si hay error de Supabase o no hay datos, las credenciales son inválidas
    if (error || !data) {
      return { 
        data: null, 
        error: 'ID de Usuario o contraseña incorrectos' 
      };
    }

    // Preparamos el objeto de sesión con la información necesaria para el Front-End
    // Ahora incluimos los datos de la sucursal para automatizar pedidos
    const sesion = {
      id: data.id,
      nombre: data.nombre_completo,
      usuario: data.usuario,
      rol: data.rol?.nombre || 'Sin Rol',
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
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error al parsear sesión:", e);
      return null;
    }
  },

  /**
   * Limpia los datos de navegación y fuerza un refresco para resetear el estado de React
   */
  logout() {
    localStorage.removeItem('sesion_compra');
    window.location.reload(); 
  }
};