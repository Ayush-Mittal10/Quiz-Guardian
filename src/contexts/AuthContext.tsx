
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user in local storage
    const storedUser = localStorage.getItem('quiz-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // This is a mock implementation - in a real app, you'd call an API
      // Validate that it's an institute email
      if (!email.endsWith('.edu')) {
        throw new Error('Only institutional email addresses are allowed');
      }

      // Mock response - in a real app, this would come from your backend
      const mockUser: User = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: email.includes('professor') ? 'professor' : 'student',
        createdAt: new Date().toISOString(),
      };

      // Store in localStorage for persistence
      localStorage.setItem('quiz-user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      // Validate that it's an institute email
      if (!email.endsWith('.edu')) {
        throw new Error('Only institutional email addresses are allowed');
      }

      // Mock registration - in a real app, this would call your backend API
      const mockUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      };

      // Store in localStorage for persistence
      localStorage.setItem('quiz-user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('quiz-user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
