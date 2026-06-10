// src/modules/Admin/Tabs/Historial/2useHistorial.js
import { useState, useCallback } from 'react';
import { HistorialService } from './1Historial.service';
import { useAuth } from '../../../Auth/useAuth';
import toast from 'react-hot-toast';

export const useHistorial = () => {
  const [loading, setLoading] = useState(false);
  const [ordenesHistorial, setOrdenesHistorial] = useState([]);

  // Lista de respaldo para búsquedas locales instantáneas respetando las fechas cargadas
  const [respaldoHistorial, setRespaldoHistorial] = useState([]);

  // PAGINACIÓN: total de registros en BD y flag de si hay más por cargar
  const [totalHistorial, setTotalHistorial] = useState(0);
  const [hayMasHistorial, setHayMasHistorial] = useState(false);

  // Guardamos las fechas activas para poder reutilizarlas en "Cargar más"
  const [fechasActivas, setFechasActivas] = useState({ inicio: '', fin: '' });

  const { usuario } = useAuth();

  const sucursalesIdsStr  = JSON.stringify(usuario?.sucursales_ids || []);
  const tieneAccesoGlobal = usuario?.permisos?.configuracion?.leer || false;

  // ==========================================
  // 1. CARGA DE DATOS CON FILTRO DE SEGURIDAD
  // ==========================================
  /**
   * Recupera el historial general (sin filtro de fechas).
   * Carga la primera página y resetea la lista.
   */
  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const sucursalesIds = JSON.parse(sucursalesIdsStr);

      const { data, error, count } = await HistorialService.getHistorial(
        tieneAccesoGlobal,
        sucursalesIds,
        0  // PAGINACIÓN: siempre desde el inicio
      );

      if (error) throw error;

      const registros = data || [];
      const total     = count || 0;

      setOrdenesHistorial(registros);
      setRespaldoHistorial(registros);
      setTotalHistorial(total);
      setHayMasHistorial(registros.length < total);
      setFechasActivas({ inicio: '', fin: '' });
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
   * Filtra las órdenes finalizadas por un periodo de tiempo.
   * Carga la primera página y resetea la lista.
   */
  const cargarHistorialPorFechas = useCallback(async (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Selecciona un rango de fechas válido');
      return;
    }
    setLoading(true);
    try {
      const sucursalesIds = JSON.parse(sucursalesIdsStr);

      const { data, error, count } = await HistorialService.getHistorialPorFechas(
        fechaInicio,
        fechaFin,
        tieneAccesoGlobal,
        sucursalesIds,
        0  // PAGINACIÓN: siempre desde el inicio
      );

      if (error) throw error;

      const registros = data || [];
      const total     = count || 0;

      setOrdenesHistorial(registros);
      setRespaldoHistorial(registros);
      setTotalHistorial(total);
      setHayMasHistorial(registros.length < total);
      // Guardamos las fechas para reutilizarlas en "Cargar más"
      setFechasActivas({ inicio: fechaInicio, fin: fechaFin });
    } catch (err) {
      console.error("Error en cargarHistorialPorFechas:", err);
      toast.error('No se pudo cargar el historial por fechas');
    } finally {
      setLoading(false);
    }
  }, [sucursalesIdsStr, tieneAccesoGlobal]);

  // ==========================================
  // 3. PAGINACIÓN: CARGAR MÁS REGISTROS
  // ==========================================
  /**
   * Carga el siguiente bloque de registros y los agrega al final
   * de la lista existente. Respeta el filtro de fechas activo.
   */
  const cargarMasHistorial = useCallback(async () => {
    if (loading || !hayMasHistorial) return;

    setLoading(true);
    try {
      const sucursalesIds = JSON.parse(sucursalesIdsStr);
      const offset        = ordenesHistorial.length;

      let resultado;

      // Si hay fechas activas, usamos el método con filtro de fechas
      if (fechasActivas.inicio && fechasActivas.fin) {
        resultado = await HistorialService.getHistorialPorFechas(
          fechasActivas.inicio,
          fechasActivas.fin,
          tieneAccesoGlobal,
          sucursalesIds,
          offset
        );
      } else {
        resultado = await HistorialService.getHistorial(
          tieneAccesoGlobal,
          sucursalesIds,
          offset
        );
      }

      const { data, error, count } = resultado;

      if (error) {
        toast.error('Error al cargar más registros');
        return;
      }

      const nuevosRegistros  = data || [];
      const total            = count || 0;
      const listaActualizada = [...ordenesHistorial, ...nuevosRegistros];

      setOrdenesHistorial(listaActualizada);
      setRespaldoHistorial(listaActualizada);
      setTotalHistorial(total);
      setHayMasHistorial(listaActualizada.length < total);
    } catch (err) {
      console.error("Error en cargarMasHistorial:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, hayMasHistorial, ordenesHistorial, fechasActivas, sucursalesIdsStr, tieneAccesoGlobal]);

  // ==========================================
  // 4. BUSCABLE CRUZADO EN MEMORIA LOCAL (INSENSIBLE A ACENTOS)
  // ==========================================
  /**
   * Filtra en tiempo real los registros YA CARGADOS por Folio, Proveedor o Sucursal.
   * Nota: la búsqueda local solo opera sobre los registros paginados ya descargados.
   * Para buscar en toda la BD, el usuario debe ampliar las fechas o cargar más.
   */
  const buscarFolio = useCallback((termino) => {
    if (!termino || !termino.trim()) {
      setOrdenesHistorial(respaldoHistorial);
      return;
    }

    const limpiarTexto = (texto) => {
      if (!texto) return '';
      return texto
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    };

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
    totalHistorial,      // PAGINACIÓN: total de registros en BD
    hayMasHistorial,     // PAGINACIÓN: flag para mostrar/ocultar botón "Cargar más"
    cargarHistorial,
    cargarHistorialPorFechas,
    cargarMasHistorial,  // PAGINACIÓN: función para cargar siguiente bloque
    buscarFolio
  };
};