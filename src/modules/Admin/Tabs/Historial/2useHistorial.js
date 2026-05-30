// src/modules/Admin/Tabs/Historial/2useHistorial.js
import { useState, useCallback } from 'react';
import { HistorialService } from './1Historial.service';
import { AuthService } from '../../../Auth/Auth.service';
import toast from 'react-hot-toast';

export const useHistorial = () => {
  const [loading, setLoading] = useState(false);
  const [ordenesHistorial, setOrdenesHistorial] = useState([]);
  
  // Lista de respaldo para realizar búsquedas locales instantáneas respetando las fechas cargadas
  const [respaldoHistorial, setRespaldoHistorial] = useState([]);
  
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
      setRespaldoHistorial(datosFiltrados);
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
      setRespaldoHistorial(datosFiltrados);
    } catch (err) {
      console.error("Error en cargarHistorialPorFechas:", err);
      toast.error('No se pudo cargar el historial por fechas');
    } finally {
      setLoading(false);
    }
  }, [sucursalId, esAdmin]);

  // ==========================================
  // 3. BUSCABLE CRUZADO EN MEMORIA LOCAL (INSENSIBLE A ACENTOS)
  // ==========================================
  /**
   * Filtra en tiempo real los registros cargados por Folio o por Nombre de Proveedor
   * de forma insensible a mayúsculas, minúsculas y acentos.
   */
  const buscarFolio = useCallback((termino) => {
    if (!termino || !termino.trim()) {
      // Si el buscador está vacío, restauramos el bloque de registros original
      setOrdenesHistorial(respaldoHistorial);
      return;
    }

    // Función auxiliar interna para remover acentos y pasar a minúsculas de forma segura
    const limpiarTexto = (texto) => {
      if (!texto) return '';
      return texto
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    };

    const query = limpiarTexto(termino);

    const filtrados = respaldoHistorial.filter(orden => {
      const cumpleFolio = cumpleTexto(orden.folio, query);
      const cumpleProveedor = cumpleTexto(orden.proveedor?.nombre, query);
      const cumpleSucursal = cumpleTexto(orden.sucursal?.nombre, query);
      
      return cumpleFolio || cumpleProveedor || cumpleSucursal;
    });

    // Función de comparación para evitar redundancia de código
    function cumpleTexto(campoOriginal, consultaLimpia) {
      if (!campoOriginal) return false;
      return limpiarTexto(campoOriginal).includes(consultaLimpia);
    }

    setOrdenesHistorial(filtrados);
  }, [respaldoHistorial]);

  return {
    loading,
    ordenesHistorial,
    cargarHistorial,
    cargarHistorialPorFechas,
    buscarFolio
  };
};