import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import bodyParser, { json } from 'body-parser';
import session from 'express-session';
import path from 'path';
import authRoutes from './routes/authRoutes';
import postRoutes from './routes/postRoutes';
import uploadRoutes from './routes/uploadRoutes';
import pool from './config/database';
import passport from './config/passport'; // Import the configured passport
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);

// CORS Middleware
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(json({ limit: '30mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '30mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || "SOMETYPESHII", // Use env var
    resave: false,
    saveUninitialized: false, // Recommended: false
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Secure in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // 'lax' for local dev
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/", authRoutes); 
app.use("/api/posts", postRoutes);
app.use("/api/upload", uploadRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.send('Server is healthy');
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const startServer = async () => {
    try {
        // Test DB connection
        await pool.query('SELECT NOW()');
        console.log("Database connection successful");
        console.log(`DB User: ${process.env.DB_USER}`);
        console.log(`DB Host: ${process.env.DB_HOST}`);
        console.log(`DB Name: ${process.env.DB_NAME}`);

        app.listen(PORT, () => {
            console.log(`App running on PORT: ${PORT}`);
        });
    } catch(err) {
        console.error(`Error starting server ${err}`);
        process.exit(1);
    }
}

startServer();
