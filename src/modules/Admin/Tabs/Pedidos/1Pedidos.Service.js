// src/modules/Admin/Tabs/Pedidos/1Pedidos.Service.js
import { supabase } from '../../../../lib/supabaseClient';

// Registros por página para pedidos activos
const LIMITE_PEDIDOS = 50;

export const PedidosService = {

  // ==========================================
  // 1. DASHBOARD: OBTENER ÓRDENES ACTIVAS
  // ==========================================
  /**
   * Recupera las órdenes con estatus Pendiente o En Proceso.
   * PAGINACIÓN: Carga en bloques de LIMITE_PEDIDOS con offset.
   * Retorna { data, count, error } donde count es el total sin paginar.
   * @param {boolean}  tieneAccesoGlobal - Si true, no se aplica filtro de sucursal
   * @param {string[]} sucursalesIds     - Arreglo de UUIDs de sucursales del trabajador
   * @param {number}   desde             - Offset para paginación (default: 0)
   */
  async getOrdenesActivas(tieneAccesoGlobal, sucursalesIds = [], desde = 0) {
    let query = supabase
      .from('BD_Ordenes_Compra')
      .select(`
        id,
        folio,
        estatus,
        prioridad,
        notas,
        proveedor_id,
        solicitante_id,
        sucursal_id,
        created_at,
        updated_at,
        proveedor:Cat_Proveedores(nombre),
        solicitante:Cat_Trabajadores(nombre_completo),
        sucursal:Cat_sucursales(nombre)
      `, { count: 'exact' })
      .in('estatus', ['Pendiente', 'En Proceso'])
      .order('prioridad', { ascending: false })
      .order('created_at', { ascending: false })
      .range(desde, desde + LIMITE_PEDIDOS - 1);

    if (!tieneAccesoGlobal && sucursalesIds.length > 0) {
      query = query.in('sucursal_id', sucursalesIds);
    }

    const { data, error, count } = await query;
    return { data, error, count };
  },

  // ==========================================
  // 2. NUEVO PEDIDO: CARGA DE DATOS PARA EL CARRITO
  // ==========================================
  /**
   * Trae productos marcados como activos para el catálogo de selección.
   */
  async getProductosParaOrden() {
    const { data, error } = await supabase
      .from('BD_Productos')
      .select(`
        id,
        nombre,
        marca,
        presentacion,
        contenido,
        proveedor_id,
        categoria_id,
        um:Cat_UM(id, nombre, abreviatura),
        proveedor:Cat_Proveedores!proveedor_id(id, nombre)
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true });
    return { data, error };
  },

  /**
   * Carga los proveedores activos para el selector de la cabecera del pedido.
   */
  async getCatalogosParaOrden() {
    const { data, error } = await supabase
      .from('Cat_Proveedores')
      .select('id, nombre')
      .eq('estatus', 'Activo')
      .order('nombre', { ascending: true });
    return {
      proveedores: data || [],
      error: error
    };
  },

  // ==========================================
  // 3. CREACIÓN MASIVA (CABECERA + DETALLES)
  // ==========================================
  /**
   * Procesa la creación de una orden completa.
   */
  async crearNuevaOrden(ordenCabecera, listaProductos) {
    const payloadCabecera = {
      ...ordenCabecera,
      notas: ordenCabecera.notas || ordenCabecera.notes || ''
    };
    delete payloadCabecera.notes;

    const { data: nuevaOrden, error: errorCabecera } = await supabase
      .from('BD_Ordenes_Compra')
      .insert([payloadCabecera])
      .select()
      .single();

    if (errorCabecera) {
      console.error("Error al insertar cabecera:", errorCabecera.message);
      throw errorCabecera;
    }

    const detallesFormateados = listaProductos.map(item => ({
      orden_id: nuevaOrden.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      estatus: 'Pendiente'
    }));

    const { error: errorDetalles } = await supabase
      .from('BD_Ordenes_Detalle')
      .insert(detallesFormateados);

    if (errorDetalles) {
      console.error("Error al insertar detalles:", errorDetalles.message);
      throw errorDetalles;
    }

    return { data: nuevaOrden, error: null };
  },

  // ==========================================
  // 4. CHECKLIST Y GESTIÓN DE ÓRDENES
  // ==========================================
  /**
   * Obtiene toda la información de una orden específica y sus partidas.
   *
   * SOLUCIÓN AL JOIN AUTO-REFERENCIAL:
   * Supabase/PostgREST no resuelve correctamente un join de BD_Productos → BD_Productos
   * cuando está anidado a 4 niveles de profundidad (Orden → Detalle → Producto → Equivalente).
   *
   * Estrategia en 3 pasos:
   *   PASO 1 — Query principal sin el join problemático (sí traemos producto_equivalente_id).
   *   PASO 2 — Query plana y directa a BD_Productos con los IDs equivalentes recolectados.
   *   PASO 3 — Fusión en memoria: inyectamos el objeto equivalente en cada detalle.
   */
  async getDetalleDeOrden(ordenId) {
    const { data, error } = await supabase
      .from('BD_Ordenes_Compra')
      .select(`
        id,
        folio,
        estatus,
        prioridad,
        notas,
        solicitante_id,
        proveedor_id,
        sucursal_id,
        created_at,
        updated_at,
        proveedor:Cat_Proveedores(nombre, numero_contacto),
        solicitante:Cat_Trabajadores(nombre_completo),
        sucursal:Cat_sucursales(nombre),
        detalles:BD_Ordenes_Detalle(
          id,
          producto_id,
          cantidad,
          estatus,
          producto:BD_Productos(
            id,
            nombre,
            marca,
            presentacion,
            contenido,
            producto_equivalente_id,
            proveedor:Cat_Proveedores(nombre),
            um:Cat_UM(abreviatura)
          )
        )
      `)
      .eq('id', ordenId)
      .single();

    if (error) return { data, error };

    const idsEquivalentes = (data.detalles || [])
      .map(d => d.producto?.producto_equivalente_id)
      .filter(Boolean);

    if (idsEquivalentes.length === 0) return { data, error: null };

    const { data: productosEquivalentes, error: errorEquiv } = await supabase
      .from('BD_Productos')
      .select(`
        id,
        nombre,
        marca,
        presentacion,
        contenido,
        proveedor:Cat_Proveedores(nombre)
      `)
      .in('id', idsEquivalentes);

    if (errorEquiv) {
      console.error("Aviso: No se pudieron cargar los productos equivalentes:", errorEquiv.message);
      return { data, error: null };
    }

    const mapaEquivalentes = (productosEquivalentes || []).reduce((acc, prod) => {
      acc[prod.id] = prod;
      return acc;
    }, {});

    const dataEnriquecida = {
      ...data,
      detalles: (data.detalles || []).map(detalle => {
        const equivId = detalle.producto?.producto_equivalente_id;
        return {
          ...detalle,
          producto: {
            ...detalle.producto,
            producto_equivalente: equivId ? (mapaEquivalentes[equivId] ?? null) : null
          }
        };
      })
    };

    return { data: dataEnriquecida, error: null };
  },

  /**
   * Actualiza el estatus de un solo producto dentro de una orden.
   */
  async actualizarEstatusItem(detalleId, nuevoEstatus) {
    const { data, error } = await supabase
      .from('BD_Ordenes_Detalle')
      .update({ estatus: nuevoEstatus })
      .eq('id', detalleId)
      .select();
    return { data, error };
  },

  // ==========================================
  // 5. CAMBIO DE ESTATUS — VALIDADO EN SERVIDOR
  // ==========================================

  /**
   * Cambia el estatus de una orden usando la RPC 'cambiar_estatus_orden'.
   * VALIDACIÓN SERVER-SIDE: La RPC valida transiciones permitidas y estampa
   * automáticamente quién finalizó o canceló el pedido en las notas.
   *
   * Transiciones permitidas:
   *   Pendiente  → En Proceso, Completado, Cancelado
   *   En Proceso → Completado, Cancelado
   *   Completado → (ninguna — estado final)
   *   Cancelado  → (ninguna — estado final)
   *
   * @param {string} ordenId       - UUID de la orden
   * @param {string} nuevoEstatus  - Estatus destino
   * @param {string} usuarioId     - UUID del usuario que hace el cambio (para firma)
   */
  async actualizarEstatusOrden(ordenId, nuevoEstatus, usuarioId = null) {
    const { data: resultado, error } = await supabase.rpc('cambiar_estatus_orden', {
      p_orden_id:      ordenId,
      p_nuevo_estatus: nuevoEstatus,
      p_usuario_id:    usuarioId
    });

    if (error) return { data: null, error };

    // La RPC retorna { error: bool, mensaje: string, ... }
    if (resultado?.error) {
      return { data: null, error: { message: resultado.mensaje } };
    }

    return { data: resultado, error: null };
  },

  /**
   * Mueve una orden a estatus Cancelado — usa la misma RPC validada.
   * @param {string} ordenId    - UUID de la orden
   * @param {string} usuarioId  - UUID del usuario que cancela (para firma)
   */
  async cancelarOrden(ordenId, usuarioId = null) {
    return this.actualizarEstatusOrden(ordenId, 'Cancelado', usuarioId);
  },

  /**
   * Actualiza únicamente las notas de una orden sin modificar su estatus.
   * Este método NO pasa por la RPC porque solo modifica notas, no estatus.
   * Se mantiene para casos donde se necesite actualizar notas sin cambiar estado.
   */
  async actualizarNotasOrden(ordenId, notas) {
    const { data, error } = await supabase
      .from('BD_Ordenes_Compra')
      .update({ notas })
      .eq('id', ordenId)
      .select();
    return { data, error };
  }
};