import { Request, Response } from 'express';
import * as CollaboratorModel from '../models/Collaborator';
import * as UserModel from '../models/User';
import * as PostModel from '../models/Post';
import { sendInviteEmail } from '../services/emailService';
import { io } from '../server';

export const sharePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { emails, permission } = req.body; // Expect array of emails
        
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const inviterId = (req.user as any).id;
        const inviterName = (req.user as any).username;

        const post = await PostModel.getPostById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const results = [];
        for (const email of emails) {
            const user = await UserModel.findUserByEmail(email);
            if (user) {
                // Check if already collaborator
                const existing = await CollaboratorModel.isCollaborator(id, user.id);
                if (!existing) {
                    const collaborator = await CollaboratorModel.addCollaborator(id, user.id, permission, inviterId);
                    results.push(collaborator);
                    
                    // Send Email
                    // Using post.title directly might need handling if it's null
                    const postTitle = post.title || 'Untitled Draft';
                    sendInviteEmail(email, inviterName, postTitle, id);

                    // Send Real-time Notification
                    io.to(`user-${user.id}`).emit('notification', { 
                        type: 'invite', 
                        message: `You have been invited to edit "${postTitle}"`,
                        postId: id
                    });
                }
            }
        }

        res.json({ message: 'Collaborators added', added: results });
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

        const collaborators = await CollaboratorModel.getPostCollaborators(id);
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
