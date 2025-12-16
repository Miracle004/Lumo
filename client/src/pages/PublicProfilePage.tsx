import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toastService } from '../services/toastService';
import { getPlainText } from '../utils/textUtils';
import Spinner from '../components/Spinner/Spinner';
import './PublicProfilePage.css';
import './HomePage.css'; // For grid styles

const fixImageUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http://localhost:3000')) {
    return url.replace('http://localhost:3000', import.meta.env.VITE_API_URL || 'https://lumo-q0bg.onrender.com');
  }
  return url;
};

interface Post {
  id: string;
  title: string;
  content: any;
  cover_image_url: string;
  published_at: string;
  read_time: number;
  type?: string;
  height?: string;
  excerpt?: string;
}

interface UserProfile {
    id: number;
    username: string;
    bio: string;
    avatar: string;
}

interface UserListItem {
    id: number;
    username: string;
    profile_picture: string;
    bio: string;
}

const PublicProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser, isAuthenticated } = useAuth();
    
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState({ followers: 0, following: 0 });
    const [posts, setPosts] = useState<Post[]>([]);
    const [followersList, setFollowersList] = useState<UserListItem[]>([]);
    const [followingList, setFollowingList] = useState<UserListItem[]>([]);
    
    const [activeTab, setActiveTab] = useState<'stories' | 'followers' | 'following'>('stories');
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    const isOwner = currentUser && profile && String(currentUser.id) === String(profile.id);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        
        // Fetch Profile Data (User info, Stats, Posts)
        axios.get(`/user/${id}/profile`)
            .then(res => {
                setProfile(res.data.user);
                setStats(res.data.stats);
                
                // Transform Posts
                const mappedPosts = res.data.posts.map((p: any) => ({
                    ...p,
                    type: 'standard',
                    height: 'standard',
                    excerpt: getPlainText(p.content).substring(0, 100) + (getPlainText(p.content).length > 100 ? '...' : ''),
                }));
                setPosts(mappedPosts);
            })
            .catch(err => {
                console.error('Failed to fetch profile:', err);
                toastService.error('Failed to load profile.');
            })
            .finally(() => setLoading(false));

        // Check Follow Status
        if (isAuthenticated && currentUser && String(currentUser.id) !== String(id)) {
            axios.get(`/user/${id}/follow-status`)
                .then(res => setIsFollowing(res.data.isFollowing))
                .catch(console.error);
        }
    }, [id, isAuthenticated, currentUser]);

    // Fetch lists when tabs change
    useEffect(() => {
        if (!id) return;
        if (activeTab === 'followers' && followersList.length === 0) {
            axios.get(`/user/${id}/followers`)
                .then(res => setFollowersList(res.data))
                .catch(console.error);
        }
        if (activeTab === 'following' && followingList.length === 0 && isOwner) {
            axios.get(`/user/${id}/following`)
                .then(res => setFollowingList(res.data))
                .catch(console.error);
        }
    }, [activeTab, id, followersList.length, followingList.length, isOwner]);

    const handleFollow = async () => {
        if (!isAuthenticated) {
            toastService.info('Please log in to follow authors.');
            return;
        }
        if (!profile) return;

        const newStatus = !isFollowing;
        setIsFollowing(newStatus);
        
        // Optimistic stats update
        setStats(prev => ({
            ...prev,
            followers: newStatus ? prev.followers + 1 : prev.followers - 1
        }));

        try {
            if (newStatus) {
                await axios.post(`/user/${profile.id}/follow`);
                toastService.success(`Following ${profile.username}`);
            } else {
                await axios.delete(`/user/${profile.id}/follow`);
                toastService.info(`Unfollowed ${profile.username}`);
            }
        } catch (err) {
            console.error('Follow action failed:', err);
            setIsFollowing(!newStatus);
            setStats(prev => ({ // Revert stats
                ...prev,
                followers: !newStatus ? prev.followers + 1 : prev.followers - 1
            }));
            toastService.error('Failed to update follow status');
        }
    };

    if (loading) return <Spinner />;
    if (!profile) return <div className="public-profile-container">User not found.</div>;

    return (
        <div className="public-profile-container">
            <header className="profile-header-section">
                <img 
                    src={fixImageUrl(profile.avatar) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} 
                    alt={profile.username} 
                    className="public-avatar" 
                />
                <h1 className="profile-username">{profile.username}</h1>
                {profile.bio && <p className="profile-bio">{profile.bio}</p>}

                <div className="profile-stats-row">
                    <div className="stat-item" onClick={() => setActiveTab('followers')}>
                        <span className="stat-value">{stats.followers}</span>
                        <span className="stat-label">Followers</span>
                    </div>
                    <div className="stat-item" onClick={() => isOwner && setActiveTab('following')}>
                        <span className="stat-value">{stats.following}</span>
                        <span className="stat-label">Following</span>
                    </div>
                </div>

                {!isOwner && (
                    <button 
                        className={`follow-btn ${isFollowing ? 'following' : ''}`} 
                        onClick={handleFollow}
                        style={{padding: '0.6rem 2rem', fontSize: '1rem'}}
                    >
                        {isFollowing ? 'Following' : 'Follow'}
                    </button>
                )}
            </header>

            <div className="profile-tabs">
                <button 
                    className={`profile-tab ${activeTab === 'stories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stories')}
                >
                    Stories
                </button>
                <button 
                    className={`profile-tab ${activeTab === 'followers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('followers')}
                >
                    Followers
                </button>
                {isOwner && (
                    <button 
                        className={`profile-tab ${activeTab === 'following' ? 'active' : ''}`}
                        onClick={() => setActiveTab('following')}
                    >
                        Following
                    </button>
                )}
            </div>

            <div className="tab-content">
                {activeTab === 'stories' && (
                    <section className="masonry-grid">
                        {posts.length > 0 ? posts.map(post => (
                            <Link to={`/read/${post.id}`} key={post.id} className={`grid-item ${post.type} ${post.height}`}>
                                <article className="card">
                                    {post.cover_image_url && (
                                        <div className="card-image-wrapper">
                                            <img src={fixImageUrl(post.cover_image_url)} alt={post.title || 'Article cover'} />
                                        </div>
                                    )}
                                    <div className="card-content">
                                        <h3 className="card-title">{post.title}</h3>
                                        {post.excerpt && <p className="card-excerpt">{post.excerpt}</p>}
                                        <div className="card-meta">
                                            <span>{new Date(post.published_at).toLocaleDateString()}</span>
                                            <span className="dot">•</span>
                                            <span>{post.read_time || 1} min read</span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        )) : <p>No stories published yet.</p>}
                    </section>
                )}

                {activeTab === 'followers' && (
                    <div className="user-list">
                        {followersList.length > 0 ? followersList.map(user => (
                            <Link to={`/author/${user.id}`} key={user.id} className="user-list-item">
                                <img 
                                    src={fixImageUrl(user.profile_picture) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} 
                                    alt={user.username} 
                                    className="user-list-avatar" 
                                />
                                <div className="user-list-info">
                                    <h4>{user.username}</h4>
                                    {user.bio && <p>{user.bio}</p>}
                                </div>
                            </Link>
                        )) : <p>No followers yet.</p>}
                    </div>
                )}

                {activeTab === 'following' && isOwner && (
                    <div className="user-list">
                        {followingList.length > 0 ? followingList.map(user => (
                            <Link to={`/author/${user.id}`} key={user.id} className="user-list-item">
                                <img 
                                    src={fixImageUrl(user.profile_picture) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} 
                                    alt={user.username} 
                                    className="user-list-avatar" 
                                />
                                <div className="user-list-info">
                                    <h4>{user.username}</h4>
                                    {user.bio && <p>{user.bio}</p>}
                                </div>
                            </Link>
                        )) : <p>You are not following anyone.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicProfilePage;
