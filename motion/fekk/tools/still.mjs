// Rendu d'images fixes pour vérifier visuellement une scène.
//   node tools/still.mjs 0.5 1.2 3            → out/stills/t0.50.png, …
//   node tools/still.mjs --from 0 --to 3.5 --step 0.25 --sheet s1   → planche contact out/stills/s1-sheet.png
//   options : --scene s1 (isole une scène), --safe (zones de sécurité), --out dir
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { openFilm, ROOT } from './lib.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes('--' + k);
const named = new Set(['from', 'to', 'step', 'sheet', 'scene', 'out', 'cols']);
let times = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && named.has(argv[i - 1].slice(2)))).map(Number);
if (opt('from') !== undefined) {
  const from = +opt('from'), to = +opt('to', from + 1), step = +opt('step', 0.25);
  for (let t = from; t <= to + 1e-9; t += step) times.push(+t.toFixed(3));
}
if (!times.length) times = [0];

const outDir = path.resolve(ROOT, opt('out', 'out/stills'));
fs.mkdirSync(outDir, { recursive: true });
const q = [opt('scene') ? 'scene=' + opt('scene') : '', flag('safe') ? 'safe=1' : ''].filter(Boolean).join('&');
const film = await openFilm({ query: q });
const files = [];
for (const t of times) {
  await film.seek(t);
  const f = path.join(outDir, `t${t.toFixed(2).padStart(5, '0')}.png`);
  await film.page.screenshot({ path: f });
  files.push(f);
}
await film.close();
if (film.logs.length) console.log('LOGS:\n' + film.logs.join('\n'));
console.log(files.join('\n'));

// Planche contact : vignettes 270×480 avec le timecode incrusté.
const sheet = opt('sheet');
if (sheet) {
  const cols = +opt('cols', Math.min(6, files.length));
  const rows = Math.ceil(files.length / cols);
  const inputs = files.flatMap((f) => ['-i', f]);
  const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  const parts = files.map((f, i) => `[${i}:v]scale=270:480,drawtext=fontfile=${font}:text='${times[i].toFixed(2)}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`);
  const pad = [];
  for (let i = files.length; i < rows * cols; i++) pad.push(`color=black:s=270x480:d=1[v${i}]`);
  const all = Array.from({ length: rows * cols }, (_, i) => `[v${i}]`).join('');
  const filter = [...parts, ...pad, `${all}xstack=inputs=${rows * cols}:layout=${
    Array.from({ length: rows * cols }, (_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|')
  }[out]`].join(';');
  const out = path.join(outDir, `${sheet}-sheet.png`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-map', '[out]', '-frames:v', '1', out]);
  console.log('SHEET ' + out);
}
