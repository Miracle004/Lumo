import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import { verify as localVerify } from '../controllers/userController';
import * as UserModel from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

// Local Strategy (Existing)
passport.use(new LocalStrategy(localVerify));

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0].value;
        const googleId = profile.id;
        const profilePicture = profile.photos?.[0].value;
        const displayName = profile.displayName || email?.split('@')[0] || 'User';

        if (!email) {
            return done(new Error('No email found in Google profile'));
        }

        // 1. Check if user exists by Google ID
        let user = await UserModel.findUserByGoogleId(googleId);

        if (user) {
            return done(null, user);
        }

        // 2. Check if user exists by email (if so, link account)
        user = await UserModel.findUserByEmail(email);

        if (user) {
            // Link Google ID to existing account
            user = await UserModel.updateUserGoogleId(email, googleId, profilePicture);
            return done(null, user);
        }

        // 3. Create new user
        user = await UserModel.createUser(displayName, email, undefined, googleId, 'google', profilePicture);
        return done(null, user);

    } catch (err) {
        return done(err);
    }
  }
));

// Serialization
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
    try {
        const user = await UserModel.findUserById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

export default passport;
