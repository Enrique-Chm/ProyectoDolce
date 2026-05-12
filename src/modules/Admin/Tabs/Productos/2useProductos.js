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
  // OBTENER DATOS (LISTADO)
  // ==========================================
  const cargarProductos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await ProductosService.getProductos();
      if (error) {
        toast.error(`Error de carga: ${error.message || 'No se pudo obtener la lista'}`);
        return;
      }
      // El service ya devuelve la data enriquecida con sucursales_info y relaciones
      setProductos(data || []);
    } catch (err) {
      console.error("Error inesperado al cargar productos:", err);
      toast.error("Error de conexión al cargar la lista de productos.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // CARGAR OPCIONES PARA SELECTS (UI)
  // ==========================================
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
      toast.error("No se pudieron obtener los catálogos del servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // GUARDAR DATOS (CREAR O EDITAR)
  // ==========================================
  const guardarProducto = useCallback(async (productoData) => {
    // --- VALIDACIONES DE NEGOCIO (FRONTEND) ---
    if (!productoData.nombre || productoData.nombre.trim() === '') {
      toast.error('El nombre del producto es obligatorio.');
      return false;
    }

    // Validación de categorías y unidades (Obligatorias según tu lógica de BD)
    if (!productoData.categoria_id) {
      toast.error('Debes seleccionar una categoría.');
      return false;
    }

    if (!productoData.um_id) {
      toast.error('Debes seleccionar una unidad de medida.');
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await ProductosService.guardarProducto(productoData);

      if (error) {
        // Tratamiento detallado del error de la base de datos
        const mensajePrincipal = error.message || 'Error desconocido';
        const pista = error.hint ? `\nSugerencia: ${error.hint}` : '';
        
        toast.error(
          `No se pudo guardar:\n${mensajePrincipal}${pista}`,
          { duration: 6000 }
        );
        return false;
      }

      toast.success('¡Producto guardado exitosamente!');
      await cargarProductos(); // Refrescamos la lista principal
      return true;
    } catch (err) {
      console.error("Error inesperado en guardarProducto:", err);
      toast.error("Error inesperado al procesar la solicitud.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarProductos]);

  // ==========================================
  // CAMBIAR ESTATUS (ACTIVAR/DESACTIVAR)
  // ==========================================
  const toggleEstatus = useCallback(async (id, estatusActual) => {
    try {
      const { error } = await ProductosService.toggleEstatusProducto(id, estatusActual);
      
      if (error) {
        toast.error(`Error al actualizar estatus: ${error.message}`);
        return false;
      }

      // Actualizamos el estado local inmediatamente para una UI reactiva
      setProductos(prevProductos => 
        prevProductos.map(prod => 
          prod.id === id ? { ...prod, activo: !estatusActual } : prod
        )
      );
      
      toast.success(estatusActual ? 'Producto desactivado' : 'Producto activado');
      return true;
    } catch (err) {
      console.error("Error inesperado en toggleEstatus:", err);
      toast.error("Error crítico al cambiar el estatus.");
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