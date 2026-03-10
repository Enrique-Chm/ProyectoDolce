import { useState, useEffect, useCallback, useMemo } from 'react';
import { ventasService } from '../services/Ventas.service';
import { cajaService } from '../services/Caja.service';

export const useCajeroTab = (sucursalId, usuarioId) => {
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // --- NUEVOS ESTADOS DE TURNO ---
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [cargandoTurno, setCargandoTurno] = useState(true);

  // Estados del Formulario de Cobro
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [propina, setPropina] = useState(0);
  const [pagadoCon, setPagadoCon] = useState(0);

  // --- 1. CARGA DE TURNO (Prioridad #1) ---
  const verificarTurno = useCallback(async () => {
    setCargandoTurno(true);
    try {
      const { data, error } = await cajaService.getTurnoActivo(sucursalId);
      if (error) throw error;
      setTurnoActivo(data);
    } catch (err) {
      console.error("Error al verificar turno:", err);
    } finally {
      setCargandoTurno(false);
    }
  }, [sucursalId]);

  // --- 2. CARGA DE VENTAS ---
  const cargarCuentas = useCallback(async (silencioso = false) => {
    // Solo cargamos cuentas si hay un turno abierto
    if (!silencioso) setLoading(true);
    try {
      const { data } = await ventasService.getCuentasAbiertas(sucursalId);
      const pendientes = data?.filter(v => v.estado === 'por_cobrar') || [];
      setCuentasPorCobrar(pendientes);
    } catch (err) {
      console.error("Error cargando caja:", err);
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [sucursalId]);

  useEffect(() => {
    verificarTurno();
  }, [verificarTurno]);

  useEffect(() => {
    if (turnoActivo) {
      cargarCuentas();
      const intervalo = setInterval(() => cargarCuentas(true), 20000);
      return () => clearInterval(intervalo);
    }
  }, [turnoActivo, cargarCuentas]);

  // --- 3. CÁLCULOS REACTIVOS ---
  const calculosCobro = useMemo(() => {
    const subtotalVenta = parseFloat(ventaSeleccionada?.total) || 0;
    const montoPropina = parseFloat(propina) || 0;
    const montoRecibido = parseFloat(pagadoCon) || 0;

    const totalFinal = subtotalVenta + montoPropina;
    const diferencia = montoRecibido - totalFinal;

    return {
      totalFinal,
      cambio: diferencia > 0 ? diferencia : 0,
      faltaDinero: diferencia < 0 ? Math.abs(diferencia) : 0
    };
  }, [ventaSeleccionada, propina, pagadoCon]);

  // --- 4. ACCIONES DE TURNO ---
  const abrirTurno = async (montoInicial) => {
    setLoading(true);
    try {
      const { data, error } = await cajaService.abrirTurno(sucursalId, usuarioId, montoInicial);
      if (error) throw error;
      setTurnoActivo(data);
      return { success: true };
    } catch (error) {
      alert("Error al abrir turno: " + error.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const ejecutarCobro = async () => {
    if (!ventaSeleccionada || !turnoActivo) return;

    const { totalFinal, cambio, faltaDinero } = calculosCobro;

    if (metodoPago === 'efectivo' && faltaDinero > 0) {
      alert(`⚠️ Faltan $${faltaDinero.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await ventasService.cerrarCuenta(
        ventaSeleccionada.id,
        {
          metodo_pago: metodoPago,
          propina: parseFloat(propina) || 0,
          totalFinal: totalFinal,
          pagado_con: parseFloat(pagadoCon) || 0,
          cambio: cambio
        },
        usuarioId
      );

      if (res.success) {
        setVentaSeleccionada(null);
        setPropina(0);
        setPagadoCon(0);
        await cargarCuentas();
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      alert("Error al procesar pago: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estados de Turno
    turnoActivo, 
    cargandoTurno,
    abrirTurno,
    verificarTurno,
    // Estados de Venta
    cuentasPorCobrar,
    ventaSeleccionada, setVentaSeleccionada,
    loading,
    metodoPago, setMetodoPago,
    propina, setPropina,
    pagadoCon, setPagadoCon,
    calculosCobro,
    abrirCobro: (v) => {
      setVentaSeleccionada(v);
      setPropina(0);
      setPagadoCon(0);
    },
    ejecutarCobro,
    cargarCuentas
  };
};