// Archivo: src/services/productos.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Importación de seguridad

export const productosService = {
  /**
   * Obtiene datos iniciales: productos, categorías, mapas de costos y Grupos de Modificadores.
   */
  async getInitialData() {
    try {
      // 🛡️ Blindaje: Verificación de lectura
      if (!hasPermission('ver_productos')) {
        return { productos: [], categorias: [], costosMap: [], listaRecetas: [], gruposModificadores: [] };
      }

      const [prod, cat, rec, lista, grupos] = await Promise.all([
        // Ajustado a tu tabla real 'productosmenu' a través de la vista
        supabase.from('vista_productos_costos').select('*').order('nombre'),
        supabase.from('cat_categorias_menu').select('*').order('nombre'),
        supabase.from('vista_recetas_completas').select('*'),
        supabase.from('recetas').select('nombre, subreceta'),
        // 💡 NUEVO: Traemos los grupos maestros, sus opciones y a qué producto pertenecen
        supabase.from('grupos_modificadores')
          .select('id, nombre, min_seleccion, max_seleccion, opciones_modificadores(*), producto_grupos(producto_id)')
      ]);

      if (prod.error) throw prod.error;
      if (grupos.error) throw grupos.error;

      const costosMap = (rec.data || []).map(r => ({
        nombre: r.nombre,
        costo_final: r.costo_total_receta || 0
      }));

      return {
        productos: prod.data || [],
        categorias: cat.data || [],
        costosMap,
        listaRecetas: lista.data || [],
        gruposModificadores: grupos.data || [] // 👈 Exportamos los grupos estructurados
      };
    } catch (error) {
      console.error("Error en productosService:", error);
      throw error;
    }
  },

  /**
   * Guarda o actualiza un producto en la tabla productosmenu (MÉTODO CLÁSICO).
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
   * 💡 NUEVO MÉTODO MAESTRO: Guarda el Producto + Sus Grupos + Sus Opciones en cascada.
   */
  async saveProductoConGrupos(productoPayload, gruposPayload, sucursalId, productoId = null) {
    try {
      // 🛡️ Blindaje de permisos
      if (productoId && !hasPermission('editar_productos')) throw new Error("Acceso denegado para modificar.");
      if (!productoId && !hasPermission('crear_productos')) throw new Error("Acceso denegado para crear.");

      // 1. Guardar Producto Principal en productosmenu
      let prodIdGenerado = productoId;
      if (productoId) {
        const { error: errProd } = await supabase.from('productosmenu').update(productoPayload).eq('id', productoId);
        if (errProd) throw errProd;
      } else {
        const { data: newProd, error: errProd } = await supabase.from('productosmenu').insert([productoPayload]).select('id').single();
        if (errProd) throw errProd;
        prodIdGenerado = newProd.id;
      }

      // 2. Limpieza Quirúrgica (Evita duplicados o datos huérfanos al editar)
      // Si estamos editando, borramos los grupos viejos de este producto para insertar los nuevos actualizados.
      if (productoId) {
        const { data: links } = await supabase.from('producto_grupos').select('grupo_id').eq('producto_id', productoId);
        if (links && links.length > 0) {
          const idsGruposViejos = links.map(l => l.grupo_id);
          // Gracias al ON DELETE CASCADE, al borrar el grupo se borran sus opciones y sus vínculos automáticamente
          await supabase.from('grupos_modificadores').delete().in('id', idsGruposViejos);
        }
      }

      // 3. Inserción de Nuevos Grupos y sus Opciones
      if (gruposPayload && gruposPayload.length > 0) {
        for (const grupo of gruposPayload) {
          
          // A. Crear el Grupo
          const { data: newGrupo, error: errGrupo } = await supabase.from('grupos_modificadores').insert([{
            nombre: grupo.nombre_grupo,
            min_seleccion: grupo.obligatorio ? 1 : 0,
            max_seleccion: grupo.maximo || 1,
            sucursal_id: sucursalId
          }]).select('id').single();
          
          if (errGrupo) throw errGrupo;
          const idGrupo = newGrupo.id;

          // B. Vincular Grupo con el Producto
          await supabase.from('producto_grupos').insert([{
            producto_id: prodIdGenerado,
            grupo_id: idGrupo
          }]);

          // C. Insertar las opciones dentro de este grupo
          if (grupo.opciones && grupo.opciones.length > 0) {
            const opcionesToInsert = grupo.opciones.map(op => ({
              grupo_id: idGrupo,
              subreceta_id: op.subreceta_id, // Guardamos la subreceta seleccionada
              precio_venta: parseFloat(op.precio_venta || 0),
              sucursal_id: sucursalId
            }));
            
            const { error: errOpciones } = await supabase.from('opciones_modificadores').insert(opcionesToInsert);
            if (errOpciones) throw errOpciones;
          }
        }
      }

      return { data: { id: prodIdGenerado }, error: null };
    } catch (error) {
      console.error("Error crítico en saveProductoConGrupos:", error);
      return { data: null, error };
    }
  },

  /**
   * Elimina un producto por su ID.
   */
  async deleteProducto(id) {
    // 🛡️ Blindaje: Verificación de borrado
    if (!hasPermission('borrar_registros')) {
      return { data: null, error: { message: "Acceso denegado: Se requiere permiso de administrador para eliminar productos." } };
    }

    // Al borrar el producto principal, las tablas vinculadas se limpian solas gracias al CASCADE que configuramos en el SQL
    return await supabase.from('productosmenu').delete().eq('id', id);
  }
};