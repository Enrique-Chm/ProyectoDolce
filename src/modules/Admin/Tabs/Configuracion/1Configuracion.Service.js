// src/modules/Admin/Tabs/Configuracion/1Configuracion.Service.js
import { supabase } from '../../../../lib/supabaseClient';
import { sanitizeObject } from '../../../../lib/sanitize';

export const ConfiguracionService = {
  // ==========================================
  // 1. SUCURSALES
  // ==========================================
  async getSucursales() {
    const { data, error } = await supabase
      .from('Cat_sucursales')
      .select(`
        id,
        nombre,
        direccion,
        horario,
        estatus,
        turnos_permitidos,
        dias_pedido,
        created_at
      `)
      .order('nombre', { ascending: true });
    return { data, error };
  },

  async guardarSucursal(sucursalData) {
    const dataLimpia = sanitizeObject({ ...sucursalData });
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
      .select(`
        id,
        nombre,
        direccion,
        numero_contacto,
        dias_abierto,
        estatus,
        created_at
      `)
      .order('nombre', { ascending: true });
    return { data, error };
  },

  async guardarProveedor(proveedorData) {
    const dataLimpia = sanitizeObject({ ...proveedorData });
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
      .select(`
        id,
        nombre,
        descripcion,
        estatus,
        permisos,
        created_at
      `)
      .order('nombre', { ascending: true });
    return { data, error };
  },

  async guardarRol(rolData) {
    const dataLimpia = sanitizeObject({ ...rolData }, ['permisos']);
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
        id,
        usuario,
        nombre_completo,
        puesto,
        estatus,
        rol_id,
        fecha_ingreso,
        sucursales_ids,
        turno,
        created_at,
        updated_at,
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
    // Sanitizamos excluyendo 'password' — se hashea en el servidor tal cual llega
    const sanitizado = sanitizeObject(trabajadorData, ['password']);

    const {
      id, usuario, nombre_completo, puesto, password,
      rol_id, fecha_ingreso, estatus, sucursales_ids, turno
    } = sanitizado;

    const esNuevo = !id || id === "" || String(id) === "null";

    const { data, error } = await supabase.rpc('guardar_trabajador', {
      p_id:              esNuevo ? null : id,
      p_usuario:         usuario,
      p_nombre_completo: nombre_completo,
      p_puesto:          puesto,
      p_password:        password        || '',
      p_rol_id:          rol_id          || null,
      p_fecha_ingreso:   fecha_ingreso   || null,
      p_estatus:         estatus         || 'Activo',
      p_sucursales_ids:  Array.isArray(sucursales_ids) ? sucursales_ids : [],
      p_turno:           turno           || 'Ambos'
    });

    return { data, error };
  },

  // ==========================================
  // 5. CATÁLOGOS TÉCNICOS
  // ==========================================
  async getUnidadesMedida() {
    const { data, error } = await supabase
      .from('Cat_UM')
      .select(`
        id,
        nombre,
        abreviatura,
        tipo,
        estatus,
        created_at
      `)
      .order('nombre', { ascending: true });
    return { data, error };
  },

  async getCategorias() {
    const { data, error } = await supabase
      .from('Cat_Categorias')
      .select(`
        id,
        nombre,
        descripcion,
        estatus,
        created_at,
        updated_at
      `)
      .order('nombre', { ascending: true });
    return { data, error };
  },

  async guardarCategoria(categoriaData) {
    const dataLimpia = sanitizeObject({ ...categoriaData });
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
      supabase.from('Cat_UM')
        .select('id, nombre, abreviatura')
        .eq('estatus', 'Activo'),
      supabase.from('Cat_sucursales')
        .select('id, nombre')
        .eq('estatus', 'Activo'),
      supabase.from('Cat_Proveedores')
        .select('id, nombre')
        .eq('estatus', 'Activo'),
      supabase.from('Cat_Roles')
        .select('id, nombre')
        .eq('estatus', 'Activo'),
      supabase.from('Cat_Categorias')
        .select('id, nombre')
        .neq('estatus', 'Inactivo')
    ]);

    return {
      unidades:    unidades.data    || [],
      sucursales:  sucursales.data  || [],
      proveedores: proveedores.data || [],
      roles:       roles.data       || [],
      categorias:  categorias.data  || [],
      error: unidades.error || sucursales.error || proveedores.error ||
             roles.error    || categorias.error
    };
  },

  // ==========================================
  // 6. ACCIÓN GENÉRICA DE ESTATUS (Toggle) — VALIDADO EN SERVIDOR
  // ==========================================
  async toggleEstatusGenerico(tabla, id, estatusActual) {
    const { data: resultado, error } = await supabase.rpc('toggle_estatus_seguro', {
      p_tabla:          tabla,
      p_id:             id,
      p_estatus_actual: estatusActual
    });

    if (error) return { data: null, error };

    if (resultado?.error) {
      return { data: null, error: { message: resultado.mensaje } };
    }

    return { data: resultado, error: null };
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
        return String(str).toLowerCase().normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, '');
      };

      const mapProv = (proveedores.data || []).reduce((acc, p) => ({ ...acc, [normalizar(p.nombre)]: p.id }), {});
      const mapSucs = (sucursales.data || []).reduce((acc, s) => ({ ...acc, [normalizar(s.nombre)]: s.id }), {});
      const mapUms  = (unidades.data  || []).reduce((acc, u) => ({
        ...acc,
        [normalizar(u.abreviatura)]: u.id,
        [normalizar(u.nombre)]:      u.id
      }), {});
      const mapCats = (categorias.data || []).reduce((acc, c) => ({ ...acc, [normalizar(c.nombre)]: c.id }), {});

      const productosListos = productosExcel.map(row => {
        let sucsIds = [];
        const sucsTexto = normalizar(row.sucursales);

        if (sucsTexto === 'todas' || sucsTexto === 'todaslassucursales') {
          sucsIds = (sucursales.data || []).map(s => s.id);
        } else if (row.sucursales) {
          sucsIds = String(row.sucursales).split(',')
            .map(s => mapSucs[normalizar(s)])
            .filter(Boolean);
        }

        const turnoTexto = normalizar(row.turno_uso || row.turno);
        let turnoFinal = 'Ambos';
        if (turnoTexto === 'am') turnoFinal = 'AM';
        if (turnoTexto === 'pm') turnoFinal = 'PM';

        const obj = {
          nombre:         row.nombre        ? String(row.nombre).trim()       : null,
          marca:          row.marca         ? String(row.marca).trim()        : null,
          categoria_id:   mapCats[normalizar(row.categoria)]    || null,
          um_id:          mapUms[normalizar(row.unidad_medida)] || null,
          presentacion:   row.presentacion  || null,
          contenido:      Number(row.contenido) || null,
          proveedor_id:   mapProv[normalizar(row.proveedor)]    || null,
          sucursales_ids: sucsIds,
          turno_uso:      turnoFinal,
          activo:         row.activo === 'false' ? false : true
        };

        if (row.id && String(row.id).trim()) obj.id = String(row.id).trim();

        return obj;
      }).filter(p => p.nombre);

      const { data, error } = await supabase
        .from('BD_Productos')
        .upsert(productosListos, { onConflict: 'id' })
        .select();

      return { data, error };
    } catch (err) {
      return { data: null, error: { message: "Fallo en la pre-carga de catálogos." } };
    }
  },

  // ==========================================
  // 8. IMPORTACIÓN MASIVA (PROVEEDORES)
  // ==========================================
  async importarProveedoresMasivo(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { data: null, error: { message: "No hay proveedores para importar." } };
    }
    const registros = rows.map(row => {
      const obj = {
        nombre:           row.nombre?.trim()           || null,
        direccion:        row.direccion?.trim()         || null,
        numero_contacto:  row.numero_contacto?.trim()   || null,
        dias_abierto:     row.dias_abierto
          ? String(row.dias_abierto).split(',').map(d => d.trim()).filter(Boolean)
          : null,
        estatus: row.estatus || 'Activo'
      };
      if (row.id && String(row.id).trim()) obj.id = String(row.id).trim();
      return obj;
    }).filter(r => r.nombre);

    const { data, error } = await supabase
      .from('Cat_Proveedores')
      .upsert(registros, { onConflict: 'id' })
      .select();
    return { data, error };
  },

  // ==========================================
  // 9. IMPORTACIÓN MASIVA (SUCURSALES)
  // ==========================================
  async importarSucursalesMasivo(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { data: null, error: { message: "No hay sucursales para importar." } };
    }
    const registros = rows.map(row => {
      const obj = {
        nombre:    row.nombre?.trim()    || null,
        direccion: row.direccion?.trim() || null,
        horario:   row.horario?.trim()   || null,
        estatus:   row.estatus           || 'Activo'
      };
      if (row.id && String(row.id).trim()) obj.id = String(row.id).trim();
      return obj;
    }).filter(r => r.nombre);

    const { data, error } = await supabase
      .from('Cat_sucursales')
      .upsert(registros, { onConflict: 'id' })
      .select();
    return { data, error };
  },

  // ==========================================
  // 10. IMPORTACIÓN MASIVA (CATEGORÍAS)
  // ==========================================
  async importarCategoriasMasivo(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { data: null, error: { message: "No hay categorías para importar." } };
    }
    const registros = rows.map(row => {
      const obj = {
        nombre:      row.nombre?.trim()      || null,
        descripcion: row.descripcion?.trim() || null,
        estatus:     row.estatus             || 'activo'
      };
      if (row.id && String(row.id).trim()) obj.id = String(row.id).trim();
      return obj;
    }).filter(r => r.nombre);

    const { data, error } = await supabase
      .from('Cat_Categorias')
      .upsert(registros, { onConflict: 'id' })
      .select();
    return { data, error };
  },

  // ==========================================
  // 11. EXPORTACIÓN DE PRODUCTOS (CON NOMBRES RESUELTOS)
  // ==========================================
  async exportarProductos() {
    try {
      const [productos, proveedores, sucursales, unidades, categorias] = await Promise.all([
        supabase.from('BD_Productos')
          .select('id, nombre, marca, presentacion, contenido, proveedor_id, um_id, categoria_id, sucursales_ids, turno_uso, activo')
          .order('nombre'),
        supabase.from('Cat_Proveedores').select('id, nombre'),
        supabase.from('Cat_sucursales').select('id, nombre'),
        supabase.from('Cat_UM').select('id, abreviatura'),
        supabase.from('Cat_Categorias').select('id, nombre')
      ]);

      if (productos.error) return { data: null, error: productos.error };

      const mapProv = (proveedores.data || []).reduce((acc, p) => ({ ...acc, [p.id]: p.nombre }), {});
      const mapSucs = (sucursales.data || []).reduce((acc, s) => ({ ...acc, [s.id]: s.nombre }), {});
      const mapUms  = (unidades.data   || []).reduce((acc, u) => ({ ...acc, [u.id]: u.abreviatura }), {});
      const mapCats = (categorias.data || []).reduce((acc, c) => ({ ...acc, [c.id]: c.nombre }), {});

      const exportData = (productos.data || []).map(p => ({
        id:            p.id,
        nombre:        p.nombre         || '',
        marca:         p.marca          || '',
        categoria:     mapCats[p.categoria_id]  || '',
        presentacion:  p.presentacion   || '',
        contenido:     p.contenido      || '',
        unidad_medida: mapUms[p.um_id]  || '',
        proveedor:     mapProv[p.proveedor_id]  || '',
        sucursales:    (p.sucursales_ids || []).map(id => mapSucs[id] || '').filter(Boolean).join(', '),
        turno_uso:     p.turno_uso      || 'Ambos',
        activo:        p.activo ? 'true' : 'false'
      }));

      return { data: exportData, error: null };
    } catch (err) {
      return { data: null, error: { message: 'Error al exportar productos.' } };
    }
  },

  // ==========================================
  // 12. CALENDARIO SUCURSAL × PROVEEDOR
  // ==========================================
  async getAsignacionesPorSucursal(sucursalId) {
    const { data, error } = await supabase
      .from('Cat_Sucursal_Proveedor')
      .select(`
        id,
        sucursal_id,
        proveedor_id,
        dias_permitidos,
        estatus,
        created_at,
        proveedor:Cat_Proveedores(id, nombre)
      `)
      .eq('sucursal_id', sucursalId)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  async guardarAsignacion(asignacionData) {
    const dataLimpia = {
      sucursal_id:     asignacionData.sucursal_id,
      proveedor_id:    asignacionData.proveedor_id,
      dias_permitidos: asignacionData.dias_permitidos || [],
      estatus:         asignacionData.estatus || 'Activo'
    };

    if (asignacionData.id && String(asignacionData.id).trim()) {
      dataLimpia.id = asignacionData.id;
    }

    const { data, error } = await supabase
      .from('Cat_Sucursal_Proveedor')
      .upsert([dataLimpia], { onConflict: 'sucursal_id, proveedor_id' })
      .select(`
        id,
        sucursal_id,
        proveedor_id,
        dias_permitidos,
        estatus,
        proveedor:Cat_Proveedores(id, nombre)
      `)
      .single();

    return { data, error };
  },

  async eliminarAsignacion(asignacionId) {
    const { data, error } = await supabase
      .from('Cat_Sucursal_Proveedor')
      .delete()
      .eq('id', asignacionId)
      .select();
    return { data, error };
  },

  // ==========================================
  // 13. IMPORTACIÓN MASIVA (CALENDARIO SUCURSAL × PROVEEDOR)
  // ==========================================
  async importarAsignacionesMasivo(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { data: null, error: { message: "No hay asignaciones para importar." } };
    }
    try {
      const [sucursales, proveedores] = await Promise.all([
        supabase.from('Cat_sucursales').select('id, nombre'),
        supabase.from('Cat_Proveedores').select('id, nombre')
      ]);

      const normalizar = (str) => {
        if (!str) return '';
        return String(str).toLowerCase().normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, '');
      };

      const mapSucs = (sucursales.data || []).reduce((acc, s) => ({ ...acc, [normalizar(s.nombre)]: s.id }), {});
      const mapProv = (proveedores.data || []).reduce((acc, p) => ({ ...acc, [normalizar(p.nombre)]: p.id }), {});

      const registros = rows.map(row => {
        const obj = {
          sucursal_id:     mapSucs[normalizar(row.sucursal)]  || null,
          proveedor_id:    mapProv[normalizar(row.proveedor)] || null,
          dias_permitidos: row.dias_permitidos
            ? String(row.dias_permitidos).split(',').map(d => d.trim()).filter(Boolean)
            : [],
          estatus: 'Activo'
        };
        if (row.id && String(row.id).trim()) obj.id = String(row.id).trim();
        return obj;
      }).filter(r => r.sucursal_id && r.proveedor_id && r.dias_permitidos.length > 0);

      if (registros.length === 0) {
        return { data: null, error: { message: "No se pudieron resolver los nombres de sucursales/proveedores." } };
      }

      const { data, error } = await supabase
        .from('Cat_Sucursal_Proveedor')
        .upsert(registros, { onConflict: 'sucursal_id, proveedor_id' })
        .select();

      return { data, error };
    } catch (err) {
      return { data: null, error: { message: "Fallo en la pre-carga de catálogos." } };
    }
  },

  // ==========================================
  // 14. EXPORTACIÓN (CALENDARIO SUCURSAL × PROVEEDOR)
  // ==========================================
  async exportarAsignaciones() {
    try {
      const { data, error } = await supabase
        .from('Cat_Sucursal_Proveedor')
        .select(`
          id,
          dias_permitidos,
          estatus,
          sucursal:Cat_sucursales(nombre),
          proveedor:Cat_Proveedores(nombre)
        `)
        .eq('estatus', 'Activo')
        .order('created_at');

      if (error) return { data: null, error };

      const exportData = (data || []).map(a => ({
        id:               a.id,
        sucursal:         a.sucursal?.nombre  || '',
        proveedor:        a.proveedor?.nombre || '',
        dias_permitidos:  (a.dias_permitidos || []).join(', ')
      }));

      return { data: exportData, error: null };
    } catch (err) {
      return { data: null, error: { message: 'Error al exportar asignaciones.' } };
    }
  }
};