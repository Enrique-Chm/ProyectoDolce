// Archivo: src/modules/Admin/Tabs/RecetasTab/useRecetasTab.js
import { useState, useEffect, useCallback } from "react";
import { recetasService } from "./Recetas.service"; 
import { hasPermission } from "../../../../utils/checkPermiso"; 
import toast from "react-hot-toast";

/**
 * Hook para la gestión de ingeniería de recetas.
 * Optimizado para flujo: Receta -> Menú (Vínculo por nombre).
 * Incluye re-cálculo en tiempo real para evitar $0.00 en sub-recetas.
 */
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
  
  // Rendimiento y Unidad Final
  const [rendimiento, setRendimiento] = useState(1);
  const [unidadMedidaFinal, setUnidadMedidaFinal] = useState("");

  const [ingredientes, setIngredientes] = useState([
    { tipo: 'insumo', insumo_id: "", cantidad: "", unidad_id: "" },
  ]);

  const puedeVer = hasPermission("ver_recetas");
  const puedeCrear = hasPermission("crear_recetas");
  const puedeEditar = hasPermission("editar_recetas");
  const puedeBorrar = hasPermission("borrar_recetas");

  /**
   * Carga inicial de datos y RE-CÁLCULO de costos para la tabla
   */
  const fetchData = useCallback(async () => {
    if (!puedeVer) return;

    try {
      setLoading(true);
      const data = await recetasService.getInitialData(sucursalId);
      
      const unidadesDescargadas = data.unidades || []; 
      const insumosDescargados = data.insumos || [];
      const rawRecetas = data.recetasAgrupadas || [];
      
      // 1. Extraemos las sub-recetas con sus costos (que la BD sí calculó bien por ser insumos base)
      const subAdaptadas = (data.subrecetas || []).map(sub => ({
        id: sub.nombre, 
        nombre: sub.nombre,
        costo_unitario: parseFloat(sub.costo_unitario_final) || parseFloat(sub.costo_total_receta) || 0,
        unidad_medida_id: sub.unidad_medida_final || "" 
      }));

      // 🧠 2. EL PARCHE MÁGICO: Recorremos las recetas para parchar los $0.00 visuales
      const recetasConCostosReales = rawRecetas.map(receta => {
        let costoTotalReal = 0;

        const ingredientesCorregidos = (receta.detalle_ingredientes || []).map(ing => {
          let costoUnitarioItem = 0;

          // ¿Es una sub-receta? Buscamos su precio en nuestra lista adaptada
          const subEncontrada = subAdaptadas.find(s => s.nombre === ing.insumo);
          if (subEncontrada) {
            costoUnitarioItem = subEncontrada.costo_unitario;
          } else {
            // Si no, es un insumo normal, lo buscamos en los insumos
            const insEncontrado = insumosDescargados.find(i => i.nombre === ing.insumo);
            if (insEncontrado) costoUnitarioItem = parseFloat(insEncontrado.costo_unitario) || 0;
          }

          // Recalculamos el costo de la fila con el precio real
          const costoFilaCalculado = costoUnitarioItem * (parseFloat(ing.cantidad) || 0);
          costoTotalReal += costoFilaCalculado;

          return {
            ...ing,
            costo_fila: costoFilaCalculado // Sobrescribimos el error de la BD
          };
        });

        // Recalculamos totales del lote y unitarios basados en el rendimiento
        const rend = parseFloat(receta.rendimiento_cantidad) || 1;
        const costoUnitFinal = costoTotalReal / rend;

        return {
          ...receta,
          detalle_ingredientes: ingredientesCorregidos,
          costo_total_receta: costoTotalReal,       // Actualizamos el costo del lote
          costo_unitario_final: costoUnitFinal      // Actualizamos el costo unitario
        };
      });

      // 3. Guardamos los datos corregidos en los estados de React
      setRecetasAgrupadas(recetasConCostosReales);
      setUnidades(unidadesDescargadas);
      setInsumos(insumosDescargados); 
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
    setRendimiento(1);
    setUnidadMedidaFinal("");
    setIngredientes([{ tipo: 'insumo', insumo_id: "", cantidad: "", unidad_id: "" }]);
    setIsEditing(false);
  };

  const handleEdit = (receta) => {
    setIsEditing(true);
    setNombreReceta(receta.nombre);
    setIsSubreceta(receta.subreceta);
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
    if (!tienePermiso) return toast.error("Acceso denegado.");
    
    if (!nombreReceta.trim()) return toast.error("El nombre es obligatorio.");

    const hayIncompletos = ingredientes.some(ing => !ing.insumo_id || !ing.cantidad);
    if (hayIncompletos) return toast.error("Completa todos los ingredientes.");

    if (isSubreceta && !unidadMedidaFinal) {
        return toast.error("Define la unidad de medida para la sub-receta.");
    }

    setLoading(true);
    const guardandoToast = toast.loading(isEditing ? "Actualizando..." : "Guardando...");

    const rows = ingredientes.map((ing) => ({
      nombre: nombreReceta.trim(),
      producto_id: null, // Vínculo automático por nombre en SQL
      subreceta: isSubreceta,
      rendimiento_cantidad: parseFloat(rendimiento) || 1,
      unidad_medida_final: parseInt(unidadMedidaFinal) || null,
      subreceta_id: isSubreceta ? nombreReceta.trim() : (ing.tipo === 'subreceta' ? ing.insumo_id : null),
      insumo: ing.tipo === 'insumo' ? parseInt(ing.insumo_id) : null, 
      cantidad: parseFloat(ing.cantidad),
      unidad_medida: parseInt(ing.unidad_id) || null,
      sucursal_id: sucursalId,
    }));

    try {
      const { error } = await recetasService.saveReceta(rows, nombreReceta, isEditing);

      if (error) {
        toast.error(error.message, { id: guardandoToast });
      } else {
        toast.success(isEditing ? "Receta actualizada" : "Receta creada", { id: guardandoToast });
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error("Error al guardar:", err);
      toast.error("Error al guardar la receta.", { id: guardandoToast });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReceta = async (nombre) => {
    if (!puedeBorrar) return toast.error("No tienes permisos.");
    const borrandoToast = toast.loading(`Eliminando...`);
    
    try {
      const { error } = await recetasService.deleteReceta(nombre, sucursalId);
      if (error) {
        toast.error(error.message, { id: borrandoToast });
      } else {
        toast.success(`Eliminada`, { id: borrandoToast });
        fetchData();
      }
    } catch (err) {
      toast.error("Error al eliminar.", { id: borrandoToast });
    }
  };

  return {
    recetasAgrupadas,
    insumos,
    subrecetasLista,
    unidades,
    loading,
    isEditing, 
    nombreReceta,
    setNombreReceta, 
    isSubreceta,
    setIsSubreceta, 
    rendimiento,
    setRendimiento,
    unidadMedidaFinal,
    setUnidadMedidaFinal,
    ingredientes,
    setIngredientes,
    puedeCrear,
    puedeEditar,
    puedeBorrar,
    removeIngrediente,
    resetForm,
    handleEdit,
    handleSubmit,
    handleDeleteReceta
  };
};