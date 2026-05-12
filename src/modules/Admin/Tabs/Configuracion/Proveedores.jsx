// src/modules/Admin/Tabs/Configuracion/Proveedores.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useConfiguracion } from './2useConfiguracion';
import toast from 'react-hot-toast';

export default function Proveedores({ onVolver }) {
  const { 
    loading, 
    proveedores, 
    cargarProveedores, 
    guardarProveedor, 
    cambiarEstatus 
  } = useConfiguracion();

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);

  /**
   * CONFIGURACIÓN DE DÍAS (Sincronizados con el motor de pedidos)
   * Usamos nombres completos para que coincidan con toLocaleDateString()
   */
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const estadoInicial = {
    id: null,
    nombre: '',
    direccion: '',
    numero_contacto: '',
    dias_abierto: [], // Mapeado al text[] de Postgres
    estatus: 'Activo'
  };
  
  const [formData, setFormData] = useState(estadoInicial);

  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  /**
   * Manejador para el arreglo de días.
   * Permite selección múltiple para definir el calendario de servicio.
   */
  const toggleDia = (dia) => {
    const nuevosDias = formData.dias_abierto.includes(dia)
      ? formData.dias_abierto.filter(d => d !== dia)
      : [...formData.dias_abierto, dia];
    setFormData({ ...formData, dias_abierto: nuevosDias });
  };

  const abrirCrear = () => {
    setFormData(estadoInicial);
    setMostrandoFormulario(true);
  };

  const abrirEditar = (prov) => {
    setFormData({ 
      id: prov.id,
      nombre: prov.nombre || '',
      direccion: prov.direccion || '',
      numero_contacto: prov.numero_contacto || '',
      dias_abierto: Array.isArray(prov.dias_abierto) ? prov.dias_abierto : [],
      estatus: prov.estatus || 'Activo'
    });
    setMostrandoFormulario(true);
  };

  const procesarGuardado = async () => {
    if (!formData.nombre.trim()) return toast.error('El nombre es obligatorio');
    
    // Limpieza de datos antes del envío
    const datosParaEnviar = {
      ...formData,
      direccion: formData.direccion || null,
      numero_contacto: formData.numero_contacto || null,
      // Si el array está vacío, enviamos null para la integridad de la base de datos
      dias_abierto: formData.dias_abierto.length > 0 ? formData.dias_abierto : null
    };

    const exito = await guardarProveedor(datosParaEnviar);
    if (exito) {
      setMostrandoFormulario(false);
      setFormData(estadoInicial);
      // cargarProveedores() se llama dentro del hook tras el guardado
    }
  };

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%' }}>
      
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>GESTIÓN DE SOCIOS</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
            {mostrandoFormulario ? 'Datos del\nProveedor' : 'Proveedores'}
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
            
            <div>
              <label className={styles.labelTop}>NOMBRE / EMPRESA *</label>
              <input 
                type="text" name="nombre" value={formData.nombre} onChange={handleInputChange}
                className={styles.inputEditorial} placeholder="Ej: Distribuidora de Lácteos" 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label className={styles.labelTop}>TELÉFONO</label>
                <input 
                  type="text" name="numero_contacto" value={formData.numero_contacto} onChange={handleInputChange}
                  className={styles.inputEditorial} placeholder="6671234567" 
                />
              </div>
              <div>
                <label className={styles.labelTop}>ESTATUS</label>
                <select name="estatus" value={formData.estatus} onChange={handleInputChange} className={styles.selectEditorial}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <div>
              <label className={styles.labelTop}>DIRECCIÓN</label>
              <input 
                type="text" name="direccion" value={formData.direccion} onChange={handleInputChange}
                className={styles.inputEditorial} placeholder="Calle, Número y Colonia" 
              />
            </div>

            {/* --- SELECCIÓN DE DÍAS DE SERVICIO --- */}
            <div>
              <label className={styles.labelTop}>DÍAS DE ATENCIÓN / REPARTO</label>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Solo se mostrarán sus productos en estos días seleccionados.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {diasSemana.map(dia => {
                  const seleccionado = formData.dias_abierto.includes(dia);
                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDia(dia)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '20px',
                        border: seleccionado ? 'none' : '1px solid var(--border-ghost)',
                        backgroundColor: seleccionado ? 'var(--color-primary)' : 'var(--color-surface-lowest)',
                        color: seleccionado ? 'white' : 'var(--text-main)',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <button 
              onClick={procesarGuardado} 
              disabled={loading} 
              className={`${styles.btnBase} ${styles.btnPrimary}`} 
              style={{ width: '100%', padding: '1.2rem', marginTop: '10px' }}
            >
              <span className="material-symbols-outlined">save</span>
              {loading ? 'GUARDANDO...' : 'GUARDAR PROVEEDOR'}
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
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add</span>
            AGREGAR PROVEEDOR
          </button>

          {proveedores.length === 0 && !loading && (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay proveedores registrados.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {proveedores.map((prov) => {
              const esActivo = prov.estatus === 'Activo';
              return (
                <div 
                  key={prov.id} 
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
                    minHeight: '64px',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h4 style={{ fontSize: '0.875rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prov.nombre}
                      </h4>
                      <span style={{ 
                        fontSize: '0.5rem', 
                        background: esActivo ? 'var(--color-primary-fixed)' : 'var(--color-surface-high)', 
                        color: esActivo ? 'var(--color-on-primary-fixed)' : 'var(--text-muted)', 
                        padding: '1px 6px', 
                        borderRadius: '4px', 
                        fontWeight: '800',
                        textTransform: 'uppercase'
                      }}>
                        {prov.estatus}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>call</span>
                      <span>{prov.numero_contacto || 'S/T'}</span>
                      <span>•</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>calendar_today</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        {prov.dias_abierto?.length === 7 ? 'Toda la semana' : prov.dias_abierto?.join(', ') || 'Sin días definidos'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => abrirEditar(prov)} className={styles.btnSecondary} style={{ padding: '0', width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface-low)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>edit</span>
                    </button>
                    <button onClick={() => cambiarEstatus('Cat_Proveedores', prov.id, prov.estatus, cargarProveedores)} className={styles.btnOutlined} style={{ padding: '0', width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: esActivo ? '#ba1a1a' : 'var(--color-primary)', color: esActivo ? '#ba1a1a' : 'var(--color-primary)', backgroundColor: 'transparent' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>{esActivo ? 'visibility_off' : 'visibility'}</span>
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