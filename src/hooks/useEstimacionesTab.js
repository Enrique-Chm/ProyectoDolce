import { useState, useEffect, useCallback, useMemo } from 'react';
import { estimacionesService } from '../services/Estimaciones.service';

export const useEstimacionesTab = () => {
  const [sugerencias, setSugerencias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroProveedor, setFiltroProveedor] = useState('todos');
  const [compradosIds, setCompradosIds] = useState([]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    const [resS, resP] = await Promise.all([
      estimacionesService.getSugerenciasCompra(),
      estimacionesService.getProveedoresActivos()
    ]);
    if (resS.success) setSugerencias(resS.data || []);
    if (resP.success) setProveedores(resP.data || []);
    setLoading(false);
  }, []);

  const sugerenciasFiltradas = useMemo(() => {
    return sugerencias.filter(item => 
      filtroProveedor === 'todos' || item.proveedor_nombre === filtroProveedor
    );
  }, [sugerencias, filtroProveedor]);

  const presupuestoTotal = useMemo(() => {
    return sugerenciasFiltradas
      .filter(item => !compradosIds.includes(item.insumo_id))
      .reduce((total, item) => total + (parseFloat(item.presupuesto_estimado) || 0), 0);
  }, [sugerenciasFiltradas, compradosIds]);

  const guardarPolitica = async (id, cob, seg) => {
    const res = await estimacionesService.actualizarPoliticaCompra(id, cob, seg);
    if (res.success) await cargarDatos();
    return res;
  };

  const confirmarCompra = async (insumo, usuarioId, sucursalId) => {
    const res = await estimacionesService.registrarCompraRealizada(
      insumo.insumo_id, insumo.cajas_a_pedir, insumo.presupuesto_estimado, usuarioId, sucursalId
    );
    if (res.success) {
      setCompradosIds(prev => [...prev, insumo.insumo_id]);
      await cargarDatos();
    }
    return res;
  };

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  return {
    sugerenciasFiltradas, proveedores, filtroProveedor, setFiltroProveedor,
    presupuestoTotal, loading, recargarDatos: cargarDatos, guardarPolitica,
    compradosIds, confirmarCompra
  };
};