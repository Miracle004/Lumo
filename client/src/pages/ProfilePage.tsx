import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toastService } from '../services/toastService';
import './Auth.css'; 

const ProfilePage: React.FC = () => {
  const { user, logout, login } = useAuth(); // Destructure login from useAuth
  const navigate = useNavigate();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || '');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setBioText(user.bio || ''); // Initialize bioText when user loads
    }
  }, [user, navigate]);

  const handleSaveBio = async () => {
    try {
      const response = await axios.put('/user/profile', { bio: bioText });
      // Assuming the API returns the updated user object
      login(response.data.user); // Update the user in AuthContext
      setIsEditingBio(false);
      toastService.success('Bio updated successfully!');
    } catch (error) {
      console.error('Failed to update bio:', error);
      toastService.error('Failed to update bio.');
    }
  };

  const handleCancelEdit = () => {
    setBioText(user?.bio || ''); // Revert to original bio
    setIsEditingBio(false);
  };

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

        <div className="form-group" style={{ textAlign: 'left' }}>
            <h3>Bio</h3>
            {isEditingBio ? (
                <>
                    <textarea
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        rows={5}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', marginBottom: '0.5rem', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        placeholder="Tell us about yourself..."
                    ></textarea>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={handleCancelEdit} className="btn btn-secondary">Cancel</button>
                        <button onClick={handleSaveBio} className="btn btn-primary">Save</button>
                    </div>
                </>
            ) : (
                <>
                    <p>{user.bio || 'No bio yet.'}</p>
                    <button onClick={() => setIsEditingBio(true)} className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
                        Edit Bio
                    </button>
                </>
            )}
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
