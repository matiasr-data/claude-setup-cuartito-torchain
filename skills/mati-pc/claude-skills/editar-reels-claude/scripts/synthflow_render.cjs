// SynthFlow Studio sin interfaz: genera la MÚSICA de fondo o el SET DE EFECTOS en WAV, sin descargar nada.
//
//   node synthflow_render.cjs music synthwave 40 musica.wav     (géneros: synthwave | lofi)
//   node synthflow_render.cjs sfx   sfx/                         (whoosh, impact, riser, uiclick, glitch, braaam)
//
// Requisitos: Google Chrome y `npm install` en esta carpeta (instala puppeteer-core).
// Navegador: variable CHROME_PATH, o Chrome / Edge / Chromium en su ruta por defecto de Windows / macOS / Linux.
// (Edge viene instalado en todos los Windows, así que en Windows no hace falta instalar Chrome.)
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const STUDIO = path.resolve(__dirname, "..", "synthflow", "synthflow.html");
const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/microsoft-edge",
].filter(Boolean);
const chrome = CANDIDATES.find((p) => fs.existsSync(p));
if (!chrome) { console.error("No encuentro Chrome ni Edge. Instala Google Chrome o indica la ruta del navegador con la variable CHROME_PATH."); process.exit(1); }

const [mode = "music", ...rest] = process.argv.slice(2);

(async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--autoplay-policy=no-user-gesture-required"] });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("Error en SynthFlow:", e.message));
  await page.goto("file:///" + STUDIO.replace(/\\/g, "/"), { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1500));

  const toB64 = async (blob) => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
  await page.exposeFunction("__noop", () => {});
  await page.evaluate(`window.__toB64 = ${toB64.toString()}`);

  if (mode === "music") {
    const [genre = "synthwave", secs = "40", out = "musica.wav"] = rest;
    const b64 = await page.evaluate(async (genre, secs) => {
      selectGenre(genre);
      const buf = await renderProceduralTrackOffline(Number(secs), 48000);
      return window.__toB64(encodeAudioBufferToWAV(buf, 16, false, true));
    }, genre, secs);
    fs.writeFileSync(path.resolve(out), Buffer.from(b64, "base64"));
    console.log(`música ${genre} · ${secs} s → ${out}`);
  } else if (mode === "sfx") {
    const dir = path.resolve(rest[0] || "sfx");
    fs.mkdirSync(dir, { recursive: true });
    for (const type of ["whoosh", "impact", "riser", "uiclick", "glitch", "braaam"]) {
      // En vez de descargar, el estudio nos devuelve el WAV: se intercepta downloadBlob.
      const b64 = await page.evaluate(async (type) => {
        let captured = null;
        const original = window.downloadBlob;
        window.downloadBlob = (blob) => { captured = blob; };
        try { await downloadSingleSFX(type); } finally { window.downloadBlob = original; }
        return captured ? window.__toB64(captured) : null;
      }, type);
      if (!b64) { console.error("No se pudo generar", type); continue; }
      fs.writeFileSync(path.join(dir, type + ".wav"), Buffer.from(b64, "base64"));
      console.log("efecto →", path.join(dir, type + ".wav"));
    }
  } else {
    console.error("Modo desconocido. Usa: music | sfx");
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
