// src/modules/Admin/Tabs/Historial/1Historial.service.js
import { supabase } from '../../../../lib/supabaseClient';

export const HistorialService = {
  // ==========================================
  // 1. OBTENER TODAS LAS ÓRDENES FINALIZADAS
  // ==========================================
  /**
   * Trae las órdenes con estatus Completado o Cancelado.
   * Incluye la información del solicitante, sucursal y proveedor.
   * CORRECCIÓN P1: Se agregó sucursal_id al select (antes era undefined en el hook)
   * y se reciben parámetros para filtrar en BD con .in() en lugar de en memoria.
   * @param {boolean}  tieneAccesoGlobal - Si true no aplica filtro de sucursal
   * @param {string[]} sucursalesIds     - UUIDs de sucursales del trabajador
   */
  async getHistorial(tieneAccesoGlobal = true, sucursalesIds = []) {
    let query = supabase
      .from('BD_Ordenes_Compra')
      .select(`
        id,
        folio,
        estatus,
        prioridad,
        notas,
        sucursal_id,
        created_at,
        proveedor:Cat_Proveedores(nombre),
        solicitante:Cat_Trabajadores(nombre_completo),
        sucursal:Cat_sucursales(nombre)
      `)
      .in('estatus', ['Completado', 'Cancelado'])
      .order('created_at', { ascending: false });

    // CORRECCIÓN P1: Filtro aplicado en BD con .in() sobre el arreglo completo
    // de sucursales del trabajador — elimina el filtrado en memoria del hook.
    if (!tieneAccesoGlobal && sucursalesIds.length > 0) {
      query = query.in('sucursal_id', sucursalesIds);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error al cargar historial:", error.message);
    }
    return { data, error };
  },

  // ==========================================
  // 2. BÚSQUEDA POR FOLIO O FILTROS
  // ==========================================
  /**
   * Permite buscar órdenes específicas en el pasado por su folio.
   * CORRECCIÓN P1: Se agregó sucursal_id al select y filtro por sucursal en BD.
   * @param {string}   termino           - El folio o parte del folio a buscar
   * @param {boolean}  tieneAccesoGlobal - Si true no aplica filtro de sucursal
   * @param {string[]} sucursalesIds     - UUIDs de sucursales del trabajador
   */
  async buscarEnHistorial(termino, tieneAccesoGlobal = true, sucursalesIds = []) {
    let query = supabase
      .from('BD_Ordenes_Compra')
      .select(`
        id,
        folio,
        estatus,
        prioridad,
        notas,
        sucursal_id,
        created_at,
        proveedor:Cat_Proveedores(nombre),
        solicitante:Cat_Trabajadores(nombre_completo),
        sucursal:Cat_sucursales(nombre)
      `)
      .ilike('folio', `%${termino}%`)
      .in('estatus', ['Completado', 'Cancelado'])
      .order('created_at', { ascending: false });

    if (!tieneAccesoGlobal && sucursalesIds.length > 0) {
      query = query.in('sucursal_id', sucursalesIds);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error en búsqueda de historial:", error.message);
    }
    return { data, error };
  },

  // ==========================================
  // 3. HISTORIAL FILTRADO POR RANGO DE FECHAS
  // ==========================================
  /**
   * Recupera las órdenes con estatus Completado o Cancelado dentro de un rango de fechas.
   * CORRECCIÓN P1: Se agregó sucursal_id al select y filtro por sucursal en BD.
   * @param {string}   fechaInicio       - Fecha inicial en formato YYYY-MM-DD
   * @param {string}   fechaFin          - Fecha final en formato YYYY-MM-DD
   * @param {boolean}  tieneAccesoGlobal - Si true no aplica filtro de sucursal
   * @param {string[]} sucursalesIds     - UUIDs de sucursales del trabajador
   */
  async getHistorialPorFechas(fechaInicio, fechaFin, tieneAccesoGlobal = true, sucursalesIds = []) {
    const inicioIso = `${fechaInicio}T00:00:00.000Z`;
    const finIso    = `${fechaFin}T23:59:59.999Z`;

    let query = supabase
      .from('BD_Ordenes_Compra')
      .select(`
        id,
        folio,
        estatus,
        prioridad,
        notas,
        sucursal_id,
        created_at,
        proveedor:Cat_Proveedores(nombre),
        solicitante:Cat_Trabajadores(nombre_completo),
        sucursal:Cat_sucursales(nombre)
      `)
      .in('estatus', ['Completado', 'Cancelado'])
      .gte('created_at', inicioIso)
      .lte('created_at', finIso)
      .order('created_at', { ascending: false });

    // CORRECCIÓN P1: Filtro en BD — soporta múltiples sucursales por trabajador
    if (!tieneAccesoGlobal && sucursalesIds.length > 0) {
      query = query.in('sucursal_id', sucursalesIds);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error al cargar historial por fechas:", error.message);
    }
    return { data, error };
  }
};