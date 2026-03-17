// Archivo: src/modules/Admin/components/InventariosTab.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useInventarios } from "../../../hooks/useInventariosTab"; 
import s from "../AdminPage.module.css"; 
import { hasPermission } from "../../../utils/checkPermiso"; // 🛡️ Importamos seguridad

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

  // 🛡️ SEGURIDAD INTERNA (RBAC)
  const puedeEditar = hasPermission('editar_inventario');

  // --- ESTADOS VISUALES ---
  const [activeSubTab, setActiveSubTab] = useState('stock'); 
  const [filtroFechas, setFiltroFechas] = useState({ 
    inicio: new Date().toISOString().split('T')[0], 
    fin: new Date().toISOString().split('T')[0] 
  });
  
  const [nuevoMov, setNuevoMov] = useState({ insumo_id: '', tipo: 'ENTRADA', cantidad: '', motivo: '' });

  const insumoSeleccionado = useMemo(() => insumos?.find(i => i.id === Number(nuevoMov.insumo_id)), [insumos, nuevoMov.insumo_id]);
  const motivosDisponibles = useMemo(() => motivosCatalogo?.filter(m => m.tipo === nuevoMov.tipo) || [], [motivosCatalogo, nuevoMov.tipo]);

  // --- HANDLERS ---
  const handleSubmitMovimiento = async (e) => {
    e.preventDefault();
    if (!puedeEditar) return; // Bloqueo de seguridad
    if (!nuevoMov.insumo_id) return alert("Por favor selecciona un insumo de la lista.");

    const res = await procesarNuevoMovimiento(nuevoMov, insumoSeleccionado, usuarioId);
    
    if (res.success) {
      alert("Movimiento guardado.");
      setNuevoMov({ insumo_id: '', tipo: 'ENTRADA', cantidad: '', motivo: '' });
    } else {
      alert(res.error);
    }
  };

  const handleGuardarConteo = async (row) => {
    if (!puedeEditar) return; // Bloqueo de seguridad
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)', margin: 0 }}>
        Control de Inventarios
      </h2>

      {/* Navegación de Sub-pestañas */}
      <nav style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px', overflowX: 'auto' }}>
        <button 
          className={`${s.navItem} ${activeSubTab === 'stock' ? s.activeNavItem : ''}`} 
          style={{ width: 'auto', padding: '8px 20px', whiteSpace: 'nowrap' }}
          onClick={() => setActiveSubTab('stock')}
        >
          📦 EXISTENCIAS
        </button>
        <button 
          className={`${s.navItem} ${activeSubTab === 'movimientos' ? s.activeNavItem : ''}`} 
          style={{ width: 'auto', padding: '8px 20px', whiteSpace: 'nowrap' }}
          onClick={() => setActiveSubTab('movimientos')}
        >
          📜 HISTORIAL
        </button>
        <button 
          className={`${s.navItem} ${activeSubTab === 'contraste' ? s.activeNavItem : ''}`} 
          style={{ width: 'auto', padding: '8px 20px', whiteSpace: 'nowrap' }}
          onClick={() => setActiveSubTab('contraste')}
        >
          ⚖️ CIERRE DE TURNO
        </button>
      </nav>

      <div className={activeSubTab === 'contraste' ? "" : "admin-split-layout-sidebar"}>
        
        {/* PANEL DE MOVIMIENTO MANUAL (SIDEBAR) - Solo editable si tiene permiso */}
        {activeSubTab !== 'contraste' && (
          <aside className={s.adminCard} style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
              {puedeEditar ? 'Nuevo Movimiento' : 'Consulta de Insumo'}
            </h3>
            <form onSubmit={handleSubmitMovimiento} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>INSUMO</label>
                <SearchableSelect 
                  options={insumos || []}
                  value={nuevoMov.insumo_id}
                  valueKey="id"
                  labelKey="nombre"
                  placeholder="🔍 Buscar producto..."
                  formatLabel={(opt) => `${opt.nombre} (Stock: ${opt.stock_fisico} ${opt.unidad})`}
                  disabled={loading} // Se mantiene deshabilitado si carga, pero el onChange se bloquea por permisos si es necesario
                  onChange={(val) => setNuevoMov({...nuevoMov, insumo_id: val})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>OPERACIÓN</label>
                  <select 
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                    value={nuevoMov.tipo} 
                    disabled={!puedeEditar}
                    onChange={(e) => setNuevoMov({...nuevoMov, tipo: e.target.value, motivo: ''})}
                  >
                    <option value="ENTRADA">Entrada (+)</option>
                    <option value="MERMA">Merma (-)</option>
                    <option value="SALIDA">Salida (-)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>CANTIDAD</label>
                  <input 
                    type="number" step="0.01"
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                    value={nuevoMov.cantidad} 
                    onChange={(e) => setNuevoMov({...nuevoMov, cantidad: e.target.value})} 
                    required 
                    readOnly={!puedeEditar}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>MOTIVO</label>
                <select 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                  value={nuevoMov.motivo} 
                  disabled={!puedeEditar}
                  onChange={(e) => setNuevoMov({...nuevoMov, motivo: e.target.value})} 
                  required
                >
                  <option value="">-- Selecciona Motivo --</option>
                  {motivosDisponibles.map(m => <option key={m.id} value={m.nombre_motivo}>{m.nombre_motivo}</option>)}
                </select>
                <small style={{ fontSize: '10px', color: 'var(--color-primary)', display: 'block', marginTop: '5px', fontWeight: '700' }}>
                   {insumoSeleccionado ? `UNIDAD: ${insumoSeleccionado.unidad}` : 'Selecciona un insumo para ver la U.M.'}
                </small>
              </div>

              {puedeEditar && (
                <button 
                  type="submit" 
                  className={s.btnLogout} 
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', width: '100%', marginTop: '10px', padding: '12px' }}
                  disabled={loading}
                >
                  {loading ? 'GUARDANDO...' : 'CONFIRMAR MOVIMIENTO'}
                </button>
              )}
            </form>
          </aside>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          
          {/* VISTA: EXISTENCIAS */}
          {activeSubTab === 'stock' && (
            <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto' }}>
              <div style={{ padding: '15px', borderBottom: '1px solid var(--color-border)' }}>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                  placeholder="🔍 Filtrar existencias..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>INSUMO</th>
                    <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>STOCK FÍSICO 🔒</th>
                    <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-primary)' }}>ESTIMADO ⚡</th>
                    <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>U.M.</th>
                    <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>CATEGORÍA</th>
                  </tr>
                </thead>
                <tbody>
                  {insumosFiltrados.map(insumo => (
                    <tr key={insumo.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                      <td style={{ padding: '15px', fontWeight: '700' }}>{insumo.nombre}</td>
                      <td style={{ padding: '15px', fontWeight: '700', color: 'var(--color-text-muted)' }}>{insumo.stock_fisico}</td>
                      <td style={{ padding: '15px', fontWeight: '800', color: 'var(--color-primary)' }}>{insumo.stock_estimado}</td>
                      <td style={{ padding: '15px', color: 'var(--color-text-muted)' }}>{insumo.unidad}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--color-bg-app)', color: 'var(--color-text-main)' }}>
                          {insumo.categoria?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VISTA: CIERRE DE TURNO (AUDITORÍA) */}
          {activeSubTab === 'contraste' && (
            <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto' }}>
              <div style={{ 
                padding: '20px', 
                borderBottom: '1px solid var(--color-border)', 
                display: 'flex', 
                flexWrap: 'wrap',
                justifyContent: 'space-between', 
                alignItems: 'center', 
                backgroundColor: 'var(--color-bg-muted)',
                gap: '15px'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Auditoría y Cierre</h3>
                  {contrasteData.length > 0 && (
                    <div style={{ fontSize: '12px', marginTop: '5px', fontWeight: '700', color: auditados.length === contrasteData.length ? 'var(--color-success)' : 'var(--color-primary)' }}>
                      Progreso: {auditados.length} de {contrasteData.length}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <select 
                    style={{ padding: '8px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', fontSize: '12px' }}
                    value={filtroAuditoria} 
                    onChange={(e) => setFiltroAuditoria(e.target.value)}
                  >
                    <option value="todos">📋 Todos</option>
                    <option value="pendientes">⏳ Pendientes</option>
                  </select>
                  <input type="date" style={{ padding: '8px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', fontSize: '12px' }} value={filtroFechas.inicio} onChange={(e) => setFiltroFechas({...filtroFechas, inicio: e.target.value})} />
                  <input type="date" style={{ padding: '8px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', fontSize: '12px' }} value={filtroFechas.fin} onChange={(e) => setFiltroFechas({...filtroFechas, fin: e.target.value})} />
                  <button className={s.btnLogout} style={{ backgroundColor: 'var(--color-text-main)', color: 'white', border: 'none', padding: '8px 15px' }} onClick={() => generarContraste(filtroFechas.inicio, filtroFechas.fin)} disabled={loading}>
                    {loading ? '...' : 'BALANCE'}
                  </button>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '15px', fontSize: '12px' }}>INSUMO</th>
                    <th style={{ padding: '15px', fontSize: '12px' }}>ESPERADO</th>
                    <th style={{ padding: '15px', fontSize: '12px' }}>VENTAS (-)</th>
                    <th style={{ padding: '15px', fontSize: '12px', backgroundColor: '#fff7ed' }}>FÍSICO</th>
                    <th style={{ padding: '15px', fontSize: '12px' }}>DIFERENCIA</th>
                    <th style={{ padding: '15px', fontSize: '12px', textAlign: 'right' }}>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {contrasteDataFiltrado.map((row) => {
                    const inputVal = conteos[row.id];
                    const tieneConteo = inputVal !== undefined && inputVal !== '';
                    const diferenciaReal = tieneConteo ? (parseFloat(inputVal) - parseFloat(row.stock_esperado)).toFixed(2) : '-';
                    const yaAuditado = auditados.includes(row.id);

                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--color-bg-muted)', backgroundColor: yaAuditado ? 'var(--color-bg-app)' : 'transparent', opacity: yaAuditado ? 0.7 : 1 }}>
                        <td style={{ padding: '15px', fontWeight: '700' }}>{row.insumo}</td>
                        <td style={{ padding: '15px', fontWeight: '700' }}>{row.stock_esperado} <small>{row.unidad}</small></td>
                        <td style={{ padding: '15px', color: 'var(--color-danger)', fontWeight: '700' }}>{row.vendido !== '0.00' ? `-${row.vendido}` : '0.00'}</td>
                        <td style={{ padding: '15px', backgroundColor: yaAuditado ? 'transparent' : '#fff7ed' }}>
                          <input 
                            type="number" 
                            style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', textAlign: 'center', fontWeight: '800' }}
                            placeholder="0.00"
                            value={conteos[row.id] || ''}
                            readOnly={!puedeEditar || yaAuditado}
                            onChange={(e) => actualizarConteo(row.id, e.target.value)} 
                          />
                        </td>
                        <td style={{ padding: '15px', fontWeight: '900', color: parseFloat(diferenciaReal) < 0 ? 'var(--color-danger)' : parseFloat(diferenciaReal) > 0 ? 'var(--color-success)' : 'inherit' }}>
                          {tieneConteo ? (parseFloat(diferenciaReal) > 0 ? `+${diferenciaReal}` : diferenciaReal) : '-'}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'right' }}>
                          <button 
                            className={s.btnLogout} 
                            style={{ backgroundColor: yaAuditado ? 'var(--color-success)' : 'var(--color-primary)', color: 'white', border: 'none', fontSize: '11px', padding: '8px 12px' }}
                            onClick={() => handleGuardarConteo(row)}
                            disabled={loading || !tieneConteo || !puedeEditar || yaAuditado}
                          >
                            {yaAuditado ? '✅ OK' : 'GUARDAR'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* VISTA: HISTORIAL MOVIMIENTOS */}
          {activeSubTab === 'movimientos' && (
            <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Historial de Movimientos</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={{ padding: '15px', fontSize: '12px' }}>FECHA</th>
                    <th style={{ padding: '15px', fontSize: '12px' }}>INSUMO</th>
                    <th style={{ padding: '15px', fontSize: '12px' }}>TIPO</th>
                    <th style={{ padding: '15px', fontSize: '12px' }}>CANT.</th>
                    <th style={{ padding: '15px', fontSize: '12px' }}>MOTIVO</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos?.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                      <td style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>{new Date(m.created_at).toLocaleString()}</td>
                      <td style={{ padding: '15px', fontWeight: '700' }}>{m.insumo?.nombre}</td>
                      <td style={{ padding: '15px', fontWeight: '800', color: m.tipo === 'ENTRADA' ? 'var(--color-success)' : 'var(--color-danger)' }}>{m.tipo}</td>
                      <td style={{ padding: '15px', fontWeight: '700' }}>{m.cantidad_afectada}</td>
                      <td style={{ padding: '15px', color: 'var(--color-text-muted)', fontSize: '13px' }}>{m.motivo}</td>
                    </tr>
                  ))}
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
 * SUB-COMPONENTE: SearchableSelect 
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
    String(opt[labelKey]).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={searchTerm}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "var(--radius-ui)",
          border: "1px solid var(--color-border)",
          fontSize: "14px",
          boxSizing: "border-box",
          backgroundColor: disabled ? "var(--color-bg-app)" : "white"
        }}
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
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '200px',
          overflowY: 'auto',
          background: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-ui)',
          zIndex: 1000,
          margin: '4px 0 0 0',
          padding: 0,
          listStyle: 'none',
          boxShadow: 'var(--shadow-ui)'
        }}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, index) => (
            <li
              key={index}
              style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid var(--color-bg-muted)', fontSize: '13px' }}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt[valueKey]);
                setSearchTerm(opt[labelKey]);
                setIsOpen(false);
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-bg-app)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {formatLabel ? formatLabel(opt) : opt[labelKey]}
            </li>
          )) : (
            <li style={{ padding: '10px 15px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              No se encontraron coincidencias...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};