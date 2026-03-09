import React, { useState, useEffect } from 'react';
import { recetasService } from '../../../services/Recetas.service'; 
import s from '../AdminPage.module.css';
import { hasPermission } from '../../../utils/checkPermiso';

export const RecetasTab = ({ sucursalId }) => {
  const [recetasAgrupadas, setRecetasAgrupadas] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [nombreReceta, setNombreReceta] = useState('');
  const [isSubreceta, setIsSubreceta] = useState(false);
  const [ingredientes, setIngredientes] = useState([{ insumo_id: '', cantidad: '', unidad_id: '' }]);

  // Verificación de facultades
  const puedeEditar = hasPermission('editar_recetas');
  const puedeBorrar = hasPermission('borrar_registros');

  // Recargar datos cada vez que cambie la sucursal en el selector global
  useEffect(() => { 
    fetchData(); 
  }, [sucursalId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Pasamos sucursalId al servicio para filtrar insumos y recetas de este local
      const data = await recetasService.getInitialData(sucursalId);
      setRecetasAgrupadas(data.recetasAgrupadas || []);
      setInsumos(data.insumos || []);
      setUnidades(data.unidades || []);
    } catch (error) {
      console.error("Error al cargar RecetasTab:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeIngrediente = (index) => {
    if (!puedeEditar) return;
    if (ingredientes.length > 1) {
      const newIngs = ingredientes.filter((_, i) => i !== index);
      setIngredientes(newIngs);
    } else {
      setIngredientes([{ insumo_id: '', cantidad: '', unidad_id: '' }]);
    }
  };

  const resetForm = () => {
    setNombreReceta('');
    setIsSubreceta(false);
    setIngredientes([{ insumo_id: '', cantidad: '', unidad_id: '' }]);
    setIsEditing(false);
  };

  const handleEdit = (receta) => {
    setIsEditing(true);
    setNombreReceta(receta.nombre);
    setIsSubreceta(receta.subreceta);
    const ingsMapeados = receta.detalle_ingredientes.map(ing => {
      const insumoEncontrado = insumos.find(i => i.nombre === ing.insumo);
      const unidadEncontrada = unidades.find(u => u.abreviatura === ing.unidad);
      return {
        insumo_id: insumoEncontrado ? insumoEncontrado.id : '',
        cantidad: ing.cantidad,
        unidad_id: unidadEncontrada ? unidadEncontrada.id : ''
      };
    });
    setIngredientes(ingsMapeados);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeEditar) return;
    setLoading(true);

    // Mapeamos los ingredientes incluyendo el sucursalId en cada fila
    const rows = ingredientes.map(ing => ({
      nombre: nombreReceta,
      subreceta: isSubreceta,
      insumo: parseInt(ing.insumo_id),
      cantidad: parseFloat(ing.cantidad),
      unidad_medida: parseInt(ing.unidad_id),
      sucursal_id: sucursalId // VINCULACIÓN: Sello de sucursal
    }));

    const { error } = await recetasService.saveReceta(rows, nombreReceta, isEditing);

    if (error) alert(error.message);
    else { resetForm(); fetchData(); }
    setLoading(false);
  };

  const handleDeleteReceta = async (nombre) => {
    if (!puedeBorrar) return;
    if (window.confirm(`¿Eliminar receta "${nombre}"?`)) {
      const { error } = await recetasService.deleteReceta(nombre);
      if (error) alert(error.message);
      else fetchData();
    }
  };

  return (
    <div className={s.pageWrapper} style={{ padding: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className={s.sectionTitle}>Ingeniería de Recetas</h2>
        {loading && <span className={s.textMuted} style={{ fontSize: '12px' }}>Sincronizando local...</span>}
      </header>
      
      <div className={s.container}>
        <aside className={s.card}>
          <div className={s.cardHeader}>
            <h3 className={s.cardTitle}>{isEditing ? 'Editando' : 'Nueva'} Receta</h3>
          </div>
          <form className={s.cardBody} onSubmit={handleSubmit}>
            <div className={s.formGroup}>
              <label className={s.label}>Nombre de la Preparación</label>
              <input 
                className={s.input} 
                value={nombreReceta} 
                onChange={e => setNombreReceta(e.target.value)} 
                required 
                disabled={isEditing || !puedeEditar} 
                placeholder="Ej. Salsa Roja Especial"
              />
            </div>
            
            <div className={s.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                checked={isSubreceta} 
                onChange={e => setIsSubreceta(e.target.checked)} 
                disabled={!puedeEditar}
              />
              <label className={s.label} style={{ marginBottom: 0 }}>¿Es Sub-receta? (Ingrediente para otra receta)</label>
            </div>
            
            <hr style={{ margin: '1.5rem 0', opacity: 0.1 }} />

            {ingredientes.map((ing, idx) => {
              const selectedInsumo = insumos.find(i => i.id === parseInt(ing.insumo_id));
              const costoFilaVivo = ( (selectedInsumo?.costo_unitario || 0) * (parseFloat(ing.cantidad) || 0) ).toFixed(2);

              return (
                <div key={idx} style={{ marginBottom: '1rem', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', position: 'relative' }}>
                  
                  {puedeEditar && (
                    <button 
                      type="button" 
                      className={s.btnRemoveRow} 
                      onClick={() => removeIngrediente(idx)}
                      title="Eliminar fila"
                    >
                      ✕
                    </button>
                  )}

                  <label className={s.label}>Insumo (Stock Local)</label>
                  <select 
                    className={s.input} 
                    value={ing.insumo_id} 
                    onChange={e => {
                      const selectedId = e.target.value;
                      const n = [...ingredientes];
                      const insumoData = insumos.find(i => i.id === parseInt(selectedId));
                      n[idx].insumo_id = selectedId;
                      if (insumoData) n[idx].unidad_id = insumoData.unidad_medida || ''; 
                      setIngredientes(n);
                    }} 
                    required
                    disabled={!puedeEditar}
                  >
                    <option value="">Seleccionar ingrediente...</option>
                    {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                  </select>

                  <div className={s.grid2} style={{ marginTop: '8px' }}>
                    <div>
                      <label className={s.label}>Cant.</label>
                      <input 
                        type="number" 
                        step="0.001" 
                        className={s.input} 
                        value={ing.cantidad} 
                        onChange={e => {
                          const n = [...ingredientes]; 
                          n[idx].cantidad = e.target.value; 
                          setIngredientes(n);
                        }} 
                        required 
                        readOnly={!puedeEditar}
                      />
                    </div>
                    <div>
                      <label className={s.label}>Unidad</label>
                      <select 
                        className={s.input} 
                        value={ing.unidad_id} 
                        disabled 
                        style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                      >
                        <option value="">...</option>
                        {unidades.map(u => <option key={u.id} value={u.id}>{u.abreviatura}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '8px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', color: '#005696' }}>
                    Costo de línea: ${costoFilaVivo}
                  </div>
                </div>
              );
            })}

            {puedeEditar && (
              <button 
                type="button" 
                onClick={() => setIngredientes([...ingredientes, { insumo_id: '', cantidad: '', unidad_id: '' }])} 
                className={s.btnEdit} 
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                + Añadir Ingrediente
              </button>
            )}

            {puedeEditar && (
              <button 
                type="submit" 
                className={s.btnPrimary} 
                style={{ width: '100%' }} 
                disabled={loading}
              >
                {loading ? 'Guardando...' : (isEditing ? 'Actualizar Receta' : 'Guardar Receta')}
              </button>
            )}

            {isEditing && (
              <button 
                type="button" 
                className={s.btnCancel} 
                onClick={resetForm} 
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                Cancelar Edición
              </button>
            )}
          </form>
        </aside>

        <div className={s.tableWrapper}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Preparación</th>
                <th>Composición</th>
                <th style={{ textAlign: 'right' }}>Costo Actual</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recetasAgrupadas.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No hay recetas registradas para esta sucursal.
                  </td>
                </tr>
              ) : (
                recetasAgrupadas.map((r, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ fontWeight: '800' }}>{r.nombre}</div>
                      {r.subreceta && <span className={s.sectionBadge} style={{fontSize: '9px'}}>SUB-RECETA</span>}
                    </td>
                    <td>
                      {r.detalle_ingredientes.map((ing, iidx) => (
                        <div key={iidx} className={s.textMuted} style={{ fontSize: '11px' }}>
                          • {ing.insumo}: {ing.cantidad} {ing.unidad} 
                          <span style={{ fontWeight: 'bold', color: '#005696' }}> (${ing.costo_fila.toFixed(2)})</span>
                        </div>
                      ))}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={s.priceTag}>${r.costo_total_receta?.toFixed(2)}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className={s.btnEdit} onClick={() => handleEdit(r)}>
                        {puedeEditar ? 'EDITAR' : 'VER'}
                      </button>
                      {puedeBorrar && (
                        <button className={s.btnDelete} onClick={() => handleDeleteReceta(r.nombre)}>BORRAR</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};