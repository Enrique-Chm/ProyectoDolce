// Archivo: src/modules/Admin/Tabs/Produccion/Produccion.service.js
import { supabase } from '../../../../lib/supabaseClient';

export const produccionService = {
  
  /**
   * 🤖 Obtiene el Plan de Producción Diaria (Mise en Place)
   * Ejecuta nativamente en Postgres la explosión de recetas y consolidación de demanda.
   * * @param {number} sucursalId - ID de la sucursal actual
   * @param {number} dias - Rango de días a proyectar (default 1)
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getPlanProduccion(sucursalId, dias = 1) {
    try {
      if (!sucursalId) {
        return { success: false, error: "ID de sucursal no proporcionado." };
      }

      // 🚀 Llamada a la función RPC optimizada en SQL
      // Esta función ya devuelve los nombres limpios, unidades de receta y cruce de stock
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
        error: "Ocurrió un error al calcular el plan de producción. Verifica la conexión con el servidor." 
      };
    }
  },

  /**
   * 📝 Registra un movimiento de stock en subrecetas (Producción o Merma).
   * Realiza un Upsert: si la subreceta no existe en stock_subrecetas, la crea.
   * * @param {number} sucursalId - ID de la sucursal
   * @param {string} nombreSubreceta - Nombre exacto de la preparación
   * @param {number} cantidad - Delta a sumar (positivo) o restar (negativo)
   * @param {number} usuarioId - ID del usuario que realiza la acción
   */
  async registrarProduccion(sucursalId, nombreSubreceta, cantidad, usuarioId) {
    try {
      if (!sucursalId || !nombreSubreceta || !usuarioId) {
        return { success: false, error: "Faltan parámetros obligatorios para el registro." };
      }

      // 1. Buscamos si ya existe un registro de stock para esta subreceta en esta sucursal
      const { data: stockExistente, error: searchError } = await supabase
        .from('stock_subrecetas')
        .select('id, cantidad_actual')
        .eq('sucursal_id', sucursalId)
        .eq('nombre_subreceta', nombreSubreceta)
        .maybeSingle();

      if (searchError) throw searchError;

      const cantidadProducida = parseFloat(cantidad);
      
      // 2. Calculamos el nuevo balance
      const nuevaCantidad = stockExistente 
        ? parseFloat(stockExistente.cantidad_actual) + cantidadProducida
        : cantidadProducida;

      // 3. Impactamos en la base de datos (Upsert por constraint de unicidad sucursal_id + nombre)
      const { data, error } = await supabase
        .from('stock_subrecetas')
        .upsert({
          id: stockExistente?.id, // Si existe, lo actualiza por ID
          sucursal_id: sucursalId,
          nombre_subreceta: nombreSubreceta,
          cantidad_actual: nuevaCantidad,
          updated_at: new Date().toISOString()
        }, { onConflict: 'sucursal_id, nombre_subreceta' });

      if (error) throw error;

      return { success: true, data };

    } catch (err) {
      console.error("Error en registrarProduccion:", err);
      return { 
        success: false, 
        error: "Error al registrar el movimiento en el inventario físico." 
      };
    }
  }
};