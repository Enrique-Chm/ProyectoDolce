// Archivo: src/services/analitica.service.js
import { supabase } from '../lib/supabaseClient';
import { IVA_FACTOR } from '../utils/taxConstants';

export const analiticaService = {

  // ==========================================
  // 1. ANÁLISIS DE VENTAS Y RENTABILIDAD
  // ==========================================
  async getVentasRentabilidad(sucursalId, fInicio, fFin) {
    try {
      // Consultamos la vista SQL que ya tiene el cruce con el nombre del mesero
      const { data, error } = await supabase
        .from('v_reporte_ventas_detallado')
        .select('*')
        .eq('sucursal_id', sucursalId)
        .gte('created_at', fInicio)
        .lte('created_at', fFin);

      if (error) throw error;

      // Si no hay ventas en ese rango de fechas, devolvemos las estructuras vacías
      if (!data || data.length === 0) {
        return { stats: {}, ranking: [], desempeñoStaff: [] };
      }

      // Procesamiento de Staff (Desempeño)
      const staffMap = data.reduce((acc, item) => {
        const nombre = item.mesero_nombre || 'Sin Asignar';
        // Sumamos el total vendido (precio bruto * cantidad) por persona
        acc[nombre] = (acc[nombre] || 0) + (item.precio_bruto * item.cantidad);
        return acc;
      }, {});

      return {
        stats: this._procesarMétricas(data),
        ranking: this._procesarRanking(data),
        desempeñoStaff: Object.entries(staffMap)
          .map(([nombre, total]) => ({ nombre, total }))
          .sort((a, b) => b.total - a.total) // Ordenamos del mejor vendedor al menor
      };
    } catch (error) {
      console.error("Error en getVentasRentabilidad:", error);
      return { stats: {}, ranking: [], desempeñoStaff: [] };
    }
  },

  // ==========================================
  // MÉTODOS PRIVADOS DE APOYO (Helpers)
  // ==========================================
  
  _procesarMétricas(data) {
    // Cálculo de Bruto, Neto, Impuestos y Utilidad Real
    const bruto = data.reduce((acc, item) => acc + (item.precio_bruto * item.cantidad), 0);
    const neto = bruto / IVA_FACTOR;
    const impuesto = bruto - neto;
    const utilidad = data.reduce((acc, item) => acc + (item.utilidad_neta || 0), 0);
    
    // Contamos IDs únicos de venta para saber cuántos tickets reales (órdenes) hubo
    const tickets = [...new Set(data.map(i => i.venta_id))].length;

    return {
      bruto, 
      neto, 
      impuesto,
      utilidad, 
      tickets,
      ticketPromedio: tickets > 0 ? bruto / tickets : 0,
      margenReal: neto > 0 ? (utilidad / neto) * 100 : 0
    };
  },

  _procesarRanking(data) {
    // Agrupamos las cantidades vendidas por nombre de producto
    const map = data.reduce((acc, item) => {
      const nombre = item.nombre_producto || 'Desconocido';
      acc[nombre] = (acc[nombre] || 0) + item.cantidad;
      return acc;
    }, {});
    
    // Convertimos a arreglo, ordenamos de mayor a menor y tomamos el Top 5
    return Object.entries(map)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5); 
  }
};