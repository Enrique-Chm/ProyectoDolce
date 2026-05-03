// src/modules/Admin/Tabs/Productos/1Productos.Service.js
import { supabase } from '../../../../lib/supabaseClient';

export const ProductosService = {
  // ==========================================
  // LECTURA DE PRODUCTOS
  // ==========================================
  async getProductos() {
    // 1. Cargamos todos los productos
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

    // 2. Cargamos las sucursales para mapear los nombres a sus respectivos IDs
    const { data: sucursales, error: errSucs } = await supabase
      .from('Cat_sucursales')
      .select('id, nombre');

    if (errSucs) {
      console.error("Error al obtener sucursales para el catálogo:", errSucs.message);
      return { data: productos, error: null }; // Retorno preventivo si falla la relación
    }

    // 3. Mapeamos las sucursales vinculadas a cada producto
    const sucursalesMap = (sucursales || []).reduce((acc, s) => {
      acc[s.id] = s.nombre;
      return acc;
    }, {});

    const dataEnriquecida = (productos || []).map(p => {
      const ids = p.sucursales_ids || [];
      return {
        ...p,
        sucursales: ids.map(id => ({ id, nombre: sucursalesMap[id] || 'Sucursal eliminada' }))
      };
    });

    return { data: dataEnriquecida, error: null };
  },

  // ==========================================
  // CREACIÓN Y EDICIÓN (INSERT / UPDATE EXPLÍCITO)
  // ==========================================
  async guardarProducto(productoData) {
    try {
      // 1. Clonamos para no mutar el estado original
      const dataLimpia = { ...productoData };

      const esNuevo = !dataLimpia.id || dataLimpia.id === "" || dataLimpia.id === "null";

      // 2. ELIMINAR ID SI ES NUEVO: 
      if (esNuevo) {
        delete dataLimpia.id;
      }

      // 3. LIMPIEZA DE LLAVES FORÁNEAS (UUIDs):
      const camposRelacionales = ['proveedor_id', 'proveedor_secundario_id', 'um_id', 'categoria_id'];
      camposRelacionales.forEach(campo => {
        if (dataLimpia[campo] === "" || dataLimpia[campo] === undefined) {
          dataLimpia[campo] = null;
        }
      });

      // 4. LIMPIEZA Y PARSEO NUMÉRICO SEGURO:
      dataLimpia.costo_actual = (dataLimpia.costo_actual === "" || dataLimpia.costo_actual === undefined || isNaN(Number(dataLimpia.costo_actual))) 
        ? null 
        : Number(dataLimpia.costo_actual);

      dataLimpia.contenido = (dataLimpia.contenido === "" || dataLimpia.contenido === undefined || isNaN(Number(dataLimpia.contenido))) 
        ? null 
        : Number(dataLimpia.contenido);

      // 5. NORMALIZACIÓN DE ARRAY DE SUCURSALES:
      if (!Array.isArray(dataLimpia.sucursales_ids)) {
        dataLimpia.sucursales_ids = [];
      }

      // Eliminamos campos de apoyo visual
      delete dataLimpia.sucursales;
      delete dataLimpia.sucursal;

      // 6. EJECUCIÓN EN SUPABASE
      let respuesta;
      if (esNuevo) {
        respuesta = await supabase
          .from('BD_Productos')
          .insert([dataLimpia])
          .select()
          .single();
      } else {
        respuesta = await supabase
          .from('BD_Productos')
          .update(dataLimpia)
          .eq('id', dataLimpia.id)
          .select()
          .single();
      }

      const { data, error } = respuesta;

      if (error) {
        console.error("Error detallado de Supabase:", error);
        return { 
          data: null, 
          error: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          } 
        };
      }

      return { data, error: null };

    } catch (err) {
      console.error("Error inesperado en el Service:", err);
      return { data: null, error: { message: "Error de conexión o de red" } };
    }
  },

  // ==========================================
  // BORRADO LÓGICO INDIVIDUAL (Desactivar)
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
  // DEPENDENCIAS PARA EL FORMULARIO
  // ==========================================
  async getCatalogosFormulario() {
    try {
      const [proveedores, sucursales, unidades, categorias] = await Promise.all([
        supabase.from('Cat_Proveedores').select('id, nombre').order('nombre'),
        supabase.from('Cat_sucursales').select('id, nombre').order('nombre'),
        supabase.from('Cat_UM').select('id, nombre, abreviatura').eq('estatus', 'Activo').order('nombre'),
        supabase.from('Cat_Categorias').select('id, nombre').eq('estatus', 'activo').order('nombre')
      ]);

      return {
        proveedores: proveedores.data || [],
        sucursales: sucursales.data || [],
        unidades: unidades.data || [],
        categorias: categorias.data || [],
        errores: proveedores.error || sucursales.error || unidades.error || categorias.error
      };
    } catch (err) {
      return { proveedores: [], sucursales: [], unidades: [], categorias: [], errores: err };
    }
  }
};