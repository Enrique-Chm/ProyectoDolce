// Archivo: src/hooks/useCatUnidades.js
import { useState, useEffect, useCallback } from 'react';
import { catUnidadesService } from '../services/catUnidades.service';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Blindaje de seguridad

export const useCatUnidades = () => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🛡️ DEFINICIÓN DE FACULTADES (Nivel Configuración)
  const puedeVer = hasPermission('ver_configuracion');
  const puedeEditar = hasPermission('editar_configuracion');
  const puedeBorrar = hasPermission('borrar_registros');

  // Función para cargar los datos
  const fetchUnidades = useCallback(async () => {
    // 🛡️ BLINDAJE: Si no puede ver, evitamos la llamada al servidor
    if (!puedeVer) return;

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
  }, [puedeVer]);

  // Cargar al montar el hook
  useEffect(() => {
    fetchUnidades();
  }, [fetchUnidades]);

  // Función para agregar una unidad
  const addUnidad = async (unidad) => {
    // 🛡️ BLINDAJE: Bloqueo de creación
    if (!puedeEditar) {
      const msg = 'Acceso denegado: No tienes permiso para editar unidades.';
      setError(msg);
      throw new Error(msg);
    }

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
    // 🛡️ BLINDAJE: Bloqueo de eliminación (Nivel Admin)
    if (!puedeBorrar) {
      const msg = 'Acceso denegado: Se requiere permiso de borrado.';
      setError(msg);
      throw new Error(msg);
    }

    try {
      await catUnidadesService.delete(id);
      setUnidades((prev) => prev.filter(u => u.id !== id));
    } catch (err) {
      setError('Error al eliminar la unidad.');
      throw err;
    }
  };

  return {
    // Datos y estados
    unidades: puedeVer ? unidades : [], // 🛡️ Protección de salida de datos
    loading,
    error,
    
    // Acciones
    refresh: fetchUnidades,
    addUnidad,
    deleteUnidad,

    // 🛡️ Banderas para control visual en el JSX
    puedeVer,
    puedeEditar,
    puedeBorrar
  };
};