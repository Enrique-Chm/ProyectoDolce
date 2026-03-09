import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import s from '../AdminPage.module.css';
import { hasPermission } from '../../../utils/checkPermiso';

// Recibimos sucursalId como prop desde AdminPage
export const InsumosTab = ({ sucursalId }) => {
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const puedeEditar = hasPermission('editar_insumos');
  const puedeBorrar = hasPermission('borrar_registros');

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

  // Re-ejecutar fetchData cada vez que cambies de sucursal en el selector global
  useEffect(() => { 
    fetchData(); 
  }, [sucursalId]);

  const fetchData = async () => {
    setLoading(true);
    const [ins, prov, uni, cat] = await Promise.all([
      // FILTRO CRÍTICO: Agregamos .eq('sucursal_id', sucursalId)
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
    if (!puedeEditar) return; 
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
      sucursal_id: sucursalId, // VINCULACIÓN: Se guarda en la sucursal activa
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
    <div className={s.pageWrapper} style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className={s.sectionTitle}>Gestión de Insumos</h2>
        {loading && <span className={s.textMuted} style={{ fontSize: '12px' }}>Cargando datos...</span>}
      </header>

      <div className={s.container}>
        <aside className={s.card}>
          <div className={s.cardHeader}>
            <h3 className={s.cardTitle}>{editId ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
          </div>
          <form className={s.cardBody} onSubmit={handleSubmit}>
            <div className={s.formGroup}>
              <label className={s.label}>Nombre Comercial</label>
              <input className={s.input} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required readOnly={!puedeEditar} />
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>Modelo / Variante</label>
              <input className={s.input} value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} required readOnly={!puedeEditar} />
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>Categoría</label>
              <select className={s.input} value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} required disabled={!puedeEditar}>
                <option value="">Seleccionar...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>Proveedor</label>
              <select className={s.input} value={formData.proveedor} onChange={e => setFormData({...formData, proveedor: e.target.value})} required disabled={!puedeEditar}>
                <option value="">Seleccionar...</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre_empresa}</option>)}
              </select>
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>Caja Master (unid)</label>
              <input type="number" className={s.input} value={formData.caja_master} onChange={e => setFormData({...formData, caja_master: e.target.value})} required readOnly={!puedeEditar} />
            </div>

            <div className={s.grid2}>
              <div className={s.formGroup}>
                <label className={s.label}>Costo Caja ($)</label>
                <input type="number" step="0.01" className={s.input} value={formData.costo_por_caja} onChange={e => setFormData({...formData, costo_por_caja: e.target.value})} required readOnly={!puedeEditar} />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>Contenido Neto</label>
                <input type="number" step="0.01" className={s.input} value={formData.contenido_neto} onChange={e => setFormData({...formData, contenido_neto: e.target.value})} required readOnly={!puedeEditar} />
              </div>
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>Unidad de Medida</label>
              <select className={s.input} value={formData.unidad_medida} onChange={e => setFormData({...formData, unidad_medida: e.target.value})} required disabled={!puedeEditar}>
                <option value="">Seleccionar...</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>)}
              </select>
            </div>

            <div className={s.grid2}>
              <div className={s.formGroup}>
                <label className={s.label}>Rendimiento (0-1)</label>
                <input type="number" step="0.01" className={s.input} value={formData.factor_rendimiento} onChange={e => setFormData({...formData, factor_rendimiento: e.target.value})} readOnly={!puedeEditar} />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>Días Reabast.</label>
                <input type="number" className={s.input} value={formData.dias_reabastecimiento} onChange={e => setFormData({...formData, dias_reabastecimiento: e.target.value})} readOnly={!puedeEditar} />
              </div>
            </div>

            {puedeEditar && (
              <button type="submit" className={s.btnPrimary} disabled={loading}>
                {loading ? 'Guardando...' : (editId ? 'Actualizar' : 'Guardar')}
              </button>
            )}
            {editId && <button type="button" onClick={resetForm} className={s.btnCancel}>Cancelar</button>}
          </form>
        </aside>

        <div className={s.tableWrapper}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Insumo / Variante</th>
                <th>Costo Unit.</th>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {insumos.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No hay insumos registrados en esta sucursal.
                  </td>
                </tr>
              ) : (
                insumos.map(i => (
                  <tr key={i.id} className={editId === i.id ? s.rowActive : ''}>
                    <td>
                      <div style={{ fontWeight: '800' }}>{i.nombre}</div>
                      <div className={s.textMuted}>{i.modelo} | {i.proveedores?.nombre_empresa}</div>
                    </td>
                    <td>
                      <div className={s.priceTag}>${i.costo_unitario?.toFixed(2)}</div>
                      <div className={s.textMuted} style={{fontSize: '10px'}}>por {i.cat_unidades_medida?.abreviatura}</div>
                    </td>
                    <td>
                      <div className={s.textMuted} style={{fontWeight: 'bold'}}>{i.cat_categoria_insumos?.nombre}</div>
                      <div className={s.textMuted} style={{fontSize: '10px'}}>{i.dias_reabastecimiento} días reabast.</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => {setEditId(i.id); setFormData({...i});}} className={s.btnEdit}>
                        {puedeEditar ? 'EDITAR' : 'VER'}
                      </button>
                      {puedeBorrar && (
                        <button className={s.btnDelete} onClick={async () => { if(confirm('¿Borrar?')) { await supabase.from('lista_insumo').delete().eq('id', i.id); fetchData(); } }}>BORRAR</button>
                      )}
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