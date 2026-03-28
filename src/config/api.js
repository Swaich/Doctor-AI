// API Configuration
// This file centralizes all API URL configurations to prevent hardcoded URLs

// Get API URL from environment variable with fallback
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Remove /api suffix for socket connections
export const SOCKET_BASE_URL = API_BASE_URL.replace('/api', '');

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    GOOGLE_LOGIN: '/auth/google'
  },
  
  // User endpoints
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile'
  },
  
  // Doctor endpoints
  DOCTORS: {
    LIST: '/doctors',
    PROFILE: (id) => `/doctors/${id}`,
    REGISTER: '/doctors/register',
    SLOTS: '/doctors/slots'
  },
  
  // Consultation endpoints
  CONSULTATIONS: {
    LIST: '/consultations',
    CREATE: '/consultations',
    START: (id) => `/consultations/${id}/start`,
    END: (id) => `/consultations/${id}/end`
  },
  
  // Store search endpoint
  STORES: {
    SEARCH: '/stores/search'
  },
  
  // Credits endpoints
  CREDITS: {
    BALANCE: '/credits/balance',
    ADD: '/credits/add'
  },
  
  // Complaints endpoints
  COMPLAINTS: {
    LIST: '/complaints',
    CREATE: '/complaints',
    UPDATE: (id) => `/complaints/${id}`
  },
  
  // MedBot endpoints
  MEDBOT: {
    CHAT: '/medbot/chat',
    HISTORY: '/medbot/history',
    SUGGESTIONS: '/medbot/suggestions'
  }
};

// Helper function to build full URL
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to build socket URL
export const buildSocketUrl = (namespace = '') => {
  return `${SOCKET_BASE_URL}${namespace}`;
};

// Debug function to log current configuration
export const debugApiConfig = () => {
  console.log('🔧 API Configuration Debug:');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('SOCKET_BASE_URL:', SOCKET_BASE_URL);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
};