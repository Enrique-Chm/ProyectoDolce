// src/modules/Auth/Login.jsx
import React, { useState } from 'react';
import styles from '../../assets/styles/EstilosGenerales.module.css';
import { useAuth } from './useAuth';

// ─────────────────────────────────────────
// Estilos extraídos del JSX para mayor
// legibilidad. No cambia comportamiento.
// ─────────────────────────────────────────
const sx = {
  page: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-md)',
    backgroundColor: 'var(--color-background)',
    backgroundImage: 'radial-gradient(var(--border-ghost) 1px, transparent 1px)',
    backgroundSize: '24px 24px'
  },
  card: {
    maxWidth: '400px',
    width: '100%',
    padding: '2.5rem 2rem',
    boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
    borderRadius: '20px',
    border: '1px solid var(--border-ghost)',
    backgroundColor: 'var(--color-surface-lowest)'
  },
  logoWrapper: {
    width: '56px',
    height: '56px',
    background: 'var(--gradient-editorial)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
    boxShadow: '0 8px 16px rgba(162, 63, 39, 0.25)'
  },
  logoIcon: {
    fontSize: '1.85rem',
    color: 'white'
  },
  labelApp: {
    letterSpacing: '2px',
    fontWeight: '800',
    color: 'var(--color-primary)',
    fontSize: '0.65rem'
  },
  titulo: {
    fontSize: '1.85rem',
    marginTop: '6px',
    fontWeight: '800',
    color: 'var(--text-main)'
  },
  subtitulo: {
    color: 'var(--text-muted)',
    fontSize: '0.825rem',
    marginTop: '4px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  inputRelative: {
    position: 'relative'
  },
  input: {
    paddingLeft: '42px',
    height: '48px',
    borderRadius: '12px'
  },
  inputPassword: {
    paddingLeft: '42px',
    paddingRight: '42px',
    height: '48px',
    borderRadius: '12px'
  },
  iconLeft: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-light)',
    fontSize: '1.2rem',
    pointerEvents: 'none'
  },
  togglePassword: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-light)',
    display: 'flex',
    padding: 0
  },
  toggleIcon: {
    fontSize: '1.2rem'
  },
  btnSubmit: {
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
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center'
  },
  footerBanner: {
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
  },
  footerIcon: {
    fontSize: '1.1rem',
    color: 'var(--color-primary)',
    marginTop: '1px',
    flexShrink: 0
  }
};

export default function Login() {
  const { loading, iniciarSesion } = useAuth();

  // Usamos 'usuario' para coincidir con la columna UNIQUE de la base de datos
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación preventiva
    if (!usuario.trim() || !password.trim()) return;

    // Intentamos iniciar sesión.
    // El Context actualiza 'usuario' globalmente — AdminPage re-renderiza
    // automáticamente sin necesidad de callback ni reload.
    await iniciarSesion(usuario, password);
  };

  return (
    <div className={styles.fadeIN} style={sx.page}>
      <div className={styles.card} style={sx.card}>

        {/* ── Cabecera ── */}
        <header style={sx.header}>
          <div style={sx.logoWrapper}>
            <span className="material-symbols-outlined" style={sx.logoIcon}>
              restaurant_menu
            </span>
          </div>
          <span className={styles.labelTop} style={sx.labelApp}>
            KIKITCHEN INVENTARIOS
          </span>
          <h1 className={styles.title} style={sx.titulo}>
            Bienvenido
          </h1>
          <p style={sx.subtitulo}>
            Ingresa tus credenciales para continuar
          </p>
        </header>

        {/* ── Formulario ── */}
        <form onSubmit={handleSubmit} style={sx.form}>

          {/* Campo de ID de Usuario */}
          <div style={sx.fieldWrapper}>
            <label className={styles.labelTop} style={{ fontSize: '0.65rem' }}>
              IDENTIFICADOR DE USUARIO
            </label>
            <div style={sx.inputRelative}>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className={styles.inputEditorial}
                placeholder="Usuario"
                required
                autoComplete="username"
                style={sx.input}
              />
              <span className="material-symbols-outlined" style={sx.iconLeft}>
                person
              </span>
            </div>
          </div>

          {/* Campo de Contraseña */}
          <div style={sx.fieldWrapper}>
            <label className={styles.labelTop} style={{ fontSize: '0.65rem' }}>
              CONTRASEÑA
            </label>
            <div style={sx.inputRelative}>
              <input
                type={verPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.inputEditorial}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={sx.inputPassword}
              />
              <span className="material-symbols-outlined" style={sx.iconLeft}>
                lock
              </span>

              {/* Toggle de visibilidad de contraseña */}
              <button
                type="button"
                onClick={() => setVerPassword(!verPassword)}
                style={sx.togglePassword}
              >
                <span className="material-symbols-outlined" style={sx.toggleIcon}>
                  {verPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Botón de Ingresar */}
          <button
            type="submit"
            disabled={loading}
            className={styles.btnPrimary}
            style={{ ...sx.btnSubmit, cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{ animation: 'spin 1.5s linear infinite', fontSize: '1.25rem' }}
                >
                  sync
                </span>
                <span>AUTENTICANDO...</span>
              </>
            ) : (
              <>
                <span>Ingresar</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                  login
                </span>
              </>
            )}
          </button>

        </form>

        {/* ── Pie de página ── */}
        <footer style={sx.footer}>
          <div style={sx.footerBanner}>
            <span className="material-symbols-outlined" style={sx.footerIcon}>info</span>
            <span>
              Acceso restringido. El uso no autorizado de este sistema está monitoreado
              y sujeto a políticas internas.
            </span>
          </div>
        </footer>

      </div>
    </div>
  );
}