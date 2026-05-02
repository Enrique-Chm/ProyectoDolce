// src/modules/Admin/Tabs/Configuracion/Roles.jsx
import React, { useState, useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useConfiguracion } from './2useConfiguracion';
import { supabase } from '../../../../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function Roles({ onVolver }) {
  const { 
    loading, 
    roles, 
    cargarRoles, 
    guardarRol, 
    cambiarEstatus 
  } = useConfiguracion();

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [todasCategorias, setTodasCategorias] = useState([]);

  // --- ESTRUCTURA INICIAL DE PERMISOS ---
  // Incluye el arreglo vacío para las categorías permitidas por rol
  const permisosIniciales = {
    productos: { leer: false, crear: false, editar: false, borrar: false },
    pedidos: { leer: false, crear: false, editar: false, borrar: false },
    trabajadores: { leer: false, crear: false, editar: false, borrar: false },
    configuracion: { leer: false, crear: false, editar: false, borrar: false },
    categorias_permitidas: []
  };

  const estadoInicial = {
    id: null,
    nombre: '',
    descripcion: '',
    estatus: 'Activo',
    permisos: permisosIniciales
  };

  const [formData, setFormData] = useState(estadoInicial);

  // Cargamos los roles de soporte y las categorías para las asignaciones
  useEffect(() => {
    cargarRoles();
    
    const cargarCategorias = async () => {
      const { data, error } = await supabase
        .from('Cat_Categorias')
        .select('id, nombre')
        .eq('estatus', 'activo')
        .order('nombre');
        
      if (error) {
        console.error("Error al cargar categorías:", error.message);
        return;
      }
      setTodasCategorias(data || []);
    };

    cargarCategorias();
  }, [cargarRoles]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Función para alternar permisos individuales dentro del JSON
  const handlePermissionChange = (modulo, accion) => {
    setFormData(prev => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [modulo]: {
          ...prev.permisos[modulo],
          [accion]: !prev.permisos[modulo][accion]
        }
      }
    }));
  };

  // Función para alternar permisos de categorías individuales
  const handleCategoryToggle = (categoriaId) => {
    setFormData(prev => {
      const actuales = prev.permisos.categorias_permitidas || [];
      const nuevas = actuales.includes(categoriaId)
        ? actuales.filter(id => id !== categoriaId)
        : [...actuales, categoriaId];
      
      return {
        ...prev,
        permisos: {
          ...prev.permisos,
          categorias_permitidas: nuevas
        }
      };
    });
  };

  // Función para marcar/desmarcar todas las categorías a la vez
  const handleSelectAllCategories = () => {
    const actuales = formData.permisos.categorias_permitidas || [];
    if (actuales.length === todasCategorias.length) {
      setFormData(prev => ({
        ...prev,
        permisos: { ...prev.permisos, categorias_permitidas: [] }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permisos: { ...prev.permisos, categorias_permitidas: todasCategorias.map(c => c.id) }
      }));
    }
  };

  const abrirCrear = () => {
    setFormData(estadoInicial);
    setMostrandoFormulario(true);
  };

  const abrirEditar = (rol) => {
    setFormData({
      id: rol.id,
      nombre: rol.nombre || '',
      descripcion: rol.descripcion || '',
      estatus: rol.estatus || 'Activo',
      // Si el rol ya tiene permisos definidos, usamos un merge para mantener la compatibilidad
      permisos: {
        ...permisosIniciales,
        ...(rol.permisos || {}),
        categorias_permitidas: rol.permisos?.categorias_permitidas || []
      }
    });
    setMostrandoFormulario(true);
  };

  const procesarGuardado = async () => {
    if (!formData.nombre.trim()) return toast.error('El nombre del rol es obligatorio');

    const exito = await guardarRol(formData);
    if (exito) {
      setMostrandoFormulario(false);
      setFormData(estadoInicial);
    }
  };

  // Ayudante para renderizar las filas de la matriz de permisos
  const renderFilaPermiso = (modulo, etiqueta) => (
    <tr key={modulo} style={{ borderBottom: '1px solid var(--border-color)' }}>
      <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{etiqueta.toUpperCase()}</td>
      {['leer', 'crear', 'editar', 'borrar'].map(accion => (
        <td key={accion} style={{ textAlign: 'center', padding: '12px' }}>
          <input 
            type="checkbox" 
            checked={formData.permisos[modulo]?.[accion] || false} 
            onChange={() => handlePermissionChange(modulo, accion)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <div className={styles.fadeIN}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '4px' }}>SEGURIDAD</span>
          <h1 className={styles.title} style={{ fontSize: '2.5rem', lineHeight: '1' }}>
            {mostrandoFormulario ? 'Configurar\nRol' : 'Roles'}
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
              <label className={styles.labelTop}>NOMBRE DEL ROL *</label>
              <input 
                type="text" 
                name="nombre" 
                value={formData.nombre} 
                onChange={handleInputChange} 
                className={styles.inputEditorial} 
                placeholder="Ej: Administrador, Cajero, Cocina..." 
              />
            </div>

            <div>
              <label className={styles.labelTop}>DESCRIPCIÓN BREVE</label>
              <input 
                type="text" 
                name="descripcion" 
                value={formData.descripcion} 
                onChange={handleInputChange} 
                className={styles.inputEditorial} 
                placeholder="¿Qué funciones realiza este rol?" 
              />
            </div>

            {/* --- MATRIZ DE PERMISOS --- */}
            <div style={{ marginTop: '10px' }}>
              <label className={styles.labelTop} style={{ marginBottom: '10px', display: 'block' }}>MATRIZ DE PERMISOS POR MÓDULO</label>
              <div style={{ overflowX: 'auto', background: 'var(--color-surface-lowest)', borderRadius: '12px', padding: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ textAlign: 'left', padding: '12px' }}>MÓDULO</th>
                      <th style={{ padding: '12px' }}>LEER</th>
                      <th style={{ padding: '12px' }}>AGREGAR</th>
                      <th style={{ padding: '12px' }}>EDITAR</th>
                      <th style={{ padding: '12px' }}>BORRAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderFilaPermiso('productos', 'Productos')}
                    {renderFilaPermiso('pedidos', 'Pedidos / Compras')}
                    {renderFilaPermiso('trabajadores', 'Personal')}
                    {renderFilaPermiso('configuracion', 'Configuración')}
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- SELECCIÓN DE CATEGORÍAS PERMITIDAS --- */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className={styles.labelTop} style={{ margin: 0 }}>
                  CATEGORÍAS PERMITIDAS PARA ESTE ROL
                </label>
                <button 
                  type="button" 
                  onClick={handleSelectAllCategories}
                  style={{ 
                    background: 'none', border: 'none', color: 'var(--color-primary)', 
                    fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' 
                  }}
                >
                  {formData.permisos.categorias_permitidas?.length === todasCategorias.length
                    ? 'DESMARCAR TODAS'
                    : 'MARCAR TODAS'}
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Define a qué categorías de productos tiene permiso de requisitar este rol. 
                Si no seleccionas ninguna categoría, el rol tendrá acceso a <b>todas</b> por defecto.
              </p>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '10px',
                backgroundColor: 'var(--color-surface-lowest)', 
                padding: '16px', 
                borderRadius: '12px', 
                border: '1px solid var(--border-ghost)' 
              }}>
                {todasCategorias.map((cat) => {
                  const estaMarcada = formData.permisos.categorias_permitidas?.includes(cat.id);
                  return (
                    <div 
                      key={cat.id} 
                      onClick={() => handleCategoryToggle(cat.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        cursor: 'pointer',
                        backgroundColor: estaMarcada ? 'var(--color-surface-low)' : 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: estaMarcada ? 'var(--color-primary)' : 'var(--border-ghost)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={estaMarcada || false} 
                        readOnly 
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: estaMarcada ? 'bold' : 'normal', color: 'var(--text-main)' }}>
                        {cat.nombre}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={procesarGuardado} 
              disabled={loading} 
              className={`${styles.btnBase} ${styles.btnPrimary}`} 
              style={{ padding: '1.2rem', marginTop: '10px' }}
            >
              <span className="material-symbols-outlined">save</span>
              {loading ? 'GUARDANDO...' : 'GUARDAR ROL Y PERMISOS'}
            </button>
          </div>
        </section>
      ) : (
        <>
          <button onClick={abrirCrear} className={`${styles.btnBase} ${styles.btnPrimary}`} style={{ width: '100%', marginBottom: 'var(--space-md)' }}>
            <span className="material-symbols-outlined">admin_panel_settings</span>
            CREAR NUEVO ROL
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {roles.map((rol) => (
              <div 
                key={rol.id} 
                className={styles.card} 
                style={{ 
                  opacity: rol.estatus === 'Activo' ? 1 : 0.6,
                  borderTop: rol.estatus === 'Activo' ? '4px solid var(--color-primary)' : '4px solid #ccc'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 className={styles.subtitle} style={{ marginBottom: '4px' }}>{rol.nombre}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>{rol.descripcion || 'Sin descripción'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => abrirEditar(rol)} className={styles.btnSecondary} style={{ padding: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>edit</span>
                    </button>
                    <button 
                      onClick={() => cambiarEstatus('Cat_Roles', rol.id, rol.estatus, cargarRoles)} 
                      className={styles.btnOutlined} 
                      style={{ padding: '6px', color: rol.estatus === 'Activo' ? '#ba1a1a' : 'var(--color-primary)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                        {rol.estatus === 'Activo' ? 'block' : 'check_circle'}
                      </span>
                    </button>
                  </div>
                </div>
                
                {/* Mini resumen de permisos activados */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
                  {Object.entries(rol.permisos || {}).map(([mod, p]) => (
                    p && p.leer && (
                      <span key={mod} style={{ fontSize: '0.65rem', background: 'var(--color-surface-low)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {mod}
                      </span>
                    )
                  ))}
                  {/* Etiqueta para saber si tiene categorías limitadas */}
                  {rol.permisos?.categorias_permitidas?.length > 0 && (
                    <span style={{ fontSize: '0.65rem', background: 'var(--color-surface-low)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      {rol.permisos.categorias_permitidas.length} CATS.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}