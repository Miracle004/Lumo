import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPlainText } from '../utils/textUtils';
import Spinner from '../components/Spinner/Spinner';
import './HomePage.css'; // Reuse HomePage styles

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
  author_name: string;
  author_avatar: string;
  published_at: string;
  read_time: number;
  tags?: string[];
  type?: string;
  height?: string;
  excerpt?: string;
}

const SearchPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        if (!query) {
            setPosts([]);
            setLoading(false);
            return;
        }
        const response = await axios.get(`/api/posts/search?q=${encodeURIComponent(query)}`);
        // Transform API data to UI data
        const mappedPosts = response.data.map((p: any) => ({
          ...p,
          type: 'standard',
          height: 'standard',
          excerpt: getPlainText(p.content).substring(0, 100) + (getPlainText(p.content).length > 100 ? '...' : ''),
          cover_image_url: fixImageUrl(p.cover_image_url),
          author_avatar: fixImageUrl(p.author_avatar) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
        }));
        setPosts(mappedPosts);
      } catch (error) {
        console.error('Failed to search posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [query]);

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
    <div className="home-container" style={{paddingTop: '2rem'}}>
      <h1 style={{marginBottom: '2rem', paddingLeft: '1rem', fontSize: '2rem', fontWeight: 'bold'}}>Search Results for "{query}"</h1>
      {loading ? (
         <Spinner />
      ) : posts.length === 0 ? (
         <p style={{paddingLeft: '1rem'}}>No stories found matching your search.</p>
      ) : (
        <section className="masonry-grid">
          {posts.map((post) => (
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
                            <img src={post.author_avatar} alt={post.author_name} />
                        </div>
                    )}
                    
                    {!post.cover_image_url && post.author_avatar && (
                        <div className="author-inline">
                            <img src={post.author_avatar} alt={post.author_name} />
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
          ))}
        </section>
      )}
    </div>
  );
};

export default SearchPage;
