// src/modules/Admin/Tabs/NuevoPedido/1NuevoPedido.Service.js
import { supabase } from '../../../../lib/supabaseClient';

export const NuevoPedidoService = {
  /**
   * 1. OBTENER PRODUCTOS DISPONIBLES (FILTRADO POR DÍA)
   * Recupera los insumos activos cuyos proveedores estén abiertos el día solicitado.
   * @param {string} diaSemana - Día actual en español (ej. "Lunes", "Martes")
   */
  async getProductosDisponibles(diaSemana) {
    /**
     * NOTA TÉCNICA: Usamos '!inner' en la relación del proveedor para que el filtro 
     * .contains() actúe como un WHERE a nivel de base de datos sobre la tabla de productos.
     */
    const { data, error } = await supabase
      .from('BD_Productos')
      .select(`
        id, 
        nombre, 
        marca, 
        presentacion, 
        contenido, 
        activo,
        categoria_id,
        proveedor_id,
        sucursales_ids,
        um:Cat_UM(id, nombre, abreviatura),
        categoria:Cat_Categorias(id, nombre),
        proveedor:Cat_Proveedores!proveedor_id!inner(id, nombre, dias_abierto)
      `)
      .eq('activo', true)
      // Filtramos productos cuyo proveedor tenga el día actual en su arreglo de dias_abierto
      .contains('proveedor.dias_abierto', [diaSemana])
      .order('nombre', { ascending: true });
      
    if (error) {
      console.error("Error técnico al recuperar catálogo:", error.message);
    }

    return { data, error };
  },

  /**
   * 2. GUARDAR ORDEN COMPLETA (Cabecera + Detalles)
   * Procesa la inserción de la cabecera y sus respectivas partidas.
   */
  async guardarOrdenCompleta(ordenCabecera, listaProductos) {
    try {
      /**
       * A. PREPARAR CABECERA
       */
      const payloadCabecera = {
        folio: ordenCabecera.folio,
        solicitante_id: ordenCabecera.solicitante_id,
        sucursal_id: ordenCabecera.sucursal_id,
        proveedor_id: ordenCabecera.proveedor_id || null,
        prioridad: ordenCabecera.prioridad || 'Media',
        estatus: ordenCabecera.estatus || 'Pendiente',
        notas: ordenCabecera.notas || ''
      };

      // 1. Insertamos la cabecera
      const { data: nuevaOrden, error: errorCabecera } = await supabase
        .from('BD_Ordenes_Compra')
        .insert([payloadCabecera])
        .select()
        .single();

      if (errorCabecera) throw errorCabecera;

      /**
       * B. PREPARAR DETALLES
       */
      const detallesFormateados = listaProductos.map(item => ({
        orden_id: nuevaOrden.id,
        producto_id: item.producto_id,
        cantidad: Number(item.cantidad),
        estatus: 'Pendiente' 
      }));

      // 2. Inserción masiva de detalles
      const { data: detalles, error: errorDetalles } = await supabase
        .from('BD_Ordenes_Detalle')
        .insert(detallesFormateados)
        .select();

      if (errorDetalles) {
        console.error("Fallo al insertar partidas del pedido:", errorDetalles);
        throw errorDetalles;
      }

      return { 
        data: { orden: nuevaOrden, detalles }, 
        error: null 
      };

    } catch (err) {
      console.error("Error en flujo guardarOrdenCompleta:", err);
      return { 
        data: null, 
        error: {
          message: err.message,
          code: err.code,
          details: err.details
        } 
      };
    }
  }
};