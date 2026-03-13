// Archivo: src/utils/formatCurrency.js
export const formatCurrency = (value, settings) => {
  const symbol = settings?.moneda_simbolo || '$';
  const amount = parseFloat(value);

  if (isNaN(amount)) {
    return `${symbol}0.00`;
  }

  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};