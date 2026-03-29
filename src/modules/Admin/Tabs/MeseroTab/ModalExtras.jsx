import React, { useState } from "react";
import s from "../../../../assets/styles/ServicioTab.module.css";

export const ModalExtras = ({
  productoParaExtras,
  confirmarProductoConExtras,
  cerrarModalExtras
}) => {
  // ESTADO INTERNO DEL MODAL PARA LLEVAR LA CUENTA DE EXTRAS SELECCIONADOS
  const [extrasSeleccionados, setExtrasSeleccionados] = useState({});

  /**
   * Maneja el incremento o decremento de un extra en el modal
   */
  const handleToggleExtra = (grupo, opcion, delta) => {
    setExtrasSeleccionados(prev => {
      const actualGroupCounts = prev[grupo.id] || {};
      const currentQty = actualGroupCounts[opcion.id] || 0;
      const newQty = currentQty + delta;

      // Calcular cantidad total actual seleccionada en este grupo
      const totalInGroup = Object.values(actualGroupCounts).reduce((a, b) => a + b, 0);

      // Bloquear si intenta sumar más allá del máximo del grupo
      if (delta > 0 && totalInGroup >= grupo.max_seleccion) return prev;
      // Bloquear si intenta restar por debajo de 0
      if (delta < 0 && newQty < 0) return prev;

      const updatedGroupCounts = { ...actualGroupCounts, [opcion.id]: newQty };

      // Limpiar opciones en 0 para mantener el estado ligero
      if (newQty === 0) delete updatedGroupCounts[opcion.id];

      return {
        ...prev,
        [grupo.id]: updatedGroupCounts
      };
    });
  };

  /**
   * Valida si se cumplen todos los requisitos mínimos de los grupos
   */
  const isModalValido = () => {
    if (!productoParaExtras || !productoParaExtras.grupos) return true;
    return productoParaExtras.grupos.every(grupo => {
      const selectedInGroup = extrasSeleccionados[grupo.id] || {};
      const totalSelected = Object.values(selectedInGroup).reduce((a, b) => a + b, 0);
      return totalSelected >= (grupo.min_seleccion || 0);
    });
  };

  /**
   * Prepara la data final del modal para mandarla al hook
   */
  const submitExtras = () => {
    const arrExtras = [];
    Object.entries(extrasSeleccionados).forEach(([grupoId, opciones]) => {
      const grupoObj = productoParaExtras.grupos.find(g => g.id === parseInt(grupoId));
      Object.entries(opciones).forEach(([opcionId, qty]) => {
        if (qty > 0) {
          const optDetail = grupoObj.opciones_modificadores.find(o => o.id === parseInt(opcionId));
          // Insertamos un registro en el array por cada unidad (si eligió 2 quesos, van 2 líneas de queso)
          for (let i = 0; i < qty; i++) {
            arrExtras.push({
              grupo_id: grupoObj.id,
              grupo_nombre: grupoObj.nombre,
              opcion_id: optDetail.id,
              subreceta_id: optDetail.subreceta_id,
              precio_venta: optDetail.precio_venta
            });
          }
        }
      });
    });
    
    confirmarProductoConExtras(productoParaExtras, arrExtras);
    setExtrasSeleccionados({}); // Resetear modal
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999,
      display: "flex", justifyContent: "center", alignItems: "center",
      backdropFilter: "blur(4px)"
    }}>
      <div style={{
        background: "var(--color-bg-app)", width: "95%", maxWidth: "500px",
        borderRadius: "var(--radius-card)", padding: "24px",
        boxShadow: "var(--shadow-lg)", maxHeight: "90vh", display: "flex", flexDirection: "column"
      }}>
        <h3 style={{ margin: "0 0 5px 0", color: "var(--color-primary)", fontSize: "1.5rem" }}>
          Personalizar {productoParaExtras.nombre}
        </h3>
        <p style={{ margin: "0 0 20px 0", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Selecciona las opciones para este platillo.
        </p>

        <div style={{ overflowY: "auto", flex: 1, paddingRight: "10px" }}>
          {(productoParaExtras.grupos || []).map(grupo => {
            const selections = extrasSeleccionados[grupo.id] || {};
            const totalSelected = Object.values(selections).reduce((a, b) => a + b, 0);
            const isRequired = grupo.min_seleccion > 0;
            const isFulfilled = totalSelected >= grupo.min_seleccion;
            const isMaxedOut = totalSelected >= grupo.max_seleccion;

            return (
              <div key={grupo.id} style={{
                marginBottom: "20px", background: "white", padding: "15px",
                borderRadius: "8px", border: `1px solid ${!isFulfilled && isRequired ? "var(--color-warning)" : "var(--color-border)"}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <strong style={{ fontSize: "1.1rem" }}>{grupo.nombre}</strong>
                  <span style={{
                    fontSize: "0.75rem", padding: "4px 8px", borderRadius: "4px",
                    background: isFulfilled ? "var(--color-bg-sidebar)" : (isRequired ? "#fff3cd" : "var(--color-bg-app)"),
                    color: isFulfilled ? "var(--color-success)" : (isRequired ? "#856404" : "var(--color-text-muted)"),
                    fontWeight: "bold"
                  }}>
                    {totalSelected} / {grupo.max_seleccion} {isRequired ? `(Min: ${grupo.min_seleccion})` : '(Opcional)'}
                  </span>
                </div>

                {(grupo.opciones_modificadores || []).map(opt => {
                  const qty = selections[opt.id] || 0;
                  return (
                    <div key={opt.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 0", borderBottom: "1px dashed #eee"
                    }}>
                      <div>
                        <span style={{ fontWeight: qty > 0 ? "bold" : "normal" }}>{opt.subreceta_id}</span>
                        {parseFloat(opt.precio_venta) > 0 && (
                          <span style={{ color: "var(--color-primary)", marginLeft: "8px", fontSize: "0.9rem" }}>
                            +${parseFloat(opt.precio_venta).toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button 
                          type="button"
                          onClick={() => handleToggleExtra(grupo, opt, -1)}
                          disabled={qty === 0}
                          style={{ 
                            width: "30px", height: "30px", borderRadius: "50%", border: "1px solid var(--color-border)",
                            background: qty === 0 ? "var(--color-bg-app)" : "var(--color-danger)",
                            color: qty === 0 ? "var(--color-text-muted)" : "white", cursor: qty === 0 ? "not-allowed" : "pointer"
                          }}
                        >-</button>
                        <span style={{ width: "20px", textAlign: "center", fontWeight: "bold" }}>{qty}</span>
                        <button 
                          type="button"
                          onClick={() => handleToggleExtra(grupo, opt, 1)}
                          disabled={isMaxedOut}
                          style={{ 
                            width: "30px", height: "30px", borderRadius: "50%", border: "none",
                            background: isMaxedOut ? "var(--color-bg-app)" : "var(--color-success)",
                            color: isMaxedOut ? "var(--color-text-muted)" : "white", cursor: isMaxedOut ? "not-allowed" : "pointer"
                          }}
                        >+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px", paddingTop: "15px", borderTop: "2px solid var(--color-border)" }}>
          <button 
            onClick={() => { setExtrasSeleccionados({}); cerrarModalExtras(); }} 
            className={s.btnCancel} style={{ flex: 1 }}
          >
            CANCELAR
          </button>
          <button 
            onClick={submitExtras} 
            disabled={!isModalValido()}
            className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} style={{ flex: 2, background: isModalValido() ? "var(--color-primary)" : "var(--color-text-muted)" }}
          >
            {isModalValido() ? "AGREGAR A LA ORDEN" : "SELECCIÓN INCOMPLETA"}
          </button>
        </div>
      </div>
    </div>
  );
};