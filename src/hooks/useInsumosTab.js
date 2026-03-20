// Archivo: src/hooks/useInsumosTab.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { hasPermission } from '../utils/checkPermiso';
import toast from 'react-hot-toast';

export const useInsumosTab = (sucursalId) => {
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🛡️ SEGURIDAD INTERNA (RBAC)
  const puedeVer = hasPermission('ver_insumos');
  const puedeEditar = hasPermission('editar_insumos');
  const puedeBorrar = hasPermission('borrar_insumos');

  const [formData, setFormData] = useState({
    nombre: '',
    modelo: '',
    proveedor: '',
    caja_master: '',
    costo_por_caja: '',
    contenido_neto: '',
    unidad_medida: '',
    factor_rendimiento: '1.00',
    dias_reabastecimiento: '',
    categoria: ''
  });

  const fetchData = useCallback(async () => {
    if (!puedeVer) return;
    setLoading(true);
    try {
      const [ins, prov, uni, cat] = await Promise.all([
        supabase
          .from('lista_insumo')
          .select('*, proveedores(nombre_empresa), cat_unidades_medida(abreviatura), cat_categoria_insumos(nombre)')
          .eq('sucursal_id', sucursalId)
          .order('nombre'),
        supabase.from('proveedores').select('id, nombre_empresa'),
        supabase.from('cat_unidades_medida').select('id, nombre, abreviatura'),
        supabase.from('cat_categoria_insumos').select('id, nombre')
      ]);

      setInsumos(ins.data || []);
      setProveedores(prov.data || []);
      setUnidades(uni.data || []);
      setCategorias(cat.data || []);
    } catch (error) {
      console.error("Error al cargar insumos:", error);
      toast.error("Error al sincronizar catálogo de insumos.");
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVer]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const resetForm = () => {
    setEditId(null);
    setFormData({
      nombre: '', modelo: '', proveedor: '', caja_master: '',
      costo_por_caja: '', contenido_neto: '', unidad_medida: '',
      factor_rendimiento: '1.00', dias_reabastecimiento: '', categoria: ''
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!puedeEditar) return toast.error("No tienes permiso para modificar insumos."); 
    if (!formData.categoria) return toast.error("Selecciona una Categoría.");
    if (!formData.proveedor) return toast.error("Selecciona un Proveedor.");
    if (!formData.unidad_medida) return toast.error("Selecciona una Unidad de Medida.");

    const tId = toast.loading(editId ? "Actualizando insumo..." : "Guardando insumo...");
    setLoading(true);

    try {
      const costoCaja = parseFloat(formData.costo_por_caja) || 0;
      const contenido = parseFloat(formData.contenido_neto) || 1;

      const payload = {
        nombre: formData.nombre,
        modelo: formData.modelo,
        proveedor: parseInt(formData.proveedor),
        caja_master: parseInt(formData.caja_master) || 0,
        costo_por_caja: costoCaja,
        contenido_neto: contenido,
        unidad_medida: parseInt(formData.unidad_medida),
        costo_unitario: costoCaja / contenido,
        factor_rendimiento: parseFloat(formData.factor_rendimiento) || 1,
        dias_reabastecimiento: parseInt(formData.dias_reabastecimiento) || 0,
        categoria: parseInt(formData.categoria),
        sucursal_id: sucursalId,
        update_at: new Date().toISOString()
      };

      const { error } = editId 
        ? await supabase.from('lista_insumo').update(payload).eq('id', editId)
        : await supabase.from('lista_insumo').insert([payload]);

      if (error) throw error;

      toast.success(editId ? "Insumo actualizado" : "Insumo registrado", { id: tId });
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Error: " + error.message, { id: tId });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!puedeBorrar) return toast.error("Acceso denegado para borrar registros.");
    
    const tId = toast.loading("Eliminando insumo...");
    try {
      const { error } = await supabase.from('lista_insumo').delete().eq('id', id);
      if (error) throw error;
      toast.success("Insumo eliminado", { id: tId });
      fetchData();
    } catch (error) {
      toast.error("Error al eliminar: " + error.message, { id: tId });
    }
  };

  const prepararEdicion = (insumo) => {
    setEditId(insumo.id);
    setFormData({
      ...insumo,
      proveedor: insumo.proveedor || '',
      unidad_medida: insumo.unidad_medida || '',
      categoria: insumo.categoria || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    insumos: puedeVer ? insumos : [],
    proveedores, unidades, categorias, loading, editId, formData, setFormData,
    puedeVer, puedeEditar, puedeBorrar,
    handleSubmit, resetForm, handleDelete, prepararEdicion
  };
};