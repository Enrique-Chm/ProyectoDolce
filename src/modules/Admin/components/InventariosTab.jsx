import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useInventarios } from "../../../hooks/useInventariosTab"; 
import s from "../AdminPage.module.css"; 

const InventariosTab = ({ sucursalId, usuarioId }) => {
  const { 
    insumos,              
    insumosFiltrados,     
    searchTerm, setSearchTerm,        
    movimientos, 
    motivosCatalogo,
    contrasteData, 
    contrasteDataFiltrado, 
    conteos, actualizarConteo, 
    auditados,
    filtroAuditoria, setFiltroAuditoria, 
    loading, 
    procesarNuevoMovimiento, 
    generarContraste,
    guardarConteoFisico 
  } = useInventarios(sucursalId);

  // --- ESTADOS ESTRICTAMENTE VISUALES ---
  const [activeSubTab, setActiveSubTab] = useState('stock'); 
  const [filtroFechas, setFiltroFechas] = useState({ 
    inicio: new Date().toISOString().split('T')[0], 
    fin: new Date().toISOString().split('T')[0] 
  });
  
  const [nuevoMov, setNuevoMov] = useState({ insumo_id: '', tipo: 'ENTRADA', cantidad: '', motivo: '' });
  const [searchTermInsumo, setSearchTermInsumo] = useState(''); 
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const insumoSeleccionado = useMemo(() => insumos?.find(i => i.id === Number(nuevoMov.insumo_id)), [insumos, nuevoMov.insumo_id]);
  const insumosFiltradosCombo = useMemo(() => insumos?.filter(i => i.nombre.toLowerCase().includes(searchTermInsumo.toLowerCase())) || [], [insumos, searchTermInsumo]);
  const motivosDisponibles = useMemo(() => motivosCatalogo?.filter(m => m.tipo === nuevoMov.tipo) || [], [motivosCatalogo, nuevoMov.tipo]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS ---
  const handleSubmitMovimiento = async (e) => {
    e.preventDefault();
    const res = await procesarNuevoMovimiento(nuevoMov, insumoSeleccionado, usuarioId);
    
    if (res.success) {
      alert("Movimiento guardado.");
      setNuevoMov({ insumo_id: '', tipo: 'ENTRADA', cantidad: '', motivo: '' });
      setSearchTermInsumo('');
    } else {
      alert(res.error);
    }
  };

  const handleGuardarConteo = async (row) => {
    const valorFisico = conteos[row.id];
    if (valorFisico === undefined || valorFisico === '') {
      return alert("Por favor ingresa el peso/conteo que marca la báscula.");
    }

    if (window.confirm(`¿Confirmas que físicamente hay ${valorFisico} ${row.unidad} de ${row.insumo}?`)) {
      const res = await guardarConteoFisico(row, valorFisico, usuarioId, filtroFechas.inicio, filtroFechas.fin);
      if (!res.success) alert("Error al guardar: " + res.error);
    }
  };

  return (
    <div>
      <div className={s.subNav}>
        <button className={`${s.subBtn} ${activeSubTab === 'stock' ? s.subBtnActive : ''}`} onClick={() => setActiveSubTab('stock')}>📦 Existencias</button>
        <button className={`${s.subBtn} ${activeSubTab === 'movimientos' ? s.subBtnActive : ''}`} onClick={() => setActiveSubTab('movimientos')}>📜 Historial</button>
        <button className={`${s.subBtn} ${activeSubTab === 'contraste' ? s.subBtnActive : ''}`} onClick={() => setActiveSubTab('contraste')}>⚖️ Cierre de Turno</button>
      </div>

      <div className={s.container}>
        
        {activeSubTab !== 'contraste' && (
          <aside className={s.card}>
            <div className={s.cardHeader}><h3 className={s.cardTitle}>Nuevo Movimiento</h3></div>
            <form className={s.cardBody} onSubmit={handleSubmitMovimiento}>
              <div className={s.formGroupRelative} ref={dropdownRef}>
                <label className={s.label}>Insumo (Catálogo)</label>
                <input 
                  type="text" className={s.input} placeholder="🔍 Buscar producto..."
                  value={searchTermInsumo} onFocus={() => setShowDropdown(true)}
                  onChange={(e) => { setSearchTermInsumo(e.target.value); setShowDropdown(true); }}
                />
                {showDropdown && (
                  <div className={s.dropdownContainer}>
                    {insumosFiltradosCombo.map(i => (
                      <div key={i.id} className={s.dropdownItem} onClick={() => { setNuevoMov({...nuevoMov, insumo_id: i.id}); setSearchTermInsumo(i.nombre); setShowDropdown(false); }}>
                        <strong>{i.nombre}</strong> 
                        <span className={s.dropdownItemNote}>{i.stock_fisico} {i.unidad}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={s.grid2}>
                <div className={s.formGroup}>
                  <label className={s.label}>Operación</label>
                  <select className={s.input} value={nuevoMov.tipo} onChange={(e) => setNuevoMov({...nuevoMov, tipo: e.target.value, motivo: ''})}>
                    <option value="ENTRADA">Entrada (+)</option>
                    <option value="MERMA">Merma (-)</option>
                    <option value="SALIDA">Salida (-)</option>
                  </select>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Cantidad</label>
                  <input type="number" className={s.input} value={nuevoMov.cantidad} onChange={(e) => setNuevoMov({...nuevoMov, cantidad: e.target.value})} step="0.01" required />
                  <div className={s.helperTextInfo}>
                    {insumoSeleccionado ? `⚠️ Registrar en: ${insumoSeleccionado.unidad}` : 'Selecciona insumo'}
                  </div>
                </div>
              </div>

              <div className={s.formGroup}>
                <label className={s.label}>Motivo</label>
                <select className={s.input} value={nuevoMov.motivo} onChange={(e) => setNuevoMov({...nuevoMov, motivo: e.target.value})} required>
                  <option value="">-- Selecciona Motivo --</option>
                  {motivosDisponibles.map(m => <option key={m.id} value={m.nombre_motivo}>{m.nombre_motivo}</option>)}
                </select>
              </div>

              <button type="submit" className={s.btnPrimary} disabled={loading}>{loading ? 'Guardando...' : 'Confirmar'}</button>
            </form>
          </aside>
        )}

        <main style={{ gridColumn: activeSubTab === 'contraste' ? '1 / -1' : 'auto' }}>
          
          {activeSubTab === 'stock' && (
            <div className={s.card}>
              <div className={s.cardHeader}>
                <input type="text" className={s.input} placeholder="🔍 Filtrar existencias..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className={s.tableWrapper}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th title="Lo que se validó en el último cierre">Stock Físico 🔒</th>
                      <th className={s.cellEstimated} title="Calculado en vivo">Estimado (En Vivo) ⚡</th>
                      <th>U.M.</th>
                      <th>Categoría</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insumosFiltrados.map(insumo => (
                      <tr key={insumo.id}>
                        <td className={s.textPending}>{insumo.nombre}</td>
                        <td className={s.textMuted} style={{fontWeight: 700}}>{insumo.stock_fisico}</td>
                        <td className={s.cellEstimated}>{insumo.stock_estimado}</td>
                        <td className={s.textMuted}>{insumo.unidad}</td>
                        <td><span className={s.badgeCategory}>{insumo.categoria}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'contraste' && (
            <div className={s.card}>
              <div className={`${s.cardHeader} ${s.headerFlex}`}>
                <div>
                  <h3 className={s.cardTitle}>Auditoría y Cierre de Turno</h3>
                  {contrasteData.length > 0 && (
                    <span className={`${s.progressText} ${auditados.length === contrasteData.length ? s.progressComplete : ''}`}>
                      Progreso: {auditados.length} de {contrasteData.length} insumos auditados {auditados.length === contrasteData.length ? '🎉' : ''}
                    </span>
                  )}
                </div>

                <div className={s.headerActions}>
                  <select 
                    className={`${s.input} ${s.comboFilter}`} 
                    value={filtroAuditoria} 
                    onChange={(e) => setFiltroAuditoria(e.target.value)}
                  >
                    <option value="todos">📋 Mostrar Todos</option>
                    <option value="pendientes">⏳ Solo Pendientes</option>
                    <option value="auditados">✅ Ya Auditados</option>
                  </select>

                  <input type="date" className={s.input} value={filtroFechas.inicio} onChange={(e) => setFiltroFechas({...filtroFechas, inicio: e.target.value})} />
                  <input type="date" className={s.input} value={filtroFechas.fin} onChange={(e) => setFiltroFechas({...filtroFechas, fin: e.target.value})} />
                  
                  <button className={s.btnEdit} onClick={() => generarContraste(filtroFechas.inicio, filtroFechas.fin)} disabled={loading}>
                    {loading ? 'Calculando...' : 'Generar Balance'}
                  </button>
                </div>
              </div>

              <div className={s.tableWrapper}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>(=) Esperado</th>
                      <th>(-) Ventas</th>
                      <th className={s.cellHighlightBg}>Físico (Báscula)</th>
                      <th>Diferencia Real</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contrasteDataFiltrado.map((row) => {
                      const inputVal = conteos[row.id];
                      const tieneConteo = inputVal !== undefined && inputVal !== '';
                      const diferenciaReal = tieneConteo ? (parseFloat(inputVal) - parseFloat(row.stock_esperado)).toFixed(2) : '-';
                      const yaAuditado = auditados.includes(row.id);

                      let colorDiferencia = '';
                      if (tieneConteo) {
                         colorDiferencia = parseFloat(diferenciaReal) < 0 ? s.textDanger : parseFloat(diferenciaReal) > 0 ? s.textSuccess : '';
                      }

                      return (
                        <tr key={row.id} className={yaAuditado ? s.rowAudited : ''}>
                          <td className={yaAuditado ? s.textAudited : s.textPending}>{row.insumo}</td>
                          <td className={s.priceTag} style={{ opacity: yaAuditado ? 0.6 : 1 }}>
                            {row.stock_esperado} <span className={s.textMuted}>{row.unidad}</span>
                          </td>
                          <td className={s.textDanger} style={{ opacity: yaAuditado ? 0.6 : 1 }}>
                            {row.vendido !== '0.00' ? `-${row.vendido}` : '0.00'}
                          </td>
                          <td className={yaAuditado ? '' : s.cellHighlightBg}>
                            <input 
                              type="number" 
                              className={s.inputSmall} 
                              placeholder="Ej. 2100"
                              value={conteos[row.id] || ''}
                              onChange={(e) => actualizarConteo(row.id, e.target.value)} 
                              step="0.01"
                            />
                          </td>
                          <td className={`${s.priceTag} ${colorDiferencia}`}>
                            {tieneConteo ? (parseFloat(diferenciaReal) > 0 ? `+${diferenciaReal}` : diferenciaReal) : '-'}
                          </td>
                          <td>
                            <button 
                              className={`${s.btnPrimary} ${yaAuditado ? s.btnSuccess : ''}`} 
                              onClick={() => handleGuardarConteo(row)}
                              disabled={loading || !tieneConteo}
                            >
                              {yaAuditado ? '✅ Actualizado' : 'Guardar'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLA DE HISTORIAL RECUPERADA Y ESTILIZADA */}
          {activeSubTab === 'movimientos' && (
            <div className={s.card}>
              <div className={s.cardHeader}>
                <h3 className={s.cardTitle}>Historial de Movimientos</h3>
              </div>
              <div className={s.tableWrapper}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Insumo</th>
                      <th>Tipo</th>
                      <th>Cant.</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos?.map(m => (
                      <tr key={m.id}>
                        <td className={s.textMuted}>{new Date(m.created_at).toLocaleString()}</td>
                        <td className={s.textPending}>{m.insumo?.nombre}</td>
                        <td className={m.tipo === 'ENTRADA' ? s.textSuccess : s.textDanger}>{m.tipo}</td>
                        <td className={s.priceTag}>{m.cantidad_afectada}</td>
                        <td className={s.textMuted}>{m.motivo}</td>
                      </tr>
                    ))}
                    {(!movimientos || movimientos.length === 0) && (
                      <tr>
                        <td colSpan="5" style={{textAlign:'center', padding:'30px', color:'#64748b'}}>
                          No hay movimientos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default InventariosTab;