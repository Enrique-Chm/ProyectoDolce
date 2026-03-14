import { useState, useEffect, useCallback } from 'react';
import { cajaService } from '../services/Caja.service';
import { ventasService } from '../services/Ventas.service';
import { supabase } from '../lib/supabaseClient';

export const useCaja = (sucursalId) => {
  const [sesion, setSesion] = useState(null);
  const [cuentasPendientes, setCuentasPendientes] = useState([]);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState({
    efectivo: 0,
    tarjeta: 0,
    totalPropinas: 0,
    montoEsperado: 0,
    detalleArqueo: null
  });
  const [loading, setLoading] = useState(true);

  /**
   * Carga toda la información financiera y operativa 
   * vinculada a la sucursal y a la sesión activa.
   */
  const cargarDatosCaja = useCallback(async () => {
    if (!sucursalId) return;
    
    setLoading(true);
    try {
      // 1. Obtener la sesión de caja activa para esta sucursal
      const { data: sesionActiva } = await cajaService.getSesionActiva(sucursalId);
      setSesion(sesionActiva);

      if (sesionActiva) {
        // 2. Cargar cuentas pendientes de cobro (por_cobrar o entregado)
        const { data: pendientes } = await ventasService.getCuentasAbiertas(sucursalId);
        setCuentasPendientes(pendientes || []);

        // 3. Cargar historial de ventas realizadas en ESTA sesión
        const { data: historial } = await ventasService.getHistorialCobradas(sucursalId, sesionActiva.id);
        setHistorialVentas(historial || []);

        // 4. Cargar movimientos manuales (ingresos/egresos)
        const { data: movs } = await cajaService.getMovimientos(sesionActiva.id);
        setMovimientos(movs || []);

        // 5. Calcular arqueo y resumen financiero
        const [resArqueo, resFinanciero] = await Promise.all([
          cajaService.obtenerEstadoArqueo(sesionActiva.id),
          ventasService.getResumenCaja(sucursalId, sesionActiva.id)
        ]);

        setResumen({
          ...resFinanciero.data,
          montoEsperado: resArqueo.data?.montoEsperado || 0,
          detalleArqueo: resArqueo.data
        });
      } else {
        // Si no hay sesión, limpiamos los estados
        setCuentasPendientes([]);
        setHistorialVentas([]);
        setMovimientos([]);
        setResumen({ efectivo: 0, tarjeta: 0, totalPropinas: 0, montoEsperado: 0, detalleArqueo: null });
      }
    } catch (error) {
      console.error("Error al sincronizar datos de caja:", error);
    } finally {
      setLoading(false);
    }
  }, [sucursalId]);

  useEffect(() => {
    cargarDatosCaja();
  }, [cargarDatosCaja]);

  /**
   * Inicia un nuevo turno de caja.
   */
  const abrirCaja = async (monto) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay usuario autenticado");

      const { data, error } = await cajaService.abrirCaja(sucursalId, monto, user.id);
      
      if (error) throw error;
      
      setSesion(data);
      await cargarDatosCaja();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Finaliza el turno actual y registra los totales.
   */
  const cerrarCaja = async (montoCierre, notas) => {
    try {
      if (!sesion) throw new Error("No hay una sesión activa para cerrar");

      const { success, error } = await cajaService.cerrarCaja(sesion.id, montoCierre, notas);
      
      if (success) {
        setSesion(null);
        await cargarDatosCaja();
      }
      return { success, error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Procesa el pago de una cuenta.
   */
  const cobrarCuenta = async (ventaId, datosPago) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { success, error } = await ventasService.cerrarCuenta(ventaId, datosPago, user.id);
      
      if (success) {
        await cargarDatosCaja();
      }
      return { success, error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Registra un egreso (gasto) o ingreso manual.
   */
  const registrarMovimientoManual = async (tipo, monto, descripcion) => {
    try {
      if (!sesion) throw new Error("Debe haber una sesión abierta");

      const { data, error } = await cajaService.registrarMovimiento(
        sesion.id, 
        tipo, 
        monto, 
        descripcion
      );

      if (!error) {
        await cargarDatosCaja();
      }
      return { data, error };
    } catch (error) {
      return { error: error.message };
    }
  };

  return {
    sesion,
    cuentasPendientes,
    historialVentas,
    movimientos,
    resumen,
    loading,
    acciones: {
      abrirCaja,
      cerrarCaja,
      cobrarCuenta,
      registrarMovimientoManual,
      refrescar: cargarDatosCaja
    }
  };
};