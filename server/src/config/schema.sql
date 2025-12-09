-- Add columns to users table for OAuth support
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) UNIQUE,
ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local',
ADD COLUMN profile_picture TEXT,
ALTER COLUMN password DROP NOT NULL;

-- Create posts table with draft support
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id INT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  content JSONB, -- Or TEXT if using simple storage
  cover_image_url TEXT,
  status VARCHAR(20) CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  category TEXT,
  read_time INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Create post_collaborators table
CREATE TABLE IF NOT EXISTS post_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(20) CHECK (permission IN ('edit', 'comment', 'view')),
  invited_by INT REFERENCES users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
