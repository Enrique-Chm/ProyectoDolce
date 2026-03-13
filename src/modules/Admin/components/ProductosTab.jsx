// Archivo: src/modules/Admin/components/ProductosTab.jsx
import React, { useState, useEffect } from 'react';
import { productosService } from '../../../services/productos.service'; 
import s from '../AdminPage.module.css';
import { hasPermission } from '../../../utils/checkPermiso';

export const ProductosTab = ({ sucursalId }) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [recetasCosteadas, setRecetasCosteadas] = useState([]);
  const [subrecetasDisponibles, setSubrecetasDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const puedeEditar = hasPermission('editar_productos');
  const puedeBorrar = hasPermission('borrar_registros');

  const [formData, setFormData] = useState({
    nombre: '', 
    categoria: '', 
    precio_venta: '', 
    costo_referencia: 0,
    margen_en_vivo: 0, 
    disponible: true,
    extras: [] 
  });

  useEffect(() => { 
    fetchData(); 
  }, [sucursalId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await productosService.getInitialData(sucursalId);
      setProductos(data.productos || []);
      setCategorias(data.categorias || []);
      
      const principales = data.costosMap.filter(c => 
        data.listaRecetas.some(r => r.nombre === c.nombre && !r.subreceta)
      );
      const subs = data.costosMap.filter(c => 
        data.listaRecetas.some(r => r.nombre === c.nombre && r.subreceta)
      );

      setRecetasCosteadas(principales);
      setSubrecetasDisponibles(subs);
    } catch (error) {
      console.error("Error en fetchData:", error);
    } finally {
      setLoading(false);
    }
  };

  const addExtraField = () => {
    if (!puedeEditar) return;
    setFormData({
      ...formData,
      extras: [...formData.extras, { nombre_subreceta: '', precio_venta_subreceta: '', costo_subreceta: 0, margen_subreceta: 0 }]
    });
  };

  const removeExtraField = (index) => {
    if (!puedeEditar) return;
    const newExtras = formData.extras.filter((_, i) => i !== index);
    setFormData({ ...formData, extras: newExtras });
  };

  const updateExtraField = (index, field, value) => {
    if (!puedeEditar) return;
    const newExtras = [...formData.extras];
    newExtras[index][field] = value;

    if (field === 'nombre_subreceta') {
      const sub = subrecetasDisponibles.find(s => s.nombre === value);
      newExtras[index].costo_subreceta = sub ? sub.costo_final : 0;
    }

    const costo = parseFloat(newExtras[index].costo_subreceta) || 0;
    const venta = parseFloat(newExtras[index].precio_venta_subreceta) || 0;
    newExtras[index].margen_subreceta = venta > 0 ? (((venta - costo) / venta) * 100).toFixed(1) : 0;

    setFormData({ ...formData, extras: newExtras });
  };

  useEffect(() => {
    const costoP = parseFloat(formData.costo_referencia) || 0;
    const ventaP = parseFloat(formData.precio_venta) || 0;
    const margenP = ventaP > 0 ? (((ventaP - costoP) / ventaP) * 100).toFixed(1) : 0;

    setFormData(prev => ({ ...prev, margen_en_vivo: margenP }));
  }, [formData.precio_venta, formData.costo_referencia]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeEditar) return;
    setLoading(true);

    const payload = {
      nombre: formData.nombre,
      categoria: parseInt(formData.categoria),
      precio_venta: parseFloat(formData.precio_venta),
      disponible: formData.disponible,
      extras: formData.extras,
      sucursal_id: sucursalId
    };

    const { error } = await productosService.saveProducto(payload, editId);
    if (error) alert("Error: " + error.message);
    else { resetForm(); fetchData(); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!puedeBorrar) return;
    if (window.confirm("¿Eliminar este producto?")) {
      const { error } = await productosService.deleteProducto(id);
      if (!error) fetchData();
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({ nombre: '', categoria: '', precio_venta: '', costo_referencia: 0, margen_en_vivo: 0, extras: [], disponible: true });
  };

  const handleEdit = (p) => {
    const costoPrincipal = recetasCosteadas.find(r => r.nombre === p.nombre)?.costo_final || 0;
    setEditId(p.id);
    setFormData({
      ...p,
      costo_referencia: costoPrincipal,
      extras: Array.isArray(p.extras) ? p.extras : []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)', margin: 0 }}>
          Estrategia de Precios (Menú)
        </h2>
        {loading && <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '700' }}>ACTUALIZANDO...</span>}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '25px', alignItems: 'start' }}>
        
        {/* PANEL DE CONFIGURACIÓN DE PRODUCTO */}
        <aside className={s.adminCard} style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
            {editId ? '📝 Ajustar Producto' : '🍴 Nuevo Producto'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>RECETA PRINCIPAL</label>
              <select 
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                value={formData.nombre} 
                onChange={e => {
                  const rec = recetasCosteadas.find(r => r.nombre === e.target.value);
                  setFormData({...formData, nombre: e.target.value, costo_referencia: rec ? rec.costo_final : 0});
                }} 
                required disabled={!puedeEditar}
              >
                <option value="">-- Elige la receta --</option>
                {recetasCosteadas.map(r => (
                  <option key={r.nombre} value={r.nombre}>{r.nombre} (${r.costo_final.toFixed(2)})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>PRECIO VENTA ($)</label>
                <input 
                  type="number" step="0.01" 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                  value={formData.precio_venta} 
                  onChange={e => setFormData({...formData, precio_venta: e.target.value})} 
                  required readOnly={!puedeEditar} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>MARGEN %</label>
                <div style={{ 
                  padding: '10px', 
                  borderRadius: 'var(--radius-ui)', 
                  background: 'var(--color-bg-app)', 
                  fontWeight: '900', 
                  textAlign: 'center',
                  color: formData.margen_en_vivo > 60 ? 'var(--color-success)' : 'var(--color-danger)'
                }}>
                  {formData.margen_en_vivo}%
                </div>
              </div>
            </div>

            {/* SECCIÓN DE EXTRAS */}
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)' }}>EXTRAS / COMPLEMENTOS</label>
                {puedeEditar && (
                  <button type="button" onClick={addExtraField} className={s.btnLogout} style={{ padding: '2px 8px', fontSize: '10px' }}>+ AGREGAR</button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {formData.extras.map((ex, idx) => (
                  <div key={idx} style={{ padding: '12px', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', position: 'relative' }}>
                    {puedeEditar && (
                      <button 
                        type="button" 
                        style={{ position: 'absolute', top: '-8px', right: '-8px', border: 'none', background: 'var(--color-danger)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px' }}
                        onClick={() => removeExtraField(idx)}
                      >
                        ✕
                      </button>
                    )}
                    <select 
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', marginBottom: '8px', fontSize: '12px' }}
                      value={ex.nombre_subreceta} 
                      onChange={e => updateExtraField(idx, 'nombre_subreceta', e.target.value)} 
                      required disabled={!puedeEditar}
                    >
                      <option value="">-- Elige el extra --</option>
                      {subrecetasDisponibles.map(n => (
                        <option key={n.nombre} value={n.nombre}>{n.nombre} (${n.costo_final.toFixed(2)})</option>
                      ))}
                    </select>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input 
                        type="number" step="0.01" 
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '12px' }}
                        placeholder="Precio Venta" 
                        value={ex.precio_venta_subreceta} 
                        onChange={e => updateExtraField(idx, 'precio_venta_subreceta', e.target.value)} 
                        required readOnly={!puedeEditar} 
                      />
                      <div style={{ fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ex.margen_subreceta > 50 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {ex.margen_subreceta}% Margen
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>CATEGORÍA EN MENÚ</label>
              <select 
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                value={formData.categoria} 
                onChange={e => setFormData({...formData, categoria: e.target.value})} 
                required disabled={!puedeEditar}
              >
                <option value="">Seleccionar...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              {puedeEditar && (
                <button 
                  type="submit" 
                  className={s.btnLogout} 
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', flex: 1, padding: '12px' }} 
                  disabled={loading}
                >
                  {loading ? '...' : (editId ? 'ACTUALIZAR' : 'GUARDAR EN MENÚ')}
                </button>
              )}
              {editId && (
                <button type="button" onClick={resetForm} className={s.btnLogout}>
                  CANCELAR
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* TABLA DE PRODUCTOS Y ESTRATEGIA */}
        <div className={s.adminCard} style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>PRODUCTO / EXTRAS</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>COSTO BASE</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>VENTA / MARGEN</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    No hay productos en este menú local.
                  </td>
                </tr>
              ) : (
                productos.map(p => {
                  const costoBase = p.costo_actual || 0;
                  const ventaBase = p.precio_venta || 0;
                  const margenBase = ventaBase > 0 ? (((ventaBase - costoBase) / ventaBase) * 100).toFixed(1) : 0;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-bg-muted)', backgroundColor: editId === p.id ? 'var(--color-bg-app)' : 'transparent' }}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '800', color: 'var(--color-text-main)' }}>{p.nombre}</div>
                        {p.extras?.map((ex, i) => (
                          <div key={i} style={{ fontSize: '10px', display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: 'var(--color-text-muted)' }}>
                            <span>+ {ex.nombre_subreceta}</span>
                            <span style={{ fontWeight: '800', color: ex.margen_subreceta > 50 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                              ${parseFloat(ex.precio_venta_subreceta).toFixed(2)} ({ex.margen_subreceta}%)
                            </span>
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '800' }}>${costoBase.toFixed(2)}</div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '900', color: 'var(--color-primary)' }}>${ventaBase.toFixed(2)}</div>
                        <div style={{ fontSize: '11px', color: margenBase > 50 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: '800' }}>
                          {margenBase}% margen
                        </div>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                          <button 
                            className={s.btnLogout} 
                            style={{ padding: '5px 10px', fontSize: '11px' }}
                            onClick={() => handleEdit(p)}
                          >
                            {puedeEditar ? 'EDITAR' : 'VER'}
                          </button>
                          {puedeBorrar && (
                            <button 
                              className={s.btnLogout} 
                              style={{ padding: '5px 10px', fontSize: '11px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                              onClick={() => handleDelete(p.id)}
                            >
                              BORRAR
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};