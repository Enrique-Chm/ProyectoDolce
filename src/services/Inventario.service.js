import { supabase } from '../lib/supabaseClient';

export const inventarioService = {
  // 1. OBTENER EXISTENCIAS ACTUALES
  async getInsumos(sucursalId) {
    return await supabase
      .from('lista_insumo')
      .select(`
        *,
        cat_unidades_medida (nombre, abreviatura),
        cat_categoria_insumos (nombre)
      `)
      .eq('sucursal_id', sucursalId)
      .order('nombre', { ascending: true });
  },

  // 2. REGISTRAR MOVIMIENTO (Auditoría centralizada)
  async crearMovimiento(mov) {
    // Primero registramos el movimiento en la bitácora
    const { data, error } = await supabase
      .from('inventario_movimientos')
      .insert([mov])
      .select()
      .single();

    if (error) return { error };

    // Después actualizamos el stock real en la tabla lista_insumo
    const { error: errorUpdate } = await supabase
      .from('lista_insumo')
      .update({ caja_master: mov.stock_despues }) // Usando tu columna 'caja_master' como stock
      .eq('id', mov.insumo_id);

    return { data, error: errorUpdate };
  },

  // 3. OBTENER HISTORIAL PARA AUDITORÍA
  async getMovimientos(sucursalId, limit = 50) {
    return await supabase
      .from('inventario_movimientos')
      .select(`
        *,
        lista_insumo (nombre),
        usuarios_internos (nombre)
      `)
      .eq('sucursal_id', sucursalId)
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  // 4. EL CEREBRO: CÁLCULO DE CONTRASTE (ANTIFRAUDE)
  async calcularContraste(sucursalId, fechaInicio, fechaFin) {
    try {
      // A. Traemos todos los insumos
      const { data: insumos } = await this.getInsumos(sucursalId);

      // B. Traemos el detalle de ventas en el periodo
      const { data: ventas } = await supabase
        .from('ventas_detalle')
        .select(`
          cantidad,
          producto_id,
          ventas!inner(created_at, estado, sucursal_id)
        `)
        .eq('ventas.sucursal_id', sucursalId)
        .eq('ventas.estado', 'pagado')
        .gte('ventas.created_at', fechaInicio)
        .lte('ventas.created_at', fechaFin);

      // C. Traemos todas las recetas para saber qué consume cada producto
      const { data: recetas } = await supabase
        .from('recetas')
        .select('*')
        .eq('sucursal_id', sucursalId);

      // D. Traemos los movimientos de Entrada/Merma del periodo
      const { data: movs } = await supabase
        .from('inventario_movimientos')
        .select('*')
        .eq('sucursal_id', sucursalId)
        .gte('created_at', fechaInicio)
        .lte('created_at', fechaFin);

      // E. PROCESAMIENTO LOGÍSTICO
      const reporte = insumos.map(insumo => {
        // 1. Calcular consumo teórico (Ventas * Receta)
        const consumoTeorico = ventas.reduce((acc, v) => {
          const ingrediente = recetas.find(r => r.insumo === insumo.id && r.subreceta === v.producto_id);
          return acc + (ingrediente ? (parseFloat(ingrediente.cantidad) * v.cantidad) : 0);
        }, 0);

        // 2. Calcular entradas por compras en el periodo
        const entradas = movs
          .filter(m => m.insumo_id === insumo.id && m.tipo === 'ENTRADA')
          .reduce((acc, m) => acc + parseFloat(m.cantidad_afectada), 0);

        // 3. Calcular mermas registradas
        const mermas = movs
          .filter(m => m.insumo_id === insumo.id && m.tipo === 'MERMA')
          .reduce((acc, m) => acc + parseFloat(m.cantidad_afectada), 0);

        return {
          insumo: insumo.nombre,
          unidad: insumo.cat_unidades_medida?.abreviatura,
          comprado: entradas,
          vendido_teorico: consumoTeorico,
          mermas_reg: mermas,
          stock_actual: insumo.caja_master,
          // La diferencia que delata el robo/descuido:
          diferencia: (entradas - consumoTeorico - mermas) // Esto es lo que debería haber vs lo que hay
        };
      });

      return { data: reporte, error: null };
    } catch (error) {
      console.error("Error calculando contraste:", error);
      return { data: [], error };
    }
  }
};