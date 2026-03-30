import { useState, useEffect, useCallback } from 'react';
import { configService } from './Config.service'; 
import { hasPermission } from '../../../../utils/checkPermiso';
import toast from 'react-hot-toast';

export const useConfigTab = (subTab) => {
  const [loading, setLoading] = useState(false);

  // 🛡️ DEFINICIÓN DE FACULTADES BASE
  const puedeVerConfig = hasPermission('ver_configuracion');
  const puedeCrearConfig = hasPermission('crear_configuracion');   
  const puedeEditarConfig = hasPermission('editar_configuracion');
  const puedeBorrarConfig = hasPermission('borrar_configuracion'); 

  // --- ESTADOS: UNIDADES ---
  const [unidades, setUnidades] = useState([]);
  const [uNombre, setUNombre] = useState('');
  const [uAbrev, setUAbrev] = useState('');
  const [uEditId, setUEditId] = useState(null);

  // --- 🚀 NUEVOS ESTADOS: TIPOS DE DESCUENTO ---
  const [tiposDescuento, setTiposDescuento] = useState([]);
  const [tdNombre, setTdNombre] = useState('');
  const [tdTipoCalculo, setTdTipoCalculo] = useState('libre'); // porcentaje, monto_fijo, libre
  const [tdValorDefecto, setTdValorDefecto] = useState(0);
  const [tdRequiereAuth, setTdRequiereAuth] = useState(false);
  const [tdEditId, setTdEditId] = useState(null);

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

  // 🚀 ESTADOS: ZONAS Y MESAS ---
  const [zonas, setZonas] = useState([]);
  const [zEditId, setZEditId] = useState(null);
  const [zFormData, setZFormData] = useState({ nombre: '', orden: 0, activo: true });
  const [mesaEditId, setMesaEditId] = useState(null);
  const [mesaFormData, setMesaFormData] = useState({ zona_id: '', nombre: '', capacidad: 4, activa: true, tipo_elemento: 'MESA' });

  // Lógica de Permisos Original
  const puedeCrearU = puedeCrearConfig && hasPermission('ver_unidades');
  const puedeEditarU = puedeEditarConfig && hasPermission('ver_unidades');
  const puedeCrearC = puedeCrearConfig && hasPermission('ver_categorias');
  const puedeEditarC = puedeEditarConfig && hasPermission('ver_categorias');
  const puedeCrearM = puedeCrearConfig && hasPermission('ver_insumos'); 
  const puedeEditarM = puedeEditarConfig && hasPermission('ver_insumos'); 
  
  const fetchData = useCallback(async () => {
    if (!puedeVerConfig) return;

    setLoading(true);
    try {
      if (subTab === 'unidades') {
        const resU = await configService.getUnidades();
        const resTD = await configService.getTiposDescuento(); // 🚀 Carga de descuentos
        setUnidades(resU.data || []);
        setTiposDescuento(resTD.data || []);
      } 
      else if (subTab === 'categorias') {
        const menuRes = await configService.getMenu();
        const insumosRes = await configService.getInsumos();
        setCatMenu(menuRes.data || []);
        setCatInsumos(insumosRes.data || []);
      } 
      else if (subTab === 'motivos') {
        const { data } = await configService.getMotivosInventario();
        setMotivosInventario(data || []);
      }
      else if (subTab === 'zonas') {
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

  // --- HANDLERS: UNIDADES ---
  const handleSubmitUnidad = async (e) => {
    e.preventDefault();
    const tienePermiso = uEditId ? puedeEditarU : puedeCrearU;
    if (!tienePermiso) return toast.error("Acceso Denegado."); 

    const tId = toast.loading("Guardando unidad...");
    const { error } = await configService.saveUnidad({ nombre: uNombre, abreviatura: uAbrev }, uEditId);
    
    if (!error) { 
      toast.success("Unidad guardada", { id: tId });
      resetUnidad(); 
      fetchData(); 
    } else {
      toast.error("Error: " + error.message, { id: tId });
    }
  };

  // --- 🚀 NUEVO HANDLER: TIPOS DE DESCUENTO ---
  const handleSubmitTipoDescuento = async (e) => {
    e.preventDefault();
    const tienePermiso = tdEditId ? puedeEditarU : puedeCrearU;
    if (!tienePermiso) return toast.error("Acceso Denegado.");

    const tId = toast.loading("Guardando tipo de descuento...");
    const payload = {
      nombre: tdNombre,
      tipo_calculo: tdTipoCalculo,
      valor_defecto: tdTipoCalculo === 'libre' ? 0 : parseFloat(tdValorDefecto),
      requiere_autorizacion: tdRequiereAuth
    };

    const { error } = await configService.saveTipoDescuento(payload, tdEditId);

    if (!error) {
      toast.success("Tipo de descuento guardado", { id: tId });
      resetTipoDescuento();
      fetchData();
    } else {
      toast.error("Error: " + error.message, { id: tId });
    }
  };

  // --- OTROS HANDLERS (Categorías, Motivos, Zonas, Mesas) ---
  const handleSubmitCatMenu = async (e) => {
    e.preventDefault();
    const tienePermiso = cMenuEditId ? puedeEditarC : puedeCrearC;
    if (!tienePermiso) return toast.error("Acceso Denegado."); 
    const tId = toast.loading("Guardando...");
    const { error } = await configService.saveMenu({ nombre: cMenuNombre, color_etiqueta: cMenuColor }, cMenuEditId);
    if (!error) { toast.success("Guardado", { id: tId }); resetCatMenu(); fetchData(); }
    else { toast.error(error.message, { id: tId }); }
  };

  const handleSubmitCatInsumo = async (e) => {
    e.preventDefault();
    const tienePermiso = cInsumoEditId ? puedeEditarC : puedeCrearC;
    if (!tienePermiso) return toast.error("Acceso Denegado."); 
    const tId = toast.loading("Guardando...");
    const { error } = await configService.saveInsumo({ nombre: cInsumoNombre }, cInsumoEditId);
    if (!error) { toast.success("Guardado", { id: tId }); resetCatInsumo(); fetchData(); }
    else { toast.error(error.message, { id: tId }); }
  };

  const handleSubmitMotivo = async (e) => {
    e.preventDefault();
    const tienePermiso = mEditId ? puedeEditarM : puedeCrearM;
    if (!tienePermiso) return toast.error("Acceso Denegado."); 
    const tId = toast.loading("Guardando...");
    const { error } = await configService.saveMotivoInventario({ nombre_motivo: mNombre, tipo: mTipo }, mEditId);
    if (!error) { toast.success("Guardado", { id: tId }); resetMotivo(); fetchData(); }
    else { toast.error(error.message, { id: tId }); }
  };

  const handleSubmitZona = async (e) => {
    e.preventDefault();
    const tienePermiso = zEditId ? puedeEditarConfig : puedeCrearConfig;
    if (!tienePermiso) return toast.error("Acceso Denegado."); 
    const sessionStr = localStorage.getItem('cloudkitchen_session');
    const sucursalId = sessionStr ? JSON.parse(sessionStr)?.user?.sucursal_id : 1;
    const tId = toast.loading("Guardando...");
    const { error } = await configService.saveZona({ ...zFormData, sucursal_id: sucursalId }, zEditId);
    if (!error) { toast.success("Guardado", { id: tId }); resetZona(); fetchData(); }
    else { toast.error(error.message, { id: tId }); }
  };

  const handleSubmitMesa = async (e) => {
    e.preventDefault();
    const tienePermiso = mesaEditId ? puedeEditarConfig : puedeCrearConfig;
    if (!tienePermiso) return toast.error("Acceso Denegado."); 
    if (!mesaFormData.zona_id) return toast.error("Zona requerida.");
    const tId = toast.loading("Guardando...");
    const payload = { ...mesaFormData };
    if (payload.tipo_elemento === 'OBSTACULO') payload.capacidad = 0;
    const { error } = await configService.saveMesa(payload, mesaEditId);
    if (!error) { toast.success("Guardado", { id: tId }); resetMesa(); fetchData(); }
    else { toast.error(error.message, { id: tId }); }
  };

  const handleSavePlano = async (mesasModificadas) => {
    if (!puedeEditarConfig) return toast.error("Sin permisos.");
    const tId = toast.loading("Actualizando plano...");
    const { error } = await configService.actualizarPosicionesMesas(mesasModificadas);
    if (!error) { toast.success("Plano actualizado", { id: tId }); fetchData(); }
    else { toast.error(error.message, { id: tId }); }
  };

  // 🛡️ LÓGICA DE BORRADO
  const handleDelete = async (tipo, id) => {
    if (!puedeBorrarConfig) return toast.error("Acceso Denegado.");
    if (window.confirm("¿Eliminar este registro?")) {
      const tId = toast.loading("Eliminando...");
      let res;
      if (tipo === 'unidades') res = await configService.deleteUnidad(id);
      if (tipo === 'tipos_descuento') res = await configService.deleteTipoDescuento(id); // 🚀 Nuevo
      if (tipo === 'menu') res = await configService.deleteMenu(id);
      if (tipo === 'insumos') res = await configService.deleteInsumo(id);
      if (tipo === 'motivos') res = await configService.deleteMotivoInventario(id);
      if (tipo === 'zona') res = await configService.deleteZona(id);
      if (tipo === 'mesa') res = await configService.deleteMesa(id);

      if (res?.error) toast.error("Error: " + res.error.message, { id: tId });
      else { toast.success("Eliminado", { id: tId }); fetchData(); }
    }
  };

  // Resets
  const resetUnidad = () => { setUEditId(null); setUNombre(''); setUAbrev(''); };
  const resetTipoDescuento = () => { 
    setTdEditId(null); setTdNombre(''); setTdTipoCalculo('libre'); 
    setTdValorDefecto(0); setTdRequiereAuth(false); 
  };
  const resetCatMenu = () => { setCMenuEditId(null); setCMenuNombre(''); setCMenuColor('#005696'); };
  const resetCatInsumo = () => { setCInsumoEditId(null); setCInsumoNombre(''); };
  const resetMotivo = () => { setMEditId(null); setMNombre(''); setMTipo('ENTRADA'); };
  const resetZona = () => { setZEditId(null); setZFormData({ nombre: '', orden: 0, activo: true }); };
  const resetMesa = () => { setMesaEditId(null); setMesaFormData({ zona_id: '', nombre: '', capacidad: 4, activa: true, tipo_elemento: 'MESA' }); };

  return {
    loading, 
    puedeVerConfig, puedeBorrarConfig, 
    puedeCrearU, puedeEditarU, 
    puedeCrearC, puedeEditarC, 
    puedeCrearM, puedeEditarM,
    handleDelete, 

    unidades: puedeVerConfig ? unidades : [], 
    tiposDescuento: puedeVerConfig ? tiposDescuento : [], // 🚀 Exportado
    catMenu: puedeVerConfig ? catMenu : [], 
    catInsumos: puedeVerConfig ? catInsumos : [],
    motivosInventario: puedeVerConfig ? motivosInventario : [],
    zonas: puedeVerConfig ? zonas : [],

    // Unidades
    uNombre, setUNombre, uAbrev, setUAbrev, uEditId, setUEditId, handleSubmitUnidad,

    // 🚀 Tipos de Descuento
    tdNombre, setTdNombre, tdTipoCalculo, setTdTipoCalculo, 
    tdValorDefecto, setTdValorDefecto, tdRequiereAuth, setTdRequiereAuth,
    tdEditId, setTdEditId, handleSubmitTipoDescuento,

    // Categorías
    cMenuNombre, setCMenuNombre, cMenuColor, setCMenuColor, cInsumoNombre, setCInsumoNombre, 
    cMenuEditId, setCMenuEditId, cInsumoEditId, setCInsumoEditId, handleSubmitCatMenu, handleSubmitCatInsumo,

    // Motivos
    mNombre, setMNombre, mTipo, setMTipo, mEditId, setMEditId, handleSubmitMotivo,

    // Zonas/Mesas
    zEditId, setZEditId, zFormData, setZFormData, handleSubmitZona, resetZona,
    mesaEditId, setMesaEditId, mesaFormData, setMesaFormData, handleSubmitMesa, resetMesa,
    handleSavePlano,

    refresh: fetchData 
  };
};