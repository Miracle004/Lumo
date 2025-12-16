import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PenTool, FileText, User, BookOpen } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../components/Spinner/Spinner';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ drafts: 0, published: 0, followers: 0, following: 0 });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [postsRes, followRes] = await Promise.all([
            axios.get('/api/posts/stats'),
            axios.get(`/user/${user?.id}/follow-counts`)
        ]);
        setStats({ ...postsRes.data, ...followRes.data });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    if (user) fetchStats();
  }, [user]);

  if (!isAuthenticated) {
      return <Spinner />;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome back, {user?.username || 'Writer'}</h1>
        <p>Your creative space is ready.</p>
      </header>

      <section className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-number">{stats.published}</span>
          <span className="stat-label">Published Stories</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.drafts}</span>
          <span className="stat-label">Drafts</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.followers}</span>
          <span className="stat-label">Followers</span>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-header">
            <h2>Quick Actions</h2>
        </div>
        <div className="action-grid">
            <Link to="/write" className="action-card">
                <div className="action-icon">
                    <PenTool size={24} />
                </div>
                <span className="action-title">Write a Story</span>
                <span className="action-desc">Start a new draft or continue writing.</span>
            </Link>

            <Link to="/drafts" className="action-card">
                <div className="action-icon">
                    <FileText size={24} />
                </div>
                <span className="action-title">View Drafts</span>
                <span className="action-desc">See your works in progress.</span>
            </Link>

            <Link to="/my-stories" className="action-card">
                <div className="action-icon">
                    <BookOpen size={24} />
                </div>
                <span className="action-title">My Stories</span>
                <span className="action-desc">View your published stories.</span>
            </Link>

            <Link to="/profile" className="action-card">
                <div className="action-icon">
                    <User size={24} />
                </div>
                <span className="action-title">Your Profile</span>
                <span className="action-desc">Update your bio and settings.</span>
            </Link>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
