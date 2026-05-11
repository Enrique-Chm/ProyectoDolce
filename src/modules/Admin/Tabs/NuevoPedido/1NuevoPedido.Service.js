// src/modules/Admin/Tabs/NuevoPedido/1NuevoPedido.Service.js
import { supabase } from '../../../../lib/supabaseClient';

export const NuevoPedidoService = {
  /**
   * 1. Traer productos con sus relaciones para el carrito y filtrado
   * Esta consulta obtiene la información de los productos activos y
   * realiza los joins necesarios con UM, Categorías y Proveedores.
   * * Es CRÍTICO que el campo 'categoria' traiga 'nombre' para que el 
   * filtrado por pestañas en la UI funcione correctamente.
   */
  async getProductosDisponibles() {
    const { data, error } = await supabase
      .from('BD_Productos')
      .select(`
        id, 
        nombre, 
        marca, 
        presentacion, 
        contenido, 
        costo_actual, 
        activo,
        categoria_id,
        proveedor_id,
        um:Cat_UM(id, nombre, abreviatura),
        categoria:Cat_Categorias(id, nombre),
        proveedor:Cat_Proveedores!proveedor_id(id, nombre)
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true });
      
    return { data, error };
  },

  /**
   * 2. Guardar la orden (Cabecera + Detalles)
   * Este método maneja la creación de la orden principal en 'BD_Ordenes_Compra'
   * y luego inserta las partidas en 'BD_Ordenes_Detalle'.
   */
  async guardarOrdenCompleta(ordenCabecera, listaProductos) {
    /**
     * NORMALIZACIÓN DE CAMPOS: 
     * Aseguramos compatibilidad entre el estado de React (notes/observaciones)
     * y la columna real en PostgreSQL (notas).
     */
    const payloadCabecera = {
      folio: ordenCabecera.folio,
      solicitante_id: ordenCabecera.solicitante_id,
      sucursal_id: ordenCabecera.sucursal_id,
      proveedor_id: ordenCabecera.proveedor_id,
      prioridad: ordenCabecera.prioridad,
      total_estimado: ordenCabecera.total_estimado,
      estatus: ordenCabecera.estatus || 'Pendiente',
      // Mapeo múltiple para evitar valores vacíos si cambia el nombre en el frontend
      notas: ordenCabecera.notas || ordenCabecera.notes || ordenCabecera.observaciones || ''
    };

    // 1. Insertamos la cabecera de la Orden de Compra
    const { data: nuevaOrden, error: errorCabecera } = await supabase
      .from('BD_Ordenes_Compra')
      .insert([payloadCabecera])
      .select()
      .single();

    if (errorCabecera) {
      console.error("Error al insertar cabecera:", errorCabecera);
      return { data: null, error: errorCabecera };
    }

    // 2. Preparamos los detalles vinculándolos al UUID de la orden recién creada
    const detallesFormateados = listaProductos.map(prod => ({
      orden_id: nuevaOrden.id,
      producto_id: prod.producto_id,
      cantidad: prod.cantidad,
      costo_unitario: prod.costo_unitario
    }));

    // 3. Insertamos todas las partidas (detalles) de la orden en bloque
    const { data: detalles, error: errorDetalles } = await supabase
      .from('BD_Ordenes_Detalle')
      .insert(detallesFormateados)
      .select();

    if (errorDetalles) {
      console.error("Error al insertar detalles:", errorDetalles);
      /**
       * Nota técnica: Si los detalles fallan, la cabecera ya existe en la DB.
       * En un entorno de producción ideal, se usaría un RPC (Stored Procedure)
       * para asegurar que se guarden ambos o ninguno (Atomicidad).
       */
      return { data: null, error: errorDetalles };
    }

    return { data: { orden: nuevaOrden, detalles }, error: null };
  }
};