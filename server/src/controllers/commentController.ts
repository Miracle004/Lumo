import { Request, Response } from 'express';
import * as CommentModel from '../models/Comment';
import * as PostModel from '../models/Post';
import * as CollaboratorModel from '../models/Collaborator';
import * as NotificationModel from '../models/Notification'; // Import NotificationModel
import { io } from '../server'; // Import Socket.IO instance

export const addComment = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;
        const username = (req.user as any).username;
        const { id: postId } = req.params; // Post ID
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Comment content cannot be empty' });
        }

        const post = await PostModel.getPostById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Check if user is author
        const isAuthor = post.author_id === userId;

        // Check permission
        let canComment = isAuthor;
        
        if (post.status === 'published') {
            canComment = true;
        } else if (!isAuthor) {
            const collaborator = await CollaboratorModel.isCollaborator(postId, userId);
            if (collaborator && (collaborator.permission === 'comment' || collaborator.permission === 'edit')) {
                canComment = true;
            }
        }

        if (!canComment) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to comment on this post' });
        }

        const newComment = await CommentModel.createComment(postId, userId, content);
        
        // Fetch full comment details (username, avatar) to send via socket
        const fullComment = await CommentModel.getCommentById(newComment.id);
        
        // Emit real-time event to the post room (for live comment updates)
        io.to(`post-${postId}`).emit('new-comment', fullComment);

        // --- Notification Logic ---
        // If the commenter is NOT the author, notify the author
        if (!isAuthor) {
            const message = `${username} commented on your draft "${post.title || 'Untitled'}"`;
            const notification = await NotificationModel.createNotification(
                post.author_id, // Target: Post Author
                userId,         // Actor: Commenter
                postId,
                'comment',
                message
            );
            
            // Emit real-time notification to the author's private room
            io.to(`user-${post.author_id}`).emit('new-notification', notification);
        }

        res.status(201).json(fullComment); // Return full comment

    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment', details: error });
    }
};

export const getComments = async (req: Request, res: Response) => {
    try {
        const { id: postId } = req.params; // Post ID

        const post = await PostModel.getPostById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const userId = req.user ? (req.user as any).id : null;
        const isAuthor = userId && post.author_id === userId;

        // Access Control
        if (post.status !== 'published') {
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            let isCollaborator = isAuthor;
            
            if (!isAuthor) {
                const collaborator = await CollaboratorModel.isCollaborator(postId, userId);
                if (collaborator) {
                    isCollaborator = true;
                }
            }
            
            if (!isCollaborator) {
                return res.status(403).json({ error: 'Forbidden: You do not have access to comments for this post' });
            }
        }

        let comments: CommentModel.Comment[];
        if (post.status === 'published' || isAuthor) {
            // Author sees all comments, and everyone sees all comments on published posts
            comments = await CommentModel.getPostComments(postId);
        } else {
            // Collaborator sees only their own comments on drafts
            comments = await CommentModel.getUserCommentsOnPost(postId, userId);
        }
        
        res.json(comments);

    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments', details: error });
    }
};

export const deleteComment = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;
        const { commentId } = req.params;

        const comment = await CommentModel.getCommentById(parseInt(commentId));
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        const post = await PostModel.getPostById(comment.post_id);
        if (!post) return res.status(404).json({ error: 'Post not found for comment' }); // Should not happen if FK is good

        // Check if user is post author or the original commenter
        const canDelete = (post.author_id === userId) || (comment.user_id === userId);

        if (!canDelete) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this comment' });
        }

        await CommentModel.deleteComment(comment.id);
        res.json({ message: 'Comment deleted successfully' });

    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment', details: error });
    }
};