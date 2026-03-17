// Archivo: src/modules/Admin/components/ProductosTab.jsx
import React, { useState, useEffect } from 'react';
import { productosService } from '../../../services/productos.service'; 
import s from '../AdminPage.module.css';
import { hasPermission } from '../../../utils/checkPermiso';
import { IVA_FACTOR } from '../../../utils/taxConstants'; 

export const ProductosTab = ({ sucursalId }) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [recetasCosteadas, setRecetasCosteadas] = useState([]);
  const [subrecetasDisponibles, setSubrecetasDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // 🛡️ SEGURIDAD INTERNA (RBAC)
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
    const ventaOriginal = parseFloat(newExtras[index].precio_venta_subreceta) || 0;
    
    // CÁLCULO MARGEN EXTRA (POST-IVA)
    const ventaNeta = ventaOriginal / IVA_FACTOR;
    newExtras[index].margen_subreceta = ventaNeta > 0 
      ? (((ventaNeta - costo) / ventaNeta) * 100).toFixed(1) 
      : 0;

    setFormData({ ...formData, extras: newExtras });
  };

  // EFECTO PARA CALCULAR MARGEN EN VIVO (POST-IVA)
  useEffect(() => {
    const costoP = parseFloat(formData.costo_referencia) || 0;
    const ventaBruta = parseFloat(formData.precio_venta) || 0;
    
    const ventaNeta = ventaBruta / IVA_FACTOR;
    const margenP = ventaNeta > 0 
      ? (((ventaNeta - costoP) / ventaNeta) * 100).toFixed(1) 
      : 0;

    setFormData(prev => ({ ...prev, margen_en_vivo: margenP }));
  }, [formData.precio_venta, formData.costo_referencia]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeEditar) return;

    if (!formData.nombre) return alert("Por favor selecciona una Receta Principal.");
    if (!formData.categoria) return alert("Por favor selecciona una Categoría.");
    const extrasIncompletos = formData.extras.some(ex => !ex.nombre_subreceta);
    if (extrasIncompletos) return alert("Por favor selecciona la sub-receta en todos los extras agregados.");

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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)', margin: 0 }}>
          Estrategia de Precios (Menú)
        </h2>
        {loading && <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '700' }}>ACTUALIZANDO...</span>}
      </header>

      <div className="admin-split-layout-sidebar">
        
        {/* LADO IZQUIERDO: FORMULARIO PROTEGIDO */}
        <aside className={s.adminCard} style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-primary)' }}>
            {editId ? (puedeEditar ? '📝 Ajustar Producto' : '🔍 Consulta de Producto') : '🍴 Nuevo Producto'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>RECETA PRINCIPAL</label>
              
              <SearchableSelect 
                options={recetasCosteadas}
                value={formData.nombre}
                valueKey="nombre"
                labelKey="nombre"
                placeholder="Buscar receta..."
                formatLabel={(opt) => `${opt.nombre} ($${opt.costo_final.toFixed(2)})`}
                disabled={!puedeEditar} // 🛡️ Bloqueo visual
                onChange={(selectedValue) => {
                  const rec = recetasCosteadas.find(r => r.nombre === selectedValue);
                  setFormData({...formData, nombre: selectedValue, costo_referencia: rec ? rec.costo_final : 0});
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>PRECIO PÚBLICO ($)</label>
                <input 
                  type="number" step="0.01" 
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box', fontWeight: '800' }}
                  value={formData.precio_venta} 
                  onChange={e => setFormData({...formData, precio_venta: e.target.value})} 
                  required readOnly={!puedeEditar} // 🛡️ Bloqueo escritura
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>MARGEN NETO %</label>
                <div style={{ 
                  padding: '12px', 
                  borderRadius: 'var(--radius-ui)', 
                  background: 'var(--color-bg-app)', 
                  fontWeight: '900', 
                  textAlign: 'center',
                  color: formData.margen_en_vivo > 55 ? 'var(--color-success)' : 'var(--color-danger)',
                  border: '1px solid var(--color-border)'
                }}>
                  {formData.margen_en_vivo}%
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)' }}>EXTRAS / COMPLEMENTOS</label>
                {puedeEditar && (
                  <button type="button" onClick={addExtraField} className={s.btnLogout} style={{ padding: '6px 15px', fontSize: '10px' }}>+ AGREGAR</button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {formData.extras.map((ex, idx) => (
                  <div key={idx} style={{ padding: '15px', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', position: 'relative' }}>
                    {puedeEditar && (
                      <button 
                        type="button" 
                        style={{ position: 'absolute', top: '-10px', right: '-10px', border: 'none', background: 'var(--color-danger)', color: 'white', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                        onClick={() => removeExtraField(idx)}
                      >✕</button>
                    )}
                    
                    <div style={{ marginBottom: '10px' }}>
                      <SearchableSelect 
                        options={subrecetasDisponibles}
                        value={ex.nombre_subreceta}
                        valueKey="nombre"
                        labelKey="nombre"
                        placeholder="Buscar sub-receta..."
                        formatLabel={(opt) => `${opt.nombre} ($${opt.costo_final.toFixed(2)})`}
                        disabled={!puedeEditar}
                        onChange={(val) => updateExtraField(idx, 'nombre_subreceta', val)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input 
                        type="number" step="0.01" 
                        style={{ padding: '10px', borderRadius: 'var(--radius-ui)', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                        placeholder="Precio Venta" 
                        value={ex.precio_venta_subreceta} 
                        onChange={e => updateExtraField(idx, 'precio_venta_subreceta', e.target.value)} 
                        required readOnly={!puedeEditar} 
                      />
                      <div style={{ fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ex.margen_subreceta > 50 ? 'var(--color-success)' : 'var(--color-danger)', background: 'white', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                        {ex.margen_subreceta}% NETO
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '5px' }}>CATEGORÍA EN MENÚ</label>
              <SearchableSelect 
                options={categorias}
                value={formData.categoria}
                valueKey="id"
                labelKey="nombre"
                placeholder="Seleccionar categoría..."
                disabled={!puedeEditar}
                onChange={(val) => setFormData({...formData, categoria: val})}
              />
            </div>

            {puedeEditar && (
              <button 
                type="submit" 
                className={s.btnLogout} 
                style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '16px', fontWeight: '800', marginTop: '10px' }} 
                disabled={loading}
              >
                {loading ? '...' : (editId ? 'ACTUALIZAR ESTRATEGIA' : 'GUARDAR EN MENÚ')}
              </button>
            )}
            
            {!puedeEditar && editId && (
              <button type="button" onClick={resetForm} className={s.btnLogout} style={{ width: '100%', padding: '12px' }}>CERRAR DETALLE</button>
            )}
          </form>
        </aside>

        {/* TABLA DE PRODUCTOS */}
        <div className={s.adminCard} style={{ padding: '0', overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
            <thead style={{ backgroundColor: 'var(--color-bg-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <tr>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>PRODUCTO</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>COSTO</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)' }}>VENTA (CON IVA)</th>
                <th style={{ padding: '15px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => {
                const costoBase = p.costo_actual || 0;
                const ventaBase = p.precio_venta || 0;
                const netoBase = ventaBase / IVA_FACTOR;
                const margenBase = netoBase > 0 ? (((netoBase - costoBase) / netoBase) * 100).toFixed(1) : 0;

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-bg-muted)', backgroundColor: editId === p.id ? 'var(--color-bg-app)' : 'transparent' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '800' }}>{p.nombre}</div>
                      {p.extras?.map((ex, i) => (
                        <div key={i} style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          + {ex.nombre_subreceta}: ${parseFloat(ex.precio_venta_subreceta).toFixed(2)} ({ex.margen_subreceta}%)
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '15px' }}>${costoBase.toFixed(2)}</td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: '900', color: 'var(--color-primary)' }}>${ventaBase.toFixed(2)}</div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: margenBase > 55 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {margenBase}% Margen Real
                      </div>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className={s.btnLogout} style={{ padding: '8px 12px' }} onClick={() => handleEdit(p)}>
                          {puedeEditar ? 'EDITAR' : 'VER'}
                        </button>
                        {puedeBorrar && (
                          <button className={s.btnLogout} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '8px 12px' }} onClick={() => handleDelete(p.id)}>
                            BORRAR
                          </button>
                        )}
                      </div>
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

/**
 * SUB-COMPONENTE: SearchableSelect (Sin cambios lógicos, solo integración con disabled)
 */
const SearchableSelect = ({ options, value, onChange, disabled, placeholder = "Buscar...", valueKey = "id", labelKey = "nombre", formatLabel }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find((opt) => String(opt[valueKey]) === String(value));
    if (selected) setSearchTerm(selected[labelKey]);
    else setSearchTerm("");
  }, [value, options, valueKey, labelKey]);

  const filteredOptions = options.filter(opt =>
    String(opt[labelKey]).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={searchTerm}
        disabled={disabled}
        placeholder={placeholder}
        style={{ width: "100%", padding: "12px", borderRadius: "var(--radius-ui)", border: "1px solid var(--color-border)", fontSize: "14px", boxSizing: "border-box", backgroundColor: disabled ? "var(--color-bg-app)" : "white" }}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          if (value) onChange(""); 
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setIsOpen(false);
            const selected = options.find((opt) => String(opt[valueKey]) === String(value));
            if (selected) setSearchTerm(selected[labelKey]);
            else setSearchTerm("");
          }, 200);
        }}
      />
      {isOpen && !disabled && (
        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '200px', overflowY: 'auto', background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-ui)', zIndex: 1000, margin: '4px 0 0 0', padding: 0, listStyle: 'none', boxShadow: 'var(--shadow-ui)' }}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, index) => (
            <li key={index} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid var(--color-bg-muted)', fontSize: '13px' }} onMouseDown={(e) => { e.preventDefault(); onChange(opt[valueKey]); setSearchTerm(opt[labelKey]); setIsOpen(false); }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-bg-app)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
              {formatLabel ? formatLabel(opt) : opt[labelKey]}
            </li>
          )) : <li style={{ padding: '10px 15px', color: 'var(--color-text-muted)', fontSize: '13px' }}>Sin resultados...</li>}
        </ul>
      )}
    </div>
  );
};