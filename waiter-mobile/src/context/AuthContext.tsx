import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { getToken, getStoredUser, setAuth as saveAuth, clearAuth, getApiBaseUrl, setApiBaseUrl } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  baseUrl: string;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateBaseUrl: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser<User>());
  const [token, setToken] = useState<string | null>(() => getToken());
  const [baseUrl, setBaseUrl] = useState<string>(() => getApiBaseUrl());

  const login = (newToken: string, newUser: User) => {
    saveAuth(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  const updateBaseUrl = (newUrl: string) => {
    setApiBaseUrl(newUrl);
    setBaseUrl(getApiBaseUrl());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        baseUrl,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        updateBaseUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
