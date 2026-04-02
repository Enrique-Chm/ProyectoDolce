// Archivo: src/modules/Admin/Tabs/Proyeccion/HistorialConsumoView.jsx
import React, { useState } from "react";
import s from "../../../../assets/styles/EstilosGenerales.module.css";

export const HistorialConsumoView = ({ 
  proyeccionProductos = [], 
  pronosticoSemanal = [], 
  estimacionesManuales = [], 
  guardarEstimacionManual, 
  loading,
  diaProyectado 
}) => {
  const [viewMode, setViewMode] = useState("ventas"); 
  const [filtroTexto, setFiltroTexto] = useState("");

  // Ordenamos los días empezando por Lunes para coincidir con la imagen
  const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  // Mapeo para convertir el índice (0=Dom) al orden de nuestra tabla (0=Lun)
  const mapDow = (dow) => (dow === 0 ? 6 : dow - 1);

  // 1. Filtrado
  const productosFiltrados = (proyeccionProductos || []).filter(p =>
    !filtroTexto || p.nombre?.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  // 2. Procesar Matriz Semanal
  const matrizData = (pronosticoSemanal || []).reduce((acc, curr) => {
    const { nombre_producto, dow, promedio_diario, producto_id } = curr;
    const index = mapDow(dow);
    
    if (!acc[nombre_producto]) {
      acc[nombre_producto] = Array(7).fill(null).map((_, i) => ({
        smart: 0,
        manual: null,
        producto_id: producto_id
      }));
    }
    
    if (acc[nombre_producto][index]) {
      acc[nombre_producto][index].smart = promedio_diario;
    }
    return acc;
  }, {});

  (estimacionesManuales || []).forEach(est => {
    const nombreProd = Object.keys(matrizData).find(
      key => matrizData[key][0]?.producto_id === est.producto_id
    );
    if (nombreProd) {
      const index = mapDow(est.dow);
      matrizData[nombreProd][index].manual = est.cantidad_manual;
    }
  });

  const productosSemanaFiltrados = Object.entries(matrizData).filter(([nombre]) => 
    !filtroTexto || nombre.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  const handleManualChange = async (productoId, dowInTabla, valor) => {
    // Convertimos el índice de la tabla de nuevo al DOW de la DB (0=Dom)
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
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
            {viewMode === 'ventas' ? `Venta para Mañana (${diaProyectado})` : "Planeación Semanal"}
          </h3>
          <p style={{ fontSize: "12px", color: "#888", margin: "4px 0 0 0" }}>
            {viewMode === 'ventas' 
              ? "Resumen de lo que se debe producir mañana."
              : "Define las ventas de la semana. Borra el valor para resetear al promedio."}
          </p>
        </div>

        <div style={{ display: "flex", gap: "5px", background: "#f5f5f5", padding: "4px", borderRadius: "8px" }}>
          <button 
            className={s.btnSmall}
            style={{ 
              backgroundColor: viewMode === 'ventas' ? 'white' : 'transparent',
              color: viewMode === 'ventas' ? 'var(--color-primary)' : '#666',
              border: "none", borderRadius: "6px", padding: "6px 15px", cursor: "pointer", fontWeight: "700",
              boxShadow: viewMode === 'ventas' ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
            }}
            onClick={() => setViewMode('ventas')}
          >
            MAÑANA
          </button>
          <button 
            className={s.btnSmall}
            style={{ 
              backgroundColor: viewMode === 'semanal' ? 'white' : 'transparent',
              color: viewMode === 'semanal' ? 'var(--color-primary)' : '#666',
              border: "none", borderRadius: "6px", padding: "6px 15px", cursor: "pointer", fontWeight: "700",
              boxShadow: viewMode === 'semanal' ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
            }}
            onClick={() => setViewMode('semanal')}
          >
            SEMANAL
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
        <input
          type="text"
          className={s.inputField}
          placeholder="Buscar platillo..."
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className={s.table}>
          <thead className={s.thead}>
            {viewMode === 'ventas' ? (
              <tr>
                <th className={s.th}>PRODUCTO</th>
                <th className={s.th} style={{ textAlign: "center" }}>IA PROMEDIO</th>
                <th className={s.th} style={{ textAlign: "center" }}>ORIGEN</th>
                <th className={s.th} style={{ textAlign: "right" }}>DEMANDA FINAL</th>
              </tr>
            ) : (
              <tr>
                <th className={s.th} style={{ minWidth: '180px', position: 'sticky', left: 0, background: 'var(--color-bg-card)', zIndex: 10 }}>PRODUCTO</th>
                {diasSemana.map((d, i) => (
                  <th key={d} className={s.th} style={{ 
                    textAlign: "center", 
                    backgroundColor: d === diaProyectado.substring(0,3) ? 'rgba(var(--color-primary-rgb), 0.1)' : 'inherit'
                  }}>
                    {d.toUpperCase()}
                  </th>
                ))}
                <th className={s.th} style={{ textAlign: "center", fontWeight: '800', background: '#f8f9fa' }}>TOTAL</th>
              </tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className={s.emptyState}>Sincronizando...</td></tr>
            ) : viewMode === 'ventas' ? (
              productosFiltrados.map((p, i) => (
                <tr key={i}>
                  <td className={s.td} style={{ fontWeight: "700" }}>{p.nombre}</td>
                  <td className={s.td} style={{ textAlign: "center" }}>{p.promedio_diario}</td>
                  <td className={s.td} style={{ textAlign: "center" }}>
                    <span className={s.badge} style={{ fontSize: '10px' }}>INTELIGENCIA</span>
                  </td>
                  <td className={s.td} style={{ textAlign: "right" }}>
                    <span className={s.badgeSuccess} style={{ fontWeight: '800' }}>{p.prediccion_manana} Uds.</span>
                  </td>
                </tr>
              ))
            ) : (
              productosSemanaFiltrados.map(([nombre, dias]) => {
                const totalSemanal = dias.reduce((acc, curr) => acc + (curr.manual !== null ? curr.manual : curr.smart), 0);
                return (
                  <tr key={nombre}>
                    <td className={s.td} style={{ 
                      fontWeight: "700", 
                      fontSize: '12px', 
                      position: 'sticky', 
                      left: 0, 
                      background: 'white', 
                      zIndex: 5,
                      borderRight: '1px solid #eee'
                    }}>
                      {nombre}
                    </td>
                    {dias.map((info, i) => {
                      const hasManual = info.manual !== null;
                      const isMañana = diasSemana[i] === diaProyectado.substring(0,3);
                      return (
                        <td key={i} className={s.td} style={{ 
                          padding: '6px 4px', 
                          textAlign: 'center',
                          backgroundColor: isMañana ? 'rgba(var(--color-primary-rgb), 0.05)' : 'transparent'
                        }}>
                          <input 
                            type="number"
                            defaultValue={hasManual ? info.manual : ""}
                            placeholder={info.smart}
                            style={{
                              width: '50px',
                              textAlign: 'center',
                              border: hasManual ? '1px solid var(--color-primary)' : '1px solid #eee',
                              background: hasManual ? 'rgba(var(--color-primary-rgb), 0.05)' : 'white',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontWeight: hasManual ? '800' : '400',
                              color: hasManual ? 'var(--color-primary)' : '#999',
                              padding: '5px 0',
                              outline: 'none'
                            }}
                            onBlur={(e) => handleManualChange(info.producto_id, i, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleManualChange(info.producto_id, i, e.target.value);
                            }}
                          />
                        </td>
                      );
                    })}
                    <td className={s.td} style={{ textAlign: 'center', fontWeight: '800', backgroundColor: '#fcfcfc', color: '#333' }}>
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