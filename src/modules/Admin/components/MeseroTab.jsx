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
    resetTodo
  } = useMeseroTab(sucursalId, usuarioId);

  // 🛡️ SISTEMA DE FACULTADES (RBAC)
  const puedeTomarOrdenes = hasPermission("crear_comandas");
  const puedePedirCuenta = hasPermission("editar_comandas");
  const puedeVerHistorial = hasPermission("ver_comandas");

  const [isCartExpanded, setIsCartExpanded] = useState(false);

  return (
    <div className={s.posContainer}>
      
      {/* 🌀 OVERLAY DE CARGA */}
      {loading && (
        <div className={stylesAdmin.loadingOverlay}>
          <div className={stylesAdmin.spinner}></div>
          <p>Validando sesión y sincronizando datos...</p>
        </div>
      )}

      {/* 🖼️ VISTA: SALÓN ACTIVO */}
      {view === "cuentas" && (
        <div className={stylesAdmin.fadeIn}>
          <div className={s.headerRow}>
            <h2 className={s.sectionTitle}>Mesas Activas</h2>
            <div className={s.flexCenterGap}>
              {puedeVerHistorial && (
                <button
                  className={`${stylesAdmin.btn} ${stylesAdmin.btnOutlineDanger}`}
                  onClick={() => setView("historial")}
                >
                  📜 HISTORIAL DE HOY
                </button>
              )}
              {puedeTomarOrdenes && (
                <button
                  className={s.btnPrimary}
                  onClick={iniciarNuevaMesa}
                >
                  ➕ ABRIR NUEVA MESA
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
                    <small className={stylesAdmin.textMuted}>Folio: {v.id.toString().slice(-5)}</small>
                  </div>
                  <span
                    className={
                      v.estado === "por_cobrar"
                        ? s.mesaBadgeCobrar
                        : s.mesaBadge
                    }
                  >
                    {/* 👇 Estandarización visual aplicada aquí */}
                    {v.estado === "por_cobrar" ? "POR COBRAR" : "Abierta"}
                  </span>
                </div>
                <div className={s.mesaTotal}>${parseFloat(v.total).toFixed(2)}</div>
              </div>
            ))}

            {!loading && cuentasAbiertas.length === 0 && (
              <div className={s.emptyStateBox}>
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>🍽️</div>
                <h3 className={stylesAdmin.cardTitle}>Salón sin Mesas</h3>
                <p className={stylesAdmin.textMuted}>
                  No hay órdenes activas en esta sucursal.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔢 VISTA: ASIGNAR NOMBRE/NÚMERO A MESA */}
      {view === "mesas" && (
        <div className={s.mesaSelectorManual}>
          <h2 className={s.sectionTitle} style={{ textAlign: "center" }}>Identificar Mesa</h2>
          <p className={stylesAdmin.textMuted} style={{ textAlign: "center", marginBottom: "30px" }}>
            Ingresa el identificador físico de la mesa
          </p>
          <form onSubmit={(e) => { e.preventDefault(); if (mesaInput && puedeTomarOrdenes) setView("menu"); }}>
            <input
              className={s.mesaInput}
              value={mesaInput}
              onChange={(e) => setMesaInput(e.target.value)}
              placeholder="00"
              type="text"
              autoFocus
              required
            />
            <button
              type="submit"
              className={s.btnEmpezarOrden}
            >
              CONTINUAR AL MENÚ
            </button>
            <button
              type="button"
              className={s.btnCancel}
              style={{ width: "100%", marginTop: "15px" }}
              onClick={resetTodo}
            >
              CANCELAR
            </button>
          </form>
        </div>
      )}

      {/* 🍕 VISTA: MENÚ Y CARRITO */}
      {view === "menu" && (
        <div className={s.posGrid}>
          <div className={s.menuArea}>
            
            {/* ENCABEZADO COMPACTO */}
            <div className={s.headerRow} style={{ borderBottom: "2px solid var(--color-border)", paddingBottom: "10px" }}>
              <button className={s.btnCancel} style={{ padding: "6px 12px", fontSize: "12px" }} onClick={resetTodo}>
                ← VOLVER
              </button>
              <div style={{ textAlign: "right", lineHeight: '1.1' }}>
                <h3 style={{ margin: 0, fontWeight: "900", color: "var(--color-primary)", fontSize: "1.2rem" }}>
                  MESA {mesaInput.toUpperCase()}
                </h3>
                <small className={stylesAdmin.textMuted} style={{ fontSize: "10px", fontWeight: "bold" }}>
                  SUCURSAL: {sucursalId}
                </small>
              </div>
            </div>

            {/* LISTA DE PRODUCTOS OPTIMIZADA */}
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "10px" }}>
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
                            <div className={s.productCardName}>{p.nombre}</div>
                            <div className={s.productCardPrice}>
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

          {/* 🛒 ASIDE: RESUMEN DE ORDEN */}
          <aside className={`${s.cartArea} ${isCartExpanded ? s.cartExpanded : ""}`}>
            <div className={s.cartHeader} onClick={() => setIsCartExpanded(!isCartExpanded)}>
              <div className={s.dragHandle}></div>
              <div className={s.flexBetween}>
                <strong className={s.cartTitle}>DETALLE DE ORDEN</strong>
                <div className={s.flexCenterGap}>
                  <span className={stylesAdmin.badgeSuccess}>{carrito.length} NUEVOS</span>
                  <span style={{ fontSize: "1.2rem" }}>{isCartExpanded ? "▼" : "▲"}</span>
                </div>
              </div>
            </div>

            <div className={s.cartItems}>
              {/* YA PEDIDO (Historial de la mesa) */}
              {ventaActiva?.ventas_detalle?.length > 0 && (
                <div style={{ marginBottom: "20px", paddingBottom: "15px", borderBottom: "2px dashed var(--color-border)" }}>
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "var(--color-text-muted)", marginBottom: "10px" }}>
                    PRODUCTOS EN COCINA / SERVIDOS
                  </div>
                  {ventaActiva.ventas_detalle.map((det, idx) => (
                    <div key={idx} className={s.flexBetween} style={{ marginBottom: "8px", opacity: 0.6 }}>
                      <span className={s.cartItemName}>
                        <span className={s.cartItemQty}>{det.cantidad}x</span> 
                        {productos.find(p => p.id === det.producto_id)?.nombre || 'Producto'}
                      </span>
                      <span style={{ fontWeight: 700 }}>${parseFloat(det.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* POR PEDIR (Carrito actual) */}
              {carrito.map((item) => (
                <div key={item.id} className={s.cartItem}>
                  <div className={s.flexBetween}>
                    <strong className={s.cartItemName}>
                      <span className={s.cartItemQty}>{item.cantidad}x</span> {item.nombre}
                    </strong>
                    {puedeTomarOrdenes && (
                      <button onClick={() => eliminarDelCarrito(item.id)} className={s.btnRemoveItem}>✕</button>
                    )}
                  </div>
                  <input
                    placeholder="+ Notas de preparación..."
                    className={s.inputNota}
                    value={item.notas}
                    onChange={(e) => actualizarNota(item.id, e.target.value)}
                    readOnly={!puedeTomarOrdenes}
                  />
                </div>
              ))}

              {carrito.length === 0 && !ventaActiva?.ventas_detalle?.length && (
                <div className={s.emptyCartText}>No has seleccionado productos aún.</div>
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
                  className={s.btnOrder}
                  onClick={() => { handleEnviarOrden(); setIsCartExpanded(false); }}
                  disabled={loading || carrito.length === 0 || ventaActiva?.estado === "por_cobrar" || !puedeTomarOrdenes}
                >
                  {loading ? "ENVIANDO..." : "🚀 ENVIAR A COCINA"}
                </button>

                {ventaActiva && (
                  <button
                    className={stylesAdmin.btnFull}
                    style={{ 
                      background: ventaActiva.estado === "por_cobrar" ? "var(--color-warning)" : "var(--color-text-main)",
                      color: "white", padding: "15px", fontWeight: "800", border: "none", borderRadius: "var(--radius-button)", cursor: "pointer"
                    }}
                    onClick={() => {
                      if (window.confirm(ventaActiva.estado === "por_cobrar" ? "¿Deseas reimprimir el ticket?" : "¿Solicitar la cuenta a caja?")) {
                        pedirCuenta(ventaActiva.id);
                        setIsCartExpanded(false);
                      }
                    }}
                    disabled={loading || !puedePedirCuenta}
                  >
                    {ventaActiva.estado === "por_cobrar" ? "🖨️ TICKET SOLICITADO" : "🧾 PEDIR CUENTA"}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 🕒 VISTA: HISTORIAL */}
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