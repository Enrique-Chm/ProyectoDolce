// Archivo: src/modules/Admin/Tabs/InventariosTab/MovimientosView.jsx
import React from "react";

export const MovimientosView = ({ s, loading, movimientos }) => {
  return (
    <div className={`${s.adminCard} ${s.tableContainer}`}>
      <div className={s.tableHeader}>
        <h3 className={s.cardTitle} style={{ margin: 0 }}>
          Historial de Movimientos
        </h3>
      </div>
      <table className={s.table}>
        <thead className={s.thead}>
          <tr>
            <th className={s.th}>FECHA</th>
            <th className={s.th}>INSUMO / DETALLE</th>
            <th className={s.th}>OPERACIÓN</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.length === 0 ? (
            <tr>
              <td colSpan="3" className={s.emptyState}>
                {loading ? "Cargando historial..." : "No hay registros de movimientos."}
              </td>
            </tr>
          ) : (
            movimientos.map((m) => (
              <tr key={m.id}>
                <td className={s.td}>
                  <div style={{ fontWeight: "700" }}>
                    {new Date(m.created_at).toLocaleDateString()}
                  </div>
                  <small className={s.textMuted}>
                    {new Date(m.created_at).toLocaleTimeString()}
                  </small>
                </td>
                <td className={s.td}>
                  <div className={s.productTitle}>{m.insumo?.nombre}</div>
                  <small className={s.textMuted}>{m.motivo}</small>
                  {/* 💡 AQUÍ MOSTRAMOS AL USUARIO RESPONSABLE DEL MOVIMIENTO */}
                  <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px', fontWeight: 'bold' }}>
                    👤 Por: {m.usuarios_internos?.nombre || 'Sistema'}
                  </div>
                </td>
                <td className={s.td}>
                  <div
                    className={s.priceValue}
                    style={{ color: m.tipo === "ENTRADA" ? "var(--color-success)" : "var(--color-danger)" }}
                  >
                    {m.tipo === "ENTRADA" ? "+" : "-"}
                    {m.cantidad_afectada}
                  </div>
                  <small className={s.textMuted}>{m.tipo}</small>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};