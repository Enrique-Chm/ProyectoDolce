// Archivo: src/modules/Admin/components/MeseroTab.jsx
import React, { useState } from "react";
import s from "./MeseroTab.module.css";
import stylesAdmin from "../AdminPage.module.css";
import { useMeseroTab } from "../../../hooks/useMeseroTab";
import { hasPermission } from "../../../utils/checkPermiso";

/**
 * Componente de Punto de Venta para Meseros.
 * Gestiona el ciclo de vida de la orden: Salón -> Toma de Pedido -> Cocina -> Caja.
 */
export const MeseroTab = ({ sucursalId, usuarioId }) => {
  const {
    view,
    setView,
    cuentasAbiertas,
    cuentasCobradas,
    ventaActiva,
    mesaInput,
    setMesaInput,
    productos,
    categorias,
    carrito,
    loading,
    seleccionarCuenta,
    iniciarNuevaMesa,
    agregarAlCarrito,
    eliminarDelCarrito,
    actualizarNota,
    handleEnviarOrden,
    pedirCuenta,
  } = useMeseroTab(sucursalId, usuarioId);

  // 🛡️ SISTEMA DE FACULTADES (RBAC)
  const puedeTomarOrdenes = hasPermission("crear_comandas");
  const puedePedirCuenta = hasPermission("editar_comandas");
  const puedeVerHistorial = hasPermission("ver_comandas");

  // Estado local para el drawer del carrito en móviles
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  return (
    <div className={s.posContainer}>
      
      {/* 🌀 OVERLAY DE CARGA: Bloqueo de UI durante procesos críticos */}
      {loading && (
        <div className={s.loadingOverlay}>
          <div className={s.spinner}></div>
          <p>Sincronizando con cocina y caja...</p>
        </div>
      )}

      {/* 🖼️ VISTA 0: MONITOR DE SALÓN (MESAS ACTIVAS) */}
      {view === "cuentas" && (
        <div style={{ animation: "fadeIn 0.2s ease-out" }}>
          <div className={s.headerRow} style={{ flexWrap: "wrap", gap: "15px", marginBottom: "30px" }}>
            <h2 className={s.sectionTitle}>Salón Activo</h2>
            <div className={s.flexCenterGap} style={{ flexWrap: "wrap" }}>
              {puedeVerHistorial && (
                <button
                  className={`${stylesAdmin.btn} ${stylesAdmin.btnOutlineDanger}`}
                  style={{ whiteSpace: "nowrap" }}
                  onClick={() => setView("historial")}
                >
                  📜 VER HISTORIAL
                </button>
              )}
              {puedeTomarOrdenes && (
                <button
                  className={`${stylesAdmin.btn} ${stylesAdmin.btnPrimary}`}
                  style={{ whiteSpace: "nowrap", padding: "12px 24px", fontWeight: "800" }}
                  onClick={iniciarNuevaMesa}
                >
                  ➕ NUEVA MESA
                </button>
              )}
            </div>
          </div>

          <div className={s.productGrid}>
            {cuentasAbiertas.map((v) => (
              <div
                key={v.id}
                className={s.mesaCard}
                onClick={() => seleccionarCuenta(v)}
              >
                <div className={s.flexStartGap}>
                  <div>
                    <h3 className={s.mesaName}>Mesa {v.mesa}</h3>
                    <small style={{ color: "var(--color-text-muted)" }}>Folio: {v.id.toString().slice(-5)}</small>
                  </div>
                  <span
                    className={
                      v.estado === "por_cobrar"
                        ? s.mesaBadgeCobrar
                        : s.mesaBadge
                    }
                  >
                    {v.estado === "por_cobrar" ? "CERRADA / CAJA" : "EN CONSUMO"}
                  </span>
                </div>
                <div className={s.mesaTotal}>${parseFloat(v.total).toFixed(2)}</div>
              </div>
            ))}

            {!loading && cuentasAbiertas.length === 0 && (
              <div className={s.emptyStateBox}>
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>🍽️</div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "10px" }}>Salón Libre</h3>
                <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
                  No hay mesas activas en esta sucursal.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔢 VISTA 1: IDENTIFICAR MESA */}
      {view === "mesas" && (
        <div className={s.mesaSelectorManual} style={{ padding: "40px 20px", maxWidth: "450px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "10px", textAlign: "center" }}>
            Asignar Mesa
          </h2>
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", marginBottom: "30px" }}>
            Ingresa el número o nombre de la ubicación
          </p>
          <form onSubmit={(e) => { e.preventDefault(); if (mesaInput && puedeTomarOrdenes) setView("menu"); }}>
            <input
              className={s.mesaInput}
              style={{ boxSizing: "border-box", textAlign: "center", fontSize: "3rem" }}
              value={mesaInput}
              onChange={(e) => setMesaInput(e.target.value)}
              placeholder="00"
              type="text"
              autoFocus
              required
            />
            <button
              type="submit"
              className={`${stylesAdmin.btn} ${stylesAdmin.btnPrimary} ${stylesAdmin.btnFull}`}
              style={{ padding: "20px", fontSize: "1.2rem", marginTop: "20px", fontWeight: "800" }}
            >
              INICIAR COMANDA
            </button>
            <button
              type="button"
              className={`${stylesAdmin.btn} ${stylesAdmin.btnOutlineDanger} ${stylesAdmin.btnFull}`}
              onClick={() => setView("cuentas")}
              style={{ marginTop: "15px", padding: "15px", fontWeight: "700" }}
            >
              CANCELAR
            </button>
          </form>
        </div>
      )}

      {/* 🍕 VISTA 2: COMANDERO DIGITAL */}
      {view === "menu" && (
        <div className={s.posGrid}>
          {/* SECCIÓN DEL MENÚ */}
          <div className={s.menuArea}>
            <div className={s.headerRow} style={{ marginBottom: "25px", borderBottom: "2px solid #eee", paddingBottom: "15px" }}>
              <button
                className={`${stylesAdmin.btn} ${stylesAdmin.btnOutlineDanger}`}
                onClick={() => { setView("cuentas"); setIsCartExpanded(false); }}
              >
                ← SALIR
              </button>
              <div style={{ textAlign: "right" }}>
                <h3 style={{ margin: 0, fontWeight: "900", color: "var(--color-primary)" }}>
                  MESA {mesaInput.toUpperCase()}
                </h3>
                <small style={{ fontWeight: "700", color: "gray" }}>SURCURSAL: {sucursalId}</small>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "35px" }}>
              {categorias.map((cat) => {
                const productosCat = productos.filter(p => p.categoria === cat.id);
                if (productosCat.length === 0) return null;
                return (
                  <div key={cat.id} className={s.categoryBlock}>
                    <h4 className={s.categoryTitle}>{cat.nombre.toUpperCase()}</h4>
                    <div className={s.productGrid}>
                      {productosCat.map((p) => {
                        const isLocked = ventaActiva?.estado === "por_cobrar" || !puedeTomarOrdenes;
                        return (
                          <div
                            key={p.id}
                            className={`${s.productCard} ${isLocked ? s.productCardLocked : ""}`}
                            onClick={() => !isLocked && agregarAlCarrito(p)}
                          >
                            <div style={{ fontWeight: "800", fontSize: "1.1rem", lineHeight: "1.2" }}>{p.nombre}</div>
                            <div style={{ color: "var(--color-primary)", marginTop: "10px", fontWeight: "800" }}>
                              ${parseFloat(p.precio_venta).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🛒 DRAWER DE CARRITO / COMANDA */}
          <aside className={`${s.cartArea} ${isCartExpanded ? s.cartExpanded : ""}`}>
            <div className={s.cartHeader} onClick={() => setIsCartExpanded(!isCartExpanded)}>
              <div className={s.dragHandle}></div>
              <div className={s.flexBetween}>
                <strong className={s.cartTitle}>ORDEN ACTUAL</strong>
                <div className={s.flexCenterGap}>
                  <span className={s.badgeItems}>{carrito.length} NUEVOS</span>
                  <span style={{ fontSize: "1.2rem" }}>{isCartExpanded ? "▼" : "▲"}</span>
                </div>
              </div>
            </div>

            <div className={s.cartItems}>
              {/* CONSUMO YA ENVIADO (Lectura) */}
              {ventaActiva?.ventas_detalle?.length > 0 && (
                <div className={s.legacyItemsBox}>
                  <div className={s.legacyLabel}>PRODUCTOS EN PREPARACIÓN</div>
                  {ventaActiva.ventas_detalle.map((det, idx) => (
                    <div key={idx} className={s.flexBetween} style={{ marginBottom: "8px", opacity: 0.8 }}>
                      <span>{det.cantidad}x {productos.find(p => p.id === det.producto_id)?.nombre || 'Producto'}</span>
                      <span style={{ fontWeight: 700 }}>${det.subtotal}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* PRODUCTOS NUEVOS POR ENVIAR */}
              {carrito.map((item) => (
                <div key={item.id} className={s.cartItem}>
                  <div className={s.flexBetween}>
                    <strong className={s.cartItemName}>
                      <span className={s.cartItemQty}>{item.cantidad}x</span> {item.nombre}
                    </strong>
                    {puedeTomarOrdenes && (
                      <button onClick={() => eliminarDelCarrito(item.id)} className={s.btnRemove}>✕</button>
                    )}
                  </div>
                  <input
                    placeholder="+ Notas para cocina (término, sin cebolla, etc.)"
                    className={s.inputNota}
                    value={item.notas}
                    onChange={(e) => actualizarNota(item.id, e.target.value)}
                    readOnly={!puedeTomarOrdenes}
                  />
                </div>
              ))}

              {carrito.length === 0 && !ventaActiva?.ventas_detalle?.length && (
                <div className={s.emptyCartText}>No hay productos seleccionados.</div>
              )}
            </div>

            <div className={s.cartFooter}>
              <div className={s.summaryBox}>
                <div className={s.flexBetween}>
                  <span className={s.summaryLabel}>TOTAL CUENTA:</span>
                  <span className={s.summaryValue}>
                    ${((ventaActiva?.total || 0) + carrito.reduce((acc, i) => acc + i.cantidad * i.precio_venta, 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  className={`${stylesAdmin.btn} ${stylesAdmin.btnPrimary} ${stylesAdmin.btnFull}`}
                  style={{ padding: "18px", fontWeight: "900", fontSize: "1.1rem" }}
                  onClick={() => { handleEnviarOrden(); setIsCartExpanded(false); }}
                  disabled={loading || carrito.length === 0 || ventaActiva?.estado === "por_cobrar" || !puedeTomarOrdenes}
                >
                  {loading ? "PROCESANDO..." : "🔥 ENVIAR A COCINA"}
                </button>

                {ventaActiva && (
                  <button
                    className={`${stylesAdmin.btn} ${stylesAdmin.btnFull}`}
                    style={{ 
                      background: ventaActiva.estado === "por_cobrar" ? "var(--color-warning)" : "#000",
                      color: "white", padding: "15px", fontWeight: "800", border: "none"
                    }}
                    onClick={() => {
                      if (window.confirm(ventaActiva.estado === "por_cobrar" ? "¿Reimprimir ticket?" : "¿Solicitar cuenta a caja?")) {
                        pedirCuenta(ventaActiva.id);
                        setIsCartExpanded(false);
                      }
                    }}
                    disabled={loading || !puedePedirCuenta}
                  >
                    {ventaActiva.estado === "por_cobrar" ? "🖨️ REIMPRIMIR TICKET" : "🧾 PEDIR CUENTA"}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 🕒 VISTA 3: HISTORIAL RECIENTE */}
      {view === "historial" && puedeVerHistorial && (
        <div style={{ animation: "fadeIn 0.2s ease-out" }}>
          <div className={s.headerRow} style={{ marginBottom: "30px" }}>
            <h2 className={s.sectionTitle}>Historial de Hoy</h2>
            <button className={`${stylesAdmin.btn} ${stylesAdmin.btnOutlineDanger}`} onClick={() => setView("cuentas")}>
              ← VOLVER
            </button>
          </div>
          <div className={s.historyGrid}>
            {cuentasCobradas.map((v) => (
              <div key={v.id} className={s.historyCard}>
                <div>
                  <strong style={{ fontSize: "1.3rem" }}>Mesa {v.mesa}</strong>
                  <div style={{ fontSize: "0.85rem", color: "gray" }}>
                    Pagada: {new Date(v.hora_cierre).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "var(--color-success)" }}>
                    ${parseFloat(v.total).toFixed(2)}
                  </div>
                  <span className={s.badgeSuccessMini}>LIQUIDADA</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};