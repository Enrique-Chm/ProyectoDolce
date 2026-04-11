// Archivo: src/services/Recetas.service.js
import { supabase } from '../../../../lib/supabaseClient';
import { hasPermission } from '../../../../utils/checkPermiso'; // 🛡️ Importación de seguridad

/**
 * SERVICIO DE RECETAS (Multi-Sucursal)
 * Gestiona el almacenamiento de fichas técnicas, costos de insumos
 * y el catálogo de sub-preparaciones para la sucursal actual.
 */
export const recetasService = {
  
  /**
   * Obtiene los datos necesarios para la gestión de recetas.
   * Filtra estrictamente por sucursal_id.
   */
  async getInitialData(sucursalId) {
    try {
      // 🛡️ Blindaje: Verificación de lectura
      if (!hasPermission('ver_recetas')) {
        return { 
          recetasAgrupadas: [], 
          subrecetas: [], 
          insumos: [], 
          unidades: [] 
        };
      }

      const sId = sucursalId || 1;

      // 🚀 EJECUCIÓN EN PARALELO: Traemos solo lo necesario para el flujo puro de recetas
      const [rec, ins, uni] = await Promise.all([
        // 1. Vista de recetas: ya trae costos calculados, rendimiento y unidad final
        supabase
          .from('vista_recetas_completas')
          .select('*')
          .eq('sucursal_id', sId)
          .order('nombre'),
        
        // 2. Insumos base disponibles
        supabase
          .from('lista_insumo')
          .select('id, nombre, modelo, costo_unitario, unidad_medida')
          .eq('sucursal_id', sId)
          .order('nombre'),
        
        // 3. Catálogo global de unidades
        supabase
          .from('cat_unidades_medida')
          .select('id, nombre, abreviatura')
          .order('nombre')
      ]);

      if (rec.error) throw rec.error;
      if (ins.error) throw ins.error;
      if (uni.error) throw uni.error;

      const todasLasRecetas = rec.data || [];
      
      // Filtrado de sub-preparaciones (Sub-recetas) para poder usarlas como ingredientes
      const subrecetas = todasLasRecetas.filter(r => 
        r.subreceta === true || 
        r.subreceta === 'true' || 
        r.subreceta === 1 || 
        r.subreceta === 't'
      );

      return {
        recetasAgrupadas: todasLasRecetas,
        subrecetas: subrecetas, 
        insumos: ins.data || [],
        unidades: uni.data || []
      };
    } catch (error) {
      console.error("Error en recetasService.getInitialData:", error);
      throw error;
    }
  },

  /**
   * Guarda o actualiza una receta. 
   * Borra la versión anterior e inserta la nueva para mantener la integridad del lote.
   */
  async saveReceta(rows, nombreOriginal, isEditing = false) {
    try {
      // 🛡️ Verificación de permisos de escritura
      const permisoRequerido = isEditing ? 'editar_recetas' : 'crear_recetas';
      if (!hasPermission(permisoRequerido)) {
        return { error: { message: `Acceso Denegado: Permisos insuficientes.` } };
      }

      const sucursalId = rows[0]?.sucursal_id;

      // 1. Limpieza atómica: eliminamos registros previos antes de insertar el nuevo desglose
      if (isEditing && nombreOriginal) {
        const { error: deleteError } = await supabase
          .from('recetas')
          .delete()
          .eq('nombre', nombreOriginal)
          .eq('sucursal_id', sucursalId); 
        
        if (deleteError) throw deleteError;
      }

      // 2. Inserción del nuevo desglose de ingredientes
      const { data, error } = await supabase
        .from('recetas')
        .insert(rows);

      if (error) throw error;
      return { data, error: null };

    } catch (error) {
      console.error("Error en recetasService.saveReceta:", error);
      return { data: null, error };
    }
  },

  /**
   * Elimina una receta completa (todas sus filas de ingredientes)
   */
  async deleteReceta(nombre, sucursalId) {
    try {
      if (!hasPermission('borrar_recetas')) {
        return { error: { message: "Acceso Denegado: No puedes realizar esta acción." } };
      }

      const { data, error } = await supabase
        .from('recetas')
        .delete()
        .eq('nombre', nombre)
        .eq('sucursal_id', sucursalId);
      
      if (error) throw error;
      return { data, error: null };

    } catch (error) {
      console.error("Error en recetasService.deleteReceta:", error);
      return { data: null, error };
    }
  }
};