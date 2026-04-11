// Archivo: src/modules/Admin/Tabs/Proyeccion/Estimaciones.service.js
import { supabase } from '../../../../lib/supabaseClient';
import { hasPermission } from '../../../../utils/checkPermiso';

/**
 * SERVICIO DE ESTIMACIONES Y DEMANDA
 * Centraliza la lógica de proyecciones de venta, ajustes manuales
 * y sugerencias de compra basadas en el motor de demanda por DOW.
 */
export const estimacionesService = {
  
  /**
   * 🚀 Obtiene sugerencias de compra basadas en la demanda proyectada (IA + Manual).
   * Envía un arreglo de días exactos (DOW) para calcular necesidades de stock.
   */
  async getSugerenciasCompra(sucursalId, diasCompra = 1, porcentajeColchon = 0) {
    try {
      if (!hasPermission('ver_inventario')) {
        return { success: false, error: 'No tienes permisos para ver proyecciones de compra.' };
      }

      // 1. LÓGICA DE FECHAS: Calculamos los DOWs (0-6) de los días siguientes
      const dowsArray = [];
      const hoy = new Date();
      
      for (let i = 1; i <= diasCompra; i++) {
        const fechaFutura = new Date(hoy);
        fechaFutura.setDate(hoy.getDate() + i);
        dowsArray.push(fechaFutura.getDay());
      }

      // 2. RPC: get_sugerencias_compras_por_dow
      // Este motor ya cruza recetas, ventas históricas y ajustes manuales
      const { data, error } = await supabase
        .rpc('get_sugerencias_compras_por_dow', { 
          p_sucursal_id: sucursalId,
          p_dows: dowsArray, 
          p_colchon: porcentajeColchon
        });

      if (error) throw error;

      // 3. MAPEADO DE DATOS: Aseguramos formatos numéricos para el Frontend
      const formattedData = (data || []).map(v => ({
        insumo_id: v.insumo_id,
        insumo_nombre: v.insumo_nombre,
        modelo: v.modelo || '',
        proveedor_nombre: v.proveedor_nombre || 'Sin proveedor',
        consumo_diario_real: parseFloat(v.cantidad_requerida || 0).toFixed(1), 
        stock_fisico_hoy: parseFloat(v.stock_actual || 0).toFixed(1),
        cantidad_sugerida: parseFloat(v.cantidad_a_comprar || 0).toFixed(1),
        cajas_a_pedir: parseInt(v.cajas_a_pedir || 0),
        unidad_medida: v.unidad_medida || 'Uds',
        contenido_neto: v.contenido_neto,
        presupuesto_estimado: parseFloat(v.presupuesto_estimado || 0),
        
        // Atributos de política de inventario
        metodo_compra: v.metodo_compra,
        dias_cobertura_objetivo: v.dias_cobertura_objetivo,
        dias_stock_seguridad: v.dias_stock_seguridad,
        stock_minimo: v.stock_minimo,
        stock_maximo: v.stock_maximo
      }));

      return { success: true, data: formattedData };
    } catch (error) {
      console.error("Error en getSugerenciasCompra:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtiene la proyección de PLATILLOS para un día específico (DOW).
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
          promedio_diario: parseFloat(stat.promedio_diario).toFixed(0),
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
   * Obtiene la matriz semanal completa (IA + Manual).
   * Esta es la función "cerebro" que acabamos de actualizar en el SQL.
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
   * Obtiene exclusivamente los ajustes manuales del usuario.
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
   * Guarda o actualiza un ajuste manual. 
   * Si la cantidad es vacía, elimina el ajuste para volver al promedio IA.
   */
  async guardarEstimacionManual(sucursalId, productoId, dow, cantidad) {
    try {
      if (!hasPermission('editar_inventario')) {
        return { success: false, error: 'Acceso denegado.' };
      }

      // Si el usuario borra el número, eliminamos el registro para que mande la IA
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
   * Catálogo de proveedores para filtrado en la vista de compras.
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
   * Kardex de movimientos (para validación de consumos reales).
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
   * Actualiza los parámetros de stock (Mínimos, Máximos, Cobertura).
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
   * Afecta el inventario físico al confirmar una compra desde la proyeccion.
   */
  async registrarCompraRealizada(insumoId, cantidadCajas, costoTotal, usuarioId, sucursalId) {
    try {
      if (!hasPermission('editar_inventario')) return { success: false, error: 'Acceso denegado' };
      
      // 1. Obtener stock actual
      const { data: stockData, error: stockError } = await supabase
        .from('stock_sucursal')
        .select('id, cantidad_actual')
        .eq('insumo_id', insumoId)
        .eq('sucursal_id', sucursalId)
        .maybeSingle(); 

      if (stockError) throw stockError;

      const stockAntes = stockData ? parseFloat(stockData.cantidad_actual) : 0;
      const stockDespues = stockAntes + parseFloat(cantidadCajas);

      // 2. Insertar movimiento de entrada
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

      // 3. Upsert del stock actual
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
      console.error("Fallo crítico en registrarCompraRealizada:", error);
      return { success: false, error: error.message };
    }
  }
};