// Archivo: src/modules/Admin/components/ProveedoresTab.jsx
import React, { useState, useEffect } from 'react';
import { proveedoresService } from '../../../services/Proveedores.service';
import s from '../AdminPage.module.css';
import { hasPermission } from '../../../utils/checkPermiso'; // 🛡️ Importamos seguridad

export const ProveedoresTab = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  
  /**
   * 🛡️ SEGURIDAD INTERNA (RBAC)
   */
  const puedeEditar = hasPermission('editar_configuracion'); 
  const puedeBorrar = hasPermission('borrar_registros');

  const [formData, setFormData] = useState({
    nombre_empresa: '',
    contacto_nombre: '',
    telefono: '',
    correo: '',
    dias_credito: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await proveedoresService.getAll();
      setProveedores(data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      nombre_empresa: '',
      contacto_nombre: '',
      telefono: '',
      correo: '',
      dias_credito: 0
    });
  };

  const prepararEdicion = (p) => {
    setEditId(p.id);
    setFormData({
      nombre_empresa: p.nombre_empresa || '',
      contacto_nombre: p.contacto_nombre || '',
      telefono: p.telefono || '',
      correo: p.correo || '',
      dias_credito: p.dias_credito || 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeEditar) return; 

    setLoading(true);
    try {
      const { error } = await proveedoresService.save(formData, editId);
      if (error) throw error;
      
      resetForm();
      await fetchData();
    } catch (error) {
      alert("Error al procesar la solicitud: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!puedeBorrar) return; 
    if (window.confirm(`¿Estás seguro de eliminar al proveedor "${nombre}"?`)) {
      try {
        const { error } = await proveedoresService.delete(id);
        if (error) throw error;
        await fetchData();
      } catch (error) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Directorio de Proveedores</h2>
        {loading && <span className={s.syncBadge}>CARGANDO...</span>}
      </header>

      <div className={s.splitLayout}>
        
        {/* PANEL DE REGISTRO / EDICIÓN PROTEGIDO */}
        <aside className={s.adminCard}>
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
                readOnly={!puedeEditar}
              />
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>NOMBRE DEL CONTACTO</label>
              <input 
                className={s.inputField}
                value={formData.contacto_nombre} 
                onChange={e => setFormData({...formData, contacto_nombre: e.target.value})} 
                placeholder="Persona de ventas/atención"
                readOnly={!puedeEditar}
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
                  readOnly={!puedeEditar}
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>DÍAS CRÉDITO</label>
                <input 
                  className={s.inputField}
                  type="number" 
                  value={formData.dias_credito} 
                  onChange={e => setFormData({...formData, dias_credito: e.target.value})} 
                  readOnly={!puedeEditar}
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
                readOnly={!puedeEditar}
              />
            </div>

            <div className={s.flexColumnGap10} style={{ marginTop: '10px' }}>
              {/* Botón de acción principal */}
              {puedeEditar && (
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
                  className={`${s.btn} ${s.btn} ${s.btnSmall}`}
                  onClick={resetForm} 
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
                      <span className={s.badge} style={{ opacity: p.dias_credito > 0 ? 1 : 0.5 }}>
                        {p.dias_credito} d
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
                            onClick={() => handleDelete(p.id, p.nombre_empresa)}
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