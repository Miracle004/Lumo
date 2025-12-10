import { Router } from "express";
import { createUser, updateProfile } from "../controllers/userController";
import passport from "passport";
import { Request, Response, NextFunction } from "express";

// Type definition for User in Express Request (augmented by Passport)
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      profile_picture?: string;
      bio?: string; // Add bio to Express.User interface
    }
  }
}

const router = Router();

// Local Signup
router.post("/user/signup", createUser);

// Local Login
router.post("/user/login", (req, res, next) => {
  passport.authenticate(
    "local",
    (err: Error | null, user: Express.User | false, info: { message?: string }) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({
            success: false,
            message: info?.message ?? "Authentication failed",
        });
      }
      req.logIn(user, (err: Error | null) => {
        if (err) return next(err);
        return res.json({ 
            success: true, 
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.profile_picture, // Map to avatar for frontend consistency
                bio: user.bio // Include bio
            } 
        });
      });
    }
  )(req, res, next);
});

// Google OAuth Login
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth Callback
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
  (req, res) => {
    // Successful authentication
    // Explicitly save session before redirecting to ensure cookie is set
    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.redirect('/login?error=session_save_failed');
        }
        // Redirect to frontend dashboard
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/dashboard`);
    });
  }
);

// Logout
router.get('/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Check Auth Status (useful for frontend to restore session)
router.get('/auth/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ isAuthenticated: true, user: req.user });
    } else {
        res.json({ isAuthenticated: false, user: null });
    }
});

// Update User Profile
router.put('/user/profile', (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    updateProfile(req, res);
});

export default router;