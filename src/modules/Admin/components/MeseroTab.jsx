// Archivo: src/modules/Admin/components/MeseroTab.jsx
import React, { useState } from 'react';
import s from './MeseroTab.module.css';
import stylesAdmin from '../AdminPage.module.css'; // 🛡️ Importamos el sistema de botones unificado
import { useMeseroTab } from '../../../hooks/useMeseroTab';
import { hasPermission } from '../../../utils/checkPermiso'; // 🛡️ Importamos seguridad

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

  // 🛡️ SEGURIDAD INTERNA (RBAC)
  const puedeTomarOrdenes = hasPermission('crear_ventas');
  const puedePedirCuenta = hasPermission('editar_ventas');
  const puedeVerHistorial = hasPermission('ver_mesero');

  // Estado para controlar el carrito en dispositivos móviles/tablets pequeñas
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  return (
    <div className={s.posContainer}>
      
      {/* VISTA 0: MONITOR DE SALÓN (MESAS ACTIVAS) */}
      {view === 'cuentas' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className={s.headerRow} style={{ flexWrap: 'wrap', gap: '15px' }}>
            <h2 className={s.sectionTitle}>Salón</h2>
            <div className={s.flexCenterGap} style={{ flexWrap: 'wrap' }}>
              {/* Solo mostramos historial si tiene permiso */}
              {puedeVerHistorial && (
                <button className={`${stylesAdmin.btn} ${stylesAdmin.btnOutlineDanger}`} style={{ whiteSpace: 'nowrap' }} onClick={() => setView('historial')}>HISTORIAL</button>
              )}
              {/* Botón de nueva mesa condicionado por permiso */}
              {puedeTomarOrdenes && (
                <button className={`${stylesAdmin.btn} ${stylesAdmin.btnPrimary}`} style={{ whiteSpace: 'nowrap' }} onClick={() => { setMesaInput(''); setView('mesas'); }}>+ NUEVA MESA</button>
              )}
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
        <div className={s.mesaSelectorManual} style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '30px', textAlign: 'center' }}>¿Qué mesa es?</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (mesaInput && puedeTomarOrdenes) setView('menu'); }}>
            <input 
              className={s.mesaInput} 
              style={{ boxSizing: 'border-box', textAlign: 'center' }}
              value={mesaInput} 
              onChange={e => setMesaInput(e.target.value)} 
              placeholder="Ej. 15" 
              type="text"
              autoFocus 
              required 
              readOnly={!puedeTomarOrdenes}
            />
            {puedeTomarOrdenes ? (
              <button type="submit" className={`${stylesAdmin.btn} ${stylesAdmin.btnPrimary} ${stylesAdmin.btnFull}`} style={{ padding: '20px', fontSize: '1.2rem', marginTop: '15px' }}>Tomar Orden</button>
            ) : (
              <div style={{ color: 'var(--color-danger)', fontWeight: 'bold', textAlign: 'center', marginTop: '10px' }}>No tienes permiso para abrir mesas.</div>
            )}
            <button type="button" className={`${stylesAdmin.btn} ${stylesAdmin.btnOutlineDanger} ${stylesAdmin.btnFull}`} onClick={() => setView('cuentas')} style={{marginTop: '15px', padding: '15px', fontWeight: '700'}}>
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
            <div className={s.headerRow} style={{ marginBottom: '20px' }}>
              <button className={`${stylesAdmin.btn} ${stylesAdmin.btnOutlineDanger} ${s.btnBackNav}`} onClick={() => { setView('cuentas'); setIsCartExpanded(false); }}>← VOLVER</button>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ margin: 0, fontWeight: '900', color: 'var(--color-primary)' }}>MESA {mesaInput.toUpperCase()}</h3>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {categorias.map(cat => {
                const productosCat = productos.filter(p => p.categoria === cat.id);
                if (productosCat.length === 0) return null; 
                return (
                  <div key={cat.id} className={s.categoryBlock}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '15px' }}>{cat.nombre}</h4>
                    <div className={s.productGrid}>
                      {productosCat.map(p => {
                        const isLocked = ventaActiva?.estado === 'por_cobrar' || !puedeTomarOrdenes; // Bloqueamos si está por cobrar o si no tiene permiso
                        return (
                          <div 
                            key={p.id} 
                            className={`${s.productCard} ${isLocked ? s.productCardLocked : ''}`} 
                            style={{ padding: '15px', minHeight: '80px' }}
                            onClick={() => !isLocked && agregarAlCarrito(p)}
                          >
                            <div style={{fontWeight: '800', fontSize: '1.1rem'}}>{p.nombre}</div>
                            <div style={{color: 'var(--color-primary)', marginTop: '8px', fontWeight: '700'}}>${p.precio_venta}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
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
            
            <div className={s.cartItems} style={{ padding: '15px' }}>
              {/* CONSUMO PREVIO (CONGELADO) */}
              {ventaActiva?.ventas_detalle?.length > 0 && (
                <div style={{ marginBottom: '20px', background: 'var(--color-bg-muted)', padding: '15px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '10px', textAlign: 'center', textTransform: 'uppercase' }}>Consumo en Mesa</div>
                  {ventaActiva.ventas_detalle.map((det, idx) => {
                    const nombreProducto = productos.find(p => p.id === det.producto_id)?.nombre || `Prod. #${det.producto_id}`;
                    return (
                      <div key={idx} className={s.flexBetween} style={{ fontSize: '13px', marginBottom: '6px', color: 'var(--color-text-muted)' }}>
                        <span>{det.cantidad}x {nombreProducto}</span>
                        <span style={{ fontWeight: 700 }}>${det.subtotal}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PRODUCTOS NUEVOS */}
              {carrito.map((item) => (
                <div key={item.id} className={s.cartItem} style={{ marginBottom: '15px' }}>
                  <div className={s.flexBetween}>
                    <strong className={s.cartItemName}><span className={s.cartItemQty}>{item.cantidad}x</span> {item.nombre}</strong>
                    {/* Solo permitir borrar si puede tomar órdenes */}
                    {puedeTomarOrdenes && (
                      <button onClick={() => eliminarDelCarrito(item.id)} className={`${stylesAdmin.btn} ${stylesAdmin.btnOutlineDanger} ${stylesAdmin.btnSmall}`} style={{ padding: '4px 8px' }}>✕</button>
                    )}
                  </div>
                  <input 
                    placeholder="+ Notas para cocina..." 
                    className={s.inputNota} 
                    style={{ boxSizing: 'border-box', marginTop: '8px', padding: '10px' }}
                    value={item.notas} 
                    onChange={(e) => actualizarNota(item.id, e.target.value)} 
                    readOnly={!puedeTomarOrdenes}
                  />
                </div>
              ))}
              
              {carrito.length === 0 && !ventaActiva?.ventas_detalle?.length && (
                <div className={s.emptyCartText} style={{ padding: '40px 0' }}>La mesa está vacía.</div>
              )}
            </div>

            <div className={s.cartFooter} style={{ padding: '20px', borderTop: '2px solid var(--color-border)' }}>
              <div className={s.summaryBox} style={{ marginBottom: '15px' }}>
                <div className={s.flexBetween}>
                  <span className={s.summaryLabel} style={{ fontSize: '0.9rem' }}>Total Cuenta:</span>
                  <span className={s.summaryValue} style={{ fontSize: '1.5rem', fontWeight: '900' }}>
                    ${( (ventaActiva?.total || 0) + carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0) ).toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  className={`${stylesAdmin.btn} ${stylesAdmin.btnPrimary} ${stylesAdmin.btnFull}`} 
                  style={{ padding: '16px', fontWeight: '800' }}
                  onClick={handleEnviarOrden} 
                  disabled={loading || carrito.length === 0 || ventaActiva?.estado === 'por_cobrar' || !puedeTomarOrdenes}
                >
                  {!puedeTomarOrdenes ? 'SOLO LECTURA' : (loading ? 'ENVIANDO...' : 'ENVIAR A COCINA')}
                </button>
                
                {ventaActiva && (
                  <button 
                    className={`${stylesAdmin.btn} ${stylesAdmin.btnFull}`} 
                    style={{ 
                        background: ventaActiva.estado === 'por_cobrar' ? 'var(--color-warning)' : 'var(--color-danger)',
                        color: 'white',
                        padding: '16px',
                        fontWeight: '800',
                        border: 'none'
                    }} 
                    onClick={() => {
                      const msg = ventaActiva.estado === 'por_cobrar' ? '¿Deseas reimprimir el ticket de cuenta?' : '¿Enviar esta mesa a caja para cobrar?';
                      if (window.confirm(msg)) pedirCuenta(ventaActiva.id);
                    }}
                    disabled={loading || !puedePedirCuenta} // Bloqueamos por permiso de pedir cuenta
                  >
                    {!puedePedirCuenta ? 'BLOQUEADO' : (ventaActiva.estado === 'por_cobrar' ? '🖨️ REIMPRIMIR TICKET' : '🧾 PEDIR CUENTA')}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* VISTA 3: HISTORIAL DE CUENTAS COBRADAS */}
      {view === 'historial' && puedeVerHistorial && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className={s.headerRow}>
            <h2 className={s.sectionTitle}>Cuentas de Hoy</h2>
            <button className={`${stylesAdmin.btn} ${stylesAdmin.btnOutlineDanger}`} onClick={() => setView('cuentas')}>← VOLVER</button>
          </div>
          <div className={s.historyGrid}>
            {cuentasCobradas.map(v => (
              <div key={v.id} className={s.historyCard} style={{ padding: '20px' }}>
                <div>
                  <strong style={{ fontSize: '1.2rem' }}>Mesa {v.mesa}</strong>
                  <div className={s.historyCardTime}>
                    Hora Pago: {new Date(v.hora_cierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={s.historyCardAmount} style={{ fontSize: '1.4rem', fontWeight: '900' }}>${v.total}</div>
                  <span className={s.mesaBadge} style={{background:'#d1fae5', color:'#065f46', fontSize: '10px'}}>PAGADA</span>
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