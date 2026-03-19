// Archivo: src/hooks/useConfigTab.js
import { useState, useEffect, useCallback } from 'react';
import { configService } from '../services/Config.service'; 
import { hasPermission } from '../utils/checkPermiso';

export const useConfigTab = (subTab) => {
  const [loading, setLoading] = useState(false);

  // 🛡️ DEFINICIÓN DE FACULTADES BASE (Blindaje de nivel Configuración)
  const puedeVerConfig = hasPermission('ver_configuracion');
  const puedeCrearConfig = hasPermission('crear_configuracion');   // 👈 Nuevo estándar
  const puedeEditarConfig = hasPermission('editar_configuracion');
  const puedeBorrarConfig = hasPermission('borrar_configuracion'); // 👈 Nuevo estándar

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

  // Lógica de Permisos Original (Mantenida al 100% y expandida para la separación Crear/Editar)
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
    } catch (error) {
      console.error("Error crítico en useConfigTab:", error);
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
    if (!tienePermiso) return alert("Acceso Denegado: Se requiere permiso para guardar unidades de medida."); 

    const { error } = await configService.saveUnidad({ nombre: uNombre, abreviatura: uAbrev }, uEditId);
    if (!error) { 
      resetUnidad(); 
      fetchData(); 
    } else {
      alert("Error al guardar: " + error.message);
    }
  };

  const handleSubmitCatMenu = async (e) => {
    e.preventDefault();
    const tienePermiso = cMenuEditId ? puedeEditarC : puedeCrearC;
    if (!tienePermiso) return alert("Acceso Denegado: Se requiere permiso para guardar categorías de menú."); 

    const { error } = await configService.saveMenu({ nombre: cMenuNombre, color_etiqueta: cMenuColor }, cMenuEditId);
    if (!error) { 
      resetCatMenu(); 
      fetchData(); 
    } else { 
      alert("Error al guardar: " + error.message);
    }
  };

  const handleSubmitCatInsumo = async (e) => {
    e.preventDefault();
    const tienePermiso = cInsumoEditId ? puedeEditarC : puedeCrearC;
    if (!tienePermiso) return alert("Acceso Denegado: Se requiere permiso para guardar categorías de insumos."); 

    const { error } = await configService.saveInsumo({ nombre: cInsumoNombre }, cInsumoEditId);
    if (!error) { 
      resetCatInsumo(); 
      fetchData(); 
    } else { 
      alert("Error al guardar: " + error.message);
    }
  };

  const handleSubmitMotivo = async (e) => {
    e.preventDefault();
    const tienePermiso = mEditId ? puedeEditarM : puedeCrearM;
    if (!tienePermiso) return alert("Acceso Denegado: Se requiere permiso para guardar motivos de ajuste."); 

    const { error } = await configService.saveMotivoInventario({ nombre_motivo: mNombre, tipo: mTipo }, mEditId);
    if (!error) { 
      resetMotivo(); 
      fetchData(); 
    } else {
      alert("Error al guardar: " + error.message);
    }
  };

  // 🛡️ LÓGICA DE BORRADO AÑADIDA
  const handleDelete = async (tipo, id) => {
    if (!puedeBorrarConfig) return alert("Acceso Denegado: Se requiere permiso para borrar en configuración.");
    
    if (window.confirm("¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.")) {
      setLoading(true);
      let res;
      if (tipo === 'unidades') res = await configService.deleteUnidad(id);
      if (tipo === 'menu') res = await configService.deleteMenu(id);
      if (tipo === 'insumos') res = await configService.deleteInsumo(id);
      if (tipo === 'motivos') res = await configService.deleteMotivoInventario(id);

      if (res?.error) alert("Error al eliminar: " + res.error.message);
      else fetchData();
      setLoading(false);
    }
  };

  // Resets auxiliares
  const resetUnidad = () => { setUEditId(null); setUNombre(''); setUAbrev(''); };
  const resetCatMenu = () => { setCMenuEditId(null); setCMenuNombre(''); setCMenuColor('#005696'); };
  const resetCatInsumo = () => { setCInsumoEditId(null); setCInsumoNombre(''); };
  const resetMotivo = () => { setMEditId(null); setMNombre(''); setMTipo('ENTRADA'); };

  return {
    loading, 
    // 🛡️ Exportamos facultades
    puedeVerConfig, puedeBorrarConfig, // Corregido el nombre aquí
    puedeCrearU, puedeEditarU, 
    puedeCrearC, puedeEditarC, 
    puedeCrearM, puedeEditarM,
    
    // Exportamos función de borrado
    handleDelete, 

    unidades: puedeVerConfig ? unidades : [], 
    catMenu: puedeVerConfig ? catMenu : [], 
    catInsumos: puedeVerConfig ? catInsumos : [],
    motivosInventario: puedeVerConfig ? motivosInventario : [],

    uNombre, setUNombre, uAbrev, setUAbrev, uEditId, setUEditId, handleSubmitUnidad,
    cMenuNombre, setCMenuNombre, cMenuColor, setCMenuColor, cInsumoNombre, setCInsumoNombre, 
    cMenuEditId, setCMenuEditId, cInsumoEditId, setCInsumoEditId, handleSubmitCatMenu, handleSubmitCatInsumo,
    mNombre, setMNombre, mTipo, setMTipo, mEditId, setMEditId, handleSubmitMotivo,
    refresh: fetchData 
  };
};