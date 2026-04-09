// Archivo: src/modules/Admin/Tabs/CajeroTab/useCajeroTab.js
import { useState, useEffect, useCallback } from "react";
import { CajaService } from "./Caja.service";
import { hasPermission } from "../../../../utils/checkPermiso"; 
import Swal from "sweetalert2";

/**
 * Hook para gestionar la lógica de la Caja (CajeroTab).
 * Centraliza la gestión de turnos, movimientos de efectivo, arqueos y 
 * el procesamiento de cobros con actualización de inventario.
 */
export const useCajeroTab = (usuarioId, sucursalId) => {
  const [loading, setLoading] = useState(true);
  const [sesionActiva, setSesionActiva] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [motivosCatalogo, setMotivosCatalogo] = useState([]);
  const [tiposDisponibles, setTiposDisponibles] = useState([]);
  
  // Catálogo de descuentos configurados en el sistema
  const [descuentosCatalogo, setDescuentosCatalogo] = useState([]);

  // Listados de cuentas del salón/turno actual
  const [cuentasPendientes, setCuentasPendientes] = useState([]);
  const [cuentasCobradas, setCuentasCobradas] = useState([]);

  // 🛡️ RBAC: Facultades del usuario
  const puedeVer = hasPermission("ver_ventas");
  const puedeEditar = hasPermission("editar_ventas");

  /**
   * Sincronización global de datos de caja (Sesión activa y Catálogos)
   */
  const cargarDatosCaja = useCallback(async () => {
    if (!puedeVer || !sucursalId || isNaN(sucursalId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Catálogo de motivos para entradas/salidas manuales
      const { data: catData } = await CajaService.getMotivosInventario();
      setMotivosCatalogo(catData || []);

      if (catData) {
        const tiposLimpios = catData.map((item) => item.tipo?.toString().trim().toLowerCase());
        const tiposUnicos = [...new Set(tiposLimpios)].filter(Boolean);
        setTiposDisponibles(tiposUnicos);
      }

      // 2. Catálogo de tipos de descuento (Comensales, Empleados, etc.)
      const { data: descData } = await CajaService.getTiposDescuento();
      setDescuentosCatalogo(descData || []);

      // 3. Verificar si hay un turno abierto en la sucursal actual
      const { data: sesion } = await CajaService.getSesionActiva(sucursalId);
      setSesionActiva(sesion);

      if (sesion) {
        // 4. Movimientos registrados en este turno específico
        const { data: movs } = await CajaService.getMovimientosSesion(sesion.id);
        setMovimientos(movs || []);
      } else {
        setMovimientos([]); 
      }

      // 5. Historial de cierres para auditoría
      const { data: hist } = await CajaService.getHistorialSesiones(sucursalId);
      setHistorial(hist || []);
    } catch (error) {
      console.error("Error en sincronización de caja:", error);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVer]); 

  /**
   * Carga las cuentas (ventas) ligadas al turno de caja actual
   */
  const cargarCuentas = useCallback(async () => {
    if (!puedeVer || !sucursalId || isNaN(sucursalId) || !sesionActiva?.id) return;

    try {
      const { data: pendientes } = await CajaService.getVentasPendientes(sucursalId, sesionActiva.id);
      setCuentasPendientes(pendientes || []);

      const { data: cobradas } = await CajaService.getVentasCobradas(sucursalId, sesionActiva.id);
      setCuentasCobradas(cobradas || []);
    } catch (error) {
      console.error("Error al obtener cuentas del salón:", error);
    }
  }, [sucursalId, puedeVer, sesionActiva?.id]);

  // Efecto: Carga inicial de sesión
  useEffect(() => {
    if (sucursalId && !isNaN(sucursalId)) {
        cargarDatosCaja();
    }
  }, [cargarDatosCaja, sucursalId]);

  // Efecto: Polling automático para mantener mesas actualizadas
  useEffect(() => {
    if (sesionActiva?.id && sucursalId && !isNaN(sucursalId)) {
      cargarCuentas();
      const interval = setInterval(cargarCuentas, 30000); 
      return () => clearInterval(interval);
    } else {
      setCuentasPendientes([]);
      setCuentasCobradas([]);
    }
  }, [sesionActiva?.id, sucursalId, cargarCuentas]);

  /**
   * 🚀 NUEVO: Procesa el cobro de una cuenta y dispara el inventario híbrido.
   * Centraliza la lógica de éxito/error y refresco de listas.
   */
  const cobrarCuenta = async (idVenta, datosCobro) => {
    if (!puedeEditar) {
      return Swal.fire("Acceso denegado", "No tienes permisos para cobrar.", "error");
    }

    setLoading(true);
    // Llamamos al servicio pasando sucursalId para la lógica de inventario SQL
    const { data, error } = await CajaService.finalizarVenta(idVenta, datosCobro, sucursalId);
    
    if (error) {
      Swal.fire("Error", `No se pudo procesar el pago: ${error.message}`, "error");
    } else {
      await cargarCuentas(); // Actualizamos las listas para quitar la cuenta de "Pendientes"
      Swal.fire("Venta Finalizada", "El pago ha sido registrado y el inventario actualizado correctamente.", "success");
    }
    
    setLoading(false);
    return { data, error };
  };

  /**
   * Filtro de motivos según tipo (Ingreso/Egreso)
   */
  const getMotivosPorTipo = (tipo) => {
    if (!tipo) return [];
    return motivosCatalogo.filter(
      (m) => m.tipo?.toString().trim().toLowerCase() === tipo.toString().trim().toLowerCase()
    );
  };

  /**
   * Inicia un nuevo turno (Apertura de Caja)
   */
  const abrirTurno = async (monto) => {
    if (!puedeEditar) return Swal.fire("Acceso denegado", "No tienes facultades para iniciar turnos.", "error");

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum < 0) return Swal.fire("Error", "Monto de apertura inválido.", "error");

    const { data, error } = await CajaService.abrirCaja({
      usuario_id: usuarioId,
      sucursal_id: sucursalId, 
      monto_apertura: montoNum,
    });

    if (error) {
      Swal.fire("Error", `No se pudo abrir caja: ${error.message}`, "error");
    } else {
      setSesionActiva(data);
      await cargarDatosCaja();
      Swal.fire("Éxito", "Turno iniciado.", "success");
    }
  };

  /**
   * Registra flujo de efectivo manual (Entradas/Salidas)
   */
  const registrarMovimientoEfectivo = async (tipo, monto, motivoNombre) => {
    if (!puedeEditar) return Swal.fire("Acceso denegado", "Sin permisos.", "error");
    if (!sesionActiva) return Swal.fire("Atención", "Abre turno primero.", "warning");

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) return Swal.fire("Error", "Monto inválido.", "error");

    const { error } = await CajaService.registrarMovimiento({
      turno_id: sesionActiva.id,
      usuario_id: usuarioId,
      tipo: tipo?.toLowerCase().trim(),
      monto: montoNum,
      motivo: motivoNombre,
    });

    if (error) Swal.fire("Error", error.message, "error");
    else {
      await cargarDatosCaja();
      Swal.fire("Registrado", "Movimiento guardado.", "success");
    }
  };

  /**
   * Realiza el arqueo y cierra el turno
   */
  const cerrarTurno = async (montoCierre, montoTarjeta) => {
    if (!puedeEditar) return Swal.fire("Acceso denegado", "Sin permisos.", "error");

    const montoCierreNum = parseFloat(montoCierre);
    const montoTarjetaNum = parseFloat(montoTarjeta) || 0;

    if (isNaN(montoCierreNum) || montoCierreNum < 0) return Swal.fire("Error", "Monto de cierre inválido.", "error");

    // Cálculo de balance esperado en base a la DB
    const { totalVentas } = await CajaService.getTotalesEfectivoSesion(sesionActiva.fecha_apertura, sucursalId);
    
    const ingresos = movimientos
      .filter((m) => ["ingreso", "entrada"].includes(m.tipo?.toLowerCase().trim()))
      .reduce((a, b) => a + b.monto, 0);
      
    const egresos = movimientos
      .filter((m) => ["egreso", "salida"].includes(m.tipo?.toLowerCase().trim()))
      .reduce((a, b) => a + b.monto, 0);

    const montoEsperado = sesionActiva.monto_apertura + totalVentas + ingresos - egresos;
    const diferencia = montoCierreNum - montoEsperado;

    const confirm = await Swal.fire({
      title: "¿Finalizar Turno?",
      html: `
        <div style="text-align: left; background: #f8fafc; padding: 10px; border-radius: 8px;">
            <p>Efectivo Esperado: <b>$${montoEsperado.toFixed(2)}</b></p>
            <p>Efectivo Contado: <b>$${montoCierreNum.toFixed(2)}</b></p>
            <hr/>
            <p>Diferencia: <b>$${diferencia.toFixed(2)}</b></p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Confirmar Arqueo y Cerrar",
    });

    if (confirm.isConfirmed) {
      const { error } = await CajaService.cerrarCaja(sesionActiva.id, {
        monto_cierre_real: montoCierreNum,
        monto_cierre_esperado: montoEsperado,
        diferencia: diferencia,
        monto_cierre_tarjeta: montoTarjetaNum,
      });

      if (error) Swal.fire("Error", error.message, "error");
      else {
        setSesionActiva(null);
        await cargarDatosCaja();
        Swal.fire("Turno Finalizado", "La caja ha sido cerrada correctamente.", "success");
      }
    }
  };

  /**
   * Forzar refresco manual de la vista
   */
  const refrescarTodo = async () => {
    await cargarDatosCaja();
    if (sesionActiva) await cargarCuentas();
  };

  return {
    loading,
    sesionActiva: puedeVer ? sesionActiva : null,
    movimientos: puedeVer ? movimientos : [],
    historial: puedeVer ? historial : [],
    motivosCatalogo,
    tiposDisponibles,
    descuentosCatalogo, 
    cuentasPendientes,
    cuentasCobradas,
    getMotivosPorTipo,
    abrirTurno,
    cerrarTurno,
    cobrarCuenta, // 🚀 Exportado para procesar pagos con inventario
    registrarMovimientoEfectivo,
    refrescarTodo,
    cargarCuentas,
    puedeVer,
    puedeEditar
  };
};