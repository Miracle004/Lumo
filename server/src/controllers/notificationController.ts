import { Request, Response } from 'express';
import * as CollaboratorModel from '../models/Collaborator';

export const getNotificationCount = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        const count = await CollaboratorModel.getUnreadInviteCount(userId);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notification count', details: error });
    }
};

export const markNotificationsRead = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = (req.user as any).id;

        await CollaboratorModel.markInvitesAsRead(userId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark notifications read', details: error });
    }
};
