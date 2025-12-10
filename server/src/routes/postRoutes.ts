import { Router } from 'express';
import * as PostController from '../controllers/postController';
import * as CollaborationController from '../controllers/collaborationController';
import { ensureAuthenticated } from '../middleware/auth';

const router = Router();

// --- 1. Specific Authenticated Routes (Must be before /:id) ---
// These match specific path segments like "drafts" or "bookmarks".
// If we put /:id before these, "drafts" would be treated as an :id.
router.post('/create', ensureAuthenticated, PostController.createDraft);
router.get('/drafts', ensureAuthenticated, PostController.getMyDrafts);
router.get('/stats', ensureAuthenticated, PostController.getDashboardStats);
router.get('/my-published', ensureAuthenticated, PostController.getMyPublishedPosts);
router.get('/bookmarks', ensureAuthenticated, PostController.getBookmarkedPosts);

// --- 2. Public Routes ---
router.get('/published', PostController.getPublicPosts);
// This generic route catches everything else (like UUIDs).
// Since specific keywords above are already handled, this is safe.
router.get('/:id', PostController.getPost); 

// --- 3. Authenticated Single Post Operations ---
router.post('/:id/bookmark', ensureAuthenticated, PostController.bookmarkPost);
router.delete('/:id/bookmark', ensureAuthenticated, PostController.unbookmarkPost);
router.put('/:id', ensureAuthenticated, PostController.updatePost);
router.delete('/:id', ensureAuthenticated, PostController.deletePost);
router.post('/:id/publish', ensureAuthenticated, PostController.publishPost);

// --- 4. Collaboration (Authenticated) ---
router.post('/:id/share', ensureAuthenticated, CollaborationController.sharePost);
router.get('/:id/collaborators', ensureAuthenticated, CollaborationController.getCollaborators);
router.delete('/:id/collaborators/:userId', ensureAuthenticated, CollaborationController.removeCollaborator);

export default router;
