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
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)', margin: 0 }}>
          Gestión de Insumos
        </h2>
        {loading && <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '700' }}>ACTUALIZANDO...</span>}
      </header>

      <div className="admin-split-layout-sidebar">
        
        {/* FORMULARIO LATERAL: Se protege la edición */}
        <aside className={s.adminCard} style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
            {editId ? (puedeEditar ? '📝 Editar Insumo' : '👁️ Ver Insumo') : '📦 Nuevo Insumo'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE COMERCIAL</label>
              <input 
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                value={formData.nombre} 
                onChange={e => setFormData({...formData, nombre: e.target.value})} 
                required 
                readOnly={!puedeEditar} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>MODELO / VARIANTE</label>
              <input 
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                value={formData.modelo} 
                onChange={e => setFormData({...formData, modelo: e.target.value})} 
                required 
                readOnly={!puedeEditar} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>CATEGORÍA</label>
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
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>PROVEEDOR</label>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>COSTO CAJA ($)</label>
                <input 
                  type="number" step="0.01" 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  value={formData.costo_por_caja} 
                  onChange={e => setFormData({...formData, costo_por_caja: e.target.value})} 
                  required 
                  readOnly={!puedeEditar} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>CONT. NETO</label>
                <input 
                  type="number" step="0.01" 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  value={formData.contenido_neto} 
                  onChange={e => setFormData({...formData, contenido_neto: e.target.value})} 
                  required 
                  readOnly={!puedeEditar} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>UNIDAD DE MEDIDA</label>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>RENDIMIENTO %</label>
                <input 
                  type="number" step="0.01" 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  value={formData.factor_rendimiento} 
                  onChange={e => setFormData({...formData, factor_rendimiento: e.target.value})} 
                  readOnly={!puedeEditar} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>DÍAS REABAST.</label>
                <input 
                  type="number" 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
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
                  className={s.btnLogout} 
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', flex: 1, padding: '12px' }} 
                  disabled={loading}
                >
                  {loading ? '...' : (editId ? 'ACTUALIZAR' : 'GUARDAR')}
                </button>
              )}
              {editId && (
                <button type="button" onClick={resetForm} className={s.btnLogout} style={{ padding: '12px' }}>
                  {puedeEditar ? 'CANCELAR' : 'VOLVER'}
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* TABLA DE INSUMOS RESPONSIVA */}
        <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>INSUMO / VARIANTE</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>COSTO UNIT.</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>CATEGORÍA</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>ACCIONES</th>
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
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '800', color: 'var(--color-text-main)' }}>{i.nombre}</div>
                      <small style={{ color: 'var(--color-text-muted)', fontWeight: '600' }}>
                        {i.modelo} | {i.proveedores?.nombre_empresa}
                      </small>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '800', color: 'var(--color-primary)' }}>${i.costo_unitario?.toFixed(2)}</div>
                      <small style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>por {i.cat_unidades_medida?.abreviatura}</small>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>{i.cat_categoria_insumos?.nombre}</div>
                      <small style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{i.dias_reabastecimiento} días reabast.</small>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => {setEditId(i.id); setFormData({...i});}} 
                          className={s.btnLogout} 
                          style={{ padding: '5px 10px', fontSize: '11px' }}
                        >
                          {puedeEditar ? 'EDITAR' : 'VER'}
                        </button>
                        
                        {/* Botón de Borrar protegido específicamente */}
                        {puedeBorrar && (
                          <button 
                            className={s.btnLogout} 
                            style={{ padding: '5px 10px', fontSize: '11px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                            onClick={async () => { if(confirm('¿Borrar insumo?')) { await supabase.from('lista_insumo').delete().eq('id', i.id); fetchData(); } }}
                          >
                            BORRAR
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
        value={searchTerm}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "var(--radius-ui)",
          border: "1px solid var(--color-border)",
          fontSize: "14px",
          boxSizing: "border-box",
          backgroundColor: disabled ? "var(--color-bg-app)" : "white"
        }}
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
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '200px',
          overflowY: 'auto',
          background: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-ui)',
          zIndex: 1000,
          margin: '4px 0 0 0',
          padding: 0,
          listStyle: 'none',
          boxShadow: 'var(--shadow-ui)'
        }}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, index) => (
            <li
              key={index}
              style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid var(--color-bg-muted)', fontSize: '13px' }}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt[valueKey]);
                setSearchTerm(opt[labelKey]);
                setIsOpen(false);
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-bg-app)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {formatLabel ? formatLabel(opt) : opt[labelKey]}
            </li>
          )) : (
            <li style={{ padding: '10px 15px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              No se encontraron coincidencias...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};