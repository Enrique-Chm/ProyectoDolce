// src/modules/Admin/Tabs/Historial/2useHistorial.js
import { useState, useCallback } from 'react';
import { HistorialService } from './1Historial.service';
import { AuthService } from '../../../Auth/Auth.service'; // <-- Importado para filtrar por identidad
import toast from 'react-hot-toast';

export const useHistorial = () => {
  const [loading, setLoading] = useState(false);
  const [ordenesHistorial, setOrdenesHistorial] = useState([]);
  
  // Obtenemos la sesión para saber qué permisos de visualización aplicar
  const sesion = AuthService.getSesion();

  // ==========================================
  // 1. CARGA DE DATOS CON FILTRO DE SEGURIDAD
  // ==========================================
  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await HistorialService.getHistorial();
      
      if (error) throw error;

      let datosFiltrados = data || [];

      // LÓGICA DE VISIBILIDAD:
      // Si no es Gerente o Comprador, filtramos para que solo vea su sucursal
      if (sesion && sesion.rol !== 'Gerente' && sesion.rol !== 'Comprador') {
        datosFiltrados = datosFiltrados.filter(orden => orden.sucursal_id === sesion.sucursal_id);
      }

      setOrdenesHistorial(datosFiltrados);
    } catch (err) {
      console.error("Error en useHistorial:", err);
      toast.error('No se pudo cargar el historial de órdenes');
    } finally {
      setLoading(false);
    }
  }, [sesion]);

  // ==========================================
  // 2. BÚSQUEDA POR FOLIO (RESPETANDO EL FILTRO)
  // ==========================================
  const buscarFolio = async (termino) => {
    if (!termino.trim()) return cargarHistorial();

    setLoading(true);
    try {
      const { data, error } = await HistorialService.buscarEnHistorial(termino);
      
      if (error) throw error;

      let datosFiltrados = data || [];

      // Aplicamos el mismo filtro de seguridad en la búsqueda
      if (sesion && sesion.rol !== 'Gerente' && sesion.rol !== 'Comprador') {
        datosFiltrados = datosFiltrados.filter(orden => orden.sucursal_id === sesion.sucursal_id);
      }

      setOrdenesHistorial(datosFiltrados);
    } catch (err) {
      toast.error('Error al realizar la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    ordenesHistorial,
    cargarHistorial,
    buscarFolio
  };
};