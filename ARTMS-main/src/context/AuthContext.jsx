import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => authService.getStoredUser());
  const [loading, setLoading] = useState(true);

  // On mount, verify the stored token is still valid
  useEffect(() => {
    const token = localStorage.getItem('artms_token');
    if (token) {
      authService
        .me()
        .then((freshUser) => {
          setUser(freshUser);
          try {
            const storageUser = { ...freshUser };
            if (typeof storageUser.avatar === 'string' && storageUser.avatar.startsWith('data:image/')) {
              delete storageUser.avatar;
            }
            localStorage.setItem('artms_user', JSON.stringify(storageUser));
          } catch (e) {
            console.warn('Failed to save user to localStorage:', e);
          }
        })
        .catch(() => {
          // Token is invalid/expired — clear storage
          localStorage.removeItem('artms_token');
          localStorage.removeItem('artms_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: loggedInUser } = await authService.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const next = typeof updatedData === 'function' ? updatedData(prev) : { ...prev, ...updatedData };
      if (next) {
        try {
          const storageUser = { ...next };
          if (typeof storageUser.avatar === 'string' && storageUser.avatar.startsWith('data:image/')) {
            delete storageUser.avatar;
          }
          localStorage.setItem('artms_user', JSON.stringify(storageUser));
        } catch (err) {
          console.warn('Failed to save user to localStorage:', err);
        }
      }
      return next;
    });
  }, []);

  const isAuthenticated = !!user;
  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated, role }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
