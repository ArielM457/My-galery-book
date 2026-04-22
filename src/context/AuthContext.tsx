/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { APP_API_URL } from '../config';

const AUTH_TOKEN_KEY = 'unilibrary-auth-token';
const AUTH_USER_KEY = 'unilibrary-auth-user';

interface AuthContextValue {
  token: string | null;
  username: string | null;
  isCheckingAuth: boolean;
  login: (token: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(AUTH_TOKEN_KEY)
  );
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem(AUTH_USER_KEY)
  );
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(() => Boolean(localStorage.getItem(AUTH_TOKEN_KEY)));

  useEffect(() => {
    const persistedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!persistedToken) {
      setIsCheckingAuth(false);
      return;
    }

    let cancelled = false;
    setIsCheckingAuth(true);

    fetch(`${APP_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${persistedToken}`,
        'X-Auth-Token': persistedToken,
      },
    })
      .then(response => {
        if (cancelled) {
          return;
        }
        if (!response.ok) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
          setToken(null);
          setUsername(null);
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        setToken(null);
        setUsername(null);
      })
      .finally(() => {
        if (!cancelled) {
          setIsCheckingAuth(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function login(newToken: string, newUsername: string) {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    localStorage.setItem(AUTH_USER_KEY, newUsername);
    setToken(newToken);
    setUsername(newUsername);
  }

  function logout() {
    if (token) {
      fetch(`${APP_API_URL}/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Auth-Token': token,
        },
      }).catch(() => {});
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUsername(null);
    setIsCheckingAuth(false);
  }

  const contextValue = useMemo<AuthContextValue>(() => ({
    token,
    username,
    isCheckingAuth,
    login,
    logout,
  }), [token, username, isCheckingAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
