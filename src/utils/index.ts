export const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

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
