const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Import API handlers
const postsHandler = require('./api/posts');
const repliesHandler = require('./api/replies');

// API Routes - Fixed routing
app.get('/api/posts', postsHandler);
app.post('/api/posts', postsHandler);
app.delete('/api/posts/:id', postsHandler);

app.post('/api/posts/:postId/replies', repliesHandler);
app.delete('/api/posts/:postId/replies/:replyId', repliesHandler);

// Handle SPA routing - serve community.html for community route
app.get('/community.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'community.html'));
});

// Handle other static files and routes
app.get('*', (req, res) => {
  // Check if it's a static file request
  const ext = path.extname(req.path);
  if (ext) {
    // It's a file request, let express.static handle it
    res.status(404).send('File not found');
  } else {
    // It's a route, serve index.html
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log('📡 Community forum API endpoints:');
  console.log('  GET    /api/posts');
  console.log('  POST   /api/posts');
  console.log('  DELETE /api/posts/:id');
  console.log('  POST   /api/posts/:postId/replies');
  console.log('  DELETE /api/posts/:postId/replies/:replyId');
  console.log('✨ Posts are now shared across ALL browsers and devices!');
});