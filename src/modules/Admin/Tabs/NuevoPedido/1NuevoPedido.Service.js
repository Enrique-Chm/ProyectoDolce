// src/services/NuevoPedido.Service.js
import { supabase } from '../../../../lib/supabaseClient'; // Ajusta la ruta a tu supabaseClient

export const NuevoPedidoService = {
  // 1. Traer solo lo necesario para armar el carrito
  async getProductosDisponibles() {
    const { data, error } = await supabase
      .from('BD_Productos')
      .select(`
        id, nombre, costo_actual, activo,
        unidad_medida:Cat_UM(nombre, abreviatura),
        proveedor:Cat_Proveedores(id, nombre)
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true });
      
    return { data, error };
  },

  // 2. Guardar la orden (Cabecera + Detalles)
  async guardarOrdenCompleta(ordenCabecera, listaProductos) {
    // Insertamos la cabecera
    const { data: nuevaOrden, error: errorCabecera } = await supabase
      .from('BD_Ordenes_Compra')
      .insert([ordenCabecera])
      .select()
      .single();

    if (errorCabecera) return { data: null, error: errorCabecera };

    // Formateamos las partidas con el ID de la nueva orden
    const detallesFormateados = listaProductos.map(prod => ({
      orden_id: nuevaOrden.id,
      producto_id: prod.producto_id,
      cantidad: prod.cantidad,
      costo_unitario: prod.costo_unitario
    }));

    // Insertamos las partidas
    const { data: detalles, error: errorDetalles } = await supabase
      .from('BD_Ordenes_Detalle')
      .insert(detallesFormateados)
      .select();

    if (errorDetalles) return { data: null, error: errorDetalles };

    return { data: { orden: nuevaOrden, detalles }, error: null };
  }
};