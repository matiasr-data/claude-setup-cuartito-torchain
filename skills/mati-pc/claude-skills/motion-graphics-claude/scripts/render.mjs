// render.mjs · motion-graphics-claude
// Fotografía cada escena fotograma a fotograma con Chrome sin ventana (window.seek) y la convierte en MP4.
// Se ejecuta desde la carpeta del proyecto. Cada escena es un .html en escenas/ (o un #hash dentro de uno).
//
//   node scripts/render.mjs video [todas|nombre1,nombre2] [--calidad previa|hd|final] [--fps 60] [--hilos 4] [--transparente]
//        (antes de renderizar hace «comprobar» y se para si hay ERRORES; --sin-comprobar para saltarlo. Al final cuenta los
//         fotogramas del MP4: si no son duración × fps, ERROR y el archivo queda como <nombre>.INCOMPLETO.mp4)
//   node scripts/render.mjs comprobar [todas|nombre] [--cada 0.2] [--zona reel|youtube] [--cara x,y,w,h] [--dur s]
//        → líneas que no tocan los nodos, nodos de uno en uno, texto sobre la cara, glifos «□», fuentes que faltan (motor/kit-escenas.js)
//   node scripts/render.mjs frame <nombre> <segundos> <salida.png>
//   node scripts/render.mjs plan <nombre> <salida.json>     → el plan de gráficos de una escena de reel (window.__plan, motor/reel.js)
//   node scripts/render.mjs hoja <nombre> [n=12]          → resultados/hojas/<nombre>.jpg (fotogramas repartidos)
//   node scripts/render.mjs pantalla <interfaz|archivo.html|https://…> [--calidad previa|final] [--fps 30] [--escala 2]
//        [--nombre x] [--ancho 1920 --alto 1080] [--entera] [--png]  → pantallas/<nombre>/ (fotogramas + info.json)
//        La interfaz que luego va en 3D con obj.pantalla('../pantallas/<nombre>'). Busca interfaces/<n>.html y escenas/<n>.html.
//        Si la página no es animada (no tiene window.seek), o es una web, hace una sola captura (--entera: la página entera).
//
//   previa = 1080p 30 fps (rápido, para revisar) · hd = 1080p 60 fps (redes/web) · final = 4K 60 fps (solo cuando el cliente lo aprueba)
//   --transparente: fondo transparente → .mov ProRes 4444 con alfa (para montar encima de otro vídeo)
// Salida: resultados/<nombre>.mp4 (una por animación) y resultados/<nombre>.json (duración, fps, tamaño, tiempo de render).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const RAIZ = process.cwd();
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };
const MODO = args[0] || 'video';
// --tema <nombre>: añade motor/temas/<nombre>.css a cada escena (otra paleta sin tocar el HTML); la salida lleva -<nombre>
// sin --tema, se usa "tema" de estilo.json del proyecto (si lo hay): así un proyecto entero lleva su estilo
const temaJson = (() => { try { return JSON.parse(fs.readFileSync(path.join(RAIZ, 'estilo.json'), 'utf8')).tema || null; } catch { return null; } })();
const TEMA = opt('tema', null) || temaJson, SUF = TEMA && !temaJson ? '-' + TEMA : '';

// Playwright: el de la carpeta de trabajo (o superior); si no, el que deja preparar.py en Documentos/Motion Graphics
let chromium;
for (const base of [path.join(RAIZ, 'package.json'), path.join(RAIZ, '..', 'package.json'), path.join(os.homedir(), 'Documents', 'Motion Graphics', 'package.json'),
  path.join(os.homedir(), 'OneDrive', 'Documentos', 'Motion Graphics', 'package.json'), path.join(os.homedir(), 'Documentos', 'Motion Graphics', 'package.json')]) {
  try { ({ chromium } = createRequire(base)('playwright')); break; } catch {}
}
if (!chromium) { console.error('Falta Playwright. Ejecuta: python <skill>/scripts/preparar.py --instalar'); process.exit(1); }
const chrome = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((p) => fs.existsSync(p));

// codificador: NVENC si hay tarjeta NVIDIA, si no x264 (más lento, misma calidad)
function codificador() {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-v', 'error', '-f', 'lavfi', '-i', 'color=black:s=256x256:d=0.1', '-c:v', 'h264_nvenc', '-f', 'null', '-'], { encoding: 'utf8' });
  return r.status === 0 ? ['-c:v', 'h264_nvenc', '-preset', 'p5', '-rc', 'vbr', '-cq', '17', '-b:v', '0'] : ['-c:v', 'libx264', '-preset', 'medium', '-crf', '16'];
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.wav': 'audio/wav' };
// servidor local: la escena carga el motor, fuentes y vídeos por HTTP (con rangos, para que los <video> se puedan colocar)
const servidor = () => new Promise((ok) => {
  const RAIZ_SRV = path.resolve(RAIZ, '..');   // permite ../motor si el motor está al lado
  const s = http.createServer((q, r) => {
    let p = path.join(RAIZ_SRV, decodeURIComponent(q.url.split('?')[0]));
    if (!p.startsWith(RAIZ_SRV) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; }
    const tam = fs.statSync(p).size, tipo = MIME[path.extname(p).toLowerCase()] || 'application/octet-stream', rango = q.headers.range;
    if (rango) { const [a, b] = rango.replace('bytes=', '').split('-'); const i = parseInt(a, 10), f = b ? parseInt(b, 10) : tam - 1;
      r.writeHead(206, { 'Content-Type': tipo, 'Content-Range': `bytes ${i}-${f}/${tam}`, 'Accept-Ranges': 'bytes', 'Content-Length': f - i + 1 }); fs.createReadStream(p, { start: i, end: f }).pipe(r); return; }
    if (TEMA && tipo.startsWith('text/html')) {   // tema: la hoja se inyecta la última para que mande sobre estilo.css
      const tema = path.join(RAIZ, 'motor', 'temas', TEMA + '.css');
      const href = '/' + path.relative(RAIZ_SRV, tema).split(path.sep).join('/');
      const html = fs.readFileSync(p, 'utf8').replace(/<\/head>|<script/i, (m) => `<link rel="stylesheet" href="${href}">
${m}`);
      r.writeHead(200, { 'Content-Type': tipo }); r.end(html); return; }
    r.writeHead(200, { 'Content-Type': tipo, 'Content-Length': tam, 'Accept-Ranges': 'bytes' }); fs.createReadStream(p).pipe(r);
  });
  s.listen(0, '127.0.0.1', () => ok(s));
});

// escenas: escenas/<nombre>.html, o escenas.json con [{nombre, archivo, hash}] para varias escenas en un mismo HTML
function escenas() {
  const lista = [], dir = path.join(RAIZ, 'escenas');
  const cfg = path.join(RAIZ, 'escenas.json');
  if (fs.existsSync(cfg)) for (const e of JSON.parse(fs.readFileSync(cfg, 'utf8'))) lista.push({ nombre: e.nombre, archivo: e.archivo, hash: e.hash || '' });
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.html')).sort())
    if (!lista.some((e) => e.archivo === 'escenas/' + f)) lista.push({ nombre: f.replace(/\.html$/, ''), archivo: 'escenas/' + f, hash: '' });
  return lista;
}
const elige = (arg) => { const t = escenas(); return !arg || arg === 'todas' ? t : arg.split(',').map((n) => t.find((e) => e.nombre === n) || (console.error('No existe la escena', n), process.exit(1))); };

async function abrir(nav, srv, e, dpr) {
  const pag = await nav.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: dpr });
  if (opt('transparente', false)) await pag.addInitScript(() => { window.__alfa = true; });   // reels: la escena quita la toma y deja solo los gráficos
  pag.on('pageerror', (er) => console.error(`  [${e.nombre}] error en la página:`, er.message));
  const url = `http://127.0.0.1:${srv.address().port}/${path.basename(RAIZ)}/${e.archivo}${e.hash}`;
  await pag.goto(url);
  await pag.waitForFunction(() => window.__listo === true, null, { timeout: 180000 });
  const info = await pag.evaluate(() => ({ dur: window.__duracion, w: window.__ancho, h: window.__alto }));
  await pag.setViewportSize({ width: info.w, height: info.h });
  return { pag, info };
}

async function video(lista) {
  // previa = 1080p 30 fps · hd = 1080p 60 fps (redes, web) · final = 4K 60 fps
  const calidad = opt('calidad', 'previa'), dpr = calidad === 'final' ? 2 : 1, fps = parseInt(opt('fps', calidad === 'previa' ? 30 : 60), 10);
  const hilos = parseInt(opt('hilos', Math.max(1, Math.min(4, Math.floor(os.cpus().length / 4)))), 10), alfa = !!opt('transparente', false);
  const enc = alfa ? ['-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le'] : [...codificador(), '-pix_fmt', 'yuv420p'];
  const srv = await servidor(), nav = await chromium.launch({ executablePath: chrome, args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
  fs.mkdirSync(path.join(RAIZ, 'resultados'), { recursive: true });
  for (const e of lista) {
    const t0 = Date.now(), { pag, info } = await abrir(nav, srv, e, dpr); await pag.close();
    const total = Math.round(info.dur * fps), trozo = Math.ceil(total / hilos), tmp = path.join(RAIZ, 'resultados', `.${e.nombre}`);
    fs.rmSync(tmp, { recursive: true, force: true });   // trozos de un render anterior que falló (con otro nº de hilos se colarían en la unión)
    fs.mkdirSync(tmp, { recursive: true });
    console.log(`▶ ${e.nombre}: ${info.w * dpr}×${info.h * dpr}, ${fps} fps, ${info.dur} s (${total} fotogramas, ${hilos} hilos)`);
    // cada hilo renderiza su tramo a un vídeo intermedio; luego se unen sin recomprimir
    await Promise.all(Array.from({ length: hilos }, async (_, h) => {
      const a = h * trozo, b = Math.min(total, a + trozo); if (a >= b) return;
      const { pag: p } = await abrir(nav, srv, e, dpr);
      await p.evaluate((f) => { window.__fps = f; }, fps);   // el obturador del 3D (lente3d.js) lo necesita
      const salida = path.join(tmp, `${h}.${alfa ? 'mov' : 'mp4'}`);
      const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', ...enc, '-r', String(fps), salida], { stdio: ['pipe', 'inherit', 'inherit'] });
      for (let i = a; i < b; i++) {
        await p.evaluate((t) => window.seek(t), i / fps);
        const png = await p.screenshot({ type: 'png', omitBackground: alfa, timeout: 0 });   // sin límite: en 4K con lente de cine un fotograma puede tardar
        if (!ff.stdin.write(png)) await new Promise((ok) => ff.stdin.once('drain', ok));
        if (h === 0 && (i - a) % fps === 0) process.stdout.write(`  ${Math.round(100 * (i - a) / (b - a))} %\r`);
      }
      ff.stdin.end();
      // auditoría 27-10: si ffmpeg falla en un trozo, el render se para (antes se unía lo que hubiera y faltaban segundos sin avisar)
      const cod = await new Promise((ok) => ff.on('close', ok)); await p.close();
      if (cod !== 0) throw new Error(`[${e.nombre}] el trozo ${a}–${b} falló (ffmpeg salió con ${cod}). No se une nada.`);
      const n = fotogramas(salida);
      if (n !== b - a) throw new Error(`[${e.nombre}] el trozo ${a}–${b} tiene ${n} fotogramas y debería tener ${b - a}.`);
    }));
    const partes = fs.readdirSync(tmp).filter((f) => /^\d+\.(mp4|mov)$/.test(f)).sort((x, y) => parseInt(x) - parseInt(y)).map((f) => `file '${path.join(tmp, f).replace(/\\/g, '/')}'`);
    fs.writeFileSync(path.join(tmp, 'lista.txt'), partes.join('\n'));
    const final = path.join(RAIZ, 'resultados', `${e.nombre}${SUF}${calidad === 'previa' ? '-previa' : calidad === 'hd' ? '-1080p' : ''}.${alfa ? 'mov' : 'mp4'}`);
    const uni = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'lista.txt'), '-c', 'copy', '-movflags', '+faststart', final], { stdio: 'inherit' });
    // comprobación final: fotogramas del archivo = duración × fps (si no, ERROR y el archivo se marca como incompleto)
    const nFinal = uni.status === 0 ? fotogramas(final) : -1;
    if (nFinal !== total) {
      const malo = final.replace(/\.(mp4|mov)$/, '.INCOMPLETO.$1');
      try { if (fs.existsSync(final)) fs.renameSync(final, malo); } catch {}
      console.error(`✗ ${e.nombre}: el vídeo tiene ${nFinal} fotogramas y debería tener ${total} (${info.dur} s × ${fps} fps). Guardado como ${path.basename(malo)}; los trozos siguen en ${tmp}.`);
      process.exitCode = 1; continue;
    }
    fs.rmSync(tmp, { recursive: true, force: true });
    const seg = ((Date.now() - t0) / 1000).toFixed(1);
    fs.writeFileSync(final.replace(/\.(mp4|mov)$/, '.json'), JSON.stringify({ escena: e.nombre, archivo: path.basename(final), duracion: info.dur, fps, ancho: info.w * dpr, alto: info.h * dpr, calidad, render_s: +seg }, null, 1));
    console.log(`✓ ${path.relative(RAIZ, final)} · ${seg} s · ${nFinal} fotogramas comprobados`);
  }
  await nav.close(); srv.close();
}

// fotogramas reales de un vídeo (cuenta paquetes: no se fía de la cabecera)
function fotogramas(f) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', f], { encoding: 'utf8' });
  return r.status === 0 ? parseInt((r.stdout || '').trim(), 10) : -1;
}

// comprobar: recorre cada escena con window.seek y busca lo que más se escapa en una revisión a mano (auditoría 27-10):
// líneas que no tocan los nodos, nodos que salen de uno en uno, texto encima de la cara o fuera de la zona segura,
// textos cortados o pisados, glifos vacíos («□») y fuentes que no están instaladas. Usa motor/kit-escenas.js.
//   node scripts/render.mjs comprobar [todas|nombre] [--cada 0.2] [--zona reel|youtube] [--cara x,y,w,h] [--dur s]
async function comprobar(lista, { solo = false } = {}) {
  const kit = path.join(RAIZ, 'motor', 'kit-escenas.js');
  if (!fs.existsSync(kit)) { console.log('· (sin motor/kit-escenas.js: copia el de la skill para comprobar las escenas)'); return 0; }
  // pantalla en 3D: la interfaz tiene que estar ya en fotogramas (si no, la pantalla sale vacía sin avisar)
  let faltanPantallas = 0;
  for (const e of lista) {
    const html = fs.readFileSync(path.join(RAIZ, e.archivo), 'utf8');
    for (const m of html.matchAll(/['"]\.\.\/pantallas\/([\w.-]+)['"]/g)) {
      if (!fs.existsSync(path.join(RAIZ, 'pantallas', m[1], 'info.json'))) {
        console.log(`✗ ${e.nombre}: falta la interfaz en fotogramas pantallas/${m[1]}/. Primero: node scripts/render.mjs pantalla ${m[1]}`);
        faltanPantallas++;
      }
    }
  }
  if (faltanPantallas) return faltanPantallas;
  const cada = parseFloat(opt('cada', '0.2')), zonas = [];
  const zona = opt('zona', null);
  if (zona === 'youtube') zonas.push({ x: 96, y: 54, w: 1728, h: 972, nombre: 'títulos YouTube (5 %)', tipo: 'segura' });
  if (zona === 'reel') zonas.push({ x: 60, y: 260, w: 880, h: 1220, nombre: 'Reels / Instagram', tipo: 'segura' });
  args.forEach((a, i) => { if (a === '--cara' && args[i + 1]) { const [x, y, w, h] = args[i + 1].split(',').map(Number); zonas.push({ x, y, w, h, nombre: 'la cara', tipo: 'cara' }); } });
  const srv = await servidor(), nav = await chromium.launch({ executablePath: chrome, args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
  let errores = 0;
  for (const e of lista) {
    const { pag, info } = await abrir(nav, srv, e, 1);
    if (!(await pag.evaluate(() => !!(window.VK && window.VK.__version)))) { await pag.evaluate(() => { window.VK_SIN_FUENTES = true; }); await pag.addScriptTag({ path: kit }); }
    const r = await pag.evaluate((o) => window.VK.comprobarEscena(o), { cada, zonas });
    const dPlan = opt('dur', null);
    if (dPlan !== null && dPlan !== true && Math.abs(parseFloat(dPlan) - info.dur) > 1.5 / 60) r.problemas.unshift({ gravedad: 'error', tipo: 'duracion-distinta', msg: `dura ${info.dur} s y el plan dice ${dPlan} s.`, tramos: [] });
    const ne = r.problemas.filter((p) => p.gravedad === 'error').length;
    errores += ne;
    console.log(`${ne ? '✗' : '✓'} comprobar ${e.nombre}: ${ne} errores · ${r.problemas.length - ne} avisos`);
    for (const p of r.problemas) console.log(`   ${p.gravedad === 'error' ? 'ERROR' : 'aviso'} ${p.tipo}${p.tramos && p.tramos.length ? ` [${p.tramos.slice(0, 3).map(([a, b]) => (a === b ? a.toFixed(2) : `${a.toFixed(2)}–${b.toFixed(2)}`)).join(', ')} s]` : ''}${p.que ? ` · ${p.que}` : ''}: ${p.msg}`);
    await pag.close();
  }
  await nav.close(); srv.close();
  if (solo) process.exitCode = errores ? 1 : 0;
  return errores;
}

async function frame(nombre, t, salida) {
  const srv = await servidor(), nav = await chromium.launch({ executablePath: chrome });
  const { pag } = await abrir(nav, srv, elige(nombre)[0], 1);
  await pag.evaluate((t) => window.seek(t), parseFloat(t)); await pag.screenshot({ path: salida });
  await nav.close(); srv.close(); console.log('✓', salida);
}

async function plan(nombre, salida) {
  const srv = await servidor(), nav = await chromium.launch({ executablePath: chrome });
  const e = elige(nombre)[0], { pag, info } = await abrir(nav, srv, e, 1);
  const p = await pag.evaluate(() => window.__plan || []);
  fs.mkdirSync(path.dirname(path.resolve(salida)), { recursive: true });
  fs.writeFileSync(salida, JSON.stringify({ escena: e.nombre, duracion: info.dur, ancho: info.w, alto: info.h, graficos: p }, null, 1));
  await nav.close(); srv.close(); console.log('✓', salida, `(${p.length} gráficos)`);
}

async function hoja(nombre, n = 12) {
  const srv = await servidor(), nav = await chromium.launch({ executablePath: chrome });
  const e = elige(nombre)[0], { pag, info } = await abrir(nav, srv, e, 1);
  const dir = path.join(RAIZ, 'resultados', 'hojas', `.${e.nombre}`); fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < n; i++) { const t = (info.dur * (i + 0.5)) / n; await pag.evaluate((t) => window.seek(t), t); await pag.screenshot({ path: path.join(dir, `f${String(i).padStart(2, '0')}.png`) }); }
  await nav.close(); srv.close();
  const sal = path.join(RAIZ, 'resultados', 'hojas', `${e.nombre}${SUF}.jpg`), cols = n > 9 ? 4 : 3;
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-start_number', '0', '-i', path.join(dir, 'f%02d.png'), '-vf', `scale=640:-1,tile=${cols}x${Math.ceil(n / cols)}`, '-frames:v', '1', sal], { stdio: 'inherit' });
  fs.rmSync(dir, { recursive: true, force: true }); console.log('✓', path.relative(RAIZ, sal));
}

// interfaz → fotogramas para la «pantalla en 3D» (obj.pantalla): una escena HTML animada, un .html suelto o una web
async function pantalla(fuente) {
  if (!fuente) { console.error('Uso: node scripts/render.mjs pantalla <interfaz|archivo.html|https://…>'); process.exit(1); }
  const calidad = opt('calidad', 'previa'), fps = parseInt(opt('fps', calidad === 'final' ? 60 : 30), 10), escala = parseFloat(opt('escala', calidad === 'final' ? 3 : 2));
  const fmt = opt('png', false) ? 'png' : 'jpg', hilos = parseInt(opt('hilos', Math.max(1, Math.min(4, Math.floor(os.cpus().length / 4)))), 10);
  const web = /^https?:\/\//i.test(fuente);
  let archivo = null, nombre;
  if (web) nombre = opt('nombre', new URL(fuente).hostname.replace(/[^a-z0-9]+/gi, '-'));
  else {
    archivo = [path.join('interfaces', fuente + '.html'), path.join('escenas', fuente + '.html'), fuente].find((f) => f.endsWith('.html') && fs.existsSync(path.join(RAIZ, f)));
    if (!archivo) { console.error('No encuentro la interfaz', fuente, '(mira en interfaces/ o escenas/)'); process.exit(1); }
    archivo = path.relative(RAIZ, path.resolve(RAIZ, archivo)).split(path.sep).join('/'); nombre = opt('nombre', path.basename(archivo, '.html'));
  }
  const dir = path.join(RAIZ, 'pantallas', nombre); fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (/^(f\d{6}\.(jpg|png)|pagina\.(jpg|png)|info\.json)$/.test(f)) fs.rmSync(path.join(dir, f));   // solo lo que hizo este modo
  const srv = await servidor(), nav = await chromium.launch({ executablePath: chrome, args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
  const vw = parseInt(opt('ancho', 1920), 10), vh = parseInt(opt('alto', 1080), 10);
  const abre = async () => {
    const pag = await nav.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: escala });
    pag.on('pageerror', (er) => console.error(`  [${nombre}] error en la página:`, er.message));
    await pag.goto(web ? fuente : `http://127.0.0.1:${srv.address().port}/${path.basename(RAIZ)}/${archivo}`, { waitUntil: 'load', timeout: 120000 });
    if (await pag.evaluate(() => typeof window.seek === 'function')) {
      await pag.waitForFunction(() => window.__listo === true, null, { timeout: 180000 });
      const info = await pag.evaluate(() => ({ dur: window.__duracion, w: window.__ancho, h: window.__alto }));
      await pag.setViewportSize({ width: info.w, height: info.h }); return { pag, info };
    }
    await pag.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {}); await pag.waitForTimeout(500); return { pag, info: null };
  };
  const t0 = Date.now(), tipo = fmt === 'jpg' ? { type: 'jpeg', quality: 95 } : { type: 'png' };
  const { pag, info } = await abre();
  if (!info) {   // página fija o web: una captura
    const entera = !!opt('entera', false), sal = `pagina.${fmt}`;
    await pag.screenshot({ path: path.join(dir, sal), fullPage: entera, ...tipo });
    const alto = entera ? await pag.evaluate(() => document.documentElement.scrollHeight) : vh;
    fs.writeFileSync(path.join(dir, 'info.json'), JSON.stringify({ tipo: 'imagen', archivo: sal, ancho: vw, alto, escala, fuente }, null, 1));
    console.log(`✓ pantallas/${nombre}/${sal} · ${vw}×${alto} px (×${escala}) · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  } else {
    await pag.close();
    const total = Math.max(1, Math.round(info.dur * fps)), trozo = Math.ceil(total / hilos);
    console.log(`▶ ${nombre}: ${info.w}×${info.h} ×${escala} (${info.w * escala}×${info.h * escala} px), ${fps} fps, ${info.dur} s (${total} fotogramas)`);
    await Promise.all(Array.from({ length: hilos }, async (_, h) => {
      const a = h * trozo, b = Math.min(total, a + trozo); if (a >= b) return;
      const { pag: p } = await abre(); await p.evaluate((f) => { window.__fps = f; }, fps);
      for (let i = a; i < b; i++) {
        await p.evaluate((t) => window.seek(t), i / fps);
        await p.screenshot({ path: path.join(dir, `f${String(i).padStart(6, '0')}.${fmt}`), ...tipo, timeout: 0 });
        if (h === 0 && (i - a) % fps === 0) process.stdout.write(`  ${Math.round(100 * (i - a) / (b - a))} %
`);
      }
      await p.close();
    }));
    fs.writeFileSync(path.join(dir, 'info.json'), JSON.stringify({ tipo: 'cuadros', fps, n: total, ancho: info.w, alto: info.h, escala, ext: fmt, duracion: info.dur, fuente: archivo }, null, 1));
    console.log(`✓ pantallas/${nombre}/ · ${total} fotogramas · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  await nav.close(); srv.close();
}

if (MODO === 'video') {
  const lista = elige(args[1] && !args[1].startsWith('--') ? args[1] : 'todas');
  // antes de gastar minutos de render: la comprobación automática (se salta con --sin-comprobar)
  if (!opt('sin-comprobar', false) && (await comprobar(lista)) > 0) {
    console.error('✗ Hay ERRORES en las escenas (arriba): corrígelos antes de renderizar. Si de verdad quieres renderizar así: --sin-comprobar');
    process.exit(1);
  }
  await video(lista);
}
else if (MODO === 'comprobar') await comprobar(elige(args[1] && !args[1].startsWith('--') ? args[1] : 'todas'), { solo: true });
else if (MODO === 'frame') await frame(args[1], args[2], args[3]);
else if (MODO === 'plan') await plan(args[1], args[2] || path.join('resultados', 'capas', 'plan.json'));
else if (MODO === 'hoja') await hoja(args[1], parseInt(args[2] || '12', 10));
else if (MODO === 'pantalla') await pantalla(args[1]);
else { console.log('Uso: node scripts/render.mjs video|comprobar|frame|hoja|pantalla …'); process.exit(1); }
