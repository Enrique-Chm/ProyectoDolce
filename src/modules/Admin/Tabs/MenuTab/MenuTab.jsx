// Archivo: src/modules/Admin/Tabs/MenuTab.jsx
import React, { useState } from "react";
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { IVA_FACTOR } from "../../../../utils/taxConstants";
import { useMenuTab } from "./useMenuTab";
import { SearchableSelect } from "./SearchableSelect";
import { ExtrasCatalog } from "./ExtrasCatalog";

const getMarginColor = (margen) => {
  const m = parseFloat(margen);
  if (m < 0) return "#dc3545";
  if (m < 40) return "#fd7d14";
  if (m < 60) return "#28a745";
  if (m < 80) return "#0d6efd";
  return "#6f42c1";
};

export const MenuTab = ({ sucursalId }) => {
  const [activeSubTab, setActiveSubTab] = useState("productos");

  const menuTabLogic = useMenuTab(sucursalId);
  const {
    categorias,
    recetasCosteadas,
    gruposMaestros,
    loading,
    puedeCrear,
    puedeEditar,
    puedeBorrar,
    
    // Estados de Formulario
    editProdId,
    prodFormData,
    setProdFormData,
    
    // Filtros y Orden de Productos consumidos del Hook
    filtroProductos,
    setFiltroProductos,
    sortConfigProd,
    handleSortProd,
    productosOrdenados, // <-- Array final ya filtrado y ordenado
    
    // Acciones y Alertas
    handleSubmitProducto,
    handleEditProd,
    toggleGrupoEnProducto,
    handleCancelProdClick,
    confirmDeleteProducto,

  } = menuTabLogic;

  // Helpers de permisos visuales
  const mostrarFormularioProd = puedeCrear || editProdId;
  const noTienePermisoProd = editProdId ? !puedeEditar : !puedeCrear;

  const getSortIcon = (key) => {
    if (sortConfigProd.key !== key) return " ↕";
    return sortConfigProd.direction === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className={s.tabWrapper}>
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Ingeniería de Menú</h2>
        {loading && <span className={s.syncBadge}>ACTUALIZANDO...</span>}
      </header>

      <nav className={s.tabNav}>
        <button
          className={`${s.tabButton} ${activeSubTab === "productos" ? s.activeTabButton : ""}`}
          onClick={() => setActiveSubTab("productos")}
        >
          PLATILLOS DEL MENÚ
        </button>
        <button
          className={`${s.tabButton} ${activeSubTab === "grupos" ? s.activeTabButton : ""}`}
          onClick={() => setActiveSubTab("grupos")}
        >
          CATÁLOGO DE EXTRAS
        </button>
      </nav>

      {/* VISTA 1: PLATILLOS */}
      {activeSubTab === "productos" && (
        <div className={mostrarFormularioProd ? s.splitLayout : s.fullLayout}>
          
          <aside className={`${s.adminCard} ${!mostrarFormularioProd ? s.hidden : ""}`}>
            <h3 className={s.cardTitle}>{editProdId ? "Ajustar Producto" : "Nuevo Producto"}</h3>
            <form onSubmit={handleSubmitProducto} className={s.formColumn}>
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.label}>RECETA PRINCIPAL</label>
                  <SearchableSelect
                    options={recetasCosteadas}
                    value={prodFormData.nombre}
                    valueKey="nombre"
                    labelKey="nombre"
                    placeholder="Seleccionar receta ..."
                    formatLabel={(opt) => `${opt.nombre} ($${(opt.costo_final || 0).toFixed(2)})`}
                    disabled={noTienePermisoProd}
                    onChange={(val) => {
                      const rec = recetasCosteadas.find((r) => r.nombre === val);
                      setProdFormData((prev) => ({
                        ...prev,
                        nombre: val,
                        costo_referencia: rec ? rec.costo_final : 0,
                        precio_venta: prev.precio_venta || rec?.precio_venta || "",
                      }));
                    }}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>COSTO</label>
                  <input
                    type="text"
                    className={s.unitDisplayBox}
                    value={`$${(prodFormData.costo_referencia || 0).toFixed(2)}`}
                    readOnly
                    disabled
                    style={{ textAlign: "center" }}
                  />
                </div>
              </div>
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.label}>PRECIO PÚBLICO ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={`${s.inputField} ${s.fontWeight600}`}
                    value={prodFormData.precio_venta}
                    onChange={(e) =>
                      setProdFormData({ ...prodFormData, precio_venta: e.target.value })
                    }
                    required
                    disabled={noTienePermisoProd}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>MARGEN NETO %</label>
                  <div
                    className={s.unitDisplayBox}
                    style={{ color: getMarginColor(prodFormData.margen_en_vivo), fontWeight: "700" }}
                  >
                    {prodFormData.margen_en_vivo}%
                  </div>
                </div>
              </div>
              <div className={s.textMuted}>
                <label className={s.label}>VINCULAR GRUPOS DE EXTRAS</label>
                <SearchableSelect
                  options={gruposMaestros.filter(
                    (g) => !prodFormData.grupos_vinculados.includes(g.id)
                  )}
                  value=""
                  valueKey="id"
                  labelKey="nombre"
                  placeholder="Seleccionar grupo ..."
                  disabled={noTienePermisoProd}
                  onChange={(val) => val && toggleGrupoEnProducto(val)}
                />
                <div
                  className={s.textMuted}
                  style={{ marginTop: "10px", flexWrap: "wrap", fontSize: "13px" }}
                >
                  {prodFormData.grupos_vinculados.map((gId) => {
                    const grupo = gruposMaestros.find((gm) => gm.id === gId);
                    return grupo ? (
                      <div key={gId} className={s.badgeInteractive}style={{ color: "var(--color-primary)" }}>
                        <span>{grupo.nombre}</span>
                        {!noTienePermisoProd && (
                          <b className={s.badgeCloseBtn} style={{ color: "var(--color-danger)" }} onClick={() => toggleGrupoEnProducto(gId)}>
                            {" "}
                            ×{" "}
                          </b>
                        )}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              <div className={s.textMuted}>
                <label className={s.label}>CATEGORÍA EN MENÚ</label>
                <SearchableSelect
                  options={categorias}
                  value={prodFormData.categoria}
                  valueKey="id"
                  labelKey="nombre"
                  placeholder="Seleccionar categoría ..."
                  disabled={noTienePermisoProd}
                  onChange={(val) => setProdFormData({ ...prodFormData, categoria: val })}
                />
              </div>
              <div className={`${s.formColumn} ${s.marginTop10}`}>
                {!noTienePermisoProd && (
                  <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} disabled={loading}>
                    {editProdId ? "ACTUALIZAR" : "GUARDAR EN MENÚ"}
                  </button>
                )}
                {editProdId && (
                  <button type="button" className={`${s.btn} ${s.btnDark} ${s.btnFull}`} onClick={handleCancelProdClick}>
                    {puedeEditar ? "CANCELAR EDICIÓN" : "CERRAR DETALLE"}
                  </button>
                )}
              </div>
            </form>
          </aside>

          <div className={`${s.adminCard} ${s.tableContainer}`}>
            {/* BARRA DE FILTROS EN UNA SOLA LÍNEA */}
            <div
              style={{
                padding: "10px 15px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-bg-light, #f8f9fa)"
              }}
            >
              <input
                type="text"
                className={s.inputField}
                style={{ margin: 0 }}
                placeholder="Buscar producto por nombre o categoría..."
                value={filtroProductos}
                onChange={(e) => setFiltroProductos(e.target.value)}
              />
            </div>

            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th
                    className={s.th}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSortProd("nombre")}
                  >
                    PRODUCTO {getSortIcon("nombre")}
                  </th>
                  <th
                    className={s.th}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSortProd("categoria")}
                  >
                    CATEGORÍA {getSortIcon("categoria")}
                  </th>
                  <th
                    className={s.th}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSortProd("costo")}
                  >
                    COSTO RECETA {getSortIcon("costo")}
                  </th>
                  <th
                    className={s.th}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSortProd("venta")}
                  >
                    VENTA (CON IVA) {getSortIcon("venta")}
                  </th>
                  <th className={`${s.th} ${s.tdRight}`}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {productosOrdenados.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}
                    >
                      {loading ? "Cargando productos..." : "No se encontraron productos con los filtros actuales."}
                    </td>
                  </tr>
                ) : (
                  productosOrdenados.map((p) => {
                    const costoBase = p.costo_actual || 0;
                    const ventaBase = p.precio_venta || 0;
                    const netoBase = ventaBase / IVA_FACTOR;
                    const margenBase = netoBase > 0 ? (((netoBase - costoBase) / netoBase) * 100).toFixed(1) : 0;
                    return (
                      <tr key={p.id}>
                        <td className={s.td}>
                          <div className={s.productTitle}>{p.nombre}</div>
                          <div className={s.textMuted}>
                            {(p.grupos || []).map((g) => (
                              <span key={g.id} className={s.badge}>
                                + {g.nombre}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className={s.td}>
                          <span className={s.textMuted}>
                            {categorias.find((c) => c.id === p.categoria)?.nombre || "Sin categoría"}
                          </span>
                        </td>
                        <td className={s.td}>${costoBase.toFixed(2)}</td>
                        <td className={s.td}>
                          <div className={s.priceValue}>${ventaBase.toFixed(2)}</div>
                          <div
                            className={s.labelSmall}
                            style={{ fontWeight: "700", color: getMarginColor(margenBase) }}
                          >
                            {margenBase}% Margen Neto
                          </div>
                        </td>
                        <td className={`${s.td} ${s.tdRight}`}>
                          <div className={s.actionsWrapper}>
                            <button
                              className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`}
                              onClick={() => handleEditProd(p)}
                            >
                              {puedeEditar ? "📝" : "👁️"}
                            </button>
                            {puedeBorrar && (
                              <button
                                className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`}
                                onClick={() => confirmDeleteProducto(p.id, p.nombre)}
                              >
                                ❌
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 2: EXTRAS */}
      {activeSubTab === "grupos" && (
        <ExtrasCatalog
          {...menuTabLogic}
          getMarginColor={getMarginColor}
          mostrarFormularioGrupo={puedeCrear || menuTabLogic.editGrupoId}
          noTienePermisoGrupo={menuTabLogic.editGrupoId ? !puedeEditar : !puedeCrear}
        />
      )}
    </div>
  );
};

export default MenuTab;