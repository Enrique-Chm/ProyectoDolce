// Archivo: src/modules/Admin/components/ProveedoresTab.jsx
import React from 'react';
import s from '../AdminPage.module.css';
import { useProveedoresTab } from '../../../hooks/useProveedoresTab'; // 👈 Importamos el nuevo hook
import Swal from 'sweetalert2'; // 👈 Importamos al "Guardia" para las confirmaciones destructivas

export const ProveedoresTab = () => {
  // Consumimos estados y métodos desde el hook
  const {
    proveedores, loading, editId, formData, setFormData,
    puedeCrear, puedeEditar, puedeBorrar,
    resetForm, prepararEdicion, handleSubmit, handleDelete
  } = useProveedoresTab();

  // 🛡️ CONFIRMACIÓN PARA DESCARTAR CAMBIOS
  const handleCancelClick = () => {
    // Revisamos si el usuario ya escribió algo en el formulario
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
      // Si está vacío, cerramos directamente sin molestar
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
      cancelButtonColor: '#6c757d', // Gris neutral para cancelar
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        handleDelete(id, nombre_empresa); // Disparamos la función de tu hook
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Directorio de Proveedores</h2>
        {loading && <span className={s.syncBadge}>CARGANDO...</span>}
      </header>

      <div className={s.splitLayout}>
        
        {/* PANEL DE REGISTRO / EDICIÓN PROTEGIDO: Oculto si no puede crear ni hay un elemento en vista */}
        <aside className={s.adminCard} style={{ display: puedeCrear || editId ? 'block' : 'none' }}>
          <h3 className={s.cardTitle}>
            {editId ? (puedeEditar ? 'Editar Proveedor' : 'Ficha Técnica') : '🏢 Nuevo Proveedor'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className={s.formGroup}>
              <label className={s.label}>NOMBRE DE LA EMPRESA</label>
              <input 
                className={s.inputField}
                value={formData.nombre_empresa} 
                onChange={e => setFormData({...formData, nombre_empresa: e.target.value})} 
                required 
                placeholder="Nombre comercial"
                readOnly={editId ? !puedeEditar : !puedeCrear}
                style={{ backgroundColor: (editId ? !puedeEditar : !puedeCrear) ? "var(--color-bg-muted)" : "white" }}
              />
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>NOMBRE DEL CONTACTO</label>
              <input 
                className={s.inputField}
                value={formData.contacto_nombre} 
                onChange={e => setFormData({...formData, contacto_nombre: e.target.value})} 
                placeholder="Persona de ventas/atención"
                readOnly={editId ? !puedeEditar : !puedeCrear}
                style={{ backgroundColor: (editId ? !puedeEditar : !puedeCrear) ? "var(--color-bg-muted)" : "white" }}
              />
            </div>

            <div className={s.formGrid}>
              <div className={s.formGroup}>
                <label className={s.label}>TELÉFONO</label>
                <input 
                  className={s.inputField}
                  value={formData.telefono} 
                  onChange={e => setFormData({...formData, telefono: e.target.value})} 
                  placeholder="WhatsApp/Oficina"
                  readOnly={editId ? !puedeEditar : !puedeCrear}
                  style={{ backgroundColor: (editId ? !puedeEditar : !puedeCrear) ? "var(--color-bg-muted)" : "white" }}
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>DÍAS CRÉDITO</label>
                <input 
                  className={s.inputField}
                  type="number" 
                  value={formData.dias_credito} 
                  onChange={e => setFormData({...formData, dias_credito: e.target.value})} 
                  readOnly={editId ? !puedeEditar : !puedeCrear}
                  style={{ backgroundColor: (editId ? !puedeEditar : !puedeCrear) ? "var(--color-bg-muted)" : "white" }}
                />
              </div>
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>CORREO ELECTRÓNICO</label>
              <input 
                className={s.inputField}
                type="email" 
                value={formData.correo} 
                onChange={e => setFormData({...formData, correo: e.target.value})} 
                placeholder="correo@proveedor.com"
                readOnly={editId ? !puedeEditar : !puedeCrear}
                style={{ backgroundColor: (editId ? !puedeEditar : !puedeCrear) ? "var(--color-bg-muted)" : "white" }}
              />
            </div>

            <div className={s.flexColumnGap10} style={{ marginTop: '10px' }}>
              {/* Botón de acción principal: Evalúa permiso dinámicamente */}
              {(editId ? puedeEditar : puedeCrear) && (
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
                  className={`${s.btn} ${s.btnDark} ${s.btnSmall}`}
                  onClick={handleCancelClick} // 👈 Cambiamos resetForm por nuestra nueva confirmación
                >
                  {puedeEditar ? 'CANCELAR EDICIÓN' : 'CERRAR VISTA'}
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* TABLA DE PROVEEDORES */}
        <div className={`${s.adminCard} ${s.tableContainer}`}>
          <table className={s.table} style={{ minWidth: '700px' }}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th}>EMPRESA / CORREO</th>
                <th className={s.th}>CONTACTO / TELÉFONO</th>
                <th className={s.th} style={{ textAlign: 'center' }}>CRÉDITO</th>
                <th className={s.th} style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length > 0 ? (
                proveedores.map(p => (
                  <tr key={p.id} style={{ backgroundColor: editId === p.id ? 'var(--color-bg-app)' : 'transparent' }}>
                    <td className={s.td}>
                      <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{p.nombre_empresa}</div>
                      <div className={s.textMuted} style={{ fontSize: '11px' }}>{p.correo || 'Sin correo registrado'}</div>
                    </td>
                    <td className={s.td}>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.contacto_nombre || '---'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '700' }}>{p.telefono || 'Sin número'}</div>
                    </td>
                    <td className={s.td} style={{ textAlign: 'center' }}>
                      <span className={s.th} style={{ opacity: p.dias_credito > 0 ? 1 : 0.5 }}>
                        {p.dias_credito} Dias
                      </span>
                    </td>
                    <td className={s.td} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`}
                          onClick={() => prepararEdicion(p)}
                        >
                          {puedeEditar ? '📝' : 'VER'}
                        </button>
                        {puedeBorrar && (
                          <button 
                            className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`}
                            onClick={() => confirmDeleteProveedor(p.id, p.nombre_empresa)} // 👈 Cambiamos handleDelete por nuestra confirmación
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
                  <td colSpan="4" className={s.emptyState}>
                    {loading ? 'Cargando directorio...' : 'No hay proveedores registrados.'}
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