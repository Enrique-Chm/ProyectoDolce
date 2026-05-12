// src/modules/Admin/Tabs/NuevoPedido/1NuevoPedido.Service.js
import { supabase } from '../../../../lib/supabaseClient';

export const NuevoPedidoService = {
  /**
   * 1. OBTENER PRODUCTOS DISPONIBLES
   * Recupera los insumos activos vinculando sus catálogos (UM, Categoría, Proveedor).
   * Es fundamental traer 'sucursales_ids' para que el Hook filtre lo que el
   * trabajador puede ver según su ubicación.
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
        sucursales_ids,
        um:Cat_UM(id, nombre, abreviatura),
        categoria:Cat_Categorias(id, nombre),
        proveedor:Cat_Proveedores!proveedor_id(id, nombre)
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true });
      
    if (error) {
      console.error("Error técnico al recuperar catálogo:", error.message);
    }

    return { data, error };
  },

  /**
   * 2. GUARDAR ORDEN COMPLETA (Cabecera + Detalles)
   * Este método realiza dos inserciones. Primero crea el registro en 'BD_Ordenes_Compra'
   * y usa ese ID generado para insertar todas las partidas en 'BD_Ordenes_Detalle'.
   */
  async guardarOrdenCompleta(ordenCabecera, listaProductos) {
    try {
      /**
       * A. PREPARAR CABECERA
       * Limpieza y formateo de datos para BD_Ordenes_Compra.
       */
      const payloadCabecera = {
        folio: ordenCabecera.folio,
        solicitante_id: ordenCabecera.solicitante_id,
        sucursal_id: ordenCabecera.sucursal_id,
        proveedor_id: ordenCabecera.proveedor_id || null, // UUID o null si es multi-proveedor
        prioridad: ordenCabecera.prioridad || 'Media',
        total_estimado: Number(ordenCabecera.total_estimado) || 0,
        estatus: ordenCabecera.estatus || 'Pendiente',
        notas: ordenCabecera.notas || ''
      };

      // 1. Insertamos la cabecera y recuperamos el ID generado
      const { data: nuevaOrden, error: errorCabecera } = await supabase
        .from('BD_Ordenes_Compra')
        .insert([payloadCabecera])
        .select()
        .single();

      if (errorCabecera) throw errorCabecera;

      /**
       * B. PREPARAR DETALLES
       * Mapeamos los productos del carrito a las columnas de BD_Ordenes_Detalle.
       */
      const detallesFormateados = listaProductos.map(item => ({
        orden_id: nuevaOrden.id, // Vínculo con la cabecera
        producto_id: item.producto_id,
        cantidad: Number(item.cantidad),
        costo_unitario: Number(item.costo_unitario) || 0,
        estatus: 'Pendiente' 
      }));

      // 2. Inserción masiva (Bulk Insert) de todas las partidas de la orden
      const { data: detalles, error: errorDetalles } = await supabase
        .from('BD_Ordenes_Detalle')
        .insert(detallesFormateados)
        .select();

      if (errorDetalles) {
        // Si fallan los detalles, lanzamos error para avisar al usuario
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