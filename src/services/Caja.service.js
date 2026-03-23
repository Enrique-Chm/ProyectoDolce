// Archivo: src/services/CajaService.js
import { supabase } from '../lib/supabaseClient';

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

  getSesionActiva: async (usuarioId, sucursalId) => {
    // 🛡️ Se agrega sucursalId para asegurar que la sesión pertenezca a la sucursal actual
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .select('*')
      .is('fecha_cierre', null)
      .eq('usuario_id', usuarioId)
      .eq('sucursal_id', sucursalId) // Filtro por sucursal
      .eq('estado', 'abierto')       // Consistencia con el término masculino
      .maybeSingle();
    return { data, error };
  },

  abrirCaja: async (datos) => {
    // 🔴 CORRECCIÓN CRÍTICA: Se incluye sucursal_id para evitar valores NULL en la DB
    // Esto permite que el candado del MeseroTab reconozca la caja abierta
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .insert([{ 
        usuario_id: datos.usuario_id,
        sucursal_id: datos.sucursal_id, // <--- CAMBIO: Ahora se guarda la sucursal
        monto_apertura: parseFloat(datos.monto_apertura),
        estado: 'abierto',             // Consistencia con 'abierto' 
        fecha_apertura: new Date().toISOString() 
      }])
      .select()
      .single();
    return { data, error };
  },

  cerrarCaja: async (sesionId, datosCierre) => {
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

  getTotalesEfectivoSesion: async (fechaApertura) => {
    const { data, error } = await supabase
      .from('ventas')
      .select('total')
      .gte('hora_cierre', fechaApertura) 
      .eq('metodo_pago', 'efectivo')
      .eq('estado', 'pagado');
    
    const totalVentas = data?.reduce((acc, curr) => acc + curr.total, 0) || 0;
    return { totalVentas, error };
  },

  getHistorialSesiones: async (limit = 20) => {
    const { data, error } = await supabase
      .from('cajas_sesiones')
      .select('*')
      .not('fecha_cierre', 'is', null)
      .order('fecha_apertura', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  /* ==========================================
     5. COBROS Y GESTIÓN DE CUENTAS 
     ========================================== */

  getVentasPendientes: async () => {
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .in('estado', ['abierta', 'pendiente', 'por_cobrar'])
      .order('created_at', { ascending: false });
    return { data, error };
  },

  finalizarVenta: async (idVenta, datos) => {
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
    const { data, error } = await supabase
      .from('ventas_detalle')
      .select('*') // Si tienes error PGRST201 aquí, usa: .select('*, ventas!venta_id(*)')
      .eq('venta_id', idVenta);
    return { data, error };
  }
};