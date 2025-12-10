import fs from 'fs';
import path from 'path';
import pool from '../src/config/database';

const runMigration = async () => {
  try {
    const schemaPath = path.join(__dirname, '../src/config/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('Running migration...');
    
    // Split by semicolons to run statements individually (optional, but sometimes safer)
    // For now, let's try running the whole block. 
    // Ideally, we should check if columns exist before adding, but catching error is a quick way.
    
    try {
        await pool.query(schemaSql);
        console.log('Migration completed successfully.');
    } catch (err: any) {
        // Simple error handling: if column exists, ignore.
        if (err.code === '42701') { //duplicate_column
             console.log('Columns already exist, skipping specific alterations.');
        } else {
             console.error('Migration error:', err.message);
        }
    }

  } catch (err) {
    console.error('Error reading schema file:', err);
  } finally {
    await pool.end();
  }
};

runMigration();
