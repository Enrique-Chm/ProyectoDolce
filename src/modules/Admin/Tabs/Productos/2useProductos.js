// src/modules/Admin/Tabs/Productos/2useProductos.js
import { useState, useCallback, useMemo } from 'react';
import { ProductosService } from './1Productos.Service';
import toast from 'react-hot-toast';

export const useProductos = () => {
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  
  // --- ESTADOS DE FILTRADO (UI) ---
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [catActiva, setCatActiva] = useState('Todas');

  const [catalogos, setCatalogos] = useState({
    proveedores: [],
    sucursales: [],
    unidades: [],
    categorias: [] 
  });

  // ==========================================
  // 1. CARGA DE DATOS Y NORMALIZACIÓN
  // ==========================================
  const cargarProductos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await ProductosService.getProductos();
      if (error) {
        toast.error(`Error de carga: ${error.message || 'No se pudo obtener la lista'}`);
        return;
      }

      // Normalizamos la data para que el filtrado sea más rápido y sencillo
      const procesados = (data || []).map(p => ({
        ...p,
        categoria_nombre: p.categoria?.nombre || 'Sin Categoría',
        um_abreviatura: p.unidad_medida?.abreviatura || 'pz'
      }));

      setProductos(procesados);
    } catch (err) {
      console.error("Error inesperado al cargar productos:", err);
      toast.error("Error de conexión al cargar la lista.");
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarCatalogosFormulario = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ProductosService.getCatalogosFormulario();
      
      if (data.error) {
        console.error("Errores al sincronizar catálogos:", data.error);
        toast.error('Aviso: Algunos catálogos de apoyo no se cargaron correctamente.');
      }

      setCatalogos({
        proveedores: data.proveedores || [],
        sucursales: data.sucursales || [],
        unidades: data.unidades || [],
        categorias: data.categorias || []
      });
    } catch (err) {
      console.error("Error inesperado al cargar catálogos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // 2. LÓGICA DE FILTRADO (SEARCHABLE)
  // ==========================================

  // Extraer categorías únicas para los Tabs del listado
  const listaCategoriasFiltro = useMemo(() => {
    const sets = new Set(productos.map(p => p.categoria_nombre));
    return ['Todas', ...Array.from(sets).sort()];
  }, [productos]);

  // Motor de búsqueda y filtrado por categoría
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      // Filtro 1: Por Pestaña/Categoría
      const coincideCat = catActiva === 'Todas' || p.categoria_nombre === catActiva;

      // Filtro 2: Por Texto (Nombre, Marca o Categoría)
      const search = filtroBusqueda.toLowerCase();
      const coincideTexto = 
        p.nombre.toLowerCase().includes(search) ||
        (p.marca || '').toLowerCase().includes(search) ||
        p.categoria_nombre.toLowerCase().includes(search);

      return coincideCat && coincideTexto;
    });
  }, [productos, filtroBusqueda, catActiva]);

  // ==========================================
  // 3. ACCIONES (GUARDAR / ESTATUS)
  // ==========================================
  const guardarProducto = useCallback(async (productoData) => {
    if (!productoData.nombre || productoData.nombre.trim() === '') {
      toast.error('El nombre del producto es obligatorio.');
      return false;
    }

    if (!productoData.categoria_id) {
      toast.error('Debes seleccionar una categoría.');
      return false;
    }

    // Validación de paracaídas (Proveedor Secundario)
    if (
      productoData.proveedor_id && 
      productoData.proveedor_secundario_id && 
      productoData.proveedor_id === productoData.proveedor_secundario_id
    ) {
      toast.error('El proveedor secundario debe ser distinto al principal.');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await ProductosService.guardarProducto(productoData);

      if (error) {
        toast.error(`No se pudo guardar: ${error.message}`, { duration: 5000 });
        return false;
      }

      toast.success('¡Producto guardado exitosamente!');
      await cargarProductos(); 
      return true;
    } catch (err) {
      console.error("Error en guardarProducto:", err);
      toast.error("Error inesperado al procesar la solicitud.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarProductos]);

  const toggleEstatus = useCallback(async (id, estatusActual) => {
    try {
      const { error } = await ProductosService.toggleEstatusProducto(id, estatusActual);
      
      if (error) {
        toast.error(`Error al actualizar estatus: ${error.message}`);
        return false;
      }

      setProductos(prev => 
        prev.map(prod => prod.id === id ? { ...prod, activo: !estatusActual } : prod)
      );
      
      toast.success(estatusActual ? 'Producto desactivado' : 'Producto activado');
      return true;
    } catch (err) {
      toast.error("Error crítico al cambiar el estatus.");
      return false;
    }
  }, []);

  return {
    loading,
    productos: productosFiltrados, // Entregamos la lista ya filtrada
    catalogos,
    filtroBusqueda,
    setFiltroBusqueda,
    catActiva,
    setCatActiva,
    listaCategoriasFiltro,
    cargarProductos,
    cargarCatalogosFormulario,
    guardarProducto,
    toggleEstatus
  };
};