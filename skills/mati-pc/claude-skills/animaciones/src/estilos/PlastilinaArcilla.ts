import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three-stdlib';
import {rng} from '../comun/curvas';

// 10 · PLASTILINA, la arcilla: la textura de relieve (huellas de dedo, presiones de pulgar, bultos y grano), los materiales mates y
// algo cerosos, y las formas gordas (cápsulas, bolas, cajas redondeadas, figuras extruidas) con su abolladura. Todo procedural y
// con semilla: nada de imágenes de fuera, y el mismo número da siempre la misma forma.

export type V3 = [number, number, number];
export const TESELA = 300; // cuántos px del mundo ocupa una tesela de la textura de relieve

// ---------------------------------------------------------------- la textura de relieve (gris: claro = sale, oscuro = se hunde)
let relieveHecho: THREE.CanvasTexture | null = null;
export const relieve = (): THREE.CanvasTexture => {
  if (relieveHecho) return relieveHecho;
  const N = 1024;
  const cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const g = cv.getContext('2d')!;
  g.fillStyle = 'rgb(128,128,128)';
  g.fillRect(0, 0, N, N);
  const r = rng(1010);
  // cada marca se pinta también en sus copias de al lado, para que la tesela no tenga costura
  const envuelve = (x: number, y: number, rad: number, pinta: (cx: number, cy: number) => void) => {
    for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) {
      const cx = x + dx, cy = y + dy;
      if (cx + rad < 0 || cx - rad > N || cy + rad < 0 || cy - rad > N) continue;
      pinta(cx, cy);
    }
  };
  const mancha = (cx: number, cy: number, rad: number, paradas: [number, string][]) => {
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
    for (const [o, c] of paradas) gr.addColorStop(o, c);
    g.fillStyle = gr;
    g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  };
  // 1. bultos suaves: la plastilina nunca queda lisa
  for (let i = 0; i < 90; i++) {
    const x = r() * N, y = r() * N, rad = 50 + r() * 140, a = 0.05 + r() * 0.09;
    const c = r() > 0.5 ? '255,255,255' : '0,0,0';
    envuelve(x, y, rad, (cx, cy) => mancha(cx, cy, rad, [[0, `rgba(${c},${a})`], [1, `rgba(${c},0)`]]));
  }
  // 2. presiones de pulgar: una hondonada alargada y, a un lado, el reborde de la plastilina que se empujó
  for (let i = 0; i < 8; i++) {
    const x = r() * N, y = r() * N, rad = 60 + r() * 70, ang = r() * Math.PI, aplasta = 0.45 + r() * 0.2;
    envuelve(x, y, rad * 1.4, (cx, cy) => {
      g.save();
      g.translate(cx, cy);
      g.rotate(ang);
      g.scale(1, aplasta);
      mancha(0, 0, rad, [[0, 'rgba(0,0,0,0.22)'], [0.55, 'rgba(0,0,0,0.12)'], [1, 'rgba(0,0,0,0)']]);
      mancha(rad * 0.62, 0, rad * 0.55, [[0, 'rgba(255,255,255,0.13)'], [1, 'rgba(255,255,255,0)']]);
      g.restore();
    });
  }
  // 3. huellas de dedo: crestas que dan la vuelta (un lazo, a medias), que se apagan por los bordes y no son círculos perfectos
  for (let i = 0; i < 5; i++) {
    const x = r() * N, y = r() * N, R = 80 + r() * 60, ang = r() * Math.PI * 2, paso = 13 + r() * 3;
    const fase = r() * 6.3, abre = 0.6 + r() * 1.6, desde = r() * Math.PI * 2;
    envuelve(x, y, R * 1.3 + 40, (cx, cy) => {
      g.save();
      g.translate(cx, cy);
      g.rotate(ang);
      g.scale(1, 0.72);
      for (let k = 1; k * paso < R; k++) {
        const rr = k * paso;
        const fuerza = Math.sin(Math.PI * Math.min(1, rr / R)) ** 0.8;
        for (const [o, col, a, ancho] of [[0, '0,0,0', 0.12, 0.42], [0.5, '255,255,255', 0.05, 0.3]] as const) {
          g.beginPath();
          const n = 64;
          for (let m = 0; m <= n; m++) {
            const th = desde + (abre * 0.5 + (Math.PI * 2 - abre) * (m / n));
            const rad = (rr + o * paso) * (1 + 0.05 * Math.sin(3 * th + fase) + 0.03 * Math.sin(5 * th + k));
            const px = k * 1.8 + rad * Math.cos(th), py = rad * 0.92 * Math.sin(th);
            if (m === 0) g.moveTo(px, py);
            else g.lineTo(px, py);
          }
          g.strokeStyle = `rgba(${col},${a * fuerza})`;
          g.lineWidth = paso * ancho;
          g.stroke();
        }
      }
      g.restore();
    });
  }
  // 4. rayitas de la herramienta de modelar
  for (let i = 0; i < 14; i++) {
    const x = r() * N, y = r() * N, l = 40 + r() * 90, ang = r() * Math.PI;
    envuelve(x, y, l, (cx, cy) => {
      g.save();
      g.translate(cx, cy);
      g.rotate(ang);
      g.beginPath();
      g.moveTo(-l / 2, 0);
      g.quadraticCurveTo(0, (r() - 0.5) * 20, l / 2, 0);
      g.strokeStyle = 'rgba(0,0,0,0.18)';
      g.lineWidth = 3 + r() * 3;
      g.stroke();
      g.restore();
    });
  }
  // 5. grano fino y poros
  const img = g.getImageData(0, 0, N, N);
  const d = img.data;
  const rg = rng(77);
  for (let i = 0; i < d.length; i += 4) {
    const n = (rg() - 0.5) * 14 + (rg() < 0.004 ? -40 : 0);
    const v = Math.max(0, Math.min(255, d[i] + n));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 1; // (con más, cerca de los polos de cada pieza las crestas se apretaban en rayas)
  tex.needsUpdate = true;
  relieveHecho = tex;
  return tex;
};

// ---------------------------------------------------------------- los materiales
// Mate y un poco ceroso: rugosidad media (un brillo ancho y suave, no el punto duro del plástico), un velo de «sheen» que aclara los
// bordes como la cera, y el relieve. El relieve de three se mide en píxeles de pantalla: se escala con la resolución (dpr).
type Op = {rough?: number; bump?: number; brillo?: number; emite?: string; fuerza?: number};
const materiales = new Map<string, THREE.MeshPhysicalMaterial>();
export const RELIEVE_BASE = 3.2;
export const arcilla = (color: string, o: Op = {}): THREE.MeshPhysicalMaterial => {
  const k = color + JSON.stringify(o);
  let m = materiales.get(k);
  if (!m) {
    const base = new THREE.Color(color);
    m = new THREE.MeshPhysicalMaterial({
      color: base,
      roughness: o.rough ?? 0.62,
      metalness: 0,
      bumpMap: relieve(),
      bumpScale: RELIEVE_BASE,
      sheen: 0.45,
      sheenRoughness: 0.6,
      sheenColor: base.clone().lerp(new THREE.Color('#fff4e6'), 0.55),
      clearcoat: o.brillo ?? 0.06,
      clearcoatRoughness: 0.5,
      specularIntensity: 0.55,
    });
    if (o.emite) {
      m.emissive = new THREE.Color(o.emite);
      m.emissiveIntensity = o.fuerza ?? 1;
    }
    m.userData.bump = o.bump ?? 1;
    materiales.set(k, m);
  }
  return m;
};
// el relieve, a la resolución a la que se dibuja (se llama una vez por cuadro)
export const ajustaRelieve = (dpr: number) => {
  materiales.forEach((m) => {
    m.bumpScale = RELIEVE_BASE * dpr * (m.userData.bump as number);
  });
};

// ---------------------------------------------------------------- abolladuras: la forma deja de ser perfecta
const huella = new Map<string, THREE.BufferGeometry>();
// las normales de los vértices repetidos (la costura de un torno, los polos) se promedian: así no se ve la costura
const sueldaNormales = (geo: THREE.BufferGeometry) => {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const nor = geo.attributes.normal as THREE.BufferAttribute;
  const grupos = new Map<string, number[]>();
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(2)},${pos.getY(i).toFixed(2)},${pos.getZ(i).toFixed(2)}`;
    const l = grupos.get(k);
    if (l) l.push(i);
    else grupos.set(k, [i]);
  }
  const v = new THREE.Vector3();
  grupos.forEach((l) => {
    if (l.length < 2) return;
    v.set(0, 0, 0);
    for (const i of l) v.add(new THREE.Vector3(nor.getX(i), nor.getY(i), nor.getZ(i)));
    v.normalize();
    for (const i of l) nor.setXYZ(i, v.x, v.y, v.z);
  });
  nor.needsUpdate = true;
};
const abolla = (geo: THREE.BufferGeometry, semilla: number, amp: number, hoyos: number) => {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const nor = geo.attributes.normal as THREE.BufferAttribute;
  const r = rng(semilla * 131 + 17);
  const ondas = Array.from({length: 4}, () => {
    const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1);
    return {d: [Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)], k: (Math.PI * 2) / (45 + r() * 90), f: r() * 6.3, a: amp * (0.35 + r() * 0.65)};
  });
  const marcas = Array.from({length: hoyos}, () => {
    const i = Math.floor(r() * pos.count);
    return {c: [pos.getX(i), pos.getY(i), pos.getZ(i)], rad: 12 + r() * 14, h: 2 + r() * 2.6};
  });
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let dd = 0;
    for (const o of ondas) dd += o.a * Math.sin(o.k * (o.d[0] * x + o.d[1] * y + o.d[2] * z) + o.f);
    for (const m of marcas) {
      const q = (x - m.c[0]) ** 2 + (y - m.c[1]) ** 2 + (z - m.c[2]) ** 2;
      dd -= m.h * Math.exp(-q / (m.rad * m.rad));
    }
    pos.setXYZ(i, x + nor.getX(i) * dd, y + nor.getY(i) * dd, z + nor.getZ(i) * dd);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  sueldaNormales(geo);
};

// ---------------------------------------------------------------- las formas
// una cápsula gorda de radio variable, de (0,0,0) a (0,L,0): dos medias bolas unidas por el cono que las toca
export const geoCapsula = (L: number, ra: number, rb: number, semilla: number, amp = 1.9): THREE.BufferGeometry => {
  const k = `c${L}-${ra}-${rb}-${semilla}-${amp}`;
  let geo = huella.get(k);
  if (geo) return geo;
  const s = Math.max(-0.95, Math.min(0.95, (ra - rb) / Math.max(L, 1)));
  const fi = Math.asin(s);
  const perfil: THREE.Vector2[] = [];
  const n1 = 10, n2 = 10, n3 = Math.max(2, Math.round(L / 14));
  for (let i = 0; i <= n1; i++) {
    const a = -Math.PI / 2 + ((fi + Math.PI / 2) * i) / n1;
    perfil.push(new THREE.Vector2(ra * Math.cos(a), ra * Math.sin(a)));
  }
  const pa = perfil[perfil.length - 1];
  const pb = new THREE.Vector2(rb * Math.cos(fi), L + rb * Math.sin(fi));
  for (let i = 1; i < n3; i++) perfil.push(pa.clone().lerp(pb, i / n3));
  for (let i = 0; i <= n2; i++) {
    const a = fi + ((Math.PI / 2 - fi) * i) / n2;
    perfil.push(new THREE.Vector2(rb * Math.cos(a), L + rb * Math.sin(a)));
  }
  perfil[0].x = 0;
  perfil[perfil.length - 1].x = 0;
  const seg = 28;
  geo = new THREE.LatheGeometry(perfil, seg);
  // las coordenadas de la textura, en px del mundo (la huella mide lo mismo en un dedo que en el pecho)
  const arco: number[] = [0];
  for (let j = 1; j < perfil.length; j++) arco.push(arco[j - 1] + perfil[j].distanceTo(perfil[j - 1]));
  // u, con la densidad de verdad en cada anillo (sin apretarse en los polos); la costura de la textura queda detrás (z < 0)
  geo.rotateY(Math.PI);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const du = rng(semilla * 7 + 1)(), dv = rng(semilla * 7 + 2)(); // cada pieza, con su trozo de textura
  for (let i = 0; i <= seg; i++) for (let j = 0; j < perfil.length; j++) {
    uv.setXY(i * perfil.length + j, (i / seg) * (2 * Math.PI * perfil[j].x) / TESELA + du, arco[j] / TESELA + dv);
  }
  // los polos, con la normal a lo largo del eje (si no, al abollar se abrirían); la costura, exactamente igual por los dos lados
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const nor = geo.attributes.normal as THREE.BufferAttribute;
  const np = perfil.length;
  for (let j = 0; j < np; j++) {
    pos.setXYZ(seg * np + j, pos.getX(j), pos.getY(j), pos.getZ(j));
    nor.setXYZ(seg * np + j, nor.getX(j), nor.getY(j), nor.getZ(j));
  }
  for (let i = 0; i < pos.count; i++) {
    if (Math.abs(pos.getX(i)) < 1e-4 && Math.abs(pos.getZ(i)) < 1e-4) {
      pos.setX(i, 0);
      pos.setZ(i, 0);
      nor.setXYZ(i, 0, pos.getY(i) > L / 2 ? 1 : -1, 0);
    }
  }
  abolla(geo, semilla, Math.min(amp, 0.07 * Math.min(ra, rb)), Math.min(ra, rb) > 15 ? 4 : 0);
  huella.set(k, geo);
  return geo;
};

// una bola (o un casquete, con `arriba` < π), con sus abolladuras
export const geoBola = (r: number, semilla: number, amp = 1.3, arriba = Math.PI, hoyos = 2): THREE.BufferGeometry => {
  const k = `b${r}-${semilla}-${amp}-${arriba}-${hoyos}`;
  let geo = huella.get(k);
  if (geo) return geo;
  geo = new THREE.SphereGeometry(r, 36, 26, Math.PI * 1.5, Math.PI * 2, 0, arriba); // la costura, detrás (z < 0)
  {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const nor = geo.attributes.normal as THREE.BufferAttribute;
    for (let iy = 0; iy <= 26; iy++) {
      const a = iy * 37, b = iy * 37 + 36; // la costura, exactamente igual por los dos lados
      pos.setXYZ(b, pos.getX(a), pos.getY(a), pos.getZ(a));
      nor.setXYZ(b, nor.getX(a), nor.getY(a), nor.getZ(a));
    }
  }
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const du = rng(semilla * 7 + 1)(), dv = rng(semilla * 7 + 2)();
  for (let iy = 0; iy <= 26; iy++) {
    const th = (iy / 26) * arriba;
    for (let ix = 0; ix <= 36; ix++) uv.setXY(iy * 37 + ix, (ix / 36) * (2 * Math.PI * r * Math.sin(th)) / TESELA + du, (th * r) / TESELA + dv);
  }
  if (amp > 0) abolla(geo, semilla, Math.min(amp, 0.06 * r), r > 25 ? hoyos : 0);
  huella.set(k, geo);
  return geo;
};

// una caja con las esquinas redondeadas (lo que en la escena es un rectángulo)
export const geoCaja = (w: number, h: number, d: number, r: number): THREE.BufferGeometry => {
  const rr = Math.max(0.5, Math.min(r, w * 0.45, h * 0.45, d * 0.45));
  const k = `k${w.toFixed(0)}-${h.toFixed(0)}-${d.toFixed(0)}-${rr.toFixed(1)}`;
  let geo = huella.get(k);
  if (geo) return geo;
  geo = new RoundedBoxGeometry(w, h, d, 3, rr);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const esc = Math.max(w, h, d) / TESELA;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * esc, uv.getY(i) * esc);
  huella.set(k, geo);
  return geo;
};

// una figura plana (puntos en px de pantalla, y hacia abajo) hecha volumen: extruida y con el canto redondeado, como un churro
// aplastado. Va centrada en z.
export const geoFigura = (pts: [number, number][], hondo: number, canto: number, clave: string): THREE.BufferGeometry => {
  const k = `f${clave}-${hondo}-${canto}`;
  let geo = huella.get(k);
  if (geo) return geo;
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, -y)));
  geo = new THREE.ExtrudeGeometry(sh, {depth: Math.max(1, hondo - 2 * canto), bevelEnabled: true, bevelThickness: canto, bevelSize: canto * 0.8, bevelSegments: 5, curveSegments: 16});
  geo.translate(0, 0, -(hondo - 2 * canto) / 2);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / TESELA, uv.getY(i) / TESELA);
  geo.computeVertexNormals();
  huella.set(k, geo);
  return geo;
};

// el corazón de los «me gusta»: el mismo dibujo de escena.ts, inflado
export const geoCorazon = (s: number): THREE.BufferGeometry => {
  const k = `h${s}`;
  let geo = huella.get(k);
  if (geo) return geo;
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.35 * s);
  sh.bezierCurveTo(-0.9 * s, 0.25 * s, -0.45 * s, 0.95 * s, 0, 0.45 * s);
  sh.bezierCurveTo(0.45 * s, 0.95 * s, 0.9 * s, 0.25 * s, 0, -0.35 * s);
  geo = new THREE.ExtrudeGeometry(sh, {depth: s * 0.12, bevelEnabled: true, bevelThickness: s * 0.2, bevelSize: s * 0.13, bevelSegments: 7, curveSegments: 28});
  geo.translate(0, -0.2 * s, -s * 0.06);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / TESELA, uv.getY(i) / TESELA);
  geo.computeVertexNormals();
  huella.set(k, geo);
  return geo;
};

export const geoAro = (R: number, tubo: number, arco = Math.PI * 2): THREE.BufferGeometry => {
  const k = `a${R}-${tubo}-${arco.toFixed(3)}`;
  let geo = huella.get(k);
  if (geo) return geo;
  geo = new THREE.TorusGeometry(R, tubo, 14, 48, arco);
  huella.set(k, geo);
  return geo;
};

// para orientar una cápsula de a a b
const Y = new THREE.Vector3(0, 1, 0);
const dir = new THREE.Vector3();
const q = new THREE.Quaternion();
export const orienta = (a: V3, b: V3): {L: number; quat: [number, number, number, number]} => {
  dir.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const L = dir.length();
  dir.normalize();
  q.setFromUnitVectors(Y, dir);
  return {L, quat: [q.x, q.y, q.z, q.w]};
};

// la mancha suave de sombra de contacto (blanco en el centro, que el material tiñe)
let manchaHecha: THREE.CanvasTexture | null = null;
export const mancha = (): THREE.CanvasTexture => {
  if (manchaHecha) return manchaHecha;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  manchaHecha = new THREE.CanvasTexture(cv);
  return manchaHecha;
};
