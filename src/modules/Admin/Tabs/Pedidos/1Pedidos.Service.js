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
    // Normalización de campos para asegurar compatibilidad con el esquema
    const payloadCabecera = {
      ...ordenCabecera,
      notas: ordenCabecera.notas || ordenCabecera.notes || '' 
    };
    
    // Eliminación de campos redundantes
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
      estatus: 'Pendiente'
    }));

    // C. Inserción masiva de productos
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
   * IMPORTANTE: Traemos el proveedor_secundario_id para la lógica de "No hay".
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
          producto_id,
          cantidad, 
          estatus, 
          producto:BD_Productos (
            id,
            nombre, 
            marca, 
            presentacion,
            contenido,
            proveedor_secundario_id,
            um:Cat_UM(abreviatura)
          )
        )
      `)
      .eq('id', ordenId)
      .single();
      
    return { data, error };
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
  // 5. TRASPASO AL SEGUNDO PROVEEDOR
  // ==========================================
  /**
   * Toma un ítem que no hay en stock y genera una nueva orden para el segundo proveedor.
   * Realiza la creación de la nueva orden y la eliminación de la anterior de forma secuencial.
   */
  async cambiarAlSegundoProveedor(detalleId, productoId) {
    try {
      // 1. Consultar información necesaria del detalle y la orden madre
      const { data: item, error: errItem } = await supabase
        .from('BD_Ordenes_Detalle')
        .select(`
          cantidad,
          producto_id,
          orden:BD_Ordenes_Compra(folio, solicitante_id, sucursal_id, prioridad),
          producto:BD_Productos(nombre, proveedor_secundario_id)
        `)
        .eq('id', detalleId)
        .single();

      if (errItem || !item) throw new Error('No se pudo encontrar el detalle del pedido original.');

      const segundoProveedorId = item.producto?.proveedor_secundario_id;
      if (!segundoProveedorId) {
        throw new Error(`El insumo "${item.producto.nombre}" no tiene un segundo proveedor asignado.`);
      }

      // 2. Generar nueva orden para el segundo proveedor
      const randomStr = Math.random().toString(36).substring(7).toUpperCase();
      const nuevoFolio = `REQ-REASIG-${randomStr}`;

      const { data: nuevaOrden, error: errNuevaCabecera } = await supabase
        .from('BD_Ordenes_Compra')
        .insert([{
          folio: nuevoFolio,
          solicitante_id: item.orden.solicitante_id,
          sucursal_id: item.orden.sucursal_id,
          proveedor_id: segundoProveedorId,
          prioridad: item.orden.prioridad,
          estatus: 'Pendiente',
          notas: `Reasignado automáticamente por falta de stock de la orden original: ${item.orden.folio}`
        }])
        .select()
        .single();

      if (errNuevaCabecera) throw errNuevaCabecera;

      // 3. Crear el nuevo detalle vinculado a la nueva orden
      const { error: errNuevoDetalle } = await supabase
        .from('BD_Ordenes_Detalle')
        .insert([{
          orden_id: nuevaOrden.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          estatus: 'Pendiente'
        }]);

      if (errNuevoDetalle) throw errNuevoDetalle;

      // 4. Retirar el ítem de la orden original (Limpieza del checklist)
      const { error: errBorrado } = await supabase
        .from('BD_Ordenes_Detalle')
        .delete()
        .eq('id', detalleId);

      if (errBorrado) throw errBorrado;

      return { success: true, nuevoFolio };

    } catch (err) {
      console.error("Fallo crítico en reasignación:", err.message);
      return { success: false, error: err.message };
    }
  }
};