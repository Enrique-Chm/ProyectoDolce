// Archivo: src/services/productos.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Importación de seguridad
import toast from 'react-hot-toast'; // 🍞 Feedback visual

export const productosService = {
  /**
   * Obtiene datos iniciales: productos, categorías, mapas de costos y Grupos de Modificadores.
   */
  async getInitialData(sucursalId) {
    try {
      // 🛡️ Blindaje: Verificación de lectura
      // El Mesero DEBE tener este permiso marcado en la matriz para ver el menú
      if (!hasPermission('ver_productos')) {
        console.warn("Bloqueo de seguridad: El usuario no tiene permiso 'ver_productos'");
        return { productos: [], categorias: [], costosMap: [], listaRecetas: [], gruposModificadores: [] };
      }

      const sId = sucursalId || 1;

      // 🚀 Ejecución en paralelo para máxima velocidad
      const [prod, cat, rec, lista, grupos] = await Promise.all([
        supabase.from('vista_productos_costos').select('*').eq('sucursal_id', sId).order('nombre'),
        supabase.from('cat_categorias_menu').select('*').order('nombre'),
        supabase.from('vista_recetas_completas').select('*').eq('sucursal_id', sId),
        supabase.from('recetas')
          .select('nombre, subreceta, unidad_medida_final, cat_unidades_medida(nombre, abreviatura)')
          .eq('sucursal_id', sId),
        supabase.from('grupos_modificadores')
          .select('id, nombre, min_seleccion, max_seleccion, opciones_modificadores(*), producto_grupos(producto_id)')
          .eq('sucursal_id', sId)
          .order('nombre')
      ]);

      if (prod.error) throw prod.error;
      if (grupos.error) throw grupos.error;

      /**
       * 💡 MAPA DE COSTOS MAESTRO
       * Centralizamos la lógica de "esSubreceta" y unidades de medida.
       */
      const costosMap = (rec.data || []).map(r => {
        const recetaExtendida = (lista.data || []).find(l => l.nombre === r.nombre);
        
        // 🛡️ Normalización de booleano: Supabase maneja varios formatos para bool.
        const esSub = String(r.subreceta).toLowerCase() === 'true' || r.subreceta === true || r.subreceta === 't';

        return {
          nombre: r.nombre,
          costo_final: r.costo_unitario_final || 0, 
          unidad_abreviatura: recetaExtendida?.cat_unidades_medida?.abreviatura || 'Pz',
          esSubreceta: esSub 
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
      toast.error("Error al sincronizar datos del menú.");
      throw error;
    }
  },

  /**
   * Guarda o actualiza un producto básico.
   */
  async saveProducto(payload, id = null) {
    if (!hasPermission('editar_productos')) {
      toast.error("No tienes permisos para editar el menú.");
      return { data: null, error: { message: "Acceso denegado" } };
    }

    const tId = toast.loading(id ? "Actualizando producto..." : "Creando producto...");
    try {
      const { data, error } = id 
        ? await supabase.from('productosmenu').update(payload).eq('id', id).select()
        : await supabase.from('productosmenu').insert([payload]).select();

      if (error) throw error;
      toast.success(id ? "Producto actualizado" : "Producto creado", { id: tId });
      return { data, error: null };
    } catch (error) {
      toast.error("Error al guardar: " + error.message, { id: tId });
      return { data: null, error };
    }
  },

  /**
   * 💡 MÉTODO MAESTRO: Guarda un Grupo y sus Opciones.
   */
  async saveGrupoMaestro(grupoPayload, opcionesPayload, sucursalId, grupoId = null) {
    const tId = toast.loading("Procesando grupo maestro...");
    try {
      if (grupoId && !hasPermission('editar_productos')) throw new Error("Acceso denegado.");
      if (!grupoId && !hasPermission('crear_productos')) throw new Error("Acceso denegado.");

      let idGenerado = grupoId;

      // 1. Guardar/Actualizar Cabecera del Grupo
      if (grupoId) {
        const { error } = await supabase.from('grupos_modificadores').update(grupoPayload).eq('id', grupoId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('grupos_modificadores').insert([grupoPayload]).select('id').single();
        if (error) throw error;
        idGenerado = data.id;
      }

      // 2. Limpiar opciones viejas si es edición
      if (grupoId) {
        await supabase.from('opciones_modificadores').delete().eq('grupo_id', grupoId);
      }

      // 3. Insertar nuevas opciones
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

      toast.success("Grupo maestro guardado", { id: tId });
      return { data: { id: idGenerado }, error: null };
    } catch (error) {
      toast.error("Error: " + error.message, { id: tId });
      return { data: null, error };
    }
  },

  /**
   * 💡 MÉTODO MAESTRO: Guarda producto y vincula grupos.
   */
  async saveProductoConVinculos(productoPayload, gruposIds, sucursalId, productoId = null) {
    const tId = toast.loading("Vinculando producto y grupos...");
    try {
      if (productoId && !hasPermission('editar_productos')) throw new Error("Acceso denegado.");
      if (!productoId && !hasPermission('crear_productos')) throw new Error("Acceso denegado.");

      // Limpieza de payload para evitar objetos anidados
      const cleanProd = { ...productoPayload };
      delete cleanProd.grupos;

      let prodIdGenerado = productoId;
      if (productoId) {
        const { error: errProd } = await supabase.from('productosmenu').update(cleanProd).eq('id', productoId);
        if (errProd) throw errProd;
      } else {
        const { data: newProd, error: errProd } = await supabase.from('productosmenu').insert([cleanProd]).select('id').single();
        if (errProd) throw errProd;
        prodIdGenerado = newProd.id;
      }

      // Actualizar vínculos
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

      toast.success("Producto configurado correctamente", { id: tId });
      return { data: { id: prodIdGenerado }, error: null };
    } catch (error) {
      toast.error("Error: " + error.message, { id: tId });
      return { data: null, error };
    }
  },

  async deleteProducto(id) {
    if (!hasPermission('borrar_registros')) {
      toast.error("No tienes permisos para eliminar.");
      return { error: "Acceso denegado" };
    }
    const tId = toast.loading("Eliminando producto...");
    try {
      const { error } = await supabase.from('productosmenu').delete().eq('id', id);
      if (error) throw error;
      toast.success("Producto eliminado", { id: tId });
      return { error: null };
    } catch (error) {
      toast.error("Error al eliminar", { id: tId });
      return { error };
    }
  },

  async deleteGrupo(id) {
    if (!hasPermission('borrar_registros')) {
      toast.error("No tienes permisos para eliminar grupos.");
      return { error: "Acceso denegado" };
    }
    const tId = toast.loading("Eliminando grupo maestro...");
    try {
      const { error } = await supabase.from('grupos_modificadores').delete().eq('id', id);
      if (error) throw error;
      toast.success("Grupo eliminado", { id: tId });
      return { error: null };
    } catch (error) {
      toast.error("Error al eliminar", { id: tId });
      return { error };
    }
  }
};