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

  // --- NUEVOS ESTADOS: MOTIVOS INVENTARIO ---
  const [motivosInventario, setMotivosInventario] = useState([]);
  const [mNombre, setMNombre] = useState('');
  const [mTipo, setMTipo] = useState('ENTRADA');
  const [mEditId, setMEditId] = useState(null);

  // Lógica de Permisos (RBAC)
  const puedeEditarU = hasPermission('ver_unidades');
  const puedeEditarC = hasPermission('ver_categorias');
  const puedeEditarM = hasPermission('ver_insumos'); // Usamos este para motivos
  const puedeBorrar = hasPermission('borrar_registros');

  // Función para traer datos
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (subTab === 'unidades') {
        const res = await configService.getUnidades();
        setUnidades(res.data || []);
      } else if (subTab === 'categorias') {
        const [menuRes, insumosRes] = await Promise.all([
          configService.getMenu(),
          configService.getInsumos()
        ]);
        setCatMenu(menuRes.data || []);
        setCatInsumos(insumosRes.data || []);
      } else if (subTab === 'motivos') {
        // Nueva petición para motivos
        const res = await configService.getMotivosInventario();
        setMotivosInventario(res.data || []);
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error);
    } finally {
      setLoading(false);
    }
  }, [subTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- MANEJADORES DE ENVÍO ---

  const handleSubmitUnidad = async (e) => {
    e.preventDefault();
    if (!puedeEditarU) return;
    const { error } = await configService.saveUnidad({ nombre: uNombre, abreviatura: uAbrev }, uEditId);
    if (!error) { 
      setUEditId(null); setUNombre(''); setUAbrev(''); 
      fetchData(); 
    }
  };

  const handleSubmitCatMenu = async (e) => {
    e.preventDefault();
    if (!puedeEditarC) return;
    const { error } = await configService.saveMenu({ nombre: cMenuNombre, color_etiqueta: cMenuColor }, cMenuEditId);
    if (!error) { 
      setCMenuEditId(null); setCMenuNombre(''); 
      fetchData(); 
    }
  };

  const handleSubmitCatInsumo = async (e) => {
    e.preventDefault();
    if (!puedeEditarC) return;
    const { error } = await configService.saveInsumo({ nombre: cInsumoNombre }, cInsumoEditId);
    if (!error) { 
      setCInsumoEditId(null); setCInsumoNombre(''); 
      fetchData(); 
    }
  };

  // --- NUEVO MANEJADOR: MOTIVOS ---
  const handleSubmitMotivo = async (e) => {
    e.preventDefault();
    if (!puedeEditarM) return;
    const payload = { nombre_motivo: mNombre, tipo: mTipo };
    
    const { error } = await configService.saveMotivoInventario(payload, mEditId);
    
    if (!error) {
      setMEditId(null);
      setMNombre('');
      setMTipo('ENTRADA');
      fetchData();
    }
  };

  return {
    loading, 
    puedeEditarU, puedeEditarC, puedeEditarM, puedeBorrar,
    // Unidades
    unidades, uNombre, setUNombre, uAbrev, setUAbrev, uEditId, setUEditId, handleSubmitUnidad,
    // Categorías
    catMenu, catInsumos, 
    cMenuNombre, setCMenuNombre, cMenuColor, setCMenuColor, cInsumoNombre, setCInsumoNombre, 
    cMenuEditId, setCMenuEditId, cInsumoEditId, setCInsumoEditId,
    handleSubmitCatMenu, handleSubmitCatInsumo,
    // Motivos Inventario
    motivosInventario, mNombre, setMNombre, mTipo, setMTipo, mEditId, setMEditId, handleSubmitMotivo,
    refresh: fetchData 
  };
};