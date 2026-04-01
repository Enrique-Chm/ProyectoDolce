// Archivo: src/modules/Admin/Tabs/Proyeccion/EstrategiaView.jsx
import React, { useState } from 'react';
import { formatCurrency } from "../../../../utils/formatCurrency";

export const EstrategiaView = ({ estimates, s }) => {
  const { 
    sugerenciasFiltradas, proveedores, proyeccionProductos, 
    presupuestoTotal, guardarPolitica, puedeEditar, setFiltroProveedor 
  } = estimates;

  const [viewMode, setViewMode] = useState('insumo');
  const [filtroBuscar, setFiltroBuscar] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  
  // Estado para la política temporal
  const [tempPolitica, setTempPolitica] = useState({ 
    metodo: 'dinamico', 
    cobertura: 7, 
    seguridad: 2, 
    minimo: 0, 
    maximo: 0 
  });

  const handleSave = async (id) => {
    const res = await guardarPolitica(id, tempPolitica);
    if (res.success) setEditandoId(null);
  };

  const dataFiltrada = (viewMode === 'insumo' ? sugerenciasFiltradas : proyeccionProductos).filter(i => 
    !filtroBuscar || (i.insumo_nombre || i.nombre)?.toLowerCase().includes(filtroBuscar.toLowerCase())
  );

  return (
    <>
      <section className={s.pageHeader} style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem' }}>Análisis de Demanda y Estrategia</h2>
        <div className={s.adminCard} style={{ padding: '5px 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700' }}>Inversión Estimada:</span>
          <span style={{ color: 'var(--color-primary)', fontWeight: '800' }}>{formatCurrency(presupuestoTotal)}</span>
        </div>
      </section>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          className={`${s.btn} ${viewMode === 'insumo' ? s.btnPrimary : s.btnDark}`} 
          onClick={() => setViewMode('insumo')} 
          style={{ flex: 1 }}
        >
          📦 ESTRATEGIA INSUMOS
        </button>
        <button 
          className={`${s.btn} ${viewMode === 'producto' ? s.btnPrimary : s.btnDark}`} 
          onClick={() => setViewMode('producto')} 
          style={{ flex: 1 }}
        >
          🍔 DEMANDA PLATILLOS
        </button>
      </div>

      <div className={`${s.adminCard} ${s.tableContainer}`}>
        <div style={{ padding: "15px", display: "flex", gap: "10px" }}>
          <input 
            type="text" 
            className={s.inputField} 
            placeholder="Buscar por nombre..." 
            value={filtroBuscar} 
            onChange={(e) => setFiltroBuscar(e.target.value)} 
            style={{ flex: 2 }} 
          />
          {viewMode === 'insumo' && (
            <select className={s.inputField} onChange={(e) => setFiltroProveedor(e.target.value)} style={{ flex: 1 }}>
              <option value="todos">Todos los proveedores</option>
              {proveedores.map(p => <option key={p.id} value={p.nombre_empresa}>{p.nombre_empresa}</option>)}
            </select>
          )}
        </div>

        <table className={s.table}>
          <thead className={s.thead}>
            {viewMode === 'insumo' ? (
              <tr>
                <th className={s.th}>INSUMO</th>
                <th className={s.th}>CONS. PROMEDIO</th>
                <th className={s.th}>POLÍTICA / ESTRATEGIA</th>
                <th className={s.th}>STOCK ACTUAL</th>
                <th className={s.th}>SUGERIDO</th>
                <th className={s.th}>ACCIÓN</th>
              </tr>
            ) : (
              <tr>
                <th className={s.th}>PLATILLO</th>
                <th className={s.th}>VENTA PROMEDIO (7D)</th>
                <th className={s.th}>PREDICCIÓN PRÓX. DÍA</th>
              </tr>
            )}
          </thead>
          <tbody>
            {dataFiltrada.map((item, i) => (
              <tr key={item.insumo_id || i}>
                {viewMode === 'insumo' ? (
                  <>
                    <td className={s.td}>
                      <div style={{ fontWeight: '700' }}>{item.insumo_nombre}</div>
                      <div style={{ fontSize: '10px', color: '#666' }}>{item.nombre_empresa}</div>
                    </td>
                    <td className={s.td}>
                      {item.consumo_diario_real} <small>{item.unidad_medida}</small>
                    </td>
                    <td className={s.td}>
                      {editandoId === item.insumo_id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <select 
                            className={s.inputField} 
                            style={{ padding: '2px', fontSize: '11px' }}
                            value={tempPolitica.metodo} 
                            onChange={e => setTempPolitica({...tempPolitica, metodo: e.target.value})}
                          >
                            <option value="dinamico">Inteligente (Días)</option>
                            <option value="estatico">Manual (Cantidades)</option>
                          </select>
                          
                          {tempPolitica.metodo === 'dinamico' ? (
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <input type="number" title="Días Cobertura" className={s.inputField} style={{ width: '45px', padding: '2px' }} value={tempPolitica.cobertura} onChange={e => setTempPolitica({...tempPolitica, cobertura: e.target.value})} />
                              <input type="number" title="Días Seguridad" className={s.inputField} style={{ width: '45px', padding: '2px' }} value={tempPolitica.seguridad} onChange={e => setTempPolitica({...tempPolitica, seguridad: e.target.value})} />
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <input type="number" title="Mínimo" className={s.inputField} style={{ width: '45px', padding: '2px' }} value={tempPolitica.minimo} onChange={e => setTempPolitica({...tempPolitica, minimo: e.target.value})} />
                              <input type="number" title="Máximo" className={s.inputField} style={{ width: '45px', padding: '2px' }} value={tempPolitica.maximo} onChange={e => setTempPolitica({...tempPolitica, maximo: e.target.value})} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className={s.badge} style={{ marginBottom: '4px', display: 'inline-block' }}>
                            {item.metodo_compra === 'estatico' ? 'MANUAL' : 'AUTO'}
                          </span>
                          <div style={{ fontSize: '11px', color: '#555' }}>
                            {item.metodo_compra === 'estatico' 
                              ? `Min: ${item.stock_minimo} | Max: ${item.stock_maximo}`
                              : `Cob: ${item.dias_cobertura_objetivo}d | Seg: ${item.dias_stock_seguridad}d`
                            }
                          </div>
                        </div>
                      )}
                    </td>
                    <td className={s.td}>
                      <span style={{ color: item.stock_fisico_hoy <= 0 ? 'red' : 'inherit' }}>
                        {parseFloat(item.stock_fisico_hoy).toFixed(1)}
                      </span>
                      <small> {item.unidad_medida}</small>
                    </td>
                    <td className={s.td}>
                      <div style={{ fontWeight: '700', color: item.cajas_a_pedir > 0 ? 'var(--color-success)' : '#999' }}>
                        {item.cajas_a_pedir} <small>cajas</small>
                      </div>
                      <div style={{ fontSize: '10px' }}>
                        ({item.cantidad_sugerida} {item.unidad_medida})
                      </div>
                    </td>
                    <td className={s.td}>
                      {puedeEditar && (
                        editandoId === item.insumo_id 
                        ? <button className={`${s.btn} ${s.btnSuccess} ${s.btnSmall}`} onClick={() => handleSave(item.insumo_id)}>💾</button>
                        : <button className={`${s.btn} ${s.btnEditar} ${s.btnSmall}`} onClick={() => { 
                            setEditandoId(item.insumo_id); 
                            setTempPolitica({ 
                              metodo: item.metodo_compra, 
                              cobertura: item.dias_cobertura_objetivo, 
                              seguridad: item.dias_stock_seguridad, 
                              minimo: item.stock_minimo, 
                              maximo: item.stock_maximo 
                            }); 
                          }}>📝</button>
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td className={s.td} style={{ fontWeight: '700' }}>{item.nombre}</td>
                    <td className={s.td}>{item.promedio_diario} unidades</td>
                    <td className={s.td}><span className={s.badgeSuccess}>{item.prediccion_manana} pedidos</span></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};