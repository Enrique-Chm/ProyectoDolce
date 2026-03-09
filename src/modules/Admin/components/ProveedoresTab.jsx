import React, { useState, useEffect } from 'react';
import { proveedoresService } from '../../../services/Proveedores.service';
import s from '../AdminPage.module.css';
import { hasPermission } from '../../../utils/checkPermiso'; // IMPORTANTE

export const ProveedoresTab = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Verificación de facultades
  const puedeEditar = hasPermission('ver_proveedores'); 
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
    if (!puedeEditar) return; // Bloqueo de seguridad

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
    if (!puedeBorrar) return; // Bloqueo de seguridad
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
    <div className={s.pageWrapper} style={{ padding: '1rem' }}>
      <h2 className={s.sectionTitle}>Directorio de Proveedores</h2>

      <div className={s.container}>
        <aside className={s.card}>
          <div className={s.cardHeader}>
            <h3 className={s.cardTitle}>
              {editId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h3>
          </div>
          <form className={s.cardBody} onSubmit={handleSubmit}>
            <div className={s.formGroup}>
              <label className={s.label}>Nombre de la Empresa</label>
              <input 
                className={s.input} 
                value={formData.nombre_empresa} 
                onChange={e => setFormData({...formData, nombre_empresa: e.target.value})} 
                required 
                placeholder="Nombre comercial"
                readOnly={!puedeEditar}
              />
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>Nombre del Contacto</label>
              <input 
                className={s.input} 
                value={formData.contacto_nombre} 
                onChange={e => setFormData({...formData, contacto_nombre: e.target.value})} 
                placeholder="Persona de ventas/atención"
                readOnly={!puedeEditar}
              />
            </div>

            <div className={s.grid2}>
              <div className={s.formGroup}>
                <label className={s.label}>Teléfono</label>
                <input 
                  className={s.input} 
                  value={formData.telefono} 
                  onChange={e => setFormData({...formData, telefono: e.target.value})} 
                  placeholder="WhatsApp o Oficina"
                  readOnly={!puedeEditar}
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>Días de Crédito</label>
                <input 
                  className={s.input} 
                  type="number" 
                  value={formData.dias_credito} 
                  onChange={e => setFormData({...formData, dias_credito: e.target.value})} 
                  readOnly={!puedeEditar}
                />
              </div>
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>Correo Electrónico</label>
              <input 
                className={s.input} 
                type="email" 
                value={formData.correo} 
                onChange={e => setFormData({...formData, correo: e.target.value})} 
                placeholder="correo@proveedor.com"
                readOnly={!puedeEditar}
              />
            </div>

            {puedeEditar && (
              <button type="submit" className={s.btnPrimary} style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Guardando...' : (editId ? 'Actualizar Datos' : 'Registrar Proveedor')}
              </button>
            )}

            {editId && (
              <button 
                type="button" 
                className={s.btnCancel} 
                onClick={resetForm} 
                style={{ width: '100%', marginTop: '10px' }}
              >
                {puedeEditar ? 'Cancelar Edición' : 'Cerrar Vista'}
              </button>
            )}
          </form>
        </aside>

        <div className={s.tableWrapper}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Empresa / Correo</th>
                <th>Contacto / Teléfono</th>
                <th style={{ textAlign: 'center' }}>Crédito</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length > 0 ? (
                proveedores.map(p => (
                  <tr key={p.id} style={{ background: editId === p.id ? '#f0f9ff' : '' }}>
                    <td>
                      <div style={{ fontWeight: '800', color: '#1e293b' }}>{p.nombre_empresa}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{p.correo || 'Sin correo registrado'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>{p.contacto_nombre || '---'}</div>
                      <div style={{ fontSize: '11px', color: '#0369a1' }}>{p.telefono || 'Sin número'}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span 
                        className={s.sectionBadge} 
                        style={{ 
                          background: p.dias_credito > 0 ? '#dcfce7' : '#f1f5f9', 
                          color: p.dias_credito > 0 ? '#166534' : '#64748b' 
                        }}
                      >
                        {p.dias_credito} d
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className={s.btnEdit} onClick={() => prepararEdicion(p)}>
                          {puedeEditar ? 'EDITAR' : 'VER'}
                        </button>
                        {puedeBorrar && (
                          <button className={s.btnDelete} onClick={() => handleDelete(p.id, p.nombre_empresa)}>
                            BORRAR
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
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