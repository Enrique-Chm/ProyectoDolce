// src/modules/Admin/Tabs/Configuracion/Trabajadores.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useConfiguracion as useTrabajadores } from './2useConfiguracion';
import toast from 'react-hot-toast';

export default function Trabajadores({ onVolver }) {
  const { 
    loading, 
    trabajadores, 
    roles,      
    sucursales, 
    cargarDatosIniciales, 
    guardarTrabajador, 
    cambiarEstatus 
  } = useTrabajadores();

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  const estadoInicial = {
    id: null,
    nombre_completo: '',
    usuario: '',
    password: '',
    puesto: '',
    rol_id: '',
    sucursales_ids: [], 
    fecha_ingreso: new Date().toISOString().split('T')[0],
    estatus: 'Activo'
  };
  
  const [formData, setFormData] = useState(estadoInicial);

  useEffect(() => {
    cargarDatosIniciales();
  }, [cargarDatosIniciales]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleSucursal = (id) => {
    setFormData(prev => {
      const actual = prev.sucursales_ids || [];
      if (actual.includes(id)) {
        return { ...prev, sucursales_ids: actual.filter(sId => sId !== id) };
      } else {
        return { ...prev, sucursales_ids: [...actual, id] };
      }
    });
  };

  const toggleTodasSucursales = () => {
    if (formData.sucursales_ids.length === sucursales.length) {
      setFormData({ ...formData, sucursales_ids: [] });
    } else {
      setFormData({ ...formData, sucursales_ids: sucursales.map(s => s.id) });
    }
  };

  const abrirCrear = () => {
    setFormData(estadoInicial);
    setMostrandoFormulario(true);
  };

  const abrirEditar = (traba) => {
    setFormData({ 
      id: traba.id,
      nombre_completo: traba.nombre_completo || '',
      usuario: traba.usuario || '',
      password: '', 
      puesto: traba.puesto || '',
      rol_id: traba.rol_id || '',
      sucursales_ids: traba.sucursales_ids || [], 
      fecha_ingreso: traba.fecha_ingreso || '',
      estatus: traba.estatus || 'Activo'
    });
    setMostrandoFormulario(true);
  };

  const procesarGuardado = async () => {
    if (!formData.nombre_completo.trim()) return toast.error('El nombre es obligatorio');
    if (!formData.usuario.trim()) return toast.error('El usuario es obligatorio');
    if (!formData.id && !formData.password) return toast.error('La contraseña es obligatoria');
    if (!formData.rol_id) return toast.error('Debes asignar un rol');
    if (formData.sucursales_ids.length === 0) return toast.error('Selecciona al menos una sucursal');

    const exito = await guardarTrabajador(formData);
    if (exito) {
      setMostrandoFormulario(false);
      setFormData(estadoInicial);
    }
  };

  const trabajadoresFiltrados = trabajadores.filter(t => {
    const busqueda = filtroBusqueda.toLowerCase();
    const nombresSucursales = (t.sucursales_nombres_lista || []).join(' ').toLowerCase();
    
    return (
      t.nombre_completo.toLowerCase().includes(busqueda) ||
      t.usuario.toLowerCase().includes(busqueda) ||
      t.puesto.toLowerCase().includes(busqueda) ||
      (t.rol_nombre || '').toLowerCase().includes(busqueda) ||
      nombresSucursales.includes(busqueda)
    );
  });

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%', paddingBottom: '40px' }}>
      
      {/* --- ENCABEZADO EDITORIAL --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>GESTIÓN DE EQUIPO</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1', margin: 0 }}>
            {mostrandoFormulario ? 'Ficha del\nPersonal' : 'Plantilla de\nTrabajadores'}
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
        /* --- VISTA: FORMULARIO --- */
        <section className={styles.card} style={{ animation: 'slideUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            <div>
              <label className={styles.labelTop}>NOMBRE COMPLETO *</label>
              <input 
                type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleInputChange}
                className={styles.inputEditorial} placeholder="Ej: Juan Pérez Maldonado" 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className={styles.labelTop}>USUARIO (LOGIN) *</label>
                <input 
                  type="text" name="usuario" value={formData.usuario} onChange={handleInputChange}
                  className={styles.inputEditorial} placeholder="perez.juan" 
                />
              </div>
              <div>
                <label className={styles.labelTop}>CONTRASEÑA {formData.id && '(Opcional)'}</label>
                <input 
                  type="password" name="password" value={formData.password} onChange={handleInputChange}
                  className={styles.inputEditorial} placeholder="••••••••" 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className={styles.labelTop}>PUESTO / CARGO *</label>
                <input 
                  type="text" name="puesto" value={formData.puesto} onChange={handleInputChange}
                  className={styles.inputEditorial} placeholder="Ej: Cocinero A" 
                />
              </div>
              <div>
                <label className={styles.labelTop}>ROL DE SISTEMA *</label>
                <select 
                  name="rol_id" value={formData.rol_id} onChange={handleInputChange}
                  className={styles.selectEditorial}
                >
                  <option value="">Seleccionar Rol...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SELECTOR DE SUCURSALES */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className={styles.labelTop} style={{ marginBottom: 0 }}>SUCURSALES ASIGNADAS *</label>
                <button 
                  type="button" 
                  onClick={toggleTodasSucursales}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  {formData.sucursales_ids.length === sucursales.length ? 'DESELECCIONAR TODAS' : 'SELECCIONAR TODAS'}
                </button>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                gap: '8px',
                padding: '12px',
                background: 'var(--color-surface-lowest)',
                borderRadius: '12px',
                maxHeight: '160px',
                overflowY: 'auto',
                border: '1px solid var(--border-ghost)'
              }}>
                {sucursales.map(s => {
                  const seleccionado = formData.sucursales_ids.includes(s.id);
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => toggleSucursal(s.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        backgroundColor: seleccionado ? 'var(--color-primary)' : 'white',
                        color: seleccionado ? 'white' : 'var(--text-main)',
                        border: '1px solid ' + (seleccionado ? 'var(--color-primary)' : 'var(--border-ghost)'),
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                        {seleccionado ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span style={{ fontWeight: seleccionado ? 'bold' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.nombre}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={styles.labelTop}>FECHA DE INGRESO</label>
              <input 
                type="date" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={handleInputChange}
                className={styles.inputEditorial}
              />
            </div>
          </div>

          <button 
            onClick={procesarGuardado} 
            disabled={loading} 
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ width: '100%', padding: '1rem', marginTop: '10px' }}
          >
            <span className="material-symbols-outlined">how_to_reg</span>
            {loading ? 'GUARDANDO...' : formData.id ? 'ACTUALIZAR DATOS' : 'REGISTRAR TRABAJADOR'}
          </button>
        </section>
      ) : (
        /* --- VISTA: LISTADO (HOMOLOGADO) --- */
        <>
          <button 
            onClick={abrirCrear} 
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ width: '100%', marginBottom: 'var(--space-md)', padding: '0.8rem', fontSize: '0.875rem', height: '44px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>person_add</span>
            REGISTRAR TRABAJADOR
          </button>

          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>search</span>
            <input 
              type="text" placeholder="Buscar por nombre, puesto, rol o sucursal..." 
              className={styles.inputEditorial}
              style={{ width: '100%', paddingLeft: '40px' }}
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {trabajadoresFiltrados.map((traba) => {
              const esActivo = traba.estatus === 'Activo';
              const numSucs = traba.sucursales_ids?.length || 0;
              
              let textoSucursales = "Sin sucursal";
              if (numSucs === sucursales.length && sucursales.length > 0) {
                textoSucursales = "Todas las sucursales";
              } else if (numSucs === 1) {
                textoSucursales = traba.sucursales_nombres_lista?.[0] || "1 Sucursal";
              } else if (numSucs > 1) {
                textoSucursales = `${numSucs} Sucursales`;
              }

              return (
                <div 
                  key={traba.id} 
                  className={styles.card} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'row',
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    opacity: esActivo ? 1 : 0.65,
                    borderLeft: esActivo ? '4px solid var(--color-primary)' : '4px solid #999',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                    minHeight: '64px',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h4 style={{ fontSize: '0.875rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {traba.nombre_completo}
                      </h4>
                      <span style={{ 
                        fontSize: '0.55rem', 
                        background: esActivo ? 'var(--color-primary-fixed)' : 'var(--color-surface-high)', 
                        color: esActivo ? 'var(--color-on-primary-fixed)' : 'var(--text-muted)', 
                        padding: '1px 6px', 
                        borderRadius: '4px', 
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {esActivo ? 'ACTIVO' : 'BAJA'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>badge</span>
                      <span>{traba.puesto}</span>
                      <span>•</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>store</span>
                      <span style={{ 
                        fontWeight: numSucs === sucursales.length ? 'bold' : 'normal',
                        color: numSucs === sucursales.length ? 'var(--color-primary)' : 'inherit'
                      }}>
                        {textoSucursales}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button 
                      onClick={() => abrirEditar(traba)} 
                      className={styles.btnSecondary} 
                      style={{ 
                        padding: '0', width: '34px', height: '34px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'var(--color-surface-low)'
                      }} 
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>edit</span>
                    </button>
                    <button 
                      onClick={() => cambiarEstatus('Cat_Trabajadores', traba.id, traba.estatus, cargarDatosIniciales)} 
                      className={styles.btnOutlined} 
                      style={{ 
                        padding: '0', width: '34px', height: '34px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderColor: esActivo ? '#ba1a1a' : 'var(--color-primary)',
                        color: esActivo ? '#ba1a1a' : 'var(--color-primary)',
                        backgroundColor: 'transparent'
                      }} 
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>
                        {esActivo ? 'person_off' : 'person_check'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}

            {trabajadoresFiltrados.length === 0 && !loading && (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No se encontraron trabajadores.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}