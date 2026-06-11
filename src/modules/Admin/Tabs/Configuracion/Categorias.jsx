// src/modules/Admin/Tabs/Configuracion/Categorias.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useConfiguracion } from './2useConfiguracion';
import toast from 'react-hot-toast';

// Token semántico — fallback incluido hasta agregarlo a variables.css
const COLOR_DANGER = 'var(--color-danger, #ba1a1a)';

// CORRECCIÓN P1: Definido fuera del componente — no se recrea en cada render
const ESTADO_INICIAL = {
  id:          null,
  nombre:      '',
  descripcion: '',
  estatus:     'activo'
};

export default function Categorias({ onVolver }) {
  const {
    loading,
    categorias,
    cargarCategorias,
    guardarCategoria,
    cambiarEstatus
  } = useConfiguracion();

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [formData, setFormData] = useState(ESTADO_INICIAL);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const abrirCrear = () => {
    setFormData(ESTADO_INICIAL);
    setMostrandoFormulario(true);
  };

  const abrirEditar = (cat) => {
    setFormData({ ...cat });
    setMostrandoFormulario(true);
  };

  const procesarGuardado = async () => {
    if (!formData.nombre || !formData.nombre.trim()) {
      return toast.error('El nombre de la categoría es obligatorio'),{ duration: 2000 };
    }
    const exito = await guardarCategoria(formData);
    // CORRECCIÓN P1: Eliminada llamada redundante a cargarCategorias() —
    // guardarDatoGenerico en el hook ya la ejecuta como callback.
    if (exito) {
      setMostrandoFormulario(false);
      setFormData(ESTADO_INICIAL);
    }
  };

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%', paddingBottom: '40px' }}>

      {/* --- ENCABEZADO --- */}
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
        <section className={styles.card} style={{ animation: 'slideUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {categorias.map((cat) => {
              const esActivo = cat.estatus === 'activo' || cat.estatus === 'Activo';
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
                    borderLeft: esActivo
                      ? '4px solid var(--color-primary)'
                      : `4px solid var(--text-light)`,   // CORRECCIÓN: era '#999'
                    padding: 'var(--space-sm) 12px',
                    borderRadius: 'var(--radius-xl)',     // CORRECCIÓN: era '10px'
                    backgroundColor: 'var(--color-surface-lowest)', // CORRECCIÓN: era 'white'
                    boxShadow: 'var(--shadow-card)',      // CORRECCIÓN: era rgba inline
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
                        borderRadius: 'var(--radius-sm)',  // CORRECCIÓN: era '4px'
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
                        borderRadius: 'var(--radius-lg)',  // CORRECCIÓN: era '8px'
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
                        borderRadius: 'var(--radius-lg)',  // CORRECCIÓN: era '8px'
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderColor: esActivo ? COLOR_DANGER : 'var(--color-primary)',
                        color:       esActivo ? COLOR_DANGER : 'var(--color-primary)',
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