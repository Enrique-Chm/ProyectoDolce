// Archivo: src/modules/Admin/components/CajeroTab.jsx
import React, { useState, useEffect } from 'react';
import s from './MeseroTab.module.css'; 
import { useCajeroTab } from '../../../hooks/useCajeroTab';
import { cajaService } from '../../../services/Caja.service';
import { ventasService } from '../../../services/Ventas.service';
import { hasPermission } from '../../../utils/checkPermiso'; // Importamos la seguridad

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

  // Definición de permisos específicos para este módulo
  const puedeGestionarCaja = hasPermission('ver_config'); // Permiso para abrir/cerrar/gastos
  const puedeCobrar = hasPermission('ver_ventas'); // Permiso para procesar pagos

  // Sincronización de datos financieros
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
    // 🛡️ Seguridad: Verificar permiso antes de registrar gasto
    if (!puedeGestionarCaja) return alert("❌ No tienes permiso para registrar movimientos de caja.");
    
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
    // 🛡️ Seguridad: Verificar permiso antes de cerrar el turno
    if (!puedeGestionarCaja) return alert("❌ Solo el administrador puede realizar el corte.");

    const real = prompt("ARQUEO: ¿Cuánto efectivo físico hay en caja?");
    if (real !== null) {
      const esperado = (parseFloat(turnoActivo.monto_apertura) + resumenCaja.efectivo);
      await cajaService.cerrarTurno(turnoActivo.id, { esperado, real: parseFloat(real) });
      alert("Corte realizado con éxito.");
      verificarTurno();
    }
  };

  if (cargandoTurno) return <div className={s.emptyStateBox}>Cargando estado de caja...</div>;

  // --- PANTALLA DE BLOQUEO: APERTURA ---
  if (!turnoActivo) {
    return (
      <div className={s.modalOverlay}>
        <div className={s.modalCierre} style={{ textAlign: 'center' }}>
          <h2 className={s.sectionTitle}>Apertura de Turno</h2>
          {puedeGestionarCaja ? (
            <>
              <p className={s.textMuted}>Ingrese el fondo inicial para habilitar las ventas.</p>
              <div style={{ margin: '30px 0' }}>
                <label className={s.formLabel}>Monto de Apertura ($)</label>
                <input 
                  type="number" 
                  className={s.input} 
                  style={{ fontSize: '2rem', textAlign: 'center', height: '80px' }}
                  value={montoInicial} 
                  onChange={(e) => setMontoInicial(e.target.value)} 
                  autoFocus
                />
              </div>
              <button 
                className={s.btnOrder} 
                disabled={!montoInicial || montoInicial < 0}
                onClick={() => abrirTurno(montoInicial)}
              >
                INICIAR OPERACIONES
              </button>
            </>
          ) : (
            <div className={s.emptyStateBox}>
              <p style={{ color: 'var(--danger)' }}>⚠️ Turno Cerrado.</p>
              <p className={s.textMuted}>Esperando a que un Administrador inicie las operaciones.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={s.posContainer}>
      
      <nav className={s.tabNav}>
        <button className={activeSubTab === 'cobrar' ? s.btnPrimary : s.btnCancel} style={{flex:1}} onClick={() => setActiveSubTab('cobrar')}>🔔 COBRAR</button>
        {/* Solo mostrar botones de gestión si tiene el permiso */}
        {puedeGestionarCaja && (
          <>
            <button className={activeSubTab === 'movimientos' ? s.btnPrimary : s.btnCancel} style={{flex:1}} onClick={() => setActiveSubTab('movimientos')}>💸 GASTOS/INGRESOS</button>
            <button className={activeSubTab === 'corte' ? s.btnPrimary : s.btnCancel} style={{flex:1}} onClick={() => setActiveSubTab('corte')}>📊 CORTE FINAL</button>
          </>
        )}
      </nav>

      {/* --- SECCIÓN 1: COBRAR --- */}
      {activeSubTab === 'cobrar' && (
        <>
          <div className={s.headerRow}>
            <h2 className={s.sectionTitle}>Cuentas Pendientes</h2>
            <button className={s.btnCancel} onClick={cargarCuentas}>🔄 Actualizar</button>
          </div>
          <div className={s.productGrid}>
            {cuentasPorCobrar.map(v => (
              <div key={v.id} className={s.mesaCard} style={{ borderLeft: '6px solid var(--warning)' }} 
                   onClick={() => puedeCobrar ? abrirCobro(v) : alert("No tienes permiso para cobrar.")}>
                <span className={s.textMuted} style={{ fontSize:'10px', fontWeight: 800 }}>MESERO: {v.mesero?.nombre}</span>
                <h3 className={s.modalTotalValue} style={{ fontSize:'2.2rem', margin:'5px 0' }}>{v.mesa}</h3>
                <div style={{ fontWeight: 900, fontSize: '1.4rem' }}>${v.total}</div>
              </div>
            ))}
            {cuentasPorCobrar.length === 0 && <div className={s.emptyStateBox}>Sin cuentas por cobrar.</div>}
          </div>
        </>
      )}

      {/* --- SECCIÓN 2: MOVIMIENTOS --- */}
      {activeSubTab === 'movimientos' && puedeGestionarCaja && (
        <div className={s.modalCierre} style={{ maxWidth: '600px', margin: '0 auto', border: '1px solid var(--border-light)' }}>
          <h2 className={s.sectionTitle}>Movimientos de Efectivo</h2>
          <div style={{ marginTop: '20px' }}>
            <label className={s.formLabel}>Tipo de Movimiento</label>
            <div className={s.paymentGrid}>
              <button className={movForm.tipo === 'entrada' ? s.btnPrimary : s.btnCancel} onClick={() => setMovForm({...movForm, tipo: 'entrada'})}>➕ ENTRADA</button>
              <button className={movForm.tipo === 'salida' ? s.btnPrimary : s.btnCancel} onClick={() => setMovForm({...movForm, tipo: 'salida'})}>➖ SALIDA</button>
            </div>
            <input type="number" className={s.input} placeholder="Monto $" value={movForm.monto} onChange={e => setMovForm({...movForm, monto: e.target.value})} />
            <input type="text" className={s.input} placeholder="Motivo o Concepto" value={movForm.motivo} onChange={e => setMovForm({...movForm, motivo: e.target.value})} />
            <button className={s.btnOrder} style={{ marginTop: '10px' }} onClick={handleMovimientoManual}>REGISTRAR EN CAJA</button>
          </div>
        </div>
      )}

      {/* --- SECCIÓN 3: CORTE --- */}
      {activeSubTab === 'corte' && puedeGestionarCaja && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className={s.modalCierre} style={{ border: '1px solid var(--border-light)' }}>
            <h3 className={s.sectionTitle}>Balance del Turno</h3>
            <div style={{ margin: '20px 0', display: 'grid', gap: '10px' }}>
              <div className={s.changeRow}><span>Fondo Inicial:</span> <strong>${turnoActivo.monto_apertura}</strong></div>
              <div className={s.changeRow}><span>Ventas Efectivo:</span> <strong>${resumenCaja.efectivo}</strong></div>
              <div className={s.changeRow}><span>Ventas Tarjeta:</span> <strong>${resumenCaja.tarjeta}</strong></div>
              <div className={s.changeRow} style={{ borderTop: '2px dashed var(--border-light)' }}>
                <span style={{ fontWeight: 800 }}>EFECTIVO EN CAJA:</span>
                <span className={s.modalTotalValue} style={{ fontSize: '1.8rem' }}>
                  ${(parseFloat(turnoActivo.monto_apertura) + resumenCaja.efectivo).toFixed(2)}
                </span>
              </div>
            </div>
            <button className={s.btnOrder} style={{ background: 'var(--danger)' }} onClick={handleCerrarCaja}>CERRAR TURNO Y CORTE</button>
          </div>

          <div className={s.modalCierre} style={{ border: '1px solid var(--border-light)', padding: '25px' }}>
            <h3 className={s.sectionTitle}>Historial Cobros Hoy</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '15px' }}>
              {historialHoy.length === 0 && <p className={s.textMuted}>Aún no hay cobros registrados.</p>}
              {historialHoy.map(h => (
                <div key={h.id} className={s.changeRow} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <span style={{ fontWeight: 800 }}>Mesa {h.mesa}</span><br/>
                    <small className={s.textMuted}>{h.metodo_pago.toUpperCase()}</small>
                  </div>
                  <strong style={{ fontSize: '1.2rem' }}>${h.total}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COBRO */}
      {ventaSeleccionada && (
        <div className={s.modalOverlay}>
          <div className={s.modalCierre}>
            <button className={s.btnCloseModal} onClick={() => setVentaSeleccionada(null)}>✕</button>
            <h2 className={s.sectionTitle}>Mesa {ventaSeleccionada.mesa}</h2>
            <div className={s.modalTotalBox}>
              <span className={s.modalTotalText}>TOTAL A PAGAR</span>
              <div className={s.modalTotalValue}>${totalFinal.toFixed(2)}</div>
            </div>
            <div className={s.paymentGrid}>
              <button className={metodoPago === 'efectivo' ? s.btnPrimary : s.btnCancel} onClick={() => setMetodoPago('efectivo')}>💵 EFECTIVO</button>
              <button className={metodoPago === 'tarjeta' ? s.btnPrimary : s.btnCancel} onClick={() => setMetodoPago('tarjeta')}>💳 TARJETA</button>
            </div>
            <label className={s.formLabel}>Propina Voluntaria ($)</label>
            <input type="number" className={s.input} value={propina} onChange={e => setPropina(e.target.value)} onFocus={e => e.target.select()} />
            
            {metodoPago === 'efectivo' && (
              <div className={s.cashBox}>
                <label className={s.formLabel}>Recibí en efectivo:</label>
                <input type="number" className={`${s.input} ${faltaDinero > 0 ? s.inputError : s.inputSuccess}`} 
                       value={pagadoCon} onChange={e => setPagadoCon(e.target.value)} autoFocus />
                <div className={s.changeRow}>
                  {faltaDinero > 0 ? (
                    <span style={{ color: 'var(--danger)', fontWeight: 900 }}>⚠️ FALTAN: -${faltaDinero.toFixed(2)}</span>
                  ) : (
                    <span style={{ color: 'var(--success)', fontWeight: 900 }}>CAMBIO: ${cambio.toFixed(2)}</span>
                  )}
                </div>
              </div>
            )}
            <div className={s.paymentGrid} style={{ marginTop: '25px' }}>
              <button className={s.btnCancel} onClick={() => setVentaSeleccionada(null)}>CANCELAR</button>
              <button className={s.btnOrder} onClick={async () => {
                if(!puedeCobrar) return alert("Sin permiso");
                await ejecutarCobro();
                actualizarDatosFinancieros(); 
              }} disabled={metodoPago === 'efectivo' && faltaDinero > 0}>FINALIZAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};