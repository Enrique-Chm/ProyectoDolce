// Archivo: src/hooks/useCatUnidades.js
import { useState, useEffect, useCallback } from 'react';
import { catUnidadesService } from '../services/catUnidades.service';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Blindaje de seguridad
import toast from 'react-hot-toast'; // 🍞 Feedback visual

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
      const msg = 'Error al cargar las unidades de medida.';
      setError(msg);
      toast.error(msg); // Notificación simple para carga fallida
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
      toast.error(msg);
      throw new Error(msg);
    }

    const tId = toast.loading("Registrando nueva unidad...");
    try {
      const nuevaUnidad = await catUnidadesService.create(unidad);
      setUnidades((prev) => [...prev, nuevaUnidad]);
      toast.success("Unidad de medida creada con éxito", { id: tId });
      return nuevaUnidad;
    } catch (err) {
      const msg = 'Error al crear la unidad.';
      setError(msg);
      toast.error(msg, { id: tId });
      throw err;
    }
  };

  // Función para eliminar
  const deleteUnidad = async (id) => {
    // 🛡️ BLINDAJE: Bloqueo de eliminación (Nivel Admin)
    if (!puedeBorrar) {
      const msg = 'Acceso denegado: Se requiere permiso de borrado.';
      setError(msg);
      toast.error(msg);
      throw new Error(msg);
    }

    const tId = toast.loading("Eliminando unidad...");
    try {
      await catUnidadesService.delete(id);
      setUnidades((prev) => prev.filter(u => u.id !== id));
      toast.success("Registro eliminado correctamente", { id: tId });
    } catch (err) {
      const msg = 'Error al eliminar la unidad.';
      setError(msg);
      toast.error(msg, { id: tId });
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