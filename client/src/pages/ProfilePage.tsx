import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toastService } from '../services/toastService';
import { uploadImage } from '../services/uploadService';
import { Camera, LogOut } from 'lucide-react';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatar || '');
      
      axios.get(`/user/${user.id}/follow-counts`)
           .then(res => setStats(res.data))
           .catch(console.error);
    }
  }, [user, isAuthenticated, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const url = await uploadImage(file);
          setAvatarUrl(url); // Preview update
      } catch (error) {
          console.error('Failed to upload avatar:', error);
          toastService.error('Failed to upload image.');
      }
  };

  const handleSave = async () => {
      if (!username.trim()) {
          toastService.error('Username cannot be empty.');
          return;
      }
      
      setIsSaving(true);
      try {
          const response = await axios.put('/user/profile', {
              username,
              bio,
              profile_picture: avatarUrl
          });
          
          const updatedUser = response.data.user;
          // Ensure avatar is mapped correctly for context
          const userForContext = {
              ...user!,
              ...updatedUser,
              avatar: updatedUser.profile_picture || updatedUser.avatar || user?.avatar
          };
          
          login(userForContext); // Update context
          toastService.success('Profile updated successfully!');
      } catch (err: any) {
          console.error('Failed to update profile:', err);
          toastService.error(err.response?.data?.error || 'Failed to update profile.');
      } finally {
          setIsSaving(false);
      }
  };

  if (!user) return <div>Loading profile...</div>;

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>Profile Settings</h1>
      </header>

      <div className="profile-content">
          <div className="avatar-section">
              <div className="avatar-wrapper">
                  <img 
                    src={avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} 
                    alt="Profile" 
                    className="profile-avatar" 
                  />
                  <label htmlFor="avatar-upload" className="avatar-upload-label" title="Change Profile Picture">
                      <Camera size={18} />
                  </label>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarUpload} 
                    style={{ display: 'none' }} 
                    accept="image/*"
                  />
              </div>
              <div className="avatar-info">
                  <h3>{user.username}</h3>
                  <div className="profile-stats" style={{display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                      <span><strong style={{color: 'var(--text-primary)'}}>{stats.followers}</strong> Followers</span>
                      <span><strong style={{color: 'var(--text-primary)'}}>{stats.following}</strong> Following</span>
                  </div>
              </div>
          </div>

          <div className="profile-form">
              <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input 
                    id="username" 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                  />
              </div>

              <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input 
                    id="email" 
                    type="email" 
                    value={user.email} 
                    disabled 
                    title="Email cannot be changed."
                  />
              </div>

              <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea 
                    id="bio" 
                    rows={4} 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    placeholder="Tell your story..."
                  />
              </div>

              <div className="profile-actions">
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSave} 
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
              </div>
          </div>
      </div>

      <div className="logout-section">
          <button onClick={logout} className="btn-logout">
              <LogOut size={16} style={{display: 'inline', marginRight: '8px'}} />
              Sign Out
          </button>
      </div>
    </div>
  );
};

export default ProfilePage;