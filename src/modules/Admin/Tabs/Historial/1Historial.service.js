// src/modules/Admin/Tabs/Historial/1Historial.service.js
import { supabase } from '../../../../lib/supabaseClient';

export const HistorialService = {

  // ==========================================
  // 1. OBTENER TODAS LAS ÓRDENES FINALIZADAS
  // ==========================================
  /**
   * Trae las órdenes con estatus Completado o Cancelado.
   * Incluye la información del solicitante, sucursal y proveedor.
   */
  async getHistorial() {
    const { data, error } = await supabase
      .from('BD_Ordenes_Compra')
      .select(`
        *,
        proveedor:Cat_Proveedores(nombre),
        solicitante:Cat_Trabajadores(nombre_completo),
        sucursal:Cat_sucursales(nombre)
      `)
      // Traemos tanto lo surtido con éxito como lo que se descartó
      .in('estatus', ['Completado', 'Cancelado']) 
      .order('created_at', { ascending: false });

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
   * @param {string} termino - El folio o parte del folio a buscar.
   */
  async buscarEnHistorial(termino) {
    const { data, error } = await supabase
      .from('BD_Ordenes_Compra')
      .select(`
        *,
        proveedor:Cat_Proveedores(nombre),
        solicitante:Cat_Trabajadores(nombre_completo),
        sucursal:Cat_sucursales(nombre)
      `)
      .ilike('folio', `%${termino}%`) // Búsqueda flexible (no importa mayúsculas/minúsculas)
      .in('estatus', ['Completado', 'Cancelado'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error en búsqueda de historial:", error.message);
    }

    return { data, error };
  }
};