export const env = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  VITE_MAX_UPLOAD_MB: Number(import.meta.env.VITE_MAX_UPLOAD_MB) || 50,
  VITE_ENABLE_MOCKS: import.meta.env.VITE_ENABLE_MOCKS === 'true',
};
