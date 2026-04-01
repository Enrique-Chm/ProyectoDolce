import React from "react";
import { CajaService } from "./Caja.service";
import stylesAdmin from "../../../../assets/styles/EstilosGenerales.module.css";
import s from "../../../../assets/styles/ServicioTab.module.css";
import { formatCurrency } from "../../../../utils/formatCurrency";
import Swal from "sweetalert2";

export const CobrarView = ({
  sesionActiva,
  cuentasPendientes,
  cuentasCobradas,
  puedeEditarCaja,
  refrescarTodo,
  tiposDescuentoCatalogo = [] 
}) => {
  const mesasPorCobrar = cuentasPendientes.filter(v => v.estado === 'por_cobrar');
  const mesasActivas = cuentasPendientes.filter(v => v.estado !== 'por_cobrar');

  const manejarCobro = async (venta) => {
    if (!puedeEditarCaja) return Swal.fire("Acceso Denegado", "No tienes permisos para procesar cobros.", "warning");

    const totalVentaOriginal = parseFloat(venta.total) || 0;

    const opcionesDescuento = tiposDescuentoCatalogo.map(
      (t) => `<option value="${t.id}" data-tipo="${t.tipo_calculo}" data-valor="${t.valor_defecto}">${t.nombre}</option>`
    ).join("");

    const { value: resultado, isConfirmed } = await Swal.fire({
      title: `Mesa ${venta.mesa || "S/N"}`,
      width: '450px',
      html: `
        <div style="display: flex; flex-direction: column; gap: 15px; font-family: inherit;">
          <div style="background: var(--color-primary); color: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);">
            <span style="font-size: 0.85rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Total a Liquidar</span>
            <div id="swal-total-display" style="font-size: 3rem; font-weight: 800; margin: 5px 0; color: #ffffff;">${formatCurrency(totalVentaOriginal)}</div>
            <div style="font-size: 0.85rem; opacity: 0.6;">Original: ${formatCurrency(totalVentaOriginal)}</div>
          </div>
          <div style="text-align: left;">
            <button id="btn-toggle-descuento" type="button" style="width: 100%; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; color: #475569; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
              <span>Aplicar Descuento</span>
              <span id="icon-descuento">▼</span>
            </button>
            
            <div id="container-descuento" style="display: none; background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; margin-top: -5px;">
              <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 10px;">
                <select id="swal-tipo-descuento" class="swal2-select" style="width: 100%; margin: 0; font-size: 0.85rem; height: 40px; border-radius: 8px; border-color: #cbd5e1;">
                  <option value="">Sin Descuento</option>
                  ${opcionesDescuento}
                </select>
                <input id="swal-descuento" type="number" class="swal2-input" placeholder="0.00" disabled style="width: 100%; margin: 0; font-size: 1rem; height: 40px; border-radius: 8px; text-align: right; border-color: #cbd5e1;" />
              </div>
              <input id="swal-motivo-descuento" type="text" class="swal2-input" placeholder="Nota o justificación..." style="width: 100%; margin: 10px 0 0 0; font-size: 0.85rem; height: 35px; border-radius: 8px; border-color: #cbd5e1;" />
            </div>
          </div>
          <div style="text-align: left; padding: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="font-weight: 700; font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Método de Pago</label>
            </div>
            <select id="swal-metodo" class="swal2-select" style="width: 100%; margin: 0 0 15px 0; font-size: 1.1rem; font-weight: 600; height: 45px; border-radius: 8px; border-color: #cbd5e1;">
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta Bancaria</option>
              <option value="transferencia">Transferencia / QR</option>
            </select>

            <label style="font-weight: 700; font-size: 0.75rem; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 8px;">Monto Recibido</label>
            <input id="swal-monto" type="number" step="0.01" class="swal2-input" placeholder="0.00" style="width: 100%; margin: 0; font-size: 2.2rem; text-align: right; font-weight: 800; color: #1e293b; border: 2px solid #3b82f6; border-radius: 12px; height: 70px; background: #fff;" />
            <div id="quick-cash" style="display: flex; gap: 6px; justify-content: center; margin-top: 10px;">
               ${[20, 50, 100, 200, 500].map(val => `<button type="button" class="quick-btn" data-val="${val}" style="flex: 1; padding: 10px 0; border: 1px solid #cbd5e1; border-radius: 8px; background: white; cursor: pointer; font-weight: 700; color: #475569; font-size: 0.8rem; transition: all 0.2s;">+$${val}</button>`).join('')}
            </div>
          </div>
          <div id="swal-cambio-container" style="padding: 18px; border-radius: 12px; text-align: center; font-size: 1.6rem; font-weight: 800; border: 1px solid transparent; transition: all 0.2s;">
            Falta: ${formatCurrency(totalVentaOriginal)}
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "FINALIZAR",
      confirmButtonColor: "#059669",
      cancelButtonText: "Volver",
      didOpen: () => {
        const popup = Swal.getPopup();
        const montoInput = popup.querySelector("#swal-monto");
        const tipoDescuentoSelect = popup.querySelector("#swal-tipo-descuento");
        const descuentoInput = popup.querySelector("#swal-descuento");
        const cambioContainer = popup.querySelector("#swal-cambio-container");
        const metodoSelect = popup.querySelector("#swal-metodo");
        const totalDisplay = popup.querySelector("#swal-total-display");
        
        // Elementos del Toggle
        const btnToggle = popup.querySelector("#btn-toggle-descuento");
        const containerDescuento = popup.querySelector("#container-descuento");
        const iconDescuento = popup.querySelector("#icon-descuento");

        const recalcular = () => {
          const descuento = parseFloat(descuentoInput.value) || 0;
          const descuentoAplicado = Math.min(descuento, totalVentaOriginal);
          const totalFinal = totalVentaOriginal - descuentoAplicado;
          
          totalDisplay.innerHTML = `$${totalFinal.toLocaleString('es-MX', {minimumFractionDigits: 2})}`;

          const recibido = parseFloat(montoInput.value) || 0;
          const diferencia = recibido - totalFinal;

          if (diferencia < 0) {
            cambioContainer.style.background = "#fff1f2";
            cambioContainer.style.color = "#be123c";
            cambioContainer.style.borderColor = "#fecaca";
            cambioContainer.innerHTML = `<span style="font-size: 0.75rem; display: block; opacity: 0.8; margin-bottom: 2px;">RESTANTE</span> $${Math.abs(diferencia).toFixed(2)}`;
          } else {
            cambioContainer.style.background = "#f0fdf4";
            cambioContainer.style.color = "#15803d";
            cambioContainer.style.borderColor = "#bbf7d0";
            cambioContainer.innerHTML = `<span style="font-size: 0.75rem; display: block; opacity: 0.8; margin-bottom: 2px;">CAMBIO</span> $${diferencia.toFixed(2)}`;
          }
        };

        // Lógica de colapsable
        btnToggle.addEventListener("click", () => {
          const isHidden = containerDescuento.style.display === "none";
          containerDescuento.style.display = isHidden ? "block" : "none";
          iconDescuento.innerHTML = isHidden ? "▲" : "▼";
          btnToggle.style.borderRadius = isHidden ? "8px 8px 0 0" : "8px";
        });

        // Lógica de botones rápidos
        popup.querySelectorAll(".quick-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const extra = parseFloat(btn.getAttribute("data-val"));
            const actual = parseFloat(montoInput.value) || 0;
            montoInput.value = (actual + extra).toFixed(2);
            recalcular();
          });
        });

        tipoDescuentoSelect.addEventListener("change", (e) => {
          const seleccion = e.target.options[e.target.selectedIndex];
          if (!seleccion.value) {
            descuentoInput.value = "";
            descuentoInput.disabled = true;
          } else {
            const tipoCalculo = seleccion.getAttribute("data-tipo");
            const valorDefecto = parseFloat(seleccion.getAttribute("data-valor")) || 0;

            if (tipoCalculo === "porcentaje") {
              descuentoInput.value = ((totalVentaOriginal * valorDefecto) / 100).toFixed(2);
              descuentoInput.disabled = true;
            } else if (tipoCalculo === "monto_fijo") {
              descuentoInput.value = valorDefecto.toFixed(2);
              descuentoInput.disabled = true;
            } else {
              descuentoInput.value = "";
              descuentoInput.disabled = false;
              descuentoInput.focus();
            }
          }
          recalcular();
        });

        metodoSelect.addEventListener("change", () => {
          if (metodoSelect.value !== "efectivo") {
            const descuento = parseFloat(descuentoInput.value) || 0;
            const totalFinal = totalVentaOriginal - Math.min(descuento, totalVentaOriginal);
            montoInput.value = totalFinal.toFixed(2);
          } else {
            montoInput.value = "";
          }
          recalcular();
        });

        montoInput.addEventListener("input", recalcular);
        descuentoInput.addEventListener("input", recalcular);

        setTimeout(() => montoInput.focus(), 200);
      },
      preConfirm: () => {
        const popup = Swal.getPopup();
        const metodo = popup.querySelector("#swal-metodo").value;
        const recibido = parseFloat(popup.querySelector("#swal-monto").value) || 0;
        const tipoDescuentoId = popup.querySelector("#swal-tipo-descuento").value;
        const descuento = parseFloat(popup.querySelector("#swal-descuento").value) || 0;
        const motivoDescuento = popup.querySelector("#swal-motivo-descuento").value.trim();
        
        const descuentoAplicado = Math.min(descuento, totalVentaOriginal);
        const totalFinal = totalVentaOriginal - descuentoAplicado;

        if (tipoDescuentoId && descuentoAplicado <= 0) {
            Swal.showValidationMessage(`Indica un monto de descuento válido.`);
            return false;
        }

        if (recibido < totalFinal) {
          Swal.showValidationMessage(`Faltan $${(totalFinal - recibido).toFixed(2)}`);
          return false;
        }

        return { 
          metodo, 
          recibido, 
          tipoDescuentoId: tipoDescuentoId ? parseInt(tipoDescuentoId) : null,
          descuento: descuentoAplicado, 
          motivoDescuento, 
          totalFinal 
        };
      },
    });

    if (isConfirmed && resultado) {
      const { error } = await CajaService.finalizarVenta(venta.id, {
        estado: "pagado",
        metodo_pago: resultado.metodo,
        tipo_descuento_id: resultado.tipoDescuentoId,
        descuento: resultado.descuento,
        motivo_descuento: resultado.motivoDescuento,
        total: resultado.totalFinal
      });

      if (!error) {
        Swal.fire({
          icon: "success", 
          title: "Venta Pagada", 
          text: `Cambio: $${(resultado.recibido - resultado.totalFinal).toFixed(2)}`,
          timer: 2000, 
          showConfirmButton: false,
        });
        refrescarTodo(); 
      } else {
        Swal.fire("Error", "No se pudo cerrar la venta en el servidor", "error");
      }
    }
  };

  return (
    <div className={stylesAdmin.adminCard}>
      {!sesionActiva ? (
        <div className={stylesAdmin.emptyState}>El turno está cerrado. Ve a "TURNO Y ARQUEO" para iniciar.</div>
      ) : (
        <>
          {cuentasPendientes.length === 0 && cuentasCobradas.length === 0 ? (
            <div className={stylesAdmin.emptyState}>No hay cuentas activas ni historial reciente en este turno.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* SECCIÓN 1: MESAS POR COBRAR */}
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
                        <div className={s.mesaTotal} style={{ marginTop: '5px' }}>{formatCurrency(venta.total)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN 2: MESAS ACTIVAS */}
              {mesasActivas.length > 0 && (
                <div>
                  <h3 className={stylesAdmin.cardTitle} style={{ marginBottom: '5px', color: 'var(--color-success)', borderTop: mesasPorCobrar.length > 0 ? '1px dashed var(--color-border)' : 'none', paddingTop: mesasPorCobrar.length > 0 ? '20px' : '0' }}>
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
                        <div className={s.mesaTotal} style={{ marginTop: '5px' }}>{formatCurrency(venta.total)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN 3: HISTORIAL DEL TURNO */}
              {cuentasCobradas.length > 0 && (
                <div>
                  <h3 className={stylesAdmin.cardTitle} style={{ marginBottom: '5px', color: 'var(--color-muted)', borderTop: (mesasPorCobrar.length > 0 || mesasActivas.length > 0) ? '1px dashed var(--color-border)' : 'none', paddingTop: '20px' }}>
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
                          <span className={s.mesaBadgeLiquidada} style={{ textAlign: 'center' }}>
                            LIQUIDADA
                          </span>
                        </div>
                        <div className={s.mesaTotal} style={{ marginTop: '5px', color: venta.descuento > 0 ? '#ef4444' : 'inherit' }}>
                            {formatCurrency(venta.total)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '5px' }}>
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
  );
};