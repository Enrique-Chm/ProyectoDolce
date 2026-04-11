// Archivo: src/modules/Admin/Tabs/RecetasTab.jsx
import React, { useState, useEffect, useRef } from "react";
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { useRecetasTab } from "./useRecetasTab";
import Swal from "sweetalert2";

export const RecetasTab = ({ sucursalId }) => {
  const {
    recetasAgrupadas,
    insumos,
    subrecetasLista,
    unidades,
    loading,
    isEditing,
    nombreReceta,
    setNombreReceta,
    isSubreceta,
    setIsSubreceta,
    rendimiento,
    setRendimiento,
    unidadMedidaFinal,
    setUnidadMedidaFinal,
    ingredientes,
    setIngredientes,
    puedeCrear,
    puedeEditar,
    puedeBorrar,
    removeIngrediente,
    resetForm,
    handleEdit,
    handleSubmit,
    handleDeleteReceta,
  } = useRecetasTab(sucursalId);

  // Estados para Filtros y Ordenamiento
  const [filtroBuscar, setFiltroBuscar] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "nombre",
    direction: "asc",
  });

  const mostrarFormulario = puedeCrear || isEditing;
  const noTienePermisoAccion = isEditing ? !puedeEditar : !puedeCrear;

  // ==========================================
  // 🛡️ ALERTAS SWEETALERT2
  // ==========================================
  const handleCancelClick = () => {
    if (nombreReceta.trim() !== "" || ingredientes.length > 0) {
      Swal.fire({
        title: "¿Estás seguro?",
        text: "Los cambios no guardados se perderán.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, descartar",
        cancelButtonText: "Seguir editando",
      }).then((result) => {
        if (result.isConfirmed) resetForm();
      });
    } else {
      resetForm();
    }
  };

  const confirmDeleteReceta = (nombre) => {
    Swal.fire({
      title: `¿Eliminar la receta "${nombre}"?`,
      text: "Esta acción no se puede deshacer y podría afectar el costeo de otros platos.",
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) handleDeleteReceta(nombre);
    });
  };

  // ==========================================
  // LÓGICA DE FILTRADO Y ORDEN
  // ==========================================
  const recetasFiltradas = recetasAgrupadas.filter((r) => {
    const texto = filtroBuscar.toLowerCase();
    const matchNombre =
      !filtroBuscar || r.nombre?.toLowerCase().includes(texto);
    const matchIngrediente =
      !filtroBuscar ||
      r.detalle_ingredientes?.some((ing) =>
        ing.insumo?.toLowerCase().includes(texto),
      );
    return matchNombre || matchIngrediente;
  });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const recetasOrdenadas = [...recetasFiltradas].sort((a, b) => {
    if (sortConfig.key === "nombre") {
      return sortConfig.direction === "asc"
        ? (a.nombre || "").localeCompare(b.nombre || "")
        : (b.nombre || "").localeCompare(a.nombre || "");
    }
    if (sortConfig.key === "costo") {
      return sortConfig.direction === "asc"
        ? a.costo_unitario_final - b.costo_unitario_final
        : b.costo_unitario_final - a.costo_unitario_final;
    }
    return 0;
  });

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return " ↕";
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className={s.tabWrapper}>
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Ingeniería de Recetas</h2>
        {loading && <span className={s.syncBadge}>SINCRONIZANDO...</span>}
      </header>

      <div className={mostrarFormulario ? s.splitLayout : s.fullLayout}>
        {/* FORMULARIO LATERAL: CREACIÓN DE RECETA */}
        <aside
          className={`${s.adminCard} ${!mostrarFormulario ? s.hidden : ""}`}
        >
          <h3 className={s.cardTitle}>
            {isEditing
              ? puedeEditar
                ? "📝 Editando Receta"
                : "👁️ Vista de Receta"
              : "Nueva Preparación"}
          </h3>

          <form
            onSubmit={handleSubmit}
            className={s.stack}
            style={{ gap: "20px" }}
          >
            {/* SECCIÓN 1: IDENTIFICACIÓN */}
            <div className={s.stack} style={{ gap: "12px" }}>
              <div className={s.formGroup}>
                <label className={s.label}>
                  NOMBRE DE LA RECETA / PREPARACIÓN
                </label>
                <input
                  className={s.inputField}
                  value={nombreReceta}
                  onChange={(e) => setNombreReceta(e.target.value)}
                  required
                  disabled={noTienePermisoAccion}
                  placeholder="Ej. Salsa Roja Especial o Pizza Familiar"
                />
              </div>

              <label className={s.checkboxLabel} style={{ padding: "5px 0" }}>
                <input
                  type="checkbox"
                  className={s.checkbox}
                  checked={isSubreceta}
                  onChange={(e) => setIsSubreceta(e.target.checked)}
                  disabled={noTienePermisoAccion}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className={s.label} style={{ marginBottom: 0 }}>
                    ¿Es Sub-receta?
                  </span>
                  <small className={s.textMuted} style={{ fontSize: "10px" }}>
                    Marcar si se usará como ingrediente de otro plato.
                  </small>
                </div>
              </label>
            </div>

            {/* SECCIÓN 2: RENDIMIENTO */}
            <div className={s.formGrid}>
              <div className={s.formGroup} style={{ marginBottom: 0 }}>
                <label className={s.label}>RENDIMIENTO (LOTE)</label>
                <input
                  type="number"
                  step="0.1"
                  className={s.inputField}
                  value={rendimiento}
                  onChange={(e) => setRendimiento(e.target.value)}
                  required
                  disabled={noTienePermisoAccion}
                  placeholder="Cant."
                />
              </div>
              <div className={s.formGroup} style={{ marginBottom: 0 }}>
                <label className={s.label}>UNIDAD RESULTADO</label>
                <SearchableSelect
                  options={unidades}
                  value={unidadMedidaFinal}
                  onChange={(val) => setUnidadMedidaFinal(val)}
                  disabled={noTienePermisoAccion}
                  placeholder="Elegir unidad..."
                  formatLabel={(opt) => `${opt.nombre} (${opt.abreviatura})`}
                />
              </div>
            </div>

            <hr className={s.hr} style={{ margin: "10px 0" }} />

            {/* SECCIÓN 3: INGREDIENTES */}
            <div className={s.stack} style={{ gap: "15px" }}>
              <label className={s.label}>INGREDIENTES Y CANTIDADES</label>

              {ingredientes.map((ing, idx) => {
                const listaActual =
                  ing.tipo === "insumo" ? insumos : subrecetasLista;
                const selectedInsumo = listaActual.find(
                  (i) => String(i.id) === String(ing.insumo_id),
                );
                const costoFilaVivo = (
                  (selectedInsumo?.costo_unitario || 0) *
                  (parseFloat(ing.cantidad) || 0)
                ).toFixed(2);

                return (
                  <div
                    key={idx}
                    className={s.itemCardRelative}
                    style={{
                      padding: "10px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                      background: "#fff",
                    }}
                  >
                    {!noTienePermisoAccion && (
                      <button
                        type="button"
                        className={s.btnRemoveCircle}
                        onClick={() => removeIngrediente(idx)}
                        style={{
                          top: "-10px",
                          right: "-10px",
                          width: "24px",
                          height: "24px",
                        }}
                      >
                        ✕
                      </button>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: "15px",
                        marginBottom: "12px",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "11px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name={`tipo_${idx}`}
                          checked={ing.tipo === "insumo"}
                          disabled={noTienePermisoAccion}
                          onChange={() => {
                            const n = [...ingredientes];
                            n[idx].tipo = "insumo";
                            n[idx].insumo_id = "";
                            n[idx].unidad_id = "";
                            setIngredientes(n);
                          }}
                        />{" "}
                        Insumo
                      </label>
                      <label
                        style={{
                          fontSize: "11px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name={`tipo_${idx}`}
                          checked={ing.tipo === "subreceta"}
                          disabled={noTienePermisoAccion}
                          onChange={() => {
                            const n = [...ingredientes];
                            n[idx].tipo = "subreceta";
                            n[idx].insumo_id = "";
                            n[idx].unidad_id = "";
                            setIngredientes(n);
                          }}
                        />{" "}
                        Sub-receta
                      </label>
                    </div>

                    <div className={s.stack} style={{ gap: "10px" }}>
                      <SearchableSelect
                        options={listaActual}
                        value={ing.insumo_id}
                        disabled={noTienePermisoAccion}
                        placeholder={
                          ing.tipo === "insumo"
                            ? " Buscar insumo..."
                            : " Buscar sub-receta..."
                        }
                        onChange={(selectedId) => {
                          const n = [...ingredientes];
                          const insData = listaActual.find(
                            (i) => String(i.id) === String(selectedId),
                          );
                          n[idx].insumo_id = selectedId;
                          if (insData)
                            n[idx].unidad_id =
                              insData.unidad_medida_id ||
                              insData.unidad_medida ||
                              "";
                          setIngredientes(n);
                        }}
                      />

                      <div className={s.formGrid}>
                        <input
                          type="number"
                          step="0.001"
                          className={s.inputField}
                          value={ing.cantidad}
                          onChange={(e) => {
                            const n = [...ingredientes];
                            n[idx].cantidad = e.target.value;
                            setIngredientes(n);
                          }}
                          required
                          disabled={noTienePermisoAccion}
                          placeholder="Cantidad"
                        />
                        <div className={s.unitDisplayBox}>
                          {unidades.find(
                            (u) => String(u.id) === String(ing.unidad_id),
                          )?.abreviatura || "U.M."}
                        </div>
                      </div>
                    </div>
                    <div
                      className={s.badge}
                      style={{
                        fontSize: "12px",
                        marginTop: "5px",
                        background: "#f1f5f9",
                        color: "#475569",
                      }}
                    >
                      Subtotal: <strong>${costoFilaVivo}</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            {!noTienePermisoAccion && (
              <button
                type="button"
                onClick={() =>
                  setIngredientes([
                    ...ingredientes,
                    {
                      tipo: "insumo",
                      insumo_id: "",
                      cantidad: "",
                      unidad_id: "",
                    },
                  ])
                }
                className={`${s.btn} ${s.btnSuccess} ${s.btnSmall}`}
                style={{ alignSelf: "flex-end", padding: "8px 15px" }}
              >
                + AÑADIR INGREDIENTE
              </button>
            )}

            <div className={s.stack} style={{ gap: "10px", marginTop: "10px" }}>
              {!noTienePermisoAccion && (
                <button
                  type="submit"
                  className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}
                  disabled={loading}
                >
                  {loading
                    ? "..."
                    : isEditing
                      ? "ACTUALIZAR RECETA"
                      : "GUARDAR RECETA"}
                </button>
              )}
              {isEditing && (
                <button
                  type="button"
                  className={`${s.btn} ${s.btnDark} ${s.btnFull}`}
                  onClick={handleCancelClick}
                >
                  {puedeEditar ? "CANCELAR" : "CERRAR VISTA"}
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* TABLA DE RECETAS */}
        <div className={`${s.adminCard} ${s.tableContainer}`}>
          <div
            style={{
              padding: "10px 15px",
              borderBottom: "1px solid var(--color-border)",
              background: "#f8f9fa",
            }}
          >
            <input
              type="text"
              className={s.inputField}
              style={{ margin: 0 }}
              placeholder="🔍 Buscar por nombre o ingrediente..."
              value={filtroBuscar}
              onChange={(e) => setFiltroBuscar(e.target.value)}
            />
          </div>

          <table className={s.table}>
            <thead className={s.thead}>
              <tr>
                <th
                  className={s.th}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("nombre")}
                >
                  PREPARACIÓN / RENDIMIENTO {getSortIcon("nombre")}
                </th>
                <th className={`${s.th} ${s.tdCenter}`}style={{ textAlign: "center" }}>COMPOSICIÓN</th>
                <th
                  className={`${s.th} ${s.tdCenter}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("costo")}
                >
                  COSTO UNITARIO {getSortIcon("costo")}
                </th>
                <th className={s.th} style={{ textAlign: "right" }}>
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {recetasOrdenadas.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className={s.emptyState}
                    style={{ textAlign: "center", padding: "10px" }}
                  >
                    {loading
                      ? "Cargando ingeniería..."
                      : "No se encontraron recetas registradas."}
                  </td>
                </tr>
              ) : (
                recetasOrdenadas.map((r, idx) => {
                  const unidadFinal =
                    unidades.find((u) => u.id === r.unidad_medida_final)
                      ?.abreviatura || "Ud";
                  return (
                    <tr key={idx}>
                      <td className={s.td}>
                        <div className={s.productTitle}>{r.nombre}{r.subreceta && (
                            <span className={`${s.badge} ${s.marginLeft5}`}>
                              SUB-RECETA
                            </span>
                          )}</div>
                        <div className={s.priceValue}>
                          <span className={s.syncBadge}>
                            Rinde: {r.rendimiento_cantidad} {unidadFinal}
                          </span>
                          
                        </div>
                      </td>
                      <td className={`${s.td} ${s.tdCenter}`}>
                        {r.detalle_ingredientes?.map((ing, iidx) => (
                          <div
                            key={iidx}
                            className={s.labelTiny}
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              padding: "1px 0",
                              // --- AQUÍ DEFINES EL ANCHO TOTAL DE LA LÍNEA ---
                              maxWidth: "400px", // Cámbialo a 300px, 350px, etc., según tu gusto
                              width: "100%", // Permite que sea responsivo en pantallas chicas
                            }}
                          >
                            <span
                              style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                            >
                              • {ing.insumo}:{" "}
                              <strong style={{ fontSize: "11px" }}>
                                {ing.cantidad} {ing.unidad}
                              </strong>
                            </span>

                            {/* Este div llenará el espacio, pero solo hasta el maxWidth definido arriba */}
                            <div
                              style={{
                                flex: 1,
                                borderBottom: "2px dotted #ccc",
                                margin: "0 8px",
                                position: "relative",
                                top: "1px",
                              }}
                            ></div>

                            <span
                              className={s.priceValue}
                              style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                            >
                              (${(ing.costo_fila || 0).toFixed(2)})
                            </span>
                          </div>
                        ))}
                      </td>
                      <td className={`${s.td} ${s.tdCenter}`}>
                        <div className={s.priceValue}>
                          ${(r.costo_unitario_final || 0).toFixed(2)}/
                          {unidadFinal}
                        </div>
                        <div
                          className={s.textSubDetail}
                          style={{ fontSize: "10px" }}
                        >
                          Lote: ${(r.costo_total_receta || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className={`${s.td} ${s.tdCenter}`}>
                        <div className={s.actionsWrapper}>
                          <button
                            className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`}
                            onClick={() => handleEdit(r)}
                          >
                            {puedeEditar ? "📝" : "👁️"}
                          </button>
                          {puedeBorrar && (
                            <button
                              className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`}
                              onClick={() => confirmDeleteReceta(r.nombre)}
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
    </div>
  );
};

// ==========================================
// COMPONENTE SEARCHABLE SELECT (AUXILIAR)
// ==========================================
const SearchableSelect = ({
  options,
  value,
  onChange,
  disabled,
  placeholder = "Buscar...",
  valueKey = "id",
  labelKey = "nombre",
  formatLabel,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const selected = options.find(
      (opt) => String(opt[valueKey]) === String(value),
    );
    setSearchTerm(selected ? selected[labelKey] : "");
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        const selected = options.find(
          (opt) => String(opt[valueKey]) === String(value),
        );
        setSearchTerm(selected ? selected[labelKey] : "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options]);

  const filteredOptions = options.filter((opt) =>
    String(opt[labelKey] || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  return (
    <div
      className={s.relative}
      ref={containerRef}
      style={{ position: "relative" }}
    >
      <input
        type="text"
        className={`${s.inputField} ${disabled ? s.inputDisabled : ""}`}
        style={{ margin: 0, padding: "8px 12px", fontSize: "13px" }}
        value={searchTerm}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && !disabled && (
        <ul
          className={s.dropdownList}
          style={{
            position: "absolute",
            zIndex: 2000,
            width: "100%",
            maxHeight: "200px",
            overflowY: "auto",
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
            padding: 0,
            margin: "4px 0 0 0",
            listStyle: "none",
            borderRadius: "8px",
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => (
              <li
                key={index}
                className={s.dropdownItem}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontSize: "13px",
                  borderBottom: "1px solid #f1f5f9",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt[valueKey]);
                  setSearchTerm(opt[labelKey]);
                  setIsOpen(false);
                }}
              >
                {formatLabel ? formatLabel(opt) : opt[labelKey]}
              </li>
            ))
          ) : (
            <li
              style={{
                padding: "10px 12px",
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              Sin coincidencias...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
