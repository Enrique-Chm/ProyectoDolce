// Archivo: src/modules/Admin/components/ConfigTab.jsx
import React, { useState } from 'react';
import s from '../AdminPage.module.css'; 
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
    // Reset de estados al cambiar de pestaña
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

      {/* Navegación de Sub-pestañas */}
      <nav style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px', overflowX: 'auto' }}>
        <button
          className={`${s.navItem} ${subTab === 'unidades' ? s.activeNavItem : ''}`}
          style={{ width: 'auto', padding: '8px 20px', whiteSpace: 'nowrap' }}
          onClick={() => handleTabChange('unidades')}
        >
          Unidades
        </button>
        <button
          className={`${s.navItem} ${subTab === 'categorias' ? s.activeNavItem : ''}`}
          style={{ width: 'auto', padding: '8px 20px', whiteSpace: 'nowrap' }}
          onClick={() => handleTabChange('categorias')}
        >
          Categorías
        </button>
        <button
          className={`${s.navItem} ${subTab === 'motivos' ? s.activeNavItem : ''}`}
          style={{ width: 'auto', padding: '8px 20px', whiteSpace: 'nowrap' }}
          onClick={() => handleTabChange('motivos')}
        >
          Motivos Inventario
        </button>
      </nav>

      {/* --- SECCIÓN UNIDADES --- */}
      {subTab === 'unidades' && (
        <div className="admin-split-layout-sidebar">
          <aside className={s.adminCard} style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
              {uEditId ? 'Editar' : 'Nueva'} Unidad
            </h3>
            <form onSubmit={handleSubmitUnidad} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE</label>
                <input 
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  value={uNombre} onChange={e => setUNombre(e.target.value)} required readOnly={!puedeEditarU} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>ABREVIATURA</label>
                <input 
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  value={uAbrev} onChange={e => setUAbrev(e.target.value)} required readOnly={!puedeEditarU} 
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                {puedeEditarU && <button type="submit" className={s.btnLogout} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', flex: 1, padding: '15px' }}>GUARDAR</button>}
                {uEditId && <button type="button" className={s.btnLogout} onClick={() => { setUEditId(null); setUNombre(''); setUAbrev(''); }}>CANCELAR</button>}
              </div>
            </form>
          </aside>

          <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
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
                      <button className={s.btnLogout} style={{ padding: '8px 12px' }} onClick={() => { setUEditId(u.id); setUNombre(u.nombre); setUAbrev(u.abreviatura); }}>
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

      {/* --- SECCIÓN CATEGORÍAS (LA QUE FALTABA) --- */}
      {subTab === 'categorias' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Bloque 1: Categorías de Menú */}
          <div className="admin-split-layout-sidebar">
            <aside className={s.adminCard} style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>Menú (Ventas)</h3>
              <form onSubmit={handleSubmitCatMenu} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE CATEGORÍA</label>
                  <input 
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                    value={cMenuNombre} onChange={e => setCMenuNombre(e.target.value)} placeholder="Ej: Hamburguesas" required readOnly={!puedeEditarC} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>COLOR IDENTIFICADOR</label>
                  <input 
                    type="color"
                    style={{ width: '100%', height: '45px', padding: '5px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                    value={cMenuColor} onChange={e => setCMenuColor(e.target.value)} disabled={!puedeEditarC} 
                  />
                </div>
                <button type="submit" className={s.btnLogout} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '15px', fontWeight: '700' }} disabled={!puedeEditarC}>
                  {cMenuEditId ? 'ACTUALIZAR MENÚ' : 'GUARDAR MENÚ'}
                </button>
              </form>
            </aside>
            <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '15px', fontSize: '12px' }}>COLOR</th>
                    <th style={{ padding: '15px', fontSize: '12px' }}>NOMBRE</th>
                    <th style={{ padding: '15px', fontSize: '12px', textAlign: 'right' }}>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {catMenu.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                      <td style={{ padding: '15px' }}><div style={{ width: '25px', height: '25px', borderRadius: '50%', backgroundColor: c.color_etiqueta }}></div></td>
                      <td style={{ padding: '15px' }}><strong>{c.nombre}</strong></td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        <button className={s.btnLogout} onClick={() => { setCMenuEditId(c.id); setCMenuNombre(c.nombre); setCMenuColor(c.color_etiqueta); }}>EDITAR</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bloque 2: Categorías de Insumos */}
          <div className="admin-split-layout-sidebar">
            <aside className={s.adminCard} style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>Insumos (Almacén)</h3>
              <form onSubmit={handleSubmitCatInsumo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE CATEGORÍA</label>
                  <input 
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                    value={cInsumoNombre} onChange={e => setCInsumoNombre(e.target.value)} placeholder="Ej: Proteínas" required readOnly={!puedeEditarC} 
                  />
                </div>
                <button type="submit" className={s.btnLogout} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '15px', fontWeight: '700' }} disabled={!puedeEditarC}>
                  {cInsumoEditId ? 'ACTUALIZAR ALMACÉN' : 'GUARDAR ALMACÉN'}
                </button>
              </form>
            </aside>
            <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '15px', fontSize: '12px' }}>ID</th>
                    <th style={{ padding: '15px', fontSize: '12px' }}>NOMBRE</th>
                    <th style={{ padding: '15px', fontSize: '12px', textAlign: 'right' }}>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {catInsumos.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                      <td style={{ padding: '15px' }}>#{c.id}</td>
                      <td style={{ padding: '15px' }}><strong>{c.nombre}</strong></td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        <button className={s.btnLogout} onClick={() => { setCInsumoEditId(c.id); setCInsumoNombre(c.nombre); }}>EDITAR</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SECCIÓN MOTIVOS INVENTARIO --- */}
      {subTab === 'motivos' && (
        <div className="admin-split-layout-sidebar">
          <aside className={s.adminCard} style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
              {mEditId ? 'Editar' : 'Nuevo'} Motivo
            </h3>
            <form onSubmit={handleSubmitMotivo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE DEL MOTIVO</label>
                <input 
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  value={mNombre} onChange={e => setMNombre(e.target.value)} placeholder="Ej: Compra Proveedor" required readOnly={!puedeEditarM} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>TIPO DE MOVIMIENTO</label>
                <select 
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                  value={mTipo} onChange={e => setMTipo(e.target.value)} disabled={!puedeEditarM}
                >
                  <option value="ENTRADA">ENTRADA (+)</option>
                  <option value="MERMA">MERMA (-)</option>
                  <option value="SALIDA">SALIDA (-)</option>
                  <option value="AJUSTE">AJUSTE (+/-)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                {puedeEditarM && <button type="submit" className={s.btnLogout} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', flex: 1, padding: '15px' }}>GUARDAR</button>}
                {mEditId && <button type="button" className={s.btnLogout} onClick={() => { setMEditId(null); setMNombre(''); setMTipo('ENTRADA'); }}>CANCELAR</button>}
              </div>
            </form>
          </aside>

          <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
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
                      <button className={s.btnLogout} style={{ padding: '8px 12px' }} onClick={() => { setMEditId(m.id); setMNombre(m.nombre_motivo); setMTipo(m.tipo); }}>
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

export default ConfigTab;