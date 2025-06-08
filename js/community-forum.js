// Shared Community Forum - Works for all users without any accounts
class SharedCommunityForum {
    constructor() {
        this.posts = [];
        this.apiUrl = window.location.origin;
        this.currentUser = this.getCurrentUser();
    }

    getCurrentUser() {
        // Generate a unique user ID for this browser/device
        let userId = localStorage.getItem('communityUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('communityUserId', userId);
        }
        return userId;
    }

    async init() {
        console.log('Initializing shared community forum...');
        await this.loadPosts();
        this.renderPosts();
        this.startAutoRefresh();
    }

    async loadPosts() {
        try {
            // Try to load from our simple JSON storage
            const response = await fetch(`${this.apiUrl}/api/posts`);
            if (response.ok) {
                const data = await response.json();
                this.posts = data.posts || [];
                console.log('Loaded posts from server:', this.posts);
            } else {
                // Fallback to localStorage if server not available
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.log('Server not available, using localStorage fallback');
            this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        const savedPosts = localStorage.getItem('sharedCommunityPosts');
        this.posts = savedPosts ? JSON.parse(savedPosts) : [];
        console.log('Loaded posts from localStorage:', this.posts);
    }

    saveToLocalStorage() {
        localStorage.setItem('sharedCommunityPosts', JSON.stringify(this.posts));
    }

    async createPost(author, title, content) {
        if (!title.trim() || !content.trim()) {
            alert('Please fill in both title and content fields.');
            return;
        }

        const newPost = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            author: author.trim() || 'Anonymous',
            title: title.trim(),
            content: content.trim(),
            created_at: new Date().toISOString(),
            replies: [],
            creator_id: this.currentUser
        };

        try {
            // Try to save to server
            const response = await fetch(`${this.apiUrl}/api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newPost)
            });

            if (response.ok) {
                console.log('Post saved to server');
                await this.loadPosts();
            } else {
                // Fallback to localStorage
                this.posts.unshift(newPost);
                this.saveToLocalStorage();
                console.log('Post saved to localStorage');
            }
        } catch (error) {
            // Fallback to localStorage
            this.posts.unshift(newPost);
            this.saveToLocalStorage();
            console.log('Post saved to localStorage (server unavailable)');
        }

        this.clearForm();
        this.renderPosts();
    }

    async deletePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        // Check if user can delete this post
        if (post.creator_id !== this.currentUser) {
            alert('You can only delete your own posts.');
            return;
        }

        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            // Try to delete from server
            const response = await fetch(`${this.apiUrl}/api/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ creator_id: this.currentUser })
            });

            if (response.ok) {
                console.log('Post deleted from server');
                await this.loadPosts();
            } else {
                // Fallback to localStorage
                this.posts = this.posts.filter(p => p.id !== postId);
                this.saveToLocalStorage();
                console.log('Post deleted from localStorage');
            }
        } catch (error) {
            // Fallback to localStorage
            this.posts = this.posts.filter(p => p.id !== postId);
            this.saveToLocalStorage();
            console.log('Post deleted from localStorage (server unavailable)');
        }

        this.renderPosts();
    }

    async addReply(postId, author, content) {
        if (!content.trim()) {
            alert('Please enter a reply message.');
            return;
        }

        const reply = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            author: author.trim() || 'Anonymous',
            content: content.trim(),
            created_at: new Date().toISOString(),
            creator_id: this.currentUser
        };

        try {
            // Try to save to server
            const response = await fetch(`${this.apiUrl}/api/posts/${postId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reply)
            });

            if (response.ok) {
                console.log('Reply saved to server');
                await this.loadPosts();
            } else {
                // Fallback to localStorage
                const post = this.posts.find(p => p.id === postId);
                if (post) {
                    if (!post.replies) post.replies = [];
                    post.replies.push(reply);
                    this.saveToLocalStorage();
                    console.log('Reply saved to localStorage');
                }
            }
        } catch (error) {
            // Fallback to localStorage
            const post = this.posts.find(p => p.id === postId);
            if (post) {
                if (!post.replies) post.replies = [];
                post.replies.push(reply);
                this.saveToLocalStorage();
                console.log('Reply saved to localStorage (server unavailable)');
            }
        }

        this.renderPosts();
    }

    async deleteReply(postId, replyId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const reply = post.replies.find(r => r.id === replyId);
        if (!reply) return;

        // Check if user can delete this reply
        if (reply.creator_id !== this.currentUser) {
            alert('You can only delete your own replies.');
            return;
        }

        if (!confirm('Are you sure you want to delete this reply?')) {
            return;
        }

        try {
            // Try to delete from server
            const response = await fetch(`${this.apiUrl}/api/posts/${postId}/replies/${replyId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ creator_id: this.currentUser })
            });

            if (response.ok) {
                console.log('Reply deleted from server');
                await this.loadPosts();
            } else {
                // Fallback to localStorage
                post.replies = post.replies.filter(r => r.id !== replyId);
                this.saveToLocalStorage();
                console.log('Reply deleted from localStorage');
            }
        } catch (error) {
            // Fallback to localStorage
            post.replies = post.replies.filter(r => r.id !== replyId);
            this.saveToLocalStorage();
            console.log('Reply deleted from localStorage (server unavailable)');
        }

        this.renderPosts();
    }

    startAutoRefresh() {
        // Refresh posts every 30 seconds to show new posts from other users
        setInterval(async () => {
            await this.loadPosts();
            this.renderPosts();
        }, 30000);
    }

    clearForm() {
        const authorInput = document.getElementById('authorName');
        const titleInput = document.getElementById('postTitle');
        const contentInput = document.getElementById('postContent');
        
        if (authorInput) authorInput.value = '';
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';
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
        
        console.log('Rendering posts:', this.posts);
        
        if (!this.posts || this.posts.length === 0) {
            container.innerHTML = `
                <div class="no-posts">
                    <p>No posts yet. Be the first to share something with the community!</p>
                    <p><em>✨ Posts are shared with all users visiting this site!</em></p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.posts.map(post => `
            <div class="post" data-post-id="${post.id}">
                <div class="post-header">
                    <h4>${this.escapeHtml(post.title)}</h4>
                    <div class="post-meta-row">
                        <span class="post-meta">by ${this.escapeHtml(post.author)} • ${this.formatTimestamp(post.created_at)}</span>
                        ${post.creator_id === this.currentUser ? `
                            <button class="delete-post-btn" onclick="window.forum.deletePost('${post.id}')" title="Delete this post">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                </div>
                <p class="post-content">${this.escapeHtml(post.content)}</p>
                
                <div class="post-actions">
                    <button class="reply-button" onclick="window.forum.toggleReplyBox('${post.id}')">
                        Reply (${post.replies ? post.replies.length : 0})
                    </button>
                </div>

                <!-- Reply Box -->
                <div id="replyBox-${post.id}" class="reply-box" style="display: none;">
                    <input type="text" id="replyAuthor-${post.id}" placeholder="Your name (optional)" maxlength="50">
                    <textarea id="replyContent-${post.id}" placeholder="Write your reply..." rows="3" maxlength="500"></textarea>
                    <button onclick="window.forum.submitReply('${post.id}')">Post Reply</button>
                    <button onclick="window.forum.toggleReplyBox('${post.id}')" class="cancel-btn">Cancel</button>
                </div>

                <!-- Replies -->
                <div class="replies-container">
                    ${post.replies ? post.replies
                        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                        .map(reply => `
                        <div class="reply">
                            <div class="reply-header">
                                <div class="reply-author-time">
                                    <strong>${this.escapeHtml(reply.author)}</strong>
                                    <span class="reply-time">${this.formatTimestamp(reply.created_at)}</span>
                                </div>
                                ${reply.creator_id === this.currentUser ? `
                                    <button class="delete-reply-btn" onclick="window.forum.deleteReply('${post.id}', '${reply.id}')" title="Delete this reply">
                                        🗑️
                                    </button>
                                ` : ''}
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
}

// Initialize forum when page loads
let forum;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing shared community forum...');
    
    forum = new SharedCommunityForum();
    
    // Initialize the forum
    await forum.init();
    
    // Set up event listener for create post button
    const createPostButton = document.getElementById('createPostButton');
    if (createPostButton) {
        createPostButton.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('Create post button clicked');
            
            const author = document.getElementById('authorName').value;
            const title = document.getElementById('postTitle').value;
            const content = document.getElementById('postContent').value;
            
            console.log('Form values:', { author, title, content });
            
            if (forum) {
                await forum.createPost(author, title, content);
            }
        });
    } else {
        console.error('Create post button not found!');
    }
    
    // Make forum available globally for HTML onclick handlers
    window.forum = forum;
    
    console.log('Shared community forum initialization complete');
});