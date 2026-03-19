// 1. IMPORTAR el hook desde react-router-dom
import { useNavigate } from 'react-router-dom';

export const MiComponenteCualquiera = () => {
  // 2. INICIALIZAR el hook (siempre debe ir arriba, dentro del componente)
  const navigate = useNavigate();

  const guardarYSalir = async () => {
    // ... aquí haces tu lógica (ej: guardar en Supabase) ...

    // 3. EJECUTAR la navegación hacia la ruta que quieras
    navigate('/admin'); 
  };

  return (
    <button onClick={guardarYSalir} className="btn-primary">
      Guardar y Volver al Dashboard
    </button>
  );
};