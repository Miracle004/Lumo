import { Request, Response } from 'express';
import * as NotificationModel from '../models/Notification';
import * as CollaboratorModel from '../models/Collaborator';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        const notifications = await NotificationModel.getUserNotifications(userId);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications', details: error });
    }
};

export const getNotificationCount = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        const count = await NotificationModel.getUnreadCount(userId);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notification count', details: error });
    }
};

export const markNotificationsRead = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;
        const { id, postId } = req.body || {}; // Optional specific ID or Post ID

        await NotificationModel.markAsRead(userId, id, postId);
        
        // Also mark legacy invites as read to clear "Shared With Me" badges
        if (!id && !postId) {
            await CollaboratorModel.markInvitesAsRead(userId);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error in markNotificationsRead:', error);
        res.status(500).json({ error: 'Failed to mark notifications read', details: error });
    }
};
