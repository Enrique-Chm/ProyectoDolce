// src/modules/Admin/Tabs/Historial/2useHistorial.js
import { useState, useCallback } from 'react';
import { HistorialService } from './1Historial.service';
import { useAuth } from '../../../Auth/useAuth'; // CORRECCIÓN P1: reemplaza AuthService
import toast from 'react-hot-toast';

export const useHistorial = () => {
  const [loading, setLoading] = useState(false);
  const [ordenesHistorial, setOrdenesHistorial] = useState([]);

  // Lista de respaldo para búsquedas locales instantáneas respetando las fechas cargadas
  const [respaldoHistorial, setRespaldoHistorial] = useState([]);

  // CORRECCIÓN P1: Consumimos el Context centralizado en lugar de leer
  // localStorage directamente con AuthService.getSesion()
  const { usuario } = useAuth();

  /**
   * ESTABILIZACIÓN DE DEPENDENCIAS:
   * usuario.sucursales_ids es un arreglo — usarlo directo en useCallback
   * causaría re-renders infinitos porque cada render crea una nueva referencia.
   * Lo convertimos a string para que React pueda compararlo por valor.
   * El arreglo se reconstruye con JSON.parse dentro del callback cuando se necesita.
   */
  const sucursalesIdsStr  = JSON.stringify(usuario?.sucursales_ids || []);
  const tieneAccesoGlobal = usuario?.permisos?.configuracion?.leer || false;

  // ==========================================
  // 1. CARGA DE DATOS CON FILTRO DE SEGURIDAD
  // ==========================================
  /**
   * Recupera el historial general aplicando restricciones por sucursal.
   * CORRECCIÓN P1: El filtro ahora ocurre en BD vía .in() — se eliminó
   * el filtrado en memoria que era incorrecto porque sucursal_id llegaba
   * undefined al no estar incluido en el select del service.
   */
  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    try {
      // Reconstruimos el arreglo desde el string estabilizado
      const sucursalesIds = JSON.parse(sucursalesIdsStr);

      const { data, error } = await HistorialService.getHistorial(
        tieneAccesoGlobal,
        sucursalesIds
      );

      if (error) throw error;

      const datosFiltrados = data || [];
      setOrdenesHistorial(datosFiltrados);
      setRespaldoHistorial(datosFiltrados);
    } catch (err) {
      console.error("Error en cargarHistorial:", err);
      toast.error('No se pudo cargar el historial de órdenes');
    } finally {
      setLoading(false);
    }
  }, [sucursalesIdsStr, tieneAccesoGlobal]);

  // ==========================================
  // 2. CARGA DE DATOS POR RANGO DE FECHAS
  // ==========================================
  /**
   * Filtra las órdenes finalizadas por un periodo de tiempo específico.
   * CORRECCIÓN P1: El filtro de sucursal ahora ocurre en BD — se eliminó
   * el filtrado en memoria que nunca funcionó por el bug de sucursal_id.
   */
  const cargarHistorialPorFechas = useCallback(async (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Selecciona un rango de fechas válido');
      return;
    }
    setLoading(true);
    try {
      // Reconstruimos el arreglo desde el string estabilizado
      const sucursalesIds = JSON.parse(sucursalesIdsStr);

      const { data, error } = await HistorialService.getHistorialPorFechas(
        fechaInicio,
        fechaFin,
        tieneAccesoGlobal,
        sucursalesIds
      );

      if (error) throw error;

      const datosFiltrados = data || [];
      setOrdenesHistorial(datosFiltrados);
      setRespaldoHistorial(datosFiltrados);
    } catch (err) {
      console.error("Error en cargarHistorialPorFechas:", err);
      toast.error('No se pudo cargar el historial por fechas');
    } finally {
      setLoading(false);
    }
  }, [sucursalesIdsStr, tieneAccesoGlobal]);

  // ==========================================
  // 3. BUSCABLE CRUZADO EN MEMORIA LOCAL (INSENSIBLE A ACENTOS)
  // ==========================================
  /**
   * Filtra en tiempo real los registros cargados por Folio, Proveedor o Sucursal
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

    // Función de comparación para evitar redundancia de código
    const cumpleTexto = (campoOriginal, consultaLimpia) => {
      if (!campoOriginal) return false;
      return limpiarTexto(campoOriginal).includes(consultaLimpia);
    };

    const query = limpiarTexto(termino);

    const filtrados = respaldoHistorial.filter(orden => {
      const cumpleFolio     = cumpleTexto(orden.folio,              query);
      const cumpleProveedor = cumpleTexto(orden.proveedor?.nombre,  query);
      const cumpleSucursal  = cumpleTexto(orden.sucursal?.nombre,   query);
      return cumpleFolio || cumpleProveedor || cumpleSucursal;
    });

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