// Archivo: src/modules/Admin/components/ProveedoresTab.jsx
import React, { useState, useEffect } from 'react';
import { proveedoresService } from '../../../services/Proveedores.service';
import s from '../AdminPage.module.css';
import { hasPermission } from '../../../utils/checkPermiso';

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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)', margin: 0 }}>
          Directorio de Proveedores
        </h2>
        {loading && <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '700' }}>CARGANDO...</span>}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '25px', alignItems: 'start' }}>
        
        {/* PANEL DE REGISTRO / EDICIÓN */}
        <aside className={s.adminCard} style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
            {editId ? '📝 Editar Proveedor' : '🏢 Nuevo Proveedor'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE DE LA EMPRESA</label>
              <input 
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                value={formData.nombre_empresa} 
                onChange={e => setFormData({...formData, nombre_empresa: e.target.value})} 
                required 
                placeholder="Nombre comercial"
                readOnly={!puedeEditar}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE DEL CONTACTO</label>
              <input 
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                value={formData.contacto_nombre} 
                onChange={e => setFormData({...formData, contacto_nombre: e.target.value})} 
                placeholder="Persona de ventas/atención"
                readOnly={!puedeEditar}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>TELÉFONO</label>
                <input 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                  value={formData.telefono} 
                  onChange={e => setFormData({...formData, telefono: e.target.value})} 
                  placeholder="WhatsApp/Oficina"
                  readOnly={!puedeEditar}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>DÍAS CRÉDITO</label>
                <input 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                  type="number" 
                  value={formData.dias_credito} 
                  onChange={e => setFormData({...formData, dias_credito: e.target.value})} 
                  readOnly={!puedeEditar}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>CORREO ELECTRÓNICO</label>
              <input 
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                type="email" 
                value={formData.correo} 
                onChange={e => setFormData({...formData, correo: e.target.value})} 
                placeholder="correo@proveedor.com"
                readOnly={!puedeEditar}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {puedeEditar && (
                <button 
                  type="submit" 
                  className={s.btnLogout} 
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '12px' }} 
                  disabled={loading}
                >
                  {loading ? '...' : (editId ? 'ACTUALIZAR DATOS' : 'REGISTRAR PROVEEDOR')}
                </button>
              )}

              {editId && (
                <button 
                  type="button" 
                  className={s.btnLogout} 
                  onClick={resetForm} 
                >
                  {puedeEditar ? 'CANCELAR EDICIÓN' : 'CERRAR VISTA'}
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* TABLA DE PROVEEDORES */}
        <div className={s.adminCard} style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>EMPRESA / CORREO</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>CONTACTO / TELÉFONO</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center' }}>CRÉDITO</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length > 0 ? (
                proveedores.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-bg-muted)', backgroundColor: editId === p.id ? 'var(--color-bg-app)' : 'transparent' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '800', color: 'var(--color-text-main)' }}>{p.nombre_empresa}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{p.correo || 'Sin correo registrado'}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{p.contacto_nombre || '---'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '700' }}>{p.telefono || 'Sin número'}</div>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span 
                        style={{ 
                          fontSize: '10px', 
                          fontWeight: '800', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          background: p.dias_credito > 0 ? 'var(--color-bg-app)' : 'transparent', 
                          color: p.dias_credito > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        {p.dias_credito} d
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                        <button 
                          className={s.btnLogout} 
                          style={{ padding: '5px 10px', fontSize: '11px' }}
                          onClick={() => prepararEdicion(p)}
                        >
                          {puedeEditar ? 'EDITAR' : 'VER'}
                        </button>
                        {puedeBorrar && (
                          <button 
                            className={s.btnLogout} 
                            style={{ padding: '5px 10px', fontSize: '11px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                            onClick={() => handleDelete(p.id, p.nombre_empresa)}
                          >
                            BORRAR
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
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