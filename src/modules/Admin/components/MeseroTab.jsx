import React, { useState } from 'react';
import s from './MeseroTab.module.css';
import { useMeseroTab } from '../../../hooks/useMeseroTab';

export const MeseroTab = ({ sucursalId, usuarioId }) => {
  const {
    view, setView,
    cuentasAbiertas,
    cuentasCobradas,
    ventaActiva,
    mesaInput, setMesaInput,
    productos,
    categorias,
    carrito,
    loading,
    seleccionarCuenta,
    agregarAlCarrito,
    eliminarDelCarrito,
    actualizarNota,
    handleEnviarOrden,
    pedirCuenta
  } = useMeseroTab(sucursalId, usuarioId);

  const [isCartExpanded, setIsCartExpanded] = useState(false);

  return (
    <div className={s.posContainer}>
      
      {/* VISTA 0: MONITOR DE SALÓN */}
      {view === 'cuentas' && (
        <div>
          <div className={s.headerRow}>
            <h2 className={s.sectionTitle}>Salón</h2>
            <div className={s.flexCenterGap}>
              <button className={s.btnCancel} onClick={() => setView('historial')}>📜 HISTORIAL</button>
              <button className={s.btnPrimary} onClick={() => { setMesaInput(''); setView('mesas'); }}>+ NUEVA MESA</button>
            </div>
          </div>

          <div className={s.productGrid}>
            {cuentasAbiertas.map(v => (
              <div key={v.id} className={s.mesaCard} onClick={() => seleccionarCuenta(v)}>
                <div className={s.flexStartGap}>
                  <div>
                    <h3 className={s.mesaName}>Mesa {v.mesa}</h3>
                  </div>
                  <span className={v.estado === 'por_cobrar' ? s.mesaBadgeCobrar : s.mesaBadge}>
                    {v.estado === 'por_cobrar' ? 'Por Cobrar' : 'Abierta'}
                  </span>
                </div>
                <div className={s.mesaTotal}>${v.total}</div>
              </div>
            ))}
            {!loading && cuentasAbiertas.length === 0 && (
              <div className={s.emptyStateBox}>
                <h3 className={s.emptyStateTitle}>Salón Libre</h3>
                <p className={s.emptyStateText}>No hay mesas activas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 1: IDENTIFICAR MESA */}
      {view === 'mesas' && (
        <div className={s.mesaSelectorManual}>
          <h2 className={s.manualTitle}>¿Qué mesa es?</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (mesaInput) setView('menu'); }}>
            <input className={s.mesaInput} value={mesaInput} onChange={e => setMesaInput(e.target.value)} placeholder="Ej. 15" autoFocus required />
            <button type="submit" className={s.btnEmpezarOrden}>Tomar Orden</button>
            <button type="button" className={`${s.btnCancel} ${s.btnCancelFull}`} onClick={() => setView('cuentas')}>Cancelar</button>
          </form>
        </div>
      )}

      {/* VISTA 2: COMANDERO */}
      {view === 'menu' && (
        <div className={s.posGrid}>
          <div className={s.menuArea}>
            <div className={s.headerRow}>
              <button className={`${s.btnCancel} ${s.btnBackNav}`} onClick={() => { setView('cuentas'); setIsCartExpanded(false); }}>← VOLVER</button>
              <div className={s.menuHeaderInfo}>
                <h3 className={s.menuHeaderTitle}>MESA {mesaInput.toUpperCase()}</h3>
              </div>
            </div>
            
            {categorias.map(cat => {
              const productosCat = productos.filter(p => p.categoria === cat.id);
              if (productosCat.length === 0) return null; 
              return (
                <div key={cat.id} className={s.categoryBlock}>
                  <h4>{cat.nombre}</h4>
                  <div className={s.productGrid}>
                    {productosCat.map(p => {
                      const isLocked = ventaActiva?.estado === 'por_cobrar';
                      return (
                        <div 
                          key={p.id} 
                          className={`${s.productCard} ${isLocked ? s.productCardLocked : ''}`} 
                          onClick={() => agregarAlCarrito(p)}
                        >
                          <div>{p.nombre}</div>
                          <div>${p.precio_venta}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <aside className={`${s.cartArea} ${isCartExpanded ? s.cartExpanded : s.cartCollapsed}`}>
            <div className={s.cartHeader} onClick={() => setIsCartExpanded(!isCartExpanded)}>
              <div className={s.dragHandle}></div>
              <div className={s.headerRow} style={{ marginBottom: 0 }}>
                <strong className={s.cartTitle}>Comanda</strong>
                <div className={s.flexCenterGap}>
                   <span className={s.itemsBadge}>{carrito.length} nuevos</span>
                   <span className={s.toggleIcon}>{isCartExpanded ? '▼' : '▲'}</span>
                </div>
              </div>
            </div>
            
            <div className={s.cartItems}>
              {/* HISTORIAL DE PEDIDOS EN MESA (CONSUMO PREVIO) */}
              {ventaActiva?.ventas_detalle?.length > 0 && (
                <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '8px' }}>CONSUMO EN MESA</div>
                  {ventaActiva.ventas_detalle.map((det, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#64748b' }}>
                      <span>{det.cantidad}x {det.productosmenu?.nombre}</span>
                      <span style={{ fontWeight: 700 }}>${det.subtotal}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* PRODUCTOS NUEVOS (CARRITO) */}
              {carrito.map((item) => (
                <div key={item.id} className={s.cartItem}>
                  <div className={s.cartItemHeader} style={{display:'flex', justifyContent:'space-between'}}>
                    <strong className={s.cartItemName}><span className={s.cartItemQty}>{item.cantidad}x</span> {item.nombre}</strong>
                    <button onClick={() => eliminarDelCarrito(item.id)} className={s.btnRemoveItem}>✕</button>
                  </div>
                  <input placeholder="+ Notas..." className={s.inputNota} value={item.notas} onChange={(e) => actualizarNota(item.id, e.target.value)} />
                </div>
              ))}
              {carrito.length === 0 && !ventaActiva?.ventas_detalle?.length && (
                <div className={s.emptyCartText}>Mesa vacía. Agrega productos.</div>
              )}
            </div>

            <div className={s.cartFooter}>
              <div className={s.summaryBox}>
                <div className={s.flexBetween} style={{display:'flex', justifyContent:'space-between'}}>
                  <span className={s.summaryLabel}>Total Cuenta:</span>
                  <span className={s.summaryValue}>
                    ${( (ventaActiva?.total || 0) + carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0) ).toFixed(2)}
                  </span>
                </div>
              </div>

              <button className={s.btnOrder} onClick={handleEnviarOrden} disabled={loading || carrito.length === 0 || ventaActiva?.estado === 'por_cobrar'}>
                {loading ? 'ENVIANDO...' : 'ENVIAR A COCINA'}
              </button>
              
              {ventaActiva && (
                <button 
                  className={`${s.btnOrder} ${s.btnDelete}`} 
                  style={{ width: '100%', background: ventaActiva.estado === 'por_cobrar' ? '#f59e0b' : '#ef4444', marginTop: '10px' }} 
                  onClick={() => {
                    const msg = ventaActiva.estado === 'por_cobrar' ? '¿Reimprimir ticket de cuenta?' : '¿Enviar a caja para cobro?';
                    if (window.confirm(msg)) pedirCuenta(ventaActiva.id);
                  }}
                  disabled={loading}
                >
                  {ventaActiva.estado === 'por_cobrar' ? 'REIMPRIMIR TICKET' : 'PEDIR CUENTA'}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* VISTA 3: HISTORIAL */}
      {view === 'historial' && (
        <div>
          <div className={s.headerRow}>
            <h2 className={s.sectionTitle}>Cobradas Hoy</h2>
            <button className={s.btnCancel} onClick={() => setView('cuentas')}>← VOLVER</button>
          </div>
          <div className={s.historyGrid}>
            {cuentasCobradas.map(v => (
              <div key={v.id} className={s.historyCard}>
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>Mesa {v.mesa}</strong>
                  <div className={s.historyCardTime}>
                    Pagada: {new Date(v.hora_cierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={s.historyCardAmount}>${v.total}</div>
                  <span className={s.mesaBadge} style={{background:'#d1fae5', color:'#065f46'}}>PAGADA</span>
                </div>
              </div>
            ))}
            {!loading && cuentasCobradas.length === 0 && (
              <div className={s.emptyStateBox}>No hay registros hoy.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};