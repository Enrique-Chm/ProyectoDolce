// Archivo: src/modules/Admin/Tabs/InventariosTab/InventariosTab.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useInventarios } from "./useInventariosTab";
import s from "../../../../assets/styles/EstilosGenerales.module.css";

// Importamos las nuevas sub-vistas
import { ExistenciasView } from "./ExistenciasView";
import { AuditoriaView } from "./AuditoriaView";
import { MovimientosView } from "./MovimientosView";

const InventariosTab = ({ sucursalId, usuarioId }) => {
  // Consumimos estados, métodos y las banderas de seguridad del hook sincronizado
  const {
    insumos,
    insumosFiltrados,
    searchTerm,
    setSearchTerm,
    movimientos,
    motivosCatalogo,
    contrasteData,
    contrasteDataFiltrado,
    conteos,
    actualizarConteo,
    auditados,
    filtroAuditoria,
    setFiltroAuditoria,
    loading,
    procesarNuevoMovimiento,
    generarContraste,
    guardarConteoFisico,
    guardarAuditoriaMasiva,
    puedeVer,
    puedeCrear,
    puedeEditar,
  } = useInventarios(sucursalId);

  // --- ESTADOS VISUALES ---
  const [activeSubTab, setActiveSubTab] = useState("stock");
  const [filtroFechas, setFiltroFechas] = useState({
    inicio: new Date().toISOString().split("T")[0],
    fin: new Date().toISOString().split("T")[0],
  });

  const [nuevoMov, setNuevoMov] = useState({
    insumo_id: "",
    tipo: "ENTRADA",
    cantidad: "",
    motivo: "",
  });

  // Memorización para optimizar el filtrado de motivos según el tipo de operación
  const insumoSeleccionado = useMemo(
    () => insumos?.find((i) => String(i.id) === String(nuevoMov.insumo_id)),
    [insumos, nuevoMov.insumo_id],
  );

  const motivosDisponibles = useMemo(
    () => motivosCatalogo?.filter((m) => m.tipo === nuevoMov.tipo) || [],
    [motivosCatalogo, nuevoMov.tipo],
  );

  // --- HANDLERS ---
  const handleSubmitMovimiento = async (e) => {
    e.preventDefault();
    if (!puedeCrear) return;
    if (!nuevoMov.insumo_id)
      return alert("Por favor selecciona un insumo de la lista.");

    const res = await procesarNuevoMovimiento(
      nuevoMov,
      insumoSeleccionado,
      usuarioId,
    );

    if (res.success) {
      setNuevoMov({ insumo_id: "", tipo: "ENTRADA", cantidad: "", motivo: "" });
    }
  };

  const handleGuardarConteo = async (row) => {
    if (!puedeEditar) return;
    const valorFisico = conteos[row.id];

    if (valorFisico === undefined || valorFisico === "") {
      return alert("Por favor ingresa el peso o conteo físico real.");
    }

    if (
      window.confirm(
        `¿Confirmas que el stock real de ${row.insumo} es ${valorFisico} ${row.unidad || 'U'}?`,
      )
    ) {
      const res = await guardarConteoFisico(
        row,
        valorFisico,
        usuarioId,
        filtroFechas.inicio,
        filtroFechas.fin,
      );
      if (!res.success) alert("Error al procesar auditoría: " + res.error);
    }
  };

  // 💡 Lógica de Diseño Dinámico
  const mostrarFormulario = activeSubTab !== "contraste" && puedeCrear;

  if (!puedeVer)
    return (
      <div className={s.emptyState}>
        No tienes permisos para acceder al inventario.
      </div>
    );

  return (
    <div className={s.tabWrapper}>
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Gestión de Inventarios</h2>
        {loading && <span className={s.syncBadge}>ACTUALIZANDO...</span>}
      </header>

      {/* Navegación */}
      <nav className={s.tabNav}>
        <button
          className={`${s.tabButton} ${activeSubTab === "stock" ? s.activeTabButton : ""}`}
          onClick={() => setActiveSubTab("stock")}
        >
          EXISTENCIAS
        </button>
        <button
          className={`${s.tabButton} ${activeSubTab === "movimientos" ? s.activeTabButton : ""}`}
          onClick={() => setActiveSubTab("movimientos")}
        >
          HISTORIAL
        </button>
        <button
          className={`${s.tabButton} ${activeSubTab === "contraste" ? s.activeTabButton : ""}`}
          onClick={() => setActiveSubTab("contraste")}
        >
          AUDITORÍA / CIERRE
        </button>
      </nav>

      <div className={mostrarFormulario ? s.splitLayout : s.fullLayout}>
        {/* PANEL LATERAL DE MOVIMIENTO MANUAL (KARDEX) */}
        <aside
          className={s.adminCard}
          style={{
            display: mostrarFormulario ? "block" : "none",
            position: "sticky",
            top: "20px",
          }}
        >
          <h3 className={s.cardTitle}>
            {puedeCrear ? "Registrar Movimiento" : "Detalles de Insumo"}
          </h3>

          <form onSubmit={handleSubmitMovimiento} className={s.formColumn}>
            {/* 1. SELECCIÓN DE INSUMO */}
            <div className={s.formGroup}>
              <label className={s.label}>INSUMO</label>
              <SearchableSelect
                options={insumos || []}
                value={nuevoMov.insumo_id}
                valueKey="id"
                labelKey="nombre"
                placeholder="Buscar insumo por nombre..."
                formatLabel={(opt) =>
                  `${opt.nombre} (Saldo: ${opt.stock_fisico || 0} ${opt.unidad || 'U'})`
                }
                disabled={loading || !puedeCrear}
                onChange={(val) => setNuevoMov({ ...nuevoMov, insumo_id: val })}
              />
            </div>

            {/* 2. FILA DOBLE (Grid): Operación y Cantidad */}
            <div
              className={s.formGrid}
              style={{ gridTemplateColumns: "1fr 1fr", gap: "15px" }}
            >
              <div className={s.formGroup}>
                <label className={s.label}>OPERACIÓN</label>
                <select
                  className={s.inputField}
                  value={nuevoMov.tipo}
                  disabled={!puedeCrear}
                  style={{
                    backgroundColor: !puedeCrear ? "var(--color-bg-muted)" : "white",
                    cursor: !puedeCrear ? "not-allowed" : "pointer",
                  }}
                  onChange={(e) =>
                    setNuevoMov({
                      ...nuevoMov,
                      tipo: e.target.value,
                      motivo: "",
                    })
                  }
                >
                  <option value="ENTRADA">Entrada (+)</option>
                  <option value="MERMA">Merma (-)</option>
                  <option value="SALIDA">Salida (-)</option>
                </select>
              </div>

              <div className={s.formGroup}>
                <label
                  className={s.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>CANTIDAD</span>
                  {insumoSeleccionado && (
                    <span
                      style={{
                        color: "var(--color-primary)",
                        textTransform: "none",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      ({insumoSeleccionado.unidad || 'U'})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={s.inputField}
                  value={nuevoMov.cantidad}
                  onChange={(e) =>
                    setNuevoMov({ ...nuevoMov, cantidad: e.target.value })
                  }
                  required
                  readOnly={!puedeCrear}
                  style={{
                    backgroundColor: !puedeCrear ? "var(--color-bg-muted)" : "white",
                  }}
                />
              </div>
            </div>

            {/* 3. MOTIVO */}
            <div className={s.formGroup}>
              <label className={s.label}>MOTIVO DEL MOVIMIENTO</label>
              <select
                className={s.inputField}
                value={nuevoMov.motivo}
                disabled={!puedeCrear || !nuevoMov.tipo}
                style={{
                  backgroundColor: !puedeCrear || !nuevoMov.tipo ? "var(--color-bg-muted)" : "white",
                }}
                onChange={(e) =>
                  setNuevoMov({ ...nuevoMov, motivo: e.target.value })
                }
                required
              >
                <option value="">-- Selecciona el motivo --</option>
                {motivosDisponibles.map((m) => (
                  <option key={m.id} value={m.nombre_motivo}>
                    {m.nombre_motivo}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. ACCIÓN FINAL */}
            <div className={s.formGroup} style={{ marginTop: "12px" }}>
              {puedeCrear && (
                <button
                  type="submit"
                  className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}
                  disabled={loading}
                  style={{
                    height: "45px",
                    fontSize: "14px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {loading ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <div className={s.spinnerSmall}></div> PROCESANDO...
                    </div>
                  ) : (
                    "GUARDAR EN KARDEX"
                  )}
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* --- CARGA DINÁMICA DE SUB-VISTAS --- */}
        {activeSubTab === "stock" && (
          <ExistenciasView 
            s={s}
            loading={loading}
            insumosFiltrados={insumosFiltrados}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}

        {activeSubTab === "contraste" && (
          <AuditoriaView 
            s={s}
            loading={loading}
            contrasteData={contrasteData}
            contrasteDataFiltrado={contrasteDataFiltrado}
            conteos={conteos}
            actualizarConteo={actualizarConteo}
            auditados={auditados}
            filtroAuditoria={filtroAuditoria}
            setFiltroAuditoria={setFiltroAuditoria}
            filtroFechas={filtroFechas}
            setFiltroFechas={setFiltroFechas}
            generarContraste={generarContraste}
            guardarAuditoriaMasiva={guardarAuditoriaMasiva}
            handleGuardarConteo={handleGuardarConteo}
            puedeEditar={puedeEditar}
            usuarioId={usuarioId}
          />
        )}

        {activeSubTab === "movimientos" && (
          <MovimientosView 
            s={s}
            loading={loading}
            movimientos={movimientos}
          />
        )}
      </div>
    </div>
  );
};

export default InventariosTab;

/**
 * COMPONENTE INTERNO: SearchableSelect
 */
const SearchableSelect = ({
  options,
  value,
  onChange,
  disabled,
  placeholder = "Buscar...",
  valueKey = "id",
  labelKey = "nombre",
  formatLabel,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find(
      (opt) => String(opt[valueKey]) === String(value),
    );
    setSearchTerm(selected ? selected[labelKey] : "");
  }, [value, options, valueKey, labelKey]);

  const filteredOptions = options.filter((opt) =>
    String(opt[labelKey] || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        className={s.inputField}
        value={searchTerm}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          backgroundColor: disabled ? "var(--color-bg-muted)" : "white",
        }}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false);
            const selected = options.find(
              (opt) => String(opt[valueKey]) === String(value),
            );
            setSearchTerm(selected ? selected[labelKey] : "");
          }, 200);
        }}
      />
      {isOpen && !disabled && (
        <ul className={s.dropdownList}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => (
              <li
                key={index}
                className={s.dropdownItem}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt[valueKey]);
                  setSearchTerm(opt[labelKey]);
                  setIsOpen(false);
                }}
              >
                {formatLabel ? formatLabel(opt) : opt[labelKey]}
              </li>
            ))
          ) : (
            <li
              className={s.dropdownItem}
              style={{ color: "var(--color-text-muted)" }}
            >
              Sin resultados...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};