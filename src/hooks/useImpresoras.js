import { useState, useEffect, useCallback } from 'react';
import { impresorasService } from '../services/Impresoras.service';
import { CajaService } from '../services/Caja.service';

/**
 * Hook integral para gestionar hardware de impresión y diseño de tickets
 */
export const useImpresoras = (sucursalId) => {
  const [impresoras, setImpresoras] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // --- ESTADO INICIAL DEL FORMULARIO DE HARDWARE ---
  // Incluye los nuevos campos de IP y Puerto para conexión por red
  const initialFormState = {
    nombre: '',
    origen: 'caja',      // caja | cocina | barra
    formato: '80mm',     // 80mm | 58mm | letter
    tipo_conexion: 'network', 
    ip_address: '',
    puerto: 9100
  };

  const [form, setForm] = useState(initialFormState);

  // --- ESTADO PARA EL DISEÑO VISUAL ---
  const [configTicket, setConfigTicket] = useState({
    encabezado: '',
    pie_pagina: '',
    mostrar_logo: true,
    mostrar_mesero: true,
    font_size_base: 12
  });

  // 1. CARGA DE DATOS SINCRONIZADA
  const cargarDatosSincronizados = useCallback(async () => {
    if (!sucursalId) return;
    setLoading(true);

    try {
      // Cargamos impresoras y configuración de ticket en paralelo
      const [resImps, resConfig] = await Promise.all([
        impresorasService.getAll(sucursalId),
        CajaService.getConfigTicket(sucursalId)
      ]);

      if (resImps.data) setImpresoras(resImps.data);
      if (resConfig.data) setConfigTicket(resConfig.data);
    } catch (err) {
      console.error("Error al sincronizar datos de impresión:", err);
    } finally {
      setLoading(false);
    }
  }, [sucursalId]);

  useEffect(() => {
    cargarDatosSincronizados();
  }, [cargarDatosSincronizados]);

  // 2. LÓGICA DE GESTIÓN DE IMPRESORAS (HARDWARE)
  const guardarImpresora = async () => {
    // Validación básica antes de enviar a Supabase
    if (!form.nombre.trim()) {
      alert("Debes asignar un nombre a la impresora.");
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        ...form, 
        sucursal_id: sucursalId 
      };

      const { error } = await impresorasService.save(payload);
      
      if (error) throw error;

      // Si todo sale bien, limpiamos y refrescamos
      setForm(initialFormState);
      await cargarDatosSincronizados();
      alert("Dispositivo vinculado correctamente.");
    } catch (err) {
      alert("Error al vincular: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const eliminarImpresora = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este dispositivo?")) return;
    
    setLoading(true);
    try {
      const { error } = await impresorasService.delete(id);
      if (error) throw error;
      setImpresoras(prev => prev.filter(imp => imp.id !== id));
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. LÓGICA DE DISEÑO (ESTÉTICA DEL TICKET)
  const guardarConfigTicket = async () => {
    setLoading(true);
    try {
      const { error } = await CajaService.guardarConfigTicket({
        ...configTicket,
        sucursal_id: sucursalId
      });

      if (error) throw error;
      alert("Diseño actualizado con éxito.");
    } catch (err) {
      alert("Error al guardar diseño: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    impresoras,
    loading,
    // Gestión de Hardware
    form,
    setForm,
    guardarImpresora,
    eliminarImpresora,
    // Gestión de Diseño
    configTicket,
    setConfigTicket,
    guardarConfigTicket,
    // Utilidades
    refrescar: cargarDatosSincronizados
  };
};