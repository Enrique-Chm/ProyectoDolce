// Archivo: src/hooks/useAnalitica.js
import { useState, useEffect, useCallback } from 'react';
import { analiticaService } from './Analitica.service';
import { hasPermission } from '../../../../utils/checkPermiso'; // 🛡️ Importación de seguridad

export const useAnalitica = (sucursalId) => {
  const [loading, setLoading] = useState(true);

  // 🛡️ DEFINICIÓN DE FACULTADES
  // Centralizamos aquí la lógica para que el componente JSX solo reciba el resultado.
  const puedeVerAnalitica = hasPermission('ver_ventas');

  // --- FILTROS DE FECHA ---
  // Default: Últimos 30 días
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split('T')[0]
  );

  // --- ESTADO ÚNICO: VENTAS Y RENTABILIDAD ---
  // Se inicializan los nuevos campos financieros para evitar errores en la UI
  const [dataVentas, setDataVentas] = useState({ 
    stats: {
      bruto: 0,
      neto: 0,
      impuesto: 0,
      utilidadBruta: 0,    // (Ingreso Neto - Costo de Recetas)
      gastosOperativos: 0, // 🆕 Suma de la tabla 'gastos'
      utilidadReal: 0,     // 🆕 Ganancia final (Bruta - Gastos OPEX)
      tickets: 0,
      ticketPromedio: 0,
      margenReal: 0
    }, 
    ranking: [], 
    desempeñoStaff: [] 
  });

  const loadData = useCallback(async () => {
    if (!sucursalId) return;
    
    // 🛡️ BLINDAJE: Si el usuario no tiene permiso, detenemos el proceso antes de llamar a Supabase
    if (!puedeVerAnalitica) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
      // Ajustamos las horas para abarcar los días completos en la consulta
      const fInicioISO = `${fechaInicio}T00:00:00`;
      const fFinISO = `${fechaFin}T23:59:59`;
      
      // El service ahora devuelve internamente el cálculo de gastos cruzado con ventas
      const resVentas = await analiticaService.getVentasRentabilidad(sucursalId, fInicioISO, fFinISO);
      
      if (resVentas) {
        setDataVentas(resVentas);
      }
    } catch (error) {
      console.error("Error crítico cargando métricas financieras:", error);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, fechaInicio, fechaFin, puedeVerAnalitica]);

  // Se dispara cada vez que cambias las fechas o de sucursal.
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // Controles de Fecha
    fechaInicio, 
    setFechaInicio,
    fechaFin, 
    setFechaFin,
    
    // Estado de carga
    loading,
    
    // Datos procesados
    // 🛡️ Blindaje de salida: Si no tiene permiso, siempre enviamos la estructura vacía
    dataVentas: puedeVerAnalitica ? dataVentas : { stats: {}, ranking: [], desempeñoStaff: [] },
    
    // Flag de seguridad para que el componente JSX oculte secciones completas
    puedeVerAnalitica,
    
    // Función para recargar manualmente (ej. botón de refresh)
    refresh: loadData
  };
};