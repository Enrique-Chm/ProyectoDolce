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

  // --- ESTADO INICIAL SINCRONIZADO CON EL ESQUEMA SQL ---
  const estadoInicial = {
    id: null,
    nombre: '',
    descripcion: '',
    estatus: 'activo'
  };
  
  const [formData, setFormData] = useState(estadoInicial);

  // Cargamos los datos al entrar
  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  // Manejador de cambios en inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Preparar formulario para nueva categoría
  const abrirCrear = () => {
    setFormData(estadoInicial);
    setMostrandoFormulario(true);
  };

  // Preparar formulario para editar existente
  const abrirEditar = (cat) => {
    setFormData({ ...cat });
    setMostrandoFormulario(true);
  };

  // Función para enviar a la base de datos
  const procesarGuardado = async () => {
    if (!formData.nombre.trim()) {
      return toast.error('El nombre de la categoría es obligatorio');
    }
    
    const exito = await guardarCategoria(formData);
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
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '4px' }}>CATÁLOGO DE INSUMOS</span>
          <h1 className={styles.title} style={{ fontSize: '2.5rem', lineHeight: '1' }}>
            {mostrandoFormulario ? 'Datos de\nCategoría' : 'Categorías'}
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
              <label className={styles.labelTop}>NOMBRE DE LA CATEGORÍA *</label>
              <input 
                type="text" 
                name="nombre" 
                value={formData.nombre} 
                onChange={handleInputChange}
                className={styles.inputEditorial} 
                placeholder="Ej: Perecederos" 
              />
            </div>
            
            {/* Campo: Descripción */}
            <div>
              <label className={styles.labelTop}>DESCRIPCIÓN</label>
              <input 
                type="text" 
                name="descripcion" 
                value={formData.descripcion} 
                onChange={handleInputChange}
                className={styles.inputEditorial} 
                placeholder="Ej: Alimentos y productos con fecha de caducidad corta" 
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
            <span className="material-symbols-outlined">category</span>
            REGISTRAR NUEVA CATEGORÍA
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categorias.map((cat) => (
              <div 
                key={cat.id} 
                className={styles.card} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  opacity: (cat.estatus === 'Activo' || cat.estatus === 'activo') ? 1 : 0.6,
                  borderLeft: (cat.estatus === 'Activo' || cat.estatus === 'activo') ? '4px solid var(--color-primary)' : '4px solid var(--text-muted)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4 className={styles.subtitle} style={{ marginBottom: '4px' }}>{cat.nombre}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginRight: '4px' }}>description</span>
                    {cat.descripcion || 'Sin descripción registrada'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => abrirEditar(cat)} className={styles.btnSecondary} style={{ padding: '8px' }}>
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  
                  <button 
                    onClick={() => cambiarEstatus('Cat_Categorias', cat.id, cat.estatus, cargarCategorias)} 
                    className={styles.btnOutlined} 
                    style={{ 
                      padding: '8px', 
                      color: (cat.estatus === 'Activo' || cat.estatus === 'activo') ? 'var(--color-tertiary)' : 'var(--color-primary)' 
                    }}
                  >
                    <span className="material-symbols-outlined">
                      {(cat.estatus === 'Activo' || cat.estatus === 'activo') ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            ))}

            {!loading && categorias.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>category</span>
                <p>No hay categorías registradas aún.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}