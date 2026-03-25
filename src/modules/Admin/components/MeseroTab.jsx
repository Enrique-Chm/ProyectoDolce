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

    // Estados y funciones del Modal de Extras
    mostrarModalExtras,
    productoParaExtras,
    confirmarProductoConExtras,
    cerrarModalExtras,

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

  // ESTADO INTERNO DEL MODAL PARA LLEVAR LA CUENTA DE EXTRAS SELECCIONADOS
  const [extrasSeleccionados, setExtrasSeleccionados] = useState({});

  /**
   * Maneja el incremento o decremento de un extra en el modal
   */
  const handleToggleExtra = (grupo, opcion, delta) => {
    setExtrasSeleccionados(prev => {
      const actualGroupCounts = prev[grupo.id] || {};
      const currentQty = actualGroupCounts[opcion.id] || 0;
      const newQty = currentQty + delta;

      // Calcular cantidad total actual seleccionada en este grupo
      const totalInGroup = Object.values(actualGroupCounts).reduce((a, b) => a + b, 0);

      // Bloquear si intenta sumar más allá del máximo del grupo
      if (delta > 0 && totalInGroup >= grupo.max_seleccion) return prev;
      // Bloquear si intenta restar por debajo de 0
      if (delta < 0 && newQty < 0) return prev;

      const updatedGroupCounts = { ...actualGroupCounts, [opcion.id]: newQty };

      // Limpiar opciones en 0 para mantener el estado ligero
      if (newQty === 0) delete updatedGroupCounts[opcion.id];

      return {
        ...prev,
        [grupo.id]: updatedGroupCounts
      };
    });
  };

  /**
   * Valida si se cumplen todos los requisitos mínimos de los grupos
   */
  const isModalValido = () => {
    if (!productoParaExtras || !productoParaExtras.grupos) return true;
    return productoParaExtras.grupos.every(grupo => {
      const selectedInGroup = extrasSeleccionados[grupo.id] || {};
      const totalSelected = Object.values(selectedInGroup).reduce((a, b) => a + b, 0);
      return totalSelected >= (grupo.min_seleccion || 0);
    });
  };

  /**
   * Prepara la data final del modal para mandarla al hook
   */
  const submitExtras = () => {
    const arrExtras = [];
    Object.entries(extrasSeleccionados).forEach(([grupoId, opciones]) => {
      const grupoObj = productoParaExtras.grupos.find(g => g.id === parseInt(grupoId));
      Object.entries(opciones).forEach(([opcionId, qty]) => {
        if (qty > 0) {
          const optDetail = grupoObj.opciones_modificadores.find(o => o.id === parseInt(opcionId));
          // Insertamos un registro en el array por cada unidad (si eligió 2 quesos, van 2 líneas de queso)
          for (let i = 0; i < qty; i++) {
            arrExtras.push({
              grupo_id: grupoObj.id,
              grupo_nombre: grupoObj.nombre,
              opcion_id: optDetail.id,
              subreceta_id: optDetail.subreceta_id,
              precio_venta: optDetail.precio_venta
            });
          }
        }
      });
    });
    
    confirmarProductoConExtras(productoParaExtras, arrExtras);
    setExtrasSeleccionados({}); // Resetear modal
  };

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
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999,
          display: "flex", justifyContent: "center", alignItems: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "var(--color-bg-app)", width: "95%", maxWidth: "500px",
            borderRadius: "var(--radius-card)", padding: "24px",
            boxShadow: "var(--shadow-lg)", maxHeight: "90vh", display: "flex", flexDirection: "column"
          }}>
            <h3 style={{ margin: "0 0 5px 0", color: "var(--color-primary)", fontSize: "1.5rem" }}>
              Personalizar {productoParaExtras.nombre}
            </h3>
            <p style={{ margin: "0 0 20px 0", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              Selecciona las opciones para este platillo.
            </p>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "10px" }}>
              {(productoParaExtras.grupos || []).map(grupo => {
                const selections = extrasSeleccionados[grupo.id] || {};
                const totalSelected = Object.values(selections).reduce((a, b) => a + b, 0);
                const isRequired = grupo.min_seleccion > 0;
                const isFulfilled = totalSelected >= grupo.min_seleccion;
                const isMaxedOut = totalSelected >= grupo.max_seleccion;

                return (
                  <div key={grupo.id} style={{
                    marginBottom: "20px", background: "white", padding: "15px",
                    borderRadius: "8px", border: `1px solid ${!isFulfilled && isRequired ? "var(--color-warning)" : "var(--color-border)"}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <strong style={{ fontSize: "1.1rem" }}>{grupo.nombre}</strong>
                      <span style={{
                        fontSize: "0.75rem", padding: "4px 8px", borderRadius: "4px",
                        background: isFulfilled ? "var(--color-bg-sidebar)" : (isRequired ? "#fff3cd" : "var(--color-bg-app)"),
                        color: isFulfilled ? "var(--color-success)" : (isRequired ? "#856404" : "var(--color-text-muted)"),
                        fontWeight: "bold"
                      }}>
                        {totalSelected} / {grupo.max_seleccion} {isRequired ? `(Min: ${grupo.min_seleccion})` : '(Opcional)'}
                      </span>
                    </div>

                    {(grupo.opciones_modificadores || []).map(opt => {
                      const qty = selections[opt.id] || 0;
                      return (
                        <div key={opt.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "8px 0", borderBottom: "1px dashed #eee"
                        }}>
                          <div>
                            <span style={{ fontWeight: qty > 0 ? "bold" : "normal" }}>{opt.subreceta_id}</span>
                            {parseFloat(opt.precio_venta) > 0 && (
                              <span style={{ color: "var(--color-primary)", marginLeft: "8px", fontSize: "0.9rem" }}>
                                +${parseFloat(opt.precio_venta).toFixed(2)}
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button 
                              type="button"
                              onClick={() => handleToggleExtra(grupo, opt, -1)}
                              disabled={qty === 0}
                              style={{ 
                                width: "30px", height: "30px", borderRadius: "50%", border: "1px solid var(--color-border)",
                                background: qty === 0 ? "var(--color-bg-app)" : "var(--color-danger)",
                                color: qty === 0 ? "var(--color-text-muted)" : "white", cursor: qty === 0 ? "not-allowed" : "pointer"
                              }}
                            >-</button>
                            <span style={{ width: "20px", textAlign: "center", fontWeight: "bold" }}>{qty}</span>
                            <button 
                              type="button"
                              onClick={() => handleToggleExtra(grupo, opt, 1)}
                              disabled={isMaxedOut}
                              style={{ 
                                width: "30px", height: "30px", borderRadius: "50%", border: "none",
                                background: isMaxedOut ? "var(--color-bg-app)" : "var(--color-success)",
                                color: isMaxedOut ? "var(--color-text-muted)" : "white", cursor: isMaxedOut ? "not-allowed" : "pointer"
                              }}
                            >+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px", paddingTop: "15px", borderTop: "2px solid var(--color-border)" }}>
              <button 
                onClick={() => { setExtrasSeleccionados({}); cerrarModalExtras(); }} 
                className={s.btnCancel} style={{ flex: 1 }}
              >
                CANCELAR
              </button>
              <button 
                onClick={submitExtras} 
                disabled={!isModalValido()}
                className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} style={{ flex: 2, background: isModalValido() ? "var(--color-primary)" : "var(--color-text-muted)" }}
              >
                {isModalValido() ? "AGREGAR A LA ORDEN" : "SELECCIÓN INCOMPLETA"}
              </button>
            </div>
          </div>
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
                  className={s.btnCancel}style={{ padding: "6px 12px", fontSize: "12px" }}
                  onClick={() => setView("historial")}
                >
                HISTORIAL
                </button>
              )}
              {puedeTomarOrdenes && (
                <button
                  className={s.btnPrimary}
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
                  </div>
                  <span
                    className={
                      v.estado === "por_cobrar"
                        ? s.mesaBadgeCobrar
                        : s.mesaBadge
                    }
                  >
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

      {/*  VISTA: MENÚ Y CARRITO */}
      {view === "menu" && (
        <div className={s.posGrid}>
          <div className={s.menuArea}>
            
            {/* ENCABEZADO COMPACTO */}
            <div className={s.headerRow} style={{ borderBottom: "2px solid var(--color-border)", paddingBottom: "10px" }}>
              <button className={`${stylesAdmin.btn} ${stylesAdmin.btnOutlineDanger}`} style={{ padding: "6px 12px", fontSize: "12px" }} onClick={resetTodo}>
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
                    <div key={idx} style={{ marginBottom: "8px", opacity: 0.6 }}>
                        <div className={s.flexBetween}>
                        <span className={s.cartItemName}>
                            <span className={s.cartItemQty}>{det.cantidad}x</span> 
                            {productos.find(p => p.id === det.producto_id)?.nombre || 'Producto'}
                        </span>
                        <span style={{ fontWeight: 700 }}>${parseFloat(det.subtotal).toFixed(2)}</span>
                        </div>
                        {/* Renderizar extras históricos si existen en el JSON */}
                        {det.extras_seleccionados && det.extras_seleccionados.length > 0 && (
                            <div style={{ paddingLeft: "25px", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                {det.extras_seleccionados.map((ext, eidx) => (
                                    <div key={eidx}>+ {ext.subreceta_id}</div>
                                ))}
                            </div>
                        )}
                    </div>
                  ))}
                </div>
              )}

              {/* POR PEDIR (Carrito actual) */}
              {carrito.map((item) => (
                <div key={item.cartItemId} className={s.cartItem}>
                  <div className={s.flexBetween}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong className={s.cartItemName}>
                        <span className={s.cartItemQty}>{item.cantidad}x</span> {item.nombre}
                        </strong>
                        {/* Renderizar lista de extras seleccionados */}
                        {item.extras_seleccionados && item.extras_seleccionados.length > 0 && (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-secondary)", marginTop: "2px", fontWeight: "600" }}>
                                {item.extras_seleccionados.map((ext, idx) => (
                                    <span key={idx} style={{ display: "block" }}>+ {ext.subreceta_id}</span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold' }}>${(item.precio_calculado * item.cantidad).toFixed(2)}</span>
                        {puedeTomarOrdenes && (
                        <button onClick={() => eliminarDelCarrito(item.cartItemId)} className={s.btnRemoveItem}>✕</button>
                        )}
                    </div>
                  </div>
                  <input
                    placeholder="+ Notas de preparación..."
                    className={s.inputNota}
                    value={item.notas}
                    onChange={(e) => actualizarNota(item.cartItemId, e.target.value)}
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
                    ${((ventaActiva?.total || 0) + carrito.reduce((acc, i) => acc + (i.cantidad * i.precio_calculado), 0)).toFixed(2)}
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

      {/*  VISTA: HISTORIAL */}
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