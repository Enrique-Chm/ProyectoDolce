// Archivo: src/modules/Admin/Tabs/Produccion/ProduccionTab.jsx
import React, { useState, useEffect } from "react";
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { useProduccion } from "./useProduccion";
import { InventarioSubreceta } from "./InventarioSubreceta"; 

/**
 * Componente principal para la Gestión de Producción (Mise en Place).
 * Integra el análisis de demanda proyectada con el registro físico de stock.
 */
export const ProduccionTab = ({ sucursalId, usuarioId }) => {
  const {
    planProduccion,
    loading,
    diasProyeccion,
    setDiasProyeccion,
    recargarPlan,
    puedeVerProduccion
  } = useProduccion(sucursalId);

  const [activeSubTab, setActiveSubTab] = useState("plan"); // 'plan' o 'inventario'
  const [filtroBuscar, setFiltroBuscar] = useState("");

  // --- LÓGICA DE FILTRADO ---
  const dataFiltrada = (planProduccion || []).filter((item) => {
    // Normalizamos los textos para evitar errores de comparación
    const termino = String(filtroBuscar || "").toLowerCase().trim();
    const nombre = String(item.subreceta_nombre || "").toLowerCase();
    const origen = String(item.basado_en_productos || "").toLowerCase();
    
    return !termino || nombre.includes(termino) || origen.includes(termino);
  });

  // 🔍 DEBUG: Descomenta esto para ver en la consola si están llegando los datos del SQL
  /*
  useEffect(() => {
    if (planProduccion.length > 0) {
      console.log("Datos recibidos del Plan:", planProduccion);
    }
  }, [planProduccion]);
  */

  if (!puedeVerProduccion) {
    return (
      <div className={s.emptyState}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔒</div>
        <h3 style={{ color: '#334155' }}>Acceso Restringido</h3>
        <p>No tienes permisos suficientes para gestionar la producción.</p>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      
      {/* 🚀 CABECERA: TÍTULO Y SINCRONIZACIÓN */}
      <section style={{
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        marginBottom: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "900", margin: "0 0 4px 0", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🔪</span> Mise en Place
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            {activeSubTab === "plan" 
              ? `Necesidades estimadas para cubrir la demanda de ${diasProyeccion} día(s).`
              : "Inventario físico de preparaciones y subrecetas."}
          </p>
        </div>
        
        <button 
          className={`${s.btn} ${s.btnPrimary}`} 
          onClick={recargarPlan}
          disabled={loading}
          style={{ padding: "10px 20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}
        >
          {loading ? "Sincronizando..." : <><span>🔄</span> Actualizar Datos</>}
        </button>
      </section>

      {/* 🧭 NAVEGACIÓN ENTRE PLAN E INVENTARIO */}
      <div style={{ 
        display: "inline-flex", 
        backgroundColor: "#f1f5f9", 
        padding: "6px", 
        borderRadius: "12px", 
        marginBottom: "24px",
        border: "1px solid #e2e8f0"
      }}>
        <button 
          onClick={() => setActiveSubTab("plan")}
          style={{ 
            background: activeSubTab === "plan" ? "#ffffff" : "transparent",
            color: activeSubTab === "plan" ? "var(--color-primary)" : "#64748b",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "13px",
            fontWeight: "800",
            boxShadow: activeSubTab === "plan" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          📋 PLAN DE PRODUCCIÓN
        </button>
        <button 
          onClick={() => setActiveSubTab("inventario")}
          style={{ 
            background: activeSubTab === "inventario" ? "#ffffff" : "transparent",
            color: activeSubTab === "inventario" ? "var(--color-primary)" : "#64748b",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "13px",
            fontWeight: "800",
            boxShadow: activeSubTab === "inventario" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          📦 STOCK PREPARADO
        </button>
      </div>

      {activeSubTab === "plan" ? (
        <>
          {/* 📊 PANEL DE PROYECCIÓN */}
          <div style={{ 
            display: "flex", 
            flexWrap: "wrap",
            gap: "20px", 
            alignItems: "center", 
            padding: "20px 24px", 
            marginBottom: "24px", 
            backgroundColor: "#ffffff", 
            borderRadius: "12px",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", flexDirection: "column", flex: "1 1 220px" }}>
              <label style={{ fontSize: "11px", fontWeight: "900", color: "#475569", marginBottom: "8px", textTransform: "uppercase" }}>
                Rango de Pronóstico
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button 
                  className={s.btn} 
                  style={{ padding: "8px 16px", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
                  onClick={() => setDiasProyeccion(Math.max(1, diasProyeccion - 1))}
                > - </button>
                <input 
                  type="number" 
                  className={s.inputField} 
                  style={{ textAlign: "center", width: "70px", margin: 0, fontWeight: "900", fontSize: "1.2rem", color: "var(--color-primary)" }} 
                  value={diasProyeccion} 
                  min="1"
                  readOnly 
                />
                <button 
                  className={s.btn} 
                  style={{ padding: "8px 16px", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
                  onClick={() => setDiasProyeccion(diasProyeccion + 1)}
                > + </button>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#64748b" }}>Día(s)</span>
              </div>
            </div>
            <div style={{ flex: 2, fontSize: "13px", color: "#64748b", backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              <strong>🤖 Análisis Inteligente:</strong> Sumamos el stock físico actual y lo comparamos contra el promedio de ventas proyectado para los próximos días. Si el stock es insuficiente, aparecerá una alerta roja.
            </div>
          </div>

          {/* 🚀 TABLA DE RESULTADOS */}
          <div className={`${s.adminCard} ${s.tableContainer}`} style={{ padding: 0, overflow: 'hidden' }}>
            
            <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <input
                type="text"
                className={s.inputField}
                placeholder="🔍 Buscar subreceta o plato destino..."
                value={filtroBuscar}
                onChange={(e) => setFiltroBuscar(e.target.value)}
                style={{ width: "100%", maxWidth: "450px", margin: 0 }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className={s.table} style={{ minWidth: '900px', margin: 0 }}>
                <thead className={s.thead}>
                  <tr>
                    <th className={s.th} style={{ padding: "16px 20px" }}>PREPARACIÓN / SUBRECETA</th>
                    <th className={s.th} style={{ textAlign: "center" }}>DEMANDA (PROYECTADA)</th>
                    <th className={s.th} style={{ textAlign: "center" }}>STOCK ACTUAL</th>
                    <th className={s.th} style={{ textAlign: "center" }}>ESTADO / BALANCE</th>
                    <th className={s.th}>DESTINO (PLATOS)</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "80px" }}>
                        <div className={s.spinner} style={{ margin: "0 auto 15px" }}></div>
                        <p style={{ color: "#64748b", fontWeight: "600" }}>Calculando matemáticas de producción...</p>
                      </td>
                    </tr>
                  ) : dataFiltrada.length > 0 ? (
                    dataFiltrada.map((item, idx) => {
                      const requerido = parseFloat(item.cantidad_total) || 0;
                      const actual = parseFloat(item.cantidad_actual) || 0;
                      const faltante = Math.max(0, requerido - actual);
                      const unidad = item.unidad_medida || "Unid";

                      return (
                        <tr key={idx} style={{ backgroundColor: faltante > 0 ? "#fffafa" : "transparent", borderBottom: "1px solid #f1f5f9" }}>
                          <td className={s.td} style={{ padding: "16px 20px" }}>
                            <div style={{ fontWeight: "800", color: "#1e293b", fontSize: "14px" }}>
                              {item.subreceta_nombre}
                            </div>
                          </td>
                          <td className={s.td} style={{ textAlign: "center", fontWeight: "700", color: "#475569" }}>
                            {requerido.toFixed(2)} <small>{unidad}</small>
                          </td>
                          <td className={s.td} style={{ textAlign: "center" }}>
                            <span style={{ 
                              fontWeight: "900", 
                              color: actual < requerido ? "#ef4444" : "#10b981",
                              fontSize: "15px"
                            }}>
                              {actual.toFixed(2)}
                            </span>
                            <small className={s.textMuted} style={{ fontWeight: "600" }}> {unidad}</small>
                          </td>
                          
                          <td className={s.td} style={{ textAlign: "center" }}>
                            {faltante > 0 ? (
                              <div style={{ 
                                display: "inline-block",
                                padding: "6px 14px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: "900",
                                backgroundColor: "#fee2e2",
                                color: "#b91c1c",
                                border: "1px solid #fecaca",
                                textTransform: "uppercase"
                              }}>
                                🚨 Faltan {faltante.toFixed(2)} {unidad}
                              </div>
                            ) : (
                              <div style={{ 
                                display: "inline-block",
                                padding: "6px 14px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: "900",
                                backgroundColor: "#dcfce7",
                                color: "#15803d",
                                textTransform: "uppercase"
                              }}>
                                ✅ Stock Cubierto
                              </div>
                            )}
                          </td>

                          <td className={s.td}>
                            <div style={{ 
                              fontSize: "11px", 
                              color: "#64748b", 
                              maxWidth: "280px",
                              lineHeight: "1.4",
                              fontStyle: item.basado_en_productos?.includes('Sin demanda') ? 'italic' : 'normal'
                            }}>
                              {item.basado_en_productos}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📋</div>
                        <p>No se encontraron subrecetas que coincidan con la búsqueda o la configuración.</p>
                        <small>Asegúrate de que tus recetas tengan marcada la opción "Es Subreceta".</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <InventarioSubreceta 
          sucursalId={sucursalId} 
          usuarioId={usuarioId} 
          onSuccess={recargarPlan} 
        />
      )}
    </div>
  );
};