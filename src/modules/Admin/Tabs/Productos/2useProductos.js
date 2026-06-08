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
    categorias: [],
    productosAlternos: []
  });

  // ==========================================
  // 1. CARGA DE DATOS Y NORMALIZACIÓN
  // ==========================================

  /**
   * Carga únicamente la lista de productos.
   * Se llama después de guardar para refrescar la lista sin recargar catálogos.
   * El service ya normaliza categoria_nombre, um_abreviatura y sucursales_info,
   * por lo que no es necesario volver a mapear los datos aquí.
   */
  const cargarProductos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await ProductosService.getProductos();
      if (error) {
        toast.error(`Error de carga: ${error.message || 'No se pudo obtener la lista'}`);
        return;
      }
      // CORRECCIÓN: El service ya entrega los datos normalizados.
      // Se eliminó el .map() redundante que recalculaba categoria_nombre y um_abreviatura.
      setProductos(data || []);
    } catch (err) {
      console.error("Error inesperado al cargar productos:", err);
      toast.error("Error de conexión al cargar la lista.");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carga los catálogos auxiliares para los selectores del formulario.
   * Se mantiene como función independiente por si se necesita refrescar solo los catálogos.
   */
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
        categorias: data.categorias || [],
        productosAlternos: data.productosAlternos || []
      });
    } catch (err) {
      console.error("Error inesperado al cargar catálogos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carga inicial: productos y catálogos en paralelo bajo un solo estado de loading.
   * CORRECCIÓN: Reemplaza la doble llamada independiente del componente que causaba
   * que loading se activara y desactivara dos veces de forma desincronizada (race condition).
   */
  const inicializar = useCallback(async () => {
    setLoading(true);
    try {
      const [productosResult, catalogosData] = await Promise.all([
        ProductosService.getProductos(),
        ProductosService.getCatalogosFormulario()
      ]);

      if (productosResult.error) {
        toast.error(`Error de carga: ${productosResult.error.message || 'No se pudo obtener la lista'}`);
      } else {
        // El service ya normaliza: categoria_nombre, um_abreviatura y sucursales_info
        setProductos(productosResult.data || []);
      }

      if (catalogosData.error) {
        console.error("Errores al sincronizar catálogos:", catalogosData.error);
        toast.error('Aviso: Algunos catálogos de apoyo no se cargaron correctamente.');
      }

      setCatalogos({
        proveedores: catalogosData.proveedores || [],
        sucursales: catalogosData.sucursales || [],
        unidades: catalogosData.unidades || [],
        categorias: catalogosData.categorias || [],
        productosAlternos: catalogosData.productosAlternos || []
      });
    } catch (err) {
      console.error("Error inesperado en inicialización:", err);
      toast.error("Error de conexión al cargar los datos.");
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
      // Filtro 2: Por Texto (Nombre, Marca, Categoría o Turno de uso)
      const search = filtroBusqueda.toLowerCase();
      const coincideTexto = 
        p.nombre.toLowerCase().includes(search) ||
        (p.marca || '').toLowerCase().includes(search) ||
        (p.turno_uso || '').toLowerCase().includes(search) ||
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
    // Validación de seguridad para la Opción B: Un artículo no puede ser su propio equivalente
    if (productoData.id && productoData.producto_equivalente_id && productoData.id === productoData.producto_equivalente_id) {
      toast.error('Un producto no puede ser su propio equivalente de Opción B.');
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
    productos: productosFiltrados,
    catalogos,
    filtroBusqueda,
    setFiltroBusqueda,
    catActiva,
    setCatActiva,
    listaCategoriasFiltro,
    inicializar,           // ← Nuevo: carga inicial unificada
    cargarProductos,
    cargarCatalogosFormulario,
    guardarProducto,
    toggleEstatus
  };
};