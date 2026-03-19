// Archivo: src/hooks/useProductosTab.js
import { useState, useEffect, useCallback } from 'react';
import { productosService } from '../services/productos.service'; 
import { hasPermission } from '../utils/checkPermiso';
import { IVA_FACTOR } from '../utils/taxConstants'; 
import toast from 'react-hot-toast'; 

export const useProductosTab = (sucursalId) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [recetasCosteadas, setRecetasCosteadas] = useState([]);
  const [subrecetasDisponibles, setSubrecetasDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // 🛡️ SEGURIDAD INTERNA (RBAC) ESTANDARIZADA
  const puedeVer = hasPermission('ver_productos');
  const puedeCrear = hasPermission('crear_productos');
  const puedeEditar = hasPermission('editar_productos');
  const puedeBorrar = hasPermission('borrar_productos');

  // 💡 NUEVA ESTRUCTURA DEL FORMULARIO PARA SOPORTAR GRUPOS
  const [formData, setFormData] = useState({
    nombre: '', 
    categoria: '', 
    precio_venta: '', 
    costo_referencia: 0,
    margen_en_vivo: 0, 
    disponible: true,
    grupos: [] // 👈 Reemplazamos 'extras' por 'grupos'
  });

  const fetchData = useCallback(async () => {
    if (!puedeVer) return;

    try {
      setLoading(true);
      const data = await productosService.getInitialData(sucursalId);
      
      const principales = data.costosMap.filter(c => 
        data.listaRecetas.some(r => r.nombre === c.nombre && !r.subreceta)
      );
      const subs = data.costosMap.filter(c => 
        data.listaRecetas.some(r => r.nombre === c.nombre && r.subreceta)
      );

      setRecetasCosteadas(principales);
      setSubrecetasDisponibles(subs);
      setCategorias(data.categorias || []);

      // 💡 RECONSTRUCCIÓN DE PRODUCTOS CON SUS GRUPOS
      // Como ahora los extras viven en otras tablas, los "pegamos" al producto para la vista
      const productosArmados = (data.productos || []).map(prod => {
        // Buscamos qué grupos le pertenecen a este producto
        const gruposVinculados = (data.gruposModificadores || []).filter(g => 
          g.producto_grupos?.some(link => link.producto_id === prod.id)
        );
        return { ...prod, grupos: gruposVinculados };
      });

      setProductos(productosArmados);

    } catch (error) {
      console.error("Error en fetchData:", error);
      toast.error("Error al sincronizar el menú.");
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVer]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // EFECTO PARA CALCULAR MARGEN EN VIVO (POST-IVA) DEL PRODUCTO PRINCIPAL
  useEffect(() => {
    const costoP = parseFloat(formData.costo_referencia) || 0;
    const ventaBruta = parseFloat(formData.precio_venta) || 0;
    
    const ventaNeta = ventaBruta / IVA_FACTOR;
    const margenP = ventaNeta > 0 
      ? (((ventaNeta - costoP) / ventaNeta) * 100).toFixed(1) 
      : 0;

    setFormData(prev => ({ ...prev, margen_en_vivo: margenP }));
  }, [formData.precio_venta, formData.costo_referencia]);


  // ==========================================
  // 💡 LÓGICA DE GRUPOS Y OPCIONES (MODIFICADORES)
  // ==========================================

  const addGrupo = () => {
    if (editId && !puedeEditar) return;
    if (!editId && !puedeCrear) return;

    setFormData({
      ...formData,
      grupos: [...formData.grupos, { 
        nombre_grupo: '', 
        obligatorio: false, 
        maximo: 1, 
        opciones: [{ subreceta_id: '', precio_venta: '', costo: 0, margen: 0 }] 
      }]
    });
  };

  const removeGrupo = (idxGrupo) => {
    if (editId && !puedeEditar) return;
    if (!editId && !puedeCrear) return;

    const newGrupos = formData.grupos.filter((_, i) => i !== idxGrupo);
    setFormData({ ...formData, grupos: newGrupos });
  };

  const updateGrupo = (idxGrupo, field, value) => {
    if (editId && !puedeEditar) return;
    if (!editId && !puedeCrear) return;

    const newGrupos = [...formData.grupos];
    newGrupos[idxGrupo][field] = value;
    setFormData({ ...formData, grupos: newGrupos });
  };

  const addOpcionAGrupo = (idxGrupo) => {
    if (editId && !puedeEditar) return;
    if (!editId && !puedeCrear) return;

    const newGrupos = [...formData.grupos];
    newGrupos[idxGrupo].opciones.push({ subreceta_id: '', precio_venta: '', costo: 0, margen: 0 });
    setFormData({ ...formData, grupos: newGrupos });
  };

  const removeOpcionDeGrupo = (idxGrupo, idxOpcion) => {
    if (editId && !puedeEditar) return;
    if (!editId && !puedeCrear) return;

    const newGrupos = [...formData.grupos];
    newGrupos[idxGrupo].opciones = newGrupos[idxGrupo].opciones.filter((_, i) => i !== idxOpcion);
    setFormData({ ...formData, grupos: newGrupos });
  };

  const updateOpcion = (idxGrupo, idxOpcion, field, value) => {
    if (editId && !puedeEditar) return;
    if (!editId && !puedeCrear) return;

    const newGrupos = [...formData.grupos];
    const opcion = newGrupos[idxGrupo].opciones[idxOpcion];
    
    opcion[field] = value;

    if (field === 'subreceta_id') {
      const sub = subrecetasDisponibles.find(s => s.nombre === value);
      opcion.costo = sub ? sub.costo_final : 0;
    }

    const costo = parseFloat(opcion.costo) || 0;
    const ventaOriginal = parseFloat(opcion.precio_venta) || 0;
    
    // CÁLCULO MARGEN OPCIÓN (POST-IVA)
    const ventaNeta = ventaOriginal / IVA_FACTOR;
    opcion.margen = ventaNeta > 0 
      ? (((ventaNeta - costo) / ventaNeta) * 100).toFixed(1) 
      : 0;

    setFormData({ ...formData, grupos: newGrupos });
  };


  // ==========================================
  // GUARDAR Y ELIMINAR
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tienePermiso = editId ? puedeEditar : puedeCrear;
    if (!tienePermiso) return toast.error("Acceso denegado para guardar en menú.");

    if (!formData.nombre) return toast.error("Por favor selecciona una Receta Principal.");
    if (!formData.categoria) return toast.error("Por favor selecciona una Categoría.");
    
    // Validación de Grupos: Que tengan nombre y al menos una opción válida
    for (let g of formData.grupos) {
      if (!g.nombre_grupo) return toast.error("Todos los grupos de extras deben tener un nombre.");
      if (g.opciones.length === 0) return toast.error(`El grupo "${g.nombre_grupo}" no tiene opciones.`);
      if (g.opciones.some(op => !op.subreceta_id)) return toast.error(`Selecciona una sub-receta para todas las opciones del grupo "${g.nombre_grupo}".`);
    }

    setLoading(true);
    const idToast = toast.loading(editId ? "Actualizando estrategia..." : "Guardando en menú...");

    // 1. Armamos el payload del producto principal
    const productoPayload = {
      nombre: formData.nombre,
      categoria: parseInt(formData.categoria),
      precio_venta: parseFloat(formData.precio_venta),
      disponible: formData.disponible,
      sucursal_id: sucursalId,
      // NOTA: Como 'extras' ya no existe en la tabla productosmenu, lo eliminamos de aquí.
    };

    try {
      // 2. Ejecutamos la función maestra que orquesta las 3 tablas
      const { error } = await productosService.saveProductoConGrupos(productoPayload, formData.grupos, sucursalId, editId);
      if (error) throw error;
      
      toast.success(editId ? "Menú actualizado con modificadores" : "Producto y grupos creados", { id: idToast });
      resetForm(); 
      fetchData(); 
    } catch (err) {
      toast.error("Error: " + err.message, { id: idToast });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!puedeBorrar) return toast.error("No tienes permisos para eliminar productos del menú.");

    const idToast = toast.loading("Eliminando producto y sus grupos...");
    
    try {
      const { error } = await productosService.deleteProducto(id);
      if (error) throw error;
      
      toast.success("Producto quitado del menú", { id: idToast });
      fetchData();
    } catch (err) {
      toast.error("No se pudo eliminar: " + err.message, { id: idToast });
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({ nombre: '', categoria: '', precio_venta: '', costo_referencia: 0, margen_en_vivo: 0, grupos: [], disponible: true });
  };

  const handleEdit = (p) => {
    const costoPrincipal = recetasCosteadas.find(r => r.nombre === p.nombre)?.costo_final || 0;
    setEditId(p.id);

    // Mapeamos la estructura de BD a la estructura del formulario
    const gruposMapeados = (p.grupos || []).map(g => ({
      nombre_grupo: g.nombre,
      obligatorio: g.min_seleccion > 0,
      maximo: g.max_seleccion,
      opciones: (g.opciones_modificadores || []).map(op => {
        const sub = subrecetasDisponibles.find(s => s.nombre === op.subreceta_id);
        const costoSub = sub ? sub.costo_final : 0;
        const ventaNeta = parseFloat(op.precio_venta) / IVA_FACTOR;
        const margenCalc = ventaNeta > 0 ? (((ventaNeta - costoSub) / ventaNeta) * 100).toFixed(1) : 0;

        return {
          subreceta_id: op.subreceta_id,
          precio_venta: op.precio_venta,
          costo: costoSub,
          margen: margenCalc
        };
      })
    }));

    setFormData({
      nombre: p.nombre,
      categoria: p.categoria,
      precio_venta: p.precio_venta,
      disponible: p.disponible,
      costo_referencia: costoPrincipal,
      margen_en_vivo: 0, 
      grupos: gruposMapeados
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    productos, categorias, recetasCosteadas, subrecetasDisponibles, loading, editId, formData, setFormData,
    puedeVer, puedeCrear, puedeEditar, puedeBorrar,
    addGrupo, removeGrupo, updateGrupo, addOpcionAGrupo, removeOpcionDeGrupo, updateOpcion, // 👈 Nuevas funciones exportadas
    handleSubmit, handleDelete, resetForm, handleEdit
  };
};