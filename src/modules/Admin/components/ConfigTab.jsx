import React, { useState } from 'react';
import s from '../AdminPage.module.css';
import  {useConfigTab}  from '../../../hooks/useConfigTab';

export const ConfigTab = () => {
  const [subTab, setSubTab] = useState('unidades');

  const {
    loading,
    unidades,
    catMenu,
    catInsumos,
    uNombre, setUNombre,
    uAbrev, setUAbrev,
    uEditId, setUEditId,
    cMenuNombre, setCMenuNombre,
    cMenuColor, setCMenuColor,
    cMenuEditId, setCMenuEditId,
    cInsumoNombre, setCInsumoNombre,
    cInsumoEditId, setCInsumoEditId,
    handleSubmitUnidad,
    handleSubmitCatMenu,
    handleSubmitCatInsumo,
    puedeEditarU,
    puedeEditarC,
    puedeBorrar // Mantenido tal como solicitaste
  } = useConfigTab(subTab);

  // Función para limpiar los formularios al cambiar de pestaña (Mejora de UX)
  const handleTabChange = (newTab) => {
    setSubTab(newTab);
    
    // Reseteo de estados de Unidades
    setUEditId(null);
    setUNombre('');
    setUAbrev('');
    
    // Reseteo de estados de Categorías Menú
    setCMenuEditId(null);
    setCMenuNombre('');
    setCMenuColor('#005696'); // Color por defecto
    
    // Reseteo de estados de Categorías Insumos
    setCInsumoEditId(null);
    setCInsumoNombre('');
  };

  if (loading) return <div className={s.pageWrapper}><p>Cargando configuración...</p></div>;

  return (
    <div className={s.pageWrapper} style={{ padding: '1rem' }}>
      <h2 className={s.sectionTitle}>Configuración del Sistema</h2>

      <nav className={s.subNav}>
        <button
          className={`${s.subBtn} ${subTab === 'unidades' ? s.subBtnActive : ''}`}
          onClick={() => handleTabChange('unidades')}
        >
          Unidades
        </button>
        <button
          className={`${s.subBtn} ${subTab === 'categorias' ? s.subBtnActive : ''}`}
          onClick={() => handleTabChange('categorias')}
        >
          Categorías
        </button>
      </nav>

      {/* --- SECCIÓN UNIDADES --- */}
      {subTab === 'unidades' && (
        <div className={s.container}>
          <aside className={s.card}>
            <div className={s.cardHeader}>
              <h3 className={s.cardTitle}>{uEditId ? 'Editar' : 'Nueva'} Unidad</h3>
            </div>
            <form className={s.cardBody} onSubmit={handleSubmitUnidad}>
              <div className={s.formGroup}>
                <label className={s.label}>Nombre</label>
                <input 
                  className={s.input} 
                  value={uNombre} 
                  onChange={e => setUNombre(e.target.value)} 
                  required 
                  readOnly={!puedeEditarU} 
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>Abreviatura</label>
                <input 
                  className={s.input} 
                  value={uAbrev} 
                  onChange={e => setUAbrev(e.target.value)} 
                  required 
                  readOnly={!puedeEditarU} 
                />
              </div>
              {puedeEditarU && <button type="submit" className={s.btnPrimary}>Guardar</button>}
              {uEditId && (
                <button 
                  type="button" 
                  className={s.btnCancel} 
                  onClick={() => { setUEditId(null); setUNombre(''); setUAbrev(''); }}
                >
                  Cancelar
                </button>
              )}
            </form>
          </aside>

          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Descripción</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td><strong>{u.nombre}</strong> ({u.abreviatura})</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className={s.btnEdit} 
                        onClick={() => { setUEditId(u.id); setUNombre(u.nombre); setUAbrev(u.abreviatura); }}
                      >
                        {puedeEditarU ? 'EDITAR' : 'VER'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SECCIÓN CATEGORÍAS --- */}
      {subTab === 'categorias' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Categorías Menú */}
          <div className={s.container}>
            <aside className={s.card}>
              <div className={s.cardHeader}>
                <h3 className={s.cardTitle}>{cMenuEditId ? 'Editar' : 'Nueva'} Categoría Menú</h3>
              </div>
              <form className={s.cardBody} onSubmit={handleSubmitCatMenu}>
                <div className={s.formGroup}>
                  <label className={s.label}>Nombre</label>
                  <input 
                    className={s.input} 
                    value={cMenuNombre} 
                    onChange={e => setCMenuNombre(e.target.value)} 
                    required 
                    readOnly={!puedeEditarC} 
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Color</label>
                  <input 
                    type="color" 
                    className={s.input} 
                    value={cMenuColor} 
                    onChange={e => setCMenuColor(e.target.value)} 
                    disabled={!puedeEditarC} 
                  />
                </div>
                {puedeEditarC && <button type="submit" className={s.btnPrimary}>Guardar</button>}
                {cMenuEditId && (
                  <button 
                    type="button" 
                    className={s.btnCancel} 
                    onClick={() => { 
                      setCMenuEditId(null); 
                      setCMenuNombre(''); 
                      setCMenuColor('#005696'); // <-- Mejora: Se resetea el color al cancelar
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </form>
            </aside>

            <div className={s.tableWrapper}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Color</th>
                    <th>Nombre</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {catMenu.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '50%', 
                          background: c.color_etiqueta 
                        }} />
                      </td>
                      <td><strong>{c.nombre}</strong></td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className={s.btnEdit} 
                          onClick={() => { 
                            setCMenuEditId(c.id); 
                            setCMenuNombre(c.nombre); 
                            setCMenuColor(c.color_etiqueta || '#005696'); 
                          }}
                        >
                          {puedeEditarC ? 'EDITAR' : 'VER'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Categorías Insumos */}
          <div className={s.container}>
            <aside className={s.card}>
              <div className={s.cardHeader}>
                <h3 className={s.cardTitle}>{cInsumoEditId ? 'Editar' : 'Nueva'} Categoría Insumo</h3>
              </div>
              <form className={s.cardBody} onSubmit={handleSubmitCatInsumo}>
                <div className={s.formGroup}>
                  <label className={s.label}>Nombre Grupo</label>
                  <input 
                    className={s.input} 
                    value={cInsumoNombre} 
                    onChange={e => setCInsumoNombre(e.target.value)} 
                    required 
                    readOnly={!puedeEditarC} 
                  />
                </div>
                {puedeEditarC && <button type="submit" className={s.btnPrimary}>Guardar</button>}
                {cInsumoEditId && (
                  <button 
                    type="button" 
                    className={s.btnCancel} 
                    onClick={() => { setCInsumoEditId(null); setCInsumoNombre(''); }}
                  >
                    Cancelar
                  </button>
                )}
              </form>
            </aside>

            <div className={s.tableWrapper}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {catInsumos.map(c => (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td><strong>{c.nombre}</strong></td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className={s.btnEdit} 
                          onClick={() => { setCInsumoEditId(c.id); setCInsumoNombre(c.nombre); }}
                        >
                          {puedeEditarC ? 'EDITAR' : 'VER'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};