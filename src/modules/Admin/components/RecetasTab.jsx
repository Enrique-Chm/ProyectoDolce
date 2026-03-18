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

  // 🛡️ ESCUDOS DE SEGURIDAD (RBAC)
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
      const unidadEncontrada = unidades.find((u) => u.abreviatura === ing.unidad);
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
    
    const hayIncompletos = ingredientes.some(ing => !ing.insumo_id);
    if (hayIncompletos) {
      return alert("Por favor, selecciona un insumo válido.");
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

    const { error } = await recetasService.saveReceta(rows, nombreReceta, isEditing);

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
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Ingeniería de Recetas</h2>
        {loading && <span className={s.syncBadge}>SINCRONIZANDO...</span>}
      </header>

      <div className={s.splitLayout}>
        {/* FORMULARIO DE RECETA */}
        <aside className={s.adminCard}>
          <h3 className={s.cardTitle}>
            {isEditing ? (puedeEditar ? " Editando Receta" : "Ver Receta") : " Nueva Preparación"}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div className={s.formGroup}>
              <label className={s.label}>NOMBRE DE LA PREPARACIÓN</label>
              <input
                className={s.inputField}
                value={nombreReceta}
                onChange={(e) => setNombreReceta(e.target.value)}
                required
                disabled={isEditing || !puedeEditar}
                placeholder="Ej. Salsa Roja Especial"
                style={{ backgroundColor: (isEditing || !puedeEditar) ? "var(--color-bg-muted)" : "white" }}
              />
            </div>

            <label className={s.checkboxLabel}>
              <input
                type="checkbox"
                className={s.checkbox}
                checked={isSubreceta}
                onChange={(e) => setIsSubreceta(e.target.checked)}
                disabled={!puedeEditar}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 700 }}>¿Es Sub-receta?</span>
                <small className={s.textMuted}>Insumo para otra receta</small>
              </div>
            </label>

            <hr className={s.hr} />

            <div className={s.flexColumnGap10}>
              <label className={s.label} style={{ fontSize: '10px' }}>INGREDIENTES Y CANTIDADES</label>

              {ingredientes.map((ing, idx) => {
                const selectedInsumo = insumos.find(i => i.id === parseInt(ing.insumo_id));
                const costoFilaVivo = ((selectedInsumo?.costo_unitario || 0) * (parseFloat(ing.cantidad) || 0)).toFixed(2);

                return (
                  <div key={idx} className={s.itemCardRelative}>
                    {puedeEditar && (
                      <button type="button" className={`${s.btn} ${s.btnRemoveCircle} ${s.btnSmall}`} onClick={() => removeIngrediente(idx)}>X</button>
                    )}
                    <div className={s.formGroup} style={{ marginBottom: '10px' }}>
                      <label className={s.label} style={{ fontSize: '9px' }}>SELECCIONAR INSUMO</label>
                      <SearchableSelect 
                        options={insumos}
                        value={ing.insumo_id}
                        disabled={!puedeEditar}
                        onChange={(selectedId) => {
                          const n = [...ingredientes];
                          const insData = insumos.find(i => i.id === parseInt(selectedId));
                          n[idx].insumo_id = selectedId;
                          if (insData) n[idx].unidad_id = insData.unidad_medida || "";
                          setIngredientes(n);
                        }}
                      />
                    </div>

                    <div className={s.formGrid}>
                      <div className={s.formGroup} style={{ marginBottom: 0 }}>
                        <label className={s.label} style={{ fontSize: '9px' }}>CANTIDAD</label>
                        <input
                          type="number" step="0.001"
                          className={s.inputField}
                          value={ing.cantidad}
                          onChange={e => {
                            const n = [...ingredientes];
                            n[idx].cantidad = e.target.value;
                            setIngredientes(n);
                          }}
                          required
                          readOnly={!puedeEditar}
                        />
                      </div>
                      <div className={s.unitDisplayBox}>
                        {unidades.find(u => u.id === parseInt(ing.unidad_id))?.abreviatura || "U.M."}
                      </div>
                    </div>

                    <div className={s.costHint}>
                      COSTO LÍNEA: ${costoFilaVivo}
                    </div>
                  </div>
                );
              })}
            </div>

            {puedeEditar && (
              <button 
                type="button" 
                onClick={() => setIngredientes([...ingredientes, { insumo_id: "", cantidad: "", unidad_id: "" }])}
                className={`${s.btn} ${s.btnSec} ${s.btnSmall}`}>
                + AÑADIR INGREDIENTE
              </button>
            )}

            <div className={s.flexColumnGap10} style={{ marginTop: '10px' }}>
              {puedeEditar && (
                <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} disabled={loading}>
                  {loading ? "..." : isEditing ? "ACTUALIZAR" : "GUARDAR RECETA"}
                </button>
              )}
              {isEditing && (
                <button type="button" className={`${s.btn} ${s.btnDark} ${s.btnFull}`} onClick={resetForm}>
                  {puedeEditar ? "CANCELAR" : "CERRAR"}
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* TABLA DE RECETAS */}
        <div className={`${s.adminCard} ${s.tableContainer}`}>
          <table className={s.table} style={{ minWidth: "800px" }}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th} style={{ textAlign: "left" }}>PREPARACIÓN</th>
                <th className={s.th} style={{ textAlign: "center" }}>COMPOSICIÓN</th>
                <th className={s.th} style={{ textAlign: "center" }}>COSTO TOTAL</th>
                <th className={s.th} style={{ textAlign: "center" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {recetasAgrupadas.length === 0 ? (
                <tr><td colSpan="4" className={s.emptyState}>No hay recetas registradas.</td></tr>
              ) : (
                recetasAgrupadas.map((r, idx) => (
                  <tr key={idx}>
                    <td className={s.td}>
                      <div style={{ fontWeight: "600" }}>{r.nombre}</div>
                      {r.subreceta && <span className={s.badge}>SUB-RECETA</span>}
                    </td>
                    <td className={s.td}style={{ textAlign: "center" }}>
                      <div className={s.flexColumnGap5}>
                        {r.detalle_ingredientes.map((ing, iidx) => (
                          <div key={iidx} className={s.miniBadge}>
                            • {ing.insumo}: <strong>{ing.cantidad} {ing.unidad}</strong>
                            <span style={{ color: "var(--color-primary)", marginLeft: "5px" }}> (${ing.costo_fila.toFixed(2)})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className={s.td} style={{ textAlign: "center" }}>
                      <div className={s.totalAmount}>${r.costo_total_receta?.toFixed(2)}</div>
                    </td>
                    <td className={s.td} style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "5px", justifyContent: "flex-end" }}>
                        <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => handleEdit(r)}>
                          {puedeEditar ? "📝" : "VER"}
                        </button>
                        {puedeBorrar && (
                          <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnEditar}`} onClick={() => handleDeleteReceta(r.nombre)}>
                            ❌
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
 * SearchableSelect Homologado
 */
const SearchableSelect = ({ options, value, onChange, disabled }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find((opt) => opt.id === parseInt(value));
    setSearchTerm(selected ? selected.nombre : "");
  }, [value, options]);

  const filteredOptions = options.filter(opt =>
    opt.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        className={s.inputField}
        value={searchTerm}
        disabled={disabled}
        placeholder="Buscar..."
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          if (value) onChange(""); 
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false);
            const selected = options.find((opt) => opt.id === parseInt(value));
            setSearchTerm(selected ? selected.nombre : "");
          }, 200);
        }}
      />
      
      {isOpen && !disabled && (
        <ul className={s.dropdownList}>
          {filteredOptions.length > 0 ? filteredOptions.map(opt => (
            <li
              key={opt.id}
              className={s.dropdownItem}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.id);
                setSearchTerm(opt.nombre);
                setIsOpen(false);
              }}
            >
              {opt.nombre}
            </li>
          )) : (
            <li className={s.dropdownItem} style={{ color: 'var(--color-text-muted)' }}>No hay resultados</li>
          )}
        </ul>
      )}
    </div>
  );
};