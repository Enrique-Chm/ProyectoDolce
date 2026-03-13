// Archivo: src/modules/Admin/components/CajeroTab.jsx
import React, { useState, useEffect } from 'react';
import s from '../AdminPage.module.css'; 
import { useCajeroTab } from '../../../hooks/useCajeroTab';
import { cajaService } from '../../../services/Caja.service';
import { ventasService } from '../../../services/Ventas.service';
import { hasPermission } from '../../../utils/checkPermiso';
import { formatCurrency } from '../../../utils/formatCurrency';
import { IVA_FACTOR } from '../../../utils/taxConstants';

export const CajeroTab = ({ sucursalId, usuarioId }) => {
  const [activeSubTab, setActiveSubTab] = useState('cobrar'); 
  const [montoInicial, setMontoInicial] = useState('');
  const [movForm, setMovForm] = useState({ monto: '', motivo: '', tipo: 'salida' });
  const [resumenCaja, setResumenCaja] = useState({ efectivo: 0, tarjeta: 0 });
  const [historialHoy, setHistorialHoy] = useState([]);

  const {
    turnoActivo, cargandoTurno, abrirTurno, verificarTurno,
    cuentasPorCobrar, ventaSeleccionada, setVentaSeleccionada,
    metodoPago, setMetodoPago,
    pagadoCon, setPagadoCon, calculosCobro, abrirCobro, ejecutarCobro, cargarCuentas,
    historialTurnos, cargarHistorialTurnos 
  } = useCajeroTab(sucursalId, usuarioId);

  const { totalFinal, cambio, faltaDinero } = calculosCobro;

  const puedeGestionarCaja = hasPermission('ver_config'); 
  const puedeCobrar = hasPermission('ver_ventas');

  // Control de carga de datos según la pestaña activa
  useEffect(() => {
    if (turnoActivo) {
      actualizarDatosFinancieros();
    }
    
    if (activeSubTab === 'historialCortes' && puedeGestionarCaja) {
      cargarHistorialTurnos();
    }
  }, [turnoActivo, activeSubTab, cuentasPorCobrar]);

  const actualizarDatosFinancieros = async () => {
    const res = await ventasService.getResumenCaja(sucursalId);
    if (res.data) setResumenCaja(res.data);
    const hist = await ventasService.getHistorialCobradas(sucursalId);
    if (hist.data) setHistorialHoy(hist.data);
  };

  const handleMovimientoManual = async () => {
    if (!puedeGestionarCaja) return alert("❌ No tienes permiso.");
    if (!movForm.monto || !movForm.motivo) return alert("Faltan datos");
    
    const { error } = await cajaService.registrarMovimiento(
      turnoActivo.id, usuarioId, movForm.tipo, movForm.monto, movForm.motivo
    );
    if (!error) {
      alert("Movimiento registrado con éxito.");
      setMovForm({ monto: '', motivo: '', tipo: 'salida' });
      actualizarDatosFinancieros();
    }
  };

  const handleCerrarCaja = async () => {
    if (!puedeGestionarCaja) return alert("❌ Solo el administrador puede realizar el corte.");

    const real = prompt("ARQUEO DE CAJA: ¿Cuánto efectivo físico hay en caja?");
    if (real !== null && real !== "") {
      const montoReal = parseFloat(real);
      const esperado = (parseFloat(turnoActivo.monto_apertura) + resumenCaja.efectivo);
      
      if (window.confirm(`¿Confirmar cierre?\nEsperado: ${formatCurrency(esperado)}\nReal: ${formatCurrency(montoReal)}`)) {
        await cajaService.cerrarTurno(turnoActivo.id, { esperado, real: montoReal });
        alert("Turno cerrado con éxito.");
        verificarTurno();
      }
    }
  };

  if (cargandoTurno) return <div className={s.tabContent} style={{ textAlign: 'center', padding: '50px' }}>Iniciando caja...</div>;

  // --- VISTA: APERTURA (Si no hay turno) ---
  if (!turnoActivo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '20px' }}>
        <div className={s.adminCard} style={{ width: '100%', maxWidth: '450px', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🏧</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-primary)', marginBottom: '10px' }}>Apertura de Turno</h2>
          {puedeGestionarCaja ? (
            <>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '30px', fontSize: '14px' }}>Ingrese el fondo inicial para habilitar el punto de venta.</p>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: 'var(--color-text-muted)', marginBottom: '10px' }}>FONDO INICIAL ($)</label>
                <input 
                  type="number" 
                  className={s.adminInput}
                  style={{ fontSize: '1.8rem', textAlign: 'center', fontWeight: '900' }}
                  value={montoInicial} 
                  onChange={(e) => setMontoInicial(e.target.value)} 
                  autoFocus
                />
              </div>
              <button className={s.btnLogout} style={{ width: '100%', padding: '18px' }} onClick={() => abrirTurno(montoInicial)}>ABRIR TURNO</button>
            </>
          ) : (
            <div style={{ padding: '20px', backgroundColor: 'var(--color-bg-app)', borderRadius: 'var(--radius-ui)' }}>
              <p style={{ color: 'var(--color-danger)', fontWeight: '800' }}>⚠️ CAJA CERRADA</p>
              <p style={{ fontSize: '13px' }}>Solicite apertura al administrador.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Navegación Sub-pestañas */}
      <nav style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px', overflowX: 'auto' }}>
        <button className={`${s.navItem} ${activeSubTab === 'cobrar' ? s.activeNavItem : ''}`} onClick={() => setActiveSubTab('cobrar')}>🔔 PENDIENTES</button>
        {puedeGestionarCaja && (
          <>
            <button className={`${s.navItem} ${activeSubTab === 'movimientos' ? s.activeNavItem : ''}`} onClick={() => setActiveSubTab('movimientos')}>💸 GASTOS</button>
            <button className={`${s.navItem} ${activeSubTab === 'corte' ? s.activeNavItem : ''}`} onClick={() => setActiveSubTab('corte')}>📊 CIERRE DÍA</button>
            <button className={`${s.navItem} ${activeSubTab === 'historialCortes' ? s.activeNavItem : ''}`} onClick={() => setActiveSubTab('historialCortes')}>📜 HISTORIAL</button>
          </>
        )}
      </nav>

      {/* VISTA: COBRAR */}
      {activeSubTab === 'cobrar' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0 }}>Cuentas por Cobrar</h2>
            <button className={s.btnLogout} style={{ fontSize: '11px', padding: '8px 15px' }} onClick={() => cargarCuentas()}>🔄 REFRESCAR</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {cuentasPorCobrar.map(v => (
              <div key={v.id} className={s.adminCard} style={{ padding: '25px', borderLeft: '8px solid var(--color-warning)', cursor: 'pointer' }} onClick={() => puedeCobrar ? abrirCobro(v) : alert("Sin permiso")}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-text-muted)' }}>MESA {v.mesa}</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--color-primary)' }}>{formatCurrency(v.total)}</div>
                <small>{v.mesero?.nombre}</small>
              </div>
            ))}
            {cuentasPorCobrar.length === 0 && <div className={s.adminCard} style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px' }}>No hay cuentas pendientes.</div>}
          </div>
        </div>
      )}

      {/* VISTA: GASTOS */}
      {activeSubTab === 'movimientos' && puedeGestionarCaja && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className={s.adminCard} style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Movimientos Manuales</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button className={s.btnLogout} style={{ backgroundColor: movForm.tipo === 'entrada' ? 'var(--color-success)' : 'transparent', color: movForm.tipo === 'entrada' ? 'white' : 'inherit' }} onClick={() => setMovForm({...movForm, tipo: 'entrada'})}>ENTRADA</button>
                <button className={s.btnLogout} style={{ backgroundColor: movForm.tipo === 'salida' ? 'var(--color-danger)' : 'transparent', color: movForm.tipo === 'salida' ? 'white' : 'inherit' }} onClick={() => setMovForm({...movForm, tipo: 'salida'})}>SALIDA</button>
              </div>
              <input type="number" className={s.adminInput} value={movForm.monto} placeholder="Monto $" onChange={e => setMovForm({...movForm, monto: e.target.value})} />
              <input type="text" className={s.adminInput} placeholder="Concepto..." value={movForm.motivo} onChange={e => setMovForm({...movForm, motivo: e.target.value})} />
              <button className={s.btnLogout} style={{ backgroundColor: 'var(--color-text-main)', color: 'white' }} onClick={handleMovimientoManual}>REGISTRAR</button>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: CORTE */}
      {activeSubTab === 'corte' && puedeGestionarCaja && (
        <div className="admin-split-layout-sidebar">
          <div className={s.adminCard} style={{ padding: '25px' }}>
            <h3 style={{ marginBottom: '20px' }}>Resumen del Turno</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className={s.flexBetween}><span>Fondo Inicial:</span><strong>{formatCurrency(turnoActivo.monto_apertura)}</strong></div>
              <div className={s.flexBetween}><span>Efectivo Ventas:</span><strong>{formatCurrency(resumenCaja.efectivo)}</strong></div>
              <div style={{ borderTop: '2px dashed var(--color-border)', textAlign: 'center', paddingTop: '20px' }}>
                <small>ESPERADO EN CAJA</small>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-success)' }}>{formatCurrency(parseFloat(turnoActivo.monto_apertura) + resumenCaja.efectivo)}</div>
              </div>
              <button className={s.btnLogout} style={{ backgroundColor: 'var(--color-danger)', color: 'white', marginTop: '10px' }} onClick={handleCerrarCaja}>CERRAR TURNO</button>
            </div>
          </div>
          <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto' }}>
             <div style={{ padding: '15px', fontWeight: '800' }}>Cierres de hoy</div>
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ backgroundColor: 'var(--color-bg-muted)' }}><th style={{ padding: '12px' }}>MESA</th><th style={{ padding: '12px', textAlign: 'right' }}>TOTAL</th></tr></thead>
                <tbody>
                  {historialHoy.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                      <td style={{ padding: '12px' }}>Mesa {h.mesa}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800' }}>{formatCurrency(h.total)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {/* VISTA: HISTORIAL (EL NUEVO) */}
      {activeSubTab === 'historialCortes' && puedeGestionarCaja && (
        <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Historial de Cortes</h3>
            <button className={s.btnLogout} style={{ fontSize: '11px' }} onClick={cargarHistorialTurnos}>🔄 ACTUALIZAR</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead style={{ backgroundColor: 'var(--color-bg-muted)' }}>
              <tr>
                <th style={{ padding: '15px', fontSize: '11px' }}>FECHA CIERRE</th>
                <th style={{ padding: '15px', fontSize: '11px' }}>CAJERO</th>
                <th style={{ padding: '15px', fontSize: '11px', textAlign: 'right' }}>ESPERADO</th>
                <th style={{ padding: '15px', fontSize: '11px', textAlign: 'right' }}>REAL</th>
                <th style={{ padding: '15px', fontSize: '11px', textAlign: 'right' }}>DIFERENCIA</th>
              </tr>
            </thead>
            <tbody>
              {historialTurnos.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No hay registros.</td></tr>
              ) : (
                historialTurnos.map(turno => {
                  const dif = parseFloat(turno.diferencia) || 0;
                  const colorDif = dif > 0 ? 'var(--color-success)' : dif < 0 ? 'var(--color-danger)' : 'inherit';
                  return (
                    <tr key={turno.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                      <td style={{ padding: '15px' }}>{new Date(turno.fecha_cierre).toLocaleString()}</td>
                      <td style={{ padding: '15px' }}>{turno.usuarios_internos?.nombre || 'SISTEMA'}</td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>{formatCurrency(turno.monto_cierre_esperado)}</td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '800' }}>{formatCurrency(turno.monto_cierre_real)}</td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '900', color: colorDif }}>{dif === 0 ? 'CUADRADO' : formatCurrency(dif)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE COBRO */}
      {ventaSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
          <div className={s.adminCard} style={{ width: '100%', maxWidth: '450px', padding: '30px', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setVentaSeleccionada(null)}>✕</button>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Mesa {ventaSeleccionada.mesa}</h2>
            
            <div style={{ padding: '20px', backgroundColor: 'var(--color-bg-app)', border: '2px solid var(--color-primary)', textAlign: 'center', borderRadius: 'var(--radius-card)' }}>
              <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--color-primary)' }}>{formatCurrency(totalFinal)}</div>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className={s.flexBetween} style={{ fontSize: '12px' }}><span>Base:</span><span>{formatCurrency(totalFinal / IVA_FACTOR)}</span></div>
                <div className={s.flexBetween} style={{ fontSize: '12px' }}><span>IVA (16%):</span><span>{formatCurrency(totalFinal - (totalFinal / IVA_FACTOR))}</span></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '20px 0' }}>
              <button className={s.btnLogout} style={{ padding: '15px', backgroundColor: metodoPago === 'efectivo' ? 'var(--color-primary)' : 'transparent', color: metodoPago === 'efectivo' ? 'white' : 'inherit' }} onClick={() => setMetodoPago('efectivo')}>EFECTIVO</button>
              <button className={s.btnLogout} style={{ padding: '15px', backgroundColor: metodoPago === 'tarjeta' ? 'var(--color-primary)' : 'transparent', color: metodoPago === 'tarjeta' ? 'white' : 'inherit' }} onClick={() => setMetodoPago('tarjeta')}>TARJETA</button>
            </div>

            {metodoPago === 'efectivo' && (
              <>
                <input 
                  type="number" 
                  className={s.adminInput}
                  style={{ fontSize: '1.5rem', textAlign: 'center' }} 
                  value={pagadoCon} 
                  placeholder="Recibido $" 
                  onChange={e => setPagadoCon(e.target.value)} 
                  autoFocus 
                />
                <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'var(--color-bg-muted)', margin: '15px 0' }}>
                  {faltaDinero > 0 ? <span style={{ color: 'var(--color-danger)', fontWeight: '900' }}>RESTAN: {formatCurrency(faltaDinero)}</span> : <span style={{ color: 'var(--color-success)', fontWeight: '900' }}>CAMBIO: {formatCurrency(cambio)}</span>}
                </div>
              </>
            )}

            <button className={s.btnLogout} style={{ width: '100%', backgroundColor: 'var(--color-text-main)', color: 'white', padding: '18px' }} onClick={async () => { await ejecutarCobro(); actualizarDatosFinancieros(); }} disabled={metodoPago === 'efectivo' && (faltaDinero > 0 || !pagadoCon)}>FINALIZAR PAGO</button>
          </div>
        </div>
      )}
    </div>
  );
};