// src/modules/Admin/Tabs/Pedidos/1Pedidos.Service.js
import { supabase } from '../../../../lib/supabaseClient';

export const PedidosService = {
  
  // ==========================================
  // 1. DASHBOARD: OBTENER ÓRDENES ACTIVAS
  // ==========================================
  /**
   * Recupera las órdenes con estatus Pendiente o En Proceso.
   * Incluye la relación con proveedor, solicitante y sucursal.
   */
  async getOrdenesActivas() {
    const { data, error } = await supabase
      .from('BD_Ordenes_Compra')
      .select(`
        *,
        proveedor:Cat_Proveedores(nombre),
        solicitante:Cat_Trabajadores(nombre_completo),
        sucursal:Cat_sucursales(nombre)
      `)
      // Solo órdenes que requieren atención inmediata en el dashboard
      .in('estatus', ['Pendiente', 'En Proceso']) 
      .order('prioridad', { ascending: false })
      .order('created_at', { ascending: false });
      
    return { data, error };
  },

  // ==========================================
  // 2. NUEVO PEDIDO: CARGA DE DATOS PARA EL CARRITO
  // ==========================================
  
  /**
   * Trae productos marcados como activos para el catálogo de selección.
   * Incluye la Unidad de Medida, el Proveedor, la Presentación y el Contenido.
   * Se añade categoria_id para la validación de permisos por rol.
   * Se agrega la relación explícita '!proveedor_id' para evitar ambigüedades.
   */
  async getProductosParaOrden() {
    const { data, error } = await supabase
      .from('BD_Productos')
      .select(`
        id, 
        nombre, 
        marca, 
        costo_actual, 
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
   * Primero inserta la cabecera para obtener el ID y luego las partidas.
   */
  async crearNuevaOrden(ordenCabecera, listaProductos) {
    // Normalización de campos para asegurar compatibilidad con el esquema
    const payloadCabecera = {
      ...ordenCabecera,
      notas: ordenCabecera.notas || ordenCabecera.notes || '' 
    };
    
    // Eliminación de campos redundantes o mal escritos del front
    delete payloadCabecera.notes;

    // A. Insertar la Cabecera de la Orden
    const { data: nuevaOrden, error: errorCabecera } = await supabase
      .from('BD_Ordenes_Compra')
      .insert([payloadCabecera])
      .select()
      .single();

    if (errorCabecera) {
        console.error("Error al insertar cabecera:", errorCabecera.message);
        throw errorCabecera;
    }

    // B. Preparar los detalles vinculados al ID generado
    const detallesFormateados = listaProductos.map(item => ({
      orden_id: nuevaOrden.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      costo_unitario: item.costo_unitario,
      estatus: 'Pendiente'
    }));

    // C. Inserción masiva de productos
    const { error: errorDetalles } = await supabase
      .from('BD_Ordenes_Detalle')
      .insert(detallesFormateados);

    if (errorDetalles) {
        console.error("Error al insertar detalles:", errorDetalles.message);
        // Nota: En un entorno ideal aquí se manejaría una reversión (rollback) 
        // de la cabecera si fallan los detalles.
        throw errorDetalles;
    }

    return { data: nuevaOrden, error: null };
  },

  // ==========================================
  // 4. CHECKLIST Y GESTIÓN DE ÓRDENES
  // ==========================================
  /**
   * Obtiene toda la información de una orden específica y sus partidas.
   */
  async getDetalleDeOrden(ordenId) {
    const { data, error } = await supabase
      .from('BD_Ordenes_Compra')
      .select(`
        *,
        proveedor:Cat_Proveedores(nombre, numero_contacto),
        solicitante:Cat_Trabajadores(nombre_completo),
        sucursal:Cat_sucursales(nombre),
        detalles:BD_Ordenes_Detalle (
          id, 
          cantidad, 
          estatus, 
          costo_unitario,
          producto:BD_Productos (
            nombre, 
            marca, 
            presentacion,
            um:Cat_UM(abreviatura)
          )
        )
      `)
      .eq('id', ordenId)
      .single();
      
    return { data, error };
  },

  /**
   * Actualiza el estatus de un solo producto dentro de una orden (ej: 'Pendiente' -> 'Comprado').
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
   * Cambia el estatus global de la orden (ej: 'En Proceso' -> 'Completado').
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

  // ==========================================
  // 5. HISTORIAL: OBTENER ÓRDENES POR FECHAS
  // ==========================================
  /**
   * Recupera las órdenes con estatus Completado o Cancelado dentro de un rango de fechas.
   * @param {string} fechaInicio - Fecha inicial en formato YYYY-MM-DD
   * @param {string} fechaFin - Fecha final en formato YYYY-MM-DD
   */
  async getHistorialPorFechas(fechaInicio, fechaFin) {
    const inicioIso = `${fechaInicio}T00:00:00.000Z`;
    const finIso = `${fechaFin}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from('BD_Ordenes_Compra')
      .select(`
        *,
        proveedor:Cat_Proveedores(nombre),
        solicitante:Cat_Trabajadores(nombre_completo),
        sucursal:Cat_sucursales(nombre)
      `)
      .in('estatus', ['Completado', 'Cancelado'])
      .gte('created_at', inicioIso)
      .lte('created_at', finIso)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // ==========================================
  // 6. TRASPASO AL SEGUNDO PROVEEDOR
  // ==========================================
  /**
   * Toma un ítem que no hay en stock y genera una nueva orden para el segundo proveedor.
   * @param {string} detalleId - ID de la partida en BD_Ordenes_Detalle
   * @param {string} productoId - ID del producto en BD_Productos
   */
  async cambiarAlSegundoProveedor(detalleId, productoId) {
    try {
      // 1. Consultar información del detalle actual junto con su orden y datos del producto
      const { data: item, error: errItem } = await supabase
        .from('BD_Ordenes_Detalle')
        .select(`
          *,
          orden:BD_Ordenes_Compra(*),
          producto:BD_Productos(id, nombre, proveedor_secundario_id)
        `)
        .eq('id', detalleId)
        .single();

      if (errItem || !item) {
        throw new Error(errItem?.message || 'No se pudo encontrar el detalle del pedido');
      }

      const segundoProveedorId = item.producto?.proveedor_secundario_id;

      if (!segundoProveedorId) {
        throw new Error('Este insumo no tiene asignado un segundo proveedor en el catálogo.');
      }

      // 2. Generar nueva orden de compra vinculada al segundo proveedor
      const folio = `OC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const totalEstimado = Number(item.cantidad) * Number(item.costo_unitario);

      const nuevaOrdenCabecera = {
        folio,
        solicitante_id: item.orden.solicitante_id,
        sucursal_id: item.orden.sucursal_id,
        proveedor_id: segundoProveedorId,
        prioridad: item.orden.prioridad,
        total_estimado: totalEstimado,
        estatus: 'Pendiente',
        notas: `Reasignado por falta de stock de la orden original: ${item.orden.folio}`
      };

      const { data: nuevaOrden, error: errNuevaCabecera } = await supabase
        .from('BD_Ordenes_Compra')
        .insert([nuevaOrdenCabecera])
        .select()
        .single();

      if (errNuevaCabecera) throw errNuevaCabecera;

      // 3. Crear el nuevo detalle en la nueva orden
      const nuevoDetalle = {
        orden_id: nuevaOrden.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario,
        estatus: 'Pendiente'
      };

      const { error: errNuevoDetalle } = await supabase
        .from('BD_Ordenes_Detalle')
        .insert([nuevoDetalle]);

      if (errNuevoDetalle) throw errNuevoDetalle;

      // 4. Retirar el ítem de la orden original
      const { error: errBorrado } = await supabase
        .from('BD_Ordenes_Detalle')
        .delete()
        .eq('id', detalleId);

      if (errBorrado) throw errBorrado;

      // 5. Restar el monto del ítem removido de la orden original
      const nuevoTotalOrdenOriginal = Math.max(0, Number(item.orden.total_estimado) - totalEstimado);
      await supabase
        .from('BD_Ordenes_Compra')
        .update({ total_estimado: nuevoTotalOrdenOriginal })
        .eq('id', item.orden.id);

      return { data: nuevaOrden, error: null };

    } catch (err) {
      console.error("Error al transferir a segundo proveedor:", err.message || err);
      return { data: null, error: err };
    }
  }
};