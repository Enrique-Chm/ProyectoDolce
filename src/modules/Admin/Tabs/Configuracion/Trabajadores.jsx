// src/modules/Admin/Tabs/Configuracion/Trabajadores.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useConfiguracion } from './2useConfiguracion';
import toast from 'react-hot-toast';

export default function Trabajadores({ onVolver }) {
  const { 
    loading, 
    trabajadores, 
    catalogosSelectores,
    cargarTrabajadores, 
    cargarCatalogosParaFormularios,
    guardarTrabajador, 
    cambiarEstatus 
  } = useConfiguracion();

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);

  // --- ESTADO INICIAL ACTUALIZADO (Con Password y Rol) ---
  const estadoInicial = {
    id: null,
    nombre_completo: '',
    email: '',
    password: '',      // Requerido para el Login Interno
    rol_id: '',        // Vinculado a Cat_Roles
    puesto: '',        // Título descriptivo (ej: Chef Ejecutivo)
    rfc: '',
    curp: '',
    telefono: '',
    sucursal_id: '',
    estatus: 'Activo'
  };
  
  const [formData, setFormData] = useState(estadoInicial);

  // Cargamos trabajadores y los catálogos (sucursales y roles) necesarios
  useEffect(() => {
    cargarTrabajadores();
    cargarCatalogosParaFormularios();
  }, [cargarTrabajadores, cargarCatalogosParaFormularios]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const abrirCrear = () => {
    setFormData(estadoInicial);
    setMostrandoFormulario(true);
  };

  const abrirEditar = (trab) => {
    setFormData({
      id: trab.id,
      nombre_completo: trab.nombre_completo || '',
      email: trab.email || '',
      password: trab.password || '',
      rol_id: trab.rol_id || '',
      puesto: trab.puesto || '',
      rfc: trab.rfc || '',
      curp: trab.curp || '',
      telefono: trab.telefono || '',
      sucursal_id: trab.sucursal_id || '',
      estatus: trab.estatus || 'Activo'
    });
    setMostrandoFormulario(true);
  };

  const procesarGuardado = async () => {
    // Validaciones críticas para el Login
    if (!formData.nombre_completo.trim()) return toast.error('El nombre es obligatorio');
    if (!formData.email.trim()) return toast.error('El correo es obligatorio para el acceso');
    if (!formData.password.trim()) return toast.error('Debes asignar una contraseña');
    if (!formData.rol_id) return toast.error('Debes asignar un rol de usuario');
    if (!formData.puesto.trim()) return toast.error('El puesto es obligatorio');
    
    const datosLimpios = {
      ...formData,
      sucursal_id: formData.sucursal_id || null,
      rol_id: formData.rol_id || null,
      rfc: formData.rfc || null,
      curp: formData.curp || null,
      telefono: formData.telefono || null
    };

    const exito = await guardarTrabajador(datosLimpios);
    if (exito) {
      setMostrandoFormulario(false);
      setFormData(estadoInicial);
    }
  };

  return (
    <div className={styles.fadeIN}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '4px' }}>RECURSOS HUMANOS</span>
          <h1 className={styles.title} style={{ fontSize: '2.5rem', lineHeight: '1' }}>
            {mostrandoFormulario ? 'Acceso y\nPerfil' : 'Personal'}
          </h1>
        </div>
        <button 
          onClick={mostrandoFormulario ? () => setMostrandoFormulario(false) : onVolver} 
          className={`${styles.btnBase} ${styles.btnSecondary}`}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Volver
        </button>
      </header>

      {mostrandoFormulario ? (
        /* --- FORMULARIO DE REGISTRO / EDICIÓN --- */
        <section className={styles.card} style={{ animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label className={styles.labelTop}>NOMBRE COMPLETO *</label>
              <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleInputChange} className={styles.inputEditorial} />
            </div>

            {/* --- SECCIÓN DE ACCESO --- */}
            <div style={{ gridColumn: '1 / -1', padding: '15px', background: 'var(--color-surface-lowest)', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <span className={styles.labelTop} style={{ color: 'var(--color-primary)' }}>CREDENCIALES DE ACCESO</span>
              </div>
              <div>
                <label className={styles.labelTop}>EMAIL (USUARIO) *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={styles.inputEditorial} placeholder="correo@empresa.com" />
              </div>
              <div>
                <label className={styles.labelTop}>CONTRASEÑA *</label>
                <input type="text" name="password" value={formData.password} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Clave de entrada" />
              </div>
              <div>
                <label className={styles.labelTop}>ROL DE SISTEMA *</label>
                <select name="rol_id" value={formData.rol_id} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="">-- Seleccionar Rol --</option>
                  {catalogosSelectores.roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.labelTop}>SUCURSAL *</label>
                <select name="sucursal_id" value={formData.sucursal_id} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="">-- Seleccionar --</option>
                  {catalogosSelectores.sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            </div>

            {/* --- SECCIÓN ADMINISTRATIVA --- */}
            <div>
              <label className={styles.labelTop}>PUESTO / CARGO *</label>
              <input type="text" name="puesto" value={formData.puesto} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Ej: Chef Principal" />
            </div>
            <div>
              <label className={styles.labelTop}>TELÉFONO</label>
              <input type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} className={styles.inputEditorial} />
            </div>
            <div>
              <label className={styles.labelTop}>RFC</label>
              <input type="text" name="rfc" value={formData.rfc} onChange={handleInputChange} className={styles.inputEditorial} style={{ textTransform: 'uppercase' }} />
            </div>
            <div>
              <label className={styles.labelTop}>CURP</label>
              <input type="text" name="curp" value={formData.curp} onChange={handleInputChange} className={styles.inputEditorial} style={{ textTransform: 'uppercase' }} />
            </div>

            <button 
              onClick={procesarGuardado} 
              disabled={loading} 
              className={`${styles.btnBase} ${styles.btnPrimary}`} 
              style={{ gridColumn: '1 / -1', padding: '1.2rem', marginTop: '10px' }}
            >
              <span className="material-symbols-outlined">how_to_reg</span>
              {loading ? 'PROCESANDO...' : 'GUARDAR TRABAJADOR'}
            </button>
          </div>
        </section>
      ) : (
        /* --- LISTADO DE PERSONAL --- */
        <>
          <button onClick={abrirCrear} className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ width: '100%', marginBottom: 'var(--space-md)' }}>
            <span className="material-symbols-outlined">person_add</span>
            REGISTRAR TRABAJADOR
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {trabajadores.map((trab) => (
              <div 
                key={trab.id} 
                className={styles.card} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  opacity: trab.estatus === 'Activo' ? 1 : 0.6,
                  borderLeft: trab.estatus === 'Activo' ? '4px solid var(--color-primary)' : '4px solid var(--text-muted)'
                }}
              >
                <div>
                  <h4 className={styles.subtitle} style={{ marginBottom: '4px' }}>{trab.nombre_completo}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>verified_user</span>
                    <b>{trab.rol?.nombre || 'Sin Rol'}</b> • {trab.puesto}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px' }}>
                    {trab.sucursal?.nombre || 'S/S'} • {trab.email}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => abrirEditar(trab)} className={styles.btnSecondary} style={{ padding: '8px' }}>
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button 
                    onClick={() => cambiarEstatus('Cat_Trabajadores', trab.id, trab.estatus, cargarTrabajadores)} 
                    className={styles.btnOutlined} 
                    style={{ padding: '8px', color: trab.estatus === 'Activo' ? '#ba1a1a' : 'var(--color-primary)' }}
                  >
                    <span className="material-symbols-outlined">
                      {trab.estatus === 'Activo' ? 'person_off' : 'person_check'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}