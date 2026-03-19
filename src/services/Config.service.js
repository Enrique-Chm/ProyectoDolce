// Archivo: src/services/Config.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Capa de seguridad activa

export const configService = {
  // --- UNIDADES DE MEDIDA ---
  async getUnidades() {
    // 🛡️ Blindaje de lectura
    if (!hasPermission('ver_configuracion')) return { data: [], error: null };

    return await supabase.from('cat_unidades_medida').select('*').order('nombre');
  },

  async saveUnidad(payload, id = null) {
    if (id) {
      // 🛡️ Blindaje de edición (Update)
      if (!hasPermission('editar_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No tienes permiso para modificar unidades de medida.' } };
      }
      return await supabase.from('cat_unidades_medida').update(payload).eq('id', id);
    } else {
      // 🛡️ Blindaje de creación (Insert)
      if (!hasPermission('crear_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No tienes permiso para crear unidades de medida.' } };
      }
      return await supabase.from('cat_unidades_medida').insert([payload]);
    }
  },

  async deleteUnidad(id) {
    // 🛡️ Blindaje de borrado
    if (!hasPermission('borrar_configuracion')) {
      return { data: null, error: { message: 'Acceso Denegado: Se requieren permisos para borrar en configuración.' } };
    }

    return await supabase.from('cat_unidades_medida').delete().eq('id', id);
  },

  // --- CATEGORÍAS DE MENÚ (PLATILLOS) ---
  async getMenu() {
    // 🛡️ Blindaje de lectura
    if (!hasPermission('ver_configuracion')) return { data: [], error: null };

    return await supabase
      .from('cat_categorias_menu') 
      .select('*')
      .order('nombre');
  },

  async saveMenu(payload, id = null) {
    if (id) {
      // 🛡️ Blindaje de edición
      if (!hasPermission('editar_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No tienes facultades para alterar las categorías del menú.' } };
      }
      const { data, error } = await supabase.from('cat_categorias_menu').update(payload).eq('id', id);
      return { data, error };
    } else {
      // 🛡️ Blindaje de creación
      if (!hasPermission('crear_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No tienes facultades para crear nuevas categorías del menú.' } };
      }
      const { data, error } = await supabase.from('cat_categorias_menu').insert([payload]);
      return { data, error };
    }
  },

  async deleteMenu(id) {
    // 🛡️ Blindaje de borrado
    if (!hasPermission('borrar_configuracion')) {
      return { data: null, error: { message: 'Acceso Denegado: Acceso denegado para eliminar categorías de menú.' } };
    }

    return await supabase.from('cat_categorias_menu').delete().eq('id', id);
  },

  // --- CATEGORÍAS DE INSUMOS (ALMACÉN) ---
  async getInsumos() {
    // 🛡️ Blindaje de lectura
    if (!hasPermission('ver_configuracion')) return { data: [], error: null };

    return await supabase.from('cat_categoria_insumos').select('*').order('nombre');
  },

  async saveInsumo(payload, id = null) {
    if (id) {
      // 🛡️ Blindaje de edición
      if (!hasPermission('editar_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No tienes permiso para gestionar (editar) categorías de almacén.' } };
      }
      const { data, error } = await supabase.from('cat_categoria_insumos').update(payload).eq('id', id);
      return { data, error };
    } else {
      // 🛡️ Blindaje de creación
      if (!hasPermission('crear_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No tienes permiso para crear categorías de almacén.' } };
      }
      const { data, error } = await supabase.from('cat_categoria_insumos').insert([payload]);
      return { data, error };
    }
  },

  async deleteInsumo(id) {
    // 🛡️ Blindaje de borrado
    if (!hasPermission('borrar_configuracion')) {
      return { data: null, error: { message: 'Acceso Denegado: Se requiere permiso para borrar categorías de insumos.' } };
    }

    return await supabase.from('cat_categoria_insumos').delete().eq('id', id);
  },

  // --- MOTIVOS DE INVENTARIO ---
  async getMotivosInventario() {
    // 🛡️ Blindaje de lectura
    if (!hasPermission('ver_configuracion')) return { data: [], error: null };

    return await supabase
      .from('cat_motivos_inventario')
      .select('*')
      .order('tipo', { ascending: true })
      .order('nombre_motivo', { ascending: true });
  },

  async saveMotivoInventario(payload, id = null) {
    if (id) {
      // 🛡️ Blindaje de edición
      if (!hasPermission('editar_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No puedes modificar los motivos de ajuste de inventario.' } };
      }
      return await supabase.from('cat_motivos_inventario').update(payload).eq('id', id);
    } else {
      // 🛡️ Blindaje de creación
      if (!hasPermission('crear_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No puedes crear nuevos motivos de ajuste de inventario.' } };
      }
      return await supabase.from('cat_motivos_inventario').insert([payload]);
    }
  },

  async deleteMotivoInventario(id) {
    // 🛡️ Blindaje de borrado
    if (!hasPermission('borrar_configuracion')) {
      return { data: null, error: { message: 'Acceso Denegado: Se requieren permisos críticos para eliminar motivos de ajuste.' } };
    }

    return await supabase.from('cat_motivos_inventario').delete().eq('id', id);
  }
};