/**
 * Mundial 2026 Tracker — Servidor local
 * Corre en: http://localhost:3000
 */
const http = require("http");
const fs   = require("fs");
const path = require("path");
const url  = require("url");

const PORT = 3000;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript",
  ".json": "application/json",
  ".css":  "text/css",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".ico":  "image/x-icon",
  ".webp": "image/webp",
};

http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  const pathname = parsed.pathname;

  // Headers necesarios para PWA
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Service Worker necesita este header para funcionar
  if(pathname === "/sw.js"){
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache");
  }

  let filePath = path.join(__dirname, pathname === "/" ? "index.html" : pathname);

  fs.readFile(filePath, (err, data) => {
    if(err){ res.writeHead(404); res.end("No encontrado"); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, {"Content-Type": MIME[ext] || "text/plain"});
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n✅  Mundial 2026 Tracker corriendo en http://localhost:${PORT}`);
  console.log(`   Abrí http://localhost:${PORT} en Chrome`);
  console.log(`   En celular: abrí Chrome → menú → "Agregar a pantalla de inicio"\n`);
});
