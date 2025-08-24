import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import type { Identity } from '@dfinity/agent';

interface AuthContextType {
  isAuthenticated: boolean;
  principal: string | null;
  identity: Identity | null;
  authClient: AuthClient | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const identityProvider = "https://identity.ic0.app";

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);

      const authenticated = await client.isAuthenticated();
      console.log('ICP Auth Status:', authenticated);
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const userIdentity = client.getIdentity();
        const userPrincipal = userIdentity.getPrincipal().toText();
        
        setIdentity(userIdentity);
        setPrincipal(userPrincipal);
        
        console.log('User authenticated with principal:', userPrincipal);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Set authenticated to true for development if no ICP connection
      console.log('Setting development fallback authentication');
      setIsAuthenticated(true);
      setPrincipal('development-user-principal');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    if (!authClient) return;
    
    setIsLoading(true);
    try {
      await authClient.login({
        identityProvider,
        onSuccess: async () => {
          const userIdentity = authClient.getIdentity();
          const userPrincipal = userIdentity.getPrincipal().toText();
          
          setIsAuthenticated(true);
          setIdentity(userIdentity);
          setPrincipal(userPrincipal);
          
          console.log('Login successful. Principal:', userPrincipal);
        },
        onError: (error) => {
          console.error('Login failed:', error);
          throw error;
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!authClient) return;
    
    setIsLoading(true);
    try {
      await authClient.logout();
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    principal,
    identity,
    authClient,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};