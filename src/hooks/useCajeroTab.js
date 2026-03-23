// Archivo: src/hooks/useCajeroTab.js
import { useState, useEffect, useCallback } from "react";
import { CajaService } from "../services/Caja.service";
import { hasPermission } from "../utils/checkPermiso"; // 🛡️ Importación de seguridad
import Swal from "sweetalert2";

// 🔴 ACTUALIZACIÓN: Ahora recibe sucursalId para vincular el turno correctamente
export const useCajeroTab = (usuarioId, sucursalId) => {
  const [loading, setLoading] = useState(true);
  const [sesionActiva, setSesionActiva] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [motivosCatalogo, setMotivosCatalogo] = useState([]);
  const [tiposDisponibles, setTiposDisponibles] = useState([]);

  // 🛡️ DEFINICIÓN DE FACULTADES
  const puedeVer = hasPermission("ver_ventas");
  const puedeEditar = hasPermission("editar_ventas");

  /**
   * Sincronización global de datos de caja
   */
  const cargarDatosCaja = useCallback(async () => {
    // 🛡️ BLINDAJE: Si no puede ver, detenemos la carga
    if (!puedeVer) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Cargar catálogo de motivos
      const { data: catData } = await CajaService.getMotivosInventario();
      setMotivosCatalogo(catData || []);

      if (catData) {
        const tiposLimpios = catData.map((item) => item.tipo?.toString().trim().toLowerCase());
        const tiposUnicos = [...new Set(tiposLimpios)].filter(Boolean);
        setTiposDisponibles(tiposUnicos);
      }

      // 2. Obtener sesión activa
      // 🔴 ACTUALIZACIÓN: Se envía sucursalId para filtrar correctamente
      const { data: sesion } = await CajaService.getSesionActiva(usuarioId, sucursalId);
      setSesionActiva(sesion);

      if (sesion) {
        // 3. Cargar movimientos del turno actual
        const { data: movs } = await CajaService.getMovimientosSesion(sesion.id);
        setMovimientos(movs || []);
      } else {
        setMovimientos([]); 
      }

      // 4. Cargar historial de sesiones cerradas
      const { data: hist } = await CajaService.getHistorialSesiones();
      setHistorial(hist || []);
    } catch (error) {
      console.error("Error en sincronización de caja:", error);
    } finally {
      setLoading(false);
    }
  }, [usuarioId, sucursalId, puedeVer]); // 🛡️ sucursalId agregada como dependencia

  useEffect(() => {
    cargarDatosCaja();
  }, [cargarDatosCaja]);

  /**
   * Filtra los motivos del catálogo según el tipo seleccionado
   */
  const getMotivosPorTipo = (tipo) => {
    if (!tipo) return [];
    return motivosCatalogo.filter(
      (m) => m.tipo?.toString().trim().toLowerCase() === tipo.toString().trim().toLowerCase()
    );
  };

  /**
   * Abre un nuevo turno
   */
  const abrirTurno = async (monto) => {
    // 🛡️ BLINDAJE: Verificación de permiso de edición
    if (!puedeEditar) {
      return Swal.fire("Acceso denegado", "No tienes facultades para iniciar turnos de caja.", "error");
    }

    if (!usuarioId || !sucursalId) {
      return Swal.fire("Error", "Faltan datos de usuario o sucursal para abrir caja.", "error");
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum < 0) {
      return Swal.fire("Error", "Ingresa un monto de apertura válido", "error");
    }

    // 🔴 ACTUALIZACIÓN: Se incluye sucursal_id en el payload para evitar el NULL en la DB
    const { data, error } = await CajaService.abrirCaja({
      usuario_id: usuarioId,
      sucursal_id: sucursalId, // <--- Este campo es el que "abre" el candado del mesero
      monto_apertura: montoNum,
    });

    if (error) {
      console.error("Error al abrir caja:", error);
      Swal.fire("Error", `No se pudo abrir la caja: ${error.message || 'Verifica la conexión'}`, "error");
    } else {
      setSesionActiva(data);
      await cargarDatosCaja();
      Swal.fire("Éxito", "Turno iniciado", "success");
    }
  };

  /**
   * Registra un ingreso o egreso de dinero
   */
  const registrarMovimientoEfectivo = async (tipo, monto, motivoNombre) => {
    // 🛡️ BLINDAJE: Verificación de permiso de edición
    if (!puedeEditar) {
      return Swal.fire("Acceso denegado", "No tienes permiso para registrar movimientos de dinero.", "error");
    }

    if (!sesionActiva) {
      return Swal.fire("Atención", "Debes abrir un turno para registrar movimientos.", "warning");
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0 || !motivoNombre) {
      return Swal.fire("Error", "Monto y motivo son obligatorios", "error");
    }

    const { error } = await CajaService.registrarMovimiento({
      turno_id: sesionActiva.id,
      usuario_id: usuarioId,
      tipo: tipo?.toLowerCase().trim(),
      monto: montoNum,
      motivo: motivoNombre,
    });

    if (error) {
      console.error("Error al registrar movimiento:", error);
      Swal.fire("Error", `No se pudo guardar el movimiento: ${error.message}`, "error");
    } else {
      await cargarDatosCaja();
      Swal.fire("Registrado", "Movimiento guardado con éxito", "success");
    }
  };

  /**
   * Arqueo adaptado para leer "entrada" y "salida"
   */
  const cerrarTurno = async (montoCierre) => {
    // 🛡️ BLINDAJE: Solo personal autorizado cierra caja
    if (!puedeEditar) {
      return Swal.fire("Acceso denegado", "No tienes permiso para realizar el arqueo de cierre.", "error");
    }

    const montoCierreNum = parseFloat(montoCierre);
    if (isNaN(montoCierreNum)) {
      return Swal.fire("Error", "Ingresa el monto físico contado", "error");
    }

    const { totalVentas } = await CajaService.getTotalesEfectivoSesion(sesionActiva.fecha_apertura);
    
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
      title: "¿Confirmar Arqueo?",
      html: `
        <div style="text-align: left;">
            <p>Monto Esperado: <b>$${montoEsperado.toFixed(2)}</b></p>
            <p>Diferencia: <b style="color: ${diferencia < 0 ? "#ef4444" : "#10b981"}">$${diferencia.toFixed(2)}</b></p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Cerrar Turno",
    });

    if (confirm.isConfirmed) {
      const { error } = await CajaService.cerrarCaja(sesionActiva.id, {
        monto_cierre_real: montoCierreNum,
        monto_cierre_esperado: montoEsperado,
        diferencia: diferencia,
      });

      if (error) {
        console.error("Error al cerrar turno:", error);
        Swal.fire("Error", "No se pudo procesar el cierre en la base de datos.", "error");
      } else {
        setSesionActiva(null);
        await cargarDatosCaja();
        Swal.fire("Cerrado", "La caja ha sido cerrada correctamente", "success");
      }
    }
  };

  return {
    loading,
    sesionActiva: puedeVer ? sesionActiva : null, // 🛡️ Datos ocultos si no hay permiso
    movimientos: puedeVer ? movimientos : [],
    historial: puedeVer ? historial : [],
    motivosCatalogo,
    tiposDisponibles,
    getMotivosPorTipo,
    abrirTurno,
    cerrarTurno,
    registrarMovimientoEfectivo,
    refrescarTodo: cargarDatosCaja,
    // 🛡️ Banderas de UI para el componente JSX
    puedeVer,
    puedeEditar
  };
};