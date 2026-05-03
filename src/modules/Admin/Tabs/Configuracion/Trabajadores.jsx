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
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%' }}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>GESTIÓN DE EQUIPO</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
            {mostrandoFormulario ? 'Perfil de\nUsuario' : 'Personal'}
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
        /* --- FORMULARIO DE REGISTRO / EDICIÓN --- */
        <section className={styles.card} style={{ animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label className={styles.labelTop}>NOMBRE COMPLETO DEL TRABAJADOR *</label>
              <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleInputChange} className={styles.inputEditorial} placeholder="Ej: Juan Pérez" />
            </div>

            {/* --- BLOQUE DE ACCESO AL SISTEMA --- */}
            <div style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--color-surface-lowest)', border: '1px solid var(--border-ghost)', borderRadius: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
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
          <button 
            onClick={abrirCrear} 
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ width: '100%', marginBottom: 'var(--space-md)', padding: '0.8rem', fontSize: '0.875rem', height: '44px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>person_add</span>
            NUEVO REGISTRO
          </button>

          {trabajadores.length === 0 && !loading && (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay trabajadores registrados.</p>
          )}

          {/* LISTA COMPACTA DE FILAS OPTIMIZADA PARA MÓVIL */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '8px',
            width: '100%'
          }}>
            {trabajadores.map((trab) => {
              const esActivo = trab.estatus === 'Activo';
              return (
                <div 
                  key={trab.id} 
                  className={styles.card} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'row',
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    opacity: esActivo ? 1 : 0.65,
                    borderLeft: esActivo ? '4px solid var(--color-primary)' : '4px solid #999',
                    borderTop: 'none',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                    minHeight: '64px',
                    gap: '12px'
                  }}
                >
                  {/* Bloque Izquierdo: Información Resumida */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                      <h4 className={styles.subtitle} style={{ 
                        fontSize: '0.875rem', 
                        margin: 0, 
                        fontWeight: 'bold', 
                        color: 'var(--text-main)', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {trab.nombre_completo}
                      </h4>
                      <span style={{ 
                        fontSize: '0.55rem', 
                        background: esActivo ? 'var(--color-primary-fixed)' : 'var(--color-surface-high)', 
                        color: esActivo ? 'var(--color-on-primary-fixed)' : 'var(--text-muted)', 
                        padding: '1px 6px', 
                        borderRadius: '4px', 
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap'
                      }}>
                        {trab.rol?.nombre || 'S/R'}
                      </span>
                    </div>

                    {/* Puesto */}
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>badge</span>
                      {trab.puesto || 'Puesto no asignado'}
                    </p>

                    {/* ID y Sucursal en una sola línea */}
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.65rem', color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span>👤 ID: <b>{trab.usuario}</b></span>
                      <span>•</span>
                      <span>📍 <b>{trab.sucursal?.nombre || 'N/A'}</b></span>
                    </div>
                  </div>
                  
                  {/* Bloque Derecho: Botones de Acción Mini */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button 
                      onClick={() => abrirEditar(trab)} 
                      className={styles.btnSecondary} 
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
                      title="Editar Perfil"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>edit</span>
                    </button>
                    <button 
                      onClick={() => cambiarEstatus('Cat_Trabajadores', trab.id, trab.estatus, cargarTrabajadores)} 
                      className={styles.btnOutlined} 
                      style={{ 
                        padding: '0', 
                        width: '34px', 
                        height: '34px', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderColor: esActivo ? '#ba1a1a' : 'var(--color-primary)',
                        color: esActivo ? '#ba1a1a' : 'var(--color-primary)',
                        backgroundColor: 'transparent'
                      }}
                      title={esActivo ? 'Desactivar Usuario' : 'Activar Usuario'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>
                        {esActivo ? 'person_off' : 'person_check'}
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