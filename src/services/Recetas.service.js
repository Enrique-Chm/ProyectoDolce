// Archivo: src/services/Recetas.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Importación de seguridad

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
      // 🛡️ Blindaje: Verificación de lectura
      if (!hasPermission('ver_recetas')) {
        return { recetasAgrupadas: [], subrecetas: [], insumos: [], unidades: [] };
      }

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
        
        // Las unidades de medida son globales
        supabase
          .from('cat_unidades_medida')
          .select('id, nombre, abreviatura')
      ]);

      if (rec.error) throw rec.error;
      if (ins.error) throw ins.error;
      if (uni.error) throw uni.error;

      const todasLasRecetas = rec.data || [];
      
      // 💡 CORRECCIÓN AQUÍ: El nombre correcto de la columna es 'subreceta'
      const subrecetas = todasLasRecetas.filter(r => 
        r.subreceta === true || 
        r.subreceta === 'true' || 
        r.subreceta === 1 || 
        r.subreceta === 't'
      );

      return {
        recetasAgrupadas: todasLasRecetas,
        subrecetas: subrecetas, // 👈 Ahora sí irá llena de datos
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
      // 🛡️ Blindaje: Verificación de edición/creación
      if (isEditing) {
        if (!hasPermission('editar_recetas')) {
          return { error: { message: "Acceso Denegado: No tienes permiso para editar recetas." } };
        }
      } else {
        if (!hasPermission('crear_recetas')) {
          return { error: { message: "Acceso Denegado: No tienes permiso para crear recetas." } };
        }
      }

      const sucursalId = rows[0]?.sucursal_id;

      if (isEditing && nombreOriginal) {
        const { error: deleteError } = await supabase
          .from('recetas')
          .delete()
          .eq('nombre', nombreOriginal)
          .eq('sucursal_id', sucursalId); 
        
        if (deleteError) throw deleteError;
      }

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
      if (!hasPermission('borrar_recetas')) {
        return { error: { message: "Acceso Denegado: Se requieren permisos de borrado." } };
      }

      const query = supabase.from('recetas').delete().eq('nombre', nombre);
      if (sucursalId) query.eq('sucursal_id', sucursalId);
      
      return await query;
    } catch (error) {
      console.error("Error en recetasService.deleteReceta:", error);
      throw error;
    }
  }
};