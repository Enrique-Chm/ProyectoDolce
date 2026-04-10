// Archivo: src/modules/Admin/Tabs/Produccion/InventarioSubreceta.jsx
import React, { useState } from "react";
import s from "../../../../assets/styles/EstilosGenerales.module.css";
import { useProduccion } from "./useProduccion";

/**
 * Componente para gestionar el inventario físico de subrecetas.
 * Permite visualizar el stock actual en 'stock_subrecetas', registrar
 * nuevas tandas y editar el stock exacto (si se tiene permiso).
 */
export const InventarioSubreceta = ({ sucursalId, usuarioId, onSuccess }) => {
  const {
    planProduccion,
    loading,
    isSubmitting,
    registrarProduccion,
    recargarPlan,
    puedeVerProduccion,
    puedeEditarProduccion // 🛡️ Importamos el permiso de edición
  } = useProduccion(sucursalId);

  const [filtro, setFiltro] = useState("");
  // 🪟 Estado unificado para el modal: Controla si está abierto, el ítem y si es 'add' o 'edit'
  const [modalState, setModalState] = useState({ isOpen: false, item: null, type: 'add' }); 
  const [cantidadRegistro, setCantidadRegistro] = useState("");

  // --- FILTRADO DE DATOS ---
  const dataInventario = (planProduccion || []).filter(item => 
    !filtro || item.subreceta_nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  // --- MANEJADORES DE EVENTOS ---
  const abrirModal = (item, type = 'add') => {
    setModalState({ isOpen: true, item, type });
    if (type === 'edit') {
      // Si va a editar, precargamos el input con el stock actual
      const stockActual = parseFloat(item.cantidad_actual) || 0;
      setCantidadRegistro(stockActual.toString());
    } else {
      setCantidadRegistro(""); 
    }
  };

  const cerrarModal = () => {
    setModalState({ isOpen: false, item: null, type: 'add' });
    setCantidadRegistro("");
  };

  const confirmarRegistro = async () => {
    const cantidadNum = parseFloat(cantidadRegistro);
    if (isNaN(cantidadNum)) {
      alert("Por favor ingresa una cantidad válida.");
      return;
    }
    
    let cantidadDelta = 0; // La diferencia que vamos a mandar a Supabase

    if (modalState.type === 'edit') {
      // 💡 MODO EDICIÓN: Calculamos la diferencia entre el nuevo número y el stock actual
      const stockActual = parseFloat(modalState.item.cantidad_actual) || 0;
      cantidadDelta = cantidadNum - stockActual;

      // Si el número es igual al que ya estaba, no hacemos nada
      if (cantidadDelta === 0) {
        cerrarModal();
        return;
      }
    } else {
      // 💡 MODO AÑADIR: Mandamos la cantidad directamente (positiva o negativa)
      if (cantidadNum === 0) {
        alert("Ingresa una cantidad distinta a cero para la nueva tanda.");
        return;
      }
      cantidadDelta = cantidadNum;
    }

    // Usamos la función existente mandándole el "Delta" (lo que falta o sobra)
    const res = await registrarProduccion(
      modalState.item.subreceta_nombre, 
      cantidadDelta, 
      usuarioId
    );

    if (res.success) {
      cerrarModal();
      // 🔄 Sincronización: Si el padre pasó una función de refresco, la ejecutamos
      if (onSuccess) onSuccess(); 
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
        backgroundColor: "#ffffff",
        padding: "20px 24px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📦</span> Stock en Cocina (Preparados)
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
            Revisa existencias físicas y registra nuevas tandas de producción.
          </p>
        </div>
        <button 
          className={`${s.btn} ${s.btnOutlinePrimary}`} 
          onClick={recargarPlan} 
          disabled={loading}
          style={{ padding: "10px 20px", fontWeight: "700" }}
        >
          {loading ? "Actualizando..." : "🔄 Refrescar Stock"}
        </button>
      </div>

      {/* 📊 TABLA DE EXISTENCIAS */}
      <div className={`${s.adminCard} ${s.tableContainer}`} style={{ padding: 0, borderRadius: '12px', overflow: 'hidden' }}>
        
        {/* BUSCADOR */}
        <div style={{ padding: "16px 20px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <input 
            type="text" 
            className={s.inputField} 
            placeholder="🔍 Buscar preparación (ej: Salsa Verde, Masa, Carne Maridada)..." 
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{ maxWidth: "500px", margin: 0, backgroundColor: "#ffffff" }}
          />
        </div>

        <table className={s.table} style={{ minWidth: '700px', margin: 0 }}>
          <thead className={s.thead}>
            <tr>
              <th className={s.th} style={{ padding: "16px 20px", backgroundColor: "#f8fafc", color: "#475569" }}>PREPARACIÓN / SUBRECETA</th>
              <th className={s.th} style={{ textAlign: "center", backgroundColor: "#f8fafc", color: "#475569" }}>STOCK ACTUAL</th>
              <th className={s.th} style={{ textAlign: "center", backgroundColor: "#f8fafc", color: "#475569" }}>UNIDAD</th>
              <th className={s.th} style={{ textAlign: "right", padding: "16px 20px", backgroundColor: "#f8fafc", color: "#475569" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
                  <div className={s.spinner} style={{ margin: "0 auto 15px" }}></div>
                  Sincronizando con los refrigeradores virtuales...
                </td>
              </tr>
            ) : dataInventario.length > 0 ? (
              dataInventario.map((item, idx) => {
                const stock = parseFloat(item.cantidad_actual) || 0;
                const isCritico = stock <= 0;

                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", transition: "background-color 0.2s" }}>
                    <td className={s.td} style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: "800", color: "#334155", fontSize: "14px" }}>
                        {item.subreceta_nombre}
                      </div>
                    </td>
                    
                    <td className={s.td} style={{ textAlign: "center" }}>
                      <span style={{ 
                          fontSize: "1.25rem", 
                          fontWeight: "900",
                          color: isCritico ? "#dc2626" : "#0f172a",
                          backgroundColor: isCritico ? "#fef2f2" : "transparent",
                          padding: isCritico ? "4px 12px" : "0",
                          borderRadius: "8px"
                      }}>
                          {stock.toFixed(2)}
                      </span>
                    </td>
                    
                    <td className={s.td} style={{ textAlign: "center" }}>
                      <span style={{ 
                          padding: "4px 10px", 
                          backgroundColor: "#f1f5f9", 
                          color: "#64748b", 
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px"
                      }}>
                        {item.unidad_medida || "UNID"}
                      </span>
                    </td>
                    
                    <td className={s.td} style={{ textAlign: "right", padding: "16px 20px" }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        
                        {/* 🛡️ BOTÓN DE EDICIÓN: Solo visible si tiene permiso */}
                        {puedeEditarProduccion && (
                          <button 
                            className={s.btn} 
                            style={{ 
                              padding: "8px", 
                              fontSize: "14px", 
                              borderRadius: "8px",
                              backgroundColor: "#f1f5f9",
                              border: "1px solid #cbd5e1",
                              color: "#475569",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }} 
                            title="Ajustar Stock Real"
                            onClick={() => abrirModal(item, 'edit')}
                          >
                            ✏️
                          </button>
                        )}

                        <button 
                          className={`${s.btn} ${s.btnPrimary}`} 
                          style={{ 
                            padding: "10px 18px", 
                            fontSize: "12px", 
                            fontWeight: "800", 
                            letterSpacing: "0.5px",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)"
                          }} 
                          onClick={() => abrirModal(item, 'add')}
                        >
                          + AÑADIR
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontSize: "14px" }}>
                  No se encontraron preparaciones en el inventario.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🪟 MODAL DINÁMICO DE REGISTRO/EDICIÓN */}
      {modalState.isOpen && modalState.item && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(15, 23, 42, 0.75)", display: "flex", 
          justifyContent: "center", alignItems: "center", zIndex: 3000,
          padding: "20px",
          backdropFilter: "blur(4px)"
        }}>
          <div className={s.adminCard} style={{ 
            width: "100%", 
            maxWidth: "420px", 
            padding: "32px",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
            animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>
                {modalState.type === 'edit' ? "⚖️" : "👨‍🍳"}
              </div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "1.4rem", fontWeight: "900", color: "#0f172a" }}>
                {modalState.type === 'edit' ? "Ajustar Stock Físico" : "Nueva Tanda Lista"}
              </h4>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.5", margin: 0 }}>
                {modalState.type === 'edit' ? "Fijando cantidad exacta para: " : "Añadiendo stock a: "} 
                <strong style={{ color: "var(--color-primary)" }}>{modalState.item.subreceta_nombre}</strong>
              </p>
            </div>
            
            <div style={{ marginBottom: "30px" }}>
              <label style={{ fontSize: "11px", fontWeight: "900", color: "#475569", display: "block", marginBottom: "8px", textTransform: "uppercase", textAlign: "center" }}>
                {modalState.type === 'edit' 
                  ? `Stock Real Actual (${modalState.item.unidad_medida})` 
                  : `Cantidad a sumar (${modalState.item.unidad_medida})`}
              </label>
              <input 
                type="number" 
                className={s.inputField} 
                autoFocus
                placeholder="0.00"
                value={cantidadRegistro}
                onChange={(e) => setCantidadRegistro(e.target.value)}
                style={{ 
                  fontSize: "2.5rem", 
                  fontWeight: "900", 
                  textAlign: "center", 
                  height: "80px", 
                  color: modalState.type === 'edit' ? "#0f172a" : "var(--color-primary)",
                  backgroundColor: "#f8fafc",
                  border: "2px solid #cbd5e1",
                  borderRadius: "12px"
                }}
              />
              <p style={{ textAlign: "center", fontSize: "11px", color: "#94a3b8", marginTop: "10px" }}>
                {modalState.type === 'edit'
                  ? "Este valor reemplazará el stock actual en el sistema."
                  : "Usa un número negativo (ej: -2) si necesitas registrar una merma."}
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                className={`${s.btn} ${s.btnOutlineDanger}`} 
                style={{ flex: 1, fontWeight: "800", padding: "14px", fontSize: "14px", borderRadius: "10px" }} 
                onClick={cerrarModal}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                className={`${s.btn} ${s.btnPrimary}`} 
                style={{ flex: 1, fontWeight: "800", padding: "14px", fontSize: "14px", borderRadius: "10px" }} 
                onClick={confirmarRegistro}
                disabled={isSubmitting || cantidadRegistro === ""}
              >
                {isSubmitting ? "Guardando..." : "Confirmar ✓"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};