// Archivo: src/services/Gastos.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ El guardián de seguridad

export const gastosService = {
  // --- CATEGORÍAS DE GASTOS ---
  async getCategorias() {
    // 🛡️ Solo personal autorizado puede ver el módulo financiero
    if (!hasPermission('ver_gastos')) return [];

    const { data, error } = await supabase
      .from('categorias_gastos')
      .select('*')
      .order('nombre', { ascending: true });
      
    if (error) throw error;
    return data || [];
  },

  async saveCategoria(payload, id = null) {
    // 🛡️ Blindaje contra modificaciones no autorizadas
    if (!hasPermission('editar_gastos')) {
      throw new Error("Acceso denegado: No tienes permisos para modificar categorías de gastos.");
    }

    if (id) {
      return await supabase.from('categorias_gastos').update(payload).eq('id', id);
    }
    return await supabase.from('categorias_gastos').insert([payload]);
  },

  async deleteCategoria(id) {
    // 🛡️ Solo roles con permiso de borrado pueden eliminar catálogos
    if (!hasPermission('borrar_gastos')) {
      throw new Error("Acceso denegado: Se requiere permiso para eliminar categorías.");
    }

    return await supabase.from('categorias_gastos').delete().eq('id', id);
  },

  // --- GASTOS OPERATIVOS ---
  async getGastos() {
    if (!hasPermission('ver_gastos')) return [];

    // Hacemos Join con categorias_gastos y cat_sucursales para traer los nombres legibles
    const { data, error } = await supabase
      .from('gastos')
      .select(`
        *,
        categorias_gastos (nombre),
        cat_sucursales (nombre)
      `)
      .order('fecha', { ascending: false });
      
    if (error) throw error;
    return data || [];
  },

  async saveGasto(payload, id = null) {
    // 🛡️ Validamos el permiso correcto dependiendo de si es creación o edición
    const permisoRequerido = id ? 'editar_gastos' : 'crear_gastos';
    if (!hasPermission(permisoRequerido)) {
      throw new Error(`Acceso denegado: No tienes permiso para ${id ? 'editar' : 'registrar'} gastos.`);
    }

    // 🕵️‍♂️ Auditoría automática: Insertamos qué usuario está registrando el gasto
    if (!id) {
      const sessionStr = localStorage.getItem('cloudkitchen_session');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session?.user?.id) {
            payload.usuario_id = session.user.id;
          }
        } catch (e) {
          console.error("Error al inyectar usuario_id en el gasto:", e);
        }
      }
    }

    if (id) {
      return await supabase.from('gastos').update(payload).eq('id', id);
    }
    return await supabase.from('gastos').insert([payload]);
  },

  async deleteGasto(id) {
    // 🛡️ Protección financiera: Borrar dinero de los reportes es una acción crítica
    if (!hasPermission('borrar_gastos')) {
      throw new Error("Acceso denegado: Se requiere autorización superior para eliminar registros de gastos.");
    }

    return await supabase.from('gastos').delete().eq('id', id);
  }
};