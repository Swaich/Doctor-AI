import axios from 'axios';
import { API_BASE_URL, debugApiConfig } from '../config/api';

// Debug API configuration in development
if (process.env.NODE_ENV === 'development') {
  debugApiConfig();
}

const API_URL = API_BASE_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
