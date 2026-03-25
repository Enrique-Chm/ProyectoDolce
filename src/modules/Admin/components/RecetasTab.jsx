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

  const mostrarFormulario = puedeCrear || isEditing;
  const noTienePermisoAccion = isEditing ? !puedeEditar : !puedeCrear;

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
    <div className={s.tabWrapperRecetas}>
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Ingeniería de Recetas</h2>
        {loading && <span className={s.syncBadge}>SINCRONIZANDO...</span>}
      </header>

      <div className={mostrarFormulario ? s.splitLayout : s.fullLayout}>
        
        {/* FORMULARIO LATERAL */}
        <aside className={`${s.adminCard} ${!mostrarFormulario ? s.hidden : ''}`}>
          <h3 className={s.cardTitle}>
            {isEditing ? (puedeEditar ? " Editando Receta" : "Ver Receta") : " Nueva Preparación"}
          </h3>
          <form onSubmit={handleSubmit} className={s.formColumn}>
            <div className={s.formGroup}>
              <label className={s.label}>NOMBRE DE LA PREPARACIÓN</label>
              <input
                className={`${s.inputField} ${noTienePermisoAccion ? s.inputDisabled : ''}`}
                value={nombreReceta}
                onChange={(e) => setNombreReceta(e.target.value)}
                required
                disabled={noTienePermisoAccion}
                placeholder="Ej. Salsa Roja Especial"
              />
            </div>

            <div className={s.checkboxRow}> {/* Usando clase de utilidad */}
                <label className={s.checkboxLabel}>
                <input
                    type="checkbox"
                    className={s.checkbox}
                    checked={isSubreceta}
                    onChange={(e) => setIsSubreceta(e.target.checked)}
                    disabled={noTienePermisoAccion}
                />
                <div className={s.flexColumn}>
                    <span className={s.fontWeight700}>¿Es Sub-receta?</span>
                    <small className={s.textMuted}>Insumo para otra receta</small>
                </div>
                </label>
            </div>

            <div className={`${s.formGrid} ${s.summaryBox}`}>
                <div className={s.formGroupNoMargin}>
                    <label className={`${s.label} ${s.labelSmall}`}>RENDIMIENTO (CUÁNTO SALE)</label>
                    <input
                        type="number"
                        step="0.001"
                        className={s.inputField}
                        value={rendimiento}
                        onChange={(e) => setRendimiento(e.target.value)}
                        required
                        disabled={noTienePermisoAccion}
                    />
                </div>
                <div className={s.formGroupNoMargin}>
                    <label className={`${s.label} ${s.labelSmall}`}>UNIDAD DEL RESULTADO</label>
                    <select 
                        className={s.inputField}
                        value={unidadMedidaFinal}
                        onChange={(e) => setUnidadMedidaFinal(e.target.value)}
                        required
                        disabled={noTienePermisoAccion}
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
              <label className={`${s.label} ${s.labelSmall}`}>INGREDIENTES Y CANTIDADES</label>

              {ingredientes.map((ing, idx) => {
                const listaActual = ing.tipo === 'insumo' ? insumos : subrecetasLista;
                const selectedInsumo = listaActual.find(i => String(i.id) === String(ing.insumo_id));
                const costoFilaVivo = ((selectedInsumo?.costo_unitario || 0) * (parseFloat(ing.cantidad) || 0)).toFixed(2);

                return (
                  <div key={idx} className={s.itemCardRelative}>
                    {!noTienePermisoAccion && (
                      <button type="button" className={`${s.btnSecondary} ${s.btnRemoveCircle} ${s.btnSmall}`} onClick={() => removeIngrediente(idx)}>X</button>
                    )}
                    
                    <div className={s.radioGroup}>
                      <label className={s.radioLabel}>
                        <input 
                          type="radio" 
                          name={`tipo_${idx}`} 
                          checked={ing.tipo === 'insumo'} 
                          disabled={noTienePermisoAccion}
                          onChange={() => {
                            const n = [...ingredientes];
                            n[idx].tipo = 'insumo';
                            n[idx].insumo_id = ""; 
                            setIngredientes(n);
                          }} 
                        />
                        Insumo
                      </label>
                      <label className={s.radioLabel}>
                        <input 
                          type="radio" 
                          name={`tipo_${idx}`} 
                          checked={ing.tipo === 'subreceta'} 
                          disabled={noTienePermisoAccion}
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

                    <div className={s.formGroup}>
                      <SearchableSelect 
                        options={listaActual} 
                        value={ing.insumo_id}
                        disabled={noTienePermisoAccion}
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
                      <div className={s.formGroupNoMargin}>
                        <label className={`${s.label} ${s.labelTiny}`}>CANTIDAD</label>
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
                          disabled={noTienePermisoAccion}
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

            {!noTienePermisoAccion && (
              <button 
                type="button" 
                onClick={() => setIngredientes([...ingredientes, { tipo: 'insumo', insumo_id: "", cantidad: "", unidad_id: "" }])}
                className={`${s.btn} ${s.btnSuccess} ${s.btnSmall}`}>
                + AÑADIR INGREDIENTE
              </button>
            )}

            <div className={`${s.flexColumnGap10} ${s.marginTop10}`}>
              {!noTienePermisoAccion && (
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

        {/* TABLA DE RECETAS */}
        <div className={`${s.adminCard} ${s.tableContainer}`}>
          <table className={s.table}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th}>PREPARACIÓN / RENDIMIENTO</th>
                <th className={`${s.th} s.thCenter`}>COMPOSICIÓN</th>
                <th className={`${s.th} s.thCenter`}>COSTO UNITARIO</th>
                <th className={`${s.th} s.thCenter`}>ACCIONES</th>
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
                        <div className={s.productTitle}>{r.nombre}</div>
                        <div className={s.marginTop4}>
                            <span className={s.syncBadge} style={{ background: '#f3f4f6', color: '#374151' }}>
                                Rinde: {r.rendimiento_cantidad} {unidadFinal}
                            </span>
                            {r.subreceta && <span className={`${s.badge} ${s.marginLeft5}`}>SUB-RECETA</span>}
                        </div>
                      </td>
                      <td className={`${s.td} ${s.tdCenter}`}>
                        <div className={s.flexColumnGap5}>
                          {r.detalle_ingredientes.map((ing, iidx) => (
                            <div key={iidx} className={s.miniBadge}>
                              • {ing.insumo}: <strong>{ing.cantidad} {ing.unidad}</strong>
                              <span className={s.textPrimary} style={{ marginLeft: "5px" }}> (${(ing.costo_fila || 0).toFixed(2)})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className={`${s.td} ${s.tdCenter}`}>
                        <div className={`${s.totalAmount} ${s.costUnitWrapper}`}>
                            ${costoU.toFixed(2)}
                            <span className={s.textSubUnit}> / {unidadFinal}</span>
                        </div>
                        <div className={s.textSubDetail}>
                            Costo lote: ${(r.costo_total_receta || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className={`${s.td} ${s.tdCenter}`}>
                        <div className={s.actionsWrapper}>
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

// SearchableSelect se mantiene igual (ya es un componente de UI)
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
    <div className={s.relative}>
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
        <ul className={s.dropdownList}>
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
            <li className={s.dropdownItemMuted}>No hay resultados</li>
          )}
        </ul>
      )}
    </div>
  );
};