// Archivo: src/modules/Admin/components/ProductosTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import s from '../AdminPage.module.css';
import { IVA_FACTOR } from '../../../utils/taxConstants'; 
import { useProductosTab } from '../../../hooks/useProductosTab'; 
import Swal from 'sweetalert2'; 

/**
 * Determina el color del margen de forma dinámica.
 */
const getMarginColor = (margen) => {
  const m = parseFloat(margen);
  if (m < 0) return '#dc3545';  
  if (m < 40) return '#fd7e14'; 
  if (m < 60) return '#28a745'; 
  if (m < 80) return '#0d6efd'; 
  return '#6f42c1';             
};

export const ProductosTab = ({ sucursalId }) => {
  const [activeSubTab, setActiveSubTab] = useState('productos'); // 'productos' | 'grupos'

  const {
    productos, categorias, recetasCosteadas, subrecetasDisponibles, gruposMaestros, loading,
    puedeCrear, puedeEditar, puedeBorrar,
    editProdId, prodFormData, setProdFormData, handleSubmitProducto, handleEditProd, handleDeleteProd, resetProdForm, toggleGrupoEnProducto,
    editGrupoId, grupoFormData, setGrupoFormData, handleSubmitGrupo, handleEditGrupo, handleDeleteGrupo, resetGrupoForm, addOpcion, removeOpcion, updateOpcion
  } = useProductosTab(sucursalId);

  const mostrarFormularioProd = puedeCrear || editProdId;
  const mostrarFormularioGrupo = puedeCrear || editGrupoId;
  const noTienePermisoProd = editProdId ? !puedeEditar : !puedeCrear;
  const noTienePermisoGrupo = editGrupoId ? !puedeEditar : !puedeCrear;

  // ==========================================
  // 🛡️ ALERTAS SWEETALERT2: PRODUCTOS
  // ==========================================
  const handleCancelProdClick = () => {
    const tieneDatos = prodFormData.nombre || prodFormData.precio_venta > 0 || prodFormData.grupos_vinculados.length > 0;
    if (tieneDatos) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: "Los ajustes de precio o configuración no guardados se perderán.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', 
        cancelButtonColor: '#3085d6', 
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Seguir editando'
      }).then((result) => {
        if (result.isConfirmed) resetProdForm();
      });
    } else {
      resetProdForm();
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
      if (result.isConfirmed) handleDeleteProd(id); 
    });
  };

  // ==========================================
  // 🛡️ ALERTAS SWEETALERT2: GRUPOS MAESTROS
  // ==========================================
  const handleCancelGrupoClick = () => {
    const tieneDatos = grupoFormData.nombre_grupo || (grupoFormData.opciones.length > 0 && grupoFormData.opciones[0].subreceta_id);
    if (tieneDatos) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: "La configuración de opciones no guardada se perderá.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', 
        cancelButtonColor: '#3085d6', 
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Seguir editando'
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
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d', 
      confirmButtonText: 'Sí, eliminar grupo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) handleDeleteGrupo(id); 
    });
  };

  return (
    <div className={s.tabWrapper}>
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Ingeniería de Menú</h2>
        {loading && <span className={s.syncBadge}>ACTUALIZANDO...</span>}
      </header>

      {/* NAVEGACIÓN DE SUB-TABS */}
      <nav className={s.tabNav}>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'productos' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('productos')}
        >
          PLATILLOS DEL MENÚ
        </button>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'grupos' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('grupos')}
        >
           CATÁLOGO DE EXTRAS
        </button>
      </nav>

      {/* VISTA 1: PLATILLOS DEL MENÚ */}
      {activeSubTab === 'productos' && (
        <div className={mostrarFormularioProd ? s.splitLayout : s.fullLayout}>
          <aside className={`${s.adminCard} ${!mostrarFormularioProd ? s.hidden : ''}`}>
            <h3 className={s.cardTitle}>{editProdId ? 'Ajustar Producto' : 'Nuevo Producto'}</h3>
            
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
                      const rec = recetasCosteadas.find(r => r.nombre === val);
                      setProdFormData(prev => ({
                        ...prev, 
                        nombre: val, 
                        costo_referencia: rec ? rec.costo_final : 0,
                        precio_venta: prev.precio_venta || (rec && rec.precio_venta ? rec.precio_venta : "") 
                      }));
                    }}
                  />
                </div>
                <div className={s.formGroup} title="Costo de la Receta">
                  <label className={s.label}>COSTO</label>
                  <input 
                    type="text"
                    className={s.unitDisplayBox}
                    value={`$${(prodFormData.costo_referencia || 0).toFixed(2)}`}
                    readOnly
                    disabled
                    style={{ textAlign: 'center' }}
                  />
                </div>
              </div>

              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.label}>PRECIO PÚBLICO ($)</label>
                  <input 
                    type="number" step="0.01" placeholder="Ej.200"
                    className={`${s.inputField} ${s.fontWeight600} ${noTienePermisoProd ? s.inputDisabled : ''}`}
                    value={prodFormData.precio_venta} 
                    onChange={e => setProdFormData({...prodFormData, precio_venta: e.target.value})} 
                    required 
                    disabled={noTienePermisoProd}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>MARGEN NETO %</label>
                  <div className={s.unitDisplayBox} style={{ color: getMarginColor(prodFormData.margen_en_vivo), fontWeight: '700' }}>
                    {prodFormData.margen_en_vivo}%
                  </div>
                </div>
              </div>

              <div className={s.textMuted}>
                <label className={s.label}>VINCULAR GRUPOS DE EXTRAS</label>
                <SearchableSelect 
                  options={gruposMaestros.filter(g => !prodFormData.grupos_vinculados.includes(g.id))} 
                  value="" 
                  valueKey="id" 
                  labelKey="nombre"
                  placeholder="Seleccionar grupo ..."
                  disabled={noTienePermisoProd}
                  onChange={(val) => {
                    if (val) toggleGrupoEnProducto(val);
                  }}
                />

                <div className={s.textMuted} style={{ marginTop: '10px', flexWrap: 'wrap',fontSize: '13px' }}>
                  {prodFormData.grupos_vinculados.map(gId => {
                    const grupo = gruposMaestros.find(gm => gm.id === gId);
                    if (!grupo) return null;
                    return (
                      <div key={gId} className={s.badgeInteractive}>
                        <span>{grupo.nombre}</span>
                        {!noTienePermisoProd && (
                          <b className={s.badgeCloseBtn} onClick={() => toggleGrupoEnProducto(gId)}> × </b>
                        )}
                      </div>
                    );
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
                  onChange={(val) => setProdFormData({...prodFormData, categoria: val})}
                />
              </div>

              <div className={`${s.formColumn} ${s.marginTop10}`}>
                {!noTienePermisoProd && (
                  <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} disabled={loading}>
                    {loading ? '...' : (editProdId ? 'ACTUALIZAR' : 'GUARDAR EN MENÚ')}
                  </button>
                )}
                {editProdId && (
                  <button type="button" className={`${s.btn} ${s.btnDark} ${s.btnFull}`} onClick={handleCancelProdClick}>
                    {puedeEditar ? 'CANCELAR EDICIÓN' : 'CERRAR DETALLE'}
                  </button>
                )}
              </div>
            </form>
          </aside>

          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>PRODUCTO</th>
                  <th className={s.th}>CATEGORÍA</th>
                  <th className={s.th}>COSTO RECETA</th>
                  <th className={s.th}>VENTA (CON IVA)</th>
                  <th className={`${s.th} ${s.tdRight}`}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(p => {
                  const costoBase = p.costo_actual || 0;
                  const ventaBase = p.precio_venta || 0;
                  const netoBase = ventaBase / IVA_FACTOR;
                  const margenBase = netoBase > 0 ? (((netoBase - costoBase) / netoBase) * 100).toFixed(1) : 0;
                  const nombreCategoria = categorias.find(c => c.id === p.categoria)?.nombre || 'Sin categoría';

                  return (
                    <tr key={p.id}>
                      <td className={s.td}>
                        <div className={s.productTitle}>{p.nombre}</div>
                        <div className={s.textMuted}>
                          {(p.grupos || []).map(g => (
                            <span key={g.id} className={s.badge}>+ {g.nombre}</span>
                          ))}
                        </div>
                      </td>
                      <td className={s.td}>
                        <span className={s.textMuted}>
                          {nombreCategoria}
                        </span>
                      </td>
                      <td className={s.td}>${costoBase.toFixed(2)}</td>
                      <td className={s.td}>
                        <div className={s.priceValue}>${ventaBase.toFixed(2)}</div>
                        <div className={s.labelSmall} style={{ fontWeight: '700', color: getMarginColor(margenBase) }}>
                          {margenBase}% Margen Neto
                        </div>
                      </td>
                      <td className={`${s.td} ${s.tdRight}`}>
                        <div className={s.actionsWrapper}>
                          <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => handleEditProd(p)}>
                            {puedeEditar ? '📝' : '👁️'}
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
      )}

      {/* VISTA 2: CATÁLOGO DE GRUPOS MAESTROS (EXTRAS) */}
      {activeSubTab === 'grupos' && (
        <div className={mostrarFormularioGrupo ? s.splitLayout : s.fullLayout}>
          <aside className={`${s.adminCard} ${!mostrarFormularioGrupo ? s.hidden : ''}`}>
            <h3 className={s.cardTitle}>{editGrupoId ? 'Editar Grupo Maestro' : 'Crear Grupo Maestro'}</h3>
            
            <form onSubmit={handleSubmitGrupo} className={s.formColumn}>
              <div className={s.formGroup}>
                <label className={s.label}>NOMBRE DEL GRUPO</label>
                <input 
                  type="text" 
                  className={`${s.inputField} ${noTienePermisoGrupo ? s.inputDisabled : ''}`} 
                  placeholder="Ej. Elige tu Proteína, Extras..." 
                  value={grupoFormData.nombre_grupo} 
                  onChange={e => setGrupoFormData({...grupoFormData, nombre_grupo: e.target.value})} 
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
                    onChange={(e) => setGrupoFormData({...grupoFormData, obligatorio: e.target.checked})} 
                    disabled={noTienePermisoGrupo}
                  />
                  <span className={s.formGroup}>Selección Obligatoria</span>
                </label>
                <div className={s.formGroup}>
                  <label className={`${s.label} ${s.labelSmall}`} >MÁXIMO PERMITIDO</label>
                  <input 
                    type="number" min="0" step="1" 
                    className={`${s.inputField} ${noTienePermisoGrupo ? s.inputDisabled : ''}`} 
                    value={grupoFormData.maximo} 
                    onChange={e => {
                      // Corrección para evitar NaN: permitimos el string vacío momentáneamente
                      const val = e.target.value === "" ? "" : parseInt(e.target.value, 10);
                      setGrupoFormData({...grupoFormData, maximo: val});
                    }} 
                    required 
                    disabled={noTienePermisoGrupo}
                  />
                </div>
              </div>

              <hr className={s.hr} />

              <div className={`${s.formColumn} ${s.summaryBox}`}>
                <label className={s.label}>OPCIONES</label>
                
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
                          formatLabel={(opt) => `${opt.nombre} - $${(opt.costo_final || 0).toFixed(2)} por ${opt.unidad_abreviatura || 'unidad'}`}
                          disabled={noTienePermisoGrupo}
                          onChange={(val) => updateOpcion(idx, 'subreceta_id', val)}
                        />
                      </div>
                      
                      <div className={s.formGrid}>
                        <div className={s.formGroup}>
                          <label className={`${s.label} ${s.labelTiny}`}>CANTIDAD ({unidadAbrev})</label>
                          <input 
                            type="number" step="0.001" 
                            className={`${s.inputField} ${noTienePermisoGrupo ? s.inputDisabled : ''}`} 
                            value={opcion.cantidad} 
                            onChange={e => updateOpcion(idx, 'cantidad', e.target.value)} 
                            required 
                            disabled={noTienePermisoGrupo}
                          />
                        </div>
                        <div className={s.formGroup}>
                          <label className={`${s.label} ${s.labelTiny}`}>PRECIO</label>
                          <input 
                            type="number" step="0.01" 
                            className={`${s.inputField} ${noTienePermisoGrupo ? s.inputDisabled : ''}`} 
                            value={opcion.precio_venta} 
                            onChange={e => updateOpcion(idx, 'precio_venta', e.target.value)} 
                            required 
                            disabled={noTienePermisoGrupo}
                          />
                        </div>
                        <div className={s.formGroup}>
                          <label className={`${s.label} ${s.labelTiny}`}>MARGEN</label>
                          <div className={s.unitDisplayBox} style={{ color: getMarginColor(opcion.margen), fontWeight: '700' }}>
                            {opcion.margen}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {!noTienePermisoGrupo && (
                  <button type="button" onClick={addOpcion}                 className={`${s.btn} ${s.btnSuccess} ${s.btnSmall}`}
                                  style={{ alignSelf: "flex-end", marginTop: "3px" }}>
                    + AÑADIR OPCIÓN
                  </button>
                )}
              </div>

              <div className={`${s.formColumn} ${s.marginTop10}`}>
                {!noTienePermisoGrupo && (
                  <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} disabled={loading}>
                    {loading ? '...' : (editGrupoId ? 'ACTUALIZAR GRUPO MAESTRO' : 'GUARDAR GRUPO MAESTRO')}
                  </button>
                )}
                {editGrupoId && (
                  <button type="button" className={`${s.btn} ${s.btnDark} ${s.btnFull}`} onClick={handleCancelGrupoClick}>
                    {puedeEditar ? 'CANCELAR EDICIÓN' : 'CERRAR DETALLE'}
                  </button>
                )}
              </div>
            </form>
          </aside>

          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>GRUPO MAESTRO</th>
                  <th className={s.th}>OPCIONES (DETALLE OPERATIVO)</th>
                  <th className={`${s.th} ${s.tdRight}`}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {gruposMaestros.map(g => (
                  <tr key={g.id}>
                    <td className={s.td}>
                      <div className={s.productTitle}>{g.nombre}</div>
                      <small className={s.textMuted}>{g.min_seleccion > 0 ? 'Obligatorio' : 'Opcional'} • Máx: {g.max_seleccion}</small>
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
                              <span className={s.labelSmall} style={{ fontWeight: '700',color: getMarginColor(mSub), marginLeft: '5px' }}>{mSub}% Margen</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className={`${s.td} ${s.tdRight}`}>
                      <div className={s.actionsWrapper}>
                        <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => handleEditGrupo(g)}>
                          {puedeEditar ? '📝' : '👁️'}
                        </button>
                        {puedeBorrar && (
                          <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => confirmDeleteGrupo(g.id, g.nombre)}>
                            ❌
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * SearchableSelect Homologado y Corregido
 */
const SearchableSelect = ({ options, value, onChange, disabled, placeholder = "Buscar...", valueKey = "id", labelKey = "nombre", formatLabel }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Sincronizar el texto con el valor seleccionado
  useEffect(() => {
    const selected = options.find((opt) => String(opt[valueKey]) === String(value));
    setSearchTerm(selected ? selected[labelKey] : "");
  }, [value, options, valueKey, labelKey]);

  // Manejar cierre al hacer clic fuera
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

  const filteredOptions = options.filter(opt =>
    String(opt[labelKey] || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={s.relative} ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        className={`${s.inputField} ${disabled ? s.inputDisabled : ''}`}
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
          position: 'absolute', 
          zIndex: 1000, 
          width: '100%', 
          maxHeight: '200px', 
          overflowY: 'auto',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: 0,
          margin: '4px 0 0 0',
          listStyle: 'none'
        }}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, index) => (
            <li 
              key={index} 
              className={s.dropdownItem} 
              style={{ padding: '8px 12px', cursor: 'pointer' }}
              onMouseDown={(e) => { 
                e.preventDefault(); // Previene el blur del input antes del clic
                onChange(opt[valueKey]); 
                setSearchTerm(opt[labelKey]); 
                setIsOpen(false); 
              }}
            >
              {formatLabel ? formatLabel(opt) : opt[labelKey]}
            </li>
          )) : <li className={s.dropdownItemMuted} style={{ padding: '8px 12px', color: '#999' }}>Sin resultados...</li>}
        </ul>
      )}
    </div>
  );
};

export default ProductosTab;