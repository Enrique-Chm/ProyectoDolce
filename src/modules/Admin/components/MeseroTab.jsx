// Archivo: src/modules/Admin/components/MeseroTab.jsx
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

  // Estado para controlar el carrito en dispositivos móviles
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  return (
    <div className={s.posContainer}>
      
      {/* VISTA 0: MONITOR DE SALÓN (MESAS ACTIVAS) */}
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '10px' }}>Salón Libre</h3>
                <p style={{ margin: 0 }}>No hay mesas activas en este momento.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 1: IDENTIFICAR MESA (MODAL MANUAL) */}
      {view === 'mesas' && (
        <div className={s.mesaSelectorManual}>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '30px' }}>¿Qué mesa es?</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (mesaInput) setView('menu'); }}>
            <input 
              className={s.mesaInput} 
              value={mesaInput} 
              onChange={e => setMesaInput(e.target.value)} 
              placeholder="Ej. 15" 
              type="text"
              autoFocus 
              required 
            />
            <button type="submit" className={s.btnEmpezarOrden}>Tomar Orden</button>
            <button type="button" className={s.btnCancel} onClick={() => setView('cuentas')} style={{width: '100%', marginTop: '10px', padding: '15px'}}>
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* VISTA 2: COMANDERO (MENÚ + CARRITO) */}
      {view === 'menu' && (
        <div className={s.posGrid}>
          {/* LADO IZQUIERDO: CATEGORÍAS Y PRODUCTOS */}
          <div className={s.menuArea}>
            <div className={s.headerRow}>
              <button className={`${s.btnCancel} ${s.btnBackNav}`} onClick={() => { setView('cuentas'); setIsCartExpanded(false); }}>← VOLVER</button>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ margin: 0, fontWeight: '900', color: 'var(--color-primary)' }}>MESA {mesaInput.toUpperCase()}</h3>
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
                          onClick={() => !isLocked && agregarAlCarrito(p)}
                        >
                          <div style={{fontWeight: '800'}}>{p.nombre}</div>
                          <div style={{color: 'var(--color-primary)', marginTop: '5px'}}>${p.precio_venta}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* LADO DERECHO: COMANDA / CARRITO */}
          <aside className={`${s.cartArea} ${isCartExpanded ? s.cartExpanded : ''}`}>
            <div className={s.cartHeader} onClick={() => setIsCartExpanded(!isCartExpanded)}>
              <div className={s.dragHandle}></div>
              <div className={s.flexBetween}>
                <strong className={s.cartTitle}>Comanda</strong>
                <div className={s.flexCenterGap}>
                   <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', background: 'var(--color-primary)', color: 'white' }}>
                    {carrito.length} nuevos
                   </span>
                </div>
              </div>
            </div>
            
            <div className={s.cartItems}>
              {/* CONSUMO PREVIO (LO QUE YA SE ENVIÓ A COCINA) */}
              {ventaActiva?.ventas_detalle?.length > 0 && (
                <div style={{ marginBottom: '20px', background: 'var(--color-bg-muted)', padding: '12px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '8px', textAlign: 'center' }}>CONSUMO EN MESA</div>
                  {ventaActiva.ventas_detalle.map((det, idx) => (
                    <div key={idx} className={s.flexBetween} style={{ fontSize: '12px', marginBottom: '4px', color: 'var(--color-text-muted)' }}>
                      <span>{det.cantidad}x {det.productosmenu?.nombre}</span>
                      <span style={{ fontWeight: 700 }}>${det.subtotal}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* PRODUCTOS NUEVOS (LO QUE ESTÁ EN EL CARRITO) */}
              {carrito.map((item) => (
                <div key={item.id} className={s.cartItem}>
                  <div className={s.flexBetween}>
                    <strong className={s.cartItemName}><span className={s.cartItemQty}>{item.cantidad}x</span> {item.nombre}</strong>
                    <button onClick={() => eliminarDelCarrito(item.id)} className={s.btnRemoveItem}>✕</button>
                  </div>
                  <input 
                    placeholder="+ Notas para cocina..." 
                    className={s.inputNota} 
                    value={item.notas} 
                    onChange={(e) => actualizarNota(item.id, e.target.value)} 
                  />
                </div>
              ))}
              
              {carrito.length === 0 && !ventaActiva?.ventas_detalle?.length && (
                <div className={s.emptyCartText}>La mesa está vacía.</div>
              )}
            </div>

            <div className={s.cartFooter}>
              <div className={s.summaryBox}>
                <div className={s.flexBetween}>
                  <span className={s.summaryLabel}>Total Cuenta:</span>
                  <span className={s.summaryValue}>
                    ${( (ventaActiva?.total || 0) + carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0) ).toFixed(2)}
                  </span>
                </div>
              </div>

              <button 
                className={s.btnOrder} 
                onClick={handleEnviarOrden} 
                disabled={loading || carrito.length === 0 || ventaActiva?.estado === 'por_cobrar'}
              >
                {loading ? 'ENVIANDO...' : 'ENVIAR A COCINA'}
              </button>
              
              {ventaActiva && (
                <button 
                  className={`${s.btnOrder} ${s.btnDelete}`} 
                  style={{ background: ventaActiva.estado === 'por_cobrar' ? 'var(--color-warning)' : 'var(--color-danger)', marginTop: '10px' }} 
                  onClick={() => {
                    const msg = ventaActiva.estado === 'por_cobrar' ? '¿Deseas reimprimir el ticket de cuenta?' : '¿Enviar esta mesa a caja para cobrar?';
                    if (window.confirm(msg)) pedirCuenta(ventaActiva.id);
                  }}
                  disabled={loading}
                >
                  {ventaActiva.estado === 'por_cobrar' ? '🖨️ REIMPRIMIR TICKET' : '🧾 PEDIR CUENTA'}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* VISTA 3: HISTORIAL DE CUENTAS COBRADAS */}
      {view === 'historial' && (
        <div>
          <div className={s.headerRow}>
            <h2 className={s.sectionTitle}>Cuentas de Hoy</h2>
            <button className={s.btnCancel} onClick={() => setView('cuentas')}>← VOLVER</button>
          </div>
          <div className={s.historyGrid}>
            {cuentasCobradas.map(v => (
              <div key={v.id} className={s.historyCard}>
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>Mesa {v.mesa}</strong>
                  <div className={s.historyCardTime}>
                    Hora Pago: {new Date(v.hora_cierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={s.historyCardAmount}>${v.total}</div>
                  <span className={s.mesaBadge} style={{background:'#d1fae5', color:'#065f46'}}>PAGADA</span>
                </div>
              </div>
            ))}
            {!loading && cuentasCobradas.length === 0 && (
              <div className={s.emptyStateBox}>No hay registros de cuentas cobradas hoy.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};