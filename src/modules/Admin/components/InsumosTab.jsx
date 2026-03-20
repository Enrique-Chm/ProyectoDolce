// Archivo: src/modules/Admin/components/InsumosTab.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import s from '../AdminPage.module.css';
import { hasPermission } from '../../../utils/checkPermiso';

export const InsumosTab = ({ sucursalId }) => {
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  /**
   * 🛡️ SEGURIDAD INTERNA (RBAC)
   * Alineamos las claves con el sistema robusto de la DB
   */
  const puedeEditar = hasPermission('editar_insumos');
  const puedeBorrar = hasPermission('borrar_insumos'); // Actualizado para ser específico del módulo

  const [formData, setFormData] = useState({
    nombre: '',
    modelo: '',
    proveedor: '',
    caja_master: '',
    costo_por_caja: '',
    contenido_neto: '',
    unidad_medida: '',
    factor_rendimiento: '1.00',
    dias_reabastecimiento: '',
    categoria: ''
  });

  useEffect(() => { 
    fetchData(); 
  }, [sucursalId]);

  const fetchData = async () => {
    setLoading(true);
    const [ins, prov, uni, cat] = await Promise.all([
      supabase
        .from('lista_insumo')
        .select('*, proveedores(nombre_empresa), cat_unidades_medida(abreviatura), cat_categoria_insumos(nombre)')
        .eq('sucursal_id', sucursalId)
        .order('nombre'),
      supabase.from('proveedores').select('id, nombre_empresa'),
      supabase.from('cat_unidades_medida').select('id, nombre, abreviatura'),
      supabase.from('cat_categoria_insumos').select('id, nombre')
    ]);

    setInsumos(ins.data || []);
    setProveedores(prov.data || []);
    setUnidades(uni.data || []);
    setCategorias(cat.data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Bloqueo de seguridad en la función
    if (!puedeEditar) return; 

    // Validación para evitar combos vacíos
    if (!formData.categoria) return alert("Por favor selecciona una Categoría válida.");
    if (!formData.proveedor) return alert("Por favor selecciona un Proveedor válido.");
    if (!formData.unidad_medida) return alert("Por favor selecciona una Unidad de Medida válida.");

    setLoading(true);

    const costoCaja = parseFloat(formData.costo_por_caja) || 0;
    const contenido = parseFloat(formData.contenido_neto) || 1;

    const payload = {
      nombre: formData.nombre,
      modelo: formData.modelo,
      proveedor: parseInt(formData.proveedor),
      caja_master: parseInt(formData.caja_master) || 0,
      costo_por_caja: costoCaja,
      contenido_neto: contenido,
      unidad_medida: parseInt(formData.unidad_medida),
      costo_unitario: costoCaja / contenido,
      factor_rendimiento: parseFloat(formData.factor_rendimiento) || 1,
      dias_reabastecimiento: parseInt(formData.dias_reabastecimiento) || 0,
      categoria: parseInt(formData.categoria),
      sucursal_id: sucursalId,
      update_at: new Date().toISOString()
    };

    const { error } = editId 
      ? await supabase.from('lista_insumo').update(payload).eq('id', editId)
      : await supabase.from('lista_insumo').insert([payload]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setEditId(null);
      resetForm();
      fetchData();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      nombre: '', modelo: '', proveedor: '', caja_master: '',
      costo_por_caja: '', contenido_neto: '', unidad_medida: '',
      factor_rendimiento: '1.00', dias_reabastecimiento: '', categoria: ''
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 className={s.pageTitle}>
          Gestión de Insumos
        </h2>
        {loading && <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '700' }}>ACTUALIZANDO...</span>}
      </header>

      <div className={s.splitLayout}>
        
        {/* FORMULARIO LATERAL: Se protege la edición */}
        <aside className={s.adminCard}>
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
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              {/* Solo mostramos el botón de acción si tiene permiso de editar */}
              {puedeEditar && (
                <button 
                  type="submit" 
                  className={`${s.btn} ${s.btnPrimary}`}
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? '...' : (editId ? 'ACTUALIZAR' : 'GUARDAR')}
                </button>
              )}
              {editId && (
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className={`${s.btn} ${s.btnOutlineDanger}`}
                >
                  {puedeEditar ? 'CANCELAR' : 'VOLVER'}
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* TABLA DE INSUMOS RESPONSIVA */}
        <div className={`${s.adminCard} ${s.tableContainer}`}>
          <table className={s.table} style={{ minWidth: '700px' }}>
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
                    No hay insumos registrados.
                  </td>
                </tr>
              ) : (
                insumos.map(i => (
                  <tr key={i.id} style={{ borderBottom: '1px solid var(--color-bg-muted)', backgroundColor: editId === i.id ? 'var(--color-bg-app)' : 'transparent' }}>
                    <td className={s.td}>
                      <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{i.nombre}</div>
                      <small style={{ color: 'var(--color-text-muted)', fontWeight: '600' }}>
                        {i.modelo} | {i.proveedores?.nombre_empresa}
                      </small>
                    </td>
                    <td className={s.td}>
                      <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>${i.costo_unitario?.toFixed(2)}</div>
                      <small style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>por {i.cat_unidades_medida?.abreviatura}</small>
                    </td>
                    <td className={s.td}>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>{i.cat_categoria_insumos?.nombre}</div>
                      <small style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{i.dias_reabastecimiento} días reabast.</small>
                    </td>
                    <td className={s.td} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => {setEditId(i.id); setFormData({...i});}} 
                          className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} 
                        >
                          {puedeEditar ? '📝' : '👁️'}
                        </button>
                        
                        {/* Botón de Borrar protegido específicamente */}
                        {puedeBorrar && (
                          <button 
                            className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} 
                            onClick={async () => { if(window.confirm('¿Borrar insumo?')) { await supabase.from('lista_insumo').delete().eq('id', i.id); fetchData(); } }}
                          >
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

/**
 * SUB-COMPONENTE MEJORADO: SearchableSelect 
 * Soporta diferentes llaves para value (valueKey) y label (labelKey).
 */
const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  disabled, 
  placeholder = "Buscar...",
  valueKey = "id", 
  labelKey = "nombre",
  formatLabel
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find((opt) => String(opt[valueKey]) === String(value));
    if (selected) {
      setSearchTerm(selected[labelKey]);
    } else {
      setSearchTerm("");
    }
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
        style={{ backgroundColor: disabled ? "var(--color-bg-app)" : "white" }}
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
            if (selected) setSearchTerm(selected[labelKey]);
            else setSearchTerm("");
          }, 200);
        }}
      />
      
      {isOpen && !disabled && (
        <ul className={s.dropdownList}>
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
          )) : (
            <li className={s.dropdownItem} style={{ color: 'var(--color-text-muted)' }}>
              No se encontraron coincidencias...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};