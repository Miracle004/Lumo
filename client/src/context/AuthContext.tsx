import axios from 'axios';
import React, { createContext, useContext, useState, useEffect } from 'react';

// Ensure cookies are sent with every request
axios.defaults.withCredentials = true;

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('/auth/me');
        if (response.data.isAuthenticated) {
          const userData = response.data.user;
          setUser({
            ...userData,
            avatar: userData.profile_picture || userData.avatar // Handle both cases
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to check auth status:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const login = (userData: User) => {
      setUser(userData);
  };

  const logout = async () => {
      try {
          await axios.get('/auth/logout');
          setUser(null);
      } catch (error) {
          console.error('Logout failed:', error);
      }
  };

  if (loading) {
      return <div>Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
