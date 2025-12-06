import dotenv from 'dotenv'
import express, { Request, Response, NextFunction, ErrorRequestHandler, Errback } from 'express';
import bodyParser, { json } from 'body-parser';
import session from 'express-session';
import routes from './routes/signupRoute';
import pool from './config/database';
import passport from 'passport'
import { Strategy } from 'passport-local'
import { verify } from './controllers/userController';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());
app.use(bodyParser.urlencoded({extended: true}));

// Session middleware
app.use(session({
    secret: "SOMETYPESHII",
    resave: false,
    saveUninitialized: true
}))

// Passport setup
passport.use(new Strategy(verify));

passport.serializeUser((user: any, cb) => {
    cb(null, user);
});

passport.deserializeUser(async (id: number, cb) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT id, username, email FROM users where id = $1', [id]);
            if(result.rows.length === 0)
                return cb(null, false);
            cb(null, result.rows[0]);
        } finally {
            client.release();
        }
    } catch(err) {
        cb(err);
    }
});

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api", routes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});


const startServer = async () => {
    try {
        // Test DB connection
        await pool.query('SELECT NOW()');
        console.log("Database connection successful");

        app.listen(PORT, () => {
            console.log(`App running on PORT: ${PORT}`);
        });
    } catch(err) {
        console.error(`Error starting server ${err}`);
        process.exit(1);
    }
}

startServer();