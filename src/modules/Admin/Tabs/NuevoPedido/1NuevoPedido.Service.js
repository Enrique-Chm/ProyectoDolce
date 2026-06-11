// src/modules/Admin/Tabs/NuevoPedido/1NuevoPedido.Service.js
import { supabase } from '../../../../lib/supabaseClient';
import { sanitizeString } from '../../../../lib/sanitize';
export const NuevoPedidoService = {
  /**
   * 0. VALIDACIÓN: DÍAS PERMITIDOS DE PEDIDO POR SUCURSAL
   * Consulta los días en los que la sucursal tiene autorizado generar requisiciones.
   * @param {string} sucursalId - UUID de la sucursal del trabajador
   * @returns {{ data: { dias_pedido: string[] }, error }}
   */
  async getDiasPedidoSucursal(sucursalId) {
    if (!sucursalId) return { data: null, error: { message: 'ID de sucursal no proporcionado' } };

    const { data, error } = await supabase
      .from('Cat_sucursales')
      .select('id, nombre, dias_pedido')
      .eq('id', sucursalId)
      .single();

    return { data, error };
  },

  /**
   * 0B. CALENDARIO CRUZADO: ASIGNACIONES SUCURSAL × PROVEEDOR
   * Obtiene las restricciones personalizadas de días de pedido
   * que tiene una sucursal para proveedores específicos.
   * Si un proveedor NO aparece en esta lista, se usa su dias_abierto global.
   * @param {string} sucursalId - UUID de la sucursal
   */
  async getAsignacionesSucursal(sucursalId) {
    if (!sucursalId) return { data: [], error: null };

    const { data, error } = await supabase
      .from('Cat_Sucursal_Proveedor')
      .select('proveedor_id, dias_permitidos')
      .eq('sucursal_id', sucursalId)
      .eq('estatus', 'Activo');

    return { data: data || [], error };
  },

  /**
   * 1. OBTENER PRODUCTOS DISPONIBLES (FILTRADO POR DÍA)
   * Recupera los insumos activos cuyos proveedores estén abiertos el día solicitado.
   * @param {string} diaSemana - Día actual en español (ej. "Lunes", "Martes")
   */
  async getProductosDisponibles(diaSemana) {
    const { data, error } = await supabase
      .from('BD_Productos')
      .select(`
        id, 
        nombre, 
        marca, 
        presentacion, 
        contenido, 
        activo,
        categoria_id,
        proveedor_id,
        sucursales_ids,
        turno_uso,
        um:Cat_UM(id, nombre, abreviatura),
        categoria:Cat_Categorias(id, nombre),
        proveedor:Cat_Proveedores!proveedor_id!inner(id, nombre, dias_abierto)
      `)
      .eq('activo', true)
      .contains('proveedor.dias_abierto', [diaSemana])
      .order('nombre', { ascending: true });

    if (error) {
      console.error("Error técnico al recuperar catálogo:", error.message);
    }
    return { data, error };
  },

  /**
   * 2. GUARDAR ORDEN COMPLETA (Cabecera + Detalles)
   * ACTUALIZACIÓN: Ahora usa la RPC 'crear_orden_validada' para órdenes nuevas.
   * La RPC valida en el servidor: trabajador, turno, sucursal, calendario cruzado
   * y productos antes de crear la orden. Imposible de saltarse desde el frontend.
   *
   * Para consolidación (orden existente del mismo día), se mantiene la lógica
   * en el cliente porque requiere manipulación de notas y merge de detalles.
   */
  async guardarOrdenCompleta(ordenCabecera, listaProductos) {
    try {
      // Definimos el rango de tiempo correspondiente al día de hoy
      const inicioDia = new Date();
      inicioDia.setHours(0, 0, 0, 0);
      const finDia = new Date();
      finDia.setHours(23, 59, 59, 999);

      // 1. Buscamos si ya existe una orden pendiente hoy para la misma sucursal y proveedor
      const { data: ordenExistente, error: errorBusqueda } = await supabase
        .from('BD_Ordenes_Compra')
        .select('*')
        .eq('sucursal_id', ordenCabecera.sucursal_id)
        .eq('proveedor_id', ordenCabecera.proveedor_id)
        .eq('estatus', 'Pendiente')
        .gte('created_at', inicioDia.toISOString())
        .lte('created_at', finDia.toISOString())
        .maybeSingle();

      if (errorBusqueda) throw errorBusqueda;

      // Recuperamos el nombre del solicitante actual para la etiqueta de coautoría
      const { data: trabajadorActual, error: errorTrabajador } = await supabase
        .from('Cat_Trabajadores')
        .select('nombre_completo')
        .eq('id', ordenCabecera.solicitante_id)
        .maybeSingle();

      if (errorTrabajador) throw errorTrabajador;

      const nombreSolicitanteActual = trabajadorActual?.nombre_completo || 'Usuario';

      let ordenFinal = null;
      let detallesFinales = [];

      if (ordenExistente) {
        // ── ESCENARIO A: CONSOLIDACIÓN (YA EXISTE UN PEDIDO ABIERTO HOY) ──
        ordenFinal = ordenExistente;

        // Construcción avanzada de notas para acumular solicitantes sin repetir nombres
        let notasActualizadas = ordenExistente.notas || '';

        const regexSolicitantes = /\[Solicitantes\]:\s*([^\n]+)/;
        const match = notasActualizadas.match(regexSolicitantes);

        if (match) {
          const listaNombres = match[1].split(',').map(n => n.trim());
          if (!listaNombres.includes(nombreSolicitanteActual)) {
            listaNombres.push(nombreSolicitanteActual);
          }
          const nuevaLinea = `[Solicitantes]: ${listaNombres.join(', ')}`;
          notasActualizadas = notasActualizadas.replace(regexSolicitantes, nuevaLinea);
        } else {
          let nombrePrimerSolicitante = 'Admin';
          if (ordenExistente.solicitante_id) {
            const { data: t1 } = await supabase
              .from('Cat_Trabajadores')
              .select('nombre_completo')
              .eq('id', ordenExistente.solicitante_id)
              .maybeSingle();
            if (t1?.nombre_completo) nombrePrimerSolicitante = t1.nombre_completo;
          }
          const nombresUnificados = nombrePrimerSolicitante === nombreSolicitanteActual
            ? nombreSolicitanteActual
            : `${nombrePrimerSolicitante}, ${nombreSolicitanteActual}`;
          notasActualizadas = `[Solicitantes]: ${nombresUnificados}\n${notasActualizadas}`.trim();
        }

        if (ordenCabecera.notas && ordenCabecera.notas.trim() !== '') {
          const limpiaNotasNuevas = ordenCabecera.notas.replace(/\[Solicitantes\]:[^\n]+\n?/, '').trim();
          if (limpiaNotasNuevas !== '') {
            notasActualizadas = `${notasActualizadas}\n[Obs. Adicionales]: ${limpiaNotasNuevas}`;
          }
        }

        await supabase
          .from('BD_Ordenes_Compra')
          .update({ notas: sanitizeString(notasActualizadas) })
          .eq('id', ordenExistente.id);

        ordenFinal.notas = notasActualizadas;

        const { data: detallesExistentes, error: errorGetDetalles } = await supabase
          .from('BD_Ordenes_Detalle')
          .select('*')
          .eq('orden_id', ordenExistente.id);

        if (errorGetDetalles) throw errorGetDetalles;

        for (const item of listaProductos) {
          const detalleIgual = detallesExistentes.find(d => d.producto_id === item.producto_id);

          if (detalleIgual) {
            const nuevaCantidad = Number(detalleIgual.cantidad) + Number(item.cantidad);
            const { data: detalleActualizado, error: errorUpdateDetalle } = await supabase
              .from('BD_Ordenes_Detalle')
              .update({ cantidad: nuevaCantidad })
              .eq('id', detalleIgual.id)
              .select()
              .single();
            if (errorUpdateDetalle) throw errorUpdateDetalle;
            detallesFinales.push(detalleActualizado);
          } else {
            const { data: nuevoDetalle, error: errorInsertDetalle } = await supabase
              .from('BD_Ordenes_Detalle')
              .insert([{
                orden_id: ordenExistente.id,
                producto_id: item.producto_id,
                cantidad: Number(item.cantidad),
                estatus: 'Pendiente'
              }])
              .select()
              .single();
            if (errorInsertDetalle) throw errorInsertDetalle;
            detallesFinales.push(nuevoDetalle);
          }
        }

        detallesExistentes.forEach(d => {
          if (!detallesFinales.some(df => df.id === d.id)) {
            detallesFinales.push(d);
          }
        });

      } else {
        // ── ESCENARIO B: ORDEN NUEVA — VALIDADA EN SERVIDOR VÍA RPC ──

        // Construimos las notas con la firma del solicitante
        let notasIniciales = ordenCabecera.notas || '';
               notasIniciales = sanitizeString(`[Solicitantes]: ${nombreSolicitanteActual}\n${notasIniciales}`.trim());
        // Formateamos los productos como JSONB para la RPC
        const productosJsonb = listaProductos.map(item => ({
          producto_id: item.producto_id,
          cantidad:    Number(item.cantidad)
        }));

        // Llamada a la RPC con validaciones server-side
        const { data: resultado, error: errorRPC } = await supabase.rpc('crear_orden_validada', {
          p_folio:          ordenCabecera.folio,
          p_solicitante_id: ordenCabecera.solicitante_id,
          p_sucursal_id:    ordenCabecera.sucursal_id,
          p_proveedor_id:   ordenCabecera.proveedor_id || null,
          p_notas:          notasIniciales,
          p_estatus:        ordenCabecera.estatus || 'Pendiente',
          p_productos:      productosJsonb
        });

        // La RPC retorna un JSON con { error: bool, mensaje: string, orden_id?: uuid }
        if (errorRPC) throw errorRPC;

        if (resultado?.error) {
          // Validación del servidor falló — retornamos el mensaje descriptivo
          return {
            data: null,
            error: { message: resultado.mensaje }
          };
        }

        // Éxito — construimos la respuesta compatible con el flujo existente
        ordenFinal = {
          id:    resultado.orden_id,
          folio: resultado.folio
        };
        detallesFinales = [];
      }

      return {
        data: { orden: ordenFinal, detalles: detallesFinales },
        error: null
      };
    } catch (err) {
      console.error("Error en flujo guardarOrdenCompleta:", err);
      return {
        data: null,
        error: {
          message: err.message,
          code: err.code,
          details: err.details
        }
      };
    }
  }
};