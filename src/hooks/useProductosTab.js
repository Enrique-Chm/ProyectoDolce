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
  const [gruposMaestros, setGruposMaestros] = useState([]); // 👈 Catálogo Maestro de Grupos
  const [loading, setLoading] = useState(false);

  // 🛡️ SEGURIDAD INTERNA (RBAC) ESTANDARIZADA
  const puedeVer = hasPermission('ver_productos');
  const puedeCrear = hasPermission('crear_productos');
  const puedeEditar = hasPermission('editar_productos');
  const puedeBorrar = hasPermission('borrar_productos');

  // ==========================================
  // ESTADOS: FORMULARIO DE PRODUCTOS (SUBTAB 1)
  // ==========================================
  const [editProdId, setEditProdId] = useState(null);
  const [prodFormData, setProdFormData] = useState({
    nombre: '', 
    categoria: '', 
    precio_venta: '', 
    costo_referencia: 0,
    margen_en_vivo: 0, 
    disponible: true,
    grupos_vinculados: [] // 👈 Almacena IDs de grupos seleccionados
  });

  // ==========================================
  // ESTADOS: FORMULARIO DE GRUPOS (SUBTAB 2)
  // ==========================================
  const [editGrupoId, setEditGrupoId] = useState(null);
  const [grupoFormData, setGrupoFormData] = useState({
    nombre_grupo: '', 
    obligatorio: false, 
    maximo: 1, 
    // Estructura que incluye 'cantidad' para costeo e inventario
    opciones: [{ subreceta_id: '', cantidad: 1, precio_venta: '', costo: 0, margen: 0 }] 
  });

  // ==========================================
  // SINCRONIZACIÓN DE DATOS
  // ==========================================
  const fetchData = useCallback(async () => {
    if (!puedeVer) return;

    try {
      setLoading(true);
      const data = await productosService.getInitialData(sucursalId);
      
      /**
       * 💡 FILTRADO DE RECETAS (CORREGIDO)
       * Ahora usamos 'esSubreceta' que viene normalizado como booleano real
       * desde el service para asegurar que el buscador no esté vacío.
       */
      const principales = data.costosMap.filter(c => c.esSubreceta === false);
      const subs = data.costosMap.filter(c => c.esSubreceta === true);

      setRecetasCosteadas(principales);
      setSubrecetasDisponibles(subs);
      setCategorias(data.categorias || []);
      setGruposMaestros(data.gruposModificadores || []);

      // 🔄 Mapeo: Inyectamos los grupos completos a cada producto para la visualización en tabla
      const productosArmados = (data.productos || []).map(prod => {
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

  // EFECTO: CÁLCULO DE MARGEN EN TIEMPO REAL (PRODUCTO PRINCIPAL)
  useEffect(() => {
    const costoP = parseFloat(prodFormData.costo_referencia) || 0;
    const ventaBruta = parseFloat(prodFormData.precio_venta) || 0;
    
    const ventaNeta = ventaBruta / IVA_FACTOR;
    const margenP = ventaNeta > 0 
      ? (((ventaNeta - costoP) / ventaNeta) * 100).toFixed(1) 
      : 0;

    setProdFormData(prev => ({ ...prev, margen_en_vivo: margenP }));
  }, [prodFormData.precio_venta, prodFormData.costo_referencia]);


  // ==========================================
  // 💡 LÓGICA DE CATÁLOGO DE GRUPOS (SUBTAB 2)
  // ==========================================

  const addOpcion = () => {
    if (editGrupoId && !puedeEditar) return;
    if (!editGrupoId && !puedeCrear) return;

    setGrupoFormData({
      ...grupoFormData,
      opciones: [...grupoFormData.opciones, { subreceta_id: '', cantidad: 1, precio_venta: '', costo: 0, margen: 0 }]
    });
  };

  const removeOpcion = (idx) => {
    if (editGrupoId && !puedeEditar) return;
    if (!editGrupoId && !puedeCrear) return;

    const newOpciones = grupoFormData.opciones.filter((_, i) => i !== idx);
    setGrupoFormData({ ...grupoFormData, opciones: newOpciones });
  };

  const updateOpcion = (idx, field, value) => {
    if (editGrupoId && !puedeEditar) return;
    if (!editGrupoId && !puedeCrear) return;

    const newOpciones = [...grupoFormData.opciones];
    const opcion = newOpciones[idx];
    
    opcion[field] = value;

    // Si cambia la sub-receta, actualizamos su costo base (unitario)
    if (field === 'subreceta_id') {
      const sub = subrecetasDisponibles.find(s => s.nombre === value);
      opcion.costo = sub ? sub.costo_final : 0;
    }

    // 💡 COSTEO DINÁMICO
    const costoUnitario = parseFloat(opcion.costo) || 0;
    const cantidadOpcion = parseFloat(opcion.cantidad) || 1;
    const costoTotalOpcion = costoUnitario * cantidadOpcion;
    
    const ventaOriginal = parseFloat(opcion.precio_venta) || 0;
    const ventaNeta = ventaOriginal / IVA_FACTOR;

    opcion.margen = ventaNeta > 0 
      ? (((ventaNeta - costoTotalOpcion) / ventaNeta) * 100).toFixed(1) 
      : 0;

    setGrupoFormData({ ...grupoFormData, opciones: newOpciones });
  };

  const handleSubmitGrupo = async (e) => {
    e.preventDefault();
    const tienePermiso = editGrupoId ? puedeEditar : puedeCrear;
    if (!tienePermiso) return toast.error("Acceso denegado.");

    if (!grupoFormData.nombre_grupo) return toast.error("El grupo necesita un nombre.");
    if (grupoFormData.opciones.length === 0) return toast.error("Añade al menos una opción.");
    if (grupoFormData.opciones.some(op => !op.subreceta_id)) return toast.error("Selecciona una sub-receta válida.");

    setLoading(true);
    const idToast = toast.loading(editGrupoId ? "Actualizando..." : "Guardando...");

    const payload = {
      nombre: grupoFormData.nombre_grupo,
      min_seleccion: grupoFormData.obligatorio ? 1 : 0,
      max_seleccion: grupoFormData.maximo,
      sucursal_id: sucursalId
    };

    try {
      const { error } = await productosService.saveGrupoMaestro(payload, grupoFormData.opciones, sucursalId, editGrupoId);
      if (error) throw error;
      
      toast.success(editGrupoId ? "Grupo actualizado" : "Grupo creado", { id: idToast });
      resetGrupoForm(); 
      fetchData(); 
    } catch (err) {
      toast.error("Error: " + err.message, { id: idToast });
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // 💡 LÓGICA DE PRODUCTOS DEL MENÚ (SUBTAB 1)
  // ==========================================

  const toggleGrupoEnProducto = (grupoId) => {
    const actual = prodFormData.grupos_vinculados;
    const nuevoArray = actual.includes(grupoId) 
      ? actual.filter(id => id !== grupoId) 
      : [...actual, grupoId];
    
    setProdFormData({ ...prodFormData, grupos_vinculados: nuevoArray });
  };

  const handleSubmitProducto = async (e) => {
    e.preventDefault();
    const tienePermiso = editProdId ? puedeEditar : puedeCrear;
    if (!tienePermiso) return toast.error("Acceso denegado.");

    if (!prodFormData.nombre) return toast.error("Selecciona una Receta Principal.");
    if (!prodFormData.categoria) return toast.error("Selecciona una Categoría.");

    setLoading(true);
    const idToast = toast.loading(editProdId ? "Actualizando..." : "Guardando...");

    const payload = {
      nombre: prodFormData.nombre,
      categoria: parseInt(prodFormData.categoria),
      precio_venta: parseFloat(prodFormData.precio_venta),
      disponible: prodFormData.disponible,
      sucursal_id: sucursalId
    };

    try {
      const { error } = await productosService.saveProductoConVinculos(payload, prodFormData.grupos_vinculados, sucursalId, editProdId);
      if (error) throw error;
      
      toast.success(editProdId ? "Actualizado" : "Producto añadido", { id: idToast });
      resetProdForm(); 
      fetchData(); 
    } catch (err) {
      toast.error("Error: " + err.message, { id: idToast });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FUNCIONES DE SOPORTE
  // ==========================================

  const handleDeleteProd = async (id) => {
    if (!puedeBorrar) return toast.error("Permiso denegado.");
    const idToast = toast.loading("Eliminando...");
    try {
      const { error } = await productosService.deleteProducto(id);
      if (error) throw error;
      toast.success("Eliminado", { id: idToast });
      fetchData();
    } catch (err) {
      toast.error("Error: " + err.message, { id: idToast });
    }
  };

  const handleDeleteGrupo = async (id) => {
    if (!puedeBorrar) return toast.error("Permiso denegado.");
    const idToast = toast.loading("Eliminando...");
    try {
      const { error } = await productosService.deleteGrupo(id);
      if (error) throw error;
      toast.success("Eliminado", { id: idToast });
      fetchData();
    } catch (err) {
      toast.error("Error: " + err.message, { id: idToast });
    }
  };

  const resetProdForm = () => {
    setEditProdId(null);
    setProdFormData({ nombre: '', categoria: '', precio_venta: '', costo_referencia: 0, margen_en_vivo: 0, grupos_vinculados: [], disponible: true });
  };

  const resetGrupoForm = () => {
    setEditGrupoId(null);
    setGrupoFormData({ nombre_grupo: '', obligatorio: false, maximo: 1, opciones: [{ subreceta_id: '', cantidad: 1, precio_venta: '', costo: 0, margen: 0 }] });
  };

  const handleEditProd = (p) => {
    const costoPrincipal = recetasCosteadas.find(r => r.nombre === p.nombre)?.costo_final || 0;
    setEditProdId(p.id);
    setProdFormData({
      nombre: p.nombre,
      categoria: p.categoria,
      precio_venta: p.precio_venta,
      disponible: p.disponible,
      costo_referencia: costoPrincipal,
      margen_en_vivo: 0, 
      grupos_vinculados: (p.grupos || []).map(g => g.id) 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditGrupo = (g) => {
    setEditGrupoId(g.id);
    setGrupoFormData({
      nombre_grupo: g.nombre,
      obligatorio: g.min_seleccion > 0,
      maximo: g.max_seleccion,
      opciones: (g.opciones_modificadores || []).map(op => {
        const infoSub = subrecetasDisponibles.find(s => s.nombre === op.subreceta_id);
        const costoSub = infoSub?.costo_final || 0;
        const cTotal = costoSub * (op.cantidad || 1);
        const ventaNeta = parseFloat(op.precio_venta) / IVA_FACTOR;
        const margenCalc = ventaNeta > 0 ? (((ventaNeta - cTotal) / ventaNeta) * 100).toFixed(1) : 0;

        return {
          subreceta_id: op.subreceta_id,
          cantidad: op.cantidad || 1,
          precio_venta: op.precio_venta,
          costo: costoSub,
          margen: margenCalc
        };
      })
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    productos, categorias, recetasCosteadas, subrecetasDisponibles, gruposMaestros, loading,
    puedeVer, puedeCrear, puedeEditar, puedeBorrar,
    editProdId, prodFormData, setProdFormData, 
    handleSubmitProducto, handleEditProd, handleDeleteProd, resetProdForm, toggleGrupoEnProducto,
    editGrupoId, grupoFormData, setGrupoFormData, 
    handleSubmitGrupo, handleEditGrupo, handleDeleteGrupo, resetGrupoForm, addOpcion, removeOpcion, updateOpcion
  };
};