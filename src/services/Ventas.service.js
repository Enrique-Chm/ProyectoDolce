import { supabase } from '../lib/supabaseClient';

export const ventasService = {
  
  /**
   * Obtiene cuentas activas. 
   * Incluye la relación con el mesero (usuario_id) y los productos consumidos.
   */
  async getCuentasAbiertas(sucursalId) {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        mesero:usuario_id ( nombre ),
        ventas_detalle (
          *,
          productosmenu (nombre)
        )
      `)
      .eq('sucursal_id', sucursalId)
      .in('estado', ['pendiente', 'cocina', 'entregado', 'por_cobrar'])
      .order('created_at', { ascending: false });
    return { data, error };
  },

  /**
   * Procesa comanda (Mesero). 
   * Crea la venta si no existe o inserta nuevos productos si ya existe.
   */
  async procesarVenta(ventaData, carrito) {
    try {
      let ventaId = ventaData.id;
      let folio = ventaData.folio;

      // 1. Crear cabecera si es mesa nueva
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

      // 2. Insertar detalles del carrito
      const detalles = carrito.map(item => ({
        venta_id: ventaId,
        producto_id: item.id,
        cantidad: parseInt(item.cantidad) || 1,
        precio_unitario: parseFloat(item.precio_venta) || 0,
        costo_unitario_historico: parseFloat(item.costo_actual) || 0,
        subtotal: (parseFloat(item.precio_venta) || 0) * (parseInt(item.cantidad) || 1),
        notas: item.notas || ''
      }));

      const { error: dErr } = await supabase.from('ventas_detalle').insert(detalles);
      if (dErr) throw dErr;

      // 3. Recalcular totales generales de la mesa
      const { data: todosLosDetalles } = await supabase
        .from('ventas_detalle')
        .select('subtotal, costo_unitario_historico, cantidad')
        .eq('venta_id', ventaId);

      const nuevoTotal = todosLosDetalles.reduce((acc, cur) => acc + (parseFloat(cur.subtotal) || 0), 0);
      const nuevoCosto = todosLosDetalles.reduce((acc, cur) => acc + ((parseFloat(cur.costo_unitario_historico) || 0) * (parseInt(cur.cantidad) || 1)), 0);

      const { error: upErr } = await supabase.from('ventas').update({ 
        total: nuevoTotal, 
        subtotal: nuevoTotal, 
        costo_total_venta: nuevoCosto,
        estado: 'cocina' 
      }).eq('id', ventaId);

      if(upErr) throw upErr;

      return { success: true, folio };
    } catch (error) {
      console.error("Error en procesarVenta:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Marca la mesa en estado de cobro (Mesero pide cuenta).
   */
  async marcarPorCobrar(ventaId) {
    const { data, error } = await supabase
      .from('ventas')
      .update({ 
        estado: 'por_cobrar',
        hora_por_cobrar: new Date().toISOString() 
      })
      .eq('id', ventaId);
    return { success: !error, data, error };
  },

  /**
   * Cierra la cuenta (Cajero).
   * Registra método de pago, propina y libera la mesa.
   */
  async cerrarCuenta(ventaId, datosPago, cajeroId) {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .update({ 
          estado: 'pagado',
          metodo_pago: datosPago.metodo_pago,
          propina: parseFloat(datosPago.propina) || 0,
          total: parseFloat(datosPago.totalFinal), // Total que incluye la propina
          pagado_con: parseFloat(datosPago.pagado_con) || 0,
          cambio: parseFloat(datosPago.cambio) || 0,
          cajero_id: cajeroId,
          hora_cierre: new Date().toISOString()
        })
        .eq('id', ventaId)
        .select(); // Importante para confirmar el cambio

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error al cerrar cuenta:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtiene el historial de ventas pagadas hoy (Pestaña Historial Cajero).
   */
  async getHistorialCobradas(sucursalId) {
    const hoy = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        id, folio, mesa, total, metodo_pago, propina, hora_cierre,
        mesero:usuario_id ( nombre )
      `)
      .eq('sucursal_id', sucursalId)
      .eq('estado', 'pagado')
      .gte('hora_cierre', hoy)
      .order('hora_cierre', { ascending: false });
    
    return { data, error };
  },

  /**
   * Calcula el resumen de dinero del turno (Pestaña Corte Cajero).
   */
  async getResumenCaja(sucursalId) {
    const hoy = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('ventas')
      .select('total, metodo_pago, propina')
      .eq('sucursal_id', sucursalId)
      .eq('estado', 'pagado')
      .gte('hora_cierre', hoy);

    if (error) return { error };

    const resumen = data.reduce((acc, v) => {
      // Separamos la venta neta de la propina para el arqueo
      const ventaNeta = (parseFloat(v.total) || 0) - (parseFloat(v.propina) || 0);
      
      if (v.metodo_pago === 'efectivo') {
        acc.efectivo += ventaNeta;
      } else {
        acc.tarjeta += ventaNeta;
      }
      acc.totalPropinas += (parseFloat(v.propina) || 0);
      return acc;
    }, { efectivo: 0, tarjeta: 0, totalPropinas: 0 });

    return { data: resumen, error: null };
  }
};