import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Bookmark, Leaf, Sun, Moon, X } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Layout.css';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Link, Outlet, useNavigate } from 'react-router-dom';

const Layout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { count: notificationCount } = useNotification();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const toggleSearch = () => {
      setIsSearchOpen(!isSearchOpen);
      if (!isSearchOpen) {
          setTimeout(() => inputRef.current?.focus(), 100);
      }
  };

  const handleSearch = () => {
      if (searchQuery.trim()) {
          navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
          setIsSearchOpen(false);
          setSearchQuery('');
      }
  };

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
              setIsSearchOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="layout-container">
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            <Leaf className="brand-icon" size={24} />
            <span>Lumo</span>
          </Link>
        </div>
        
        <div className="navbar-right">
          <div className={`search-bar-container ${isSearchOpen ? 'active' : ''}`} ref={searchRef}>
              <input 
                 ref={inputRef}
                 className="search-input" 
                 type="text" 
                 placeholder="Search stories..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="nav-icon-btn" onClick={toggleSearch} aria-label="Search">
                {isSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>
          </div>
          
          {isAuthenticated && (
            <Link to="/write" className="nav-icon-btn" aria-label="Write">
              <span className="nav-text-link">Write</span>
            </Link>
          )}

          {isAuthenticated && (
            <Link to="/dashboard" className="nav-icon-btn" aria-label="Dashboard">
              <span className="nav-text-link">Dashboard</span>
            </Link>
          )}
          
          {isAuthenticated && ( // Notifications link
            <Link to="/notifications" className="nav-icon-btn" aria-label="Notifications" style={{ position: 'relative' }}>
              <Bell size={20} />
              {notificationCount > 0 && (
                  <span className="notification-badge" style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      backgroundColor: 'red',
                      color: 'white',
                      borderRadius: '50%',
                      padding: '2px 5px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                  }}>{notificationCount}</span>
              )}
            </Link>
          )}

          {/* Bookmarks should still link to drafts page for saved items */}
          <Link to="/drafts" className="nav-icon-btn" aria-label="Bookmarks">
            <Bookmark size={20} />
          </Link>
          
          <button onClick={toggleTheme} className="nav-icon-btn theme-toggle" aria-label="Toggle theme">
             {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated ? (
            <Link to="/profile" className="profile-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
              <img 
                src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} 
                alt="Profile" 
                className="profile-avatar"
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span className="nav-username" style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.username}</span>
            </Link>
          ) : (
             <Link to="/login" className="nav-text-link login-link">
               Sign In
             </Link>
          )}
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
};

export default Layout;