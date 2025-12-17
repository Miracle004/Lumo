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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
          setIsMobileMenuOpen(false); // Close mobile menu after search
      }
  };

  const closeMobileMenu = () => {
      setIsMobileMenuOpen(false);
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

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth > 500) {
              setIsMobileMenuOpen(false);
          }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="layout-container">
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
            <Leaf className="brand-icon" size={24} />
            <span>Lumo</span>
          </Link>
        </div>
        
        {/* Hamburger button - only visible on mobile */}
        <button 
          className={`hamburger-btn ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-right ${isMobileMenuOpen ? 'open' : ''}`}>
          {/* Desktop navigation items */}
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
            <Link to="/write" className="nav-icon-btn" aria-label="Write" onClick={closeMobileMenu}>
              <span className="nav-text-link">Write</span>
            </Link>
          )}

          {isAuthenticated && (
            <Link to="/dashboard" className="nav-icon-btn" aria-label="Dashboard" onClick={closeMobileMenu}>
              <span className="nav-text-link">Dashboard</span>
            </Link>
          )}
          
          {isAuthenticated && (
            <Link to="/notifications" className="nav-icon-btn" aria-label="Notifications" style={{ position: 'relative' }} onClick={closeMobileMenu}>
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

          <Link to="/drafts" className="nav-icon-btn" aria-label="Bookmarks" onClick={closeMobileMenu}>
            <Bookmark size={20} />
          </Link>
          
          <button onClick={toggleTheme} className="nav-icon-btn theme-toggle" aria-label="Toggle theme">
             {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated ? (
            /* FIX: Removed inline styles here so CSS can hide it on mobile */
            <Link to="/profile" className="profile-link" onClick={closeMobileMenu}>
              <img 
                src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} 
                alt="Profile" 
                className="profile-avatar"
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span className="nav-username">{user?.username}</span>
            </Link>
          ) : (
             <Link to="/login" className="nav-text-link login-link" onClick={closeMobileMenu}>
               Sign In
             </Link>
          )}

          {/* Mobile menu structure */}
          <div className="mobile-menu-icons">
            <div className={`search-bar-container ${isSearchOpen ? 'active' : ''}`}>
              <input 
                 className="search-input" 
                 type="text" 
                 placeholder="Search..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="nav-icon-btn" onClick={toggleSearch} aria-label="Search">
                {isSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>
            </div>

            {isAuthenticated && (
              <Link to="/notifications" className="nav-icon-btn" aria-label="Notifications" style={{ position: 'relative' }} onClick={closeMobileMenu}>
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

            <Link to="/drafts" className="nav-icon-btn" aria-label="Bookmarks" onClick={closeMobileMenu}>
              <Bookmark size={20} />
            </Link>
            
            <button onClick={toggleTheme} className="nav-icon-btn theme-toggle" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <div className="mobile-menu-links">
            {isAuthenticated && (
              <>
                <Link to="/write" className="mobile-menu-link" onClick={closeMobileMenu}>
                  Write
                </Link>

                <Link to="/dashboard" className="mobile-menu-link" onClick={closeMobileMenu}>
                  Dashboard
                </Link>

                <Link to="/profile" className="mobile-menu-link" onClick={closeMobileMenu}>
                  <img 
                    src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} 
                    alt="Profile" 
                    className="profile-avatar"
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginRight: '0.75rem' }}
                  />
                  <span>{user?.username}</span>
                </Link>
              </>
            )}

            {!isAuthenticated && (
              <Link to="/login" className="mobile-menu-link" onClick={closeMobileMenu}>
                Sign In
              </Link>
            )}
          </div>
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