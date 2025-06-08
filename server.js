const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// API Routes
app.get('/api/posts', require('./api/posts'));
app.post('/api/posts', require('./api/posts'));
app.delete('/api/posts/:id', require('./api/posts'));

app.post('/api/posts/:postId/replies', require('./api/replies'));
app.delete('/api/posts/:postId/replies/:replyId', require('./api/replies'));

// Handle SPA routing - serve index.html for any route that doesn't match a file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Community forum API endpoints:');
  console.log('  GET    /api/posts');
  console.log('  POST   /api/posts');
  console.log('  DELETE /api/posts/:id');
  console.log('  POST   /api/posts/:postId/replies');
  console.log('  DELETE /api/posts/:postId/replies/:replyId');
});