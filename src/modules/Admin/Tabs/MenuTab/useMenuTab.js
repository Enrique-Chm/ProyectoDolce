// Archivo: src/modules/Admin/Tabs/MenuTab/useMenuTab.js
import { useState, useEffect, useCallback } from 'react';
import { productosService } from './Menu.service'; 
import { hasPermission } from '../../../../utils/checkPermiso';
import { IVA_FACTOR } from '../../../../utils/taxConstants'; 
import toast from 'react-hot-toast'; 
import Swal from 'sweetalert2'; 

export const useMenuTab = (sucursalId) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [recetasCosteadas, setRecetasCosteadas] = useState([]);
  const [subrecetasDisponibles, setSubrecetasDisponibles] = useState([]);
  const [gruposMaestros, setGruposMaestros] = useState([]); 
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
    precio_neto: 0,    // 💡 NUEVO: Guardaremos el precio sin IVA
    ganancia_neta: 0,  // 💡 NUEVO: Guardaremos el dinero de ganancia
    margen_en_vivo: 0, 
    disponible: true,
    grupos_vinculados: [] 
  });

  // Filtros y Ordenamiento de Productos
  const [filtroProductos, setFiltroProductos] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("all");
  const [sortConfigProd, setSortConfigProd] = useState({ key: "nombre", direction: "asc" });

  // ==========================================
  // ESTADOS: FORMULARIO DE GRUPOS (SUBTAB 2)
  // ==========================================
  const [editGrupoId, setEditGrupoId] = useState(null);
  const [grupoFormData, setGrupoFormData] = useState({
    nombre_grupo: '', 
    obligatorio: false, 
    maximo: 1, 
    opciones: [{ subreceta_id: '', cantidad: 1, precio_venta: '', costo: 0, margen: 0 }] 
  });

  // Filtros de Grupos / Extras
  const [filtroGrupos, setFiltroGrupos] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroSubreceta, setFiltroSubreceta] = useState("");

  // ==========================================
  // SINCRONIZACIÓN DE DATOS
  // ==========================================
  const fetchData = useCallback(async () => {
    if (!puedeVer) return;

    try {
      setLoading(true);
      const data = await productosService.getInitialData(sucursalId);
      
      const principales = data.costosMap.filter(c => c.esSubreceta === false);
      const subs = data.costosMap.filter(c => c.esSubreceta === true);

      setRecetasCosteadas(principales);
      setSubrecetasDisponibles(subs);
      setCategorias(data.categorias || []);
      setGruposMaestros(data.gruposModificadores || []);

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

  // 💡 EFECTO: CÁLCULO DE MARGEN, NETO Y GANANCIA EN TIEMPO REAL
  useEffect(() => {
    const costoP = parseFloat(prodFormData.costo_referencia) || 0;
    const ventaBruta = parseFloat(prodFormData.precio_venta) || 0;
    
    const ventaNeta = ventaBruta / IVA_FACTOR;
    const ganancia = ventaNeta - costoP;
    
    const margenP = ventaNeta > 0 
      ? ((ganancia / ventaNeta) * 100).toFixed(1) 
      : 0;

    setProdFormData(prev => ({ 
      ...prev, 
      precio_neto: ventaNeta, 
      ganancia_neta: ganancia,
      margen_en_vivo: margenP 
    }));
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

    if (field === 'subreceta_id') {
      const sub = subrecetasDisponibles.find(s => s.nombre === value);
      opcion.costo = sub ? sub.costo_final : 0;
    }

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
  // FUNCIONES DE SOPORTE, ALERTAS Y RESETEOS
  // ==========================================

  const handleDeleteProd = async (id) => {
    if (!puedeBorrar) return toast.error("Permiso denegado.");
    
    try {
      const { error } = await productosService.deleteProducto(id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      toast.error("Ocurrió un error inesperado al eliminar.");
    }
  };

  const handleRestoreProducto = async (id, nombre) => {
    if (!puedeEditar) return toast.error("Permiso denegado.");
    
    try {
      const { error } = await productosService.restoreProducto(id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      toast.error(`Error al restaurar ${nombre}`);
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
    setProdFormData({ 
      nombre: '', 
      categoria: '', 
      precio_venta: '', 
      costo_referencia: 0, 
      precio_neto: 0,
      ganancia_neta: 0,
      margen_en_vivo: 0, 
      grupos_vinculados: [], 
      disponible: true 
    });
  };

  const resetGrupoForm = () => {
    setEditGrupoId(null);
    setGrupoFormData({ nombre_grupo: '', obligatorio: false, maximo: 1, opciones: [{ subreceta_id: '', cantidad: 1, precio_venta: '', costo: 0, margen: 0 }] });
  };

  const handleEditProd = (p) => {
    const costoPrincipal = recetasCosteadas.find(r => r.nombre === p.nombre)?.costo_final || 0;
    const ventaBruta = p.precio_venta || 0;
    const ventaNeta = ventaBruta / IVA_FACTOR;
    const ganancia = ventaNeta - costoPrincipal;

    setEditProdId(p.id);
    setProdFormData({
      nombre: p.nombre,
      categoria: p.categoria,
      precio_venta: ventaBruta,
      disponible: p.disponible,
      costo_referencia: costoPrincipal,
      precio_neto: ventaNeta,
      ganancia_neta: ganancia,
      margen_en_vivo: 0, // El efecto lo recalculará enseguida
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

  // 🛡️ SWEET ALERT: CANCELACIONES Y BORRADOS
  const handleCancelProdClick = () => {
    const tieneDatos = prodFormData.nombre || prodFormData.precio_venta > 0 || prodFormData.grupos_vinculados.length > 0;
    if (tieneDatos) {
      Swal.fire({
        title: "¿Descartar cambios?",
        text: "Los ajustes de precio o configuración no guardados se perderán.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, descartar",
        cancelButtonText: "Seguir editando",
      }).then((result) => { if (result.isConfirmed) resetProdForm(); });
    } else { resetProdForm(); }
  };

  const confirmDeleteProducto = (id, nombre) => {
    Swal.fire({
      title: `¿Mandar "${nombre}" a la papelera?`,
      text: "El producto se ocultará del punto de venta, pero su historial de ventas quedará intacto.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, ocultar producto",
      cancelButtonText: "Cancelar",
    }).then((result) => { if (result.isConfirmed) handleDeleteProd(id); });
  };

  const handleCancelGrupoClick = () => {
    const tieneDatos = grupoFormData.nombre_grupo || (grupoFormData.opciones.length > 0 && grupoFormData.opciones[0].subreceta_id);
    if (tieneDatos) {
      Swal.fire({
        title: "¿Descartar cambios?",
        text: "La configuración de opciones no guardada se perderá.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, descartar",
        cancelButtonText: "Seguir editando",
      }).then((result) => { if (result.isConfirmed) resetGrupoForm(); });
    } else { resetGrupoForm(); }
  };

  const confirmDeleteGrupo = (id, nombre) => {
    Swal.fire({
      title: `¿Eliminar grupo "${nombre}"?`,
      text: "Este grupo desaparecerá de todos los productos que lo tengan vinculado. Esta acción no se puede deshacer.",
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, eliminar grupo",
      cancelButtonText: "Cancelar",
    }).then((result) => { if (result.isConfirmed) handleDeleteGrupo(id); });
  };

  // ==========================================
  // TRANSFORMACIÓN DE DATOS (FILTROS Y ORDEN)
  // ==========================================

  const handleSortProd = (key) => {
    let direction = "asc";
    if (sortConfigProd.key === key && sortConfigProd.direction === "asc") {
      direction = "desc";
    }
    setSortConfigProd({ key, direction });
  };

  const productosFiltrados = productos.filter((p) => {
    const texto = filtroProductos.toLowerCase();
    const nombreCategoria = categorias.find((c) => c.id === p.categoria)?.nombre || "Sin categoría";
    const matchTexto = !filtroProductos || p.nombre?.toLowerCase().includes(texto) || nombreCategoria.toLowerCase().includes(texto);
    const matchCategoria = filtroCategoria === "all" || String(p.categoria) === String(filtroCategoria);
    return matchTexto && matchCategoria;
  });

  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    if (sortConfigProd.key === "nombre") {
      const nombreA = a.nombre || "";
      const nombreB = b.nombre || "";
      return sortConfigProd.direction === "asc" ? nombreA.localeCompare(nombreB) : nombreB.localeCompare(nombreA);
    }
    if (sortConfigProd.key === "categoria") {
      const catA = categorias.find((c) => c.id === a.categoria)?.nombre || "Sin categoría";
      const catB = categorias.find((c) => c.id === b.categoria)?.nombre || "Sin categoría";
      return sortConfigProd.direction === "asc" ? catA.localeCompare(catB) : catB.localeCompare(catA);
    }
    if (sortConfigProd.key === "costo") {
      const costoA = a.costo_actual || 0;
      const costoB = b.costo_actual || 0;
      return sortConfigProd.direction === "asc" ? costoA - costoB : costoB - costoA;
    }
    if (sortConfigProd.key === "venta") {
      const ventaA = a.precio_venta || 0;
      const ventaB = b.precio_venta || 0;
      return sortConfigProd.direction === "asc" ? ventaA - ventaB : ventaB - ventaA;
    }
    if (sortConfigProd.key === "ganancia") {
      const netoA = (a.precio_venta || 0) / IVA_FACTOR;
      const gananciaA = netoA - (a.costo_actual || 0);
      
      const netoB = (b.precio_venta || 0) / IVA_FACTOR;
      const gananciaB = netoB - (b.costo_actual || 0);
      
      return sortConfigProd.direction === "asc" ? gananciaA - gananciaB : gananciaB - gananciaA;
    }
    return 0;
  });

  const gruposFiltrados = gruposMaestros.filter((g) => {
    const matchNombre = !filtroGrupos || g.nombre?.toLowerCase().includes(filtroGrupos.toLowerCase());
    const esObligatorio = g.min_seleccion > 0;
    const matchTipo = filtroTipo === "all" || (filtroTipo === "obligatorio" && esObligatorio) || (filtroTipo === "opcional" && !esObligatorio);
    const matchSubreceta = !filtroSubreceta || (g.opciones_modificadores || []).some(op => op.subreceta_id === filtroSubreceta);
    return matchNombre && matchTipo && matchSubreceta;
  });

  return {
    // Listas Base
    productos, categorias, recetasCosteadas, subrecetasDisponibles, gruposMaestros, loading,
    
    // Permisos
    puedeVer, puedeCrear, puedeEditar, puedeBorrar,
    
    // Estados Producto
    editProdId, prodFormData, setProdFormData, 
    
    // Estados Grupo
    editGrupoId, grupoFormData, setGrupoFormData, 
    
    // Filtros y Orden Productos
    filtroProductos, setFiltroProductos,
    filtroCategoria, setFiltroCategoria,
    sortConfigProd, handleSortProd,
    productosOrdenados, // <-- La vista consumirá este

    // Filtros Grupos
    filtroGrupos, setFiltroGrupos,
    filtroTipo, setFiltroTipo,
    filtroSubreceta, setFiltroSubreceta,
    gruposFiltrados, // <-- La vista consumirá este

    // Acciones de Mantenimiento
    handleSubmitProducto, handleEditProd, handleDeleteProd, resetProdForm, toggleGrupoEnProducto,
    handleSubmitGrupo, handleEditGrupo, handleDeleteGrupo, resetGrupoForm, addOpcion, removeOpcion, updateOpcion,
    
    // Interacciones (Alertas) y Restauración
    handleCancelProdClick, confirmDeleteProducto, handleRestoreProducto,
    handleCancelGrupoClick, confirmDeleteGrupo
  };
};