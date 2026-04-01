// Archivo: src/modules/Admin/Tabs/CajeroTab/MovimientosView.jsx
import React, { useState } from "react";
import stylesAdmin from "../../../../assets/styles/EstilosGenerales.module.css";
import s from "../../../../assets/styles/ServicioTab.module.css";
import { formatCurrency } from "../../../../utils/formatCurrency";
import Swal from "sweetalert2";

export const MovimientosView = ({
  sesionActiva,
  puedeEditarCaja,
  tiposDisponibles,
  getMotivosPorTipo,
  registrarMovimientoEfectivo, 
  movimientos
}) => {
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [movData, setMovData] = useState({ motivoId: "", monto: "", comentario: "" });

  const guardarMovimiento = async () => {
    if (!puedeEditarCaja) return;
    
    const motivosFiltrados = getMotivosPorTipo(tipoSeleccionado);
    const motivo = motivosFiltrados.find(m => m.id === parseInt(movData.motivoId));

    if (!motivo || !movData.monto) {
      return Swal.fire("Atención", "Selecciona un motivo y el monto exacto", "warning");
    }

    const descFinal = movData.comentario 
      ? `${motivo.nombre_motivo}: ${movData.comentario}` 
      : motivo.nombre_motivo;

    // Ejecutamos la función que viene del hook
    await registrarMovimientoEfectivo(tipoSeleccionado, movData.monto, descFinal);
    
    // Limpiamos el formulario
    setMovData({ motivoId: "", monto: "", comentario: "" });
    setTipoSeleccionado("");
  };

  return (
    <div className={stylesAdmin.splitLayout}>
      {!sesionActiva ? (
        <div className={stylesAdmin.emptyState} style={{ gridColumn: '1/-1' }}>
          Acción no disponible sin turno abierto.
        </div>
      ) : (
        <>
          {/* Formulario de Registro */}
          <aside className={stylesAdmin.adminCard} style={{ opacity: puedeEditarCaja ? 1 : 0.6 }}>
            <h3 className={stylesAdmin.cardTitle}>Entrada / Salida de Efectivo</h3>
            
            <div className={stylesAdmin.formGroup}>
              <label className={stylesAdmin.label}>Tipo de Flujo</label>
              <select 
                className={stylesAdmin.inputField} 
                value={tipoSeleccionado} 
                disabled={!puedeEditarCaja} 
                onChange={(e) => { 
                  setTipoSeleccionado(e.target.value); 
                  setMovData({ ...movData, motivoId: "" }); 
                }}
              >
                <option value="">-- Seleccione --</option>
                {tiposDisponibles.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className={stylesAdmin.formGroup}>
              <label className={stylesAdmin.label}>Concepto</label>
              <select 
                className={stylesAdmin.inputField} 
                value={movData.motivoId} 
                onChange={e => setMovData({ ...movData, motivoId: e.target.value })} 
                disabled={!tipoSeleccionado || !puedeEditarCaja}
              >
                <option value="">-- Seleccione Motivo --</option>
                {getMotivosPorTipo(tipoSeleccionado).map(m => (
                  <option key={m.id} value={m.id}>{m.nombre_motivo}</option>
                ))}
              </select>
            </div>

            <div className={stylesAdmin.formGroup}>
              <label className={stylesAdmin.label}>Monto ($)</label>
              <input 
                type="number" 
                className={stylesAdmin.inputField} 
                placeholder="0.00" 
                value={movData.monto} 
                readOnly={!puedeEditarCaja} 
                onChange={e => setMovData({ ...movData, monto: e.target.value })} 
              />
            </div>

            <div className={stylesAdmin.formGroup}>
              <label className={stylesAdmin.label}>Observaciones</label>
              <textarea 
                className={`${stylesAdmin.inputField} ${s.textareaCustom}`} 
                placeholder="Ej. Pago a proveedor..." 
                value={movData.comentario} 
                onChange={e => setMovData({ ...movData, comentario: e.target.value })} 
              />
            </div>

            <button 
              className={`${stylesAdmin.btn} ${stylesAdmin.btnPrimary} ${stylesAdmin.btnFull}`} 
              onClick={guardarMovimiento} 
              disabled={!puedeEditarCaja}
            >
              REGISTRAR MOVIMIENTO
            </button>
          </aside>

          {/* Tabla de Movimientos */}
          <div className={`${stylesAdmin.adminCard} ${stylesAdmin.tableContainer}`}>
            <h3 className={s.cardTitle} style={{ margin: 15 }}>Historial de Movimientos</h3>
            <table className={stylesAdmin.table} style={{ minWidth: '500px' }}>
              <thead className={stylesAdmin.thead}>
                <tr>
                  <th className={stylesAdmin.th}>HORA</th>
                  <th className={stylesAdmin.th}>CONCEPTO / USUARIO</th>
                  <th className={stylesAdmin.th} style={{ textAlign: 'right' }}>MONTO</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan="3" className={stylesAdmin.emptyState} style={{ padding: "40px 0" }}>
                      No hay movimientos registrados en este turno.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => {
                    const esIngreso = ["ingreso", "entrada", "venta"].includes(m.tipo?.toLowerCase().trim());
                    return (
                      <tr key={m.id}>
                        <td className={stylesAdmin.td}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className={stylesAdmin.td}>
                          <strong>{m.motivo}</strong>
                          {/* 💡 AQUI MOSTRAMOS AL USUARIO RESPONSABLE DEL MOVIMIENTO */}
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            👤 Por: {m.usuarios_internos?.nombre || 'Sistema'}
                          </div>
                        </td>
                        <td className={`${stylesAdmin.td} ${s.tdMonto} ${esIngreso ? s.textGreen : s.textRed}`}>
                          {esIngreso ? "+" : "-"}{formatCurrency(m.monto)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};