import { Pool } from "pg";
import dotenv from 'dotenv'

dotenv.config();

const rawUrl = process.env.DATABASE_URL;
if(!rawUrl){
    throw new Error('DATABASE_URL is missing!');
}
const dbUrl = new URL(rawUrl);

// Remove sslmode from query params to let pg config handle it
dbUrl.searchParams.delete('sslmode');

// The string representation will now handle the ? and & correctly
const finalConnectionString = dbUrl.toString();

const pool = new Pool({
    // host: process.env.DB_HOST,
    // port: parseInt(process.env.DB_PORT || '5432'),
    // user: process.env.DB_USER,
    // password: process.env.DB_PASSWORD,
    // database: process.env.DB_NAME,
    connectionString: finalConnectionString,
    ssl: { rejectUnauthorized: false }
});

pool.on("connect", () =>{
    console.log('Database connected successfully');
})

pool.on("error", (err) => {
    console.error(`Unexpected db error: ${err}`);
    process.exit(-1);
}) 

export default pool;    