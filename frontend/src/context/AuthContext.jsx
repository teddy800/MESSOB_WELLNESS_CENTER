import { createContext, useCallback, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('mesob_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Fetch full profile from /users/me and store it
  const fetchAndStoreProfile = useCallback(async () => {
    const res = await api.get('/api/v1/users/me');
    const userData = res.data.data;
    localStorage.setItem('mesob_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const login = useCallback(async (email, password) => {
    // Step 1: authenticate and get token
    const res = await api.post('/api/v1/auth/login', { email, password });
    const { token, user: basicUser } = res.data.data;
    localStorage.setItem('mesob_token', token);
    // Step 2: fetch full profile (includes centerId, phone, gender, etc.)
    try {
      const fullUser = await fetchAndStoreProfile();
      return fullUser;
    } catch {
      // Fallback to basic user if profile fetch fails
      localStorage.setItem('mesob_user', JSON.stringify(basicUser));
      setUser(basicUser);
      return basicUser;
    }
  }, [fetchAndStoreProfile]);

  const logout = useCallback(async () => {
    try { await api.post('/api/v1/auth/logout'); } catch {}
    localStorage.removeItem('mesob_token');
    localStorage.removeItem('mesob_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      await fetchAndStoreProfile();
    } catch {}
  }, [fetchAndStoreProfile]);

  // Role helpers
  const hasRole = useCallback((...roles) => roles.includes(user?.role), [user]);
  const isNurseOrAbove = useCallback(() =>
    ['NURSE_OFFICER', 'MANAGER', 'REGIONAL_OFFICE', 'FEDERAL_ADMIN'].includes(user?.role), [user]);
  const isManagerOrAbove = useCallback(() =>
    ['MANAGER', 'REGIONAL_OFFICE', 'FEDERAL_ADMIN'].includes(user?.role), [user]);
  const isRegionalOrAbove = useCallback(() =>
    ['REGIONAL_OFFICE', 'FEDERAL_ADMIN'].includes(user?.role), [user]);
  const isFederalAdmin = useCallback(() => user?.role === 'FEDERAL_ADMIN', [user]);

  return (
    <AuthContext.Provider value={{
      user, login, logout, refreshUser,
      hasRole, isNurseOrAbove, isManagerOrAbove, isRegionalOrAbove, isFederalAdmin,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
