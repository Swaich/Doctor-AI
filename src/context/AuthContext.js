import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    
    // Show location prompt after successful login
    const locationAsked = localStorage.getItem('locationAsked');
    if (!locationAsked && user.role === 'patient') {
      setShowLocationPrompt(true);
    }
    
    return user;
  };

  const loginWithGoogle = async (googleToken) => {
    const response = await api.post('/auth/google', { token: googleToken });
    
    // Check if this is a new user that needs role selection
    if (response.data.needsRoleSelection) {
      return { needsRoleSelection: true, googleUserData: response.data.googleUserData };
    }
    
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    
    // Show location prompt after successful Google login
    const locationAsked = localStorage.getItem('locationAsked');
    if (!locationAsked && user.role === 'patient') {
      setShowLocationPrompt(true);
    }
    
    return user;
  };

  const completeGoogleRegistration = async (googleUserData, role) => {
    const response = await api.post('/auth/google/complete', { 
      googleUserData, 
      role 
    });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    
    // Show location prompt after successful registration
    const locationAsked = localStorage.getItem('locationAsked');
    if (!locationAsked && user.role === 'patient') {
      setShowLocationPrompt(true);
    }
    
    return user;
  };

  const register = async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  };

  const verifyOTP = async (userId, otp) => {
    const response = await api.post('/auth/verify-otp', { userId, otp });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    
    // Show location prompt after verification
    const locationAsked = localStorage.getItem('locationAsked');
    if (!locationAsked && user.role === 'patient') {
      setShowLocationPrompt(true);
    }
    
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const hideLocationPrompt = () => {
    setShowLocationPrompt(false);
    localStorage.setItem('locationAsked', 'true');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      loginWithGoogle,
      completeGoogleRegistration,
      register, 
      verifyOTP, 
      logout, 
      updateUser,
      showLocationPrompt,
      hideLocationPrompt
    }}>
      {children}
    </AuthContext.Provider>
  );
};
