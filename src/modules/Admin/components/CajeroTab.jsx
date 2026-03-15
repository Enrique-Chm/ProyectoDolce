import React, { useState, useEffect } from 'react';
import { useCajeroTab } from '../../../hooks/useCajeroTab';
import { CajaService } from '../../../services/Caja.service'; 
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

    // 2. Hook de Lógica
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
            const { data } = await CajaService.getVentasPendientes();
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

    // 4. Lógica de Cobro Directo con Modal Dinámico
    const manejarCobro = async (venta) => {
        const totalVenta = venta.total || 0;

        const { value: resultado, isConfirmed } = await Swal.fire({
            title: `Cobrar Mesa ${venta.mesa || 'S/N'}`,
            html: `
                <div style="text-align: left; font-size: 1.1rem; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                    <span style="color: #666;">Total a cobrar:</span> <br/>
                    <strong style="font-size: 2rem; color: var(--color-primary);">${formatCurrency(totalVenta)}</strong>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
                    <div>
                        <label style="font-weight: bold; font-size: 0.9rem; color: #555;">Método de Pago:</label>
                        <select id="swal-metodo" class="swal2-select" style="width: 100%; margin: 5px 0 0 0; font-size: 1.1rem; padding: 10px;">
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta</option>
                            <option value="transferencia">Transferencia</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-weight: bold; font-size: 0.9rem; color: #555;">Monto Recibido ($):</label>
                        <input id="swal-monto" type="number" step="0.5" class="swal2-input" placeholder="0.00" style="width: 100%; margin: 5px 0 0 0; font-size: 1.5rem; text-align: right; padding: 10px; box-sizing: border-box; background: #f9fafb;" />
                    </div>
                    
                    <div id="swal-cambio-container" style="text-align: center; font-size: 1.3rem; font-weight: 800; margin-top: 15px; padding: 15px; background: #fee2e2; border-radius: 8px; color: #ef4444;">
                        Falta: ${formatCurrency(totalVenta)}
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'CONFIRMAR PAGO',
            confirmButtonColor: '#10b981',
            cancelButtonText: 'Cancelar',
            didOpen: () => {
                const montoInput = Swal.getPopup().querySelector('#swal-monto');
                const cambioContainer = Swal.getPopup().querySelector('#swal-cambio-container');
                const metodoSelect = Swal.getPopup().querySelector('#swal-metodo');

                metodoSelect.addEventListener('change', () => {
                    if (metodoSelect.value !== 'efectivo') {
                        montoInput.value = totalVenta;
                        montoInput.dispatchEvent(new Event('input')); 
                    }
                });

                montoInput.addEventListener('input', () => {
                    const recibido = parseFloat(montoInput.value) || 0;
                    const diferencia = recibido - totalVenta;

                    if (diferencia < 0) {
                        cambioContainer.style.background = '#fee2e2'; 
                        cambioContainer.style.color = '#ef4444'; 
                        cambioContainer.innerHTML = `Falta: $${Math.abs(diferencia).toFixed(2)}`;
                    } else {
                        cambioContainer.style.background = '#d1fae5'; 
                        cambioContainer.style.color = '#059669'; 
                        cambioContainer.innerHTML = `Cambio a entregar: $${diferencia.toFixed(2)}`;
                    }
                });
                
                setTimeout(() => montoInput.focus(), 100);
            },
            preConfirm: () => {
                const metodo = Swal.getPopup().querySelector('#swal-metodo').value;
                const recibido = parseFloat(Swal.getPopup().querySelector('#swal-monto').value) || 0;

                if (recibido < totalVenta) {
                    Swal.showValidationMessage(`Pago incompleto. Faltan $${(totalVenta - recibido).toFixed(2)}`);
                    return false; 
                }

                return { metodo, recibido };
            }
        });

        if (isConfirmed && resultado) {
            const { error } = await CajaService.finalizarVenta(venta.id, {
                estado: 'pagado',
                metodo_pago: resultado.metodo,
                cajero_id: usuarioId,
                turno_id: sesionActiva.id
            });

            if (!error) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Cobro Exitoso!',
                    text: `Cambio entregado: $${(resultado.recibido - totalVenta).toFixed(2)}`,
                    timer: 2000,
                    showConfirmButton: false
                });
                cargarCuentas();
            } else {
                Swal.fire('Error', 'No se pudo registrar el pago', 'error');
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
                                                <span className={venta.estado === 'por_cobrar' ? stylesPOS.mesaBadgeCobrar : stylesPOS.mesaBadge}>
                                                    {venta.estado === 'por_cobrar' ? 'Por Cobrar' : 'Pendiente'}
                                                </span>
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

                {/* --- VISTA: MOVIMIENTOS --- */}
                {activeSubTab === 'MOVIMIENTOS' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '25px' }}>
                        {/* Formulario */}
                        <div className={stylesAdmin.adminCard} style={{ height: 'fit-content' }}>
                            <h4 className={stylesAdmin.label} style={{ marginBottom: '15px' }}>Nuevo Movimiento</h4>
                            
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

                {/* --- VISTA REDISEÑADA: TURNO Y ARQUEO --- */}
                {activeSubTab === 'TURNO Y ARQUEO' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        {!sesionActiva ? (
                            <div className={stylesAdmin.adminCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center' }}>
                                <div style={{ background: 'var(--color-bg-app)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '20px' }}>
                                    💵
                                </div>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '10px', color: 'var(--color-text)' }}>Caja Cerrada</h2>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '30px', maxWidth: '350px' }}>
                                    Ingresa el monto de efectivo base (fondo de caja) para aperturar e iniciar la jornada.
                                </p>
                                
                                <div style={{ width: '100%', maxWidth: '350px' }}>
                                    <label className={stylesAdmin.label} style={{ display: 'block', textAlign: 'left', marginBottom: '8px' }}>Fondo de Caja ($)</label>
                                    <input 
                                        type="number" 
                                        className={stylesAdmin.loginInput} 
                                        style={{ fontSize: '2rem', textAlign: 'center', height: '70px', marginBottom: '20px', fontWeight: '700', color: 'var(--color-primary)' }} 
                                        value={montoApertura} 
                                        onChange={e => setMontoApertura(e.target.value)} 
                                        placeholder="0.00" 
                                    />
                                    <button 
                                        className={stylesAdmin.loginBtn} 
                                        style={{ padding: '18px', fontSize: '1.1rem', fontWeight: '800' }}
                                        onClick={() => abrirTurno(montoApertura)}
                                    >
                                        INICIAR JORNADA
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                                
                                {/* Tarjeta de Estado Actual */}
                                <div className={stylesAdmin.adminCard} style={{ borderTop: '4px solid var(--color-primary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Turno Activo</h3>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>En curso</span>
                                        </div>
                                        <span style={{ background: '#d1fae5', color: '#059669', padding: '5px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800' }}>● ABIERTA</span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '15px', borderBottom: '1px solid var(--color-border)' }}>
                                            <span style={{ color: 'var(--color-text-muted)', fontWeight: '600' }}>Fecha/Hora Apertura</span>
                                            <span style={{ fontWeight: '700' }}>{new Date(sesionActiva.fecha_apertura).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '15px', borderBottom: '1px solid var(--color-border)' }}>
                                            <span style={{ color: 'var(--color-text-muted)', fontWeight: '600' }}>Cajero ID</span>
                                            <span style={{ fontWeight: '700' }}>#{sesionActiva.usuario_id || 'S/N'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                            <span style={{ color: 'var(--color-text-muted)', fontWeight: '600' }}>Fondo Inicial</span>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-primary)' }}>{formatCurrency(sesionActiva.monto_apertura)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tarjeta de Cierre/Arqueo */}
                                <div className={stylesAdmin.adminCard} style={{ borderTop: '4px solid #ef4444', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '10px' }}>Arqueo de Caja</h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                                        Ingresa el efectivo físico total que hay en la caja (incluyendo el fondo inicial) para calcular diferencias.
                                    </p>
                                    
                                    <label className={stylesAdmin.label} style={{ marginBottom: '8px' }}>Efectivo en Cajón ($)</label>
                                    <input 
                                        type="number" 
                                        className={stylesAdmin.loginInput} 
                                        style={{ fontSize: '2rem', height: '70px', marginBottom: '20px', fontWeight: '800', textAlign: 'right' }} 
                                        value={montoArqueo} 
                                        onChange={e => setMontoArqueo(e.target.value)} 
                                        placeholder="0.00" 
                                    />
                                    
                                    <button 
                                        className={`${stylesAdmin.loginBtn}`} 
                                        style={{ background: '#ef4444', padding: '18px', fontSize: '1.1rem', fontWeight: '800', marginTop: 'auto' }}
                                        onClick={() => cerrarTurno(montoArqueo)}
                                    >
                                        🔒 CERRAR CAJA Y ARQUEAR
                                    </button>
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
                                        <div className={stylesPOS.historyCardAmount}>{formatCurrency(h.monto_cierre_real || 0)}</div>
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