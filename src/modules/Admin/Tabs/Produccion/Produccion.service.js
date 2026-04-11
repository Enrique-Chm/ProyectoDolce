// Archivo: src/modules/Admin/Tabs/Produccion/Produccion.service.js
import { supabase } from '../../../../lib/supabaseClient';

export const produccionService = {
  
  /**
   * 🤖 Obtiene el Plan de Producción Diaria (Mise en Place)
   * Llama a la función RPC 'get_plan_produccion' que cruza la demanda 
   * proyectada con el stock físico de subrecetas.
   */
  async getPlanProduccion(sucursalId, dias = 1) {
    try {
      if (!sucursalId) {
        return { success: false, error: "ID de sucursal no proporcionado." };
      }

      const { data, error } = await supabase.rpc('get_plan_produccion', { 
        p_sucursal_id: sucursalId,
        p_dias: dias
      });

      if (error) {
        console.error("Error RPC get_plan_produccion:", error);
        throw error;
      }

      return { success: true, data: data || [] };

    } catch (err) {
      console.error("Error en getPlanProduccion:", err);
      return { 
        success: false, 
        error: "Error al calcular el plan de producción. Verifica los permisos de la función SQL." 
      };
    }
  },

  /**
   * 📝 Registra producción física (suma) o merma (resta).
   * Realiza un cálculo de delta para mantener la integridad del stock
   * y utiliza un upsert basado en el ID o en la restricción de unicidad.
   */
  async registrarProduccion(sucursalId, nombreSubreceta, cantidad, usuarioId) {
    try {
      const nombreLimpio = nombreSubreceta?.trim();
      const cantidadDelta = parseFloat(cantidad);

      if (!sucursalId || !nombreLimpio || !usuarioId || isNaN(cantidadDelta)) {
        return { success: false, error: "Parámetros de registro incompletos o inválidos." };
      }

      // 1. Obtener el estado actual del stock para esta subreceta
      const { data: stockExistente, error: searchError } = await supabase
        .from('stock_subrecetas')
        .select('id, cantidad_actual')
        .eq('sucursal_id', sucursalId)
        .ilike('nombre_subreceta', nombreLimpio)
        .maybeSingle();

      if (searchError) throw searchError;

      const stockAnterior = stockExistente ? parseFloat(stockExistente.cantidad_actual) : 0;
      const nuevaCantidad = stockAnterior + cantidadDelta;

      // 2. Ejecutar la actualización (Upsert)
      // Se utiliza el ID si existe para asegurar que se actualice el registro correcto
      const { error: upsertError } = await supabase
        .from('stock_subrecetas')
        .upsert({
          ...(stockExistente?.id && { id: stockExistente.id }),
          sucursal_id: sucursalId,
          nombre_subreceta: nombreLimpio,
          cantidad_actual: nuevaCantidad,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'sucursal_id, nombre_subreceta' 
        });

      if (upsertError) throw upsertError;

      // Nota: Si se requiere trazabilidad histórica, se recomienda insertar 
      // el movimiento en una tabla de auditoría (logs) en este punto.

      return { success: true };

    } catch (err) {
      console.error("Error crítico en registrarProduccion:", err);
      return { 
        success: false, 
        error: "No se pudo actualizar el inventario físico. Contacta al administrador." 
      };
    }
  }
};