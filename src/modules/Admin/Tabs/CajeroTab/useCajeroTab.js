// Archivo: src/modules/Admin/Tabs/CajeroTab/useCajeroTab.js
import { useState, useEffect, useCallback } from "react";
import { CajaService } from "./Caja.service";
import { hasPermission } from "../../../../utils/checkPermiso"; 
import Swal from "sweetalert2";

export const useCajeroTab = (usuarioId, sucursalId) => {
  const [loading, setLoading] = useState(true);
  const [sesionActiva, setSesionActiva] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [motivosCatalogo, setMotivosCatalogo] = useState([]);
  const [tiposDisponibles, setTiposDisponibles] = useState([]);
  
  // 🚀 NUEVO: Estado para el catálogo de descuentos
  const [descuentosCatalogo, setDescuentosCatalogo] = useState([]);

  // Centralizamos el estado de las cuentas directamente en el Hook
  const [cuentasPendientes, setCuentasPendientes] = useState([]);
  const [cuentasCobradas, setCuentasCobradas] = useState([]);

  // 🛡️ DEFINICIÓN DE FACULTADES: Basado en los permisos de Ventas/Caja
  const puedeVer = hasPermission("ver_ventas");
  const puedeEditar = hasPermission("editar_ventas");

  /**
   * Sincronización global de datos de caja (Sesión y Catálogos)
   */
  const cargarDatosCaja = useCallback(async () => {
    // 🛡️ BLINDAJE ESTRICTO: 
    // Evitamos el error 400 en Supabase. Si sucursalId no es válido o es undefined, abortamos.
    if (!puedeVer || !sucursalId || isNaN(sucursalId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Cargar catálogo de motivos (Entradas/Salidas manuales)
      const { data: catData } = await CajaService.getMotivosInventario();
      setMotivosCatalogo(catData || []);

      if (catData) {
        const tiposLimpios = catData.map((item) => item.tipo?.toString().trim().toLowerCase());
        const tiposUnicos = [...new Set(tiposLimpios)].filter(Boolean);
        setTiposDisponibles(tiposUnicos);
      }

      // 🚀 2. NUEVO: Cargar catálogo de descuentos (cat_tipos_descuento)
      const { data: descData } = await CajaService.getTiposDescuento();
      setDescuentosCatalogo(descData || []);

      // 3. Obtener sesión activa de la sucursal
      const { data: sesion } = await CajaService.getSesionActiva(sucursalId);
      setSesionActiva(sesion);

      if (sesion) {
        // 4. Cargar movimientos del turno actual
        const { data: movs } = await CajaService.getMovimientosSesion(sesion.id);
        setMovimientos(movs || []);
      } else {
        setMovimientos([]); 
      }

      // 5. Cargar historial de sesiones cerradas de la sucursal (para la pestaña Historial)
      const { data: hist } = await CajaService.getHistorialSesiones(sucursalId);
      setHistorial(hist || []);
    } catch (error) {
      console.error("Error en sincronización de caja:", error);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVer]); 

  /**
   * 💡 CARGAR CUENTAS FILTRADAS POR TURNO
   */
  const cargarCuentas = useCallback(async () => {
    // 🛡️ BLINDAJE ESTRICTO DE IDs
    if (!puedeVer || !sucursalId || isNaN(sucursalId) || !sesionActiva?.id) return;

    try {
      // 1. Cargar Pendientes del turno actual
      const { data: pendientes } = await CajaService.getVentasPendientes(sucursalId, sesionActiva.id);
      setCuentasPendientes(pendientes || []);

      // 2. Cargar Cobradas del turno actual
      const { data: cobradas } = await CajaService.getVentasCobradas(sucursalId, sesionActiva.id);
      setCuentasCobradas(cobradas || []);
    } catch (error) {
      console.error("Error al obtener cuentas del salón:", error);
    }
  }, [sucursalId, puedeVer, sesionActiva?.id]);

  // Carga inicial de datos base (Sesión)
  useEffect(() => {
    // Asegurarnos de que el sucursalId es válido antes de lanzar el efecto
    if (sucursalId && !isNaN(sucursalId)) {
        cargarDatosCaja();
    }
  }, [cargarDatosCaja, sucursalId]);

  // 💡 Polling automático: Refresca las mesas cada 30 segundos mientras el turno esté abierto
  useEffect(() => {
    if (sesionActiva?.id && sucursalId && !isNaN(sucursalId)) {
      cargarCuentas();
      const interval = setInterval(cargarCuentas, 30000); 
      return () => clearInterval(interval);
    } else {
      // Si se cierra la sesión, limpiamos las listas de la vista "Cobrar"
      setCuentasPendientes([]);
      setCuentasCobradas([]);
    }
  }, [sesionActiva?.id, sucursalId, cargarCuentas]);

  /**
   * Filtra los motivos del catálogo según el tipo seleccionado (Ingreso/Egreso)
   */
  const getMotivosPorTipo = (tipo) => {
    if (!tipo) return [];
    return motivosCatalogo.filter(
      (m) => m.tipo?.toString().trim().toLowerCase() === tipo.toString().trim().toLowerCase()
    );
  };

  /**
   * Inicia un nuevo turno de caja
   */
  const abrirTurno = async (monto) => {
    if (!puedeEditar) {
      return Swal.fire("Acceso denegado", "No tienes facultades para iniciar turnos de caja.", "error");
    }

    if (!usuarioId || !sucursalId) {
      return Swal.fire("Error", "Faltan datos de sesión para abrir caja.", "error");
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum < 0) {
      return Swal.fire("Error", "Ingresa un monto de apertura válido", "error");
    }

    const { data, error } = await CajaService.abrirCaja({
      usuario_id: usuarioId, // Guardamos quién abrió la caja
      sucursal_id: sucursalId, 
      monto_apertura: montoNum,
    });

    if (error) {
      console.error("Error al abrir caja:", error);
      Swal.fire("Error", `No se pudo abrir la caja: ${error.message}`, "error");
    } else {
      setSesionActiva(data);
      await cargarDatosCaja();
      Swal.fire("Éxito", "Turno de caja iniciado correctamente", "success");
    }
  };

  /**
   * Registra una entrada o salida de efectivo manual
   */
  const registrarMovimientoEfectivo = async (tipo, monto, motivoNombre) => {
    if (!puedeEditar) {
      return Swal.fire("Acceso denegado", "No tienes permiso para registrar movimientos.", "error");
    }

    if (!sesionActiva) {
      return Swal.fire("Atención", "Debes abrir un turno primero.", "warning");
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0 || !motivoNombre) {
      return Swal.fire("Error", "Monto y motivo son obligatorios", "error");
    }

    const { error } = await CajaService.registrarMovimiento({
      turno_id: sesionActiva.id,
      usuario_id: usuarioId, // Guardamos quién hizo el movimiento
      tipo: tipo?.toLowerCase().trim(),
      monto: montoNum,
      motivo: motivoNombre,
    });

    if (error) {
      Swal.fire("Error", `No se pudo guardar: ${error.message}`, "error");
    } else {
      await cargarDatosCaja();
      Swal.fire("Registrado", "Movimiento de efectivo guardado", "success");
    }
  };

  /**
   * 🚀 ACTUALIZADO: Proceso de Arqueo y Cierre de Turno con Tarjeta
   */
  const cerrarTurno = async (montoCierre, montoTarjeta) => {
    if (!puedeEditar) {
      return Swal.fire("Acceso denegado", "No tienes permiso para cerrar caja.", "error");
    }

    const montoCierreNum = parseFloat(montoCierre);
    const montoTarjetaNum = parseFloat(montoTarjeta) || 0; // Si el cajero lo deja vacío, asumimos 0

    if (isNaN(montoCierreNum) || montoCierreNum < 0) {
      return Swal.fire("Error", "Ingresa el monto físico en efectivo contado", "error");
    }
    if (montoTarjetaNum < 0) {
      return Swal.fire("Error", "El monto de tarjeta no puede ser negativo", "error");
    }

    // 🛡️ Obtener ventas reales en efectivo de la DB para esta sucursal
    const { totalVentas } = await CajaService.getTotalesEfectivoSesion(sesionActiva.fecha_apertura, sucursalId);
    
    const ingresos = movimientos
      .filter((m) => {
        const t = m.tipo?.toLowerCase().trim();
        return t === "ingreso" || t === "entrada";
      })
      .reduce((a, b) => a + b.monto, 0);
      
    const egresos = movimientos
      .filter((m) => {
        const t = m.tipo?.toLowerCase().trim();
        return t === "egreso" || t === "salida";
      })
      .reduce((a, b) => a + b.monto, 0);

    const montoEsperado = sesionActiva.monto_apertura + totalVentas + ingresos - egresos;
    const diferencia = montoCierreNum - montoEsperado;

    const confirm = await Swal.fire({
      title: "¿Finalizar Turno?",
      html: `
        <div style="text-align: left; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin-bottom: 5px; color: #475569;">Efectivo Esperado: <b>$${montoEsperado.toFixed(2)}</b></p>
            <p style="margin-bottom: 5px; color: #475569;">Efectivo Contado: <b>$${montoCierreNum.toFixed(2)}</b></p>
            <p style="margin-bottom: 15px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px;">
              Diferencia (Efectivo): <b style="color: ${diferencia < 0 ? "#ef4444" : "#10b981"}">$${diferencia.toFixed(2)}</b>
            </p>
            <p style="margin-bottom: 0; color: #475569;">Total Vouchers (Tarjeta): <b style="color: #3b82f6">$${montoTarjetaNum.toFixed(2)}</b></p>
        </div>
        <p style="margin-top: 15px; font-size: 0.9rem; color: #64748b;">Esta acción cerrará el turno y no podrá revertirse.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Confirmar Arqueo y Cerrar",
      cancelButtonText: "Revisar de nuevo",
      confirmButtonColor: "#2563eb"
    });

    if (confirm.isConfirmed) {
      const { error } = await CajaService.cerrarCaja(sesionActiva.id, {
        monto_cierre_real: montoCierreNum,
        monto_cierre_esperado: montoEsperado,
        diferencia: diferencia,
        monto_cierre_tarjeta: montoTarjetaNum, // Enviamos el dato al Service
      });

      if (error) {
        Swal.fire("Error", "Error al guardar el cierre en la base de datos.", "error");
      } else {
        setSesionActiva(null);
        await cargarDatosCaja();
        Swal.fire("Turno Finalizado", "La caja ha sido cerrada y el arqueo registrado.", "success");
      }
    }
  };

  /**
   * Función para refrescar toda la data manual (Ej. tras un cobro exitoso)
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
    descuentosCatalogo, // 🚀 AHORA EXPORTADO PARA TU JSX
    cuentasPendientes,
    cuentasCobradas,
    getMotivosPorTipo,
    abrirTurno,
    cerrarTurno,
    registrarMovimientoEfectivo,
    refrescarTodo,
    cargarCuentas,
    puedeVer,
    puedeEditar
  };
};