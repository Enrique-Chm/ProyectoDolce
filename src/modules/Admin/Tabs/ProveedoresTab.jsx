// Archivo: src/modules/Admin/Tabs/ProveedoresTab.jsx
import React, { useState } from 'react';
import s from '../../../assets/styles/EstilosGenerales.module.css';
import { useProveedoresTab } from '../../../hooks/useProveedoresTab'; 
import Swal from 'sweetalert2'; 

export const ProveedoresTab = () => { 
  // Consumimos estados y métodos desde el hook
  const {
    proveedores, loading, editId, formData, setFormData,
    puedeCrear, puedeEditar, puedeBorrar,
    resetForm, prepararEdicion, handleSubmit, handleDelete
  } = useProveedoresTab();

  // Estado para el filtro de búsqueda
  const [filtroBuscar, setFiltroBuscar] = useState("");

  const mostrarFormulario = puedeCrear || editId;
  const noTienePermisoAccion = editId ? !puedeEditar : !puedeCrear;

  // 🛡️ CONFIRMACIÓN PARA DESCARTAR CAMBIOS
  const handleCancelClick = () => {
    const tieneDatos = formData.nombre_empresa || formData.contacto_nombre || formData.telefono || formData.correo;
    
    if (tieneDatos) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: "Los datos que escribiste se perderán.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', 
        cancelButtonColor: '#3085d6', 
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Seguir editando'
      }).then((result) => {
        if (result.isConfirmed) {
          resetForm();
        }
      });
    } else {
      resetForm();
    }
  };

  // 🛡️ CONFIRMACIÓN PARA BORRAR PROVEEDOR
  const confirmDeleteProveedor = (id, nombre_empresa) => {
    Swal.fire({
      title: `¿Eliminar al proveedor "${nombre_empresa}"?`,
      text: "Esta acción no se puede deshacer.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d', 
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        handleDelete(id, nombre_empresa);
      }
    });
  };

  // Filtrado de proveedores basado en el texto de búsqueda
  const proveedoresFiltrados = proveedores.filter((p) => {
    if (!filtroBuscar) return true;
    const texto = filtroBuscar.toLowerCase();
    const matchEmpresa = p.nombre_empresa?.toLowerCase().includes(texto);
    const matchContacto = p.contacto_nombre?.toLowerCase().includes(texto);
    const matchCorreo = p.correo?.toLowerCase().includes(texto);
    const matchTelefono = p.telefono?.toLowerCase().includes(texto);
    return matchEmpresa || matchContacto || matchCorreo || matchTelefono;
  });

  return (
    <div className={s.tabWrapper}>
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Directorio de Proveedores</h2>
        {loading && <span className={s.syncBadge}>CARGANDO...</span>}
      </header>

      {/* 💡 LAYOUT DINÁMICO REUTILIZADO */}
      <div className={mostrarFormulario ? s.splitLayout : s.fullLayout}>
        
        {/* PANEL DE REGISTRO / EDICIÓN (Usando s.hidden para el display: none) */}
        <aside className={`${s.adminCard} ${!mostrarFormulario ? s.hidden : ''}`}>
          <h3 className={s.cardTitle}>
            {editId ? (puedeEditar ? 'Editar Proveedor' : 'Ficha Técnica') : 'Nuevo Proveedor'}
          </h3>
          <form onSubmit={handleSubmit} className={s.formColumn}>
            
            <div className={s.formGroup}>
              <label className={s.label}>NOMBRE DE LA EMPRESA</label>
              <input 
                className={`${s.inputField} ${noTienePermisoAccion ? s.inputDisabled : ''}`}
                value={formData.nombre_empresa} 
                onChange={e => setFormData({...formData, nombre_empresa: e.target.value})} 
                required 
                placeholder="Nombre comercial"
                readOnly={noTienePermisoAccion}
              />
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>NOMBRE DEL CONTACTO</label>
              <input 
                className={`${s.inputField} ${noTienePermisoAccion ? s.inputDisabled : ''}`}
                value={formData.contacto_nombre} 
                onChange={e => setFormData({...formData, contacto_nombre: e.target.value})} 
                placeholder="Persona de ventas"
                readOnly={noTienePermisoAccion}
              />
            </div>

            <div className={s.formGrid}>
              <div className={s.formGroup}>
                <label className={s.label}>TELÉFONO</label>
                <input 
                  className={`${s.inputField} ${noTienePermisoAccion ? s.inputDisabled : ''}`}
                  value={formData.telefono} 
                  onChange={e => setFormData({...formData, telefono: e.target.value})} 
                  placeholder="WhatsApp"
                  readOnly={noTienePermisoAccion}
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>DÍAS CRÉDITO</label>
                <input 
                  className={`${s.inputField} ${noTienePermisoAccion ? s.inputDisabled : ''}`}
                  type="number" 
                  value={formData.dias_credito} 
                  onChange={e => setFormData({...formData, dias_credito: e.target.value})} 
                  readOnly={noTienePermisoAccion}
                />
              </div>
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>CORREO ELECTRÓNICO</label>
              <input 
                className={`${s.inputField} ${noTienePermisoAccion ? s.inputDisabled : ''}`}
                type="email" 
                value={formData.correo} 
                onChange={e => setFormData({...formData, correo: e.target.value})} 
                placeholder="correo@proveedor.com"
                readOnly={noTienePermisoAccion}
              />
            </div>

            <div className={`${s.flexWrap} ${s.marginTop10}`}>
              {!noTienePermisoAccion && (
                <button 
                  type="submit" 
                  className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}
                  disabled={loading}
                >
                  {loading ? '...' : (editId ? 'ACTUALIZAR DATOS' : 'REGISTRAR PROVEEDOR')}
                </button>
              )}

              {editId && (
                <button 
                  type="button" 
                  className={`${s.btn} ${s.btnDark} ${s.btnFull}`}
                  onClick={handleCancelClick} 
                >
                  {puedeEditar ? 'CANCELAR EDICIÓN' : 'CERRAR VISTA'}
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* TABLA DE PROVEEDORES */}
        <div className={`${s.adminCard} ${s.tableContainer}`}>
          {/* Componente visual para la Búsqueda */}
          <div style={{ padding: "15px", borderBottom: "1px solid var(--color-border)" }}>
            <input
              type="text"
              className={s.inputField}
              placeholder="Buscar por empresa, contacto, correo o teléfono..."
              value={filtroBuscar}
              onChange={(e) => setFiltroBuscar(e.target.value)}
            />
          </div>

          <table className={s.table}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th}>EMPRESA / CORREO</th>
                <th className={s.th}>CONTACTO / TELÉFONO</th>
                <th className={`${s.th} ${s.tdCenter}`}>CRÉDITO</th>
                <th className={`${s.th} ${s.tdRight}`}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {proveedoresFiltrados.length > 0 ? (
                proveedoresFiltrados.map(p => (
                  <tr key={p.id} className={editId === p.id ? s.rowHighlight : ''}>
                    <td className={s.td}>
                      <div className={s.priceValue}>{p.nombre_empresa}</div>
                      <div className={s.textMuted}>{p.correo || 'Sin correo registrado'}</div>
                    </td>
                    <td className={s.td}>
                      <div className={s.priceValue}>{p.contacto_nombre || '---'}</div>
                      <div className={s.syncBadge}>{p.telefono || 'Sin número'}</div>
                    </td>
                    <td className={`${s.td} ${s.tdCenter}`}>
                      <span className={`${s.textMuted} ${p.dias_credito <= 0 ? s.opacity50 : ''}`}>
                        {p.dias_credito} Días
                      </span>
                    </td>
                    <td className={`${s.td} ${s.tdRight}`}>
                      <div className={s.actionsWrapper}>
                        <button 
                          className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`}
                          onClick={() => prepararEdicion(p)}
                        >
                          {puedeEditar ? '📝' : '👁️'}
                        </button>
                        {puedeBorrar && (
                          <button 
                            className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`}
                            onClick={() => confirmDeleteProveedor(p.id, p.nombre_empresa)}
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className={s.emptyState} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    {loading
                      ? 'Sincronizando...'
                      : proveedores.length === 0
                      ? 'No hay proveedores registrados.'
                      : 'No se encontraron resultados para su búsqueda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};