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
      `, { count: 'exact' })  // PAGINACIÓN: solicita el conteo total
      .in('estatus', ['Pendiente', 'En Proceso'])
      .order('prioridad', { ascending: false })
      .order('created_at', { ascending: false })
      .range(desde, desde + LIMITE_PEDIDOS - 1);  // PAGINACIÓN: rango de registros

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
   * Estrategia en 2 pasos:
   *   PASO 1 — Query principal sin el join problemático (sí traemos producto_equivalente_id).
   *   PASO 2 — Query plana y directa a BD_Productos con los IDs equivalentes recolectados.
   *   PASO 3 — Fusión en memoria: inyectamos el objeto equivalente en cada detalle.
   */
  async getDetalleDeOrden(ordenId) {
    // ── PASO 1: Query principal (sin join auto-referencial) ──────────────────
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

    // ── PASO 2: Recolectar IDs de productos equivalentes ────────────────────
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

    // ── PASO 3: Construir mapa id → producto para fusión O(1) ───────────────
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

  /**
   * Cambia el estatus global de la orden.
   */
  async actualizarEstatusOrden(ordenId, nuevoEstatus) {
    const { data, error } = await supabase
      .from('BD_Ordenes_Compra')
      .update({ estatus: nuevoEstatus })
      .eq('id', ordenId)
      .select();
    return { data, error };
  },

  /**
   * Mueve una orden a estatus Cancelado.
   */
  async cancelarOrden(ordenId) {
    const { data, error } = await supabase
      .from('BD_Ordenes_Compra')
      .update({ estatus: 'Cancelado' })
      .eq('id', ordenId)
      .select();
    return { data, error };
  },
    /**
   * Actualiza únicamente las notas de una orden sin modificar su estatus.
   * Usado para estampar la firma de finalización antes del cambio de estatus.
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