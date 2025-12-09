import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './DraftsPage.css'; // Reusing drafts styles

interface Post {
  id: string;
  title: string;
  published_at: string;
  cover_image_url?: string;
  read_time?: number;
}

const MyPublishedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await axios.get('/api/posts/my-published');
        setPosts(response.data);
      } catch (err: any) {
        console.error('Failed to fetch published posts:', err);
        setError('Failed to load your published stories.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [isAuthenticated]);

  if (loading) return <div className="drafts-page">Loading...</div>;
  if (!isAuthenticated) return <div className="drafts-page">Please log in to view your stories.</div>;

  return (
    <div className="drafts-page">
      <h1>My Published Stories</h1>
      
      {error && <div className="error-text">{error}</div>}

      <div className="drafts-list">
        {posts.length > 0 ? (
          posts.map(post => (
            <Link to={`/read/${post.id}`} key={post.id} className="draft-card">
              <h3>{post.title}</h3>
              <p>Published: {new Date(post.published_at).toLocaleDateString()}</p>
              {post.read_time && <p>{post.read_time} min read</p>}
            </Link>
          ))
        ) : (
          <p>You haven't published any stories yet.</p>
        )}
      </div>
    </div>
  );
};

export default MyPublishedPage;
