// src/modules/Admin/Tabs/Productos/Productos.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [catActiva, setCatActiva] = useState('Todas');
  
  // --- ESTADOS Y REFERENCIAS PARA EL SELECTOR BUSCABLE (OPCIÓN B) ---
  const [busquedaOpcionB, setBusquedaOpcionB] = useState('');
  const [mostrarOpcionesB, setMostrarOpcionesB] = useState(false);
  const dropdownRef = useRef(null);

  // Escuchar clics fuera del dropdown para cerrarlo automáticamente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarOpcionesB(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const estadoInicialFormulario = {
    id: null,
    nombre: '',
    marca: '',
    categoria_id: '',
    presentacion: '',
    contenido: '',
    proveedor_id: '',
    producto_equivalente_id: '',
    um_id: '',
    sucursales_ids: [], 
    activo: true,
    turno_uso: 'Ambos'
  };
  
  const [formData, setFormData] = useState(estadoInicialFormulario);

  useEffect(() => {
    cargarProductos();
    cargarCatalogosFormulario();
  }, [cargarProductos, cargarCatalogosFormulario]);

  // Memorizamos las categorías disponibles para el filtro superior
  const listaCategoriasFiltro = useMemo(() => {
    const sets = new Set(productos.map(p => p.categoria?.nombre).filter(Boolean));
    return ['Todas', ...Array.from(sets).sort()];
  }, [productos]);

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

  const abrirParaCrear = () => {
    setFormData(estadoInicialFormulario);
    setMostrandoFormulario(true);
  };

  const abrirParaEditar = (producto) => {
    setFormData({
      ...producto,
      sucursales_ids: Array.isArray(producto.sucursales_ids) ? producto.sucursales_ids : [],
      turno_uso: producto.turno_uso || 'Ambos',
      producto_equivalente_id: producto.producto_equivalente_id || ''
    });
    setMostrandoFormulario(true);
  };

  const procesarGuardado = async () => {
    if (!formData.nombre.trim()) return toast.error('El nombre es obligatorio');
    if (!formData.categoria_id) return toast.error('La categoría es obligatoria');
    if (!formData.um_id) return toast.error('La unidad de medida es obligatoria');
    
    // Evita que un producto se elija a sí mismo como opción B de emergencia
    if (formData.id && formData.producto_equivalente_id === formData.id) {
      return toast.error('Un producto no puede ser su propio equivalente de Opción B');
    }

    const exito = await guardarProducto(formData);
    if (exito) setMostrandoFormulario(false);
  };

  /**
   * Búsqueda Multicriterio
   * Filtra por categoría seleccionada Y por texto (nombre, marca, categoría o turno)
   */
  const productosFiltrados = productos.filter(p => {
    // 1. Filtro por Pestaña de Categoría
    const coincidePestaña = catActiva === 'Todas' || p.categoria?.nombre === catActiva;
    
    // 2. Filtro por Texto del Buscador
    const searchLower = filtroBusqueda.toLowerCase();
    const coincideTexto = 
      p.nombre.toLowerCase().includes(searchLower) ||
      (p.marca || '').toLowerCase().includes(searchLower) ||
      (p.turno_uso || '').toLowerCase().includes(searchLower) ||
      (p.categoria?.nombre || '').toLowerCase().includes(searchLower);

    return coincidePestaña && coincideTexto;
  });

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
        /* --- FORMULARIO DE PRODUCTO --- */
        <section className={styles.card} style={{ animation: 'slideUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            
            <div>
              <label className={styles.labelTop}>NOMBRE DEL PRODUCTO *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Ej: Aceite de Oliva" />
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
                <label className={styles.labelTop}>PRESENTACIÓN (Empaque)</label>
                <input type="text" name="presentacion" value={formData.presentacion} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Ej: Caja, Saco, Botella" />
              </div>
              <div>
                <label className={styles.labelTop}>CONTENIDO NETO (Número)</label>
                <input type="number" name="contenido" value={formData.contenido} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Ej: 6, 1.5, 20" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className={styles.labelTop}>UNIDAD DE MEDIDA (UM) *</label>
                <select name="um_id" value={formData.um_id} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="">Seleccionar...</option>
                  {catalogos.unidades.map(u => <option key={u.id} value={u.id}>{u.abreviatura} - {u.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.labelTop}>TURNO DE OPERACIÓN *</label>
                <select name="turno_uso" value={formData.turno_uso} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="Ambos">Ambos (Universal)</option>
                  <option value="AM">Mañana (AM)</option>
                  <option value="PM">Tarde/Cena (PM)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className={styles.labelTop}>PROVEEDOR PRINCIPAL</label>
                <select name="proveedor_id" value={formData.proveedor_id} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="">Ninguno</option>
                  {catalogos.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              
              {/* --- SELECTOR BUSCABLE DE OPCIÓN B --- */}
              <div ref={dropdownRef}>
                <label className={styles.labelTop} style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>INSUMO EQUIVALENTE (OPCIÓN B)</label>
                <div style={{ position: 'relative', marginTop: '2px' }}>
                  
                  {/* Pseudo-Input (Caja que se ve) */}
                  <div 
                    onClick={() => setMostrarOpcionesB(!mostrarOpcionesB)}
                    className={styles.inputEditorial}
                    style={{ 
                      border: '1px solid var(--color-primary)', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      userSelect: 'none',
                      backgroundColor: 'var(--color-surface-lowest)'
                    }}
                  >
                    <span style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem' }}>
                      {formData.producto_equivalente_id 
                        ? (() => {
                            const p = catalogos.productosAlternos.find(x => x.id === formData.producto_equivalente_id);
                            return p ? `${p.nombre.toUpperCase()} ${p.marca ? `(${p.marca.toUpperCase()})` : ''}` : 'Ninguno';
                          })()
                        : 'Ninguno'}
                    </span>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                      {mostrarOpcionesB ? 'arrow_drop_up' : 'arrow_drop_down'}
                    </span>
                  </div>

                  {/* Panel Desplegable */}
                  {mostrarOpcionesB && (
                    <div style={{ 
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, 
                      background: 'var(--color-surface-lowest)', 
                      border: '1px solid var(--color-primary)', 
                      borderRadius: '8px', marginTop: '4px', 
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      overflow: 'hidden'
                    }}>
                      <div style={{ padding: '8px', borderBottom: '1px solid var(--border-ghost)', background: 'var(--color-surface-low)' }}>
                        <input 
                          type="text" 
                          placeholder="Buscar insumo (nombre o marca)..." 
                          value={busquedaOpcionB}
                          onChange={(e) => setBusquedaOpcionB(e.target.value)}
                          className={styles.inputEditorial}
                          style={{ height: '36px', fontSize: '0.85rem', padding: '0 10px' }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                      <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        <div 
                          onClick={() => { setFormData({...formData, producto_equivalente_id: ''}); setMostrarOpcionesB(false); setBusquedaOpcionB(''); }}
                          style={{ 
                            padding: '10px 12px', cursor: 'pointer', fontSize: '0.85rem', 
                            borderBottom: '1px solid var(--border-ghost)',
                            fontWeight: !formData.producto_equivalente_id ? 'bold' : 'normal',
                            color: !formData.producto_equivalente_id ? 'var(--color-primary)' : 'var(--text-main)'
                          }}
                        >
                          Ninguno
                        </div>
                        {catalogos.productosAlternos
                          .filter(p => p.id !== formData.id) // Excluimos el producto actual de su propia lista
                          .filter(p => {
                            if(!busquedaOpcionB) return true;
                            // Filtro seguro: quita acentos y convierte a minúsculas
                            const query = busquedaOpcionB.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            const target = (p.nombre + " " + (p.marca||'')).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            return target.includes(query);
                          })
                          .map(p => {
                            const isSelected = formData.producto_equivalente_id === p.id;
                            return (
                              <div 
                                key={p.id}
                                onClick={() => { setFormData({...formData, producto_equivalente_id: p.id}); setMostrarOpcionesB(false); setBusquedaOpcionB(''); }}
                                style={{ 
                                  padding: '10px 12px', cursor: 'pointer', fontSize: '0.85rem', 
                                  borderBottom: '1px solid var(--border-ghost)', 
                                  backgroundColor: isSelected ? 'var(--color-primary-fixed)' : 'transparent',
                                  color: isSelected ? 'var(--color-on-primary-fixed)' : 'var(--text-main)',
                                  fontWeight: isSelected ? 'bold' : 'normal'
                                }}
                              >
                                {p.nombre.toUpperCase()} {p.marca ? `(${p.marca.toUpperCase()})` : ''}
                              </div>
                            )
                          })
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div>
              <label className={styles.labelTop}>VISIBILIDAD EN SUCURSALES</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', padding: '12px', background: 'var(--color-surface-lowest)', borderRadius: '12px', maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border-ghost)' }}>
                {catalogos.sucursales.map(suc => {
                  const selec = formData.sucursales_ids.includes(suc.id);
                  return (
                    <div key={suc.id} onClick={() => handleSucursalCheckboxChange(suc.id)} style={{ padding: '8px', borderRadius: '8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: selec ? 'var(--color-primary)' : 'white', color: selec ? 'white' : 'inherit', border: '1px solid var(--border-ghost)', fontWeight: 'bold' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{selec ? 'check_box' : 'check_box_outline_blank'}</span>
                      {suc.nombre}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button onClick={procesarGuardado} disabled={loading} className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ width: '100%', padding: '1rem', marginTop: '10px' }}>
            <span className="material-symbols-outlined">save</span>
            {loading ? 'GUARDANDO...' : 'GUARDAR PRODUCTO'}
          </button>
        </section>
      ) : (
        /* --- VISTA: LISTADO DE PRODUCTOS --- */
        <>
          <button 
            onClick={abrirParaCrear} 
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ width: '100%', marginBottom: 'var(--space-md)', padding: '0.8rem', fontSize: '0.875rem', height: '44px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add_box</span>
            REGISTRAR PRODUCTO
          </button>

          {/* Buscador de Texto */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>search</span>
            <input 
              type="text" 
              placeholder="Buscar por nombre, marca o categoría..." 
              className={styles.inputEditorial} 
              style={{ width: '100%', paddingLeft: '40px' }} 
              value={filtroBusqueda} 
              onChange={(e) => setFiltroBusqueda(e.target.value)} 
            />
          </div>

          {/* Barra de Categorías (Searchable via UI) */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none', marginBottom: '8px' }}>
            {listaCategoriasFiltro.map(cat => (
              <button 
                key={cat} 
                onClick={() => setCatActiva(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px', 
                  fontSize: '0.7rem', 
                  whiteSpace: 'nowrap', 
                  fontWeight: 'bold',
                  border: catActiva === cat ? 'none' : '1px solid var(--border-ghost)',
                  backgroundColor: catActiva === cat ? 'var(--color-primary)' : 'white',
                  color: catActiva === cat ? 'white' : 'var(--text-main)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Listado de Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {productosFiltrados.length === 0 ? (
               <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No se encontraron productos con esos criterios.</p>
            ) : (
              productosFiltrados.map(prod => {
                const esActivo = prod.activo;
                const numSucs = prod.sucursales_ids?.length || 0;
                return (
                  <div key={prod.id} className={styles.card} style={{ 
                    display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    opacity: esActivo ? 1 : 0.65,
                    borderLeft: esActivo ? '4px solid var(--color-primary)' : '4px solid #999',
                    padding: '10px 12px', borderRadius: '10px', backgroundColor: 'white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)', gap: '12px', minHeight: '64px'
                  }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 style={{ fontSize: '0.875rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.nombre}
                        </h4>
                        {prod.producto_equivalente_id && (
                           <span title="Tiene insumo equivalente de respaldo (Opción B)" className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>swap_horiz</span>
                        )}
                      </div>

                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{prod.categoria?.nombre || 'S/C'}</span>
                        <span>•</span>
                        <span>{prod.presentacion || 'PZ'} ({prod.contenido || 1} {prod.um_abreviatura || prod.um?.abreviatura || 'pz'})</span>
                        <span>•</span>
                        <span style={{ fontWeight: 'bold', color: prod.turno_uso === 'AM' ? '#e67e22' : prod.turno_uso === 'PM' ? '#9b59b6' : 'var(--text-muted)' }}>
                          {prod.turno_uso === 'AM' ? 'AM' : prod.turno_uso === 'PM' ? 'PM' : 'Ambos'}
                        </span>
                        <span>•</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>location_on</span>
                        {numSucs === 0 ? 'Todas' : `${numSucs} sucs`}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => abrirParaEditar(prod)} className={styles.btnSecondary} style={{ padding: '0', width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface-low)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>edit</span>
                      </button>
                      <button onClick={() => toggleEstatus(prod.id, prod.activo)} className={styles.btnOutlined} style={{ padding: '0', width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: esActivo ? '#ba1a1a' : 'var(--color-primary)', color: esActivo ? '#ba1a1a' : 'var(--color-primary)', backgroundColor: 'transparent' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>{esActivo ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}