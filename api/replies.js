// API for handling replies
const fs = require('fs').promises;
const path = require('path');

const POSTS_FILE = path.join(__dirname, '..', 'data', 'posts.json');

// Load posts from file
async function loadPosts() {
    try {
        const data = await fs.readFile(POSTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Save posts to file
async function savePosts(posts) {
    try {
        const dataDir = path.dirname(POSTS_FILE);
        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving posts:', error);
        return false;
    }
}

module.exports = async (req, res) => {
    console.log(`💬 Reply API Request: ${req.method} ${req.url}`);
    
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
        const urlParts = req.url.split('/');
        const postId = req.params.postId || urlParts[urlParts.indexOf('posts') + 1];
        
        console.log(`🔍 Looking for post: ${postId}`);
        
        const post = posts.find(p => p.id === postId);
        if (!post) {
            console.log('❌ Post not found');
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        if (req.method === 'POST') {
            // Add reply to post
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    const newReply = JSON.parse(body);
                    console.log('💬 Adding reply to post:', post.title);
                    
                    if (!newReply.content) {
                        res.status(400).json({ error: 'Content is required' });
                        return;
                    }

                    if (!post.replies) {
                        post.replies = [];
                    }
                    
                    post.replies.push(newReply);
                    
                    const saved = await savePosts(posts);
                    if (saved) {
                        console.log('✅ Reply saved successfully');
                        res.status(201).json({ success: true, reply: newReply });
                    } else {
                        console.log('❌ Failed to save reply');
                        res.status(500).json({ error: 'Failed to save reply' });
                    }
                } catch (error) {
                    console.log('❌ Invalid JSON:', error);
                    res.status(400).json({ error: 'Invalid JSON' });
                }
            });
        } else if (req.method === 'DELETE') {
            // Delete reply
            const replyId = req.params.replyId || urlParts[urlParts.length - 1];
            console.log('🗑️ Deleting reply:', replyId);
            
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    const { creator_id } = JSON.parse(body);
                    
                    if (!post.replies) {
                        res.status(404).json({ error: 'Reply not found' });
                        return;
                    }

                    const replyIndex = post.replies.findIndex(r => r.id === replyId);
                    if (replyIndex === -1) {
                        res.status(404).json({ error: 'Reply not found' });
                        return;
                    }

                    const reply = post.replies[replyIndex];
                    if (reply.creator_id !== creator_id) {
                        res.status(403).json({ error: 'Not authorized to delete this reply' });
                        return;
                    }

                    post.replies.splice(replyIndex, 1);
                    const saved = await savePosts(posts);
                    
                    if (saved) {
                        console.log('✅ Reply deleted successfully');
                        res.status(200).json({ success: true });
                    } else {
                        console.log('❌ Failed to delete reply');
                        res.status(500).json({ error: 'Failed to delete reply' });
                    }
                } catch (error) {
                    console.log('❌ Invalid delete request:', error);
                    res.status(400).json({ error: 'Invalid request' });
                }
            });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('❌ Reply API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};