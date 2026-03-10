import React, { useState } from 'react';
import s from './MeseroTab.module.css'; 
import { useInventarios } from '../../../hooks/useInventarios';

// --- SUB-VISTA 1: EXISTENCIAS (STOCK ACTUAL) ---
const ExistenciasView = ({ insumos, loading }) => (
  <div style={{ background: 'white', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
      <h3>Estatus de Existencias</h3>
      <span className={s.textMuted}>{insumos.length} Insumos registrados</span>
    </div>
    
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem' }}>
          <th style={{ padding: '12px' }}>INSUMO</th>
          <th>CATEGORÍA</th>
          <th>STOCK ACTUAL</th>
          <th>UNIDAD</th>
          <th>COSTO UNIT.</th>
          <th>ESTADO</th>
        </tr>
      </thead>
      <tbody>
        {insumos.map(ins => {
          const esBajo = ins.caja_master <= (ins.dias_reabastecimiento || 0);
          return (
            <tr key={ins.id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '0.95rem' }}>
              <td style={{ padding: '15px 12px' }}>
                <strong>{ins.nombre}</strong>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ins.modelo || 'S/M'}</div>
              </td>
              <td>{ins.cat_categoria_insumos?.nombre || 'General'}</td>
              <td style={{ fontWeight: '700', color: esBajo ? '#ef4444' : '#1e293b' }}>
                {ins.caja_master}
              </td>
              <td style={{ color: '#64748b' }}>{ins.cat_unidades_medida?.abreviatura || 'pza'}</td>
              <td>${parseFloat(ins.costo_unitario || 0).toFixed(2)}</td>
              <td>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  background: esBajo ? '#fee2e2' : '#dcfce7',
                  color: esBajo ? '#991b1b' : '#166534'
                }}>
                  {esBajo ? 'REABASTECER' : 'NORMAL'}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// --- SUB-VISTA 2: MOVIMIENTOS (HISTORIAL DE AUDITORÍA) ---
const MovimientosView = ({ movimientos }) => (
  <div style={{ background: 'white', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
    <h3>Bitácora de Movimientos</h3>
    <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem' }}>
          <th style={{ padding: '12px' }}>FECHA</th>
          <th>TIPO</th>
          <th>INSUMO</th>
          <th>CANTIDAD</th>
          <th>USUARIO</th>
          <th>MOTIVO</th>
        </tr>
      </thead>
      <tbody>
        {movimientos.map(m => (
          <tr key={m.id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '0.9rem' }}>
            <td style={{ padding: '12px' }}>{new Date(m.created_at).toLocaleString()}</td>
            <td>
              <b style={{ color: m.tipo === 'ENTRADA' ? '#10b981' : '#f59e0b' }}>{m.tipo}</b>
            </td>
            <td>{m.lista_insumo?.nombre}</td>
            <td>{m.cantidad_afectada}</td>
            <td>{m.usuarios_internos?.nombre}</td>
            <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{m.motivo}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- SUB-VISTA 3: CONTRASTE (CEREBRO ANTIFRAUDE) ---
const ContrasteView = ({ generarContraste, contrasteData, loading }) => {
  const [range, setRange] = useState({ inicio: '', fin: '' });

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div style={{ background: 'white', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
        <h3>Reporte de Contraste Antifraude</h3>
        <p className={s.textMuted}>Cruza tus ventas contra lo que deberías tener en stock.</p>
        
        <div style={{ display: 'flex', gap: '15px', marginTop: '20px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className={s.formLabel}>Desde</label>
            <input type="date" className={s.input} onChange={e => setRange({...range, inicio: e.target.value})} />
          </div>
          <div style={{ flex: 1 }}>
            <label className={s.formLabel}>Hasta</label>
            <input type="date" className={s.input} onChange={e => setRange({...range, fin: e.target.value})} />
          </div>
          <button 
            className={s.btnOrder} 
            style={{ width: 'auto', padding: '0 30px', height: '45px' }}
            onClick={() => generarContraste(range.inicio, range.fin)}
            disabled={loading || !range.inicio}
          >
            {loading ? 'CALCULANDO...' : 'GENERAR COMPARATIVA'}
          </button>
        </div>
      </div>

      <div style={{ background: 'white', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px' }}>INSUMO</th>
              <th>COMPRADO (+)</th>
              <th>VENDIDO TEÓRICO (-)</th>
              <th>MERMAS REG.</th>
              <th>DIFERENCIA (FUGA)</th>
            </tr>
          </thead>
          <tbody>
            {contrasteData.map((it, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '15px 12px' }}><strong>{it.insumo}</strong></td>
                <td>{it.comprado} {it.unidad}</td>
                <td>{it.vendido_teorico} {it.unidad}</td>
                <td>{it.mermas_reg}</td>
                <td style={{ 
                  fontWeight: '700', 
                  color: it.diferencia < 0 ? '#ef4444' : '#10b981' 
                }}>
                  {it.diferencia.toFixed(3)} {it.unidad}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const InventariosTab = ({ sucursalId, usuarioId }) => {
  const [activeTab, setActiveTab] = useState('existencias');
  const { insumos, movimientos, contrasteData, loading, generarContraste } = useInventarios(sucursalId);

  return (
    <div className={s.tabContainer}>
      <div className={s.headerRow}>
        <div style={{ display: 'flex', gap: '10px', background: '#f1f5f9', padding: '5px', borderRadius: '15px' }}>
          <button 
            className={activeTab === 'existencias' ? s.btnOrder : s.btnCancel} 
            style={{ margin: 0, padding: '10px 25px' }}
            onClick={() => setActiveTab('existencias')}
          >
            📦 STOCK
          </button>
          <button 
            className={activeTab === 'movimientos' ? s.btnOrder : s.btnCancel} 
            style={{ margin: 0, padding: '10px 25px' }}
            onClick={() => setActiveTab('movimientos')}
          >
            🔄 AUDITORÍA
          </button>
          <button 
            className={activeTab === 'contraste' ? s.btnOrder : s.btnCancel} 
            style={{ margin: 0, padding: '10px 25px' }}
            onClick={() => setActiveTab('contraste')}
          >
            ⚖️ CONTRASTE
          </button>
        </div>
      </div>

      <div style={{ marginTop: '25px' }}>
        {activeTab === 'existencias' && <ExistenciasView insumos={insumos} loading={loading} />}
        {activeTab === 'movimientos' && <MovimientosView movimientos={movimientos} />}
        {activeTab === 'contraste' && (
          <ContrasteView 
            generarContraste={generarContraste} 
            contrasteData={contrasteData} 
            loading={loading} 
          />
        )}
      </div>
    </div>
  );
};