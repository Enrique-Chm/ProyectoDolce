import React, { useState } from 'react';
import s from './MeseroTab.module.css'; // Usando tus estilos existentes
import { useImpresoras } from '../../../hooks/useImpresoras';
import { generarHTMLTicket } from '../../../utils/impresion.util';

export const ImpresorasTab = ({ sucursalId }) => {
  const [activeSubTab, setActiveSubTab] = useState('dispositivos'); // dispositivos | diseno
  
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

  // Datos mock para alimentar la vista previa en tiempo real
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

  // Generamos el HTML basado en el estado actual (refleja cambios sin guardar aún)
  const htmlPreview = generarHTMLTicket(datosPreview, '80mm', 'caja', configTicket);

  return (
    <div className={s.posContainer}>
      <div className={s.headerRow} style={{ marginBottom: '20px' }}>
        <h2 className={s.sectionTitle}>Ajustes de Impresión</h2>
        
        {/* Selector de Sub-pestañas */}
        <div style={{ display: 'flex', gap: '10px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' }}>
          <button 
            className={activeSubTab === 'dispositivos' ? s.btnOrder : s.btnCancel}
            style={{ margin: 0, padding: '8px 20px' }}
            onClick={() => setActiveSubTab('dispositivos')}
          >
            📟 Dispositivos
          </button>
          <button 
            className={activeSubTab === 'diseno' ? s.btnOrder : s.btnCancel}
            style={{ margin: 0, padding: '8px 20px' }}
            onClick={() => setActiveSubTab('diseno')}
          >
            🎨 Diseño de Ticket
          </button>
        </div>
      </div>

      <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', marginBottom: '25px' }} />

      {activeSubTab === 'dispositivos' ? (
        /* --- VISTA DE HARDWARE --- */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
          
          <div style={{ background: 'white', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginBottom: '20px' }}>Impresoras Configuradas</h3>
            {impresoras.length === 0 ? (
              <div className={s.emptyState}>No hay impresoras registradas en esta sucursal.</div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {impresoras.map(imp => (
                  <div key={imp.id} className={s.mesaCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                    <div>
                      <strong style={{ fontSize: '1.1rem' }}>{imp.nombre}</strong>
                      <div className={s.textMuted} style={{ fontSize: '0.8rem' }}>
                        {imp.origen.toUpperCase()} • {imp.formato} • IP: {imp.ip_address || 'USB'}
                      </div>
                    </div>
                    <button 
                      className={s.btnCancel} 
                      style={{ color: '#ef4444', borderColor: '#fee2e2' }}
                      onClick={() => eliminarImpresora(imp.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulario de Registro */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '24px', border: '2px solid var(--primary)', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '20px' }}>Vincular Nueva</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label className={s.formLabel}>Nombre Identificador</label>
                <input 
                  type="text" className={s.input} placeholder="Ej. Barra / Cocina"
                  value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                />
              </div>

              <div>
                <label className={s.formLabel}>Destino de Impresión</label>
                <select className={s.input} value={form.origen} onChange={e => setForm({...form, origen: e.target.value})}>
                  <option value="caja">💵 Ventas / Caja</option>
                  <option value="cocina">🍳 Cocina / Comandas</option>
                  <option value="barra">🍹 Barra / Bebidas</option>
                </select>
              </div>

              <div>
                <label className={s.formLabel}>Papel</label>
                <select className={s.input} value={form.formato} onChange={e => setForm({...form, formato: e.target.value})}>
                  <option value="80mm">80mm (Estándar)</option>
                  <option value="58mm">58mm (Mini)</option>
                </select>
              </div>

              <div style={{ borderTop: '1px solid #eee', pt: '10px' }}>
                <label className={s.formLabel}>Dirección IP</label>
                <input 
                  type="text" className={s.input} placeholder="192.168.1.100"
                  value={form.ip_address} onChange={e => setForm({...form, ip_address: e.target.value})}
                />
              </div>

              <button className={s.btnOrder} onClick={guardarImpresora} disabled={loading}>
                {loading ? 'REGISTRANDO...' : 'GUARDAR DISPOSITIVO'}
              </button>
            </div>
          </div>
        </div>

      ) : (
        /* --- VISTA DE DISEÑO VISUAL --- */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '30px' }}>
          
          <div style={{ background: 'white', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <h3>Personalizar Ticket</h3>
            <p className={s.textMuted}>Los cambios se reflejan en tiempo real en la vista previa.</p>

            <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
              <div>
                <label className={s.formLabel}>Encabezado (RFC / Dirección)</label>
                <textarea 
                  className={s.input} rows="4" style={{ fontFamily: 'monospace' }}
                  value={configTicket.encabezado}
                  onChange={e => setConfigTicket({...configTicket, encabezado: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label className={s.formLabel}>Tamaño Fuente ({configTicket.font_size_base}px)</label>
                  <input 
                    type="range" min="10" max="18" style={{ width: '100%' }}
                    value={configTicket.font_size_base}
                    onChange={e => setConfigTicket({...configTicket, font_size_base: parseInt(e.target.value)})}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={s.formLabel}>Visibilidad</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.85rem' }}>
                      <input type="checkbox" checked={configTicket.mostrar_logo} onChange={e => setConfigTicket({...configTicket, mostrar_logo: e.target.checked})} /> Logo
                    </label>
                    <label style={{ fontSize: '0.85rem' }}>
                      <input type="checkbox" checked={configTicket.mostrar_mesero} onChange={e => setConfigTicket({...configTicket, mostrar_mesero: e.target.checked})} /> Mesero
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className={s.formLabel}>Pie de Página</label>
                <textarea 
                  className={s.input} rows="3" style={{ fontFamily: 'monospace' }}
                  value={configTicket.pie_pagina}
                  onChange={e => setConfigTicket({...configTicket, pie_pagina: e.target.value})}
                />
              </div>

              <button className={s.btnOrder} onClick={guardarConfigTicket} disabled={loading}>
                {loading ? 'GUARDANDO...' : '💾 GUARDAR DISEÑO'}
              </button>
            </div>
          </div>

          {/* SIMULADOR DE TICKET (VISTA PREVIA) */}
          <div style={{ position: 'sticky', top: '20px' }}>
            <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Vista Previa</h4>
            <div style={{ 
              background: '#334155', padding: '20px 10px', borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
            }}>
              <div 
                style={{ 
                  background: 'white', 
                  minHeight: '400px', 
                  width: '100%',
                  overflow: 'hidden' 
                }}
                dangerouslySetInnerHTML={{ __html: htmlPreview }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};