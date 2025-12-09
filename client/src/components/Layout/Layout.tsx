import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Search, Bookmark, Leaf, Sun, Moon } from 'lucide-react';
import './Layout.css';

const Layout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();

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
          <button className="nav-icon-btn" aria-label="Search">
            <Search size={20} />
          </button>
          
          {isAuthenticated && (
            <Link to="/write" className="nav-icon-btn" aria-label="Write">
              <span className="nav-text-link">Write</span>
            </Link>
          )}
          
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
    </div>
  );
};

export default Layout;