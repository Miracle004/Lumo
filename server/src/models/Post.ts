import pool from '../config/database';

export interface Post {
  id: string;
  author_id: number;
  title: string | null;
  content: any; // JSONB
  cover_image_url: string | null;
  status: 'draft' | 'published';
  category: string | null;
  read_time: number | null;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
  tags?: string[];
}

export const createPost = async (authorId: number, title?: string, content?: any): Promise<Post> => {
  const result = await pool.query(
    'INSERT INTO posts (author_id, title, content) VALUES ($1, $2, $3) RETURNING *',
    [authorId, title, content]
  );
  return result.rows[0];
};

export const getPostById = async (id: string): Promise<Post | null> => {
  const result = await pool.query(
    `SELECT p.*, u.username as author_name, u.profile_picture as author_avatar,
            COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '{}') as tags
     FROM posts p
     LEFT JOIN users u ON p.author_id = u.id
     LEFT JOIN post_tags pt ON p.id = pt.post_id
     LEFT JOIN tags t ON pt.tag_id = t.id
     WHERE p.id = $1
     GROUP BY p.id, u.id`,
    [id]
  );
  return result.rows[0] || null;
};

export const updatePost = async (id: string, title?: string, content?: any, coverImageUrl?: string): Promise<Post> => {
    const result = await pool.query(
        `UPDATE posts 
         SET title = COALESCE($2, title), 
             content = COALESCE($3, content), 
             cover_image_url = COALESCE($4, cover_image_url),
             updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [id, title, content, coverImageUrl]
    );
    return result.rows[0];
};

export const getUserDrafts = async (userId: number): Promise<Post[]> => {
    const result = await pool.query(
        `SELECT * FROM posts WHERE author_id = $1 AND status = 'draft' ORDER BY updated_at DESC`,
        [userId]
    );
    return result.rows;
};

export const getSharedDrafts = async (userId: number): Promise<Post[]> => {
    const result = await pool.query(
        `SELECT p.*, u.username as author_name, pc.is_viewed, pc.permission
         FROM posts p
         JOIN post_collaborators pc ON p.id = pc.post_id
         JOIN users u ON p.author_id = u.id
         WHERE pc.user_id = $1 AND p.status = 'draft'
         ORDER BY p.updated_at DESC`,
        [userId]
    );
    return result.rows;
};

export const publishPost = async (id: string, readTime: number): Promise<Post> => {
    const result = await pool.query(
        `UPDATE posts 
         SET status = 'published', 
             published_at = NOW(), 
             read_time = $2,
             updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [id, readTime]
    );
    return result.rows[0];
};

export const deletePost = async (id: string): Promise<void> => {
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);
};

export const getPostCounts = async (userId: number): Promise<{ drafts: number; published: number }> => {
    const result = await pool.query(
        `SELECT status, COUNT(*) as count FROM posts WHERE author_id = $1 GROUP BY status`,
        [userId]
    );
    
    let drafts = 0;
    let published = 0;

    result.rows.forEach((row: any) => {
        if (row.status === 'draft') drafts = parseInt(row.count, 10);
        if (row.status === 'published') published = parseInt(row.count, 10);
    });

    return { drafts, published };
};

export const getPublishedPosts = async (limit: number = 10, offset: number = 0): Promise<Post[]> => {
    const result = await pool.query(
        `SELECT p.*, u.username as author_name, u.profile_picture as author_avatar,
                COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '{}') as tags 
         FROM posts p 
         JOIN users u ON p.author_id = u.id 
         LEFT JOIN post_tags pt ON p.id = pt.post_id
         LEFT JOIN tags t ON pt.tag_id = t.id
         WHERE status = 'published' 
         GROUP BY p.id, u.id
         ORDER BY published_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );
    return result.rows;
};

export const getUserPublishedPosts = async (userId: number): Promise<Post[]> => {
    const result = await pool.query(
        `SELECT p.*,
                COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '{}') as tags
         FROM posts p
         LEFT JOIN post_tags pt ON p.id = pt.post_id
         LEFT JOIN tags t ON pt.tag_id = t.id
         WHERE author_id = $1 AND status = 'published' 
         GROUP BY p.id
         ORDER BY published_at DESC`,
        [userId]
    );
    return result.rows;
};

export const bookmarkPost = async (userId: number, postId: string): Promise<void> => {
    await pool.query(
        'INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, postId]
    );
};

export const unbookmarkPost = async (userId: number, postId: string): Promise<void> => {
    await pool.query(
        'DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2',
        [userId, postId]
    );
};

export const getBookmarkedPosts = async (userId: number): Promise<Post[]> => {
    const result = await pool.query(
        `SELECT p.*, u.username as author_name, u.profile_picture as author_avatar,
                COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '{}') as tags
         FROM posts p
         JOIN bookmarks b ON p.id = b.post_id
         JOIN users u ON p.author_id = u.id
         LEFT JOIN post_tags pt ON p.id = pt.post_id
         LEFT JOIN tags t ON pt.tag_id = t.id
         WHERE b.user_id = $1
         GROUP BY p.id, u.id, b.created_at
         ORDER BY b.created_at DESC`,
        [userId]
    );
    return result.rows;
};

export const likePost = async (userId: number, postId: string): Promise<void> => {
    await pool.query(
        'INSERT INTO likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, postId]
    );
};

export const unlikePost = async (userId: number, postId: string): Promise<void> => {
    await pool.query(
        'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
        [userId, postId]
    );
};

export const getPostLikes = async (postId: string): Promise<number> => {
    const result = await pool.query(
        'SELECT COUNT(*) FROM likes WHERE post_id = $1',
        [postId]
    );
    return parseInt(result.rows[0].count, 10);
};

export const hasUserLikedPost = async (userId: number, postId: string): Promise<boolean> => {
    const result = await pool.query(
        'SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2',
        [userId, postId]
    );
    return (result.rowCount ?? 0) > 0;
};

export const setPostTags = async (postId: string, tags: string[]): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Remove existing associations
        await client.query('DELETE FROM post_tags WHERE post_id = $1', [postId]);

        if (tags && tags.length > 0) {
            // 2. Ensure tags exist and get IDs
            const tagIds = [];
            for (const tagName of tags) {
                const cleanedTag = tagName.trim().toLowerCase();
                if(!cleanedTag) continue;

                // Insert if not exists, return ID
                let res = await client.query('SELECT id FROM tags WHERE name = $1', [cleanedTag]);
                if (res.rows.length === 0) {
                    res = await client.query('INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id', [cleanedTag]);
                }
                tagIds.push(res.rows[0].id);
            }

            // 3. Create associations
            for (const tagId of tagIds) {
                 await client.query('INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [postId, tagId]);
            }
        }
        
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

export const getPostTags = async (postId: string): Promise<string[]> => {
    const result = await pool.query(
        `SELECT t.name 
         FROM tags t
         JOIN post_tags pt ON t.id = pt.tag_id
         WHERE pt.post_id = $1`,
        [postId]
    );
    return result.rows.map(row => row.name);
};

export const searchPosts = async (query: string): Promise<Post[]> => {
    // 1. Extract tags (e.g. #design, #art)
    const tags = (query.match(/#\w+/g) || []).map(t => t.substring(1).toLowerCase());
    
    // 2. Extract text (remove tags from query)
    const textQuery = query.replace(/#\w+/g, '').trim();
    const searchTerm = textQuery ? `%${textQuery}%` : null;

    let sql = `
        SELECT p.*, u.username as author_name, u.profile_picture as author_avatar,
               COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '{}') as tags
        FROM posts p
        JOIN users u ON p.author_id = u.id
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE p.status = 'published'
        GROUP BY p.id, u.id
    `;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Filter by text (Title OR Author)
    if (searchTerm) {
        conditions.push(`(p.title ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`);
        params.push(searchTerm);
        paramIndex++;
    }

    // Filter by tags (Must contain ALL tags specified in query)
    if (tags.length > 0) {
        // Postgres array containment operator @>
        // We cast array_agg to text[] to ensure type matching
        conditions.push(`COALESCE(array_agg(LOWER(t.name))::text[], '{}') @> $${paramIndex}::text[]`);
        params.push(tags);
        paramIndex++;
    }

    if (conditions.length > 0) {
        sql += ` HAVING ${conditions.join(' AND ')}`;
    } else {
        // If no text and no tags (e.g. empty query passed), return empty or all?
        // Controller ensures q is present. If q has no valid text/tags, return empty.
        return [];
    }

    sql += ` ORDER BY p.published_at DESC`;

    const result = await pool.query(sql, params);
    return result.rows;
};