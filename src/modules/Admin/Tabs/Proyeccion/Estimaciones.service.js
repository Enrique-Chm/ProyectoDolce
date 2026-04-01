// Archivo: src/modules/Admin/Tabs/Proyeccion/Estimaciones.service.js
import { supabase } from '../../../../lib/supabaseClient';
import { hasPermission } from '../../../../utils/checkPermiso'; // 🛡️ Importación de seguridad

export const estimacionesService = {
  /**
   * Obtiene sugerencias de compra basadas en la vista de proyección.
   * 🚀 ACTUALIZADO: Se cruza la información con `lista_insumo` y `cat_unidades_medida`
   * para asegurar que el modelo, la unidad de medida en texto y las cantidades exactas 
   * lleguen correctamente a la interfaz.
   */
  async getSugerenciasCompra(sucursalId) {
    try {
      if (!hasPermission('ver_inventario')) {
        return { success: false, error: 'No tienes permisos para ver proyecciones de compra.' };
      }

      // 1. Obtener los datos base de la vista SQL
      const { data: viewData, error: viewError } = await supabase
        .from('vista_proyeccion_compras') 
        .select('*')
        .eq('sucursal_id', sucursalId); 

      if (viewError) throw viewError;

      // 2. Extraer los IDs de los insumos para hacer una consulta secundaria optimizada
      const insumoIds = viewData.map(v => v.insumo_id);

      // 3. Traer el modelo, el contenido neto y el nombre de la unidad de medida
      let insumosData = [];
      if (insumoIds.length > 0) {
        const { data: insumosExtra, error: insumosError } = await supabase
          .from('lista_insumo')
          .select(`
            id,
            modelo,
            contenido_neto,
            cat_unidades_medida (
              abreviatura
            )
          `)
          .in('id', insumoIds);
          
        if (!insumosError && insumosExtra) {
          insumosData = insumosExtra;
        }
      }

      // 4. Combinar (Merge) la vista con los datos extraídos
      const mergedData = viewData.map(v => {
        // Buscamos la info extra del insumo actual
        const infoExtra = insumosData.find(i => i.id === v.insumo_id) || {};
        const unidadAbreviatura = infoExtra.cat_unidades_medida?.abreviatura || 'Uds';
        
        // Calculamos la cantidad sugerida exacta (si la vista solo trae cajas)
        let cantSugerida = v.cantidad_sugerida;
        if (cantSugerida === undefined || cantSugerida === null) {
          const cajas = parseFloat(v.cajas_a_pedir || 0);
          const contenido = parseFloat(infoExtra.contenido_neto || 1);
          cantSugerida = (cajas * contenido).toFixed(2);
        }

        return {
          ...v,
          // Agregamos o sobrescribimos los campos necesarios para la UI
          modelo: v.modelo || infoExtra.modelo || '',
          unidad_medida: v.unidad_medida || unidadAbreviatura,
          cantidad_sugerida: parseFloat(cantSugerida)
        };
      });

      return { success: true, data: mergedData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtiene el promedio de ventas de PLATILLOS de los últimos 15 días.
   * Esto permite ver "cuántos sándwiches" se venden y proyectar el día de mañana.
   */
  async getProyeccionProductos(sucursalId) {
    try {
      if (!hasPermission('ver_inventario')) {
        return { success: false, error: 'No tienes permisos para ver estadísticas de ventas.' };
      }

      const fecha15Dias = new Date();
      fecha15Dias.setDate(fecha15Dias.getDate() - 15);

      const { data, error } = await supabase
        .from('ventas')
        .select(`
          id,
          ventas_detalle (
            cantidad,
            productosmenu ( nombre )
          )
        `)
        .eq('sucursal_id', sucursalId)
        .eq('estado', 'pagado')
        .gte('created_at', fecha15Dias.toISOString());

      if (error) throw error;

      // Procesamiento de datos para promediar
      const conteo = {};
      data.forEach(venta => {
        venta.ventas_detalle?.forEach(item => {
          const nombre = item.productosmenu?.nombre;
          if (nombre) {
            conteo[nombre] = (conteo[nombre] || 0) + (parseFloat(item.cantidad) || 0);
          }
        });
      });

      const resultado = Object.entries(conteo).map(([nombre, total]) => ({
        nombre,
        promedio_diario: (total / 15).toFixed(2),
        prediccion_manana: Math.ceil(total / 15)
      }));

      return { success: true, data: resultado };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtiene la lista de proveedores activos.
   */
  async getProveedoresActivos() {
    try {
      if (!hasPermission('ver_proveedores')) {
        return { success: false, error: 'No tienes permisos para consultar proveedores.' };
      }

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
   * Trae el historial de movimientos manuales (Salidas y Mermas) de los últimos 15 días.
   */
  async getHistorialConsumo(sucursalId) {
    try {
      if (!hasPermission('ver_inventario')) {
        return { success: false, error: 'No tienes permisos.' };
      }

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
   * Actualiza los parámetros de la estrategia de stock de un insumo en lista_insumo.
   */
  async actualizarPoliticaCompra(insumoId, data) {
    try {
      if (!hasPermission('editar_inventario')) {
        return { success: false, error: 'Acceso denegado: No puedes modificar las políticas de compra.' };
      }

      const { error } = await supabase
        .from('lista_insumo')
        .update({ 
          metodo_compra: data.metodo,
          dias_cobertura_objetivo: data.cobertura, 
          dias_stock_seguridad: data.seguridad,
          stock_minimo: data.minimo,
          stock_maximo: data.maximo
        })
        .eq('id', insumoId);
        
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Registra una compra física, afecta stock_sucursal y genera registro en Kardex.
   */
  async registrarCompraRealizada(insumoId, cantidadCajas, costoTotal, usuarioId, sucursalId) {
    try {
      if (!hasPermission('editar_inventario')) {
        return { success: false, error: 'Acceso denegado: No tienes facultades para registrar compras.' };
      }

      const { data: stockData, error: stockError } = await supabase
        .from('stock_sucursal')
        .select('id, cantidad_actual')
        .eq('insumo_id', insumoId)
        .eq('sucursal_id', sucursalId)
        .maybeSingle(); 

      if (stockError) throw stockError;

      const stockAntes = stockData ? parseFloat(stockData.cantidad_actual) : 0;
      const stockDespues = stockAntes + parseFloat(cantidadCajas);

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