// Archivo: src/modules/Admin/Tabs/ConfigTab/useConfigTab.js
import { useState, useEffect, useCallback } from 'react';
import { configService } from './Config.service'; 
import { hasPermission } from '../../../../utils/checkPermiso';
import toast from 'react-hot-toast'; // 🍞 Importación para feedback visual

export const useConfigTab = (subTab) => {
  const [loading, setLoading] = useState(false);

  // 🛡️ DEFINICIÓN DE FACULTADES BASE (Blindaje de nivel Configuración)
  const puedeVerConfig = hasPermission('ver_configuracion');
  const puedeCrearConfig = hasPermission('crear_configuracion');   
  const puedeEditarConfig = hasPermission('editar_configuracion');
  const puedeBorrarConfig = hasPermission('borrar_configuracion'); 

  // --- ESTADOS: UNIDADES ---
  const [unidades, setUnidades] = useState([]);
  const [uNombre, setUNombre] = useState('');
  const [uAbrev, setUAbrev] = useState('');
  const [uEditId, setUEditId] = useState(null);

  // --- ESTADOS: CATEGORÍAS ---
  const [catMenu, setCatMenu] = useState([]);
  const [catInsumos, setCatInsumos] = useState([]);
  const [cMenuNombre, setCMenuNombre] = useState('');
  const [cMenuColor, setCMenuColor] = useState('#005696');
  const [cInsumoNombre, setCInsumoNombre] = useState('');
  const [cMenuEditId, setCMenuEditId] = useState(null);
  const [cInsumoEditId, setCInsumoEditId] = useState(null);

  // --- ESTADOS: MOTIVOS INVENTARIO ---
  const [motivosInventario, setMotivosInventario] = useState([]);
  const [mNombre, setMNombre] = useState('');
  const [mTipo, setMTipo] = useState('ENTRADA');
  const [mEditId, setMEditId] = useState(null);

  // 🚀 NUEVOS ESTADOS: ZONAS Y MESAS ---
  const [zonas, setZonas] = useState([]);
  const [zEditId, setZEditId] = useState(null);
  const [zFormData, setZFormData] = useState({ nombre: '', orden: 0, activo: true });
  
  const [mesaEditId, setMesaEditId] = useState(null);
  // 🚀 NIVEL EXTRA: Añadimos 'tipo_elemento' al estado base
  const [mesaFormData, setMesaFormData] = useState({ zona_id: '', nombre: '', capacidad: 4, activa: true, tipo_elemento: 'MESA' });

  // Lógica de Permisos Original
  const puedeCrearU = puedeCrearConfig && hasPermission('ver_unidades');
  const puedeEditarU = puedeEditarConfig && hasPermission('ver_unidades');
  
  const puedeCrearC = puedeCrearConfig && hasPermission('ver_categorias');
  const puedeEditarC = puedeEditarConfig && hasPermission('ver_categorias');
  
  const puedeCrearM = puedeCrearConfig && hasPermission('ver_insumos'); 
  const puedeEditarM = puedeEditarConfig && hasPermission('ver_insumos'); 
  
  const fetchData = useCallback(async () => {
    // 🛡️ BLINDAJE: Si no tiene permiso general de ver configuración, no hacemos nada
    if (!puedeVerConfig) return;

    setLoading(true);
    try {
      if (subTab === 'unidades') {
        const { data } = await configService.getUnidades();
        setUnidades(data || []);
      } 
      else if (subTab === 'categorias') {
        const menuRes = await configService.getMenu();
        const insumosRes = await configService.getInsumos();
        
        if (menuRes.error) console.error("Error en Categorías Menú:", menuRes.error);
        if (insumosRes.error) console.error("Error en Categorías Insumos:", insumosRes.error);

        setCatMenu(menuRes.data || []);
        setCatInsumos(insumosRes.data || []);
      } 
      else if (subTab === 'motivos') {
        const { data } = await configService.getMotivosInventario();
        setMotivosInventario(data || []);
      }
      else if (subTab === 'zonas') { // 🚀 NUEVA RUTA PARA EL MAPA
        // Obtenemos la sucursal actual desde la sesión
        const sessionStr = localStorage.getItem('cloudkitchen_session');
        const finalSucursalId = sessionStr ? JSON.parse(sessionStr)?.user?.sucursal_id : 1;
        const { data } = await configService.getZonasConMesas(finalSucursalId);
        setZonas(data || []);
      }
    } catch (error) {
      console.error("Error crítico en useConfigTab:", error);
      toast.error("Error al cargar la configuración.");
    } finally {
      setLoading(false);
    }
  }, [subTab, puedeVerConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HANDLERS BLINDADOS ---
  const handleSubmitUnidad = async (e) => {
    e.preventDefault();
    const tienePermiso = uEditId ? puedeEditarU : puedeCrearU;
    if (!tienePermiso) return toast.error("Acceso Denegado: Permisos insuficientes."); 

    const tId = toast.loading("Guardando unidad...");
    const { error } = await configService.saveUnidad({ nombre: uNombre, abreviatura: uAbrev }, uEditId);
    
    if (!error) { 
      toast.success("Unidad guardada con éxito", { id: tId });
      resetUnidad(); 
      fetchData(); 
    } else {
      toast.error("Error: " + error.message, { id: tId });
    }
  };

  const handleSubmitCatMenu = async (e) => {
    e.preventDefault();
    const tienePermiso = cMenuEditId ? puedeEditarC : puedeCrearC;
    if (!tienePermiso) return toast.error("Acceso Denegado: Permisos insuficientes."); 

    const tId = toast.loading("Guardando categoría...");
    const { error } = await configService.saveMenu({ nombre: cMenuNombre, color_etiqueta: cMenuColor }, cMenuEditId);
    
    if (!error) { 
      toast.success("Categoría de menú guardada", { id: tId });
      resetCatMenu(); 
      fetchData(); 
    } else { 
      toast.error("Error: " + error.message, { id: tId });
    }
  };

  const handleSubmitCatInsumo = async (e) => {
    e.preventDefault();
    const tienePermiso = cInsumoEditId ? puedeEditarC : puedeCrearC;
    if (!tienePermiso) return toast.error("Acceso Denegado: Permisos insuficientes."); 

    const tId = toast.loading("Guardando categoría...");
    const { error } = await configService.saveInsumo({ nombre: cInsumoNombre }, cInsumoEditId);
    
    if (!error) { 
      toast.success("Categoría de insumo guardada", { id: tId });
      resetCatInsumo(); 
      fetchData(); 
    } else { 
      toast.error("Error: " + error.message, { id: tId });
    }
  };

  const handleSubmitMotivo = async (e) => {
    e.preventDefault();
    const tienePermiso = mEditId ? puedeEditarM : puedeCrearM;
    if (!tienePermiso) return toast.error("Acceso Denegado: Permisos insuficientes."); 

    const tId = toast.loading("Guardando motivo...");
    const { error } = await configService.saveMotivoInventario({ nombre_motivo: mNombre, tipo: mTipo }, mEditId);
    
    if (!error) { 
      toast.success("Motivo de inventario guardado", { id: tId });
      resetMotivo(); 
      fetchData(); 
    } else {
      toast.error("Error: " + error.message, { id: tId });
    }
  };

  // 🚀 NUEVOS HANDLERS: ZONAS Y MESAS
  const handleSubmitZona = async (e) => {
    e.preventDefault();
    const tienePermiso = zEditId ? puedeEditarConfig : puedeCrearConfig;
    if (!tienePermiso) return toast.error("Acceso Denegado."); 

    const sessionStr = localStorage.getItem('cloudkitchen_session');
    const finalSucursalId = sessionStr ? JSON.parse(sessionStr)?.user?.sucursal_id : 1;

    const tId = toast.loading("Guardando zona...");
    const payload = { ...zFormData, sucursal_id: finalSucursalId };
    
    const { error } = await configService.saveZona(payload, zEditId);
    
    if (!error) { 
      toast.success("Zona guardada", { id: tId });
      resetZona(); 
      fetchData(); 
    } else {
      toast.error("Error: " + error.message, { id: tId });
    }
  };

  const handleSubmitMesa = async (e) => {
    e.preventDefault();
    const tienePermiso = mesaEditId ? puedeEditarConfig : puedeCrearConfig;
    if (!tienePermiso) return toast.error("Acceso Denegado."); 
    if (!mesaFormData.zona_id) return toast.error("Debes seleccionar una zona.");

    const tId = toast.loading("Guardando elemento...");
    
    // 🚀 NIVEL EXTRA: Forzar capacidad 0 si es un obstáculo antes de guardar
    const payloadParaGuardar = { ...mesaFormData };
    if (payloadParaGuardar.tipo_elemento === 'OBSTACULO') {
        payloadParaGuardar.capacidad = 0;
    }

    const { error } = await configService.saveMesa(payloadParaGuardar, mesaEditId);
    
    if (!error) { 
      toast.success("Elemento guardado", { id: tId });
      resetMesa(); 
      fetchData(); 
    } else {
      toast.error("Error: " + error.message, { id: tId });
    }
  };

  // 🚀 NUEVO HANDLER: Guardar layout visual completo (Drag & Drop)
  const handleSavePlano = async (mesasModificadas) => {
    if (!puedeEditarConfig) return toast.error("Acceso Denegado: No tienes permisos para modificar el layout.");
    
    const tId = toast.loading("Guardando distribución del plano...");
    const { error } = await configService.actualizarPosicionesMesas(mesasModificadas);

    if (!error) {
      toast.success("Plano actualizado correctamente", { id: tId });
      fetchData(); // Recargamos para sincronizar y asegurar los datos
    } else {
      toast.error("Error al guardar el plano: " + error.message, { id: tId });
    }
  };

  // 🛡️ LÓGICA DE BORRADO AÑADIDA Y ACTUALIZADA
  const handleDelete = async (tipo, id) => {
    if (!puedeBorrarConfig) return toast.error("Acceso Denegado: No puedes borrar registros.");
    
    if (window.confirm("¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.")) {
      const tId = toast.loading("Eliminando registro...");
      let res;
      if (tipo === 'unidades') res = await configService.deleteUnidad(id);
      if (tipo === 'menu') res = await configService.deleteMenu(id);
      if (tipo === 'insumos') res = await configService.deleteInsumo(id);
      if (tipo === 'motivos') res = await configService.deleteMotivoInventario(id);
      if (tipo === 'zona') res = await configService.deleteZona(id); // 🚀 NUEVO
      if (tipo === 'mesa') res = await configService.deleteMesa(id); // 🚀 NUEVO

      if (res?.error) {
        toast.error("Error al eliminar: " + res.error.message, { id: tId });
      } else {
        toast.success("Registro eliminado", { id: tId });
        fetchData();
      }
    }
  };

  // Resets auxiliares
  const resetUnidad = () => { setUEditId(null); setUNombre(''); setUAbrev(''); };
  const resetCatMenu = () => { setCMenuEditId(null); setCMenuNombre(''); setCMenuColor('#005696'); };
  const resetCatInsumo = () => { setCInsumoEditId(null); setCInsumoNombre(''); };
  const resetMotivo = () => { setMEditId(null); setMNombre(''); setMTipo('ENTRADA'); };
  
  // 🚀 Nuevos resets (ACTUALIZADO PARA INCLUIR tipo_elemento)
  const resetZona = () => { setZEditId(null); setZFormData({ nombre: '', orden: 0, activo: true }); };
  const resetMesa = () => { setMesaEditId(null); setMesaFormData({ zona_id: '', nombre: '', capacidad: 4, activa: true, tipo_elemento: 'MESA' }); };

  return {
    loading, 
    // 🛡️ Exportamos facultades
    puedeVerConfig, puedeBorrarConfig, 
    puedeCrearU, puedeEditarU, 
    puedeCrearC, puedeEditarC, 
    puedeCrearM, puedeEditarM,
    
    // Exportamos función de borrado
    handleDelete, 

    unidades: puedeVerConfig ? unidades : [], 
    catMenu: puedeVerConfig ? catMenu : [], 
    catInsumos: puedeVerConfig ? catInsumos : [],
    motivosInventario: puedeVerConfig ? motivosInventario : [],
    
    // 🚀 Exportamos la data del mapa
    zonas: puedeVerConfig ? zonas : [],

    uNombre, setUNombre, uAbrev, setUAbrev, uEditId, setUEditId, handleSubmitUnidad,
    cMenuNombre, setCMenuNombre, cMenuColor, setCMenuColor, cInsumoNombre, setCInsumoNombre, 
    cMenuEditId, setCMenuEditId, cInsumoEditId, setCInsumoEditId, handleSubmitCatMenu, handleSubmitCatInsumo,
    mNombre, setMNombre, mTipo, setMTipo, mEditId, setMEditId, handleSubmitMotivo,

    // 🚀 Exportamos los estados y funciones de Zonas/Mesas
    zEditId, setZEditId, zFormData, setZFormData, handleSubmitZona, resetZona,
    mesaEditId, setMesaEditId, mesaFormData, setMesaFormData, handleSubmitMesa, resetMesa,
    handleSavePlano, // 👈 Exportamos nuestra nueva función para guardar el Drag & Drop

    refresh: fetchData 
  };
};