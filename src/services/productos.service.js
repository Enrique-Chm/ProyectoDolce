// Archivo: src/services/productos.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Importación de seguridad

export const productosService = {
  /**
   * Obtiene datos iniciales: productos, categorías, mapas de costos y Grupos de Modificadores.
   * Actualizado para reflejar Costo Unitario, Unidades de Medida y discriminación de Sub-recetas.
   */
  async getInitialData(sucursalId) {
    try {
      // 🛡️ Blindaje: Verificación de lectura
      if (!hasPermission('ver_productos')) {
        return { productos: [], categorias: [], costosMap: [], listaRecetas: [], gruposModificadores: [] };
      }

      const sId = sucursalId || 1;

      const [prod, cat, rec, lista, grupos] = await Promise.all([
        // 1. Productos del menú con su costo actual desde la vista
        supabase.from('vista_productos_costos').select('*').eq('sucursal_id', sId).order('nombre'),
        
        // 2. Categorías del menú
        supabase.from('cat_categorias_menu').select('*').order('nombre'),
        
        // 3. Vista de recetas completa (trae costos unitarios y totales)
        supabase.from('vista_recetas_completas').select('*').eq('sucursal_id', sId),
        
        // 4. Catálogo base de recetas para cruce de unidades de medida finales
        supabase.from('recetas')
          .select('nombre, subreceta, unidad_medida_final, cat_unidades_medida(nombre, abreviatura)')
          .eq('sucursal_id', sId),
        
        // 5. Catálogo Maestro de Grupos con sus opciones y vínculos
        supabase.from('grupos_modificadores')
          .select('id, nombre, min_seleccion, max_seleccion, opciones_modificadores(*), producto_grupos(producto_id)')
          .eq('sucursal_id', sId)
          .order('nombre')
      ]);

      if (prod.error) throw prod.error;
      if (grupos.error) throw grupos.error;

      /**
       * 💡 MAPA DE COSTOS MAESTRO (CORREGIDO)
       * Centralizamos la lógica de "esSubreceta" aquí para que el frontend 
       * no falle al filtrar por tipos de receta.
       */
      const costosMap = (rec.data || []).map(r => {
        // Buscamos la unidad de medida final definida en la receta
        const recetaExtendida = (lista.data || []).find(l => l.nombre === r.nombre);
        
        // 🛡️ Normalización de booleano: Supabase puede devolver 't', 'f', true, false o strings.
        const esSub = String(r.subreceta).toLowerCase() === 'true' || r.subreceta === true || r.subreceta === 't';

        return {
          nombre: r.nombre,
          // Precio por 1 unidad de medida (Kg, Lt, Pz)
          costo_final: r.costo_unitario_final || 0, 
          unidad_abreviatura: recetaExtendida?.cat_unidades_medida?.abreviatura || 'Pz',
          esSubreceta: esSub // 👈 Crucial para que el Hook filtre correctamente
        };
      });

      return {
        productos: prod.data || [],
        categorias: cat.data || [],
        costosMap,
        listaRecetas: lista.data || [],
        gruposModificadores: grupos.data || [] 
      };
    } catch (error) {
      console.error("Error en productosService.getInitialData:", error);
      throw error;
    }
  },

  /**
   * Guarda o actualiza un producto en la tabla productosmenu (MÉTODO CLÁSICO).
   */
  async saveProducto(payload, id = null) {
    if (!hasPermission('editar_productos')) {
      return { data: null, error: { message: "Acceso denegado: No tienes facultades para modificar el menú." } };
    }

    if (id) {
      return await supabase.from('productosmenu').update(payload).eq('id', id);
    }
    return await supabase.from('productosmenu').insert([payload]);
  },

  /**
   * 💡 MÉTODO MAESTRO 1: Guarda un Grupo Maestro en el catálogo independiente.
   */
  async saveGrupoMaestro(grupoPayload, opcionesPayload, sucursalId, grupoId = null) {
    try {
      if (grupoId && !hasPermission('editar_productos')) throw new Error("Acceso denegado para modificar grupos.");
      if (!grupoId && !hasPermission('crear_productos')) throw new Error("Acceso denegado para crear grupos.");

      let idGenerado = grupoId;

      if (grupoId) {
        const { error } = await supabase.from('grupos_modificadores').update(grupoPayload).eq('id', grupoId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('grupos_modificadores').insert([grupoPayload]).select('id').single();
        if (error) throw error;
        idGenerado = data.id;
      }

      if (grupoId) {
        await supabase.from('opciones_modificadores').delete().eq('grupo_id', grupoId);
      }

      if (opcionesPayload && opcionesPayload.length > 0) {
        const opcionesToInsert = opcionesPayload.map(op => ({
          grupo_id: idGenerado,
          subreceta_id: op.subreceta_id,
          cantidad: parseFloat(op.cantidad || 1), 
          precio_venta: parseFloat(op.precio_venta || 0),
          sucursal_id: sucursalId
        }));
        
        const { error: errOpciones } = await supabase.from('opciones_modificadores').insert(opcionesToInsert);
        if (errOpciones) throw errOpciones;
      }

      return { data: { id: idGenerado }, error: null };
    } catch (error) {
      console.error("Error al guardar grupo maestro:", error);
      return { data: null, error };
    }
  },

  /**
   * 💡 MÉTODO MAESTRO 2: Guarda el producto y lo vincula con los IDs de los grupos existentes.
   */
  async saveProductoConVinculos(productoPayload, gruposIds, sucursalId, productoId = null) {
    try {
      if (productoId && !hasPermission('editar_productos')) throw new Error("Acceso denegado para modificar.");
      if (!productoId && !hasPermission('crear_productos')) throw new Error("Acceso denegado para crear.");

      let prodIdGenerado = productoId;
      if (productoId) {
        const { error: errProd } = await supabase.from('productosmenu').update(productoPayload).eq('id', productoId);
        if (errProd) throw errProd;
      } else {
        const { data: newProd, error: errProd } = await supabase.from('productosmenu').insert([productoPayload]).select('id').single();
        if (errProd) throw errProd;
        prodIdGenerado = newProd.id;
      }

      if (productoId) {
        await supabase.from('producto_grupos').delete().eq('producto_id', productoId);
      }

      if (gruposIds && gruposIds.length > 0) {
        const links = gruposIds.map(gId => ({
          producto_id: prodIdGenerado,
          grupo_id: parseInt(gId)
        }));
        const { error: errLinks } = await supabase.from('producto_grupos').insert(links);
        if (errLinks) throw errLinks;
      }

      return { data: { id: prodIdGenerado }, error: null };
    } catch (error) {
      console.error("Error al vincular producto con grupos:", error);
      return { data: null, error };
    }
  },

  /**
   * Elimina un producto por su ID.
   */
  async deleteProducto(id) {
    if (!hasPermission('borrar_registros')) {
      return { data: null, error: { message: "Acceso denegado." } };
    }
    return await supabase.from('productosmenu').delete().eq('id', id);
  },

  /**
   * Elimina un Grupo Maestro por su ID.
   */
  async deleteGrupo(id) {
    if (!hasPermission('borrar_registros')) {
      return { data: null, error: { message: "Acceso denegado." } };
    }
    return await supabase.from('grupos_modificadores').delete().eq('id', id);
  }
};