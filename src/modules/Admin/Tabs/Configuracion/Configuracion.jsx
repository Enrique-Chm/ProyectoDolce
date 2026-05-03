// src/modules/Admin/Tabs/Configuracion/Configuracion.jsx
import React, { useEffect } from 'react';
import styles from '../../../../assets/styles/EstilosGenerales.module.css';
import { useConfiguracion } from './2useConfiguracion';

export default function Configuracion({ 
  onAbrirProductos, 
  onAbrirProveedores, 
  onAbrirTrabajadores,
  onAbrirSucursales,
  onAbrirRoles, 
  onAbrirCategorias, // <-- Nueva prop para gestionar categorías
  onLogout      
}) {
  // Extraemos la lógica y el estado de nuestro Custom Hook actualizado
  const { 
    loading, 
    sucursales, 
    proveedores, 
    trabajadores, 
    roles, 
    categorias, // <-- Nuevo estado para categorías
    cargarSucursales, 
    cargarProveedores, 
    cargarTrabajadores,
    cargarRoles,
    cargarCategorias // <-- Nuevo método para cargar categorías
  } = useConfiguracion();

  // Cargamos todos los catálogos al montar la pantalla para mostrar métricas reales
  useEffect(() => {
    cargarSucursales();
    cargarProveedores();
    cargarTrabajadores();
    cargarRoles(); 
    cargarCategorias(); // Sincronizamos las categorías también
  }, [cargarSucursales, cargarProveedores, cargarTrabajadores, cargarRoles, cargarCategorias]);

  return (
    <div className={styles.fadeIN}>
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: 'var(--space-lg)' }}>
        <span className={styles.labelTop} style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>
          AJUSTES DEL SISTEMA
        </span>
        <h1 className={styles.title}>Configuración</h1>
      </header>

      {/* --- TARJETA: PERFIL DEL NEGOCIO --- */}
      <section className={styles.card} style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }}>storefront</span>
          <h2 className={styles.subtitle} style={{ fontSize: '1.25rem' }}>Perfil del Negocio</h2>
        </div>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
          {loading 
            ? `Gestionando sucursal(es) activa(s) en el sistema.`
            : `Gestionando ${sucursales.length} sucursal(es) activa(s) en el sistema.`
          }
        </p>

        <button 
          onClick={onAbrirSucursales}
          className={`${styles.btnBase} ${styles.btnSecondary}`} 
          style={{ width: 'fit-content' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>location_on</span>
          Gestionar Sucursales
        </button>
      </section>

      {/* --- TARJETA: CATÁLOGOS BASE --- */}
      <section className={styles.card} style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--text-main)', fontSize: '1.5rem' }}>folder_managed</span>
          <h2 className={styles.subtitle} style={{ fontSize: '1.25rem' }}>Catálogos del Sistema</h2>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
          {loading 
            ? `Tienes ${proveedores.length} proveedores registrados, categorías de insumos y un catálogo de productos listo para operar.`
            : `Tienes ${proveedores.length} proveedores registrados, ${categorias.length} categorías de insumos y un catálogo de productos listo para operar.`
          }
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* BOTÓN: PRODUCTOS */}
          <button onClick={onAbrirProductos} className={`${styles.btnBase} ${styles.btnPrimary}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>inventory</span>
            Productos
          </button>
          
          {/* BOTÓN: PROVEEDORES */}
          <button onClick={onAbrirProveedores} className={`${styles.btnBase} ${styles.btnOutlined}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>local_shipping</span>
            Proveedores
          </button>

          {/* BOTÓN: CATEGORÍAS */}
          <button onClick={onAbrirCategorias} className={`${styles.btnBase} ${styles.btnSecondary}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>category</span>
            Categorías
          </button>
        </div>
      </section>

      {/* --- TARJETA: SEGURIDAD Y PERSONAL --- */}
      <section className={styles.card} style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }}>shield_person</span>
          <h2 className={styles.subtitle} style={{ fontSize: '1.25rem' }}>Personal y Seguridad</h2>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
          {loading 
            ? `Contamos con ${trabajadores.length} trabajadores distribuidos en niveles de acceso (roles).`
            : `Contamos con ${trabajadores.length} trabajadores distribuidos en ${roles.length} niveles de acceso (roles).`
          }
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* BOTÓN: TRABAJADORES */}
          <button onClick={onAbrirTrabajadores} className={`${styles.btnBase} ${styles.btnPrimary}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>badge</span>
            Trabajadores
          </button>

          {/* BOTÓN: ROLES */}
          <button onClick={onAbrirRoles} className={`${styles.btnBase} ${styles.btnSecondary}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>admin_panel_settings</span>
            Roles y Permisos
          </button>
        </div>
      </section>

      {/* --- TARJETA: CUENTA --- */}
      <section className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: '#ba1a1a', fontSize: '1.5rem' }}>logout</span>
          <h2 className={styles.subtitle} style={{ fontSize: '1.25rem' }}>Sesión</h2>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
          Finaliza tu sesión actual para salir del panel administrativo de forma segura.
        </p>

        <button 
          onClick={onLogout} 
          className={`${styles.btnBase} ${styles.btnDanger}`} 
          style={{ width: 'fit-content' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>power_settings_new</span>
          Cerrar Sesión
        </button>
      </section>
    </div>
  );
}