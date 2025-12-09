import { Request, Response } from 'express';
import * as PostModel from '../models/Post';
import * as CollaboratorModel from '../models/Collaborator';

export const createDraft = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { title, content } = req.body;
        const authorId = (req.user as any).id;

        const post = await PostModel.createPost(authorId, title, content);
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create draft', details: error });
    }
};

export const getMyDrafts = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        const myDrafts = await PostModel.getUserDrafts(userId);
        const sharedWithMe = await PostModel.getSharedDrafts(userId);

        res.json({ myDrafts, sharedWithMe });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch drafts', details: error });
    }
};

export const getMyPublishedPosts = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        const posts = await PostModel.getUserPublishedPosts(userId);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch published posts', details: error });
    }
};

export const getPost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const post = await PostModel.getPostById(id);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Authorization check
        if (post.status === 'published') {
            return res.json(post);
        }

        // If draft, must be author or collaborator
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        if (post.author_id === userId) {
            return res.json(post);
        }

        const isCollab = await CollaboratorModel.isCollaborator(id, userId);
        if (isCollab) {
            return res.json(post);
        }

        return res.status(403).json({ error: 'Forbidden: You do not have access to this draft' });

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch post', details: error });
    }
};

export const updatePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, content, coverImageUrl } = req.body;
        
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        const post = await PostModel.getPostById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Check permission (Author or Edit Collaborator)
        const isAuthor = post.author_id === userId;
        let canEdit = isAuthor;

        if (!isAuthor) {
            const collaborator = await CollaboratorModel.isCollaborator(id, userId);
            if (collaborator && collaborator.permission === 'edit') {
                canEdit = true;
            }
        }

        if (!canEdit) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to edit this post' });
        }

        const updatedPost = await PostModel.updatePost(id, title, content, coverImageUrl);
        res.json(updatedPost);

    } catch (error) {
        res.status(500).json({ error: 'Failed to update post', details: error });
    }
};

export const publishPost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        const post = await PostModel.getPostById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        if (post.author_id !== userId) {
            return res.status(403).json({ error: 'Only the author can publish this post' });
        }

        // Calculate read time (simple approximation: 200 words per minute)
        // Assuming content is string or has a text field. 
        // If content is JSON (Draft.js/TipTap), we need to extract text.
        // For now, assuming simple calculation or default.
        let wordCount = 0;
        if (typeof post.content === 'string') {
            // Strip HTML tags for accurate word count
            const textContent = post.content.replace(/<[^>]*>/g, ' ');
            wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
        } else if (post.content && typeof post.content === 'object') {
             // Basic JSON handling (e.g. TipTap text extraction placeholder)
             wordCount = JSON.stringify(post.content).split(/\s+/).length; 
        }
        
        // Average reading speed: 200 words per minute
        const readTime = Math.ceil(wordCount / 200) || 1;

        const publishedPost = await PostModel.publishPost(id, readTime);
        res.json(publishedPost);

    } catch (error) {
        res.status(500).json({ error: 'Failed to publish post', details: error });
    }
};

export const getPublicPosts = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const posts = await PostModel.getPublishedPosts(limit, offset);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch posts', details: error });
    }
};

export const bookmarkPost = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;
        const { id } = req.params;

        await PostModel.bookmarkPost(userId, id);
        res.json({ success: true, message: 'Post bookmarked' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to bookmark post', details: error });
    }
};

export const unbookmarkPost = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;
        const { id } = req.params;

        await PostModel.unbookmarkPost(userId, id);
        res.json({ success: true, message: 'Post unbookmarked' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to unbookmark post', details: error });
    }
};

export const getBookmarkedPosts = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        const bookmarks = await PostModel.getBookmarkedPosts(userId);
        res.json(bookmarks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookmarks', details: error });
    }
};
