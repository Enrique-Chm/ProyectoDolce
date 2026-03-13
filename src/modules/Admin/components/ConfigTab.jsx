// Archivo: src/modules/Admin/components/ConfigTab.jsx
import React, { useState } from 'react';
import s from '../AdminPage.module.css'; // Usamos los estilos del Admin homologados
import { useConfigTab } from '../../../hooks/useConfigTab';

export const ConfigTab = () => {
  const [subTab, setSubTab] = useState('unidades');

  const {
    loading,
    unidades,
    catMenu,
    catInsumos,
    motivosInventario,
    uNombre, setUNombre,
    uAbrev, setUAbrev,
    uEditId, setUEditId,
    cMenuNombre, setCMenuNombre,
    cMenuColor, setCMenuColor,
    cMenuEditId, setCMenuEditId,
    cInsumoNombre, setCInsumoNombre,
    cInsumoEditId, setCInsumoEditId,
    mNombre, setMNombre,
    mTipo, setMTipo,
    mEditId, setMEditId,
    handleSubmitUnidad,
    handleSubmitCatMenu,
    handleSubmitCatInsumo,
    handleSubmitMotivo,
    puedeEditarU,
    puedeEditarC,
    puedeEditarM
  } = useConfigTab(subTab);

  const handleTabChange = (newTab) => {
    setSubTab(newTab);
    setUEditId(null); setUNombre(''); setUAbrev('');
    setCMenuEditId(null); setCMenuNombre(''); setCMenuColor('#005696');
    setCInsumoEditId(null); setCInsumoNombre('');
    setMEditId(null); setMNombre(''); setMTipo('ENTRADA');
  };

  if (loading) return <div className={s.tabContent}><p>Cargando configuración...</p></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)', margin: '0 0 10px 0' }}>
        Configuración del Sistema
      </h2>

      {/* Navegación de Sub-pestañas Homologada */}
      <nav style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
        <button
          className={`${s.navItem} ${subTab === 'unidades' ? s.activeNavItem : ''}`}
          style={{ width: 'auto', padding: '8px 20px' }}
          onClick={() => handleTabChange('unidades')}
        >
          Unidades
        </button>
        <button
          className={`${s.navItem} ${subTab === 'categorias' ? s.activeNavItem : ''}`}
          style={{ width: 'auto', padding: '8px 20px' }}
          onClick={() => handleTabChange('categorias')}
        >
          Categorías
        </button>
        <button
          className={`${s.navItem} ${subTab === 'motivos' ? s.activeNavItem : ''}`}
          style={{ width: 'auto', padding: '8px 20px' }}
          onClick={() => handleTabChange('motivos')}
        >
          Motivos Inventario
        </button>
      </nav>

      {/* --- SECCIÓN UNIDADES --- */}
      {subTab === 'unidades' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '25px', alignItems: 'start' }}>
          {/* Formulario */}
          <aside className={s.adminCard} style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
              {uEditId ? 'Editar' : 'Nueva'} Unidad
            </h3>
            <form onSubmit={handleSubmitUnidad} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE</label>
                <input 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  value={uNombre} onChange={e => setUNombre(e.target.value)} required readOnly={!puedeEditarU} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>ABREVIATURA</label>
                <input 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  value={uAbrev} onChange={e => setUAbrev(e.target.value)} required readOnly={!puedeEditarU} 
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                {puedeEditarU && <button type="submit" className={s.btnLogout} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', flex: 1 }}>GUARDAR</button>}
                {uEditId && <button type="button" className={s.btnLogout} onClick={() => { setUEditId(null); setUNombre(''); setUAbrev(''); }}>CANCELAR</button>}
              </div>
            </form>
          </aside>

          {/* Tabla */}
          <div className={s.adminCard} style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>ID</th>
                  <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>DESCRIPCIÓN</th>
                  <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                    <td style={{ padding: '15px' }}>#{u.id}</td>
                    <td style={{ padding: '15px' }}><strong>{u.nombre}</strong> <span style={{ color: 'var(--color-text-muted)' }}>({u.abreviatura})</span></td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <button className={s.btnLogout} onClick={() => { setUEditId(u.id); setUNombre(u.nombre); setUAbrev(u.abreviatura); }}>
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

      {/* --- SECCIÓN MOTIVOS INVENTARIO --- */}
      {subTab === 'motivos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '25px', alignItems: 'start' }}>
          <aside className={s.adminCard} style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
              {mEditId ? 'Editar' : 'Nuevo'} Motivo
            </h3>
            <form onSubmit={handleSubmitMotivo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE DEL MOTIVO</label>
                <input 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  value={mNombre} onChange={e => setMNombre(e.target.value)} placeholder="Ej: Compra Proveedor" required readOnly={!puedeEditarM} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>TIPO DE MOVIMIENTO</label>
                <select 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                  value={mTipo} onChange={e => setMTipo(e.target.value)} disabled={!puedeEditarM}
                >
                  <option value="ENTRADA">ENTRADA (+)</option>
                  <option value="MERMA">MERMA (-)</option>
                  <option value="SALIDA">SALIDA (-)</option>
                  <option value="AJUSTE">AJUSTE (+/-)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                {puedeEditarM && <button type="submit" className={s.btnLogout} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', flex: 1 }}>GUARDAR</button>}
                {mEditId && <button type="button" className={s.btnLogout} onClick={() => { setMEditId(null); setMNombre(''); setMTipo('ENTRADA'); }}>CANCELAR</button>}
              </div>
            </form>
          </aside>

          <div className={s.adminCard} style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>TIPO</th>
                  <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>MOTIVO</th>
                  <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {motivosInventario.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '800', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        backgroundColor: m.tipo === 'ENTRADA' ? '#dcfce7' : '#fee2e2',
                        color: m.tipo === 'ENTRADA' ? '#166534' : '#991b1b'
                      }}>
                        {m.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}><strong>{m.nombre_motivo}</strong></td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <button className={s.btnLogout} onClick={() => { setMEditId(m.id); setMNombre(m.nombre_motivo); setMTipo(m.tipo); }}>
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