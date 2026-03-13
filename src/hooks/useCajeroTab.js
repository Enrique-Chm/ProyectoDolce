// Archivo: src/modules/Admin/hooks/useCajeroTab.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ventasService } from '../services/Ventas.service';
import { cajaService } from '../services/Caja.service';

export const useCajeroTab = (sucursalId, usuarioId) => {
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // --- ESTADOS DE TURNO ---
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [cargandoTurno, setCargandoTurno] = useState(true);

  // --- ESTADO PARA EL HISTORIAL DE CORTES ---
  const [historialTurnos, setHistorialTurnos] = useState([]);

  // Estados del Formulario de Cobro
  const [metodoPago, setMetodoPago] = useState('efectivo');
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

  // --- 2. CARGAR HISTORIAL DE CIERRES ---
  const cargarHistorialTurnos = useCallback(async () => {
    try {
      const { data, error } = await cajaService.getHistorialTurnos(sucursalId);
      if (error) throw error;
      setHistorialTurnos(data || []);
    } catch (err) {
      console.error("Error cargando historial de turnos:", err);
    }
  }, [sucursalId]);

  // --- 3. CARGA DE VENTAS PENDIENTES ---
  const cargarCuentas = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const { data } = await ventasService.getCuentasAbiertas(sucursalId);
      // Filtramos solo las que están en estado 'por_cobrar'
      const pendientes = data?.filter(v => v.estado === 'por_cobrar') || [];
      setCuentasPorCobrar(pendientes);
    } catch (err) {
      console.error("Error cargando caja:", err);
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [sucursalId]);

  // Efecto inicial: Verificar si hay turno al entrar
  useEffect(() => {
    verificarTurno();
  }, [verificarTurno]);

  // Efecto: Si hay turno, cargar cuentas y refrescar cada 20s
  useEffect(() => {
    if (turnoActivo) {
      cargarCuentas();
      const intervalo = setInterval(() => cargarCuentas(true), 20000);
      return () => clearInterval(intervalo);
    }
  }, [turnoActivo, cargarCuentas]);

  // --- 4. CÁLCULOS REACTIVOS ---
  const calculosCobro = useMemo(() => {
    const totalFinal = parseFloat(ventaSeleccionada?.total) || 0;
    const montoRecibido = parseFloat(pagadoCon) || 0;

    const diferencia = montoRecibido - totalFinal;

    return {
      totalFinal,
      cambio: diferencia > 0 ? diferencia : 0,
      faltaDinero: diferencia < 0 ? Math.abs(diferencia) : 0
    };
  }, [ventaSeleccionada, pagadoCon]);

  // --- 5. ACCIONES DE TURNO Y COBRO ---
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
          totalFinal: totalFinal,
          pagado_con: parseFloat(pagadoCon) || 0,
          cambio: cambio
        },
        usuarioId
      );

      if (res.success) {
        setVentaSeleccionada(null);
        setPagadoCon(0);
        await cargarCuentas();
        return { success: true };
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      alert("Error al procesar pago: " + error.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estado y acciones del Turno
    turnoActivo, 
    cargandoTurno,
    abrirTurno,
    verificarTurno,
    historialTurnos, 
    cargarHistorialTurnos, 
    // Gestión de ventas/cobros
    cuentasPorCobrar,
    ventaSeleccionada, setVentaSeleccionada,
    loading,
    metodoPago, setMetodoPago,
    pagadoCon, setPagadoCon,
    calculosCobro,
    abrirCobro: (v) => {
      setVentaSeleccionada(v);
      setPagadoCon(0);
      setMetodoPago('efectivo');
    },
    ejecutarCobro,
    cargarCuentas
  };
};