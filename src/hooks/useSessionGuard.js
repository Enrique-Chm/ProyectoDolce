// Archivo: src/hooks/useSessionGuard.js
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../services/Auth.service';

export const useSessionGuard = () => {
  useEffect(() => {
    // Obtenemos la sesión fresca al momento de montar el componente
    const session = authService.getCurrentSession();

    if (!session || !session.user?.id || !session.sessionId) {
      return; 
    }

    const userId = session.user.id;
    const localId = session.sessionId;

    console.log(`🛡️ [SessionGuard] ¡Guardia activado! Vigilando usuario #${userId}. Mi ID local es:`, localId);

    const channel = supabase
      .channel(`active_session_check_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'usuarios_internos',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          const remoteId = payload.new.session_id;
          
          console.log("🔔 [Realtime] Cambio en DB detectado. ID en DB:", remoteId);

          // Si el ID de la base de datos es diferente a mi ID local, alguien más entró
          if (remoteId && remoteId !== localId) {
            console.error("🚨 [CONFLICTO] ID diferente detectado. Expulsando sesión local...");
            alert("⚠️ SESIÓN DUPLICADA: Se ha iniciado sesión en otro dispositivo con esta cuenta.");
            authService.logout();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("📡 [Realtime] Conectado y escuchando cambios en la DB.");
        }
      });

    // Función de limpieza cuando el componente se desmonta
    return () => {
      console.log("🛑 [SessionGuard] Apagando guardia...");
      supabase.removeChannel(channel);
    };
    
  }, []); // El array vacío asegura que se ejecute solo al cargar el componente
};