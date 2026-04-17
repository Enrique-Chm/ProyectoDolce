// src/modules/Auth/Login.jsx
import React, { useState } from 'react';
import styles from '../../assets/styles/EstilosGenerales.module.css';
import { useAuth } from './useAuth'; // Ruta relativa corregida

export default function Login({ onLoginSuccess }) {
  const { loading, iniciarSesion } = useAuth();
  
  // Usamos 'usuario' para coincidir con la columna UNIQUE de la base de datos
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación preventiva
    if (!usuario.trim() || !password.trim()) return;
    
    // Intentamos iniciar sesión
    const exito = await iniciarSesion(usuario, password);
    
    // Si el login es exitoso, notificamos al componente padre (AdminPage)
    if (exito) {
      if (onLoginSuccess) onLoginSuccess();
    }
  };

  return (
    <div className={styles.fadeIN} style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 'var(--space-md)',
      background: 'linear-gradient(135deg, var(--color-surface-lowest) 0%, var(--color-surface-low) 100%)'
    }}>
      <div className={styles.card} style={{ 
        maxWidth: '420px', 
        width: '100%', 
        padding: 'var(--space-xl)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)'
      }}>
        <header style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: 'var(--color-primary-container)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>
              inventory_2
            </span>
          </div>
          <span className={styles.labelTop} style={{ letterSpacing: '3px', fontWeight: '800', color: 'var(--color-primary)' }}>
            ERP SUMINISTROS
          </span>
          <h1 className={styles.title} style={{ fontSize: '2.2rem', marginTop: '8px', fontWeight: '900' }}>
            Bienvenido
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Ingresa tus credenciales para continuar
          </p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Campo de ID de Usuario */}
          <div>
            <label className={styles.labelTop}>IDENTIFICADOR DE USUARIO</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className={styles.inputEditorial} 
                placeholder="nombre.apellido"
                required 
                autoComplete="username"
                style={{ paddingLeft: '45px' }}
              />
              <span className="material-symbols-outlined" style={{ 
                position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-light)', fontSize: '1.2rem'
              }}>person</span>
            </div>
          </div>

          {/* Campo de Contraseña */}
          <div>
            <label className={styles.labelTop}>CONTRASEÑA</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.inputEditorial} 
                placeholder="••••••••"
                required 
                autoComplete="current-password"
                style={{ paddingLeft: '45px' }}
              />
              <span className="material-symbols-outlined" style={{ 
                position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-light)', fontSize: '1.2rem'
              }}>lock</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={styles.btnPrimary} 
            style={{ 
              padding: '1.2rem', 
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              borderRadius: '14px',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
                AUTENTICANDO...
              </>
            ) : (
              <>
                <span>ENTRAR AL SISTEMA</span>
                <span className="material-symbols-outlined">login</span>
              </>
            )}
          </button>
        </form>

        <footer style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <div style={{ 
            padding: '12px', 
            background: 'var(--color-surface-low)', 
            borderRadius: '12px',
            fontSize: '0.75rem', 
            color: 'var(--text-light)', 
            lineHeight: '1.6' 
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '4px' }}>info</span>
            Acceso restringido. El uso no autorizado de este sistema está monitoreado y sujeto a políticas internas.
          </div>
        </footer>
      </div>
    </div>
  );
}