// Community Forum JavaScript
class CommunityForum {
    constructor() {
        this.posts = this.loadPosts();
        this.postIdCounter = this.getNextPostId();
        this.renderPosts();
    }

    // Load posts from localStorage
    loadPosts() {
        const savedPosts = localStorage.getItem('communityPosts');
        return savedPosts ? JSON.parse(savedPosts) : [];
    }

    // Save posts to localStorage
    savePosts() {
        localStorage.setItem('communityPosts', JSON.stringify(this.posts));
    }

    // Get next available post ID
    getNextPostId() {
        const savedCounter = localStorage.getItem('postIdCounter');
        return savedCounter ? parseInt(savedCounter) + 1 : 1;
    }

    // Save post ID counter
    savePostIdCounter() {
        localStorage.setItem('postIdCounter', this.postIdCounter.toString());
    }

    // Create a new post
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

        this.posts.unshift(newPost); // Add to beginning of array
        this.postIdCounter++;
        this.savePosts();
        this.savePostIdCounter();
        this.renderPosts();

        // Clear form
        document.getElementById('authorName').value = '';
        document.getElementById('postTitle').value = '';
        document.getElementById('postContent').value = '';
    }

    // Add reply to a post
    addReply(postId, author, content) {
        if (!content.trim()) {
            alert('Please enter a reply message.');
            return;
        }

        const post = this.posts.find(p => p.id === postId);
        if (post) {
            const reply = {
                id: Date.now(), // Simple ID for replies
                author: author.trim() || 'Anonymous',
                content: content.trim(),
                timestamp: new Date().toISOString()
            };

            post.replies.push(reply);
            this.savePosts();
            this.renderPosts();
        }
    }

    // Format timestamp for display
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

    // Toggle reply box visibility
    toggleReplyBox(postId) {
        const replyBox = document.getElementById(`replyBox-${postId}`);
        const isHidden = replyBox.style.display === 'none' || !replyBox.style.display;
        
        // Hide all other reply boxes
        document.querySelectorAll('.reply-box').forEach(box => {
            box.style.display = 'none';
        });

        // Toggle current reply box
        replyBox.style.display = isHidden ? 'block' : 'none';
        
        if (isHidden) {
            // Focus on the reply textarea
            const textarea = replyBox.querySelector('textarea');
            if (textarea) textarea.focus();
        }
    }

    // Render all posts
    renderPosts() {
        const container = document.getElementById('postsContainer');
        
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

                <!-- Reply Box -->
                <div id="replyBox-${post.id}" class="reply-box" style="display: none;">
                    <input type="text" id="replyAuthor-${post.id}" placeholder="Your name (optional)" maxlength="50">
                    <textarea id="replyContent-${post.id}" placeholder="Write your reply..." rows="3" maxlength="500"></textarea>
                    <button onclick="forum.submitReply(${post.id})">Post Reply</button>
                    <button onclick="forum.toggleReplyBox(${post.id})" class="cancel-btn">Cancel</button>
                </div>

                <!-- Replies -->
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

    // Submit reply
    submitReply(postId) {
        const authorInput = document.getElementById(`replyAuthor-${postId}`);
        const contentInput = document.getElementById(`replyContent-${postId}`);
        
        this.addReply(postId, authorInput.value, contentInput.value);
        
        // Clear inputs and hide reply box
        authorInput.value = '';
        contentInput.value = '';
        this.toggleReplyBox(postId);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Clear all posts (for admin/testing purposes)
    clearAllPosts() {
        if (confirm('Are you sure you want to clear all posts? This action cannot be undone.')) {
            this.posts = [];
            this.postIdCounter = 1;
            localStorage.removeItem('communityPosts');
            localStorage.removeItem('postIdCounter');
            this.renderPosts();
        }
    }
}

// Initialize forum when page loads
let forum;

document.addEventListener('DOMContentLoaded', function() {
    forum = new CommunityForum();
});

// Global function for creating posts (called from HTML)
function createPost() {
    const author = document.getElementById('authorName').value;
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    
    forum.createPost(author, title, content);
}

// Add some sample posts if none exist (for demonstration)
function addSamplePosts() {
    const savedPosts = localStorage.getItem('communityPosts');
    if (!savedPosts) {
        const samplePosts = [
            {
                id: 1,
                author: 'Sarah',
                title: 'Finding peace in daily meditation',
                content: 'I wanted to share how daily meditation has transformed my mental health journey. Even just 10 minutes a day has made such a difference in my anxiety levels.',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                replies: [
                    {
                        id: 1,
                        author: 'Mike',
                        content: 'Thank you for sharing this! I\'ve been thinking about starting meditation. Do you have any app recommendations?',
                        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ]
            },
            {
                id: 2,
                author: 'Alex',
                title: 'Gratitude practice changed my perspective',
                content: 'Writing down three things I\'m grateful for each morning has helped me focus on the positive aspects of my life, even during difficult times.',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
                replies: []
            }
        ];
        
        localStorage.setItem('communityPosts', JSON.stringify(samplePosts));
        localStorage.setItem('postIdCounter', '3');
    }
}

// Add sample posts when the page loads
document.addEventListener('DOMContentLoaded', function() {
    addSamplePosts();
    forum = new CommunityForum();
});