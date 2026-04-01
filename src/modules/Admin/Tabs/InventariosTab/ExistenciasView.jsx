// Archivo: src/modules/Admin/Tabs/InventariosTab/ExistenciasView.jsx
import React from "react";

export const ExistenciasView = ({ 
  s, 
  loading, 
  insumosFiltrados, 
  searchTerm, 
  setSearchTerm 
}) => {
  return (
    <div className={`${s.adminCard} ${s.tableContainer}`}>
      <div className={s.tableHeader}>
        <input
          type="text"
          className={s.inputField}
          placeholder="Buscar por nombre o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <table className={s.table}>
        <thead className={s.thead}>
          <tr>
            <th className={s.th}>INSUMO / CATEGORÍA</th>
            <th className={s.th}>Stock de inicio</th>
            <th className={s.th}>Stock al momento</th>
          </tr>
        </thead>
        <tbody>
          {insumosFiltrados.length === 0 ? (
            <tr>
              <td colSpan="3" className={s.emptyState}>
                {loading
                  ? "Cargando inventario..."
                  : insumosFiltrados?.length === 0
                    ? "No hay insumos registrados en el inventario."
                    : "No se encontraron resultados para su búsqueda."}
              </td>
            </tr>
          ) : (
            insumosFiltrados.map((insumo) => (
              <tr key={insumo.id}>
                <td className={s.td}>
                  <div className={s.productTitle}>{insumo.nombre}</div>
                  <small className={s.textMuted}>
                    {insumo.categoria?.toUpperCase() || 'SIN CATEGORÍA'}
                  </small>
                </td>
                <td className={s.td}>
                  <div className={s.priceValue} style={{ color: "var(--color-text-main)" }}>
                    {insumo.stock_fisico}{" "}
                    <small className={s.textMuted} style={{ fontSize: "11px" }}>
                      {insumo.unidad || 'U'}
                    </small>
                  </div>
                </td>
                <td className={s.td}>
                  <div className={s.priceValue} style={{ color: "var(--color-primary)" }}>
                    {insumo.stock_estimado}{" "}
                    <small className={s.textMuted} style={{ fontSize: "11px" }}>
                      {insumo.unidad || 'U'}
                    </small>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};