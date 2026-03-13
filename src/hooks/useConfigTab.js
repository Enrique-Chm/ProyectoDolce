// Archivo: src/hooks/useConfigTab.js
import { useState, useEffect, useCallback } from 'react';
import { configService } from '../services/Config.service'; 
import { hasPermission } from '../utils/checkPermiso';

export const useConfigTab = (subTab) => {
  const [loading, setLoading] = useState(false);

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

  // Lógica de Permisos
  const puedeEditarU = hasPermission('ver_unidades');
  const puedeEditarC = hasPermission('ver_categorias');
  const puedeEditarM = hasPermission('ver_insumos'); 
  const puedeBorrar = hasPermission('borrar_registros');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (subTab === 'unidades') {
        const { data } = await configService.getUnidades();
        setUnidades(data || []);
      } 
      else if (subTab === 'categorias') {
        // Ejecutamos por separado para que una tabla mala no rompa la otra
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
  }, [subTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HANDLERS ---
  const handleSubmitUnidad = async (e) => {
    e.preventDefault();
    if (!puedeEditarU) return;
    const { error } = await configService.saveUnidad({ nombre: uNombre, abreviatura: uAbrev }, uEditId);
    if (!error) { resetUnidad(); fetchData(); }
  };

  const handleSubmitCatMenu = async (e) => {
    e.preventDefault();
    if (!puedeEditarC) return;
    const { error } = await configService.saveMenu({ nombre: cMenuNombre, color_etiqueta: cMenuColor }, cMenuEditId);
    if (!error) { resetCatMenu(); fetchData(); }
    else alert("Error al guardar: " + error.message);
  };

  const handleSubmitCatInsumo = async (e) => {
    e.preventDefault();
    if (!puedeEditarC) return;
    const { error } = await configService.saveInsumo({ nombre: cInsumoNombre }, cInsumoEditId);
    if (!error) { resetCatInsumo(); fetchData(); }
    else alert("Error al guardar: " + error.message);
  };

  const handleSubmitMotivo = async (e) => {
    e.preventDefault();
    if (!puedeEditarM) return;
    const { error } = await configService.saveMotivoInventario({ nombre_motivo: mNombre, tipo: mTipo }, mEditId);
    if (!error) { resetMotivo(); fetchData(); }
  };

  // Resets auxiliares
  const resetUnidad = () => { setUEditId(null); setUNombre(''); setUAbrev(''); };
  const resetCatMenu = () => { setCMenuEditId(null); setCMenuNombre(''); setCMenuColor('#005696'); };
  const resetCatInsumo = () => { setCInsumoEditId(null); setCInsumoNombre(''); };
  const resetMotivo = () => { setMEditId(null); setMNombre(''); setMTipo('ENTRADA'); };

  return {
    loading, 
    puedeEditarU, puedeEditarC, puedeEditarM, puedeBorrar,
    unidades, uNombre, setUNombre, uAbrev, setUAbrev, uEditId, setUEditId, handleSubmitUnidad,
    catMenu, catInsumos, cMenuNombre, setCMenuNombre, cMenuColor, setCMenuColor, cInsumoNombre, setCInsumoNombre, 
    cMenuEditId, setCMenuEditId, cInsumoEditId, setCInsumoEditId, handleSubmitCatMenu, handleSubmitCatInsumo,
    motivosInventario, mNombre, setMNombre, mTipo, setMTipo, mEditId, setMEditId, handleSubmitMotivo,
    refresh: fetchData 
  };
};