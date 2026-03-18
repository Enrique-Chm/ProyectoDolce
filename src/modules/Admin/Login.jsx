// Archivo: src/modules/Auth/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { authService } from '../../services/Auth.service';
// Ajusta la ruta de importación de tu CSS general de Admin
import s from '../Admin/AdminPage.module.css';

export const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🛡️ BLINDAJE: Verificación de sesión persistente
  // Si el usuario ya tiene una sesión válida en el navegador, 
  // lo enviamos directo al sistema sin pedir credenciales.
  useEffect(() => {
    const activeSession = authService.getCurrentSession();
    if (activeSession) {
      onLoginSuccess(activeSession);
    }
  }, [onLoginSuccess]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // 🛡️ Limpieza de datos (Trimming)
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      return setError('Por favor, completa todos los campos.');
    }

    setLoading(true);

    try {
      // 🛡️ Llamada al servicio blindado de autenticación
      const session = await authService.login(cleanUsername, password);
      onLoginSuccess(session);
    } catch (err) {
      // Manejo de errores amigable pero seguro
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.loginWrapper}>
      <div className={s.loginCard}>
        <div className={s.logoArea}>
          <h1 className={s.logoTitle}>
            CloudKitchen <span className={s.logoAccent}>Admin</span>
          </h1>
          <p className={s.textMuted}>
            Panel de Gestión Operativa
          </p>
        </div>

        {error && <div className={s.errorBadge}>{error}</div>}

        <form onSubmit={handleLogin} className={s.loginForm}>
          <div className={s.formGroup}>
            <label className={s.label}>Usuario</label>
            <input 
              type="text" 
              className={s.inputField} 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="nombre.apellido"
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className={s.formGroup}>
            <label className={s.label}>Contraseña</label>
            <input 
              type="password" 
              className={s.inputField}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className={`${s.btn} ${s.btnPrimary} ${s.btnFull}`}
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};