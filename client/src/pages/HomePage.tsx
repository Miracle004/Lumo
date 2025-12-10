import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const CATEGORIES = ['Latest', 'Trending', 'Design', 'Mindfulness', 'Productivity', 'Tech'];

interface Post {
  id: string;
  title: string;
  content: any;
  cover_image_url: string;
  author_name: string;
  author_avatar: string;
  published_at: string;
  read_time: number;
  // UI helpers
  type?: string;
  height?: string;
  excerpt?: string;
}

import { getPlainText } from '../utils/textUtils';

const HomePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('Latest');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('/api/posts/published');
        // Transform API data to UI data
        const mappedPosts = response.data.map((p: any) => ({
          ...p,
          type: 'standard', // Default for now
          height: 'standard', // Fixed height for consistency
          excerpt: getPlainText(p.content).substring(0, 100) + (getPlainText(p.content).length > 100 ? '...' : ''),
          date: new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          image: p.cover_image_url,
          authorAvatar: p.author_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
        }));
        setPosts(mappedPosts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleBookmark = async (e: React.MouseEvent, post: Post) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    if (isAuthenticated) {
      try {
        await axios.post(`/api/posts/${post.id}/bookmark`);
        alert('Post saved to your bookmarks!');
      } catch (error) {
        console.error('Failed to bookmark:', error);
      }
    } else {
      // Guest: Save to local storage
      const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
      if (!saved.find((p: Post) => p.id === post.id)) {
        saved.push(post);
        localStorage.setItem('savedPosts', JSON.stringify(saved));
        alert('Post saved for this session!');
      } else {
        alert('Post is already saved.');
      }
    }
  };

  return (
    <div className="home-container">
      <section className="hero-section">
        <h1 className="hero-heading">Discover clarity<br />in chaos.</h1>
        <p className="hero-subheading">Stories about minimalism, design, and finding peace.</p>
      </section>

      <section className="category-section">
        <div className="category-scroll">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="masonry-grid">
        {loading ? (
           <p style={{ textAlign: 'center', width: '100%' }}>Loading stories...</p>
        ) : (
          posts.map((post) => (
            <Link to={`/read/${post.id}`} key={post.id} className={`grid-item ${post.type} ${post.height}`}>
              <article className="card">
                {post.cover_image_url && (
                  <div className="card-image-wrapper">
                    <img src={post.cover_image_url} alt={post.title || 'Article cover'} />
                  </div>
                )}

                <div className="card-content">
                    {post.cover_image_url && (
                        <div className="author-overlap">
                            <img src={post.authorAvatar} alt={post.author_name} />
                        </div>
                    )}
                    
                    {!post.cover_image_url && post.authorAvatar && (
                        <div className="author-inline">
                            <img src={post.authorAvatar} alt={post.author_name} />
                            <span>{post.author_name}</span>
                        </div>
                    )}
                    
                    {post.cover_image_url && <div className="author-name-below">{post.author_name}</div>}

                    <h3 className="card-title">{post.title}</h3>
                    {post.excerpt && <p className="card-excerpt">{post.excerpt}</p>}
                    
                    <div className="card-meta">
                        <span>{new Date(post.published_at).toLocaleDateString()}</span>
                        <span className="dot">•</span>
                        <span>{post.read_time || 1} min read</span>
                        <div className="meta-actions">
                            <button 
                                onClick={(e) => handleBookmark(e, post)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                                aria-label="Bookmark"
                            >
                                <Bookmark size={16} />
                            </button>
                        </div>
                    </div>
                </div>
              </article>
            </Link>
          ))
        )}
      </section>
    </div>
  );
};

export default HomePage;