// src/modules/Admin/Tabs/Productos/1Productos.Service.js
import { supabase } from '../../../../lib/supabaseClient';

export const ProductosService = {
  // ==========================================
  // LECTURA DE PRODUCTOS
  // ==========================================
  async getProductos() {
    const { data, error } = await supabase
      .from('BD_Productos')
      .select(`
        *,
        unidad_medida:Cat_UM(nombre, abreviatura),
        proveedor:Cat_Proveedores(nombre),
        area_uso:Cat_Areas_Uso(nombre),
        sucursal:Cat_sucursales(nombre)
      `)
      .order('nombre', { ascending: true });

    if (error) console.error("Error al obtener productos:", error.message);
    return { data, error };
  },

  // ==========================================
  // CREACIÓN Y EDICIÓN (UPSERT)
  // ==========================================
  async guardarProducto(productoData) {
    try {
      // 1. Clonamos para no mutar el estado original
      const dataLimpia = { ...productoData };

      // 2. ELIMINAR ID SI ES NUEVO: 
      // Si el id es null, undefined o "", lo quitamos del objeto.
      // Esto obliga a Supabase a usar su "Default Value" (gen_random_uuid).
      if (!dataLimpia.id || dataLimpia.id === "" || dataLimpia.id === "null") {
        delete dataLimpia.id;
      }

      // 3. LIMPIEZA DE LLAVES FORÁNEAS (UUIDs):
      // Evitamos enviar strings vacíos "" en campos que esperan un UUID o nulo.
      const camposRelacionales = ['proveedor_id', 'sucursal_id', 'um_id', 'area_uso_id'];
      camposRelacionales.forEach(campo => {
        if (dataLimpia[campo] === "" || dataLimpia[campo] === undefined) {
          dataLimpia[campo] = null;
        }
      });

      // 4. LIMPIEZA DE NÚMEROS:
      // Si el costo o contenido vienen vacíos, mandamos null para no romper el tipo de dato.
      if (dataLimpia.costo_actual === "" || dataLimpia.costo_actual === undefined) dataLimpia.costo_actual = null;
      if (dataLimpia.contenido === "" || dataLimpia.contenido === undefined) dataLimpia.contenido = null;

      // 5. EJECUCIÓN EN SUPABASE
      const { data, error } = await supabase
        .from('BD_Productos')
        .upsert([dataLimpia]) // Upsert maneja Insert si no hay ID, o Update si el ID coincide
        .select()
        .single();

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
  // BORRADO LÓGICO (Desactivar)
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
      const [proveedores, sucursales, unidades, areas] = await Promise.all([
        supabase.from('Cat_Proveedores').select('id, nombre').order('nombre'),
        supabase.from('Cat_sucursales').select('id, nombre').order('nombre'),
        supabase.from('Cat_UM').select('id, nombre, abreviatura').eq('estatus', 'Activo').order('nombre'),
        supabase.from('Cat_Areas_Uso').select('id, nombre').eq('estatus', 'Activo').order('nombre')
      ]);

      return {
        proveedores: proveedores.data || [],
        sucursales: sucursales.data || [],
        unidades: unidades.data || [],
        areas: areas.data || [],
        errores: proveedores.error || sucursales.error || unidades.error || areas.error
      };
    } catch (err) {
      return { proveedores: [], sucursales: [], unidades: [], areas: [], errores: err };
    }
  }
};