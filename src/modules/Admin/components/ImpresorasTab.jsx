// Archivo: src/modules/Admin/components/ImpresorasTab.jsx
import React, { useState } from 'react';
import s from '../AdminPage.module.css'; // Usamos los estilos del Admin homologados
import { useImpresoras } from '../../../hooks/useImpresoras';
import { generarHTMLTicket } from '../../../utils/impresion.util';

export const ImpresorasTab = ({ sucursalId }) => {
  const [activeSubTab, setActiveSubTab] = useState('dispositivos'); 
  
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)', margin: '0' }}>
        Configuración de Impresión
      </h2>
      
      {/* Navegación de Sub-pestañas Homologada */}
      <nav style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
        <button 
          className={`${s.navItem} ${activeSubTab === 'dispositivos' ? s.activeNavItem : ''}`} 
          style={{ width: 'auto', padding: '8px 20px' }}
          onClick={() => setActiveSubTab('dispositivos')}
        >
          📟 DISPOSITIVOS
        </button>
        <button 
          className={`${s.navItem} ${activeSubTab === 'diseno' ? s.activeNavItem : ''}`} 
          style={{ width: 'auto', padding: '8px 20px' }}
          onClick={() => setActiveSubTab('diseno')}
        >
          🎨 DISEÑO DE TICKET
        </button>
      </nav>

      {/* --- VISTA 1: HARDWARE (DISPOSITIVOS) --- */}
      {activeSubTab === 'dispositivos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '25px', alignItems: 'start' }}>
          
          <div className={s.adminCard} style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Impresoras Vinculadas</h3>
            </div>
            
            {impresoras.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No hay impresoras registradas en esta sucursal.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>IDENTIFICADOR / IP</th>
                    <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>DESTINO</th>
                    <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {impresoras.map(imp => (
                    <tr key={imp.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '800', color: 'var(--color-text-main)' }}>{imp.nombre}</div>
                        <small style={{ color: 'var(--color-text-muted)', fontWeight: '600' }}>
                          IP: {imp.ip_address || 'USB/Local'} • {imp.formato}
                        </small>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--color-bg-app)', color: 'var(--color-primary)' }}>
                          {imp.origen.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        <button 
                          className={s.btnLogout} 
                          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                          onClick={() => eliminarImpresora(imp.id)}
                        >
                          ELIMINAR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Formulario Lateral */}
          <aside className={s.adminCard} style={{ padding: '20px', border: '2px solid var(--color-primary)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>Vincular Nueva</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE IDENTIFICADOR</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                  placeholder="Ej. Barra / Cocina"
                  value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>DESTINO DE IMPRESIÓN</label>
                <select 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                  value={form.origen} onChange={e => setForm({...form, origen: e.target.value})}
                >
                  <option value="caja">💵 Ventas / Caja</option>
                  <option value="cocina">🍳 Cocina / Comandas</option>
                  <option value="barra">🍹 Barra / Bebidas</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>FORMATO DE PAPEL</label>
                <select 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                  value={form.formato} onChange={e => setForm({...form, formato: e.target.value})}
                >
                  <option value="80mm">80mm (Estándar)</option>
                  <option value="58mm">58mm (Mini)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>DIRECCIÓN IP</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                  placeholder="192.168.1.100"
                  value={form.ip_address} onChange={e => setForm({...form, ip_address: e.target.value})}
                />
              </div>

              <button 
                className={s.btnLogout} 
                style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', marginTop: '10px' }}
                onClick={guardarImpresora} 
                disabled={loading}
              >
                {loading ? 'REGISTRANDO...' : 'GUARDAR DISPOSITIVO'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* --- VISTA 2: DISEÑO DE TICKET --- */}
      {activeSubTab === 'diseno' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '25px', alignItems: 'start' }}>
          
          <div className={s.adminCard} style={{ padding: '25px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '10px' }}>Personalizar Ticket</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '25px' }}>
              Los cambios en el diseño se aplican a todas las impresoras de caja de esta sucursal.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>ENCABEZADO (DATOS FISCALES / DIRECCIÓN)</label>
                <textarea 
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: '13px' }}
                  rows="4"
                  value={configTicket.encabezado}
                  onChange={e => setConfigTicket({...configTicket, encabezado: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>TAMAÑO FUENTE BASE ({configTicket.font_size_base}px)</label>
                  <input 
                    type="range" min="10" max="18" style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                    value={configTicket.font_size_base}
                    onChange={e => setConfigTicket({...configTicket, font_size_base: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>VISIBILIDAD</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={configTicket.mostrar_logo} onChange={e => setConfigTicket({...configTicket, mostrar_logo: e.target.checked})} /> Mostrar Logo
                    </label>
                    <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={configTicket.mostrar_mesero} onChange={e => setConfigTicket({...configTicket, mostrar_mesero: e.target.checked})} /> Mostrar Mesero
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>PIE DE PÁGINA (MENSAJE DE AGRADECIMIENTO)</label>
                <textarea 
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: '13px' }}
                  rows="3"
                  value={configTicket.pie_pagina}
                  onChange={e => setConfigTicket({...configTicket, pie_pagina: e.target.value})}
                />
              </div>

              <button 
                className={s.btnLogout} 
                style={{ backgroundColor: 'var(--color-success)', color: 'white', border: 'none', padding: '15px', fontWeight: '800' }}
                onClick={guardarConfigTicket} 
                disabled={loading}
              >
                {loading ? 'GUARDANDO...' : '💾 GUARDAR CONFIGURACIÓN DE DISEÑO'}
              </button>
            </div>
          </div>

          {/* SIMULADOR DE TICKET (VISTA PREVIA PEGADA) */}
          <div style={{ position: 'sticky', top: '20px' }}>
            <h4 style={{ textAlign: 'center', fontSize: '12px', fontWeight: '800', color: 'var(--color-text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
              Vista Previa Digital
            </h4>
            <div style={{ 
              background: '#334155', padding: '20px 10px', borderRadius: 'var(--radius-card)',
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
            <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '10px' }}>
              * El aspecto final puede variar según la impresora física.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};