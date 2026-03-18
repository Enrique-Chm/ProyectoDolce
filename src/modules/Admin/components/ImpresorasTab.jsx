// Archivo: src/modules/Admin/components/ImpresorasTab.jsx
import React, { useState } from 'react';
import s from '../AdminPage.module.css'; // Usamos los estilos del Admin homologados
import { useImpresoras } from '../../../hooks/useImpresoras';
import { generarHTMLTicket } from '../../../utils/impresion.util';
import { hasPermission } from '../../../utils/checkPermiso'; // Importamos el sistema de permisos

export const ImpresorasTab = ({ sucursalId }) => {
  const [activeSubTab, setActiveSubTab] = useState('dispositivos'); 
  
  // 🛡️ SEGURIDAD INTERNA (RBAC)
  const puedeEditar = hasPermission('editar_configuracion');
  const puedeBorrar = hasPermission('borrar_impresoras');

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
    {/* SECCIÓN CABECERA: Misma estructura que Caja */}
    <div className={s.pageHeader}>
      <h2 className={s.pageTitle}>Configuracion de Impresion</h2>
    </div>
      
      {/* Navegación de Sub-pestañas Homologada */}
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

      {/* --- VISTA 1: HARDWARE (DISPOSITIVOS) --- */}
      {activeSubTab === 'dispositivos' && (
        <div className={s.splitLayout}>
          
          {/* Formulario Lateral: Solo visible o editable si tiene permiso */}
          <aside 
            className={s.adminCard} 
            style={{ 
              border: '2px solid var(--color-primary)',
              display: puedeEditar ? 'block' : 'none' // Ocultamos el formulario si no puede editar
            }}
          >
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
                style={{ marginTop: '10px' }}
                onClick={guardarImpresora} 
                disabled={loading || !puedeEditar}
              >
                {loading ? 'REGISTRANDO...' : 'GUARDAR DISPOSITIVO'}
              </button>
            </div>
          </aside>

          {/* Tabla de Impresoras */}
          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <div className={s.tableHeader}>
              <h3 className={s.cardTitle} style={{ margin: 0 }}>Impresoras Vinculadas</h3>
            </div>
            
            {impresoras.length === 0 ? (
              <div className={s.emptyState}>
                No hay impresoras registradas.
              </div>
            ) : (
              <table className={s.table} style={{ minWidth: '500px' }}>
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
                        <div style={{ fontWeight: '800', color: 'var(--color-text-main)' }}>{imp.nombre}</div>
                        <small style={{ color: 'var(--color-text-muted)', fontWeight: '600' }}>
                          IP: {imp.ip_address || 'USB/Local'} • {imp.formato}
                        </small>
                      </td>
                      <td className={s.td}>
                        <span className={s.badge}>
                          {imp.origen.toUpperCase()}
                        </span>
                      </td>
                      <td className={s.td} style={{ textAlign: 'right' }}>
                        {puedeBorrar && (
                          <button 
                            className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} 
                            onClick={() => eliminarImpresora(imp.id)}
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* --- VISTA 2: DISEÑO DE TICKET --- */}
      {activeSubTab === 'diseno' && (
        <div className={s.splitLayout}>
          
          {/* Controles de Diseño */}
          <div className={s.adminCard}>
            <h3 className={s.cardTitle} style={{ marginBottom: '10px' }}>Personalizar Ticket</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '25px' }}>
              Configuración visual para impresoras de caja.
            </p>

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
                    disabled={!puedeEditar}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                   <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', color: 'var(--color-text-main)' }}>
                     <input type="checkbox" checked={configTicket.mostrar_logo} onChange={e => setConfigTicket({...configTicket, mostrar_logo: e.target.checked})} disabled={!puedeEditar} /> Logo
                   </label>
                   <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', color: 'var(--color-text-main)' }}>
                     <input type="checkbox" checked={configTicket.mostrar_mesero} onChange={e => setConfigTicket({...configTicket, mostrar_mesero: e.target.checked})} disabled={!puedeEditar} /> Mesero
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

              {puedeEditar && (
                <button 
                  className={`${s.btn} ${s.btnSuccess} ${s.btnFull}`} 
                  style={{ padding: '15px', fontSize: '1rem' }}
                  onClick={guardarConfigTicket} 
                  disabled={loading}
                >
                  {loading ? 'GUARDANDO...' : '💾 GUARDAR DISEÑO'}
                </button>
              )}
            </div>
          </div>

          {/* SIMULADOR DE TICKET */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'sticky', top: '20px' }}>
                <h4 style={{ textAlign: 'center', fontSize: '11px', fontWeight: '800', color: 'var(--color-text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                  Vista Previa Digital
                </h4>
                <div style={{ 
                  background: '#334155', padding: '20px 15px', borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-md)', border: '4px solid #1e293b'
                }}>
                  <div 
                    style={{ 
                      background: 'white', 
                      minHeight: '400px', 
                      width: '100%',
                      overflow: 'hidden',
                      padding: '5px'
                    }}
                    dangerouslySetInnerHTML={{ __html: htmlPreview }}
                  />
                </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};