// Archivo: src/modules/Admin/components/ProductosTab.jsx
import React, { useState, useEffect } from 'react';
import s from '../AdminPage.module.css';
import { IVA_FACTOR } from '../../../utils/taxConstants'; 
import { useProductosTab } from '../../../hooks/useProductosTab'; 
import Swal from 'sweetalert2'; 

const getMarginColor = (margen) => {
  const m = parseFloat(margen);
  if (m < 0) return '#dc3545';  
  if (m < 40) return '#fd7e14'; 
  if (m < 60) return '#28a745'; 
  if (m < 80) return '#0d6efd'; 
  return '#6f42c1';             
};

export const ProductosTab = ({ sucursalId }) => {
  const {
    productos, categorias, recetasCosteadas, subrecetasDisponibles, loading, editId, formData, setFormData,
    puedeCrear, puedeEditar, puedeBorrar,
    addGrupo, removeGrupo, updateGrupo, addOpcionAGrupo, removeOpcionDeGrupo, updateOpcion,
    handleSubmit, handleDelete, resetForm, handleEdit
  } = useProductosTab(sucursalId);

  const handleCancelClick = () => {
    const tieneDatos = formData.nombre || formData.precio_venta > 0 || formData.grupos.length > 0;
    
    if (tieneDatos) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: "Los ajustes de precio o extras no guardados se perderán.",
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

  const confirmDeleteProducto = (id, nombre) => {
    Swal.fire({
      title: `¿Quitar "${nombre}" del menú?`,
      text: "El producto ya no estará disponible para la venta, pero su receta se mantendrá intacta.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d', 
      confirmButtonText: 'Sí, quitar del menú',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) handleDelete(id); 
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Estrategia de Precios (Menú)</h2>
        {loading && <span className={s.syncBadge}>ACTUALIZANDO...</span>}
      </header>

      <div className={s.splitLayout}>
        
        {/* LADO IZQUIERDO: FORMULARIO PROTEGIDO */}
        <aside className={s.adminCard} style={{ display: puedeCrear || editId ? 'block' : 'none' }}>
          <h3 className={s.cardTitle}>
            {editId ? (puedeEditar ? 'Ajustar Producto' : 'Consulta de Producto') : 'Nuevo Producto'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div className={s.formGroup}>
              <label className={s.label}>RECETA PRINCIPAL</label>
              <SearchableSelect 
                options={recetasCosteadas}
                value={formData.nombre}
                valueKey="nombre"
                labelKey="nombre"
                placeholder="Buscar receta..."
                formatLabel={(opt) => `${opt.nombre} ($${opt.costo_final.toFixed(2)})`}
                disabled={editId ? !puedeEditar : !puedeCrear}
                onChange={(selectedValue) => {
                  const rec = recetasCosteadas.find(r => r.nombre === selectedValue);
                  setFormData({...formData, nombre: selectedValue, costo_referencia: rec ? rec.costo_final : 0});
                }}
              />
            </div>

            <div className={s.formGrid}>
              <div className={s.formGroup}>
                <label className={s.label}>PRECIO PÚBLICO ($)</label>
                <input 
                  type="number" step="0.01" 
                  className={s.inputField}
                  style={{ fontWeight: '600', backgroundColor: (editId ? !puedeEditar : !puedeCrear) ? "var(--color-bg-muted)" : "white" }}
                  value={formData.precio_venta} 
                  onChange={e => setFormData({...formData, precio_venta: e.target.value})} 
                  required readOnly={editId ? !puedeEditar : !puedeCrear} 
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>MARGEN NETO %</label>
                <div className={s.unitDisplayBox} style={{ 
                  fontWeight: '700', 
                  color: getMarginColor(formData.margen_en_vivo) 
                }}>
                  {formData.margen_en_vivo}%
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 💡 SECCIÓN DE GRUPOS DE MODIFICADORES */}
            {/* ============================================================== */}
            <div className={s.flexColumnGap10} style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={s.label}>GRUPOS DE MODIFICADORES (EXTRAS)</label>
                {(editId ? puedeEditar : puedeCrear) && (
                  <button type="button" onClick={addGrupo} className={`${s.btn} ${s.btnSec} ${s.btnSmall}`}>+ CREAR GRUPO</button>
                )}
              </div>

              <div className={s.flexColumnGap15}>
                {formData.grupos.map((grupo, idxGrupo) => (
                  <div key={idxGrupo} className={s.adminCard} style={{ backgroundColor: 'var(--color-bg-app)', padding: '15px', position: 'relative' }}>
                    
                    {(editId ? puedeEditar : puedeCrear) && (
                      <button type="button" className={s.btnRemoveCircle} onClick={() => removeGrupo(idxGrupo)} style={{ top: '-10px', right: '-10px' }}>✕</button>
                    )}

                    <div className={s.formGroup}>
                      <label className={s.label}>NOMBRE DEL GRUPO</label>
                      <input 
                        type="text" 
                        className={s.inputField}
                        placeholder="Ej. Elige tu Proteína, Extras..." 
                        value={grupo.nombre_grupo} 
                        onChange={e => updateGrupo(idxGrupo, 'nombre_grupo', e.target.value)} 
                        required readOnly={editId ? !puedeEditar : !puedeCrear} 
                      />
                    </div>

                    <div className={s.formGrid} style={{ marginBottom: '15px' }}>
                      <label className={s.checkboxLabel}>
                        <input
                          type="checkbox"
                          className={s.checkbox}
                          checked={grupo.obligatorio}
                          onChange={(e) => updateGrupo(idxGrupo, 'obligatorio', e.target.checked)}
                          disabled={editId ? !puedeEditar : !puedeCrear}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Selección Obligatoria</span>
                      </label>
                      
                      <div className={s.formGroup} style={{ marginBottom: 0 }}>
                        <label className={s.label} style={{ fontSize: '9px' }}>MÁXIMO PERMITIDO</label>
                        <input 
                          type="number" min="1" step="1"
                          className={s.inputField}
                          value={grupo.maximo} 
                          onChange={e => updateGrupo(idxGrupo, 'maximo', parseInt(e.target.value))} 
                          required readOnly={editId ? !puedeEditar : !puedeCrear} 
                        />
                      </div>
                    </div>

                    {/* OPCIONES DENTRO DEL GRUPO */}
                    <div className={s.flexColumnGap10} style={{ paddingLeft: '15px', borderLeft: '3px solid var(--color-primary)' }}>
                      <label className={s.label} style={{ fontSize: '10px' }}>OPCIONES DISPONIBLES</label>
                      
                      {grupo.opciones.map((opcion, idxOpcion) => (
                        <div key={idxOpcion} className={s.itemCardRelative} style={{ padding: '10px' }}>
                          {(editId ? puedeEditar : puedeCrear) && (
                            <button type="button" className={`${s.btnSecondary} ${s.btnRemoveCircle} ${s.btnSmall}`} onClick={() => removeOpcionDeGrupo(idxGrupo, idxOpcion)} style={{ top: '5px', right: '5px' }}>X</button>
                          )}
                          
                          <div style={{ marginBottom: '10px', paddingRight: '20px' }}>
                            <SearchableSelect 
                              options={subrecetasDisponibles}
                              value={opcion.subreceta_id}
                              valueKey="nombre"
                              labelKey="nombre"
                              placeholder="Buscar sub-receta..."
                              formatLabel={(opt) => `${opt.nombre} ($${opt.costo_final.toFixed(2)})`}
                              disabled={editId ? !puedeEditar : !puedeCrear}
                              onChange={(val) => updateOpcion(idxGrupo, idxOpcion, 'subreceta_id', val)}
                            />
                          </div>

                          <div className={s.formGrid}>
                            <input 
                              type="number" step="0.01" 
                              className={s.inputField}
                              placeholder="Precio Venta" 
                              value={opcion.precio_venta} 
                              onChange={e => updateOpcion(idxGrupo, idxOpcion, 'precio_venta', e.target.value)} 
                              required readOnly={editId ? !puedeEditar : !puedeCrear} 
                            />
                            <div className={s.unitDisplayBox} style={{ fontSize: '10px', fontWeight: '700', color: getMarginColor(opcion.margen) }}>
                              {opcion.margen}% NETO
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {(editId ? puedeEditar : puedeCrear) && (
                        <button type="button" onClick={() => addOpcionAGrupo(idxGrupo)} className={`${s.btn} ${s.btnOutlineEditar} ${s.btnSmall}`} style={{ alignSelf: 'flex-start' }}>
                          + AÑADIR OPCIÓN
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* ============================================================== */}

            <div className={s.formGroup} style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '15px' }}>
              <label className={s.label}>CATEGORÍA EN MENÚ</label>
              <SearchableSelect 
                options={categorias}
                value={formData.categoria}
                valueKey="id"
                labelKey="nombre"
                placeholder="Seleccionar categoría..."
                disabled={editId ? !puedeEditar : !puedeCrear}
                onChange={(val) => setFormData({...formData, categoria: val})}
              />
            </div>

            <div className={s.flexColumnGap10} style={{ marginTop: '10px' }}>
              {(editId ? puedeEditar : puedeCrear) && (
                <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} disabled={loading}>
                  {loading ? '...' : (editId ? 'ACTUALIZAR ESTRATEGIA' : 'GUARDAR EN MENÚ')}
                </button>
              )}
              
              {editId && (
                <button type="button" className={`${s.btn} ${s.btnDark} ${s.btnFull}`} onClick={handleCancelClick}>
                  {puedeEditar ? 'CANCELAR EDICIÓN' : 'CERRAR DETALLE'}
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* TABLA DE PRODUCTOS */}
        <div className={`${s.adminCard} ${s.tableContainer}`}>
          <table className={s.table} style={{ minWidth: '600px' }}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th}>PRODUCTO</th>
                <th className={s.th}>COSTO</th>
                <th className={s.th}>VENTA (CON IVA)</th>
                <th className={s.th} style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => {
                const costoBase = p.costo_actual || 0;
                const ventaBase = p.precio_venta || 0;
                const netoBase = ventaBase / IVA_FACTOR;
                const margenBase = netoBase > 0 ? (((netoBase - costoBase) / netoBase) * 100).toFixed(1) : 0;

                return (
                  <tr key={p.id} style={{ backgroundColor: editId === p.id ? 'var(--color-bg-app)' : 'transparent' }}>
                    <td className={s.td}>
                      <div style={{ fontWeight: '600' }}>{p.nombre}</div>
                      
                      {/* 💡 Renderizado de Grupos en la Tabla */}
                      {(p.grupos || []).map((g, i) => (
                        <div key={i} style={{ marginTop: '5px', paddingLeft: '8px', borderLeft: '2px solid var(--color-border)' }}>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
                            {g.nombre} {g.min_seleccion > 0 ? '(Obligatorio)' : '(Opcional)'}:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                            {(g.opciones_modificadores || []).map((op, j) => {
                              const vNeta = parseFloat(op.precio_venta) / IVA_FACTOR;
                              // Para el costo, buscamos en subrecetasDisponibles si la tenemos a mano, si no, asumimos 0 para la vista rápida
                              const subData = subrecetasDisponibles.find(s => s.nombre === op.subreceta_id);
                              const cSub = subData ? subData.costo_final : 0;
                              const mSub = vNeta > 0 ? (((vNeta - cSub) / vNeta) * 100).toFixed(1) : 0;

                              return (
                                <div key={j} className={s.miniBadge}>
                                  {op.subreceta_id} (+${parseFloat(op.precio_venta).toFixed(2)})
                                  <span style={{ color: getMarginColor(mSub), fontWeight: 'bold', marginLeft: '4px' }}>
                                    {mSub}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </td>
                    <td className={s.td}>${costoBase.toFixed(2)}</td>
                    <td className={s.td}>
                      <div className={s.totalAmount} style={{ color: 'var(--color-primary)' }}>${ventaBase.toFixed(2)}</div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: getMarginColor(margenBase) }}>
                        {margenBase}% Margen Real
                      </div>
                    </td>
                    <td className={s.td} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => handleEdit(p)}>
                          {puedeEditar ? '📝' : 'VER'}
                        </button>
                        {puedeBorrar && (
                          <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => confirmDeleteProducto(p.id, p.nombre)}>
                            ❌
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * SearchableSelect Homologado
 */
const SearchableSelect = ({ options, value, onChange, disabled, placeholder = "Buscar...", valueKey = "id", labelKey = "nombre", formatLabel }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find((opt) => String(opt[valueKey]) === String(value));
    setSearchTerm(selected ? selected[labelKey] : "");
  }, [value, options, valueKey, labelKey]);

  const filteredOptions = options.filter(opt =>
    String(opt[labelKey]).toLowerCase().includes(searchTerm.toLowerCase())
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
          if (value) onChange(""); 
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false);
            const selected = options.find((opt) => String(opt[valueKey]) === String(value));
            setSearchTerm(selected ? selected[labelKey] : "");
          }, 200);
        }}
        style={{ backgroundColor: disabled ? "var(--color-bg-muted)" : "white" }}
      />
      {isOpen && !disabled && (
        <ul className={s.dropdownList}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, index) => (
            <li 
              key={index} 
              className={s.dropdownItem} 
              onMouseDown={(e) => { e.preventDefault(); onChange(opt[valueKey]); setSearchTerm(opt[labelKey]); setIsOpen(false); }}
            >
              {formatLabel ? formatLabel(opt) : opt[labelKey]}
            </li>
          )) : <li className={s.dropdownItem} style={{ color: 'var(--color-text-muted)' }}>Sin resultados...</li>}
        </ul>
      )}
    </div>
  );
};