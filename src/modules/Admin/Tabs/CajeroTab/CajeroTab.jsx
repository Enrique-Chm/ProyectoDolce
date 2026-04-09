// Archivo: src/modules/Admin/Tabs/CajeroTab/CajeroTab.jsx
import React, { useState } from "react";
import { useCajeroTab } from "./useCajeroTab";
import stylesAdmin from "../../../../assets/styles/EstilosGenerales.module.css";
import { hasPermission } from "../../../../utils/checkPermiso";

// 🚀 VISTAS DIVIDIDAS
import { CobrarView } from "./CobrarView";
import { MovimientosView } from "./MovimientosView";
import { TurnoView } from "./TurnoView";
import { HistorialTurnosView } from "./HistorialTurnosView";

export const CajeroTab = ({ usuarioId, sucursalId }) => {
  // 🛡️ SEGURIDAD: Permiso para realizar cobros, arqueos y movimientos
  const puedeEditarCaja = hasPermission('editar_ventas');
  
  // Estado para controlar la navegación entre sub-pestañas
  const [activeSubTab, setActiveSubTab] = useState("COBRAR");

  // ⚓ Hook de lógica centralizada
  const {
    sesionActiva, 
    loading, 
    movimientos, 
    historial, 
    tiposDisponibles,
    descuentosCatalogo, 
    cuentasPendientes, 
    cuentasCobradas,   
    getMotivosPorTipo, 
    abrirTurno, 
    cerrarTurno, 
    registrarMovimientoEfectivo, 
    refrescarTodo,
    cobrarCuenta // 🚀 Recuperamos la función del hook (opcional si CobrarView usa el service directo)
  } = useCajeroTab(usuarioId, sucursalId);

  // Pantalla de carga mientras se sincroniza el estado de la caja
  if (loading) return (
    <div className={stylesAdmin.loadingOverlay}>
        <div className={stylesAdmin.spinner}></div>
        <p>Sincronizando estado de caja...</p>
    </div>
  );

  return (
    <div className={stylesAdmin.tabWrapper}>
        <div className={stylesAdmin.pageHeader}>
          <h2 className={stylesAdmin.pageTitle}>Panel de Cajero</h2>
        </div>

        {/* NAVEGACIÓN DE SUB-PESTAÑAS */}
        <nav className={stylesAdmin.tabNav}>
          {["COBRAR", "MOVIMIENTOS", "TURNO Y ARQUEO", "HISTORIAL"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`${stylesAdmin.tabButton} ${activeSubTab === tab ? stylesAdmin.activeTabButton : ""}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* --- 1. VISTA DE COBRO DE MESAS --- */}

{activeSubTab === "COBRAR" && (
  <CobrarView
    sesionActiva={sesionActiva}
    cuentasPendientes={cuentasPendientes}
    cuentasCobradas={cuentasCobradas}
    puedeEditarCaja={puedeEditarCaja}
    refrescarTodo={refrescarTodo}
    tiposDescuentoCatalogo={descuentosCatalogo}
    sucursalId={sucursalId} // 🚀 ESTA LÍNEA ES VITAL
  />
)}
        {/* --- 2. VISTA DE ENTRADAS Y SALIDAS DE EFECTIVO --- */}
        {activeSubTab === "MOVIMIENTOS" && (
          <MovimientosView 
            sesionActiva={sesionActiva}
            puedeEditarCaja={puedeEditarCaja}
            tiposDisponibles={tiposDisponibles}
            getMotivosPorTipo={getMotivosPorTipo}
            registrarMovimientoEfectivo={registrarMovimientoEfectivo}
            movimientos={movimientos}
          />
        )}

        {/* --- 3. VISTA DE GESTIÓN DE TURNO (APERTURA Y ARQUEO) --- */}
        {activeSubTab === "TURNO Y ARQUEO" && (
          <TurnoView 
            sesionActiva={sesionActiva}
            abrirTurno={abrirTurno}
            cerrarTurno={cerrarTurno}
          />
        )}

        {/* --- 4. VISTA DE HISTORIAL DE CORTES PASADOS --- */}
        {activeSubTab === "HISTORIAL" && (
          <HistorialTurnosView 
            historial={historial} 
            sucursalId={sucursalId} 
          />
        )}
    </div>
  );
};

export default CajeroTab;