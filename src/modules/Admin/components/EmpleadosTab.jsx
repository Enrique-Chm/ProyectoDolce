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
    <div className={s.tabWrapper}>
      <div className={s.pageHeader}>
        <h2 className={s.pageTitle}>Gestión de Capital Humano</h2>
      </div>
      {/* Navegación de Sub-pestañas con validación de permisos */}
      <nav className={s.tabNav}>
        {hasPermission("ver_usuarios") && (
          <button
            className={`${s.tabButton} ${subTab === "usuarios" ? s.activeTabButton : ""}`}
            onClick={() => setSubTab("usuarios")}
          >
            EQUIPO
          </button>
        )}

        {hasPermission("ver_configuracion") && (
          <button
            className={`${s.tabButton} ${subTab === "permisos" ? s.activeTabButton : ""}`}
            onClick={() => setSubTab("permisos")}
          >
            PERMISOS Y ROLES
          </button>
        )}

        {hasPermission("ver_sucursales") && (
          <button
            className={`${s.tabButton} ${subTab === "sucursales" ? s.activeTabButton : ""}`}
            onClick={() => setSubTab("sucursales")}
          >
            SUCURSALES
          </button>
        )}
      </nav>
      {/* --- SUBTAB: EQUIPO --- */}
      {subTab === "usuarios" && hasPermission("ver_usuarios") && (
        <div className={s.splitLayout}>
          {/* Formulario: Visible si puede crear, o si puede editar y hay un ID */}
          <aside className={s.adminCard} style={{ display: emp.puedeCrearUsuarios || emp.editId ? 'block' : 'none' }}>
            <h3 className={s.cardTitle}>
              {emp.editId ? (emp.puedeEditarUsuarios ? "Editar Perfil" : "Ver Perfil") : " Nuevo Integrante"}
            </h3>
            <form onSubmit={emp.handleSaveUsuario} className={s.loginForm}>
              <div className={s.formGroup}>
                <label className={s.label}>NOMBRE COMPLETO</label>
                <input
                  className={s.inputField}
                  value={emp.formData.nombre}
                  onChange={(e) =>
                    emp.setFormData({
                      ...emp.formData,
                      nombre: e.target.value,
                    })
                  }
                  required
                  readOnly={emp.editId ? !emp.puedeEditarUsuarios : !emp.puedeCrearUsuarios}
                />
              </div>

              <div className={s.formGroup}>
                <label className={s.label}>SUCURSAL ASIGNADA</label>
                <SearchableSelect
                  options={emp.sucursales}
                  value={emp.formData.sucursal_id}
                  valueKey="id"
                  labelKey="nombre"
                  placeholder="Seleccionar sucursal..."
                  onChange={(val) =>
                    emp.setFormData({ ...emp.formData, sucursal_id: val })
                  }
                  disabled={emp.editId ? !emp.puedeEditarUsuarios : !emp.puedeCrearUsuarios}
                />
              </div>

              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.label}>USUARIO</label>
                  <input
                    className={s.inputField}
                    value={emp.formData.username}
                    onChange={(e) =>
                      emp.setFormData({
                        ...emp.formData,
                        username: e.target.value,
                      })
                    }
                    required
                    readOnly={emp.editId ? !emp.puedeEditarUsuarios : !emp.puedeCrearUsuarios}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>ROL</label>
                  <SearchableSelect
                    options={emp.roles}
                    value={emp.formData.rol_id}
                    valueKey="id"
                    labelKey="nombre_rol"
                    placeholder="Elegir rol..."
                    onChange={(val) =>
                      emp.setFormData({ ...emp.formData, rol_id: val })
                    }
                    disabled={emp.editId ? !emp.puedeEditarUsuarios : !emp.puedeCrearUsuarios}
                  />
                </div>
              </div>

              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.label}>PASSWORD</label>
                  <input
                    type="password"
                    className={s.inputField}
                    value={emp.formData.password_hash}
                    onChange={(e) =>
                      emp.setFormData({
                        ...emp.formData,
                        password_hash: e.target.value,
                      })
                    }
                    required={!emp.editId}
                    readOnly={emp.editId ? !emp.puedeEditarUsuarios : !emp.puedeCrearUsuarios}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>PIN (4 DÍGITOS)</label>
                  <input
                    type="number"
                    className={s.inputField}
                    value={emp.formData.pin_seguridad}
                    onChange={(e) =>
                      emp.setFormData({
                        ...emp.formData,
                        pin_seguridad: e.target.value,
                      })
                    }
                    readOnly={emp.editId ? !emp.puedeEditarUsuarios : !emp.puedeCrearUsuarios}
                  />
                </div>
              </div>

              <div
                style={{ display: "flex", gap: "10px", marginTop: "10px" }}
              >
                {(emp.editId ? emp.puedeEditarUsuarios : emp.puedeCrearUsuarios) && (
                  <button
                    type="submit"
                    className={`${s.btn} ${s.btnPrimary}`}
                    style={{ flex: 1 }}
                  >
                    {emp.editId ? "ACTUALIZAR" : "REGISTRAR"}
                  </button>
                )}
                {emp.editId && (
                  <button
                    type="button"
                    className={`${s.btn} ${s.btnDark}`}
                    onClick={emp.resetUserForm}
                  >
                    {emp.puedeEditarUsuarios ? "CANCELAR" : "CERRAR"}
                  </button>
                )}
              </div>
            </form>
          </aside>

          {/* Listado de Empleados */}
          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>EMPLEADO / SUCURSAL</th>
                  <th className={s.th}>ROL</th>
                  <th className={s.th} style={{ textAlign: "right" }}>
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {emp.usuarios.map((u) => (
                  <tr key={u.id}>
                    <td className={s.td}>
                      <div
                        style={{
                          fontWeight: "600",
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
                        {/* 💡 LECTURA CORRECTA DE LA RELACIÓN */}
                        {u.cat_sucursales?.nombre || "Sin Sucursal"}
                      </small>
                    </td>
                    <td className={s.td}>
                      <span className={s.badge}>
                        {/* 💡 LECTURA CORRECTA DE LA RELACIÓN */}
                        {u.roles?.nombre_rol?.toUpperCase() || "SIN ROL"}
                      </span>
                    </td>
                    <td className={s.td} style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`}
                          onClick={() => {
                            emp.setEditId(u.id);
                            emp.setFormData({
                                ...u,
                                password_hash: '' // No cargar el hash por seguridad
                            });
                          }}
                        >
                          {emp.puedeEditarUsuarios ? '📝' : 'VER'}
                        </button>
                        {emp.puedeBorrarUsuarios && (
                          <button
                            className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`}
                            onClick={() => emp.handleDeleteUsuario(u.id, u.nombre)}
                          >
                            ❌
                          </button>
                        )}
                      </div>
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
        <div className={s.splitLayout}>
          <aside className={s.adminCard}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3 className={s.cardTitle} style={{ margin: 0 }}>
                Roles
              </h3>
              {emp.puedeCrearConfig && (
                <button
                  className={`${s.btn} ${s.btnSec} ${s.btnSmall}`}
                  style={{ padding: "4px 10px" }}
                  onClick={() => emp.setMostrarFormRol(!emp.mostrarFormRol)}
                >
                  + Rol
                </button>
              )}
            </div>

            {emp.mostrarFormRol && emp.puedeCrearConfig && (
              <form
                onSubmit={emp.handleSaveRol}
                style={{
                  padding: "15px",
                  background: "var(--color-bg-app)",
                  borderRadius: "var(--radius-ui)",
                  marginBottom: "15px",
                }}
              >
                <div className={s.formGroup}>
                  <label className={s.label} style={{ fontSize: '9px' }}>NOMBRE DEL ROL</label>
                  <input
                    className={s.inputField}
                    placeholder="Ej. Chef, Cajero..."
                    value={emp.rolFormData.nombre_rol}
                    onChange={(e) =>
                      emp.setRolFormData({ ...emp.rolFormData, nombre_rol: e.target.value })
                    }
                    required
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label} style={{ fontSize: '9px' }}>DESCRIPCIÓN</label>
                  <input
                    className={s.inputField}
                    placeholder="¿Qué hace este rol?"
                    value={emp.rolFormData.descripcion}
                    onChange={(e) =>
                      emp.setRolFormData({ ...emp.rolFormData, descripcion: e.target.value })
                    }
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}
                  disabled={emp.loading}
                >
                  {emp.loading ? 'GUARDANDO...' : 'GUARDAR ROL'}
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

          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <div
              className={s.tableHeader}
              style={{
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
                  className={`${s.btn} ${s.btnSuccess}`}
                >
                  {emp.loading ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                </button>
              )}
            </div>

            {!emp.rolSeleccionado ? (
              <p className={s.emptyState}>
                Selecciona un rol de la izquierda para configurar sus accesos...
              </p>
            ) : (
              <table className={s.table} style={{ minWidth: "600px" }}>
                <thead className={s.thead}>
                  <tr>
                    <th className={s.th}>MÓDULO DEL SISTEMA</th>
                    <th className={s.th} style={{ textAlign: "center" }}>
                      VER
                    </th>
                    <th className={s.th} style={{ textAlign: "center" }}>
                      CREAR
                    </th>
                    <th className={s.th} style={{ textAlign: "center" }}>
                      EDITAR
                    </th>
                    <th className={s.th} style={{ textAlign: "center" }}>
                      BORRAR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MATRIZ_MODULOS.map((m) => {
                    const baseSlug = m.slug.replace("ver_", "");

                    const idVer = getPermisoId(`ver_${baseSlug}`);
                    const idCrear = getPermisoId(`crear_${baseSlug}`);
                    const idEditar = getPermisoId(`editar_${baseSlug}`);
                    const idBorrar = getPermisoId(`borrar_${baseSlug}`);

                    return (
                      <tr key={m.slug}>
                        <td className={s.td} style={{ fontWeight: "700" }}>
                          {m.label}
                        </td>

                        {/* COLUMNA VER */}
                        <td className={s.td} style={{ textAlign: "center" }}>
                          {idVer ? (
                            <input
                              type="checkbox"
                              className={s.checkbox}
                              disabled={!emp.puedeEditarConfig}
                              checked={emp.permisosActivos.includes(idVer)}
                              onChange={() => emp.togglePermiso(idVer)}
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
                        <td className={s.td} style={{ textAlign: "center" }}>
                          {idCrear ? (
                            <input
                              type="checkbox"
                              className={s.checkbox}
                              disabled={!emp.puedeEditarConfig}
                              checked={emp.permisosActivos.includes(idCrear)}
                              onChange={() => emp.togglePermiso(idCrear)}
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
                        <td className={s.td} style={{ textAlign: "center" }}>
                          {idEditar ? (
                            <input
                              type="checkbox"
                              className={s.checkbox}
                              disabled={!emp.puedeEditarConfig}
                              checked={emp.permisosActivos.includes(idEditar)}
                              onChange={() => emp.togglePermiso(idEditar)}
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
                        <td className={s.td} style={{ textAlign: "center" }}>
                          {idBorrar ? (
                            <input
                              type="checkbox"
                              className={s.checkbox}
                              disabled={!emp.puedeEditarConfig}
                              checked={emp.permisosActivos.includes(idBorrar)}
                              onChange={() => emp.togglePermiso(idBorrar)}
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
        <div className={s.splitLayout}>
          <aside className={s.adminCard} style={{ display: emp.puedeCrearSucursales || emp.editSucursalId ? 'block' : 'none' }}>
            <h3 className={s.cardTitle}>
              {emp.editSucursalId ? (emp.puedeEditarSucursales ? "Editar Sucursal" : "Ver Sucursal") : "Nueva Sucursal"}
            </h3>
            <form onSubmit={emp.handleSaveSucursal} className={s.loginForm}>
              <div className={s.formGroup}>
                <label className={s.label}>NOMBRE</label>
                <input
                  className={s.inputField}
                  value={emp.sucursalFormData.nombre}
                  onChange={(e) =>
                    emp.setSucursalFormData({
                      ...emp.sucursalFormData,
                      nombre: e.target.value,
                    })
                  }
                  required
                  readOnly={emp.editSucursalId ? !emp.puedeEditarSucursales : !emp.puedeCrearSucursales}
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>DIRECCIÓN</label>
                <input
                  className={s.inputField}
                  value={emp.sucursalFormData.direccion}
                  onChange={(e) =>
                    emp.setSucursalFormData({
                      ...emp.sucursalFormData,
                      direccion: e.target.value,
                    })
                  }
                  readOnly={emp.editSucursalId ? !emp.puedeEditarSucursales : !emp.puedeCrearSucursales}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                {(emp.editSucursalId ? emp.puedeEditarSucursales : emp.puedeCrearSucursales) && (
                  <button
                    type="submit"
                    className={`${s.btn} ${s.btnPrimary}`}
                    style={{ flex: 1 }}
                  >
                    GUARDAR SUCURSAL
                  </button>
                )}
                {emp.editSucursalId && (
                  <button
                    type="button"
                    className={`${s.btn} ${s.btnDark}`}
                    onClick={() => {
                      emp.setEditSucursalId(null);
                      emp.setSucursalFormData({ nombre: '', direccion: '' });
                    }}
                  >
                    {emp.puedeEditarSucursales ? "CANCELAR" : "CERRAR"}
                  </button>
                )}
              </div>
            </form>
          </aside>

          <div className={`${s.adminCard} ${s.tableContainer}`}>
            <table className={s.table} style={{ minWidth: "500px" }}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>NOMBRE</th>
                  <th className={s.th}>DIRECCIÓN</th>
                  <th className={s.th} style={{ textAlign: "right" }}>
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {emp.sucursales.map((suc) => (
                  <tr key={suc.id}>
                    <td className={s.td}>
                      <strong>{suc.nombre}</strong>
                    </td>
                    <td className={s.td}>{suc.direccion || "N/A"}</td>
                    <td className={s.td} style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`}
                          onClick={() => {
                            emp.setEditSucursalId(suc.id);
                            emp.setSucursalFormData(suc);
                          }}
                        >
                          {emp.puedeEditarSucursales ? '📝' : '👁️'}
                        </button>
                        {emp.puedeBorrarSucursales && (
                          <button
                            className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`}
                            onClick={() => emp.handleDeleteSucursal(suc.id, suc.nombre)}
                          >
                            ❌
                          </button>
                        )}
                      </div>
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
        className={s.inputField}
        value={searchTerm}
        disabled={disabled}
        placeholder={placeholder}
        style={{ backgroundColor: disabled ? "var(--color-bg-app)" : "white" }}
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
              No se encontraron coincidencias...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};