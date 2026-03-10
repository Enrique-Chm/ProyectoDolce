import { useState, useEffect, useCallback } from 'react';
import { inventarioService } from '../services/Inventario.service';

/**
 * Hook para la gestión integral de insumos, auditoría y contraste
 */
export const useInventarios = (sucursalId) => {
  const [insumos, setInsumos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contrasteData, setContrasteData] = useState([]);

  // 1. CARGAR EXISTENCIAS (Desde tu tabla lista_insumo)
  const cargarInsumos = useCallback(async () => {
    if (!sucursalId) return;
    setLoading(true);
    try {
      const { data, error } = await inventarioService.getInsumos(sucursalId);
      if (error) throw error;
      setInsumos(data || []);
    } catch (err) {
      console.error("Error al cargar insumos:", err);
    } finally {
      setLoading(false);
    }
  }, [sucursalId]);

  // 2. CARGAR MOVIMIENTOS (Auditoría de Entradas/Salidas/Mermas)
  const cargarMovimientos = useCallback(async () => {
    try {
      const { data } = await inventarioService.getMovimientos(sucursalId);
      setMovimientos(data || []);
    } catch (err) {
      console.error("Error al cargar movimientos:", err);
    }
  }, [sucursalId]);

  // 3. GENERAR REPORTE DE CONTRASTE (Antifraude)
  // Cruza Ventas + Recetas vs Stock Real
  const generarContraste = useCallback(async (fechaInicio, fechaFin) => {
    setLoading(true);
    try {
      // Esta función del service hará el cálculo pesado de "lo que debió gastarse"
      const { data } = await inventarioService.calcularContraste(sucursalId, fechaInicio, fechaFin);
      setContrasteData(data || []);
    } catch (err) {
      console.error("Error al generar contraste:", err);
    } finally {
      setLoading(false);
    }
  }, [sucursalId]);

  // 4. REGISTRAR AJUSTE O MERMA
  const registrarAjuste = async (movimiento) => {
    setLoading(true);
    try {
      const { error } = await inventarioService.crearMovimiento({
        ...movimiento,
        sucursal_id: sucursalId
      });
      if (error) throw error;
      
      // Refrescamos datos para ver el nuevo stock
      await cargarInsumos();
      await cargarMovimientos();
      return { success: true };
    } catch (err) {
      alert("Error al registrar: " + err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInsumos();
    cargarMovimientos();
  }, [cargarInsumos, cargarMovimientos]);

  return {
    insumos,
    movimientos,
    contrasteData,
    loading,
    registrarAjuste,
    generarContraste,
    refrescar: cargarInsumos
  };
};