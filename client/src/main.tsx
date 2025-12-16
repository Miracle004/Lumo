import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, useLocation } from 'react-router-dom'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext' // Import NotificationProvider
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import ReadBlogPage from './pages/ReadBlogPage'
import WriteBlogPage from './pages/WriteBlogPage'
import DraftsPage from './pages/DraftsPage'
import MyPublishedPage from './pages/MyPublishedPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import NotFoundPage from './pages/NotFoundPage'
import axios from 'axios'
import NotificationsPage from './pages/NotificationsPage';
import SearchPage from './pages/SearchPage';
import PublicProfilePage from './pages/PublicProfilePage';

axios.defaults.withCredentials = true;

// Configure Axios base URL for separate frontend/backend hosting
// Use VITE_API_BASE_URL environment variable if available (e.g., in production)
// Otherwise, fall back to relative paths (for local development with Vite proxy)
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';

const GoogleCallback = () => {
  const location = useLocation();
  React.useEffect(() => {
    // Forward the redirect to the backend server to complete the OAuth flow.
    // We use window.location.href to break out of the React Router SPA context
    // and force a request to the backend server.
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    window.location.href = `${apiUrl}/auth/google/callback${location.search}`;
  }, [location]);

  return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>Verifying...</div>;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'author/:id',
        element: <PublicProfilePage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'auth/google/callback',
        element: <GoogleCallback />,
      },
      {
        path: 'read/:id',
        element: <ReadBlogPage />,
      },
      {
        path: 'write',
        element: <WriteBlogPage />,
      },
      {
        path: 'write/:id',
        element: <WriteBlogPage />,
      },
      {
        path: 'drafts',
        element: <DraftsPage />,
      },
      {
        path: 'my-stories',
        element: <MyPublishedPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: '404',
        element: <NotFoundPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>,
)
