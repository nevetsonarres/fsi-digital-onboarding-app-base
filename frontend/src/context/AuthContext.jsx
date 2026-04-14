import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, setAccessToken } from '../services/api';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // { id, role, fullName }
  const [loading, setLoading] = useState(true);

  // On mount, try to restore session from stored refresh token
  useEffect(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      setLoading(false);
      return;
    }
    api.post('/auth/refresh', { refreshToken })
      .then((data) => {
        setAccessToken(data.accessToken);
        setUser(parseJwt(data.accessToken));
      })
      .catch(() => {
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    const parsed = parseJwt(data.accessToken);
    setUser(parsed);
    return parsed;
  }, []);

  const register = useCallback(async (email, password, fullName) => {
    const data = await api.post('/auth/register', { email, password, fullName });
    setAccessToken(data.accessToken);
    const parsed = parseJwt(data.accessToken);
    setUser(parsed);
    return parsed;
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  const value = { user, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function parseJwt(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}
