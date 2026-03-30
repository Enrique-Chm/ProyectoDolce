// Archivo: src/modules/Admin/Tabs/MeseroTab/Mesero.service.js
import { supabase } from '../../../../lib/supabaseClient';
import { hasPermission } from '../../../../utils/checkPermiso'; 

export const MeseroService = {
  
  /**
   * 🚀 ACTUALIZADO: Obtiene el catálogo de Zonas (incluyendo grid_size) y Mesas (con pos_x, pos_y y tipo_elemento)
   */
  getZonasYMesas: async (sucursalId) => {
    try {
      if (!hasPermission('ver_comandas')) {
        return { data: [], error: { message: 'No tienes permisos para ver el layout de mesas.' } };
      }

      const { data, error } = await supabase
        .from('cat_zonas')
        .select(`
          id, 
          nombre, 
          orden,
          grid_size,
          cat_mesas (
            id,
            nombre,
            capacidad,
            activa,
            pos_x,
            pos_y,
            tipo_elemento
          )
        `)
        .eq('sucursal_id', Number(sucursalId))
        .eq('activo', true)
        .order('orden', { ascending: true });

      if (error) throw error;

      // Filtramos internamente para asegurar que solo devuelva mesas activas y ordenadas
      const zonasLimpio = data.map(zona => ({
        ...zona,
        cat_mesas: (zona.cat_mesas || [])
          .filter(m => m.activa)
          .sort((a, b) => a.id - b.id) 
      }));

      return { data: zonasLimpio, error: null };
    } catch (err) {
      console.error("Error al obtener zonas y mesas:", err);
      return { data: [], error: err.message };
    }
  },

  /**
   * Obtiene el catálogo de productos con sus extras anidados
   */
  getMenuPOS: async (sucursalId) => {
    try {
      if (!hasPermission('ver_comandas')) {
        return { data: [], error: { message: 'No tienes permisos para ver el menú.' } };
      }

      const { data, error } = await supabase
        .from('productosmenu')
        .select(`
          id,
          nombre,
          precio_venta,
          categoria,
          imagen_url,
          producto_grupos (
            grupos_modificadores (
              id,
              nombre,
              min_seleccion,
              max_seleccion,
              opciones_modificadores (
                id,
                subreceta_id,
                precio_venta,
                cantidad
              )
            )
          )
        `)
        .eq('sucursal_id', Number(sucursalId))
        .eq('disponible', true); 

      if (error) {
        console.error("Error al obtener menú POS:", error);
        return { data: [], error };
      }

      const productosFormateados = data.map(prod => ({
        ...prod,
        grupos: prod.producto_grupos
          .map(pg => pg.grupos_modificadores)
          .filter(g => g !== null) 
      }));

      return { data: productosFormateados, error: null };
    } catch (err) {
      console.error("Excepción en getMenuPOS:", err);
      return { data: [], error: err.message };
    }
  },

  /**
   * Verifica si existe una sesión de caja abierta
   */
  verificarCajaAbierta: async (sucursalId) => {
    try {
      const { data, error } = await supabase
        .from('cajas_sesiones')
        .select('id')
        .eq('sucursal_id', Number(sucursalId))
        .eq('estado', 'abierto') 
        .is('fecha_cierre', null)
        .maybeSingle();
      
      if (error) {
          console.error("Error al verificar caja:", error);
          return { abierta: false, error };
      }
      return { abierta: !!data, sesionId: data?.id, error: null };
    } catch (err) {
      return { abierta: false, error: err.message };
    }
  },

  /**
   * 🚀 NUEVO: Verifica en tiempo real si alguien más ya ocupó la mesa (Evita duplicidad/Race Condition)
   */
  verificarMesaOcupada: async (sucursalId, mesaId) => {
    if (!mesaId) return { ocupada: false }; // Si es venta de mostrador, no aplica el bloqueo
    try {
      const { data, error } = await supabase
        .from('ventas')
        // Usamos !fk_ventas_usuario aquí también por seguridad para evitar el PGRST201
        .select('id, usuarios_internos!fk_ventas_usuario(nombre)')
        .eq('sucursal_id', Number(sucursalId))
        .eq('mesa_id', Number(mesaId))
        .in('estado', ['pendiente', 'cocina', 'entregado', 'por_cobrar', 'abierta'])
        .maybeSingle();

      if (error) throw error;
      return { ocupada: !!data, cuenta: data, error: null };
    } catch (err) {
      console.error("Error al verificar disponibilidad de la mesa:", err);
      return { ocupada: false, error: err.message };
    }
  },

  /**
   * Obtiene las mesas activas filtradas por sucursal.
   * 🚀 SOLUCIONADO: Se agregó el nombre de la llave foránea (!fk_ventas_usuario) 
   * para resolver el conflicto de relaciones múltiples (Error PGRST201) y tener el Table Ownership.
   */
  getCuentasAbiertas: async (sucursalId) => {
    if (!hasPermission('ver_comandas')) {
      return { data: [], error: { message: 'No tienes permisos para ver cuentas abiertas.' } };
    }

    let query = supabase
      .from('ventas')
      .select(`
        *,
        usuarios_internos!fk_ventas_usuario ( nombre ),
        ventas_detalle!venta_id (*)
      `)
      .in('estado', ['pendiente', 'cocina', 'entregado', 'por_cobrar', 'abierta'])
      .order('created_at', { ascending: false });

    if (sucursalId) {
      query = query.eq('sucursal_id', Number(sucursalId));
    }

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Obtiene el historial de ventas pagadas de la sucursal.
   */
  getHistorialCobradas: async (sucursalId) => {
    if (!hasPermission('ver_comandas')) {
      return { data: [], error: { message: 'No tienes permisos para ver el historial.' } };
    }

    let query = supabase
      .from('ventas')
      .select('*')
      .eq('estado', 'pagado')
      .order('hora_cierre', { ascending: false })
      .limit(50);

    if (sucursalId) {
      query = query.eq('sucursal_id', Number(sucursalId));
    }

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Cambia el estado de una mesa a 'por_cobrar'
   */
  marcarPorCobrar: async (ventaId) => {
    if (!hasPermission('editar_comandas')) {
      return { success: false, error: 'No tienes facultades para solicitar la cuenta.' };
    }

    const { error } = await supabase
      .from('ventas')
      .update({ 
        estado: 'por_cobrar',
        hora_por_cobrar: new Date().toISOString()
      })
      .eq('id', ventaId);
      
    return { success: !error, error: error?.message };
  },

  /**
   * 🚀 PROCESAR VENTA (Mantiene lógica de Zonas, Mesas y detalles)
   */
  procesarVenta: async (ventaData, carrito) => {
    if (!hasPermission('crear_comandas')) {
      return { success: false, error: 'Acceso denegado: No puedes registrar nuevas órdenes.' };
    }

    try {
      let ventaId = ventaData.id;

      // 1. VERIFICACIÓN DE CAJA
      const { abierta, sesionId, error: errSesion } = await MeseroService.verificarCajaAbierta(ventaData.sucursal_id);

      if (errSesion || !abierta) {
        throw new Error(`Operación cancelada: No se encontró una sesión de caja abierta. El cajero debe iniciar turno.`);
      }

      // 2. SI ES UNA ORDEN NUEVA
      if (!ventaId) {
        
        // 🚀 DOBLE VALIDACIÓN: Justo antes de insertar, revisamos si no nos ganaron la mesa
        if (ventaData.mesa_id) {
          const { ocupada, cuenta } = await MeseroService.verificarMesaOcupada(ventaData.sucursal_id, ventaData.mesa_id);
          if (ocupada) {
            throw new Error(`MESA GANADA: Esta mesa es de ${cuenta?.usuarios_internos?.nombre || 'otro mesero'}. Actualiza tu mapa.`);
          }
        }

        const totalInicial = carrito.reduce((acc, item) => acc + (item.cantidad * (item.precio_calculado || item.precio_venta)), 0);
        
        const nuevaVentaPayload = {
          usuario_id: Number(ventaData.usuario_id), 
          sucursal_id: Number(ventaData.sucursal_id),
          id_sesion_caja: sesionId, 
          estado: 'pendiente', 
          subtotal: parseFloat(totalInicial), 
          total: parseFloat(totalInicial),
          tipo_orden: ventaData.tipo_orden || 'salon',
          mesa_id: ventaData.mesa_id ? Number(ventaData.mesa_id) : null,
          mesa: ventaData.mesa || 'S/N',
          comensales: ventaData.comensales ? Number(ventaData.comensales) : 1,
          cliente_nombre: ventaData.cliente_nombre || null,
          notas_orden: ventaData.notas_orden || null
        };

        const { data: nuevaVenta, error: errVenta } = await supabase
          .from('ventas')
          .insert([nuevaVentaPayload])
          .select()
          .single();
          
        if (errVenta) throw new Error(`Error de base de datos: ${errVenta.message}`); 
        ventaId = nuevaVenta.id;
      }

      // 3. PREPARAR DETALLES DE PRODUCTOS
      const detalles = carrito.map(item => ({
        venta_id: ventaId, 
        producto_id: parseInt(item.id),
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precio_calculado || item.precio_venta),
        costo_unitario_historico: parseFloat(item.costo_actual || 0), 
        subtotal: parseFloat(item.cantidad * (item.precio_calculado || item.precio_venta)),
        notas: item.notes || item.notas || '',
        extras_seleccionados: item.extras_seleccionados || [] 
      }));

      // 4. INSERTAR DETALLES EN 'ventas_detalle'
      const { error: errDetalles } = await supabase
        .from('ventas_detalle')
        .insert(detalles);
        
      if (errDetalles) throw new Error(`Error al registrar productos: ${errDetalles.message}`);

      // 5. RECALCULAR TOTALES
      const { data: allDetails, error: errCalc } = await supabase
        .from('ventas_detalle')
        .select('subtotal')
        .eq('venta_id', ventaId);
          
      if (errCalc) throw new Error("Error al recalcular totales.");

      const nuevoTotal = (allDetails || []).reduce((sum, item) => sum + item.subtotal, 0);
        
      // Actualizamos el registro padre
      const { error: errUpdate } = await supabase
        .from('ventas')
        .update({ 
          subtotal: parseFloat(nuevoTotal),
          total: parseFloat(nuevoTotal),
          id_sesion_caja: sesionId 
        })
        .eq('id', ventaId);
          
      if (errUpdate) throw new Error("Error al actualizar el total de la mesa.");

      return { success: true, ventaId };
    } catch (error) {
      console.error("Error en procesarVenta (MeseroService):", error);
      return { success: false, error: error.message || "Error desconocido al procesar la venta." };
    }
  }
};