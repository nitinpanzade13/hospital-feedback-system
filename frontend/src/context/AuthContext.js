import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import apiClient from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await apiClient.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(response.data);
    } catch (error) {
      Cookies.remove('authToken');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await apiClient.post('/api/auth/login', { email, password });
    const { access_token, user } = response.data;
    
    Cookies.set('authToken', access_token, { expires: 7 });
    setCurrentUser(user);
    
    return user;
  };

  const confirmEmail = async (token, password) => {
    const response = await apiClient.post('/api/auth/confirm-email', { token, password });
    const { access_token, user } = response.data;
    
    Cookies.set('authToken', access_token, { expires: 7 });
    setCurrentUser(user);
    
    return user;
  };

  const requestPasswordReset = async (email) => {
    return await apiClient.post('/api/auth/forgot-password', { email });
  };

  const resetPassword = async (token, newPassword) => {
    return await apiClient.post('/api/auth/reset-password', { token, new_password: newPassword });
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    Cookies.remove('authToken');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser, 
        loading, 
        login, 
        confirmEmail,
        requestPasswordReset,
        resetPassword,
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
