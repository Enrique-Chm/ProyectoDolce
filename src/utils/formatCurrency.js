/**
 * Utility para formatear valores numéricos a moneda.
 * Utiliza los ajustes dinámicos de la Tabla 28 (configuracion_sistema).
 * * @param {number|string} value - El monto numérico a formatear.
 * @param {Object} settings - El objeto de configuración obtenido del hook useSettings.
 * @returns {string} El valor formateado (ej: "$150.00" o "€150.00").
 */
export const formatCurrency = (value, settings) => {
  // 1. Extraer el símbolo de la configuración o usar '$' por defecto
  const symbol = settings?.moneda_simbolo || '$';

  // 2. Asegurar que el valor sea un número válido
  const amount = parseFloat(value);

  // 3. Si el valor no es un número, retornar el símbolo con "0.00"
  if (isNaN(amount)) {
    return `${symbol}0.00`;
  }

  // 4. Formatear con dos decimales y concatenar el símbolo
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};