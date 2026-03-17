// Archivo: src/services/inventario.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Importación de seguridad

export const inventarioService = {

  async getInsumos(sucursalId) {
    // 🛡️ Blindaje de lectura
    if (!hasPermission('ver_inventario')) return [];

    const { data: catalogo, error: errC } = await supabase
      .from('lista_insumo')
      .select(`id, nombre, cat_unidades_medida!unidad_medida(abreviatura), cat_categoria_insumos(nombre)`);

    if (errC) throw errC;

    const { data: saldos } = await supabase
      .from('stock_sucursal')
      .select('insumo_id, cantidad_actual')
      .eq('sucursal_id', sucursalId);

    return catalogo.map(item => {
      const saldoObj = saldos?.find(s => s.insumo_id === item.id);
      return {
        id: item.id,
        nombre: item.nombre || '',
        caja_master: saldoObj ? parseFloat(saldoObj.cantidad_actual) : 0,
        unidad: item.cat_unidades_medida?.abreviatura || 'pz',
        categoria: item.cat_categoria_insumos?.nombre || 'General'
      };
    });
  },

  async crearMovimiento(movimiento) {
    // 🛡️ Blindaje de escritura (Kardex)
    if (!hasPermission('editar_inventario')) {
      return { success: false, error: 'Acceso denegado: No tienes facultades para mover inventario.' };
    }

    try {
      const { data: movData, error: errorMov } = await supabase
        .from('inventario_movimientos')
        .insert([movimiento])
        .select().single();

      if (errorMov) throw errorMov;

      const { error: errorUpsert } = await supabase
        .from('stock_sucursal')
        .upsert({ 
          sucursal_id: movimiento.sucursal_id,
          insumo_id: movimiento.insumo_id,
          cantidad_actual: movimiento.stock_despues,
          updated_at: new Date().toISOString()
        }, { onConflict: 'sucursal_id, insumo_id' });

      if (errorUpsert) throw errorUpsert;
      return { success: true, data: movData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async calcularContraste(sucursalId, fechaInicio, fechaFin) {
    // 🛡️ Blindaje de lectura de reportes
    if (!hasPermission('ver_inventario')) {
      return { data: null, error: 'No tienes permiso para ver reportes de contraste.' };
    }

    try {
      const fInicioISO = `${fechaInicio}T00:00:00.000Z`;
      const fFinISO = `${fechaFin}T23:59:59.999Z`;

      const [insumos, recetas, ventasDetalle, movimientos] = await Promise.all([
        this.getInsumos(sucursalId),
        supabase.from('vista_recetas_completas').select('*').eq('sucursal_id', sucursalId),
        supabase.from('ventas_detalle')
          .select(`cantidad, productosmenu(nombre), ventas!inner(created_at, estado, sucursal_id)`)
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
            stockInicial = parseFloat(insumo.caja_master);
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
            stock_actual_db: parseFloat(insumo.caja_master).toFixed(2)
          };
        }),
        error: null
      };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  async aplicarAuditoriaInsumo({ sucursal_id, insumo_id, stock_esperado, conteo_fisico, usuario_id }) {
    // 🛡️ Blindaje crítico: Las auditorías son la base del control
    if (!hasPermission('editar_inventario')) {
      return { success: false, error: 'Acceso denegado: Se requiere rol administrativo para auditar insumos.' };
    }

    try {
      const fisico = parseFloat(conteo_fisico); 
      const esperado = parseFloat(stock_esperado);
      const diferenciaTotal = fisico - esperado;
      const timestamp = new Date().toISOString();

      // 1. Justificación en Kardex si hay diferencia REAL
      if (Math.abs(diferenciaTotal) >= 0.001) {
        const { error: errMov } = await supabase.from('inventario_movimientos').insert([{
          sucursal_id,
          insumo_id,
          tipo: diferenciaTotal > 0 ? 'ENTRADA' : 'MERMA',
          cantidad_afectada: Math.abs(diferenciaTotal),
          stock_antes: esperado,
          stock_despues: fisico,
          motivo: diferenciaTotal > 0 ? 'Ajuste de Auditoría: Sobrante Real' : 'Ajuste de Auditoría: Faltante Real',
          usuario_id,
          created_at: timestamp
        }]);

        if (errMov) throw errMov;
      }

      // 2. MAGIA: ESTO SIEMPRE SE EJECUTA.
      // Sincronización forzada con la base de datos.
      const { error: errUpsert } = await supabase.from('stock_sucursal').upsert({
        sucursal_id,
        insumo_id,
        cantidad_actual: fisico,
        updated_at: timestamp
      }, { onConflict: 'sucursal_id, insumo_id' });

      if (errUpsert) throw errUpsert;

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getMotivos() {
    // No requiere blindaje estricto por ser un catálogo auxiliar, pero validamos
    if (!hasPermission('ver_inventario')) return [];
    const { data } = await supabase.from('cat_motivos_inventario').select('*').eq('activo', true);
    return data || [];
  },

  async getMovimientos(sucursalId) {
    // 🛡️ Blindaje de lectura de histórico
    if (!hasPermission('ver_inventario')) return [];
    const { data } = await supabase.from('inventario_movimientos').select('*, insumo:insumo_id(nombre)').eq('sucursal_id', sucursalId).order('created_at', { ascending: false });
    return data || [];
  }
};