// Archivo: src/modules/Admin/components/CajeroTab.jsx
import React, { useState, useEffect } from 'react';
import s from '../AdminPage.module.css'; // Homologado con los estilos del Admin
import { useCajeroTab } from '../../../hooks/useCajeroTab';
import { cajaService } from '../../../services/Caja.service';
import { ventasService } from '../../../services/Ventas.service';
import { hasPermission } from '../../../utils/checkPermiso';
import { formatCurrency } from '../../../utils/formatCurrency';

export const CajeroTab = ({ sucursalId, usuarioId }) => {
  const [activeSubTab, setActiveSubTab] = useState('cobrar'); 
  const [montoInicial, setMontoInicial] = useState('');
  const [movForm, setMovForm] = useState({ monto: '', motivo: '', tipo: 'salida' });
  const [resumenCaja, setResumenCaja] = useState({ efectivo: 0, tarjeta: 0, totalPropinas: 0 });
  const [historialHoy, setHistorialHoy] = useState([]);

  const {
    turnoActivo, cargandoTurno, abrirTurno, verificarTurno,
    cuentasPorCobrar, ventaSeleccionada, setVentaSeleccionada,
    metodoPago, setMetodoPago, propina, setPropina,
    pagadoCon, setPagadoCon, calculosCobro, abrirCobro, ejecutarCobro, cargarCuentas
  } = useCajeroTab(sucursalId, usuarioId);

  const { totalFinal, cambio, faltaDinero } = calculosCobro;

  const puedeGestionarCaja = hasPermission('ver_config'); 
  const puedeCobrar = hasPermission('ver_ventas');

  useEffect(() => {
    if (turnoActivo) {
      actualizarDatosFinancieros();
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
      alert("Movimiento registrado");
      setMovForm({ monto: '', motivo: '', tipo: 'salida' });
      actualizarDatosFinancieros();
    }
  };

  const handleCerrarCaja = async () => {
    if (!puedeGestionarCaja) return alert("❌ Solo el administrador puede realizar el corte.");

    const real = prompt("ARQUEO: ¿Cuánto efectivo físico hay en caja?");
    if (real !== null) {
      const esperado = (parseFloat(turnoActivo.monto_apertura) + resumenCaja.efectivo);
      await cajaService.cerrarTurno(turnoActivo.id, { esperado, real: parseFloat(real) });
      alert("Corte realizado con éxito.");
      verificarTurno();
    }
  };

  if (cargandoTurno) return <div className={s.tabContent}>Cargando estado de caja...</div>;

  // --- VISTA: APERTURA (BLOQUEO DE PANTALLA) ---
  if (!turnoActivo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className={s.adminCard} style={{ maxWidth: '450px', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏧</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-primary)', marginBottom: '10px' }}>Apertura de Turno</h2>
          {puedeGestionarCaja ? (
            <>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '30px', fontSize: '14px' }}>
                Ingresa el fondo inicial de efectivo para comenzar a recibir cobros.
              </p>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: 'var(--color-text-muted)', marginBottom: '10px' }}>FONDO INICIAL EN CAJA ($)</label>
                <input 
                  type="number" 
                  style={{ width: '100%', padding: '15px', borderRadius: 'var(--radius-ui)', border: '2px solid var(--color-primary)', fontSize: '1.5rem', textAlign: 'center', fontWeight: '900',boxSizing: 'border-box' }}
                  value={montoInicial} 
                  onChange={(e) => setMontoInicial(e.target.value)} 
                  autoFocus
                />
              </div>
              <button 
                className={s.btnLogout} 
                style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', width: '100%', padding: '15px', fontWeight: '800' }}
                disabled={!montoInicial || montoInicial < 0}
                onClick={() => abrirTurno(montoInicial)}
              >
                HABILITAR PUNTO DE VENTA
              </button>
            </>
          ) : (
            <div style={{ padding: '20px', backgroundColor: 'var(--color-bg-app)', borderRadius: 'var(--radius-ui)' }}>
              <p style={{ color: 'var(--color-danger)', fontWeight: '800', margin: '0 0 10px 0' }}>⚠️ TURNO CERRADO</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>Esperando a que un Administrador inicie las operaciones del día.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Navegación de Sub-pestañas Homologada */}
      <nav style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
        <button 
          className={`${s.navItem} ${activeSubTab === 'cobrar' ? s.activeNavItem : ''}`} 
          style={{ width: 'auto', padding: '8px 20px' }}
          onClick={() => setActiveSubTab('cobrar')}
        >
          🔔 CUENTAS PENDIENTES
        </button>
        {puedeGestionarCaja && (
          <>
            <button 
              className={`${s.navItem} ${activeSubTab === 'movimientos' ? s.activeNavItem : ''}`} 
              style={{ width: 'auto', padding: '8px 20px' }}
              onClick={() => setActiveSubTab('movimientos')}
            >
              💸 GASTOS / INGRESOS
            </button>
            <button 
              className={`${s.navItem} ${activeSubTab === 'corte' ? s.activeNavItem : ''}`} 
              style={{ width: 'auto', padding: '8px 20px' }}
              onClick={() => setActiveSubTab('corte')}
            >
              📊 CIERRE DE DÍA
            </button>
          </>
        )}
      </nav>

      {/* --- SECCIÓN 1: COBRAR (GRID DE MESAS) --- */}
      {activeSubTab === 'cobrar' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0 }}>Cuentas por Cobrar</h2>
            <button className={s.btnLogout} style={{ fontSize: '11px', padding: '5px 15px' }} onClick={cargarCuentas}>🔄 ACTUALIZAR LISTA</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
            {cuentasPorCobrar.map(v => (
              <div 
                key={v.id} 
                className={s.adminCard} 
                style={{ 
                  padding: '20px', borderLeft: '6px solid var(--color-warning)', cursor: 'pointer', transition: 'transform 0.1s',
                  display: 'flex', flexDirection: 'column', gap: '5px'
                }} 
                onClick={() => puedeCobrar ? abrirCobro(v) : alert("Sin permiso.")}
              >
                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--color-text-muted)' }}>MESERO: {v.mesero?.nombre?.toUpperCase()}</span>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-text-main)' }}>{v.mesa}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-primary)' }}>{formatCurrency(v.total)}</div>
              </div>
            ))}
            {cuentasPorCobrar.length === 0 && (
              <div className={s.adminCard} style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: 'var(--color-text-muted)' }}>
                No hay cuentas pendientes de cobro. ¡Salón al día!
              </div>
            )}
          </div>
        </>
      )}

      {/* --- SECCIÓN 2: MOVIMIENTOS --- */}
      {activeSubTab === 'movimientos' && puedeGestionarCaja && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className={s.adminCard} style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', textAlign: 'center' }}>Movimientos de Efectivo Manuales</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '8px' }}>TIPO DE OPERACIÓN</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button 
                    className={s.btnLogout} 
                    style={{ backgroundColor: movForm.tipo === 'entrada' ? 'var(--color-success)' : 'transparent', color: movForm.tipo === 'entrada' ? 'white' : 'inherit' }}
                    onClick={() => setMovForm({...movForm, tipo: 'entrada'})}
                  >➕ ENTRADA</button>
                  <button 
                    className={s.btnLogout} 
                    style={{ backgroundColor: movForm.tipo === 'salida' ? 'var(--color-danger)' : 'transparent', color: movForm.tipo === 'salida' ? 'white' : 'inherit' }}
                    onClick={() => setMovForm({...movForm, tipo: 'salida'})}
                  >➖ SALIDA</button>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>MONTO ($)</label>
                <input 
                  type="number" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', fontSize: '1.2rem', fontWeight: '700' }}
                  value={movForm.monto} onChange={e => setMovForm({...movForm, monto: e.target.value})} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>CONCEPTO / MOTIVO</label>
                <input 
                  type="text" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                  placeholder="Ej. Pago de refrescos / Cambio"
                  value={movForm.motivo} onChange={e => setMovForm({...movForm, motivo: e.target.value})} 
                />
              </div>

              <button 
                className={s.btnLogout} 
                style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '15px', fontWeight: '800' }}
                onClick={handleMovimientoManual}
              >
                REGISTRAR MOVIMIENTO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SECCIÓN 3: CORTE (LAYOUT 2 COLUMNAS) --- */}
      {activeSubTab === 'corte' && puedeGestionarCaja && (
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '25px', alignItems: 'start' }}>
          {/* LADO IZQUIERDO: BALANCE */}
          <div className={s.adminCard} style={{ padding: '25px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px' }}>Resumen del Turno</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--color-bg-app)', borderRadius: '4px' }}>
                <span style={{ fontSize: '13px' }}>Fondo de Apertura:</span>
                <span style={{ fontWeight: '700' }}>{formatCurrency(turnoActivo.monto_apertura)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
                <span style={{ fontSize: '13px' }}>Ventas Efectivo (+):</span>
                <span style={{ fontWeight: '700' }}>{formatCurrency(resumenCaja.efectivo)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
                <span style={{ fontSize: '13px' }}>Ventas Tarjeta:</span>
                <span style={{ fontWeight: '700' }}>{formatCurrency(resumenCaja.tarjeta)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', color: 'var(--color-primary)', fontWeight: '700' }}>
                <span style={{ fontSize: '13px' }}>Propinas Totales:</span>
                <span>{formatCurrency(resumenCaja.totalPropinas)}</span>
              </div>
              
              <div style={{ borderTop: '2px dashed var(--color-border)', marginTop: '10px', paddingTop: '15px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Efectivo Esperado en Caja</span>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--color-success)' }}>
                  {formatCurrency(parseFloat(turnoActivo.monto_apertura) + resumenCaja.efectivo)}
                </div>
              </div>

              <button 
                className={s.btnLogout} 
                style={{ backgroundColor: 'var(--color-danger)', color: 'white', border: 'none', padding: '15px', marginTop: '10px', fontWeight: '800' }}
                onClick={handleCerrarCaja}
              >
                REALIZAR CORTE FINAL
              </button>
            </div>
          </div>

          {/* LADO DERECHO: HISTORIAL */}
          <div className={s.adminCard} style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-muted)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>Historial de Cobros (Hoy)</h3>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '15px', fontSize: '11px' }}>MESA / HORA</th>
                    <th style={{ padding: '15px', fontSize: '11px' }}>MÉTODO</th>
                    <th style={{ padding: '15px', fontSize: '11px', textAlign: 'right' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {historialHoy.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '700' }}>Mesa {h.mesa}</div>
                        <small style={{ color: 'var(--color-text-muted)' }}>ID: #{h.id.toString().slice(-4)}</small>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)' }}>
                          {h.metodo_pago.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '800' }}>{formatCurrency(h.total)}</td>
                    </tr>
                  ))}
                  {historialHoy.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>Aún no hay cobros en este turno.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE COBRO (OVERLAY HOMOLOGADO) --- */}
      {ventaSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className={s.adminCard} style={{ width: '100%', maxWidth: '480px', padding: '30px', position: 'relative' }}>
            <button 
              style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', fontWeight: '900' }} 
              onClick={() => setVentaSeleccionada(null)}
            >✕</button>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '20px', textAlign: 'center' }}>Cobrar Mesa {ventaSeleccionada.mesa}</h2>
            
            <div style={{ padding: '25px', backgroundColor: 'var(--color-bg-app)', borderRadius: 'var(--radius-card)', border: '2px solid var(--color-primary)', textAlign: 'center', marginBottom: '25px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total a Pagar</span>
              <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--color-primary)' }}>{formatCurrency(totalFinal)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <button 
                className={s.btnLogout} 
                style={{ backgroundColor: metodoPago === 'efectivo' ? 'var(--color-primary)' : 'transparent', color: metodoPago === 'efectivo' ? 'white' : 'inherit' }} 
                onClick={() => setMetodoPago('efectivo')}
              >💵 EFECTIVO</button>
              <button 
                className={s.btnLogout} 
                style={{ backgroundColor: metodoPago === 'tarjeta' ? 'var(--color-primary)' : 'transparent', color: metodoPago === 'tarjeta' ? 'white' : 'inherit' }} 
                onClick={() => setMetodoPago('tarjeta')}
              >💳 TARJETA</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>PROPINA ($)</label>
                <input 
                  type="number" style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', fontWeight: '700' }}
                  value={propina} onChange={e => setPropina(e.target.value)} onFocus={e => e.target.select()} 
                />
              </div>
              {metodoPago === 'efectivo' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>RECIBIDO ($)</label>
                  <input 
                    type="number" 
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: `2px solid ${faltaDinero > 0 ? 'var(--color-danger)' : 'var(--color-success)'}`, fontWeight: '900', fontSize: '1.2rem' }}
                    value={pagadoCon} onChange={e => setPagadoCon(e.target.value)} autoFocus
                  />
                </div>
              )}
            </div>
            
            {metodoPago === 'efectivo' && (
              <div style={{ textAlign: 'center', padding: '15px', borderRadius: 'var(--radius-ui)', backgroundColor: 'var(--color-bg-muted)', marginBottom: '20px' }}>
                {faltaDinero > 0 ? (
                  <span style={{ color: 'var(--color-danger)', fontWeight: '900', fontSize: '1.1rem' }}>⚠️ FALTAN: {formatCurrency(faltaDinero)}</span>
                ) : (
                  <span style={{ color: 'var(--color-success)', fontWeight: '900', fontSize: '1.3rem' }}>CAMBIO: {formatCurrency(cambio)}</span>
                )}
              </div>
            )}

            <button 
              className={s.btnLogout} 
              style={{ width: '100%', backgroundColor: 'var(--color-text-main)', color: 'white', border: 'none', padding: '15px', fontSize: '1.1rem', fontWeight: '800' }}
              onClick={async () => {
                if(!puedeCobrar) return alert("Sin permiso");
                await ejecutarCobro();
                actualizarDatosFinancieros(); 
              }} 
              disabled={metodoPago === 'efectivo' && faltaDinero > 0}
            >
              CONSOLIDAR PAGO Y CERRAR CUENTA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};