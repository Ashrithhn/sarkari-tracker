import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, setToken as setLocalToken, removeToken, getMe, login as apiLogin, register as apiRegister } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const refreshUser = async () => {
    try {
      const res = await getMe();
      setUser(res.user || res);
    } catch (error) {
      console.error('Failed to fetch user', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrCreds, password) => {
    const data = await apiLogin(emailOrCreds, password);
    setToken(data.token);
    setLocalToken(data.token);
    setUser(data.user || data);
    return data;
  };

  const register = async (userData) => {
    const data = await apiRegister(userData);
    setToken(data.token);
    setLocalToken(data.token);
    setUser(data.user || data);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    removeToken();
    window.location.href = 'http://localhost:3000';
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
