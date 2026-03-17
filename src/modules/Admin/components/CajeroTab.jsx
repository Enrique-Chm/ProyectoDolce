// Archivo: src/modules/Admin/components/CajeroTab.jsx
import React, { useState, useEffect } from "react";
import { useCajeroTab } from "../../../hooks/useCajeroTab";
import { CajaService } from "../../../services/Caja.service";
import stylesAdmin from "../AdminPage.module.css";
import stylesPOS from "./MeseroTab.module.css";
import stylesCaja from "./CajeroTab.module.css";
import { formatCurrency } from "../../../utils/formatCurrency";
import Swal from "sweetalert2";
import { hasPermission } from "../../../utils/checkPermiso"; // 🛡️ Importamos seguridad

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
    // Validación de seguridad antes de abrir el modal
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
            
            <div id="swal-cambio-container" style="text-align: center; font-size: 1.3rem; font-weight: 800; margin-top: 15px; padding: 15px; background: #fee2e2; border-radius: 8px; color: #ef4444;">
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
        const cambioContainer = Swal.getPopup().querySelector(
          "#swal-cambio-container"
        );
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
        const recibido =
          parseFloat(Swal.getPopup().querySelector("#swal-monto").value) || 0;

        if (recibido < totalVenta) {
          Swal.showValidationMessage(
            `Pago incompleto. Faltan $${(totalVenta - recibido).toFixed(2)}`
          );
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
    const motivo = motivosFiltrados.find(
      (m) => m.id === parseInt(movData.motivoId)
    );

    if (!motivo || !movData.monto) {
      return Swal.fire(
        "Error",
        "Selecciona un motivo e ingresa el monto",
        "error"
      );
    }

    const descFinal = movData.comentario
      ? `${motivo.nombre_motivo}: ${movData.comentario}`
      : motivo.nombre_motivo;

    await registrarMovimientoEfectivo(
      tipoSeleccionado,
      movData.monto,
      descFinal
    );

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
          <div class="row"><span>Cajero ID:</span> <span>#${sesion.usuario_id || 'S/N'}</span></div>
          <div class="row"><span>Apertura:</span> <span>${new Date(sesion.fecha_apertura).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span></div>
          <div class="row"><span>Cierre:</span> <span>${sesion.fecha_cierre ? new Date(sesion.fecha_cierre).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pendiente'}</span></div>
          <br/>
          <div class="row"><span>Fondo Inicial:</span> <span>${formatCurrency(sesion.monto_apertura)}</span></div>
          <div class="row"><span>Ventas y Movs:</span> <span>${formatCurrency(ingresosNetos)}</span></div>
          <div class="row total"><span>TOTAL ESPERADO:</span> <span>${formatCurrency(sesion.monto_cierre_esperado)}</span></div>
          <div class="row"><span>Efectivo Contado:</span> <span>${formatCurrency(sesion.monto_cierre_real)}</span></div>
          <br/>
          <div class="row" style="font-weight: bold; color: ${sesion.diferencia < 0 ? 'red' : 'black'};">
            <span>Diferencia:</span> <span>${formatCurrency(sesion.diferencia)}</span>
          </div>
          <div class="firma-box">
            <p>_______________________</p>
            <p>Firma del Cajero</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function(){ window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    ventanaPrint.document.close();
  };

  if (loading)
    return <div className={stylesPOS.emptyStateBox}>Sincronizando caja...</div>;

  return (
    <div className={stylesAdmin.mainContent}>
      <div className={stylesAdmin.tabContent}>
        <h2 className={`${stylesAdmin.pageTitle} ${stylesCaja.formLabelTitle}`}>
          Gestión de Caja
        </h2>

        {/* --- NAVEGACIÓN --- */}
        <div className={stylesCaja.navContainer}>
          {["COBRAR", "MOVIMIENTOS", "TURNO Y ARQUEO", "HISTORIAL"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`${stylesCaja.navButton} ${
                  activeSubTab === tab ? stylesCaja.navButtonActive : ""
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {/* --- VISTA: COBRAR --- */}
        {activeSubTab === "COBRAR" && (
          <div className={stylesAdmin.adminCard}>
            {!sesionActiva ? (
              <div className={stylesPOS.emptyStateBox}>
                Debes abrir un turno para cobrar cuentas.
              </div>
            ) : (
              <div className={stylesPOS.productGrid}>
                {cuentasPendientes.length === 0 ? (
                  <p className={stylesPOS.emptyCartText}>
                    No hay cuentas pendientes.
                  </p>
                ) : (
                  cuentasPendientes.map((venta) => (
                    <div
                      key={venta.id}
                      className={`${stylesPOS.mesaCard} ${stylesCaja.mesaCardCustom}`}
                      onClick={() => manejarCobro(venta)}
                    >
                      <div className={stylesPOS.flexBetween}>
                        <span className={stylesPOS.mesaName}>
                          Mesa {venta.mesa || "S/N"}
                        </span>
                        <span
                          className={
                            venta.estado === "por_cobrar"
                              ? stylesPOS.mesaBadgeCobrar
                              : stylesPOS.mesaBadge
                          }
                        >
                          {venta.estado === "por_cobrar"
                            ? "Por Cobrar"
                            : "Pendiente"}
                        </span>
                      </div>
                      <div className={stylesPOS.mesaTotal}>
                        {formatCurrency(venta.total)}
                      </div>
                      {/* Botón de acción visual - La validación real ocurre en manejarCobro */}
                      <button className={`${stylesPOS.btnOrder} ${stylesCaja.btnCobrar}`}>
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
          <>
            {!sesionActiva ? (
              <div className={stylesAdmin.adminCard}>
                <div className={stylesPOS.emptyStateBox}>
                  Debes abrir un turno en "TURNO Y ARQUEO" para registrar y ver movimientos.
                </div>
              </div>
            ) : (
              <div className={stylesCaja.movimientosGrid}>
                {/* Formulario Protegido */}
                <div 
                  className={`${stylesAdmin.adminCard} ${stylesCaja.formCard}`}
                  style={{ opacity: puedeEditarCaja ? 1 : 0.6 }}
                >
                  <h4 className={`${stylesAdmin.label} ${stylesCaja.formLabelTitle}`}>
                    Nuevo Movimiento
                  </h4>

                  <div className={stylesAdmin.formGroup}>
                    <label className={stylesAdmin.label}>Tipo de Flujo</label>
                    <select
                      className={stylesAdmin.loginInput}
                      value={tipoSeleccionado}
                      disabled={!puedeEditarCaja}
                      onChange={(e) => {
                        setTipoSeleccionado(e.target.value);
                        setMovData({ ...movData, motivoId: "" });
                      }}
                    >
                      <option value="">-- Seleccione Tipo --</option>
                      {tiposDisponibles.map((tipo) => (
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
                      onChange={(e) =>
                        setMovData({ ...movData, motivoId: e.target.value })
                      }
                      disabled={tipoSeleccionado === "" || !puedeEditarCaja}
                    >
                      <option value="">-- Seleccione un motivo --</option>
                      {getMotivosPorTipo(tipoSeleccionado).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre_motivo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={stylesAdmin.formGroup}>
                    <label className={stylesAdmin.label}>Monto ($)</label>
                    <input
                      type="number"
                      className={stylesAdmin.loginInput}
                      placeholder="0.00"
                      value={movData.monto}
                      readOnly={!puedeEditarCaja}
                      onChange={(e) =>
                        setMovData({ ...movData, monto: e.target.value })
                      }
                    />
                  </div>

                  <div className={stylesAdmin.formGroup}>
                    <label className={stylesAdmin.label}>
                      Comentario Adicional
                    </label>
                    <textarea
                      className={`${stylesAdmin.loginInput} ${stylesCaja.textareaCustom}`}
                      placeholder="Opcional..."
                      value={movData.comentario}
                      readOnly={!puedeEditarCaja}
                      onChange={(e) =>
                        setMovData({ ...movData, comentario: e.target.value })
                      }
                    />
                  </div>

                  {puedeEditarCaja && (
                    <button
                      className={stylesAdmin.loginBtn}
                      onClick={guardarMovimiento}
                    >
                      REGISTRAR MOVIMIENTO
                    </button>
                  )}
                </div>

                {/* Listado de movimientos */}
                <div className={stylesAdmin.adminCard}>
                  <h4 className={stylesAdmin.label}>Bitácora del Turno Actual</h4>
                  <div className={stylesCaja.tableContainer}>
                    <table className={stylesCaja.tableFull}>
                      <thead>
                        <tr className={stylesCaja.tableHeaderRow}>
                          <th className={stylesCaja.thCell}>HORA</th>
                          <th className={stylesCaja.thCell}>CONCEPTO</th>
                          <th className={stylesCaja.thCellRight}>MONTO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientos.map((m) => {
                          const tipoLimpio = m.tipo?.toLowerCase().trim();
                          const esIngreso =
                            tipoLimpio === "ingreso" || tipoLimpio === "entrada";

                          return (
                            <tr key={m.id} className={stylesCaja.trBody}>
                              <td className={stylesCaja.tdCell}>
                                {new Date(m.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className={stylesCaja.tdCellBold}>
                                {m.motivo}
                              </td>
                              <td
                                className={`${stylesCaja.tdMonto} ${
                                  esIngreso ? stylesCaja.textGreen : stylesCaja.textRed
                                }`}
                              >
                                {esIngreso ? "+" : "-"}
                                {formatCurrency(m.monto)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* --- VISTA: TURNO Y ARQUEO --- */}
        {activeSubTab === "TURNO Y ARQUEO" && (
          <div className={stylesCaja.fadeIn}>
            {!sesionActiva ? (
              <div className={`${stylesAdmin.adminCard} ${stylesCaja.cajaCerradaCard}`}>
                <div className={stylesCaja.cashIcon}>💵</div>
                <h2 className={stylesCaja.cajaCerradaTitle}>
                  Caja Cerrada
                </h2>
                <p className={stylesCaja.cajaCerradaDesc}>
                  Ingresa el monto de efectivo base (fondo de caja) para
                  aperturar e iniciar la jornada.
                </p>

                <div className={stylesCaja.cajaCerradaFormWrapper}>
                  <label className={`${stylesAdmin.label} ${stylesCaja.cajaCerradaLabel}`}>
                    Fondo de Caja ($)
                  </label>
                  <input
                    type="number"
                    className={`${stylesAdmin.loginInput} ${stylesCaja.cajaCerradaInput}`}
                    value={montoApertura}
                    readOnly={!puedeEditarCaja}
                    onChange={(e) => setMontoApertura(e.target.value)}
                    placeholder="0.00"
                  />
                  {puedeEditarCaja ? (
                    <button
                      className={`${stylesAdmin.loginBtn} ${stylesCaja.cajaCerradaBtn}`}
                      onClick={() => abrirTurno(montoApertura)}
                    >
                      INICIAR JORNADA
                    </button>
                  ) : (
                    <p style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: 'bold', marginTop: '10px' }}>
                      Requiere permiso de gestión de caja para aperturar.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className={stylesCaja.turnoAbiertoGrid}>
                {/* Tarjeta de Estado Actual */}
                <div className={`${stylesAdmin.adminCard} ${stylesCaja.turnoActivoCard}`}>
                  <div className={stylesCaja.turnoHeaderRow}>
                    <div>
                      <h3 className={stylesCaja.turnoTitle}>
                        Turno Activo
                      </h3>
                      <span className={stylesCaja.turnoSubtitle}>
                        En curso
                      </span>
                    </div>
                    <span className={stylesCaja.badgeAbierta}>
                      ● ABIERTA
                    </span>
                  </div>

                  <div className={stylesCaja.dataList}>
                    <div className={stylesCaja.dataRow}>
                      <span className={stylesCaja.dataLabel}>Fecha/Hora Apertura</span>
                      <span className={stylesCaja.dataValue}>
                        {new Date(sesionActiva.fecha_apertura).toLocaleString(
                          [],
                          { dateStyle: "short", timeStyle: "short" }
                        )}
                      </span>
                    </div>
                    <div className={stylesCaja.dataRow}>
                      <span className={stylesCaja.dataLabel}>Cajero ID</span>
                      <span className={stylesCaja.dataValue}>
                        #{sesionActiva.usuario_id || "S/N"}
                      </span>
                    </div>
                    <div className={stylesCaja.fondoRow}>
                      <span className={stylesCaja.dataLabel}>Fondo Inicial</span>
                      <span className={stylesCaja.fondoValue}>
                        {formatCurrency(sesionActiva.monto_apertura)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta de Cierre/Arqueo Protegida */}
                <div 
                  className={`${stylesAdmin.adminCard} ${stylesCaja.arqueoCard}`}
                  style={{ opacity: puedeEditarCaja ? 1 : 0.6 }}
                >
                  <h3 className={stylesCaja.arqueoTitle}>
                    Arqueo de Caja
                  </h3>
                  <p className={stylesCaja.arqueoDesc}>
                    Ingresa el efectivo físico total que hay en la caja
                    (incluyendo el fondo inicial) para calcular diferencias.
                  </p>

                  <label className={`${stylesAdmin.label} ${stylesCaja.arqueoLabel}`}>
                    Efectivo en Cajón ($)
                  </label>
                  <input
                    type="number"
                    className={`${stylesAdmin.loginInput} ${stylesCaja.arqueoInput}`}
                    value={montoArqueo}
                    readOnly={!puedeEditarCaja}
                    onChange={(e) => setMontoArqueo(e.target.value)}
                    placeholder="0.00"
                  />

                  {puedeEditarCaja && (
                    <button
                      className={`${stylesAdmin.loginBtn} ${stylesCaja.arqueoBtn}`}
                      onClick={() => cerrarTurno(montoArqueo)}
                    >
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
          <div className={stylesAdmin.adminCard}>
            <div className={stylesPOS.historyGrid}>
              {historial.map((h) => (
                <div key={h.id} className={`${stylesPOS.historyCard} ${stylesCaja.historyCardRelative}`}>
                  
                  {/* BOTÓN DE IMPRIMIR REPORTE */}
                  <button
                    onClick={() => imprimirReporte(h)}
                    className={stylesCaja.printBtn}
                    title="Imprimir Corte de Caja"
                  >
                    🖨️
                  </button>

                  <div>
                    <span className={stylesAdmin.label}>
                      ID Sesión: #{h.id?.toString().slice(-5) || "S/N"}
                    </span>
                    <div className={stylesCaja.historyDate}>
                      {new Date(h.fecha_apertura).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={stylesCaja.historyRightBox}>
                    <div className={stylesPOS.historyCardAmount}>
                      {formatCurrency(h.monto_cierre_real || 0)}
                    </div>
                    <span
                      className={
                        h.diferencia < 0
                          ? stylesPOS.mesaBadgeCobrar
                          : stylesPOS.mesaBadge
                      }
                    >
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