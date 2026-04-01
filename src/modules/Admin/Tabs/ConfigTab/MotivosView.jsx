import React from 'react';

export const MotivosView = ({
  s,
  motivosInventario,
  mEditId,
  setMEditId,
  mNombre,
  setMNombre,
  mTipo,
  setMTipo,
  handleSubmitMotivo,
  handleDelete,
  puedeCrearM,
  puedeEditarM,
  puedeBorrarConfig,
  mostrarFormularioM
}) => {
  return (
    <div className={mostrarFormularioM ? s.splitLayout : s.fullLayout}>
      <aside className={s.adminCard} style={{ display: mostrarFormularioM ? 'block' : 'none' }}>
        <h3 className={s.cardTitle}>
          {mEditId ? (puedeEditarM ? 'Editar Motivo' : 'Detalle Motivo') : 'Nuevo Motivo'}
        </h3>
        <form onSubmit={handleSubmitMotivo} className={s.loginForm}>
          <div className={s.formGroup}>
            <label className={s.label}>NOMBRE DEL MOTIVO</label>
            <input 
              className={s.inputField}
              value={mNombre} 
              onChange={e => setMNombre(e.target.value)} 
              placeholder="Ej: Compra Proveedor" 
              required 
              readOnly={mEditId ? !puedeEditarM : !puedeCrearM} 
              style={{ backgroundColor: (mEditId ? !puedeEditarM : !puedeCrearM) ? "var(--color-bg-muted)" : "white" }}
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.label}>TIPO DE MOVIMIENTO</label>
            <select 
              className={s.inputField}
              value={mTipo} 
              onChange={e => setMTipo(e.target.value)} 
              disabled={mEditId ? !puedeEditarM : !puedeCrearM}
              style={{ backgroundColor: (mEditId ? !puedeEditarM : !puedeCrearM) ? "var(--color-bg-muted)" : "white" }}
            >
              <option value="ENTRADA">ENTRADA (+)</option>
              <option value="MERMA">MERMA (-)</option>
              <option value="SALIDA">SALIDA (-)</option>
              <option value="AJUSTE">AJUSTE (+/-)</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            {(mEditId ? puedeEditarM : puedeCrearM) && (
              <button type="submit" className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1 }}>GUARDAR</button>
            )}
            {mEditId && (
              <button 
                type="button" 
                className={`${s.btn} ${s.btnDark}`} 
                style={{ flex: 1 }} 
                onClick={() => { setMEditId(null); setMNombre(''); setMTipo('ENTRADA'); }}
              >
                {puedeEditarM ? 'CANCELAR' : 'CERRAR'}
              </button>
            )}
          </div>
        </form>
      </aside>

      <div className={`${s.adminCard} ${s.tableContainer}`}>
        <table className={s.table}>
          <thead className={s.thead}>
            <tr>
              <th className={s.th}>TIPO</th>
              <th className={s.th}>MOTIVO</th>
              <th className={s.th} style={{ textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {motivosInventario.map(m => (
              <tr key={m.id} style={{ backgroundColor: mEditId === m.id ? 'var(--color-bg-app)' : undefined }}>
                <td className={s.td}>
                  <span className={m.tipo === 'ENTRADA' ? s.badgeSuccess : s.badgeDanger}>
                    {m.tipo}
                  </span>
                </td>
                <td className={s.td}><strong>{m.nombre_motivo}</strong></td>
                <td className={s.td} style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} 
                      onClick={() => { setMEditId(m.id); setMNombre(m.nombre_motivo); setMTipo(m.tipo); }}
                    >
                      {puedeEditarM ? '📝' : '👁️'}
                    </button>
                    {puedeBorrarConfig && (
                      <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => handleDelete('motivos', m.id)}>
                        ❌
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};