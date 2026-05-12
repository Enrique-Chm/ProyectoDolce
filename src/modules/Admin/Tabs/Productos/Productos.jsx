// src/modules/Admin/Tabs/Productos/Productos.jsx
import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useProductos } from './2useProductos';
import toast from 'react-hot-toast';

export default function Productos({ onVolver }) {
  const { 
    loading, productos, catalogos, 
    cargarProductos, cargarCatalogosFormulario, 
    guardarProducto, toggleEstatus
  } = useProductos();

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  
  const estadoInicialFormulario = {
    id: null,
    nombre: '',
    marca: '',
    categoria_id: '',
    presentacion: '',
    contenido: '',
    costo_actual: '',
    proveedor_id: '',
    proveedor_secundario_id: '',
    um_id: '',
    sucursales_ids: [], 
    activo: true
  };
  
  const [formData, setFormData] = useState(estadoInicialFormulario);

  useEffect(() => {
    cargarProductos();
    cargarCatalogosFormulario();
  }, [cargarProductos, cargarCatalogosFormulario]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSucursalCheckboxChange = (id) => {
    const idsActuales = Array.isArray(formData.sucursales_ids) ? formData.sucursales_ids : [];
    if (idsActuales.includes(id)) {
      setFormData({ ...formData, sucursales_ids: idsActuales.filter(sucId => sucId !== id) });
    } else {
      setFormData({ ...formData, sucursales_ids: [...idsActuales, id] });
    }
  };

  const handleToggleTodasLasSucursales = () => {
    if (todasSeleccionadas) {
      setFormData({ ...formData, sucursales_ids: [] });
    } else {
      setFormData({ ...formData, sucursales_ids: catalogos.sucursales.map(s => s.id) });
    }
  };

  const todasSeleccionadas = useMemo(() => {
    if (!catalogos.sucursales || catalogos.sucursales.length === 0) return false;
    const idsActuales = Array.isArray(formData.sucursales_ids) ? formData.sucursales_ids : [];
    return catalogos.sucursales.every(s => idsActuales.includes(s.id));
  }, [catalogos.sucursales, formData.sucursales_ids]);

  const abrirParaCrear = () => {
    setFormData(estadoInicialFormulario);
    setMostrandoFormulario(true);
  };

  const abrirParaEditar = (producto) => {
    setFormData({
      ...producto,
      sucursales_ids: Array.isArray(producto.sucursales_ids) ? producto.sucursales_ids : []
    });
    setMostrandoFormulario(true);
  };

  const procesarGuardado = async () => {
    if (!formData.nombre.trim()) return toast.error('El nombre es obligatorio');
    const exito = await guardarProducto(formData);
    if (exito) setMostrandoFormulario(false);
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    (p.marca || '').toLowerCase().includes(filtroBusqueda.toLowerCase())
  );

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%', paddingBottom: '40px' }}>
      
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>GESTIÓN DE INVENTARIO</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1', margin: 0 }}>
            {mostrandoFormulario ? (formData.id ? 'Datos del\nProducto' : 'Nuevo\nProducto') : 'Productos'}
          </h1>
        </div>
        <button 
          onClick={mostrandoFormulario ? () => setMostrandoFormulario(false) : onVolver} 
          className={`${styles.btnBase} ${styles.btnSecondary}`}
          style={{ height: '38px', padding: '0 12px', fontSize: '0.8rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_back</span>
          Volver
        </button>
      </header>

      {mostrandoFormulario ? (
        /* --- FORMULARIO --- */
        <section className={styles.card} style={{ animation: 'slideUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            <div>
              <label className={styles.labelTop}>NOMBRE DEL PRODUCTO *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Ej: Aceite de Oliva 1L" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className={styles.labelTop}>MARCA</label>
                <input type="text" name="marca" value={formData.marca} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Kirkland" />
              </div>
              <div>
                <label className={styles.labelTop}>CATEGORÍA *</label>
                <select name="categoria_id" value={formData.categoria_id} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="">Seleccionar...</option>
                  {catalogos.categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className={styles.labelTop}>COSTO ($)</label>
                <input type="number" name="costo_actual" value={formData.costo_actual} onChange={handleInputChange} className={styles.inputEditorial} placeholder="0.00" />
              </div>
              <div>
                <label className={styles.labelTop}>UNIDAD (UM)</label>
                <select name="um_id" value={formData.um_id} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="">Seleccionar...</option>
                  {catalogos.unidades.map(u => <option key={u.id} value={u.id}>{u.abreviatura}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={styles.labelTop}>SUCURSALES DISPONIBLES</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', padding: '12px', background: 'var(--color-surface-lowest)', borderRadius: '12px', maxHeight: '140px', overflowY: 'auto' }}>
                {catalogos.sucursales.map(suc => {
                  const selec = formData.sucursales_ids.includes(suc.id);
                  return (
                    <div key={suc.id} onClick={() => handleSucursalCheckboxChange(suc.id)} style={{ padding: '8px', borderRadius: '8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: selec ? 'var(--color-primary)' : 'white', color: selec ? 'white' : 'inherit', border: '1px solid var(--border-ghost)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{selec ? 'check_box' : 'check_box_outline_blank'}</span>
                      {suc.nombre}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button onClick={procesarGuardado} disabled={loading} className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ width: '100%', padding: '1rem' }}>
            <span className="material-symbols-outlined">save</span>
            {loading ? 'GUARDANDO...' : 'GUARDAR PRODUCTO'}
          </button>
        </section>
      ) : (
        /* --- LISTADO (HOMOLOGADO A SUCURSALES) --- */
        <>
          <button 
            onClick={abrirParaCrear} 
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ width: '100%', marginBottom: 'var(--space-md)', padding: '0.8rem', fontSize: '0.875rem', height: '44px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add_box</span>
            REGISTRAR PRODUCTO
          </button>

          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>search</span>
            <input type="text" placeholder="Buscar por nombre o marca..." className={styles.inputEditorial} style={{ width: '100%', paddingLeft: '40px' }} value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {productosFiltrados.map(prod => {
              const esActivo = prod.activo;
              const numSucs = prod.sucursales_ids?.length || 0;
              return (
                <div key={prod.id} className={styles.card} style={{ 
                  display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  opacity: esActivo ? 1 : 0.65,
                  borderLeft: esActivo ? '4px solid var(--color-primary)' : '4px solid #999',
                  padding: '8px 12px', borderRadius: '10px', backgroundColor: 'white',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)', gap: '12px', minHeight: '64px'
                }}>
                  {/* Info */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h4 style={{ fontSize: '0.875rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.nombre}
                      </h4>
                      <span style={{ 
                        fontSize: '0.55rem', 
                        background: esActivo ? 'var(--color-primary-fixed)' : 'var(--color-surface-high)', 
                        color: esActivo ? 'var(--color-on-primary-fixed)' : 'var(--text-muted)', 
                        padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase'
                      }}>
                        {esActivo ? 'ACTIVO' : 'BAJA'}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>${prod.costo_actual}</span>
                      <span>•</span>
                      <span>{prod.categoria?.nombre || 'S/C'}</span>
                      <span>•</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>location_on</span>
                      {numSucs === 0 || numSucs === catalogos.sucursales.length ? 'Todas' : `${numSucs} sucs`}
                    </p>
                  </div>
                  
                  {/* Botones cuadrados mini */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button 
                      onClick={() => abrirParaEditar(prod)} 
                      className={styles.btnSecondary} 
                      style={{ padding: '0', width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface-low)' }} 
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>edit</span>
                    </button>
                    <button 
                      onClick={() => toggleEstatus(prod.id, prod.activo)} 
                      className={styles.btnOutlined} 
                      style={{ 
                        padding: '0', width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderColor: esActivo ? '#ba1a1a' : 'var(--color-primary)',
                        color: esActivo ? '#ba1a1a' : 'var(--color-primary)',
                        backgroundColor: 'transparent'
                      }} 
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>
                        {esActivo ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}