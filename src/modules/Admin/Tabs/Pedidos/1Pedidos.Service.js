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
   * Incluye la Unidad de Medida y el Proveedor para sugerencias.
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
        proveedor_id,
        um:Cat_UM(id, nombre, abreviatura),
        proveedor:Cat_Proveedores(id, nombre)
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
  }
};