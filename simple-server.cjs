const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
  console.log(`📥 ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  
  // Basic CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Clean up the URL
  let filePath = req.url.split('?')[0]; // Remove query parameters
  if (filePath === '/') filePath = '/index.html';
  
  const fullPath = path.join(__dirname, filePath);
  
  // Check if file exists first
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${fullPath}`);
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end(`<h1>404 Not Found</h1><p>File: ${filePath}</p><p>Full path: ${fullPath}</p>`);
    return;
  }
  
  // Read and serve the file
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      console.log(`❌ Error reading file: ${err.message}`);
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }
    
    // Set content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.ico': 'image/x-icon'
    };
    
    const contentType = contentTypes[ext] || 'text/plain';
    console.log(`✅ Serving: ${filePath} (${contentType})`);
    
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n🚀 ELEMENTAL FURY SERVER STARTED');
  console.log('================================');
  console.log(`✅ Server running on: http://localhost:${PORT}`);
  console.log(`📱 Main Game: http://localhost:${PORT}/index.html`);
  console.log(`🧪 Test Page: http://localhost:${PORT}/test-modifiers.html`);
  console.log('\n📋 Server will log all requests...');
  console.log('Press Ctrl+C to stop\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use!`);
    console.log(`Try: kill -9 $(lsof -ti:${PORT})`);
  } else {
    console.log('❌ Server error:', err);
  }
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});