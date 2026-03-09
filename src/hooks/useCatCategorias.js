import { useState, useEffect, useCallback } from 'react';
import { catCategoriasService } from '../services/catCategorias.service';

export const useCatCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catCategoriasService.getAll();
      setCategorias(data);
    } catch (err) {
      setError('Error al cargar las categorías del menú.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  const addCategoria = async (categoria) => {
    try {
      const nueva = await catCategoriasService.create(categoria);
      setCategorias((prev) => [...prev, nueva]);
      return nueva;
    } catch (err) {
      setError('Error al crear la categoría.');
      throw err;
    }
  };

  const deleteCategoria = async (id) => {
    try {
      await catCategoriasService.delete(id);
      setCategorias((prev) => prev.filter(c => c.id !== id));
    } catch (err) {
      setError('Error al eliminar la categoría.');
      throw err;
    }
  };

  return {
    categorias,
    loading,
    error,
    refresh: fetchCategorias,
    addCategoria,
    deleteCategoria
  };
};