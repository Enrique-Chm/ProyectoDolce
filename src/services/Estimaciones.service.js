// Archivo: src/services/estimaciones.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Importación de seguridad

export const estimacionesService = {
  /**
   * Obtiene sugerencias de compra basadas en la vista de proyección.
   */
  async getSugerenciasCompra() {
    try {
      // 🛡️ Blindaje: Verificación de lectura de proyecciones
      if (!hasPermission('ver_inventario')) {
        return { success: false, error: 'No tienes permisos para ver proyecciones de compra.' };
      }

      const { data, error } = await supabase
        .from('vista_proyeccion_compras') // 👈 Nombre exacto del SQL
        .select('*');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtiene la lista de proveedores activos.
   */
  async getProveedoresActivos() {
    try {
      // 🛡️ Blindaje: Verificación de lectura de proveedores
      if (!hasPermission('ver_proveedores')) {
        return { success: false, error: 'No tienes permisos para consultar proveedores.' };
      }

      const { data, error } = await supabase
        .from('proveedores')
        .select('id, nombre_empresa')
        .eq('status', 'activo');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Actualiza los parámetros de cobertura y seguridad de un insumo.
   */
  async actualizarPoliticaCompra(insumoId, diasCobertura, diasSeguridad) {
    try {
      // 🛡️ Blindaje: Modificar políticas de stock requiere permisos de edición
      if (!hasPermission('editar_inventario')) {
        return { success: false, error: 'Acceso denegado: No puedes modificar las políticas de compra.' };
      }

      const { error } = await supabase
        .from('lista_insumo')
        .update({ 
          dias_cobertura_objetivo: diasCobertura, 
          dias_stock_seguridad: diasSeguridad 
        })
        .eq('id', insumoId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Registra una compra, crea el movimiento en Kardex y actualiza el stock actual.
   */
  async registrarCompraRealizada(insumoId, cantidadCajas, costoTotal, usuarioId, sucursalId) {
    try {
      // 🛡️ Blindaje: Registrar compras es una entrada de stock crítica
      if (!hasPermission('editar_inventario')) {
        return { success: false, error: 'Acceso denegado: No tienes facultades para registrar compras.' };
      }

      const { data: stockData } = await supabase
        .from('stock_sucursal')
        .select('cantidad_actual')
        .eq('insumo_id', insumoId)
        .eq('sucursal_id', sucursalId)
        .single();

      const stockAntes = stockData ? parseFloat(stockData.cantidad_actual) : 0;
      const stockDespues = stockAntes + parseFloat(cantidadCajas);

      // Registro en el Kardex
      const { error: errorMov } = await supabase
        .from('inventario_movimientos')
        .insert([{
          insumo_id: insumoId,
          sucursal_id: sucursalId,
          usuario_id: usuarioId,
          tipo: 'ENTRADA',
          cantidad_afectada: parseFloat(cantidadCajas),
          stock_antes: stockAntes,
          stock_despues: stockDespues,
          motivo: 'Compra desde Proyecciones',
          created_at: new Date().toISOString()
        }]);

      if (errorMov) throw errorMov;

      // Actualización de saldo real
      const { error: errorUpsert } = await supabase
        .from('stock_sucursal')
        .upsert({ 
          sucursal_id: sucursalId,
          insumo_id: insumoId,
          cantidad_actual: stockDespues,
          updated_at: new Date().toISOString()
        }, { onConflict: 'sucursal_id, insumo_id' });

      if (errorUpsert) throw errorUpsert;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};