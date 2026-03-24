// Archivo: src/modules/Admin/components/ImpresorasTab.jsx
import React, { useState } from 'react';
import s from '../AdminPage.module.css'; 
import { useImpresoras } from '../../../hooks/useImpresoras';
import { generarHTMLTicket } from '../../../utils/impresion.util';
import { hasPermission } from '../../../utils/checkPermiso'; 

export const ImpresorasTab = ({ sucursalId }) => {
  const [activeSubTab, setActiveSubTab] = useState('dispositivos'); 
  
  // 🛡️ SEGURIDAD INTERNA (RBAC)
  const puedeEditar = hasPermission('editar_configuracion');
  const puedeBorrar = hasPermission('borrar_impresoras');

  // 💡 ESTÁNDAR: Control de visibilidad del Layout Dinámico
  const mostrarFormulario = puedeEditar;

  const { 
    impresoras, 
    form, 
    setForm, 
    guardarImpresora, 
    eliminarImpresora, 
    loading,
    configTicket,
    setConfigTicket,
    guardarConfigTicket
  } = useImpresoras(sucursalId);

  // Datos de ejemplo para la vista previa
  const datosPreview = {
    mesa: 'MESA 12',
    folio: '0015',
    meseroNombre: 'Cajero Principal',
    productos: [
      { cantidad: 2, nombre: 'Tacos al Pastor', precio_unitario: 25.00 },
      { cantidad: 1, nombre: 'Refresco Familiar', precio_unitario: 45.00 }
    ],
    total: 95.00,
    subtotal: 95.00
  };

  const htmlPreview = generarHTMLTicket(datosPreview, '80mm', 'caja', configTicket);

  return (
    <div className={s.tabWrapper}>
      {/* SECCIÓN CABECERA */}
      <div className={s.pageHeader}>
        <h2 className={s.pageTitle}>Configuracion de Impresion</h2>
      </div>
        
      {/* NAVEGACIÓN DE SUB-PESTAÑAS */}
      <nav className={s.tabNav}>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'dispositivos' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('dispositivos')}
        >
            DISPOSITIVOS
        </button>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'diseno' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('diseno')}
        >
            DISEÑO DE TICKET
        </button>
      </nav>

      {/* --- CONTENIDO DINÁMICO SEGÚN SUB-TAB --- */}
      <div className={mostrarFormulario ? s.splitLayout : s.fullLayout}>
        
        {/* PANEL IZQUIERDO: FORMULARIO (Se adapta según la sub-pestaña) */}
        <aside 
          className={s.adminCard} 
          style={{ display: mostrarFormulario ? 'block' : 'none' }}
        >
          {activeSubTab === 'dispositivos' ? (
            <>
              <h3 className={s.cardTitle}>Vincular Nueva</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className={s.formGroup}>
                  <label className={s.label}>NOMBRE IDENTIFICADOR</label>
                  <input 
                    type="text" 
                    className={s.inputField}
                    placeholder="Ej. Barra / Cocina"
                    value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                    disabled={!puedeEditar}
                    style={{ backgroundColor: !puedeEditar ? "var(--color-bg-muted)" : "white" }}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>DESTINO DE IMPRESIÓN</label>
                  <select 
                    className={s.inputField}
                    value={form.origen} onChange={e => setForm({...form, origen: e.target.value})}
                    disabled={!puedeEditar}
                  >
                    <option value="caja"> Ventas / Caja</option>
                    <option value="cocina"> Cocina / Comandas</option>
                    <option value="barra"> Barra / Bebidas</option>
                  </select>
                </div>
                <div className={s.formGrid}>
                  <div className={s.formGroup}>
                    <label className={s.label}>PAPEL</label>
                    <select 
                      className={s.inputField}
                      value={form.formato} onChange={e => setForm({...form, formato: e.target.value})}
                      disabled={!puedeEditar}
                    >
                      <option value="80mm">80mm</option>
                      <option value="58mm">58mm</option>
                    </select>
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.label}>IP ADDRESS</label>
                    <input 
                      type="text" 
                      className={s.inputField}
                      placeholder="192.168.1.100"
                      value={form.ip_address} onChange={e => setForm({...form, ip_address: e.target.value})}
                      disabled={!puedeEditar}
                    />
                  </div>
                </div>
                <button 
                  className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} 
                  onClick={guardarImpresora} 
                  disabled={loading || !puedeEditar}
                >
                  {loading ? 'REGISTRANDO...' : 'GUARDAR DISPOSITIVO'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className={s.cardTitle}>Personalizar Ticket</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className={s.formGroup}>
                  <label className={s.label}>ENCABEZADO</label>
                  <textarea 
                    className={s.inputField}
                    style={{ fontFamily: 'monospace', resize: 'vertical' }}
                    rows="4"
                    value={configTicket.encabezado}
                    onChange={e => setConfigTicket({...configTicket, encabezado: e.target.value})}
                    readOnly={!puedeEditar}
                  />
                </div>
                <div className={s.formGrid}>
                  <div className={s.formGroup}>
                    <label className={s.label}>FUENTE ({configTicket.font_size_base}px)</label>
                    <input 
                      type="range" min="10" max="18" 
                      style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                      value={configTicket.font_size_base}
                      onChange={e => setConfigTicket({...configTicket, font_size_base: parseInt(e.target.value)})}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                     <label className={s.checkboxLabel}>
                       <input type="checkbox" className={s.checkbox} checked={configTicket.mostrar_logo} onChange={e => setConfigTicket({...configTicket, mostrar_logo: e.target.checked})} /> Logo
                     </label>
                     <label className={s.checkboxLabel}>
                       <input type="checkbox" className={s.checkbox} checked={configTicket.mostrar_mesero} onChange={e => setConfigTicket({...configTicket, mostrar_mesero: e.target.checked})} /> Mesero
                     </label>
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>PIE DE PÁGINA</label>
                  <textarea 
                    className={s.inputField}
                    style={{ fontFamily: 'monospace', resize: 'vertical' }}
                    rows="3"
                    value={configTicket.pie_pagina}
                    onChange={e => setConfigTicket({...configTicket, pie_pagina: e.target.value})}
                    readOnly={!puedeEditar}
                  />
                </div>
                <button 
                  className={`${s.btn} ${s.btnSuccess} ${s.btnFull}`} 
                  onClick={guardarConfigTicket} 
                  disabled={loading}
                >
                  {loading ? 'GUARDANDO...' : '💾 GUARDAR DISEÑO'}
                </button>
              </div>
            </>
          )}
        </aside>

        {/* PANEL DERECHO: DATOS/VISTA PREVIA (Ocupa el lugar de la tabla) */}
        <div className={`${s.adminCard} ${s.tableContainer}`} style={{ display: 'flex', flexDirection: 'column' }}>
          {activeSubTab === 'dispositivos' ? (
            <>
              <div className={s.tableHeader}>
                <h3 className={s.cardTitle} style={{ margin: 0 }}>Impresoras Vinculadas</h3>
              </div>
              {impresoras.length === 0 ? (
                <div className={s.emptyState}>No hay impresoras registradas.</div>
              ) : (
                <table className={s.table}>
                  <thead className={s.thead}>
                    <tr>
                      <th className={s.th}>IDENTIFICADOR / IP</th>
                      <th className={s.th}>DESTINO</th>
                      <th className={s.th} style={{ textAlign: 'right' }}>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impresoras.map(imp => (
                      <tr key={imp.id}>
                        <td className={s.td}>
                          <div style={{ fontWeight: '800' }}>{imp.nombre}</div>
                          <small className={s.textMuted}>IP: {imp.ip_address || 'USB/Local'} • {imp.formato}</small>
                        </td>
                        <td className={s.td}><span className={s.badge}>{imp.origen.toUpperCase()}</span></td>
                        <td className={s.td} style={{ textAlign: 'right' }}>
                          {puedeBorrar && (
                            <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => eliminarImpresora(imp.id)}>Eliminar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <>
              <div className={s.tableHeader}>
                <h3 className={s.cardTitle} style={{ margin: 0 }}>Vista Previa Digital</h3>
              </div>
              <div style={{ 
                flex: 1, 
                background: 'var(--color-bg-app)', 
                marginTop: '15px', 
                borderRadius: 'var(--radius-ui)', 
                display: 'flex', 
                justifyContent: 'center', 
                padding: '40px 20px',
                border: '1px solid var(--color-border)'
              }}>
                <div style={{ 
                  background: 'white', 
                  width: '100%', 
                  maxWidth: '300px', 
                  minHeight: '400px', 
                  padding: '15px', 
                  boxShadow: 'var(--shadow-md)',
                  border: '1px dashed #ccc'
                }} dangerouslySetInnerHTML={{ __html: htmlPreview }} />
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};