export const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
export const BASE_API = `${BASE_URL}/api`;

// Helper function to generate weekly data
export const generateWeeklyData = (
  baseValue: number,
  variance: number = 0.2,
) => {
  return Array.from({ length: 52 }, (_, i) => {
    const trend = Math.sin((i / 52) * Math.PI * 2) * variance;
    const random = (Math.random() - 0.5) * variance * 0.5;
    return Math.round(baseValue * (1 + trend + random));
  });
};

// Helper function to get headers with Authorization token
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('jwt_token');
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper function to get auth headers without Content-Type (for FormData)
export const getAuthHeadersNoContentType = (): Record<string, string> => {
  const token = localStorage.getItem('jwt_token');
  return {
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getToken = (): string | null => localStorage.getItem('jwt_token');

export const clearAuthData = () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('manager_id');
};

const decodeJwtPayload = (token: string): Record<string, any> | null => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const isTokenValid = (): boolean => {
  const token = getToken();
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload !== 'object') return false;

  if (typeof payload.exp !== 'number') return true;

  return payload.exp * 1000 > Date.now();
};
