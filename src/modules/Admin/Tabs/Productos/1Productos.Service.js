// src/modules/Admin/Tabs/Productos/1Productos.Service.js
import { supabase } from '../../../../lib/supabaseClient';

export const ProductosService = {
  // ==========================================
  // LECTURA DE PRODUCTOS (CON RELACIONES)
  // ==========================================
  /**
   * Recupera el catálogo de productos con sus relaciones descriptivas.
   * Mapea unidades de medida, categorías y ambos proveedores (Principal y Secundario).
   */
  async getProductos() {
    // 1. Cargamos todos los productos con sus nombres de catálogos
    const { data: productos, error } = await supabase
      .from('BD_Productos')
      .select(`
        *,
        unidad_medida:Cat_UM(nombre, abreviatura),
        proveedor:Cat_Proveedores!proveedor_id(nombre),
        proveedor_secundario:Cat_Proveedores!proveedor_secundario_id(nombre),
        categoria:Cat_Categorias(nombre)
      `)
      .order('nombre', { ascending: true });

    if (error) {
      console.error("Error al obtener productos:", error.message);
      return { data: null, error };
    }

    // 2. Cargamos las sucursales para el mapeo de nombres en la visualización
    const { data: sucursales, error: errSucs } = await supabase
      .from('Cat_sucursales')
      .select('id, nombre');

    if (errSucs) {
      console.error("Error al obtener sucursales:", errSucs.message);
      return { data: productos, error: null }; 
    }

    // 3. Transformación para que la UI gestione nombres de sucursales en lugar de UUIDs
    const sucursalesMap = (sucursales || []).reduce((acc, s) => {
      acc[s.id] = s.nombre;
      return acc;
    }, {});

    const dataEnriquecida = (productos || []).map(p => {
      const ids = p.sucursales_ids || [];
      return {
        ...p,
        // Propiedad virtual para mostrar tags de sucursales fácilmente
        sucursales_info: ids.map(id => ({ id, nombre: sucursalesMap[id] || 'Desconocida' })),
        categoria_nombre: p.categoria?.nombre || 'S/C',
        um_abreviatura: p.unidad_medida?.abreviatura || 'pz'
      };
    });

    return { data: dataEnriquecida, error: null };
  },

  // ==========================================
  // GUARDAR (INSERT / UPDATE)
  // ==========================================
  /**
   * Gestiona el ciclo de vida del registro. 
   * Realiza limpieza de datos para cumplir con el esquema operativo (Sin costos).
   */
  async guardarProducto(productoData) {
    try {
      const rawData = { ...productoData };
      const esNuevo = !rawData.id || rawData.id === "" || rawData.id === "null";

      // Objeto estrictamente tipado para la base de datos
      const dataParaBD = {
        nombre: rawData.nombre,
        marca: rawData.marca || null,
        presentacion: rawData.presentacion || null,
        contenido: (rawData.contenido === "" || rawData.contenido === undefined) ? null : Number(rawData.contenido),
        
        // Relaciones UUID (Obligatorias y Opcionales)
        um_id: rawData.um_id || null,
        categoria_id: rawData.categoria_id || null,
        proveedor_id: rawData.proveedor_id || null,
        proveedor_secundario_id: rawData.proveedor_secundario_id || null,
        
        // Control de Estado y Visibilidad
        activo: rawData.activo ?? true,
        sucursales_ids: Array.isArray(rawData.sucursales_ids) ? rawData.sucursales_ids : []
      };

      let query;

      if (esNuevo) {
        query = supabase
          .from('BD_Productos')
          .insert([dataParaBD]);
      } else {
        query = supabase
          .from('BD_Productos')
          .update(dataParaBD)
          .eq('id', rawData.id);
      }

      const { data, error } = await query.select().single();

      if (error) throw error;
      return { data, error: null };

    } catch (err) {
      console.error("Error en flujo guardarProducto:", err);
      return { data: null, error: err };
    }
  },

  // ==========================================
  // CAMBIO DE ESTATUS
  // ==========================================
  async toggleEstatusProducto(id, estatusActual) {
    const { data, error } = await supabase
      .from('BD_Productos')
      .update({ activo: !estatusActual })
      .eq('id', id)
      .select();

    return { data, error };
  },

  // ==========================================
  // CATÁLOGOS AUXILIARES
  // ==========================================
  async getCatalogosFormulario() {
    try {
      // Carga paralela para minimizar latencia en la apertura del formulario
      const [proveedores, sucursales, unidades, categorias] = await Promise.all([
        supabase.from('Cat_Proveedores').select('id, nombre').eq('estatus', 'Activo').order('nombre'),
        supabase.from('Cat_sucursales').select('id, nombre').eq('estatus', 'Activo').order('nombre'),
        supabase.from('Cat_UM').select('id, nombre, abreviatura').eq('estatus', 'Activo').order('nombre'),
        supabase.from('Cat_Categorias').select('id, nombre').eq('estatus', 'Activo').order('nombre')
      ]);

      return {
        proveedores: proveedores.data || [],
        sucursales: sucursales.data || [],
        unidades: unidades.data || [],
        categorias: categorias.data || [],
        error: proveedores.error || sucursales.error || unidades.error || categorias.error
      };
    } catch (err) {
      console.error("Fallo crítico al cargar catálogos:", err);
      return { proveedores: [], sucursales: [], unidades: [], categorias: [], error: err };
    }
  }
};