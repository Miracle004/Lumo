import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Share2, X } from 'lucide-react';
import './DraftsPage.css';

interface Post {
  id: string;
  title: string;
  updated_at?: string;
  author_name?: string;
  // For bookmarks
  author_avatar?: string;
  cover_image_url?: string;
}

const DraftsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'myDrafts' | 'shared' | 'saved'>('myDrafts');
  const [myDrafts, setMyDrafts] = useState<Post[]>([]);
  const [sharedDrafts, setSharedDrafts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  
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
        try {
            // Fetch Drafts
            const draftsResponse = await axios.get('/api/posts/drafts');
            setMyDrafts(draftsResponse.data.myDrafts);
            setSharedDrafts(draftsResponse.data.sharedWithMe);

            // Fetch Bookmarks
            const bookmarksResponse = await axios.get('/api/posts/bookmarks');
            setSavedPosts(bookmarksResponse.data);
        } catch (err: any) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load your content.');
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
          alert(`Invite sent to ${collaboratorEmail}!`);
          setCollaboratorEmail('');
          setShowShareModal(false);
      } catch (err: any) {
          console.error('Share failed:', err);
          alert(err.response?.data?.message || 'Failed to share draft');
      }
  };

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
                  My Drafts
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'shared' ? 'active' : ''}`}
                  onClick={() => setActiveTab('shared')}
                >
                  Shared With Me
                </button>
            </>
        )}
        <button 
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved For Later
        </button>
      </div>

      <div className="drafts-list">
        {loading ? (
          <p>Loading...</p>
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
                      <button 
                        className="share-icon-btn" 
                        onClick={(e) => openShareModal(e, draft.id)}
                        title="Share with collaborators"
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                          <Share2 size={18} />
                      </button>
                  </div>
                ))
              ) : <p>No drafts found.</p>
            )}

            {activeTab === 'shared' && (
              sharedDrafts.length > 0 ? (
                sharedDrafts.map(draft => (
                  <Link to={`/write/${draft.id}`} key={draft.id} className="draft-card">
                    <h3>{draft.title || 'Untitled Draft'}</h3>
                    <p>Author: {draft.author_name}</p>
                    <p>Last edited: {new Date(draft.updated_at!).toLocaleString()}</p>
                  </Link>
                ))
              ) : <p>No shared drafts found.</p>
            )}

            {activeTab === 'saved' && (
              savedPosts.length > 0 ? (
                savedPosts.map(post => (
                  <Link to={`/read/${post.id}`} key={post.id} className="draft-card">
                    <h3>{post.title}</h3>
                    <p>By {post.author_name}</p>
                  </Link>
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
