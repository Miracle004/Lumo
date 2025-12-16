import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Share2, X, Trash2 } from 'lucide-react';
import { toastService } from '../services/toastService';
import Spinner from '../components/Spinner/Spinner';
import './DraftsPage.css';

interface Post {
  id: string;
  title: string;
  updated_at?: string;
  author_name?: string;
  author_avatar?: string;
  cover_image_url?: string;
  is_viewed?: boolean;
  permission?: 'edit' | 'comment' | 'view'; // Added for shared drafts
}

const DraftsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'myDrafts' | 'shared' | 'saved'>('myDrafts');
  const [myDrafts, setMyDrafts] = useState<Post[]>([]);
  const [sharedDrafts, setSharedDrafts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { resetCount } = useNotification();
  
  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [permission, setPermission] = useState<'edit' | 'comment' | 'view'>('edit');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      if (isAuthenticated) {
        // Fetch Drafts (My Drafts + Shared With Me)
        try {
            const draftsResponse = await axios.get('/api/posts/drafts');
            setMyDrafts(draftsResponse.data.myDrafts);
            setSharedDrafts(draftsResponse.data.sharedWithMe);
        } catch (err: any) {
            console.error('Failed to fetch drafts:', err);
            setError('Failed to load your drafts.');
            toastService.error('Failed to load your drafts.');
        }

        // Fetch Bookmarks (independently)
        try {
            const bookmarksResponse = await axios.get('/api/posts/bookmarks');
            setSavedPosts(bookmarksResponse.data);
        } catch (err: any) {
            console.error('Failed to fetch bookmarks:', err);
            toastService.warn('Failed to load saved stories.');
            setSavedPosts([]); 
        } finally {
            setLoading(false);
        }
      } else {
        // Guest User: Fetch from Local Storage
        const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
        setSavedPosts(saved);
        setMyDrafts([]); // Guests can't have drafts
        setSharedDrafts([]);
        setLoading(false);
        if (activeTab !== 'saved') setActiveTab('saved'); // Default to saved for guests
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Mark notifications as read when viewing shared drafts
  useEffect(() => {
      if (isAuthenticated && activeTab === 'shared') {
          // Fire and forget - don't block UI
          axios.post('/api/notifications/mark-read')
               .then(() => {
                  // Optimistically update local state to clear badges immediately
                  setSharedDrafts(prev => prev.map(d => ({ ...d, is_viewed: true })));
                  resetCount(); // Reset global notification count
               })
               .catch(err => console.error('Failed to mark notifications read', err));
      }
  }, [isAuthenticated, activeTab, resetCount]);

  const openShareModal = (e: React.MouseEvent, draftId: string) => {
      e.preventDefault(); // Prevent Link navigation
      setSelectedDraftId(draftId);
      setShowShareModal(true);
  };

  const handleShare = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedDraftId) return;
      try {
          await axios.post(`/api/posts/${selectedDraftId}/share`, {
              emails: [collaboratorEmail],
              permission: permission,
          });
          toastService.success(`Invite sent to ${collaboratorEmail}!`);
          setCollaboratorEmail('');
          setShowShareModal(false);
      } catch (err: any) {
          console.error('Share failed:', err);
          toastService.error(err.response?.data?.message || 'Failed to share draft');
      }
  };

  const handleDeleteDraft = async (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      if (!window.confirm('Are you sure you want to delete this draft? This cannot be undone.')) return;
      
      try {
          await axios.delete(`/api/posts/${id}`);
          setMyDrafts(prev => prev.filter(p => p.id !== id));
          toastService.success('Draft deleted.');
      } catch (err: any) {
          console.error('Delete failed:', err);
          toastService.error(err.response?.data?.message || 'Failed to delete draft');
      }
  };

  const handleRemoveBookmark = async (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      if (!window.confirm('Remove this story from your library?')) return;

      try {
          if (isAuthenticated) {
             await axios.delete(`/api/posts/${id}/bookmark`);
          } else {
             // Handle guest local storage removal
             const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
             const newSaved = saved.filter((p: any) => p.id !== id);
             localStorage.setItem('savedPosts', JSON.stringify(newSaved));
          }
          setSavedPosts(prev => prev.filter(p => p.id !== id));
          toastService.success('Removed from library.');
      } catch (err: any) {
          console.error('Unbookmark failed:', err);
          toastService.error('Failed to remove bookmark');
      }
  };

  // Calculate counts
  const myDraftsCount = myDrafts.length;
  const sharedUnreadCount = sharedDrafts.filter(d => d.is_viewed === false).length;
  const savedCount = savedPosts.length;

  return (
    <div className="drafts-page">
      <h1>Your Library</h1>
      
      {error && <div className="error-text">{error}</div>}

      <div className="draft-tabs">
        {isAuthenticated && (
            <>
                <button 
                  className={`tab-btn ${activeTab === 'myDrafts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('myDrafts')}
                >
                  My Drafts ({myDraftsCount})
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'shared' ? 'active' : ''}`}
                  onClick={() => setActiveTab('shared')}
                  style={{ position: 'relative' }}
                >
                  Shared With Me
                  {sharedUnreadCount > 0 && (
                      <span className="tab-badge" style={{
                          marginLeft: '8px',
                          backgroundColor: 'red',
                          color: 'white',
                          borderRadius: '50%',
                          padding: '2px 6px',
                          fontSize: '11px',
                          verticalAlign: 'middle'
                      }}>{sharedUnreadCount}</span>
                  )}
                </button>
            </>
        )}
        <button 
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved For Later ({savedCount})
        </button>
      </div>

      <div className="drafts-list">
        {loading ? (
          <Spinner />
        ) : (
          <>
            {activeTab === 'myDrafts' && (
              myDrafts.length > 0 ? (
                myDrafts.map(draft => (
                  <div key={draft.id} className="draft-card-wrapper" style={{ position: 'relative' }}>
                      <Link to={`/write/${draft.id}`} className="draft-card">
                        <h3>{draft.title || 'Untitled Draft'}</h3>
                        <p>Last edited: {new Date(draft.updated_at!).toLocaleString()}</p>
                      </Link>
                      
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
                        <button 
                            className="share-icon-btn" 
                            onClick={(e) => openShareModal(e, draft.id)}
                            title="Share with collaborators"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                            <Share2 size={18} />
                        </button>
                        <button 
                            className="delete-icon-btn" 
                            onClick={(e) => handleDeleteDraft(e, draft.id)}
                            title="Delete Draft"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc3545' }}
                        >
                            <Trash2 size={18} />
                        </button>
                      </div>
                  </div>
                ))
              ) : <p>No drafts found.</p>
            )}

            {activeTab === 'shared' && (
              sharedDrafts.length > 0 ? (
                sharedDrafts.map(draft => (
                  <Link to={`/write/${draft.id}`} key={draft.id} className={`draft-card ${!draft.is_viewed ? 'unread-draft' : ''}`}>
                    <h3>{draft.title || 'Untitled Draft'}</h3>
                    <p>Author: {draft.author_name}</p>
                    {draft.permission && (
                      <span className="draft-permission-tag">Your role: {draft.permission.charAt(0).toUpperCase() + draft.permission.slice(1)}</span>
                    )}
                    <p>Last edited: {new Date(draft.updated_at!).toLocaleString()}</p>
                  </Link>
                ))
              ) : <p>No shared drafts found.</p>
            )}

            {activeTab === 'saved' && (
              savedPosts.length > 0 ? (
                savedPosts.map(post => (
                   <div key={post.id} className="draft-card-wrapper" style={{ position: 'relative' }}>
                        <Link to={`/read/${post.id}`} className="draft-card">
                            <h3>{post.title}</h3>
                            <p>By {post.author_name}</p>
                        </Link>
                        <button 
                            className="delete-icon-btn" 
                            onClick={(e) => handleRemoveBookmark(e, post.id)}
                            title="Remove from Library"
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc3545' }}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))
              ) : <p>No saved stories.</p>
            )}
          </>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <div className="modal-header">
                      <h2>Invite Collaborator</h2>
                      <button className="close-btn" onClick={() => setShowShareModal(false)}>
                          <X size={24} />
                      </button>
                  </div>
                  <form onSubmit={handleShare} className="share-form">
                      <div className="share-input-group" style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                          <input 
                            type="email" 
                            className="share-input" 
                            placeholder="Enter email address"
                            value={collaboratorEmail}
                            onChange={(e) => setCollaboratorEmail(e.target.value)}
                            required 
                            style={{ flex: 1, padding: '8px' }}
                          />
                          <select 
                            className="permission-select"
                            value={permission}
                            onChange={(e) => setPermission(e.target.value as 'edit' | 'comment' | 'view')}
                            style={{ padding: '8px' }}
                          >
                              <option value="edit">Can Edit</option>
                              <option value="comment">Can Comment</option>
                              <option value="view">Can View</option>
                          </select>
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send Invite</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default DraftsPage;
