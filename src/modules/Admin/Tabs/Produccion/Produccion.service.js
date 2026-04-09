// Archivo: src/modules/Admin/Tabs/Produccion/Produccion.service.js
import { supabase } from '../../../../lib/supabaseClient';

/**
 * Servicio encargado de la lógica de producción y preparaciones base (Mise en Place).
 * Coordina el cálculo de demanda proyectada y la gestión del stock físico
 * exclusivo para subrecetas (preparados de cocina).
 */
export const produccionService = {
  
  /**
   * 🤖 Obtiene el Plan de Producción Diaria.
   * Llama a la función RPC que explota las recetas según la demanda proyectada
   * y cruza los datos con la tabla 'stock_subrecetas'.
   * * @param {number} sucursalId - ID de la sucursal activa.
   * @param {number} dias - Rango de proyección (default 1).
   */
  async getPlanProduccion(sucursalId, dias = 1) {
    try {
      if (!sucursalId) {
        return { success: false, error: "ID de sucursal no proporcionado." };
      }

      const { data, error } = await supabase.rpc('get_plan_produccion_diaria', {
        p_sucursal_id: sucursalId,
        p_dias: dias
      });

      if (error) {
        console.error("Error en RPC get_plan_produccion_diaria:", error);
        return { success: false, error: error.message };
      }

      /**
       * Estructura de retorno (vía stock_subrecetas):
       * [{ subreceta_nombre, cantidad_total, cantidad_actual, unidad_medida, basado_en_productos }]
       */
      return { 
        success: true, 
        data: data || [] 
      };

    } catch (err) {
      console.error("Error inesperado en getPlanProduccion:", err);
      return { 
        success: false, 
        error: "Ocurrió un error al intentar obtener el plan de producción." 
      };
    }
  },

  /**
   * 📝 Registra la producción de una subreceta.
   * Afecta directamente la tabla 'stock_subrecetas' (Suma o resta stock).
   * * @param {number} sucursalId - ID de la sucursal.
   * @param {string} nombreSubreceta - Nombre de la subreceta a afectar.
   * @param {number} cantidad - Cantidad producida (positiva para suma, negativa para merma).
   * @param {number} usuarioId - ID del usuario que opera.
   */
  async registrarProduccion(sucursalId, nombreSubreceta, cantidad, usuarioId) {
    try {
      if (!sucursalId || !nombreSubreceta || !usuarioId) {
        return { success: false, error: "Faltan parámetros obligatorios para el registro." };
      }

      const { data, error } = await supabase.rpc('registrar_produccion_subreceta', {
        p_sucursal_id: sucursalId,
        p_subreceta_nombre: nombreSubreceta,
        p_cantidad_producida: cantidad,
        p_usuario_id: usuarioId
      });

      if (error) {
        console.error("Error en RPC registrar_produccion_subreceta:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data };

    } catch (err) {
      console.error("Error inesperado en registrarProduccion:", err);
      return { 
        success: false, 
        error: "Error al intentar registrar el movimiento de producción." 
      };
    }
  },

  /**
   * 🔍 Detalle de Origen.
   * Consulta las recetas para saber qué platillos finales requieren esta subreceta.
   */
  async getDetalleOrigenProduccion(sucursalId, subrecetaNombre) {
    try {
      const { data, error } = await supabase
        .from('recetas')
        .select(`
          cantidad,
          productosmenu (
            nombre
          )
        `)
        .eq('sucursal_id', sucursalId)
        .eq('subreceta_id', subrecetaNombre);

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error("Error en getDetalleOrigenProduccion:", err);
      return { success: false, error: err.message };
    }
  }
};