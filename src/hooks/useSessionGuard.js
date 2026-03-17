// Archivo: src/hooks/useSessionGuard.js
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../services/Auth.service';
import Swal from 'sweetalert2'; 

export const useSessionGuard = () => {
  useEffect(() => {
    const session = authService.getCurrentSession();

    // 1. Verificación inicial: Si no hay nada, no activamos el guardia
    if (!session || !session.user?.id || !session.sessionId) return;

    const userId = session.user.id;
    const localId = session.sessionId;

    // 2. Creamos el canal de escucha
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
          
          // 3. Si el ID de la base de datos es diferente al mío, alguien más entró
          if (remoteId && remoteId !== localId) {
            
            // Importante: Removemos el canal ANTES de avisar para evitar alertas repetidas
            supabase.removeChannel(channel);

            // Usamos Swal (opcional), si prefieres el alert normal puedes cambiarlo
            Swal.fire({
              title: '¡Sesión Duplicada!',
              text: 'Se ha iniciado sesión en otro dispositivo. Esta ventana se cerrará por seguridad.',
              icon: 'warning',
              confirmButtonText: 'Aceptar',
              allowOutsideClick: false
            }).then(() => {
              authService.logout();
            });
          }
        }
      )
      .subscribe();

    // 4. Limpieza al cerrar la pestaña o cambiar de vista
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    
  }, []); 
};