import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, setToken as setLocalToken, removeToken, getMe, login as apiLogin, register as apiRegister } from '../utils/api';
import { getPublicPortalUrl } from '../utils/constants';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      if (!user) {
        refreshUser();
      } else {
        setLoading(false);
      }
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const refreshUser = async () => {
    try {
      const res = await getMe();
      if (res && (res.user || res.id)) {
        setUser(res.user || res);
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
      setToken(null);
      setUser(null);
      removeToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrCreds, password) => {
    const data = await apiLogin(emailOrCreds, password);
    const authToken = data.token;
    const authUser = data.user || data;
    setLocalToken(authToken);
    setToken(authToken);
    setUser(authUser);
    setLoading(false);
    return data;
  };

  const register = async (userData) => {
    const data = await apiRegister(userData);
    const authToken = data.token;
    const authUser = data.user || data;
    setLocalToken(authToken);
    setToken(authToken);
    setUser(authUser);
    setLoading(false);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    removeToken();
    window.location.href = getPublicPortalUrl();
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
