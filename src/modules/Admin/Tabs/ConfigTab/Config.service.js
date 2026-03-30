import { supabase } from '../../../../lib/supabaseClient';
import { hasPermission } from '../../../../utils/checkPermiso';

export const configService = {
  // =========================================
  // UNIDADES DE MEDIDA
  // =========================================
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

  // =========================================
  // 🚀 TIPOS DE DESCUENTO (Nueva sección)
  // =========================================
  async getTiposDescuento() {
    // 🛡️ Blindaje de lectura
    if (!hasPermission('ver_configuracion')) return { data: [], error: null };

    return await supabase
      .from('cat_tipos_descuento')
      .select('*')
      .order('nombre', { ascending: true });
  },

  async saveTipoDescuento(payload, id = null) {
    if (id) {
      // 🛡️ Blindaje de edición
      if (!hasPermission('editar_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No tienes permiso para modificar tipos de descuento.' } };
      }
      return await supabase.from('cat_tipos_descuento').update(payload).eq('id', id);
    } else {
      // 🛡️ Blindaje de creación
      if (!hasPermission('crear_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No tienes permiso para crear tipos de descuento.' } };
      }
      return await supabase.from('cat_tipos_descuento').insert([payload]);
    }
  },

  async deleteTipoDescuento(id) {
    // 🛡️ Blindaje de borrado
    if (!hasPermission('borrar_configuracion')) {
      return { data: null, error: { message: 'Acceso Denegado.' } };
    }
    return await supabase.from('cat_tipos_descuento').delete().eq('id', id);
  },

  // =========================================
  // CATEGORÍAS DE MENÚ (PLATILLOS)
  // =========================================
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

  // =========================================
  // CATEGORÍAS DE INSUMOS (ALMACÉN)
  // =========================================
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

  // =========================================
  // MOTIVOS DE INVENTARIO
  // =========================================
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
  },

  // =========================================
  // 🚀 MAPA DE MESAS Y ZONAS
  // =========================================
  async getZonasConMesas(sucursalId) {
    if (!hasPermission('ver_configuracion')) return { data: [], error: null };

    // Traemos las zonas incluyendo grid_size y sus mesas anidadas con coordenadas Y EL TIPO DE ELEMENTO
    const { data, error } = await supabase
      .from('cat_zonas')
      .select(`
        id, 
        nombre, 
        orden, 
        activo,
        grid_size,
        cat_mesas (
          id, 
          nombre, 
          capacidad, 
          activa,
          pos_x,
          pos_y,
          tipo_elemento
        )
      `)
      .eq('sucursal_id', Number(sucursalId))
      .order('orden', { ascending: true });

    if (error) {
      console.error("Error al obtener zonas:", error);
      return { data: [], error };
    }

    const zonasOrdenadas = data.map(zona => ({
      ...zona,
      cat_mesas: (zona.cat_mesas || []).sort((a, b) => a.id - b.id)
    }));

    return { data: zonasOrdenadas, error: null };
  },

  async saveZona(payload, id = null) {
    if (id) {
      if (!hasPermission('editar_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No puedes modificar zonas.' } };
      }
      return await supabase.from('cat_zonas').update(payload).eq('id', id).select();
    } else {
      if (!hasPermission('crear_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No puedes crear zonas.' } };
      }
      return await supabase.from('cat_zonas').insert([payload]).select();
    }
  },

  async deleteZona(id) {
    if (!hasPermission('borrar_configuracion')) {
      return { data: null, error: { message: 'Acceso Denegado.' } };
    }
    return await supabase.from('cat_zonas').delete().eq('id', id);
  },

  async saveMesa(payload, id = null) {
    if (id) {
      if (!hasPermission('editar_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No puedes modificar mesas.' } };
      }
      return await supabase.from('cat_mesas').update(payload).eq('id', id).select();
    } else {
      if (!hasPermission('crear_configuracion')) {
        return { data: null, error: { message: 'Acceso Denegado: No puedes crear mesas.' } };
      }
      // Por defecto la mandamos al punto (0,0) cuando es nueva. Aseguramos el tipo 'MESA' por si acaso.
      const payloadNueva = { 
        ...payload, 
        pos_x: 0, 
        pos_y: 0,
        tipo_elemento: payload.tipo_elemento || 'MESA'
      };
      return await supabase.from('cat_mesas').insert([payloadNueva]).select();
    }
  },

  async deleteMesa(id) {
    if (!hasPermission('borrar_configuracion')) {
      return { data: null, error: { message: 'Acceso Denegado.' } };
    }
    return await supabase.from('cat_mesas').delete().eq('id', id);
  },

  /**
   * 🚀 ACTUALIZADO: Actualiza las coordenadas de varias mesas de un solo golpe.
   * Utiliza el método UPSERT escalable aprovechando que la columna ID es BY DEFAULT.
   */
  async actualizarPosicionesMesas(mesasArray) {
    if (!hasPermission('editar_configuracion')) {
      return { data: null, error: { message: 'Acceso Denegado: No puedes modificar el layout de mesas.' } };
    }
    
    // UPSERT enviará todo el arreglo de golpe y actualizará en base a la Primary Key (id)
    const { data, error } = await supabase.from('cat_mesas').upsert(mesasArray).select();
    return { data, error };
  }
};