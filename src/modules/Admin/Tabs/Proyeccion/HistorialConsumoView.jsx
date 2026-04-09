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

  // Ordenamos los días empezando por Lunes (Orden estándar de cocina)
  const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  
  // Mapeo: JS Date (0=Dom, 1=Lun...) -> Nuestra Tabla (0=Lun, 1=Mar... 6=Dom)
  const mapDow = (dow) => (dow === 0 ? 6 : dow - 1);

  // 🚀 1. Opciones para el buscador de platillos
  const opcionesPlatillos = useMemo(() => {
    const nombres = new Set();
    // Usamos 'nombre_producto' que es lo que devuelve el RPC 'get_pronostico_semanal_completo'
    (pronosticoSemanal || []).forEach(p => { 
      if(p.nombre_producto) nombres.add(p.nombre_producto);
    });

    const opciones = Array.from(nombres).map(nombre => ({ nombre }));
    return [
      { nombre: "Todos los platillos" },
      ...opciones.sort((a, b) => a.nombre.localeCompare(b.nombre))
    ];
  }, [pronosticoSemanal]);

  // 🚀 2. Construcción de la Matriz de Datos
  const matrizData = useMemo(() => {
    const data = (pronosticoSemanal || []).reduce((acc, curr) => {
      const { nombre_producto, dow, promedio_diario, producto_id } = curr;
      const index = mapDow(dow);
      
      if (!acc[nombre_producto]) {
        acc[nombre_producto] = Array(7).fill(null).map(() => ({
          smart: 0,
          manual: null,
          producto_id: producto_id
        }));
      }
      
      if (acc[nombre_producto][index]) {
        acc[nombre_producto][index].smart = Math.ceil(parseFloat(promedio_diario) || 0);
      }
      return acc;
    }, {});

    // Inyectamos las estimaciones manuales sobre la base de la IA
    (estimacionesManuales || []).forEach(est => {
      const nombreProd = Object.keys(data).find(
        key => data[key][0]?.producto_id === est.producto_id
      );
      if (nombreProd) {
        const index = mapDow(est.dow);
        if (data[nombreProd][index]) {
          data[nombreProd][index].manual = est.cantidad_manual;
        }
      }
    });

    return data;
  }, [pronosticoSemanal, estimacionesManuales]);

  // Filtro de búsqueda
  const productosSemanaFiltrados = useMemo(() => {
    return Object.entries(matrizData).filter(([nombre]) => 
      !filtroTexto || nombre.toLowerCase().includes(filtroTexto.toLowerCase())
    );
  }, [matrizData, filtroTexto]);

  const handleManualChange = async (productoId, dowInTabla, valor) => {
    // Reversión del DOW para la Base de Datos (0=Dom)
    const dowDB = dowInTabla === 6 ? 0 : dowInTabla + 1;
    const valorFinal = valor === "" ? "" : parseFloat(valor);
    await guardarEstimacionManual(productoId, dowDB, valorFinal);
  };

  return (
    <div className={`${s.adminCard} ${s.tableContainer}`} style={{ padding: 0 }}>
      {/* CABECERA */}
      <div style={{ 
        padding: "20px", 
        borderBottom: "1px solid #eee", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center" 
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
            📊 Planeación de Ventas Semanal
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
            El sistema calcula promedios históricos. Puedes editarlos manualmente para ajustar la demanda.
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ padding: "15px", borderBottom: "1px solid #eee", background: '#f8fafc' }}>
        <div style={{ minWidth: '250px', maxWidth: '400px', zIndex: 10 }}>
          <SearchableSelect
            options={opcionesPlatillos}
            value={filtroTexto === "" ? "Todos los platillos" : filtroTexto}
            onChange={(valor) => setFiltroTexto(valor === "Todos los platillos" ? "" : valor)}
            valueKey="nombre"
            labelKey="nombre"
            placeholder="🔍 Filtrar por platillo..."
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className={s.table}>
          <thead className={s.thead}>
            <tr>
              <th className={s.th} style={{ minWidth: '200px', position: 'sticky', left: 0, background: '#f1f5f9', zIndex: 10 }}>PRODUCTO</th>
              {diasSemana.map((d, i) => (
                <th key={d} className={s.th} style={{ 
                  textAlign: "center", 
                  backgroundColor: d === diaProyectado.substring(0,3) ? 'rgba(var(--color-primary-rgb), 0.1)' : 'inherit'
                }}>
                  {d.toUpperCase()}
                </th>
              ))}
              <th className={s.th} style={{ textAlign: "center", fontWeight: '900', background: '#f1f5f9' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className={s.emptyState}>Actualizando proyecciones...</td></tr>
            ) : (
              productosSemanaFiltrados.map(([nombre, dias]) => {
                const totalSemanal = dias.reduce((acc, curr) => 
                  acc + (curr.manual !== null ? parseFloat(curr.manual) : parseFloat(curr.smart)), 0
                );
                
                return (
                  <tr key={nombre}>
                    <td className={s.td} style={{ 
                      fontWeight: "800", 
                      fontSize: '11px', 
                      position: 'sticky', 
                      left: 0, 
                      background: 'white', 
                      zIndex: 5,
                      borderRight: '2px solid #f1f5f9'
                    }}>
                      {nombre.toUpperCase()}
                    </td>
                    {dias.map((info, i) => {
                      const hasManual = info.manual !== null;
                      const isMañana = diasSemana[i] === diaProyectado.substring(0,3);
                      
                      return (
                        <td key={i} className={s.td} style={{ 
                          padding: '10px 4px', 
                          textAlign: 'center',
                          backgroundColor: isMañana ? 'rgba(var(--color-primary-rgb), 0.05)' : 'transparent'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                            {/* VALOR IA (🤖) */}
                            <span style={{ 
                                fontSize: '9px', 
                                fontWeight: '700', 
                                color: hasManual ? '#cbd5e1' : 'var(--color-primary)',
                                textDecoration: hasManual ? 'line-through' : 'none'
                              }}>
                              {info.smart}
                            </span>

                            {/* INPUT PARA EDICIÓN MANUAL */}
                            <input 
                              type="number"
                              defaultValue={hasManual ? info.manual : ""}
                              placeholder="-"
                              style={{
                                width: '50px',
                                textAlign: 'center',
                                border: hasManual ? '2px solid var(--color-primary)' : '1px solid #e2e8f0',
                                background: hasManual ? '#fff' : '#f8fafc',
                                borderRadius: '4px',
                                fontSize: '13px',
                                fontWeight: '800',
                                color: hasManual ? 'var(--color-primary)' : '#475569',
                                padding: '4px 0'
                              }}
                              onBlur={(e) => handleManualChange(info.producto_id, i, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.target.blur();
                              }}
                            />
                          </div>
                        </td>
                      );
                    })}
                    <td className={s.td} style={{ 
                      textAlign: 'center', 
                      fontWeight: '900', 
                      backgroundColor: '#f8fafc', 
                      color: 'var(--color-primary)', 
                      fontSize: '1rem' 
                    }}>
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