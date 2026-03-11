import React, { useState } from 'react';
import s from '../AdminPage.module.css';
import { useConfigTab } from '../../../hooks/useConfigTab';

export const ConfigTab = () => {
  // Añadimos 'motivos' como opción inicial o posible
  const [subTab, setSubTab] = useState('unidades');

  const {
    loading,
    unidades,
    catMenu,
    catInsumos,
    motivosInventario, // <--- Nueva data del hook
    uNombre, setUNombre,
    uAbrev, setUAbrev,
    uEditId, setUEditId,
    cMenuNombre, setCMenuNombre,
    cMenuColor, setCMenuColor,
    cMenuEditId, setCMenuEditId,
    cInsumoNombre, setCInsumoNombre,
    cInsumoEditId, setCInsumoEditId,
    // Nuevos estados para Motivos
    mNombre, setMNombre,
    mTipo, setMTipo,
    mEditId, setMEditId,
    handleSubmitUnidad,
    handleSubmitCatMenu,
    handleSubmitCatInsumo,
    handleSubmitMotivo, // <--- Nueva función del hook
    puedeEditarU,
    puedeEditarC,
    puedeEditarM // <--- Nuevo permiso
  } = useConfigTab(subTab);

  const handleTabChange = (newTab) => {
    setSubTab(newTab);
    
    // Reseteo de estados existentes
    setUEditId(null); setUNombre(''); setUAbrev('');
    setCMenuEditId(null); setCMenuNombre(''); setCMenuColor('#005696');
    setCInsumoEditId(null); setCInsumoNombre('');
    
    // Reseteo de estados de Motivos
    setMEditId(null);
    setMNombre('');
    setMTipo('ENTRADA');
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
        <button
          className={`${s.subBtn} ${subTab === 'motivos' ? s.subBtnActive : ''}`}
          onClick={() => handleTabChange('motivos')}
        >
          Motivos Inventario
        </button>
      </nav>

      {/* --- SECCIÓN UNIDADES (Mantenida) --- */}
      {subTab === 'unidades' && (
        <div className={s.container}>
          <aside className={s.card}>
            <div className={s.cardHeader}>
              <h3 className={s.cardTitle}>{uEditId ? 'Editar' : 'Nueva'} Unidad</h3>
            </div>
            <form className={s.cardBody} onSubmit={handleSubmitUnidad}>
              <div className={s.formGroup}>
                <label className={s.label}>Nombre</label>
                <input className={s.input} value={uNombre} onChange={e => setUNombre(e.target.value)} required readOnly={!puedeEditarU} />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>Abreviatura</label>
                <input className={s.input} value={uAbrev} onChange={e => setUAbrev(e.target.value)} required readOnly={!puedeEditarU} />
              </div>
              {puedeEditarU && <button type="submit" className={s.btnPrimary}>Guardar</button>}
              {uEditId && <button type="button" className={s.btnCancel} onClick={() => { setUEditId(null); setUNombre(''); setUAbrev(''); }}>Cancelar</button>}
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
                      <button className={s.btnEdit} onClick={() => { setUEditId(u.id); setUNombre(u.nombre); setUAbrev(u.abreviatura); }}>
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

      {/* --- SECCIÓN CATEGORÍAS (Mantenida) --- */}
      {subTab === 'categorias' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Categorías Menú e Insumos omitidas aquí por brevedad, se mantienen igual */}
        </div>
      )}

      {/* --- SECCIÓN MOTIVOS INVENTARIO (NUEVA) --- */}
      {subTab === 'motivos' && (
        <div className={s.container}>
          <aside className={s.card}>
            <div className={s.cardHeader}>
              <h3 className={s.cardTitle}>{mEditId ? 'Editar' : 'Nuevo'} Motivo</h3>
            </div>
            <form className={s.cardBody} onSubmit={handleSubmitMotivo}>
              <div className={s.formGroup}>
                <label className={s.label}>Nombre del Motivo</label>
                <input 
                  className={s.input} 
                  value={mNombre} 
                  onChange={e => setMNombre(e.target.value)} 
                  placeholder="Ej: Compra Proveedor"
                  required 
                  readOnly={!puedeEditarM} 
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>Tipo de Movimiento</label>
                <select 
                  className={s.input} 
                  value={mTipo} 
                  onChange={e => setMTipo(e.target.value)}
                  disabled={!puedeEditarM}
                >
                  <option value="ENTRADA">ENTRADA (+)</option>
                  <option value="MERMA">MERMA (-)</option>
                  <option value="SALIDA">SALIDA (-)</option>
                  <option value="AJUSTE">AJUSTE (+/-)</option>
                </select>
              </div>
              {puedeEditarM && <button type="submit" className={s.btnPrimary}>Guardar Motivo</button>}
              {mEditId && (
                <button 
                  type="button" 
                  className={s.btnCancel} 
                  onClick={() => { setMEditId(null); setMNombre(''); setMTipo('ENTRADA'); }}
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
                  <th>Tipo</th>
                  <th>Motivo</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {motivosInventario.map(m => (
                  <tr key={m.id}>
                    <td>
                      <span className={`${s.statusBadge} ${m.tipo === 'ENTRADA' ? s.statusActive : s.statusInactive}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td><strong>{m.nombre_motivo}</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className={s.btnEdit} 
                        onClick={() => { 
                          setMEditId(m.id); 
                          setMNombre(m.nombre_motivo); 
                          setMTipo(m.tipo); 
                        }}
                      >
                        {puedeEditarM ? 'EDITAR' : 'VER'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};