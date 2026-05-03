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
  
  // 1. ESTADO INICIAL: Mantenemos sucursales_ids (array)
  const estadoInicialFormulario = {
    id: null,
    nombre: '',
    marca: '',
    modelo: '',
    categoria_id: '',
    presentacion: '',
    contenido: '',
    costo_actual: '',
    proveedor_id: '',
    proveedor_secundario_id: '',
    sucursales_ids: [], // Array de sucursales seleccionadas
    um_id: '',
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

  // --- MANEJADORES PARA SELECCIÓN MÚLTIPLE DE SUCURSALES ---
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
      setFormData({
        ...formData,
        sucursales_ids: todosLosIds
      });
    } else {
      setFormData({
        ...formData,
        sucursales_ids: []
      });
    }
  };

  // Validación visual para saber si todas están seleccionadas
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
      id: producto.id,
      nombre: producto.nombre || '',
      marca: producto.marca || '',
      modelo: producto.modelo || '',
      categoria_id: producto.categoria_id || '',
      presentacion: producto.presentacion || '',
      contenido: producto.contenido || '',
      costo_actual: producto.costo_actual || '',
      proveedor_id: producto.proveedor_id || '',
      proveedor_secundario_id: producto.proveedor_secundario_id || '',
      sucursales_ids: Array.isArray(producto.sucursales_ids) ? producto.sucursales_ids : [],
      um_id: producto.um_id || '',
      activo: producto.activo
    });
    setMostrandoFormulario(true);
  };

  const procesarGuardado = async () => {
    // Validaciones básicas de obligatoriedad en el frontend
    if (!formData.nombre || formData.nombre.trim() === '') {
      toast.error('El nombre del producto es obligatorio');
      return;
    }

    if (!formData.um_id) {
      toast.error('La Unidad de Medida (UM) es obligatoria');
      return;
    }

    // Validaciones numéricas para prevenir inconsistencias o valores negativos
    if (formData.costo_actual !== '' && formData.costo_actual !== undefined && formData.costo_actual !== null) {
      if (isNaN(Number(formData.costo_actual)) || Number(formData.costo_actual) < 0) {
        toast.error('El costo del producto no puede ser un número negativo');
        return;
      }
    }

    if (formData.contenido !== '' && formData.contenido !== undefined && formData.contenido !== null) {
      if (isNaN(Number(formData.contenido)) || Number(formData.contenido) <= 0) {
        toast.error('El contenido debe ser un valor numérico mayor a 0');
        return;
      }
    }

    // Limpieza y sanitización de datos antes de enviar al backend
    const datosLimpios = {
      ...formData,
      contenido: formData.contenido === '' ? null : Number(formData.contenido),
      costo_actual: formData.costo_actual === '' ? null : Number(formData.costo_actual),
      proveedor_id: formData.proveedor_id || null,
      proveedor_secundario_id: formData.proveedor_secundario_id || null,
      sucursales_ids: Array.isArray(formData.sucursales_ids) ? formData.sucursales_ids : [],
      um_id: formData.um_id || null,
      categoria_id: formData.categoria_id || null
    };

    const exito = await guardarProducto(datosLimpios);
    if (exito) {
      setMostrandoFormulario(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>Catálogo Maestro</span>
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
           VISTA 1: FORMULARIO EXPANDIDO (GRID)
           ========================================= */
        <section className={styles.card} style={{ animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            
            {/* BLOQUE 1: IDENTIDAD */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>Información General</h3>
              
              <div>
                <label className={styles.labelTop}>Nombre del Insumo *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Ej: Tomate Saladette" className={styles.inputEditorial} disabled={loading} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className={styles.labelTop}>Marca</label>
                  <input type="text" name="marca" value={formData.marca} onChange={handleInputChange} className={styles.inputEditorial} disabled={loading} />
                </div>
                <div>
                  <label className={styles.labelTop}>Modelo</label>
                  <input type="text" name="modelo" value={formData.modelo} onChange={handleInputChange} className={styles.inputEditorial} disabled={loading} />
                </div>
              </div>

              <div>
                <label className={styles.labelTop}>Categoría</label>
                <select name="categoria_id" value={formData.categoria_id} onChange={handleInputChange} className={styles.selectEditorial} disabled={loading}>
                  <option value="">-- Sin Asignar --</option>
                  {catalogos.categorias && catalogos.categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* BLOQUE 2: PRESENTACIÓN Y COSTO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>Presentación y Costos</h3>
              
              <div>
                <label className={styles.labelTop}>Descripción Presentación</label>
                <input type="text" name="presentacion" value={formData.presentacion} onChange={handleInputChange} placeholder="Ej: Caja de 10kg" className={styles.inputEditorial} disabled={loading} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className={styles.labelTop}>Contenido</label>
                  <input type="number" name="contenido" value={formData.contenido} onChange={handleInputChange} placeholder="Ej: 10" className={styles.inputEditorial} disabled={loading} />
                </div>
                <div>
                  <label className={styles.labelTop}>Unidad (UM) *</label>
                  <select name="um_id" value={formData.um_id} onChange={handleInputChange} className={styles.selectEditorial} disabled={loading}>
                    <option value="">-- Seleccionar --</option>
                    {catalogos.unidades.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={styles.labelTop}>Costo Actual ($)</label>
                <input type="number" name="costo_actual" value={formData.costo_actual} onChange={handleInputChange} placeholder="0.00" className={styles.inputEditorial} disabled={loading} />
              </div>
            </div>

            {/* BLOQUE 3: LOGÍSTICA Y SUCURSALES MÚLTIPLES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 className={styles.labelTop} style={{ color: 'var(--color-primary)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '8px' }}>Logística y Estatus</h3>
              
              <div>
                <label className={styles.labelTop}>Proveedor Preferido</label>
                <select name="proveedor_id" value={formData.proveedor_id} onChange={handleInputChange} className={styles.selectEditorial} disabled={loading}>
                  <option value="">-- Sin Asignar --</option>
                  {catalogos.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              {/* Selector de Proveedor Secundario */}
              <div>
                <label className={styles.labelTop}>Proveedor Secundario</label>
                <select name="proveedor_secundario_id" value={formData.proveedor_secundario_id} onChange={handleInputChange} className={styles.selectEditorial} disabled={loading}>
                  <option value="">-- Sin Asignar --</option>
                  {catalogos.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              {/* --- PANEL DE CHECKBOXES DE SUCURSAL MÚLTIPLE --- */}
              <div>
                <label className={styles.labelTop} style={{ display: 'block', marginBottom: '8px' }}>Disponibilidad por Sucursal</label>
                <div style={{
                  backgroundColor: 'var(--color-surface-lowest)',
                  border: '1px solid var(--border-ghost)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '160px',
                  overflowY: 'auto'
                }}>
                  {/* Opción global para todas */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', borderBottom: '1px solid var(--border-ghost)', paddingBottom: '6px' }}>
                    <input 
                      type="checkbox" 
                      checked={todasSeleccionadas}
                      onChange={(e) => handleToggleTodasLasSucursales(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      disabled={loading}
                    />
                    Todas las sucursales
                  </label>

                  {/* Listado individual de checkboxes */}
                  {catalogos.sucursales.map(suc => (
                    <label key={suc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      <input 
                        type="checkbox" 
                        checked={Array.isArray(formData.sucursales_ids) && formData.sucursales_ids.includes(suc.id)}
                        onChange={() => handleSucursalCheckboxChange(suc.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        disabled={loading}
                      />
                      {suc.nombre}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="activo" checked={formData.activo} onChange={handleInputChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} disabled={loading} />
                <label className={styles.labelTop} style={{ marginBottom: 0, cursor: 'pointer' }}>Producto Activo en Sistema</label>
              </div>
            </div>

          </div>

          <button onClick={procesarGuardado} disabled={loading} className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ width: '100%', marginTop: '32px' }}>
            <span className="material-symbols-outlined">{loading ? 'sync' : 'save'}</span>
            {loading ? 'Sincronizando...' : 'Guardar Producto Completo'}
          </button>
        </section>

      ) : (
        /* =========================================
           VISTA 2: LISTA DE PRODUCTOS (Resumen)
           ========================================= */
        <>
          <section className={styles.cardLow} style={{ marginBottom: 'var(--space-md)', padding: '10px 14px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    Catálogo: <b>{productos.length}</b> insumos.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={abrirParaCrear} 
                    className={`${styles.btnBase} ${styles.btnPrimary}`}
                    style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem' }}
                    disabled={loading}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add</span> Nuevo Insumo
                  </button>
                </div>
             </div>
          </section>

          {/* LISTA DE FILAS COMPACTAS PARA MÓVIL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {productos.map(prod => (
              <section 
                key={prod.id} 
                className={styles.card} 
                style={{ 
                  opacity: prod.activo ? 1 : 0.65, 
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  minHeight: '64px',
                  borderRadius: '10px',
                  borderLeft: prod.activo ? '4px solid var(--color-primary)' : '4px solid #999',
                  borderTop: 'none',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease',
                  gap: '12px'
                }}
              >
                {/* Bloque Izquierdo: Información Resumida */}
                <div onClick={() => abrirParaEditar(prod)} style={{ cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                    <h2 className={styles.subtitle} style={{ 
                      fontSize: '0.925rem', 
                      margin: 0, 
                      fontWeight: 'bold', 
                      color: 'var(--text-main)', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      {prod.nombre}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      ${prod.costo_actual}
                    </span>
                  </div>

                  {/* Subtítulo: Marca • UM • Categoría */}
                  <div style={{ display: 'flex', gap: '4px', fontSize: '0.725rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span>{prod.marca || 'S/M'}</span>
                    <span>•</span>
                    <span>{prod.unidad_medida?.abreviatura || 'N/A'}</span>
                    <span>•</span>
                    <span style={{ color: 'var(--text-light)' }}>{prod.categoria?.nombre || 'Sin cat'}</span>
                  </div>

                  {/* --- BADGES DE SUCURSALES ASIGNADAS MINI --- */}
                  <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(!prod.sucursales_ids || prod.sucursales_ids.length === 0) ? (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', opacity: 0.8 }}>
                        📍 Todas las sucursales
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        📍 <b>{prod.sucursales?.map(s => s.nombre).join(', ')}</b>
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Bloque Derecho: Botones de Acción Mini */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button 
                    onClick={() => abrirParaEditar(prod)} 
                    className={`${styles.btnBase} ${styles.btnSecondary}`} 
                    style={{ 
                      padding: '0', 
                      width: '34px', 
                      height: '34px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-surface-low)'
                    }}
                    disabled={loading}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>edit</span>
                  </button>
                  <button 
                    onClick={() => toggleEstatus(prod.id, prod.activo)} 
                    className={`${styles.btnBase} ${styles.btnOutlined}`} 
                    style={{ 
                      padding: '0', 
                      width: '34px', 
                      height: '34px', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderColor: prod.activo ? '#ba1a1a' : 'var(--color-primary)',
                      color: prod.activo ? '#ba1a1a' : 'var(--color-primary)',
                      backgroundColor: 'transparent'
                    }}
                    disabled={loading}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>
                      {prod.activo ? 'block' : 'check_circle'}
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