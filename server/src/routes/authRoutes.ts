import { Router } from "express";
import { 
    createUser, 
    updateProfile,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowStatus,
    getFollowCounts,
    getPublicProfile
} from "../controllers/userController";
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
        
        // Prepare Frontend URL
        let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        if (frontendUrl.endsWith('/')) {
            frontendUrl = frontendUrl.slice(0, -1);
        }
        const targetUrl = `${frontendUrl}/dashboard`;

        // Serve an HTML page to break the "bounce tracking" chain
        // This requires user interaction (or at least a client-side navigation) which browsers trust more than a 302 redirect
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Login Successful</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #121212;
                        color: #ffffff;
                        margin: 0;
                    }
                    .container {
                        text-align: center;
                        background-color: #1e1e1e;
                        padding: 2rem;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    }
                    h2 { margin-bottom: 1rem; }
                    p { margin-bottom: 2rem; color: #b3b3b3; }
                    .btn {
                        background-color: #4CAF50;
                        color: white;
                        padding: 10px 20px;
                        text-decoration: none;
                        border-radius: 4px;
                        font-weight: bold;
                        transition: background-color 0.3s;
                    }
                    .btn:hover { background-color: #45a049; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Login Successful!</h2>
                    <p>Click the button below if you are not automatically redirected.</p>
                    <a href="${targetUrl}" class="btn" id="continueBtn">Continue to Dashboard</a>
                </div>
                <script>
                    // Attempt auto-redirect after a short delay
                    setTimeout(() => {
                        document.getElementById('continueBtn').click();
                    }, 1000);
                </script>
            </body>
            </html>
        `;
        
        res.send(html);
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

// Follow/Unfollow
router.post('/user/:id/follow', (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    followUser(req, res);
});
router.delete('/user/:id/follow', (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    unfollowUser(req, res);
});

// User Social Graph
router.get('/user/:id/followers', getFollowers);
router.get('/user/:id/following', getFollowing);
router.get('/user/:id/follow-status', getFollowStatus);
router.get('/user/:id/follow-counts', getFollowCounts);
router.get('/user/:id/profile', getPublicProfile);

export default router;