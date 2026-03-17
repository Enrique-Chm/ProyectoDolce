// Archivo: src/services/productos.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Importación de seguridad

export const productosService = {
  /**
   * Obtiene datos iniciales: productos, categorías y mapas de costos.
   */
  async getInitialData() {
    try {
      // 🛡️ Blindaje: Verificación de lectura
      if (!hasPermission('ver_productos')) {
        return { productos: [], categorias: [], costosMap: [], listaRecetas: [] };
      }

      const [prod, cat, rec, lista] = await Promise.all([
        // Ajustado a tu tabla real 'productosmenu' a través de la vista
        supabase.from('vista_productos_costos').select('*').order('nombre'),
        supabase.from('cat_categorias_menu').select('*').order('nombre'),
        supabase.from('vista_recetas_completas').select('*'),
        supabase.from('recetas').select('nombre, subreceta')
      ]);

      if (prod.error) throw prod.error;

      const costosMap = (rec.data || []).map(r => ({
        nombre: r.nombre,
        costo_final: r.costo_total_receta || 0
      }));

      return {
        productos: prod.data || [],
        categorias: cat.data || [],
        costosMap,
        listaRecetas: lista.data || []
      };
    } catch (error) {
      console.error("Error en productosService:", error);
      throw error;
    }
  },

  /**
   * Guarda o actualiza un producto en la tabla productosmenu.
   */
  async saveProducto(payload, id = null) {
    // 🛡️ Blindaje: Verificación de edición/creación
    if (!hasPermission('editar_productos')) {
      return { data: null, error: { message: "Acceso denegado: No tienes facultades para modificar el menú." } };
    }

    // Usamos el nombre exacto de tu tabla: productosmenu
    if (id) {
      return await supabase.from('productosmenu').update(payload).eq('id', id);
    }
    return await supabase.from('productosmenu').insert([payload]);
  },

  /**
   * Elimina un producto por su ID.
   */
  async deleteProducto(id) {
    // 🛡️ Blindaje: Verificación de borrado
    if (!hasPermission('borrar_registros')) {
      return { data: null, error: { message: "Acceso denegado: Se requiere permiso de administrador para eliminar productos." } };
    }

    return await supabase.from('productosmenu').delete().eq('id', id);
  }
};