// src/modules/Admin/Login.jsx
import React, { useState } from 'react';
import styles from '../../assets/styles/EstilosGenerales.module.css';
import { useAuth } from '../Auth/useAuth';

export default function Login({ onLoginSuccess }) {
  const { loading, iniciarSesion } = useAuth();
  
  // Estados actualizados para usar "usuario" en lugar de "email"
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica de campos vacíos
    if (!usuario.trim() || !password.trim()) return;
    
    // Intentamos iniciar sesión con el ID de usuario
    const exito = await iniciarSesion(usuario, password);
    
    // Si la validación en el Service fue correcta, disparamos el éxito
    if (exito) onLoginSuccess();
  };

  return (
    <div className={styles.fadeIN} style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 'var(--space-md)',
      backgroundColor: 'var(--color-surface-lowest)'
    }}>
      <div className={styles.card} style={{ 
        maxWidth: '400px', 
        width: '100%', 
        padding: 'var(--space-xl)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
      }}>
        <header style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          <span className={styles.labelTop} style={{ letterSpacing: '2px' }}>
            SISTEMA DE SUMINISTROS
          </span>
          <h1 className={styles.title} style={{ fontSize: '2.5rem', marginTop: '8px', lineHeight: '1' }}>
            Ingresar
          </h1>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Campo de ID de Usuario */}
          <div>
            <label className={styles.labelTop}>ID DE USUARIO</label>
            <input 
              type="text" 
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className={styles.inputEditorial} 
              placeholder="Ej: jorge_cocina"
              required 
              autoComplete="username"
            />
          </div>

          {/* Campo de Contraseña */}
          <div>
            <label className={styles.labelTop}>CONTRASEÑA</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.inputEditorial} 
              placeholder="••••••••"
              required 
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={styles.btnPrimary} 
            style={{ 
              padding: '1.2rem', 
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
                VALIDANDO...
              </>
            ) : (
              'ENTRAR AL PANEL'
            )}
          </button>
        </form>

        <footer style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', lineHeight: '1.5' }}>
            Acceso restringido para personal autorizado.<br />
            Si olvidaste tu clave, contacta al administrador.
          </p>
        </footer>
      </div>
    </div>
  );
}