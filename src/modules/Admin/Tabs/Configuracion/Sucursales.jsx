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

  // --- ESTADO INICIAL SINCRONIZADO CON TU SQL ---
  const estadoInicial = {
    id: null,
    nombre: '',
    direccion: '', // Mapeado a la columna 'direccion' de tu tabla
    horario: '',   // Mapeado a la columna 'horario' de tu tabla
    estatus: 'Activo'
  };
  
  const [formData, setFormData] = useState(estadoInicial);

  // Cargamos los datos al entrar
  useEffect(() => {
    cargarSucursales();
  }, [cargarSucursales]);

  // Manejador de cambios en inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Preparar formulario para nueva sucursal
  const abrirCrear = () => {
    setFormData(estadoInicial);
    setMostrandoFormulario(true);
  };

  // Preparar formulario para editar existente
  const abrirEditar = (suc) => {
    setFormData({ ...suc });
    setMostrandoFormulario(true);
  };

  // Función para enviar a la base de datos
  const procesarGuardado = async () => {
    if (!formData.nombre.trim()) {
      return toast.error('El nombre de la sucursal es obligatorio');
    }
    
    const exito = await guardarSucursal(formData);
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
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '4px' }}>GESTIÓN DE PUNTOS DE VENTA</span>
          <h1 className={styles.title} style={{ fontSize: '2.5rem', lineHeight: '1' }}>
            {mostrandoFormulario ? 'Datos de\nSucursal' : 'Sucursales'}
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
            style={{ width: '100%', marginBottom: 'var(--space-md)' }}
          >
            <span className="material-symbols-outlined">add_business</span>
            REGISTRAR NUEVA SUCURSAL
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sucursales.map((suc) => (
              <div 
                key={suc.id} 
                className={styles.card} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  opacity: suc.estatus === 'Activo' ? 1 : 0.6,
                  borderLeft: suc.estatus === 'Activo' ? '4px solid var(--color-primary)' : '4px solid var(--text-muted)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4 className={styles.subtitle} style={{ marginBottom: '4px' }}>{suc.nombre}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginRight: '4px' }}>location_on</span>
                    {suc.direccion || 'Sin dirección registrada'}
                  </p>
                  {suc.horario && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginRight: '4px' }}>schedule</span>
                      {suc.horario}
                    </p>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => abrirEditar(suc)} className={styles.btnSecondary} style={{ padding: '8px' }}>
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  
                  <button 
                    onClick={() => cambiarEstatus('Cat_sucursales', suc.id, suc.estatus, cargarSucursales)} 
                    className={styles.btnOutlined} 
                    style={{ 
                      padding: '8px', 
                      color: suc.estatus === 'Activo' ? 'var(--color-tertiary)' : 'var(--color-primary)' 
                    }}
                  >
                    <span className="material-symbols-outlined">
                      {suc.estatus === 'Activo' ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            ))}

            {!loading && sucursales.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>storefront</span>
                <p>No hay sucursales registradas aún.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}