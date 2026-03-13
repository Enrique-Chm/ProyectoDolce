// Archivo: src/modules/Admin/components/RecetasTab.jsx
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

  const puedeEditar = hasPermission('editar_recetas');
  const puedeBorrar = hasPermission('borrar_registros');

  useEffect(() => { 
    fetchData(); 
  }, [sucursalId]);

  const fetchData = async () => {
    try {
      setLoading(true);
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

    const rows = ingredientes.map(ing => ({
      nombre: nombreReceta,
      subreceta: isSubreceta,
      insumo: parseInt(ing.insumo_id),
      cantidad: parseFloat(ing.cantidad),
      unidad_medida: parseInt(ing.unidad_id),
      sucursal_id: sucursalId 
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)', margin: 0 }}>
          Ingeniería de Recetas
        </h2>
        {loading && <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '700' }}>SINCRONIZANDO...</span>}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '25px', alignItems: 'start' }}>
        
        {/* FORMULARIO DE EDICIÓN (SIDEBAR) */}
        <aside className={s.adminCard} style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
            {isEditing ? '📝 Editando Receta' : '🍳 Nueva Preparación'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>NOMBRE DE LA PREPARACIÓN</label>
              <input 
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)' }}
                value={nombreReceta} 
                onChange={e => setNombreReceta(e.target.value)} 
                required 
                disabled={isEditing || !puedeEditar} 
                placeholder="Ej. Salsa Roja Especial"
              />
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              <input 
                type="checkbox" 
                checked={isSubreceta} 
                onChange={e => setIsSubreceta(e.target.checked)} 
                disabled={!puedeEditar}
              />
              ¿Es Sub-receta? <small style={{ fontWeight: '400', color: 'var(--color-text-muted)' }}>(Insumo para otra receta)</small>
            </label>
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '10px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ingredientes.map((ing, idx) => {
                const selectedInsumo = insumos.find(i => i.id === parseInt(ing.insumo_id));
                const costoFilaVivo = ( (selectedInsumo?.costo_unitario || 0) * (parseFloat(ing.cantidad) || 0) ).toFixed(2);

                return (
                  <div key={idx} style={{ padding: '15px', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', position: 'relative' }}>
                    
                    {puedeEditar && (
                      <button 
                        type="button" 
                        style={{ position: 'absolute', top: '10px', right: '10px', border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', fontWeight: '800' }}
                        onClick={() => removeIngrediente(idx)}
                      >
                        ✕
                      </button>
                    )}

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '4px' }}>INGREDIENTE</label>
                      <select 
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '13px', backgroundColor: 'white' }}
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
                        <option value="">Seleccionar...</option>
                        {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '4px' }}>CANTIDAD</label>
                        <input 
                          type="number" step="0.001" 
                          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '13px' }}
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
                      <div style={{ 
                        padding: '8px', borderRadius: '4px', background: 'var(--color-bg-app)', border: '1px solid var(--color-border)', 
                        fontSize: '13px', textAlign: 'center', fontWeight: '800', color: 'var(--color-text-muted)'
                      }}>
                        {unidades.find(u => u.id === parseInt(ing.unidad_id))?.abreviatura || 'U.M.'}
                      </div>
                    </div>

                    <div style={{ marginTop: '8px', textAlign: 'right', fontSize: '11px', fontWeight: '800', color: 'var(--color-primary)' }}>
                      COSTO LÍNEA: ${costoFilaVivo}
                    </div>
                  </div>
                );
              })}
            </div>

            {puedeEditar && (
              <button 
                type="button" 
                onClick={() => setIngredientes([...ingredientes, { insumo_id: '', cantidad: '', unidad_id: '' }])} 
                className={s.btnLogout} 
                style={{ width: '100%', borderStyle: 'dashed', color: 'var(--color-primary)' }}
              >
                + AÑADIR INGREDIENTE
              </button>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {puedeEditar && (
                <button 
                  type="submit" 
                  className={s.btnLogout} 
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '12px' }} 
                  disabled={loading}
                >
                  {loading ? '...' : (isEditing ? 'ACTUALIZAR RECETA' : 'GUARDAR RECETA')}
                </button>
              )}

              {isEditing && (
                <button type="button" className={s.btnLogout} onClick={resetForm}>
                  CANCELAR EDICIÓN
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* TABLA DE RECETAS (DERECHA) */}
        <div className={s.adminCard} style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>PREPARACIÓN</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>COMPOSICIÓN</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>COSTO TOTAL</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {recetasAgrupadas.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    No hay recetas registradas para esta sucursal.
                  </td>
                </tr>
              ) : (
                recetasAgrupadas.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-bg-muted)' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '800', color: 'var(--color-text-main)' }}>{r.nombre}</div>
                      {r.subreceta && (
                        <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--color-bg-app)', color: 'var(--color-primary)', marginTop: '4px', display: 'inline-block' }}>
                          SUB-RECETA
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {r.detalle_ingredientes.map((ing, iidx) => (
                          <div key={iidx} style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            • {ing.insumo}: <strong>{ing.cantidad} {ing.unidad}</strong> 
                            <span style={{ color: 'var(--color-primary)', marginLeft: '5px' }}> (${ing.costo_fila.toFixed(2)})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <div style={{ fontWeight: '900', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
                        ${r.costo_total_receta?.toFixed(2)}
                      </div>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                        <button 
                          className={s.btnLogout} 
                          style={{ padding: '5px 10px', fontSize: '11px' }}
                          onClick={() => handleEdit(r)}
                        >
                          {puedeEditar ? 'EDITAR' : 'VER'}
                        </button>
                        {puedeBorrar && (
                          <button 
                            className={s.btnLogout} 
                            style={{ padding: '5px 10px', fontSize: '11px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                            onClick={() => handleDeleteReceta(r.nombre)}
                          >
                            BORRAR
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
    </div>
  );
};