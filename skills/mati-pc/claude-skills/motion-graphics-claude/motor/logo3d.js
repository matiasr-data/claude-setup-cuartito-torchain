// logo3d.js · motion-graphics-claude · cualquier logo o archivo convertido en un objeto 3D
// Lo usa motor3d: obj.logo(fuente, opciones). Devuelve un grupo al momento y lo rellena al cargar (la escena espera sola).
//
//   const marca = obj.logo('../recursos/mi-logo.svg', { tam: 2, material: 'original' });
//   scene.add(marca);                       // de pie: base en y = 0, centrado en x y z, mirando a +z
//
// fuente:
//   · .svg  → los <path>, <rect>, <circle>, <ellipse> y <polygon> de verdad, con sus colores, huecos y transformaciones.
//            Cada pieza sale un poco más que la anterior (relieve por capas, como un logo de metal).
//   · .png / .jpg / .webp → se calca el contorno: con transparencia (lo opaco es el logo) o sobre un fondo liso
//            (lo que se distingue del color de las esquinas). Un solo color: el medio del logo, o el material que digas.
//   · .glb / .gltf → el modelo tal cual, escalado y centrado.
//   · 'claude' → el isotipo de Claude · 'mascota' → la mascota de Claude Code (personaje: anda, salta, saluda).
// opciones: tam (ancho final, 1) · alto (en vez de ancho) · fondo (grosor, fracción del ancho, 0,16) · bisel (0,03)
//   material: 'original' (los colores del archivo) · 'coral' · 'cristal' · 'metal' · 'oscuro' · 'brillo' · o un THREE.Material
//   color (para PNG: fuerza un color) · capas (relieve por piezas en SVG, true) · umbral (PNG sobre fondo, 80)
//   invertir (PNG: el logo es lo «vacío») · suave (PNG: redondeo de esquinas, 1; 0 = esquinas vivas) · detalle (PNG: 512)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { trazado, formas, formasDePoligonos, CLAUDE } from './svg3d.js';
import { crearMascota } from './mascota3d.js';

const ext = (s) => ((s.split('?')[0].match(/\.([a-z0-9]+)$/i) || [])[1] || '').toLowerCase();

export function crearLogo(fuente, ctx, o = {}) {
  const { MG, mat } = ctx, g = new THREE.Group();
  const material = (color) => {
    const m = o.material ?? 'original';
    if (m && m.isMaterial) return m;
    // los colores del archivo, algo más oscuros: el tone mapping (ACES) y las luces de estudio los aclaran
    if (m === 'original') return new THREE.MeshPhysicalMaterial({ color: color ? color.clone().multiplyScalar(0.72) : 0xC4552F, roughness: 0.34, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.18 });
    return (mat[m] || mat.coral)();
  };
  const extruye = (shapes, profundo, bisel) => new THREE.ExtrudeGeometry(shapes, { depth: profundo, bevelEnabled: bisel > 0, bevelSize: bisel * 0.7, bevelThickness: bisel, bevelSegments: 5, curveSegments: 10 });

  // coloca el contenido: ancho «tam» (o alto), centrado, de pie con la base en y = 0 y el grosor centrado en z
  const encaja = (hijo) => {
    const caja = new THREE.Box3().setFromObject(hijo), tam = new THREE.Vector3(); caja.getSize(tam);
    const s = o.alto ? o.alto / tam.y : (o.tam ?? 1) / Math.max(1e-6, tam.x);
    hijo.scale.multiplyScalar(s); hijo.updateMatrixWorld(true);
    const c2 = new THREE.Box3().setFromObject(hijo), cen = new THREE.Vector3(); c2.getCenter(cen);
    hijo.position.sub(new THREE.Vector3(cen.x, c2.min.y, cen.z)); g.add(hijo);
    hijo.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  };

  async function svg(url) {
    const txt = await (await fetch(url)).text();
    const doc = new DOMParser().parseFromString(txt, 'image/svg+xml'), raiz = doc.documentElement;
    if (raiz.nodeName.toLowerCase() !== 'svg') throw new Error(`${url} no es un SVG válido`);
    // se mete en la página (oculto) para que el navegador resuelva estilos heredados y transformaciones
    const caja = document.createElement('div'); caja.style.cssText = 'position:absolute;left:-99999px;top:0;opacity:0;pointer-events:none';   // opacity, no visibility: esa se hereda
    const el = document.importNode(raiz, true); caja.appendChild(el); document.body.appendChild(caja);
    const piezas = [];
    el.querySelectorAll('path,rect,circle,ellipse,polygon').forEach((n) => {
      if (n.closest('defs,clipPath,mask,symbol,pattern,marker')) return;
      const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden') return;
      let relleno = cs.fill; if (!relleno || relleno === 'none') return;
      if (+cs.fillOpacity === 0 || +cs.opacity === 0) return;
      if (relleno.startsWith('url(')) { const id = relleno.match(/#([^)"']+)/)?.[1], stop = id && el.querySelector(`#${CSS.escape(id)} stop`);
        relleno = stop ? (getComputedStyle(stop).stopColor || '#D97757') : '#D97757'; }
      const d = aD(n); if (!d) return;
      const m = n.getCTM(); piezas.push({ d, color: relleno, m });
    });
    caja.remove();
    if (!piezas.length) throw new Error(`${url}: no hay formas con relleno (si el logo son solo trazos, conviértelos en contornos al exportarlo)`);
    const grupo = new THREE.Group(), cajaT = new THREE.Box2(), fs = [];
    for (const pz of piezas) { const sh = formas(trazado(pz.d)); fs.push(sh);
      sh.forEach((f) => f.getPoints(6).forEach((p) => { const x = pz.m.a * p.x - pz.m.c * p.y + pz.m.e, y = -pz.m.b * p.x + pz.m.d * p.y - pz.m.f; cajaT.expandByPoint(new THREE.Vector2(x, y)); })); }
    // grosor y bisel según el lado corto: un logo muy ancho (un wordmark) no sale como un ladrillo
    const ancho = Math.max(1e-6, Math.min(cajaT.max.x - cajaT.min.x, cajaT.max.y - cajaT.min.y)), fondo = (o.fondo ?? 0.16) * ancho, bisel = (o.bisel ?? 0.03) * ancho, paso = o.capas === false ? 0 : 0.025 * ancho;
    piezas.forEach((pz, i) => {
      if (!fs[i].length) return;
      const geo = extruye(fs[i], fondo + i * paso, bisel);
      const { a, b, c, d: dd, e, f } = pz.m;                // la transformación SVG, con y hacia arriba
      geo.applyMatrix4(new THREE.Matrix4().set(a, -c, 0, e, -b, dd, 0, -f, 0, 0, 1, 0, 0, 0, 0, 1));
      grupo.add(new THREE.Mesh(geo, material(new THREE.Color().setStyle(pz.color))));
    });
    encaja(grupo);
  }

  async function imagen(url) {
    const im = await new Promise((ok, mal) => { const x = new Image(); x.onload = () => ok(x); x.onerror = () => mal(new Error('No se pudo cargar ' + url)); x.src = url; });
    const det = o.detalle ?? 512, k = Math.min(1, det / Math.max(im.naturalWidth, im.naturalHeight));
    const W = Math.max(2, Math.round(im.naturalWidth * k)), H = Math.max(2, Math.round(im.naturalHeight * k));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c2 = cv.getContext('2d', { willReadFrequently: true });
    c2.drawImage(im, 0, 0, W, H); const px = c2.getImageData(0, 0, W, H).data;
    // ¿transparencia o fondo liso?
    let transp = 0; for (let i = 3; i < px.length; i += 4) if (px[i] < 200) transp++;
    const conAlfa = transp > W * H * 0.02;
    const esq = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].map(([x, y]) => { const i = (y * W + x) * 4; return [px[i], px[i + 1], px[i + 2]]; });
    const bg = [0, 1, 2].map((c) => esq.reduce((s, e) => s + e[c], 0) / 4), um = o.umbral ?? 80;
    const lleno = new Uint8Array((W + 2) * (H + 2)), at = (x, y) => lleno[(y + 1) * (W + 2) + (x + 1)];
    let r = 0, gg = 0, b = 0, n = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let v = conAlfa ? px[i + 3] > 127 : Math.hypot(px[i] - bg[0], px[i + 1] - bg[1], px[i + 2] - bg[2]) > um;
      if (o.invertir) v = !v;
      if (v) { lleno[(y + 1) * (W + 2) + (x + 1)] = 1; r += px[i]; gg += px[i + 1]; b += px[i + 2]; n++; }
    }
    if (!n) throw new Error(`${url}: no se distingue ningún logo (prueba con umbral o invertir)`);
    // contornos: los lados de píxel entre lleno y vacío, encadenados (lo lleno queda a la derecha)
    const lados = new Map(), clave = (x, y) => x * 100003 + y, suma = (x1, y1, x2, y2) => { const k2 = clave(x1, y1); if (!lados.has(k2)) lados.set(k2, []); lados.get(k2).push([x1, y1, x2, y2, false]); };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!at(x, y)) continue;
      if (!at(x, y - 1)) suma(x, y, x + 1, y); if (!at(x + 1, y)) suma(x + 1, y, x + 1, y + 1);
      if (!at(x, y + 1)) suma(x + 1, y + 1, x, y + 1); if (!at(x - 1, y)) suma(x, y + 1, x, y);
    }
    const lazos = [];
    for (const lista of lados.values()) for (const ini of lista) {
      if (ini[4]) continue; const lazo = []; let e = ini;
      while (e && !e[4]) { e[4] = true; lazo.push([e[0], e[1]]); const dx = e[2] - e[0], dy = e[3] - e[1];
        const sig = (lados.get(clave(e[2], e[3])) || []).filter((q) => !q[4]);
        // en un cruce en diagonal se gira a la derecha: separa dos zonas que solo se tocan por una esquina
        e = sig.length > 1 ? (sig.find((q) => q[2] - q[0] === -dy && q[3] - q[1] === dx) || sig[0]) : sig[0]; }
      if (lazo.length >= 4) lazos.push(lazo);
    }
    const simplifica = (pts, tol) => {             // Douglas-Peucker sobre un lazo cerrado
      const dp = (a, z) => { let mx = 0, im2 = -1; const [x1, y1] = pts[a], [x2, y2] = pts[z], L = Math.hypot(x2 - x1, y2 - y1) || 1;
        for (let i = a + 1; i < z; i++) { const dd = Math.abs((x2 - x1) * (y1 - pts[i][1]) - (x1 - pts[i][0]) * (y2 - y1)) / L; if (dd > mx) { mx = dd; im2 = i; } }
        return mx > tol ? [...dp(a, im2).slice(0, -1), ...dp(im2, z)] : [pts[a], pts[z]]; };
      const mitad = Math.floor(pts.length / 2); return [...dp(0, mitad).slice(0, -1), ...dp(mitad, pts.length - 1)];
    };
    const chaikin = (pts, it) => { for (let k3 = 0; k3 < it; k3++) { const q = []; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      q.push([0.75 * x1 + 0.25 * x2, 0.75 * y1 + 0.25 * y2], [0.25 * x1 + 0.75 * x2, 0.25 * y1 + 0.75 * y2]); } pts = q; } return pts; };
    const polis = lazos.map((l) => chaikin(simplifica(l, 0.75), o.suave ?? 1)).filter((p) => p.length >= 3)
      .map((p) => p.map(([x, y]) => new THREE.Vector2(x, H - y)));          // y hacia arriba
    const fs = formasDePoligonos(polis).filter((f) => { const a = Math.abs(THREE.ShapeUtils.area(f.getPoints())); return a > 6; });
    const cj = new THREE.Box2(); polis.forEach((p) => p.forEach((v) => cj.expandByPoint(v)));
    const ancho = Math.min(cj.max.x - cj.min.x, cj.max.y - cj.min.y), fondo = (o.fondo ?? 0.16) * ancho, bisel = (o.bisel ?? 0.03) * ancho;
    const color = o.color ? new THREE.Color(o.color) : new THREE.Color().setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace);
    encaja(new THREE.Mesh(extruye(fs, fondo, bisel), material(color)));
  }

  async function modelo(url) {
    const gl = await new Promise((ok, mal) => new GLTFLoader().load(url, ok, undefined, () => mal(new Error('No se pudo cargar ' + url))));
    if (o.material && o.material !== 'original') gl.scene.traverse((m) => { if (m.isMesh) m.material = material(); });
    encaja(gl.scene); g.animaciones = gl.animations;
  }

  const tarea = (async () => {
    if (fuente === 'mascota') { const m = crearMascota(mat, { tam: o.tam ?? 1, mat: o.material?.isMaterial ? o.material : undefined }); g.add(m); g.mascota = m; return; }
    if (fuente === 'claude') return svgTexto(CLAUDE);
    const e = ext(fuente);
    if (e === 'svg') return svg(fuente);
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'].includes(e)) return imagen(fuente);
    if (e === 'glb' || e === 'gltf') return modelo(fuente);
    throw new Error(`obj.logo: no sé abrir «${fuente}» (usa .svg, .png, .jpg, .webp, .glb, .gltf, 'claude' o 'mascota')`);
  })().catch((er) => { console.error(er.message); throw er; });
  async function svgTexto(d) { const sh = formas(trazado(d)); const cajaT = new THREE.Box2(); sh.forEach((f) => f.getPoints(6).forEach((p) => cajaT.expandByPoint(p)));
    const ancho = Math.min(cajaT.max.x - cajaT.min.x, cajaT.max.y - cajaT.min.y); encaja(new THREE.Mesh(extruye(sh, (o.fondo ?? 0.16) * ancho, (o.bisel ?? 0.03) * ancho), material(new THREE.Color('#D97757')))); }
  (MG._listos ||= []).push(tarea.catch(() => {}));
  g.listo = tarea;
  return g;
}

// el «d» de un <path>, o el equivalente de un <rect>, <circle>, <ellipse> o <polygon>
function aD(n) {
  const v = (k) => parseFloat(n.getAttribute(k)) || 0, t = n.nodeName.toLowerCase();
  if (t === 'path') return n.getAttribute('d');
  if (t === 'rect') { const x = v('x'), y = v('y'), w = v('width'), h = v('height'); let rx = v('rx'), ry = v('ry'); if (!w || !h) return null;
    if (!rx && ry) rx = ry; if (!ry && rx) ry = rx; rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
    if (!rx) return `M${x} ${y}h${w}v${h}h${-w}z`;
    return `M${x + rx} ${y}h${w - 2 * rx}a${rx} ${ry} 0 0 1 ${rx} ${ry}v${h - 2 * ry}a${rx} ${ry} 0 0 1 ${-rx} ${ry}h${-(w - 2 * rx)}a${rx} ${ry} 0 0 1 ${-rx} ${-ry}v${-(h - 2 * ry)}a${rx} ${ry} 0 0 1 ${rx} ${-ry}z`; }
  if (t === 'circle' || t === 'ellipse') { const cx = v('cx'), cy = v('cy'), rx = t === 'circle' ? v('r') : v('rx'), ry = t === 'circle' ? v('r') : v('ry'); if (!rx || !ry) return null;
    return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`; }
  if (t === 'polygon') { const p = (n.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number); if (p.length < 6) return null;
    return 'M' + p.reduce((s, x, i) => s + (i % 2 ? ' ' : (i ? 'L' : '')) + x, '') + 'z'; }
  return null;
}
