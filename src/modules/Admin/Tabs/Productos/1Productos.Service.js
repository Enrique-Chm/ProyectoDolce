// src/modules/Admin/Tabs/Productos/1Productos.Service.js
import { supabase } from '../../../../lib/supabaseClient';

export const ProductosService = {
  // ==========================================
  // LECTURA DE PRODUCTOS (CON RELACIONES)
  // ==========================================
  /**
   * Recupera el catálogo de productos con sus relaciones descriptivas.
   * Cruza datos con UM, Categorías y ambos proveedores (Titular y Respaldo).
   */
  async getProductos() {
    // 1. Cargamos todos los productos con sus nombres de catálogos
    const { data: productos, error } = await supabase
      .from('BD_Productos')
      .select(`
        *,
        unidad_medida:Cat_UM(id, nombre, abreviatura),
        proveedor:Cat_Proveedores!proveedor_id(id, nombre),
        proveedor_secundario:Cat_Proveedores!proveedor_secundario_id(id, nombre),
        categoria:Cat_Categorias(id, nombre)
      `)
      .order('nombre', { ascending: true });

    if (error) {
      console.error("Error al obtener productos:", error.message);
      return { data: null, error };
    }

    // 2. Cargamos las sucursales para el mapeo de nombres
    const { data: sucursales, error: errSucs } = await supabase
      .from('Cat_sucursales')
      .select('id, nombre');

    if (errSucs) {
      console.error("Error al obtener sucursales:", errSucs.message);
      return { data: productos, error: null }; 
    }

    const sucursalesMap = (sucursales || []).reduce((acc, s) => {
      acc[s.id] = s.nombre;
      return acc;
    }, {});

    // 3. Normalización de datos para que el motor de búsqueda del Hook sea infalible
    const dataEnriquecida = (productos || []).map(p => {
      const ids = p.sucursales_ids || [];
      return {
        ...p,
        // Propiedades aplanadas para búsqueda instantánea
        categoria_nombre: p.categoria?.nombre || 'Sin Categoría',
        um_abreviatura: p.unidad_medida?.abreviatura || 'pz',
        // Información de sucursales para etiquetas en la UI
        sucursales_info: ids.map(id => ({ id, nombre: sucursalesMap[id] || 'Desconocida' }))
      };
    });

    return { data: dataEnriquecida, error: null };
  },

  // ==========================================
  // GUARDAR (INSERT / UPDATE)
  // ==========================================
  /**
   * Gestiona el guardado respetando el esquema operativo sin costos.
   */
  async guardarProducto(productoData) {
    try {
      const rawData = { ...productoData };
      const esNuevo = !rawData.id || rawData.id === "" || rawData.id === "null";

      const dataParaBD = {
        nombre: rawData.nombre,
        marca: rawData.marca || null,
        presentacion: rawData.presentacion || null,
        contenido: (rawData.contenido === "" || rawData.contenido === undefined) ? null : Number(rawData.contenido),
        
        um_id: rawData.um_id || null,
        categoria_id: rawData.categoria_id || null,
        proveedor_id: rawData.proveedor_id || null,
        proveedor_secundario_id: rawData.proveedor_secundario_id || null,
        
        activo: rawData.activo ?? true,
        sucursales_ids: Array.isArray(rawData.sucursales_ids) ? rawData.sucursales_ids : [],
        turno_uso: rawData.turno_uso || 'Ambos' // Almacena el turno asignado ('AM', 'PM' o 'Ambos')
      };

      let query;
      if (esNuevo) {
        query = supabase.from('BD_Productos').insert([dataParaBD]);
      } else {
        query = supabase.from('BD_Productos').update(dataParaBD).eq('id', rawData.id);
      }

      const { data, error } = await query.select().single();
      if (error) throw error;

      return { data, error: null };

    } catch (err) {
      console.error("Error en guardarProducto:", err);
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
  /**
   * Carga las opciones para los selectores del formulario.
   */
  async getCatalogosFormulario() {
    try {
      const [proveedores, sucursales, unidades, categorias] = await Promise.all([
        supabase.from('Cat_Proveedores').select('id, nombre').eq('estatus', 'Activo').order('nombre'),
        supabase.from('Cat_sucursales').select('id, nombre').eq('estatus', 'Activo').order('nombre'),
        supabase.from('Cat_UM').select('id, nombre, abreviatura').eq('estatus', 'Activo').order('nombre'),
        // Sincronizamos con el estatus 'Activo' (o 'activo' según tu BD)
        supabase.from('Cat_Categorias').select('id, nombre').order('nombre')
      ]);

      return {
        proveedores: proveedores.data || [],
        sucursales: sucursales.data || [],
        unidades: unidades.data || [],
        categorias: categorias.data || [],
        error: proveedores.error || sucursales.error || unidades.error || categorias.error
      };
    } catch (err) {
      console.error("Error al cargar catálogos:", err);
      return { proveedores: [], sucursales: [], unidades: [], categorias: [], error: err };
    }
  }
};