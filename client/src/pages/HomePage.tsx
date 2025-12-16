import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';
import SkeletonPostCard from '../components/SkeletonPostCard/SkeletonPostCard';

const CATEGORIES = ['Latest'];

interface Post {
  id: string;
  title: string;
  content: any;
  cover_image_url: string;
  author_name: string;
  author_avatar: string;
  author_id: number;
  published_at: string;
  read_time: number;
  // UI helpers
  type?: string;
  height?: string;
  excerpt?: string;
}

import { getPlainText } from '../utils/textUtils';

const fixImageUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http://localhost:3000')) {
    return url.replace('http://localhost:3000', import.meta.env.VITE_API_URL || 'https://lumo-q0bg.onrender.com');
  }
  return url;
};

const HomePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('Latest');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { isAuthenticated } = useAuth();
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchPosts = useCallback(async (pageNum: number, category: string, reset: boolean) => {
    try {
      setLoading(true);
      const limit = 6; 
      const response = await axios.get(`/api/posts/published?filter=${category}&page=${pageNum}&limit=${limit}`);
      
      const newPosts = response.data.map((p: any) => ({
        ...p,
        type: 'standard',
        height: 'standard',
        excerpt: getPlainText(p.content).substring(0, 100) + (getPlainText(p.content).length > 100 ? '...' : ''),
        date: new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cover_image_url: fixImageUrl(p.cover_image_url),
        image: fixImageUrl(p.cover_image_url),
        authorAvatar: fixImageUrl(p.author_avatar) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
      }));

      if (newPosts.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => {
             // Prevent duplicates just in case
             const existingIds = new Set(prev.map(p => p.id));
             const uniqueNewPosts = newPosts.filter((p: Post) => !existingIds.has(p.id));
             return [...prev, ...uniqueNewPosts];
        });
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load or category change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPosts(1, activeCategory, true);
  }, [activeCategory, fetchPosts]);

  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => {
            const nextPage = prevPage + 1;
            fetchPosts(nextPage, activeCategory, false);
            return nextPage;
        });
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, activeCategory, fetchPosts]);

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
            <p className="hero-subheading">Explore ideas that matter, written by people who care.</p>
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
    
                  {posts.map((post, index) => {
    
                      if (posts.length === index + 1) {
    
                          return (
    
                              <div ref={lastPostElementRef} key={post.id} className={`grid-item ${post.type} ${post.height}`}>
    
                                   <Link to={`/read/${post.id}`}>
    
                                      <article className="card">
    
                                          {post.cover_image_url && (
    
                                          <div className="card-image-wrapper">
    
                                              <img src={post.cover_image_url} alt={post.title || 'Article cover'} />
    
                                          </div>
    
                                          )}
    
          
    
                                          <div className="card-content">
    
                                              {post.cover_image_url && (
    
                                                  <div className="author-overlap">
    
                                                      <Link to={`/author/${post.author_id}`} onClick={(e) => e.stopPropagation()}>
    
                                                          <img src={post.author_avatar} alt={post.author_name} />
    
                                                      </Link>
    
                                                  </div>
    
                                              )}
    
                                              
    
                                              {!post.cover_image_url && post.author_avatar && (
    
                                                  <div className="author-inline">
    
                                                      <Link to={`/author/${post.author_id}`} onClick={(e) => e.stopPropagation()} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit'}}>
    
                                                          <img src={post.author_avatar} alt={post.author_name} />
    
                                                          <span>{post.author_name}</span>
    
                                                      </Link>
    
                                                  </div>
    
                                              )}
    
                                              
    
                                              {post.cover_image_url && (
    
                                                  <div className="author-name-below">
    
                                                      <Link to={`/author/${post.author_id}`} onClick={(e) => e.stopPropagation()} style={{textDecoration: 'none', color: 'inherit'}}>
    
                                                          {post.author_name}
    
                                                      </Link>
    
                                                  </div>
    
                                              )}
    
          
    
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
    
                              </div>
    
                          );
    
                      } else {
    
                          return (
    
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
    
                                              <Link to={`/author/${post.author_id}`} onClick={(e) => e.stopPropagation()}>
    
                                                  <img src={post.author_avatar} alt={post.author_name} />
    
                                              </Link>
    
                                          </div>
    
                                      )}
    
                                      
    
                                      {!post.cover_image_url && post.author_avatar && (
    
                                          <div className="author-inline">
    
                                              <Link to={`/author/${post.author_id}`} onClick={(e) => e.stopPropagation()} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit'}}>
    
                                                  <img src={post.author_avatar} alt={post.author_name} />
    
                                                  <span>{post.author_name}</span>
    
                                              </Link>
    
                                          </div>
    
                                      )}
    
                                      
    
                                      {post.cover_image_url && (
    
                                          <div className="author-name-below">
    
                                              <Link to={`/author/${post.author_id}`} onClick={(e) => e.stopPropagation()} style={{textDecoration: 'none', color: 'inherit'}}>
    
                                                  {post.author_name}
    
                                              </Link>
    
                                          </div>
    
                                      )}
    
          
    
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
    
                          )
    
                      }
    
                  })}
    
                  {loading && (
    
                      <>
    
                          <div className="grid-item">
    
                               <SkeletonPostCard />
    
                          </div>
    
                          <div className="grid-item">
    
                               <SkeletonPostCard />
    
                          </div>
    
                          <div className="grid-item">
    
                               <SkeletonPostCard />
    
                          </div>
    
                      </>
    
                  )}
    
                </section>
    
              </div>                );
              };
export default HomePage;