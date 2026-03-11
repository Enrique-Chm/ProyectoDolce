import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../services/Auth.service';

export const useSessionGuard = () => {
  // Obtenemos la sesión actual para usarla como disparador
  const session = authService.getCurrentSession();

  useEffect(() => {
    // 1. Verificación: Si no hay datos, esperamos (antes aquí moría el proceso)
    if (!session || !session.user?.id || !session.sessionId) {
      return; 
    }

    const userId = session.user.id;
    const localId = session.sessionId;

    console.log(`🛡️ [SessionGuard] ¡Guardia activado! Vigilando usuario #${userId}`);

    // 2. Suscripción al canal de Supabase
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
          
          console.log("🔔 [Realtime] Cambio detectado. DB dice:", remoteId);

          if (remoteId && remoteId !== localId) {
            console.error("🚨 [CONFLICTO] ID diferente detectado. Expulsando...");
            alert("⚠️ SESIÓN DUPLICADA: Se ha iniciado sesión en otro dispositivo con esta cuenta.");
            authService.logout();
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 [Realtime] Estado:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
    
    // 3. LA CLAVE: El guardia se reinicia cada vez que la sesión cambia
  }, [session?.sessionId]); 
};