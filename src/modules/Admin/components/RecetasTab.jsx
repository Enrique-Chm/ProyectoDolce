// Archivo: src/modules/Admin/components/RecetasTab.jsx
import React, { useState, useEffect } from "react";
import { recetasService } from "../../../services/Recetas.service";
import s from "../AdminPage.module.css";
import { hasPermission } from "../../../utils/checkPermiso";

export const RecetasTab = ({ sucursalId }) => {
  const [recetasAgrupadas, setRecetasAgrupadas] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [nombreReceta, setNombreReceta] = useState("");
  const [isSubreceta, setIsSubreceta] = useState(false);
  const [ingredientes, setIngredientes] = useState([
    { insumo_id: "", cantidad: "", unidad_id: "" },
  ]);

  const puedeEditar = hasPermission("editar_recetas");
  const puedeBorrar = hasPermission("borrar_registros");

  useEffect(() => {
    fetchData();
  }, [sucursalId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await recetasService.getInitialData(sucursalId);
      setRecetasAgrupadas(data.recetasAgrupadas || []);
      setInsumos(data.insumos || []);
      setUnidades(data.unidades || []);
    } catch (error) {
      console.error("Error al cargar RecetasTab:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeIngrediente = (index) => {
    if (!puedeEditar) return;
    if (ingredientes.length > 1) {
      const newIngs = ingredientes.filter((_, i) => i !== index);
      setIngredientes(newIngs);
    } else {
      setIngredientes([{ insumo_id: "", cantidad: "", unidad_id: "" }]);
    }
  };

  const resetForm = () => {
    setNombreReceta("");
    setIsSubreceta(false);
    setIngredientes([{ insumo_id: "", cantidad: "", unidad_id: "" }]);
    setIsEditing(false);
  };

  const handleEdit = (receta) => {
    setIsEditing(true);
    setNombreReceta(receta.nombre);
    setIsSubreceta(receta.subreceta);
    const ingsMapeados = receta.detalle_ingredientes.map((ing) => {
      const insumoEncontrado = insumos.find((i) => i.nombre === ing.insumo);
      const unidadEncontrada = unidades.find(
        (u) => u.abreviatura === ing.unidad,
      );
      return {
        insumo_id: insumoEncontrado ? insumoEncontrado.id : "",
        cantidad: ing.cantidad,
        unidad_id: unidadEncontrada ? unidadEncontrada.id : "",
      };
    });
    setIngredientes(ingsMapeados);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeEditar) return;
    
    // Validación extra: asegurarse que todos los ingredientes tengan un insumo válido
    const hayIncompletos = ingredientes.some(ing => !ing.insumo_id);
    if (hayIncompletos) {
      return alert("Por favor, selecciona un insumo válido de la lista en todos los ingredientes.");
    }

    setLoading(true);

    const rows = ingredientes.map((ing) => ({
      nombre: nombreReceta,
      subreceta: isSubreceta,
      insumo: parseInt(ing.insumo_id),
      cantidad: parseFloat(ing.cantidad),
      unidad_medida: parseInt(ing.unidad_id),
      sucursal_id: sucursalId,
    }));

    const { error } = await recetasService.saveReceta(
      rows,
      nombreReceta,
      isEditing,
    );

    if (error) alert(error.message);
    else {
      resetForm();
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteReceta = async (nombre) => {
    if (!puedeBorrar) return;
    if (window.confirm(`¿Eliminar receta "${nombre}"?`)) {
      const { error } = await recetasService.deleteReceta(nombre);
      if (error) alert(error.message);
      else fetchData();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "800",
            color: "var(--color-text-main)",
            margin: 0,
          }}
        >
          Ingeniería de Recetas
        </h2>
        {loading && (
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-primary)",
              fontWeight: "700",
            }}
          >
            SINCRONIZANDO...
          </span>
        )}
      </header>

      {/* ESTRUCTURA RESPONSIVA: Formulario arriba en tablets, al lado en desktop */}
      <div className="admin-split-layout-sidebar">
        {/* FORMULARIO DE EDICIÓN */}
        <aside className={s.adminCard} style={{ padding: "20px" }}>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: "700",
              marginBottom: "20px",
              color: "var(--color-primary)",
            }}
          >
            {isEditing ? "📝 Editando Receta" : "🍳 Nueva Preparación"}
          </h3>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "var(--color-text-muted)",
                  marginBottom: "5px",
                }}
              >
                NOMBRE DE LA PREPARACIÓN
              </label>
              <input
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "var(--radius-ui)",
                  border: "1px solid var(--color-border)",
                  boxSizing: "border-box",
                }}
                value={nombreReceta}
                onChange={(e) => setNombreReceta(e.target.value)}
                required
                disabled={isEditing || !puedeEditar}
                placeholder="Ej. Salsa Roja Especial"
              />
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                padding: "10px 0",
              }}
            >
              <input
                type="checkbox"
                style={{ width: "18px", height: "18px" }}
                checked={isSubreceta}
                onChange={(e) => setIsSubreceta(e.target.checked)}
                disabled={!puedeEditar}
              />
              <span>
                ¿Es Sub-receta?{" "}
                <small
                  style={{
                    fontWeight: "400",
                    color: "var(--color-text-muted)",
                    display: "block",
                  }}
                >
                  Insumo para otra receta
                </small>
              </span>
            </label>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--color-border)",
                margin: "10px 0",
              }}
            />

            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                }}
              >
                Ingredientes y Cantidades
              </label>

              {ingredientes.map((ing, idx) => {
                const selectedInsumo = insumos.find(
                  (i) => i.id === parseInt(ing.insumo_id),
                );
                const costoFilaVivo = (
                  (selectedInsumo?.costo_unitario || 0) *
                  (parseFloat(ing.cantidad) || 0)
                ).toFixed(2);

                return (
                  <div
                    key={idx}
                    style={{
                      padding: "15px",
                      background: "var(--color-bg-muted)",
                      borderRadius: "var(--radius-ui)",
                      border: "1px solid var(--color-border)",
                      position: "relative",
                    }}
                  >
                    {puedeEditar && (
                      <button
                        type="button"
                        style={{
                          position: "absolute",
                          top: "-10px", 
                          right: "-10px", 
                          width: "28px", 
                          height: "28px",
                          borderRadius: "50%", 
                          backgroundColor: "var(--color-danger)", 
                          color: "white", 
                          border: "2px solid white", 
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          zIndex: 10,
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                        onClick={() => removeIngrediente(idx)}
                      >
                        ✕
                      </button>
                    )}

                    <div style={{ marginBottom: "12px" }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "10px",
                          fontWeight: "700",
                          color: "var(--color-text-muted)",
                          marginBottom: "5px",
                        }}
                      >
                        SELECCIONAR INSUMO
                      </label>
                      
                      {/* --- NUEVO COMPONENTE COMBOBOX AUTOFILTRADO --- */}
                      <SearchableSelect 
                        options={insumos}
                        value={ing.insumo_id}
                        disabled={!puedeEditar}
                        onChange={(selectedId) => {
                          const n = [...ingredientes];
                          const insumoData = insumos.find((i) => i.id === parseInt(selectedId));
                          n[idx].insumo_id = selectedId;
                          if (insumoData) n[idx].unidad_id = insumoData.unidad_medida || "";
                          setIngredientes(n);
                        }}
                      />
                      
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1fr",
                        gap: "10px",
                        alignItems: "flex-end",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "10px",
                            fontWeight: "700",
                            color: "var(--color-text-muted)",
                            marginBottom: "5px",
                          }}
                        >
                          CANTIDAD
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "var(--radius-ui)",
                            border: "1px solid var(--color-border)",
                            fontSize: "14px",
                            boxSizing: "border-box",
                          }}
                          value={ing.cantidad}
                          onChange={(e) => {
                            const n = [...ingredientes];
                            n[idx].cantidad = e.target.value;
                            setIngredientes(n);
                          }}
                          required
                          readOnly={!puedeEditar}
                        />
                      </div>
                      <div
                        style={{
                          padding: "10px",
                          borderRadius: "var(--radius-ui)",
                          background: "white",
                          border: "1px solid var(--color-border)",
                          fontSize: "13px",
                          textAlign: "center",
                          fontWeight: "800",
                          color: "var(--color-text-muted)",
                          minHeight: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {unidades.find((u) => u.id === parseInt(ing.unidad_id))
                          ?.abreviatura || "U.M."}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        textAlign: "right",
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "var(--color-primary)",
                        background: "white",
                        display: "inline-block",
                        float: "right",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      COSTO LÍNEA: ${costoFilaVivo}
                    </div>
                    <div style={{ clear: "both" }}></div>
                  </div>
                );
              })}
            </div>

            {puedeEditar && (
              <button
                type="button"
                onClick={() =>
                  setIngredientes([
                    ...ingredientes,
                    { insumo_id: "", cantidad: "", unidad_id: "" },
                  ])
                }
                className={s.btnLogout}
                style={{
                  width: "100%",
                  borderStyle: "dashed",
                  color: "var(--color-primary)",
                  padding: "15px",
                  marginTop: "10px",
                }}
              >
                + AÑADIR INGREDIENTE
              </button>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "15px",
              }}
            >
              {puedeEditar && (
                <button
                  type="submit"
                  className={s.btnLogout}
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    border: "none",
                    padding: "16px",
                    fontWeight: "800",
                  }}
                  disabled={loading}
                >
                  {loading
                    ? "..."
                    : isEditing
                      ? "ACTUALIZAR RECETA"
                      : "GUARDAR RECETA"}
                </button>
              )}

              {isEditing && (
                <button
                  type="button"
                  className={s.btnLogout}
                  style={{ padding: "14px" }}
                  onClick={resetForm}
                >
                  CANCELAR EDICIÓN
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* TABLA DE RECETAS */}
        <div
          className={s.adminCard}
          style={{ padding: "0", overflowX: "auto" }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              minWidth: "800px",
            }}
          >
            <thead
              style={{
                backgroundColor: "var(--color-bg-muted)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <tr>
                <th
                  style={{
                    padding: "15px",
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                  }}
                >
                  PREPARACIÓN
                </th>
                <th
                  style={{
                    padding: "15px",
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                  }}
                >
                  COMPOSICIÓN
                </th>
                <th
                  style={{
                    padding: "15px",
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                    textAlign: "right",
                  }}
                >
                  COSTO TOTAL
                </th>
                <th
                  style={{
                    padding: "15px",
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                    textAlign: "right",
                  }}
                >
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {recetasAgrupadas.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    No hay recetas registradas.
                  </td>
                </tr>
              ) : (
                recetasAgrupadas.map((r, idx) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: "1px solid var(--color-bg-muted)" }}
                  >
                    <td style={{ padding: "15px" }}>
                      <div
                        style={{
                          fontWeight: "800",
                          color: "var(--color-text-main)",
                        }}
                      >
                        {r.nombre}
                      </div>
                      {r.subreceta && (
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: "800",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            backgroundColor: "var(--color-bg-app)",
                            color: "var(--color-primary)",
                            marginTop: "4px",
                            display: "inline-block",
                          }}
                        >
                          SUB-RECETA
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "15px" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {r.detalle_ingredientes.map((ing, iidx) => (
                          <div
                            key={iidx}
                            style={{
                              fontSize: "11px",
                              color: "var(--color-text-muted)",
                              background: "var(--color-bg-app)",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            • {ing.insumo}:{" "}
                            <strong>
                              {ing.cantidad} {ing.unidad}
                            </strong>
                            <span
                              style={{
                                color: "var(--color-primary)",
                                marginLeft: "5px",
                                fontWeight: "800",
                              }}
                            >
                              {" "}
                              (${ing.costo_fila.toFixed(2)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "15px", textAlign: "right" }}>
                      <div
                        style={{
                          fontWeight: "900",
                          color: "var(--color-text-main)",
                          fontSize: "1.2rem",
                        }}
                      >
                        ${r.costo_total_receta?.toFixed(2)}
                      </div>
                    </td>
                    <td style={{ padding: "15px", textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          className={s.btnLogout}
                          style={{ padding: "8px 12px", fontSize: "11px" }}
                          onClick={() => handleEdit(r)}
                        >
                          {puedeEditar ? "EDITAR" : "VER"}
                        </button>
                        {puedeBorrar && (
                          <button
                            className={s.btnLogout}
                            style={{
                              padding: "8px 12px",
                              fontSize: "11px",
                              color: "var(--color-danger)",
                              borderColor: "var(--color-danger)",
                            }}
                            onClick={() => handleDeleteReceta(r.nombre)}
                          >
                            BORRAR
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


/**
 * SUB-COMPONENTE: SearchableSelect (Combo Autocompletado)
 * Permite buscar tecleando y seleccionar de una lista flotante.
 */
const SearchableSelect = ({ options, value, onChange, disabled }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Sincroniza el texto del input si el valor cambia por fuera (ej. al darle a 'Editar' en la tabla)
  useEffect(() => {
    const selected = options.find((opt) => opt.id === parseInt(value));
    if (selected) {
      setSearchTerm(selected.nombre);
    } else {
      setSearchTerm("");
    }
  }, [value, options]);

  const filteredOptions = options.filter(opt =>
    opt.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={searchTerm}
        disabled={disabled}
        placeholder="Buscar y seleccionar..."
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "var(--radius-ui)",
          border: "1px solid var(--color-border)",
          fontSize: "14px",
          boxSizing: "border-box",
          backgroundColor: disabled ? "var(--color-bg-app)" : "white"
        }}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          // Si cambian el texto, reseteamos el valor interno para forzarlos a seleccionar de la lista
          if (value) onChange(""); 
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          // Un pequeño retraso para permitir que el clic en la lista (onMouseDown) se procese antes de cerrar
          setTimeout(() => {
            setIsOpen(false);
            // Si pierden el foco y no seleccionaron nada de la lista, regresamos el texto al seleccionado válido
            const selected = options.find((opt) => opt.id === parseInt(value));
            if (selected) setSearchTerm(selected.nombre);
            else setSearchTerm(""); // O borramos si no habían seleccionado nada
          }, 200);
        }}
      />
      
      {isOpen && !disabled && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '200px',
          overflowY: 'auto',
          background: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-ui)',
          zIndex: 1000,
          margin: '4px 0 0 0',
          padding: 0,
          listStyle: 'none',
          boxShadow: 'var(--shadow-ui)'
        }}>
          {filteredOptions.length > 0 ? filteredOptions.map(opt => (
            <li
              key={opt.id}
              style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid var(--color-bg-muted)', fontSize: '13px' }}
              // Usamos onMouseDown en lugar de onClick para que se dispare ANTES que el onBlur del input
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.id);
                setSearchTerm(opt.nombre);
                setIsOpen(false);
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-bg-app)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {opt.nombre}
            </li>
          )) : (
            <li style={{ padding: '10px 15px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              No se encontraron coincidencias...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};