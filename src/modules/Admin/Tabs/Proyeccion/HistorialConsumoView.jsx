// Archivo: src/modules/Admin/Tabs/Proyeccion/HistorialConsumoView.jsx
import React, { useState } from "react";
import s from "../../../../assets/styles/EstilosGenerales.module.css";

// 🛡️ Agregamos = [] a las props para evitar el error de "undefined"
export const HistorialConsumoView = ({ historialConsumo = [], proyeccionProductos = [], loading }) => {
  const [viewMode, setViewMode] = useState("ventas"); 
  const [filtroTexto, setFiltroTexto] = useState("");

  // 1. Filtrado para la vista de Ventas (Platillos)
  const productosFiltrados = (proyeccionProductos || []).filter(p =>
    !filtroTexto || p.nombre?.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  // 2. Filtrado para la vista de Movimientos Manuales (Kardex)
  const historialFiltrado = (historialConsumo || []).filter(h =>
    !filtroTexto || h.insumo?.nombre?.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  return (
    // ... Todo el resto del código sigue igual
    <div className={`${s.adminCard} ${s.tableContainer}`}>
      {/* CABECERA EXPLICATIVA DINÁMICA */}
      <div style={{ 
        padding: "20px", 
        borderBottom: "1px solid var(--color-border)", 
        background: "var(--color-bg-muted)", 
        borderRadius: "var(--radius-card) var(--radius-card) 0 0" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 className={s.cardTitle} style={{ margin: 0 }}>
              {viewMode === 'ventas' ? "📈 Consumo por Ventas (Teórico)" : "🛠️ Ajustes Manuales (Kardex)"}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "5px", maxWidth: "800px" }}>
              {viewMode === 'ventas' 
                ? "Este es el desglose de productos vendidos en los últimos 15 días. El algoritmo usa las recetas de estos platos para calcular cuántos insumos se gastaron teóricamente."
                : "Aquí ves las Salidas y Mermas registradas a mano. Estos movimientos también afectan la predicción para ajustar el inventario a la realidad física."}
            </p>
          </div>

          {/* BOTONES DE CAMBIO DE VISTA (PEDIDO EXPLÍCITO) */}
          <div style={{ display: "flex", gap: "5px", background: "white", padding: "4px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
            <button 
              className={s.btnSmall}
              style={{ 
                backgroundColor: viewMode === 'ventas' ? 'var(--color-primary)' : 'transparent',
                color: viewMode === 'ventas' ? 'white' : 'var(--color-text-main)',
                border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontWeight: "600"
              }}
              onClick={() => setViewMode('ventas')}
            >
              🍔 Por Producto
            </button>
            <button 
              className={s.btnSmall}
              style={{ 
                backgroundColor: viewMode === 'manual' ? 'var(--color-primary)' : 'transparent',
                color: viewMode === 'manual' ? 'white' : 'var(--color-text-main)',
                border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontWeight: "600"
              }}
              onClick={() => setViewMode('manual')}
            >
              📦 Por Insumo
            </button>
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div style={{ padding: "15px", borderBottom: "1px solid var(--color-border)" }}>
        <input
          type="text"
          className={s.inputField}
          placeholder={viewMode === 'ventas' ? "Buscar platillo..." : "Buscar insumo..."}
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />
      </div>

      <table className={s.table}>
        <thead className={s.thead}>
          {viewMode === 'ventas' ? (
            /* ENCABEZADOS PARA VENTAS */
            <tr>
              <th className={s.th}>PLATILLO / PRODUCTO</th>
              <th className={s.th} style={{ textAlign: "center" }}>TOTAL VENDIDO (15 DÍAS)</th>
              <th className={s.th} style={{ textAlign: "center" }}>PROMEDIO DIARIO</th>
              <th className={s.th} style={{ textAlign: "right" }}>EST. MAÑANA</th>
            </tr>
          ) : (
            /* ENCABEZADOS PARA MANUAL */
            <tr>
              <th className={s.th}>FECHA</th>
              <th className={s.th}>INSUMO / MOTIVO</th>
              <th className={s.th} style={{ textAlign: "center" }}>CANTIDAD</th>
              <th className={s.th} style={{ textAlign: "right" }}>RESPONSABLE</th>
            </tr>
          )}
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="4" className={s.emptyState}>Cargando datos fuente...</td></tr>
          ) : viewMode === 'ventas' ? (
            /* RENDER DE VENTAS (PRODUCTOS) */
            productosFiltrados.length === 0 ? (
              <tr><td colSpan="4" className={s.emptyState}>No hay datos de ventas en este periodo.</td></tr>
            ) : (
              productosFiltrados.map((p, i) => (
                <tr key={i}>
                  <td className={s.td} style={{ fontWeight: "700" }}>{p.nombre}</td>
                  <td className={s.td} style={{ textAlign: "center" }}>
                    {(parseFloat(p.promedio_diario) * 15).toFixed(0)} unidades
                  </td>
                  <td className={s.td} style={{ textAlign: "center" }}>{p.promedio_diario} / día</td>
                  <td className={s.td} style={{ textAlign: "right" }}>
                    <span className={s.badgeSuccess}>{p.prediccion_manana} pedidos</span>
                  </td>
                </tr>
              ))
            )
          ) : (
            /* RENDER DE MANUAL (INSUMOS) */
            historialFiltrado.length === 0 ? (
              <tr><td colSpan="4" className={s.emptyState}>No hay ajustes manuales registrados.</td></tr>
            ) : (
              historialFiltrado.map((mov) => (
                <tr key={mov.id}>
                  <td className={s.td}>
                    <div style={{ fontWeight: "700" }}>{new Date(mov.created_at).toLocaleDateString()}</div>
                    <small className={s.textMuted}>{new Date(mov.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                  </td>
                  <td className={s.td}>
                    <div className={s.productTitle}>{mov.insumo?.nombre}</div>
                    <small className={s.textMuted}>{mov.motivo}</small>
                  </td>
                  <td className={s.td} style={{ textAlign: "center" }}>
                    <div className={s.priceValue} style={{ color: "var(--color-danger)" }}>- {mov.cantidad_afectada}</div>
                    <small className={s.textMuted}>{mov.tipo}</small>
                  </td>
                  <td className={s.td} style={{ textAlign: "right", fontWeight: "600" }}>
                    👤 {mov.usuarios_internos?.nombre || 'Sistema'}
                  </td>
                </tr>
              ))
            )
          )}
        </tbody>
      </table>
    </div>
  );
};