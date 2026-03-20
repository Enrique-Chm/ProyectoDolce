// Archivo: src/hooks/useCatCategorias.js
import { useState, useEffect, useCallback } from 'react';
import { catCategoriasService } from '../services/catCategorias.service';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Importación de seguridad
import toast from 'react-hot-toast'; // 🍞 Feedback visual

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
      const msg = 'Error al cargar las categorías del menú.';
      setError(msg);
      toast.error(msg); // Notificación de error en carga
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
      toast.error(msg);
      throw new Error(msg);
    }

    const tId = toast.loading("Creando nueva categoría...");
    try {
      const nueva = await catCategoriasService.create(categoria);
      setCategorias((prev) => [...prev, nueva]);
      toast.success("Categoría añadida con éxito", { id: tId });
      return nueva;
    } catch (err) {
      const msg = 'Error al crear la categoría.';
      setError(msg);
      toast.error(msg, { id: tId });
      throw err;
    }
  };

  const deleteCategoria = async (id) => {
    // 🛡️ BLINDAJE: Bloqueo de eliminación
    if (!puedeBorrar) {
      const msg = 'No tienes permiso para eliminar registros maestros.';
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    }

    const tId = toast.loading("Eliminando categoría...");
    try {
      await catCategoriasService.delete(id);
      setCategorias((prev) => prev.filter(c => c.id !== id));
      toast.success("Categoría eliminada", { id: tId });
    } catch (err) {
      const msg = 'Error al eliminar la categoría.';
      setError(msg);
      toast.error(msg, { id: tId });
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