// Archivo: src/modules/Admin/Tabs/ConfigTab/ConfigTab.jsx
import React, { useState } from 'react';
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { useConfigTab } from './useConfigTab';
import { hasPermission } from '../../../../utils/checkPermiso'; // 🛡️ Importamos seguridad
import { ZonasMesasView } from './ZonasMesasView'; // 👈 Importamos el nuevo componente

export const ConfigTab = () => {
  const [subTab, setSubTab] = useState('unidades');

  const {
    loading,
    unidades,
    catMenu,
    catInsumos,
    motivosInventario,
    
    // 🚀 ESTADOS DE ZONAS Y MESAS
    zonas,
    
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
    
    // 🚀 SETTERS Y HANDLERS DE ZONAS/MESAS
    zEditId, setZEditId, zFormData, setZFormData, handleSubmitZona, resetZona,
    mesaEditId, setMesaEditId, mesaFormData, setMesaFormData, handleSubmitMesa, resetMesa,
    handleSavePlano, // 👈 Acción para guardar el drag & drop

    handleSubmitUnidad,
    handleSubmitCatMenu,
    handleSubmitCatInsumo,
    handleSubmitMotivo,
    handleDelete, 
    // 🛡️ Facultades importadas del hook
    puedeVerConfig,
    puedeCrearU, puedeEditarU,
    puedeCrearC, puedeEditarC,
    puedeCrearM, puedeEditarM,
    puedeBorrarConfig 
  } = useConfigTab(subTab);

  const handleTabChange = (newTab) => {
    setSubTab(newTab);
    setUEditId(null); setUNombre(''); setUAbrev('');
    setCMenuEditId(null); setCMenuNombre(''); setCMenuColor('#005696');
    setCInsumoEditId(null); setCInsumoNombre('');
    setMEditId(null); setMNombre(''); setMTipo('ENTRADA');
    resetZona();
    resetMesa();
  };

  const mostrarFormularioU = puedeCrearU || uEditId;
  const mostrarFormularioCMenu = puedeCrearC || cMenuEditId;
  const mostrarFormularioCInsumo = puedeCrearC || cInsumoEditId;
  const mostrarFormularioM = puedeCrearM || mEditId;
  const mostrarFormularioZ = puedeVerConfig; 

  if (loading && !zonas.length) return <div className={s.tabContent}><p>Cargando configuración...</p></div>;

  return (
    <div className={s.tabWrapper}>
      {/* SECCIÓN CABECERA */}
      <div className={s.pageHeader}>
        <h2 className={s.pageTitle}>Configuración del Sistema</h2>
      </div>

      {/* Navegación de Sub-pestañas */}
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
        {hasPermission('ver_configuracion') && (
          <button
            className={`${s.tabButton} ${subTab === 'zonas' ? s.activeTabButton : ''}`}
            onClick={() => handleTabChange('zonas')}
          >
            Zonas y Mesas
          </button>
        )}
      </nav>

      {/* --- SECCIÓN UNIDADES --- */}
      {subTab === 'unidades' && hasPermission('ver_unidades') && (
        <div className={mostrarFormularioU ? s.splitLayout : s.fullLayout}>
          <aside className={s.adminCard} style={{ display: mostrarFormularioU ? 'block' : 'none' }}>
            <h3 className={s.cardTitle}>
              {uEditId ? (puedeEditarU ? 'Editar' : 'Ver') : 'Nueva'} Unidad
            </h3>
            <form onSubmit={handleSubmitUnidad} className={s.loginForm}>
              <div className={s.formGroup}>
                <label className={s.label}>NOMBRE</label>
                <input 
                  className={s.inputField}
                  value={uNombre} onChange={e => setUNombre(e.target.value)} required 
                  readOnly={uEditId ? !puedeEditarU : !puedeCrearU} 
                  style={{ backgroundColor: (uEditId ? !puedeEditarU : !puedeCrearU) ? "var(--color-bg-muted)" : "white" }}
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>ABREVIATURA</label>
                <input 
                  className={s.inputField}
                  value={uAbrev} onChange={e => setUAbrev(e.target.value)} required 
                  readOnly={uEditId ? !puedeEditarU : !puedeCrearU} 
                  style={{ backgroundColor: (uEditId ? !puedeEditarU : !puedeCrearU) ? "var(--color-bg-muted)" : "white" }}
                />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                {(uEditId ? puedeEditarU : puedeCrearU) && (
                  <button type="submit" className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1 }}>GUARDAR</button>
                )}
                {uEditId && (
                  <button type="button" className={`${s.btn} ${s.btnDark}`} style={{ flex: 1 }} onClick={() => { setUEditId(null); setUNombre(''); setUAbrev(''); }}>
                    {puedeEditarU ? 'CANCELAR' : 'CERRAR'}
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
                  <th className={s.th}>DESCRIPCIÓN</th>
                  <th className={s.th} style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map(u => (
                  <tr key={u.id} style={{ backgroundColor: uEditId === u.id ? 'var(--color-bg-app)' : 'transparent' }}>
                    <td className={s.td}>#{u.id}</td>
                    <td className={s.td}><strong>{u.nombre}</strong> <span className={s.textMuted}>({u.abreviatura})</span></td>
                    <td className={s.td} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => { setUEditId(u.id); setUNombre(u.nombre); setUAbrev(u.abreviatura); }}>
                          {puedeEditarU ? '📝' : '👁️'}
                        </button>
                        {puedeBorrarConfig && (
                          <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => handleDelete('unidades', u.id)}>
                            ❌
                          </button>
                        )}
                      </div>
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
          
          <div className={mostrarFormularioCMenu ? s.splitLayout : s.fullLayout}>
            <aside className={s.adminCard} style={{ display: mostrarFormularioCMenu ? 'block' : 'none' }}>
              <h3 className={s.cardTitle}>
                {cMenuEditId ? (puedeEditarC ? 'Editar Categoría Menú' : 'Detalle Categoría Menú') : 'Nueva Categoría Menú'}
              </h3>
              <form onSubmit={handleSubmitCatMenu} className={s.loginForm}>
                <div className={s.formGroup}>
                  <label className={s.label}>NOMBRE CATEGORÍA</label>
                  <input 
                    className={s.inputField}
                    value={cMenuNombre} onChange={e => setCMenuNombre(e.target.value)} placeholder="Ej: Hamburguesas" required 
                    readOnly={cMenuEditId ? !puedeEditarC : !puedeCrearC} 
                    style={{ backgroundColor: (cMenuEditId ? !puedeEditarC : !puedeCrearC) ? "var(--color-bg-muted)" : "white" }}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>COLOR IDENTIFICADOR</label>
                  <input 
                    type="color"
                    className={`${s.inputField} ${s.colorPicker}`}
                    value={cMenuColor} onChange={e => setCMenuColor(e.target.value)} 
                    disabled={cMenuEditId ? !puedeEditarC : !puedeCrearC} 
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                  {(cMenuEditId ? puedeEditarC : puedeCrearC) && (
                    <button type="submit" className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1 }}>
                      {cMenuEditId ? 'ACTUALIZAR' : 'GUARDAR'}
                    </button>
                  )}
                  {cMenuEditId && (
                    <button type="button" className={`${s.btn} ${s.btnDark}`} style={{ flex: 1 }} onClick={() => { setCMenuEditId(null); setCMenuNombre(''); setCMenuColor('#005696'); }}>
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
                    <tr key={c.id} style={{ backgroundColor: cMenuEditId === c.id ? 'var(--color-bg-app)' : 'transparent' }}>
                      <td className={s.td}>
                        <div className={s.colorCircle} style={{ backgroundColor: c.color_etiqueta }}></div>
                      </td>
                      <td className={s.td}><strong>{c.nombre}</strong></td>
                      <td className={s.td} style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => { setCMenuEditId(c.id); setCMenuNombre(c.nombre); setCMenuColor(c.color_etiqueta); }}>
                            {puedeEditarC ? '📝' : '👁️'}
                          </button>
                          {puedeBorrarConfig && (
                            <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => handleDelete('menu', c.id)}>
                              ❌
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={mostrarFormularioCInsumo ? s.splitLayout : s.fullLayout}>
            <aside className={s.adminCard} style={{ display: mostrarFormularioCInsumo ? 'block' : 'none' }}>
              <h3 className={s.cardTitle}>
                {cInsumoEditId ? (puedeEditarC ? 'Editar Almacén' : 'Detalle Almacén') : 'Nueva Categoría Almacén'}
              </h3>
              <form onSubmit={handleSubmitCatInsumo} className={s.loginForm}>
                <div className={s.formGroup}>
                  <label className={s.label}>NOMBRE CATEGORÍA</label>
                  <input 
                    className={s.inputField}
                    value={cInsumoNombre} onChange={e => setCInsumoNombre(e.target.value)} placeholder="Ej: Proteínas" required 
                    readOnly={cInsumoEditId ? !puedeEditarC : !puedeCrearC} 
                    style={{ backgroundColor: (cInsumoEditId ? !puedeEditarC : !puedeCrearC) ? "var(--color-bg-muted)" : "white" }}
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                  {(cInsumoEditId ? puedeEditarC : puedeCrearC) && (
                    <button type="submit" className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1 }}>
                      {cInsumoEditId ? 'ACTUALIZAR' : 'GUARDAR'}
                    </button>
                  )}
                  {cInsumoEditId && (
                    <button type="button" className={`${s.btn} ${s.btnDark}`} style={{ flex: 1 }} onClick={() => { setCInsumoEditId(null); setCInsumoNombre(''); }}>
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
                    <tr key={c.id} style={{ backgroundColor: cInsumoEditId === c.id ? 'var(--color-bg-app)' : 'transparent' }}>
                      <td className={s.td}>#{c.id}</td>
                      <td className={s.td}><strong>{c.nombre}</strong></td>
                      <td className={s.td} style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => { setCInsumoEditId(c.id); setCInsumoNombre(c.nombre); }}>
                            {puedeEditarC ? '📝' : '👁️'}
                          </button>
                          {puedeBorrarConfig && (
                            <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => handleDelete('insumos', c.id)}>
                              ❌
                            </button>
                          )}
                        </div>
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
        <div className={mostrarFormularioM ? s.splitLayout : s.fullLayout}>
          <aside className={s.adminCard} style={{ display: mostrarFormularioM ? 'block' : 'none' }}>
            <h3 className={s.cardTitle}>
              {mEditId ? (puedeEditarM ? 'Editar Motivo' : 'Detalle Motivo') : 'Nuevo Motivo'}
            </h3>
            <form onSubmit={handleSubmitMotivo} className={s.loginForm}>
              <div className={s.formGroup}>
                <label className={s.label}>NOMBRE DEL MOTIVO</label>
                <input 
                  className={s.inputField}
                  value={mNombre} onChange={e => setMNombre(e.target.value)} placeholder="Ej: Compra Proveedor" required 
                  readOnly={mEditId ? !puedeEditarM : !puedeCrearM} 
                  style={{ backgroundColor: (mEditId ? !puedeEditarM : !puedeCrearM) ? "var(--color-bg-muted)" : "white" }}
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>TIPO DE MOVIMIENTO</label>
                <select 
                  className={s.inputField}
                  value={mTipo} onChange={e => setMTipo(e.target.value)} 
                  disabled={mEditId ? !puedeEditarM : !puedeCrearM}
                  style={{ backgroundColor: (mEditId ? !puedeEditarM : !puedeCrearM) ? "var(--color-bg-muted)" : "white" }}
                >
                  <option value="ENTRADA">ENTRADA (+)</option>
                  <option value="MERMA">MERMA (-)</option>
                  <option value="SALIDA">SALIDA (-)</option>
                  <option value="AJUSTE">AJUSTE (+/-)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                {(mEditId ? puedeEditarM : puedeCrearM) && (
                  <button type="submit" className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1 }}>GUARDAR</button>
                )}
                {mEditId && (
                  <button type="button" className={`${s.btn} ${s.btnDark}`} style={{ flex: 1 }} onClick={() => { setMEditId(null); setMNombre(''); setMTipo('ENTRADA'); }}>
                    {puedeEditarM ? 'CANCELAR' : 'CERRAR'}
                  </button>
                )}
              </div>
            </form>
          </aside>

          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>TIPO</th>
                  <th className={s.th}>MOTIVO</th>
                  <th className={s.th} style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {motivosInventario.map(m => (
                  <tr key={m.id} style={{ backgroundColor: mEditId === m.id ? 'var(--color-bg-app)' : 'transparent' }}>
                    <td className={s.td}>
                      <span className={m.tipo === 'ENTRADA' ? s.badgeSuccess : s.badgeDanger}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className={s.td}><strong>{m.nombre_motivo}</strong></td>
                    <td className={s.td} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => { setMEditId(m.id); setMNombre(m.nombre_motivo); setMTipo(m.tipo); }}>
                          {puedeEditarM ? '📝' : '👁️'}
                        </button>
                        {puedeBorrarConfig && (
                          <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => handleDelete('motivos', m.id)}>
                            ❌
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- 🚀 SECCIÓN ZONAS Y MESAS CON CUADRÍCULA ESCALABLE --- */}
      {subTab === 'zonas' && hasPermission('ver_configuracion') && (
        <ZonasMesasView 
          zonas={zonas}
          zEditId={zEditId} 
          setZEditId={setZEditId} 
          zFormData={zFormData} 
          setZFormData={setZFormData} 
          handleSubmitZona={handleSubmitZona} 
          resetZona={resetZona}
          mesaEditId={mesaEditId} 
          setMesaEditId={setMesaEditId} 
          mesaFormData={mesaFormData} 
          setMesaFormData={setMesaFormData} 
          handleSubmitMesa={handleSubmitMesa} 
          resetMesa={resetMesa}
          handleSavePlano={handleSavePlano}
          handleDelete={handleDelete}
          puedeCrearM={puedeCrearM} 
          puedeEditarM={puedeEditarM} 
          puedeBorrarConfig={puedeBorrarConfig} 
          mostrarFormularioZ={mostrarFormularioZ}
        />
      )}
    </div>
  );
};

export default ConfigTab;