import React from "react";
import stylesAdmin from "../../../../assets/styles/EstilosGenerales.module.css";
import s from "../../../../assets/styles/ServicioTab.module.css";
import { formatCurrency } from "../../../../utils/formatCurrency";

export const HistorialTurnosView = ({ historial, sucursalId }) => {
  
  const imprimirReporte = (sesion) => {
    const ventanaPrint = window.open('', '_blank');
    // Calculamos ingresos netos para el ticket
    const ingresosNetos = parseFloat(sesion.monto_cierre_esperado || 0) - parseFloat(sesion.monto_apertura || 0);

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
          <div class="row" style="font-weight:bold; color:${parseFloat(sesion.diferencia) < 0 ? 'red' : 'black'}">
            <span>DIFERENCIA:</span> <span>${formatCurrency(sesion.diferencia)}</span>
          </div>
          <div class="footer"><p>_______________________</p><p>Firma Responsable</p></div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `);
    ventanaPrint.document.close();
  };

  return (
    <div className={stylesAdmin.adminCard}>
      <div className={s.historyGrid}>
        {historial.length === 0 ? (
          <div className={stylesAdmin.emptyState}>No hay turnos previos registrados.</div>
        ) : (
          historial.map((h) => (
            <div key={h.id} className={`${s.historyCard} ${s.historyCardRelative}`}>
              <button 
                onClick={() => imprimirReporte(h)} 
                className={s.printBtn} 
                title="Reimprimir Ticket"
              >
                🖨️
              </button>
              <div>
                <small className={stylesAdmin.textMuted}>Folio: {h.id.slice(0,8)}</small>
                <div className={s.historyDate}>{new Date(h.fecha_apertura).toLocaleDateString()}</div>
                <div className={s.historyCardTime}>
                  {new Date(h.fecha_apertura).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                  {new Date(h.fecha_cierre).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
  );
};