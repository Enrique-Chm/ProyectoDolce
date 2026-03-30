// Archivo: src/modules/Admin/Tabs/CajeroTab/TurnoView.jsx
import React, { useState } from "react";
import stylesAdmin from "../../../../assets/styles/EstilosGenerales.module.css";
import s from "../../../../assets/styles/ServicioTab.module.css";
import { formatCurrency } from "../../../../utils/formatCurrency";

export const TurnoView = ({ sesionActiva, abrirTurno, cerrarTurno }) => {
  const [montoApertura, setMontoApertura] = useState("");
  const [montoArqueo, setMontoArqueo] = useState(""); // Efectivo
  const [montoTarjeta, setMontoTarjeta] = useState(""); // 🚀 NUEVO: Tarjeta / Vouchers

  return (
    <div className={stylesAdmin.fadeIn}>
      {!sesionActiva ? (
        /* --- ESTADO: CAJA CERRADA --- */
        <div className={`${stylesAdmin.adminCard} ${s.cajaCerradaCard}`}>
          <div className={s.cashIcon}>🏪</div>
          <h2 className={s.cajaCerradaTitle}>Caja Cerrada</h2>
          <p className={s.cajaCerradaDesc}>Inicia el fondo de caja para comenzar a operar.</p>
          
          <div className={s.cajaCerradaFormWrapper}>
            <label className={`${stylesAdmin.label} ${s.cajaCerradaLabel}`}>Fondo Inicial de Apertura ($)</label>
            <input 
              type="number" 
              className={`${stylesAdmin.inputField} ${s.cajaCerradaInput}`} 
              value={montoApertura} 
              onChange={e => setMontoApertura(e.target.value)} 
              placeholder="0.00" 
            />
            <button 
              className={`${stylesAdmin.btn} ${stylesAdmin.btnPrimary} ${stylesAdmin.btnFull} ${s.cajaCerradaBtn}`} 
              onClick={() => {
                abrirTurno(montoApertura);
                setMontoApertura("");
              }}
            >
              ABRIR TURNO AHORA
            </button>
          </div>
        </div>
      ) : (
        /* --- ESTADO: CAJA ABIERTA --- */
        <div className={`${stylesAdmin.splitLayout} ${s.turnoAbiertoGrid}`}>
          
          {/* Lado Izquierdo: Resumen del Turno */}
          <div className={`${stylesAdmin.adminCard} ${s.turnoActivoCard}`}>
            <div className={s.turnoHeaderRow}>
              <h3 className={stylesAdmin.cardTitle}>Resumen de Turno</h3>
              <span className={stylesAdmin.badgeSuccess}>ACTIVO</span>
            </div>
            
            <div className={s.dataList}>
              <div className={s.dataRow}>
                <span className={s.dataLabel}>Cajero Responsable:</span>
                <span className={s.dataValue}>#{sesionActiva.usuario_id}</span>
              </div>
              <div className={s.dataRow}>
                <span className={s.dataLabel}>Abierto desde:</span>
                <span className={s.dataValue}>
                  {new Date(sesionActiva.fecha_apertura).toLocaleString()}
                </span>
              </div>
              <div className={s.fondoRow}>
                <span className={s.dataLabel}>Fondo Inicial:</span>
                <span className={s.fondoValue}>{formatCurrency(sesionActiva.monto_apertura)}</span>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Formulario de Arqueo */}
          <div className={`${stylesAdmin.adminCard} ${s.arqueoCard}`}>
            <h3 className={stylesAdmin.cardTitle}>Arqueo Final</h3>
            <p className={s.arqueoDesc}>Cuenta el efectivo y suma los vouchers de terminal para cerrar el turno.</p>
            
            <div className={stylesAdmin.formGroup}>
              <label className={stylesAdmin.label}>Total Efectivo Contado ($)</label>
              <input 
                type="number" 
                className={`${stylesAdmin.inputField} ${s.arqueoInput}`} 
                value={montoArqueo} 
                onChange={e => setMontoArqueo(e.target.value)} 
                placeholder="0.00" 
              />
            </div>

            {/* 🚀 NUEVO CAMPO: Total Tarjeta */}
            <div className={stylesAdmin.formGroup} style={{ marginTop: '15px' }}>
              <label className={stylesAdmin.label}>Total Tarjeta (Vouchers) ($)</label>
              <input 
                type="number" 
                className={`${stylesAdmin.inputField} ${s.arqueoInput}`} 
                value={montoTarjeta} 
                onChange={e => setMontoTarjeta(e.target.value)} 
                placeholder="0.00" 
              />
            </div>
            
            <button 
              className={`${stylesAdmin.btn} ${stylesAdmin.btnFull} ${s.arqueoBtn}`} 
              style={{ marginTop: '20px' }}
              onClick={() => {
                // 🚀 AHORA ENVIAMOS AMBOS PARÁMETROS AL HOOK
                cerrarTurno(montoArqueo, montoTarjeta); 
                setMontoArqueo("");
                setMontoTarjeta("");
              }}
            >
              🔒 CERRAR Y GENERAR CORTE
            </button>
          </div>

        </div>
      )}
    </div>
  );
};