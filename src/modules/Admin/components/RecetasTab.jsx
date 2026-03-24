// Archivo: src/modules/Admin/components/RecetasTab.jsx
import React, { useState, useEffect } from "react";
import s from "../AdminPage.module.css";
import { useRecetasTab } from "../../../hooks/useRecetasTab"; 
import Swal from 'sweetalert2'; 

export const RecetasTab = ({ sucursalId }) => {
  const {
    recetasAgrupadas, insumos, subrecetasLista, unidades, loading, isEditing,
    nombreReceta, setNombreReceta, isSubreceta, setIsSubreceta, 
    rendimiento, setRendimiento,
    unidadMedidaFinal, setUnidadMedidaFinal,
    ingredientes, setIngredientes,
    puedeCrear, puedeEditar, puedeBorrar,
    removeIngrediente, resetForm, handleEdit, handleSubmit, handleDeleteReceta
  } = useRecetasTab(sucursalId);

  // 💡 LÓGICA DE VISIBILIDAD DINÁMICA
  const mostrarFormulario = puedeCrear || isEditing;

  const handleCancelClick = () => {
    if (nombreReceta.trim() !== "" || ingredientes.length > 0) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: "Los cambios no guardados se perderán.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', 
        cancelButtonColor: '#3085d6', 
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Seguir editando'
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
       icon: 'error',
       showCancelButton: true,
       confirmButtonColor: '#d33',
       cancelButtonColor: '#6c757d', 
       confirmButtonText: 'Sí, eliminar',
       cancelButtonText: 'Cancelar'
     }).then((result) => {
       if (result.isConfirmed) handleDeleteReceta(nombre); 
     });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Ingeniería de Recetas</h2>
        {loading && <span className={s.syncBadge}>SINCRONIZANDO...</span>}
      </header>

      {/* 💡 LAYOUT DINÁMICO: splitLayout (2 cols en escritorio, 1 col en móvil gracias al CSS) */}
      <div className={mostrarFormulario ? s.splitLayout : s.fullLayout}>
        
        {/* FORMULARIO LATERAL */}
        <aside className={s.adminCard} style={{ display: mostrarFormulario ? 'block' : 'none' }}>
          <h3 className={s.cardTitle}>
            {isEditing ? (puedeEditar ? " Editando Receta" : "Ver Receta") : " Nueva Preparación"}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div className={s.formGroup}>
              <label className={s.label}>NOMBRE DE LA PREPARACIÓN</label>
              <input
                className={s.inputField}
                value={nombreReceta}
                onChange={(e) => setNombreReceta(e.target.value)}
                required
                disabled={isEditing ? !puedeEditar : !puedeCrear}
                placeholder="Ej. Salsa Roja Especial"
                style={{ backgroundColor: (isEditing ? !puedeEditar : !puedeCrear) ? "var(--color-bg-muted)" : "white" }}
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <label className={s.checkboxLabel} style={{ flex: 1 }}>
                <input
                    type="checkbox"
                    className={s.checkbox}
                    checked={isSubreceta}
                    onChange={(e) => setIsSubreceta(e.target.checked)}
                    disabled={isEditing ? !puedeEditar : !puedeCrear}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700 }}>¿Es Sub-receta?</span>
                    <small className={s.textMuted}>Insumo para otra receta</small>
                </div>
                </label>
            </div>

            <div className={s.formGrid} style={{ backgroundColor: 'var(--color-bg-muted)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div className={s.formGroup} style={{ marginBottom: 0 }}>
                    <label className={s.label} style={{ fontSize: '10px' }}>RENDIMIENTO (CUÁNTO SALE)</label>
                    <input
                        type="number"
                        step="0.001"
                        className={s.inputField}
                        value={rendimiento}
                        onChange={(e) => setRendimiento(e.target.value)}
                        required
                        disabled={isEditing ? !puedeEditar : !puedeCrear}
                    />
                </div>
                <div className={s.formGroup} style={{ marginBottom: 0 }}>
                    <label className={s.label} style={{ fontSize: '10px' }}>UNIDAD DEL RESULTADO</label>
                    <select 
                        className={s.inputField}
                        value={unidadMedidaFinal}
                        onChange={(e) => setUnidadMedidaFinal(e.target.value)}
                        required
                        disabled={isEditing ? !puedeEditar : !puedeCrear}
                    >
                        <option value="">Seleccionar...</option>
                        {unidades.map(u => (
                            <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>
                        ))}
                    </select>
                </div>
            </div>

            <hr className={s.hr} />

            <div className={s.flexColumnGap10}>
              <label className={s.label} style={{ fontSize: '10px' }}>INGREDIENTES Y CANTIDADES</label>

              {ingredientes.map((ing, idx) => {
                const listaActual = ing.tipo === 'insumo' ? insumos : subrecetasLista;
                const selectedInsumo = listaActual.find(i => String(i.id) === String(ing.insumo_id));
                const costoFilaVivo = ((selectedInsumo?.costo_unitario || 0) * (parseFloat(ing.cantidad) || 0)).toFixed(2);
                const deshabilitarCampos = isEditing ? !puedeEditar : !puedeCrear;

                return (
                  <div key={idx} className={s.itemCardRelative}>
                    {!deshabilitarCampos && (
                      <button type="button" className={`${s.btnSecondary} ${s.btnRemoveCircle} ${s.btnSmall}`} onClick={() => removeIngrediente(idx)}>X</button>
                    )}
                    
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name={`tipo_${idx}`} 
                          checked={ing.tipo === 'insumo'} 
                          disabled={deshabilitarCampos}
                          onChange={() => {
                            const n = [...ingredientes];
                            n[idx].tipo = 'insumo';
                            n[idx].insumo_id = ""; 
                            setIngredientes(n);
                          }} 
                        />
                        Insumo
                      </label>
                      <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name={`tipo_${idx}`} 
                          checked={ing.tipo === 'subreceta'} 
                          disabled={deshabilitarCampos}
                          onChange={() => {
                            const n = [...ingredientes];
                            n[idx].tipo = 'subreceta';
                            n[idx].insumo_id = ""; 
                            setIngredientes(n);
                          }} 
                        />
                        Sub-receta
                      </label>
                    </div>

                    <div className={s.formGroup} style={{ marginBottom: '10px' }}>
                      <SearchableSelect 
                        options={listaActual} 
                        value={ing.insumo_id}
                        disabled={deshabilitarCampos}
                        placeholder={ing.tipo === 'insumo' ? "Buscar insumo..." : "Buscar sub-receta..."}
                        onChange={(selectedId) => {
                          const n = [...ingredientes];
                          const insData = listaActual.find(i => String(i.id) === String(selectedId));
                          n[idx].insumo_id = selectedId;
                          if (insData) n[idx].unidad_id = insData.unidad_medida_id || insData.unidad_medida || "";
                          setIngredientes(n);
                        }}
                      />
                    </div>

                    <div className={s.formGrid}>
                      <div className={s.formGroup} style={{ marginBottom: 0 }}>
                        <label className={s.label} style={{ fontSize: '9px' }}>CANTIDAD</label>
                        <input
                          type="number" step="0.001"
                          className={s.inputField}
                          value={ing.cantidad}
                          onChange={e => {
                            const n = [...ingredientes];
                            n[idx].cantidad = e.target.value;
                            setIngredientes(n);
                          }}
                          required
                          disabled={deshabilitarCampos}
                        />
                      </div>
                      <div className={s.unitDisplayBox}>
                        {unidades.find(u => String(u.id) === String(ing.unidad_id))?.abreviatura || "U.M."}
                      </div>
                    </div>

                    <div className={s.costHint}>
                      COSTO LÍNEA: ${costoFilaVivo}
                    </div>
                  </div>
                );
              })}
            </div>

            {(isEditing ? puedeEditar : puedeCrear) && (
              <button 
                type="button" 
                onClick={() => setIngredientes([...ingredientes, { tipo: 'insumo', insumo_id: "", cantidad: "", unidad_id: "" }])}
                className={`${s.btn} ${s.btnSuccess} ${s.btnSmall}`}>
                + AÑADIR INGREDIENTE
              </button>
            )}

            <div className={s.flexColumnGap10} style={{ marginTop: '10px' }}>
              {(isEditing ? puedeEditar : puedeCrear) && (
                <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} disabled={loading}>
                  {loading ? "..." : isEditing ? "ACTUALIZAR" : "GUARDAR RECETA"}
                </button>
              )}
              {isEditing && (
                <button type="button" className={`${s.btn} ${s.btnDark} ${s.btnFull}`} onClick={handleCancelClick}>
                  {puedeEditar ? "CANCELAR" : "CERRAR"}
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* TABLA DE RECETAS (Con scroll horizontal en móvil mediante tableContainer) */}
        <div className={`${s.adminCard} ${s.tableContainer}`}>
          <table className={s.table}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th} style={{ textAlign: "left" }}>PREPARACIÓN / RENDIMIENTO</th>
                <th className={s.th} style={{ textAlign: "center" }}>COMPOSICIÓN</th>
                <th className={s.th} style={{ textAlign: "center" }}>COSTO UNITARIO</th>
                <th className={s.th} style={{ textAlign: "center" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {recetasAgrupadas.length === 0 ? (
                <tr><td colSpan="4" className={s.emptyState}>No hay recetas registradas.</td></tr>
              ) : (
                recetasAgrupadas.map((r, idx) => {
                  const unidadFinal = unidades.find(u => u.id === r.unidad_medida_final)?.abreviatura || 'Ud';
                  const costoU = parseFloat(r.costo_unitario_final) || 0;

                  return (
                    <tr key={idx}>
                      <td className={s.td}>
                        <div style={{ fontWeight: "600", fontSize: '15px' }}>{r.nombre}</div>
                        <div style={{ marginTop: '4px' }}>
                            <span className={s.syncBadge} style={{ background: '#f3f4f6', color: '#374151' }}>
                                Rinde: {r.rendimiento_cantidad} {unidadFinal}
                            </span>
                            {r.subreceta && <span className={s.badge} style={{ marginLeft: '5px' }}>SUB-RECETA</span>}
                        </div>
                      </td>
                      <td className={s.td} style={{ textAlign: "center" }}>
                        <div className={s.flexColumnGap5}>
                          {r.detalle_ingredientes.map((ing, iidx) => (
                            <div key={iidx} className={s.miniBadge}>
                              • {ing.insumo}: <strong>{ing.cantidad} {ing.unidad}</strong>
                              <span style={{ color: "var(--color-primary)", marginLeft: "5px" }}> (${(ing.costo_fila || 0).toFixed(2)})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className={s.td} style={{ textAlign: "center" }}>
                        <div className={s.totalAmount} style={{ 
                          color: 'var(--color-primary)', 
                          display: 'flex', 
                          alignItems: 'baseline', 
                          justifyContent: 'center', 
                          gap: '4px' 
                        }}>
                            ${costoU.toFixed(2)}
                            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}> / {unidadFinal}</span>
                        </div>
                        <div style={{ fontSize: '10px', marginTop: '2px', color: '#9ca3af' }}>
                            Costo lote: ${(r.costo_total_receta || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className={s.td} style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "5px", justifyContent: "flex-end" }}>
                          <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => handleEdit(r)}>
                            {puedeEditar ? "📝" : "👁️"}
                          </button>
                          {puedeBorrar && (
                            <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnEditar}`} onClick={() => confirmDeleteReceta(r.nombre)}>
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

/**
 * SearchableSelect Homologado (Corregido para evitar reseteos)
 */
const SearchableSelect = ({ options, value, onChange, disabled, placeholder = "Buscar..." }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find((opt) => String(opt.id) === String(value));
    setSearchTerm(selected ? selected.nombre : "");
  }, [value, options]);

  const filteredOptions = options.filter(opt =>
    (opt.nombre || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        className={s.inputField}
        value={searchTerm}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false);
            const selected = options.find((opt) => String(opt.id) === String(value));
            setSearchTerm(selected ? selected.nombre : "");
          }, 200);
        }}
      />
      
      {isOpen && !disabled && (
        <ul className={s.dropdownList} style={{ zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}>
          {filteredOptions.length > 0 ? filteredOptions.map(opt => (
            <li
              key={opt.id}
              className={s.dropdownItem}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.id);
                setSearchTerm(opt.nombre);
                setIsOpen(false);
              }}
            >
              {opt.nombre}
            </li>
          )) : (
            <li className={s.dropdownItem} style={{ color: 'var(--color-text-muted)' }}>No hay resultados</li>
          )}
        </ul>
      )}
    </div>
  );
};