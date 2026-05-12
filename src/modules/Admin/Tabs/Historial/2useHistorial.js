// src/modules/Admin/Tabs/Historial/2useHistorial.js
import { useState, useCallback } from 'react';
import { HistorialService } from './1Historial.service';
import { AuthService } from '../../../Auth/Auth.service';
import toast from 'react-hot-toast';

export const useHistorial = () => {
  const [loading, setLoading] = useState(false);
  const [ordenesHistorial, setOrdenesHistorial] = useState([]);
  
  // Obtenemos la sesión para validar la pertenencia de los datos
  const sesion = AuthService.getSesion();

  /**
   * ESTABILIZACIÓN DE DEPENDENCIAS
   * Extraemos valores primitivos para evitar bucles en los efectos secundarios.
   */
  const sucursalId = sesion?.sucursal_id;
  const esAdmin = sesion?.permisos?.configuracion?.leer || false;

  // ==========================================
  // 1. CARGA DE DATOS CON FILTRO DE SEGURIDAD
  // ==========================================
  /**
   * Recupera el historial general aplicando restricciones por sucursal
   * si el usuario no tiene rol administrativo.
   */
  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await HistorialService.getHistorial();
      
      if (error) throw error;

      let datosFiltrados = data || [];

      // LÓGICA DE VISIBILIDAD: Si no es Admin, solo ve su sucursal
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
  /**
   * Filtra las órdenes finalizadas por un periodo de tiempo específico.
   */
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

      // Filtro de seguridad por sucursal
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
  /**
   * Permite localizar una orden específica mediante su folio único.
   */
  const buscarFolio = async (termino) => {
    // Si el campo de búsqueda está vacío, regresamos a la lista completa
    if (!termino.trim()) return cargarHistorial();

    setLoading(true);
    try {
      const { data, error } = await HistorialService.buscarEnHistorial(termino);
      
      if (error) throw error;

      let datosFiltrados = data || [];

      // Aplicamos el filtro de seguridad en los resultados de búsqueda
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