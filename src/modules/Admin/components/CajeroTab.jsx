import React, { useState } from 'react';
import { useCaja } from '../../../hooks/useCajeroTab';
import { formatCurrency } from '../../../utils/formatCurrency';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Receipt, 
  LogOut, 
  PlusCircle,
  Calculator,
  User,
  Clock
} from 'lucide-react';
import styles from './MeseroTab.module.css'; 

const CajeroTab = ({ sucursalId }) => {
  const { 
    sesion, 
    cuentasPendientes, 
    resumen, 
    movimientos, 
    loading, 
    acciones 
  } = useCaja(sucursalId);

  const [montoApertura, setMontoApertura] = useState('');
  const [modalPago, setModalPago] = useState(null);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  
  // Estados para formularios
  const [datosPago, setDatosPago] = useState({ metodo: 'efectivo', propina: 0, pagadoCon: 0 });
  const [datosMov, setDatosMov] = useState({ tipo: 'egreso', monto: '', descripcion: '' });
  const [montoCierreReal, setMontoCierreReal] = useState('');

  if (loading) return <div className={styles.loader}>Cargando caja...</div>;

  // --- VISTA: APERTURA DE CAJA ---
  if (!sesion) {
    return (
      <div className={styles.aperturaContainer}>
        <div className={styles.aperturaCard}>
          <Wallet size={48} />
          <h2>Apertura de Caja</h2>
          <p>Ingrese el monto inicial en efectivo para comenzar el turno.</p>
          <input
            type="number"
            placeholder="Monto inicial (ej. 1000)"
            value={montoApertura}
            onChange={(e) => setMontoApertura(e.target.value)}
          />
          <button 
            onClick={() => acciones.abrirCaja(montoApertura)}
            disabled={!montoApertura}
          >
            Abrir Turno
          </button>
        </div>
      </div>
    );
  }

  // --- LÓGICA DE COBRO ---
  const handleCobrar = async () => {
    const totalVenta = parseFloat(modalPago.total) || 0;
    const propina = parseFloat(datosPago.propina) || 0;
    const totalFinal = totalVenta + propina;

    const success = await acciones.cobrarCuenta(modalPago.id, {
      metodo_pago: datosPago.metodo,
      propina: propina,
      totalFinal: totalFinal,
      pagado_con: parseFloat(datosPago.pagadoCon) || 0,
      cambio: (parseFloat(datosPago.pagadoCon) || 0) - totalFinal
    });
    
    if (success) setModalPago(null);
  };

  return (
    <div className={styles.cajeroGrid}>
      
      {/* SECCIÓN IZQUIERDA: CUENTAS POR COBRAR */}
      <div className={styles.panelCuentas}>
        <div className={styles.panelHeader}>
          <h3><Receipt size={20} /> Cuentas por Cobrar</h3>
          <span className={styles.badge}>{cuentasPendientes.length} Pendientes</span>
        </div>
        
        <div className={styles.listaCuentas}>
          {cuentasPendientes.length === 0 ? (
            <p className={styles.emptyMsg}>No hay mesas pendientes de cobro.</p>
          ) : (
            cuentasPendientes.map(venta => (
              <div key={venta.id} className={styles.ventaCard}>
                <div className={styles.ventaInfo}>
                  <strong>Mesa {venta.mesa} {venta.folio && `- ${venta.folio}`}</strong>
                  <span>Atendió: {venta.mesero?.nombre}</span>
                  <span className={styles.montoTotal}>{formatCurrency(venta.total)}</span>
                </div>
                <button onClick={() => {
                  setModalPago(venta);
                  setDatosPago({ ...datosPago, pagadoCon: venta.total, propina: 0 });
                }}>
                  Cobrar
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECCIÓN DERECHA: RESUMEN Y ACCIONES */}
      <div className={styles.panelControl}>
        
        <div className={styles.resumenCard}>
          <h4>Estado del Turno</h4>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span>Efectivo en Ventas</span>
              <strong>{formatCurrency(resumen.efectivo)}</strong>
            </div>
            <div className={styles.statItem}>
              <span>Tarjeta</span>
              <strong>{formatCurrency(resumen.tarjeta)}</strong>
            </div>
            <div className={styles.statItem}>
              <span>Gastos/Egresos</span>
              <strong className={styles.egresoText}>
                -{formatCurrency(resumen.detalleArqueo?.salidasManuales || 0)}
              </strong>
            </div>
            <div className={styles.statTotal}>
              <span>EFECTIVO ESPERADO</span>
              <strong className={styles.totalText}>{formatCurrency(resumen.montoEsperado)}</strong>
            </div>
          </div>
        </div>

        <div className={styles.accionesCaja}>
          <button className={styles.btnMovimiento} onClick={() => setModalMovimiento(true)}>
            <PlusCircle size={18} /> Registrar Gasto/Ingreso
          </button>
          <button className={styles.btnCerrar} onClick={() => setModalCierre(true)}>
            <LogOut size={18} /> Cerrar Turno
          </button>
        </div>

        {/* HISTORIAL RECIENTE */}
        <div className={styles.miniHistorial}>
          <h5>Últimos Movimientos</h5>
          {movimientos.slice(0, 5).map(m => (
            <div key={m.id} className={styles.movItem}>
              {m.tipo === 'egreso' ? <ArrowDownCircle size={14} color="red" /> : <ArrowUpCircle size={14} color="green" />}
              <span>{m.descripcion}</span>
              <strong>{formatCurrency(m.monto)}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODAL DE PAGO --- */}
      {modalPago && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Cobrar Mesa {modalPago.mesa}</h3>
            <div className={styles.formGroup}>
              <label>Método de Pago</label>
              <select 
                value={datosPago.metodo} 
                onChange={e => setDatosPago({...datosPago, metodo: e.target.value})}
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Propina</label>
              <input 
                type="number" 
                value={datosPago.propina}
                onChange={e => setDatosPago({...datosPago, propina: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className={styles.pagoResumen}>
              <p>Subtotal: {formatCurrency(modalPago.total)}</p>
              <h4>Total a Cobrar: {formatCurrency(parseFloat(modalPago.total) + parseFloat(datosPago.propina || 0))}</h4>
            </div>
            {datosPago.metodo === 'efectivo' && (
              <div className={styles.formGroup}>
                <label>Pagó con:</label>
                <input 
                  type="number" 
                  value={datosPago.pagadoCon}
                  onChange={e => setDatosPago({...datosPago, pagadoCon: parseFloat(e.target.value) || 0})}
                />
                <p className={styles.cambio}>
                  Cambio: {formatCurrency(parseFloat(datosPago.pagadoCon || 0) - (parseFloat(modalPago.total) + parseFloat(datosPago.propina || 0)))}
                </p>
              </div>
            )}
            <div className={styles.modalButtons}>
              <button onClick={() => setModalPago(null)}>Cancelar</button>
              <button className={styles.btnConfirmar} onClick={handleCobrar}>Finalizar Pago</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL MOVIMIENTOS --- */}
      {modalMovimiento && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Registrar Movimiento</h3>
            <select 
              value={datosMov.tipo} 
              onChange={e => setDatosMov({...datosMov, tipo: e.target.value})}
            >
              <option value="egreso">Salida (Gasto/Pago)</option>
              <option value="ingreso">Entrada (Refuerzo/Aporte)</option>
            </select>
            <input 
              type="number" 
              placeholder="Monto" 
              value={datosMov.monto}
              onChange={e => setDatosMov({...datosMov, monto: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Descripción (ej. Pago de gas)" 
              value={datosMov.descripcion}
              onChange={e => setDatosMov({...datosMov, descripcion: e.target.value})}
            />
            <div className={styles.modalButtons}>
              <button onClick={() => setModalMovimiento(false)}>Cancelar</button>
              <button onClick={async () => {
                await acciones.registrarMovimientoManual(datosMov.tipo, datosMov.monto, datosMov.descripcion);
                setModalMovimiento(false);
                setDatosMov({ tipo: 'egreso', monto: '', descripcion: '' });
              }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CIERRE --- */}
      {modalCierre && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Cierre de Caja</h3>
            <p>Efectivo esperado en caja: <strong>{formatCurrency(resumen.montoEsperado)}</strong></p>
            <div className={styles.formGroup}>
              <label>Monto contado físicamente:</label>
              <input 
                type="number" 
                value={montoCierreReal}
                onChange={e => setMontoCierreReal(e.target.value)}
                placeholder="0.00"
              />
            </div>
            {montoCierreReal && (
              <p className={parseFloat(montoCierreReal) - resumen.montoEsperado < 0 ? styles.faltante : styles.sobrante}>
                Diferencia: {formatCurrency(parseFloat(montoCierreReal) - resumen.montoEsperado)}
              </p>
            )}
            <div className={styles.modalButtons}>
              <button onClick={() => setModalCierre(false)}>Volver</button>
              <button className={styles.btnCerrarFinal} onClick={async () => {
                const res = await acciones.cerrarCaja(montoCierreReal, "Cierre de turno estándar");
                if (res.success) setModalCierre(false);
              }}>Confirmar Cierre de Turno</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CajeroTab;