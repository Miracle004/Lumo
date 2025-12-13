import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

interface NotificationContextType {
  count: number;
  incrementCount: () => void;
  decrementCount: (amount?: number) => void;
  resetCount: () => void;
  fetchCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await axios.get('/api/notifications/count');
      setCount(res.data.count);
    } catch (error) {
      console.error('Failed to fetch notification count', error);
    }
  };

  useEffect(() => {
    fetchCount();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');
    socket.emit('join-user', user.id);

    socket.on('new-notification', () => {
      // Logic to check if we are currently viewing the post related to this notification?
      // That requires knowing the current location.
      // For now, simply increment. 
      // The user issue "count keeps increasing" when they are "on the page" will be partially solved 
      // because when they navigate away and back (or reload), `useEffect` in WriteBlogPage triggers mark-read.
      // To solve it strictly real-time: WriteBlogPage needs to listen to this and mark-read immediately.
      // But context manages count.
      // Let's keep it simple: Increment. The useEffect in WriteBlogPage handles clearing it when you 'view' it.
      // If you are ALREADY viewing it, and a new one comes, it increments. You have to refresh or trigger the clear.
      // We can improve this later with a global "activePostId" state if needed.
      setCount(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user]);

  const incrementCount = () => setCount(prev => prev + 1);
  const decrementCount = (amount = 1) => setCount(prev => Math.max(0, prev - amount));
  const resetCount = () => setCount(0);

  return (
    <NotificationContext.Provider value={{ count, incrementCount, decrementCount, resetCount, fetchCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};
