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
    if (extrasIncompletos) return alert("Por favor selecciona la sub-receta en todos los extras.");

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
      <header className={s.pageHeader}>
        <h2 className={s.pageTitle}>Estrategia de Precios (Menú)</h2>
        {loading && <span className={s.syncBadge}>ACTUALIZANDO...</span>}
      </header>

      <div className={s.splitLayout}>
        
        {/* LADO IZQUIERDO: FORMULARIO */}
        <aside className={s.adminCard}>
          <h3 className={s.cardTitle}>
            {editId ? (puedeEditar ? 'Ajustar Producto' : 'Consulta de Producto') : 'Nuevo Producto'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div className={s.formGroup}>
              <label className={s.label}>RECETA PRINCIPAL</label>
              <SearchableSelect 
                options={recetasCosteadas}
                value={formData.nombre}
                valueKey="nombre"
                labelKey="nombre"
                placeholder="Buscar receta..."
                formatLabel={(opt) => `${opt.nombre} ($${opt.costo_final.toFixed(2)})`}
                disabled={!puedeEditar}
                onChange={(selectedValue) => {
                  const rec = recetasCosteadas.find(r => r.nombre === selectedValue);
                  setFormData({...formData, nombre: selectedValue, costo_referencia: rec ? rec.costo_final : 0});
                }}
              />
            </div>

            <div className={s.formGrid}>
              <div className={s.formGroup}>
                <label className={s.label}>PRECIO PÚBLICO ($)</label>
                <input 
                  type="number" step="0.01" 
                  className={s.inputField}
                  style={{ fontWeight: '600' }}
                  value={formData.precio_venta} 
                  onChange={e => setFormData({...formData, precio_venta: e.target.value})} 
                  required readOnly={!puedeEditar} 
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>MARGEN NETO %</label>
                <div className={s.unitDisplayBox} style={{ 
                  fontWeight: '900', 
                  color: formData.margen_en_vivo > 55 ? 'var(--color-success)' : 'var(--color-danger)',
                }}>
                  {formData.margen_en_vivo}%
                </div>
              </div>
            </div>

            <div className={s.flexColumnGap10}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={s.label}>EXTRAS / COMPLEMENTOS</label>
                {puedeEditar && (
                  <button type="button" onClick={addExtraField} className={`${s.btn} ${s.btnSec} ${s.btnSmall}`}>AGREGAR</button>
                )}
              </div>

              <div className={s.flexColumnGap15}>
                {formData.extras.map((ex, idx) => (
                  <div key={idx} className={s.itemCardRelative}>
                    {puedeEditar && (
                      <button type="button" className={s.btnRemoveCircle} onClick={() => removeExtraField(idx)}>✕</button>
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

                    <div className={s.formGrid}>
                      <input 
                        type="number" step="0.01" 
                        className={s.inputField}
                        placeholder="Precio Venta" 
                        value={ex.precio_venta_subreceta} 
                        onChange={e => updateExtraField(idx, 'precio_venta_subreceta', e.target.value)} 
                        required readOnly={!puedeEditar} 
                      />
                      <div className={s.unitDisplayBox} style={{ fontSize: '10px', color: ex.margen_subreceta > 50 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {ex.margen_subreceta}% NETO
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>CATEGORÍA EN MENÚ</label>
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

            <div className={s.flexColumnGap10} style={{ marginTop: '10px' }}>
              {puedeEditar && (
                <button type="submit" className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`} disabled={loading}>
                  {loading ? '...' : (editId ? 'ACTUALIZAR ESTRATEGIA' : 'GUARDAR EN MENÚ')}
                </button>
              )}
              
              {editId && (
                <button type="button" className={`${s.btn} ${s.btnDark} ${s.btnFull}`} onClick={resetForm}>
                  {puedeEditar ? 'CANCELAR EDICIÓN' : 'CERRAR DETALLE'}
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* TABLA DE PRODUCTOS */}
        <div className={`${s.adminCard} ${s.tableContainer}`}>
          <table className={s.table} style={{ minWidth: '600px' }}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th}>PRODUCTO</th>
                <th className={s.th}>COSTO</th>
                <th className={s.th}>VENTA (CON IVA)</th>
                <th className={s.th} style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => {
                const costoBase = p.costo_actual || 0;
                const ventaBase = p.precio_venta || 0;
                const netoBase = ventaBase / IVA_FACTOR;
                const margenBase = netoBase > 0 ? (((netoBase - costoBase) / netoBase) * 100).toFixed(1) : 0;

                return (
                  <tr key={p.id} style={{ backgroundColor: editId === p.id ? 'var(--color-bg-app)' : 'transparent' }}>
                    <td className={s.td}>
                      <div style={{ fontWeight: '600' }}>{p.nombre}</div>
                      {p.extras?.map((ex, i) => (
                        <div key={i} className={s.miniBadge} style={{ marginTop: '4px', display: 'inline-block', marginRight: '5px' }}>
                          + {ex.nombre_subreceta}: ${parseFloat(ex.precio_venta_subreceta).toFixed(2)} ({ex.margen_subreceta}%)
                        </div>
                      ))}
                    </td>
                    <td className={s.td}>${costoBase.toFixed(2)}</td>
                    <td className={s.td}>
                      <div className={s.totalAmount} style={{ color: 'var(--color-primary)' }}>${ventaBase.toFixed(2)}</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: margenBase > 55 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {margenBase}% Margen Real
                      </div>
                    </td>
                    <td className={s.td} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className={`${s.btn} ${s.btnOutlineEditar} ${s.btnEditar}`} onClick={() => handleEdit(p)}>
                          {puedeEditar ? '📝' : 'VER'}
                        </button>
                        {puedeBorrar && (
                          <button className={`${s.btn} ${s.btnOutlineDanger} ${s.btnSmall}`} onClick={() => handleDelete(p.id)}>
                            ❌
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
 * SearchableSelect Homologado
 */
const SearchableSelect = ({ options, value, onChange, disabled, placeholder = "Buscar...", valueKey = "id", labelKey = "nombre", formatLabel }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const selected = options.find((opt) => String(opt[valueKey]) === String(value));
    setSearchTerm(selected ? selected[labelKey] : "");
  }, [value, options, valueKey, labelKey]);

  const filteredOptions = options.filter(opt =>
    String(opt[labelKey]).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        className={s.inputField}
        value={searchTerm}
        disabled={disabled}
        placeholder={placeholder}
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
            setSearchTerm(selected ? selected[labelKey] : "");
          }, 200);
        }}
      />
      {isOpen && !disabled && (
        <ul className={s.dropdownList}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, index) => (
            <li 
              key={index} 
              className={s.dropdownItem} 
              onMouseDown={(e) => { e.preventDefault(); onChange(opt[valueKey]); setSearchTerm(opt[labelKey]); setIsOpen(false); }}
            >
              {formatLabel ? formatLabel(opt) : opt[labelKey]}
            </li>
          )) : <li className={s.dropdownItem} style={{ color: 'var(--color-text-muted)' }}>Sin resultados...</li>}
        </ul>
      )}
    </div>
  );
};