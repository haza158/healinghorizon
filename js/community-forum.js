// js/community-forum.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ✅ Get or set unique user ID
const userId = localStorage.getItem('communityUserId') || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
localStorage.setItem('communityUserId', userId);

// ✅ Supabase connection
const supabase = createClient(
  'https://efvxihgndvaevspelpsa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmdnhpaGduZHZhZXZzcGVscHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzOTQ0NTksImV4cCI6MjA2NDk3MDQ1OX0.Nwzeta4FOJGRC0J0xam8AwY6MUbnj7QxDV_MqwsaX2c'
);

export default class SharedCommunityForum {
  constructor() {
    this.posts = [];
  }

  async init() {
    await this.loadPosts();
    this.renderPosts();
  }

  async loadPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*, replies(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading posts:', error);
    } else {
      this.posts = data;
    }
  }

  async createPost(author, title, content) {
    if (!title || !content) return alert('Please fill in all fields.');

    const { error } = await supabase.from('posts').insert([
      {
        author,
        title,
        content,
        creator_id: userId
      }
    ]);

    if (error) {
      console.error('Failed to post:', error);
      alert('Could not share post');
    } else {
      await this.loadPosts();
      this.renderPosts();
      this.clearForm();
    }
  }

  async addReply(postId, author, content) {
    if (!content) return alert('Reply cannot be empty.');

    const { error } = await supabase.from('replies').insert([
      {
        post_id: postId,
        author,
        content,
        creator_id: userId
      }
    ]);

    if (error) {
      console.error('Failed to reply:', error);
      alert('Could not post reply');
    } else {
      await this.loadPosts();
      this.renderPosts();
    }
  }

  async deletePost(postId) {
    const confirmDelete = confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Failed to delete post:', error);
      alert('Could not delete post');
    } else {
      await this.loadPosts();
      this.renderPosts();
    }
  }

  async deleteReply(replyId) {
    const confirmDelete = confirm('Delete this reply?');
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('replies')
      .delete()
      .eq('id', replyId);

    if (error) {
      console.error('Failed to delete reply:', error);
      alert('Could not delete reply');
    } else {
      await this.loadPosts();
      this.renderPosts();
    }
  }

  clearForm() {
    document.getElementById('authorName').value = '';
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
  }

  renderPosts() {
    const container = document.getElementById('postsContainer');
    container.innerHTML = '';
    const currentUserId = userId;

    if (this.posts.length === 0) {
      container.innerHTML = '<p>No posts yet.</p>';
      return;
    }

    this.posts.forEach(post => {
      const postEl = document.createElement('div');
      postEl.className = 'post';
      postEl.innerHTML = `
        <div class="post-header">
          <h4>${post.title}</h4>
          <div class="post-meta">${post.author || 'Anonymous'} • ${new Date(post.created_at).toLocaleString()}</div>
        </div>
        <div class="post-content">${post.content}</div>
        <button class="reply-btn" onclick="document.getElementById('replyBox-${post.id}').style.display='block'">Reply</button>
        ${post.creator_id === currentUserId ? `<button class="delete-post-btn" onclick="forum.deletePost('${post.id}')">Delete Post</button>` : ''}
        <div class="reply-box" id="replyBox-${post.id}" style="display:none; margin-top:10px;">
          <input type="text" placeholder="Your name" id="replyAuthor-${post.id}" />
          <textarea placeholder="Your reply..." id="replyContent-${post.id}"></textarea>
          <button onclick="forum.addReply('${post.id}', document.getElementById('replyAuthor-${post.id}').value, document.getElementById('replyContent-${post.id}').value)">Post Reply</button>
        </div>
        <div class="replies">
          ${(post.replies || []).map(r => `
            <div class="reply">
              <div class="post-meta">${r.author || 'Anonymous'} • ${new Date(r.created_at).toLocaleString()}</div>
              <div>${r.content}</div>
              ${r.creator_id === currentUserId ? `<button class="delete-post-btn" onclick="forum.deleteReply('${r.id}')">Delete Reply</button>` : ''}
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(postEl);
    });
  }
}
