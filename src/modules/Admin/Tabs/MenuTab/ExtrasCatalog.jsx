// Archivo: src/modules/Admin/Tabs/ExtrasCatalog.jsx
import React, { useState } from "react";
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { IVA_FACTOR } from "../../../../utils/taxConstants";
import { SearchableSelect } from "./SearchableSelect";
import Swal from "sweetalert2";

export const ExtrasCatalog = ({
  // Estados y Funciones de useMenuTab
  gruposMaestros,
  subrecetasDisponibles,
  loading,
  puedeEditar,
  puedeBorrar,
  editGrupoId,
  grupoFormData,
  setGrupoFormData,
  handleSubmitGrupo,
  handleEditGrupo,
  handleDeleteGrupo,
  resetGrupoForm,
  addOpcion,
  removeOpcion,
  updateOpcion,
  // Estados de búsqueda y helpers
  filtroGrupos,
  setFiltroGrupos,
  getMarginColor,
  mostrarFormularioGrupo,
  noTienePermisoGrupo
}) => {
  // Estados locales para filtros adicionales
  const [filtroTipo, setFiltroTipo] = useState("all"); // 'all' | 'obligatorio' | 'opcional'
  const [filtroSubreceta, setFiltroSubreceta] = useState("");

  // ==========================================
  // 🛡️ ALERTAS SWEETALERT2: GRUPOS MAESTROS
  // ==========================================
  const handleCancelGrupoClick = () => {
    const tieneDatos =
      grupoFormData.nombre_grupo ||
      (grupoFormData.opciones.length > 0 &&
        grupoFormData.opciones[0].subreceta_id);
    if (tieneDatos) {
      Swal.fire({
        title: "¿Descartar cambios?",
        text: "La configuración de opciones no guardada se perderá.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, descartar",
        cancelButtonText: "Seguir editando",
      }).then((result) => {
        if (result.isConfirmed) resetGrupoForm();
      });
    } else {
      resetGrupoForm();
    }
  };

  const confirmDeleteGrupo = (id, nombre) => {
    Swal.fire({
      title: `¿Eliminar grupo "${nombre}"?`,
      text: "Este grupo desaparecerá de todos los productos que lo tengan vinculado. Esta acción no se puede deshacer.",
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, eliminar grupo",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) handleDeleteGrupo(id);
    });
  };

  // ==========================================
  // LÓGICA DE FILTRADO
  // ==========================================
  const gruposFiltrados = gruposMaestros.filter((g) => {
    const matchNombre = !filtroGrupos || g.nombre?.toLowerCase().includes(filtroGrupos.toLowerCase());
    const esObligatorio = g.min_seleccion > 0;
    const matchTipo = filtroTipo === "all" || 
                      (filtroTipo === "obligatorio" && esObligatorio) || 
                      (filtroTipo === "opcional" && !esObligatorio);
    const matchSubreceta = !filtroSubreceta || 
                           (g.opciones_modificadores || []).some(op => op.subreceta_id === filtroSubreceta);

    return matchNombre && matchTipo && matchSubreceta;
  });

  return (
    <div className={mostrarFormularioGrupo ? s.splitLayout : s.fullLayout}>
      <aside className={`${s.adminCard} ${!mostrarFormularioGrupo ? s.hidden : ""}`}>
        <h3 className={s.cardTitle}>
          {editGrupoId ? "Editar Grupo Maestro" : "Crear Grupo Maestro"}
        </h3>

        <form onSubmit={handleSubmitGrupo} className={s.formColumn}>
          <div className={s.formGroup}>
            <label className={s.label}>NOMBRE DEL GRUPO</label>
            <input
              type="text"
              className={`${s.inputField} ${noTienePermisoGrupo ? s.inputDisabled : ""}`}
              placeholder="Ej. Elige tu Proteína, Extras..."
              value={grupoFormData.nombre_grupo}
              onChange={(e) =>
                setGrupoFormData({ ...grupoFormData, nombre_grupo: e.target.value })
              }
              required
              disabled={noTienePermisoGrupo}
            />
          </div>

          <div className={s.formGrid}>
            <label className={s.checkboxLabel}>
              <input
                type="checkbox"
                className={s.checkbox}
                checked={grupoFormData.obligatorio}
                onChange={(e) =>
                  setGrupoFormData({ ...grupoFormData, obligatorio: e.target.checked })
                }
                disabled={noTienePermisoGrupo}
              />
              <span className={s.formGroup}>Selección Obligatoria</span>
            </label>
            <div className={s.formGroup}>
              <label className={`${s.label} ${s.labelSmall}`}>MÁXIMO PERMITIDO</label>
              <input
                type="number"
                min="0"
                step="1"
                className={`${s.inputField} ${noTienePermisoGrupo ? s.inputDisabled : ""}`}
                value={grupoFormData.maximo}
                onChange={(e) => {
                  const val = e.target.value === "" ? "" : parseInt(e.target.value, 10);
                  setGrupoFormData({ ...grupoFormData, maximo: val });
                }}
                required
                disabled={noTienePermisoGrupo}
              />
            </div>
          </div>

          <hr className={s.hr} style={{ margin: "-1px 0" }} />
          
          <div className={s.stack} style={{ gap: "15px" }}>
            <label className={s.label}>Extras</label>
            {grupoFormData.opciones.map((opcion, idx) => {
              const subData = subrecetasDisponibles.find(s => s.nombre === opcion.subreceta_id);
              const unidadAbrev = subData?.unidad_abreviatura || "Pz";
              return (
                <div key={idx} className={`${s.itemCardRelative} ${s.bgWhite}`}>
                  {!noTienePermisoGrupo && (
                    <button type="button" className={`${s.btnSecondary} ${s.btnRemoveCircle} ${s.btnSmall}`} onClick={() => removeOpcion(idx)}>X</button>
                  )}
                  <div className={s.formGroup}>
                    <SearchableSelect
                      options={subrecetasDisponibles}
                      value={opcion.subreceta_id}
                      valueKey="nombre"
                      labelKey="nombre"
                      placeholder="Buscar preparación..."
                      formatLabel={(opt) => `${opt.nombre} - $${(opt.costo_final || 0).toFixed(2)} por ${opt.unidad_abreviatura || "unidad"}`}
                      disabled={noTienePermisoGrupo}
                      onChange={(val) => updateOpcion(idx, "subreceta_id", val)}
                    />
                  </div>
                  <div className={s.formGrid}>
                    <div className={s.formGroup}>
                      <label className={`${s.label} ${s.labelTiny}`}>CANTIDAD ({unidadAbrev})</label>
                      <input type="number" step="0.001" className={`${s.inputField} ${noTienePermisoGrupo ? s.inputDisabled : ""}`} value={opcion.cantidad} onChange={(e) => updateOpcion(idx, "cantidad", e.target.value)} required disabled={noTienePermisoGrupo} />
                    </div>
                    <div className={s.formGroup}>
                      <label className={`${s.label} ${s.labelTiny}`}>PRECIO</label>
                      <input type="number" step="0.01" className={`${s.inputField} ${noTienePermisoGrupo ? s.inputDisabled : ""}`} value={opcion.precio_venta} onChange={(e) => updateOpcion(idx, "precio_venta", e.target.value)} required disabled={noTienePermisoGrupo} />
                    </div>
                    <div className={s.formGroup}>
                      <label className={`${s.label} ${s.labelTiny}`}>MARGEN</label>
                      <div className={s.unitDisplayBox} style={{ color: getMarginColor(opcion.margen), fontWeight: "700" }}>{opcion.margen}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {!noTienePermisoGrupo && (
              <button type="button" onClick={addOpcion} className={`${s.btn} ${s.btnSuccess} ${s.btnSmall}`} style={{ alignSelf: "flex-end", marginTop: "3px" }}>+ AÑADIR OPCIÓN</button>
            )}
          </div>

          <div className={`${s.formColumn} ${s.marginTop10}`}>
            {!noTienePermisoGrupo && (
              <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} disabled={loading}>
                {loading ? "..." : editGrupoId ? "ACTUALIZAR" : "GUARDAR"}
              </button>
            )}
            {editGrupoId && (
              <button type="button" className={`${s.btn} ${s.btnDark} ${s.btnFull}`} onClick={handleCancelGrupoClick}>
                {puedeEditar ? "CANCELAR EDICIÓN" : "CERRAR"}
              </button>
            )}
          </div>
        </form>
      </aside>

      <div className={`${s.adminCard} ${s.tableContainer}`}>
        {/* BARRA DE FILTROS EN UNA SOLA LÍNEA */}
        <div style={{ 
          padding: "10px 15px", 
          borderBottom: "1px solid var(--color-border)", 
          background: "var(--color-bg-light, #f8f9fa)",
          display: "flex",
          gap: "15px",
          alignItems: "center",
          flexWrap: "now)rap"
        }}>
          <div style={{ flex: "2", minWidth: "150px" }}>
            <input 
              type="text" 
              className={s.inputField} 
              style={{ margin: 0 }}
              placeholder="Buscar por nombre..." 
              value={filtroGrupos} 
              onChange={(e) => setFiltroGrupos(e.target.value)} 
            />
          </div>
          
          <div style={{ flex: "1", minWidth: "140px" }}>
            <select 
              className={s.inputField} 
              style={{ margin: 0, padding: "8px" }}
              value={filtroTipo} 
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="all">Todos los Tipos</option>
              <option value="obligatorio">Obligatorios</option>
              <option value="opcional">Opcionales</option>
            </select>
          </div>

          <div style={{ flex: "2", minWidth: "180px" }}>
            <select 
              className={s.inputField} 
              style={{ margin: 0, padding: "8px" }}
              value={filtroSubreceta} 
              onChange={(e) => setFiltroSubreceta(e.target.value)}
            >
              <option value="">Cualquier preparación...</option>
              {subrecetasDisponibles.map((sub, i) => (
                <option key={i} value={sub.nombre}>{sub.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <table className={s.table}>
          <thead className={s.thead}>
            <tr>
              <th className={s.th}>GRUPO MAESTRO</th>
              <th className={s.th}>OPCIONES (DETALLE OPERATIVO)</th>
              <th className={`${s.th} ${s.tdRight}`}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {gruposFiltrados.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                  {loading ? "Cargando grupos..." : "Sin coincidencias."}
                </td>
              </tr>
            ) : (
              gruposFiltrados.map((g) => (
                <tr key={g.id}>
                  <td className={s.td}>
                    <div className={s.productTitle}>{g.nombre}</div>
                    <small className={s.textMuted}>
                      {g.min_seleccion > 0 ? "Obligatorio" : "Opcional"} • Máx: {g.max_seleccion}
                    </small>
                  </td>
                  <td className={s.td}>
                    <div className={s.formColumnGap5}>
                      {(g.opciones_modificadores || []).map((op, i) => {
                        const vNeta = parseFloat(op.precio_venta) / IVA_FACTOR;
                        const subData = subrecetasDisponibles.find(s => s.nombre === op.subreceta_id);
                        const unidadAbrev = subData?.unidad_abreviatura || "Pz";
                        const cSub = (subData ? subData.costo_final : 0) * (op.cantidad || 1);
                        const mSub = vNeta > 0 ? (((vNeta - cSub) / vNeta) * 100).toFixed(1) : 0;
                        return (
                          <div key={i} className={s.labelSmall}>
                            • <span className={s.fontWeight700}>{op.cantidad || 1} {unidadAbrev}</span> de {op.subreceta_id} (+${parseFloat(op.precio_venta).toFixed(2)})
                            <span className={s.labelSmall} style={{ fontWeight: "700", color: getMarginColor(mSub), marginLeft: "5px" }}>{mSub}% Margen</span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className={`${s.td} ${s.tdRight}`}>
                    <div className={s.actionsWrapper}>
                      <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => handleEditGrupo(g)}>{puedeEditar ? "📝" : "👁️"}</button>
                      {puedeBorrar && (
                        <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => confirmDeleteGrupo(g.id, g.nombre)}>❌</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};