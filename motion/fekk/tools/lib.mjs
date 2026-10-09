// Utilitaires partagés par still.mjs et render.mjs : serveur statique + page Playwright prête.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.json': 'application/json', '.wav': 'audio/wav',
};

export function serve(dir = ROOT) {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(dir, p === '/' ? 'index.html' : p);
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('404'); return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    resolve({ url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() });
  }));
}

/** Ouvre le film dans Chromium et attend que la timeline soit construite. */
export async function openFilm({ query = '' } = {}) {
  const srv = await serve();
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url()}`); });
  await page.goto(srv.url + 'index.html' + (query ? '?' + query : ''));
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  const errors = await page.evaluate(() => window.__errors || []);
  logs.push(...errors.map((e) => `[build] ${e}`));
  return {
    page, logs,
    seek: (t) => page.evaluate((t) => window.__seek(t), t),
    close: async () => { await browser.close(); srv.close(); },
  };
}
