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
  /**
   * Carga la lista de productos enriquecida desde el servicio.
   */
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

  // ==========================================
  // CARGAR OPCIONES PARA SELECTS (UI)
  // ==========================================
  /**
   * Sincroniza los catálogos necesarios para los formularios.
   * Recupera proveedores, sucursales, unidades y categorías.
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
  /**
   * Procesa el guardado de un producto incluyendo la lógica de proveedores.
   */
  const guardarProducto = useCallback(async (productoData) => {
    // --- VALIDACIONES DE NEGOCIO ---
    if (!productoData.nombre || productoData.nombre.trim() === '') {
      toast.error('El nombre del producto es obligatorio.');
      return false;
    }

    if (!productoData.categoria_id) {
      toast.error('Debes seleccionar una categoría.');
      return false;
    }

    if (!productoData.um_id) {
      toast.error('Debes seleccionar una unidad de medida.');
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
      /**
       * Enviamos el objeto completo. 
       * El servicio debe estar listo para recibir proveedor_id y proveedor_secundario_id.
       */
      const { error } = await ProductosService.guardarProducto(productoData);

      if (error) {
        const mensajePrincipal = error.message || 'Error desconocido';
        toast.error(`No se pudo guardar:\n${mensajePrincipal}`, { duration: 5000 });
        return false;
      }

      toast.success('¡Producto guardado exitosamente!');
      await cargarProductos(); // Refrescamos para ver el nuevo icono de "Respaldo" si aplica
      return true;
    } catch (err) {
      console.error("Error en guardarProducto:", err);
      toast.error("Error inesperado al procesar la solicitud.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [cargarProductos]);

  // ==========================================
  // CAMBIAR ESTATUS (ACTIVAR/DESACTIVAR)
  // ==========================================
  /**
   * Alterna el estado de visibilidad del producto.
   */
  const toggleEstatus = useCallback(async (id, estatusActual) => {
    try {
      const { error } = await ProductosService.toggleEstatusProducto(id, estatusActual);
      
      if (error) {
        toast.error(`Error al actualizar estatus: ${error.message}`);
        return false;
      }

      // Actualización optimista
      setProductos(prevProductos => 
        prevProductos.map(prod => 
          prod.id === id ? { ...prod, activo: !estatusActual } : prod
        )
      );
      
      toast.success(estatusActual ? 'Producto desactivado' : 'Producto activado');
      return true;
    } catch (err) {
      console.error("Error en toggleEstatus:", err);
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