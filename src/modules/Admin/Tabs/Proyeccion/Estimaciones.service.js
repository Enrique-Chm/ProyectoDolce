// Archivo: src/modules/Admin/Tabs/Proyeccion/Estimaciones.service.js
import { supabase } from '../../../../lib/supabaseClient';
import { hasPermission } from '../../../../utils/checkPermiso';

export const estimacionesService = {
  /**
   * 🚀 ACTUALIZADO: Obtiene sugerencias de compra basadas en el motor de demanda JIT.
   * Llama al RPC que explota recetas y compara contra stock real para mañana.
   */
  async getSugerenciasCompra(sucursalId) {
    try {
      if (!hasPermission('ver_inventario')) {
        return { success: false, error: 'No tienes permisos para ver proyecciones de compra.' };
      }

      // 1. Llamada al nuevo RPC de demanda inteligente
      const { data, error } = await supabase
        .rpc('get_sugerencias_compras_demanda', { 
          p_sucursal_id: sucursalId 
        });

      if (error) throw error;

      // 2. Mapeo para mantener compatibilidad con la UI existente
      const formattedData = (data || []).map(v => ({
        insumo_id: v.insumo_id,
        insumo_nombre: v.insumo_nombre,
        modelo: v.modelo || '',
        proveedor_nombre: v.proveedor_nombre || 'Sin proveedor',
        consumo_diario_real: parseFloat(v.necesario_mañana || 0).toFixed(2), // Representa lo necesario para cubrir la venta
        stock_fisico_hoy: parseFloat(v.stock_actual || 0).toFixed(2),
        cantidad_sugerida: parseFloat(v.faltante_neto || 0),
        cajas_a_pedir: parseInt(v.cajas_a_pedir || 0),
        unidad_medida: v.unidad_medida || 'Uds',
        contenido_neto: v.contenido_neto
      }));

      return { success: true, data: formattedData };
    } catch (error) {
      console.error("Error en getSugerenciasCompra (Demanda):", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtiene la proyección de PLATILLOS usando Inteligencia por Día de la Semana (DOW).
   * Calcula automáticamente el promedio del día correspondiente a mañana.
   */
  async getProyeccionProductos(sucursalId) {
    try {
      if (!hasPermission('ver_inventario')) {
        return { success: false, error: 'No tienes permisos para ver estadísticas de ventas.' };
      }

      const hoy = new Date();
      const mañanaDow = (hoy.getDay() + 1) % 7;

      const { data: stats, error: rpcError } = await supabase
        .rpc('get_promedio_por_dia_semana', { 
          p_sucursal_id: sucursalId, 
          p_dow: mañanaDow 
        });

      if (rpcError) throw rpcError;

      const productoIds = (stats || []).map(s => s.producto_id);
      let productosInfo = [];

      if (productoIds.length > 0) {
        const { data: namesData } = await supabase
          .from('productosmenu')
          .select('id, nombre')
          .in('id', productoIds);
        productosInfo = namesData || [];
      }

      const resultado = (stats || []).map(stat => {
        const info = productosInfo.find(p => p.id === stat.producto_id);
        return {
          nombre: info?.nombre || 'Producto desconocido',
          promedio_diario: parseFloat(stat.promedio_diario).toFixed(2),
          prediccion_manana: Math.ceil(stat.promedio_diario)
        };
      });

      return { success: true, data: resultado };
    } catch (error) {
      console.error("Error en getProyeccionProductos:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtiene la matriz semanal completa de promedios (Histórico de 60 días).
   */
  async getPronosticoSemanal(sucursalId) {
    try {
      if (!hasPermission('ver_inventario')) return { success: false, error: 'Acceso denegado' };
      
      const { data, error } = await supabase.rpc('get_pronostico_semanal_completo', { 
        p_sucursal_id: sucursalId 
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error en getPronosticoSemanal:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 🚀 NUEVO: Obtiene las estimaciones MANUALES definidas por el usuario.
   */
  async getEstimacionesManuales(sucursalId) {
    try {
      if (!hasPermission('ver_inventario')) return { success: false, error: 'Sin permisos' };
      
      const { data, error } = await supabase
        .from('productos_estimaciones_manuales')
        .select('*')
        .eq('sucursal_id', sucursalId);
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 🚀 ACTUALIZADO: Guarda, actualiza o ELIMINA una estimación manual.
   * Si 'cantidad' viene vacío, elimina el registro para volver al estimado inteligente.
   */
  async guardarEstimacionManual(sucursalId, productoId, dow, cantidad) {
    try {
      if (!hasPermission('editar_inventario')) {
        return { success: false, error: 'Acceso denegado: No puedes definir estimaciones manuales.' };
      }

      // Si la cantidad es una cadena vacía o nula, eliminamos la estimación manual
      if (cantidad === "" || cantidad === null || cantidad === undefined) {
        const { error } = await supabase
          .from('productos_estimaciones_manuales')
          .delete()
          .eq('sucursal_id', sucursalId)
          .eq('producto_id', productoId)
          .eq('dow', dow);

        if (error) throw error;
        return { success: true, action: 'deleted' };
      }
      
      // Si hay un valor, procedemos con el upsert normal
      const { error } = await supabase
        .from('productos_estimaciones_manuales')
        .upsert({
          sucursal_id: sucursalId,
          producto_id: productoId,
          dow: dow,
          cantidad_manual: parseFloat(cantidad) || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'producto_id, sucursal_id, dow' });

      if (error) throw error;
      return { success: true, action: 'upserted' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtiene la lista de proveedores activos.
   */
  async getProveedoresActivos() {
    try {
      if (!hasPermission('ver_proveedores')) return { success: false, error: 'Sin permisos' };
      
      const { data, error } = await supabase
        .from('proveedores')
        .select('id, nombre_empresa')
        .ilike('status', '%activo%'); 
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Trae el historial de movimientos manuales (Kardex) de los últimos 15 días.
   */
  async getHistorialConsumo(sucursalId) {
    try {
      if (!hasPermission('ver_inventario')) return { success: false, error: 'Sin permisos' };
      
      const fecha15Dias = new Date();
      fecha15Dias.setDate(fecha15Dias.getDate() - 15);

      const { data, error } = await supabase
        .from('inventario_movimientos')
        .select(`
          *,
          insumo:insumo_id(nombre),
          usuarios_internos!inventario_movimientos_usuario_id_fkey(nombre)
        `)
        .eq('sucursal_id', sucursalId)
        .neq('tipo', 'ENTRADA') 
        .gte('created_at', fecha15Dias.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Actualiza los parámetros de la estrategia de stock de un insumo (Días vs Manual).
   */
  async actualizarPoliticaCompra(insumoId, data) {
    try {
      if (!hasPermission('editar_inventario')) return { success: false, error: 'Acceso denegado' };
      
      const { error } = await supabase
        .from('lista_insumo')
        .update({ 
          metodo_compra: data.metodo,
          dias_cobertura_objetivo: parseInt(data.cobertura) || 0, 
          dias_stock_seguridad: parseInt(data.seguridad) || 0,
          stock_minimo: parseFloat(data.minimo) || 0,
          stock_maximo: parseFloat(data.maximo) || 0
        })
        .eq('id', insumoId);
        
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Registra una compra física, afecta stock y genera registro en Kardex.
   */
  async registrarCompraRealizada(insumoId, cantidadCajas, costoTotal, usuarioId, sucursalId) {
    try {
      if (!hasPermission('editar_inventario')) return { success: false, error: 'Acceso denegado' };
      
      const { data: stockData, error: stockError } = await supabase
        .from('stock_sucursal')
        .select('id, cantidad_actual')
        .eq('insumo_id', insumoId)
        .eq('sucursal_id', sucursalId)
        .maybeSingle(); 

      if (stockError) throw stockError;

      const stockAntes = stockData ? parseFloat(stockData.cantidad_actual) : 0;
      const stockDespues = stockAntes + parseFloat(cantidadCajas);

      // Registrar movimiento de ENTRADA
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

      // Actualizar existencia física
      if (stockData) {
        const { error: errorUpdate } = await supabase
          .from('stock_sucursal')
          .update({ 
            cantidad_actual: stockDespues,
            updated_at: new Date().toISOString() 
          })
          .eq('id', stockData.id);
        if (errorUpdate) throw errorUpdate;
      } else {
        const { error: errorInsert } = await supabase
          .from('stock_sucursal')
          .insert([{ 
            sucursal_id: sucursalId, 
            insumo_id: insumoId, 
            cantidad_actual: stockDespues, 
            updated_at: new Date().toISOString() 
          }]);
        if (errorInsert) throw errorInsert;
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};