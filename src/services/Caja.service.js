// Archivo: src/modules/Admin/services/Caja.service.js
import { supabase } from '../lib/supabaseClient';
import { generarHTMLTicket } from '../utils/impresion.util';
import { impresorasService } from './Impresoras.service';

export const cajaService = {
  // ==========================================
  // 1. GESTIÓN DE TURNOS (APERTURA/CIERRE)
  // ==========================================

  async getTurnoActivo(sucursalId) {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('sucursal_id', sucursalId)
      .eq('estado', 'abierto')
      .maybeSingle();
    return { data, error };
  },

  async abrirTurno(sucursalId, usuarioId, montoApertura) {
    const { data, error } = await supabase
      .from('turnos')
      .insert([{
        sucursal_id: sucursalId,
        usuario_id: usuarioId,
        monto_apertura: parseFloat(montoApertura) || 0,
        estado: 'abierto'
      }])
      .select()
      .single();
    return { data, error };
  },

  async cerrarTurno(turnoId, datosCierre) {
    const { data, error } = await supabase
      .from('turnos')
      .update({
        fecha_cierre: new Date().toISOString(),
        monto_cierre_esperado: datosCierre.esperado,
        monto_cierre_real: datosCierre.real,
        diferencia: datosCierre.real - datosCierre.esperado,
        estado: 'cerrado'
      })
      .eq('id', turnoId);
    return { data, error };
  },

  /**
   * Obtiene el historial de turnos. 
   * NOTA: Usamos !usuario_id para resolver el error PGRST201 de Supabase
   */
  async getHistorialTurnos(sucursalId, limite = 30) {
    const { data, error } = await supabase
      .from('turnos')
      .select(`
        *,
        usuarios_internos!usuario_id (
          nombre
        )
      `)
      .eq('sucursal_id', sucursalId)
      .eq('estado', 'cerrado')
      .order('fecha_cierre', { ascending: false })
      .limit(limite);
    
    if (error) console.error("Error en getHistorialTurnos:", error.message);
    return { data, error };
  },

  // ==========================================
  // 2. MOVIMIENTOS DE CAJA (ENTRADAS/SALIDAS)
  // ==========================================

  async registrarMovimiento(turnoId, usuarioId, tipo, monto, motivo) {
    const { data, error } = await supabase
      .from('caja_movimientos')
      .insert([{
        turno_id: turnoId,
        usuario_id: usuarioId,
        tipo, // 'entrada' o 'salida'
        monto: parseFloat(monto),
        motivo
      }]);
    return { data, error };
  },

  // ==========================================
  // 3. CONFIGURACIÓN VISUAL DEL TICKET
  // ==========================================

  async getConfigTicket(sucursalId) {
    const { data, error } = await supabase
      .from('config_tickets')
      .select('*')
      .eq('sucursal_id', sucursalId)
      .maybeSingle();
    return { data, error };
  },

  async guardarConfigTicket(config) {
    const { data, error } = await supabase
      .from('config_tickets')
      .upsert([config])
      .select();
    return { data, error };
  },

  // ==========================================
  // 4. LÓGICA DE IMPRESIÓN
  // ==========================================

  async imprimirTicketVenta(venta, sucursalId) {
    try {
      const { data: imps } = await impresorasService.getAll(sucursalId);
      const configHardware = imps?.find(i => i.origen === 'caja') || { formato: '80mm' };
      const { data: configVisual } = await this.getConfigTicket(sucursalId);

      const html = generarHTMLTicket(
        venta, 
        configHardware.formato, 
        'caja', 
        configVisual || {}
      );

      this._dispararVentanaImpresion(html);
    } catch (error) {
      console.error("Error en flujo de impresión:", error);
    }
  },

  async imprimirComanda(orden, sucursalId, destino = 'cocina') {
    const { data: imps } = await impresorasService.getAll(sucursalId);
    const configHardware = imps?.find(i => i.origen === destino) || { formato: '80mm' };

    const html = generarHTMLTicket(orden, configHardware.formato, 'cocina');
    this._dispararVentanaImpresion(html);
  },

  _dispararVentanaImpresion(html) {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      
      setTimeout(() => {
        win.print();
        win.close();
      }, 500);
    }
  }
};