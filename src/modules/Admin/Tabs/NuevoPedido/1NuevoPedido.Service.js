// src/modules/Admin/Tabs/NuevoPedido/1NuevoPedido.Service.js
import { supabase } from '../../../../lib/supabaseClient';

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
    /**
     * NOTA TÉCNICA: Usamos '!inner' en la relación del proveedor para que el filtro 
     * .contains() actúe como un WHERE a nivel de base de datos sobre la tabla de productos.
     */
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
      // Filtramos productos cuyo proveedor tenga el día actual en su arreglo de dias_abierto
      .contains('proveedor.dias_abierto', [diaSemana])
      .order('nombre', { ascending: true });
      
    if (error) {
      console.error("Error técnico al recuperar catálogo:", error.message);
    }
    return { data, error };
  },

  /**
   * 2. GUARDAR ORDEN COMPLETA (Cabecera + Detalles)
   * Procesa la inserción o consolidación de la cabecera y sus respectivas partidas.
   * Si ya existe un pedido Pendiente el día de hoy para la misma sucursal y proveedor,
   * se reutiliza la cabecera y se suman/agregan los productos para consolidar la lista del comprador.
   */
  async guardarOrdenCompleta(ordenCabecera, listaProductos) {
    try {
      // Definimos el rango de tiempo correspondiente al día de hoy (de 00:00:00 a 23:59:59)
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

      // Recuperamos el nombre del solicitante actual para construir la etiqueta de coautoría
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
        // --- ESCENARIO A: CONSOLIDACIÓN (YA EXISTE UN PEDIDO ABIERTO HOY) ---
        ordenFinal = ordenExistente;

        // Construcción avanzada de notas para acumular solicitantes sin repetir nombres
        let notasActualizadas = ordenExistente.notas || '';
        
        // Extraemos o inicializamos la línea que controla los coautores
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
          // Si por alguna razón la orden existente no tenía la etiqueta estructurada, la añadimos de forma limpia
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

        // Si el segundo turno ingresó observaciones, las anexamos de forma limpia abajo del bloque de firmas
        if (ordenCabecera.notas && ordenCabecera.notas.trim() !== '') {
          const limpiaNotasNuevas = ordenCabecera.notas.replace(/\[Solicitantes\]:[^\n]+\n?/, '').trim();
          if (limpiaNotasNuevas !== '') {
            notasActualizadas = `${notasActualizadas}\n[Obs. Adicionales]: ${limpiaNotasNuevas}`;
          }
        }

        // Actualizamos la cabecera existente con la nueva cadena de notas modificada
        await supabase
          .from('BD_Ordenes_Compra')
          .update({ notas: notasActualizadas })
          .eq('id', ordenExistente.id);
        
        ordenFinal.notas = notasActualizadas;

        // Recuperamos las partidas/detalles actuales que ya contiene esa orden
        const { data: detallesExistentes, error: errorGetDetalles } = await supabase
          .from('BD_Ordenes_Detalle')
          .select('*')
          .eq('orden_id', ordenExistente.id);

        if (errorGetDetalles) throw errorGetDetalles;

        // Procesamos la lista de productos que mandó el turno actual
        for (const item of listaProductos) {
          const detalleIgual = detallesExistentes.find(d => d.producto_id === item.producto_id);

          if (detalleIgual) {
            // Si el producto ya fue pedido previamente en el día, SUMAMOS las cantidades
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
            // Si es un producto que no se había pedido hoy, lo INSERTAMOS como partida nueva
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

        // Mantenemos en la respuesta del método las partidas previas que no sufrieron alteraciones
        detallesExistentes.forEach(d => {
          if (!detallesFinales.some(df => df.id === d.id)) {
            detallesFinales.push(d);
          }
        });
      } else {
        // --- ESCENARIO B: REGISTRO NORMAL (PRIMER PEDIDO REALIZADO EN EL DÍA) ---
        let notasIniciales = ordenCabecera.notas || '';
        // Insertamos estructuralmente la firma del primer solicitante en la primera línea
        notasIniciales = `[Solicitantes]: ${nombreSolicitanteActual}\n${notasIniciales}`.trim();

        const payloadCabecera = {
          folio: ordenCabecera.folio,
          solicitante_id: ordenCabecera.solicitante_id,
          sucursal_id: ordenCabecera.sucursal_id,
          proveedor_id: ordenCabecera.proveedor_id || null,
          prioridad: ordenCabecera.prioridad || 'Media',
          estatus: ordenCabecera.estatus || 'Pendiente',
          notas: notasIniciales
        };

        // 1. Insertamos la nueva cabecera
        const { data: nuevaOrden, error: errorCabecera } = await supabase
          .from('BD_Ordenes_Compra')
          .insert([payloadCabecera])
          .select()
          .single();

        if (errorCabecera) throw errorCabecera;

        ordenFinal = nuevaOrden;

        // Formateamos los detalles para inserción masiva
        const detallesFormateados = listaProductos.map(item => ({
          orden_id: ordenFinal.id,
          producto_id: item.producto_id,
          cantidad: Number(item.cantidad),
          estatus: 'Pendiente' 
        }));

        // 2. Inserción masiva de detalles
        const { data: detalles, error: errorDetalles } = await supabase
          .from('BD_Ordenes_Detalle')
          .insert(detallesFormateados)
          .select();

        if (errorDetalles) throw errorDetalles;

        detallesFinales = detalles;
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