// Archivo: src/services/inventario.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; 

export const inventarioService = {

  /**
   * Obtiene el catálogo de insumos cruzado con el stock actual de la sucursal.
   */
  async getInsumos(sucursalId) {
    if (!hasPermission('ver_inventario')) return [];

    /**
     * 🛡️ SOLUCIÓN DEFINITIVA PGRST200:
     * Usamos los nombres de los constraints definidos en SQL (!fk_insumo_unidad y !fk_insumo_categoria).
     * Esto ignora cualquier duplicidad en el esquema de Supabase.
     */
    const { data: catalogo, error: errC } = await supabase
      .from('lista_insumo')
      .select(`
        id, 
        nombre, 
        cat_unidades_medida!fk_insumo_unidad (abreviatura), 
        cat_categoria_insumos!fk_insumo_categoria (nombre)
      `);

    if (errC) {
      console.error("Error al sincronizar catálogo de insumos:", errC);
      throw errC;
    }

    // Traemos los saldos actuales por sucursal para cruzar la información
    const { data: saldos, error: errS } = await supabase
      .from('stock_sucursal')
      .select('insumo_id, cantidad_actual')
      .eq('sucursal_id', sucursalId);

    if (errS) {
      console.error("Error al obtener saldos de sucursal:", errS);
    }

    // Mapeamos los datos para entregar un objeto limpio al Frontend
    return catalogo.map(item => {
      const saldoObj = saldos?.find(s => s.insumo_id === item.id);
      
      return {
        id: item.id,
        nombre: item.nombre || '',
        // 💡 CORRECCIÓN CRÍTICA: Se expone explícitamente como cantidad_actual
        cantidad_actual: saldoObj ? parseFloat(saldoObj.cantidad_actual) : 0,
        // Acceso directo a través de los alias resueltos por Supabase
        unidad: item.cat_unidades_medida?.abreviatura || 'pz',
        categoria: item.cat_categoria_insumos?.nombre || 'General'
      };
    });
  },

  /**
   * Registra un movimiento en el Kardex y actualiza el stock físico.
   */
  async crearMovimiento(movimiento) {
    if (!hasPermission('crear_inventario')) {
      return { success: false, error: 'Acceso denegado: No tienes permisos para crear movimientos.' };
    }

    try {
      // 1. Insertar el registro histórico en inventario_movimientos
      const { data: movData, error: errorMov } = await supabase
        .from('inventario_movimientos')
        .insert([movimiento])
        .select()
        .single();

      if (errorMov) throw errorMov;

      // 2. Sincronizar el stock real en stock_sucursal (Ajuste perpetuo seguro sin Upsert)
      const { data: stockExistente, error: errExistente } = await supabase
        .from('stock_sucursal')
        .select('id')
        .eq('sucursal_id', movimiento.sucursal_id)
        .eq('insumo_id', movimiento.insumo_id)
        .maybeSingle();

      if (errExistente) throw errExistente;

      if (stockExistente) {
        // Actualizamos la fila que ya existe
        const { error: errUpdate } = await supabase
          .from('stock_sucursal')
          .update({ 
            cantidad_actual: movimiento.stock_despues,
            updated_at: new Date().toISOString()
          })
          .eq('id', stockExistente.id);
        if (errUpdate) throw errUpdate;
      } else {
        // Insertamos por primera vez el insumo en esta sucursal
        const { error: errInsert } = await supabase
          .from('stock_sucursal')
          .insert([{
            sucursal_id: movimiento.sucursal_id,
            insumo_id: movimiento.insumo_id,
            cantidad_actual: movimiento.stock_despues,
            updated_at: new Date().toISOString()
          }]);
        if (errInsert) throw errInsert;
      }
      
      return { success: true, data: movData };
    } catch (error) {
      console.error("Error crítico en movimiento:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Motor de Auditoría: Compara Stock Inicial + Compras - Ventas vs Real
   */
  async calcularContraste(sucursalId, fechaInicio, fechaFin) {
    if (!hasPermission('ver_inventario')) {
      return { data: null, error: 'Acceso denegado.' };
    }

    try {
      const fInicioISO = `${fechaInicio}T00:00:00.000Z`;
      const fFinISO = `${fechaFin}T23:59:59.999Z`;

      // Obtenemos catálogo fresco (ahora traerá cantidad_actual)
      const insumos = await inventarioService.getInsumos(sucursalId);

      const [recetas, ventasDetalle, movimientos] = await Promise.all([
        supabase.from('vista_recetas_completas').select('*').eq('sucursal_id', sucursalId),
        supabase.from('ventas_detalle')
          .select(`
            cantidad, 
            productosmenu(nombre), 
            ventas!venta_id!inner(created_at, estado, sucursal_id)
          `) 
          .eq('ventas.sucursal_id', sucursalId)
          .eq('ventas.estado', 'pagado')
          .gte('ventas.created_at', fInicioISO)
          .lte('ventas.created_at', fFinISO),
        supabase.from('inventario_movimientos')
          .select('*')
          .eq('sucursal_id', sucursalId)
          .gte('created_at', fInicioISO)
          .lte('created_at', fFinISO)
      ]);

      return {
        data: insumos.map(insumo => {
          const movsInsumo = (movimientos.data || []).filter(m => m.insumo_id === insumo.id);
          const compras = movsInsumo.filter(m => m.tipo === 'ENTRADA').reduce((acc, m) => acc + parseFloat(m.cantidad_afectada), 0);
          const mermas = movsInsumo.filter(m => m.tipo !== 'ENTRADA').reduce((acc, m) => acc + parseFloat(m.cantidad_afectada), 0);

          let stockInicial = 0;
          if (movsInsumo.length > 0) {
            const movsOrdenados = [...movsInsumo].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            stockInicial = parseFloat(movsOrdenados[0].stock_antes);
          } else {
            // 💡 Usamos cantidad_actual porque caja_master ya no se expone erróneamente
            stockInicial = parseFloat(insumo.cantidad_actual || 0);
          }

          const vendidoTeorico = (ventasDetalle.data || []).reduce((acc, v) => {
            const receta = (recetas.data || []).find(r => r.nombre === v.productosmenu?.nombre);
            if (receta && receta.detalle_ingredientes) {
              const ing = receta.detalle_ingredientes.find(i => i.insumo.trim().toLowerCase() === insumo.nombre.trim().toLowerCase());
              if (ing) return acc + (parseFloat(ing.cantidad) * v.cantidad);
            }
            return acc;
          }, 0);

          return {
            id: insumo.id,
            insumo: insumo.nombre,
            unidad: insumo.unidad,
            stock_inicial: stockInicial.toFixed(2),
            compras: compras.toFixed(2),
            vendido: vendidoTeorico.toFixed(2),
            mermas: mermas.toFixed(2),
            stock_esperado: (stockInicial + compras - vendidoTeorico - mermas).toFixed(2),
            stock_actual_db: parseFloat(insumo.cantidad_actual || 0).toFixed(2)
          };
        }),
        error: null
      };
    } catch (err) {
      console.error("Error en motor de contraste:", err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Aplica un ajuste de inventario real tras auditoría física individual.
   */
  async aplicarAuditoriaInsumo({ sucursal_id, insumo_id, stock_esperado, conteo_fisico, usuario_id }) {
    if (!hasPermission('editar_inventario')) {
      return { success: false, error: 'Acceso denegado.' };
    }

    try {
      const fisico = parseFloat(conteo_fisico); 
      const esperado = parseFloat(stock_esperado);
      const diferenciaTotal = fisico - esperado;
      const timestamp = new Date().toISOString();

      // Solo si hay discrepancia mayor a un gramo/unidad registramos el movimiento
      if (Math.abs(diferenciaTotal) >= 0.001) {
        const { error: errMov } = await supabase.from('inventario_movimientos').insert([{
          sucursal_id,
          insumo_id,
          tipo: diferenciaTotal > 0 ? 'ENTRADA' : 'MERMA',
          cantidad_afectada: Math.abs(diferenciaTotal),
          stock_antes: esperado,
          stock_despues: fisico,
          motivo: diferenciaTotal > 0 ? 'Auditoría: Sobrante' : 'Auditoría: Faltante',
          usuario_id,
          created_at: timestamp
        }]);

        if (errMov) throw errMov;
      }

      // Actualización mandatoria del stock en sucursal (Usando lógica Select + Update/Insert)
      const { data: stockExistente, error: errExistente } = await supabase
        .from('stock_sucursal')
        .select('id')
        .eq('sucursal_id', sucursal_id)
        .eq('insumo_id', insumo_id)
        .maybeSingle();

      if (errExistente) throw errExistente;

      if (stockExistente) {
        const { error: errUp } = await supabase
          .from('stock_sucursal')
          .update({ cantidad_actual: fisico, updated_at: timestamp })
          .eq('id', stockExistente.id);
        if (errUp) throw errUp;
      } else {
        const { error: errIn } = await supabase
          .from('stock_sucursal')
          .insert([{
            sucursal_id,
            insumo_id,
            cantidad_actual: fisico,
            updated_at: timestamp
          }]);
        if (errIn) throw errIn;
      }

      return { success: true };
    } catch (error) {
      console.error("Error al guardar ajuste físico:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Ejecuta múltiples ajustes de auditoría en paralelo (Cierre Masivo)
   */
  async aplicarAuditoriaMasiva(ajustes, usuario_id, sucursal_id) {
    if (!hasPermission('editar_inventario')) {
      return { success: false, error: 'Acceso denegado.' };
    }

    try {
      // Ejecutamos todos los ajustes en paralelo usando la función individual que ya es segura
      const promesas = ajustes.map(ajuste => 
        this.aplicarAuditoriaInsumo({
          sucursal_id,
          insumo_id: ajuste.id,
          stock_esperado: ajuste.stock_esperado,
          conteo_fisico: ajuste.conteo_fisico,
          usuario_id
        })
      );

      const resultados = await Promise.all(promesas);
      
      // Verificamos si alguno falló
      const errores = resultados.filter(r => !r.success);
      if (errores.length > 0) {
        throw new Error(`Se guardaron algunos, pero fallaron ${errores.length} insumos.`);
      }

      return { success: true };
    } catch (error) {
      console.error("Error en auditoría masiva:", error);
      return { success: false, error: error.message };
    }
  },

  async getMotivos() {
    if (!hasPermission('ver_inventario')) return [];
    const { data } = await supabase
      .from('cat_motivos_inventario')
      .select('*')
      .eq('activo', true);
    return data || [];
  },

  async getMovimientos(sucursalId) {
    if (!hasPermission('ver_inventario')) return [];
    const { data } = await supabase
      .from('inventario_movimientos')
      .select('*, insumo:insumo_id(nombre)')
      .eq('sucursal_id', sucursalId)
      .order('created_at', { ascending: false });
    return data || [];
  }
};