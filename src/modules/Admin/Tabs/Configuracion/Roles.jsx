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
      // Usamos .ilike() para evitar problemas con mayúsculas/minúsculas ('Activo' o 'activo')
      const { data, error } = await supabase
        .from('Cat_Categorias')
        .select('id, nombre')
        .ilike('estatus', 'activo')
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
          [accion]: !prev.permisos[modulo]?.[accion]
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
      // Merge seguro de permisos anteriores
      permisos: {
        ...permisosIniciales,
        ...(rol.permisos || {}),
        categorias_permitidas: rol.permisos?.categorias_permitidas || []
      }
    });
    setMostrandoFormulario(true);
  };

  const procesarGuardado = async () => {
    if (!formData.nombre || !formData.nombre.trim()) {
      return toast.error('El nombre del rol es obligatorio');
    }

    const exito = await guardarRol(formData);
    if (exito) {
      setMostrandoFormulario(false);
      setFormData(estadoInicial);
    }
  };

  // Ayudante para renderizar las filas de la matriz de permisos
  const renderFilaPermiso = (modulo, etiqueta) => (
    <tr key={modulo} style={{ borderBottom: '1px solid var(--border-ghost)' }}>
      <td style={{ padding: '10px 8px', fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '0.75rem' }}>{etiqueta.toUpperCase()}</td>
      {['leer', 'crear', 'editar', 'borrar'].map(accion => (
        <td key={accion} style={{ textAlign: 'center', padding: '8px' }}>
          <input 
            type="checkbox" 
            checked={formData.permisos[modulo]?.[accion] || false} 
            onChange={() => handlePermissionChange(modulo, accion)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </td>
      ))}
    </tr>
  );

  return (
    <div className={styles.fadeIN} style={{ width: '100%', maxWidth: '100%' }}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span className={styles.labelTop} style={{ display: 'block', marginBottom: '2px' }}>SEGURIDAD</span>
          <h1 className={styles.title} style={{ fontSize: '2rem', lineHeight: '1' }}>
            {mostrandoFormulario ? 'Configurar\nRol' : 'Roles'}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label className={styles.labelTop}>NOMBRE DEL ROL *</label>
              <input 
                type="text" 
                name="nombre" 
                value={formData.nombre || ''} 
                onChange={handleInputChange} 
                className={styles.inputEditorial} 
                placeholder="Ej: Administrador, Cajero..." 
              />
            </div>

            <div>
              <label className={styles.labelTop}>DESCRIPCIÓN BREVE</label>
              <input 
                type="text" 
                name="descripcion" 
                value={formData.descripcion || ''} 
                onChange={handleInputChange} 
                className={styles.inputEditorial} 
                placeholder="¿Qué funciones realiza este rol?" 
              />
            </div>

            {/* --- MATRIZ DE PERMISOS --- */}
            <div style={{ marginTop: '10px' }}>
              <label className={styles.labelTop} style={{ marginBottom: '8px', display: 'block' }}>MATRIZ DE PERMISOS POR MÓDULO</label>
              <div style={{ overflowX: 'auto', background: 'var(--color-surface-lowest)', borderRadius: '12px', padding: '8px', border: '1px solid var(--border-ghost)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-ghost)' }}>
                      <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>MÓDULO</th>
                      <th style={{ padding: '8px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>LEER</th>
                      <th style={{ padding: '8px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>CREAR</th>
                      <th style={{ padding: '8px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>EDITAR</th>
                      <th style={{ padding: '8px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>BORRAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderFilaPermiso('productos', 'Productos')}
                    {renderFilaPermiso('pedidos', 'Pedidos')}
                    {renderFilaPermiso('trabajadores', 'Personal')}
                    {renderFilaPermiso('configuracion', 'Ajustes')}
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- SELECCIÓN DE CATEGORÍAS PERMITIDAS --- */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className={styles.labelTop} style={{ margin: 0 }}>
                  CATEGORÍAS PERMITIDAS PARA ESTE ROL
                </label>
                <button 
                  type="button" 
                  onClick={handleSelectAllCategories}
                  style={{ 
                    background: 'none', border: 'none', color: 'var(--color-primary)', 
                    fontWeight: 'bold', fontSize: '0.7rem', cursor: 'pointer', outline: 'none'
                  }}
                >
                  {formData.permisos.categorias_permitidas?.length === todasCategorias.length
                    ? 'DESMARCAR TODAS'
                    : 'MARCAR TODAS'}
                </button>
              </div>

              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: '1.3' }}>
                Define a qué categorías de productos tiene permiso de requisitar este rol. 
                Si no seleccionas ninguna categoría, el rol tendrá acceso a <b>todas</b> por defecto.
              </p>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                gap: '8px',
                backgroundColor: 'var(--color-surface-lowest)', 
                padding: '12px', 
                borderRadius: '12px', 
                border: '1px solid var(--border-ghost)',
                maxHeight: '160px',
                overflowY: 'auto'
              }}>
                {todasCategorias.length === 0 ? (
                  <p style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: '8px 0' }}>
                    No hay categorías activas registradas.
                  </p>
                ) : (
                  todasCategorias.map((cat) => {
                    const estaMarcada = formData.permisos.categorias_permitidas?.includes(cat.id);
                    return (
                      <div 
                        key={cat.id} 
                        onClick={() => handleCategoryToggle(cat.id)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          cursor: 'pointer',
                          backgroundColor: estaMarcada ? 'var(--color-surface-low)' : 'white',
                          padding: '6px 10px',
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
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.75rem', fontWeight: estaMarcada ? 'bold' : 'normal', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cat.nombre}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button 
              onClick={procesarGuardado} 
              disabled={loading} 
              className={`${styles.btnBase} ${styles.btnPrimary}`} 
              style={{ padding: '1rem', marginTop: '8px' }}
            >
              <span className="material-symbols-outlined">save</span>
              {loading ? 'GUARDANDO...' : 'GUARDAR ROL Y PERMISOS'}
            </button>
          </div>
        </section>
      ) : (
        /* --- LISTADO DE ROLES --- */
        <>
          <button 
            onClick={abrirCrear} 
            className={`${styles.btnBase} ${styles.btnPrimary}`} 
            style={{ width: '100%', marginBottom: 'var(--space-md)', padding: '0.8rem', fontSize: '0.875rem', height: '44px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>admin_panel_settings</span>
            CREAR NUEVO ROL
          </button>

          {roles.length === 0 && !loading && (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay roles registrados.</p>
          )}

          {/* LISTA DE FILAS COMPACTAS PARA MÓVIL */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '8px',
            width: '100%'
          }}>
            {roles.map((rol) => {
              const esActivo = rol.estatus === 'Activo' || rol.estatus === 'activo';
              return (
                <div 
                  key={rol.id} 
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
                        {rol.nombre}
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
                        {esActivo ? 'Activo' : 'Baja'}
                      </span>
                    </div>

                    {/* Descripción Corta */}
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>description</span>
                      {rol.descripcion || 'Sin descripción'}
                    </p>

                    {/* Mini resumen de permisos en una sola línea */}
                    <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {Object.entries(rol.permisos || {}).map(([mod, p]) => (
                        p && p.leer && mod !== 'categorias_permitidas' && (
                          <span key={mod} style={{ fontSize: '0.55rem', background: 'var(--color-surface-low)', color: 'var(--text-muted)', padding: '1px 4px', borderRadius: '3px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            {mod.substring(0, 4)}
                          </span>
                        )
                      ))}
                      {rol.permisos?.categorias_permitidas?.length > 0 && (
                        <span style={{ fontSize: '0.55rem', background: 'var(--color-surface-low)', color: 'var(--color-primary)', padding: '1px 4px', borderRadius: '3px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                          {rol.permisos.categorias_permitidas.length} CATS.
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Bloque Derecho: Botones de Acción Mini */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button 
                      onClick={() => abrirEditar(rol)} 
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
                      title="Editar Rol"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>edit</span>
                    </button>
                    <button 
                      onClick={() => cambiarEstatus('Cat_Roles', rol.id, rol.estatus, cargarRoles)} 
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
                      title={esActivo ? 'Desactivar Rol' : 'Activar Rol'}
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