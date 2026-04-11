// Archivo: src/modules/Admin/Tabs/Produccion/InventarioSubreceta.jsx
import React, { useState } from "react";
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { useProduccion } from "./useProduccion";

/**
 * Componente para gestionar el inventario físico de subrecetas.
 * Permite visualizar el stock actual, registrar nuevas tandas y 
 * ajustar el inventario real en caso de errores de conteo.
 */
export const InventarioSubreceta = ({ sucursalId, usuarioId, onSuccess }) => {
  const {
    planProduccion,
    loading,
    isSubmitting,
    registrarProduccion,
    recargarPlan,
    puedeVerProduccion,
    puedeEditarProduccion
  } = useProduccion(sucursalId);

  const [filtro, setFiltro] = useState("");
  
  // 🪟 Estado del modal: Controla visibilidad, el ítem seleccionado y el modo (add/edit)
  const [modalState, setModalState] = useState({ isOpen: false, item: null, type: 'add' }); 
  const [cantidadRegistro, setCantidadRegistro] = useState("");

  // --- FILTRADO SEGURO ---
  const dataInventario = (planProduccion || []).filter(item => {
    const termino = String(filtro || "").toLowerCase().trim();
    const nombre = String(item.subreceta_nombre || "").toLowerCase();
    return !termino || nombre.includes(termino);
  });

  // --- MANEJADORES DE MODAL ---
  const abrirModal = (item, type = 'add') => {
    setModalState({ isOpen: true, item, type });
    if (type === 'edit') {
      // En edición, precargamos el valor actual para corrección visual
      const stockActual = parseFloat(item.cantidad_actual) || 0;
      setCantidadRegistro(stockActual.toString());
    } else {
      // En suma de tanda (producción), empezamos desde vacío
      setCantidadRegistro(""); 
    }
  };

  const cerrarModal = () => {
    setModalState({ isOpen: false, item: null, type: 'add' });
    setCantidadRegistro("");
  };

  /**
   * Ejecuta la actualización de stock mediante el cálculo de la diferencia (Delta).
   */
  const confirmarRegistro = async () => {
    const cantidadNum = parseFloat(cantidadRegistro);
    if (isNaN(cantidadNum)) return; 
    
    let cantidadDelta = 0;

    if (modalState.type === 'edit') {
      // MODO EDICIÓN: Calculamos cuánto falta o sobra para llegar al nuevo total deseado
      const stockActual = parseFloat(modalState.item.cantidad_actual) || 0;
      cantidadDelta = cantidadNum - stockActual;

      // Si no hay cambio numérico, cerramos sin procesar
      if (cantidadDelta === 0) {
        cerrarModal();
        return;
      }
    } else {
      // MODO AÑADIR: La cantidad ingresada representa la nueva producción (el delta directo)
      cantidadDelta = cantidadNum;
    }

    const res = await registrarProduccion(
      modalState.item.subreceta_nombre, 
      cantidadDelta, 
      usuarioId
    );

    if (res.success) {
      cerrarModal();
      // Refrescamos la vista principal (Plan de Producción) para actualizar indicadores
      if (onSuccess) onSuccess(); 
    }
  };

  if (!puedeVerProduccion) {
    return (
      <div className={s.emptyState}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔒</div>
        <h3>Acceso Restringido</h3>
        <p>No tienes permisos para gestionar el inventario de preparados.</p>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      
      {/* 🔝 CABECERA LOCAL */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "20px",
        backgroundColor: "#ffffff",
        padding: "20px 24px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📦</span> Stock Físico en Cocina
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
            Existencias actuales de subrecetas y productos preparados.
          </p>
        </div>
        <button 
          className={`${s.btn} ${s.btnOutlinePrimary}`} 
          onClick={recargarPlan} 
          disabled={loading}
          style={{ padding: "10px 20px", fontWeight: "700" }}
        >
          {loading ? "Actualizando..." : "🔄 Refrescar Inventario"}
        </button>
      </div>

      {/* 📊 TABLA DE EXISTENCIAS */}
      <div className={`${s.adminCard} ${s.tableContainer}`} style={{ padding: 0, borderRadius: '12px', overflow: 'hidden' }}>
        
        <div style={{ padding: "16px 20px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <input 
            type="text" 
            className={s.inputField} 
            placeholder="🔍 Filtrar por nombre de preparación..." 
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{ maxWidth: "400px", margin: 0, backgroundColor: "#ffffff" }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className={s.table} style={{ minWidth: '700px', margin: 0 }}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th} style={{ padding: "16px 20px" }}>SUBRECETA / PREPARACIÓN</th>
                <th className={s.th} style={{ textAlign: "center" }}>EXISTENCIA ACTUAL</th>
                <th className={s.th} style={{ textAlign: "center" }}>UNIDAD</th>
                <th className={s.th} style={{ textAlign: "right", padding: "16px 20px" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "60px" }}>
                    <div className={s.spinner} style={{ margin: "0 auto 15px" }}></div>
                    <p style={{ color: "#64748b" }}>Cargando inventario físico...</p>
                  </td>
                </tr>
              ) : dataInventario.length > 0 ? (
                dataInventario.map((item, idx) => {
                  const stock = parseFloat(item.cantidad_actual) || 0;
                  const isVacio = stock <= 0;

                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }}>
                      <td className={s.td} style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: "800", color: "#334155", fontSize: "14px" }}>
                          {item.subreceta_nombre}
                        </div>
                      </td>
                      
                      <td className={s.td} style={{ textAlign: "center" }}>
                        <span style={{ 
                            fontSize: "1.2rem", 
                            fontWeight: "900",
                            color: isVacio ? "#dc2626" : "#0f172a",
                            backgroundColor: isVacio ? "#fef2f2" : "transparent",
                            padding: isVacio ? "4px 10px" : "0",
                            borderRadius: "8px"
                        }}>
                            {stock.toFixed(2)}
                        </span>
                      </td>
                      
                      <td className={s.td} style={{ textAlign: "center" }}>
                        <span style={{ 
                            padding: "4px 8px", 
                            backgroundColor: "#f1f5f9", 
                            color: "#64748b", 
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "800",
                            textTransform: "uppercase"
                        }}>
                          {item.unidad_medida || "Pza"}
                        </span>
                      </td>
                      
                      <td className={s.td} style={{ textAlign: "right", padding: "16px 20px" }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {puedeEditarProduccion && (
                            <button 
                              className={s.btn} 
                              style={{ padding: "8px", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", color: "#64748b" }} 
                              title="Corregir Stock Total"
                              onClick={() => abrirModal(item, 'edit')}
                            > ✏️ </button>
                          )}
                          <button 
                            className={`${s.btn} ${s.btnPrimary}`} 
                            style={{ padding: "8px 15px", fontSize: "12px", fontWeight: "800" }} 
                            onClick={() => abrirModal(item, 'add')}
                          >
                            + PRODUCIDO
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                    <p>No se encontraron subrecetas en el catálogo.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🪟 MODAL DE AJUSTE / PRODUCCIÓN */}
      {modalState.isOpen && modalState.item && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(15, 23, 42, 0.7)", display: "flex", 
          justifyContent: "center", alignItems: "center", zIndex: 3000,
          backdropFilter: "blur(4px)", padding: "20px"
        }}>
          <div className={s.adminCard} style={{ 
            width: "100%", 
            maxWidth: "400px", 
            padding: "32px", 
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
          }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>
                {modalState.type === 'edit' ? "⚖️" : "👨‍🍳"}
              </div>
              <h4 style={{ margin: "0 0 8px 0", fontWeight: "900", color: "#0f172a" }}>
                {modalState.type === 'edit' ? "Ajustar Stock Real" : "Registrar Producción"}
              </h4>
              <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                {modalState.item.subreceta_nombre}
              </p>
            </div>
            
            <div style={{ marginBottom: "28px" }}>
              <label style={{ fontSize: "11px", fontWeight: "900", color: "#475569", display: "block", marginBottom: "8px", textAlign: "center", textTransform: "uppercase" }}>
                Cantidad ({modalState.item.unidad_medida || "Pza"})
              </label>
              <input 
                type="number" 
                className={s.inputField} 
                autoFocus
                placeholder="0.00"
                value={cantidadRegistro}
                onChange={(e) => setCantidadRegistro(e.target.value)}
                style={{ 
                  fontSize: "2.2rem", 
                  fontWeight: "900", 
                  textAlign: "center", 
                  height: "80px", 
                  color: modalState.type === 'edit' ? "#0f172a" : "var(--color-primary)",
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  border: "2px solid #e2e8f0"
                }}
              />
              <p style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", marginTop: "10px" }}>
                {modalState.type === 'edit' 
                  ? "Se calculará la diferencia automáticamente contra el stock actual." 
                  : "Esta cantidad se sumará a las existencias existentes."}
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                className={`${s.btn} ${s.btnOutlineDanger}`} 
                style={{ flex: 1, fontWeight: "800", padding: "14px" }} 
                onClick={cerrarModal}
                disabled={isSubmitting}
              > Cancelar </button>
              <button 
                className={`${s.btn} ${s.btnPrimary}`} 
                style={{ flex: 1, fontWeight: "800", padding: "14px" }} 
                onClick={confirmarRegistro}
                disabled={isSubmitting || cantidadRegistro === ""}
              >
                {isSubmitting ? "Procesando..." : "Confirmar ✓"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};