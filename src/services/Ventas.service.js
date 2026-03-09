import { supabase } from '../lib/supabaseClient';

export const ventasService = {
  
  /**
   * Obtener todas las cuentas que no han sido pagadas en la sucursal actual.
   * Incluye el detalle de productos para mostrar un resumen al mesero.
   */
  async getCuentasAbiertas(sucursalId) {
    const { data, error } = await supabase
      .from('ventas')
      .select('*, ventas_detalle(*, productosmenu(nombre))')
      .eq('sucursal_id', sucursalId)
      .in('estado', ['pendiente', 'cocina', 'entregado'])
      .order('created_at', { ascending: false });
    return { data, error };
  },

  /**
   * Procesa la venta (Nueva o Actualización).
   * Maneja el snapshot de costos históricos y precios.
   */
  async procesarVenta(ventaData, carrito) {
    try {
      let ventaId = ventaData.id;
      let folio = ventaData.folio;

      // 1. SI ES NUEVA MESA: Crear la cabecera (Ventas)
      if (!ventaId) {
        const prefix = ventaData.sucursal_id === 1 ? 'M' : 'S';
        folio = `${prefix}-${Date.now().toString().slice(-6)}`;
        
        const { data: v, error: vErr } = await supabase.from('ventas').insert([{
          folio,
          sucursal_id: ventaData.sucursal_id,
          usuario_id: ventaData.usuario_id,
          mesa: ventaData.mesa,
          estado: 'cocina',
          total: 0,
          subtotal: 0
        }]).select().single();
        
        if (vErr) throw vErr;
        ventaId = v.id;
      }

      // 2. INSERTAR DETALLE: Snapshot de cada producto
      const detalles = carrito.map(item => ({
        venta_id: ventaId,
        producto_id: item.id,
        cantidad: parseInt(item.cantidad) || 1,
        precio_unitario: parseFloat(item.precio_venta) || 0,
        costo_unitario_historico: parseFloat(item.costo_actual) || 0,
        subtotal: (parseFloat(item.precio_venta) || 0) * (parseInt(item.cantidad) || 1),
        notas: item.notas || '',
        extras_seleccionados: JSON.stringify(item.extras || [])
      }));

      const { error: dErr } = await supabase.from('ventas_detalle').insert(detalles);
      if (dErr) throw dErr;

      // 3. RECALCULAR TOTALES: Sumar todo lo acumulado en la mesa
      const { data: todosLosDetalles, error: sumErr } = await supabase
        .from('ventas_detalle')
        .select('subtotal, costo_unitario_historico, cantidad')
        .eq('venta_id', ventaId);

      if (sumErr) throw sumErr;

      const nuevoTotal = todosLosDetalles.reduce((acc, cur) => acc + (parseFloat(cur.subtotal) || 0), 0);
      const nuevoCosto = todosLosDetalles.reduce((acc, cur) => acc + ((parseFloat(cur.costo_unitario_historico) || 0) * (parseInt(cur.cantidad) || 1)), 0);

      // 4. ACTUALIZAR CABECERA: Guardar los nuevos totales
      const { error: updateErr } = await supabase
        .from('ventas')
        .update({ 
          total: nuevoTotal, 
          subtotal: nuevoTotal, 
          costo_total_venta: nuevoCosto 
        })
        .eq('id', ventaId);

      if (updateErr) throw updateErr;

      return { success: true, folio };

    } catch (error) {
      console.error("Error crítico en ventasService:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Finaliza la transacción, registra el pago y libera la mesa.
   */
  async cerrarCuenta(ventaId, datosPago) {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .update({ 
          estado: 'pagado',
          metodo_pago: datosPago.metodo_pago,
          propina: parseFloat(datosPago.propina) || 0,
          total: parseFloat(datosPago.totalFinal),
          pagado_con: parseFloat(datosPago.pagado_con) || 0,
          cambio: parseFloat(datosPago.cambio) || 0
        })
        .eq('id', ventaId);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error al cerrar cuenta:", error.message);
      return { success: false, error: error.message };
    }
  }
};