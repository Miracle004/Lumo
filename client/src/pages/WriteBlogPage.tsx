import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useParams, useNavigate } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor/RichTextEditor';
import { Share2, X, Image as ImageIcon, MessageSquare, Trash2, Tag } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext'; // Import useNotification
import { io } from 'socket.io-client';
import { uploadImage } from '../services/uploadService';
import { toastService } from '../services/toastService';
import './WriteBlogPage.css';

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
  content: string;
  cover_image_url?: string;
  status: 'draft' | 'published';
  author_id: number; // Corrected to number to match backend
  tags?: string[];
}

interface Collaborator {
  user_id: string;
  username: string;
  email: string;
  permission: 'edit' | 'comment' | 'view';
}

interface Comment {
  id: number;
  post_id: string;
  user_id: string; // Assuming user_id from backend is string UUID now
  content: string;
  is_resolved: boolean;
  created_at: string; // Date string
  username: string;
  user_email: string;
  avatar?: string;
}

const WriteBlogPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { fetchCount } = useNotification(); // Get fetchCount to update badge
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Error' | ''>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [permission, setPermission] = useState<'edit' | 'comment' | 'view'>('edit');
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [postCollaborators, setPostCollaborators] = useState<Collaborator[]>([]);
  const [isNewPost, setIsNewPost] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [postError, setPostError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState('');

  // Viewers AND Commenters should not be able to edit the main content.
  const isViewerOrCommenter = user ? postCollaborators.some(c => c.user_id === user.id && (c.permission === 'view' || c.permission === 'comment')) : false;
  const isReadOnly = (currentPost?.status === 'published') || isViewerOrCommenter;
  
  // Determine current user's permission
  let currentUserPermission: 'author' | 'edit' | 'comment' | 'view' | 'none' = 'none';
  if (user && currentPost) {
    if (String(user.id) === String(currentPost.author_id)) { // Ensure string comparison
      currentUserPermission = 'author';
    } else {
      const collab = postCollaborators.find(c => String(c.user_id) === String(user.id)); // Ensure string comparison
      if (collab) {
        currentUserPermission = collab.permission;
      }
    }
  }

  // Determine if the current user can comment (author, or collaborator with edit/comment permission)
  const canUserComment = user && (
    (currentPost && String(user.id) === String(currentPost.author_id)) || // Corrected: Check author_id
    postCollaborators.some(c => String(c.user_id) === String(user.id) && (c.permission === 'comment' || c.permission === 'edit'))
  );

  // Mark specific post notifications as read when opening the post
  useEffect(() => {
     if (id && isAuthenticated) {
         axios.post('/api/notifications/mark-read', { postId: id })
           .then(() => fetchCount())
           .catch(err => console.error('Failed to mark notifications as read', err));
     }
  }, [id, isAuthenticated, fetchCount]);

  const formik = useFormik({
    initialValues: {
      title: currentPost?.title || '',
      content: currentPost?.content || '',
      imageUrl: currentPost?.cover_image_url || '',
      tags: currentPost?.tags || [],
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      title: Yup.string().max(100, 'Must be 100 characters or less').required('Required'),
      content: Yup.string().min(20, 'Must be at least 20 characters').required('Required'),
      imageUrl: Yup.string().nullable(), // Removed .url() validation temporarily
      tags: Yup.array().of(Yup.string()),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        if (!id) {
            return;
        }

        // Save first to ensure latest content is published
        setSaveStatus('Saving...');
        await axios.put(`/api/posts/${id}`, {
            title: values.title,
            content: values.content,
            coverImageUrl: values.imageUrl,
            tags: values.tags,
        });
        setSaveStatus('Saved');

        // Then Publish
        await axios.post(`/api/posts/${id}/publish`);
        toastService.success('Published successfully!');
        navigate(`/read/${id}`);
      } catch (err) {
        console.error('Publish failed:', err);
        setSaveStatus('Error');
        const errorMsg = axios.isAxiosError(err) ? err.response?.data?.error || err.response?.data?.message : 'Failed to publish post';
        // Do not setPostError here, just toast. This keeps the user on the editor.
        toastService.error(errorMsg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Debugging log
  useEffect(() => {
    console.log('Formik Values:', formik.values);
    console.log('Formik Errors:', formik.errors);
  }, [formik.values, formik.errors]);

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
          const url = await uploadImage(file);
          if (url) {
              formik.setFieldValue('imageUrl', url);
          }
      } catch (error) {
          console.error('Failed to upload cover image:', error);
          toastService.error('Failed to upload cover image. Please try again.');
      } finally {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
  };

  const fetchComments = useCallback(async (postId: string) => {
    try {
      const response = await axios.get(`/api/posts/${postId}/comments`);
      setComments(response.data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      toastService.error('Failed to fetch comments.');
    }
  }, []);

  const handleAddComment = async () => {
    if (!id || !newCommentContent.trim()) {
      toastService.error('Comment cannot be empty.');
      return;
    }
    try {
      const response = await axios.post(`/api/posts/${id}/comments`, { content: newCommentContent });
      setComments(prev => [response.data, ...prev]);
      setNewCommentContent('');
      toastService.success('Comment added!');
    } catch (err) {
      console.error('Failed to add comment:', err);
      const errorMsg = axios.isAxiosError(err) ? err.response?.data?.error : 'Failed to add comment.';
      toastService.error(errorMsg);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!id) return;
    try {
      await axios.delete(`/api/posts/${id}/comments/${commentId}`);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      toastService.success('Comment deleted!');
    } catch (err) {
      console.error('Failed to delete comment:', err);
      const errorMsg = axios.isAxiosError(err) ? err.response?.data?.error : 'Failed to delete comment.';
      toastService.error(errorMsg);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadPostAndComments = async () => { // Renamed to reflect comment fetching
      if (!isAuthenticated) return;

      if (id) {
        try {
          const response = await axios.get(`/api/posts/${id}`);
          // Ensure response.data has author_id. The interface expects it now.
          setCurrentPost(response.data);
          formik.setValues({
            title: response.data.title || '',
            content: response.data.content || '',
            imageUrl: fixImageUrl(response.data.cover_image_url) || '',
            tags: response.data.tags || [],
          });
          setIsNewPost(false);
          const collabResponse = await axios.get(`/api/posts/${id}/collaborators`);
          setPostCollaborators(collabResponse.data.collaborators);
          fetchComments(id); // Fetch comments here
        } catch (err) {
          console.error('Failed to fetch post:', err);
          const errorMsg = axios.isAxiosError(err) ? (err.response?.data?.message || 'Failed to load post') : 'Failed to load post';
          
          if (axios.isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 404)) {
             navigate('/404');
             return; // Stop further execution/rendering logic related to error
          }
          
          setPostError(errorMsg);
          toastService.error(errorMsg);
        } finally {
          setInitialLoading(false);
        }
      } else {
        // New Post - Don't create on DB yet. Wait for user input.
        setIsNewPost(true);
        setInitialLoading(false);
        // Formik initialValues are already empty strings, which is correct for new post.
      }
    };

    loadPostAndComments();
  }, [id, isAuthenticated, navigate, fetchComments]); // Added fetchComments to dependencies

  // Socket listener for new comments
  useEffect(() => {
    if (!id) return;
    
    // Connect to the specific post room
    const socket = io(import.meta.env.VITE_API_BASE_URL);
    
    socket.emit('join-post', id);

    socket.on('new-comment', (newComment: Comment) => {
        // ... previous logic ...
        
        // Prevent duplication: If I wrote this comment, handleAddComment already added it.
        // Don't add it again via socket.
        if (user && String(newComment.user_id) === String(user.id)) {
            return;
        }
        
        setComments(prev => {
            if (prev.find(c => c.id === newComment.id)) return prev;
            return [newComment, ...prev];
        });
        
        // If we received a new comment, it likely generated a notification for us (if we are author).
        // Fetch count to update badge.
        // Wait, 'new-comment' event is for the post room. 'new-notification' is for user room.
        // NotificationContext handles 'new-notification'.
        // So we don't need to do anything here for the badge count itself, 
        // BUT if we are ON the page reading the comment, we should probably mark it as read immediately?
        // Or just let the user see the badge increment?
        // User said: "even though i have read the comment... notification count keeps increasing".
        // This implies if I am ON the page, it should probably NOT increase or auto-mark read.
    });

    return () => {
        socket.emit('leave-post', id);
        socket.disconnect();
    };
  }, [id, user]); // Re-run if ID or user changes

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          const val = e.currentTarget.value.trim();
          if (val && !formik.values.tags.includes(val)) {
              if (formik.values.tags.length >= 5) {
                  toastService.warn('Max 5 tags allowed.');
                  return;
              }
              formik.setFieldValue('tags', [...formik.values.tags, val]);
              e.currentTarget.value = '';
          }
      }
  };

  const removeTag = (tagToRemove: string) => {
      formik.setFieldValue('tags', formik.values.tags.filter((t: string) => t !== tagToRemove));
  };

  const autoSave = useCallback(async () => {
    // Only save if dirty and not loading. 
    // If it's a new post (no ID), we still want to save (create) if dirty.
    if (!formik.dirty || initialLoading || (currentPost && currentPost.status === 'published')) return;

    setSaveStatus('Saving...');
    try {
      if (!id) {
          // First save: Create the post
          const response = await axios.post('/api/posts/create', {
            title: formik.values.title,
            content: formik.values.content,
            tags: formik.values.tags,
          });
          const newPost = response.data;
          setCurrentPost(newPost);
          setSaveStatus('Saved');
          // Update URL without reloading
          navigate(`/write/${newPost.id}`, { replace: true });
          
          // Future updates will have 'id' and fall into the 'else' block
      } else {
          // Subsequent saves: Update existing
          const updatedPost = {
            title: formik.values.title,
            content: formik.values.content,
            coverImageUrl: formik.values.imageUrl,
            tags: formik.values.tags,
          };
          const response = await axios.put(`/api/posts/${id}`, updatedPost);
          setCurrentPost(response.data);
          setSaveStatus('Saved');
      }
      
      // Reset dirty state slightly so we don't save again immediately unless user types more?
      // Formik's resetForm clears dirty, but we might want to keep the values.
      // formik.resetForm({ values: formik.values }); // This sets dirty to false.
    } catch (err) {
      console.error('Auto-save failed:', err);
      setSaveStatus('Error');
    }
  }, [id, currentPost, formik.values, formik.dirty, initialLoading, navigate]);

  useEffect(() => {
    // Only start timer if form is dirty
    if (!formik.dirty) return;

    const timer = setTimeout(() => {
      autoSave();
    }, 3000);

    return () => clearTimeout(timer);
  }, [autoSave, formik.dirty]);


  const handleShare = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!id) return;
      try {
          const response = await axios.post(`/api/posts/${id}/share`, {
              emails: [collaboratorEmail],
              permission: permission,
          });
          toastService.success(`Shared with ${response.data.added.length ? collaboratorEmail : 'no one'}!`);
          if (response.data.added.length) {
            const collabResponse = await axios.get(`/api/posts/${id}/collaborators`);
            setPostCollaborators(collabResponse.data.collaborators);
          }
          setCollaboratorEmail('');
          setShowShareModal(false);
      } catch (err) {
          console.error('Share failed:', err);
          const errorMsg = axios.isAxiosError(err) ? (err.response?.data?.message || 'Failed to share post') : 'Failed to share post';
          toastService.error(errorMsg);
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
           {currentUserPermission !== 'none' && (
             <span className="user-permission-tag">Your Role: {currentUserPermission.charAt(0).toUpperCase() + currentUserPermission.slice(1)}</span>
           )}
           
           {!isReadOnly && (
             <button type="button" className="btn-share" onClick={() => setShowShareModal(true)}>
               <Share2 size={16} /> Share
             </button>
           )}
           
           <button type="button" className="btn-draft" onClick={() => autoSave()} disabled={isReadOnly}>Save Draft</button>
           
           <button type="submit" className="btn btn-primary publish-btn" disabled={formik.isSubmitting || isReadOnly}>
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
                    disabled={isReadOnly}
                />
                {formik.touched.title && formik.errors.title ? (
                    <div className="error-message">{formik.errors.title}</div>
                ) : null}
            </div>

             <div className="cover-image-input-container">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleCoverImageUpload} 
                    style={{ display: 'none' }} 
                    accept="image/*"
                />
                {!formik.values.imageUrl ? (
                    <button 
                        type="button" 
                        className="add-cover-btn" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isReadOnly}
                    >
                        <ImageIcon size={20} /> Add Cover Image
                    </button>
                ) : (
                    <div className="cover-image-preview">
                        <img src={fixImageUrl(formik.values.imageUrl)} alt="Cover" />
                        {!isReadOnly && (
                            <button 
                                type="button" 
                                className="remove-cover-btn"
                                onClick={() => formik.setFieldValue('imageUrl', '')}
                            >
                                <X size={16} /> Remove
                            </button>
                        )}
                    </div>
                )}
             </div>

             <div className="tags-input-container">
                <div className="tags-list">
                    {formik.values.tags && formik.values.tags.map((tag: string) => (
                        <span key={tag} className="tag-chip">
                            #{tag}
                            <button type="button" onClick={() => removeTag(tag)} disabled={isReadOnly}><X size={12} /></button>
                        </span>
                    ))}
                </div>
                <div className="tag-input-wrapper">
                    <Tag size={18} className="tag-icon" />
                    <input 
                        type="text" 
                        placeholder="Add a tag... (Press Enter)" 
                        onKeyDown={handleTagKeyDown} 
                        disabled={isReadOnly}
                        className="tag-input"
                    />
                </div>
             </div>

            <div className="editor-container">
                <RichTextEditor 
                    content={formik.values.content} 
                    onChange={(html) => formik.setFieldValue('content', html)}
                    placeholder="Tell your story..."
                    editable={!isReadOnly}
                />
                {formik.touched.content && formik.errors.content ? (
                    <div className="error-message">{formik.errors.content}</div>
                ) : null}
            </div>
        </div>
      </form>

      {/* Comments Section */}
      {id && canUserComment && (
        <div className="comments-section">
          <h3>Comments <MessageSquare size={16} /></h3>
          <div className="comment-input-area">
            <textarea
              placeholder="Add a comment..."
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
            ></textarea>
            <button className="btn btn-primary" onClick={handleAddComment}>Add Comment</button>
          </div>

          <div className="comments-list">
            {comments.filter(comment => {
                // Visibility Logic:
                // 1. If I am the Post Author, I see everything.
                // 2. If I am the Comment Author, I see my own comment.
                // 3. Otherwise, hidden.
                if (!user || !currentPost) return false;
                
                const amIPostAuthor = String(user.id) === String(currentPost.author_id);
                const isMyComment = String(comment.user_id) === String(user.id); 
                
                return amIPostAuthor || isMyComment;
            }).length > 0 ? (
              comments.filter(comment => {
                 if (!user || !currentPost) return false;
                 const amIPostAuthor = String(user.id) === String(currentPost.author_id);
                 const isMyComment = String(comment.user_id) === String(user.id); 
                 return amIPostAuthor || isMyComment;
              }).map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-meta">
                    <strong>{comment.username}</strong>
                    <span>{new Date(comment.created_at).toLocaleString()}</span>
                    {user?.id === comment.user_id && (
                      <button className="delete-comment-btn" onClick={() => handleDeleteComment(comment.id)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="comment-content">{comment.content}</p>
                </div>
              ))
            ) : (
              <p>No comments yet.</p>
            )}
          </div>
        </div>
      )}

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