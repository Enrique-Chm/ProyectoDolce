// Archivo: src/modules/Auth/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { authService } from '../../services/Auth.service';

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

  // Objeto de estilos integrados (Mantenidos al 100%)
  const styles = {
    loginWrapper: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      padding: '20px',
      boxSizing: 'border-box'
    },
    loginCard: {
      backgroundColor: 'var(--bg-card)',
      width: '100%',
      maxWidth: '400px',
      padding: '40px',
      borderRadius: 'var(--radius-ui)',
      boxShadow: 'var(--shadow-main)',
      border: '1px solid var(--color-border)',
      boxSizing: 'border-box'
    },
    logoArea: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    logoTitle: {
      fontSize: '24px',
      fontWeight: '800',
      color: 'var(--color-text-main)',
      margin: 0
    },
    logoAccent: {
      color: 'var(--color-primary)'
    },
    textMuted: {
      color: 'var(--color-text-muted)',
      marginTop: '10px',
      fontSize: '13px'
    },
    errorBadge: {
      backgroundColor: '#fee2e2',
      color: '#b91c1c',
      padding: '12px',
      borderRadius: 'var(--radius-ui)',
      fontSize: '13px',
      fontWeight: '600',
      marginBottom: '20px',
      textAlign: 'center',
      border: '1px solid #fecaca'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: '11px',
      fontWeight: '700',
      color: 'var(--color-text-muted)',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    loginInput: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '15px',
      borderRadius: 'var(--radius-ui)',
      border: '1px solid var(--color-border)',
      backgroundColor: '#ffffff',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    loginBtn: {
      width: '100%',
      padding: '14px',
      backgroundColor: 'var(--color-primary)',
      color: 'white',
      border: 'none',
      borderRadius: 'var(--radius-button)',
      fontSize: '15px',
      fontWeight: '700',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1,
      marginTop: '10px',
      transition: 'filter 0.2s'
    }
  };

  return (
    <div style={styles.loginWrapper}>
      <div style={styles.loginCard}>
        <div style={styles.logoArea}>
          <h1 style={styles.logoTitle}>
            CloudKitchen <span style={styles.logoAccent}>Admin</span>
          </h1>
          <p style={styles.textMuted}>
            Panel de Gestión Operativa
          </p>
        </div>

        {error && <div style={styles.errorBadge}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Usuario</label>
            <input 
              type="text" 
              style={styles.loginInput} 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="nombre.apellido"
              autoFocus
              autoComplete="username"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contraseña</label>
            <input 
              type="password" 
              style={styles.loginInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            style={styles.loginBtn}
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};