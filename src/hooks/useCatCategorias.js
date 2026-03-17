// Archivo: src/hooks/useCatCategorias.js
import { useState, useEffect, useCallback } from 'react';
import { catCategoriasService } from '../services/catCategorias.service';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Importación de seguridad

export const useCatCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🛡️ DEFINICIÓN DE FACULTADES
  const puedeVer = hasPermission('ver_configuracion');
  const puedeEditar = hasPermission('editar_configuracion');
  const puedeBorrar = hasPermission('borrar_registros');

  const fetchCategorias = useCallback(async () => {
    // 🛡️ BLINDAJE: Evitamos la petición si no tiene permiso de lectura
    if (!puedeVer) return;

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
  }, [puedeVer]);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  const addCategoria = async (categoria) => {
    // 🛡️ BLINDAJE: Bloqueo de creación
    if (!puedeEditar) {
      const msg = 'No tienes permiso para crear categorías.';
      setError(msg);
      throw new Error(msg);
    }

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
    // 🛡️ BLINDAJE: Bloqueo de eliminación
    if (!puedeBorrar) {
      const msg = 'No tienes permiso para eliminar registros maestros.';
      setError(msg);
      throw new Error(msg);
    }

    try {
      await catCategoriasService.delete(id);
      setCategorias((prev) => prev.filter(c => c.id !== id));
    } catch (err) {
      setError('Error al eliminar la categoría.');
      throw err;
    }
  };

  return {
    // Datos y estados
    categorias: puedeVer ? categorias : [], // 🛡️ Protección de datos en el retorno
    loading,
    error,
    
    // Acciones
    refresh: fetchCategorias,
    addCategoria,
    deleteCategoria,

    // 🛡️ Flags de seguridad para la UI
    puedeVer,
    puedeEditar,
    puedeBorrar
  };
};