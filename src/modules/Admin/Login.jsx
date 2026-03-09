import React, { useState } from 'react';
import { authService } from '../../services/Auth.service';
import s from './AdminPage.module.css';

export const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await authService.login(username, password);
      onLoginSuccess(session);
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
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
          <p className={s.textMuted} style={{ marginTop: '10px', fontSize: '13px' }}>
            Panel de Gestión Operativa
          </p>
        </div>

        {error && <div className={s.errorBadge}>{error}</div>}

        <form className={s.loginForm} onSubmit={handleLogin}>
          <div className={s.formGroup}>
            <label className={s.label}>Usuario</label>
            <input 
              type="text" 
              className={s.loginInput} 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="nombre.apellido"
              autoFocus
            />
          </div>

          <div className={s.formGroup}>
            <label className={s.label}>Contraseña</label>
            <input 
              type="password" 
              className={s.loginInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className={s.loginBtn}
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};