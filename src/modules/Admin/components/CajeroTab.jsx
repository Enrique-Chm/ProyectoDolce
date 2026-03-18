// Archivo: src/modules/Admin/components/CajeroTab.jsx
import React, { useState, useEffect } from "react";
import { useCajeroTab } from "../../../hooks/useCajeroTab";
import { CajaService } from "../../../services/Caja.service";
import s from "../AdminPage.module.css"; 
import stylesPOS from "./MeseroTab.module.css";
import stylesCaja from "./CajeroTab.module.css";
import { formatCurrency } from "../../../utils/formatCurrency";
import Swal from "sweetalert2";
import { hasPermission } from "../../../utils/checkPermiso"; 

const CajeroTab = ({ usuarioId }) => {
  // 🛡️ SEGURIDAD INTERNA (RBAC)
  const puedeEditarCaja = hasPermission('editar_ventas');

  // 1. Estados de Navegación y Formularios
  const [activeSubTab, setActiveSubTab] = useState("COBRAR");
  const [cuentasPendientes, setCuentasPendientes] = useState([]);

  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [movData, setMovData] = useState({
    motivoId: "",
    monto: "",
    comentario: "",
  });

  const [montoArqueo, setMontoArqueo] = useState("");
  const [montoApertura, setMontoApertura] = useState("");

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
    registrarMovimientoEfectivo,
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
    if (!puedeEditarCaja) {
      return Swal.fire("Acceso Denegado", "No tienes permisos para procesar cobros.", "warning");
    }

    const totalVenta = venta.total || 0;

    const { value: resultado, isConfirmed } = await Swal.fire({
      title: `Cobrar Mesa ${venta.mesa || "S/N"}`,
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
            
            <div id="swal-cambio-container" style="text-align: center; font-size: 1.3rem; font-weight: 600; margin-top: 15px; padding: 15px; background: #fee2e2; border-radius: 8px; color: #ef4444;">
                Falta: ${formatCurrency(totalVenta)}
            </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "CONFIRMAR PAGO",
      confirmButtonColor: "#10b981",
      cancelButtonText: "Cancelar",
      didOpen: () => {
        const montoInput = Swal.getPopup().querySelector("#swal-monto");
        const cambioContainer = Swal.getPopup().querySelector("#swal-cambio-container");
        const metodoSelect = Swal.getPopup().querySelector("#swal-metodo");

        metodoSelect.addEventListener("change", () => {
          if (metodoSelect.value !== "efectivo") {
            montoInput.value = totalVenta;
            montoInput.dispatchEvent(new Event("input"));
          }
        });

        montoInput.addEventListener("input", () => {
          const recibido = parseFloat(montoInput.value) || 0;
          const diferencia = recibido - totalVenta;

          if (diferencia < 0) {
            cambioContainer.style.background = "#fee2e2";
            cambioContainer.style.color = "#ef4444";
            cambioContainer.innerHTML = `Falta: $${Math.abs(diferencia).toFixed(2)}`;
          } else {
            cambioContainer.style.background = "#d1fae5";
            cambioContainer.style.color = "#059669";
            cambioContainer.innerHTML = `Cambio a entregar: $${diferencia.toFixed(2)}`;
          }
        });

        setTimeout(() => montoInput.focus(), 100);
      },
      preConfirm: () => {
        const metodo = Swal.getPopup().querySelector("#swal-metodo").value;
        const recibido = parseFloat(Swal.getPopup().querySelector("#swal-monto").value) || 0;

        if (recibido < totalVenta) {
          Swal.showValidationMessage(`Pago incompleto. Faltan $${(totalVenta - recibido).toFixed(2)}`);
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
          icon: "success",
          title: "¡Cobro Exitoso!",
          text: `Cambio entregado: $${(resultado.recibido - totalVenta).toFixed(2)}`,
          timer: 2000,
          showConfirmButton: false,
        });
        cargarCuentas();
      } else {
        Swal.fire("Error", "No se pudo registrar el pago", "error");
      }
    }
  };

  // 5. Lógica para Guardar Movimiento
  const guardarMovimiento = async () => {
    if (!puedeEditarCaja) return;

    const motivosFiltrados = getMotivosPorTipo(tipoSeleccionado);
    const motivo = motivosFiltrados.find(m => m.id === parseInt(movData.motivoId));

    if (!motivo || !movData.monto) {
      return Swal.fire("Error", "Selecciona un motivo e ingresa el monto", "error");
    }

    const descFinal = movData.comentario
      ? `${motivo.nombre_motivo}: ${movData.comentario}`
      : motivo.nombre_motivo;

    await registrarMovimientoEfectivo(tipoSeleccionado, movData.monto, descFinal);
    setMovData({ motivoId: "", monto: "", comentario: "" });
    setTipoSeleccionado("");
  };

  // 6. Reporte de corte
  const imprimirReporte = (sesion) => {
    const ventanaPrint = window.open('', '_blank');
    const ingresosNetos = sesion.monto_cierre_esperado - sesion.monto_apertura;

    ventanaPrint.document.write(`
      <html>
        <head>
          <title>Corte de Caja #${sesion.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; font-size: 14px; max-width: 300px; margin: auto; }
            h2 { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 20px; font-size: 18px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .total { font-weight: bold; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 16px; }
            .firma-box { text-align: center; margin-top: 50px; }
          </style>
        </head>
        <body>
          <h2>REPORTE DE CAJA</h2>
          <div class="row"><span>ID Sesión:</span> <span>#${sesion.id}</span></div>
          <div class="row"><span>Apertura:</span> <span>${new Date(sesion.fecha_apertura).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span></div>
          <br/>
          <div class="row"><span>Fondo Inicial:</span> <span>${formatCurrency(sesion.monto_apertura)}</span></div>
          <div class="row"><span>Ventas y Movs:</span> <span>${formatCurrency(ingresosNetos)}</span></div>
          <div class="row total"><span>TOTAL ESPERADO:</span> <span>${formatCurrency(sesion.monto_cierre_esperado)}</span></div>
          <div class="row"><span>Efectivo Real:</span> <span>${formatCurrency(sesion.monto_cierre_real)}</span></div>
          <br/>
          <div class="row" style="font-weight: bold; color: ${sesion.diferencia < 0 ? 'red' : 'black'};">
            <span>Diferencia:</span> <span>${formatCurrency(sesion.diferencia)}</span>
          </div>
          <div class="firma-box"><p>_______________________</p><p>Firma del Cajero</p></div>
          <script>window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 500); }</script>
        </body>
      </html>
    `);
    ventanaPrint.document.close();
  };

  if (loading) return <div className={s.emptyState}>Sincronizando caja...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Gestión de Caja</h2>
      </header>

      {/* --- NAVEGACIÓN HOMOLOGADA --- */}
      <nav className={s.tabNav}>
        {["COBRAR", "MOVIMIENTOS", "TURNO Y ARQUEO", "HISTORIAL"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`${s.tabButton} ${activeSubTab === tab ? s.activeTabButton : ""}`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* --- VISTA: COBRAR --- */}
      {activeSubTab === "COBRAR" && (
        <div className={s.adminCard}>
          {!sesionActiva ? (
            <div className={s.emptyState}>Debes abrir un turno para cobrar cuentas.</div>
          ) : (
            <div className={stylesPOS.productGrid}>
              {cuentasPendientes.length === 0 ? (
                <div className={s.emptyState}>No hay cuentas pendientes.</div>
              ) : (
                cuentasPendientes.map((venta) => (
                  <div
                    key={venta.id}
                    className={`${stylesPOS.mesaCard} ${stylesCaja.mesaCardCustom}`}
                    onClick={() => manejarCobro(venta)}
                  >
                    <div className={stylesPOS.flexBetween}>
                      <span className={stylesPOS.mesaName}>Mesa {venta.mesa || "S/N"}</span>
                      <span className={venta.estado === "por_cobrar" ? stylesPOS.mesaBadgeCobrar : stylesPOS.mesaBadge}>
                        {venta.estado === "por_cobrar" ? "Por Cobrar" : "Pendiente"}
                      </span>
                    </div>
                    <div className={stylesPOS.mesaTotal}>{formatCurrency(venta.total)}</div>
                    <button className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} style={{ marginTop: '10px' }}>
                      {puedeEditarCaja ? "COBRAR" : "VER DETALLE"}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* --- VISTA: MOVIMIENTOS --- */}
      {activeSubTab === "MOVIMIENTOS" && (
        <div className={s.splitLayout}>
          {!sesionActiva ? (
            <div className={s.emptyState} style={{ gridColumn: '1/-1' }}>
              Debes abrir un turno en "TURNO Y ARQUEO" para registrar y ver movimientos.
            </div>
          ) : (
            <>
              {/* Formulario lateral */}
              <aside className={s.adminCard} style={{ opacity: puedeEditarCaja ? 1 : 0.6 }}>
                <h3 className={s.cardTitle}>Nuevo Movimiento</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className={s.formGroup}>
                    <label className={s.label}>Tipo de Flujo</label>
                    <select
                      className={s.inputField}
                      value={tipoSeleccionado}
                      disabled={!puedeEditarCaja}
                      onChange={(e) => {
                        setTipoSeleccionado(e.target.value);
                        setMovData({ ...movData, motivoId: "" });
                      }}
                    >
                      <option value="">-- Seleccione Tipo --</option>
                      {tiposDisponibles.map(tipo => <option key={tipo} value={tipo}>{tipo.toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div className={s.formGroup}>
                    <label className={s.label}>Motivo</label>
                    <select
                      className={s.inputField}
                      value={movData.motivoId}
                      onChange={e => setMovData({ ...movData, motivoId: e.target.value })}
                      disabled={tipoSeleccionado === "" || !puedeEditarCaja}
                    >
                      <option value="">-- Seleccione un motivo --</option>
                      {getMotivosPorTipo(tipoSeleccionado).map(m => <option key={m.id} value={m.id}>{m.nombre_motivo}</option>)}
                    </select>
                  </div>

                  <div className={s.formGroup}>
                    <label className={s.label}>Monto ($)</label>
                    <input
                      type="number"
                      className={s.inputField}
                      placeholder="0.00"
                      value={movData.monto}
                      readOnly={!puedeEditarCaja}
                      onChange={e => setMovData({ ...movData, monto: e.target.value })}
                    />
                  </div>

                  <div className={s.formGroup}>
                    <label className={s.label}>Comentario Adicional</label>
                    <textarea
                      className={s.inputField}
                      style={{ resize: 'vertical', minHeight: '80px' }}
                      placeholder="Opcional..."
                      value={movData.comentario}
                      readOnly={!puedeEditarCaja}
                      onChange={e => setMovData({ ...movData, comentario: e.target.value })}
                    />
                  </div>

                  {puedeEditarCaja && (
                    <button className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} onClick={guardarMovimiento}>
                      REGISTRAR MOVIMIENTO
                    </button>
                  )}
                </div>
              </aside>

              {/* Bitácora de movimientos */}
              <div className={`${s.adminCard} ${s.tableContainer}`}>
                <h3 className={s.cardTitle} style={{ padding: '20px' }}>Bitácora del Turno Actual</h3>
                <table className={s.table}>
                  <thead className={s.thead}>
                    <tr>
                      <th className={s.th}>HORA</th>
                      <th className={s.th}>CONCEPTO</th>
                      <th className={s.th} style={{ textAlign: 'right' }}>MONTO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m) => {
                      const esIngreso = ["ingreso", "entrada", "venta"].includes(m.tipo?.toLowerCase().trim());
                      return (
                        <tr key={m.id}>
                          <td className={s.td}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                          <td className={s.td} style={{ fontWeight: '700' }}>{m.motivo}</td>
                          <td className={s.td} style={{ textAlign: 'right', fontWeight: '600', color: esIngreso ? 'var(--color-success)' : 'var(--color-danger)' }}>
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

      {/* --- VISTA: TURNO Y ARQUEO --- */}
      {activeSubTab === "TURNO Y ARQUEO" && (
        <div className={s.fadeIn}>
          {!sesionActiva ? (
            <div className={`${s.adminCard}`} style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>💵</div>
              <h2 className={s.cardTitle} style={{ fontSize: '1.8rem' }}>Caja Cerrada</h2>
              <p className={s.textMuted} style={{ marginBottom: '30px' }}>Ingresa el monto de fondo de caja para iniciar la jornada.</p>
              
              <div className={s.formGroup} style={{ textAlign: 'left' }}>
                <label className={s.label}>Fondo de Caja ($)</label>
                <input
                  type="number"
                  className={s.inputField}
                  style={{ fontSize: '1.5rem', textAlign: 'center', height: '60px' }}
                  value={montoApertura}
                  readOnly={!puedeEditarCaja}
                  onChange={e => setMontoApertura(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              {puedeEditarCaja ? (
                <button className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} style={{ padding: '20px', fontSize: '1.1rem', marginTop: '20px' }} onClick={() => abrirTurno(montoApertura)}>
                  INICIAR JORNADA
                </button>
              ) : (
                <div className={s.badgeDanger} style={{ marginTop: '20px' }}>Requiere permisos para abrir caja.</div>
              )}
            </div>
          ) : (
            <div className={s.splitLayout}>
              {/* Info Turno */}
              <div className={s.adminCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 className={s.cardTitle} style={{ margin: 0 }}>Turno Activo</h3>
                  <span className={s.badgeSuccess}>● ABIERTA</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-bg-muted)', paddingBottom: '10px' }}>
                      <span className={s.label}>Apertura:</span>
                      <span style={{ fontWeight: '700' }}>{new Date(sesionActiva.fecha_apertura).toLocaleString()}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-bg-muted)', paddingBottom: '10px' }}>
                      <span className={s.label}>Fondo Inicial:</span>
                      <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{formatCurrency(sesionActiva.monto_apertura)}</span>
                   </div>
                </div>
              </div>

              {/* Formulario Arqueo */}
              <div className={s.adminCard} style={{ opacity: puedeEditarCaja ? 1 : 0.6 }}>
                <h3 className={s.cardTitle}>Arqueo de Caja</h3>
                <p className={s.textMuted} style={{ fontSize: '13px', marginBottom: '20px' }}>Ingresa el efectivo físico total en el cajón.</p>
                <div className={s.formGroup}>
                  <label className={s.label}>Efectivo en Cajón ($)</label>
                  <input
                    type="number"
                    className={s.inputField}
                    style={{ fontSize: '1.5rem', fontWeight: '600' }}
                    value={montoArqueo}
                    readOnly={!puedeEditarCaja}
                    onChange={e => setMontoArqueo(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                {puedeEditarCaja && (
                  <button className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} style={{ marginTop: '20px', padding: '15px' }} onClick={() => cerrarTurno(montoArqueo)}>
                    🔒 CERRAR CAJA Y ARQUEAR
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- VISTA: HISTORIAL --- */}
      {activeSubTab === "HISTORIAL" && (
        <div className={s.adminCard} style={{ padding: '20px' }}>
          <div className={stylesPOS.historyGrid}>
            {historial.map((h) => (
              <div key={h.id} className={`${stylesPOS.historyCard} ${stylesCaja.historyCardRelative}`}>
                <button onClick={() => imprimirReporte(h)} className={stylesCaja.printBtn} title="Imprimir Corte">🖨️</button>
                <div>
                  <span className={s.label}>ID Sesión: #{h.id?.toString().slice(-5)}</span>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{new Date(h.fecha_apertura).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--color-primary)' }}>{formatCurrency(h.monto_cierre_real || 0)}</div>
                  <span className={h.diferencia < 0 ? s.badgeDanger : s.badgeSuccess}>DIF: {formatCurrency(h.diferencia)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CajeroTab;