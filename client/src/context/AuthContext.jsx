import { createContext, useState, useEffect } from 'react';
import { userAPI, authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount via httpOnly cookie → /users/profile
  useEffect(() => {
    userAPI.getProfile()
      .then(({ data }) => setUser(data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Listen for forced logout dispatched by the axios refresh interceptor
  useEffect(() => {
    const handleForcedLogout = () => setUser(null);
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  /** Called after login / email verify — token already in cookie */
  const login = (userData) => setUser(userData);

  const logout = async () => {
    try { await authAPI.logout(); } catch (_) {}
    setUser(null);
  };

  const logoutAll = async () => {
    try { await authAPI.logoutAll(); } catch (_) {}
    setUser(null);
  };

  const updateUser = (userData) => setUser(userData);

  return (
    <AuthContext.Provider value={{ user, login, logout, logoutAll, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
