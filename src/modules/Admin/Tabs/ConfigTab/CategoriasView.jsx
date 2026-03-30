import React from 'react';

export const CategoriasView = ({
  s,
  catMenu,
  catInsumos,
  cMenuEditId,
  setCMenuEditId,
  cMenuNombre,
  setCMenuNombre,
  cMenuColor,
  setCMenuColor,
  cInsumoEditId,
  setCInsumoEditId,
  cInsumoNombre,
  setCInsumoNombre,
  handleSubmitCatMenu,
  handleSubmitCatInsumo,
  handleDelete,
  puedeCrearC,
  puedeEditarC,
  puedeBorrarConfig,
  mostrarFormularioCMenu,
  mostrarFormularioCInsumo
}) => {
  return (
    <div className={s.flexColumnGap20}>
      
      {/* --- CATEGORÍAS MENÚ --- */}
      <div className={mostrarFormularioCMenu ? s.splitLayout : s.fullLayout}>
        <aside className={s.adminCard} style={{ display: mostrarFormularioCMenu ? 'block' : 'none' }}>
          <h3 className={s.cardTitle}>
            {cMenuEditId ? (puedeEditarC ? 'Editar Categoría Menú' : 'Detalle Categoría Menú') : 'Nueva Categoría Menú'}
          </h3>
          <form onSubmit={handleSubmitCatMenu} className={s.loginForm}>
            <div className={s.formGroup}>
              <label className={s.label}>NOMBRE CATEGORÍA</label>
              <input 
                className={s.inputField}
                value={cMenuNombre} 
                onChange={e => setCMenuNombre(e.target.value)} 
                placeholder="Ej: Hamburguesas" 
                required 
                readOnly={cMenuEditId ? !puedeEditarC : !puedeCrearC} 
                style={{ backgroundColor: (cMenuEditId ? !puedeEditarC : !puedeCrearC) ? "var(--color-bg-muted)" : "white" }}
              />
            </div>
            <div className={s.formGroup}>
              <label className={s.label}>COLOR IDENTIFICADOR</label>
              <input 
                type="color"
                className={`${s.inputField} ${s.colorPicker}`}
                value={cMenuColor} 
                onChange={e => setCMenuColor(e.target.value)} 
                disabled={cMenuEditId ? !puedeEditarC : !puedeCrearC} 
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {(cMenuEditId ? puedeEditarC : puedeCrearC) && (
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1 }}>
                  {cMenuEditId ? 'ACTUALIZAR' : 'GUARDAR'}
                </button>
              )}
              {cMenuEditId && (
                <button 
                  type="button" 
                  className={`${s.btn} ${s.btnDark}`} 
                  style={{ flex: 1 }} 
                  onClick={() => { setCMenuEditId(null); setCMenuNombre(''); setCMenuColor('#005696'); }}
                >
                  {puedeEditarC ? 'CANCELAR' : 'CERRAR'}
                </button>
              )}
            </div>
          </form>
        </aside>

        <div className={`${s.adminCard} ${s.tableContainer}`}>
          <table className={s.table}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th}>COLOR</th>
                <th className={s.th}>NOMBRE</th>
                <th className={s.th} style={{ textAlign: 'right' }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {catMenu.map(c => (
                <tr key={c.id} style={{ backgroundColor: cMenuEditId === c.id ? 'var(--color-bg-app)' : 'transparent' }}>
                  <td className={s.td}>
                    <div className={s.colorCircle} style={{ backgroundColor: c.color_etiqueta }}></div>
                  </td>
                  <td className={s.td}><strong>{c.nombre}</strong></td>
                  <td className={s.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} 
                        onClick={() => { setCMenuEditId(c.id); setCMenuNombre(c.nombre); setCMenuColor(c.color_etiqueta); }}
                      >
                        {puedeEditarC ? '📝' : '👁️'}
                      </button>
                      {puedeBorrarConfig && (
                        <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => handleDelete('menu', c.id)}>
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

      {/* --- CATEGORÍAS ALMACÉN --- */}
      <div className={mostrarFormularioCInsumo ? s.splitLayout : s.fullLayout}>
        <aside className={s.adminCard} style={{ display: mostrarFormularioCInsumo ? 'block' : 'none' }}>
          <h3 className={s.cardTitle}>
            {cInsumoEditId ? (puedeEditarC ? 'Editar Almacén' : 'Detalle Almacén') : 'Nueva Categoría Almacén'}
          </h3>
          <form onSubmit={handleSubmitCatInsumo} className={s.loginForm}>
            <div className={s.formGroup}>
              <label className={s.label}>NOMBRE CATEGORÍA</label>
              <input 
                className={s.inputField}
                value={cInsumoNombre} 
                onChange={e => setCInsumoNombre(e.target.value)} 
                placeholder="Ej: Proteínas" 
                required 
                readOnly={cInsumoEditId ? !puedeEditarC : !puedeCrearC} 
                style={{ backgroundColor: (cInsumoEditId ? !puedeEditarC : !puedeCrearC) ? "var(--color-bg-muted)" : "white" }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {(cInsumoEditId ? puedeEditarC : puedeCrearC) && (
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1 }}>
                  {cInsumoEditId ? 'ACTUALIZAR' : 'GUARDAR'}
                </button>
              )}
              {cInsumoEditId && (
                <button 
                  type="button" 
                  className={`${s.btn} ${s.btnDark}`} 
                  style={{ flex: 1 }} 
                  onClick={() => { setCInsumoEditId(null); setCInsumoNombre(''); }}
                >
                  {puedeEditarC ? 'CANCELAR' : 'CERRAR'}
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
                <th className={s.th}>NOMBRE</th>
                <th className={s.th} style={{ textAlign: 'right' }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {catInsumos.map(c => (
                <tr key={c.id} style={{ backgroundColor: cInsumoEditId === c.id ? 'var(--color-bg-app)' : 'transparent' }}>
                  <td className={s.td}>#{c.id}</td>
                  <td className={s.td}><strong>{c.nombre}</strong></td>
                  <td className={s.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} 
                        onClick={() => { setCInsumoEditId(c.id); setCInsumoNombre(c.nombre); }}
                      >
                        {puedeEditarC ? '📝' : '👁️'}
                      </button>
                      {puedeBorrarConfig && (
                        <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => handleDelete('insumos', c.id)}>
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