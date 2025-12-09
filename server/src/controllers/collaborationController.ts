import { Request, Response } from 'express';
import * as CollaboratorModel from '../models/Collaborator';
import * as PostModel from '../models/Post';
import * as UserModel from '../models/User';

export const sharePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { emails, permission } = req.body; // emails is array of strings

        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const authorId = (req.user as any).id;

        const post = await PostModel.getPostById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        if (post.author_id !== authorId) {
            return res.status(403).json({ error: 'Only the author can share this post' });
        }

        const results = [];
        const errors = [];

        for (const email of emails) {
            const user = await UserModel.findUserByEmail(email);
            if (user) {
                // Prevent sharing with self
                if (user.id === authorId) {
                    continue;
                }
                const collaborator = await CollaboratorModel.addCollaborator(id, user.id, permission, authorId);
                results.push(collaborator);
            } else {
                errors.push(`User with email ${email} not found`);
            }
        }

        res.json({ success: true, added: results, errors });

    } catch (error) {
        res.status(500).json({ error: 'Failed to share post', details: error });
    }
};

export const getCollaborators = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        const post = await PostModel.getPostById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Access check: Author or Collaborator
        let hasAccess = post.author_id === userId;
        if (!hasAccess) {
            const isCollab = await CollaboratorModel.isCollaborator(id, userId);
            if (isCollab) hasAccess = true;
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const collaborators = await CollaboratorModel.getCollaborators(id);
        const author = await UserModel.findUserById(post.author_id);

        res.json({
            author: author ? { id: author.id, username: author.username, email: author.email } : null,
            collaborators
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch collaborators', details: error });
    }
};

export const removeCollaborator = async (req: Request, res: Response) => {
    try {
        const { id, userId } = req.params; // userId to remove
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const requesterId = (req.user as any).id;

        const post = await PostModel.getPostById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        if (post.author_id !== requesterId) {
            return res.status(403).json({ error: 'Only the author can remove collaborators' });
        }

        await CollaboratorModel.removeCollaborator(id, parseInt(userId));
        res.json({ success: true, message: 'Collaborator removed' });

    } catch (error) {
        res.status(500).json({ error: 'Failed to remove collaborator', details: error });
    }
};
