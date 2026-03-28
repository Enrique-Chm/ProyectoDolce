// Archivo: src/modules/TabsTabs/GastosTab.jsx
import React, { useState } from "react";
import { useGastos } from "../../../hooks/useGastos";
import s from "../EstilosGenerales.module.css";

export const GastosTab = () => {
  const g = useGastos();
  const [subTab, setSubTab] = useState("gastos");

  // 🛡️ Si no tiene permiso ni de ver, mostramos un mensaje de bloqueo limpio
  if (!g.puedeVerGastos) {
    return (
      <div
        className={s.adminCard}
        style={{
          textAlign: "center",
          padding: "40px",
          color: "var(--color-text-muted)",
        }}
      >
        <h3>Acceso Restringido</h3>
        <p>No tienes los permisos necesarios para ver el módulo financiero.</p>
      </div>
    );
  }

  // 💡 ESTÁNDAR: Controles de visibilidad del Layout Dinámico
  const mostrarFormularioGastos = g.puedeCrearGastos || g.puedeEditarGastos;
  const mostrarFormularioCategorias = g.puedeEditarGastos;

  return (
    <div className={s.tabWrapper}>
      <div className={s.pageHeader}>
        <h2 className={s.pageTitle}>Gastos Operativos</h2>
      </div>

      {/* Navegación de Sub-pestañas Homologada */}
      <nav className={s.tabNav}>
        <button
          className={`${s.tabButton} ${subTab === "gastos" ? s.activeTabButton : ""}`}
          onClick={() => setSubTab("gastos")}
        >
          REGISTRO DE GASTOS
        </button>
        <button
          className={`${s.tabButton} ${subTab === "categorias" ? s.activeTabButton : ""}`}
          onClick={() => setSubTab("categorias")}
        >
          CATEGORÍAS
        </button>
      </nav>

      {/* --- SUBTAB: GASTOS --- */}
      {subTab === "gastos" && (
        <div className={mostrarFormularioGastos ? s.splitLayout : s.fullLayout}>
          
          {/* PANEL LATERAL DE REGISTRO */}
          <aside 
            className={s.adminCard}
            style={{ display: mostrarFormularioGastos ? 'block' : 'none' }}
          >
            <h3 className={s.cardTitle}>
              {g.editGastoId ? "Editar Gasto" : "Registrar Salida"}
            </h3>

            <form
              onSubmit={g.handleSaveGasto}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.label}>FECHA</label>
                  <input
                    type="date"
                    className={s.inputField}
                    value={g.gastoFormData.fecha}
                    onChange={(e) =>
                      g.setGastoFormData({
                        ...g.gastoFormData,
                        fecha: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>MONTO ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={s.inputField}
                    value={g.gastoFormData.monto}
                    onChange={(e) =>
                      g.setGastoFormData({
                        ...g.gastoFormData,
                        monto: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className={s.formGroup}>
                <label className={s.label}>SUCURSAL</label>
                <select
                  className={s.inputField}
                  value={g.gastoFormData.sucursal_id}
                  onChange={(e) =>
                    g.setGastoFormData({
                      ...g.gastoFormData,
                      sucursal_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Seleccionar...</option>
                  {g.sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={s.formGroup}>
                <label className={s.label}>CATEGORÍA</label>
                <select
                  className={s.inputField}
                  value={g.gastoFormData.categoria_id}
                  onChange={(e) =>
                    g.setGastoFormData({
                      ...g.gastoFormData,
                      categoria_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Seleccionar...</option>
                  {g.categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={s.formGroup}>
                <label className={s.label}>CONCEPTO / DESCRIPCIÓN</label>
                <input
                  className={s.inputField}
                  value={g.gastoFormData.descripcion}
                  onChange={(e) =>
                    g.setGastoFormData({
                      ...g.gastoFormData,
                      descripcion: e.target.value,
                    })
                  }
                  placeholder="Ej. Pago de luz CFE"
                  required
                />
              </div>

              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.label}>MÉTODO DE PAGO</label>
                  <select
                    className={s.inputField}
                    value={g.gastoFormData.metodo_pago}
                    onChange={(e) =>
                      g.setGastoFormData({
                        ...g.gastoFormData,
                        metodo_pago: e.target.value,
                      })
                    }
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>FOLIO / REF.</label>
                  <input
                    className={s.inputField}
                    value={g.gastoFormData.referencia_comprobante}
                    onChange={(e) =>
                      g.setGastoFormData({
                        ...g.gastoFormData,
                        referencia_comprobante: e.target.value,
                      })
                    }
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                <button
                  type="submit"
                  className={`${s.btn} ${s.btnPrimary}`}
                  style={{ flex: 1 }}
                >
                  {g.editGastoId ? "ACTUALIZAR" : "GUARDAR GASTO"}
                </button>
                {g.editGastoId && (
                  <button
                    type="button"
                    className={`${s.btn} ${s.btnOutlineDanger}`}
                    onClick={g.resetGastoForm}
                    style={{ flex: 1 }}
                  >
                    CANCELAR
                  </button>
                )}
              </div>
            </form>
          </aside>

          {/* 📊 TABLA DE GASTOS */}
          <div className={`${s.adminCard} ${s.tableContainer}`}>
            {g.loading ? (
              <div className={s.emptyState}>Cargando información...</div>
            ) : (
              <table className={s.table}>
                <thead className={s.thead}>
                  <tr>
                    <th className={s.th}>FECHA</th>
                    <th className={s.th}>CONCEPTO</th>
                    <th className={s.th}>CATEGORÍA</th>
                    <th className={s.th}>MONTO</th>
                    <th className={s.th} style={{ textAlign: "right" }}>
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {g.gastos.length === 0 ? (
                    <tr>
                      <td colSpan="5" className={s.emptyState}>
                        No hay gastos registrados.
                      </td>
                    </tr>
                  ) : (
                    g.gastos.map((item) => (
                      <tr key={item.id}>
                        <td className={s.td} style={{ fontSize: "13px" }}>
                          {item.fecha}
                        </td>
                        <td className={s.td}>
                          <div
                            style={{
                              fontWeight: "600",
                              color: "var(--color-text-main)",
                              fontSize: "14px",
                            }}
                          >
                            {item.descripcion}
                          </div>
                          <small style={{ color: "var(--color-text-muted)" }}>
                            {item.cat_sucursales?.nombre} • {item.metodo_pago}{" "}
                            {item.referencia_comprobante
                              ? `(#${item.referencia_comprobante})`
                              : ""}
                          </small>
                        </td>
                        <td className={s.td}>
                          <span className={s.badge}>
                            {item.categorias_gastos?.nombre || "Sin categoría"}
                          </span>
                        </td>
                        <td
                          className={s.td}
                          style={{
                            fontWeight: "600",
                            color: "var(--color-danger)",
                          }}
                        >
                          ${parseFloat(item.monto).toFixed(2)}
                        </td>
                        <td className={s.td} style={{ textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "5px",
                              justifyContent: "flex-end",
                            }}
                          >
                            {g.puedeEditarGastos && (
                              <button
                                className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`}
                                onClick={() => {
                                  g.setEditGastoId(item.id);
                                  g.setGastoFormData(item);
                                }}
                              >
                                📝
                              </button>
                            )}
                            {g.puedeBorrarGastos && (
                              <button
                                className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`}
                                onClick={() => g.handleDeleteGasto(item.id)}
                              >
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
            )}
          </div>
        </div>
      )}

      {/* --- SUBTAB: CATEGORÍAS --- */}
      {subTab === "categorias" && (
        <div className={mostrarFormularioCategorias ? s.splitLayout : s.fullLayout}>
          
          {/* PANEL LATERAL DE CATEGORÍAS */}
          <aside 
            className={s.adminCard}
            style={{ display: mostrarFormularioCategorias ? 'block' : 'none' }}
          >
            <h3 className={s.cardTitle}>
              {g.editCatId ? "Editar Categoría" : "Nueva Categoría"}
            </h3>
            <form
              onSubmit={g.handleSaveCategoria}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <div className={s.formGroup}>
                <label className={s.label}>NOMBRE</label>
                <input
                  className={s.inputField}
                  placeholder="Ej. Nómina"
                  value={g.catFormData.nombre}
                  onChange={(e) =>
                    g.setCatFormData({
                      ...g.catFormData,
                      nombre: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>DESCRIPCIÓN</label>
                <input
                  className={s.inputField}
                  placeholder="Opcional"
                  value={g.catFormData.descripcion}
                  onChange={(e) =>
                    g.setCatFormData({
                      ...g.catFormData,
                      descripcion: e.target.value,
                    })
                  }
                />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                <button
                  type="submit"
                  className={`${s.btn} ${s.btnPrimary}`}
                  style={{ flex: 1 }}
                >
                  {g.editCatId ? "ACTUALIZAR" : "GUARDAR CATEGORÍA"}
                </button>
                {g.editCatId && (
                  <button
                    type="button"
                    className={`${s.btn} ${s.btnOutlineDanger}`}
                    onClick={g.resetCatForm}
                    style={{ flex: 1 }}
                  >
                    CANCELAR
                  </button>
                )}
              </div>
            </form>
          </aside>

          {/* TABLA DE CATEGORÍAS */}
          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>NOMBRE DE CATEGORÍA</th>
                  <th className={s.th}>DESCRIPCIÓN</th>
                  <th className={s.th} style={{ textAlign: "right" }}>
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {g.categorias.length === 0 ? (
                  <tr>
                    <td colSpan="3" className={s.emptyState}>
                      No hay categorías registradas.
                    </td>
                  </tr>
                ) : (
                  g.categorias.map((c) => (
                    <tr key={c.id}>
                      <td
                        className={s.td}
                        style={{
                          fontWeight: "600",
                          color: "var(--color-text-main)",
                        }}
                      >
                        {c.nombre}
                      </td>
                      <td
                        className={s.td}
                        style={{
                          fontSize: "13px",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {c.descripcion || "-"}
                      </td>
                      <td className={s.td} style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                            justifyContent: "flex-end",
                          }}
                        >
                          {g.puedeEditarGastos && (
                            <button
                              className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`}
                              onClick={() => {
                                g.setEditCatId(c.id);
                                g.setCatFormData(c);
                              }}
                            >
                              📝
                            </button>
                          )}
                          {g.puedeBorrarGastos && (
                            <button
                              className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`}
                              onClick={() => g.handleDeleteCategoria(c.id)}
                            >
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
      )}
    </div>
  );
};