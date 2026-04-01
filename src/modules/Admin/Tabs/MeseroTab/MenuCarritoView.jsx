import React, { useState } from "react";
import s from "../../../../assets/styles/ServicioTab.module.css";
import stylesAdmin from "../../../../assets/styles/EstilosGenerales.module.css";

export const MenuCarritoView = ({
  resetTodo,
  mesaInput,
  sucursalId,
  categorias,
  productos,
  ventaActiva,
  puedeTomarOrdenes,
  agregarAlCarrito,
  carrito,
  eliminarDelCarrito,
  actualizarNota,
  handleEnviarOrden,
  loading,
  pedirCuenta,
  puedePedirCuenta
}) => {
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // 🚀 NUEVO ESTADO PARA LA BÚSQUEDA

  return (
    <div className={s.posGrid}>
      <div className={s.menuArea}>
        
        {/* ENCABEZADO COMPACTO */}
        <div className={s.headerRow} style={{ borderBottom: "2px solid var(--color-border)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          
          {/* LADO IZQUIERDO: Botón Volver y Buscador */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: "1 1 auto" }}>
            <button className={`${stylesAdmin.btn} ${stylesAdmin.btnOutlineDanger}`} style={{ padding: "6px 12px", fontSize: "12px", whiteSpace: "nowrap" }} onClick={resetTodo}>
              ← VOLVER
            </button>
            
            {/* 🔍 NUEVO BUSCADOR */}
            <input 
              type="text"
              placeholder=" Buscar producto..."
              className={stylesAdmin.inputField}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ margin: 0, padding: "6px 12px", fontSize: "14px", width: "100%", maxWidth: "300px", borderRadius: "var(--radius-button)" }}
            />
          </div>

          {/* LADO DERECHO: Info de la Mesa */}
          <div style={{ textAlign: "right", lineHeight: '1.1', flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontWeight: "900", color: "var(--color-primary)", fontSize: "1.2rem" }}>
              MESA {mesaInput.toUpperCase()}
            </h3>
            <small className={stylesAdmin.textMuted} style={{ fontSize: "10px", fontWeight: "bold" }}>
              SUCURSAL: {sucursalId}
            </small>
          </div>
        </div>

        {/* LISTA DE PRODUCTOS OPTIMIZADA Y FILTRADA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "10px" }}>
          {categorias.map((cat) => {
            // 🚀 FILTRAMOS LOS PRODUCTOS POR CATEGORÍA Y POR EL TÉRMINO DE BÚSQUEDA
            const productosCat = productos.filter(p => {
              const coincideCategoria = p.categoria === cat.id;
              const coincideBusqueda = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
              return coincideCategoria && coincideBusqueda;
            });

            // Si no hay productos que coincidan en esta categoría, no la mostramos
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

          {/* MENSAJE SI LA BÚSQUEDA NO ARROJA RESULTADOS */}
          {categorias.every(cat => productos.filter(p => p.categoria === cat.id && p.nombre.toLowerCase().includes(searchTerm.toLowerCase())).length === 0) && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-muted)" }}>
              No se encontraron productos que coincidan con "<strong>{searchTerm}</strong>".
            </div>
          )}
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
              {loading ? "ENVIANDO..." : "ENVIAR A COCINA"}
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
  );
};