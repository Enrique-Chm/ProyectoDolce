// src/modules/Admin/Tabs/Historial/1Historial.service.js
import { supabase } from '../../../../lib/supabaseClient';

// Registros por página para historial
const LIMITE_HISTORIAL = 30;

export const HistorialService = {
  // ==========================================
  // 1. OBTENER ÓRDENES FINALIZADAS (PAGINADO)
  // ==========================================
  /**
   * Trae las órdenes con estatus Completado o Cancelado.
   * PAGINACIÓN: Carga en bloques de LIMITE_HISTORIAL con offset.
   * Retorna { data, count, error } donde count es el total sin paginar.
   * @param {boolean}  tieneAccesoGlobal - Si true no aplica filtro de sucursal
   * @param {string[]} sucursalesIds     - UUIDs de sucursales del trabajador
   * @param {number}   desde             - Offset para paginación (default: 0)
   */
  async getHistorial(tieneAccesoGlobal = true, sucursalesIds = [], desde = 0) {
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
      `, { count: 'exact' })
      .in('estatus', ['Completado', 'Cancelado'])
      .order('created_at', { ascending: false })
      .range(desde, desde + LIMITE_HISTORIAL - 1);

    if (!tieneAccesoGlobal && sucursalesIds.length > 0) {
      query = query.in('sucursal_id', sucursalesIds);
    }

    const { data, error, count } = await query;
    if (error) {
      console.error("Error al cargar historial:", error.message);
    }
    return { data, error, count };
  },

  // ==========================================
  // 2. BÚSQUEDA POR FOLIO O FILTROS
  // ==========================================
  /**
   * Permite buscar órdenes específicas en el pasado por su folio.
   * No se pagina — las búsquedas por folio retornan pocos resultados.
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
  // 3. HISTORIAL FILTRADO POR RANGO DE FECHAS (PAGINADO)
  // ==========================================
  /**
   * Recupera las órdenes finalizadas dentro de un rango de fechas.
   * PAGINACIÓN: Carga en bloques de LIMITE_HISTORIAL con offset.
   * Retorna { data, count, error } donde count es el total sin paginar.
   * @param {string}   fechaInicio       - Fecha inicial en formato YYYY-MM-DD
   * @param {string}   fechaFin          - Fecha final en formato YYYY-MM-DD
   * @param {boolean}  tieneAccesoGlobal - Si true no aplica filtro de sucursal
   * @param {string[]} sucursalesIds     - UUIDs de sucursales del trabajador
   * @param {number}   desde             - Offset para paginación (default: 0)
   */
  async getHistorialPorFechas(fechaInicio, fechaFin, tieneAccesoGlobal = true, sucursalesIds = [], desde = 0) {
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
      `, { count: 'exact' })
      .in('estatus', ['Completado', 'Cancelado'])
      .gte('created_at', inicioIso)
      .lte('created_at', finIso)
      .order('created_at', { ascending: false })
      .range(desde, desde + LIMITE_HISTORIAL - 1);

    if (!tieneAccesoGlobal && sucursalesIds.length > 0) {
      query = query.in('sucursal_id', sucursalesIds);
    }

    const { data, error, count } = await query;
    if (error) {
      console.error("Error al cargar historial por fechas:", error.message);
    }
    return { data, error, count };
  }
};