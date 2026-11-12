import {ALTO, MUNECO, PLACA, SILLA, STUD, SUELO, esqueleto, proyecta, type Cara, type Pose, type V3} from '../escena';
import {caja, camino, cilindro, ejeMarco, enMarco, envolvente, esc, gris, luz, mm, nor, pto, res, rx, ry, rz, seVe, sombra, sum, type M3, type Marco} from './geometria';

// CINE MUDO, EL MUÑECO Y SU SILLA. El mismo muñeco de bloques (BloquesMuneco.tsx), pieza a pieza y en la
// misma postura (la de escena.ts), pero vestido de comedia muda y sin nada de juguete: la cara pálida de maquillaje con los ojos
// marcados con lápiz negro (y su sombra de kohl), las cejas gruesas que actúan, la boca oscura; el pelo engominado con su raya y su
// brillo; la chaqueta gris con solapas, camisa blanca en pico, corbata negra, botones, pañuelo y puños blancos; el pantalón y la silla
// en gris medio. La cara va pegada al cilindro de la cabeza en tiras (gira con él) y las piezas se pintan de atrás adelante.

const M = MUNECO;
const S = M.escala;

// ---------------------------------------------------------------- las caras (512 × 256, como las impresas de los bloques, en tinta)
const CARAS = new Map<string, HTMLCanvasElement>();
const TINTA = '#0b0908';
export const lienzoCara = (cara: Cara, ox: number, oy: number): HTMLCanvasElement => {
  const k = `${cara}|${ox}|${oy}`;
  const hecho = CARAS.get(k);
  if (hecho) return hecho;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const x = c.getContext('2d')!;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  const cx = 256, ojoY = 112, sep = 74;
  const px = ox * 15, py = oy * 10;
  // el kohl: la sombra de maquillaje alrededor de cada ojo
  const kohl = (fuerza = 1) => {
    for (const lado of [-1, 1]) {
      const g = x.createRadialGradient(cx + lado * sep, ojoY, 8, cx + lado * sep, ojoY, 62);
      g.addColorStop(0, `rgba(30,24,22,${0.62 * fuerza})`);
      g.addColorStop(0.62, `rgba(30,24,22,${0.42 * fuerza})`);
      g.addColorStop(1, 'rgba(30,24,22,0)');
      x.fillStyle = g;
      x.beginPath();
      x.ellipse(cx + lado * sep, ojoY, 60, 56, 0, 0, Math.PI * 2);
      x.fill();
    }
  };
  const ojo = (lado: number, forma: 'normal' | 'grande' | 'cerrado' | 'feliz' | 'medio' | 'susto') => {
    const ex = cx + lado * sep;
    x.fillStyle = TINTA;
    x.strokeStyle = TINTA;
    if (forma === 'cerrado') {
      x.lineWidth = 15;
      x.beginPath();
      x.moveTo(ex - 32, ojoY + (lado > 0 ? 6 : 0));
      x.quadraticCurveTo(ex, ojoY - 14, ex + 32, ojoY + (lado > 0 ? 0 : 6));
      x.stroke();
      return;
    }
    if (forma === 'feliz') {
      x.lineWidth = 16;
      x.beginPath();
      x.arc(ex, ojoY + 16, 28, Math.PI * 1.1, Math.PI * 1.9);
      x.stroke();
      return;
    }
    // el blanco del ojo (en el cine mudo los ojos se pintaban grandes)
    const rx = forma === 'susto' ? 38 : forma === 'grande' ? 34 : 30, ry = forma === 'susto' ? 44 : forma === 'grande' ? 42 : 36;
    x.fillStyle = '#f4f1ea';
    x.lineWidth = 11;
    x.beginPath();
    x.ellipse(ex, ojoY, rx, ry, 0, 0, Math.PI * 2);
    x.fill();
    x.stroke();
    // el lápiz negro: la raya gruesa del párpado de arriba, que se alarga hacia fuera
    x.lineWidth = 15;
    x.beginPath();
    x.ellipse(ex, ojoY, rx + 3, ry + 3, 0, Math.PI * 1.08, Math.PI * 1.92);
    x.stroke();
    x.lineWidth = 9;
    x.beginPath();
    x.moveTo(ex + lado * (rx + 2), ojoY - 6);
    x.lineTo(ex + lado * (rx + 16), ojoY - 16);
    x.stroke();
    // la pupila, hacia donde mira
    const rp = forma === 'susto' ? 11 : 19;
    x.fillStyle = TINTA;
    x.beginPath();
    x.ellipse(ex + px * (rx - rp) / 22, ojoY + py * (ry - rp) / 26, rp, rp * 1.15, 0, 0, Math.PI * 2);
    x.fill();
    if (forma !== 'susto') {
      x.fillStyle = '#ffffff';
      x.beginPath();
      x.arc(ex + px * (rx - rp) / 22 - 6, ojoY + py * (ry - rp) / 26 - 8, 5.5, 0, Math.PI * 2);
      x.fill();
    }
    if (forma === 'medio') {
      // el párpado a media asta: la mirada de «¿en serio?» (la de Keaton)
      x.fillStyle = '#7d7672';
      x.beginPath();
      x.ellipse(ex, ojoY, rx + 4, ry + 4, 0, Math.PI, Math.PI * 2);
      x.fill();
      x.strokeStyle = TINTA;
      x.lineWidth = 11;
      x.beginPath();
      x.moveTo(ex - rx - 4, ojoY - 2);
      x.lineTo(ex + rx + 4, ojoY - 2);
      x.stroke();
    }
  };
  // las cejas: [inclinación hacia dentro (+ = enfado), altura], gruesas como de maquillaje
  const cejas = (inc: number, alto: number, grosor = 15) => {
    x.strokeStyle = TINTA;
    x.lineWidth = grosor;
    for (const lado of [-1, 1]) {
      const ex = cx + lado * sep;
      const y0 = ojoY - 66 - alto;
      x.beginPath();
      x.moveTo(ex - lado * 34, y0 + inc * 16);
      x.quadraticCurveTo(ex, y0 - 8, ex + lado * 34, y0 - inc * 16);
      x.stroke();
    }
  };
  const boca = (forma: 'linea' | 'sonrisa' | 'o' | 'dientes' | 'triste' | 'grande' | 'ondas' | 'lado') => {
    const by = 206;
    x.strokeStyle = TINTA;
    x.fillStyle = TINTA;
    x.lineWidth = 13;
    if (forma === 'linea') {
      x.beginPath(); x.moveTo(cx - 30, by); x.lineTo(cx + 30, by); x.stroke();
    } else if (forma === 'lado') {
      x.beginPath(); x.moveTo(cx - 34, by + 6); x.quadraticCurveTo(cx, by + 2, cx + 40, by - 10); x.stroke();
    } else if (forma === 'sonrisa') {
      x.beginPath(); x.arc(cx, by - 32, 42, Math.PI * 0.2, Math.PI * 0.8); x.stroke();
    } else if (forma === 'triste') {
      x.beginPath(); x.arc(cx, by + 36, 40, Math.PI * 1.2, Math.PI * 1.8); x.stroke();
    } else if (forma === 'o') {
      x.beginPath(); x.ellipse(cx, by, 24, 32, 0, 0, Math.PI * 2); x.fill();
    } else if (forma === 'dientes') {
      x.fillStyle = '#f4f1ea';
      x.beginPath(); x.roundRect(cx - 46, by - 19, 92, 38, 10); x.fill(); x.stroke();
      x.lineWidth = 6;
      x.beginPath(); x.moveTo(cx - 46, by); x.lineTo(cx + 46, by); x.stroke();
      for (const dx of [-23, 0, 23]) { x.beginPath(); x.moveTo(cx + dx, by - 19); x.lineTo(cx + dx, by + 19); x.stroke(); }
    } else if (forma === 'grande') {
      x.beginPath(); x.moveTo(cx - 64, by - 28); x.quadraticCurveTo(cx, by - 32, cx + 64, by - 28); x.quadraticCurveTo(cx + 52, by + 46, cx, by + 46);
      x.quadraticCurveTo(cx - 52, by + 46, cx - 64, by - 28); x.fill();
      x.fillStyle = '#f4f1ea';
      x.beginPath(); x.moveTo(cx - 56, by - 24); x.quadraticCurveTo(cx, by - 28, cx + 56, by - 24); x.lineTo(cx + 50, by - 8); x.quadraticCurveTo(cx, by - 6, cx - 50, by - 8); x.fill();
    } else if (forma === 'ondas') {
      x.beginPath();
      for (let i = 0; i <= 8; i++) {
        const xx = cx - 46 + i * 11.5, yy = by + (i % 2 ? -8 : 8);
        if (i === 0) x.moveTo(xx, yy);
        else x.lineTo(xx, yy);
      }
      x.stroke();
    }
  };
  switch (cara) {
    case 'atento': kohl(0.8); cejas(0.4, -6); ojo(-1, 'normal'); ojo(1, 'normal'); boca('linea'); break;
    case 'ilusion': kohl(0.8); cejas(-0.35, 12); ojo(-1, 'grande'); ojo(1, 'grande'); boca('sonrisa'); break;
    case 'tension': kohl(1); cejas(-0.6, 6); ojo(-1, 'grande'); ojo(1, 'grande'); boca('dientes'); break;
    case 'ay': kohl(1); cejas(-0.8, 22); ojo(-1, 'grande'); ojo(1, 'grande'); boca('o'); break;
    case 'fastidio': kohl(1); cejas(0.9, -8, 17); ojo(-1, 'cerrado'); ojo(1, 'cerrado'); boca('triste'); break;
    case 'meh': kohl(0.9); cejas(0, 4); ojo(-1, 'medio'); ojo(1, 'medio'); boca('lado'); break;
    case 'susto': kohl(1); cejas(-0.7, 26); ojo(-1, 'susto'); ojo(1, 'susto'); boca('ondas'); break;
    case 'feliz': kohl(0.7); cejas(-0.45, 18); ojo(-1, 'feliz'); ojo(1, 'feliz'); boca('grande'); break;
    case 'serio': kohl(1); cejas(0.12, -2); ojo(-1, 'medio'); ojo(1, 'medio'); boca('linea'); break;
  }
  CARAS.set(k, c);
  return c;
};

// la chaqueta por delante: las solapas, la camisa blanca en pico, la corbata negra, dos botones y el pañuelo del bolsillo
let CAMISA: HTMLCanvasElement | null = null;
const lienzoCamisa = () => {
  if (CAMISA) return CAMISA;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const x = c.getContext('2d')!;
  x.lineJoin = 'round';
  // la camisa en pico, con su cuello
  x.fillStyle = '#e4e2dc';
  x.beginPath(); x.moveTo(70, 0); x.lineTo(128, 150); x.lineTo(186, 0); x.closePath(); x.fill();
  // la corbata
  x.fillStyle = '#121010';
  x.beginPath(); x.moveTo(114, 14); x.lineTo(142, 14); x.lineTo(136, 40); x.lineTo(148, 132); x.lineTo(128, 156); x.lineTo(108, 132); x.lineTo(120, 40); x.closePath(); x.fill();
  // las solapas (un pelo más oscuras que la chaqueta), con su raya
  x.fillStyle = 'rgba(40,36,34,0.32)';
  for (const l of [-1, 1]) {
    x.beginPath(); x.moveTo(128 + l * 58, 0); x.lineTo(128 + l * 92, 0); x.lineTo(128 + l * 70, 70); x.lineTo(128 + l * 84, 86); x.lineTo(128 + l * 6, 168); x.closePath(); x.fill();
  }
  x.strokeStyle = TINTA;
  x.lineWidth = 6;
  for (const l of [-1, 1]) {
    x.beginPath(); x.moveTo(128 + l * 92, 0); x.lineTo(128 + l * 70, 70); x.lineTo(128 + l * 84, 86); x.lineTo(128 + l * 4, 172); x.stroke();
  }
  // la abertura de abajo y los botones
  x.beginPath(); x.moveTo(128, 168); x.lineTo(128, 256); x.stroke();
  x.fillStyle = TINTA;
  for (const y of [190, 226]) { x.beginPath(); x.arc(112, y, 7, 0, Math.PI * 2); x.fill(); }
  // el pañuelo blanco en el bolsillo
  x.fillStyle = '#ece9e2';
  x.beginPath(); x.moveTo(182, 112); x.lineTo(214, 112); x.lineTo(206, 92); x.lineTo(196, 104); x.lineTo(188, 94); x.closePath(); x.fill();
  x.lineWidth = 5;
  x.beginPath(); x.moveTo(176, 112); x.lineTo(220, 112); x.stroke();
  CAMISA = c;
  return c;
};

// pinta un trozo de imagen en un cuadrilátero de la pantalla (afín: tres esquinas)
const imagenEn = (ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, sx: number, sy: number, sw: number, sh: number, p00: [number, number], p10: [number, number], p01: [number, number]) => {
  const a = (p10[0] - p00[0]) / sw, b = (p10[1] - p00[1]) / sw, c = (p01[0] - p00[0]) / sh, d = (p01[1] - p00[1]) / sh;
  ctx.save();
  ctx.transform(a, b, c, d, p00[0] - a * sx - c * sy, p00[1] - b * sx - d * sy);
  ctx.drawImage(img, sx, sy, sw + 0.9, sh, sx, sy, sw + 0.9, sh);
  ctx.restore();
};

// ---------------------------------------------------------------- los marcos del muñeco (los mismos giros que escena.ts y los bloques)
type Marcos = {raiz: Marco; cuerpo: Marco; cabeza: Marco; hombro: [Marco, Marco]; codo: [Marco, Marco]; rodilla: [Marco, Marco]};
const marcos = (pose: Pose): Marcos => {
  const o: V3 = [pose.base[0], -pose.base[1] + pose.salto, pose.base[2]];
  const MR = ry(Math.PI / 2 - pose.gira);
  const MC = mm(MR, mm(rx(pose.inclina), rz(pose.ladea)));
  const MH = mm(MC, mm(ry(pose.cabeza.gira), mm(rx(pose.cabeza.cabecea), rz(pose.cabeza.ladea))));
  const raiz: Marco = {o, m: MR, s: S};
  const pc = sum(o, esc(apM(MR, [0, M.cadera, 0]), S));
  const cuerpo: Marco = {o: pc, m: MC, s: S};
  const cabeza: Marco = {o: sum(pc, esc(apM(MC, [0, M.torso.alto + M.cuello, 0]), S)), m: MH, s: S};
  const brazo = (lado: 1 | -1): [Marco, Marco] => {
    const b = lado > 0 ? pose.izq : pose.der;
    const MS = mm(MC, mm(rx(-b.alza), mm(rz(lado * b.abre), ry(lado * b.giro))));
    const h = sum(pc, esc(apM(MC, [lado * M.hombro.x, M.torso.alto - M.hombro.abajo, 0]), S));
    const ME = mm(MS, rx(-b.codo));
    return [{o: h, m: MS, s: S}, {o: sum(h, esc(apM(MS, [0, -M.brazo[0], 0]), S)), m: ME, s: S}];
  };
  const pierna = (lado: 1 | -1): Marco => {
    const MK = mm(MR, rx(-pose.patada));
    return {o: sum(o, esc(apM(MR, [lado * M.pierna.x, M.cadera * 0.5, M.pierna.muslo - 8]), S)), m: MK, s: S};
  };
  const [hd, cd] = brazo(-1), [hi, ci] = brazo(1);
  return {raiz, cuerpo, cabeza, hombro: [hd, hi], codo: [cd, ci], rodilla: [pierna(-1), pierna(1)]};
};
const apM = (m: M3, v: V3): V3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const ejes = (k: Marco): [V3, V3, V3] => [ejeMarco(k, [1, 0, 0]), ejeMarco(k, [0, 1, 0]), ejeMarco(k, [0, 0, 1])];

// los grises (densidades de copia): la piel blanca de maquillaje, la camisa clara, lo oscuro bien oscuro
const T = {cabeza: 0.88, pelo: 0.1, camisa: 0.62, mano: 0.86, puno: 0.8, pantalon: 0.5, zapato: 0.2, cuello: 0.5, silla: 0.48, base: 0.44, poste: 0.6};

export type Pieza = {z: number; pinta: () => void};

// la sombra de la silla en el suelo (va en el fondo: lo de delante solo lleva lo que tiene contorno)
export const sombraSilla = (ctx: CanvasRenderingContext2D) => sombra(ctx, proyecta([SILLA.x + 14, SUELO, SILLA.z]), 190, 52, 0.55);

// ---------------------------------------------------------------- la silla (gira con él)
const sillaPiezas = (ctx: CanvasRenderingContext2D, pose: Pose, piezas: Pieza[]) => {
  const yAs = SUELO - SILLA.asiento;
  const base: Marco = {o: [SILLA.x, -SUELO, SILLA.z], m: ry(0), s: 1};
  const gira: Marco = {o: [SILLA.x, -SUELO, SILLA.z], m: ry(Math.PI / 2 - pose.gira), s: 1};
  // la base de cinco patas y sus ruedas, en el suelo (lo primero)
  piezas.push({z: -1e4, pinta: () => {
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.3;
      const pata: Marco = {o: [SILLA.x, -SUELO, SILLA.z], m: ry(a), s: 1};
      const e = ejes(pata);
      caja(ctx, enMarco(pata, [0, 26 + PLACA / 2, STUD * 0.95]), e, [30, PLACA / 2, 94], T.base, {borde: 0.3});
      cilindro(ctx, enMarco(pata, [0, 2, STUD * 2.1]), [0, -1, 0], 13, 22, 0.42, {n: 12});
    }
    cilindro(ctx, enMarco(base, [0, 22, 0]), [0, -1, 0], 30, 36, T.base, {n: 18});
    cilindro(ctx, enMarco(base, [0, 52, 0]), [0, -1, 0], 16, yAs - 70, T.poste, {n: 16});
  }});
  const e = ejes(gira);
  const asiento = enMarco(gira, [0, yAs - PLACA * 0.75, -6]);
  piezas.push({z: asiento[2] - 40, pinta: () => caja(ctx, asiento, e, [96, PLACA * 0.75, 96], T.silla)});
  const respaldo = enMarco(gira, [0, yAs - 4 + ALTO * 1.05, -STUD * 1.5 - 4]);
  piezas.push({z: respaldo[2], pinta: () => caja(ctx, respaldo, e, [96, ALTO * 1.05, 32], T.silla, {
    cara: (ej, s, pts) => {
      // el respaldo acolchado: dos costuras
      if (ej !== 2) return;
      ctx.strokeStyle = gris(T.silla * 0.45);
      ctx.lineWidth = 2.5;
      for (const f of [0.33, 0.66]) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0] + (pts[1][0] - pts[0][0]) * f, pts[0][1] + (pts[1][1] - pts[0][1]) * f);
        ctx.lineTo(pts[3][0] + (pts[2][0] - pts[3][0]) * f, pts[3][1] + (pts[2][1] - pts[3][1]) * f);
        ctx.stroke();
      }
      void s;
    },
  })});
};

// ---------------------------------------------------------------- el muñeco
export const munecoPiezas = (ctx: CanvasRenderingContext2D, pose: Pose, piezas: Pieza[]) => {
  sillaPiezas(ctx, pose, piezas);
  const k = marcos(pose);
  const sk = esqueleto(pose);
  const eR = ejes(k.raiz);
  // la cadera
  const cadera = enMarco(k.raiz, [0, M.cadera / 2, 0]);
  piezas.push({z: cadera[2] - 10, pinta: () => caja(ctx, cadera, eR, [64 * S, (M.cadera / 2) * S, 32 * S], T.pantalon, {borde: 0.3})});
  // las piernas (pantalón gris medio): el muslo, la espinilla y el zapato
  for (const i of [0, 1] as const) {
    const lado = i === 0 ? -1 : 1;
    const muslo = enMarco(k.raiz, [lado * M.pierna.x, M.cadera * 0.5, (M.pierna.muslo - 8) / 2]);
    const rod = k.rodilla[i];
    const eK = ejes(rod);
    const espinilla = enMarco(rod, [0, -M.pierna.espinilla / 2, 0]);
    const pie = enMarco(rod, [0, -M.pierna.espinilla - PLACA / 2 + 2, STUD * 0.45]);
    const z = (muslo[2] + espinilla[2]) / 2;
    piezas.push({z, pinta: () => {
      caja(ctx, espinilla, eK, [32 * S, (M.pierna.espinilla / 2) * S, 32 * S], T.pantalon, {borde: 0.3});
      caja(ctx, pie, eK, [32 * S, (PLACA / 2) * S, 64 * S], T.zapato, {borde: 0.4});
      caja(ctx, muslo, eR, [32 * S, ALTO * 0.4 * S, ((M.pierna.muslo + 8) / 2) * S], T.pantalon, {borde: 0.3});
    }});
  }
  // el cuerpo con su camisa
  const eC = ejes(k.cuerpo);
  const pecho = enMarco(k.cuerpo, [0, M.torso.alto / 2, 0]);
  piezas.push({z: pecho[2], pinta: () => {
    caja(ctx, pecho, eC, [(M.torso.an / 2) * S, (M.torso.alto / 2) * S, (M.torso.fondo / 2) * S], T.camisa, {
      borde: 0.45,
      cara: (e, s) => {
        if (e !== 2 || s !== 1) return;
        const w = (M.torso.an - 10) / 2, h = (M.torso.alto - 4) / 2, zf = M.torso.fondo / 2 + 0.6;
        const p00 = proyecta(enMarco(k.cuerpo, [-w, M.torso.alto / 2 + 2 + h, zf]));
        const p10 = proyecta(enMarco(k.cuerpo, [w, M.torso.alto / 2 + 2 + h, zf]));
        const p01 = proyecta(enMarco(k.cuerpo, [-w, M.torso.alto / 2 + 2 - h, zf]));
        imagenEn(ctx, lienzoCamisa(), 0, 0, 256, 256, p00, p10, p01);
      },
    });
  }});
  // la cabeza: el cuello, el cilindro de maquillaje pálido, la cara pegada en tiras y el pelo engominado
  const eH = ejes(k.cabeza);
  const arriba = eH[1]; // «arriba» de la cabeza, ya en la pantalla
  const baseCab = enMarco(k.cabeza, [0, 0, 0]);
  const zCab = sk.cabeza[2];
  piezas.push({z: zCab + 30, pinta: () => {
    cilindro(ctx, enMarco(k.cabeza, [0, -M.cuello - 1, 0]), arriba, 28 * S, (M.cuello + 2) * S, T.cuello, {n: 16, borde: 0.4});
    cilindro(ctx, baseCab, arriba, M.cabeza.r * S, M.cabeza.alto * S, T.cabeza, {n: 32, borde: 0.42, grueso: 3});
    // la cara: tiras de la textura sobre el cilindro (de −1,3 a 1,3 rad; 84 px de alto, centrada a alto/2 + 2)
    const cara = lienzoCara(pose.cara, Math.round(pose.ojos[0] * 4) / 4, Math.round(pose.ojos[1] * 4) / 4);
    const r = M.cabeza.r + 0.6;
    const yc = M.cabeza.alto / 2 + 2;
    const TIRAS = 32;
    for (let j = 0; j < TIRAS; j++) {
      const th0 = -1.3 + (2.6 * j) / TIRAS, th1 = -1.3 + (2.6 * (j + 1)) / TIRAS, thm = (th0 + th1) / 2;
      const n = ejeMarco(k.cabeza, [Math.sin(thm), 0, Math.cos(thm)]);
      const enSup = enMarco(k.cabeza, [r * Math.sin(thm), yc, r * Math.cos(thm)]);
      const vista = pto(n, nor(res([540, 300, 3582], enSup)));
      if (vista < 0.08) continue;
      const pA = proyecta(enMarco(k.cabeza, [r * Math.sin(th0), yc + 42, r * Math.cos(th0)]));
      const pB = proyecta(enMarco(k.cabeza, [r * Math.sin(th1), yc + 42, r * Math.cos(th1)]));
      const pC = proyecta(enMarco(k.cabeza, [r * Math.sin(th0), yc - 42, r * Math.cos(th0)]));
      ctx.globalAlpha = Math.min(1, (vista - 0.08) / 0.12);
      imagenEn(ctx, cara, (512 * j) / TIRAS, 0, 512 / TIRAS, 256, pA, pB, pC);
      ctx.globalAlpha = 1;
    }
    // el pelo engominado: una cúpula pegada a la cabeza, oscura y brillante, con la raya a un lado
    const anillo = (h: number, r: number, n = 28) => Array.from({length: n}, (_, j) => {
      const a = (j / n) * Math.PI * 2;
      return proyecta(enMarco(k.cabeza, [r * Math.sin(a), h, r * Math.cos(a)]));
    });
    const rc = M.cabeza.r + 2.5, hc = M.cabeza.alto;
    const cupula = envolvente([...anillo(hc - 12, rc), ...anillo(hc + 4, rc * 0.96), ...anillo(hc + 14, rc * 0.8), ...anillo(hc + 20, rc * 0.5)]);
    const cPelo = proyecta(enMarco(k.cabeza, [-rc * 0.3, hc + 10, rc * 0.4]));
    const gp = ctx.createRadialGradient(cPelo[0], cPelo[1], 4, cPelo[0], cPelo[1], rc * S * 1.3);
    gp.addColorStop(0, gris(0.42));
    gp.addColorStop(0.35, gris(0.16));
    gp.addColorStop(1, gris(0.06));
    camino(ctx, cupula);
    ctx.fillStyle = gp;
    ctx.fill();
    ctx.strokeStyle = gris(0.03);
    ctx.lineWidth = 3;
    ctx.stroke();
    // la raya del peinado y el brillo de la brillantina (solo lo que se ve)
    const curva = (lado: number, h0: number) => {
      const pts: [number, number][] = [];
      for (let j = 0; j <= 10; j++) {
        const z = rc * (0.95 - (1.9 * j) / 10);
        const xx = lado * rc * 0.32;
        const h = h0 + 18 * Math.sqrt(Math.max(0, 1 - (z / rc) ** 2));
        const q = enMarco(k.cabeza, [xx, h, z]);
        if (!seVe(ejeMarco(k.cabeza, [0, 0.6, z / rc]), q)) continue;
        pts.push(proyecta(q));
      }
      return pts;
    };
    const raya = curva(1, hc - 1);
    if (raya.length > 1) {
      camino(ctx, raya, false);
      ctx.strokeStyle = gris(0.36);
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    const brillo = curva(-0.9, hc + 1);
    if (brillo.length > 1) {
      camino(ctx, brillo, false);
      ctx.strokeStyle = gris(0.7);
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }});
  // los brazos: el hombro redondo, el brazo, el antebrazo y la mano blanca
  for (const i of [0, 1] as const) {
    const h = k.hombro[i], c = k.codo[i];
    const bajaH = esc(ejeMarco(h, [0, 1, 0]), -1); // hacia la mano, en la pantalla
    const bajaC = esc(ejeMarco(c, [0, 1, 0]), -1);
    const hombro = enMarco(h, [0, 0, 0]);
    const codo = enMarco(c, [0, 0, 0]);
    const mano = enMarco(c, [0, -M.brazo[1] - 24, 0]);
    const z1 = (hombro[2] + codo[2]) / 2, z2 = (codo[2] + mano[2]) / 2;
    const tramo1 = () => {
      cilindro(ctx, enMarco(h, [0, 14, 0]), bajaH, 26 * S, 26 * S, T.camisa, {n: 18, borde: 0.45});
      cilindro(ctx, hombro, bajaH, 24 * S, M.brazo[0] * S, T.camisa, {n: 18, borde: 0.45, tapa: T.camisa});
    };
    const tramo2 = () => {
      cilindro(ctx, codo, bajaC, 22.5 * S, M.brazo[1] * S, T.camisa, {n: 18, borde: 0.45, tapa: T.camisa});
      cilindro(ctx, enMarco(c, [0, -M.brazo[1] + 12, 0]), bajaC, 23.5 * S, 12 * S, T.puno, {n: 18, borde: 0.4});
      cilindro(ctx, enMarco(c, [0, -M.brazo[1] + 6, 0]), bajaC, M.rMano * S, 30 * S, T.mano, {n: 18, borde: 0.45, tapa: T.mano, tapaAbajo: true});
    };
    // si el antebrazo va por delante del brazo, se pinta después; la mano, un pelo por delante de lo que toca
    piezas.push({z: z1, pinta: tramo1});
    piezas.push({z: Math.max(z2, z1 + 1) + 6, pinta: tramo2});
  }
  return sk;
};

// el color de la luz en cada pieza, por si hace falta fuera (para la sombra en el suelo)
export const sombraMuneco = (ctx: CanvasRenderingContext2D, pose: Pose) => {
  const sk = esqueleto(pose);
  const p = proyecta([sk.cadera[0] + 20, SUELO, sk.cadera[2] + 30]);
  sombra(ctx, p, 130, 34, 0.35);
  void luz;
};
