import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import './Auth.css'; 

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <div className="auth-header">
          <img 
            src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} 
            alt="Profile" 
            style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '1rem' }}
          />
          <h1>{user.username}</h1>
          <p>{user.email}</p>
        </div>

        <div className="form-group">
            <h3>Bio</h3>
            <p>No bio yet.</p>
        </div>

        {/* New Link to My Stories */}
        <Link to="/my-stories" className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            View My Stories
        </Link>

        <button onClick={logout} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
