// Archivo: src/modules/TabsTabs/AnaliticaTab/Analitica.service.js
import { supabase } from '../../../../lib/supabaseClient';
import { IVA_FACTOR } from '../../../../utils/taxConstants';
import { hasPermission } from '../../../../utils/checkPermiso';

export const analiticaService = {

  // ==========================================
  // 1. ANÁLISIS DE VENTAS Y RENTABILIDAD
  // ==========================================
  async getVentasRentabilidad(sucursalId, fInicio, fFin) {
    try {
      // 🛡️ CONTROL DE ACCESO: Solo usuarios con facultades de reporte pueden ver esto.
      if (!hasPermission('ver_ventas')) {
        return { stats: {}, ranking: [], desempeñoStaff: [] };
      }

      // 📊 1. Consultar Ventas e Insumos
      const { data: ventasData, error: ventasError } = await supabase
        .from('v_reporte_ventas_detallado')
        .select('*')
        .eq('sucursal_id', sucursalId)
        .gte('created_at', fInicio)
        .lte('created_at', fFin);

      if (ventasError) throw ventasError;

      // 💸 2. Consultar Gastos Operativos (NUEVO)
      // Usamos la columna 'fecha' (tipo DATE) para el filtrado
      const fechaInicioStr = typeof fInicio === 'string' ? fInicio.split('T')[0] : fInicio;
      const fechaFinStr = typeof fFin === 'string' ? fFin.split('T')[0] : fFin;

      const { data: gastosData, error: gastosError } = await supabase
        .from('gastos')
        .select('monto')
        .eq('sucursal_id', sucursalId)
        .gte('fecha', fechaInicioStr)
        .lte('fecha', fechaFinStr);

      if (gastosError) throw gastosError;

      // Sumamos el total de los gastos operativos (OPEX)
      const totalGastos = gastosData ? gastosData.reduce((acc, g) => acc + Number(g.monto), 0) : 0;

      // Si no hay ventas, devolvemos las estructuras vacías pero incluyendo los gastos
      if (!ventasData || ventasData.length === 0) {
        return { stats: this._procesarMétricas([], totalGastos), ranking: [], desempeñoStaff: [] };
      }

      // Procesamiento de Staff (Desempeño)
      const staffMap = ventasData.reduce((acc, item) => {
        const nombre = item.mesero_nombre || 'Sin Asignar';
        // Sumamos el total vendido (precio bruto * cantidad) por persona
        acc[nombre] = (acc[nombre] || 0) + (item.precio_bruto * item.cantidad);
        return acc;
      }, {});

      return {
        stats: this._procesarMétricas(ventasData, totalGastos),
        ranking: this._procesarRanking(ventasData),
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
  
  _procesarMétricas(data, totalGastos = 0) {
    // Cálculo de Bruto, Neto e Impuestos
    const bruto = data.reduce((acc, item) => acc + (item.precio_bruto * item.cantidad), 0);
    const neto = bruto / IVA_FACTOR;
    const impuesto = bruto - neto;
    
    // Lo que antes era 'Utilidad' ahora es la 'Utilidad Bruta' (Ingreso Neto - Costo de Insumos)
    const utilidadBruta = data.reduce((acc, item) => acc + (item.utilidad_neta || 0), 0);
    
    // 💰 NUEVA FÓRMULA: La verdadera Utilidad Neta (Dinero al bolsillo)
    const utilidadReal = utilidadBruta - totalGastos;
    
    // Contamos IDs únicos de venta para saber cuántos tickets reales hubo
    const tickets = [...new Set(data.map(i => i.venta_id))].length;

    return {
      bruto, 
      neto, 
      impuesto,
      utilidadBruta, // Renombrado para mayor claridad
      gastosOperativos: totalGastos, // Nuevo indicador
      utilidadReal, // El resultado final después de pagar recibos, rentas, etc.
      tickets,
      ticketPromedio: tickets > 0 ? bruto / tickets : 0,
      margenReal: neto > 0 ? (utilidadReal / neto) * 100 : 0 // Margen recalculado sobre la ganancia real
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