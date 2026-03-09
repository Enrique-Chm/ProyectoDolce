import { supabase } from '../lib/supabaseClient';

/**
 * SERVICIO DE RECETAS (Multi-Sucursal)
 * La lógica de filtrado ahora asegura que cada local 
 * gestione sus propios costos e ingredientes.
 */
export const recetasService = {
  
  /**
   * Obtiene los datos necesarios filtrados por sucursal.
   */
  async getInitialData(sucursalId) {
    try {
      // Si por alguna razón no llega el ID, usamos el 1 (Matriz) por defecto
      const sId = sucursalId || 1;

      const [rec, ins, uni] = await Promise.all([
        // Filtramos la vista de recetas por sucursal
        supabase
          .from('vista_recetas_completas')
          .select('*')
          .eq('sucursal_id', sId)
          .order('nombre'),
        
        // Filtramos los insumos disponibles en esa sucursal
        supabase
          .from('lista_insumo')
          .select('id, nombre, modelo, costo_unitario, unidad_medida')
          .eq('sucursal_id', sId)
          .order('nombre'),
        
        // Las unidades de medida son globales (catálogo maestro)
        supabase
          .from('cat_unidades_medida')
          .select('id, nombre, abreviatura')
      ]);

      if (rec.error) throw rec.error;
      if (ins.error) throw ins.error;
      if (uni.error) throw uni.error;

      return {
        recetasAgrupadas: rec.data || [],
        insumos: ins.data || [],
        unidades: uni.data || []
      };
    } catch (error) {
      console.error("Error en recetasService.getInitialData:", error);
      throw error;
    }
  },

  /**
   * Guarda la receta vinculándola a la sucursal seleccionada.
   */
  async saveReceta(rows, nombreOriginal, isEditing = false) {
    try {
      // Obtenemos el sucursal_id de la primera fila para asegurar consistencia
      const sucursalId = rows[0]?.sucursal_id;

      // Limpieza de versión anterior si estamos editando (dentro de la misma sucursal)
      if (isEditing && nombreOriginal) {
        const { error: deleteError } = await supabase
          .from('recetas')
          .delete()
          .eq('nombre', nombreOriginal)
          .eq('sucursal_id', sucursalId); // Seguridad: solo borra en este local
        
        if (deleteError) throw deleteError;
      }

      // Insertamos las filas con su sucursal_id correspondiente
      return await supabase.from('recetas').insert(rows);
    } catch (error) {
      console.error("Error en recetasService.saveReceta:", error);
      throw error;
    }
  },

  /**
   * Elimina la receta completa filtrando por nombre y sucursal.
   */
  async deleteReceta(nombre, sucursalId) {
    try {
      // Es recomendable pasar el sucursalId para no borrar recetas homónimas en otros locales
      const query = supabase.from('recetas').delete().eq('nombre', nombre);
      
      if (sucursalId) query.eq('sucursal_id', sucursalId);
      
      return await query;
    } catch (error) {
      console.error("Error en recetasService.deleteReceta:", error);
      throw error;
    }
  }
};