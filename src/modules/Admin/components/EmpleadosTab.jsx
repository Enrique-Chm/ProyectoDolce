// Archivo: src/modules/Admin/components/EmpleadosTab.jsx
import React, { useState, useEffect } from "react";
import { useEmpleados } from "../../../hooks/useEmpleados";
import { MATRIZ_MODULOS, hasPermission } from "../../../utils/checkPermiso";
import s from "../AdminPage.module.css";

export const EmpleadosTab = () => {
  const [subTab, setSubTab] = useState("usuarios");
  const emp = useEmpleados();

  // Función auxiliar para obtener el ID de un permiso basado en su clave
  const getPermisoId = (clave) =>
    emp.permisos.find((p) => p.clave_permiso === clave)?.id;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "800",
          color: "var(--color-text-main)",
          margin: "0",
        }}
      >
        Gestión de Capital Humano
      </h2>

      {/* Navegación de Sub-pestañas con validación de permisos */}
      <nav
        style={{
          display: "flex",
          gap: "10px",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "15px",
          overflowX: "auto",
        }}
      >
        {hasPermission("ver_usuarios") && (
          <button
            className={`${s.navItem} ${subTab === "usuarios" ? s.activeNavItem : ""}`}
            style={{ width: "auto", padding: "8px 20px", whiteSpace: "nowrap" }}
            onClick={() => setSubTab("usuarios")}
          >
            EQUIPO
          </button>
        )}

        {hasPermission("ver_configuracion") && (
          <button
            className={`${s.navItem} ${subTab === "permisos" ? s.activeNavItem : ""}`}
            style={{ width: "auto", padding: "8px 20px", whiteSpace: "nowrap" }}
            onClick={() => setSubTab("permisos")}
          >
            PERMISOS Y ROLES
          </button>
        )}

        {hasPermission("ver_sucursales") && (
          <button
            className={`${s.navItem} ${subTab === "sucursales" ? s.activeNavItem : ""}`}
            style={{ width: "auto", padding: "8px 20px", whiteSpace: "nowrap" }}
            onClick={() => setSubTab("sucursales")}
          >
            SUCURSALES
          </button>
        )}
      </nav>

      {/* --- SUBTAB: EQUIPO --- */}
      {subTab === "usuarios" && hasPermission("ver_usuarios") && (
        <div className="admin-split-layout-sidebar">
          {/* Formulario: Solo visible si tiene permiso de edición */}
          <aside
            className={s.adminCard}
            style={{
              padding: "20px",
              display: hasPermission("editar_usuarios") ? "block" : "none",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "700",
                marginBottom: "20px",
                color: "var(--color-primary)",
              }}
            >
              {emp.editId ? "📝 Editar Perfil" : "👤 Nuevo Integrante"}
            </h3>
            <form
              onSubmit={emp.handleSaveUsuario}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "var(--color-text-muted)",
                    marginBottom: "5px",
                  }}
                >
                  NOMBRE COMPLETO
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--radius-ui)",
                    border: "1px solid var(--color-border)",
                    boxSizing: "border-box",
                  }}
                  value={emp.formData.nombre}
                  onChange={(e) =>
                    emp.setFormData({ ...emp.formData, nombre: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "var(--color-text-muted)",
                    marginBottom: "5px",
                  }}
                >
                  SUCURSAL ASIGNADA
                </label>
                <SearchableSelect
                  options={emp.sucursales}
                  value={emp.formData.sucursal_id}
                  valueKey="id"
                  labelKey="nombre"
                  placeholder="Seleccionar sucursal..."
                  onChange={(val) =>
                    emp.setFormData({ ...emp.formData, sucursal_id: val })
                  }
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "var(--color-text-muted)",
                      marginBottom: "5px",
                    }}
                  >
                    USUARIO
                  </label>
                  <input
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "var(--radius-ui)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                    value={emp.formData.username}
                    onChange={(e) =>
                      emp.setFormData({
                        ...emp.formData,
                        username: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "var(--color-text-muted)",
                      marginBottom: "5px",
                    }}
                  >
                    ROL
                  </label>
                  <SearchableSelect
                    options={emp.roles}
                    value={emp.formData.rol_id}
                    valueKey="id"
                    labelKey="nombre_rol"
                    placeholder="Elegir rol..."
                    onChange={(val) =>
                      emp.setFormData({ ...emp.formData, rol_id: val })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "var(--color-text-muted)",
                      marginBottom: "5px",
                    }}
                  >
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "var(--radius-ui)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                    value={emp.formData.password_hash}
                    onChange={(e) =>
                      emp.setFormData({
                        ...emp.formData,
                        password_hash: e.target.value,
                      })
                    }
                    required={!emp.editId}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "var(--color-text-muted)",
                      marginBottom: "5px",
                    }}
                  >
                    PIN (4 DÍGITOS)
                  </label>
                  <input
                    type="number"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "var(--radius-ui)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                    value={emp.formData.pin_seguridad}
                    onChange={(e) =>
                      emp.setFormData({
                        ...emp.formData,
                        pin_seguridad: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="submit"
                  className={s.btnLogout}
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    border: "none",
                    flex: 1,
                    padding: "12px",
                  }}
                >
                  {emp.editId ? "ACTUALIZAR" : "REGISTRAR"}
                </button>
                {emp.editId && (
                  <button
                    type="button"
                    className={s.btnLogout}
                    onClick={emp.resetUserForm}
                    style={{ padding: "12px" }}
                  >
                    CANCELAR
                  </button>
                )}
              </div>
            </form>
          </aside>

          {/* Listado de Empleados */}
          <div
            className={s.adminCard}
            style={{ padding: "0", overflowX: "auto", flex: 1 }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                minWidth: "600px",
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
                    EMPLEADO / SUCURSAL
                  </th>
                  <th
                    style={{
                      padding: "15px",
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    ROL
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
                {emp.usuarios.map((u) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: "1px solid var(--color-bg-muted)" }}
                  >
                    <td style={{ padding: "15px" }}>
                      <div
                        style={{
                          fontWeight: "800",
                          color: "var(--color-text-main)",
                        }}
                      >
                        {u.nombre}
                      </div>
                      <small
                        style={{
                          color: "var(--color-primary)",
                          fontWeight: "bold",
                        }}
                      >
                        {emp.sucursales.find((suc) => suc.id === u.sucursal_id)
                          ?.nombre || "Sin Sucursal"}
                      </small>
                    </td>
                    <td style={{ padding: "15px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "800",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          backgroundColor: "var(--color-bg-app)",
                          color: "var(--color-primary)",
                        }}
                      >
                        {u.roles?.nombre_rol?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "15px", textAlign: "right" }}>
                      {hasPermission("editar_usuarios") && (
                        <button
                          className={s.btnLogout}
                          onClick={() => {
                            emp.setEditId(u.id);
                            emp.setFormData(u);
                          }}
                        >
                          EDITAR
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB: PERMISOS --- */}
      {subTab === "permisos" && hasPermission("ver_configuracion") && (
        <div className="admin-split-layout-sidebar">
          <aside className={s.adminCard} style={{ padding: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "var(--color-primary)",
                  margin: 0,
                }}
              >
                Roles
              </h3>
              {emp.puedeEditarConfig && (
                <button
                  className={s.btnLogout}
                  style={{ padding: "4px 10px" }}
                  onClick={() => emp.setMostrarFormRol(!emp.mostrarFormRol)}
                >
                  +
                </button>
              )}
            </div>

            {emp.mostrarFormRol && emp.puedeEditarConfig && (
              <form
                onSubmit={emp.handleSaveRol}
                style={{
                  padding: "15px",
                  background: "var(--color-bg-app)",
                  borderRadius: "var(--radius-ui)",
                  marginBottom: "15px",
                }}
              >
                <input
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--radius-ui)",
                    border: "1px solid var(--color-border)",
                    marginBottom: "10px",
                    boxSizing: "border-box",
                  }}
                  placeholder="Nombre Rol"
                  onChange={(e) =>
                    emp.setRolFormData({ nombre_rol: e.target.value })
                  }
                  required
                />
                <button
                  type="submit"
                  className={s.btnLogout}
                  style={{
                    width: "100%",
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    border: "none",
                  }}
                >
                  GUARDAR ROL
                </button>
              </form>
            )}

            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              {emp.roles.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: "12px 15px",
                    borderRadius: "var(--radius-ui)",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "0.9rem",
                    transition: "all 0.2s",
                    backgroundColor:
                      emp.rolSeleccionado === r.id
                        ? "var(--color-primary)"
                        : "transparent",
                    color:
                      emp.rolSeleccionado === r.id
                        ? "white"
                        : "var(--color-text-muted)",
                  }}
                  onClick={() => emp.seleccionarRol(r.id)}
                >
                  {r.nombre_rol.toUpperCase()}
                </div>
              ))}
            </div>
          </aside>

          <div
            className={s.adminCard}
            style={{ padding: "0", overflowX: "auto", flex: 1 }}
          >
            {/* 🛠️ MEJORA: Cabecera con botón de Guardar Cambios */}
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>
                Matriz de Facultades
              </h3>

              {emp.rolSeleccionado && emp.puedeEditarConfig && (
                <button
                  onClick={emp.guardarMatrizPermisos}
                  disabled={emp.loading}
                  style={{
                    backgroundColor: emp.loading
                      ? "var(--color-bg-muted)"
                      : "#10b981", // Verde éxito
                    color: emp.loading ? "var(--color-text-muted)" : "white",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-ui)",
                    fontWeight: "bold",
                    border: "none",
                    cursor: emp.loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {emp.loading ? "GUARDANDO..." : "💾 GUARDAR CAMBIOS"}
                </button>
              )}
            </div>

            {!emp.rolSeleccionado ? (
              <p
                style={{
                  textAlign: "center",
                  padding: "60px",
                  color: "var(--color-text-muted)",
                }}
              >
                Selecciona un rol de la izquierda para configurar sus accesos...
              </p>
            ) : (
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
                    <th style={{ padding: "15px", fontSize: "12px" }}>
                      MÓDULO DEL SISTEMA
                    </th>
                    <th
                      style={{
                        padding: "15px",
                        fontSize: "12px",
                        textAlign: "center",
                        color: "#3b82f6",
                      }}
                    >
                      👁️ VER
                    </th>
                    <th
                      style={{
                        padding: "15px",
                        fontSize: "12px",
                        textAlign: "center",
                        color: "#10b981",
                      }}
                    >
                      ➕ CREAR
                    </th>
                    <th
                      style={{
                        padding: "15px",
                        fontSize: "12px",
                        textAlign: "center",
                        color: "#f59e0b",
                      }}
                    >
                      ✏️ EDITAR
                    </th>
                    <th
                      style={{
                        padding: "15px",
                        fontSize: "12px",
                        textAlign: "center",
                        color: "#ef4444",
                      }}
                    >
                      🗑️ BORRAR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MATRIZ_MODULOS.map((m) => {
                    // Calculamos dinámicamente las claves usando el slug base (ej. 'ventas' o 'insumos')
                    // Si el slug original era 'ver_ventas', sacamos la palabra 'ventas'
                    const baseSlug = m.slug.replace("ver_", "");

                    const idVer = getPermisoId(`ver_${baseSlug}`);
                    const idCrear = getPermisoId(`crear_${baseSlug}`);
                    const idEditar = getPermisoId(`editar_${baseSlug}`);
                    const idBorrar = getPermisoId(`borrar_${baseSlug}`);

                    return (
                      <tr
                        key={m.slug}
                        style={{
                          borderBottom: "1px solid var(--color-bg-muted)",
                        }}
                      >
                        <td style={{ padding: "15px", fontWeight: "700" }}>
                          {m.label}
                        </td>

                        {/* COLUMNA VER */}
                        <td style={{ padding: "15px", textAlign: "center" }}>
                          {idVer ? (
                            <input
                              type="checkbox"
                              disabled={!emp.puedeEditarConfig}
                              checked={emp.permisosActivos.includes(idVer)}
                              onChange={() => emp.togglePermiso(idVer)}
                              style={{
                                cursor: emp.puedeEditarConfig
                                  ? "pointer"
                                  : "not-allowed",
                                width: "18px",
                                height: "18px",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              N/A
                            </span>
                          )}
                        </td>

                        {/* COLUMNA CREAR */}
                        <td style={{ padding: "15px", textAlign: "center" }}>
                          {idCrear ? (
                            <input
                              type="checkbox"
                              disabled={!emp.puedeEditarConfig}
                              checked={emp.permisosActivos.includes(idCrear)}
                              onChange={() => emp.togglePermiso(idCrear)}
                              style={{
                                cursor: emp.puedeEditarConfig
                                  ? "pointer"
                                  : "not-allowed",
                                width: "18px",
                                height: "18px",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              N/A
                            </span>
                          )}
                        </td>

                        {/* COLUMNA EDITAR */}
                        <td style={{ padding: "15px", textAlign: "center" }}>
                          {idEditar ? (
                            <input
                              type="checkbox"
                              disabled={!emp.puedeEditarConfig}
                              checked={emp.permisosActivos.includes(idEditar)}
                              onChange={() => emp.togglePermiso(idEditar)}
                              style={{
                                cursor: emp.puedeEditarConfig
                                  ? "pointer"
                                  : "not-allowed",
                                width: "18px",
                                height: "18px",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              N/A
                            </span>
                          )}
                        </td>

                        {/* COLUMNA BORRAR */}
                        <td style={{ padding: "15px", textAlign: "center" }}>
                          {idBorrar ? (
                            <input
                              type="checkbox"
                              disabled={!emp.puedeEditarConfig}
                              checked={emp.permisosActivos.includes(idBorrar)}
                              onChange={() => emp.togglePermiso(idBorrar)}
                              style={{
                                cursor: emp.puedeEditarConfig
                                  ? "pointer"
                                  : "not-allowed",
                                width: "18px",
                                height: "18px",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              N/A
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* --- SUBTAB: SUCURSALES --- */}
      {subTab === "sucursales" && hasPermission("ver_sucursales") && (
        <div className="admin-split-layout-sidebar">
          <aside
            className={s.adminCard}
            style={{
              padding: "20px",
              display: hasPermission("editar_sucursales") ? "block" : "none",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: "700",
                marginBottom: "20px",
                color: "var(--color-primary)",
              }}
            >
              {emp.editSucursalId ? "📝 Editar Sucursal" : "🏢 Nueva Sucursal"}
            </h3>
            <form
              onSubmit={emp.handleSaveSucursal}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "var(--color-text-muted)",
                    marginBottom: "5px",
                  }}
                >
                  NOMBRE
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--radius-ui)",
                    border: "1px solid var(--color-border)",
                    boxSizing: "border-box",
                  }}
                  value={emp.sucursalFormData.nombre}
                  onChange={(e) =>
                    emp.setSucursalFormData({
                      ...emp.sucursalFormData,
                      nombre: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "var(--color-text-muted)",
                    marginBottom: "5px",
                  }}
                >
                  DIRECCIÓN
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "var(--radius-ui)",
                    border: "1px solid var(--color-border)",
                    boxSizing: "border-box",
                  }}
                  value={emp.sucursalFormData.direccion}
                  onChange={(e) =>
                    emp.setSucursalFormData({
                      ...emp.sucursalFormData,
                      direccion: e.target.value,
                    })
                  }
                />
              </div>
              <button
                type="submit"
                className={s.btnLogout}
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "white",
                  border: "none",
                  width: "100%",
                  marginTop: "10px",
                  padding: "12px",
                }}
              >
                GUARDAR SUCURSAL
              </button>
            </form>
          </aside>

          <div
            className={s.adminCard}
            style={{ padding: "0", overflowX: "auto", flex: 1 }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                minWidth: "500px",
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
                    NOMBRE
                  </th>
                  <th
                    style={{
                      padding: "15px",
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    DIRECCIÓN
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
                {emp.sucursales.map((suc) => (
                  <tr
                    key={suc.id}
                    style={{ borderBottom: "1px solid var(--color-bg-muted)" }}
                  >
                    <td style={{ padding: "15px" }}>
                      <strong>{suc.nombre}</strong>
                    </td>
                    <td style={{ padding: "15px" }}>
                      {suc.direccion || "N/A"}
                    </td>
                    <td style={{ padding: "15px", textAlign: "right" }}>
                      {hasPermission("editar_sucursales") && (
                        <button
                          className={s.btnLogout}
                          onClick={() => {
                            emp.setEditSucursalId(suc.id);
                            emp.setSucursalFormData(suc);
                          }}
                        >
                          EDITAR
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * SUB-COMPONENTE MEJORADO: SearchableSelect
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
    if (selected) {
      setSearchTerm(selected[labelKey]);
    } else {
      setSearchTerm("");
    }
  }, [value, options, valueKey, labelKey]);

  const filteredOptions = options.filter((opt) =>
    String(opt[labelKey]).toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={searchTerm}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "var(--radius-ui)",
          border: "1px solid var(--color-border)",
          fontSize: "14px",
          boxSizing: "border-box",
          backgroundColor: disabled ? "var(--color-bg-app)" : "white",
        }}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          if (value) onChange("");
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false);
            const selected = options.find(
              (opt) => String(opt[valueKey]) === String(value),
            );
            if (selected) setSearchTerm(selected[labelKey]);
            else setSearchTerm("");
          }, 200);
        }}
      />

      {isOpen && !disabled && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: "200px",
            overflowY: "auto",
            background: "white",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-ui)",
            zIndex: 1000,
            margin: "4px 0 0 0",
            padding: 0,
            listStyle: "none",
            boxShadow: "var(--shadow-ui)",
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => (
              <li
                key={index}
                style={{
                  padding: "10px 15px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--color-bg-muted)",
                  fontSize: "13px",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt[valueKey]);
                  setSearchTerm(opt[labelKey]);
                  setIsOpen(false);
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "var(--color-bg-app)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                {formatLabel ? formatLabel(opt) : opt[labelKey]}
              </li>
            ))
          ) : (
            <li
              style={{
                padding: "10px 15px",
                color: "var(--color-text-muted)",
                fontSize: "13px",
              }}
            >
              No se encontraron coincidencias...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
