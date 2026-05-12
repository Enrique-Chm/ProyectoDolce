// src/modules/Admin/Tabs/Configuracion/Categorias.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useConfiguracion } from './2useConfiguracion';
import toast from 'react-hot-toast';

export default function Categorias({ onVolver }) {
  const { 
    loading, 
    categorias, 
    cargarCategorias, 
    guardarCategoria, 
    cambiarEstatus 
  } = useConfiguracion();

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);

  // --- ESTADO INICIAL ---
  const estadoInicial = {
    id: null,
    nombre: '',
    descripcion: '',
    estatus: 'activo' 
  };
  
  const [formData, setFormData] = useState(estadoInicial);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const abrirCrear = () => {
    setFormData(estadoInicial);
    setMostrandoFormulario(true);
  };

  const abrirEditar = (cat) => {
    setFormData({ ...cat });
    setMostrandoFormulario(true);
  };

  const procesarGuardado = async () => {
    if (!formData.nombre || !formData.nombre.trim()) {
      return toast.error('El nombre de la categoría es obligatorio');
    }
    
    const exito = await guardarCategoria(formData);
    if (exito) {
      setMostrandoFormulario(false);
      setFormData(estadoInicial);
      cargarCategorias();
    }
  };

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%', paddingBottom: '40px' }}>
      
      {/* --- ENCABEZADO EDITORIAL --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>CONFIGURACIÓN SISTEMA</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1', margin: 0 }}>
            {mostrandoFormulario ? 'Datos de\nCategoría' : 'Categorías'}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div>
              <label className={styles.labelTop}>NOMBRE DE LA CATEGORÍA *</label>
              <input 
                type="text" 
                name="nombre" 
                value={formData.nombre || ''} 
                onChange={handleInputChange}
                className={styles.inputEditorial} 
                placeholder="Ej: Perecederos" 
              />
            </div>
            
            <div>
              <label className={styles.labelTop}>DESCRIPCIÓN</label>
              <input 
                type="text" 
                name="descripcion" 
                value={formData.descripcion || ''} 
                onChange={handleInputChange}
                className={styles.inputEditorial} 
                placeholder="Ej: Alimentos con caducidad corta" 
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
            style={{ width: '100%', marginBottom: 'var(--space-md)', padding: '0.8rem', fontSize: '0.875rem', height: '44px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>category</span>
            REGISTRAR CATEGORÍA
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categorias.map((cat) => {
              const esActivo = cat.estatus === 'activo';
              return (
                <div 
                  key={cat.id} 
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
                  {/* Info */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h4 style={{ 
                        fontSize: '0.875rem', 
                        margin: 0, 
                        fontWeight: 'bold', 
                        color: 'var(--text-main)', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {cat.nombre}
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
                        {esActivo ? 'ACTIVA' : 'BAJA'}
                      </span>
                    </div>

                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.7rem', 
                      color: 'var(--text-muted)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>description</span>
                      {cat.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                  
                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button 
                      onClick={() => abrirEditar(cat)} 
                      className={styles.btnSecondary} 
                      style={{ 
                        padding: '0', 
                        width: '34px', 
                        height: '34px', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--color-surface-low)'
                      }} 
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>edit</span>
                    </button>
                    <button 
                      onClick={() => cambiarEstatus('Cat_Categorias', cat.id, cat.estatus, cargarCategorias)} 
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