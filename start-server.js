const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Ignorar parámetros de query para VS Code Browser Preview
  const urlWithoutQuery = req.url.split('?')[0];
  
  let filePath = path.join(__dirname, urlWithoutQuery === '/' ? 'index.html' : urlWithoutQuery);
  
  // Evitar acceso a archivos fuera del directorio
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end('<h1>403 Forbidden</h1>', 'utf-8');
    return;
  }
  
  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.log(`[404] Archivo no encontrado: ${filePath}`);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1><p>El archivo solicitado no existe.</p>', 'utf-8');
      } else {
        console.log(`[500] Error del servidor: ${err.code}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`, 'utf-8');
      }
    } else {
      console.log(`[200] Sirviendo: ${filePath} (${contentType})`);
      // Headers para auto-recarga
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
  console.log(`📁 Directorio: ${__dirname}`);
  console.log(`🔄 Auto-recarga activada`);
  console.log(`⏹️  Presiona Ctrl+C para detener`);
  console.log('-'.repeat(50));
  
  // Abrir navegador automáticamente
  setTimeout(() => {
    const start = process.platform === 'darwin' ? 'open' :
                  process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${start} http://localhost:${PORT}`, (err) => {
      if (err) console.log('No se pudo abrir el navegador automáticamente');
    });
  }, 1000);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${PORT} ya está en uso`);
    console.error('💡 Cierra otros servidores o usa un puerto diferente');
  } else {
    console.error(`❌ Error al iniciar servidor: ${err}`);
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Servidor detenido');
  process.exit(0);
});
