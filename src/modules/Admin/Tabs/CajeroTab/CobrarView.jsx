// Archivo: src/modules/Admin/Tabs/CajeroTab/CobrarView.jsx
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
  tiposDescuentoCatalogo = [] // 🚀 RECIBIMOS EL CATÁLOGO DESDE EL PADRE (useCajeroTab)
}) => {
  const mesasPorCobrar = cuentasPendientes.filter(v => v.estado === 'por_cobrar');
  const mesasActivas = cuentasPendientes.filter(v => v.estado !== 'por_cobrar');

  // Lógica de Cobro Directo con Calculadora de Cambio y Catálogo de Descuentos
  const manejarCobro = async (venta) => {
    if (!puedeEditarCaja) return Swal.fire("Acceso Denegado", "No tienes permisos para procesar cobros.", "warning");

    const totalVentaOriginal = parseFloat(venta.total) || 0;

    // Construimos las opciones del select a partir del catálogo dinámico
    const opcionesDescuento = tiposDescuentoCatalogo.map(
      (t) => `<option value="${t.id}" data-tipo="${t.tipo_calculo}" data-valor="${t.valor_defecto}">${t.nombre}</option>`
    ).join("");

    const { value: resultado, isConfirmed } = await Swal.fire({
      title: `Cobrar Mesa ${venta.mesa || "S/N"}`,
      html: `
        <div style="text-align: left; font-size: 1.1rem; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
            <span style="color: #666;">Total Original:</span> <span style="font-weight: bold;">${formatCurrency(totalVentaOriginal)}</span><br/>
            <span style="color: #666;">Total a liquidar:</span> <br/>
            <strong id="swal-total-display" style="font-size: 2.2rem; color: #2563eb;">${formatCurrency(totalVentaOriginal)}</strong>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 10px; text-align: left; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px dashed #cbd5e1;">
            <div>
                <label style="font-weight: bold; font-size: 0.85rem; color: #475569;">Tipo de Descuento / Cortesía:</label>
                <select id="swal-tipo-descuento" class="swal2-select" style="width: 100%; margin: 5px 0 0 0; font-size: 0.9rem; padding: 8px; height: auto;">
                    <option value="">-- Sin Descuento --</option>
                    ${opcionesDescuento}
                </select>
            </div>
            <div>
                <label style="font-weight: bold; font-size: 0.85rem; color: #475569;">Monto a descontar ($):</label>
                <input id="swal-descuento" type="number" step="0.01" class="swal2-input" placeholder="0.00" disabled style="width: 100%; margin: 5px 0 0 0; font-size: 1rem; padding: 8px; height: auto;" />
            </div>
            <div>
                <label style="font-weight: bold; font-size: 0.85rem; color: #475569;">Notas Adicionales (Opcional):</label>
                <input id="swal-motivo-descuento" type="text" class="swal2-input" placeholder="Justificación extra..." style="width: 100%; margin: 5px 0 0 0; font-size: 0.9rem; padding: 8px; height: auto;" />
            </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 15px; text-align: left; margin-top: 15px;">
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
                Falta: ${formatCurrency(totalVentaOriginal)}
            </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "FINALIZAR VENTA",
      confirmButtonColor: "#059669",
      cancelButtonText: "Volver",
      didOpen: () => {
        const montoInput = Swal.getPopup().querySelector("#swal-monto");
        const tipoDescuentoSelect = Swal.getPopup().querySelector("#swal-tipo-descuento");
        const descuentoInput = Swal.getPopup().querySelector("#swal-descuento");
        const cambioContainer = Swal.getPopup().querySelector("#swal-cambio-container");
        const metodoSelect = Swal.getPopup().querySelector("#swal-metodo");
        const totalDisplay = Swal.getPopup().querySelector("#swal-total-display");

        // Función para recalcular todo en tiempo real
        const recalcular = () => {
          const descuento = parseFloat(descuentoInput.value) || 0;
          const descuentoAplicado = Math.min(descuento, totalVentaOriginal);
          const totalFinal = totalVentaOriginal - descuentoAplicado;
          
          totalDisplay.innerHTML = `$${totalFinal.toFixed(2)}`;

          const recibido = parseFloat(montoInput.value) || 0;
          const diferencia = recibido - totalFinal;

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
        };

        // Lógica al seleccionar un Tipo de Descuento del Catálogo
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
              descuentoInput.disabled = true; // Valor fijo calculado
            } else if (tipoCalculo === "monto_fijo") {
              descuentoInput.value = valorDefecto.toFixed(2);
              descuentoInput.disabled = true; // Valor fijo
            } else {
              // Si es "libre", el cajero ingresa el monto manualmente
              descuentoInput.value = "";
              descuentoInput.disabled = false;
              descuentoInput.focus();
            }
          }
          recalcular();
        });

        // Al cambiar método de pago, si no es efectivo, sugerimos el total exacto
        metodoSelect.addEventListener("change", () => {
          if (metodoSelect.value !== "efectivo") {
            const descuento = parseFloat(descuentoInput.value) || 0;
            const totalFinal = totalVentaOriginal - Math.min(descuento, totalVentaOriginal);
            montoInput.value = totalFinal.toFixed(2);
            recalcular();
          }
        });

        montoInput.addEventListener("input", recalcular);
        descuentoInput.addEventListener("input", recalcular);

        setTimeout(() => montoInput.focus(), 200);
      },
      preConfirm: () => {
        const metodo = Swal.getPopup().querySelector("#swal-metodo").value;
        const recibido = parseFloat(Swal.getPopup().querySelector("#swal-monto").value) || 0;
        const tipoDescuentoId = Swal.getPopup().querySelector("#swal-tipo-descuento").value;
        const descuento = parseFloat(Swal.getPopup().querySelector("#swal-descuento").value) || 0;
        const motivoDescuento = Swal.getPopup().querySelector("#swal-motivo-descuento").value.trim();
        
        const descuentoAplicado = Math.min(descuento, totalVentaOriginal);
        const totalFinal = totalVentaOriginal - descuentoAplicado;

        if (tipoDescuentoId && descuentoAplicado <= 0) {
            Swal.showValidationMessage(`Debes indicar un monto de descuento válido mayor a $0.`);
            return false;
        }

        if (recibido < totalFinal) {
          Swal.showValidationMessage(`El pago es insuficiente. Faltan $${(totalFinal - recibido).toFixed(2)}`);
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
          timer: 2500, 
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
              
              {/* SECCIÓN 1: MESAS POR COBRAR (PRIORIDAD ALTA) */}
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

              {/* SECCIÓN 2: MESAS ACTIVAS / CONSUMIENDO */}
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

              {/* SECCIÓN 3: MESAS COBRADAS EN ESTE TURNO */}
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
                        <div className={s.mesaTotal} style={{ marginTop: '15px', color: venta.descuento > 0 ? '#ef4444' : 'inherit' }}>
                            {formatCurrency(venta.total)}
                        </div>
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
  );
};