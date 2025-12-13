import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Link } from 'react-router-dom';
import { toastService } from '../services/toastService';
import { BellRing, MessageSquare, Mail, Link as LinkIcon } from 'lucide-react';
import './NotificationsPage.css';

interface Notification {
  id: number;
  user_id: number;
  actor_id: number | null;
  post_id: string | null;
  type: 'comment' | 'invite' | 'system';
  message: string;
  is_read: boolean;
  created_at: string;
  actor_name?: string;
  actor_avatar?: string;
  post_title?: string;
}

const NotificationsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { resetCount, fetchCount } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        const response = await axios.get('/api/notifications');
        setNotifications(response.data);
        
        // Mark all notifications as read for this user
        await axios.post('/api/notifications/mark-read', {});
        resetCount(); // Reset global count in context
      } catch (err: any) {
        console.error('Failed to fetch notifications:', err);
        setError('Failed to load notifications.');
        toastService.error(`Failed to load notifications. ${err.message || ''}`);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, resetCount, fetchCount]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'comment':
        return <MessageSquare size={20} className="notification-icon comment-icon" />;
      case 'invite':
        return <Mail size={20} className="notification-icon invite-icon" />;
      case 'system':
      default:
        return <BellRing size={20} className="notification-icon system-icon" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.post_id) {
      if (notification.type === 'invite') {
        // Invites for drafts lead to the write page
        return `/write/${notification.post_id}`;
      } else if (notification.type === 'comment') {
        // Comments on drafts lead to the write page
        return `/write/${notification.post_id}`;
      }
    }
    // Fallback or other types of links
    return '#'; 
  };

  if (!isAuthenticated) {
    return (
      <div className="notifications-page-container">
        <p>Please log in to view your notifications.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="notifications-page-container">
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    // Error is handled by toastService
    return (
      <div className="notifications-page-container">
        <h2>Your Notifications</h2>
        <p>No notifications loaded.</p>
      </div>
    );
  }

  return (
    <div className="notifications-page-container">
      <h2>Your Notifications</h2>
      {notifications.length === 0 ? (
        <p>You have no notifications.</p>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <Link 
              to={getNotificationLink(notification)} 
              key={notification.id} 
              className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
            >
              <div className="notification-icon-wrapper">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                {notification.post_title && (
                    <span className="notification-post-title">
                        <LinkIcon size={14} /> {notification.post_title}
                    </span>
                )}
                <span className="notification-timestamp">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
