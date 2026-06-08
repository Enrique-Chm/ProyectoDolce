// src/modules/Admin/Tabs/Pedidos/1Pedidos.Service.js
import { supabase } from '../../../../lib/supabaseClient';

export const PedidosService = {

  // ==========================================
  // 1. DASHBOARD: OBTENER ÓRDENES ACTIVAS
  // ==========================================
  /**
   * Recupera las órdenes con estatus Pendiente o En Proceso.
   * Incluye la relación con proveedor, solicitante y sucursal.
   * CORRECCIÓN P1: Ahora recibe el arreglo completo de sucursalesIds para
   * filtrar con .in() en lugar de un solo ID con .eq(), soportando
   * trabajadores asignados a múltiples sucursales.
   * @param {boolean} tieneAccesoGlobal - Si es true, no se aplica filtro de sucursal
   * @param {string[]} sucursalesIds    - Arreglo de UUIDs de sucursales del trabajador
   */
  async getOrdenesActivas(tieneAccesoGlobal, sucursalesIds = []) {
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
      `)
      .in('estatus', ['Pendiente', 'En Proceso'])
      .order('prioridad', { ascending: false })
      .order('created_at', { ascending: false });

    // CORRECCIÓN P1: El filtro ahora se aplica en BD con .in() sobre el arreglo
    // completo de sucursales del trabajador, eliminando el filtrado en memoria.
    if (!tieneAccesoGlobal && sucursalesIds.length > 0) {
      query = query.in('sucursal_id', sucursalesIds);
    }

    const { data, error } = await query;
    return { data, error };
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
   * El dato llega null aunque exista en BD.
   *
   * Estrategia en 2 pasos:
   *   PASO 1 — Query principal sin el join problemático (sí traemos producto_equivalente_id).
   *   PASO 2 — Query plana y directa a BD_Productos con los IDs equivalentes recolectados.
   *   PASO 3 — Fusión en memoria: inyectamos el objeto equivalente en cada detalle.
   *
   * CORRECCIÓN P1: select('*') reemplazado por columnas explícitas.
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

    // Si la query principal falla, retornamos el error de inmediato
    if (error) return { data, error };

    // ── PASO 2: Recolectar IDs de productos equivalentes ────────────────────
    const idsEquivalentes = (data.detalles || [])
      .map(d => d.producto?.producto_equivalente_id)
      .filter(Boolean); // elimina nulls y undefined

    // Si ningún producto tiene equivalente, retornamos sin hacer más queries
    if (idsEquivalentes.length === 0) return { data, error: null };

    // Query plana y directa: trae los equivalentes con su proveedor sin anidamiento problemático
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
      // No es un error fatal: la orden carga correctamente, solo sin datos del equivalente
      console.error("Aviso: No se pudieron cargar los productos equivalentes:", errorEquiv.message);
      return { data, error: null };
    }

    // ── PASO 3: Construir mapa id → producto para fusión O(1) ───────────────
    const mapaEquivalentes = (productosEquivalentes || []).reduce((acc, prod) => {
      acc[prod.id] = prod;
      return acc;
    }, {});

    // Inyectamos el objeto equivalente resuelto dentro de cada detalle
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
  }
};