import { useState, useEffect, useCallback } from 'react';
import { catUnidadesService } from '../services/catUnidades.service';

export const useCatUnidades = () => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para cargar los datos
  const fetchUnidades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catUnidadesService.getAll();
      setUnidades(data);
    } catch (err) {
      setError('Error al cargar las unidades de medida.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al montar el hook
  useEffect(() => {
    fetchUnidades();
  }, [fetchUnidades]);

  // Función para agregar una unidad
  const addUnidad = async (unidad) => {
    try {
      const nuevaUnidad = await catUnidadesService.create(unidad);
      setUnidades((prev) => [...prev, nuevaUnidad]);
      return nuevaUnidad;
    } catch (err) {
      setError('Error al crear la unidad.');
      throw err;
    }
  };

  // Función para eliminar
  const deleteUnidad = async (id) => {
    try {
      await catUnidadesService.delete(id);
      setUnidades((prev) => prev.filter(u => u.id !== id));
    } catch (err) {
      setError('Error al eliminar la unidad.');
      throw err;
    }
  };

  return {
    unidades,
    loading,
    error,
    refresh: fetchUnidades,
    addUnidad,
    deleteUnidad
  };
};