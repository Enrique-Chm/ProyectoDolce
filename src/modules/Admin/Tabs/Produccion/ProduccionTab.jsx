// Archivo: src/modules/Admin/Tabs/Produccion/ProduccionTab.jsx
import React, { useState } from "react";
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { useProduccion } from "./useProduccion";
import { InventarioSubreceta } from "./InventarioSubreceta"; 

/**
 * Componente principal para la Gestión de Producción (Mise en Place).
 * Divide la vista en el Plan de Producción (Demanda) y el Inventario Físico de Preparados.
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

  // --- LÓGICA DE FILTRADO LOCAL (BLINDADA) ---
  const dataFiltrada = (planProduccion || []).filter((item) => {
    // 🛡️ Envolvemos todo en String() para evitar que números o nulls crasheen el .toLowerCase()
    const termino = String(filtroBuscar || "").toLowerCase();
    const nombre = String(item.subreceta_nombre || "").toLowerCase();
    const origen = String(item.basado_en_productos || "").toLowerCase();
    
    return !filtroBuscar || nombre.includes(termino) || origen.includes(termino);
  });

  if (!puedeVerProduccion) {
    return (
      <div className={s.emptyState}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔒</div>
        <h3 style={{ color: '#334155' }}>Acceso Restringido</h3>
        <p>No tienes permisos para ver el plan de producción.</p>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      
      {/* 🚀 CABECERA PRINCIPAL */}
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
            <span>🔪</span> Mise en Place (Producción)
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            {activeSubTab === "plan" 
              ? `Análisis de necesidades proyectadas para cubrir la demanda de ${diasProyeccion} día(s).`
              : "Control de existencias físicas de productos pre-elaborados en cocina."}
          </p>
        </div>
        
        <button 
          className={`${s.btn} ${s.btnPrimary}`} 
          onClick={recargarPlan}
          disabled={loading}
          style={{ padding: "10px 20px", fontWeight: "800", letterSpacing: "0.5px" }}
        >
          {loading ? "Sincronizando..." : "🔄 Actualizar Datos"}
        </button>
      </section>

      {/* 🧭 NAVEGACIÓN INTERNA */}
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
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px"
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
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          📦 MI STOCK PREPARADO
        </button>
      </div>

      {/* 🟢 CONTENIDO DE LAS PESTAÑAS */}
      {activeSubTab === "plan" ? (
        <>
          {/* 🚀 PANEL DE PROYECCIÓN */}
          <div style={{ 
            display: "flex", 
            flexWrap: "wrap",
            gap: "20px", 
            alignItems: "center", 
            padding: "20px 24px", 
            marginBottom: "24px", 
            backgroundColor: "#ffffff", 
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
          }}>
            <div style={{ display: "flex", flexDirection: "column", flex: "1 1 250px" }}>
              <label style={{ fontSize: "11px", fontWeight: "900", color: "#475569", marginBottom: "8px", textTransform: "uppercase" }}>
                Rango de Proyección (Días)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button 
                  className={s.btn} 
                  style={{ padding: "8px 16px", fontWeight: "bold", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", color: "#334155" }}
                  onClick={() => setDiasProyeccion(Math.max(1, diasProyeccion - 1))}
                >
                  -
                </button>
                <input 
                  type="number" 
                  className={s.inputField} 
                  style={{ textAlign: "center", width: "80px", margin: 0, fontWeight: "900", fontSize: "1.3rem", color: "var(--color-primary)", backgroundColor: "#f8fafc" }} 
                  value={diasProyeccion} 
                  min="1"
                  onChange={(e) => setDiasProyeccion(Math.max(1, parseInt(e.target.value) || 1))} 
                />
                <button 
                  className={s.btn} 
                  style={{ padding: "8px 16px", fontWeight: "bold", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", color: "#334155" }}
                  onClick={() => setDiasProyeccion(diasProyeccion + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div style={{ flex: 2, fontSize: "13px", color: "#64748b", lineHeight: "1.5", backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              <strong>🤖 Inteligencia Activa:</strong> El sistema analiza el historial de ventas y hace una explosión de recetas para calcular exactamente cuánto necesitas cocinar hoy para no quedarte corto los próximos {diasProyeccion} días.
            </div>
          </div>

          {/* 🚀 TABLA DE RESULTADOS DE PRODUCCIÓN */}
          <div className={`${s.adminCard} ${s.tableContainer}`} style={{ padding: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            
            <div style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <input
                type="text"
                className={s.inputField}
                placeholder="🔍 Filtrar por nombre de preparación o platillo destino..."
                value={filtroBuscar}
                onChange={(e) => setFiltroBuscar(e.target.value)}
                style={{ width: "100%", maxWidth: "500px", margin: 0, backgroundColor: "#ffffff" }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className={s.table} style={{ minWidth: '900px', margin: 0 }}>
                <thead className={s.thead}>
                  <tr>
                    <th className={s.th} style={{ padding: "16px 20px", position: "sticky", left: 0, backgroundColor: "#f8fafc", zIndex: 10, boxShadow: '2px 0 5px rgba(0,0,0,0.02)' }}>PREPARACIÓN / SUBRECETA</th>
                    <th className={s.th} style={{ textAlign: "center", padding: "16px" }}>DEMANDA</th>
                    <th className={s.th} style={{ textAlign: "center", padding: "16px" }}>STOCK REAL</th>
                    <th className={s.th} style={{ textAlign: "center", padding: "16px" }}>PROPORCIÓN</th>
                    <th className={s.th} style={{ textAlign: "center", padding: "16px" }}>ESTADO / ACCIÓN</th>
                    <th className={s.th} style={{ padding: "16px" }}>SE USA EN</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
                        <div className={s.spinner} style={{ margin: "0 auto 10px" }}></div>
                        Calculando matemáticas de cocina...
                      </td>
                    </tr>
                  ) : dataFiltrada.length > 0 ? (
                    dataFiltrada.map((item, idx) => {
                      const necesario = parseFloat(item.cantidad_total) || 0;
                      const actual = parseFloat(item.cantidad_actual) || 0;
                      const porPreparar = Math.max(0, necesario - actual);
                      const rendimiento = parseFloat(item.rendimiento_base) || 1;
                      const unidad = item.unidad_medida || ""; 

                      const factorReceta = porPreparar / rendimiento;
                      let textoReceta = "-";
                      
                      if (porPreparar > 0) {
                        if (Math.abs(factorReceta - 1) < 0.05) textoReceta = "HACER 1 RECETA";
                        else if (Math.abs(factorReceta - 0.5) < 0.05) textoReceta = "HACER 1/2 RECETA";
                        else if (Math.abs(factorReceta - 2) < 0.05) textoReceta = "HACER 2 RECETAS";
                        else textoReceta = `HACER ${factorReceta.toFixed(1)} RECETAS`;
                      }

                      const esCritico = porPreparar > (necesario * 0.5);

                      return (
                        <tr key={idx} style={{ backgroundColor: esCritico ? "#fef2f2" : "transparent", borderBottom: "1px solid #f1f5f9" }}>
                          <td className={s.td} style={{ padding: "16px 20px", position: "sticky", left: 0, backgroundColor: esCritico ? "#fef2f2" : "#ffffff", zIndex: 5, boxShadow: '2px 0 5px rgba(0,0,0,0.02)' }}>
                            <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "14px" }}>
                              {item.subreceta_nombre}
                            </div>
                          </td>
                          <td className={s.td} style={{ textAlign: "center", color: "#475569" }}>
                            <span style={{ fontWeight: "700", fontSize: "14px" }}>{necesario.toFixed(2)}</span>
                            <small style={{ fontWeight: "600" }}> {unidad}</small>
                          </td>
                          <td className={s.td} style={{ textAlign: "center" }}>
                            <span style={{ 
                              fontWeight: "900", 
                              fontSize: "14px",
                              color: actual < necesario ? "#ef4444" : "#10b981" 
                            }}>
                              {actual.toFixed(2)}
                            </span>
                            <small className={s.textMuted} style={{ fontWeight: "600" }}> {unidad}</small>
                          </td>
                          
                          <td className={s.td} style={{ textAlign: "center" }}>
                            {porPreparar > 0 ? (
                              <div style={{ 
                                display: "inline-block",
                                padding: "6px 12px", 
                                backgroundColor: "#eff6ff", 
                                color: "#1d4ed8", 
                                borderRadius: "8px",
                                fontSize: "11px",
                                fontWeight: "900",
                                border: "1px solid #bfdbfe",
                                whiteSpace: "nowrap"
                              }}>
                                🍳 {textoReceta}
                              </div>
                            ) : (
                              <span style={{ color: "#cbd5e1", fontWeight: "800" }}>—</span>
                            )}
                          </td>

                          <td className={s.td} style={{ textAlign: "center" }}>
                            {porPreparar > 0 ? (
                              <span style={{ 
                                display: "inline-block",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "900",
                                backgroundColor: "#fee2e2",
                                color: "#b91c1c",
                                whiteSpace: "nowrap"
                              }}>
                                🚨 FALTAN {porPreparar.toFixed(2)} {unidad}
                              </span>
                            ) : (
                              <span style={{ 
                                display: "inline-block",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "900",
                                backgroundColor: "#dcfce7",
                                color: "#15803d",
                                whiteSpace: "nowrap"
                              }}>
                                ✅ CUBIERTO
                              </span>
                            )}
                          </td>
                          <td className={s.td} style={{ padding: "16px" }}>
                            <div style={{ 
                              fontSize: "11px", 
                              color: "#64748b",
                              fontWeight: "500",
                              maxWidth: "200px", 
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden"
                            }}>
                              {item.basado_en_productos || "Sin platos vinculados"}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                        No se detectaron necesidades de producción para este periodo o filtro.
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