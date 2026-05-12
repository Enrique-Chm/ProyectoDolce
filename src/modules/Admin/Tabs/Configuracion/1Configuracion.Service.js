// src/modules/Admin/Tabs/Configuracion/1Configuracion.Service.js
import { supabase } from '../../../../lib/supabaseClient';

export const ConfiguracionService = {

  // ==========================================
  // 1. SUCURSALES
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
      
    return { data, error };
  },

  // ==========================================
  // 2. PROVEEDORES
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

    return { data, error };
  },

  // ==========================================
  // 3. ROLES (Sistema de permisos)
  // ==========================================
  async getRoles() {
    const { data, error } = await supabase
      .from('Cat_Roles')
      .select('*')
      .order('nombre', { ascending: true });
    return { data, error };
  },

  async guardarRol(rolData) {
    const dataLimpia = { ...rolData };
    if (!dataLimpia.id || dataLimpia.id === "" || String(dataLimpia.id) === "null") {
      delete dataLimpia.id;
    }

    const { data, error } = await supabase
      .from('Cat_Roles')
      .upsert([dataLimpia])
      .select()
      .single();

    return { data, error };
  },

  // ==========================================
  // 4. TRABAJADORES (Recursos Humanos)
  // ==========================================
  async getTrabajadores() {
    const { data, error } = await supabase
      .from('Cat_Trabajadores')
      .select(`
        *,
        rol:Cat_Roles(id, nombre, permisos) 
      `)
      .order('nombre_completo', { ascending: true });

    const dataProcesada = data?.map(t => ({
      ...t,
      rol_nombre: t.rol?.nombre || 'N/A'
    }));

    return { data: dataProcesada, error };
  },

  async guardarTrabajador(trabajadorData) {
    const dataLimpia = { ...trabajadorData };
    
    if (!dataLimpia.id || dataLimpia.id === "" || String(dataLimpia.id) === "null") {
      delete dataLimpia.id;
    }

    if (dataLimpia.id && (!dataLimpia.password || dataLimpia.password.trim() === "")) {
      delete dataLimpia.password;
    }

    delete dataLimpia.sucursal_id;
    delete dataLimpia.sucursal_nombre;
    delete dataLimpia.rol_nombre; 

    const { data, error } = await supabase
      .from('Cat_Trabajadores')
      .upsert([dataLimpia])
      .select()
      .single();

    return { data, error };
  },

  // ==========================================
  // 5. CATÁLOGOS TÉCNICOS
  // ==========================================
  async getUnidadesMedida() {
    const { data, error } = await supabase
      .from('Cat_UM')
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

    return { data, error };
  },

  async getCatalogosParaSelectores() {
    const [unidades, sucursales, proveedores, roles, categorias] = await Promise.all([
      supabase.from('Cat_UM').select('id, nombre, abreviatura').eq('estatus', 'Activo'),
      supabase.from('Cat_sucursales').select('id, nombre').eq('estatus', 'Activo'),
      supabase.from('Cat_Proveedores').select('id, nombre').eq('estatus', 'Activo'),
      supabase.from('Cat_Roles').select('id, nombre').eq('estatus', 'Activo'),
      supabase.from('Cat_Categorias').select('id, nombre').eq('estatus', 'Activo')
    ]);

    return {
      unidades: unidades.data || [],
      sucursales: sucursales.data || [],
      proveedores: proveedores.data || [],
      roles: roles.data || [],
      categorias: categorias.data || [],
      error: unidades.error || sucursales.error || proveedores.error || roles.error || categorias.error
    };
  },

  // ==========================================
  // 6. ACCIÓN GENÉRICA DE ESTATUS (Toggle)
  // ==========================================
  async toggleEstatusGenerico(tabla, id, estatusActual) {
    const nuevoEstatus = (estatusActual.toLowerCase() === 'activo') ? 'Inactivo' : 'Activo';
    
    const { data, error } = await supabase
      .from(tabla)
      .update({ estatus: nuevoEstatus })
      .eq('id', id)
      .select();
      
    return { data, error };
  },

  // ==========================================
  // 7. IMPORTACIÓN MASIVA (PRODUCTOS OPERATIVOS)
  // ==========================================
  async importarProductosMasivo(productosExcel) {
    if (!Array.isArray(productosExcel) || productosExcel.length === 0) {
      return { data: null, error: { message: "No hay productos para importar." } };
    }

    try {
      const [proveedores, sucursales, unidades, categorias] = await Promise.all([
        supabase.from('Cat_Proveedores').select('id, nombre'),
        supabase.from('Cat_sucursales').select('id, nombre'),
        supabase.from('Cat_UM').select('id, nombre, abreviatura'),
        supabase.from('Cat_Categorias').select('id, nombre')
      ]);

      const normalizar = (str) => {
        if (!str) return '';
        return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
      };

      const mapProv = (proveedores.data || []).reduce((acc, p) => ({ ...acc, [normalizar(p.nombre)]: p.id }), {});
      const mapSucs = (sucursales.data || []).reduce((acc, s) => ({ ...acc, [normalizar(s.nombre)]: s.id }), {});
      const mapUms = (unidades.data || []).reduce((acc, u) => ({ ...acc, [normalizar(u.abreviatura)]: u.id, [normalizar(u.nombre)]: u.id }), {});
      const mapCats = (categorias.data || []).reduce((acc, c) => ({ ...acc, [normalizar(c.nombre)]: c.id }), {});

      const productosListos = productosExcel.map(row => {
        let sucsIds = [];
        const sucsTexto = normalizar(row.sucursales);
        
        if (sucsTexto === 'todas' || sucsTexto === 'todaslassucursales') {
          sucsIds = (sucursales.data || []).map(s => s.id);
        } else if (row.sucursales) {
          sucsIds = String(row.sucursales).split(',').map(s => mapSucs[normalizar(s)]).filter(Boolean);
        }

        return {
          nombre: row.nombre ? String(row.nombre).trim() : null,
          marca: row.marca ? String(row.marca).trim() : null,
          categoria_id: mapCats[normalizar(row.categoria)] || null,
          um_id: mapUms[normalizar(row.unidad_medida)] || null,
          presentacion: row.presentacion || null,
          contenido: Number(row.contenido) || null,
          // LIMPIEZA: Se eliminó costo_actual para coincidir con la nueva tabla
          proveedor_id: mapProv[normalizar(row.proveedor)] || null,
          proveedor_secundario_id: mapProv[normalizar(row.proveedor_secundario)] || null,
          sucursales_ids: sucsIds,
          activo: true
        };
      }).filter(p => p.nombre);

      const { data, error } = await supabase.from('BD_Productos').insert(productosListos).select();
      return { data, error };

    } catch (err) {
      return { data: null, error: { message: "Fallo en la pre-carga de catálogos." } };
    }
  }
};