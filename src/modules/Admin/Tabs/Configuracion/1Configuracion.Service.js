// src/modules/Admin/Tabs/Configuracion/1Configuracion.Service.js
import { supabase } from '../../../../lib/supabaseClient';

export const ConfiguracionService = {

  // ==========================================
  // 1. SUCURSALES (Gestión de puntos de venta)
  // ==========================================
  async getSucursales() {
    const { data, error } = await supabase
      .from('Cat_sucursales')
      .select('*')
      .order('nombre', { ascending: true });
    return { data, error };
  },

  async guardarSucursal(sucursalData) {
    const dataLimpia = { ...sucursalData };

    if (!dataLimpia.id || dataLimpia.id === "" || String(dataLimpia.id) === "null") {
      delete dataLimpia.id;
    }

    const { data, error } = await supabase
      .from('Cat_sucursales')
      .upsert([dataLimpia])
      .select()
      .single();
      
    if (error) console.error("Error al guardar sucursal:", error.message);
    return { data, error };
  },

  // ==========================================
  // 2. PROVEEDORES (Directorio de compras)
  // ==========================================
  async getProveedores() {
    const { data, error } = await supabase
      .from('Cat_Proveedores')
      .select('*')
      .order('nombre', { ascending: true });
    return { data, error };
  },

  async guardarProveedor(proveedorData) {
    const dataLimpia = { ...proveedorData };

    if (!dataLimpia.id || dataLimpia.id === "" || String(dataLimpia.id) === "null") {
      delete dataLimpia.id;
    }

    const { data, error } = await supabase
      .from('Cat_Proveedores')
      .upsert([dataLimpia])
      .select()
      .single();

    if (error) console.error("Error al guardar proveedor:", error.message);
    return { data, error };
  },

  // ==========================================
  // 3. ROLES (Sistema de permisos interno)
  // ==========================================
  async getRoles() {
    const { data, error } = await supabase
      .from('Cat_Roles')
      .select('*') // Trae la columna 'permisos' (JSONB)
      .order('nombre', { ascending: true });
    return { data, error };
  },

  async guardarRol(rolData) {
    const dataLimpia = { ...rolData };

    if (!dataLimpia.id || dataLinter.id === "" || String(dataLimpia.id) === "null") {
      delete dataLimpia.id;
    }

    const { data, error } = await supabase
      .from('Cat_Roles')
      .upsert([dataLimpia])
      .select()
      .single();

    if (error) console.error("Error al guardar rol:", error.message);
    return { data, error };
  },

  // ==========================================
  // 4. TRABAJADORES (Recursos Humanos + Login)
  // ==========================================
  async getTrabajadores() {
    const { data, error } = await supabase
      .from('Cat_Trabajadores')
      .select(`
        *,
        sucursal:Cat_sucursales(id, nombre),
        rol:Cat_Roles(id, nombre, permisos) 
      `) // Incluye 'permisos' en la relación del rol
      .order('nombre_completo', { ascending: true });
    return { data, error };
  },

  async guardarTrabajador(trabajadorData) {
    const dataLimpia = { ...trabajadorData };

    if (!dataLimpia.id || dataLimpia.id === "" || String(dataLimpia.id) === "null") {
      delete dataLimpia.id;
    }

    // Limpieza de relaciones Foreign Key para evitar errores de integridad
    if (!dataLimpia.sucursal_id || dataLimpia.sucursal_id === "") {
      dataLimpia.sucursal_id = null;
    }
    
    if (!dataLimpia.rol_id || dataLimpia.rol_id === "") {
      dataLimpia.rol_id = null;
    }

    const { data, error } = await supabase
      .from('Cat_Trabajadores')
      .upsert([dataLimpia])
      .select()
      .single();

    if (error) console.error("Error al guardar trabajador:", error.message);
    return { data, error };
  },

  // ==========================================
  // 5. CATÁLOGOS TÉCNICOS (UM, Áreas de Uso y Categorías)
  // ==========================================
  async getUnidadesMedida() {
    const { data, error } = await supabase
      .from('Cat_UM')
      .select('*')
      .order('nombre', { ascending: true });
    return { data, error };
  },

  async getAreasUso() {
    const { data, error } = await supabase
      .from('Cat_Areas_Uso')
      .select('*')
      .order('nombre', { ascending: true });
    return { data, error };
  },

  async getCategorias() {
    const { data, error } = await supabase
      .from('Cat_Categorias')
      .select('*')
      .order('nombre', { ascending: true });
    return { data, error };
  },

  async guardarCategoria(categoriaData) {
    const dataLimpia = { ...categoriaData };

    if (!dataLimpia.id || dataLimpia.id === "" || String(dataLimpia.id) === "null") {
      delete dataLimpia.id;
    }

    const { data, error } = await supabase
      .from('Cat_Categorias')
      .upsert([dataLimpia])
      .select()
      .single();

    if (error) console.error("Error al guardar categoría:", error.message);
    return { data, error };
  },

  // ==========================================
  // 6. UTILIDADES: CARGA MASIVA PARA FORMULARIOS
  // ==========================================
  async getCatalogosParaSelectores() {
    const [unidades, areas, sucursales, proveedores, roles, categorias] = await Promise.all([
      supabase.from('Cat_UM').select('id, nombre, abreviatura').eq('estatus', 'Activo'),
      supabase.from('Cat_Areas_Uso').select('id, nombre').eq('estatus', 'Activo'),
      supabase.from('Cat_sucursales').select('id, nombre').eq('estatus', 'Activo'),
      supabase.from('Cat_Proveedores').select('id, nombre').eq('estatus', 'Activo'),
      supabase.from('Cat_Roles').select('id, nombre').eq('estatus', 'Activo'),
      supabase.from('Cat_Categorias').select('id, nombre').filter('estatus', 'ilike', 'activo')
    ]);

    return {
      unidades: unidades.data || [],
      areas: areas.data || [],
      sucursales: sucursales.data || [],
      proveedores: proveedores.data || [],
      roles: roles.data || [],
      categorias: categorias.data || [],
      error: unidades.error || areas.error || sucursales.error || proveedores.error || roles.error || categorias.error
    };
  },

  // ==========================================
  // 7. ACCIÓN GENÉRICA DE BORRADO/DESACTIVACIÓN
  // ==========================================
  async toggleEstatusGenerico(tabla, id, estatusActual) {
    const nuevoEstatus = (estatusActual === 'Activo' || estatusActual === 'activo') ? 'Inactivo' : 'Activo';
    
    const { data, error } = await supabase
      .from(tabla)
      .update({ estatus: nuevoEstatus })
      .eq('id', id)
      .select();
      
    if (error) console.error(`Error al cambiar estatus en ${tabla}:`, error.message);
    return { data, error };
  },

  // ==========================================
  // 8. IMPORTACIÓN MASIVA DE PROVEEDORES
  // ==========================================
  async importarProveedoresMasivo(proveedoresExcel) {
    if (!Array.isArray(proveedoresExcel) || proveedoresExcel.length === 0) {
      return { data: null, error: { message: "No hay registros de proveedores válidos para importar." } };
    }

    try {
      const proveedoresListos = proveedoresExcel.map(row => {
        const esInactivo = row.activo === 'No' || row.activo === 'no' || row.activo === 'false' || row.activo === false;
        
        let diasArray = null;
        const diasTexto = row.dias_abierto || row.dias_atencion;
        if (diasTexto && String(diasTexto).trim() !== '') {
          // Extraemos y limpiamos cada día para que Postgres lo reciba como ["Lun","Mar","Mie"]
          diasArray = String(diasTexto)
            .split(',')
            .map(d => d.trim().replace(/['"\[\]]/g, ''))
            .filter(Boolean);
        }

        return {
          nombre: row.nombre ? String(row.nombre).trim() : null,
          direccion: row.direccion ? String(row.direccion).trim() : null,
          numero_contacto: row.numero_contacto || row.telefono ? String(row.numero_contacto || row.telefono).trim() : null,
          dias_abierto: diasArray,
          estatus: esInactivo ? 'Inactivo' : 'Activo'
        };
      }).filter(p => p.nombre && p.nombre.trim() !== '');

      if (proveedoresListos.length === 0) {
        return { data: null, error: { message: "No hay registros de proveedores con un nombre válido." } };
      }

      const { data, error } = await supabase
        .from('Cat_Proveedores')
        .insert(proveedoresListos)
        .select();

      if (error) {
        console.error("Error al guardar proveedores en masa:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error inesperado en importarProveedoresMasivo:", err);
      return { data: null, error: { message: "Error inesperado de red o de conexión en la carga masiva." } };
    }
  },

  // ==========================================
  // 9. IMPORTACIÓN MASIVA DE SUCURSALES
  // ==========================================
  async importarSucursalesMasivo(sucursalesExcel) {
    if (!Array.isArray(sucursalesExcel) || sucursalesExcel.length === 0) {
      return { data: null, error: { message: "No hay registros de sucursales válidos para importar." } };
    }

    try {
      const sucursalesListas = sucursalesExcel.map(row => {
        const esInactivo = row.activo === 'No' || row.activo === 'no' || row.activo === 'false' || row.activo === false;
        return {
          nombre: row.nombre ? String(row.nombre).trim() : null,
          direccion: row.direccion ? String(row.direccion).trim() : null,
          telefono: row.telefono ? String(row.telefono).trim() : null,
          estatus: esInactivo ? 'Inactivo' : 'Activo'
        };
      }).filter(s => s.nombre && s.nombre.trim() !== '');

      if (sucursalesListas.length === 0) {
        return { data: null, error: { message: "No hay registros de sucursales con un nombre válido." } };
      }

      const { data, error } = await supabase
        .from('Cat_sucursales')
        .insert(sucursalesListas)
        .select();

      if (error) {
        console.error("Error al guardar sucursales en masa:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error inesperado en importarSucursalesMasivo:", err);
      return { data: null, error: { message: "Error inesperado de red o de conexión en la carga masiva." } };
    }
  },

  // ==========================================
  // 10. IMPORTACIÓN MASIVA DE CATEGORÍAS
  // ==========================================
  async importarCategoriasMasivo(categoriasExcel) {
    if (!Array.isArray(categoriasExcel) || categoriasExcel.length === 0) {
      return { data: null, error: { message: "No hay registros de categorías válidos para importar." } };
    }

    try {
      const categoriasListas = categoriasExcel.map(row => {
        const esInactivo = row.activo === 'No' || row.activo === 'no' || row.activo === 'false' || row.activo === false;
        return {
          nombre: row.nombre ? String(row.nombre).trim() : null,
          estatus: esInactivo ? 'Inactivo' : 'Activo'
        };
      }).filter(c => c.nombre && c.nombre.trim() !== '');

      if (categoriasListas.length === 0) {
        return { data: null, error: { message: "No hay registros de categorías con un nombre válido." } };
      }

      const { data, error } = await supabase
        .from('Cat_Categorias')
        .insert(categoriasListas)
        .select();

      if (error) {
        console.error("Error al guardar categorías en masa:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error inesperado en importarCategoriasMasivo:", err);
      return { data: null, error: { message: "Error inesperado de red o de conexión en la carga masiva." } };
    }
  },

  // ==========================================
  // 11. IMPORTACIÓN MASIVA DE PRODUCTOS
  // ==========================================
  async importarProductosMasivo(productosExcel) {
    if (!Array.isArray(productosExcel) || productosExcel.length === 0) {
      return { data: null, error: { message: "No hay productos válidos para importar." } };
    }

    try {
      const [proveedores, sucursales, unidades, categorias] = await Promise.all([
        supabase.from('Cat_Proveedores').select('id, nombre'),
        supabase.from('Cat_sucursales').select('id, nombre'),
        supabase.from('Cat_UM').select('id, nombre, abreviatura').eq('estatus', 'Activo'),
        supabase.from('Cat_Categorias').select('id, nombre').eq('estatus', 'activo')
      ]);

      const normalizar = (str) => {
        if (!str) return '';
        return String(str)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, '');
      };

      const mapProveedores = (proveedores.data || []).reduce((acc, p) => {
        acc[normalizar(p.nombre)] = p.id;
        return acc;
      }, {});

      const mapSucursales = (sucursales.data || []).reduce((acc, s) => {
        acc[normalizar(s.nombre)] = s.id;
        return acc;
      }, {});

      const mapUnidades = (unidades.data || []).reduce((acc, u) => {
        acc[normalizar(u.abreviatura)] = u.id;
        acc[normalizar(u.nombre)] = u.id;
        return acc;
      }, {});

      const mapCategorias = (categorias.data || []).reduce((acc, c) => {
        acc[normalizar(c.nombre)] = c.id;
        return acc;
      }, {});

      const productosListos = productosExcel.map(row => {
        const catTexto = normalizar(row.categoria);
        const umTexto = normalizar(row.unidad_medida);
        const provTexto = normalizar(row.proveedor);
        const provSecTexto = normalizar(row.proveedor_secundario);

        let sucursales_ids = [];
        if (row.sucursales && String(row.sucursales).trim() !== '') {
          const normalizadoTotal = normalizar(row.sucursales);
          
          if (normalizadoTotal === 'todaslassucursales' || normalizadoTotal === 'todas') {
            sucursales_ids = (sucursales.data || []).map(s => s.id);
          } else {
            const nombresSucs = String(row.sucursales).split(',').map(s => normalizar(s));
            sucursales_ids = nombresSucs
              .map(nombreNorm => mapSucursales[nombreNorm])
              .filter(id => id !== undefined && id !== null);
          }
        }

        return {
          nombre: row.nombre ? String(row.nombre).trim() : null,
          marca: row.marca ? String(row.marca).trim() : null,
          modelo: row.modelo ? String(row.modelo).trim() : null,
          categoria_id: mapCategorias[catTexto] || null,
          presentacion: row.presentacion ? String(row.presentacion).trim() : null,
          contenido: (row.contenido === "" || row.contenido === undefined || isNaN(Number(row.contenido))) ? null : Number(row.contenido),
          um_id: mapUnidades[umTexto] || null,
          costo_actual: (row.costo_actual === "" || row.costo_actual === undefined || isNaN(Number(row.costo_actual))) ? null : Number(row.costo_actual),
          proveedor_id: mapProveedores[provTexto] || null,
          proveedor_secundario_id: mapProveedores[provSecTexto] || null,
          sucursales_ids: sucursales_ids,
          activo: !(row.activo === 'No' || row.activo === 'no' || row.activo === 'false' || row.activo === false)
        };
      }).filter(p => p.nombre && p.nombre.trim() !== '');

      if (productosListos.length === 0) {
        return { data: null, error: { message: "No hay productos válidos para importar." } };
      }

      const { data, error } = await supabase
        .from('BD_Productos')
        .insert(productosListos)
        .select();

      if (error) {
        console.error("Error al guardar productos en masa:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error inesperado en importarProductosMasivo:", err);
      return { data: null, error: { message: "Error inesperado de red o de conexión." } };
    }
  }
};