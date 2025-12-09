import { Request, Response, NextFunction } from 'express';

export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized', message: 'Please log in to access this resource' });
};

// These will be fully implemented once we have the Post controller/model logic hooked up more deeply
// for checking ownership/collaboration status.
export const canAccessPost = async (req: Request, res: Response, next: NextFunction) => {
    // Logic: If published -> allow. If draft -> check author or collaborator.
    // For now, just ensure authenticated for drafts (we'll refine this in PostController or here)
    if (req.isAuthenticated()) {
        return next();
    }
    // If we want to allow public access to published posts, we need to fetch the post first.
    // We'll leave this generic for now and handle specific logic in the controller or enhance this middleware
    // to fetch the post.
    next();
};

export const canEditPost = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
};
