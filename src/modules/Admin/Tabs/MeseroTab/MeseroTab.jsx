// Archivo: src/modules/Admin/Tabs/MeseroTab/MeseroTab.jsx
import React from "react";
import s from "../../../../assets/styles/ServicioTab.module.css";
import stylesAdmin from "../../../../assets/styles/EstilosGenerales.module.css";
import { useMeseroTab } from "./useMeseroTab"; 
import { hasPermission } from "../../../../utils/checkPermiso";
import { ModalExtras } from "./ModalExtras";
import { MenuCarritoView } from "./MenuCarritoView";
import { MapaMesasView } from "./MapaMesasView";

export const MeseroTab = ({ sucursalId, usuarioId }) => {
  const {
    view,
    setView,
    cuentasAbiertas,
    cuentasCobradas,
    ventaActiva,
    
    // 🚀 NUEVOS ESTADOS PRO EXPORTADOS DESDE EL HOOK
    zonasMesas,
    mesaId, setMesaId,
    mesaInput, setMesaInput,
    tipoOrden, setTipoOrden,
    comensales, setComensales,
    clienteNombre, setClienteNombre,
    notasOrden, setNotasOrden,

    productos,
    categorias,
    carrito,
    loading,

    // 🚀 NUEVOS ESTADOS PARA EL MULTIPLICADOR RÁPIDO
    cantidadRapida,
    setCantidadRapida,

    // Estados y funciones del Modal de Extras
    mostrarModalExtras,
    productoParaExtras,
    confirmarProductoConExtras,
    cerrarModalExtras,

    seleccionarCuenta,
    iniciarNuevaMesa,
    abrirMenuMesaNueva, // 🚀 NUEVO: Extraemos la función de validación contra Race Conditions
    agregarAlCarrito,
    eliminarDelCarrito,
    actualizarNota,
    handleEnviarOrden,
    pedirCuenta,
    resetTodo
  } = useMeseroTab(sucursalId, usuarioId);

  // 🛡️ SISTEMA DE FACULTADES (RBAC)
  const puedeTomarOrdenes = hasPermission("crear_comandas");
  const puedePedirCuenta = hasPermission("editar_comandas");
  const puedeVerHistorial = hasPermission("ver_comandas");

  return (
    <div className={s.posContainer}>
      
      {/* 🌀 OVERLAY DE CARGA */}
      {loading && (
        <div className={stylesAdmin.loadingOverlay}>
          <div className={stylesAdmin.spinner}></div>
          <p>Sincronizando datos...</p>
        </div>
      )}

      {/* 🚀 MODAL DE MODIFICADORES (EXTRAS) */}
      {mostrarModalExtras && productoParaExtras && (
        <ModalExtras
          productoParaExtras={productoParaExtras}
          confirmarProductoConExtras={confirmarProductoConExtras}
          cerrarModalExtras={cerrarModalExtras}
        />
      )}

      {/* 🗺️ VISTA 1: MAPA DE MESAS (Reemplaza a 'cuentas' y 'mesas') */}
      {(view === "cuentas" || view === "mesas") && (
        <MapaMesasView 
          zonasMesas={zonasMesas}
          cuentasAbiertas={cuentasAbiertas}
          seleccionarCuenta={seleccionarCuenta}
          mesaId={mesaId} setMesaId={setMesaId}
          mesaInput={mesaInput} setMesaInput={setMesaInput}
          tipoOrden={tipoOrden} setTipoOrden={setTipoOrden}
          comensales={comensales} setComensales={setComensales}
          clienteNombre={clienteNombre} setClienteNombre={setClienteNombre}
          notasOrden={notasOrden} setNotasOrden={setNotasOrden}
          setView={setView}
          puedeTomarOrdenes={puedeTomarOrdenes}
          puedeVerHistorial={puedeVerHistorial}
          usuarioIdLogueado={usuarioId} /* 👈 NUEVO: Le pasamos el ID del usuario logueado para el Bloqueo de Mesas */
          abrirMenuMesaNueva={abrirMenuMesaNueva} /* 👈 NUEVO: Le pasamos la función para validar la base de datos antes de entrar al menú */
          pedirCuenta={pedirCuenta} /* 🚀 NUEVO: Pasamos la función para pedir cuenta desde el mapa */
          puedePedirCuenta={puedePedirCuenta} /* 🚀 NUEVO: Pasamos el permiso */
        />
      )}

      {/* 🍽️ VISTA 2: MENÚ Y CARRITO */}
      {view === "menu" && (
        <MenuCarritoView 
          resetTodo={resetTodo}
          mesaInput={mesaInput}
          sucursalId={sucursalId}
          categorias={categorias}
          productos={productos}
          ventaActiva={ventaActiva}
          puedeTomarOrdenes={puedeTomarOrdenes}
          agregarAlCarrito={agregarAlCarrito}
          carrito={carrito}
          eliminarDelCarrito={eliminarDelCarrito}
          actualizarNota={actualizarNota}
          handleEnviarOrden={handleEnviarOrden}
          loading={loading}
          pedirCuenta={pedirCuenta}
          puedePedirCuenta={puedePedirCuenta}
          // 🚀 PASAMOS EL MULTIPLICADOR A LA VISTA DEL MENÚ
          cantidadRapida={cantidadRapida}
          setCantidadRapida={setCantidadRapida}
        />
      )}

      {/* 🧾 VISTA 3: HISTORIAL */}
      {view === "historial" && puedeVerHistorial && (
        <div className={stylesAdmin.fadeIn}>
          <div className={s.headerRow}>
            <h2 className={s.sectionTitle}>Historial de Ventas Liquidadas</h2>
            <button className={s.btnCancel} onClick={() => setView("cuentas")}>
              ← VOLVER
            </button>
          </div>
          <div className={s.historyGrid}>
            {cuentasCobradas.map((v) => (
              <div key={v.id} className={s.historyCard}>
                <div>
                  <strong style={{ fontSize: "1.3rem" }}>Mesa {v.mesa}</strong>
                  <div className={s.historyCardTime}>
                    Pagada: {new Date(v.hora_cierre).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className={s.historyCardAmount}>
                    ${parseFloat(v.total).toFixed(2)}
                  </div>
                  <span className={stylesAdmin.badgeSuccess}>LIQUIDADA</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};