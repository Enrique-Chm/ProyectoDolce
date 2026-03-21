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
  const [activeSubTab, setActiveSubTab] = useState('productos'); // 'productos' | 'grupos'

  const {
    productos, categorias, recetasCosteadas, subrecetasDisponibles, gruposMaestros, loading,
    puedeCrear, puedeEditar, puedeBorrar,
    editProdId, prodFormData, setProdFormData, handleSubmitProducto, handleEditProd, handleDeleteProd, resetProdForm, toggleGrupoEnProducto,
    editGrupoId, grupoFormData, setGrupoFormData, handleSubmitGrupo, handleEditGrupo, handleDeleteGrupo, resetGrupoForm, addOpcion, removeOpcion, updateOpcion
  } = useProductosTab(sucursalId);

  const mostrarFormularioProd = puedeCrear || editProdId;
  const mostrarFormularioGrupo = puedeCrear || editGrupoId;

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

      {/* ============================================================== */}
      {/* VISTA 1: PLATILLOS DEL MENÚ */}
      {/* ============================================================== */}
      {activeSubTab === 'productos' && (
        <div className={mostrarFormularioProd ? s.splitLayout : s.fullLayout}>
          <aside className={s.adminCard} style={{ display: mostrarFormularioProd ? 'block' : 'none' }}>
            <h3 className={s.cardTitle}>{editProdId ? 'Ajustar Producto' : 'Nuevo Producto'}</h3>
            
            <form onSubmit={handleSubmitProducto} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className={s.formGroup} style={{ flex: 1 }}>
                  <label className={s.label}>RECETA PRINCIPAL</label>
                  <SearchableSelect 
                    options={recetasCosteadas} 
                    value={prodFormData.nombre} 
                    valueKey="nombre" 
                    labelKey="nombre"
                    placeholder="Buscar receta costeada..."
                    formatLabel={(opt) => `${opt.nombre} ($${opt.costo_final.toFixed(2)})`}
                    disabled={editProdId ? !puedeEditar : !puedeCrear}
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
                <div className={s.formGroup} style={{ width: '80px' }} title="Costo de la Receta">
                  <label className={s.label}>COSTO</label>
                  <input 
                    type="text" 
                    className={s.inputField}
                    value={`$${(prodFormData.costo_referencia || 0).toFixed(2)}`}
                    readOnly
                    disabled
                    style={{ 
                      backgroundColor: "var(--color-bg-muted)", 
                      textAlign: "center", 
                      fontWeight: "bold",
                      color: "var(--color-text-main)",
                      cursor: "not-allowed",
                      padding: "8px 4px"
                    }}
                  />
                </div>
              </div>

              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.label}>PRECIO PÚBLICO ($)</label>
                  <input 
                    type="number" step="0.01" className={s.inputField}
                    style={{ fontWeight: '600', backgroundColor: (editProdId ? !puedeEditar : !puedeCrear) ? "var(--color-bg-muted)" : "white" }}
                    value={prodFormData.precio_venta} 
                    onChange={e => setProdFormData({...prodFormData, precio_venta: e.target.value})} 
                    required readOnly={editProdId ? !puedeEditar : !puedeCrear} 
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>MARGEN NETO %</label>
                  <div className={s.unitDisplayBox} style={{ fontWeight: '700', color: getMarginColor(prodFormData.margen_en_vivo) }}>
                    {prodFormData.margen_en_vivo}%
                  </div>
                </div>
              </div>

              <div className={s.formGroup} style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '15px' }}>
                <label className={s.label}>VINCULAR GRUPOS DE EXTRAS</label>
                <SearchableSelect 
                  options={gruposMaestros.filter(g => !prodFormData.grupos_vinculados.includes(g.id))} 
                  value="" 
                  valueKey="id" 
                  labelKey="nombre"
                  placeholder="Buscar grupo para añadir..."
                  disabled={editProdId ? !puedeEditar : !puedeCrear}
                  onChange={(val) => {
                    if (val) toggleGrupoEnProducto(val);
                  }}
                />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {prodFormData.grupos_vinculados.map(gId => {
                    const grupo = gruposMaestros.find(gm => gm.id === gId);
                    if (!grupo) return null;
                    return (
                      <div key={gId} className={s.badge} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--color-primary)', color: 'white' }}>
                        <span>{grupo.nombre}</span>
                        {(editProdId ? puedeEditar : puedeCrear) && (
                          <b 
                            style={{ cursor: 'pointer', fontSize: '12px', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '8px' }} 
                            onClick={() => toggleGrupoEnProducto(gId)}
                          > × </b>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={s.formGroup} style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '15px' }}>
                <label className={s.label}>CATEGORÍA EN MENÚ</label>
                <SearchableSelect 
                  options={categorias} 
                  value={prodFormData.categoria} 
                  valueKey="id" 
                  labelKey="nombre"
                  placeholder="Seleccionar categoría..."
                  disabled={editProdId ? !puedeEditar : !puedeCrear}
                  onChange={(val) => setProdFormData({...prodFormData, categoria: val})}
                />
              </div>

              <div className={s.flexColumnGap10} style={{ marginTop: '10px' }}>
                {(editProdId ? puedeEditar : puedeCrear) && (
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
            {/* 💡 Aumenté ligeramente el minWidth para acomodar la nueva columna */}
            <table className={s.table} style={{ minWidth: '700px', width: '100%' }}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>PRODUCTO</th>
                  <th className={s.th}>CATEGORÍA</th> {/* 👈 NUEVA COLUMNA */}
                  <th className={s.th}>COSTO RECETA</th>
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
                  
                  // 💡 Buscamos el nombre de la categoría usando su ID
                  const nombreCategoria = categorias.find(c => c.id === p.categoria)?.nombre || 'Sin categoría';

                  return (
                    <tr key={p.id}>
                      <td className={s.td}>
                        <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{p.nombre}</div>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                          {(p.grupos || []).map(g => (
                            <span key={g.id} className={s.badge} style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '10px' }}>+ {g.nombre}</span>
                          ))}
                        </div>
                      </td>
                      {/* 👈 NUEVA CELDA: CATEGORÍA */}
                      <td className={s.td}>
                        <span className={s.badge} style={{ background: '#f3f4f6', color: '#4b5563', fontSize: '11px', fontWeight: '500', padding: '4px 8px' }}>
                          {nombreCategoria}
                        </span>
                      </td>
                      <td className={s.td}>${costoBase.toFixed(2)}</td>
                      <td className={s.td}>
                        <div className={s.totalAmount} style={{ color: 'var(--color-primary)' }}>${ventaBase.toFixed(2)}</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: getMarginColor(margenBase) }}>
                          {margenBase}% Margen Real
                        </div>
                      </td>
                      <td className={s.td} style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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

      {/* ============================================================== */}
      {/* VISTA 2: CATÁLOGO DE GRUPOS MAESTROS (EXTRAS) */}
      {/* ============================================================== */}
      {activeSubTab === 'grupos' && (
        <div className={mostrarFormularioGrupo ? s.splitLayout : s.fullLayout}>
          <aside className={s.adminCard} style={{ display: mostrarFormularioGrupo ? 'block' : 'none' }}>
            <h3 className={s.cardTitle}>{editGrupoId ? 'Editar Grupo Maestro' : 'Crear Grupo Maestro'}</h3>
            
            <form onSubmit={handleSubmitGrupo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className={s.formGroup}>
                <label className={s.label}>NOMBRE DEL GRUPO</label>
                <input 
                  type="text" 
                  className={s.inputField} 
                  placeholder="Ej. Elige tu Proteína, Extras..." 
                  value={grupoFormData.nombre_grupo} 
                  onChange={e => setGrupoFormData({...grupoFormData, nombre_grupo: e.target.value})} 
                  required readOnly={editGrupoId ? !puedeEditar : !puedeCrear}
                />
              </div>

              <div className={s.formGrid} style={{ marginBottom: '5px' }}>
                <label className={s.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    className={s.checkbox} 
                    checked={grupoFormData.obligatorio} 
                    onChange={(e) => setGrupoFormData({...grupoFormData, obligatorio: e.target.checked})} 
                    disabled={editGrupoId ? !puedeEditar : !puedeCrear}
                  />
                  <span>Selección Obligatoria</span>
                </label>
                <div className={s.formGroup} style={{ marginBottom: -10 }}>
                  <label className={s.label} >MÁXIMO PERMITIDO</label>
                  <input 
                    type="number" min="1" step="1" 
                    className={s.inputField} 
                    value={grupoFormData.maximo} 
                    onChange={e => setGrupoFormData({...grupoFormData, maximo: parseInt(e.target.value)})} 
                    required readOnly={editGrupoId ? !puedeEditar : !puedeCrear}
                  />
                </div>
              </div>

              <hr className={s.hr} />

              <div className={s.flexColumnGap10} style={{ padding: '15px', background: 'var(--color-bg-muted)', borderRadius: '8px' }}>
                <label className={s.label}>OPCIONES (COSTEO E INVENTARIO)</label>
                
                {grupoFormData.opciones.map((opcion, idx) => {
                  const subData = subrecetasDisponibles.find(s => s.nombre === opcion.subreceta_id);
                  const unidadAbrev = subData?.unidad_abreviatura || "Pz";

                  return (
                    <div key={idx} className={s.itemCardRelative} style={{ background: 'white', padding: '10px' }}>
                      {(editGrupoId ? puedeEditar : puedeCrear) && (
                        <button type="button" className={`${s.btnSecondary} ${s.btnRemoveCircle} ${s.btnSmall}`} onClick={() => removeOpcion(idx)} style={{top:'5px', right:'5px'}}>X</button>
                      )}
                      
                      <div style={{ marginBottom: '10px', paddingRight: '20px' }}>
                        <SearchableSelect 
                          options={subrecetasDisponibles} 
                          value={opcion.subreceta_id} 
                          valueKey="nombre" 
                          labelKey="nombre"
                          placeholder="Buscar preparación..." 
                          formatLabel={(opt) => `${opt.nombre} - $${opt.costo_final.toFixed(2)} por ${opt.unidad_abreviatura || 'unidad'}`}
                          disabled={editGrupoId ? !puedeEditar : !puedeCrear}
                          onChange={(val) => updateOpcion(idx, 'subreceta_id', val)}
                        />
                      </div>
                      
                      <div className={s.formGrid} style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
                        <div>
                          <label className={s.label}>CANTIDAD ({unidadAbrev})</label>
                          <input 
                            type="number" step="0.001" 
                            className={s.inputField} 
                            value={opcion.cantidad} 
                            onChange={e => updateOpcion(idx, 'cantidad', e.target.value)} 
                            required readOnly={editGrupoId ? !puedeEditar : !puedeCrear}
                          />
                        </div>
                        <div>
                          <label className={s.label}>PRECIO</label>
                          <input 
                            type="number" step="0.01" 
                            className={s.inputField} 
                            value={opcion.precio_venta} 
                            onChange={e => updateOpcion(idx, 'precio_venta', e.target.value)} 
                            required readOnly={editGrupoId ? !puedeEditar : !puedeCrear}
                          />
                        </div>
                        <div>
                          <label className={s.label}>MARGEN</label>
                          <div className={s.unitDisplayBox} style={{ width:'100%', fontSize: '15px', fontWeight: '700', color: getMarginColor(opcion.margen) }}>
                            {opcion.margen}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {(editGrupoId ? puedeEditar : puedeCrear) && (
                  <button type="button" onClick={addOpcion} className={`${s.btn} ${s.btnOutlineEditar} ${s.btnSmall}`} style={{ alignSelf: 'flex-start' }}>
                    + AÑADIR OPCIÓN
                  </button>
                )}
              </div>

              <div className={s.flexColumnGap10} style={{ marginTop: '10px' }}>
                {(editGrupoId ? puedeEditar : puedeCrear) && (
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
            <table className={s.table} style={{ minWidth: '500px', width: '100%' }}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>GRUPO MAESTRO</th>
                  <th className={s.th}>OPCIONES (DETALLE OPERATIVO)</th>
                  <th className={s.th} style={{textAlign:'right'}}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {gruposMaestros.map(g => (
                  <tr key={g.id}>
                    <td className={s.td}>
                      <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{g.nombre}</div>
                      <small className={s.textMuted}>{g.min_seleccion > 0 ? 'Obligatorio' : 'Opcional'} • Máx: {g.max_seleccion}</small>
                    </td>
                    <td className={s.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {(g.opciones_modificadores || []).map((op, i) => {
                          const vNeta = parseFloat(op.precio_venta) / IVA_FACTOR;
                          const subData = subrecetasDisponibles.find(s => s.nombre === op.subreceta_id);
                          const unidadAbrev = subData?.unidad_abreviatura || "Pz";
                          const cSub = (subData ? subData.costo_final : 0) * (op.cantidad || 1);
                          const mSub = vNeta > 0 ? (((vNeta - cSub) / vNeta) * 100).toFixed(1) : 0;

                          return (
                            <div key={i} style={{ fontSize: '12px', padding: '2px 0' }}>
                              • <span style={{ fontWeight: 'bold' }}>{op.cantidad || 1} {unidadAbrev}</span> de {op.subreceta_id} (+${parseFloat(op.precio_venta).toFixed(2)}) 
                              <span style={{ color: getMarginColor(mSub), fontWeight: 'bold', marginLeft: '5px' }}>{mSub}% Margen</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className={s.td} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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

const SearchableSelect = ({ options, value, onChange, disabled, placeholder = "Buscar...", valueKey = "id", labelKey = "nombre", formatLabel }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find((opt) => String(opt[valueKey]) === String(value));
    setSearchTerm(selected ? selected[labelKey] : "");
  }, [value, options, valueKey, labelKey]);

  const filteredOptions = options.filter(opt =>
    String(opt[labelKey] || "").toLowerCase().includes(searchTerm.toLowerCase())
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
            const selected = options.find((opt) => String(opt[valueKey]) === String(value));
            setSearchTerm(selected ? selected[labelKey] : "");
          }, 200);
        }}
        style={{ backgroundColor: disabled ? "var(--color-bg-muted)" : "white" }}
      />
      {isOpen && !disabled && (
        <ul className={s.dropdownList} style={{ zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, index) => (
            <li 
              key={index} 
              className={s.dropdownItem} 
              onMouseDown={(e) => { 
                e.preventDefault(); 
                onChange(opt[valueKey]); 
                setSearchTerm(opt[labelKey]); 
                setIsOpen(false); 
              }}
            >
              {formatLabel ? formatLabel(opt) : opt[labelKey]}
            </li>
          )) : <li className={s.dropdownItem} style={{ color: 'var(--color-text-muted)' }}>Sin resultados...</li>}
        </ul>
      )}
    </div>
  );
};