import { useState, useEffect, useCallback, useMemo } from 'react';
import { estimacionesService } from '../services/Estimaciones.service';

export const useEstimaciones = () => {
  const [sugerencias, setSugerencias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- FILTROS ---
  const [filtroProveedor, setFiltroProveedor] = useState('todos'); 
  
  // --- ESTADO DE COMPRADOS (Persistente durante la sesión) ---
  const [compradosIds, setCompradosIds] = useState([]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resSugerencias, resProveedores] = await Promise.all([
        estimacionesService.getSugerenciasCompra(),
        estimacionesService.getProveedoresActivos()
      ]);

      if (!resSugerencias.success) throw new Error(resSugerencias.error);
      if (!resProveedores.success) throw new Error(resProveedores.error);

      setSugerencias(resSugerencias.data || []);
      setProveedores(resProveedores.data || []);
    } catch (err) {
      console.error("Error al cargar estimaciones:", err);
      setError("No se pudieron cargar las estimaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- LÓGICA DE FILTRADO Y PROYECCIÓN ---
  const sugerenciasFiltradas = useMemo(() => {
    return sugerencias.filter(item => {
      const cumpleProveedor = filtroProveedor === 'todos' || item.proveedor_nombre === filtroProveedor;
      return cumpleProveedor;
    });
  }, [sugerencias, filtroProveedor]);

  // --- CÁLCULO DE PRESUPUESTO ---
  // Sumamos solo lo que NO ha sido marcado como comprado aún
  const presupuestoTotal = useMemo(() => {
    return sugerenciasFiltradas
      .filter(item => !compradosIds.includes(item.insumo_id))
      .reduce((total, item) => total + (parseFloat(item.presupuesto_estimado) || 0), 0);
  }, [sugerenciasFiltradas, compradosIds]);

  const guardarPolitica = async (insumoId, diasCobertura, diasSeguridad) => {
    try {
      const res = await estimacionesService.actualizarPoliticaCompra(insumoId, diasCobertura, diasSeguridad);
      if (!res.success) throw new Error(res.error);
      await cargarDatos(); // Recargamos para ver el nuevo cálculo
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // --- FUNCIONES PARA LA LISTA DE MANDADO ---
  const marcarComoComprado = (id) => {
    setCompradosIds(prev => [...prev, id]);
  };

  const resetearListaDeCompras = () => {
    setCompradosIds([]);
  };

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return {
    sugerencias,
    sugerenciasFiltradas,
    proveedores,
    filtroProveedor, 
    setFiltroProveedor,
    compradosIds,
    marcarComoComprado,
    resetearListaDeCompras,
    presupuestoTotal,
    loading,
    error,
    guardarPolitica,
    recargarDatos: cargarDatos
  };
};