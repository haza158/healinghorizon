// Simple API for shared posts storage
const fs = require('fs').promises;
const path = require('path');

const POSTS_FILE = path.join(__dirname, '..', 'data', 'posts.json');

// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.dirname(POSTS_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Load posts from file
async function loadPosts() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(POSTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // File doesn't exist or is invalid, return empty array
        return [];
    }
}

// Save posts to file
async function savePosts(posts) {
    try {
        await ensureDataDir();
        await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving posts:', error);
        return false;
    }
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const posts = await loadPosts();

        if (req.method === 'GET') {
            // Get all posts
            res.status(200).json({ posts });
        } else if (req.method === 'POST') {
            // Create new post
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    const newPost = JSON.parse(body);
                    
                    // Validate required fields
                    if (!newPost.title || !newPost.content) {
                        res.status(400).json({ error: 'Title and content are required' });
                        return;
                    }

                    // Add the new post
                    posts.unshift(newPost);
                    
                    // Keep only the latest 100 posts to prevent file from getting too large
                    if (posts.length > 100) {
                        posts.splice(100);
                    }

                    const saved = await savePosts(posts);
                    if (saved) {
                        res.status(201).json({ success: true, post: newPost });
                    } else {
                        res.status(500).json({ error: 'Failed to save post' });
                    }
                } catch (error) {
                    res.status(400).json({ error: 'Invalid JSON' });
                }
            });
        } else if (req.method === 'DELETE') {
            // Delete post
            const postId = req.url.split('/').pop();
            
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    const { creator_id } = JSON.parse(body);
                    
                    const postIndex = posts.findIndex(p => p.id === postId);
                    if (postIndex === -1) {
                        res.status(404).json({ error: 'Post not found' });
                        return;
                    }

                    const post = posts[postIndex];
                    if (post.creator_id !== creator_id) {
                        res.status(403).json({ error: 'Not authorized to delete this post' });
                        return;
                    }

                    posts.splice(postIndex, 1);
                    const saved = await savePosts(posts);
                    
                    if (saved) {
                        res.status(200).json({ success: true });
                    } else {
                        res.status(500).json({ error: 'Failed to delete post' });
                    }
                } catch (error) {
                    res.status(400).json({ error: 'Invalid request' });
                }
            });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};