import {clamp, rng} from '../../../comun/curvas';
import {PAPELERA, R_BOLA, SUELO, bola, escalaEn, proyecta, type Bola, type Golpe, type V3} from '../escena';
import {G, TINTA, afEstira, afMul, afRot, afEsc, afTras, apl, cinta, elipse, estrella, spline, type Af, type Lienzo, type P} from './tinta';

// LA BOLA Y LOS GOLPES EN DIBUJO DE LOS 30. La bola de papel es una pelota blanca con su tinta, arrugada (un
// contorno con chichones y tres pliegues que giran con ella), que se estira mucho en el aire a lo largo de su velocidad y se aplasta
// mucho contra lo que toca (el doble que la de los bloques: es un dibujo animado); detrás deja tres rayas de velocidad que siguen
// su camino de verdad (si corre por el borde de la papelera, las rayas se curvan con el aro). Cada golpe es una estrella blanca que
// revienta en tres dibujos, con sus líneas de impacto alrededor y estrellitas que saltan; el suelo levanta nubecitas de polvo.

const pr = (v: V3): P => proyecta(v);
const PB = PAPELERA;
const hash = (n: number) => rng(Math.floor(n * 9973) + 17)();

// el contorno arrugado (fijo) y los tres pliegues de dentro, en un radio 1
const CONTORNO: P[] = (() => {
  const r = rng(4242);
  return Array.from({length: 13}, (_, i) => {
    const a = (i / 13) * Math.PI * 2;
    const q = 0.9 + r() * 0.16;
    return [Math.cos(a) * q, Math.sin(a) * q] as P;
  });
})();
// los pliegues del papel arrugado: rayas quebradas que salen de dos «nudos»
const PLIEGUES: P[][] = [
  [[-0.62, -0.18], [-0.3, -0.1], [-0.05, -0.38], [0.12, -0.7]],
  [[-0.05, -0.38], [0.36, -0.22], [0.66, -0.36]],
  [[-0.3, -0.1], [-0.1, 0.22], [-0.42, 0.5]],
  [[-0.1, 0.22], [0.3, 0.3], [0.5, 0.6]],
];

// dónde se pinta la bola: ¿va detrás de la boca de la papelera (dentro, o en la parte de atrás del aro) o delante?
export const bolaDetras = (b: Bola) => {
  const rho = Math.hypot(b.c[0] - PB.x, b.c[2] - PB.z);
  if (b.dentro) return true;
  return rho < PB.rBorde + PB.tubo + R_BOLA + 6 && b.c[1] > PB.yBorde - R_BOLA - PB.tubo - 12 && (b.c[2] < -10 || rho < PB.rBorde - 6);
};

export const sombraBola = (L: Lienzo, b: Bola) => {
  const rho = Math.hypot(b.c[0] - PB.x, b.c[2] - PB.z);
  if (b.dentro || rho < PB.rBorde + PB.tubo + 10) return;
  const alto = SUELO - R_BOLA - b.c[1];
  const k = clamp(1 - alto / 700);
  if (k <= 0) return;
  const c = pr([b.c[0], SUELO, b.c[2]]);
  L.forma(900, elipse(c[0], c[1], 54 * (0.5 + 0.5 * k), 12 * (0.5 + 0.5 * k)), {relleno: TINTA, linea: null, alfa: 0.35 * k, hierve: 0.4});
};

export const dibujaBola = (L: Lienzo, i: number, tb: number, b: Bola) => {
  const c = pr(b.c);
  const r = R_BOLA * escalaEn(b.c[2]);
  // la velocidad en la pantalla
  const a = pr(bola(i, Math.max(0, tb - 0.012)).c), z = pr(bola(i, tb + 0.012).c);
  const v: P = [(z[0] - a[0]) / 0.024, (z[1] - a[1]) / 0.024];
  const vel = Math.hypot(v[0], v[1]);
  // las rayas de velocidad: siguen el camino de los últimos instantes
  if (vel > 700 && !b.dentro) {
    const camino: P[] = [];
    for (let j = 0; j <= 6; j++) camino.push(pr(bola(i, Math.max(0, tb - j * 0.022)).c));
    const largo = clamp(vel / 2600, 0.3, 1);
    for (const [k, off] of [[0, -0.55], [1, 0], [2, 0.55]] as [number, number][]) {
      const pts: P[] = [];
      const n = Math.max(2, Math.round((k === 1 ? 6 : 4) * largo));
      for (let j = 1; j <= n; j++) {
        const p = camino[j], q = camino[j - 1];
        const dx = q[0] - p[0], dy = q[1] - p[1];
        const l = Math.hypot(dx, dy) || 1;
        pts.push([p[0] - (dy / l) * r * off, p[1] + (dx / l) * r * off]);
      }
      if (pts.length >= 2) L.trazo(910 + k, pts, 6 - Math.abs(off) * 3);
    }
  }
  // aplastar y estirar: se estira con la velocidad y se aplasta contra lo que toca (sin perder área)
  const ap = b.aplasta.k;
  let m: Af = afMul(afTras(c[0], c[1]), afEsc(r, r));
  if (ap > 0.02) {
    const n2: P = [b.aplasta.n[0], b.aplasta.n[1]];
    const k = 1 - clamp(ap * 0.85, 0, 0.55);
    m = afMul(afEstira(n2[0], n2[1], k, 1 / Math.sqrt(k), c), m);
  } else if (vel > 300) {
    const k = 1 + clamp((vel - 300) / 2600) * 0.42;
    m = afMul(afEstira(v[0], v[1], k, 1 / Math.sqrt(k), c), m);
  }
  const giro = b.giro;
  const mg: Af = afMul(m, afRot(giro));
  L.forma(920, apl(mg, spline(CONTORNO, true, 4)), {relleno: G.blanco, lw: 8, sombra: {col: G.claro, dx: r * 0.22, dy: r * 0.2}});
  // los pliegues, que giran con ella (y se achatan un poco con el vuelco)
  const mv: Af = afMul(mg, afEsc(1, 0.75 + 0.25 * Math.cos(b.vuelco)));
  PLIEGUES.forEach((p, k) => L.trazo(921 + k, apl(mv, p), 4.5));
};

// los arcos de giro: si la bola corre por el borde de la papelera, dos rayas curvas siguen el aro por detrás de ella (así se lee que
// da vueltas aunque en la pantalla vaya hacia el fondo)
export const arcosAro = (L: Lienzo, i: number, tb: number, b: Bola) => {
  const rho = Math.hypot(b.c[0] - PB.x, b.c[2] - PB.z);
  if (Math.abs(rho - PB.rBorde) > 45 || b.c[1] > PB.yBorde - 20 || b.c[1] < PB.yBorde - 95) return;
  const ang = (c: V3) => Math.atan2(c[2] - PB.z, c[0] - PB.x);
  const a1 = ang(b.c), a0 = ang(bola(i, Math.max(0, tb - 0.03)).c);
  let dphi = a1 - a0;
  if (dphi > Math.PI) dphi -= 2 * Math.PI;
  if (dphi < -Math.PI) dphi += 2 * Math.PI;
  const w = dphi / 0.03;
  if (Math.abs(w) < 2) return;
  const s = Math.sign(w);
  const largo = clamp(Math.abs(w) / 10, 0.5, 1) * 2.3;
  for (const [k, dr, dy, ka] of [[0, -0.62, -0.55, 0.8], [1, 0, -0.05, 1], [2, 0.62, 0.45, 0.8]] as [number, number, number, number][]) {
    const pts: P[] = [];
    for (let j = 0; j <= 24; j++) {
      const p = a1 - s * (0.3 + (j / 24) * largo * ka);
      const rr = rho + dr * R_BOLA * 0.6;
      pts.push(pr([PB.x + rr * Math.cos(p), b.c[1] + dy * R_BOLA, PB.z + rr * Math.sin(p)]));
    }
    L.forma(940 + k, cinta(pts, k === 1 ? 17 : 12, 2), {relleno: TINTA, lw: 2});
  }
};

// ---------------------------------------------------------------- los golpes
// tres dibujos de la estrella (a dos): sale, se pasa, se encoge
const TAM = [1, 1.28, 0.9, 0.5];
export const dibujaGolpes = (L: Lienzo, golpes: Golpe[], tq: number) => {
  golpes.forEach((g, gi) => {
    const u = tq - g.t;
    if (u < -1e-6 || u > 0.5) return;
    const f = clamp(g.fuerza / 1500, 0.62, 1.25);
    const p = pr(g.p);
    const dib = Math.floor(u * 12 + 1e-6);
    const sem = 1000 + gi * 40;
    if (g.tipo === 'suelo') {
      if (g.fuerza < 380 || dib > 4) return;
      // nubecitas de polvo que se abren a los lados
      for (let k = 0; k < 4; k++) {
        const lado = k % 2 ? 1 : -1;
        const d = (18 + dib * 22) * (1 + (k > 1 ? 0.6 : 0)) * f;
        const rr = (16 + dib * 6) * f * (k > 1 ? 0.7 : 1) * (dib > 3 ? 0.6 : 1);
        const cx = p[0] + lado * d, cy = p[1] - 6 - dib * 4 - (k > 1 ? 14 : 0);
        L.forma(sem + k, spline([[cx - rr, cy], [cx - rr * 0.7, cy - rr * 0.8], [cx, cy - rr], [cx + rr * 0.8, cy - rr * 0.7], [cx + rr, cy], [cx, cy + rr * 0.4]], true, 4), {relleno: G.palido, lw: 5});
      }
      if (dib < 2) for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + (k - 1) * 0.6;
        L.trazo(sem + 10 + k, [[p[0] + Math.cos(a) * 50 * f, p[1] + Math.sin(a) * 40 * f], [p[0] + Math.cos(a) * 90 * f, p[1] + Math.sin(a) * 76 * f]], 6);
      }
      return;
    }
    if (g.tipo === 'pila') {
      // ¡dentro!: estrellitas que saltan de la boca de la papelera
      const c = pr([PB.x, PB.yBorde, 0]);
      for (let k = 0; k < 6; k++) {
        const ang = -Math.PI / 2 + (k - 2.5) * 0.42;
        const sp = 520 + hash(gi + k) * 300;
        const x = c[0] + Math.cos(ang) * sp * u * f;
        const y = c[1] - 30 + Math.sin(ang) * sp * u * f + 900 * u * u;
        const q = (20 + hash(k + 3) * 10) * (u < 0.35 ? 1 : 0.6);
        if (u > 0.45) continue;
        L.forma(sem + k, estrella(x, y, q, q * 0.42, 4, u * 6 + k), {relleno: G.blanco, lw: 5});
      }
      return;
    }
    if (dib > 3) return;
    // la estrella blanca del golpe con sus líneas de impacto
    const R = 64 * f * TAM[dib];
    L.forma(sem, estrella(p[0], p[1], R, R * 0.5, 7, hash(gi) * 3), {relleno: G.blanco, lw: 7});
    if (dib < 3) {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + hash(gi * 3 + 1);
        const r0 = R * 1.15 + dib * 8, r1 = r0 + (26 + 18 * hash(k + gi)) * f;
        L.trazo(sem + 2 + k, [[p[0] + Math.cos(a) * r0, p[1] + Math.sin(a) * r0], [p[0] + Math.cos(a) * r1, p[1] + Math.sin(a) * r1]], 6);
      }
    }
    // las estrellitas que saltan
    for (let k = 0; k < 3; k++) {
      const ang = -Math.PI / 2 + (k - 1) * 0.9 + (hash(gi + k * 7) - 0.5) * 0.4;
      const sp = 380 + hash(gi * 5 + k) * 260;
      const x = p[0] + Math.cos(ang) * sp * u;
      const y = p[1] + Math.sin(ang) * sp * u + 1100 * u * u;
      const q = 15 + 6 * hash(k);
      L.forma(sem + 20 + k, estrella(x, y, q, q * 0.4, 4, u * 8 + k), {relleno: G.blanco, lw: 5});
    }
  });
};

// las estrellitas que dan vueltas (la lámpara mareada después del golpe)
export const estrellasMareo = (L: Lienzo, c: P, t: number, rx: number, ry: number) => {
  for (let k = 0; k < 3; k++) {
    const a = t * 7 + (k / 3) * Math.PI * 2;
    const x = c[0] + Math.cos(a) * rx, y = c[1] + Math.sin(a) * ry;
    L.forma(1300 + k, estrella(x, y, 16, 7, 5, a), {relleno: G.blanco, lw: 5});
  }
};

