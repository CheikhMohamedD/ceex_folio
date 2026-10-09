// Rendu final : seek image par image → PNG → ffmpeg (H.264, yuv420p) + mixage audio.
//   node tools/render.mjs [--fps 60] [--from 0] [--to 20] [--out out/fekk.mp4] [--scene s1]
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { openFilm, ROOT } from './lib.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const fps = +opt('fps', 60);
const from = +opt('from', 0);
const out = path.resolve(ROOT, opt('out', 'out/fekk.mp4'));
const audio = path.join(ROOT, 'audio/fekk.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });

const film = await openFilm({ query: opt('scene') ? 'scene=' + opt('scene') : '' });
const dur = await film.page.evaluate(() => window.__DURATION);
const to = +opt('to', dur);
const frames = Math.round((to - from) * fps);
const withAudio = fs.existsSync(audio) && !argv.includes('--no-audio');

const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
  ...(withAudio ? ['-ss', String(from), '-t', String(to - from), '-i', audio] : []),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p',
  '-profile:v', 'high', '-movflags', '+faststart',
  ...(withAudio ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
  out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const cdp = await film.page.context().newCDPSession(film.page);
const t0 = performance.now();
for (let i = 0; i < frames; i++) {
  await film.seek(from + i / fps);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
  if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\r${(from + i / fps).toFixed(1)}s / ${to}s  (${((performance.now() - t0) / 1000).toFixed(0)}s)`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await film.close();
if (film.logs.length) console.log('\nLOGS:\n' + film.logs.join('\n'));
console.log(`\n✔ ${out}  (${frames} images @${fps}fps${withAudio ? ', audio' : ''})`);
