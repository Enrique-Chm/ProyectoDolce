// Archivo: src/modules/Admin/components/EstimacionesTab.jsx
import React, { useState, useMemo } from 'react';
import { useEstimacionesTab } from "../../../hooks/useEstimacionesTab"; 
import s from "../AdminPage.module.css"; 
import { formatCurrency } from "../../../utils/formatCurrency"; 

const EstimacionesTab = ({ sucursalId, usuarioId }) => {
  const { 
    sugerenciasFiltradas, proveedores, filtroProveedor, setFiltroProveedor, 
    presupuestoTotal, loading, recargarDatos, guardarPolitica,
    compradosIds, confirmarCompra
  } = useEstimacionesTab();

  const [subTab, setSubTab] = useState('config');
  const [editandoId, setEditandoId] = useState(null);
  const [tempPolitica, setTempPolitica] = useState({ cobertura: 7, seguridad: 2 });

  const listaParaComprar = useMemo(() => {
    return sugerenciasFiltradas.filter(item => 
      item.cajas_a_pedir > 0 && !compradosIds.includes(item.insumo_id)
    );
  }, [sugerenciasFiltradas, compradosIds]);

  const handleSavePolicy = async (id) => {
    const res = await guardarPolitica(id, tempPolitica.cobertura, tempPolitica.seguridad);
    if (res.success) setEditandoId(null);
  };

  if (loading && !sugerenciasFiltradas.length) return <div className={s.tabContent}>📊 Cargando proyecciones...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* NAVEGACIÓN DE SUB-TABS: Soporte para scroll horizontal en tablets */}
      <nav style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px', overflowX: 'auto' }}>
        <button 
          className={`${s.navItem} ${subTab === 'config' ? s.activeNavItem : ''}`} 
          style={{ width: 'auto', padding: '8px 20px', whiteSpace: 'nowrap' }}
          onClick={() => setSubTab('config')}
        >
          ⚙️ ESTRATEGIA DE STOCK
        </button>
        <button 
          className={`${s.navItem} ${subTab === 'compras' ? s.activeNavItem : ''}`} 
          style={{ width: 'auto', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
          onClick={() => setSubTab('compras')}
        >
          🛒 LISTA DE MANDADO 
          {listaParaComprar.length > 0 && (
            <span style={{ 
              backgroundColor: 'var(--color-danger)', 
              color: 'white', 
              fontSize: '10px', 
              padding: '2px 6px', 
              borderRadius: '10px' 
            }}>
              {listaParaComprar.length}
            </span>
          )}
        </button>
      </nav>

      {/* HEADER CON PRESUPUESTO: Ajustado para que se apile en móviles/tablets */}
      <section style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)', margin: 0, minWidth: '250px' }}>
          {subTab === 'config' ? 'Proyección de Inventario' : 'Órdenes Sugeridas'}
        </h2>
        
        <div className={s.adminCard} style={{ 
          padding: '10px 20px', 
          borderLeft: '6px solid var(--color-success)', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-end',
          flex: '1',
          maxWidth: '300px',
          minWidth: '200px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Inversión Estimada
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--color-success)' }}>
            {formatCurrency(presupuestoTotal)}
          </div>
        </div>
      </section>

      {/* --- VISTA 1: ESTRATEGIA (TABLA RESPONSIVA) --- */}
      {subTab === 'config' && (
        <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>INSUMO</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>CONSUMO/DÍA</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>🛒 COBERTURA</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>STOCK HOY</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>SUGERENCIA</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>COSTO</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>AJUSTE</th>
              </tr>
            </thead>
            <tbody>
              {sugerenciasFiltradas.map((item) => (
                <tr key={item.insumo_id} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                  <td style={{ padding: '15px', fontWeight: '700', color: 'var(--color-text-main)' }}>{item.insumo_nombre}</td>
                  <td style={{ padding: '15px' }}>{parseFloat(item.consumo_diario_real || 0).toFixed(2)}</td>
                  <td style={{ padding: '15px' }}>
                    {editandoId === item.insumo_id ? (
                      <input 
                        type="number" 
                        style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid var(--color-primary)', boxSizing: 'border-box' }}
                        value={tempPolitica.cobertura} 
                        onChange={e => setTempPolitica({...tempPolitica, cobertura: e.target.value})} 
                        onBlur={() => handleSavePolicy(item.insumo_id)}
                        autoFocus
                      />
                    ) : (
                      <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{item.dias_cobertura_objetivo} días</span>
                    )}
                  </td>
                  <td style={{ padding: '15px' }}>{parseFloat(item.stock_fisico_hoy).toFixed(1)}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      color: item.cajas_a_pedir > 0 ? 'var(--color-success)' : 'var(--color-text-muted)', 
                      fontWeight: '800' 
                    }}>
                      {item.cajas_a_pedir} Cajas
                    </span>
                  </td>
                  <td style={{ padding: '15px', fontWeight: '600' }}>{formatCurrency(item.presupuesto_estimado)}</td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>
                    <button 
                      className={s.btnLogout} 
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => { 
                        setEditandoId(item.insumo_id); 
                        setTempPolitica({cobertura: item.dias_cobertura_objetivo, seguridad: item.dias_stock_seguridad}) 
                      }}
                    >
                      EDITAR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- VISTA 2: LISTA DE MANDADO (TARJETAS FLEXIBLES) --- */}
      {subTab === 'compras' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '15px' 
        }}>
          {listaParaComprar.map(ins => (
            <div key={ins.insumo_id} className={s.adminCard} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              padding: '20px',
              gap: '15px'
            }}>
              <div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--color-text-main)' }}>{ins.insumo_nombre}</strong>
                <p style={{ margin: '5px 0 0', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                  PROVEEDOR: {ins.proveedor_nombre}
                </p>
              </div>
              <button 
                className={s.btnLogout} 
                style={{ 
                  backgroundColor: 'var(--color-success)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 15px',
                  fontWeight: '800',
                  width: '100%'
                }} 
                onClick={() => confirmarCompra(ins, usuarioId, sucursalId)}
              >
                ✓ RECIBIR {ins.cajas_a_pedir} CAJAS
              </button>
            </div>
          ))}
          {listaParaComprar.length === 0 && (
            <div className={s.adminCard} style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              No hay compras sugeridas para los niveles actuales de stock.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EstimacionesTab;