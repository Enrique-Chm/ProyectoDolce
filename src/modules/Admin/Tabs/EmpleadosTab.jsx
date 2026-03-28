// Archivo: src/modules/TabsTabs/EmpleadosTab.jsx
import React, { useState, useEffect } from "react";
import { useEmpleados } from "../../../hooks/useEmpleados";
import { MATRIZ_MODULOS, hasPermission } from "../../../utils/checkPermiso";
import s from "../EstilosGenerales.module.css";

export const EmpleadosTab = () => {
  const [subTab, setSubTab] = useState("usuarios");
  const [activePermisoTab, setActivePermisoTab] = useState("SERVICIO");
  
  // Estados para los filtros de búsqueda
  const [filtroUsuarios, setFiltroUsuarios] = useState("");
  const [filtroSucursales, setFiltroSucursales] = useState("");
  
  const emp = useEmpleados();

  const getPermisoId = (clave) => emp.permisos.find((p) => p.clave_permiso === clave)?.id;

  // Filtrado de usuarios
  const usuariosFiltrados = emp.usuarios.filter(u => {
    if (!filtroUsuarios) return true;
    const texto = filtroUsuarios.toLowerCase();
    const matchNombre = u.nombre?.toLowerCase().includes(texto);
    const matchSucursal = u.cat_sucursales?.nombre?.toLowerCase().includes(texto);
    const matchRol = u.roles?.nombre_rol?.toLowerCase().includes(texto);
    return matchNombre || matchSucursal || matchRol;
  });

  // Filtrado de sucursales
  const sucursalesFiltradas = emp.sucursales.filter(suc => {
    if (!filtroSucursales) return true;
    const texto = filtroSucursales.toLowerCase();
    const matchNombre = suc.nombre?.toLowerCase().includes(texto);
    const matchDireccion = suc.direccion?.toLowerCase().includes(texto);
    return matchNombre || matchDireccion;
  });

  return (
    <div className={s.tabWrapper}>
      <div className={s.pageHeader}>
        <h2 className={s.pageTitle}>Gestión de Capital Humano</h2>
      </div>
      
      {/* Navegación de Pestañas Principales */}
      <nav className={s.tabNav}>
        {hasPermission("ver_usuarios") && (
          <button className={`${s.tabButton} ${subTab === "usuarios" ? s.activeTabButton : ""}`} onClick={() => setSubTab("usuarios")}>
            EQUIPO
          </button>
        )}
        {hasPermission("ver_configuracion") && (
          <button className={`${s.tabButton} ${subTab === "permisos" ? s.activeTabButton : ""}`} onClick={() => setSubTab("permisos")}>
            PERMISOS Y ROLES
          </button>
        )}
        {hasPermission("ver_sucursales") && (
          <button className={`${s.tabButton} ${subTab === "sucursales" ? s.activeTabButton : ""}`} onClick={() => setSubTab("sucursales")}>
            SUCURSALES
          </button>
        )}
      </nav>

      {/* --- SUBTAB: EQUIPO --- */}
      {subTab === "usuarios" && hasPermission("ver_usuarios") && (
        <div className={s.splitLayout}>
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
                  placeholder="Ej. Enrique Chavez"
                  onChange={(e) => emp.setFormData({ ...emp.formData, nombre: e.target.value })}
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
                  onChange={(val) => emp.setFormData({ ...emp.formData, sucursal_id: val })}
                  disabled={emp.editId ? !emp.puedeEditarUsuarios : !emp.puedeCrearUsuarios}
                />
              </div>

              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.label}>USUARIO</label>
                  <input
                    className={s.inputField}
                    value={emp.formData.username}
                    placeholder="Nombre de usuario..."
                    onChange={(e) => emp.setFormData({ ...emp.formData, username: e.target.value })}
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
                    placeholder="Seleccionar rol..."
                    onChange={(val) => emp.setFormData({ ...emp.formData, rol_id: val })}
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
                    placeholder="Definir contraseña..."
                    onChange={(e) => emp.setFormData({ ...emp.formData, password_hash: e.target.value })}
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
                    onChange={(e) => emp.setFormData({ ...emp.formData, pin_seguridad: e.target.value })}
                    readOnly={emp.editId ? !emp.puedeEditarUsuarios : !emp.puedeCrearUsuarios}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                {(emp.editId ? emp.puedeEditarUsuarios : emp.puedeCrearUsuarios) && (
                  <button type="submit" className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1 }}>
                    {emp.editId ? "ACTUALIZAR" : "REGISTRAR"}
                  </button>
                )}
                {emp.editId && (
                  <button type="button" className={`${s.btn} ${s.btnDark}`} onClick={emp.resetUserForm}>
                    {emp.puedeEditarUsuarios ? "CANCELAR" : "CERRAR"}
                  </button>
                )}
              </div>
            </form>
          </aside>

          {/* Listado de Empleados */}
          <div className={`${s.adminCard} ${s.tableContainer}`}>
            {/* Buscador de Empleados */}
            <div style={{ padding: "15px", borderBottom: "1px solid var(--color-border)" }}>
              <input
                type="text"
                className={s.inputField}
                placeholder="Buscar por empleado, sucursal o rol..."
                value={filtroUsuarios}
                onChange={(e) => setFiltroUsuarios(e.target.value)}
              />
            </div>

            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>EMPLEADO / SUCURSAL</th>
                  <th className={s.th}>ROL</th>
                  <th className={s.th} style={{ textAlign: "right" }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                      {emp.usuarios.length === 0
                        ? "No hay empleados registrados."
                        : "No se encontraron resultados para su búsqueda."}
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => (
                    <tr key={u.id}>
                      <td className={s.td}>
                        <div className={s.productTitle}>{u.nombre}</div>
                        <small className={s.priceValue}>
                          {u.cat_sucursales?.nombre || "Sin Sucursal"}
                        </small>
                      </td>
                      <td className={s.td}>
                        <span className={s.textMuted}>{u.roles?.nombre_rol?.toUpperCase() || "SIN ROL"}</span>
                      </td>
                      <td className={s.td} style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`}
                            onClick={() => {
                              emp.setEditId(u.id);
                              emp.setFormData({ ...u, password_hash: '' });
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB: PERMISOS --- */}
      {subTab === "permisos" && hasPermission("ver_configuracion") && (
        <div className={s.splitLayout}>
          <aside className={s.adminCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 className={s.cardTitle} style={{ margin: 0 }}>Roles</h3>
              {emp.puedeCrearConfig && (
                <button className={`${s.btn} ${s.btnSuccess} ${s.btnSmall}`} style={{ padding: "4px 10px" }} onClick={() => emp.setMostrarFormRol(!emp.mostrarFormRol)}>
                  + Rol
                </button>
              )}
            </div>

            {emp.mostrarFormRol && emp.puedeCrearConfig && (
              <form onSubmit={emp.handleSaveRol} style={{ padding: "15px", background: "var(--color-bg-app)", borderRadius: "var(--radius-ui)", marginBottom: "15px" }}>
                <div className={s.formGroup}>
                  <label className={s.label}>NOMBRE DEL ROL</label>
                  <input
                    className={s.inputField} placeholder="Ej. Chef, Cajero..." value={emp.rolFormData.nombre_rol}
                    onChange={(e) => emp.setRolFormData({ ...emp.rolFormData, nombre_rol: e.target.value })} required
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>DESCRIPCIÓN</label>
                  <input
                    className={s.inputField} placeholder="¿Qué hace este rol?" value={emp.rolFormData.descripcion}
                    onChange={(e) => emp.setRolFormData({ ...emp.rolFormData, descripcion: e.target.value })} required
                  />
                </div>
                <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} disabled={emp.loading}>
                  {emp.loading ? 'GUARDANDO...' : 'GUARDAR ROL'}
                </button>
              </form>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {emp.roles.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: "12px 15px", borderRadius: "var(--radius-ui)", cursor: "pointer", fontWeight: "700", fontSize: "0.9rem", transition: "all 0.2s",
                    backgroundColor: emp.rolSeleccionado === r.id ? "var(--color-primary)" : "transparent",
                    color: emp.rolSeleccionado === r.id ? "white" : "var(--color-text-muted)",
                  }}
                  onClick={() => emp.seleccionarRol(r.id)}
                >
                  {r.nombre_rol.toUpperCase()}
                </div>
              ))}
            </div>
          </aside>

          <div className={`${s.adminCard} ${s.tableContainer}`} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Matriz de Facultades</h3>
              {emp.rolSeleccionado && emp.puedeEditarConfig && (
                <button onClick={emp.guardarMatrizPermisos} disabled={emp.loading} className={`${s.btn} ${s.btnSuccess}`}>
                  {emp.loading ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                </button>
              )}
            </div>

            {!emp.rolSeleccionado ? (
              <p className={s.emptyState}>Selecciona un rol de la izquierda para configurar sus accesos...</p>
            ) : (
              <>
                <div className={s.miniTabsWrapper}>
                  <nav className={s.miniTabNav}>
                    {[
                      { id: 'SERVICIO', label: ' SALÓN Y CAJA' },
                      { id: 'FINANZAS', label: ' FINANZAS' },
                      { id: 'ALMACEN', label: ' INVENTARIOS' },
                      { id: 'ADMIN', label: ' CONFIGURACIÓN' }
                    ].map(tab => (
                      <button
                        key={tab.id} onClick={() => setActivePermisoTab(tab.id)}
                        className={`${s.miniTabButton} ${activePermisoTab === tab.id ? s.activeMiniTabButton : ''}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className={s.matrixContainer}>
                  <table className={`${s.table} ${s.tableMatrix}`}>
                    <thead className={s.thead}>
                      <tr>
                        <th className={s.th}>MÓDULO DEL SISTEMA</th>
                        <th className={`${s.th} ${s.thCenter} ${s.thVer}`}>VER</th>
                        <th className={`${s.th} ${s.thCenter} ${s.thCrear}`}>CREAR</th>
                        <th className={`${s.th} ${s.thCenter} ${s.thEditar}`}>EDITAR</th>
                        <th className={`${s.th} ${s.thCenter} ${s.thBorrar}`}>BORRAR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let ultimaCat = null;
                        return MATRIZ_MODULOS
                          .filter(m => m.cat === activePermisoTab || (!m.cat && activePermisoTab === 'ADMIN'))
                          .map((m) => {
                            const mostrarEncabezado = m.cat !== ultimaCat;
                            ultimaCat = m.cat;
                            const baseSlug = m.slug.replace("ver_", "");

                            // 💡 OPTIMIZACIÓN: Las 4 columnas se definen en un array y se renderizan con un .map()
                            const columnasPermisos = [
                              { id: getPermisoId(`ver_${baseSlug}`), claseCheck: s.checkVer },
                              { id: getPermisoId(`crear_${baseSlug}`), claseCheck: s.checkCrear },
                              { id: getPermisoId(`editar_${baseSlug}`), claseCheck: s.checkEditar },
                              { id: getPermisoId(`borrar_${baseSlug}`), claseCheck: s.checkBorrar }
                            ];

                            return (
                              <React.Fragment key={m.slug}>
                                {mostrarEncabezado && (
                                  <tr className={s.tableRowCategory}>
                                    <td colSpan="5">
                                      {m.cat === 'SERVICIO' && ' Área de Salón y Meseros'}
                                      {m.cat === 'FINANZAS' && ' Control de Caja y Gastos'}
                                      {m.cat === 'ALMACEN'  && ' Inventarios y Costeo'}
                                      {m.cat === 'ADMIN'    && ' Configuración del Sistema'}
                                      {!m.cat && 'MÓDULOS DE SISTEMA'}
                                    </td>
                                  </tr>
                                )}

                                <tr>
                                  <td className={s.td} style={{ fontWeight: "700" }}>{m.label}</td>
                                  
                                  {/* Renderizado de columnas CRUD simplificado en 15 líneas en lugar de 60 */}
                                  {columnasPermisos.map((col, idx) => (
                                    <td key={idx} className={`${s.td} ${s.thCenter}`}>
                                      {col.id ? (
                                        <input
                                          type="checkbox"
                                          className={`${s.checkbox} ${col.claseCheck}`}
                                          disabled={!emp.puedeEditarConfig}
                                          checked={emp.permisosActivos.includes(col.id)}
                                          onChange={() => emp.togglePermiso(col.id)}
                                        />
                                      ) : (
                                        <span className={s.permisoNA}>N/A</span>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              </React.Fragment>
                            );
                          });
                      })()}
                    </tbody>
                  </table>
                </div>
              </>
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
                  className={s.inputField} value={emp.sucursalFormData.nombre} placeholder="Nombre de la sucursal..."
                  onChange={(e) => emp.setSucursalFormData({ ...emp.sucursalFormData, nombre: e.target.value })}
                  required readOnly={emp.editSucursalId ? !emp.puedeEditarSucursales : !emp.puedeCrearSucursales}
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>DIRECCIÓN</label>
                <input
                  className={s.inputField} value={emp.sucursalFormData.direccion} placeholder="Dirección de la sucursal..."
                  onChange={(e) => emp.setSucursalFormData({ ...emp.sucursalFormData, direccion: e.target.value })}
                  readOnly={emp.editSucursalId ? !emp.puedeEditarSucursales : !emp.puedeCrearSucursales}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                {(emp.editSucursalId ? emp.puedeEditarSucursales : emp.puedeCrearSucursales) && (
                  <button type="submit" className={`${s.btn} ${s.btnPrimary}`} style={{ flex: 1 }}>GUARDAR SUCURSAL</button>
                )}
                {emp.editSucursalId && (
                  <button
                    type="button" className={`${s.btn} ${s.btnDark}`}
                    onClick={() => { emp.setEditSucursalId(null); emp.setSucursalFormData({ nombre: '', direccion: '' }); }}
                  >
                    {emp.puedeEditarSucursales ? "CANCELAR" : "CERRAR"}
                  </button>
                )}
              </div>
            </form>
          </aside>

          <div className={`${s.adminCard} ${s.tableContainer}`}>
            {/* Buscador de Sucursales */}
            <div style={{ padding: "15px", borderBottom: "1px solid var(--color-border)" }}>
              <input
                type="text"
                className={s.inputField}
                placeholder="Buscar por nombre o dirección..."
                value={filtroSucursales}
                onChange={(e) => setFiltroSucursales(e.target.value)}
              />
            </div>

            <table className={s.table} style={{ minWidth: "500px" }}>
              <thead className={s.thead}>
                <tr>
                  <th className={s.th}>NOMBRE</th>
                  <th className={s.th}>DIRECCIÓN</th>
                  <th className={s.th} style={{ textAlign: "right" }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {sucursalesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                      {emp.sucursales.length === 0
                        ? "No hay sucursales registradas."
                        : "No se encontraron resultados para su búsqueda."}
                    </td>
                  </tr>
                ) : (
                  sucursalesFiltradas.map((suc) => (
                    <tr key={suc.id}>
                      <td className={s.td}><strong>{suc.nombre}</strong></td>
                      <td className={s.td}>{suc.direccion || "N/A"}</td>
                      <td className={s.td} style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`}
                            onClick={() => { emp.setEditSucursalId(suc.id); emp.setSucursalFormData(suc); }}
                          >
                            {emp.puedeEditarSucursales ? '📝' : '👁️'}
                          </button>
                          {emp.puedeBorrarSucursales && (
                            <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => emp.handleDeleteSucursal(suc.id, suc.nombre)}>❌</button>
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

/**
 * SUB-COMPONENTE MEJORADO: SearchableSelect
 */
const SearchableSelect = ({ options, value, onChange, disabled, placeholder = "Buscar...", valueKey = "id", labelKey = "nombre", formatLabel }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find((opt) => String(opt[valueKey]) === String(value));
    if (selected) setSearchTerm(selected[labelKey]);
    else setSearchTerm("");
  }, [value, options, valueKey, labelKey]);

  const filteredOptions = options.filter((opt) =>
    String(opt[labelKey]).toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text" className={s.inputField} value={searchTerm} disabled={disabled} placeholder={placeholder}
        style={{ backgroundColor: disabled ? "var(--color-bg-app)" : "white" }}
        onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); if (value) onChange(""); }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => { setTimeout(() => { setIsOpen(false); const selected = options.find((opt) => String(opt[valueKey]) === String(value)); if (selected) setSearchTerm(selected[labelKey]); else setSearchTerm(""); }, 200); }}
      />
      {isOpen && !disabled && (
        <ul className={s.dropdownList}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => (
              <li
                key={index} className={s.dropdownItem}
                onMouseDown={(e) => { e.preventDefault(); onChange(opt[valueKey]); setSearchTerm(opt[labelKey]); setIsOpen(false); }}
              >
                {formatLabel ? formatLabel(opt) : opt[labelKey]}
              </li>
            ))
          ) : (
            <li className={s.dropdownItem} style={{ color: "var(--color-text-muted)" }}>No se encontraron coincidencias...</li>
          )}
        </ul>
      )}
    </div>
  );
};