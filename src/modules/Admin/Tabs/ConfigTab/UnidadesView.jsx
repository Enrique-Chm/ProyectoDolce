import React from 'react';

export const UnidadesView = ({
  s,
  // Props Unidades
  unidades,
  uEditId, setUEditId,
  uNombre, setUNombre,
  uAbrev, setUAbrev,
  handleSubmitUnidad,

  // Props Tipos de Descuento
  tiposDescuento,
  tdEditId, setTdEditId,
  tdNombre, setTdNombre,
  tdTipoCalculo, setTdTipoCalculo,
  tdValorDefecto, setTdValorDefecto,
  tdRequiereAuth, setTdRequiereAuth,
  handleSubmitTipoDescuento,

  // Comunes
  handleDelete,
  puedeCrearU,
  puedeEditarU,
  puedeBorrarConfig,
  mostrarFormularioU
}) => {
  
  // Lógica local para mostrar formulario de descuentos
  const mostrarFormularioTD = puedeCrearU || tdEditId;

  return (
    <div className={s.flexColumnGap20}>
      
      {/* ==========================================
          SECCIÓN: UNIDADES DE MEDIDA
          ========================================== */}
      <div className={mostrarFormularioU ? s.splitLayout : s.fullLayout}>
        <aside className={s.adminCard} style={{ display: mostrarFormularioU ? 'block' : 'none' }}>
          <h3 className={s.cardTitle}>
            {uEditId ? (puedeEditarU ? 'Editar' : 'Ver') : 'Nueva'} Unidad
          </h3>
          <form onSubmit={handleSubmitUnidad} className={s.loginForm}>
            <div className={s.formGroup}>
              <label className={s.label}>NOMBRE</label>
              <input 
                className={s.inputField}
                value={uNombre} 
                onChange={e => setUNombre(e.target.value)} 
                required 
                readOnly={uEditId ? !puedeEditarU : !puedeCrearU} 
                style={{ backgroundColor: (uEditId ? !puedeEditarU : !puedeCrearU) ? "var(--color-bg-muted)" : "white" }}
              />
            </div>
            <div className={s.formGroup}>
              <label className={s.label}>ABREVIATURA</label>
              <input 
                className={s.inputField}
                value={uAbrev} 
                onChange={e => setUAbrev(e.target.value)} 
                required 
                readOnly={uEditId ? !puedeEditarU : !puedeCrearU} 
                style={{ backgroundColor: (uEditId ? !puedeEditarU : !puedeCrearU) ? "var(--color-bg-muted)" : "white" }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {(uEditId ? puedeEditarU : puedeCrearU) && (
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1 }}>GUARDAR</button>
              )}
              {uEditId && (
                <button 
                  type="button" 
                  className={`${s.btn} ${s.btnDark}`} 
                  style={{ flex: 1 }} 
                  onClick={() => { setUEditId(null); setUNombre(''); setUAbrev(''); }}
                >
                  {puedeEditarU ? 'CANCELAR' : 'CERRAR'}
                </button>
              )}
            </div>
          </form>
        </aside>

        <div className={`${s.adminCard} ${s.tableContainer}`}>
          <table className={s.table}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th}>ID</th>
                <th className={s.th}>DESCRIPCIÓN</th>
                <th className={s.th} style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map(u => (
                <tr key={u.id} style={{ backgroundColor: uEditId === u.id ? 'var(--color-bg-app)' : 'transparent' }}>
                  <td className={s.td}>#{u.id}</td>
                  <td className={s.td}><strong>{u.nombre}</strong> <span className={s.textMuted}>({u.abreviatura})</span></td>
                  <td className={s.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} 
                        onClick={() => { setUEditId(u.id); setUNombre(u.nombre); setUAbrev(u.abreviatura); }}
                      >
                        {puedeEditarU ? '📝' : '👁️'}
                      </button>
                      {puedeBorrarConfig && (
                        <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => handleDelete('unidades', u.id)}>
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

      {/* ==========================================
          SECCIÓN: TIPOS DE DESCUENTO (Nueva)
          ========================================== */}
      <div className={mostrarFormularioTD ? s.splitLayout : s.fullLayout}>
        <aside className={s.adminCard} style={{ display: mostrarFormularioTD ? 'block' : 'none' }}>
          <h3 className={s.cardTitle}>
            {tdEditId ? (puedeEditarU ? 'Editar' : 'Ver') : 'Nuevo'} Tipo de Descuento
          </h3>
          <form onSubmit={handleSubmitTipoDescuento} className={s.loginForm}>
            <div className={s.formGroup}>
              <label className={s.label}>NOMBRE DEL DESCUENTO</label>
              <input 
                className={s.inputField}
                value={tdNombre} 
                onChange={e => setTdNombre(e.target.value)} 
                placeholder="Ej: Cortesía, Empleados..."
                required 
                readOnly={tdEditId ? !puedeEditarU : !puedeCrearU}
              />
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>TIPO DE CÁLCULO</label>
              <select 
                className={s.inputField}
                value={tdTipoCalculo}
                onChange={e => setTdTipoCalculo(e.target.value)}
                disabled={tdEditId ? !puedeEditarU : !puedeCrearU}
              >
                <option value="libre">Libre (Ingresar en el momento)</option>
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_fijo">Monto Fijo ($)</option>
              </select>
            </div>

            {tdTipoCalculo !== 'libre' && (
              <div className={s.formGroup}>
                <label className={s.label}>VALOR POR DEFECTO</label>
                <input 
                  type="number"
                  step="0.01"
                  className={s.inputField}
                  value={tdValorDefecto} 
                  onChange={e => setTdValorDefecto(e.target.value)} 
                  required 
                />
              </div>
            )}

            <div className={s.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox"
                id="tdAuth"
                checked={tdRequiereAuth}
                onChange={e => setTdRequiereAuth(e.target.checked)}
                disabled={tdEditId ? !puedeEditarU : !puedeCrearU}
              />
              <label htmlFor="tdAuth" className={s.label} style={{ marginBottom: 0 }}>¿Requiere autorización?</label>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {(tdEditId ? puedeEditarU : puedeCrearU) && (
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1 }}>GUARDAR</button>
              )}
              {tdEditId && (
                <button 
                  type="button" 
                  className={`${s.btn} ${s.btnDark}`} 
                  style={{ flex: 1 }} 
                  onClick={() => { 
                    setTdEditId(null); setTdNombre(''); setTdTipoCalculo('libre'); 
                    setTdValorDefecto(0); setTdRequiereAuth(false);
                  }}
                >
                  {puedeEditarU ? 'CANCELAR' : 'CERRAR'}
                </button>
              )}
            </div>
          </form>
        </aside>

        <div className={`${s.adminCard} ${s.tableContainer}`}>
          <table className={s.table}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th}>NOMBRE</th>
                <th className={s.th}>CÁLCULO</th>
                <th className={s.th}>VALOR</th>
                <th className={s.th}>AUTH</th>
                <th className={s.th} style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {tiposDescuento.map(td => (
                <tr key={td.id} style={{ backgroundColor: tdEditId === td.id ? 'var(--color-bg-app)' : 'transparent' }}>
                  <td className={s.td}><strong>{td.nombre}</strong></td>
                  <td className={s.td} style={{ textTransform: 'capitalize' }}>{td.tipo_calculo.replace('_', ' ')}</td>
                  <td className={s.td}>
                    {td.tipo_calculo === 'porcentaje' ? `${td.valor_defecto}%` : 
                     td.tipo_calculo === 'monto_fijo' ? `$${td.valor_defecto}` : 'N/A'}
                  </td>
                  <td className={s.td}>{td.requiere_autorizacion ? '✅ SI' : '❌ NO'}</td>
                  <td className={s.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} 
                        onClick={() => { 
                          setTdEditId(td.id); setTdNombre(td.nombre); 
                          setTdTipoCalculo(td.tipo_calculo); setTdValorDefecto(td.valor_defecto);
                          setTdRequiereAuth(td.requiere_autorizacion);
                        }}
                      >
                        {puedeEditarU ? '📝' : '👁️'}
                      </button>
                      {puedeBorrarConfig && (
                        <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => handleDelete('tipos_descuento', td.id)}>
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

    </div>
  );
};