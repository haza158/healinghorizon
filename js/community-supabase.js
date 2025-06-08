// Community Forum with Supabase Integration
import { supabase, isSupabaseConfigured } from './supabase-client.js';

class SupabaseCommunityForum {
    constructor() {
        this.isConfigured = isSupabaseConfigured();
        this.fallbackForum = null;
        
        if (!this.isConfigured) {
            console.warn('Supabase not configured, falling back to localStorage');
            this.initializeFallback();
        }
        
        this.init();
    }

    async init() {
        if (this.isConfigured) {
            await this.loadPostsFromSupabase();
        } else {
            this.renderConnectionMessage();
        }
    }

    initializeFallback() {
        this.fallbackForum = new LocalStorageForum();
    }

    renderConnectionMessage() {
        const container = document.getElementById('postsContainer');
        if (container) {
            container.innerHTML = `
                <div class="supabase-setup-message">
                    <h3>🔗 Connect to Supabase for Shared Community</h3>
                    <p>To enable shared posts and replies across all users, please connect to Supabase using the "Connect to Supabase" button in the top right corner.</p>
                    <p>Currently using local storage - posts are only visible to you.</p>
                    <button onclick="window.location.reload()" class="refresh-btn">Refresh after connecting</button>
                </div>
            `;
        }
    }

    async loadPostsFromSupabase() {
        try {
            const { data: posts, error: postsError } = await supabase
                .from('posts')
                .select(`
                    *,
                    replies (*)
                `)
                .order('created_at', { ascending: false });

            if (postsError) {
                console.error('Error loading posts:', postsError);
                this.renderError('Failed to load posts');
                return;
            }

            this.posts = posts || [];
            this.renderPosts();
        } catch (error) {
            console.error('Error connecting to Supabase:', error);
            this.renderError('Failed to connect to database');
        }
    }

    async createPost(author, title, content) {
        if (!this.isConfigured) {
            if (this.fallbackForum) {
                return this.fallbackForum.createPost(author, title, content);
            }
            return;
        }

        if (!title.trim() || !content.trim()) {
            alert('Please fill in both title and content fields.');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('posts')
                .insert([
                    {
                        title: title.trim(),
                        content: content.trim(),
                        author: author.trim() || 'Anonymous'
                    }
                ])
                .select();

            if (error) {
                console.error('Error creating post:', error);
                alert('Failed to create post. Please try again.');
                return;
            }

            // Clear form
            document.getElementById('authorName').value = '';
            document.getElementById('postTitle').value = '';
            document.getElementById('postContent').value = '';

            // Reload posts
            await this.loadPostsFromSupabase();
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        }
    }

    async addReply(postId, author, content) {
        if (!this.isConfigured) {
            if (this.fallbackForum) {
                return this.fallbackForum.addReply(postId, author, content);
            }
            return;
        }

        if (!content.trim()) {
            alert('Please enter a reply message.');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('replies')
                .insert([
                    {
                        post_id: postId,
                        content: content.trim(),
                        author: author.trim() || 'Anonymous'
                    }
                ])
                .select();

            if (error) {
                console.error('Error creating reply:', error);
                alert('Failed to create reply. Please try again.');
                return;
            }

            // Reload posts to show new reply
            await this.loadPostsFromSupabase();
        } catch (error) {
            console.error('Error creating reply:', error);
            alert('Failed to create reply. Please try again.');
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)} hours ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    toggleReplyBox(postId) {
        const replyBox = document.getElementById(`replyBox-${postId}`);
        if (!replyBox) return;
        
        const isHidden = replyBox.style.display === 'none' || !replyBox.style.display;
        
        // Hide all other reply boxes
        document.querySelectorAll('.reply-box').forEach(box => {
            box.style.display = 'none';
        });

        // Toggle current reply box
        replyBox.style.display = isHidden ? 'block' : 'none';
        
        if (isHidden) {
            const textarea = replyBox.querySelector('textarea');
            if (textarea) textarea.focus();
        }
    }

    renderPosts() {
        const container = document.getElementById('postsContainer');
        if (!container) return;
        
        if (!this.posts || this.posts.length === 0) {
            container.innerHTML = `
                <div class="no-posts">
                    <p>No posts yet. Be the first to share something with the community!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.posts.map(post => `
            <div class="post" data-post-id="${post.id}">
                <div class="post-header">
                    <h4>${this.escapeHtml(post.title)}</h4>
                    <span class="post-meta">by ${this.escapeHtml(post.author)} • ${this.formatTimestamp(post.created_at)}</span>
                </div>
                <p class="post-content">${this.escapeHtml(post.content)}</p>
                
                <div class="post-actions">
                    <button class="reply-button" onclick="forum.toggleReplyBox('${post.id}')">
                        Reply (${post.replies ? post.replies.length : 0})
                    </button>
                </div>

                <!-- Reply Box -->
                <div id="replyBox-${post.id}" class="reply-box" style="display: none;">
                    <input type="text" id="replyAuthor-${post.id}" placeholder="Your name (optional)" maxlength="50">
                    <textarea id="replyContent-${post.id}" placeholder="Write your reply..." rows="3" maxlength="500"></textarea>
                    <button onclick="forum.submitReply('${post.id}')">Post Reply</button>
                    <button onclick="forum.toggleReplyBox('${post.id}')" class="cancel-btn">Cancel</button>
                </div>

                <!-- Replies -->
                <div class="replies-container">
                    ${post.replies ? post.replies
                        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                        .map(reply => `
                        <div class="reply">
                            <div class="reply-header">
                                <strong>${this.escapeHtml(reply.author)}</strong>
                                <span class="reply-time">${this.formatTimestamp(reply.created_at)}</span>
                            </div>
                            <p>${this.escapeHtml(reply.content)}</p>
                        </div>
                    `).join('') : ''}
                </div>
            </div>
        `).join('');
    }

    async submitReply(postId) {
        const authorInput = document.getElementById(`replyAuthor-${postId}`);
        const contentInput = document.getElementById(`replyContent-${postId}`);
        
        if (!authorInput || !contentInput) return;
        
        await this.addReply(postId, authorInput.value, contentInput.value);
        
        // Clear inputs and hide reply box
        authorInput.value = '';
        contentInput.value = '';
        this.toggleReplyBox(postId);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    renderError(message) {
        const container = document.getElementById('postsContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p>⚠️ ${message}</p>
                    <button onclick="window.location.reload()">Try Again</button>
                </div>
            `;
        }
    }
}

// Fallback LocalStorage Forum
class LocalStorageForum {
    constructor() {
        this.posts = this.loadPosts();
        this.postIdCounter = this.getNextPostId();
        this.renderPosts();
    }

    loadPosts() {
        const savedPosts = localStorage.getItem('communityPosts');
        return savedPosts ? JSON.parse(savedPosts) : [];
    }

    savePosts() {
        localStorage.setItem('communityPosts', JSON.stringify(this.posts));
    }

    getNextPostId() {
        const savedCounter = localStorage.getItem('postIdCounter');
        return savedCounter ? parseInt(savedCounter) + 1 : 1;
    }

    savePostIdCounter() {
        localStorage.setItem('postIdCounter', this.postIdCounter.toString());
    }

    createPost(author, title, content) {
        if (!title.trim() || !content.trim()) {
            alert('Please fill in both title and content fields.');
            return;
        }

        const newPost = {
            id: this.postIdCounter,
            author: author.trim() || 'Anonymous',
            title: title.trim(),
            content: content.trim(),
            timestamp: new Date().toISOString(),
            replies: []
        };

        this.posts.unshift(newPost);
        this.postIdCounter++;
        this.savePosts();
        this.savePostIdCounter();
        this.renderPosts();

        // Clear form
        const authorInput = document.getElementById('authorName');
        const titleInput = document.getElementById('postTitle');
        const contentInput = document.getElementById('postContent');
        
        if (authorInput) authorInput.value = '';
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';
    }

    addReply(postId, author, content) {
        if (!content.trim()) {
            alert('Please enter a reply message.');
            return;
        }

        const post = this.posts.find(p => p.id === postId);
        if (post) {
            const reply = {
                id: Date.now(),
                author: author.trim() || 'Anonymous',
                content: content.trim(),
                timestamp: new Date().toISOString()
            };

            post.replies.push(reply);
            this.savePosts();
            this.renderPosts();
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)} hours ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    toggleReplyBox(postId) {
        const replyBox = document.getElementById(`replyBox-${postId}`);
        if (!replyBox) return;
        
        const isHidden = replyBox.style.display === 'none' || !replyBox.style.display;
        
        document.querySelectorAll('.reply-box').forEach(box => {
            box.style.display = 'none';
        });

        replyBox.style.display = isHidden ? 'block' : 'none';
        
        if (isHidden) {
            const textarea = replyBox.querySelector('textarea');
            if (textarea) textarea.focus();
        }
    }

    renderPosts() {
        const container = document.getElementById('postsContainer');
        if (!container) return;
        
        if (this.posts.length === 0) {
            container.innerHTML = `
                <div class="no-posts">
                    <p>No posts yet. Be the first to share something with the community!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.posts.map(post => `
            <div class="post" data-post-id="${post.id}">
                <div class="post-header">
                    <h4>${this.escapeHtml(post.title)}</h4>
                    <span class="post-meta">by ${this.escapeHtml(post.author)} • ${this.formatTimestamp(post.timestamp)}</span>
                </div>
                <p class="post-content">${this.escapeHtml(post.content)}</p>
                
                <div class="post-actions">
                    <button class="reply-button" onclick="forum.toggleReplyBox(${post.id})">
                        Reply (${post.replies.length})
                    </button>
                </div>

                <div id="replyBox-${post.id}" class="reply-box" style="display: none;">
                    <input type="text" id="replyAuthor-${post.id}" placeholder="Your name (optional)" maxlength="50">
                    <textarea id="replyContent-${post.id}" placeholder="Write your reply..." rows="3" maxlength="500"></textarea>
                    <button onclick="forum.submitReply(${post.id})">Post Reply</button>
                    <button onclick="forum.toggleReplyBox(${post.id})" class="cancel-btn">Cancel</button>
                </div>

                <div class="replies-container">
                    ${post.replies.map(reply => `
                        <div class="reply">
                            <div class="reply-header">
                                <strong>${this.escapeHtml(reply.author)}</strong>
                                <span class="reply-time">${this.formatTimestamp(reply.timestamp)}</span>
                            </div>
                            <p>${this.escapeHtml(reply.content)}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    submitReply(postId) {
        const authorInput = document.getElementById(`replyAuthor-${postId}`);
        const contentInput = document.getElementById(`replyContent-${postId}`);
        
        if (!authorInput || !contentInput) return;
        
        this.addReply(postId, authorInput.value, contentInput.value);
        
        authorInput.value = '';
        contentInput.value = '';
        this.toggleReplyBox(postId);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize forum when page loads
let forum;

document.addEventListener('DOMContentLoaded', function() {
    forum = new SupabaseCommunityForum();
    
    // Set up event listener for create post button
    const createPostButton = document.getElementById('createPostButton');
    if (createPostButton) {
        createPostButton.addEventListener('click', function() {
            const author = document.getElementById('authorName').value;
            const title = document.getElementById('postTitle').value;
            const content = document.getElementById('postContent').value;
            
            if (forum) {
                forum.createPost(author, title, content);
            }
        });
    }
    
    // Make forum available globally for HTML onclick handlers
    window.forum = forum;
});