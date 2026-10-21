// Variables de entorno de Vite, leídas en un solo lugar
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  // La API envía los montos como número, sin moneda: la UI los muestra en esta
  currency: import.meta.env.VITE_CURRENCY || 'USD',
};
