import { Request, Response } from 'express';
import * as PostModel from '../models/Post';
import * as CollaboratorModel from '../models/Collaborator';

export const createDraft = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { title, content, tags } = req.body;
        const authorId = (req.user as any).id;

        const post = await PostModel.createPost(authorId, title, content);

        if (tags && Array.isArray(tags)) {
            await PostModel.setPostTags(post.id, tags);
            post.tags = tags;
        }

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
        const { title, content, coverImageUrl, tags } = req.body;
        
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

        if (tags && Array.isArray(tags)) {
            await PostModel.setPostTags(id, tags);
            updatedPost.tags = tags;
        }

        res.json(updatedPost);

    } catch (error) {
        res.status(500).json({ error: 'Failed to update post', details: error });
    }
};

export const deletePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        const post = await PostModel.getPostById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        if (post.author_id !== userId) {
            return res.status(403).json({ error: 'Forbidden: You can only delete your own posts' });
        }

        await PostModel.deletePost(id);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete post', details: error });
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        const stats = await PostModel.getPostCounts(userId);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error });
    }
};

// Helper to extract text from TipTap JSON
const extractTextFromTipTap = (node: any): string => {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (node.type === 'text' && node.text) return node.text;
    if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractTextFromTipTap).join(' ');
    }
    return '';
};

export const publishPost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        const post = await PostModel.getPostById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        if (post.author_id !== userId) {
            const username = (req.user as any).username || 'User';
            return res.status(403).json({ error: `${username} does not have permission to publish this blog` });
        }

        let wordCount = 0;
        if (typeof post.content === 'string') {
            // Strip HTML tags for accurate word count
            const textContent = post.content.replace(/<[^>]*>/g, ' ');
            wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
        } else if (post.content && typeof post.content === 'object') {
             // Proper TipTap text extraction
             const textContent = extractTextFromTipTap(post.content);
             wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
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
        const filter = req.query.filter as string;

        let posts;
        if (filter === 'Trending') {
            posts = await PostModel.getTrendingPosts(limit);
        } else {
            posts = await PostModel.getPublishedPosts(limit, offset);
        }
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

export const toggleLike = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;
        const { id } = req.params;

        const isLiked = await PostModel.hasUserLikedPost(userId, id);

        if (isLiked) {
            await PostModel.unlikePost(userId, id);
        } else {
            await PostModel.likePost(userId, id);
        }

        const newCount = await PostModel.getPostLikes(id);
        res.json({ success: true, isLiked: !isLiked, count: newCount });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle like', details: error });
    }
};

export const getPostLikeStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user ? (req.user as any).id : null;

        const count = await PostModel.getPostLikes(id);
        let isLiked = false;

        if (userId) {
            isLiked = await PostModel.hasUserLikedPost(userId, id);
        }

        res.json({ count, isLiked });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch like status', details: error });
    }
};

export const searchPosts = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const posts = await PostModel.searchPosts(q);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search posts', details: error });
    }
};
