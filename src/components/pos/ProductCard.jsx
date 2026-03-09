import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import { formatCurrency } from '../../utils/formatCurrency';
import styles from './ProductCard.module.css';

/**
 * Tarjeta de producto para el POS.
 * @param {Object} product - Datos de la Tabla 9.
 * @param {Function} onSelect - Acción al hacer clic.
 */
const ProductCard = ({ product, onSelect }) => {
  const { settings } = useSettings();

  // Si no está disponible, aplicamos estilo visual de bloqueo
  const cardClass = `${styles.card} ${!product.disponible ? styles.outOfStock : ''}`;

  return (
    <div className={cardClass} onClick={product.disponible ? onSelect : null}>
      {/* Etiqueta de color dinámica según Tabla 30 */}
      <div 
        className={styles.categoryTag} 
        style={{ backgroundColor: product.cat_categorias_menu?.color_etiqueta || 'var(--color-primary)' }} 
      />
      
      <div className={styles.content}>
        {!product.disponible && <span className={styles.badge}>Agotado</span>}
        <h4 className={styles.name}>{product.nombre_producto}</h4>
        <span className={styles.price}>
          {formatCurrency(product.precio_venta, settings)}
        </span>
      </div>
    </div>
  );
};

export default ProductCard;