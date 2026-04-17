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
      .select('*') // Aquí ya trae la nueva columna 'permisos' (JSONB)
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
      `) // Actualizado para incluir 'permisos' en la relación del rol
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

    // El password debería venir ya manejado desde el form, 
    // en Supabase puedes guardarlo en texto plano si tu lógica de login es manual 
    // o usar pgcrypto en el futuro.
    const { data, error } = await supabase
      .from('Cat_Trabajadores')
      .upsert([dataLimpia])
      .select()
      .single();

    if (error) console.error("Error al guardar trabajador:", error.message);
    return { data, error };
  },

  // ==========================================
  // 5. CATÁLOGOS TÉCNICOS (UM y Áreas de Uso)
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

  // ==========================================
  // 6. UTILIDADES: CARGA MASIVA PARA FORMULARIOS
  // ==========================================
  async getCatalogosParaSelectores() {
    // Se cargan todos los catálogos necesarios para llenar los ComboBox/Selects de los formularios
    const [unidades, areas, sucursales, proveedores, roles] = await Promise.all([
      supabase.from('Cat_UM').select('id, nombre, abreviatura').eq('estatus', 'Activo'),
      supabase.from('Cat_Areas_Uso').select('id, nombre').eq('estatus', 'Activo'),
      supabase.from('Cat_sucursales').select('id, nombre').eq('estatus', 'Activo'),
      supabase.from('Cat_Proveedores').select('id, nombre').eq('estatus', 'Activo'),
      supabase.from('Cat_Roles').select('id, nombre').eq('estatus', 'Activo')
    ]);

    return {
      unidades: unidades.data || [],
      areas: areas.data || [],
      sucursales: sucursales.data || [],
      proveedores: proveedores.data || [],
      roles: roles.data || [],
      error: unidades.error || areas.error || sucursales.error || proveedores.error || roles.error
    };
  },

  // ==========================================
  // 7. ACCIÓN GENÉRICA DE BORRADO/DESACTIVACIÓN
  // ==========================================
  async toggleEstatusGenerico(tabla, id, estatusActual) {
    const nuevoEstatus = estatusActual === 'Activo' ? 'Inactivo' : 'Activo';
    
    const { data, error } = await supabase
      .from(tabla)
      .update({ estatus: nuevoEstatus })
      .eq('id', id)
      .select();
      
    if (error) console.error(`Error al cambiar estatus en ${tabla}:`, error.message);
    return { data, error };
  }
};