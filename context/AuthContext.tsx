import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Organization } from '../types';
import * as api from '../services/api';
import { supabase } from '../services/supabaseClient';

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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const authenticatedUser = await api.getAuthenticatedUser();
          setUser(authenticatedUser as AuthUser);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const loggedInUser = await api.login(email, password);
      setUser(loggedInUser as AuthUser);
      return loggedInUser as AuthUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const registerNgo = async (ngoData: Omit<Organization, 'id' | 'created_at' | 'type' | 'status' | 'password' | 'owner_user_id'>, password: string) => {
    try {
      const newOrg = await api.registerNgo(ngoData, password);
      // Don't automatically log in after registration
      return newOrg;
    } catch (error) {
      console.error('Register NGO error:', error);
      throw error;
    }
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