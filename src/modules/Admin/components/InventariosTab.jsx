// Archivo: src/modules/Admin/components/InventariosTab.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useInventarios } from "../../../hooks/useInventariosTab"; 
import s from "../AdminPage.module.css"; 

const InventariosTab = ({ sucursalId, usuarioId }) => {
  // Consumimos estados, métodos y las banderas de seguridad del hook sincronizado
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
    guardarConteoFisico,
    puedeVer, puedeCrear, puedeEditar 
  } = useInventarios(sucursalId);

  // --- ESTADOS VISUALES ---
  const [activeSubTab, setActiveSubTab] = useState('stock'); 
  const [filtroFechas, setFiltroFechas] = useState({ 
    inicio: new Date().toISOString().split('T')[0], 
    fin: new Date().toISOString().split('T')[0] 
  });
  
  const [nuevoMov, setNuevoMov] = useState({ insumo_id: '', tipo: 'ENTRADA', cantidad: '', motivo: '' });

  // Memorización para optimizar el filtrado de motivos según el tipo de operación
  const insumoSeleccionado = useMemo(() => 
    insumos?.find(i => i.id === Number(nuevoMov.insumo_id)), 
  [insumos, nuevoMov.insumo_id]);

  const motivosDisponibles = useMemo(() => 
    motivosCatalogo?.filter(m => m.tipo === nuevoMov.tipo) || [], 
  [motivosCatalogo, nuevoMov.tipo]);

  // --- HANDLERS ---
  const handleSubmitMovimiento = async (e) => {
    e.preventDefault();
    // 🛡️ Bloqueo de seguridad
    if (!puedeCrear) return; 
    if (!nuevoMov.insumo_id) return alert("Por favor selecciona un insumo de la lista.");

    const res = await procesarNuevoMovimiento(nuevoMov, insumoSeleccionado, usuarioId);
    
    if (res.success) {
      alert("Movimiento de almacén guardado correctamente.");
      setNuevoMov({ insumo_id: '', tipo: 'ENTRADA', cantidad: '', motivo: '' });
    } else {
      alert(res.error || "Error al procesar el movimiento.");
    }
  };

  const handleGuardarConteo = async (row) => {
    // 🛡️ Bloqueo de seguridad
    if (!puedeEditar) return; 
    const valorFisico = conteos[row.id];
    
    if (valorFisico === undefined || valorFisico === '') {
      return alert("Por favor ingresa el peso o conteo físico real.");
    }

    if (window.confirm(`¿Confirmas que el stock real de ${row.insumo} es ${valorFisico} ${row.unidad}?`)) {
      const res = await guardarConteoFisico(row, valorFisico, usuarioId, filtroFechas.inicio, filtroFechas.fin);
      if (!res.success) alert("Error al procesar auditoría: " + res.error);
    }
  };

  // 🛡️ Pantalla de bloqueo si no hay permisos de lectura
  if (!puedeVer) return <div className={s.emptyState}>No tienes permisos para acceder al inventario.</div>;

  return (
    <div className={s.tabWrapper}>
      {/* SECCIÓN CABECERA */}
      <div className={s.pageHeader}>
        <h2 className={s.pageTitle}>Gestión de Inventarios</h2>
      </div>

      {/* Navegación de Sub-pestañas */}
      <nav className={s.tabNav}>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'stock' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('stock')}
        >
           EXISTENCIAS
        </button>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'movimientos' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('movimientos')}
        >
           HISTORIAL
        </button>
        <button 
          className={`${s.tabButton} ${activeSubTab === 'contraste' ? s.activeTabButton : ''}`} 
          onClick={() => setActiveSubTab('contraste')}
        >
           AUDITORÍA / CIERRE
        </button>
      </nav>

      <div className={activeSubTab === 'contraste' ? "" : s.splitLayout}>
        
        {/* PANEL LATERAL DE MOVIMIENTO MANUAL */}
        {activeSubTab !== 'contraste' && (
          <aside className={s.adminCard}>
            <h3 className={s.cardTitle}>
              {puedeCrear ? 'Registrar Movimiento' : 'Detalles de Insumo'}
            </h3>
            <form onSubmit={handleSubmitMovimiento}>
              
              <div className={s.formGroup}>
                <label className={s.label}>INSUMO</label>
                <SearchableSelect 
                  options={insumos || []}
                  value={nuevoMov.insumo_id}
                  valueKey="id"
                  labelKey="nombre"
                  placeholder=" Buscar insumo..."
                  formatLabel={(opt) => `${opt.nombre} (Saldo: ${opt.stock_fisico} ${opt.unidad})`}
                  disabled={loading || !puedeCrear}
                  onChange={(val) => setNuevoMov({...nuevoMov, insumo_id: val})}
                />
              </div>

              {/* 💡 Reemplazo de estilo en línea por clase .formGrid para responsividad */}
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.label}>OPERACIÓN</label>
                  <select 
                    className={s.inputField}
                    value={nuevoMov.tipo} 
                    disabled={!puedeCrear}
                    style={{ backgroundColor: !puedeCrear ? "var(--color-bg-muted)" : "white" }}
                    onChange={(e) => setNuevoMov({...nuevoMov, tipo: e.target.value, motivo: ''})}
                  >
                    <option value="ENTRADA">Entrada (+)</option>
                    <option value="MERMA">Merma (-)</option>
                    <option value="SALIDA">Salida (-)</option>
                  </select>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>CANTIDAD</label>
                  <input 
                    type="number" step="0.01"
                    className={s.inputField}
                    value={nuevoMov.cantidad} 
                    onChange={(e) => setNuevoMov({...nuevoMov, cantidad: e.target.value})} 
                    required 
                    readOnly={!puedeCrear}
                    style={{ backgroundColor: !puedeCrear ? "var(--color-bg-muted)" : "white" }}
                  />
                </div>
              </div>

              <div className={s.formGroup} style={{ marginTop: '15px' }}>
                <label className={s.label}>MOTIVO</label>
                <select 
                  className={s.inputField}
                  value={nuevoMov.motivo} 
                  disabled={!puedeCrear || !nuevoMov.tipo}
                  style={{ backgroundColor: !puedeCrear ? "var(--color-bg-muted)" : "white" }}
                  onChange={(e) => setNuevoMov({...nuevoMov, motivo: e.target.value})} 
                  required
                >
                  <option value="">-- Selecciona Motivo --</option>
                  {motivosDisponibles.map(m => (
                    <option key={m.id} value={m.nombre_motivo}>{m.nombre_motivo}</option>
                  ))}
                </select>
                {insumoSeleccionado && (
                  <small className={s.helperText} style={{ display: 'block', marginTop: '5px', color: 'var(--color-primary)' }}>
                    Unidad de medida: <strong>{insumoSeleccionado.unidad}</strong>
                  </small>
                )}
              </div>

              {puedeCrear && (
                <button 
                  type="submit" 
                  className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} 
                  style={{ marginTop: '20px' }}
                  disabled={loading}
                >
                  {loading ? 'PROCESANDO...' : 'GUARDAR EN KARDEX'}
                </button>
              )}
            </form>
          </aside>
        )}

        <div className={s.flexColumnGap20}>
          
          {/* TABLA: EXISTENCIAS ACTUALES */}
          {activeSubTab === 'stock' && (
            <div className={`${s.adminCard} ${s.tableContainer}`}>
              <div className={s.tableHeader}>
                <input 
                  type="text" 
                  className={s.inputField}
                  placeholder=" Filtrar por nombre o categoría..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              <table className={s.table}>
                <thead className={s.thead}>
                  <tr>
                    <th className={s.th}>INSUMO</th>
                    <th className={s.th}>STOCK FÍSICO (DB)</th>
                    <th className={s.th} style={{ color: 'var(--color-primary)' }}>ESTIMADO HOY</th>
                    <th className={s.th}>U.M.</th>
                    <th className={s.th}>CATEGORÍA</th>
                  </tr>
                </thead>
                <tbody>
                  {insumosFiltrados.length === 0 ? (
                    <tr><td colSpan="5" className={s.emptyState}>No hay insumos que coincidan.</td></tr>
                  ) : (
                    insumosFiltrados.map(insumo => (
                      <tr key={insumo.id}>
                        <td className={s.td} style={{ fontWeight: '700' }}>{insumo.nombre}</td>
                        <td className={`${s.td} ${s.textMuted}`} style={{ fontWeight: '700' }}>{insumo.stock_fisico}</td>
                        <td className={`${s.td} ${s.textPrimary}`} style={{ fontWeight: '800' }}>{insumo.stock_estimado}</td>
                        <td className={s.td}>{insumo.unidad}</td>
                        <td className={s.td}>
                          <span className={s.badge}>{insumo.categoria?.toUpperCase()}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLA: AUDITORÍA DE CIERRE (CONTRASTE) */}
          {activeSubTab === 'contraste' && (
            <div className={`${s.adminCard} ${s.tableContainer}`}>
              <div className={s.auditHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h3 className={s.cardTitle} style={{ margin: 0 }}>Auditoría y Cierre</h3>
                  {contrasteData.length > 0 && (
                    <div style={{ fontSize: '13px', marginTop: '5px', fontWeight: '700' }} className={auditados.length === contrasteData.length ? s.textSuccess : s.textPrimary}>
                      Progreso: {auditados.length} de {contrasteData.length}
                    </div>
                  )}
                </div>

                <div className={s.auditFilters} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select 
                    className={s.inputSmall}
                    value={filtroAuditoria} 
                    onChange={(e) => setFiltroAuditoria(e.target.value)}
                  >
                    <option value="todos"> Todos</option>
                    <option value="pendientes"> Pendientes</option>
                    <option value="auditados"> Auditados</option>
                  </select>
                  <input type="date" className={s.inputSmall} value={filtroFechas.inicio} onChange={(e) => setFiltroFechas({...filtroFechas, inicio: e.target.value})} />
                  <input type="date" className={s.inputSmall} value={filtroFechas.fin} onChange={(e) => setFiltroFechas({...filtroFechas, fin: e.target.value})} />
                  <button className={`${s.btn} ${s.btnDark}`} onClick={() => generarContraste(filtroFechas.inicio, filtroFechas.fin)} disabled={loading}>
                    {loading ? '...' : 'BALANCE'}
                  </button>
                </div>
              </div>

              <table className={s.table}>
                <thead className={s.thead}>
                  <tr>
                    <th className={s.th}>INSUMO</th>
                    <th className={s.th}>SISTEMA (ESPERADO)</th>
                    <th className={s.th}>VENTAS (-)</th>
                    <th className={s.th} style={{ backgroundColor: 'var(--color-bg-muted)' }}>FÍSICO REAL</th>
                    <th className={s.th}>DIFERENCIA</th>
                    <th className={s.th} style={{ textAlign: 'right' }}>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {contrasteDataFiltrado.length === 0 ? (
                    <tr><td colSpan="6" className={s.emptyState}>Genera un balance para comenzar la auditoría.</td></tr>
                  ) : (
                    contrasteDataFiltrado.map((row) => {
                      const inputVal = conteos[row.id];
                      const tieneConteo = inputVal !== undefined && inputVal !== '';
                      const diferenciaReal = tieneConteo ? (parseFloat(inputVal) - parseFloat(row.stock_esperado)).toFixed(2) : '-';
                      const yaAuditado = auditados.includes(row.id);
                      
                      let difColorClass = '';
                      if (tieneConteo) {
                        if (parseFloat(diferenciaReal) < 0) difColorClass = s.textDanger;
                        else if (parseFloat(diferenciaReal) > 0) difColorClass = s.textSuccess;
                      }

                      return (
                        <tr key={row.id} className={yaAuditado ? s.rowAudited : ''} style={{ opacity: yaAuditado ? 0.6 : 1 }}>
                          <td className={s.td} style={{ fontWeight: '700' }}>{row.insumo}</td>
                          <td className={s.td} style={{ fontWeight: '700' }}>{row.stock_esperado} <small>{row.unidad}</small></td>
                          <td className={`${s.td} ${s.textDanger}`} style={{ fontWeight: '700' }}>{row.vendido !== '0.00' ? `-${row.vendido}` : '0.00'}</td>
                          <td className={s.td} style={{ backgroundColor: yaAuditado ? 'transparent' : 'var(--color-bg-muted)', padding: '15px' }}>
                            <input 
                              type="number" 
                              className={s.tableInputCenter}
                              placeholder="0.00"
                              value={conteos[row.id] || ''}
                              readOnly={!puedeEditar || yaAuditado}
                              onChange={(e) => actualizarConteo(row.id, e.target.value)} 
                            />
                          </td>
                          <td className={`${s.td} ${difColorClass}`} style={{ fontWeight: '900' }}>
                            {tieneConteo ? (parseFloat(diferenciaReal) > 0 ? `+${diferenciaReal}` : diferenciaReal) : '-'}
                          </td>
                          <td className={s.td} style={{ textAlign: 'right' }}>
                            <button 
                              className={yaAuditado ? `${s.btn} ${s.btnSuccess} ${s.btnSmall}` : `${s.btn} ${s.btnPrimary} ${s.btnSmall}`}
                              onClick={() => handleGuardarConteo(row)}
                              disabled={loading || !tieneConteo || yaAuditado}
                            >
                              {yaAuditado ? 'OK' : 'GUARDAR'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLA: HISTORIAL DE MOVIMIENTOS */}
          {activeSubTab === 'movimientos' && (
            <div className={`${s.adminCard} ${s.tableContainer}`}>
              <div className={s.tableHeader}>
                <h3 className={s.cardTitle} style={{ margin: 0 }}>Historial de Movimientos</h3>
              </div>
              {/* 💡 Eliminamos el style minWidth fijo para que .tableContainer maneje el overflow horizontal */}
              <table className={s.table}>
                <thead className={s.thead}>
                  <tr>
                    <th className={s.th}>FECHA</th>
                    <th className={s.th}>INSUMO</th>
                    <th className={s.th}>TIPO</th>
                    <th className={s.th}>CANTIDAD</th>
                    <th className={s.th}>MOTIVO</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.length === 0 ? (
                    <tr><td colSpan="5" className={s.emptyState}>No hay registros de movimientos.</td></tr>
                  ) : (
                    movimientos.map(m => (
                      <tr key={m.id}>
                        <td className={`${s.td} ${s.textMuted}`} style={{ fontSize: '12px' }}>{new Date(m.created_at).toLocaleString()}</td>
                        <td className={s.td} style={{ fontWeight: '700' }}>{m.insumo?.nombre}</td>
                        <td className={`${s.td} ${m.tipo === 'ENTRADA' ? s.textSuccess : s.textDanger}`} style={{ fontWeight: '800' }}>{m.tipo}</td>
                        <td className={s.td} style={{ fontWeight: '700' }}>{m.cantidad_afectada}</td>
                        <td className={`${s.td} ${s.textMuted}`} style={{ fontSize: '13px' }}>{m.motivo}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventariosTab;

/**
 * COMPONENTE INTERNO: SearchableSelect 
 */
const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  disabled, 
  placeholder = "Buscar...",
  valueKey = "id", 
  labelKey = "nombre",
  formatLabel
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find((opt) => String(opt[valueKey]) === String(value));
    if (selected) {
      setSearchTerm(selected[labelKey]);
    } else {
      setSearchTerm("");
    }
  }, [value, options, valueKey, labelKey]);

  const filteredOptions = options.filter(opt =>
    (opt[labelKey] || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        className={s.inputField}
        value={searchTerm}
        disabled={disabled}
        placeholder={placeholder}
        style={{ backgroundColor: disabled ? "var(--color-bg-muted)" : "white" }}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          if (value) onChange(""); 
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false);
            const selected = options.find((opt) => String(opt[valueKey]) === String(value));
            if (selected) setSearchTerm(selected[labelKey]);
            else setSearchTerm("");
          }, 200);
        }}
      />
      
      {isOpen && !disabled && (
        <ul className={s.dropdownList} style={{ position: 'absolute', zIndex: 100, width: '100%', maxHeight: '200px', overflowY: 'auto' }}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, index) => (
            <li
              key={index}
              className={s.dropdownItem}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt[valueKey]);
                setSearchTerm(opt[labelKey]);
                setIsOpen(false);
              }}
            >
              {formatLabel ? formatLabel(opt) : opt[labelKey]}
            </li>
          )) : (
            <li className={s.dropdownItem} style={{ color: 'var(--color-text-muted)' }}>
              Sin resultados...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};