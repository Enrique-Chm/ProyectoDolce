// Archivo: src/hooks/useImpresoras.js
import { useState, useEffect, useCallback } from 'react';
import { impresorasService } from '../services/Impresoras.service';
import { CajaService } from '../modules/TabsTabs/CajeroTab/Caja.service';
import { hasPermission } from '../utils/checkPermiso'; // 🛡️ Blindaje de seguridad

/**
 * Hook integral para gestionar hardware de impresión y diseño de tickets
 */
export const useImpresoras = (sucursalId) => {
  const [impresoras, setImpresoras] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🛡️ DEFINICIÓN DE FACULTADES (Hardware y Configuración)
  const puedeVer = hasPermission('ver_configuracion');
  const puedeEditar = hasPermission('editar_configuracion');
  const puedeBorrar = hasPermission('borrar_registros');
  
  // --- ESTADO INICIAL DEL FORMULARIO DE HARDWARE ---
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
    
    // 🛡️ BLINDAJE: Si no puede ver configuración, ni siquiera preguntamos a la base de datos
    if (!puedeVer) return;

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
  }, [sucursalId, puedeVer]); // 🛡️ Añadida dependencia de seguridad

  useEffect(() => {
    cargarDatosSincronizados();
  }, [cargarDatosSincronizados]);

  // 2. LÓGICA DE GESTIÓN DE IMPRESORAS (HARDWARE)
  const guardarImpresora = async () => {
    // 🛡️ BLINDAJE: Bloqueo de acción de edición
    if (!puedeEditar) {
      alert("Acceso denegado: No tienes permiso para configurar hardware.");
      return;
    }

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
    // 🛡️ BLINDAJE: Bloqueo de acción de borrado
    if (!puedeBorrar) {
      alert("Acceso denegado: Se requiere nivel administrador para eliminar dispositivos.");
      return;
    }

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
    // 🛡️ BLINDAJE: Bloqueo de acción de edición
    if (!puedeEditar) {
      alert("Acceso denegado: No tienes facultades para modificar el diseño del ticket.");
      return;
    }

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
    // Datos blindados de salida
    impresoras: puedeVer ? impresoras : [], 
    configTicket: puedeVer ? configTicket : null,
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

    // 🛡️ Banderas de seguridad para la UI
    puedeVer,
    puedeEditar,
    puedeBorrar,

    // Utilidades
    refrescar: cargarDatosSincronizados
  };
};