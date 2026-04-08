// Archivo: src/modules/Admin/Tabs/Proyeccion/EstrategiaView.jsx
import React, { useState } from "react";
import { formatCurrency } from "../../../../utils/formatCurrency";

export const EstrategiaView = ({ estimates, s }) => {
  const {
    sugerenciasFiltradas,
    proveedores,
    proyeccionProductos,
    presupuestoTotal,
    guardarPolitica,
    puedeEditarInventario,
    setFiltroProveedor,
    diaProyectado,
  } = estimates;

  // --- ESTADOS LOCALES ---
  const [viewMode, setViewMode] = useState("insumo");
  const [filtroBuscar, setFiltroBuscar] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const [tempPolitica, setTempPolitica] = useState({
    metodo: "dinamico",
    cobertura: 7,
    seguridad: 2,
    minimo: 0,
    maximo: 0,
  });

  // --- LÓGICA DE ACCIONES ---
  const iniciarEdicion = (item) => {
    setEditandoId(item.insumo_id);
    setTempPolitica({
      metodo: item.metodo_compra || "dinamico",
      cobertura: item.dias_cobertura_objetivo || 0,
      seguridad: item.dias_stock_seguridad || 0,
      minimo: item.stock_minimo || 0,
      maximo: item.stock_maximo || 0,
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  const handleSave = async (id) => {
    const res = await guardarPolitica(id, tempPolitica);
    if (res.success) {
      setEditandoId(null);
    }
  };

  // --- FILTRADO DE DATOS ---
  const dataFiltrada = (
    viewMode === "insumo" ? sugerenciasFiltradas : proyeccionProductos
  ).filter((i) => {
    const termino = filtroBuscar.toLowerCase();
    const nombreInsumo = (i.insumo_nombre || "").toLowerCase();
    const modeloInsumo = (i.modelo || "").toLowerCase();
    const nombreProducto = (i.nombre || "").toLowerCase();

    const textoBusqueda =
      viewMode === "insumo"
        ? `${nombreInsumo} ${modeloInsumo}`
        : nombreProducto;
    return !filtroBuscar || textoBusqueda.includes(termino);
  });

  // --- RENDERIZADO DE TABLAS ---
  const renderCabecera = () => {
    if (viewMode === "insumo") {
      return (
        <tr>
          <th className={s.th}>INSUMO</th>
          <th className={s.th}>STOCK ACTUAL</th>
          <th className={s.th}>REQUERIDO</th>
          <th className={s.th}>A COMPRAR</th>
          <th className={s.th}>PROYECCION</th>
          <th className={s.th} style={{ width: "100px", textAlign: "center" }}>
            ACCIÓN
          </th>
        </tr>
      );
    }
    return (
      <tr>
        <th className={s.th}>PLATILLO</th>
        <th className={s.th} style={{ textAlign: "center" }}>
          PROMEDIO ({diaProyectado.toUpperCase()})
        </th>
        <th className={s.th} style={{ textAlign: "right" }}>
          PRÓXIMA VENTA
        </th>
      </tr>
    );
  };

  const renderFilasInsumos = () => {
    return dataFiltrada.map((item) => {
      const isEditing = editandoId === item.insumo_id;

      return (
        <tr key={item.insumo_id}>
          <td className={s.td}>
            <div className={s.productTitle}>{item.insumo_nombre}</div>
            <div className={s.textMuted} style={{ fontSize: "11px" }}>
              {item.modelo || "Sin modelo"} | {item.proveedor_nombre}
            </div>
          </td>
          <td className={s.textMuted} >
            <span
              style={{
                color:
                  parseFloat(item.stock_fisico_hoy) <
                  parseFloat(item.consumo_diario_real)
                    ? "var(--color-danger)"
                    : "inherit",
              }}
            >
              {parseFloat(item.stock_fisico_hoy).toFixed(2)}
            </span>
            <small className={s.textMuted}> {item.unidad_medida}</small>
          </td>
          <td className={s.td}>
            <span style={{ fontWeight: "600", color: "var(--color-primary)" }}>
              {item.consumo_diario_real} {item.unidad_medida}
            </span>
            <div className={s.textMuted} style={{ fontSize: "10px" }}>
              Para {diaProyectado}
            </div>
          </td>

          <td className={s.td}>
            <div
              className={s.productTitle}
              style={{
                color:
                  item.cantidad_sugerida > 0 ? "var(--color-success)" : "#888",
              }}
            >
              {item.cantidad_sugerida > 0 ? `+${item.cantidad_sugerida}` : "0"}{" "}
              <small>{item.unidad_medida}</small>
            </div>
            {item.cajas_a_pedir > 0 && (
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "var(--color-success)",
                }}
              >
                Pedir {item.cajas_a_pedir} caja(s)
              </div>
            )}
          </td>
          <td className={s.td}>
            {isEditing ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <select
                  className={s.inputField}
                  style={{ padding: "4px", fontSize: "12px" }}
                  value={tempPolitica.metodo}
                  onChange={(e) =>
                    setTempPolitica({ ...tempPolitica, metodo: e.target.value })
                  }
                >
                  <option value="dinamico">Basado en Ventas (JIT)</option>
                  <option value="estatico">Manual Fijo (Cantidades)</option>
                </select>

                {tempPolitica.metodo === "dinamico" ? (
                  <div style={{ display: "flex", gap: "4px" }}>
                    <input
                      type="number"
                      title="Días Cobertura"
                      placeholder="Cob."
                      className={s.inputField}
                      style={{ width: "55px", padding: "4px" }}
                      value={tempPolitica.cobertura}
                      onChange={(e) =>
                        setTempPolitica({
                          ...tempPolitica,
                          cobertura: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      title="Días Seguridad"
                      placeholder="Seg."
                      className={s.inputField}
                      style={{ width: "55px", padding: "4px" }}
                      value={tempPolitica.seguridad}
                      onChange={(e) =>
                        setTempPolitica({
                          ...tempPolitica,
                          seguridad: e.target.value,
                        })
                      }
                    />
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "4px" }}>
                    <input
                      type="number"
                      title="Mínimo"
                      placeholder="Mín."
                      className={s.inputField}
                      style={{ width: "55px", padding: "4px" }}
                      value={tempPolitica.minimo}
                      onChange={(e) =>
                        setTempPolitica({
                          ...tempPolitica,
                          minimo: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      title="Máximo"
                      placeholder="Máx."
                      className={s.inputField}
                      style={{ width: "55px", padding: "4px" }}
                      value={tempPolitica.maximo}
                      onChange={(e) =>
                        setTempPolitica({
                          ...tempPolitica,
                          maximo: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <span
                  className={s.badge}
                  style={{
                    marginBottom: "4px",
                    display: "inline-block",
                    fontSize: "10px",
                    backgroundColor: "#e3f2fd",
                    color: "#1976d2",
                  }}
                >
                  {item.metodo_compra === "estatico"
                    ? "STOCK FIJO"
                    : "DEMANDA JIT"}
                </span>
                <div style={{ fontSize: "11px", fontWeight: "600" }}>
                  {item.metodo_compra === "estatico"
                    ? `Mín: ${item.stock_minimo} | Máx: ${item.stock_maximo}`
                    : `Pedidos de ${diaProyectado}`}
                </div>
              </div>
            )}
          </td>

          <td className={s.td} style={{ textAlign: "center" }}>
            {puedeEditarInventario &&
              (isEditing ? (
                <div
                  style={{
                    display: "flex",
                    gap: "5px",
                    justifyContent: "center",
                  }}
                >
                  <button
                    className={`${s.btn} ${s.btnSuccess} ${s.btnSmall}`}
                    onClick={() => handleSave(item.insumo_id)}
                  >
                    💾
                  </button>
                  <button
                    className={`${s.btn} ${s.btnDanger} ${s.btnSmall}`}
                    onClick={cancelarEdicion}
                  >
                    ❌
                  </button>
                </div>
              ) : (
                <button
                  className={`${s.btn} ${s.btnEditar} ${s.btnSmall}`}
                  onClick={() => iniciarEdicion(item)}
                >
                  📝
                </button>
              ))}
          </td>
        </tr>
      );
    });
  };

  const renderFilasProductos = () => {
    return dataFiltrada.map((item, i) => (
      <tr key={i}>
        <td className={s.td} style={{ fontWeight: "700" }}>
          {item.nombre}
        </td>
        <td className={s.td} style={{ textAlign: "center" }}>
          {item.promedio_diario} unidades
        </td>
        <td className={s.td} style={{ textAlign: "right" }}>
          <span className={s.badgeSuccess} style={{ fontSize: "13px" }}>
            {item.prediccion_manana} proyectados
          </span>
        </td>
      </tr>
    ));
  };

  // --- RENDER PRINCIPAL ---
  return (
    <>
      <section
        className={s.pageHeader}
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
            Estrategia de Abastecimiento
          </h2>
          <p className={s.textMuted} style={{ fontSize: "12px" }}>
            Cálculo automático basado en la demanda de mañana y tus recetas.
          </p>
        </div>
        <div
          className={s.adminCard}
          style={{
            padding: "10px 20px",
            borderLeft: "4px solid var(--color-primary)",
            margin: 0,
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "#888",
              display: "block",
            }}
          >
            INVERSIÓN ESTIMADA PARA MAÑANA
          </span>
          <span
            style={{
              color: "var(--color-primary)",
              fontSize: "1.4rem",
              fontWeight: "900",
            }}
          >
            {formatCurrency(presupuestoTotal)}
          </span>
        </div>
      </section>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button
          className={`${s.btn} ${viewMode === "insumo" ? s.btnPrimary : s.btnDark}`}
          onClick={() => {
            setViewMode("insumo");
            setFiltroBuscar("");
            setEditandoId(null);
          }}
          style={{ flex: 1, padding: "14px", fontWeight: "700" }}
        >
          ESTRATEGIA POR INSUMO
        </button>
        <button
          className={`${s.btn} ${viewMode === "producto" ? s.btnPrimary : s.btnDark}`}
          onClick={() => {
            setViewMode("producto");
            setFiltroBuscar("");
            setEditandoId(null);
          }}
          style={{ flex: 1, padding: "14px", fontWeight: "700" }}
        >
          DEMANDA POR PLATILLO
        </button>
      </div>

      <div className={`${s.adminCard} ${s.tableContainer}`}>
        <div
          style={{
            padding: "16px",
            display: "flex",
            gap: "12px",
            background: "#fcfcfc",
            borderBottom: "1px solid #eee",
          }}
        >
          <input
            type="text"
            className={s.inputField}
            placeholder={`Buscar ${viewMode === "insumo" ? "insumo o modelo" : "platillo"}...`}
            value={filtroBuscar}
            onChange={(e) => setFiltroBuscar(e.target.value)}
            style={{ flex: 2 }}
          />
          {viewMode === "insumo" && (
            <select
              className={s.inputField}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="todos">Filtrar por Proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.nombre_empresa}>
                  {p.nombre_empresa}
                </option>
              ))}
            </select>
          )}
        </div>

        <table className={s.table}>
          <thead className={s.thead}>{renderCabecera()}</thead>
          <tbody>
            {dataFiltrada.length > 0 ? (
              viewMode === "insumo" ? (
                renderFilasInsumos()
              ) : (
                renderFilasProductos()
              )
            ) : (
              <tr>
                <td
                  colSpan={viewMode === "insumo" ? "6" : "3"}
                  className={s.td}
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#888",
                  }}
                >
                  No hay datos disponibles para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
