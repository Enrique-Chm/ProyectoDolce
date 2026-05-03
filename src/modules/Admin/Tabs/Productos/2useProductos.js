// src/modules/Admin/Tabs/Productos/2useProductos.js
import { useState, useCallback } from 'react';
import { ProductosService } from './1Productos.Service';
import toast from 'react-hot-toast';

export const useProductos = () => {
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  
  const [catalogos, setCatalogos] = useState({
    proveedores: [],
    sucursales: [],
    unidades: [],
    categorias: [] 
  });

  // ==========================================
  // OBTENER DATOS
  // ==========================================
  const cargarProductos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await ProductosService.getProductos();
      if (error) {
        toast.error(`Error de carga: ${error.message || 'No se pudo obtener la lista'}`);
        return;
      }
      setProductos(data || []);
    } catch (err) {
      console.error("Error inesperado al cargar productos:", err);
      toast.error("Error de conexión al cargar la lista de productos.");
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarCatalogosFormulario = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ProductosService.getCatalogosFormulario();
      if (data.errores) {
        console.error("Errores al sincronizar catálogos:", data.errores);
        toast.error('Error al sincronizar algunos catálogos de apoyo');
      }
      setCatalogos({
        proveedores: data.proveedores || [],
        sucursales: data.sucursales || [],
        unidades: data.unidades || [],
        categorias: data.categorias || []
      });
    } catch (err) {
      console.error("Error inesperado al cargar catálogos:", err);
      toast.error("No se pudieron obtener los catálogos del servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // GUARDAR DATOS (Crear o Editar)
  // ==========================================
  const guardarProducto = useCallback(async (productoData) => {
    // --- VALIDACIONES DE NEGOCIO EN EL FRONTEND ---
    if (!productoData.nombre || productoData.nombre.trim() === '') {
      toast.error('El nombre del producto es obligatorio.');
      return false;
    }

    if (productoData.costo_actual !== undefined && productoData.costo_actual !== null && productoData.costo_actual !== '') {
      if (isNaN(Number(productoData.costo_actual)) || Number(productoData.costo_actual) < 0) {
        toast.error('El costo del producto no puede ser un valor negativo.');
        return false;
      }
    }

    if (productoData.contenido !== undefined && productoData.contenido !== null && productoData.contenido !== '') {
      if (isNaN(Number(productoData.contenido)) || Number(productoData.contenido) <= 0) {
        toast.error('El contenido debe ser un número válido mayor a 0.');
        return false;
      }
    }

    setLoading(true);
    try {
      // Nos aseguramos de que sucursales_ids sea siempre un arreglo válido antes de enviar
      const payload = {
        ...productoData,
        sucursales_ids: Array.isArray(productoData.sucursales_ids) ? productoData.sucursales_ids : []
      };

      const { data, error } = await ProductosService.guardarProducto(payload);

      if (error) {
        // --- TRATAMIENTO DETALLADO DEL ERROR ---
        const mensajePrincipal = error.message || 'Error desconocido';
        const pista = error.hint ? `\nSugerencia: ${error.hint}` : '';
        
        // Mostramos un toast persistente para que el usuario alcance a leer el error técnico
        toast.error(
          `No se pudo guardar:\n${mensajePrincipal}${pista}`,
          { duration: 6000, style: { minWidth: '300px' } }
        );
        
        console.error("Error técnico completo:", error);
        return false;
      }

      toast.success('¡Producto guardado exitosamente!');
      await cargarProductos(); 
      return true;
    } catch (err) {
      console.error("Error inesperado en guardarProducto:", err);
      toast.error("Error inesperado al guardar el producto.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarProductos]);

  // ==========================================
  // CAMBIAR ESTATUS (Activar/Desactivar)
  // ==========================================
  const toggleEstatus = useCallback(async (id, estatusActual) => {
    try {
      const { error } = await ProductosService.toggleEstatusProducto(id, estatusActual);
      
      if (error) {
        toast.error(`Error al actualizar estatus: ${error.message}`);
        return false;
      }

      // Uso de actualizador funcional para evitar closures obsoletos de React
      setProductos(prevProductos => 
        prevProductos.map(prod => 
          prod.id === id ? { ...prod, activo: !estatusActual } : prod
        )
      );
      
      toast.success(estatusActual ? 'Producto desactivado' : 'Producto activado');
      return true;
    } catch (err) {
      console.error("Error inesperado en toggleEstatus:", err);
      toast.error("Error inesperado al cambiar el estatus del producto.");
      return false;
    }
  }, []);

  return {
    loading,
    productos,
    catalogos,
    cargarProductos,
    cargarCatalogosFormulario,
    guardarProducto,
    toggleEstatus
  };
};