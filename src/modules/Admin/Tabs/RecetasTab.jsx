// Archivo: src/modules/Admin/Tabs/RecetasTab.jsx
import React, { useState, useEffect, useRef } from "react";
import s from "../../../assets/styles/EstilosGenerales.module.css";
import { useRecetasTab } from "../../../hooks/useRecetasTab";
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

  // Estado para el filtro de búsqueda
  const [filtroBuscar, setFiltroBuscar] = useState("");

  const mostrarFormulario = puedeCrear || isEditing;
  const noTienePermisoAccion = isEditing ? !puedeEditar : !puedeCrear;

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
      text: "Esta acción no se puede deshacer y podría afectar el costeo.",
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

  // Filtrado de recetas basado en el texto de búsqueda
  const recetasFiltradas = recetasAgrupadas.filter((r) => {
    if (!filtroBuscar) return true;
    const texto = filtroBuscar.toLowerCase();
    const matchNombre = r.nombre?.toLowerCase().includes(texto);
    const matchIngrediente = r.detalle_ingredientes?.some((ing) =>
      ing.insumo?.toLowerCase().includes(texto)
    );
    return matchNombre || matchIngrediente;
  });

  return (
    <div className={s.tabWrapper}>
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Ingeniería de Recetas</h2>
        {loading && <span className={s.syncBadge}>SINCRONIZANDO...</span>}
      </header>

      <div className={mostrarFormulario ? s.splitLayout : s.fullLayout}>
        {/* FORMULARIO LATERAL: INGENIERÍA DE RECETA */}
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
                <label className={s.label}>NOMBRE DE LA PREPARACIÓN</label>
                <input
                  className={s.inputField}
                  value={nombreReceta}
                  onChange={(e) => setNombreReceta(e.target.value)}
                  required
                  disabled={noTienePermisoAccion}
                  placeholder="Ej. Salsa Roja Especial"
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
                    Disponible para usar en otros platos
                  </small>
                </div>
              </label>
            </div>

            {/* SECCIÓN 2: RENDIMIENTO (CAJA GRIS PARA DESTACAR) */}
            <div className={s.formGrid}>
              <div className={s.formGroup} style={{ marginBottom: 0 }}>
                <label className={s.label}>RENDIMIENTO</label>
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

            <hr className={s.hr} style={{ margin: "15px 0" }} />

            {/* SECCIÓN 3: INGREDIENTES */}
            <div className={s.stack} style={{ gap: "15px" }}>
              <label
                className={s.label}>
                INGREDIENTES Y CANTIDADES
              </label>

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
                    }}
                  >
                    {!noTienePermisoAccion && (
                      <button
                        type="button"
                        className={s.btnRemoveCircle}
                        onClick={() => removeIngrediente(idx)}
                        title="Quitar ingrediente"
                        style={{
                          top: "-10px",
                          right: "-10px",
                          width: "24px",
                          height: "24px",
                          fontSize: "12px",
                        }}
                      >
                        ✕
                      </button>
                    )}

                    {/* Selector de Tipo (Radio Buttons Limpios) */}
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
                          cursor: "pointer",
                          fontWeight: "600",
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
                          cursor: "pointer",
                          fontWeight: "600",
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
                          if (insData) {
                            n[idx].unidad_id =
                              insData.unidad_medida_id ||
                              insData.unidad_medida ||
                              "";
                          }
                          setIngredientes(n);
                        }}
                      />

                      <div className={s.formGrid}>
                        <div
                          className={s.formGroup}
                          style={{ marginBottom: 0 }}
                        >
                          <input
                            type="number"
                            step="0.1"
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
                        </div>
                        <div className={s.unitDisplayBox}>
                          {unidades.find(
                            (u) => String(u.id) === String(ing.unidad_id),
                          )?.abreviatura || "U.M."}
                        </div>
                      </div>
                    </div>

                    <div
                      className={s.badge}
                      style={{ fontSize: "13px", marginTop: "5px" }}
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
                style={{ alignSelf: "flex-end", marginTop: "3px" }}
              >
                + AÑADIR INGREDIENTE
              </button>
            )}

            {/* BOTONERA PRINCIPAL */}
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
          {/* Componente visual para la Búsqueda */}
          <div style={{ padding: "15px", borderBottom: "1px solid var(--color-border)" }}>
            <input
              type="text"
              className={s.inputField}
              placeholder="Buscar por nombre de preparación o ingrediente..."
              value={filtroBuscar}
              onChange={(e) => setFiltroBuscar(e.target.value)}
            />
          </div>

          <table className={s.table}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th}>PREPARACIÓN / RENDIMIENTO</th>
                <th className={`${s.th} ${s.tdCenter}`}>COMPOSICIÓN</th>
                <th className={`${s.th} ${s.tdCenter}`}>COSTO UNITARIO</th>
                <th className={`${s.th} ${s.tdCenter}`}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {recetasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="4" className={s.emptyState} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    {loading
                      ? "Cargando recetas..."
                      : recetasAgrupadas.length === 0
                      ? "No hay recetas registradas."
                      : "No se encontraron resultados para su búsqueda."}
                  </td>
                </tr>
              ) : (
                recetasFiltradas.map((r, idx) => {
                  const unidadFinal =
                    unidades.find((u) => u.id === r.unidad_medida_final)
                      ?.abreviatura || "Ud";
                  const costoU = parseFloat(r.costo_unitario_final) || 0;

                  return (
                    <tr key={idx}>
                      <td className={s.td}>
                        <div className={s.productTitle}>{r.nombre}</div>
                        <div className={s.priceValue}>
                          <span
                            className={s.syncBadge}
                            
                          >
                            Rinde: {r.rendimiento_cantidad} {unidadFinal}
                          </span>
                          {r.subreceta && (
                            <span className={`${s.badge} ${s.marginLeft5}`}>
                              SUB-RECETA
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`${s.td} ${s.tdCenter}`}>
                        <div className={s.flexColumnGap5}>
                          {r.detalle_ingredientes?.map((ing, iidx) => (
                            <div key={iidx} className={s.miniBadge}>
                              • {ing.insumo}:{" "}
                              <strong>
                                {ing.cantidad} {ing.unidad}
                              </strong>
                              <span className={s.priceValue}>
                                {" "}
                                (${(ing.costo_fila || 0).toFixed(2)})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className={`${s.td} ${s.tdCenter}`}>
                        <div className={s.priceValue}>
                          ${costoU.toFixed(2)}
                          <span className={s.priceValue}>/{unidadFinal}</span>
                        </div>
                        <div className={s.textSubDetail}>
                          Costo lote: ${(r.costo_total_receta || 0).toFixed(2)}
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
                              className={`${s.btn} ${s.btnOutlineDanger} ${s.btnEditar}`}
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

// COMPONENTE DE UI CORREGIDO
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
    const selected = options.find((opt) => String(opt[valueKey]) === String(value));
    setSearchTerm(selected ? selected[labelKey] : "");
  }, [value, options, valueKey, labelKey]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        const selected = options.find((opt) => String(opt[valueKey]) === String(value));
        setSearchTerm(selected ? selected[labelKey] : "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options, valueKey, labelKey]);

  const filteredOptions = options.filter((opt) =>
    String(opt[labelKey] || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={s.relative} ref={containerRef} style={{ position: "relative" }}>
      <input
        type="text"
        className={`${s.inputField} ${disabled ? s.inputDisabled : ""}`}
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
        <ul className={s.dropdownList} style={{ 
          position: "absolute", zIndex: 1000, width: "100%", maxHeight: "200px", 
          overflowY: "auto", backgroundColor: "white", border: "1px solid #ddd", 
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)", padding: 0, margin: "4px 0 0 0", listStyle: "none" 
        }}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => (
              <li
                key={index}
                className={s.dropdownItem}
                style={{ padding: "8px 12px", cursor: "pointer" }}
                onMouseDown={(e) => {
                  e.preventDefault(); // Evita que el input pierda el foco antes de seleccionar
                  onChange(opt[valueKey]);
                  setSearchTerm(opt[labelKey]);
                  setIsOpen(false);
                }}
              >
                {formatLabel ? formatLabel(opt) : opt[labelKey]}
              </li>
            ))
          ) : (
            <li className={s.dropdownItemMuted} style={{ padding: "8px 12px", color: "#999" }}>
              Sin resultados...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};