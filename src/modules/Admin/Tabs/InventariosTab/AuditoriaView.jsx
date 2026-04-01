// Archivo: src/modules/Admin/Tabs/InventariosTab/AuditoriaView.jsx
import React from "react";

export const AuditoriaView = ({
  s,
  loading,
  contrasteData,
  contrasteDataFiltrado,
  conteos,
  actualizarConteo,
  auditados,
  filtroAuditoria,
  setFiltroAuditoria,
  filtroFechas,
  setFiltroFechas,
  generarContraste,
  guardarAuditoriaMasiva,
  handleGuardarConteo,
  puedeEditar,
  usuarioId
}) => {
  return (
    <div className={`${s.adminCard} ${s.tableContainer}`}>
      <div className={s.auditHeader}>
        <div>
          <h3 className={s.cardTitle} style={{ margin: 0 }}>
            Auditoría y Cierre
          </h3>
          {contrasteData.length > 0 && (
            <div
              style={{ fontSize: "13px", marginTop: "5px", fontWeight: "700" }}
              className={auditados.length === contrasteData.length ? s.textSuccess : s.textPrimary}
            >
              Progreso: {auditados.length} de {contrasteData.length}
            </div>
          )}
        </div>

        {/* CONTENEDOR DE FILTROS Y BOTÓN MASIVO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          {Object.values(conteos).filter(v => v !== '').length > 0 && (
            <button
              className={`${s.btn} ${s.btnSuccess}`}
              style={{ padding: '8px 20px', fontWeight: 'bold', boxShadow: 'var(--shadow-md)' }}
              onClick={() => guardarAuditoriaMasiva(usuarioId, filtroFechas.inicio, filtroFechas.fin)}
              disabled={loading}
            >
              ✅ PROCESAR {Object.values(conteos).filter(v => v !== '').length} CONTEOS
            </button>
          )}

          <div className={s.auditFilters}>
            <select
              className={s.inputSmall}
              value={filtroAuditoria}
              onChange={(e) => setFiltroAuditoria(e.target.value)}
            >
              <option value="todos"> Todos</option>
              <option value="pendientes"> Pendientes</option>
              <option value="auditados"> Auditados</option>
            </select>
            <input
              type="date"
              className={s.inputSmall}
              value={filtroFechas.inicio}
              onChange={(e) => setFiltroFechas({ ...filtroFechas, inicio: e.target.value })}
            />
            <input
              type="date"
              className={s.inputSmall}
              value={filtroFechas.fin}
              onChange={(e) => setFiltroFechas({ ...filtroFechas, fin: e.target.value })}
            />
            <button
              className={`${s.btn} ${s.btnDark}`}
              onClick={() => generarContraste(filtroFechas.inicio, filtroFechas.fin)}
              disabled={loading}
            >
              {loading ? "..." : "BALANCE"}
            </button>
          </div>
        </div>
      </div>

      <table className={s.table}>
        <thead className={s.thead}>
          <tr>
            <th className={s.th}>INSUMO ESPERADO</th>
 
            <th className={s.th} style={{ backgroundColor: "var(--color-bg-muted)" }}>FÍSICO REAL</th>
            <th className={s.th}>DIFERENCIA</th>
            <th className={s.th} style={{ textAlign: "right" }}>ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {contrasteDataFiltrado.length === 0 ? (
            <tr>
              <td colSpan="6" className={s.emptyState}>
                {loading ? "Generando balance..." : "Genera un balance para comenzar la auditoría."}
              </td>
            </tr>
          ) : (
            contrasteDataFiltrado.map((row) => {
              const inputVal = conteos[row.id];
              const tieneConteo = inputVal !== undefined && inputVal !== "";
              const diferenciaReal = tieneConteo
                ? (parseFloat(inputVal) - parseFloat(row.stock_esperado)).toFixed(2)
                : "-";
              const yaAuditado = auditados.includes(row.id);

              let difColorClass = "";
              if (tieneConteo) {
                if (parseFloat(diferenciaReal) < 0) difColorClass = s.textDanger;
                else if (parseFloat(diferenciaReal) > 0) difColorClass = s.textSuccess;
              }

              return (
                <tr key={row.id} className={yaAuditado ? s.rowAudited : ""}>
                  <td className={s.td}>
                    <div className={s.productTitle}>{row.insumo}</div>
                    <div>{row.stock_esperado} {row.unidad || 'U'}</div>
                  </td>

                  <td className={s.td} style={{ backgroundColor: yaAuditado ? undefined : "var(--color-bg-muted)" }}>
                    <input
                      type="number"
                      className={s.tableInputCenter}
                      placeholder="0.00"
                      value={conteos[row.id] || ""}
                      readOnly={!puedeEditar || yaAuditado}
                      onChange={(e) => actualizarConteo(row.id, e.target.value)}
                    />
                  </td>
                  <td className={`${s.td} ${difColorClass}`} style={{ fontWeight: "900" }}>
                    {tieneConteo ? parseFloat(diferenciaReal) > 0 ? `+${diferenciaReal}` : diferenciaReal : "-"}
                  </td>
                  <td className={s.td} style={{ textAlign: "right" }}>
                    <button
                      className={yaAuditado ? `${s.btn} ${s.btnSuccess} ${s.btnSmall}` : `${s.btn} ${s.btnPrimary} ${s.btnSmall}`}
                      onClick={() => handleGuardarConteo(row)}
                      disabled={loading || !tieneConteo || yaAuditado}
                    >
                      {yaAuditado ? "OK" : "GUARDAR"}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};