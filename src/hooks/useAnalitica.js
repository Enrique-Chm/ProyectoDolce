// Archivo: src/hooks/useAnalitica.js
import { useState, useEffect, useCallback } from 'react';
import { analiticaService } from '../services/analitica.service';

export const useAnalitica = (sucursalId) => {
  const [loading, setLoading] = useState(true);

  // --- FILTROS DE FECHA ---
  // Por defecto: últimos 30 días hasta hoy
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().split('T')[0]
  );

  // --- ESTADO ÚNICO: VENTAS Y RENTABILIDAD ---
  const [dataVentas, setDataVentas] = useState({ 
    stats: {}, 
    ranking: [], 
    desempeñoStaff: [] 
  });

  const loadData = useCallback(async () => {
    if (!sucursalId) return;
    
    setLoading(true);

    try {
      // Ajustamos las horas para abarcar los días completos
      const fInicioISO = `${fechaInicio}T00:00:00`;
      const fFinISO = `${fechaFin}T23:59:59`;
      
      const resVentas = await analiticaService.getVentasRentabilidad(sucursalId, fInicioISO, fFinISO);
      
      if (resVentas) {
        setDataVentas(resVentas);
      }
    } catch (error) {
      console.error("Error crítico cargando ventas:", error);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, fechaInicio, fechaFin]);

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
    dataVentas,
    
    // Función para recargar manualmente si es necesario
    refresh: loadData
  };
};