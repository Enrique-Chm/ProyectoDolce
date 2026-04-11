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
  
  // 👁️ NUEVO ESTADO: Controla si vemos el menú activo o la papelera
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

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
    productosOrdenados, 
    
    // Acciones y Alertas
    handleSubmitProducto,
    handleEditProd,
    toggleGrupoEnProducto,
    handleCancelProdClick,
    confirmDeleteProducto,
    handleRestoreProducto, // Consumiendo la función del hook

  } = menuTabLogic;

  // Helpers de permisos visuales
  const mostrarFormularioProd = puedeCrear || editProdId;
  const noTienePermisoProd = editProdId ? !puedeEditar : !puedeCrear;

  const getSortIcon = (key) => {
    if (sortConfigProd.key !== key) return " ↕";
    return sortConfigProd.direction === "asc" ? " ▲" : " ▼";
  };

  // 🛡️ FILTRO MAESTRO: Separa los activos de los inactivos según el interruptor
  const listaFinalProductos = productosOrdenados.filter(p => 
    mostrarInactivos ? p.activo === false : p.activo !== false
  );

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

              {/* 💡 NUEVA FILA VISUAL: PRECIO NETO Y GANANCIA */}
              <div className={s.formGrid} style={{ marginTop: "10px" }}>
                <div className={s.formGroup}>
                  <label className={s.label}>GANANCIA EN $</label>
                  <div 
                    className={s.unitDisplayBox} 
                    style={{ 
                      textAlign: "center", 
                      fontWeight: "700",
                      color: (prodFormData.ganancia_neta || .1) > 0 ? "#198754" : "#dc3545" 
                    }}
                  >
                    ${(prodFormData.ganancia_neta || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className={s.textMuted} style={{ marginTop: "15px" }}>
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
            
            {/* 👁️ BARRA DE BÚSQUEDA Y TOGGLE DE PAPELERA */}
            <div
              style={{
                padding: "10px 15px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-bg-light, #f8f9fa)",
                display: "flex",
                gap: "15px",
                alignItems: "center"
              }}
            >
              <input
                type="text"
                className={s.inputField}
                style={{ margin: 0, flex: 1 }}
                placeholder="Buscar producto por nombre o categoría..."
                value={filtroProductos}
                onChange={(e) => setFiltroProductos(e.target.value)}
              />
              <label style={{ 
                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", 
                fontSize: "13px", color: "#64748b", fontWeight: "600", userSelect: "none" 
              }}>
                <input
                  type="checkbox"
                  checked={mostrarInactivos}
                  onChange={(e) => setMostrarInactivos(e.target.checked)}
                  style={{ cursor: "pointer", width: "16px", height: "16px" }}
                />
                 Ver Inactivos
              </label>
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
                  {/* 💡 NUEVA COLUMNA DE GANANCIA NETA */}
                  <th
                    className={s.th}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSortProd("ganancia")}
                  >
                    GANANCIA NETA {getSortIcon("ganancia")}
                  </th>
                  <th className={`${s.th} ${s.tdRight}`}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {listaFinalProductos.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6" /* 👈 Cambiado a 6 columnas */
                      style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}
                    >
                      {loading 
                        ? "Cargando productos..." 
                        : mostrarInactivos 
                          ? "La papelera está vacía." 
                          : "No se encontraron productos con los filtros actuales."}
                    </td>
                  </tr>
                ) : (
                  listaFinalProductos.map((p) => {
                    const costoBase = p.costo_actual || 0;
                    const ventaBase = p.precio_venta || 0;
                    const netoBase = ventaBase / IVA_FACTOR;
                    const margenBase = netoBase > 0 ? (((netoBase - costoBase) / netoBase) * 100).toFixed(1) : 0;
                    
                    // 💡 NUEVO CÁLCULO
                    const gananciaNeta = netoBase - costoBase;
                    
                    return (
                      <tr key={p.id} style={{ opacity: p.activo === false ? 0.6 : 1, transition: "opacity 0.2s" }}>
                        <td className={s.td}>
                          <div className={s.productTitle}>
                            {p.nombre}
                            {p.activo === false && (
                              <span className={s.badge} style={{ background: "#fee2e2", color: "#ef4444", marginLeft: "8px", fontSize: "10px" }}>
                                INACTIVO
                              </span>
                            )}
                          </div>
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
                        {/* 💡 CELDA DE GANANCIA NETA */}
                        <td className={s.td}>
                          <div className={s.priceValue} style={{ color: gananciaNeta > 0 ? "#198754" : "#dc3545" }}>
                            ${gananciaNeta.toFixed(2)}
                          </div>
                        </td>
                        <td className={`${s.td} ${s.tdRight}`}>
                          <div className={s.actionsWrapper}>
                            
                            {/* 👁️ SI ESTÁ INACTIVO, MOSTRAMOS BOTÓN DE REVIVIR */}
                            {p.activo === false ? (
                              <button
                                className={`${s.btn} ${s.btnOutlineSuccess} ${s.btnSmall}`}
                                style={{ padding: "4px 10px", fontSize: "12px", display: "flex", gap: "5px", alignItems: "center" }}
                                onClick={() => {
                                  if (handleRestoreProducto) {
                                    handleRestoreProducto(p.id, p.nombre);
                                  } else {
                                    alert("Por favor agrega la función 'handleRestoreProducto' en tu useMenuTab.js para reactivarlo.");
                                  }
                                }}
                              >
                                ♻️ Restaurar
                              </button>
                            ) : (
                              /* BOTONES NORMALES DE EDITAR Y BORRAR */
                              <>
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
                              </>
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