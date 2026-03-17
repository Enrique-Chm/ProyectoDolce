// Archivo: src/modules/Admin/components/ConfigTab.jsx
import React, { useState } from 'react';
import s from '../AdminPage.module.css'; 
import { useConfigTab } from '../../../hooks/useConfigTab';
import { MATRIZ_MODULOS, hasPermission } from '../../../utils/checkPermiso'; // Importamos seguridad

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

      {/* Navegación de Sub-pestañas con Protección de Acceso */}
      <nav style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px', overflowX: 'auto' }}>
        {hasPermission('ver_unidades') && (
          <button
            className={`${s.navItem} ${subTab === 'unidades' ? s.activeNavItem : ''}`}
            style={{ width: 'auto', padding: '8px 20px', whiteSpace: 'nowrap' }}
            onClick={() => handleTabChange('unidades')}
          >
            Unidades
          </button>
        )}
        {hasPermission('ver_categorias') && (
          <button
            className={`${s.navItem} ${subTab === 'categorias' ? s.activeNavItem : ''}`}
            style={{ width: 'auto', padding: '8px 20px', whiteSpace: 'nowrap' }}
            onClick={() => handleTabChange('categorias')}
          >
            Categorías
          </button>
        )}
        {hasPermission('ver_configuracion') && (
          <button
            className={`${s.navItem} ${subTab === 'motivos' ? s.activeNavItem : ''}`}
            style={{ width: 'auto', padding: '8px 20px', whiteSpace: 'nowrap' }}
            onClick={() => handleTabChange('motivos')}
          >
            Motivos Inventario
          </button>
        )}
      </nav>

      {/* --- SECCIÓN UNIDADES --- */}
      {subTab === 'unidades' && hasPermission('ver_unidades') && (
        <div className="admin-split-layout-sidebar">
          <aside className={s.adminCard} style={{ padding: '20px', display: puedeEditarU || uEditId ? 'block' : 'none' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
              {uEditId ? (puedeEditarU ? 'Editar' : 'Ver') : 'Nueva'} Unidad
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
                {uEditId && <button type="button" className={s.btnLogout} onClick={() => { setUEditId(null); setUNombre(''); setUAbrev(''); }}>{puedeEditarU ? 'CANCELAR' : 'CERRAR'}</button>}
              </div>
            </form>
          </aside>

          <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto', flex: 1 }}>
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

      {/* --- SECCIÓN CATEGORÍAS --- */}
      {subTab === 'categorias' && hasPermission('ver_categorias') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Bloque 1: Categorías de Menú */}
          <div className="admin-split-layout-sidebar">
            <aside className={s.adminCard} style={{ padding: '20px', display: puedeEditarC || cMenuEditId ? 'block' : 'none' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
                {cMenuEditId ? (puedeEditarC ? 'Editar Categoría Menú' : 'Detalle Categoría Menú') : 'Nueva Categoría Menú'}
              </h3>
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
                <div style={{ display: 'flex', gap: '10px' }}>
                  {puedeEditarC && (
                    <button type="submit" className={s.btnLogout} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '15px', fontWeight: '700', flex: 1 }}>
                      {cMenuEditId ? 'ACTUALIZAR' : 'GUARDAR'}
                    </button>
                  )}
                  {cMenuEditId && (
                    <button type="button" className={s.btnLogout} onClick={() => { setCMenuEditId(null); setCMenuNombre(''); setCMenuColor('#005696'); }}>
                      {puedeEditarC ? 'CANCELAR' : 'CERRAR'}
                    </button>
                  )}
                </div>
              </form>
            </aside>
            <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto', flex: 1 }}>
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
                        <button className={s.btnLogout} onClick={() => { setCMenuEditId(c.id); setCMenuNombre(c.nombre); setCMenuColor(c.color_etiqueta); }}>
                          {puedeEditarC ? 'EDITAR' : 'VER'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bloque 2: Categorías de Insumos */}
          <div className="admin-split-layout-sidebar">
            <aside className={s.adminCard} style={{ padding: '20px', display: puedeEditarC || cInsumoEditId ? 'block' : 'none' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
                {cInsumoEditId ? (puedeEditarC ? 'Editar Almacén' : 'Detalle Almacén') : 'Nueva Categoría Almacén'}
              </h3>
              <form onSubmit={handleSubmitCatInsumo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE CATEGORÍA</label>
                  <input 
                    style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                    value={cInsumoNombre} onChange={e => setCInsumoNombre(e.target.value)} placeholder="Ej: Proteínas" required readOnly={!puedeEditarC} 
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {puedeEditarC && (
                    <button type="submit" className={s.btnLogout} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '15px', fontWeight: '700', flex: 1 }}>
                      {cInsumoEditId ? 'ACTUALIZAR' : 'GUARDAR'}
                    </button>
                  )}
                  {cInsumoEditId && (
                    <button type="button" className={s.btnLogout} onClick={() => { setCInsumoEditId(null); setCInsumoNombre(''); }}>
                      {puedeEditarC ? 'CANCELAR' : 'CERRAR'}
                    </button>
                  )}
                </div>
              </form>
            </aside>
            <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto', flex: 1 }}>
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
                        <button className={s.btnLogout} onClick={() => { setCInsumoEditId(c.id); setCInsumoNombre(c.nombre); }}>
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

      {/* --- SECCIÓN MOTIVOS INVENTARIO --- */}
      {subTab === 'motivos' && hasPermission('ver_configuracion') && (
        <div className="admin-split-layout-sidebar">
          <aside className={s.adminCard} style={{ padding: '20px', display: puedeEditarM || mEditId ? 'block' : 'none' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
              {mEditId ? (puedeEditarM ? 'Editar Motivo' : 'Detalle Motivo') : 'Nuevo Motivo'}
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
                {mEditId && <button type="button" className={s.btnLogout} onClick={() => { setMEditId(null); setMNombre(''); setMTipo('ENTRADA'); }}>{puedeEditarM ? 'CANCELAR' : 'CERRAR'}</button>}
              </div>
            </form>
          </aside>

          <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto', flex: 1 }}>
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