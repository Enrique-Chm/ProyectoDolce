// src/modules/Admin/Tabs/Configuracion/Sucursales.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useConfiguracion } from './2useConfiguracion';
import toast from 'react-hot-toast';

export default function Sucursales({ onVolver }) {
  const { 
    loading, 
    sucursales, 
    cargarSucursales, 
    guardarSucursal, 
    cambiarEstatus 
  } = useConfiguracion();

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);

  // --- ESTADO INICIAL SINCRONIZADO CON TU SQL (CON SOPORTE DE TURNOS MULTI-SELECCIÓN) ---
  const estadoInicial = {
    id: null,
    nombre: '',
    direccion: '', // Mapeado a la columna 'direccion' de tu tabla
    horario: '',   // Mapeado a la columna 'horario' de tu tabla
    estatus: 'Activo',
    turnos_permitidos: ['AM', 'PM'] // Array por defecto
  };
  
  const [formData, setFormData] = useState(estadoInicial);

  // Cargamos los datos al entrar
  useEffect(() => {
    cargarSucursales();
  }, [cargarSucursales]);

  // Manejador de cambios en inputs básicos
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Manejador reactivo para conmutar turnos dentro del array
  const toggleTurnoPermitido = (turnoTag) => {
    const actuales = formData.turnos_permitidos || [];
    if (actuales.includes(turnoTag)) {
      setFormData({ 
        ...formData, 
        turnos_permitidos: actuales.filter(t => t !== turnoTag) 
      });
    } else {
      setFormData({ 
        ...formData, 
        turnos_permitidos: [...actuales, turnoTag] 
      });
    }
  };

  // Preparar formulario para nueva sucursal
  const abrirCrear = () => {
    setFormData(estadoInicial);
    setMostrandoFormulario(true);
  };

  // Preparar formulario para editar existente
  const abrirEditar = (suc) => {
    setFormData({ 
      ...suc,
      turnos_permitidos: Array.isArray(suc.turnos_permitidos) ? suc.turnos_permitidos : ['AM', 'PM']
    });
    setMostrandoFormulario(true);
  };

  // Función para enviar a la base de datos
  const procesarGuardado = async () => {
    if (!formData.nombre.trim()) {
      return toast.error('El nombre de la sucursal es obligatorio');
    }

    if (!formData.turnos_permitidos || formData.turnos_permitidos.length === 0) {
      return toast.error('Debe seleccionar al menos un turno permitido para operar');
    }
    
    const exito = await guardarSucursal(formData);
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
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>GESTIÓN DE PUNTOS DE VENTA</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
            {mostrandoFormulario ? 'Datos de\nSucursal' : 'Sucursales'}
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
        <section className={styles.card} style={{ animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Campo: Nombre */}
            <div>
              <label className={styles.labelTop}>NOMBRE DE LA SUCURSAL *</label>
              <input 
                type="text" 
                name="nombre" 
                value={formData.nombre} 
                onChange={handleInputChange}
                className={styles.inputEditorial} 
                placeholder="Ej: Sucursal Centro" 
              />
            </div>
            
            {/* Campo: Dirección */}
            <div>
              <label className={styles.labelTop}>DIRECCIÓN</label>
              <input 
                type="text" 
                name="direccion" 
                value={formData.direccion} 
                onChange={handleInputChange}
                className={styles.inputEditorial} 
                placeholder="Calle, Número y Colonia" 
              />
            </div>

            {/* Campo: Horario */}
            <div>
              <label className={styles.labelTop}>HORARIO DE ATENCIÓN</label>
              <input 
                type="text" 
                name="horario" 
                value={formData.horario} 
                onChange={handleInputChange}
                className={styles.inputEditorial} 
                placeholder="Ej: Lunes a Viernes 8:00 AM - 6:00 PM" 
              />
            </div>

            {/* NUEVO Campo: Turnos Operativos Permitidos */}
            <div>
              <label className={styles.labelTop}>TURNOS OPERATIVOS PERMITIDOS *</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <div 
                  onClick={() => toggleTurnoPermitido('AM')}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    border: '1px solid var(--border-ghost)',
                    fontWeight: 'bold',
                    backgroundColor: formData.turnos_permitidos?.includes('AM') ? 'var(--color-primary)' : 'white',
                    color: formData.turnos_permitidos?.includes('AM') ? 'white' : 'var(--text-main)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                    {formData.turnos_permitidos?.includes('AM') ? 'check_box' : 'light_mode'}
                  </span>
                  MAÑANA (AM)
                </div>
                <div 
                  onClick={() => toggleTurnoPermitido('PM')}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    border: '1px solid var(--border-ghost)',
                    fontWeight: 'bold',
                    backgroundColor: formData.turnos_permitidos?.includes('PM') ? 'var(--color-primary)' : 'white',
                    color: formData.turnos_permitidos?.includes('PM') ? 'white' : 'var(--text-main)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                    {formData.turnos_permitidos?.includes('PM') ? 'check_box' : 'dark_mode'}
                  </span>
                  TARDE/NOCHE (PM)
                </div>
              </div>
            </div>
            
            <button 
              onClick={procesarGuardado} 
              disabled={loading} 
              className={`${styles.btnBase} ${styles.btnPrimary}`} 
              style={{ width: '100%', padding: '1.2rem', marginTop: '10px' }}
            >
              <span className="material-symbols-outlined">
                {loading ? 'sync' : 'save'}
              </span>
              {loading ? 'GUARDANDO...' : 'CONFIRMAR Y GUARDAR'}
            </button>
          </div>
        </section>
      ) : (
        /* --- VISTA: LISTADO --- */
        <>
          <button 
            onClick={abrirCrear} 
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ width: '100%', marginBottom: 'var(--space-md)', padding: '0.8rem', fontSize: '0.875rem', height: '44px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add_business</span>
            REGISTRAR SUCURSAL
          </button>

          {sucursales.length === 0 && !loading && (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay sucursales registradas.</p>
          )}

          {/* LISTA DE FILAS COMPACTAS PARA MÓVIL (Aprovechamiento visual extremo) */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '8px',
            width: '100%'
          }}>
            {sucursales.map((suc) => {
              const esActivo = suc.estatus === 'Activo';
              return (
                <div 
                  key={suc.id} 
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
                        {suc.nombre}
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
                        {esActivo ? 'Activa' : 'Baja'}
                      </span>

                      {/* Etiquetas de Turnos Operativos Activos en la Sucursal */}
                      <div style={{ display: 'flex', gap: '3px', marginLeft: 'auto' }}>
                        {suc.turnos_permitidos?.includes('AM') && (
                          <span style={{ fontSize: '0.55rem', fontWeight: 'bold', backgroundColor: '#fff3e0', color: '#e67e22', padding: '1px 5px', borderRadius: '4px' }}>AM</span>
                        )}
                        {suc.turnos_permitidos?.includes('PM') && (
                          <span style={{ fontSize: '0.55rem', fontWeight: 'bold', backgroundColor: '#f3e5f5', color: '#9b59b6', padding: '1px 5px', borderRadius: '4px' }}>PM</span>
                        )}
                      </div>
                    </div>

                    {/* Dirección */}
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>location_on</span>
                      {suc.direccion || 'Sin dirección registrada'}
                    </p>

                    {/* Horario */}
                    {suc.horario && (
                      <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>schedule</span>
                        {suc.horario}
                      </p>
                    )}
                  </div>
                  
                  {/* Bloque Derecho: Botones de Acción Mini */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button 
                      onClick={() => abrirEditar(suc)} 
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
                      title="Editar Sucursal"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>edit</span>
                    </button>
                    <button 
                      onClick={() => cambiarEstatus('Cat_sucursales', suc.id, suc.estatus, cargarSucursales)} 
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
                      title={esActivo ? 'Desactivar Sucursal' : 'Activar Sucursal'}
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