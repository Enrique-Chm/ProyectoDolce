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

  // --- CONFIGURACIÓN DE DÍAS ---
  const diasSemana = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  const estadoInicial = {
    id: null,
    nombre: '',
    direccion: '',
    numero_contacto: '',
    dias_abierto: [], // Mapeado al text[] de tu SQL
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

  // Manejador especial para el arreglo de días
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
      dias_abierto: prov.dias_abierto || [],
      estatus: prov.estatus || 'Activo'
    });
    setMostrandoFormulario(true);
  };

  const procesarGuardado = async () => {
    if (!formData.nombre.trim()) return toast.error('El nombre es obligatorio');
    
    const datosParaEnviar = {
      ...formData,
      direccion: formData.direccion || null,
      numero_contacto: formData.numero_contacto || null,
      // Si no hay días, mandamos null para limpiar la celda en Postgres
      dias_abierto: formData.dias_abierto.length > 0 ? formData.dias_abierto : null
    };

    const exito = await guardarProveedor(datosParaEnviar);
    if (exito) {
      setMostrandoFormulario(false);
      setFormData(estadoInicial);
    }
  };

  return (
    <div className={styles.fadeIN}>
      <header style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '4px' }}>GESTIÓN DE SOCIOS</span>
          <h1 className={styles.title} style={{ fontSize: '2.5rem', lineHeight: '1' }}>
            {mostrandoFormulario ? 'Datos del\nProveedor' : 'Proveedores'}
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
        <section className={styles.card} style={{ animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label className={styles.labelTop}>NOMBRE / EMPRESA *</label>
              <input 
                type="text" name="nombre" value={formData.nombre} onChange={handleInputChange}
                className={styles.inputEditorial} placeholder="Ej: Distribuidora de Lácteos" 
              />
            </div>

            <div>
              <label className={styles.labelTop}>DIRECCIÓN</label>
              <input 
                type="text" name="direccion" value={formData.direccion} onChange={handleInputChange}
                className={styles.inputEditorial} placeholder="Calle, Número y Colonia" 
              />
            </div>

            <div>
              <label className={styles.labelTop}>TELÉFONO</label>
              <input 
                type="text" name="numero_contacto" value={formData.numero_contacto} onChange={handleInputChange}
                className={styles.inputEditorial} placeholder="Ej: 6671234567" 
              />
            </div>

            {/* --- SELECCIÓN DE DÍAS (text[]) --- */}
            <div>
              <label className={styles.labelTop}>DÍAS DE ATENCIÓN / REPARTO</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {diasSemana.map(dia => {
                  const seleccionado = formData.dias_abierto.includes(dia);
                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDia(dia)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: seleccionado ? 'none' : '1px solid var(--border-ghost)',
                        backgroundColor: seleccionado ? 'var(--color-primary)' : 'white',
                        color: seleccionado ? 'white' : 'var(--text-main)',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
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
        <>
          <button 
            onClick={abrirCrear} 
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ width: '100%', marginBottom: 'var(--space-md)' }}
          >
            <span className="material-symbols-outlined">add</span>
            AGREGAR PROVEEDOR
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {proveedores.map((prov) => (
              <div 
                key={prov.id} 
                className={styles.card} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  opacity: prov.estatus === 'Activo' ? 1 : 0.6,
                  borderLeft: prov.estatus === 'Activo' ? '4px solid var(--color-primary)' : '4px solid var(--text-muted)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4 className={styles.subtitle} style={{ marginBottom: '4px' }}>{prov.nombre}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginRight: '4px' }}>call</span>
                    {prov.numero_contacto || 'Sin teléfono'}
                  </p>
                  
                  {/* Visualización de Días */}
                  {prov.dias_abierto && prov.dias_abierto.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                      {prov.dias_abierto.map(d => (
                        <span key={d} style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#f0f0f0', borderRadius: '4px', fontWeight: 'bold' }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => abrirEditar(prov)} className={styles.btnSecondary} style={{ padding: '8px' }}>
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button 
                    onClick={() => cambiarEstatus('Cat_Proveedores', prov.id, prov.estatus, cargarProveedores)} 
                    className={styles.btnOutlined} 
                    style={{ padding: '8px', color: prov.estatus === 'Activo' ? '#ba1a1a' : 'var(--color-primary)' }}
                  >
                    <span className="material-symbols-outlined">
                      {prov.estatus === 'Activo' ? 'block' : 'check_circle'}
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