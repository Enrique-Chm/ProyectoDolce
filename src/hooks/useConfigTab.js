import { useState, useEffect, useCallback } from 'react';
// Importación actualizada con el nuevo nombre del Mensajero
import { configService } from '../services/Config.service'; 
import { hasPermission } from '../utils/checkPermiso';

// CORRECCIÓN: Se cambió "useConfig" a "useConfigTab" para que coincida con la importación
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

  // Lógica de Permisos (RBAC)
  const puedeEditarU = hasPermission('ver_unidades');
  const puedeEditarC = hasPermission('ver_categorias');
  const puedeBorrar = hasPermission('borrar_registros');

  // Función para traer datos (El Administrador ordena al Mensajero)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (subTab === 'unidades') {
        const res = await configService.getUnidades();
        setUnidades(res.data || []);
      } else {
        // Ejecutamos ambas peticiones al mismo tiempo para ganar velocidad
        const [menuRes, insumosRes] = await Promise.all([
          configService.getMenu(),
          configService.getInsumos()
        ]);
        setCatMenu(menuRes.data || []);
        setCatInsumos(insumosRes.data || []);
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error);
    } finally {
      setLoading(false);
    }
  }, [subTab]);

  // Se dispara cada vez que cambias de pestaña
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- MANEJADORES DE ENVÍO (Lógica de Negocio) ---

  const handleSubmitUnidad = async (e) => {
    e.preventDefault();
    if (!puedeEditarU) return;
    const payload = { nombre: uNombre, abreviatura: uAbrev };
    
    const { error } = await configService.saveUnidad(payload, uEditId);

    if (!error) {
      setUEditId(null); 
      setUNombre(''); 
      setUAbrev('');
      fetchData(); // Refrescamos la lista automáticamente
    }
  };

  const handleSubmitCatMenu = async (e) => {
    e.preventDefault();
    if (!puedeEditarC) return;
    const payload = { nombre: cMenuNombre, color_etiqueta: cMenuColor };

    const { error } = await configService.saveMenu(payload, cMenuEditId);
    
    if (!error) { 
      setCMenuEditId(null); 
      setCMenuNombre(''); 
      fetchData(); 
    }
  };

  const handleSubmitCatInsumo = async (e) => {
    e.preventDefault();
    if (!puedeEditarC) return;
    const payload = { nombre: cInsumoNombre };

    const { error } = await configService.saveInsumo(payload, cInsumoEditId);
    
    if (!error) { 
      setCInsumoEditId(null); 
      setCInsumoNombre(''); 
      fetchData(); 
    }
  };

  // Exponemos todo lo que el JSX necesita consumir
  return {
    loading, 
    puedeEditarU, 
    puedeEditarC, 
    puedeBorrar,
    // Unidades
    unidades, uNombre, setUNombre, uAbrev, setUAbrev, uEditId, setUEditId, handleSubmitUnidad,
    // Categorías
    catMenu, catInsumos, 
    cMenuNombre, setCMenuNombre, 
    cMenuColor, setCMenuColor, 
    cInsumoNombre, setCInsumoNombre, 
    cMenuEditId, setCMenuEditId, 
    cInsumoEditId, setCInsumoEditId,
    handleSubmitCatMenu, 
    handleSubmitCatInsumo,
    refresh: fetchData // Opción por si el JSX quiere refrescar manualmente
  };
};