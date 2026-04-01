// Archivo: src/modules/Admin/Tabs/InventariosTab.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useInventarios } from "../../../hooks/useInventariosTab";
import s from "../../../assets/styles/EstilosGenerales.module.css";

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
    guardarAuditoriaMasiva, // 👈 Se extrae la nueva función
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

      {/* Navegación - Ya utiliza s.tabNav que tiene overflow nativo */}
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
                      motivo: "", // Reiniciamos motivo al cambiar tipo de operación
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

        {/* 1. TABLA: EXISTENCIAS ACTUALES */}
        {activeSubTab === "stock" && (
          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <div className={s.tableHeader}>
              <input
                type="text"
                className={s.inputField}
                placeholder="Buscar por nombre o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>INSUMO / CATEGORÍA</th>
                  <th className={s.th}>STOCK FÍSICO</th>
                  <th className={s.th}>ESTIMADO HOY</th>
                </tr>
              </thead>
              <tbody>
                {insumosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="3" className={s.emptyState}>
                      {loading
                        ? "Cargando inventario..."
                        : insumos?.length === 0
                          ? "No hay insumos registrados en el inventario."
                          : "No se encontraron resultados para su búsqueda."}
                    </td>
                  </tr>
                ) : (
                  insumosFiltrados.map((insumo) => (
                    <tr key={insumo.id}>
                      <td className={s.td}>
                        <div className={s.productTitle}>{insumo.nombre}</div>
                        <small className={s.textMuted}>
                          {insumo.categoria?.toUpperCase() || 'SIN CATEGORÍA'}
                        </small>
                      </td>
                      <td className={s.td}>
                        <div
                          className={s.priceValue}
                          style={{ color: "var(--color-text-main)" }}
                        >
                          {insumo.stock_fisico}{" "}
                          <small
                            className={s.textMuted}
                            style={{ fontSize: "11px" }}
                          >
                            {insumo.unidad || 'U'}
                          </small>
                        </div>
                      </td>
                      <td className={s.td}>
                        <div
                          className={s.priceValue}
                          style={{ color: "var(--color-primary)" }}
                        >
                          {insumo.stock_estimado}{" "}
                          <small
                            className={s.textMuted}
                            style={{ fontSize: "11px" }}
                          >
                            {insumo.unidad || 'U'}
                          </small>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. TABLA: AUDITORÍA DE CIERRE (CONTRASTE) */}
        {activeSubTab === "contraste" && (
          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <div className={s.auditHeader}>
              <div>
                <h3 className={s.cardTitle} style={{ margin: 0 }}>
                  Auditoría y Cierre
                </h3>
                {contrasteData.length > 0 && (
                  <div
                    style={{
                      fontSize: "13px",
                      marginTop: "5px",
                      fontWeight: "700",
                    }}
                    className={
                      auditados.length === contrasteData.length
                        ? s.textSuccess
                        : s.textPrimary
                    }
                  >
                    Progreso: {auditados.length} de {contrasteData.length}
                  </div>
                )}
              </div>

              {/* 💡 NUEVO BLOQUE CONTENEDOR DE FILTROS Y BOTÓN MASIVO */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                {Object.values(conteos).filter(v => v !== '').length > 0 && (
                  <button
                    className={`${s.btn} ${s.btnSuccess}`}
                    style={{ padding: '8px 20px', fontWeight: 'bold', boxShadow: 'var(--shadow-md)' }}
                    onClick={() => guardarAuditoriaMasiva(usuarioId, filtroFechas.inicio, filtroFechas.fin)}
                    disabled={loading}
                  >
                    ✅ PROCESAR {Object.values(conteos).filter(v => v !== '').length} CONTEOS
                  </button>
                )}

                <div className={s.auditFilters}>
                  <select
                    className={s.inputSmall}
                    value={filtroAuditoria}
                    onChange={(e) => setFiltroAuditoria(e.target.value)}
                  >
                    <option value="todos"> Todos</option>
                    <option value="pendientes"> Pendientes</option>
                    <option value="auditados"> Auditados</option>
                  </select>
                  <input
                    type="date"
                    className={s.inputSmall}
                    value={filtroFechas.inicio}
                    onChange={(e) =>
                      setFiltroFechas({ ...filtroFechas, inicio: e.target.value })
                    }
                  />
                  <input
                    type="date"
                    className={s.inputSmall}
                    value={filtroFechas.fin}
                    onChange={(e) =>
                      setFiltroFechas({ ...filtroFechas, fin: e.target.value })
                    }
                  />
                  <button
                    className={`${s.btn} ${s.btnDark}`}
                    onClick={() =>
                      generarContraste(filtroFechas.inicio, filtroFechas.fin)
                    }
                    disabled={loading}
                  >
                    {loading ? "..." : "BALANCE"}
                  </button>
                </div>
              </div>
            </div>

            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>INSUMO ESPERADO</th>
                  <th className={s.th}>VENTAS (-)</th>
                  <th
                    className={s.th}
                    style={{ backgroundColor: "var(--color-bg-muted)" }}
                  >
                    FÍSICO REAL
                  </th>
                  <th className={s.th}>DIFERENCIA</th>
                  <th className={s.th} style={{ textAlign: "right" }}>
                    ACCIÓN
                  </th>
                </tr>
              </thead>
              <tbody>
                {contrasteDataFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={s.emptyState}>
                      {loading
                        ? "Generando balance..."
                        : "Genera un balance para comenzar la auditoría."}
                    </td>
                  </tr>
                ) : (
                  contrasteDataFiltrado.map((row) => {
                    const inputVal = conteos[row.id];
                    const tieneConteo =
                      inputVal !== undefined && inputVal !== "";
                    const diferenciaReal = tieneConteo
                      ? (
                          parseFloat(inputVal) - parseFloat(row.stock_esperado)
                        ).toFixed(2)
                      : "-";
                    const yaAuditado = auditados.includes(row.id);

                    let difColorClass = "";
                    if (tieneConteo) {
                      if (parseFloat(diferenciaReal) < 0)
                        difColorClass = s.textDanger;
                      else if (parseFloat(diferenciaReal) > 0)
                        difColorClass = s.textSuccess;
                    }

                    return (
                      <tr
                        key={row.id}
                        className={yaAuditado ? s.rowAudited : ""}
                      >
                        <td className={s.td}>
                          <div className={s.productTitle}>{row.insumo}</div>{" "}
                          <div>
                            {" "}
                            {row.stock_esperado} {row.unidad || 'U'}
                          </div>
                        </td>
                        <td
                          className={`${s.td} ${s.textDanger}`}
                          style={{ fontWeight: "700" }}
                        >
                          {row.vendido !== "0.00" ? `-${row.vendido}` : "0.00"}
                        </td>
                        <td
                          className={s.td}
                          style={{
                            backgroundColor: yaAuditado
                              ? undefined
                              : "var(--color-bg-muted)",
                          }}
                        >
                          <input
                            type="number"
                            className={s.tableInputCenter}
                            placeholder="0.00"
                            value={conteos[row.id] || ""}
                            readOnly={!puedeEditar || yaAuditado}
                            onChange={(e) =>
                              actualizarConteo(row.id, e.target.value)
                            }
                          />
                        </td>
                        <td
                          className={`${s.td} ${difColorClass}`}
                          style={{ fontWeight: "900" }}
                        >
                          {tieneConteo
                            ? parseFloat(diferenciaReal) > 0
                              ? `+${diferenciaReal}`
                              : diferenciaReal
                            : "-"}
                        </td>
                        <td className={s.td} style={{ textAlign: "right" }}>
                          <button
                            className={
                              yaAuditado
                                ? `${s.btn} ${s.btnSuccess} ${s.btnSmall}`
                                : `${s.btn} ${s.btnPrimary} ${s.btnSmall}`
                            }
                            onClick={() => handleGuardarConteo(row)}
                            disabled={loading || !tieneConteo || yaAuditado}
                          >
                            {yaAuditado ? "OK" : "GUARDAR"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. TABLA: HISTORIAL DE MOVIMIENTOS */}
        {activeSubTab === "movimientos" && (
          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <div className={s.tableHeader}>
              <h3 className={s.cardTitle} style={{ margin: 0 }}>
                Historial de Movimientos
              </h3>
            </div>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>FECHA</th>
                  <th className={s.th}>INSUMO</th>
                  <th className={s.th}>OPERACIÓN</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan="3" className={s.emptyState}>
                      {loading
                        ? "Cargando historial..."
                        : "No hay registros de movimientos."}
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => (
                    <tr key={m.id}>
                      <td className={s.td}>
                        <div style={{ fontWeight: "700" }}>
                          {new Date(m.created_at).toLocaleDateString()}
                        </div>
                        <small className={s.textMuted}>
                          {new Date(m.created_at).toLocaleTimeString()}
                        </small>
                      </td>
                      <td className={s.td}>
                        <div className={s.productTitle}>{m.insumo?.nombre}</div>
                        <small className={s.textMuted}>{m.motivo}</small>
                      </td>
                      <td className={s.td}>
                        <div
                          className={s.priceValue}
                          style={{
                            color:
                              m.tipo === "ENTRADA"
                                ? "var(--color-success)"
                                : "var(--color-danger)",
                          }}
                        >
                          {m.tipo === "ENTRADA" ? "+" : "-"}
                          {m.cantidad_afectada}
                        </div>
                        <small className={s.textMuted}>{m.tipo}</small>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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