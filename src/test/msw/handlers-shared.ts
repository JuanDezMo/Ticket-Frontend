// Coincide con cualquier origen: /api/<ruta>
export const apiPath = (path: string) => `*/api${path}`;

export const errorBody = (code: string, message = 'Error') => ({ code, message });
