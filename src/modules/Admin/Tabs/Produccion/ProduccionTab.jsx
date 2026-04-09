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

  // --- LÓGICA DE FILTRADO LOCAL ---
  const dataFiltrada = (planProduccion || []).filter((item) => {
    const termino = filtroBuscar.toLowerCase();
    const nombre = (item.subreceta_nombre || "").toLowerCase();
    const origen = (item.basado_en_productos || "").toLowerCase();
    return !filtroBuscar || nombre.includes(termino) || origen.includes(termino);
  });

  if (!puedeVerProduccion) {
    return (
      <div className={s.emptyState}>
        No tienes permisos para ver el plan de producción.
      </div>
    );
  }

  return (
    <>
      {/* 🚀 CABECERA: Título y Sincronización */}
      <section
        className={s.pageHeader}
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px"
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
            Gestión de Producción (Mise en Place)
          </h2>
          <p className={s.textMuted} style={{ fontSize: "12px", margin: 0 }}>
            {activeSubTab === "plan" 
              ? `Análisis de necesidades proyectadas para ${diasProyeccion} día(s).`
              : "Control de existencias físicas de productos ya preparados."}
          </p>
        </div>
        
        <button 
          className={`${s.btn} ${s.btnPrimary}`} 
          onClick={recargarPlan}
          disabled={loading}
        >
          {loading ? "Sincronizando..." : "🔄 Actualizar Datos"}
        </button>
      </section>

      {/* 🧭 NAVEGACIÓN INTERNA: Plan vs Stock */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
        <button 
          onClick={() => setActiveSubTab("plan")}
          className={s.btn}
          style={{ 
            background: activeSubTab === "plan" ? "var(--color-primary)" : "transparent",
            color: activeSubTab === "plan" ? "white" : "#64748b",
            border: activeSubTab === "plan" ? "1px solid var(--color-primary)" : "1px solid #e2e8f0",
            fontSize: "12px",
            fontWeight: "700"
          }}
        >
          📋 PLAN DE PRODUCCIÓN
        </button>
        <button 
          onClick={() => setActiveSubTab("inventario")}
          className={s.btn}
          style={{ 
            background: activeSubTab === "inventario" ? "var(--color-primary)" : "transparent",
            color: activeSubTab === "inventario" ? "white" : "#64748b",
            border: activeSubTab === "inventario" ? "1px solid var(--color-primary)" : "1px solid #e2e8f0",
            fontSize: "12px",
            fontWeight: "700"
          }}
        >
          📦 MI STOCK PREPARADO
        </button>
      </div>

      {activeSubTab === "plan" ? (
        <>
          {/* 🚀 PANEL DE PROYECCIÓN: Días de análisis */}
          <div className={s.adminCard} style={{ 
            display: "flex", 
            flexWrap: "wrap",
            gap: "20px", 
            alignItems: "center", 
            padding: "15px 20px", 
            marginBottom: "20px", 
            backgroundColor: "#f8fafc", 
            border: "1px solid #e2e8f0" 
          }}>
            <div style={{ display: "flex", flexDirection: "column", flex: "1 1 200px" }}>
              <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", marginBottom: "8px", textTransform: "uppercase" }}>
                Rango de Proyección (Días)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button 
                  className={s.btn} 
                  style={{ padding: "8px 15px", fontWeight: "bold" }}
                  onClick={() => setDiasProyeccion(Math.max(1, diasProyeccion - 1))}
                >
                  -
                </button>
                <input 
                  type="number" 
                  className={s.inputField} 
                  style={{ textAlign: "center", width: "70px", margin: 0, fontWeight: "800", fontSize: "1.2rem", color: "var(--color-primary)" }} 
                  value={diasProyeccion} 
                  min="1"
                  onChange={(e) => setDiasProyeccion(Math.max(1, parseInt(e.target.value) || 1))} 
                />
                <button 
                  className={s.btn} 
                  style={{ padding: "8px 15px", fontWeight: "bold" }}
                  onClick={() => setDiasProyeccion(diasProyeccion + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div style={{ flex: 2, fontSize: "12px", color: "#64748b" }}>
              * El sistema analiza el historial de ventas y las recetas para calcular cuánto deberías tener preparado para evitar quiebres de stock.
            </div>
          </div>

          {/* 🚀 TABLA DE RESULTADOS */}
          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <div style={{ padding: "16px", background: "#fcfcfc", borderBottom: "1px solid #eee" }}>
              <input
                type="text"
                className={s.inputField}
                placeholder="Filtrar por nombre o platillo..."
                value={filtroBuscar}
                onChange={(e) => setFiltroBuscar(e.target.value)}
                style={{ width: "100%", maxWidth: "400px" }}
              />
            </div>

            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>PREPARACIÓN / SUBRECETA</th>
                  <th className={s.th} style={{ textAlign: "center" }}>DEMANDA</th>
                  <th className={s.th} style={{ textAlign: "center" }}>STOCK REAL</th>
                  <th className={s.th} style={{ textAlign: "center" }}>PROPORCIÓN</th>
                  <th className={s.th} style={{ textAlign: "center" }}>ACCIÓN</th>
                  <th className={s.th}>USADO EN</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className={s.td} style={{ textAlign: "center", padding: "60px" }}>
                      <div className={s.spinner} style={{ margin: "0 auto 10px" }}></div>
                      <div className={s.textMuted}>Calculando Mise en Place...</div>
                    </td>
                  </tr>
                ) : dataFiltrada.length > 0 ? (
                  dataFiltrada.map((item, idx) => {
                    const necesario = parseFloat(item.cantidad_total) || 0;
                    const actual = parseFloat(item.cantidad_actual) || 0;
                    const porPreparar = Math.max(0, necesario - actual);
                    const rendimiento = parseFloat(item.rendimiento_base) || 1;
                    const unidad = item.unidad_medida || ""; 

                    // 💡 LÓGICA DE PROPORCIÓN: ¿Cuántas recetas debe hacer el chef?
                    const factorReceta = porPreparar / rendimiento;
                    let textoReceta = "-";
                    
                    if (porPreparar > 0) {
                      if (Math.abs(factorReceta - 1) < 0.05) textoReceta = "1 RECETA";
                      else if (Math.abs(factorReceta - 0.5) < 0.05) textoReceta = "1/2 RECETA";
                      else if (Math.abs(factorReceta - 2) < 0.05) textoReceta = "2 RECETAS";
                      else textoReceta = `${factorReceta.toFixed(1)} REC.`;
                    }

                    // 🎨 Estilo crítico: Si falta más del 50% de lo necesario
                    const esCritico = porPreparar > (necesario * 0.5);

                    return (
                      <tr key={idx} style={{ backgroundColor: esCritico ? "#fffaf0" : "transparent" }}>
                        <td className={s.td}>
                          <div style={{ fontWeight: "700", color: "var(--color-dark)" }}>
                            {item.subreceta_nombre}
                          </div>
                        </td>
                        <td className={s.td} style={{ textAlign: "center", color: "#475569" }}>
                          <span style={{ fontWeight: "600" }}>{necesario.toFixed(2)}</span>
                          <small> {unidad}</small>
                        </td>
                        <td className={s.td} style={{ textAlign: "center" }}>
                          <span style={{ 
                            fontWeight: "800", 
                            color: actual < necesario ? "#ef4444" : "#10b981" 
                          }}>
                            {actual.toFixed(2)}
                          </span>
                          <small className={s.textMuted}> {unidad}</small>
                        </td>
                        
                        <td className={s.td} style={{ textAlign: "center" }}>
                          {porPreparar > 0 ? (
                            <div style={{ 
                              display: "inline-block",
                              padding: "4px 8px", 
                              backgroundColor: "#e0f2fe", 
                              color: "#0369a1", 
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "900",
                              border: "1px solid #bae6fd"
                            }}>
                              {textoReceta}
                            </div>
                          ) : (
                            <span style={{ color: "#cbd5e1" }}>—</span>
                          )}
                        </td>

                        <td className={s.td} style={{ textAlign: "center" }}>
                          {porPreparar > 0 ? (
                            <span style={{ 
                              display: "inline-block",
                              padding: "5px 10px",
                              borderRadius: "20px",
                              fontSize: "10px",
                              fontWeight: "800",
                              backgroundColor: "#fee2e2",
                              color: "#b91c1c"
                            }}>
                              FALTAN {porPreparar.toFixed(2)} {unidad}
                            </span>
                          ) : (
                            <span style={{ 
                              fontSize: "10px", 
                              fontWeight: "700",
                              color: "#10b981" 
                            }}>
                              STOCK CUBIERTO ✅
                            </span>
                          )}
                        </td>
                        <td className={s.td}>
                          <div className={s.textMuted} style={{ fontSize: "11px", fontStyle: "italic", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.basado_en_productos || "Sin platos vinculados"}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className={s.td} style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                      No se detectaron necesidades de producción para este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* 📦 VISTA DE INVENTARIO FÍSICO Y REGISTRO */
        <InventarioSubreceta 
          sucursalId={sucursalId} 
          usuarioId={usuarioId} 
          onSuccess={recargarPlan} 
        />
      )}
    </>
  );
};