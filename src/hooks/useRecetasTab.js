// Archivo: src/hooks/useRecetasTab.js
import { useState, useEffect, useCallback } from "react";
import { recetasService } from "../services/Recetas.service";
import { hasPermission } from "../utils/checkPermiso";
import toast from "react-hot-toast";

export const useRecetasTab = (sucursalId) => {
  const [recetasAgrupadas, setRecetasAgrupadas] = useState([]);
  const [insumos, setInsumos] = useState([]); 
  const [subrecetasLista, setSubrecetasLista] = useState([]); 
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estados base de la receta
  const [nombreReceta, setNombreReceta] = useState("");
  const [isSubreceta, setIsSubreceta] = useState(false);
  
  // 💡 NUEVOS ESTADOS: Rendimiento y Unidad Final
  const [rendimiento, setRendimiento] = useState(1);
  const [unidadMedidaFinal, setUnidadMedidaFinal] = useState("");

  const [ingredientes, setIngredientes] = useState([
    { tipo: 'insumo', insumo_id: "", cantidad: "", unidad_id: "" },
  ]);

  const puedeVer = hasPermission("ver_recetas");
  const puedeCrear = hasPermission("crear_recetas");
  const puedeEditar = hasPermission("editar_recetas");
  const puedeBorrar = hasPermission("borrar_recetas");

  const fetchData = useCallback(async () => {
    if (!puedeVer) return;

    try {
      setLoading(true);
      const data = await recetasService.getInitialData(sucursalId);
      
      const unidadesDescargadas = data.unidades || []; 
      
      setRecetasAgrupadas(data.recetasAgrupadas || []);
      setUnidades(unidadesDescargadas);
      setInsumos(data.insumos || []); 
      
      // Adaptamos las sub-recetas
      const subAdaptadas = (data.subrecetas || []).map(sub => ({
        id: sub.id_receta || sub.nombre, 
        nombre: sub.nombre,
        costo_unitario: sub.costo_unitario_final || sub.costo_total_receta || 0, // 👈 Usamos el costo unitario real
        unidad_medida_id: sub.unidad_medida_final || "" 
      }));
      setSubrecetasLista(subAdaptadas);
      
    } catch (error) {
      console.error("Error al cargar RecetasTab:", error);
      toast.error("Error al sincronizar los datos.");
    } finally {
      setLoading(false);
    }
  }, [sucursalId, puedeVer]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const removeIngrediente = (index) => {
    const tienePermiso = isEditing ? puedeEditar : puedeCrear;
    if (!tienePermiso) return;

    if (ingredientes.length > 1) {
      const newIngs = ingredientes.filter((_, i) => i !== index);
      setIngredientes(newIngs);
    } else {
      setIngredientes([{ tipo: 'insumo', insumo_id: "", cantidad: "", unidad_id: "" }]);
    }
  };

  const resetForm = () => {
    setNombreReceta("");
    setIsSubreceta(false);
    setRendimiento(1); // 👈 Reset rendimiento
    setUnidadMedidaFinal(""); // 👈 Reset unidad final
    setIngredientes([{ tipo: 'insumo', insumo_id: "", cantidad: "", unidad_id: "" }]);
    setIsEditing(false);
  };

  const handleEdit = (receta) => {
    setIsEditing(true);
    setNombreReceta(receta.nombre);
    setIsSubreceta(receta.subreceta);
    
    // 💡 Cargamos el rendimiento y la unidad final desde la receta seleccionada
    setRendimiento(receta.rendimiento_cantidad || 1);
    setUnidadMedidaFinal(receta.unidad_medida_final || "");

    const ingsMapeados = receta.detalle_ingredientes.map((ing) => {
      const esSubrecetaDb = subrecetasLista.some(s => s.nombre === ing.insumo);
      const tipoReal = esSubrecetaDb ? 'subreceta' : 'insumo';
      
      let itemEncontrado;
      if (tipoReal === 'subreceta') {
        itemEncontrado = subrecetasLista.find((i) => i.nombre === ing.insumo);
      } else {
        itemEncontrado = insumos.find((i) => i.nombre === ing.insumo);
      }

      const unidadEncontrada = unidades.find((u) => u.abreviatura === ing.unidad);
      
      return {
        tipo: tipoReal,
        insumo_id: itemEncontrado ? itemEncontrado.id : "",
        cantidad: ing.cantidad,
        unidad_id: unidadEncontrada ? unidadEncontrada.id : "",
      };
    });
    setIngredientes(ingsMapeados);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tienePermiso = isEditing ? puedeEditar : puedeCrear;
    if (!tienePermiso) return toast.error("Acceso denegado para guardar la receta.");
    
    const hayIncompletos = ingredientes.some(ing => !ing.insumo_id);
    if (hayIncompletos) return toast.error("Por favor, selecciona opciones válidas en todos los ingredientes.");

    if (!unidadMedidaFinal && isSubreceta) {
        return toast.error("Define la unidad de medida del resultado final.");
    }

    setLoading(true);
    const guardandoToast = toast.loading(isEditing ? "Actualizando receta..." : "Guardando receta...");

    // 💡 Incluimos rendimiento y unidad final en cada fila (denormalización para la tabla recetas)
    const rows = ingredientes.map((ing) => ({
      nombre: nombreReceta,
      subreceta: isSubreceta,
      rendimiento_cantidad: parseFloat(rendimiento) || 1, // 👈 Persistencia de rendimiento
      unidad_medida_final: parseInt(unidadMedidaFinal) || null, // 👈 Persistencia de UM Final
      insumo: ing.tipo === 'insumo' ? parseInt(ing.insumo_id) : null, 
      subreceta_id: ing.tipo === 'subreceta' ? ing.insumo_id : null,
      cantidad: parseFloat(ing.cantidad),
      unidad_medida: parseInt(ing.unidad_id) || null,
      sucursal_id: sucursalId,
    }));

    const { error } = await recetasService.saveReceta(rows, nombreReceta, isEditing);

    if (error) {
      toast.error(error.message, { id: guardandoToast });
    } else {
      toast.success(isEditing ? "Receta actualizada" : "Receta creada", { id: guardandoToast });
      resetForm();
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteReceta = async (nombre) => {
    if (!puedeBorrar) return toast.error("No tienes permisos para borrar recetas.");
    const borrandoToast = toast.loading(`Eliminando "${nombre}"...`);
    const { error } = await recetasService.deleteReceta(nombre, sucursalId);
    if (error) {
      toast.error(error.message, { id: borrandoToast });
    } else {
      toast.success(`Receta eliminada correctamente`, { id: borrandoToast });
      fetchData();
    }
  };

  return {
    recetasAgrupadas, insumos, subrecetasLista, unidades, loading, isEditing, 
    nombreReceta, setNombreReceta, 
    isSubreceta, setIsSubreceta, 
    rendimiento, setRendimiento, // 👈 Exportamos nuevos estados
    unidadMedidaFinal, setUnidadMedidaFinal, // 👈 Exportamos nuevos estados
    ingredientes, setIngredientes,
    puedeCrear, puedeEditar, puedeBorrar,
    removeIngrediente, resetForm, handleEdit, handleSubmit, handleDeleteReceta
  };
};