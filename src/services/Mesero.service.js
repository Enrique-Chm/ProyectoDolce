import { supabase } from '../lib/supabaseClient';

export const MeseroService = {
  
  getCuentasAbiertas: async (sucursalId) => {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        ventas_detalle (*)
      `)
      .in('estado', ['pendiente', 'por_cobrar'])
      .order('created_at', { ascending: false });

    return { data, error };
  },

  getHistorialCobradas: async (sucursalId) => {
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .eq('estado', 'pagado')
      .order('hora_cierre', { ascending: false })
      .limit(50);
    return { data, error };
  },

  marcarPorCobrar: async (ventaId) => {
    const { error } = await supabase
      .from('ventas')
      .update({ estado: 'por_cobrar' })
      .eq('id', ventaId);
    return { success: !error, error: error?.message };
  },

  procesarVenta: async (ventaData, carrito) => {
    try {
      let ventaId = ventaData.id;
      
      if (!ventaId) {
        const totalInicial = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0);
        
        // CORRECCIÓN: Quitamos los parseInt de los UUIDs.
        // Si no tienes sucursal_id o mesero_id configurados aún, mandamos "undefined" para que Supabase los ignore.
        const nuevaVentaPayload = {
          usuario_id: ventaData.usuario_id || undefined, 
          mesa: ventaData.mesa ? String(ventaData.mesa) : 'S/N',
          estado: 'pendiente',
          subtotal: parseFloat(totalInicial), 
          total: parseFloat(totalInicial)
        };

        // Solo agregamos sucursal_id si realmente viene un valor válido
        if (ventaData.sucursal_id) {
            nuevaVentaPayload.sucursal_id = ventaData.sucursal_id;
        }

        const { data: nuevaVenta, error: errVenta } = await supabase
          .from('ventas')
          .insert([nuevaVentaPayload])
          .select()
          .single();
          
        if (errVenta) {
          console.error("Error al crear la venta padre:", errVenta);
          throw errVenta;
        }
        ventaId = nuevaVenta.id;
      }

      // Preparar detalles (Aquí sí usamos parseInt para productos y cantidades, porque suelen ser enteros)
      const detalles = carrito.map(item => ({
        venta_id: ventaId, 
        producto_id: parseInt(item.id),
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precio_venta),
        costo_unitario_historico: parseFloat(item.costo_actual || 0), 
        subtotal: parseFloat(item.cantidad * item.precio_venta),
        notas: item.notas || ''
      }));

      const { error: errDetalles } = await supabase
        .from('ventas_detalle')
        .insert(detalles);
        
      if (errDetalles) {
        console.error("Error al insertar los detalles:", errDetalles);
        throw errDetalles;
      }

      // Recalcular el total si la mesa ya existía
      if (ventaData.id) {
        const { data: allDetails } = await supabase
          .from('ventas_detalle')
          .select('subtotal')
          .eq('venta_id', ventaId);
          
        const nuevoTotal = allDetails.reduce((sum, item) => sum + item.subtotal, 0);
        
        await supabase
          .from('ventas')
          .update({ 
            subtotal: parseFloat(nuevoTotal),
            total: parseFloat(nuevoTotal) 
          })
          .eq('id', ventaId);
      }

      return { success: true };
    } catch (error) {
      console.error("Error en procesarVenta (MeseroService):", error);
      return { success: false, error: error.message || JSON.stringify(error) };
    }
  }
};