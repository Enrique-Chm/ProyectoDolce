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

  // --- ESTADO INICIAL SINCRONIZADO CON SQL ---
  const estadoInicial = {
    id: null,
    nombre: '',
    descripcion: '',
    estatus: 'activo' // Siempre en minúsculas según el default del SQL
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
      cargarCategorias(); // Refrescamos lista tras guardar
    }
  };

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%' }}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>CONFIGURACIÓN</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
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
        <section className={styles.card} style={{ animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
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
            style={{ width: '100%', marginBottom: 'var(--space-md)', height: '44px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add</span>
            NUEVA CATEGORÍA
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
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    opacity: esActivo ? 1 : 0.6,
                    borderLeft: esActivo ? '4px solid var(--color-primary)' : '4px solid #ccc',
                    padding: '12px 16px',
                    backgroundColor: 'white'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold' }}>{cat.nombre}</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cat.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => abrirEditar(cat)} 
                      className={styles.btnSecondary} 
                      style={{ padding: '0', width: '34px', height: '34px', borderRadius: '8px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>edit</span>
                    </button>
                    <button 
                      onClick={() => cambiarEstatus('Cat_Categorias', cat.id, cat.estatus, cargarCategorias)} 
                      className={styles.btnOutlined} 
                      style={{ 
                        padding: '0', width: '34px', height: '34px', borderRadius: '8px',
                        color: esActivo ? '#ba1a1a' : 'var(--color-primary)',
                        borderColor: esActivo ? '#ba1a1a' : 'var(--color-primary)'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
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