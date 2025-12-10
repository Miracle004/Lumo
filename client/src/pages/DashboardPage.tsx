import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PenTool, FileText, User, Settings } from 'lucide-react';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ drafts: 0, published: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/posts/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    if (user) fetchStats();
  }, [user]);

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
          <span className="stat-number">0</span>
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
