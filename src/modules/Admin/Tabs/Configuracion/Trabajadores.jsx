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

  // --- ESTADO INICIAL (Sincronizado con el SQL de la BD) ---
  const estadoInicial = {
    id: null,
    nombre_completo: '',
    usuario: '',       // Campo obligatorio en la BD para el login
    email: '',         // Correo de contacto
    password: '',      // Credencial de acceso
    rol_id: '',        // ID de la tabla Cat_Roles
    puesto: '',        // Título del cargo
    rfc: '',
    curp: '',
    telefono: '',
    sucursal_id: '',
    estatus: 'Activo'
  };
  
  const [formData, setFormData] = useState(estadoInicial);

  // Carga inicial de datos
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
      usuario: trab.usuario || '',
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
    // Validaciones de negocio
    if (!formData.nombre_completo.trim()) return toast.error('El nombre es obligatorio');
    if (!formData.usuario.trim()) return toast.error('El ID de Usuario es obligatorio para el acceso');
    if (!formData.password.trim()) return toast.error('Debes asignar una contraseña');
    if (!formData.rol_id) return toast.error('Debes asignar un rol para los permisos');
    if (!formData.sucursal_id) return toast.error('Debes asignar una sucursal');
    
    // Limpieza de datos antes de enviar a Supabase
    const datosParaEnviar = {
      ...formData,
      // Aseguramos que los campos vacíos se envíen como NULL para no romper las FK o Constraints
      sucursal_id: formData.sucursal_id || null,
      rol_id: formData.rol_id || null,
      rfc: formData.rfc?.trim().toUpperCase() || null,
      curp: formData.curp?.trim().toUpperCase() || null,
      email: formData.email?.trim() || null,
      telefono: formData.telefono?.trim() || null
    };

    const exito = await guardarTrabajador(datosParaEnviar);
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
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '4px' }}>GESTIÓN DE EQUIPO</span>
          <h1 className={styles.title} style={{ fontSize: '2.5rem', lineHeight: '1' }}>
            {mostrandoFormulario ? 'Perfil de\nUsuario' : 'Personal'}
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
              <label className={styles.labelTop}>NOMBRE COMPLETO DEL TRABAJADOR *</label>
              <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Ej: Juan Pérez" />
            </div>

            {/* --- BLOQUE DE ACCESO AL SISTEMA --- */}
            <div style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--color-surface-lowest)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>lock_open</span>
                <span className={styles.labelTop} style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>CREDENCIALES Y ROL</span>
              </div>
              
              <div>
                <label className={styles.labelTop}>ID DE USUARIO / LOGIN *</label>
                <input type="text" name="usuario" value={formData.usuario} onChange={handleInputChange} className={styles.inputEditorial} placeholder="juan.perez" />
              </div>
              
              <div>
                <label className={styles.labelTop}>CONTRASEÑA *</label>
                <input type="text" name="password" value={formData.password} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Clave temporal o fija" />
              </div>

              <div>
                <label className={styles.labelTop}>ROL ASIGNADO (PERMISOS) *</label>
                <select name="rol_id" value={formData.rol_id} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="">-- Seleccionar Nivel de Acceso --</option>
                  {catalogosSelectores.roles.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={styles.labelTop}>SUCURSAL DE TRABAJO *</label>
                <select name="sucursal_id" value={formData.sucursal_id} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="">-- Seleccionar Ubicación --</option>
                  {catalogosSelectores.sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* --- INFORMACIÓN ADMINISTRATIVA --- */}
            <div>
              <label className={styles.labelTop}>PUESTO O CARGO *</label>
              <input type="text" name="puesto" value={formData.puesto} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Ej: Gerente de Ventas" />
            </div>

            <div>
              <label className={styles.labelTop}>CORREO ELECTRÓNICO</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={styles.inputEditorial} placeholder="contacto@correo.com" />
            </div>

            <div>
              <label className={styles.labelTop}>TELÉFONO DE CONTACTO</label>
              <input type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} className={styles.inputEditorial} placeholder="10 dígitos" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className={styles.labelTop}>RFC</label>
                <input type="text" name="rfc" value={formData.rfc} onChange={handleInputChange} className={styles.inputEditorial} style={{ textTransform: 'uppercase' }} maxLength={13} />
              </div>
              <div>
                <label className={styles.labelTop}>CURP</label>
                <input type="text" name="curp" value={formData.curp} onChange={handleInputChange} className={styles.inputEditorial} style={{ textTransform: 'uppercase' }} maxLength={18} />
              </div>
            </div>

            <button 
              onClick={procesarGuardado} 
              disabled={loading} 
              className={`${styles.btnBase} ${styles.btnPrimary}`} 
              style={{ gridColumn: '1 / -1', padding: '1.2rem', marginTop: '10px' }}
            >
              <span className="material-symbols-outlined">save</span>
              {loading ? 'GUARDANDO CAMBIOS...' : 'CONFIRMAR Y GUARDAR'}
            </button>
          </div>
        </section>
      ) : (
        /* --- LISTADO DE PERSONAL --- */
        <>
          <button onClick={abrirCrear} className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ width: '100%', marginBottom: 'var(--space-md)' }}>
            <span className="material-symbols-outlined">person_add</span>
            NUEVO REGISTRO DE TRABAJADOR
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {trabajadores.length === 0 && !loading && (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay trabajadores registrados.</p>
            )}
            
            {trabajadores.map((trab) => (
              <div 
                key={trab.id} 
                className={styles.card} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  opacity: trab.estatus === 'Activo' ? 1 : 0.6,
                  borderLeft: trab.estatus === 'Activo' ? '6px solid var(--color-primary)' : '6px solid #ccc',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <h4 className={styles.subtitle} style={{ marginBottom: '4px', fontSize: '1.1rem' }}>{trab.nombre_completo}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {trab.rol?.nombre || 'SIN ROL'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <i className="material-symbols-outlined" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>badge</i> {trab.puesto}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '6px' }}>
                    <b>ID:</b> {trab.usuario} | <b>Sucursal:</b> {trab.sucursal?.nombre || 'N/A'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => abrirEditar(trab)} className={styles.btnSecondary} style={{ padding: '8px' }} title="Editar Perfil">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button 
                    onClick={() => cambiarEstatus('Cat_Trabajadores', trab.id, trab.estatus, cargarTrabajadores)} 
                    className={styles.btnOutlined} 
                    style={{ 
                      padding: '8px', 
                      borderColor: trab.estatus === 'Activo' ? '#ba1a1a' : 'var(--color-primary)',
                      color: trab.estatus === 'Activo' ? '#ba1a1a' : 'var(--color-primary)'
                    }}
                    title={trab.estatus === 'Activo' ? 'Desactivar Usuario' : 'Activar Usuario'}
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