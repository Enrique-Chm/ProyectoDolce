// src/modules/Admin/Tabs/Productos/1Productos.Service.js
import { supabase } from '../../../../lib/supabaseClient';

export const ProductosService = {
  // ==========================================
  // LECTURA DE PRODUCTOS (CON RELACIONES)
  // ==========================================
  async getProductos() {
    // 1. Cargamos todos los productos con sus nombres de catálogos
    // Nota: Aunque usamos *, como eliminaste la columna en SQL, ya no traerá costos.
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

    // 2. Cargamos las sucursales para mapear los nombres del array sucursales_ids
    const { data: sucursales, error: errSucs } = await supabase
      .from('Cat_sucursales')
      .select('id, nombre');

    if (errSucs) {
      console.error("Error al obtener sucursales:", errSucs.message);
      return { data: productos, error: null }; 
    }

    // 3. Mapeo para transformar IDs de sucursales en objetos legibles para la UI
    const sucursalesMap = (sucursales || []).reduce((acc, s) => {
      acc[s.id] = s.nombre;
      return acc;
    }, {});

    const dataEnriquecida = (productos || []).map(p => {
      const ids = p.sucursales_ids || [];
      return {
        ...p,
        // Propiedad virtual para que el frontend muestre los nombres de sucursales fácilmente
        sucursales_info: ids.map(id => ({ id, nombre: sucursalesMap[id] || 'Desconocida' }))
      };
    });

    return { data: dataEnriquecida, error: null };
  },

  // ==========================================
  // GUARDAR (INSERT / UPDATE)
  // ==========================================
  async guardarProducto(productoData) {
    try {
      // 1. Clonamos el objeto para limpiar datos antes de enviar a BD
      const rawData = { ...productoData };

      // 2. Identificar si es nuevo (id nulo o inexistente)
      const esNuevo = !rawData.id || rawData.id === "" || rawData.id === "null";

      // 3. Objeto limpio que respeta estrictamente las columnas de la tabla
      // SE ELIMINÓ: costo_actual para evitar errores de columna inexistente
      const dataParaBD = {
        nombre: rawData.nombre,
        marca: rawData.marca || null,
        presentacion: rawData.presentacion || null,
        contenido: (rawData.contenido === "" || rawData.contenido === undefined) ? null : Number(rawData.contenido),
        
        // Relaciones UUID (Si vienen vacíos, deben ser null para no romper el Foreign Key)
        um_id: rawData.um_id || null,
        categoria_id: rawData.categoria_id || null,
        proveedor_id: rawData.proveedor_id || null,
        proveedor_secundario_id: rawData.proveedor_secundario_id || null,
        
        // Control y Arrays
        activo: rawData.activo ?? true,
        sucursales_ids: Array.isArray(rawData.sucursales_ids) ? rawData.sucursales_ids : []
      };

      let query;

      if (esNuevo) {
        // Inserción de registro nuevo
        query = supabase
          .from('BD_Productos')
          .insert([dataParaBD]);
      } else {
        // Actualización de registro existente
        query = supabase
          .from('BD_Productos')
          .update(dataParaBD)
          .eq('id', rawData.id);
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
  // CAMBIO DE ESTATUS (ACTIVAR/DESACTIVAR)
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
  // CATÁLOGOS PARA SELECTS DEL FORMULARIO
  // ==========================================
  async getCatalogosFormulario() {
    try {
      // Cargamos todo en paralelo para optimizar tiempos de respuesta
      const [proveedores, sucursales, unidades, categorias] = await Promise.all([
        supabase.from('Cat_Proveedores').select('id, nombre').eq('estatus', 'Activo').order('nombre'),
        supabase.from('Cat_sucursales').select('id, nombre').eq('estatus', 'Activo').order('nombre'),
        supabase.from('Cat_UM').select('id, nombre, abreviatura').eq('estatus', 'Activo').order('nombre'),
        supabase.from('Cat_Categorias').select('id, nombre').eq('estatus', 'activo').order('nombre')
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