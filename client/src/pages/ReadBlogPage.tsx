import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Share2, Bookmark, MessageSquare, X as XIcon, Facebook, Instagram, Twitter } from 'lucide-react'; // Added icons
import axios from 'axios';
import './ReadBlogPage.css';

interface Post {
  id: string;
  title: string;
  content: string;
  cover_image_url?: string;
  status: 'draft' | 'published';
  category?: string;
  author_name?: string; 
  author_avatar?: string; 
  created_at: string;
  read_time?: number;
}

const ReadBlogPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false); // Share modal state

  useEffect(() => {
    if (!id) {
      setError('Post ID is missing.');
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        const response = await axios.get(`/api/posts/${id}`);
        setPost(response.data);
      } catch (err: any) {
        console.error('Failed to fetch post:', err);
        setError(err.response?.data?.message || 'Failed to load post. It might be a private draft.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleShareClick = () => {
      setShowShareModal(true);
  };

  const getShareUrl = () => window.location.href;

  const shareToSocial = (platform: 'whatsapp' | 'twitter' | 'facebook' | 'instagram') => {
      const url = encodeURIComponent(getShareUrl());
      const text = encodeURIComponent(`Check out this story: ${post?.title}`);
      
      let shareLink = '';
      switch(platform) {
          case 'whatsapp':
              shareLink = `https://wa.me/?text=${text} ${url}`;
              break;
          case 'twitter':
              shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
              break;
          case 'facebook':
              shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
              break;
          case 'instagram':
               // Instagram doesn't support direct web sharing links easily, usually copies to clipboard
               navigator.clipboard.writeText(getShareUrl());
               alert('Link copied to clipboard! (Instagram does not support direct web sharing)');
               return;
      }
      if(shareLink) window.open(shareLink, '_blank');
      setShowShareModal(false);
  };

  // Helper to ensure content is string
  const getRenderableContent = (content: any) => {
    if (typeof content === 'string') {
        // Attempt to detect if it's a JSON stringified object (the "Issue 1" bug)
        if (content.trim().startsWith('{') && content.includes('"text":')) {
             try {
                 const parsed = JSON.parse(content);
                 if (parsed.text) return parsed.text; // Or handle other JSON structures
             } catch (e) {
                 // Not JSON, just normal string
             }
        }
        return content;
    }
    return '';
  };

  if (loading) {
    return <div className="read-page-container">Loading post...</div>;
  }

  if (error) {
    return <div className="read-page-container error-message">{error}</div>;
  }

  if (!post) {
    return <div className="read-page-container">Post not found.</div>;
  }

  return (
    <div className="read-page-container">
      {/* Breadcrumb / Category */}
      <div className="article-top-nav container">
         <Link to="/" className="breadcrumb-link">Home</Link>
         <span className="breadcrumb-separator">/</span>
         <span className="breadcrumb-current">{post.category || 'Untitled'}</span>
      </div>

      <article className="full-article">
        <header className="article-header container">
            <h1 className="article-title">{post.title || 'Untitled'}</h1>
            
            <div className="article-meta-block">
                <div className="author-info">
                    <img src={post.author_avatar || "https://via.placeholder.com/100"} alt={post.author_name || "Author"} className="author-avatar" />
                    <div className="author-text">
                        <div className="author-name-row">
                            <span className="author-name">{post.author_name || "Unknown Author"}</span>
                            <button className="follow-btn">Follow</button>
                        </div>
                         <div className="meta-details">
                            <span>{post.read_time ? `${post.read_time} min read` : ''}</span>
                            {post.read_time && post.created_at && <span className="dot">•</span>}
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                <div className="header-actions">
                     <button className="action-btn" aria-label="Save"><Bookmark size={20} /></button>
                     <button className="action-btn" onClick={handleShareClick} aria-label="Share"><Share2 size={20} /></button>
                </div>
            </div>
        </header>

        {/* Full Width Hero Image */}
        {post.cover_image_url && (
            <div className="hero-image-container">
                <img src={post.cover_image_url} alt={post.title || 'Post Cover'} />
            </div>
        )}

        <div className="article-content-wrapper container">
            <div
            className="article-body-content"
            dangerouslySetInnerHTML={{ __html: getRenderableContent(post.content) }}
            />
            
            {/* Tooltip Placeholder (Visual representation) */}
            <div className="selection-tooltip-demo">
                <button><MessageSquare size={14} /> Comment</button>
                <div className="divider"></div>
                <button><Bookmark size={14} /> Save</button>
            </div>
        </div>

      </article>

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay">
            <div className="modal-content share-modal">
                <div className="modal-header">
                    <h2>Share this story</h2>
                    <button className="close-btn" onClick={() => setShowShareModal(false)}>
                        <XIcon size={24} />
                    </button>
                </div>
                <div className="share-options">
                    <button className="share-btn whatsapp" onClick={() => shareToSocial('whatsapp')}>
                        Share to WhatsApp
                    </button>
                    <button className="share-btn twitter" onClick={() => shareToSocial('twitter')}>
                        Share to X (Twitter)
                    </button>
                    <button className="share-btn facebook" onClick={() => shareToSocial('facebook')}>
                        Share to Facebook
                    </button>
                    <button className="share-btn instagram" onClick={() => shareToSocial('instagram')}>
                        Share to Instagram (Copy Link)
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ReadBlogPage;