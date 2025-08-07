const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // Remove query parameters
  filePath = filePath.split('?')[0];
  
  const fullPath = path.join(__dirname, filePath);
  
  // Security check - don't allow path traversal
  if (!fullPath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      console.log(`404: ${filePath}`);
      res.writeHead(404, {'Content-Type': 'text/html'});
      res.end(`
        <h1>404 - File Not Found</h1>
        <p>Could not find: ${filePath}</p>
        <p>Looking for: ${fullPath}</p>
        <a href="/">Back to Game</a>
      `);
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'text/plain';
    
    console.log(`✅ Serving: ${filePath} (${contentType})`);
    
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Elemental Fury Dev Server Started!');
  console.log('=====================================');
  console.log(`📱 Main Game: http://localhost:${PORT}/index.html`);
  console.log(`🧪 Test Page: http://localhost:${PORT}/test-modifiers.html`);
  console.log(`🌐 Network:   http://192.168.0.192:${PORT}/index.html`);
  console.log('');
  console.log('Press Ctrl+C to stop');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});