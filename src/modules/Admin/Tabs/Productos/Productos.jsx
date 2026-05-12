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
  
  // 1. ESTADO INICIAL: Sincronizado con las columnas de la tabla BD_Productos
  const estadoInicialFormulario = {
    id: null,
    nombre: '',
    marca: '',
    categoria_id: '', // Relación UUID
    presentacion: '',
    contenido: '',
    costo_actual: '',
    proveedor_id: '', // Relación UUID
    proveedor_secundario_id: '', // Relación UUID
    um_id: '', // Relación UUID
    sucursales_ids: [], 
    activo: true
  };
  
  const [formData, setFormData] = useState(estadoInicialFormulario);

  // Carga inicial de datos y catálogos
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

  // --- LÓGICA DE SUCURSALES (ARRAY DE UUIDs) ---
  const handleSucursalCheckboxChange = (id) => {
    const idsActuales = Array.isArray(formData.sucursales_ids) ? formData.sucursales_ids : [];
    if (idsActuales.includes(id)) {
      setFormData({
        ...formData,
        sucursales_ids: idsActuales.filter(sucId => sucId !== id)
      });
    } else {
      setFormData({
        ...formData,
        sucursales_ids: [...idsActuales, id]
      });
    }
  };

  const handleToggleTodasLasSucursales = (checked) => {
    if (checked) {
      const todosLosIds = catalogos.sucursales.map(s => s.id);
      setFormData({ ...formData, sucursales_ids: todosLosIds });
    } else {
      setFormData({ ...formData, sucursales_ids: [] });
    }
  };

  const todasSeleccionadas = useMemo(() => {
    if (!catalogos.sucursales || catalogos.sucursales.length === 0) return false;
    const idsActuales = Array.isArray(formData.sucursales_ids) ? formData.sucursales_ids : [];
    return catalogos.sucursales.every(s => idsActuales.includes(s.id));
  }, [catalogos.sucursales, formData.sucursales_ids]);

  // --- MANEJO DE MODAL/VISTA ---
  const abrirParaCrear = () => {
    setFormData(estadoInicialFormulario);
    setMostrandoFormulario(true);
  };

  const abrirParaEditar = (producto) => {
    setFormData({
      id: producto.id,
      nombre: producto.nombre || '',
      marca: producto.marca || '',
      categoria_id: producto.categoria_id || '',
      presentacion: producto.presentacion || '',
      contenido: producto.contenido || '',
      costo_actual: producto.costo_actual || '',
      proveedor_id: producto.proveedor_id || '',
      proveedor_secundario_id: producto.proveedor_secundario_id || '',
      um_id: producto.um_id || '',
      sucursales_ids: Array.isArray(producto.sucursales_ids) ? producto.sucursales_ids : [],
      activo: producto.activo
    });
    setMostrandoFormulario(true);
  };

  const procesarGuardado = async () => {
    // El servicio y el hook ya manejan la limpieza de datos,
    // aquí solo validamos que lo mínimo necesario esté presente.
    const exito = await guardarProducto(formData);
    if (exito) {
      setMostrandoFormulario(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>Gestión de Inventario</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
            {mostrandoFormulario ? (formData.id ? 'Editar\nProducto' : 'Nuevo\nProducto') : 'Productos'}
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
        /* =========================================
           VISTA: FORMULARIO DE ALTA / EDICIÓN
           ========================================= */
        <section className={styles.card} style={{ animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            
            {/* BLOQUE 1: IDENTIDAD */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>Información Básica</h3>
              
              <div>
                <label className={styles.labelTop}>Nombre del Producto *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Ej: Aceite de Oliva 1L" className={styles.inputEditorial} disabled={loading} />
              </div>

              <div>
                <label className={styles.labelTop}>Marca</label>
                <input type="text" name="marca" value={formData.marca} onChange={handleInputChange} className={styles.inputEditorial} disabled={loading} />
              </div>

              <div>
                <label className={styles.labelTop}>Categoría de Producto *</label>
                <select name="categoria_id" value={formData.categoria_id} onChange={handleInputChange} className={styles.selectEditorial} disabled={loading}>
                  <option value="">-- Seleccionar Categoría --</option>
                  {catalogos.categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* BLOQUE 2: ESPECIFICACIONES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>Especificaciones y Costo</h3>
              
              <div>
                <label className={styles.labelTop}>Presentación</label>
                <input type="text" name="presentacion" value={formData.presentacion} onChange={handleInputChange} placeholder="Ej: Botella de vidrio" className={styles.inputEditorial} disabled={loading} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className={styles.labelTop}>Contenido</label>
                  <input type="number" name="contenido" value={formData.contenido} onChange={handleInputChange} placeholder="Ej: 1" className={styles.inputEditorial} disabled={loading} />
                </div>
                <div>
                  <label className={styles.labelTop}>Unidad (UM) *</label>
                  <select name="um_id" value={formData.um_id} onChange={handleInputChange} className={styles.selectEditorial} disabled={loading}>
                    <option value="">-- UM --</option>
                    {catalogos.unidades.map(u => (
                      <option key={u.id} value={u.id}>{u.abreviatura} - {u.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={styles.labelTop}>Costo de Compra Actual ($)</label>
                <input type="number" name="costo_actual" value={formData.costo_actual} onChange={handleInputChange} placeholder="0.00" className={styles.inputEditorial} disabled={loading} />
              </div>
            </div>

            {/* BLOQUE 3: LOGÍSTICA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>Proveedores y Sucursales</h3>
              
              <div>
                <label className={styles.labelTop}>Proveedor Principal</label>
                <select name="proveedor_id" value={formData.proveedor_id} onChange={handleInputChange} className={styles.selectEditorial} disabled={loading}>
                  <option value="">-- Seleccionar --</option>
                  {catalogos.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className={styles.labelTop}>Proveedor Secundario (Opcional)</label>
                <select name="proveedor_secundario_id" value={formData.proveedor_secundario_id} onChange={handleInputChange} className={styles.selectEditorial} disabled={loading}>
                  <option value="">-- Seleccionar --</option>
                  {catalogos.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className={styles.labelTop} style={{ display: 'block', marginBottom: '8px' }}>Disponibilidad en Sucursales</label>
                <div style={{
                  backgroundColor: 'var(--color-surface-lowest)',
                  border: '1px solid var(--border-ghost)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '140px',
                  overflowY: 'auto'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '6px' }}>
                    <input type="checkbox" checked={todasSeleccionadas} onChange={(e) => handleToggleTodasLasSucursales(e.target.checked)} disabled={loading} />
                    Seleccionar todas
                  </label>

                  {catalogos.sucursales.map(suc => (
                    <label key={suc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.825rem' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.sucursales_ids.includes(suc.id)} 
                        onChange={() => handleSucursalCheckboxChange(suc.id)} 
                        disabled={loading} 
                      />
                      {suc.nombre}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button onClick={procesarGuardado} disabled={loading} className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ width: '100%', marginTop: '32px' }}>
            <span className="material-symbols-outlined">{loading ? 'sync' : 'save'}</span>
            {loading ? 'Procesando...' : 'Finalizar y Guardar'}
          </button>
        </section>

      ) : (
        /* =========================================
           VISTA: LISTADO DE PRODUCTOS
           ========================================= */
        <>
          <section className={styles.cardLow} style={{ marginBottom: 'var(--space-md)', padding: '10px 14px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  Mostrando <b>{productos.length}</b> productos en catálogo.
                </p>
                <button onClick={abrirParaCrear} className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem' }} disabled={loading}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add</span> Nuevo Insumo
                </button>
             </div>
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {productos.map(prod => (
              <section 
                key={prod.id} 
                className={styles.card} 
                style={{ 
                  opacity: prod.activo ? 1 : 0.6, 
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: prod.activo ? '5px solid var(--color-primary)' : '5px solid #ccc',
                  backgroundColor: 'white'
                }}
              >
                {/* Info Principal */}
                <div onClick={() => abrirParaEditar(prod)} style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: '700', color: 'var(--text-main)' }}>
                      {prod.nombre}
                    </h2>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 'bold', backgroundColor: 'var(--color-surface-low)', padding: '2px 8px', borderRadius: '6px' }}>
                      ${prod.costo_actual}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600' }}>{prod.marca || 'Genérico'}</span>
                    <span>•</span>
                    <span>{prod.unidad_medida?.abreviatura || 'S/UM'}</span>
                    <span>•</span>
                    <span style={{ color: 'var(--color-primary)', opacity: 0.8 }}>{prod.categoria?.nombre || 'Sin Categoría'}</span>
                  </div>

                  {/* Sucursales Badge Mini */}
                  <div style={{ marginTop: '6px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>location_on</span>
                      {prod.sucursales_ids?.length === 0 ? 'Disponible en todas' : `${prod.sucursales_ids?.length} sucursales`}
                    </span>
                  </div>
                </div>
                
                {/* Acciones Rápidas */}
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                  <button onClick={() => abrirParaEditar(prod)} className={`${styles.btnBase} ${styles.btnSecondary}`} style={{ width: '36px', height: '36px', padding: 0, borderRadius: '10px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>edit</span>
                  </button>
                  <button 
                    onClick={() => toggleEstatus(prod.id, prod.activo)} 
                    className={styles.btnBase} 
                    style={{ 
                      width: '36px', height: '36px', padding: 0, borderRadius: '10px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${prod.activo ? '#ff4d4d' : '#4CAF50'}`,
                      color: prod.activo ? '#ff4d4d' : '#4CAF50'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                      {prod.activo ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}