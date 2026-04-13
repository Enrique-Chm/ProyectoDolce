// src/modules/Admin/Tabs/Pedidos/1Pedidos.Service.js
import { supabase } from '../../../../lib/supabaseClient';

export const PedidosService = {
  
  // ==========================================
  // 1. DASHBOARD: OBTENER ÓRDENES ACTIVAS
  // ==========================================
  async getOrdenesActivas() {
    const { data, error } = await supabase
      .from('BD_Ordenes_Compra')
      .select(`
        *,
        proveedor:Cat_Proveedores(nombre),
        solicitante:Cat_Trabajadores(nombre_completo),
        sucursal:Cat_sucursales(nombre)
      `)
      // Solo órdenes que requieren atención inmediata
      .in('estatus', ['Pendiente', 'En Proceso']) 
      .order('prioridad', { ascending: false })
      .order('created_at', { ascending: false });
      
    return { data, error };
  },

  // ==========================================
  // 2. NUEVO PEDIDO: CARGA DE DATOS PARA EL CARRITO
  // ==========================================
  
  // Trae productos activos con su Unidad de Medida y Proveedor sugerido
  async getProductosParaOrden() {
    const { data, error } = await supabase
      .from('BD_Productos')
      .select(`
        id, nombre, marca, costo_actual, presentacion,
        proveedor_id,
        um:Cat_UM(id, nombre, abreviatura),
        proveedor:Cat_Proveedores(id, nombre)
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true });
    return { data, error };
  },

  // OPTIMIZADO: Ya no trae trabajadores ni sucursales (vienen de la sesión)
  async getCatalogosParaOrden() {
    const { data, error } = await supabase
      .from('Cat_Proveedores')
      .select('id, nombre')
      .eq('estatus', 'Activo');

    return {
      proveedores: data || [],
      error: error
    };
  },

  // ==========================================
  // 3. CREACIÓN MASIVA (TRANSACCIÓN)
  // ==========================================
  async crearNuevaOrden(ordenCabecera, listaProductos) {
    // Aseguramos que el nombre de la columna sea 'notas' según tu SQL
    const payloadCabecera = {
      ...ordenCabecera,
      notas: ordenCabecera.notas || ordenCabecera.notes || '' 
    };
    
    // Eliminamos 'notes' si existiera por error de tipeo en el front
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

    // B. Preparar los detalles con el ID de la orden recién creada
    const detallesFormateados = listaProductos.map(item => ({
      orden_id: nuevaOrden.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      costo_unitario: item.costo_unitario,
      estatus: 'Pendiente'
    }));

    // C. Insertar todos los productos del carrito
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
  // 4. CHECKLIST: DETALLE Y ACCIONES
  // ==========================================
  async getDetalleDeOrden(ordenId) {
    const { data, error } = await supabase
      .from('BD_Ordenes_Compra')
      .select(`
        *,
        proveedor:Cat_Proveedores(nombre, numero_contacto),
        solicitante:Cat_Trabajadores(nombre_completo),
        sucursal:Cat_sucursales(nombre),
        detalles:BD_Ordenes_Detalle (
          id, cantidad, estatus, costo_unitario,
          producto:BD_Productos (
            nombre, marca, presentacion,
            um:Cat_UM(abreviatura)
          )
        )
      `)
      .eq('id', ordenId)
      .single();
      
    return { data, error };
  },

  async actualizarEstatusItem(detalleId, nuevoEstatus) {
    const { data, error } = await supabase
      .from('BD_Ordenes_Detalle')
      .update({ estatus: nuevoEstatus })
      .eq('id', detalleId)
      .select();
    return { data, error };
  },

  async actualizarEstatusOrden(ordenId, nuevoEstatus) {
    const { data, error } = await supabase
      .from('BD_Ordenes_Compra')
      .update({ estatus: nuevoEstatus })
      .eq('id', ordenId)
      .select();
    return { data, error };
  },

  async cancelarOrden(ordenId) {
    const { data, error } = await supabase
      .from('BD_Ordenes_Compra')
      .update({ estatus: 'Cancelado' })
      .eq('id', ordenId)
      .select();
    return { data, error };
  }
};