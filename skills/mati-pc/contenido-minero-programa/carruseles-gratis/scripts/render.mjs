// render.mjs · Carrusel Animado · Viegas Academy
// Fotografía los slides con Chrome sin ventana y los convierte en PNG y MP4. Se ejecuta desde la carpeta del proyecto.
//
//   node scripts/render.mjs fotos [todos|02,03]     → resultados/estatico/slide-NN.png (el frame 0 de cada slide)
//   node scripts/render.mjs frame NN 1.5 salida.png  → un frame suelto
//   node scripts/render.mjs golpes                    → audio/golpes.json (duración y golpes de sonido de cada slide)
//   node scripts/render.mjs video [todos|02,03]      → resultados/slide-NN.mp4 + resultados/frames/slide-NN/ (uno por tiempo y el último)
//
// Chrome: usa CHROME_PATH si existe; si no, busca el Chrome del sistema; si no, el Chromium de Playwright.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const RAIZ = process.cwd();
const FPS = 30;
const req = createRequire(path.join(RAIZ, 'package.json'));
let chromium;
try { ({ chromium } = req('playwright')); } catch { console.error('Falta Playwright: npm i playwright (en la carpeta del proyecto o una superior)'); process.exit(1); }

const candidatos = [process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const chrome = candidatos.find((p) => fs.existsSync(p));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.json': 'application/json', '.wav': 'audio/wav', '.mp4': 'video/mp4' };
const dos = (n) => String(n).padStart(2, '0');
const cuatro = (n) => String(n).padStart(4, '0');
const slides = () => fs.readdirSync(path.join(RAIZ, 'slides')).map((f) => f.match(/^slide-(\d+)\.html$/)).filter(Boolean).map((m) => m[1]).sort();
const elige = (arg) => (!arg || arg === 'todos' ? slides() : arg.split(',').map((s) => dos(parseInt(s, 10))));

// servidor local: los slides cargan fuentes, imágenes y JSON por HTTP (por file:// no funcionan)
const servidor = () => new Promise((ok) => {
  const s = http.createServer((q, r) => {
    const p = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0]));
    if (!p.startsWith(RAIZ) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(r);
  });
  s.listen(0, '127.0.0.1', () => ok(s));
});

const abre = async (nav, puerto, n) => {
  const pag = await nav.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  pag.on('pageerror', (e) => console.error(`  slide ${n}:`, e.message));
  await pag.goto(`http://127.0.0.1:${puerto}/slides/slide-${n}.html`);
  await pag.waitForFunction(() => window.__listo === true, null, { timeout: 45000 });
  return pag;
};
const foto = (pag, t, ruta) => pag.evaluate((x) => window.seek(x), t).then(() => pag.screenshot({ clip: { x: 0, y: 0, width: 1080, height: 1350 }, ...(ruta ? { path: ruta } : {}) }));

const [orden, a1, a2, a3] = process.argv.slice(2);
const srv = await servidor(); const puerto = srv.address().port;
const nav = await chromium.launch({ executablePath: chrome, args: ['--disable-gpu', '--disable-gpu-compositing', '--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none', '--hide-scrollbars'] });
try {
  if (orden === 'fotos') {
    const dir = path.join(RAIZ, 'resultados', 'estatico'); fs.mkdirSync(dir, { recursive: true });
    for (const n of elige(a1)) { const p = await abre(nav, puerto, n); await foto(p, 0, path.join(dir, `slide-${n}.png`)); await p.close(); console.log(`✓ resultados/estatico/slide-${n}.png`); }
  } else if (orden === 'frame') {
    const p = await abre(nav, puerto, dos(parseInt(a1, 10))); await foto(p, parseFloat(a2), a3); await p.close(); console.log('✓', a3);
  } else if (orden === 'golpes') {
    const res = { bpm: 120, tiempo_s: 0.5, compas_s: 2, slides: [] }; let compas = 1;
    for (const n of slides()) {
      const p = await abre(nav, puerto, n); const sl = await p.evaluate(() => window.__slide); await p.close();
      const c = Math.round(sl.duracion / 2);
      res.slides.push({ slide: parseInt(n, 10), duracion_s: sl.duracion, compases: c, desde_compas: compas, golpes: sl.golpes || [] });
      compas += c;
    }
    res.compases_total = compas - 1;
    fs.mkdirSync(path.join(RAIZ, 'audio'), { recursive: true });
    fs.writeFileSync(path.join(RAIZ, 'audio', 'golpes.json'), JSON.stringify(res, null, 1));
    console.log(`✓ audio/golpes.json · ${res.slides.length} slides · ${res.compases_total} compases`);
  } else if (orden === 'video') {
    const cola = elige(a1);
    const trabaja = async () => {
      while (cola.length) {
        const n = cola.shift(), t0 = Date.now();
        const p = await abre(nav, puerto, n); const dur = await p.evaluate(() => window.__slide.duracion); const total = Math.round(dur * FPS);
        const guarda = path.join(RAIZ, 'resultados', 'frames', `slide-${n}`); fs.rmSync(guarda, { recursive: true, force: true }); fs.mkdirSync(guarda, { recursive: true });
        const wav = path.join(RAIZ, 'audio', `slide-${n}.wav`), mp4 = path.join(RAIZ, 'resultados', `slide-${n}.mp4`);
        const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-'];
        if (fs.existsSync(wav)) args.push('-i', wav, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000');
        args.push('-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p',
          '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-r', String(FPS), '-t', String(total / FPS), '-movflags', '+faststart', mp4);
        const ff = spawn('ffmpeg', args); let err = ''; ff.stderr.on('data', (d) => (err += d));
        const cierra = new Promise((ok, mal) => ff.on('close', (c) => (c === 0 ? ok() : mal(new Error(err)))));
        for (let i = 0; i < total; i++) {
          const buf = await foto(p, i / FPS);
          if (i % (FPS / 2) === 0 || i === total - 1) fs.writeFileSync(path.join(guarda, `${cuatro(i)}.png`), buf);
          if (!ff.stdin.write(buf)) await new Promise((ok) => ff.stdin.once('drain', ok));
        }
        ff.stdin.end(); await p.close(); await cierra;
        console.log(`✓ resultados/slide-${n}.mp4 · ${total} frames · ${((Date.now() - t0) / 1000).toFixed(0)} s${fs.existsSync(wav) ? '' : ' · sin sonido (ejecuta scripts/musica.py antes)'}`);
      }
    };
    await Promise.all([trabaja(), trabaja(), trabaja()]);
  } else {
    console.log('uso: node scripts/render.mjs fotos|frame|golpes|video …');
  }
} finally { await nav.close(); srv.close(); }
