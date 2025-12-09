import React, { useState, useEffect, useCallback } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useParams, useNavigate } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor/RichTextEditor';
import { Share2, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import './WriteBlogPage.css';

interface Post {
  id: string;
  title: string;
  content: string;
  cover_image_url?: string;
  status: 'draft' | 'published';
}

interface Collaborator {
  user_id: string;
  username: string;
  email: string;
  permission: 'edit' | 'comment' | 'view';
}

const WriteBlogPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Error' | ''>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [permission, setPermission] = useState<'edit' | 'comment' | 'view'>('edit');
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [postCollaborators, setPostCollaborators] = useState<Collaborator[]>([]);
  const [isNewPost, setIsNewPost] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [postError, setPostError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      title: currentPost?.title || '',
      content: currentPost?.content || '',
      imageUrl: currentPost?.cover_image_url || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      title: Yup.string().max(100, 'Must be 100 characters or less').required('Required'),
      content: Yup.string().min(20, 'Must be at least 20 characters').required('Required'),
      imageUrl: Yup.string().url('Invalid URL').nullable(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        if (!id) {
            return;
        }
        await axios.post(`/api/posts/${id}/publish`);
        alert('Published successfully!');
        navigate(`/read/${id}`);
      } catch (err: any) {
        console.error('Publish failed:', err);
        setPostError(err.response?.data?.message || 'Failed to publish post');
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!isAuthenticated && !initialLoading) {
      navigate('/login');
    }
  }, [isAuthenticated, initialLoading, navigate]);

  useEffect(() => {
    const loadPost = async () => {
      if (!isAuthenticated) return;

      if (id) {
        try {
          const response = await axios.get(`/api/posts/${id}`);
          setCurrentPost(response.data);
          formik.setValues({
            title: response.data.title || '',
            content: response.data.content || '',
            imageUrl: response.data.cover_image_url || '',
          });
          setIsNewPost(false);
          const collabResponse = await axios.get(`/api/posts/${id}/collaborators`);
          setPostCollaborators(collabResponse.data.collaborators);
        } catch (err: any) {
          console.error('Failed to fetch post:', err);
          setPostError(err.response?.data?.message || 'Failed to load post');
          if (err.response?.status === 403 || err.response?.status === 404) {
            navigate('/dashboard');
          }
        } finally {
          setInitialLoading(false);
        }
      } else {
        setIsNewPost(true);
        try {
          const response = await axios.post('/api/posts/create', {
            title: 'Untitled Draft',
            content: '',
          });
          setCurrentPost(response.data);
          navigate(`/write/${response.data.id}`, { replace: true });
        } catch (err: any) {
          console.error('Failed to create new post:', err);
          setPostError(err.response?.data?.message || 'Failed to create new draft');
        } finally {
          setInitialLoading(false);
        }
      }
    };

    loadPost();
  }, [id, isAuthenticated, navigate]);

  const autoSave = useCallback(async () => {
    if (!id || !currentPost || !formik.dirty || initialLoading || currentPost.status === 'published') return;

    setSaveStatus('Saving...');
    try {
      const updatedPost = {
        title: formik.values.title,
        content: formik.values.content,
        coverImageUrl: formik.values.imageUrl,
      };
      const response = await axios.put(`/api/posts/${id}`, updatedPost);
      setCurrentPost(response.data);
      formik.resetForm({ values: formik.values });
      setSaveStatus('Saved');
    } catch (err) {
      console.error('Auto-save failed:', err);
      setSaveStatus('Error');
    }
  }, [id, currentPost, formik.values, formik.dirty, initialLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave();
    }, 3000);

    return () => clearTimeout(timer);
  }, [autoSave]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;

    const socket = io();
    socket.emit('join-post', id);

    socket.on('post-updated', (updatedContent: { content: string, updatedBy: string }) => {
      console.log('Post updated by collaborator:', updatedContent.updatedBy);
      // For now, just log. In a real app, you'd merge changes or update UI.
    });

    return () => {
      socket.emit('leave-post', id);
      socket.disconnect();
    };
  }, [id, isAuthenticated]);


  const handleShare = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!id) return;
      try {
          const response = await axios.post(`/api/posts/${id}/share`, {
              emails: [collaboratorEmail],
              permission: permission,
          });
          alert(`Shared with ${response.data.added.length ? collaboratorEmail : 'no one'}!`);
          if (response.data.added.length) {
            const collabResponse = await axios.get(`/api/posts/${id}/collaborators`);
            setPostCollaborators(collabResponse.data.collaborators);
          }
          setCollaboratorEmail('');
          setShowShareModal(false);
      } catch (err: any) {
          console.error('Share failed:', err);
          alert(err.response?.data?.message || 'Failed to share post');
      }
  };

  if (initialLoading || !isAuthenticated) {
    return <div>Loading editor...</div>;
  }

  if (postError) {
    return <div className="write-blog-layout">Error: {postError}</div>;
  }

  if (!currentPost && !isNewPost) {
    return <div className="write-blog-layout">Post not found.</div>;
  }
  
  if (currentPost?.status === 'published' && !id) {
    return <div className="write-blog-layout">Cannot edit a published post without proper context.</div>
  }

  return (
    <div className="write-blog-layout">
      <form onSubmit={formik.handleSubmit} className="write-form">
        
        <div className="write-actions">
           <span className="saving-indicator">{saveStatus}</span>
           
           {currentPost?.status !== 'published' && (
             <button type="button" className="btn-share" onClick={() => setShowShareModal(true)}>
               <Share2 size={16} /> Share
             </button>
           )}
           
           <button type="button" className="btn-draft" onClick={() => autoSave()}>Save Draft</button>
           
           <button type="submit" className="btn btn-primary publish-btn" disabled={formik.isSubmitting || currentPost?.status === 'published'}>
            {formik.isSubmitting ? 'Publishing...' : currentPost?.status === 'published' ? 'Published' : 'Publish'}
          </button>
        </div>

        <div className="write-container">
            <div className="title-input-container">
                <input
                    id="title"
                    name="title"
                    type="text"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.title}
                    className="title-input"
                    placeholder="Title"
                    autoComplete="off"
                    disabled={currentPost?.status === 'published'}
                />
                {formik.touched.title && formik.errors.title ? (
                    <div className="error-message">{formik.errors.title}</div>
                ) : null}
            </div>

             <div className="cover-image-input-container">
                <input
                    id="imageUrl"
                    name="imageUrl"
                    type="url"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.imageUrl}
                    className="cover-image-input"
                    placeholder="Add a cover image URL..."
                    disabled={currentPost?.status === 'published'}
                />
             </div>

            <div className="editor-container">
                <RichTextEditor 
                    content={formik.values.content} 
                    onChange={(html) => formik.setFieldValue('content', html)}
                    placeholder="Tell your story..."
                    readOnly={currentPost?.status === 'published'}
                />
                {formik.touched.content && formik.errors.content ? (
                    <div className="error-message">{formik.errors.content}</div>
                ) : null}
            </div>
        </div>
      </form>

      {/* Share Modal */}
      {showShareModal && currentPost && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <div className="modal-header">
                      <h2>Share Draft</h2>
                      <button className="close-btn" onClick={() => setShowShareModal(false)}>
                          <X size={24} />
                      </button>
                  </div>
                  <form onSubmit={handleShare} className="share-form">
                      <div className="share-input-group">
                          <input 
                            type="email" 
                            className="share-input" 
                            placeholder="Enter email address"
                            value={collaboratorEmail}
                            onChange={(e) => setCollaboratorEmail(e.target.value)}
                            required 
                          />
                          <select 
                            className="permission-select"
                            value={permission}
                            onChange={(e) => setPermission(e.target.value as 'edit' | 'comment' | 'view')}
                          >
                              <option value="edit">Can Edit</option>
                              <option value="comment">Can Comment</option>
                              <option value="view">Can View</option>
                          </select>
                      </div>
                      <button type="submit" className="btn btn-primary">Send Invite</button>
                  </form>
                  
                  <div className="collaborators-list">
                      <h3>Collaborators ({postCollaborators.length})</h3>
                      {postCollaborators.length > 0 ? (
                        postCollaborators.map((collab, index) => (
                            <div className="collaborator-item" key={index}>
                                <span>{collab.email}</span>
                                <span>{collab.permission}</span>
                            </div>
                        ))
                      ) : (
                        <p>No collaborators yet.</p>
                      )}
                      {user && (
                        <div className="collaborator-item">
                            <span>{user.email} (You)</span>
                            <span>author</span>
                        </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default WriteBlogPage;