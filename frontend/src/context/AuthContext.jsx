import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('joineazy_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCurrentUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        setUser(res.data.user);
      } catch (err) {
        console.error('Failed to restore session:', err);
        localStorage.removeItem('joineazy_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('joineazy_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (name, email, password) => {
    const res = await api.register({ name, email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('joineazy_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('joineazy_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
