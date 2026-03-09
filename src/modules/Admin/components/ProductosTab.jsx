import React, { useState, useEffect } from 'react';
import { productosService } from '../../../services/productos.service'; 
import s from '../AdminPage.module.css';
import { hasPermission } from '../../../utils/checkPermiso';

// Recibimos sucursalId como prop
export const ProductosTab = ({ sucursalId }) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [recetasCosteadas, setRecetasCosteadas] = useState([]);
  const [subrecetasDisponibles, setSubrecetasDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // Verificación de facultades
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

  // Re-cargar datos cada vez que cambie la sucursal seleccionada
  useEffect(() => { 
    fetchData(); 
  }, [sucursalId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Pasamos sucursalId al servicio para que filtre desde el origen
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

  // --- LÓGICA DE EXTRAS ---
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

  // Margen del producto principal en vivo
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
      sucursal_id: sucursalId // VINCULACIÓN: Guardamos en la sucursal activa
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
    <div className={s.pageWrapper} style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className={s.sectionTitle}>Estrategia de Precios (Menú)</h2>
        {loading && <span className={s.textMuted} style={{ fontSize: '12px' }}>Actualizando sucursal...</span>}
      </header>
      
      <div className={s.container}>
        <aside className={s.card}>
          <div className={s.cardHeader}>
            <h3 className={s.cardTitle}>{editId ? 'Ajustar Producto' : 'Nuevo Producto'}</h3>
          </div>
          <form className={s.cardBody} onSubmit={handleSubmit}>
            <div className={s.formGroup}>
              <label className={s.label}>Receta Principal ({sucursalId === 1 ? 'Matriz' : 'Sucursal'})</label>
              <select className={s.input} value={formData.nombre} onChange={e => {
                  const rec = recetasCosteadas.find(r => r.nombre === e.target.value);
                  setFormData({...formData, nombre: e.target.value, costo_referencia: rec ? rec.costo_final : 0});
                }} required disabled={!puedeEditar}>
                <option value="">-- Elige la receta --</option>
                {recetasCosteadas.map(r => (
                  <option key={r.nombre} value={r.nombre}>{r.nombre} (${r.costo_final.toFixed(2)})</option>
                ))}
              </select>
            </div>

            <div className={s.grid2}>
              <div className={s.formGroup}>
                <label className={s.label}>Precio Venta ($)</label>
                <input type="number" step="0.01" className={s.input} value={formData.precio_venta} onChange={e => setFormData({...formData, precio_venta: e.target.value})} required readOnly={!puedeEditar} />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>Margen %</label>
                <div className={s.input} style={{ background: '#f8fafc', fontWeight: '800', color: formData.margen_en_vivo > 60 ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center' }}>
                  {formData.margen_en_vivo}%
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Acompañamientos / Extras
                {puedeEditar && <button type="button" onClick={addExtraField} className={s.btnEdit} style={{ fontSize: '10px', padding: '4px 8px' }}>+ Agregar</button>}
              </label>

              {formData.extras.map((ex, idx) => (
                <div key={idx} style={{ marginTop: '10px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', position: 'relative' }}>
                  {puedeEditar && <button type="button" className={s.btnRemoveRow} onClick={() => removeExtraField(idx)}>✕</button>}
                  <select className={s.input} value={ex.nombre_subreceta} onChange={e => updateExtraField(idx, 'nombre_subreceta', e.target.value)} required disabled={!puedeEditar}>
                    <option value="">-- Elige el extra --</option>
                    {subrecetasDisponibles.map(n => (
                      <option key={n.nombre} value={n.nombre}>{n.nombre} (${n.costo_final.toFixed(2)})</option>
                    ))}
                  </select>
                  <div className={s.grid2} style={{ marginTop: '8px' }}>
                    <input type="number" step="0.01" className={s.input} placeholder="Precio Venta" value={ex.precio_venta_subreceta} onChange={e => updateExtraField(idx, 'precio_venta_subreceta', e.target.value)} required readOnly={!puedeEditar} />
                    <div className={s.input} style={{fontWeight: '800', background: '#fff', color: ex.margen_subreceta > 50 ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center'}}>{ex.margen_subreceta}% Margen</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>Categoría</label>
              <select className={s.input} value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} required disabled={!puedeEditar}>
                <option value="">Seleccionar...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            {puedeEditar && (
              <button type="submit" className={s.btnPrimary} style={{ width: '100%' }} disabled={loading}>{loading ? 'Guardando...' : (editId ? 'Actualizar' : 'Guardar en Menú')}</button>
            )}
            {editId && <button type="button" onClick={resetForm} className={s.btnCancel}>Cancelar</button>}
          </form>
        </aside>

        <div className={s.tableWrapper}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Producto / Extras</th>
                <th>Costo Base</th>
                <th>Venta / Margen</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No hay productos en este menú local.</td></tr>
              ) : productos.map(p => {
                const costoBase = p.costo_actual || 0;
                const ventaBase = p.precio_venta || 0;
                const margenBase = ventaBase > 0 ? (((ventaBase - costoBase) / ventaBase) * 100).toFixed(1) : 0;

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: '800' }}>{p.nombre}</div>
                      {p.extras?.map((ex, i) => (
                        <div key={i} className={s.textMuted} style={{fontSize: '10px', display: 'flex', justifyContent: 'space-between', marginTop: '2px'}}>
                          <span>+ {ex.nombre_subreceta}</span>
                          <span style={{fontWeight: 'bold', color: ex.margen_subreceta > 50 ? '#16a34a' : '#dc2626', marginLeft: '8px'}}>
                            ${parseFloat(ex.precio_venta_subreceta).toFixed(2)} ({ex.margen_subreceta}%)
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className={s.priceTag}>${costoBase.toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontWeight: 'bold' }}>${ventaBase.toFixed(2)}</div>
                        <span style={{ fontSize: '11px', color: margenBase > 50 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{margenBase}% margen</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className={s.btnEdit} onClick={() => handleEdit(p)}>
                        {puedeEditar ? 'EDITAR' : 'VER'}
                      </button>
                      {puedeBorrar && <button className={s.btnDelete} onClick={() => handleDelete(p.id)}>BORRAR</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};