// Archivo: src/modules/Admin/components/InsumosTab.jsx
import React, { useState, useEffect } from 'react';
import s from '../AdminPage.module.css';
import { useInsumosTab } from '../../../hooks/useInsumosTab';
import Swal from 'sweetalert2';

export const InsumosTab = ({ sucursalId }) => {
  const {
    insumos, proveedores, unidades, categorias, loading, editId, formData, setFormData,
    puedeEditar, puedeBorrar,
    handleSubmit, resetForm, handleDelete, prepararEdicion
  } = useInsumosTab(sucursalId);

  // 💡 Lógica de Diseño Dinámico
  const mostrarFormulario = puedeEditar || editId;

  const handleCancelClick = () => {
    const tieneDatos = formData.nombre || formData.costo_por_caja;
    if (tieneDatos) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: "La información no guardada se perderá.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Continuar'
      }).then((result) => {
        if (result.isConfirmed) resetForm();
      });
    } else {
      resetForm();
    }
  };

  const confirmDelete = (id, nombre) => {
    Swal.fire({
      title: `¿Eliminar "${nombre}"?`,
      text: "Esto afectará el costeo de las recetas que usen este insumo.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar definitivamente'
    }).then((result) => {
      if (result.isConfirmed) handleDelete(id);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 className={s.pageTitle}>Gestión de Insumos</h2>
        {loading && <span className={s.syncBadge}>ACTUALIZANDO...</span>}
      </header>

      <div className={mostrarFormulario ? s.splitLayout : s.fullLayout}>
        
        <aside className={s.adminCard} style={{ display: mostrarFormulario ? 'block' : 'none' }}>
          <h3 className={s.cardTitle}>
            {editId ? (puedeEditar ? ' Editar Insumo' : ' Ver Insumo') : ' Nuevo Insumo'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className={s.formGroup}>
              <label className={s.label}>NOMBRE COMERCIAL</label>
              <input 
                className={s.inputField}
                value={formData.nombre} 
                onChange={e => setFormData({...formData, nombre: e.target.value})} 
                required 
                readOnly={!puedeEditar} 
                style={{ backgroundColor: !puedeEditar ? "var(--color-bg-muted)" : "white" }}
              />
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>MODELO / VARIANTE</label>
              <input 
                className={s.inputField}
                value={formData.modelo} 
                onChange={e => setFormData({...formData, modelo: e.target.value})} 
                required 
                readOnly={!puedeEditar} 
                style={{ backgroundColor: !puedeEditar ? "var(--color-bg-muted)" : "white" }}
              />
            </div>

            <div className={s.formGrid}>
              <div className={s.formGroup}>
                <label className={s.label}>CATEGORÍA</label>
                <SearchableSelect 
                  options={categorias}
                  value={formData.categoria}
                  valueKey="id"
                  labelKey="nombre"
                  placeholder="Seleccionar..."
                  disabled={!puedeEditar}
                  onChange={(val) => setFormData({...formData, categoria: val})}
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>PROVEEDOR</label>
                <SearchableSelect 
                  options={proveedores}
                  value={formData.proveedor}
                  valueKey="id"
                  labelKey="nombre_empresa"
                  placeholder="Seleccionar..."
                  disabled={!puedeEditar}
                  onChange={(val) => setFormData({...formData, proveedor: val})}
                />
              </div>
            </div>

            <div className={s.formGrid}>
              <div className={s.formGroup}>
                <label className={s.label}>COSTO CAJA ($)</label>
                <input 
                  type="number" step="0.01" 
                  className={s.inputField}
                  value={formData.costo_por_caja} 
                  onChange={e => setFormData({...formData, costo_por_caja: e.target.value})} 
                  required 
                  readOnly={!puedeEditar} 
                  style={{ backgroundColor: !puedeEditar ? "var(--color-bg-muted)" : "white" }}
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>CONT. NETO</label>
                <input 
                  type="number" step="0.01" 
                  className={s.inputField}
                  value={formData.contenido_neto} 
                  onChange={e => setFormData({...formData, contenido_neto: e.target.value})} 
                  required 
                  readOnly={!puedeEditar} 
                  style={{ backgroundColor: !puedeEditar ? "var(--color-bg-muted)" : "white" }}
                />
              </div>
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>UNIDAD DE MEDIDA</label>
              <SearchableSelect 
                options={unidades}
                value={formData.unidad_medida}
                valueKey="id"
                labelKey="nombre"
                placeholder="Seleccionar unidad..."
                formatLabel={(opt) => `${opt.nombre} (${opt.abreviatura})`}
                disabled={!puedeEditar}
                onChange={(val) => setFormData({...formData, unidad_medida: val})}
              />
            </div>

            <div className={s.formGrid}>
              <div className={s.formGroup}>
                <label className={s.label}>RENDIMIENTO %</label>
                <input 
                  type="number" step="0.01" 
                  className={s.inputField}
                  value={formData.factor_rendimiento} 
                  onChange={e => setFormData({...formData, factor_rendimiento: e.target.value})} 
                  readOnly={!puedeEditar} 
                  style={{ backgroundColor: !puedeEditar ? "var(--color-bg-muted)" : "white" }}
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>DÍAS REABAST.</label>
                <input 
                  type="number" 
                  className={s.inputField}
                  value={formData.dias_reabastecimiento} 
                  onChange={e => setFormData({...formData, dias_reabastecimiento: e.target.value})} 
                  readOnly={!puedeEditar} 
                  style={{ backgroundColor: !puedeEditar ? "var(--color-bg-muted)" : "white" }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              {puedeEditar && (
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1 }} disabled={loading}>
                  {loading ? '...' : (editId ? 'ACTUALIZAR' : 'GUARDAR')}
                </button>
              )}
              {editId && (
                <button type="button" onClick={handleCancelClick} className={`${s.btn} ${s.btnDark}`} style={{ flex: 1 }}>
                  {puedeEditar ? 'CANCELAR' : 'VOLVER'}
                </button>
              )}
            </div>
          </form>
        </aside>

        <div className={`${s.adminCard} ${s.tableContainer}`}>
          <table className={s.table} style={{ minWidth: '700px', width: '100%' }}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th}>INSUMO / VARIANTE</th>
                <th className={s.th}>COSTO UNIT.</th>
                <th className={s.th}>CATEGORÍA</th>
                <th className={s.th} style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {insumos.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    {loading ? 'Cargando insumos...' : 'No hay insumos registrados.'}
                  </td>
                </tr>
              ) : (
                insumos.map(i => (
                  <tr key={i.id} style={{ backgroundColor: editId === i.id ? 'var(--color-bg-app)' : 'transparent' }}>
                    <td className={s.td}>
                      <div style={{ fontWeight: '600' }}>{i.nombre}</div>
                      <small className={s.textMuted} style={{ fontWeight: '600' }}>
                        {i.modelo} | {i.proveedores?.nombre_empresa}
                      </small>
                    </td>
                    <td className={s.td}>
                      <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>${i.costo_unitario?.toFixed(2)}</div>
                      <small style={{ fontSize: '10px' }}>por {i.cat_unidades_medida?.abreviatura}</small>
                    </td>
                    <td className={s.td}>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>{i.cat_categoria_insumos?.nombre}</div>
                      <small style={{ fontSize: '10px' }}>{i.dias_reabastecimiento} días reabast.</small>
                    </td>
                    <td className={s.td} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                        <button onClick={() => prepararEdicion(i)} className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`}>
                          {puedeEditar ? '📝' : '👁️'}
                        </button>
                        {puedeBorrar && (
                          <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => confirmDelete(i.id, i.nombre)}>
                            ❌
                          </button>
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
    </div>
  );
};

// SearchableSelect Sub-component (Se mantiene igual para consistencia)
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
        style={{ backgroundColor: disabled ? "var(--color-bg-muted)" : "white" }}
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
      />
      {isOpen && !disabled && (
        <ul className={s.dropdownList} style={{ zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, index) => (
            <li key={index} className={s.dropdownItem} onMouseDown={(e) => { e.preventDefault(); onChange(opt[valueKey]); setSearchTerm(opt[labelKey]); setIsOpen(false); }}>
              {formatLabel ? formatLabel(opt) : opt[labelKey]}
            </li>
          )) : <li className={s.dropdownItem} style={{ color: 'var(--color-text-muted)' }}>Sin resultados...</li>}
        </ul>
      )}
    </div>
  );
};