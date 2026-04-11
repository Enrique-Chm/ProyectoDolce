// Archivo: src/modules/Admin/Tabs/Proyeccion/HistorialConsumoView.jsx
import React, { useState, useMemo } from "react";
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { SearchableSelect } from '../MenuTab/SearchableSelect'; 

export const HistorialConsumoView = ({ 
  pronosticoSemanal = [], 
  estimacionesManuales = [], 
  guardarEstimacionManual, 
  loading,
  diaProyectado 
}) => {
  const [filtroTexto, setFiltroTexto] = useState("");
  const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const mapDow = (dow) => (dow === 0 ? 6 : dow - 1);

  const opcionesPlatillos = useMemo(() => {
    const nombres = new Set();
    (pronosticoSemanal || []).forEach(p => { 
      if(p.nombre_producto) nombres.add(p.nombre_producto);
    });
    const opciones = Array.from(nombres).map(nombre => ({ nombre }));
    return [{ nombre: "Todos los platillos" }, ...opciones.sort((a, b) => a.nombre.localeCompare(b.nombre))];
  }, [pronosticoSemanal]);

  const matrizData = useMemo(() => {
    const data = (pronosticoSemanal || []).reduce((acc, curr) => {
      const { nombre_producto, dow, promedio_diario, producto_id } = curr;
      const index = mapDow(dow);
      if (!acc[nombre_producto]) {
        acc[nombre_producto] = Array(7).fill(null).map(() => ({ smart: 0, manual: null, producto_id: producto_id }));
      }
      if (acc[nombre_producto][index]) acc[nombre_producto][index].smart = Math.ceil(parseFloat(promedio_diario) || 0);
      return acc;
    }, {});

    (estimacionesManuales || []).forEach(est => {
      const nombreProd = Object.keys(data).find(key => data[key][0]?.producto_id === est.producto_id);
      if (nombreProd) {
        const index = mapDow(est.dow);
        if (data[nombreProd][index]) data[nombreProd][index].manual = est.cantidad_manual;
      }
    });
    return data;
  }, [pronosticoSemanal, estimacionesManuales]);

  const productosSemanaFiltrados = useMemo(() => {
    return Object.entries(matrizData).filter(([nombre]) => 
      !filtroTexto || nombre.toLowerCase().includes(filtroTexto.toLowerCase())
    );
  }, [matrizData, filtroTexto]);

  const handleManualChange = async (productoId, dowInTabla, valor) => {
    const dowDB = dowInTabla === 6 ? 0 : dowInTabla + 1;
    const valorFinal = valor === "" ? "" : parseFloat(valor);
    await guardarEstimacionManual(productoId, dowDB, valorFinal);
  };

  return (
    <div className={`${s.adminCard} ${s.tableContainer}`} style={{ padding: 0 }}>
      {/* CABECERA */}
      <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#0f172a' }}>
            📅 Planeación Maestra de Ventas
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
            Compara la sugerencia de la IA contra tu ajuste manual.
          </p>
        </div>
      </div>

      <div style={{ padding: "15px", borderBottom: "1px solid #eee", background: '#f8fafc' }}>
        <div style={{ minWidth: '250px', maxWidth: '400px' }}>
          <SearchableSelect
            options={opcionesPlatillos}
            value={filtroTexto === "" ? "Todos los platillos" : filtroTexto}
            onChange={(valor) => setFiltroTexto(valor === "Todos los platillos" ? "" : valor)}
            valueKey="nombre" labelKey="nombre" placeholder="🔍 Buscar platillo..."
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className={s.table}>
          <thead className={s.thead}>
            <tr>
              <th className={s.th} style={{ minWidth: '200px', position: 'sticky', left: 0, background: '#f1f5f9', zIndex: 20 }}>PRODUCTO</th>
              {diasSemana.map((d, i) => (
                <th key={d} className={s.th} style={{ 
                  textAlign: "center", 
                  minWidth: '130px',
                  backgroundColor: d === diaProyectado.substring(0,3) ? '#dbeafe' : 'inherit'
                }}>
                  {d.toUpperCase()}
                </th>
              ))}
              <th className={s.th} style={{ textAlign: "center", fontWeight: '900', background: '#f1f5f9' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className={s.emptyState} style={{ padding: '60px' }}>Sincronizando demanda...</td></tr>
            ) : (
              productosSemanaFiltrados.map(([nombre, dias]) => {
                const totalSemanal = dias.reduce((acc, curr) => 
                  acc + (curr.manual !== null ? parseFloat(curr.manual) : parseFloat(curr.smart)), 0
                );
                
                return (
                  <tr key={nombre}>
                    <td className={s.td} style={{ fontWeight: "800", fontSize: '11px', position: 'sticky', left: 0, background: 'white', zIndex: 10, borderRight: '2px solid #f1f5f9' }}>
                      {nombre.toUpperCase()}
                    </td>
                    {dias.map((info, i) => {
                      const hasManual = info.manual !== null;
                      
                      return (
                        <td key={i} className={s.td} style={{ 
                          padding: '10px 8px', 
                          backgroundColor: diasSemana[i] === diaProyectado.substring(0,3) ? '#eff6ff' : 'transparent'
                        }}>
                          {/* ↔️ CONTENEDOR HORIZONTAL */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '10px' 
                          }}>
                            
                            {/* LADO IZQUIERDO: IA */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span style={{ fontSize: '8px', fontWeight: '900', color: '#94a3b8', marginBottom: '2px' }}>IA</span>
                              <span style={{ fontSize: '14px', fontWeight: '800', color: hasManual ? '#cbd5e1' : 'var(--color-primary)' }}>
                                {info.smart}
                              </span>
                            </div>

                            {/* DIVISOR VERTICAL SUTIL */}
                            <div style={{ width: '1px', height: '25px', backgroundColor: '#e2e8f0' }} />

                            {/* LADO DERECHO: MANUAL */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span style={{ fontSize: '8px', fontWeight: '900', color: hasManual ? '#10b981' : '#94a3b8', marginBottom: '2px' }}>OBJ</span>
                              <input 
                                type="number"
                                defaultValue={hasManual ? info.manual : ""}
                                placeholder={info.smart}
                                style={{
                                  width: '45px',
                                  textAlign: 'center',
                                  border: hasManual ? '2px solid #10b981' : '1px solid #e2e8f0',
                                  background: hasManual ? '#f0fdf4' : '#fff',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: '900',
                                  color: hasManual ? '#166534' : '#64748b',
                                  padding: '4px 0',
                                  outline: 'none'
                                }}
                                onBlur={(e) => handleManualChange(info.producto_id, i, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                              />
                            </div>

                          </div>
                        </td>
                      );
                    })}
                    <td className={s.td} style={{ textAlign: 'center', fontWeight: '900', backgroundColor: '#f8fafc', color: 'var(--color-primary)' }}>
                      {totalSemanal.toFixed(0)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};