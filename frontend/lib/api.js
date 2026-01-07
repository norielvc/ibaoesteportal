// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';
export const API_URL = API_BASE;

export const getApiUrl = (endpoint) => {
  return `${API_BASE}${endpoint}`;
};

// Helper for API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const response = await fetch(url, options);
  return response;
};
