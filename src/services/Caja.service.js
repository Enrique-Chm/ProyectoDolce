// Archivo: src/services/Caja.service.js
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Importamos el validador

export const CajaService = {

  /* ==========================================
     1. CATÁLOGOS (cat_motivos_inventario)
     ========================================== */

  getMotivosInventario: async () => {
    const { data, error } = await supabase
      .from('cat_motivos_inventario')
      .select('id, nombre_motivo, tipo, descripcion, origen')
      .eq('activo', true)
      .eq('origen', 'Caja');
      
    return { data, error };
  },

  /* ==========================================
     2. GESTIÓN DE SESIONES (cajas_sesiones)
     ========================================== */

  // 💡 CORRECCIÓN VITAL: Ahora SOLO recibe sucursalId (1 sola manzana)
  getSesionActiva: async (sucursalId) => {
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .select('*')
      .is('fecha_cierre', null)
      .eq('sucursal_id', sucursalId) // 👈 Busca directamente por sucursal
      .eq('estado', 'abierto')       
      .maybeSingle();
    return { data, error };
  },

  abrirCaja: async (datos) => {
    // 🛡️ Seguridad: Solo usuarios con permiso de edición pueden abrir caja
    if (!hasPermission('editar_ventas')) {
      return { data: null, error: { message: "No tienes permisos para abrir la caja." } };
    }

    // 🔴 PUNTO CLAVE: Aquí se inserta el usuario_id (para control) y el sucursal_id
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .insert([{ 
        usuario_id: datos.usuario_id, // 👈 Regla: Control de quién abre la caja
        sucursal_id: datos.sucursal_id, 
        monto_apertura: parseFloat(datos.monto_apertura),
        estado: 'abierto',             
        fecha_apertura: new Date().toISOString() 
      }])
      .select()
      .single();
    return { data, error };
  },

  cerrarCaja: async (sesionId, datosCierre) => {
    if (!hasPermission('editar_ventas')) {
      return { data: null, error: { message: "No tienes permisos para cerrar la caja." } };
    }

    const { data, error } = await supabase
      .from('cajas_sesiones')
      .update({ 
        monto_cierre_real: parseFloat(datosCierre.monto_cierre_real),
        monto_cierre_esperado: parseFloat(datosCierre.monto_cierre_esperado),
        diferencia: parseFloat(datosCierre.diferencia),
        estado: 'cerrado', 
        fecha_cierre: new Date().toISOString() 
      })
      .eq('id', sesionId)
      .select();
    return { data, error };
  },

  /* ==========================================
     3. MOVIMIENTOS DE CAJA (caja_movimientos)
     ========================================== */

  registrarMovimiento: async (movimiento) => {
    if (!hasPermission('editar_ventas')) {
      return { data: null, error: { message: "No tienes permisos para registrar movimientos." } };
    }

    const { data, error } = await supabase
      .from('caja_movimientos')
      .insert([{
        turno_id: movimiento.turno_id,
        usuario_id: movimiento.usuario_id,
        tipo: movimiento.tipo, 
        monto: parseFloat(movimiento.monto),
        motivo: movimiento.motivo 
      }])
      .select();
    return { data, error };
  },

  getMovimientosSesion: async (turnoId) => {
    if (!hasPermission('ver_ventas')) return { data: [], error: null };

    const { data, error } = await supabase
      .from('caja_movimientos')
      .select('*')
      .eq('turno_id', turnoId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  /* ==========================================
     4. CÁLCULOS DE ARQUEO Y VENTAS
     ========================================== */

  getTotalesEfectivoSesion: async (fechaApertura, sucursalId) => {
    let query = supabase
      .from('ventas')
      .select('total')
      .gte('hora_cierre', fechaApertura) 
      .eq('metodo_pago', 'efectivo')
      .eq('estado', 'pagado');

    if (sucursalId) {
      query = query.eq('sucursal_id', sucursalId);
    }

    const { data, error } = await query;
    const totalVentas = data?.reduce((acc, curr) => acc + curr.total, 0) || 0;
    return { totalVentas, error };
  },

  getHistorialSesiones: async (sucursalId, limit = 20) => {
    if (!hasPermission('ver_ventas')) return { data: [], error: null };

    let query = supabase
      .from('cajas_sesiones')
      .select('*')
      .not('fecha_cierre', 'is', null)
      .order('fecha_apertura', { ascending: false })
      .limit(limit);

    if (sucursalId) {
      query = query.eq('sucursal_id', sucursalId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  /* ==========================================
     5. COBROS Y GESTIÓN DE CUENTAS 
     ========================================== */

  /**
   * Obtiene las ventas pendientes filtradas por sucursal e ID de sesión (turno actual).
   */
  getVentasPendientes: async (sucursalId, sesionId) => {
    if (!hasPermission('ver_ventas')) return { data: [], error: null };

    let query = supabase
      .from('ventas')
      .select('*')
      .eq('id_sesion_caja', sesionId) // 👈 Solo de este turno
      .in('estado', ['pendiente', 'cocina', 'entregado', 'por_cobrar'])
      .order('created_at', { ascending: false });

    if (sucursalId) {
      query = query.eq('sucursal_id', sucursalId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  finalizarVenta: async (idVenta, datos) => {
    if (!hasPermission('editar_ventas')) {
      return { data: null, error: { message: "No tienes permisos para cobrar cuentas." } };
    }

    const { data, error } = await supabase
      .from('ventas')
      .update({
        estado: datos.estado || 'pagado',
        metodo_pago: datos.metodo_pago,
        hora_cierre: new Date().toISOString()
      })
      .eq('id', idVenta)
      .select();
    return { data, error };
  },

  getDetalleVenta: async (idVenta) => {
    if (!hasPermission('ver_ventas')) return { data: [], error: null };

    const { data, error } = await supabase
      .from('ventas_detalle')
      // 💡 Corregido: 'productosmenu' para coincidir con tu esquema
      .select('*, productosmenu(nombre)') 
      .eq('venta_id', idVenta);
    return { data, error };
  },

  /**
   * Obtiene las ventas cobradas filtradas por sucursal e ID de sesión (turno actual).
   */
  getVentasCobradas: async (sucursalId, sesionId, limit = 15) => {
    if (!hasPermission('ver_ventas')) return { data: [], error: null };

    let query = supabase
      .from('ventas')
      .select('*')
      .eq('id_sesion_caja', sesionId) // 👈 Solo de este turno
      .eq('estado', 'pagado')
      .order('hora_cierre', { ascending: false })
      .limit(limit);

    if (sucursalId) {
      query = query.eq('sucursal_id', sucursalId);
    }

    const { data, error } = await query;
    return { data, error };
  }
};