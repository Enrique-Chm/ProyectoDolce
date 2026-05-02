// src/modules/Admin/Tabs/Historial/2useHistorial.js
import { useState, useCallback } from 'react';
import { HistorialService } from './1Historial.service';
import { AuthService } from '../../../Auth/Auth.service';
import toast from 'react-hot-toast';

export const useHistorial = () => {
  const [loading, setLoading] = useState(false);
  const [ordenesHistorial, setOrdenesHistorial] = useState([]);
  
  // Obtenemos la sesión
  const sesion = AuthService.getSesion();

  /**
   * ESTABILIZACIÓN DE DEPENDENCIAS
   * Extraemos valores primitivos (strings/booleans) para evitar que el cambio de 
   * referencia del objeto 'sesion' genere un bucle infinito en el useEffect.
   */
  const sucursalId = sesion?.sucursal_id;
  const esAdmin = sesion?.permisos?.configuracion?.leer || false;

  // ==========================================
  // 1. CARGA DE DATOS CON FILTRO DE SEGURIDAD
  // ==========================================
  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await HistorialService.getHistorial();
      
      if (error) throw error;

      let datosFiltrados = data || [];

      /**
       * LÓGICA DE VISIBILIDAD DINÁMICA:
       * Si el usuario no tiene permisos globales (no es Admin/Gerente), 
       * solo puede ver el historial de su propia sucursal.
       */
      if (!esAdmin && sucursalId) {
        datosFiltrados = datosFiltrados.filter(orden => orden.sucursal_id === sucursalId);
      }

      setOrdenesHistorial(datosFiltrados);
    } catch (err) {
      console.error("Error en cargarHistorial:", err);
      toast.error('No se pudo cargar el historial de órdenes');
    } finally {
      setLoading(false);
    }
  }, [sucursalId, esAdmin]);

  // ==========================================
  // 2. CARGA DE DATOS POR RANGO DE FECHAS
  // ==========================================
  const cargarHistorialPorFechas = useCallback(async (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Selecciona un rango de fechas válido');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await HistorialService.getHistorialPorFechas(fechaInicio, fechaFin);
      
      if (error) throw error;

      let datosFiltrados = data || [];

      // Aplicamos la misma lógica de visibilidad dinámica
      if (!esAdmin && sucursalId) {
        datosFiltrados = datosFiltrados.filter(orden => orden.sucursal_id === sucursalId);
      }

      setOrdenesHistorial(datosFiltrados);
    } catch (err) {
      console.error("Error en cargarHistorialPorFechas:", err);
      toast.error('No se pudo cargar el historial por fechas');
    } finally {
      setLoading(false);
    }
  }, [sucursalId, esAdmin]);

  // ==========================================
  // 3. BÚSQUEDA POR FOLIO (RESPETANDO EL FILTRO)
  // ==========================================
  const buscarFolio = async (termino) => {
    // Si el campo de búsqueda está vacío, recargamos la lista completa
    if (!termino.trim()) return cargarHistorial();

    setLoading(true);
    try {
      const { data, error } = await HistorialService.buscarEnHistorial(termino);
      
      if (error) throw error;

      let datosFiltrados = data || [];

      // Aplicamos el mismo filtro de seguridad en los resultados de búsqueda
      if (!esAdmin && sucursalId) {
        datosFiltrados = datosFiltrados.filter(orden => orden.sucursal_id === sucursalId);
      }

      setOrdenesHistorial(datosFiltrados);
    } catch (err) {
      console.error("Error en buscarFolio:", err);
      toast.error('Error al realizar la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    ordenesHistorial,
    cargarHistorial,
    cargarHistorialPorFechas,
    buscarFolio
  };
};