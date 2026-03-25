// Archivo: src/modules/Admin/components/CajeroTab.jsx
import React, { useState } from "react";
import { useCajeroTab } from "../../../hooks/useCajeroTab";
import { CajaService } from "../../../services/Caja.service"; 
import stylesAdmin from "../AdminPage.module.css"; 
import s from "./MeseroTab.module.css"; // UNIFICADO: Usamos el mismo CSS que el mesero
import { formatCurrency } from "../../../utils/formatCurrency";
import Swal from "sweetalert2";
import { hasPermission } from "../../../utils/checkPermiso"; 

export const CajeroTab = ({ usuarioId, sucursalId }) => {
  // 🛡️ SEGURIDAD INTERNA (RBAC)
  const puedeEditarCaja = hasPermission('editar_ventas');

  // 1. Estados de Navegación y Formularios
  const [activeSubTab, setActiveSubTab] = useState("COBRAR");
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [movData, setMovData] = useState({ motivoId: "", monto: "", comentario: "" });
  const [montoArqueo, setMontoArqueo] = useState("");
  const [montoApertura, setMontoApertura] = useState("");

  // 2. Hook de Lógica Centralizada
  // 💡 Extraemos cuentasPendientes y cuentasCobradas directamente del Hook
  const {
    sesionActiva, 
    loading, 
    movimientos, 
    historial, 
    tiposDisponibles,
    cuentasPendientes, 
    cuentasCobradas,   
    getMotivosPorTipo, 
    abrirTurno, 
    cerrarTurno, 
    registrarMovimientoEfectivo, 
    refrescarTodo
  } = useCajeroTab(usuarioId, sucursalId);

  // 3. Lógica de Cobro Directo con Calculadora de Cambio
  const manejarCobro = async (venta) => {
    if (!puedeEditarCaja) return Swal.fire("Acceso Denegado", "No tienes permisos para procesar cobros.", "warning");

    const totalVenta = parseFloat(venta.total) || 0;

    const { value: resultado, isConfirmed } = await Swal.fire({
      title: `Cobrar Mesa ${venta.mesa || "S/N"}`,
      html: `
        <div style="text-align: left; font-size: 1.1rem; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
            <span style="color: #666;">Total a liquidar:</span> <br/>
            <strong style="font-size: 2.2rem; color: #2563eb;">${formatCurrency(totalVenta)}</strong>
        </div>
        <div style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
            <div>
                <label style="font-weight: bold; font-size: 0.9rem; color: #555;">Método de Pago:</label>
                <select id="swal-metodo" class="swal2-select" style="width: 100%; margin: 5px 0 0 0; font-size: 1.1rem; padding: 10px;">
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="tarjeta">💳 Tarjeta (Débito/Crédito)</option>
                    <option value="transferencia">📱 Transferencia / SPEI</option>
                </select>
            </div>
            <div>
                <label style="font-weight: bold; font-size: 0.9rem; color: #555;">Monto Recibido ($):</label>
                <input id="swal-monto" type="number" step="0.01" class="swal2-input" placeholder="0.00" style="width: 100%; margin: 5px 0 0 0; font-size: 1.8rem; text-align: right; padding: 10px; box-sizing: border-box; font-weight: 800;" />
            </div>
            <div id="swal-cambio-container" style="text-align: center; font-size: 1.4rem; font-weight: 700; margin-top: 15px; padding: 15px; background: #fef2f2; border-radius: 8px; color: #dc2626; border: 1px solid #fecaca;">
                Falta: ${formatCurrency(totalVenta)}
            </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "FINALIZAR VENTA",
      confirmButtonColor: "#059669",
      cancelButtonText: "Volver",
      didOpen: () => {
        const montoInput = Swal.getPopup().querySelector("#swal-monto");
        const cambioContainer = Swal.getPopup().querySelector("#swal-cambio-container");
        const metodoSelect = Swal.getPopup().querySelector("#swal-metodo");

        metodoSelect.addEventListener("change", () => {
          if (metodoSelect.value !== "efectivo") {
            montoInput.value = totalVenta.toFixed(2);
            montoInput.dispatchEvent(new Event("input"));
          }
        });

        montoInput.addEventListener("input", () => {
          const recibido = parseFloat(montoInput.value) || 0;
          const diferencia = recibido - totalVenta;

          if (diferencia < 0) {
            cambioContainer.style.background = "#fef2f2";
            cambioContainer.style.color = "#dc2626";
            cambioContainer.style.borderColor = "#fecaca";
            cambioContainer.innerHTML = `Faltan: $${Math.abs(diferencia).toFixed(2)}`;
          } else {
            cambioContainer.style.background = "#f0fdf4";
            cambioContainer.style.color = "#16a34a";
            cambioContainer.style.borderColor = "#bbf7d0";
            cambioContainer.innerHTML = `Cambio: $${diferencia.toFixed(2)}`;
          }
        });

        setTimeout(() => montoInput.focus(), 200);
      },
      preConfirm: () => {
        const metodo = Swal.getPopup().querySelector("#swal-metodo").value;
        const recibido = parseFloat(Swal.getPopup().querySelector("#swal-monto").value) || 0;

        if (recibido < totalVenta) {
          Swal.showValidationMessage(`El pago es insuficiente. Faltan $${(totalVenta - recibido).toFixed(2)}`);
          return false;
        }

        return { metodo, recibido };
      },
    });

    if (isConfirmed && resultado) {
      const { error } = await CajaService.finalizarVenta(venta.id, {
        estado: "pagado",
        metodo_pago: resultado.metodo,
      });

      if (!error) {
        Swal.fire({
          icon: "success", title: "Venta Pagada", text: `Cambio: $${(resultado.recibido - totalVenta).toFixed(2)}`,
          timer: 2500, showConfirmButton: false,
        });
        refrescarTodo(); // Refresca las listas automáticamente
      } else {
        Swal.fire("Error", "No se pudo cerrar la venta en el servidor", "error");
      }
    }
  };

  const guardarMovimiento = async () => {
    if (!puedeEditarCaja) return;
    const motivosFiltrados = getMotivosPorTipo(tipoSeleccionado);
    const motivo = motivosFiltrados.find(m => m.id === parseInt(movData.motivoId));

    if (!motivo || !movData.monto) return Swal.fire("Atención", "Selecciona un motivo y el monto exacto", "warning");

    const descFinal = movData.comentario ? `${motivo.nombre_motivo}: ${movData.comentario}` : motivo.nombre_motivo;

    await registrarMovimientoEfectivo(tipoSeleccionado, movData.monto, descFinal);
    setMovData({ motivoId: "", monto: "", comentario: "" });
    setTipoSeleccionado("");
  };

  const imprimirReporte = (sesion) => {
    const ventanaPrint = window.open('', '_blank');
    const ingresosNetos = parseFloat(sesion.monto_cierre_esperado) - parseFloat(sesion.monto_apertura);

    ventanaPrint.document.write(`
      <html>
        <head>
          <title>Corte Turno #${sesion.id.toString().slice(-5)}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 10px; font-size: 12px; width: 280px; }
            .header { text-align: center; border-bottom: 1px dashed #000; margin-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .total { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>CORTE DE CAJA</h3>
            <p>Sucursal ID: ${sucursalId}<br/>Turno: ${new Date(sesion.fecha_apertura).toLocaleDateString()}</p>
          </div>
          <div class="row"><span>Apertura:</span> <span>${formatCurrency(sesion.monto_apertura)}</span></div>
          <div class="row"><span>Ventas/Movs:</span> <span>+${formatCurrency(ingresosNetos)}</span></div>
          <div class="row total"><span>ESPERADO:</span> <span>${formatCurrency(sesion.monto_cierre_esperado)}</span></div>
          <div class="row"><span>CONTADO:</span> <span>${formatCurrency(sesion.monto_cierre_real)}</span></div>
          <div class="row" style="font-weight:bold; color:${sesion.diferencia < 0 ? 'red' : 'black'}">
            <span>DIFERENCIA:</span> <span>${formatCurrency(sesion.diferencia)}</span>
          </div>
          <div class="footer"><p>_______________________</p><p>Firma Responsable</p></div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `);
    ventanaPrint.document.close();
  };

  // Lógica de separación de cuentas para la vista
  const mesasPorCobrar = cuentasPendientes.filter(v => v.estado === 'por_cobrar');
  const mesasActivas = cuentasPendientes.filter(v => v.estado !== 'por_cobrar');

  if (loading) return <div className={stylesAdmin.emptyState}>Sincronizando estado de caja...</div>;

  return (
    <div className={stylesAdmin.tabWrapper}>
        <div className={stylesAdmin.pageHeader}>
          <h2 className={stylesAdmin.pageTitle}>Panel de Cajero</h2>
        </div>

        <nav className={stylesAdmin.tabNav}>
          {["COBRAR", "MOVIMIENTOS", "TURNO Y ARQUEO", "HISTORIAL"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`${stylesAdmin.tabButton} ${activeSubTab === tab ? stylesAdmin.activeTabButton : ""}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* --- SUBTAB: COBRAR --- */}
        {activeSubTab === "COBRAR" && (
          <div className={stylesAdmin.adminCard}>
            {!sesionActiva ? (
              <div className={stylesAdmin.emptyState}>El turno está cerrado. Ve a "TURNO Y ARQUEO" para iniciar.</div>
            ) : (
              <>
                {cuentasPendientes.length === 0 && cuentasCobradas.length === 0 ? (
                  <div className={stylesAdmin.emptyState}>No hay cuentas activas ni historial reciente en este turno.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/*  SECCIÓN 1: MESAS POR COBRAR (PRIORIDAD ALTA) */}
                    {mesasPorCobrar.length > 0 && (
                      <div>
                        <h3 className={stylesAdmin.cardTitle} style={{ marginBottom: '15px', color: 'var(--color-warning)' }}>
                            Por Cobrar
                        </h3>
                        <div className={s.productGrid}>
                          {mesasPorCobrar.map((venta) => (
                            <div 
                              key={venta.id} 
                              className={`${s.mesaCard} ${s.mesaCardCustom}`} 
                              onClick={() => manejarCobro(venta)} 
                              style={{ borderLeftColor: 'var(--color-warning)' }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                                <span className={s.mesaName}>Mesa {venta.mesa}</span>
                                <span className={s.mesaBadgeCobrar} style={{ textAlign: 'center' }}>
                                  POR COBRAR
                                </span>
                              </div>
                              <div className={s.mesaTotal} style={{ marginTop: '15px' }}>{formatCurrency(venta.total)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/*  SECCIÓN 2: MESAS ACTIVAS / CONSUMIENDO */}
                    {mesasActivas.length > 0 && (
                      <div>
                        <h3 className={stylesAdmin.cardTitle} style={{ marginBottom: '15px', color: 'var(--color-text-muted)', borderTop: mesasPorCobrar.length > 0 ? '1px dashed var(--color-border)' : 'none', paddingTop: mesasPorCobrar.length > 0 ? '20px' : '0' }}>
                           Abiertas
                        </h3>
                        <div className={s.productGrid}>
                          {mesasActivas.map((venta) => (
                            <div 
                              key={venta.id} 
                              className={`${s.mesaCard} ${s.mesaCardCustom}`} 
                              onClick={() => manejarCobro(venta)} 
                              style={{ opacity: 0.9 }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                                <span className={s.mesaName}>Mesa {venta.mesa}</span>
                                <span className={s.mesaBadge} style={{ textAlign: 'center' }}>
                                  CONSUMIENDO
                                </span>
                              </div>
                              <div className={s.mesaTotal} style={{ marginTop: '15px' }}>{formatCurrency(venta.total)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/*  SECCIÓN 3: MESAS COBRADAS EN ESTE TURNO */}
                    {cuentasCobradas.length > 0 && (
                      <div>
                        <h3 className={stylesAdmin.cardTitle} style={{ marginBottom: '15px', color: 'var(--color-success)', borderTop: (mesasPorCobrar.length > 0 || mesasActivas.length > 0) ? '1px dashed var(--color-border)' : 'none', paddingTop: '20px' }}>
                           Cobradas en este Turno
                        </h3>
                        <div className={s.productGrid}>
                          {cuentasCobradas.map((venta) => (
                            <div 
                              key={venta.id} 
                              className={`${s.mesaCard} ${s.mesaCardCustom}`} 
                              style={{ borderLeftColor: 'var(--color-success)', opacity: 0.7, cursor: 'default' }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                                <span className={s.mesaName}>Mesa {venta.mesa}</span>
                                <span className={stylesAdmin.badgeSuccess} style={{ textAlign: 'center' }}>
                                  LIQUIDADA
                                </span>
                              </div>
                              <div className={s.mesaTotal} style={{ marginTop: '15px' }}>{formatCurrency(venta.total)}</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '10px' }}>
                                Hora: {new Date(venta.hora_cierre).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* --- SUBTAB: MOVIMIENTOS --- */}
        {activeSubTab === "MOVIMIENTOS" && (
          <div className={stylesAdmin.splitLayout}>
            {!sesionActiva ? (
              <div className={stylesAdmin.emptyState} style={{ gridColumn: '1/-1' }}>Acción no disponible sin turno abierto.</div>
            ) : (
              <>
                <aside className={stylesAdmin.adminCard} style={{ opacity: puedeEditarCaja ? 1 : 0.6 }}>
                  <h3 className={stylesAdmin.cardTitle}>Entrada / Salida de Efectivo</h3>
                  <div className={stylesAdmin.formGroup}>
                    <label className={stylesAdmin.label}>Tipo de Flujo</label>
                    <select className={stylesAdmin.inputField} value={tipoSeleccionado} disabled={!puedeEditarCaja} onChange={(e) => { setTipoSeleccionado(e.target.value); setMovData({ ...movData, motivoId: "" }); }}>
                      <option value="">-- Seleccione --</option>
                      {tiposDisponibles.map(tipo => <option key={tipo} value={tipo}>{tipo.toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div className={stylesAdmin.formGroup}>
                    <label className={stylesAdmin.label}>Concepto</label>
                    <select className={stylesAdmin.inputField} value={movData.motivoId} onChange={e => setMovData({ ...movData, motivoId: e.target.value })} disabled={!tipoSeleccionado || !puedeEditarCaja}>
                      <option value="">-- Seleccione Motivo --</option>
                      {getMotivosPorTipo(tipoSeleccionado).map(m => <option key={m.id} value={m.id}>{m.nombre_motivo}</option>)}
                    </select>
                  </div>

                  <div className={stylesAdmin.formGroup}>
                    <label className={stylesAdmin.label}>Monto ($)</label>
                    <input type="number" className={stylesAdmin.inputField} placeholder="0.00" value={movData.monto} readOnly={!puedeEditarCaja} onChange={e => setMovData({ ...movData, monto: e.target.value })} />
                  </div>

                  <div className={stylesAdmin.formGroup}>
                    <label className={stylesAdmin.label}>Observaciones</label>
                    <textarea className={`${stylesAdmin.inputField} ${s.textareaCustom}`} placeholder="Ej. Pago a proveedor..." value={movData.comentario} onChange={e => setMovData({ ...movData, comentario: e.target.value })} />
                  </div>

                  <button className={`${stylesAdmin.btn} ${stylesAdmin.btnPrimary} ${stylesAdmin.btnFull}`} onClick={guardarMovimiento} disabled={!puedeEditarCaja}>
                    REGISTRAR MOVIMIENTO
                  </button>
                </aside>

                <div className={`${stylesAdmin.adminCard} ${stylesAdmin.tableContainer}`}>
                  <h3 className={stylesAdmin.cardTitle} style={{ padding: '20px' }}>Bitácora de Caja (Turno Actual)</h3>
                  <table className={stylesAdmin.table}>
                    <thead className={stylesAdmin.thead}>
                      <tr>
                        <th className={stylesAdmin.th}>HORA</th>
                        <th className={stylesAdmin.th}>CONCEPTO</th>
                        <th className={stylesAdmin.th} style={{ textAlign: 'right' }}>MONTO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientos.map((m) => {
                        const esIngreso = ["ingreso", "entrada", "venta"].includes(m.tipo?.toLowerCase().trim());
                        return (
                          <tr key={m.id}>
                            <td className={stylesAdmin.td}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                            <td className={stylesAdmin.td}><strong>{m.motivo}</strong></td>
                            <td className={`${stylesAdmin.td} ${s.tdMonto} ${esIngreso ? s.textGreen : s.textRed}`}>
                              {esIngreso ? "+" : "-"}{formatCurrency(m.monto)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- SUBTAB: TURNO Y ARQUEO --- */}
        {activeSubTab === "TURNO Y ARQUEO" && (
          <div className={stylesAdmin.fadeIn}>
            {!sesionActiva ? (
              <div className={`${stylesAdmin.adminCard} ${s.cajaCerradaCard}`}>
                <div className={s.cashIcon}>🏪</div>
                <h2 className={s.cajaCerradaTitle}>Caja Cerrada</h2>
                <p className={s.cajaCerradaDesc}>Inicia el fondo de caja para comenzar a operar.</p>
                
                <div className={s.cajaCerradaFormWrapper}>
                  <label className={`${stylesAdmin.label} ${s.cajaCerradaLabel}`}>Fondo Inicial de Apertura ($)</label>
                  <input type="number" className={`${stylesAdmin.inputField} ${s.cajaCerradaInput}`} value={montoApertura} onChange={e => setMontoApertura(e.target.value)} placeholder="0.00" />
                  <button className={`${stylesAdmin.btn} ${stylesAdmin.btnPrimary} ${stylesAdmin.btnFull} ${s.cajaCerradaBtn}`} onClick={() => abrirTurno(montoApertura)}>
                    ABRIR TURNO AHORA
                  </button>
                </div>
              </div>
            ) : (
              <div className={`${stylesAdmin.splitLayout} ${s.turnoAbiertoGrid}`}>
                <div className={`${stylesAdmin.adminCard} ${s.turnoActivoCard}`}>
                  <div className={s.turnoHeaderRow}>
                    <h3 className={s.turnoTitle}>Resumen de Turno</h3>
                    <span className={stylesAdmin.badgeSuccess}>ACTIVO</span>
                  </div>
                  <div className={s.dataList}>
                    <div className={s.dataRow}>
                      <span className={s.dataLabel}>Cajero Responsable:</span>
                      {/* 💡 Muestra el ID del usuario que ABRÍO el turno, no del que lo está viendo */}
                      <span className={s.dataValue}>#{sesionActiva.usuario_id}</span>
                    </div>
                    <div className={s.dataRow}>
                      <span className={s.dataLabel}>Abierto desde:</span>
                      <span className={s.dataValue}>{new Date(sesionActiva.fecha_apertura).toLocaleString()}</span>
                    </div>
                    <div className={s.fondoRow}>
                      <span className={s.dataLabel}>Fondo Inicial:</span>
                      <span className={s.fondoValue}>{formatCurrency(sesionActiva.monto_apertura)}</span>
                    </div>
                  </div>
                </div>

                <div className={`${stylesAdmin.adminCard} ${s.arqueoCard}`}>
                  <h3 className={s.arqueoTitle}>Arqueo Final</h3>
                  <p className={s.arqueoDesc}>Cuenta el efectivo total del cajón y regístralo aquí.</p>
                  <div className={stylesAdmin.formGroup}>
                    <label className={`${stylesAdmin.label} ${s.arqueoLabel}`}>Total Efectivo Contado ($)</label>
                    <input type="number" className={`${stylesAdmin.inputField} ${s.arqueoInput}`} value={montoArqueo} onChange={e => setMontoArqueo(e.target.value)} placeholder="0.00" />
                  </div>
                  <button className={`${stylesAdmin.btn} ${stylesAdmin.btnFull} ${s.arqueoBtn}`} onClick={() => cerrarTurno(montoArqueo)}>
                    🔒 CERRAR Y GENERAR CORTE
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- SUBTAB: HISTORIAL --- */}
        {activeSubTab === "HISTORIAL" && (
          <div className={stylesAdmin.adminCard}>
            <div className={s.historyGrid}>
              {historial.length === 0 ? (
                <div className={stylesAdmin.emptyState}>No hay turnos previos registrados.</div>
              ) : (
                historial.map((h) => (
                  <div key={h.id} className={`${s.historyCard} ${s.historyCardRelative}`}>
                    <button onClick={() => imprimirReporte(h)} className={s.printBtn} title="Reimprimir Ticket">🖨️</button>
                    <div>
                      <small className={stylesAdmin.textMuted}>Folio: {h.id.slice(0,8)}</small>
                      <div className={s.historyDate}>{new Date(h.fecha_apertura).toLocaleDateString()}</div>
                      <div className={s.historyCardTime}>
                        {new Date(h.fecha_apertura).toLocaleTimeString()} - {new Date(h.fecha_cierre).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className={s.historyRightBox}>
                      <div className={s.historyCardAmount}>{formatCurrency(h.monto_cierre_real)}</div>
                      <span className={parseFloat(h.diferencia) < 0 ? stylesAdmin.badgeDanger : stylesAdmin.badgeSuccess}>
                        {parseFloat(h.diferencia) === 0 ? "CUADRADO" : `DIF: ${formatCurrency(h.diferencia)}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default CajeroTab;