import * as THREE from 'three';
import {RoundedBoxGeometry, mergeBufferGeometries} from 'three-stdlib';
import {rng} from '../../comun/curvas';
import {STUD} from './escena';

// BLOQUES DE JUGUETE, LAS PIEZAS: los ladrillos con sus tetones, los redondos, el plástico brillante y la bola
// de papel arrugado. Medidas: un tetón cada STUD (64 px), el ladrillo 1,2 y la placa 0,4 de alto, el
// tetón de radio 0,24 y alto 0,18 con su labio, el bisel de 0,06. Todo con semilla y guardado: la misma llamada da la misma forma.
// Nada de logos en los tetones ni la figura de ninguna marca.

export const TETON = {r: 0.24 * STUD, alto: 0.18 * STUD};
const BISEL = 0.06 * STUD;
const HOLGURA = 1.4; // lo que le falta a cada pieza para que se vea la junta con la de al lado

// la paleta de juguete (los primarios de los bloques, más blanco, negro, grises y beis)
export const COL = {
  rojo: '#c91a09', azul: '#0055bf', amarillo: '#f2cd37', verde: '#237841', blanco: '#f4f4f1', negro: '#1b2a34',
  naranja: '#fe8a18', grisClaro: '#a0a5a9', grisOscuro: '#6c6e68', beis: '#e4cd9e', celeste: '#36aebf', azulOscuro: '#0a3463',
  marron: '#5c3a23', nogal: '#a0663a', suelo: '#d2ad78',
};

// ---------------------------------------------------------------- el plástico: brillante, con huellas y rayitas que cambian el brillo
const huellas = (semilla: number): THREE.CanvasTexture => {
  const N = 512;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const x = c.getContext('2d')!;
  const r = rng(semilla * 9301 + 7);
  // el verde es la rugosidad (three lee el canal g): de base ~0,2 (brilla) y las marcas hasta ~0,6
  x.fillStyle = 'rgb(0,52,0)';
  x.fillRect(0, 0, N, N);
  for (let i = 0; i < 16; i++) {
    const cx = r() * N, cy = r() * N, r0 = 20 + r() * 42, a = r() * 3;
    x.strokeStyle = 'rgba(0,130,0,0.09)';
    x.lineWidth = 1.3;
    for (let k = 4; k < r0; k += 3) {
      x.beginPath();
      x.ellipse(cx, cy, k, k * 0.75, a, 0, Math.PI * 2);
      x.stroke();
    }
  }
  for (let i = 0; i < 70; i++) {
    x.strokeStyle = `rgba(0,${(95 + r() * 70) | 0},0,${0.1 + r() * 0.2})`;
    x.lineWidth = 0.5 + r() * 0.8;
    const px = r() * N, py = r() * N, a = r() * Math.PI, l = 10 + r() * 60;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};
let HUELLAS: THREE.CanvasTexture[] | null = null;
const mats = new Map<string, THREE.MeshPhysicalMaterial>();
type OpPlastico = {mate?: boolean; emite?: string; fuerza?: number; lado?: THREE.Side};
export const plastico = (color: string, o: OpPlastico = {}): THREE.MeshPhysicalMaterial => {
  const k = color + JSON.stringify(o);
  let m = mats.get(k);
  if (m) return m;
  HUELLAS ??= [1, 2, 3].map(huellas);
  m = new THREE.MeshPhysicalMaterial({
    color, metalness: 0, roughness: 1, roughnessMap: HUELLAS[mats.size % 3],
    clearcoat: o.mate ? 0.18 : 0.85, clearcoatRoughness: o.mate ? 0.5 : 0.08, specularIntensity: o.mate ? 0.5 : 0.9,
    side: o.lado ?? THREE.FrontSide,
  });
  if (o.mate) {
    m.roughnessMap = null;
    m.roughness = 0.55;
  }
  if (o.emite) {
    m.emissive = new THREE.Color(o.emite);
    m.emissiveIntensity = o.fuerza ?? 1;
  }
  mats.set(k, m);
  return m;
};
// todos los plásticos hechos hasta ahora (para darles el reflejo del estudio)
export const plasticos = () => [...mats.values()];

// ---------------------------------------------------------------- las formas
const limpia = (g: THREE.BufferGeometry) => {
  const n = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k);
  return n;
};
const formas = new Map<string, THREE.BufferGeometry>();
const guarda = (k: string, f: () => THREE.BufferGeometry) => {
  let g = formas.get(k);
  if (!g) {
    g = f();
    formas.set(k, g);
  }
  return g;
};

// un tetón (con su labio), con la base en y = 0
const tetonGeo = () => {
  const c = new THREE.CylinderGeometry(TETON.r, TETON.r, TETON.alto, 24, 1);
  c.translate(0, TETON.alto / 2, 0);
  const labio = new THREE.TorusGeometry(TETON.r - 0.9, 0.9, 6, 24);
  labio.rotateX(Math.PI / 2);
  labio.translate(0, TETON.alto - 0.6, 0);
  return [c, labio];
};
export const geoTeton = () => guarda('teton', () => mergeBufferGeometries(tetonGeo().map(limpia))!);
const tetones = (w: number, d: number, y: number) => {
  const gs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
    for (const g of tetonGeo()) {
      g.translate((i - w / 2 + 0.5) * STUD, y, (j - d / 2 + 0.5) * STUD);
      gs.push(g);
    }
  }
  return gs;
};

// un ladrillo (o placa) de w × d tetones y alto h (px), con la base en y = 0 y centrado en x y z
export const geoLadrillo = (w: number, d: number, h: number, conTetones = true) =>
  guarda(`l${w}x${d}x${h.toFixed(1)}${conTetones ? 't' : ''}`, () => {
    const cuerpo = new RoundedBoxGeometry(w * STUD - HOLGURA, h - 0.6, d * STUD - HOLGURA, 3, BISEL);
    cuerpo.translate(0, h / 2, 0);
    const uv = cuerpo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * 0.5, uv.getY(i) * Math.max(1, h / STUD) * 0.5);
    return mergeBufferGeometries([cuerpo, ...(conTetones ? tetones(w, d, h - 0.6) : [])].map(limpia))!;
  });

// una caja con bisel de medidas libres (px), centrada (para lo que no va en tetones: el cuerpo del muñeco, la pantalla…)
export const geoCaja = (w: number, h: number, d: number, r = BISEL) =>
  guarda(`c${w.toFixed(1)}x${h.toFixed(1)}x${d.toFixed(1)}-${r.toFixed(1)}`, () => limpia(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.1, h / 2 - 0.1, d / 2 - 0.1))));

// un cilindro con los cantos redondeados (un ladrillo redondo), con la base en y = 0; con tetones arriba si n > 0 (n × n)
export const geoRedondo = (r: number, h: number, n = 0, bisel = 4) =>
  guarda(`r${r.toFixed(1)}x${h.toFixed(1)}n${n}b${bisel}`, () => {
    const b = Math.min(bisel, r / 3, h / 3);
    const perfil: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
    const arco = (cx: number, cy: number, a0: number, a1: number) => {
      for (let i = 0; i <= 4; i++) {
        const a = a0 + ((a1 - a0) * i) / 4;
        perfil.push(new THREE.Vector2(cx + b * Math.cos(a), cy + b * Math.sin(a)));
      }
    };
    arco(r - b, b, -Math.PI / 2, 0);
    arco(r - b, h - b, 0, Math.PI / 2);
    perfil.push(new THREE.Vector2(0, h));
    const cuerpo = new THREE.LatheGeometry(perfil, 40);
    const extra = n > 0 ? tetones(n, n, h) : [];
    return mergeBufferGeometries([cuerpo, ...extra].map(limpia))!;
  });

// una pieza de torno a partir de su perfil [radio, alto] (la papelera, el aro, la pantalla de la lámpara)
export const geoTorno = (clave: string, perfil: [number, number][], segmentos = 56) =>
  guarda(`t${clave}`, () => limpia(new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), segmentos)));

// tetones alrededor de un aro (los de arriba de la papelera)
export const geoTetonesAro = (radio: number, n: number, y: number) =>
  guarda(`ta${radio}-${n}-${y.toFixed(1)}`, () => {
    const gs: THREE.BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      for (const g of tetonGeo()) {
        g.translate(Math.cos(a) * radio, y, Math.sin(a) * radio);
        gs.push(g);
      }
    }
    return mergeBufferGeometries(gs.map(limpia))!;
  });

// ---------------------------------------------------------------- la bola de papel arrugado
// Un icosaedro con pliegues: cada plano de plegado le hunde (o le levanta) un surco afilado; las caras quedan planas, como el papel.
// La textura de las rayas azules del cuaderno va por regiones (cada trozo entre pliegues, con su ángulo): se rompen en cada pliegue.
let PAPEL: THREE.CanvasTexture | null = null;
export const texturaPapel = () => {
  if (PAPEL) return PAPEL;
  const N = 256;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const x = c.getContext('2d')!;
  x.fillStyle = '#fbfaf5';
  x.fillRect(0, 0, N, N);
  x.strokeStyle = 'rgba(96,140,210,0.55)';
  x.lineWidth = 4;
  for (let y = 14; y < N; y += 40) {
    x.beginPath();
    x.moveTo(0, y);
    x.lineTo(N, y);
    x.stroke();
  }
  x.strokeStyle = 'rgba(220,90,90,0.5)';
  x.beginPath();
  x.moveTo(60, 0);
  x.lineTo(60, N);
  x.stroke();
  PAPEL = new THREE.CanvasTexture(c);
  PAPEL.wrapS = PAPEL.wrapT = THREE.RepeatWrapping;
  PAPEL.colorSpace = THREE.SRGBColorSpace;
  PAPEL.anisotropy = 4;
  return PAPEL;
};
export const geoPapel = (r: number, semilla: number) =>
  guarda(`p${r}-${semilla}`, () => {
    const g = new THREE.IcosahedronGeometry(r, 4);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const R = rng(semilla * 31 + 5);
    const unidad = (): THREE.Vector3 => {
      const th = R() * Math.PI * 2, z = 2 * R() - 1;
      return new THREE.Vector3(Math.sqrt(1 - z * z) * Math.cos(th), Math.sqrt(1 - z * z) * Math.sin(th), z);
    };
    const pliegues = Array.from({length: 13}, () => ({n: unidad(), c: (R() - 0.5) * 1.3, a: (R() < 0.6 ? -1 : 1) * (0.05 + R() * 0.09), w: 0.12 + R() * 0.2}));
    const forma = new THREE.Vector3(1 + (R() - 0.5) * 0.16, 0.9 + (R() - 0.5) * 0.1, 1 + (R() - 0.5) * 0.16);
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      let k = 1;
      for (const p of pliegues) {
        const d = v.dot(p.n) - p.c;
        k += p.a * Math.max(0, 1 - Math.abs(d) / p.w); // un surco en V a lo largo del plano
      }
      // un pelo de ruido fijo por punto (el mismo punto, el mismo ruido: no se abre)
      const h = Math.sin(v.x * 37.1 + v.y * 11.7) * Math.cos(v.z * 23.3 - v.x * 5.1);
      k += h * 0.025;
      pos.setXYZ(i, v.x * r * k * forma.x, v.y * r * k * forma.y, v.z * r * k * forma.z);
    }
    const ng = g.index ? g.toNonIndexed() : g;
    ng.computeVertexNormals(); // sin índices: cada cara con su normal (plana, como el papel)
    // las rayas: cada región entre los cuatro primeros pliegues con su ángulo y su desplazamiento
    const P = ng.attributes.position as THREE.BufferAttribute;
    const uv = new Float32Array(P.count * 2);
    const c = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), q = new THREE.Vector3();
    for (let f = 0; f < P.count; f += 3) {
      a.fromBufferAttribute(P, f);
      b.fromBufferAttribute(P, f + 1);
      c.fromBufferAttribute(P, f + 2);
      const m = a.clone().add(b).add(c).divideScalar(3).normalize();
      let id = 0;
      for (let k = 0; k < 4; k++) if (m.dot(pliegues[k].n) - pliegues[k].c > 0) id |= 1 << k;
      const rr = rng(id * 97 + semilla);
      const ang = rr() * Math.PI, dx = rr(), dy = rr();
      // proyección a lo largo del eje más de frente de la región
      const ax = Math.abs(m.x) > Math.abs(m.y) ? (Math.abs(m.x) > Math.abs(m.z) ? 0 : 2) : Math.abs(m.y) > Math.abs(m.z) ? 1 : 2;
      for (let j = 0; j < 3; j++) {
        q.fromBufferAttribute(P, f + j);
        const [u0, v0] = ax === 0 ? [q.y, q.z] : ax === 1 ? [q.x, q.z] : [q.x, q.y];
        uv[(f + j) * 2] = (Math.cos(ang) * u0 - Math.sin(ang) * v0) / 70 + dx;
        uv[(f + j) * 2 + 1] = (Math.sin(ang) * u0 + Math.cos(ang) * v0) / 70 + dy;
      }
    }
    ng.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return ng;
  });
let PAPEL_MAT: THREE.MeshStandardMaterial | null = null;
export const papelMat = () => (PAPEL_MAT ??= new THREE.MeshStandardMaterial({color: '#ffffff', map: texturaPapel(), roughness: 0.88, metalness: 0, flatShading: true}));
const papelesViejos = new Map<string, THREE.MeshStandardMaterial>();
// los papeles de otros días (los de la papelera y la mesa): un pelo más amarillos o grises
export const papelViejo = (tinte: string) => {
  let m = papelesViejos.get(tinte);
  if (!m) {
    m = new THREE.MeshStandardMaterial({color: tinte, map: texturaPapel(), roughness: 0.9, metalness: 0, flatShading: true});
    papelesViejos.set(tinte, m);
  }
  return m;
};

// la mancha suave de las sombras de contacto (blanco en el centro; el material la tiñe)
let MANCHA: THREE.CanvasTexture | null = null;
export const mancha = () => {
  if (MANCHA) return MANCHA;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  MANCHA = new THREE.CanvasTexture(c);
  return MANCHA;
};
