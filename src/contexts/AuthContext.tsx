import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { User } from '../types/user';
import { userService } from '../services/user';
import { setSessionExpiredCallback } from '../services/api';
import { storage } from '../services/storage';

export type AppMode = 'passenger' | 'driver';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mode: AppMode;
  setMode: (mode: AppMode) => Promise<void>;
  pendingVehicleSetup: boolean;
  setPendingVehicleSetup: (value: boolean) => void;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

const MODE_KEY = 'activeMode';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setModeState] = useState<AppMode>('passenger');
  const [pendingVehicleSetup, setPendingVehicleSetup] = useState(false);

  const setMode = useCallback(async (next: AppMode) => {
    setModeState(next);
    await storage.setItem(MODE_KEY, next);
  }, []);

  const logout = useCallback(async () => {
    await storage.removeItem('accessToken');
    await storage.removeItem('refreshToken');
    await storage.removeItem(MODE_KEY);
    setModeState('passenger');
    setPendingVehicleSetup(false);
    setUser(null);
  }, []);

  useEffect(() => {
    setSessionExpiredCallback(logout);
  }, [logout]);

  useEffect(() => {
    const restore = async () => {
      try {
        const token = await storage.getItem('accessToken');
        if (token) {
          const me = await userService.getMe();
          setUser(me);
          const savedMode = await storage.getItem(MODE_KEY);
          if (savedMode === 'driver' || savedMode === 'passenger') setModeState(savedMode);
        }
      } catch {
        await logout();
      } finally {
        setIsLoading(false);
      }
    };
    void restore();
  }, [logout]);

  const login = async (accessToken: string, refreshToken: string, userData: User) => {
    await storage.setItem('accessToken', accessToken);
    await storage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  const refreshUser = useCallback(async () => {
    const me = await userService.getMe();
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        mode,
        setMode,
        pendingVehicleSetup,
        setPendingVehicleSetup,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
