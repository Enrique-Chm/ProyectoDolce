import React, { useState, useEffect } from 'react';
import { useCajeroTab } from '../../../hooks/useCajeroTab';
import { VentasService } from '../../../services/Ventas.service';
import stylesAdmin from '../AdminPage.module.css';
import stylesPOS from './MeseroTab.module.css';
import { formatCurrency } from '../../../utils/formatCurrency';
import Swal from 'sweetalert2';

const CajeroTab = ({ usuarioId }) => {
    // 1. Estados de Navegación y Formularios
    const [activeSubTab, setActiveSubTab] = useState('COBRAR');
    const [cuentasPendientes, setCuentasPendientes] = useState([]);
    
    // Estado para el tipo de flujo seleccionado (Filtro Dinámico)
    const [tipoSeleccionado, setTipoSeleccionado] = useState('');
    const [movData, setMovData] = useState({ motivoId: '', monto: '', comentario: '' });
    
    const [montoArqueo, setMontoArqueo] = useState('');
    const [montoApertura, setMontoApertura] = useState('');

    // 2. Hook de Lógica (Actualizado con tiposDisponibles)
    const { 
        sesionActiva, 
        loading, 
        movimientos, 
        historial, 
        tiposDisponibles,
        getMotivosPorTipo, 
        abrirTurno, 
        cerrarTurno, 
        registrarMovimientoEfectivo 
    } = useCajeroTab(usuarioId);

    // 3. Carga de Cuentas Pendientes (Meseros)
    const cargarCuentas = async () => {
        try {
            const { data } = await VentasService.getVentasPendientes();
            setCuentasPendientes(data || []);
        } catch (error) {
            console.error("Error al obtener cuentas:", error);
        }
    };

    useEffect(() => {
        if (sesionActiva) {
            cargarCuentas();
            const interval = setInterval(cargarCuentas, 30000);
            return () => clearInterval(interval);
        }
    }, [sesionActiva]);

    // 4. Lógica de Cobro Directo
    const manejarCobro = async (venta) => {
        const { value: metodo } = await Swal.fire({
            title: `Cobrar Mesa ${venta.mesa || 'S/N'}`,
            text: `Monto total: ${formatCurrency(venta.total)}`,
            input: 'select',
            inputOptions: {
                'efectivo': 'Efectivo',
                'tarjeta': 'Tarjeta',
                'transferencia': 'Transferencia'
            },
            inputPlaceholder: 'Método de pago',
            showCancelButton: true,
            confirmButtonText: 'Finalizar Pago',
            confirmButtonColor: '#10b981'
        });

        if (metodo) {
            const { error } = await VentasService.finalizarVenta(venta.id, {
                estado: 'pagado',
                metodo_pago: metodo,
                cajero_id: usuarioId,
                turno_id: sesionActiva.id
            });

            if (!error) {
                Swal.fire('Venta Cerrada', 'El pago se registró correctamente', 'success');
                cargarCuentas();
            }
        }
    };

    // 5. Lógica para Guardar Movimiento con Catálogo Filtrado
    const guardarMovimiento = async () => {
        const motivosFiltrados = getMotivosPorTipo(tipoSeleccionado);
        const motivo = motivosFiltrados.find(m => m.id === parseInt(movData.motivoId));
        
        if (!motivo || !movData.monto) {
            return Swal.fire('Error', 'Selecciona un motivo e ingresa el monto', 'error');
        }

        const descFinal = movData.comentario 
            ? `${motivo.nombre_motivo}: ${movData.comentario}` 
            : motivo.nombre_motivo;

        await registrarMovimientoEfectivo(tipoSeleccionado, movData.monto, descFinal);
        
        // Limpiar formulario y resetear filtro
        setMovData({ motivoId: '', monto: '', comentario: '' });
        setTipoSeleccionado('');
    };

    if (loading) return <div className={stylesPOS.emptyStateBox}>Sincronizando caja...</div>;

    return (
        <div className={stylesAdmin.mainContent}>
            <div className={stylesAdmin.tabContent}>
                
                <h2 className={stylesAdmin.pageTitle} style={{ marginBottom: '20px' }}>Gestión de Caja</h2>

                {/* --- NAVEGACIÓN HORIZONTAL ESTILO GESTIÓN DE CAPITAL HUMANO --- */}
                <div style={{ 
                    display: 'flex', 
                    gap: '20px', 
                    borderBottom: '1px solid var(--color-border)', 
                    marginBottom: '30px',
                    paddingBottom: '10px'
                }}>
                    {['COBRAR', 'MOVIMIENTOS', 'TURNO Y ARQUEO', 'HISTORIAL'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveSubTab(tab)}
                            style={{
                                background: activeSubTab === tab ? 'var(--color-primary)' : 'transparent',
                                color: activeSubTab === tab ? 'white' : 'var(--color-text-muted)',
                                border: 'none',
                                padding: '8px 18px',
                                borderRadius: 'var(--radius-ui)',
                                fontWeight: '800',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textTransform: 'uppercase'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* --- VISTA: COBRAR --- */}
                {activeSubTab === 'COBRAR' && (
                    <div className={stylesAdmin.adminCard}>
                        {!sesionActiva ? (
                            <div className={stylesPOS.emptyStateBox}>Debes abrir un turno para cobrar cuentas.</div>
                        ) : (
                            <div className={stylesPOS.productGrid}>
                                {cuentasPendientes.length === 0 ? (
                                    <p className={stylesPOS.emptyCartText}>No hay cuentas pendientes.</p>
                                ) : (
                                    cuentasPendientes.map(venta => (
                                        <div key={venta.id} className={stylesPOS.mesaCard} onClick={() => manejarCobro(venta)} style={{ borderLeft: '5px solid var(--color-primary)' }}>
                                            <div className={stylesPOS.flexBetween}>
                                                <span className={stylesPOS.mesaName}>Mesa {venta.mesa || 'S/N'}</span>
                                                <span className={stylesPOS.mesaBadgeCobrar}>Pendiente</span>
                                            </div>
                                            <div className={stylesPOS.mesaTotal}>{formatCurrency(venta.total)}</div>
                                            <button className={stylesPOS.btnOrder} style={{ marginTop: '10px' }}>COBRAR</button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* --- VISTA: MOVIMIENTOS REORGANIZADA CON FILTROS DINÁMICOS --- */}
                {activeSubTab === 'MOVIMIENTOS' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '25px' }}>
                        {/* Formulario */}
                        <div className={stylesAdmin.adminCard} style={{ height: 'fit-content' }}>
                            <h4 className={stylesAdmin.label} style={{ marginBottom: '15px' }}>Nuevo Movimiento</h4>
                            
                            {/* Selector 1: Tipo de Flujo (Alimentado por la DB) */}
                            <div className={stylesAdmin.formGroup}>
                                <label className={stylesAdmin.label}>Tipo de Flujo</label>
                                <select 
                                    className={stylesAdmin.loginInput} 
                                    value={tipoSeleccionado} 
                                    onChange={(e) => {
                                        setTipoSeleccionado(e.target.value);
                                        setMovData({ ...movData, motivoId: '' }); 
                                    }}
                                >
                                    <option value="">-- Seleccione Tipo --</option>
                                    {tiposDisponibles.map(tipo => (
                                        <option key={tipo} value={tipo}>
                                            {tipo.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selector 2: Motivo (Filtrado por el Tipo anterior) */}
                            <div className={stylesAdmin.formGroup}>
                                <label className={stylesAdmin.label}>Motivo</label>
                                <select 
                                    className={stylesAdmin.loginInput} 
                                    value={movData.motivoId} 
                                    onChange={e => setMovData({...movData, motivoId: e.target.value})}
                                    disabled={!tipoSeleccionado}
                                >
                                    <option value="">-- Seleccione un motivo --</option>
                                    {getMotivosPorTipo(tipoSeleccionado).map(m => (
                                        <option key={m.id} value={m.id}>{m.nombre_motivo}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={stylesAdmin.formGroup}>
                                <label className={stylesAdmin.label}>Monto ($)</label>
                                <input type="number" className={stylesAdmin.loginInput} placeholder="0.00" value={movData.monto} onChange={e => setMovData({...movData, monto: e.target.value})} />
                            </div>

                            <div className={stylesAdmin.formGroup}>
                                <label className={stylesAdmin.label}>Comentario Adicional</label>
                                <textarea className={stylesAdmin.loginInput} style={{ minHeight: '60px', resize: 'none', paddingTop: '10px' }} placeholder="Opcional..." value={movData.comentario} onChange={e => setMovData({...movData, comentario: e.target.value})} />
                            </div>

                            <button className={stylesAdmin.loginBtn} onClick={guardarMovimiento}>
                                REGISTRAR MOVIMIENTO
                            </button>
                        </div>

                        {/* Listado de movimientos */}
                        <div className={stylesAdmin.adminCard}>
                            <h4 className={stylesAdmin.label}>Bitácora del Turno Actual</h4>
                            <div style={{ overflowY: 'auto', maxHeight: '500px', marginTop: '15px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-bg-app)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                            <th style={{ padding: '10px' }}>HORA</th>
                                            <th style={{ padding: '10px' }}>CONCEPTO</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>MONTO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movimientos.map(m => (
                                            <tr key={m.id} style={{ borderBottom: '1px solid var(--color-bg-app)', fontSize: '13px' }}>
                                                <td style={{ padding: '12px' }}>{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                                <td style={{ padding: '12px', fontWeight: '600' }}>{m.motivo}</td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: m.tipo === 'ingreso' ? '#10b981' : '#ef4444' }}>
                                                    {m.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(m.monto)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- VISTA: TURNO Y ARQUEO --- */}
                {activeSubTab === 'TURNO Y ARQUEO' && (
                    <div className={stylesAdmin.adminCard}>
                        {!sesionActiva ? (
                            <div style={{ maxWidth: '400px', margin: '40px auto', textAlign: 'center' }}>
                                <h3 className={stylesAdmin.pageTitle}>Apertura de Caja</h3>
                                <input type="number" className={stylesAdmin.loginInput} style={{ fontSize: '2.5rem', textAlign: 'center', height: '80px', margin: '20px 0' }} value={montoApertura} onChange={e => setMontoApertura(e.target.value)} placeholder="$0.00" />
                                <button className={stylesAdmin.loginBtn} onClick={() => abrirTurno(montoApertura)}>INICIAR JORNADA</button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                <div className={stylesPOS.historyCard}>
                                    <span className={stylesAdmin.label}>Resumen de Sesión</span>
                                    <div className={stylesPOS.mesaTotal}>{formatCurrency(sesionActiva.monto_apertura)}</div>
                                    <p style={{ fontSize: '12px', marginTop: '10px' }}>Apertura: {new Date(sesionActiva.fecha_apertura).toLocaleString()}</p>
                                </div>
                                <div style={{ background: 'var(--color-bg-app)', padding: '25px', borderRadius: 'var(--radius-card)' }}>
                                    <h4 className={stylesAdmin.label}>Finalizar Turno</h4>
                                    <input type="number" className={stylesAdmin.loginInput} style={{ fontSize: '2rem', height: '70px', marginBottom: '15px' }} value={montoArqueo} onChange={e => setMontoArqueo(e.target.value)} placeholder="Efectivo físico" />
                                    <button className={`${stylesAdmin.loginBtn} ${stylesPOS.btnDelete}`} onClick={() => cerrarTurno(montoArqueo)}>CERRAR CAJA Y ARQUEAR</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- VISTA: HISTORIAL --- */}
                {activeSubTab === 'HISTORIAL' && (
                    <div className={stylesAdmin.adminCard}>
                        <div className={stylesPOS.historyGrid}>
                            {historial.map(h => (
                                <div key={h.id} className={stylesPOS.historyCard}>
                                    <div>
                                        <span className={stylesAdmin.label}>ID Sesión: #{h.id.toString().slice(-5)}</span>
                                        <div style={{ fontWeight: '700' }}>{new Date(h.fecha_apertura).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className={stylesPOS.historyCardAmount}>{formatCurrency(h.monto_cierre)}</div>
                                        <span className={h.diferencia < 0 ? stylesPOS.mesaBadgeCobrar : stylesPOS.mesaBadge}>
                                            DIF: {formatCurrency(h.diferencia)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CajeroTab;