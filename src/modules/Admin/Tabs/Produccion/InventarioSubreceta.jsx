// Archivo: src/modules/Admin/Tabs/Produccion/InventarioSubreceta.jsx
import React, { useState } from "react";
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { useProduccion } from "./useProduccion";

/**
 * Componente para gestionar el inventario físico de subrecetas.
 * Permite visualizar el stock actual en 'stock_subrecetas' y
 * registrar nuevas tandas de producción que descuentan insumos crudos.
 */
export const InventarioSubreceta = ({ sucursalId, usuarioId, onSuccess }) => {
  const {
    planProduccion,
    loading,
    isSubmitting,
    registrarProduccion,
    recargarPlan,
    puedeVerProduccion
  } = useProduccion(sucursalId);

  const [filtro, setFiltro] = useState("");
  const [selectedItem, setSelectedItem] = useState(null); // Control del Modal
  const [cantidadRegistro, setCantidadRegistro] = useState("");

  // --- FILTRADO DE DATOS ---
  const dataInventario = (planProduccion || []).filter(item => 
    !filtro || item.subreceta_nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  // --- MANEJADORES DE EVENTOS ---
  const abrirModal = (item) => {
    setSelectedItem(item);
    setCantidadRegistro(""); 
  };

  const confirmarRegistro = async () => {
    // Validamos que sea un número válido y no sea cero
    const cantidadNum = parseFloat(cantidadRegistro);
    if (isNaN(cantidadNum) || cantidadNum === 0) {
      alert("Por favor ingresa una cantidad válida (positiva para producción, negativa para merma).");
      return;
    }
    
    const res = await registrarProduccion(
      selectedItem.subreceta_nombre, 
      cantidadNum, 
      usuarioId
    );

    if (res.success) {
      setSelectedItem(null);
      // 🔄 Sincronización: Si el padre pasó una función de refresco, la ejecutamos
      if (onSuccess) onSuccess(); 
      // Nota: El hook local también se recarga solo dentro de registrarProduccion
    } else {
      alert("Error al registrar producción: " + res.error);
    }
  };

  if (!puedeVerProduccion) {
    return <div className={s.emptyState}>No tienes permisos para gestionar el inventario.</div>;
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      
      {/* 🔝 CABECERA LOCAL */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "20px",
        backgroundColor: "white",
        padding: "15px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-dark)' }}>
            📦 Existencias de Preparados
          </h3>
          <p className={s.textMuted} style={{ fontSize: '12px', margin: 0 }}>
            Stock actual en el área de cocina (Mise en Place).
          </p>
        </div>
        <button 
          className={`${s.btn} ${s.btnOutlinePrimary}`} 
          onClick={recargarPlan} 
          disabled={loading}
        >
          {loading ? "Actualizando..." : "🔄 Refrescar Stock"}
        </button>
      </div>

      {/* 📊 TABLA DE EXISTENCIAS */}
      <div className={`${s.adminCard} ${s.tableContainer}`}>
        <div style={{ padding: "16px", background: "#fcfcfc", borderBottom: "1px solid #eee" }}>
          <input 
            type="text" 
            className={s.inputField} 
            placeholder="Buscar preparación (ej: Salsa, Masa, Corte)..." 
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{ maxWidth: "400px", margin: 0 }}
          />
        </div>

        <table className={s.table}>
          <thead className={s.thead}>
            <tr>
              <th className={s.th}>SUBRECETA / PREPARACIÓN</th>
              <th className={s.th} style={{ textAlign: "center" }}>STOCK ACTUAL</th>
              <th className={s.th} style={{ textAlign: "center" }}>UNIDAD</th>
              <th className={s.th} style={{ textAlign: "right" }}>GESTIÓN</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className={s.td} style={{ textAlign: "center", padding: "40px" }}>
                  <div className={s.spinner} style={{ margin: "0 auto 10px" }}></div>
                  <div className={s.textMuted}>Sincronizando con base de datos...</div>
                </td>
              </tr>
            ) : dataInventario.length > 0 ? (
              dataInventario.map((item, idx) => (
                <tr key={idx}>
                  <td className={s.td}>
                    <div style={{ fontWeight: "700", color: "var(--color-primary)" }}>
                      {item.subreceta_nombre}
                    </div>
                  </td>
                  <td className={s.td} style={{ textAlign: "center" }}>
                    <span style={{ 
                        fontSize: "1.2rem", 
                        fontWeight: "800",
                        color: parseFloat(item.cantidad_actual) <= 0 ? "#ef4444" : "inherit"
                    }}>
                        {parseFloat(item.cantidad_actual).toFixed(2)}
                    </span>
                  </td>
                  <td className={s.td} style={{ textAlign: "center" }}>
                    <span style={{ 
                        padding: "4px 10px", 
                        backgroundColor: "#f8fafc", 
                        color: "#64748b", 
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        border: "1px solid #e2e8f0"
                    }}>
                      {item.unidad_medida || "unid."}
                    </span>
                  </td>
                  <td className={s.td} style={{ textAlign: "right" }}>
                    <button 
                      className={`${s.btn} ${s.btnPrimary}`} 
                      style={{ padding: "8px 16px", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px" }} 
                      onClick={() => abrirModal(item)}
                    >
                      + REGISTRAR PRODUCCIÓN
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className={s.td} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  No se encontraron preparaciones que coincidan con el filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🪟 MODAL DE REGISTRO DE PRODUCCIÓN */}
      {selectedItem && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(15, 23, 42, 0.7)", display: "flex", 
          justifyContent: "center", alignItems: "center", zIndex: 3000,
          padding: "20px"
        }}>
          <div className={s.adminCard} style={{ 
            width: "100%", 
            maxWidth: "400px", 
            padding: "30px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            animation: "slideUp 0.3s ease"
          }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "1.2rem", fontWeight: "800" }}>Registrar Preparación</h4>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5", marginBottom: "20px" }}>
              ¿Cuánto <strong>{selectedItem.subreceta_nombre}</strong> has terminado de producir? El sistema descontará automáticamente los insumos crudos según la receta.
            </p>
            
            <div style={{ marginBottom: "25px" }}>
              <label style={{ fontSize: "10px", fontWeight: "900", color: "var(--color-primary)", display: "block", marginBottom: "8px", textTransform: "uppercase" }}>
                Cantidad Final en {selectedItem.unidad_medida}
              </label>
              <input 
                type="number" 
                className={s.inputField} 
                autoFocus
                placeholder="0.00"
                value={cantidadRegistro}
                onChange={(e) => setCantidadRegistro(e.target.value)}
                style={{ fontSize: "2rem", fontWeight: "800", textAlign: "center", height: "70px", color: "var(--color-dark)" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                className={`${s.btn} ${s.btnOutlineDanger}`} 
                style={{ flex: 1, fontWeight: "700", padding: "12px" }} 
                onClick={() => setSelectedItem(null)}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                className={`${s.btn} ${s.btnPrimary}`} 
                style={{ flex: 1, fontWeight: "800", padding: "12px" }} 
                onClick={confirmarRegistro}
                disabled={isSubmitting || !cantidadRegistro}
              >
                {isSubmitting ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};