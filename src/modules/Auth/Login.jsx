// src/modules/Auth/Login.jsx
import React, { useState } from 'react';
import styles from '../../assets/styles/EstilosGenerales.module.css';
import { useAuth } from './useAuth';

export default function Login({ onLoginSuccess }) {
  const { loading, iniciarSesion } = useAuth();
  
  // Usamos 'usuario' para coincidir con la columna UNIQUE de la base de datos
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación preventiva
    if (!usuario.trim() || !password.trim()) return;
    
    // Intentamos iniciar sesión
    const exito = await iniciarSesion(usuario, password);
    
    // Si el login es exitoso, notificamos al componente padre
    if (exito && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className={styles.fadeIN} style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 'var(--space-md)',
      backgroundColor: 'var(--color-background)',
      backgroundImage: 'radial-gradient(var(--border-ghost) 1px, transparent 1px)',
      backgroundSize: '24px 24px'
    }}>
      <div className={styles.card} style={{ 
        maxWidth: '400px', 
        width: '100%', 
        padding: '2.5rem 2rem',
        boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
        borderRadius: '20px',
        border: '1px solid var(--border-ghost)',
        backgroundColor: 'var(--color-surface-lowest)'
      }}>
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            background: 'var(--gradient-editorial)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 16px rgba(162, 63, 39, 0.25)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.85rem', color: 'white' }}>
              restaurant_menu
            </span>
          </div>
          <span className={styles.labelTop} style={{ letterSpacing: '2px', fontWeight: '800', color: 'var(--color-primary)', fontSize: '0.65rem' }}>
            KITCHEN INVENTARIOS
          </span>
          <h1 className={styles.title} style={{ fontSize: '1.85rem', marginTop: '6px', fontWeight: '800', color: 'var(--text-main)' }}>
            Bienvenido
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '4px' }}>
            Ingresa tus credenciales para continuar
          </p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Campo de ID de Usuario */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className={styles.labelTop} style={{ fontSize: '0.65rem' }}>IDENTIFICADOR DE USUARIO</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className={styles.inputEditorial} 
                placeholder="Usuario"
                required 
                autoComplete="username"
                style={{ paddingLeft: '42px', height: '48px', borderRadius: '12px' }}
              />
              <span className="material-symbols-outlined" style={{ 
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-light)', fontSize: '1.2rem', pointerEvents: 'none'
              }}>person</span>
            </div>
          </div>

          {/* Campo de Contraseña */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className={styles.labelTop} style={{ fontSize: '0.65rem' }}>CONTRASEÑA</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={verPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.inputEditorial} 
                placeholder="••••••••"
                required 
                autoComplete="current-password"
                style={{ paddingLeft: '42px', paddingRight: '42px', height: '48px', borderRadius: '12px' }}
              />
              <span className="material-symbols-outlined" style={{ 
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-light)', fontSize: '1.2rem', pointerEvents: 'none'
              }}>lock</span>
              
              {/* Toggle de Password */}
              <button
                type="button"
                onClick={() => setVerPassword(!verPassword)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)',
                  display: 'flex', padding: 0
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                  {verPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Botón de Entrar */}
          <button 
            type="submit" 
            disabled={loading}
            className={styles.btnPrimary} 
            style={{ 
              padding: '1rem', 
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              height: '52px',
              border: 'none',
              cursor: loading ? 'default' : 'pointer'
            }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined" style={{ animation: 'spin 1.5s linear infinite', fontSize: '1.25rem' }}>sync</span>
                <span>AUTENTICANDO...</span>
              </>
            ) : (
              <>
                <span>Bienvenido</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>login</span>
              </>
            )}
          </button>
        </form>

        <footer style={{ marginTop: '2rem', textAlign: 'center' }}>
          <div style={{ 
            padding: '10px 14px', 
            background: 'var(--color-surface-low)', 
            borderRadius: '10px',
            fontSize: '0.7rem', 
            color: 'var(--text-muted)', 
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            textAlign: 'left'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginTop: '1px', flexShrink: 0 }}>info</span>
            <span>Acceso restringido. El uso no autorizado de este sistema está monitoreado y sujeto a políticas internas.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}