import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Organization } from '../types';
import * as api from '../services/api';

type AuthUser = (Organization & { type: 'organization' }) | null;

interface AuthContextType {
  user: AuthUser;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  registerNgo: (ngoData: Omit<Organization, 'id' | 'created_at' | 'type' | 'status' | 'password' | 'owner_user_id'>, password: string) => Promise<Organization>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true);
      try {
        const authenticatedUser = await api.getAuthenticatedUser();
        setUser(authenticatedUser as AuthUser);
      } catch (error) {
        console.error("Failed to check user session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const login = async (email: string, password: string) => {
    const loggedInUser = await api.login(email, password);
    setUser(loggedInUser as AuthUser);
    return loggedInUser as AuthUser;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const registerNgo = async (ngoData: Omit<Organization, 'id' | 'created_at' | 'type' | 'status' | 'password' | 'owner_user_id'>, password: string) => {
    return api.registerNgo(ngoData, password);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, registerNgo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};