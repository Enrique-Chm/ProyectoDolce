// src/modules/Admin/Tabs/Productos/Productos.jsx
import React, { useState, useEffect, useRef } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useProductos } from './2useProductos';
import toast from 'react-hot-toast';

// Definido fuera del componente — no se recrea en cada render
const ESTADO_INICIAL_FORM = {
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

// ─────────────────────────────────────────────────────────────────────────
// Tokens semánticos que aún no están en variables.css.
// Se usa var() con fallback para que funcionen sin cambiar CSS hoy,
// y adopten el token automáticamente cuando se agreguen a variables.css.
// ─────────────────────────────────────────────────────────────────────────
const COLOR_DANGER    = 'var(--color-danger,    #ba1a1a)'; // Rojo alerta / peligro
const COLOR_TURNO_AM  = 'var(--color-turno-am,  #e67e22)'; // Naranja — turno mañana
const COLOR_TURNO_PM  = 'var(--color-turno-pm,  #9b59b6)'; // Morado  — turno tarde

// ─────────────────────────────────────────
// Estilos extraídos del JSX para mayor
// legibilidad. Sin valores hardcodeados.
// ─────────────────────────────────────────
const sx = {
  // Contenedor
  pagina: { width: '100%', maxWidth: '100%', paddingBottom: 'var(--space-lg)' },

  // Encabezado
  header: { marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  labelTopDisplay: { display: 'block', marginBottom: '2px' },
  titulo: { fontSize: '2rem', lineHeight: '1', margin: 0 },
  btnVolver: { height: '38px', padding: '0 12px', fontSize: '0.8rem' },
  btnVolverIcon: { fontSize: '1.1rem' },

  // Formulario — layout
  formSection: { animation: 'slideUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '15px' },
  formDual: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  labelSm: { fontSize: '0.65rem' },

  // Selector buscable Opción B
  opcionBLabel: { color: 'var(--color-primary)', fontWeight: 'bold' },
  opcionBRelativo: { position: 'relative', marginTop: '2px' },
  opcionBTrigger: {
    border: '1px solid var(--color-primary)', cursor: 'pointer', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', userSelect: 'none',
    backgroundColor: 'var(--color-surface-lowest)'
  },
  opcionBTexto: {
    color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden',
    textOverflow: 'ellipsis', fontSize: '0.9rem'
  },
  opcionBChevron: { fontSize: '1.2rem', color: 'var(--color-primary)' },
  opcionBDropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
    background: 'var(--color-surface-lowest)', border: '1px solid var(--color-primary)',
    borderRadius: 'var(--radius-lg)', marginTop: 'var(--space-xs)',
    boxShadow: 'var(--shadow-dropdown, 0 8px 24px rgba(0,0,0,0.15))',
    overflow: 'hidden'
  },
  opcionBSearchBox: {
    padding: 'var(--space-sm)',
    borderBottom: '1px solid var(--border-ghost)',
    background: 'var(--color-surface-low)'
  },
  opcionBSearchInput: { height: '36px', fontSize: '0.85rem', padding: '0 10px' },
  opcionBLista: { maxHeight: '180px', overflowY: 'auto' },

  // Sucursales
  sucursalesGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: 'var(--space-sm)', padding: '12px', background: 'var(--color-surface-lowest)',
    borderRadius: 'var(--radius-xl)', maxHeight: '140px', overflowY: 'auto',
    border: '1px solid var(--border-ghost)'
  },
  sucursalIcono: { fontSize: '1rem' },

  // Botón guardar
  btnGuardar: { width: '100%', padding: '1rem', marginTop: '10px' },

  // Vista listado
  btnNuevo: { width: '100%', marginBottom: 'var(--space-md)', padding: '0.8rem', fontSize: '0.875rem', height: '44px' },
  btnNuevoIcon: { fontSize: '1.2rem' },
  buscadorWrapper: { position: 'relative', marginBottom: '16px' },
  buscadorIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 },
  buscadorInput: { width: '100%', paddingLeft: '40px' },
  catTabsWrapper: {
    display: 'flex', gap: 'var(--space-sm)', overflowX: 'auto',
    paddingBottom: '12px', scrollbarWidth: 'none', marginBottom: 'var(--space-sm)'
  },
  listaProductos: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' },
  msgVacio: { textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-lg)' },

  // Card de producto
  productInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  productNameRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  productName: {
    fontSize: '0.875rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  equivalenteIcon: { fontSize: '0.9rem', color: 'var(--color-primary)' },
  productMeta: {
    margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', gap: '4px'
  },
  catLabel: { fontWeight: 'bold', color: 'var(--color-primary)' },
  locationIcon: { fontSize: '0.85rem' },
  productActions: { display: 'flex', gap: '6px', flexShrink: 0 },
  btnEditar: {
    padding: '0', width: '34px', height: '34px', borderRadius: 'var(--radius-lg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'var(--color-surface-low)'
  },
  btnEditarIcon: { fontSize: '1.05rem', color: 'var(--text-main)' },
  btnToggleIcon: { fontSize: '1.05rem' },
};

export default function Productos({ onVolver }) {
  const {
    loading, productos, catalogos,
    inicializar,
    cargarProductos,
    guardarProducto, toggleEstatus,
    filtroBusqueda, setFiltroBusqueda,
    catActiva, setCatActiva,
    listaCategoriasFiltro
  } = useProductos();

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);

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

  const [formData, setFormData] = useState(ESTADO_INICIAL_FORM);

  // Carga inicial unificada — un solo loading para productos y catálogos
  useEffect(() => {
    inicializar();
  }, [inicializar]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
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
    setFormData(ESTADO_INICIAL_FORM);
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
    if (!formData.nombre.trim()) return toast.error('El nombre es obligatorio'),{ duration: 2000 };
    if (!formData.categoria_id) return toast.error('La categoría es obligatoria'),{ duration: 2000 };
    if (!formData.um_id) return toast.error('La unidad de medida es obligatoria'),{ duration: 2000 };
    if (formData.id && formData.producto_equivalente_id === formData.id) {
      return toast.error('Un producto no puede ser su propio equivalente de Opción B'),{ duration: 2000 };
    }
    const exito = await guardarProducto(formData);
    if (exito) setMostrandoFormulario(false);
  };

  return (
    <div className={styles.fadeIN} style={sx.pagina}>

      {/* --- ENCABEZADO --- */}
      <header style={sx.header}>
        <div>
          <span className={styles.labelTop} style={sx.labelTopDisplay}>GESTIÓN DE INVENTARIO</span>
          <h1 className={styles.title} style={sx.titulo}>
            {mostrandoFormulario ? (formData.id ? 'Datos del\nProducto' : 'Nuevo\nProducto') : 'Productos'}
          </h1>
        </div>
        <button
          onClick={mostrandoFormulario ? () => setMostrandoFormulario(false) : onVolver}
          className={`${styles.btnBase} ${styles.btnSecondary}`}
          style={sx.btnVolver}
        >
          <span className="material-symbols-outlined" style={sx.btnVolverIcon}>arrow_back</span>
          Volver
        </button>
      </header>

      {mostrandoFormulario ? (
        /* --- FORMULARIO DE PRODUCTO --- */
        <section className={styles.card} style={sx.formSection}>
          <div style={sx.formGrid}>

            <div>
              <label className={styles.labelTop} style={sx.labelSm}>NOMBRE DEL PRODUCTO *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Ej: Aceite de Oliva" />
            </div>

            <div style={sx.formDual}>
              <div>
                <label className={styles.labelTop} style={sx.labelSm}>MARCA</label>
                <input type="text" name="marca" value={formData.marca} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Kirkland" />
              </div>
              <div>
                <label className={styles.labelTop} style={sx.labelSm}>CATEGORÍA *</label>
                <select name="categoria_id" value={formData.categoria_id} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="">Seleccionar...</option>
                  {catalogos.categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </div>

            <div style={sx.formDual}>
              <div>
                <label className={styles.labelTop} style={sx.labelSm}>PRESENTACIÓN (Empaque)</label>
                <input type="text" name="presentacion" value={formData.presentacion} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Ej: Caja, Saco, Botella" />
              </div>
              <div>
                <label className={styles.labelTop} style={sx.labelSm}>CONTENIDO NETO (Número)</label>
                <input type="number" name="contenido" value={formData.contenido} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Ej: 6, 1.5, 20" />
              </div>
            </div>

            <div style={sx.formDual}>
              <div>
                <label className={styles.labelTop} style={sx.labelSm}>UNIDAD DE MEDIDA (UM) *</label>
                <select name="um_id" value={formData.um_id} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="">Seleccionar...</option>
                  {catalogos.unidades.map(u => <option key={u.id} value={u.id}>{u.abreviatura} - {u.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.labelTop} style={sx.labelSm}>TURNO DE OPERACIÓN *</label>
                <select name="turno_uso" value={formData.turno_uso} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="Ambos">Ambos (Universal)</option>
                  <option value="AM">Mañana (AM)</option>
                  <option value="PM">Tarde/Cena (PM)</option>
                </select>
              </div>
            </div>

            <div style={sx.formDual}>
              <div>
                <label className={styles.labelTop} style={sx.labelSm}>PROVEEDOR PRINCIPAL</label>
                <select name="proveedor_id" value={formData.proveedor_id} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="">Ninguno</option>
                  {catalogos.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              {/* --- SELECTOR BUSCABLE DE OPCIÓN B --- */}
              <div ref={dropdownRef}>
                <label className={styles.labelTop} style={{ ...sx.labelSm, ...sx.opcionBLabel }}>INSUMO EQUIVALENTE (OPCIÓN B)</label>
                <div style={sx.opcionBRelativo}>

                  {/* Pseudo-Input (Caja que se ve) */}
                  <div
                    onClick={() => setMostrarOpcionesB(!mostrarOpcionesB)}
                    className={styles.inputEditorial}
                    style={sx.opcionBTrigger}
                  >
                    <span style={sx.opcionBTexto}>
                      {formData.producto_equivalente_id
                        ? (() => {
                            const p = catalogos.productosAlternos.find(x => x.id === formData.producto_equivalente_id);
                            return p ? `${p.nombre.toUpperCase()} ${p.marca ? `(${p.marca.toUpperCase()})` : ''}` : 'Ninguno';
                          })()
                        : 'Ninguno'}
                    </span>
                    <span className="material-symbols-outlined" style={sx.opcionBChevron}>
                      {mostrarOpcionesB ? 'arrow_drop_up' : 'arrow_drop_down'}
                    </span>
                  </div>

                  {/* Panel Desplegable */}
                  {mostrarOpcionesB && (
                    <div style={sx.opcionBDropdown}>
                      <div style={sx.opcionBSearchBox}>
                        <input
                          type="text"
                          placeholder="Buscar insumo (nombre o marca)..."
                          value={busquedaOpcionB}
                          onChange={(e) => setBusquedaOpcionB(e.target.value)}
                          className={styles.inputEditorial}
                          style={sx.opcionBSearchInput}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                      <div style={sx.opcionBLista}>
                        {/* Opción: Ninguno */}
                        <div
                          onClick={() => { setFormData({ ...formData, producto_equivalente_id: '' }); setMostrarOpcionesB(false); setBusquedaOpcionB(''); }}
                          style={{
                            padding: '10px 12px', cursor: 'pointer', fontSize: '0.85rem',
                            borderBottom: '1px solid var(--border-ghost)',
                            fontWeight: !formData.producto_equivalente_id ? 'bold' : 'normal',
                            color: !formData.producto_equivalente_id ? 'var(--color-primary)' : 'var(--text-main)'
                          }}
                        >
                          Ninguno
                        </div>
                        {/* Lista de productos alternos */}
                        {catalogos.productosAlternos
                          .filter(p => p.id !== formData.id)
                          .filter(p => {
                            if (!busquedaOpcionB) return true;
                            const query = busquedaOpcionB.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            const target = (p.nombre + " " + (p.marca || '')).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            return target.includes(query);
                          })
                          .map(p => {
                            const isSelected = formData.producto_equivalente_id === p.id;
                            return (
                              <div
                                key={p.id}
                                onClick={() => { setFormData({ ...formData, producto_equivalente_id: p.id }); setMostrarOpcionesB(false); setBusquedaOpcionB(''); }}
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
                            );
                          })
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={styles.labelTop} style={sx.labelSm}>VISIBILIDAD EN SUCURSALES</label>
              <div style={sx.sucursalesGrid}>
                {catalogos.sucursales.map(suc => {
                  const selec = formData.sucursales_ids.includes(suc.id);
                  return (
                    <div
                      key={suc.id}
                      onClick={() => handleSucursalCheckboxChange(suc.id)}
                      style={{
                        padding: 'var(--space-sm)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.7rem',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        cursor: 'pointer',
                        backgroundColor: selec ? 'var(--color-primary)' : 'var(--color-surface-lowest)',
                        color: selec ? 'var(--color-surface-lowest)' : 'inherit',
                        border: '1px solid var(--border-ghost)',
                        fontWeight: 'bold'
                      }}
                    >
                      <span className="material-symbols-outlined" style={sx.sucursalIcono}>
                        {selec ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      {suc.nombre}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button onClick={procesarGuardado} disabled={loading} className={`${styles.btnBase} ${styles.btnPrimary}`} style={sx.btnGuardar}>
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
            style={sx.btnNuevo}
          >
            <span className="material-symbols-outlined" style={sx.btnNuevoIcon}>add_box</span>
            REGISTRAR PRODUCTO
          </button>

          {/* Buscador de Texto */}
          <div style={sx.buscadorWrapper}>
            <span className="material-symbols-outlined" style={sx.buscadorIcon}>search</span>
            <input
              type="text"
              placeholder="Buscar por nombre, marca o categoría..."
              className={styles.inputEditorial}
              style={sx.buscadorInput}
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
            />
          </div>

          {/* Barra de Categorías */}
          <div style={sx.catTabsWrapper}>
            {listaCategoriasFiltro.map(cat => (
              <button
                key={cat}
                onClick={() => setCatActiva(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  border: catActiva === cat ? 'none' : '1px solid var(--border-ghost)',
                  backgroundColor: catActiva === cat ? 'var(--color-primary)' : 'var(--color-surface-lowest)',
                  color: catActiva === cat ? 'var(--color-surface-lowest)' : 'var(--text-main)'
                }}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Listado de Cards — 'productos' ya viene filtrado desde el hook */}
          <div style={sx.listaProductos}>
            {productos.length === 0 ? (
              <p style={sx.msgVacio}>No se encontraron productos con esos criterios.</p>
            ) : (
              productos.map(prod => {
                const esActivo = prod.activo;
                const numSucs = prod.sucursales_ids?.length || 0;
                return (
                  <div
                    key={prod.id}
                    className={styles.card}
                    style={{
                      display: 'flex', flexDirection: 'row',
                      justifyContent: 'space-between', alignItems: 'center',
                      opacity: esActivo ? 1 : 0.65,
                      borderLeft: esActivo
                        ? '4px solid var(--color-primary)'
                        : '4px solid var(--text-light)',     // Era #999
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-xl)',      // Era 10px
                      backgroundColor: 'var(--color-surface-lowest)', // Era 'white'
                      boxShadow: 'var(--shadow-card)',        // Era rgba inline
                      gap: '12px', minHeight: '64px'
                    }}
                  >
                    <div style={sx.productInfo}>
                      <div style={sx.productNameRow}>
                        <h4 style={sx.productName}>{prod.nombre}</h4>
                        {prod.producto_equivalente_id && (
                          <span
                            title="Tiene insumo equivalente de respaldo (Opción B)"
                            className="material-symbols-outlined"
                            style={sx.equivalenteIcon}
                          >
                            swap_horiz
                          </span>
                        )}
                      </div>
                      <p style={sx.productMeta}>
                        <span style={sx.catLabel}>{prod.categoria?.nombre || 'S/C'}</span>
                        <span>•</span>
                        <span>{prod.presentacion || 'PZ'} ({prod.contenido || 1} {prod.um_abreviatura || prod.um?.abreviatura || 'pz'})</span>
                        <span>•</span>
                        {/* Colores de turno ahora usan tokens semánticos */}
                        <span style={{
                          fontWeight: 'bold',
                          color: prod.turno_uso === 'AM'
                            ? COLOR_TURNO_AM
                            : prod.turno_uso === 'PM'
                              ? COLOR_TURNO_PM
                              : 'var(--text-muted)'
                        }}>
                          {prod.turno_uso === 'AM' ? 'AM' : prod.turno_uso === 'PM' ? 'PM' : 'Ambos'}
                        </span>
                        <span>•</span>
                        <span className="material-symbols-outlined" style={sx.locationIcon}>location_on</span>
                        {numSucs === 0 ? 'Todas' : `${numSucs} sucs`}
                      </p>
                    </div>

                    <div style={sx.productActions}>
                      <button
                        onClick={() => abrirParaEditar(prod)}
                        className={styles.btnSecondary}
                        style={sx.btnEditar}
                      >
                        <span className="material-symbols-outlined" style={sx.btnEditarIcon}>edit</span>
                      </button>
                      <button
                        onClick={() => toggleEstatus(prod.id, prod.activo)}
                        className={styles.btnOutlined}
                        style={{
                          padding: '0', width: '34px', height: '34px',
                          borderRadius: 'var(--radius-lg)',   // Era '8px'
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderColor: esActivo ? COLOR_DANGER : 'var(--color-primary)',
                          color:       esActivo ? COLOR_DANGER : 'var(--color-primary)',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <span className="material-symbols-outlined" style={sx.btnToggleIcon}>
                          {esActivo ? 'visibility_off' : 'visibility'}
                        </span>
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