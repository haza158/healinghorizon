// Community Forum with localStorage fallback (works without Supabase)
import { supabase, isSupabaseConfigured, initializeSupabase } from './supabase-client.js';

class CommunityForum {
    constructor() {
        this.isConfigured = false;
        this.posts = [];
        this.supabaseLoaded = false;
        this.postIdCounter = this.getNextPostId();
    }

    async init() {
        console.log('Initializing community forum...');
        
        // Try to initialize Supabase (optional)
        this.supabaseLoaded = await initializeSupabase();
        this.isConfigured = this.supabaseLoaded && isSupabaseConfigured();
        
        if (this.isConfigured) {
            console.log('Using Supabase for shared posts');
            await this.loadPostsFromSupabase();
        } else {
            console.log('Using localStorage for posts (local only)');
            this.loadPostsFromLocalStorage();
        }
        
        this.renderPosts();
    }

    // LocalStorage methods
    loadPostsFromLocalStorage() {
        const savedPosts = localStorage.getItem('communityPosts');
        this.posts = savedPosts ? JSON.parse(savedPosts) : [];
        console.log('Loaded posts from localStorage:', this.posts);
    }

    savePostsToLocalStorage() {
        localStorage.setItem('communityPosts', JSON.stringify(this.posts));
    }

    getNextPostId() {
        const savedCounter = localStorage.getItem('postIdCounter');
        return savedCounter ? parseInt(savedCounter) + 1 : 1;
    }

    savePostIdCounter() {
        localStorage.setItem('postIdCounter', this.postIdCounter.toString());
    }

    // Supabase methods
    async loadPostsFromSupabase() {
        try {
            console.log('Loading posts from Supabase...');
            const { data: posts, error: postsError } = await supabase
                .from('posts')
                .select(`
                    *,
                    replies (*)
                `)
                .order('created_at', { ascending: false });

            if (postsError) {
                console.error('Error loading posts:', postsError);
                console.log('Falling back to localStorage');
                this.loadPostsFromLocalStorage();
                return;
            }

            this.posts = posts || [];
            console.log('Loaded posts from Supabase:', this.posts);
        } catch (error) {
            console.error('Error connecting to Supabase:', error);
            console.log('Falling back to localStorage');
            this.loadPostsFromLocalStorage();
        }
    }

    async createPost(author, title, content) {
        console.log('Creating post:', { author, title, content });
        
        if (!title.trim() || !content.trim()) {
            alert('Please fill in both title and content fields.');
            return;
        }

        const authorName = author.trim() || 'Anonymous';
        const postTitle = title.trim();
        const postContent = content.trim();

        if (this.isConfigured) {
            // Try Supabase first
            try {
                console.log('Creating post in Supabase...');
                const { data, error } = await supabase
                    .from('posts')
                    .insert([
                        {
                            title: postTitle,
                            content: postContent,
                            author: authorName
                        }
                    ])
                    .select();

                if (error) {
                    console.error('Error creating post in Supabase:', error);
                    // Fall back to localStorage
                    this.createPostInLocalStorage(authorName, postTitle, postContent);
                } else {
                    console.log('Post created successfully in Supabase:', data);
                    this.clearForm();
                    await this.loadPostsFromSupabase();
                    this.renderPosts();
                }
            } catch (error) {
                console.error('Error creating post in Supabase:', error);
                // Fall back to localStorage
                this.createPostInLocalStorage(authorName, postTitle, postContent);
            }
        } else {
            // Use localStorage
            this.createPostInLocalStorage(authorName, postTitle, postContent);
        }
    }

    createPostInLocalStorage(author, title, content) {
        const newPost = {
            id: this.postIdCounter,
            author: author,
            title: title,
            content: content,
            created_at: new Date().toISOString(),
            replies: []
        };

        this.posts.unshift(newPost);
        this.postIdCounter++;
        this.savePostsToLocalStorage();
        this.savePostIdCounter();
        this.clearForm();
        this.renderPosts();
        console.log('Post created in localStorage:', newPost);
    }

    clearForm() {
        const authorInput = document.getElementById('authorName');
        const titleInput = document.getElementById('postTitle');
        const contentInput = document.getElementById('postContent');
        
        if (authorInput) authorInput.value = '';
        if (titleInput) titleInput.value = '';
        if (contentInput) contentInput.value = '';
    }

    async addReply(postId, author, content) {
        if (!content.trim()) {
            alert('Please enter a reply message.');
            return;
        }

        const authorName = author.trim() || 'Anonymous';
        const replyContent = content.trim();

        if (this.isConfigured) {
            // Try Supabase first
            try {
                console.log('Creating reply in Supabase...');
                const { data, error } = await supabase
                    .from('replies')
                    .insert([
                        {
                            post_id: postId,
                            content: replyContent,
                            author: authorName
                        }
                    ])
                    .select();

                if (error) {
                    console.error('Error creating reply in Supabase:', error);
                    // Fall back to localStorage
                    this.addReplyInLocalStorage(postId, authorName, replyContent);
                } else {
                    console.log('Reply created successfully in Supabase:', data);
                    await this.loadPostsFromSupabase();
                    this.renderPosts();
                }
            } catch (error) {
                console.error('Error creating reply in Supabase:', error);
                // Fall back to localStorage
                this.addReplyInLocalStorage(postId, authorName, replyContent);
            }
        } else {
            // Use localStorage
            this.addReplyInLocalStorage(postId, authorName, replyContent);
        }
    }

    addReplyInLocalStorage(postId, author, content) {
        const post = this.posts.find(p => p.id == postId);
        if (post) {
            const reply = {
                id: Date.now(),
                author: author,
                content: content,
                created_at: new Date().toISOString()
            };

            if (!post.replies) {
                post.replies = [];
            }
            post.replies.push(reply);
            this.savePostsToLocalStorage();
            this.renderPosts();
            console.log('Reply added in localStorage:', reply);
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
        
        console.log('Rendering posts:', this.posts);
        
        if (!this.posts || this.posts.length === 0) {
            container.innerHTML = `
                <div class="no-posts">
                    <p>No posts yet. Be the first to share something with the community!</p>
                    ${!this.isConfigured ? '<p><em>Note: Posts are stored locally on your device. For shared posts across all users, Supabase connection is needed.</em></p>' : ''}
                </div>
            `;
            return;
        }

        container.innerHTML = this.posts.map(post => `
            <div class="post" data-post-id="${post.id}">
                <div class="post-header">
                    <h4>${this.escapeHtml(post.title)}</h4>
                    <span class="post-meta">by ${this.escapeHtml(post.author)} • ${this.formatTimestamp(post.created_at || post.timestamp)}</span>
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
                        .sort((a, b) => new Date(a.created_at || a.timestamp) - new Date(b.created_at || b.timestamp))
                        .map(reply => `
                        <div class="reply">
                            <div class="reply-header">
                                <strong>${this.escapeHtml(reply.author)}</strong>
                                <span class="reply-time">${this.formatTimestamp(reply.created_at || reply.timestamp)}</span>
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
    console.log('DOM loaded, initializing community forum...');
    
    forum = new CommunityForum();
    
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
    
    console.log('Community forum initialization complete');
});