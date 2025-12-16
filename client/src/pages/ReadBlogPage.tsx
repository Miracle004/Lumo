import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Share2, Bookmark, MessageSquare, X as XIcon, Heart, Facebook, Twitter, MessageCircle, Copy, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toastService } from '../services/toastService';
import axios from 'axios';
import { getRenderableHTML } from '../utils/textUtils';
import './ReadBlogPage.css';

const fixImageUrl = (url: string | undefined) => {
  if (!url) return url;
  if (url.startsWith('http://localhost:3000')) {
    return url.replace('http://localhost:3000', import.meta.env.VITE_API_URL || 'https://lumo-q0bg.onrender.com');
  }
  return url;
};

const fixHtmlContent = (html: string) => {
  if (!html) return html;
  return html.replace(/http:\/\/localhost:3000/g, import.meta.env.VITE_API_URL || 'https://lumo-q0bg.onrender.com');
};

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
  author_id?: number;
  tags?: string[];
}

const ReadBlogPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false); // Share modal state
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false); // Add follow state
  const [comments, setComments] = useState<any[]>([]); // Use appropriate type or any
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Post ID is missing.');
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        const response = await axios.get(`/api/posts/${id}`);
        const data = response.data;
        // Fix URLs in the post data
        data.cover_image_url = fixImageUrl(data.cover_image_url);
        data.author_avatar = fixImageUrl(data.author_avatar);
        data.content = fixHtmlContent(data.content);
        setPost(data);
      } catch (err: any) {
        console.error('Failed to fetch post:', err);
        setError(err.response?.data?.message || 'Failed to load post. It might be a private draft.');
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
        try {
            const response = await axios.get(`/api/posts/${id}/comments`);
            const fixedComments = response.data.map((c: any) => ({
                ...c,
                avatar: fixImageUrl(c.avatar)
            }));
            setComments(fixedComments);
        } catch (err) {
            console.error('Failed to fetch comments:', err);
        }
    };

    fetchPost();
    fetchComments();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchLikeStatus = async () => {
      try {
        const response = await axios.get(`/api/posts/${id}/likes`);
        setLikes(response.data.count);
        setIsLiked(response.data.isLiked);
      } catch (err) {
        console.error('Failed to fetch like status:', err);
      }
    };
    fetchLikeStatus();
  }, [id, isAuthenticated]);

  useEffect(() => {
      if (!isAuthenticated || !post || !post.author_id) return;
      if (user && String(user.id) === String(post.author_id)) return;

      axios.get(`/user/${post.author_id}/follow-status`)
           .then(res => setIsFollowing(res.data.isFollowing))
           .catch(err => console.error('Failed to fetch follow status', err));
  }, [isAuthenticated, post?.author_id, user]);

  const handleAddComment = async () => {
      if (!isAuthenticated) {
          toastService.info('Please log in to comment.');
          return;
      }
      if (!newComment.trim()) return;

      try {
          const response = await axios.post(`/api/posts/${id}/comments`, { content: newComment });
          const newCommentData = {
              ...response.data,
              avatar: fixImageUrl(response.data.avatar)
          };
          setComments(prev => [newCommentData, ...prev]);
          setNewComment('');
          toastService.success('Comment added!');
      } catch (err: any) {
          console.error('Failed to add comment:', err);
          toastService.error(err.response?.data?.error || 'Failed to add comment.');
      }
  };

  const handleDeleteComment = async (commentId: number) => {
      if (!isAuthenticated) return;
      if (!window.confirm('Delete this comment?')) return;
      try {
          await axios.delete(`/api/posts/${id}/comments/${commentId}`);
          setComments(prev => prev.filter(c => c.id !== commentId));
          toastService.success('Comment deleted.');
      } catch (err: any) {
          console.error('Failed to delete comment:', err);
          toastService.error(err.response?.data?.error || 'Failed to delete comment.');
      }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
        toastService.info('Please log in to like this story.');
        return;
    }
    
    // Optimistic update
    const prevIsLiked = isLiked;
    const prevLikes = likes;
    
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);

    try {
        await axios.post(`/api/posts/${id}/like`);
    } catch (err) {
        console.error('Failed to toggle like:', err);
        // Revert
        setIsLiked(prevIsLiked);
        setLikes(prevLikes);
        toastService.error('Failed to like post.');
    }
  };

  const handleShareClick = () => {
      setShowShareModal(true);
  };

  const getShareUrl = () => window.location.href;

  const handleCopyLink = () => {
      navigator.clipboard.writeText(window.location.href);
      toastService.success('Link copied to clipboard!');
      setShowShareModal(false);
  };

  const handleFollow = async () => {
      if (!isAuthenticated) {
          toastService.info('Please log in to follow authors.');
          return;
      }
      if (!post?.author_id) return;

      const newStatus = !isFollowing;
      setIsFollowing(newStatus); // Optimistic

      try {
          if (newStatus) {
              await axios.post(`/user/${post.author_id}/follow`);
              toastService.success(`You are now following ${post.author_name}`);
          } else {
              await axios.delete(`/user/${post.author_id}/follow`);
              toastService.info(`Unfollowed ${post.author_name}`);
          }
      } catch (err) {
          console.error('Follow action failed:', err);
          setIsFollowing(!newStatus); // Revert
          toastService.error('Failed to update follow status');
      }
  };

  const shareToSocial = (platform: 'whatsapp' | 'twitter' | 'facebook') => {
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
      }
      if(shareLink) window.open(shareLink, '_blank');
      setShowShareModal(false);
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
      {/* Back Navigation */}
      <div className="article-top-nav container">
         <button onClick={() => navigate(-1)} className="back-nav-btn" aria-label="Go back">
            <ArrowLeft size={20} />
            <span>Back</span>
         </button>
      </div>

      <article className="full-article">
        <header className="article-header container">
            <h1 className="article-title">{post.title || ''}</h1>
            
            {post.tags && post.tags.length > 0 && (
                <div className="article-tags">
                    {post.tags.map(tag => (
                        <span key={tag} className="tag-pill">#{tag}</span>
                    ))}
                </div>
            )}
            
            <div className="article-meta-block">
                <div className="author-info">
                    <Link to={`/author/${post.author_id}`} style={{textDecoration: 'none'}}>
                        <img src={post.author_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} alt={post.author_name || "Author"} className="author-avatar" />
                    </Link>
                    <div className="author-text">
                        <div className="author-name-row">
                            <Link to={`/author/${post.author_id}`} style={{textDecoration: 'none', color: 'inherit'}}>
                                <span className="author-name">{post.author_name || "Unknown Author"}</span>
                            </Link>
                            {(!user || (post.author_id && String(user.id) !== String(post.author_id))) && (
                                <button 
                                    className={`follow-btn ${isFollowing ? 'following' : ''}`} 
                                    onClick={handleFollow}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>
                         <div className="meta-details">
                            <span>{post.read_time ? `${post.read_time} min read` : ''}</span>
                            {post.read_time && post.created_at && <span className="dot">•</span>}
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                <div className="header-actions">
                     <button className={`action-btn like-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike} aria-label="Like">
                        <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                        {likes > 0 && <span className="like-count">{likes}</span>}
                     </button>
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
            dangerouslySetInnerHTML={{ __html: getRenderableHTML(post.content) }}
            />
            
            <div className="comments-section">
                <h3>Comments <MessageSquare size={18} /> ({comments.length})</h3>
                
                {isAuthenticated ? (
                    <div className="comment-input-area">
                        <textarea 
                            placeholder="Add a comment..." 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={handleAddComment}>Post Comment</button>
                    </div>
                ) : (
                    <div className="comment-login-prompt" style={{marginBottom: '2rem'}}>
                        <p>Please <Link to="/login" style={{color: 'var(--accent)', textDecoration: 'underline'}}>log in</Link> to join the conversation.</p>
                    </div>
                )}

                <div className="comments-list">
                    {comments.map(comment => (
                        <div key={comment.id} className="comment-item">
                            <div className="comment-meta">
                                {comment.avatar && <img src={comment.avatar} alt="avatar" className="comment-avatar" style={{width: 24, height: 24, borderRadius: '50%'}} />}
                                <strong>{comment.username}</strong>
                                <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                {(user?.id === comment.user_id || (post && String(user?.id) === String(post.author_id))) && (
                                    <button className="delete-comment-btn" onClick={() => handleDeleteComment(comment.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <p className="comment-content">{comment.content}</p>
                        </div>
                    ))}
                    {comments.length === 0 && <p className="no-comments" style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>No comments yet. Be the first to share your thoughts!</p>}
                </div>
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
                    <button className="share-btn twitter" onClick={() => shareToSocial('twitter')}>
                        <Twitter size={32} />
                        Share to X
                    </button>
                    <button className="share-btn facebook" onClick={() => shareToSocial('facebook')}>
                        <Facebook size={32} />
                        Share to Facebook
                    </button>
                    <button className="share-btn whatsapp" onClick={() => shareToSocial('whatsapp')}>
                        <MessageCircle size={32} />
                        Share to WhatsApp
                    </button>
                    <button className="share-btn copy-link" onClick={handleCopyLink}>
                        <Copy size={32} />
                        Copy Link
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ReadBlogPage;