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
    areas: []
  });

  // ==========================================
  // OBTENER DATOS
  // ==========================================
  const cargarProductos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await ProductosService.getProductos();
    setLoading(false);

    if (error) {
      toast.error(`Error de carga: ${error.message || 'No se pudo obtener la lista'}`);
      return;
    }
    setProductos(data || []);
  }, []);

  const cargarCatalogosFormulario = useCallback(async () => {
    setLoading(true);
    const data = await ProductosService.getCatalogosFormulario();
    setLoading(false);

    if (data.errores) {
      toast.error('Error al sincronizar catálogos de apoyo');
    }
    setCatalogos({
      proveedores: data.proveedores,
      sucursales: data.sucursales,
      unidades: data.unidades,
      areas: data.areas
    });
  }, []);

  // ==========================================
  // GUARDAR DATOS (Crear o Editar)
  // ==========================================
  const guardarProducto = async (productoData) => {
    setLoading(true);
    const { data, error } = await ProductosService.guardarProducto(productoData);
    setLoading(false);

    if (error) {
      // --- TRATAMIENTO DETALLADO DEL ERROR ---
      const mensajePrincipal = error.message || 'Error desconocido';
      const pista = error.hint ? `\nSugerencia: ${error.hint}` : '';
      const detalles = error.details ? `\nDetalles: ${error.details}` : '';
      
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
  };

  // ==========================================
  // CAMBIAR ESTATUS (Activar/Desactivar)
  // ==========================================
  const toggleEstatus = async (id, estatusActual) => {
    const { error } = await ProductosService.toggleEstatusProducto(id, estatusActual);
    
    if (error) {
      toast.error(`Error al actualizar estatus: ${error.message}`);
      return false;
    }

    setProductos(productos.map(prod => 
      prod.id === id ? { ...prod, activo: !estatusActual } : prod
    ));
    
    toast.success(estatusActual ? 'Producto desactivado' : 'Producto activado');
    return true;
  };

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