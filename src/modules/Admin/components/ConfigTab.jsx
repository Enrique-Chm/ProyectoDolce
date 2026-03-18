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
<div className={s.tabWrapper}>
    {/* SECCIÓN CABECERA: Misma estructura que Caja */}
    <div className={s.pageHeader}>
      <h2 className={s.pageTitle}>Configuración del Sistema</h2>
    </div>
      {/* Navegación de Sub-pestañas con Protección de Acceso */}
      <nav className={s.tabNav}>
        {hasPermission('ver_unidades') && (
          <button
            className={`${s.tabButton} ${subTab === 'unidades' ? s.activeTabButton : ''}`}
            onClick={() => handleTabChange('unidades')}
          >
            Unidades
          </button>
        )}
        {hasPermission('ver_categorias') && (
          <button
            className={`${s.tabButton} ${subTab === 'categorias' ? s.activeTabButton : ''}`}
            onClick={() => handleTabChange('categorias')}
          >
            Categorías
          </button>
        )}
        {hasPermission('ver_configuracion') && (
          <button
            className={`${s.tabButton} ${subTab === 'motivos' ? s.activeTabButton : ''}`}
            onClick={() => handleTabChange('motivos')}
          >
            Motivos Inventario
          </button>
        )}
      </nav>

      {/* --- SECCIÓN UNIDADES --- */}
      {subTab === 'unidades' && hasPermission('ver_unidades') && (
        <div className={s.splitLayout}>
          <aside className={s.adminCard} style={{ display: puedeEditarU || uEditId ? 'block' : 'none' }}>
            <h3 className={s.cardTitle}>
              {uEditId ? (puedeEditarU ? 'Editar' : 'Ver') : 'Nueva'} Unidad
            </h3>
            <form onSubmit={handleSubmitUnidad} className={s.loginForm}>
              <div className={s.formGroup}>
                <label className={s.label}>NOMBRE</label>
                <input 
                  className={s.inputField}
                  value={uNombre} onChange={e => setUNombre(e.target.value)} required readOnly={!puedeEditarU} 
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>ABREVIATURA</label>
                <input 
                  className={s.inputField}
                  value={uAbrev} onChange={e => setUAbrev(e.target.value)} required readOnly={!puedeEditarU} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {puedeEditarU && <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}>GUARDAR</button>}
                {uEditId && (
                  <button type="button" className={`${s.btn} ${s.btnOutlineDanger} ${s.btnFull}`} onClick={() => { setUEditId(null); setUNombre(''); setUAbrev(''); }}>
                    {puedeEditarU ? 'CANCELAR' : 'CERRAR'}
                  </button>
                )}
              </div>
            </form>
          </aside>

          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <table className={s.table} style={{ minWidth: '500px' }}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>ID</th>
                  <th className={s.th}>DESCRIPCIÓN</th>
                  <th className={s.th} style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map(u => (
                  <tr key={u.id}>
                    <td className={s.td}>#{u.id}</td>
                    <td className={s.td}><strong>{u.nombre}</strong> <span className={s.textMuted}>({u.abreviatura})</span></td>
                    <td className={s.td} style={{ textAlign: 'right' }}>
                      <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => { setUEditId(u.id); setUNombre(u.nombre); setUAbrev(u.abreviatura); }}>
                        {puedeEditarU ? '📝' : 'VER'}
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
        <div className={s.flexColumnGap20}>
          
          {/* Bloque 1: Categorías de Menú */}
          <div className={s.splitLayout}>
            <aside className={s.adminCard} style={{ display: puedeEditarC || cMenuEditId ? 'block' : 'none' }}>
              <h3 className={s.cardTitle}>
                {cMenuEditId ? (puedeEditarC ? 'Editar Categoría Menú' : 'Detalle Categoría Menú') : 'Nueva Categoría Menú'}
              </h3>
              <form onSubmit={handleSubmitCatMenu} className={s.loginForm}>
                <div className={s.formGroup}>
                  <label className={s.label}>NOMBRE CATEGORÍA</label>
                  <input 
                    className={s.inputField}
                    value={cMenuNombre} onChange={e => setCMenuNombre(e.target.value)} placeholder="Ej: Hamburguesas" required readOnly={!puedeEditarC} 
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>COLOR IDENTIFICADOR</label>
                  <input 
                    type="color"
                    className={`${s.inputField} ${s.colorPicker}`}
                    value={cMenuColor} onChange={e => setCMenuColor(e.target.value)} disabled={!puedeEditarC} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {puedeEditarC && (
                    <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}>
                      {cMenuEditId ? 'ACTUALIZAR' : 'GUARDAR'}
                    </button>
                  )}
                  {cMenuEditId && (
                    <button type="button" className={`${s.btn} ${s.btnOutlineDanger} ${s.btnFull}`} onClick={() => { setCMenuEditId(null); setCMenuNombre(''); setCMenuColor('#005696'); }}>
                      {puedeEditarC ? 'CANCELAR' : 'CERRAR'}
                    </button>
                  )}
                </div>
              </form>
            </aside>
            <div className={`${s.adminCard} ${s.tableContainer}`}>
              <table className={s.table}>
                <thead className={s.thead}>
                  <tr>
                    <th className={s.th}>COLOR</th>
                    <th className={s.th}>NOMBRE</th>
                    <th className={s.th} style={{ textAlign: 'right' }}>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {catMenu.map(c => (
                    <tr key={c.id}>
                      <td className={s.td}>
                        <div className={s.colorCircle} style={{ backgroundColor: c.color_etiqueta }}></div>
                      </td>
                      <td className={s.td}><strong>{c.nombre}</strong></td>
                      <td className={s.td} style={{ textAlign: 'right' }}>
                        <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => { setCMenuEditId(c.id); setCMenuNombre(c.nombre); setCMenuColor(c.color_etiqueta); }}>
                          {puedeEditarC ? '📝' : 'VER'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bloque 2: Categorías de Insumos */}
          <div className={s.splitLayout}>
            <aside className={s.adminCard} style={{ display: puedeEditarC || cInsumoEditId ? 'block' : 'none' }}>
              <h3 className={s.cardTitle}>
                {cInsumoEditId ? (puedeEditarC ? 'Editar Almacén' : 'Detalle Almacén') : 'Nueva Categoría Almacén'}
              </h3>
              <form onSubmit={handleSubmitCatInsumo} className={s.loginForm}>
                <div className={s.formGroup}>
                  <label className={s.label}>NOMBRE CATEGORÍA</label>
                  <input 
                    className={s.inputField}
                    value={cInsumoNombre} onChange={e => setCInsumoNombre(e.target.value)} placeholder="Ej: Proteínas" required readOnly={!puedeEditarC} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {puedeEditarC && (
                    <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}>
                      {cInsumoEditId ? 'ACTUALIZAR' : 'GUARDAR'}
                    </button>
                  )}
                  {cInsumoEditId && (
                    <button type="button" className={`${s.btn} ${s.btnOutlineDanger} ${s.btnFull}`} onClick={() => { setCInsumoEditId(null); setCInsumoNombre(''); }}>
                      {puedeEditarC ? 'CANCELAR' : 'CERRAR'}
                    </button>
                  )}
                </div>
              </form>
            </aside>
            <div className={`${s.adminCard} ${s.tableContainer}`}>
              <table className={s.table}>
                <thead className={s.thead}>
                  <tr>
                    <th className={s.th}>ID</th>
                    <th className={s.th}>NOMBRE</th>
                    <th className={s.th} style={{ textAlign: 'right' }}>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {catInsumos.map(c => (
                    <tr key={c.id}>
                      <td className={s.td}>#{c.id}</td>
                      <td className={s.td}><strong>{c.nombre}</strong></td>
                      <td className={s.td} style={{ textAlign: 'right' }}>
                        <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => { setCInsumoEditId(c.id); setCInsumoNombre(c.nombre); }}>
                          {puedeEditarC ? '📝' : 'VER'}
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
        <div className={s.splitLayout}>
          <aside className={s.adminCard} style={{ display: puedeEditarM || mEditId ? 'block' : 'none' }}>
            <h3 className={s.cardTitle}>
              {mEditId ? (puedeEditarM ? 'Editar Motivo' : 'Detalle Motivo') : 'Nuevo Motivo'}
            </h3>
            <form onSubmit={handleSubmitMotivo} className={s.loginForm}>
              <div className={s.formGroup}>
                <label className={s.label}>NOMBRE DEL MOTIVO</label>
                <input 
                  className={s.inputField}
                  value={mNombre} onChange={e => setMNombre(e.target.value)} placeholder="Ej: Compra Proveedor" required readOnly={!puedeEditarM} 
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>TIPO DE MOVIMIENTO</label>
                <select 
                  className={s.inputField}
                  value={mTipo} onChange={e => setMTipo(e.target.value)} disabled={!puedeEditarM}
                >
                  <option value="ENTRADA">ENTRADA (+)</option>
                  <option value="MERMA">MERMA (-)</option>
                  <option value="SALIDA">SALIDA (-)</option>
                  <option value="AJUSTE">AJUSTE (+/-)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {puedeEditarM && <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}>GUARDAR</button>}
                {mEditId && (
                  <button type="button" className={`${s.btn} ${s.btnOutlineDanger} ${s.btnFull}`} onClick={() => { setMEditId(null); setMNombre(''); setMTipo('ENTRADA'); }}>
                    {puedeEditarM ? 'CANCELAR' : 'CERRAR'}
                  </button>
                )}
              </div>
            </form>
          </aside>

          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <table className={s.table} style={{ minWidth: '500px' }}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>TIPO</th>
                  <th className={s.th}>MOTIVO</th>
                  <th className={s.th} style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {motivosInventario.map(m => (
                  <tr key={m.id}>
                    <td className={s.td}>
                      <span className={m.tipo === 'ENTRADA' ? s.badgeSuccess : s.badgeDanger}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className={s.td}><strong>{m.nombre_motivo}</strong></td>
                    <td className={s.td} style={{ textAlign: 'right' }}>
                      <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => { setMEditId(m.id); setMNombre(m.nombre_motivo); setMTipo(m.tipo); }}>
                        {puedeEditarM ? '📝' : 'VER'}
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