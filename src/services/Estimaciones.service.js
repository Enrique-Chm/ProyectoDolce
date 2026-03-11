import { supabase } from '../lib/supabaseClient';

export const estimacionesService = {
  // ... (tus funciones anteriores: getSugerenciasCompra, actualizarPoliticaCompra, etc)

  // NUEVA FUNCIÓN: Registrar entrada rápida desde la lista de mandado
  async registrarCompraRealizada(insumoId, cantidadCajas, costoTotal, usuarioId, sucursalId) {
    try {
      // 1. Insertamos el movimiento en el Kardex para que el stock suba de inmediato
      const { error: movimientoError } = await supabase
        .from('inventario_movimientos')
        .insert([{
          insumo_id: insumoId,
          sucursal_id: sucursalId,
          usuario_id: usuarioId,
          tipo_movimiento: 'ENTRADA',
          cantidad: cantidadCajas, // Aquí podrías multiplicar por contenido_neto si quieres gramos
          motivo: 'Compra realizada desde Lista de Mandado',
          costo_unitario: costoTotal / cantidadCajas
        }]);

      if (movimientoError) throw movimientoError;

      return { success: true };
    } catch (error) {
      console.error("Error al registrar compra:", error);
      return { success: false, error: error.message };
    }
  }
};