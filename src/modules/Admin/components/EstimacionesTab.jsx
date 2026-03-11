import React, { useState, useMemo } from 'react';
import { useEstimaciones } from "../../../hooks/useEstimacionesTab"; 
import s from "../AdminPage.module.css"; 

const EstimacionesTab = () => {
  const { 
    sugerenciasFiltradas, 
    proveedores, 
    filtroProveedor, 
    setFiltroProveedor, 
    presupuestoTotal, 
    loading, 
    error,
    recargarDatos,
    guardarPolitica 
  } = useEstimaciones();

  // --- ESTADOS PARA SUB-TABS ---
  const [subTab, setSubTab] = useState('config'); // 'config' o 'compras'
  
  // --- ESTADO PARA LA LISTA DE COMPRA (Checklist) ---
  const [compradosIds, setCompradosIds] = useState([]);

  // --- ESTADOS DE EDICIÓN ---
  const [editandoId, setEditandoId] = useState(null);
  const [tempPolitica, setTempPolitica] = useState({ cobertura: 7, seguridad: 2 });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
  };

  // Filtrar solo los que tienen cantidad mayor a 0 y no han sido comprados
  const listaParaComprar = useMemo(() => {
    return sugerenciasFiltradas.filter(item => 
      item.cajas_a_pedir > 0 && !compradosIds.includes(item.insumo_id)
    );
  }, [sugerenciasFiltradas, compradosIds]);

  const handleMarcarComprado = (id) => {
    setCompradosIds([...compradosIds, id]);
  };

  const handleStartEdit = (item) => {
    setEditandoId(item.insumo_id);
    setTempPolitica({ 
      cobertura: item.dias_cobertura_objetivo || 7, 
      seguridad: item.dias_stock_seguridad || 2 
    });
  };

  const handleSave = async (insumoId) => {
    const res = await guardarPolitica(insumoId, tempPolitica.cobertura, tempPolitica.seguridad);
    if (res.success) setEditandoId(null);
  };

  if (loading && !sugerenciasFiltradas.length) return <div style={{padding: '40px', textAlign: 'center'}}>📊 Cargando inteligencia...</div>;

  return (
    <div className={s.container} style={{ display: 'block' }}>
      
      {/* 1. SELECTOR DE SUB-TAB */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          className={subTab === 'config' ? s.navBtnActive : s.navBtn} 
          onClick={() => setSubTab('config')}
          style={{ padding: '8px 20px', borderRadius: '8px' }}
        >
          ⚙️ ESTRATEGIA (PAR LEVELS)
        </button>
        <button 
          className={subTab === 'compras' ? s.navBtnActive : s.navBtn} 
          onClick={() => setSubTab('compras')}
          style={{ padding: '8px 20px', borderRadius: '8px', position: 'relative' }}
        >
          🛒 LISTA DE MANDADO
          {listaParaComprar.length > 0 && (
            <span style={{ 
              position: 'absolute', top: '-5px', right: '-5px', 
              background: '#ef4444', color: 'white', borderRadius: '50%', 
              padding: '2px 7px', fontSize: '10px' 
            }}>
              {listaParaComprar.length}
            </span>
          )}
        </button>
      </div>

      {/* 2. PANEL DE PRESUPUESTO (Contextual) */}
      <section className={s.headerTop} style={{ marginBottom: '25px', alignItems: 'flex-end' }}>
        <div>
          <h2 className={s.mainTitle} style={{ fontSize: '1.8rem', marginBottom: '5px' }}>
            {subTab === 'config' ? 'Proyección de ' : 'Lista de '} 
            <span className={s.accent}>Compras</span>
          </h2>
          <p className={s.textMuted}>
            {subTab === 'config' ? 'Ajusta tus niveles de inventario' : 'Artículos pendientes por adquirir'}
          </p>
        </div>

        <div className={s.card} style={{ padding: '15px 25px', textAlign: 'right', minWidth: '320px', borderLeft: '6px solid #16a34a' }}>
          <span className={s.label}>Presupuesto Estimado</span>
          <div className={s.priceTag} style={{ fontSize: '2.2rem', color: '#16a34a' }}>
            {formatCurrency(presupuestoTotal)}
          </div>
        </div>
      </section>

      {/* 3. VISTA: ESTRATEGIA (La tabla que ya tenías) */}
      {subTab === 'config' && (
        <>
          <div className={s.card} style={{ marginBottom: '20px', padding: '15px' }}>
            <div className={s.headerFlex}>
              <div className={s.formGroup} style={{ marginBottom: 0, flex: 1, maxWidth: '400px' }}>
                <label className={s.label}>Filtrar Proveedor</label>
                <select className={s.input} value={filtroProveedor} onChange={(e) => setFiltroProveedor(e.target.value)}>
                  <option value="todos">🚚 Todos</option>
                  {proveedores.map(p => <option key={p.id} value={p.nombre_empresa}>{p.nombre_empresa}</option>)}
                </select>
              </div>
              <button className={s.btnEdit} onClick={recargarDatos}>🔄 REFRESCAR</button>
            </div>
          </div>

          <div className={s.card}>
            <div className={s.tableWrapper}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>🛒 Cobertura</th>
                    <th>🛡️ Seguridad</th>
                    <th>Stock Hoy</th>
                    <th>Sugerencia</th>
                    <th>Costo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sugerenciasFiltradas.map((item) => (
                    <tr key={item.insumo_id}>
                      <td style={{ fontWeight: '700' }}>{item.insumo_nombre}</td>
                      <td>
                        {editandoId === item.insumo_id ? (
                          <input type="number" className={s.input} style={{ width: '60px' }} value={tempPolitica.cobertura} onChange={(e) => setTempPolitica({...tempPolitica, cobertura: e.target.value})} />
                        ) : <span>{item.dias_cobertura_objetivo || 7} días</span>}
                      </td>
                      <td>
                        {editandoId === item.insumo_id ? (
                          <input type="number" className={s.input} style={{ width: '60px' }} value={tempPolitica.seguridad} onChange={(e) => setTempPolitica({...tempPolitica, seguridad: e.target.value})} />
                        ) : <span>{item.dias_stock_seguridad || 2} días</span>}
                      </td>
                      <td>{parseFloat(item.stock_fisico_hoy).toFixed(1)}</td>
                      <td style={{ fontWeight: '800', color: item.cajas_a_pedir > 0 ? '#10b981' : '#64748b' }}>
                        {item.cajas_a_pedir} Cajas
                      </td>
                      <td className={s.priceTag}>{formatCurrency(item.presupuesto_estimado)}</td>
                      <td style={{ textAlign: 'right' }}>
                        {editandoId === item.insumo_id ? (
                          <button className={s.btnPrimary} style={{ padding: '5px 10px' }} onClick={() => handleSave(item.insumo_id)}>OK</button>
                        ) : (
                          <button className={s.btnEdit} onClick={() => handleStartEdit(item)}>⚙️</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 4. VISTA: LISTA DE MANDADO (Agrupada por Proveedor) */}
      {subTab === 'compras' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {listaParaComprar.length === 0 ? (
            <div className={s.card} style={{ textAlign: 'center', padding: '50px' }}>
              <h3>🎉 ¡Todo comprado! No hay pendientes.</h3>
            </div>
          ) : (
            // Agrupamos dinámicamente por proveedor
            Object.entries(
              listaParaComprar.reduce((acc, item) => {
                const prov = item.proveedor_nombre || 'Sin Proveedor';
                if (!acc[prov]) acc[prov] = [];
                acc[prov].push(item);
                return acc;
              }, {})
            ).map(([proveedor, insumos]) => (
              <div key={proveedor} className={s.card} style={{ padding: '0' }}>
                <div style={{ 
                  background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <h3 style={{ margin: 0, color: '#334155' }}>🚚 {proveedor}</h3>
                  <span className={s.priceTag} style={{ fontSize: '1rem' }}>
                    Subtotal: {formatCurrency(insumos.reduce((sum, i) => sum + i.presupuesto_estimado, 0))}
                  </span>
                </div>
                <div className={s.tableWrapper}>
                  <table className={s.table} style={{ marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}></th>
                        <th>Insumo</th>
                        <th>Cantidad a Comprar</th>
                        <th>Costo Aprox</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insumos.map(ins => (
                        <tr key={ins.insumo_id}>
                          <td><input type="checkbox" style={{ transform: 'scale(1.3)' }} onChange={() => handleMarcarComprado(ins.insumo_id)} /></td>
                          <td style={{ fontWeight: '600' }}>{ins.insumo_nombre}</td>
                          <td style={{ color: '#16a34a', fontWeight: 'bold' }}>
                            {ins.cajas_a_pedir} Cajas
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                              ({parseFloat(ins.cantidad_a_comprar_teorica).toFixed(1)} unidades base)
                            </span>
                          </td>
                          <td>{formatCurrency(ins.presupuesto_estimado)}</td>
                          <td>
                            <button 
                              className={s.btnPrimary} 
                              style={{ padding: '4px 10px', fontSize: '11px', background: '#10b981' }}
                              onClick={() => handleMarcarComprado(ins.insumo_id)}
                            >
                              ✓ COMPRADO
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EstimacionesTab;