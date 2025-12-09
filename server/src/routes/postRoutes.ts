import { Router } from 'express';
import * as PostController from '../controllers/postController';
import * as CollaborationController from '../controllers/collaborationController';
import { ensureAuthenticated } from '../middleware/auth';

const router = Router();

// Public Routes
router.get('/published', PostController.getPublicPosts);

// Protected Routes
router.use(ensureAuthenticated);

// Drafts
router.post('/create', PostController.createDraft);
router.get('/drafts', PostController.getMyDrafts);
router.get('/my-published', PostController.getMyPublishedPosts);
router.get('/bookmarks', PostController.getBookmarkedPosts);

// Single Post Operations
router.post('/:id/bookmark', PostController.bookmarkPost);
router.delete('/:id/bookmark', PostController.unbookmarkPost);
router.get('/:id', PostController.getPost);
router.put('/:id', PostController.updatePost);
router.post('/:id/publish', PostController.publishPost);

// Collaboration
router.post('/:id/share', CollaborationController.sharePost);
router.get('/:id/collaborators', CollaborationController.getCollaborators);
router.delete('/:id/collaborators/:userId', CollaborationController.removeCollaborator);

export default router;
