import React from 'react';
import {loadFont} from '@remotion/google-fonts/Poppins';
import {E, clamp, mix, p, rng, temblor} from '../../comun/curvas';
import {capsula, corazon} from '../formas';
import {
  BORDE, DUR, ESCALA_GATO, IMPACTO, MESA_Y, SUELO, T_CAE, T_SUELO, cafe, cinta, curva, elipse as elipse2, enMundo, gato, oreja as orejaD,
  rot, taza, trozos, vapor, type Elipse, type Gato, type P, type Pata,
} from './escena';
import {K, K3, caras, casco, elipse as circulo3, esquinas, hondo, mas, mezcla, plano, planoDe, pr, ruta, ruta3, sombra, tri, type Tri, type V3} from '../IsometricoMotor';

// EL GATO EN 4 · ISOMÉTRICO:
// una maqueta en isometría de verdad (../IsometricoMotor.ts), pastel (lila, coral, menta y crema), cada sólido en tres tonos sin
// contorno, sombras suaves, tarjetitas de iconos que flotan, la etiqueta que le sigue y el canto coral del suelo. Aquí, una cocina:
// la nevera, la ventana, el estante de botes, la planta, el taburete y el comedero vacío (el motivo).
// La escena de perfil (./escena.ts) se pasa a la maqueta: el plano del perfil va a lo largo del eje a (hacia abajo a la derecha) y
// lo de «este lado» (la pata que empuja, el ojo de cerca) queda hacia la cámara (+l). El gato se arma en volumen con el esqueleto de
// la escena: cada elipse del perfil es un elipsoide (con su ancho), las patas son tubos y la cabeza gira de verdad: de lado mira la
// taza y, cuando el perfil la gira a cámara, aquí se vuelve hacia quien mira (45° y hacia arriba), con las pupilas clavadas en él.
// La taza es un cilindro que gira sobre el borde y cae recta hasta el suelo por la línea discontinua que ya estaba marcada, con su
// sombra que crece al acercarse; al romperse, la onda en el suelo, el bocadillo rojo «!» y los trozos como piezas de maqueta.

const {fontFamily: POPPINS} = loadFont('normal', {weights: ['600', '700'], subsets: ['latin']});

const COL = {
  cielo: '#EEEAFA', tierra: '#FCE9E2',
  pared: '#DCD4F2', paredIzq: '#CBC1EA', paredArriba: '#F5F2FD', zocalo: '#C4B9E6',
  suelo: '#EEEAF8', suelo2: '#DFD8F2', junta: '#D6CEEC',
  borde: '#F1937D',
  lila: '#9E8CF0', coral: '#F48C78', menta: '#6FD2B0', amarillo: '#F6C95E', rosa: '#FF6F8B', rojo: '#F2525C',
  tinta: '#2E2A5E', sombra: '#5A4A97',
  cafe: '#7A4A36', cafeLuz: '#A86A4C',
  iris: '#C3E06A', irisOsc: '#86B53C', rosaOreja: '#F7A9B4', nariz: '#F0899A',
};
const PELO = tri('#F49A55', 0.45, 0.24);
const RAYA = '#D46F35';
const CREMA = tri('#FFF0E0', 0.7, 0.13);
const TAZA = tri(COL.menta, 0.42, 0.22);
const LOZA = tri('#FFF7EC', 0.6, 0.14); // el canto roto de la taza
const MESA = tri('#E6E0F5', 0.62, 0.15);
const MADERA = tri('#CABFEC', 0.5, 0.17);
const NEVERA = tri('#B4BEF3', 0.42, 0.18);
const MACETA = tri('#EE8D6E', 0.32, 0.18);
const ASIENTO = tri('#74D2B2', 0.42, 0.2);
const SOPORTE = tri('#A79ECF', 0.4, 0.2);

const S = ESCALA_GATO;
const XA = 560; // la x del perfil que cae en a = 0
const TOP = SUELO - MESA_Y; // la altura de la mesa (590 px de mundo = 0,75 m)
const W3 = (q: P, l = 0): V3 => [q[0] - XA, l, SUELO - q[1]];
const G3 = (q: P, l = 0): V3 => W3(enMundo(q), l); // un punto del gato (se dibuja 1,14 veces más grande desde donde se sienta)

// la cocina
const AP = -1000; // la pared de la izquierda (la de la nevera), en a
const LP = -660; // la pared del fondo (la de la ventana), en l
const LB = 470; // el borde del suelo hacia la cámara, en l
const AB = 1000; // el otro borde, en a
const ALTO = 1500;
const M = {a0: -440, a1: BORDE - XA, l: 230, g: 36, pata: 34}; // la mesa: el borde por donde se va la taza es su cara +a
const IMP: V3 = W3(IMPACTO); // donde se rompe
const PUNTO_IMP: V3 = [IMP[0], 0, 0];

// ---------------------------------------------------------------- vectores
const CX = Math.cos(Math.PI / 6) * K;
const CY = 0.5 * K;
const lin = (v: V3): P => [(v[0] - v[1]) * CX, (v[0] + v[1]) * CY - v[2] * K];
const por3 = (v: V3, k: number): V3 => [v[0] * k, v[1] * k, v[2] * k];
const menos3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const uni = (v: V3): V3 => {
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
};
const mix3 = (a: V3, b: V3, k: number): V3 => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
const VISTA: V3 = uni([1, 1, 1]);
const f1 = (x: number) => x.toFixed(1);

// un pulso que sube y vuelve (el mismo de la escena)
const pulso = (t: number, t0: number, sube: number, baja: number) =>
  t < t0 ? 0 : t < t0 + sube ? E.outCubic((t - t0) / sube) : 1 - E.inOutCubic(clamp((t - t0 - sube) / baja));
type Clave = [number, number, ((x: number) => number)?];
const kv = (t: number, claves: Clave[]) => {
  if (t <= claves[0][0]) return claves[0][1];
  for (let i = 1; i < claves.length; i++) {
    const [t1, v1, e] = claves[i];
    const [t0, v0] = claves[i - 1];
    if (t <= t1) return mix(v0, v1, (e || E.inOutCubic)(p(t, t0, t1 - t0)));
  }
  return claves[claves.length - 1][1];
};
// los párpados, la picardía y la sonrisa: los mismos fotogramas clave de la escena (allí no se exportan)
const PARPADO: Clave[] = [
  [0, 0.1], [0.58, 0.1], [0.76, 0.5], [1.0, 0.5], [1.14, 0.06], [1.56, 0.06], [1.6, 1, E.lin], [1.67, 0.06, E.lin], [2.2, 0.06],
  [2.4, 0.52], [2.74, 0.52], [2.79, 0, E.lin], [4.18, 0.04], [4.36, 0.55], [4.58, 0.55], [4.72, 1], [4.86, 1], [5.0, 0.55], [5.12, 0.97],
];
const PICARDIA: Clave[] = [[0, 0], [0.58, 0], [0.76, 1], [1.0, 1], [1.14, 0], [2.2, 0], [2.4, 1], [2.76, 1], [2.8, 0, E.lin], [4.18, 0], [4.36, 0.5]];
const SONRISA: Clave[] = [[0, 0], [0.7, 0], [0.82, 1], [1.0, 1], [1.12, 0], [2.36, 0], [2.5, 1], [2.78, 1], [2.86, 0], [4.3, 0], [4.46, 1], [4.98, 1], [5.1, 0.4]];

// ---------------------------------------------------------------- piezas de la maqueta
type Ctx = {defs: React.ReactNode[]; id: (s: string) => string};
const cara = (d: string, fill: string, key?: React.Key) => (
  <path key={key} d={d} fill={fill} stroke={fill} strokeWidth={0.8} strokeLinejoin="round" />
);
const caja = (key: React.Key, o: V3, d: V3, t: Tri) => {
  const f = caras(o, d);
  return <g key={key}>{cara(f.izq, t.izq)}{cara(f.der, t.der)}{cara(f.arriba, t.arriba)}</g>;
};
const sombraCaja = (key: React.Key, o: V3, d: V3) => <path key={key} d={ruta(casco(esquinas(o, d).map((q) => pr(sombra(q)))))} />;

const degradadoX = (cx: Ctx, x0: number, x1: number, t: Tri, corte = 0.5) => {
  const g = cx.id('gx');
  cx.defs.push(
    <linearGradient key={g} id={g} gradientUnits="userSpaceOnUse" x1={x0} y1={0} x2={x1} y2={0}>
      <stop offset={0} stopColor={mezcla(t.izq, t.arriba, 0.35)} />
      <stop offset={corte * 0.8} stopColor={t.izq} />
      <stop offset={Math.min(0.98, corte + 0.25)} stopColor={t.der} />
      <stop offset={1} stopColor={t.der} />
    </linearGradient>,
  );
  return `url(#${g})`;
};
// la luz de un volumen redondo: de arriba a la izquierda
const luz = (cx: Ctx, c: P, r: number, t: Tri) => {
  const g = cx.id('luz');
  cx.defs.push(
    <radialGradient key={g} id={g} gradientUnits="userSpaceOnUse" cx={f1(c[0] - 0.4 * r)} cy={f1(c[1] - 0.46 * r)} r={f1(1.75 * r)}>
      <stop offset={0} stopColor={mezcla(t.arriba, '#FFFFFF', 0.25)} />
      <stop offset={0.32} stopColor={t.arriba} />
      <stop offset={0.62} stopColor={t.izq} />
      <stop offset={1} stopColor={t.der} />
    </radialGradient>,
  );
  return `url(#${g})`;
};

// un cilindro de pie (una maceta, un bote), con su tapa
const cilindro = (cx: Ctx, key: React.Key, c: [number, number], z0: number, z1: number, r0: number, r1: number, t: Tri, n = 32) => {
  const ab = circulo3([c[0], c[1], z0], [r0, 0, 0], [0, r0, 0], n).map(pr);
  const ar = circulo3([c[0], c[1], z1], [r1, 0, 0], [0, r1, 0], n).map(pr);
  const lado = casco([...ab, ...ar]);
  const xs = lado.map((q) => q[0]);
  return (
    <g key={key}>
      <path d={ruta(lado)} fill={degradadoX(cx, Math.min(...xs), Math.max(...xs), t, 0.42)} />
      <path d={ruta(ar)} fill={t.arriba} />
    </g>
  );
};

// un tubo (una pata, la pata del taburete): la cápsula proyectada, con su luz de lado a lado
const tubo = (cx: Ctx, key: React.Key, a: V3, b: V3, ra: number, rb: number, t: Tri) => {
  const A = pr(a), B = pr(b);
  const dx = B[0] - A[0], dy = B[1] - A[1];
  const L = Math.hypot(dx, dy) || 1;
  let n: P = [-dy / L, dx / L];
  if (n[0] + 0.6 * n[1] < 0) n = [-n[0], -n[1]];
  const m: P = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const r = Math.max(ra, rb) * K3;
  const g = cx.id('tubo');
  cx.defs.push(
    <linearGradient key={g} id={g} gradientUnits="userSpaceOnUse" x1={m[0] - n[0] * r} y1={m[1] - n[1] * r} x2={m[0] + n[0] * r} y2={m[1] + n[1] * r}>
      <stop offset={0} stopColor={t.arriba} />
      <stop offset={0.3} stopColor={t.izq} />
      <stop offset={0.62} stopColor={t.izq} />
      <stop offset={0.9} stopColor={t.der} />
    </linearGradient>,
  );
  return <path key={key} d={capsula(A, B, ra * K3, rb * K3)} fill={`url(#${g})`} />;
};

// un elipsoide: su silueta en pantalla es una elipse (la de la matriz J·Jᵀ de sus tres semiejes proyectados)
type Elip3 = {c: V3; u: V3; v: V3; w: V3};
const silueta = (e: Elip3): Elipse => {
  let a = 0, b = 0, d = 0;
  for (const v of [e.u, e.v, e.w]) {
    const [x, y] = lin(v);
    a += x * x; b += x * y; d += y * y;
  }
  const m = (a + d) / 2, r = Math.sqrt(Math.max(0, ((a - d) / 2) ** 2 + b * b));
  const l1 = m + r, l2 = Math.max(1e-6, m - r);
  const ang = Math.abs(b) < 1e-9 ? (a >= d ? 0 : Math.PI / 2) : Math.atan2(l1 - a, b);
  return {c: pr(e.c), rx: Math.sqrt(l1), ry: Math.sqrt(l2), ang};
};
// una elipse del perfil, como elipsoide: sus dos ejes en el plano del perfil y el ancho hacia los lados
const deElipse = (e: Elipse, ancho: number, l = 0, k = 1): Elip3 => {
  const ux = rot([e.rx * S * k, 0], e.ang), vy = rot([0, e.ry * S * k], e.ang);
  return {c: G3(e.c, l), u: [ux[0], 0, -ux[1]], v: [vy[0], 0, -vy[1]], w: [0, ancho * S * k, 0]};
};
// un punto de su superficie (d en sus ejes) y su normal
const enSuperficie = (e: Elip3, d: V3) => {
  const dd = uni(d);
  const q = mas(mas(mas(e.c, e.u, dd[0]), e.v, dd[1]), e.w, dd[2]);
  const lu = dot(e.u, e.u), lv = dot(e.v, e.v), lw = dot(e.w, e.w);
  const n = uni(mas(mas(por3(e.u, dd[0] / lu), e.v, dd[1] / lv), e.w, dd[2] / lw));
  return {q, n};
};
const bola = (cx: Ctx, key: React.Key, e: Elip3, t: Tri) => {
  const s = silueta(e);
  return <path key={key} d={elipse2(s)} fill={luz(cx, s.c, s.rx, t)} />;
};

// un sólido de caras planas (los trozos): cada cara visible, con su tono según hacia dónde mira
const rgb = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const tonoN = (nn: V3, t: Tri) => {
  const w = [Math.max(0, nn[2]) ** 2 + 0.02, Math.max(0, nn[1]) ** 2, Math.max(0, nn[0]) ** 2];
  const cs = [t.arriba, t.izq, t.der].map(rgb);
  const s = w[0] + w[1] + w[2];
  return '#' + [0, 1, 2].map((i) => Math.round((cs[0][i] * w[0] + cs[1][i] * w[1] + cs[2][i] * w[2]) / s).toString(16).padStart(2, '0')).join('');
};

// ---------------------------------------------------------------- el gato
type Partes = {antes: React.ReactNode[]; medio: React.ReactNode[]; despues: React.ReactNode[]; cabeza: V3; R: number; sombras: Elip3[]; techo: P};

const gato3 = (cx: Ctx, g: Gato, t: number, objetivo: V3): Partes => {
  const antes: React.ReactNode[] = [], medio: React.ReactNode[] = [], despues: React.ReactNode[] = [];

  // ---- la cola, detrás de todo: una cinta que adelgaza, con sus anillos
  const nc = g.cola.pts.length;
  const cola3 = g.cola.pts.map((q, i) => G3(q, -46 + 40 * (i / (nc - 1)) ** 1.5));
  const colaP = cola3.map(pr);
  const colaR = g.cola.r.map((r) => r * S * K3);
  const dCola = cinta(colaP, colaR);
  const xs = colaP.map((q) => q[0]), ys = colaP.map((q) => q[1]);
  const gc = cx.id('cola');
  cx.defs.push(
    <linearGradient key={gc} id={gc} gradientUnits="userSpaceOnUse" x1={Math.min(...xs) - 30} y1={Math.min(...ys) - 30} x2={Math.max(...xs) + 30} y2={Math.max(...ys) + 30}>
      <stop offset={0} stopColor={PELO.arriba} />
      <stop offset={0.5} stopColor={PELO.izq} />
      <stop offset={1} stopColor={PELO.der} />
    </linearGradient>,
  );
  const clipCola = cx.id('clipcola');
  cx.defs.push(<clipPath key={clipCola} id={clipCola}><path d={dCola} /></clipPath>);
  antes.push(
    <g key="cola">
      <path d={dCola} fill={`url(#${gc})`} />
      <g clipPath={`url(#${clipCola})`} stroke={RAYA} strokeLinecap="round">
        {[5, 8, 11, 14].map((i) => {
          const a = colaP[i - 1], b = colaP[i + 1], q = colaP[i];
          const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
          const nx = -dy / L, ny = dx / L, r = colaR[i] * 1.6;
          return <line key={i} x1={q[0] - nx * r} y1={q[1] - ny * r} x2={q[0] + nx * r} y2={q[1] + ny * r} strokeWidth={colaR[i] * 0.85} />;
        })}
      </g>
    </g>,
  );

  // ---- las patas de delante: la del otro lado, detrás del cuerpo; la de este lado, delante (empuja la taza)
  const pata3 = (key: string, pt: Pata, l: number, lMano: number) => {
    const h = G3(pt.hombro, l), c = G3(pt.codo, mix(l, lMano, 0.5)), m = G3(pt.mano, lMano);
    const pie = deElipse(pt.pie, 21, lMano);
    return (
      <g key={key}>
        {tubo(cx, 'b', h, c, 31 * S, 23 * S, PELO)}
        {tubo(cx, 'a', c, m, 23 * S, 18 * S, PELO)}
        {bola(cx, 'p', pie, CREMA)}
      </g>
    );
  };
  antes.push(pata3('pataLejos', g.pataLejos, -50, -46));
  antes.push(bola(cx, 'pieLejos', deElipse(g.pieTrasero, 24, -64), CREMA));

  // ---- el cuerpo, de una pieza (las mismas elipses del perfil, con su ancho), con la luz de todo el bulto
  const cadera = deElipse(g.cadera, 94);
  const torso = deElipse(g.torso, 80);
  const pecho = deElipse(g.pecho, 72);
  const barriga = deElipse(g.barriga, 74);
  const partes = [cadera, torso, pecho, barriga].map(silueta);
  const cue0 = G3(g.cuello[0]), cue1 = G3(g.cuello[1]);
  const bx0 = Math.min(...partes.map((s) => s.c[0] - s.rx)), bx1 = Math.max(...partes.map((s) => s.c[0] + s.rx));
  const by0 = Math.min(...partes.map((s) => s.c[1] - s.rx)), by1 = Math.max(...partes.map((s) => s.c[1] + s.rx));
  const rb = Math.max(bx1 - bx0, by1 - by0) / 2;
  const fCuerpo = luz(cx, [(bx0 + bx1) / 2 - rb * 0.1, (by0 + by1) / 2], rb, PELO);
  const dCuerpo = [...partes.map((s) => elipse2(s)), capsula(pr(cue0), pr(cue1), 60 * S * K3, 56 * S * K3)];
  const clipCuerpo = cx.id('clipcuerpo');
  cx.defs.push(<clipPath key={clipCuerpo} id={clipCuerpo}>{dCuerpo.map((d, i) => <path key={i} d={d} />)}</clipPath>);
  // las rayas: anillos alrededor del lomo, solo la parte que mira a la cámara y la de arriba
  const anillo = (e: Elip3, s0: number, a0: number, a1: number): P[][] => {
    const tramos: P[][] = [[]];
    const k = Math.sqrt(1 - s0 * s0);
    for (let i = 0; i <= 24; i++) {
      const fi = mix(a0, a1, i / 24);
      const {q, n} = enSuperficie(e, [Math.cos(fi) * k, s0, Math.sin(fi) * k]);
      if (dot(n, VISTA) > 0.08) tramos[tramos.length - 1].push(pr(q));
      else if (tramos[tramos.length - 1].length) tramos.push([]);
    }
    return tramos.filter((tr) => tr.length > 2);
  };
  const rayas = [
    ...[-0.5, -0.12, 0.26].flatMap((s0) => anillo(torso, s0, Math.PI - 1.7, Math.PI + 1.5)),
    ...[-0.25, 0.25].flatMap((s0) => anillo(cadera, s0, Math.PI - 1.2, Math.PI + 1.1)),
  ];
  antes.push(
    <g key="cuerpo">
      {dCuerpo.map((d, i) => <path key={i} d={d} fill={fCuerpo} />)}
      <g clipPath={`url(#${clipCuerpo})`} fill="none" stroke={RAYA} strokeWidth={15} strokeLinecap="round" opacity={0.75}>
        {rayas.map((tr, i) => <path key={i} d={curva(tr)} />)}
      </g>
    </g>,
  );
  // el muslo de este lado, que se nota, y la pechera crema
  const muslo = deElipse(g.cadera, 50, 56, 0.76);
  antes.push(bola(cx, 'muslo', muslo, PELO));
  const ux = rot([g.pecho.rx * S * 0.4, g.pecho.ry * S * 0.12], g.pecho.ang);
  const pechera: Elip3 = {...deElipse(g.pecho, 46, 24, 0.66)};
  pechera.c = mas(pechera.c, [ux[0], 0, -ux[1]]);
  antes.push(bola(cx, 'pechera', pechera, CREMA));
  antes.push(bola(cx, 'pieCerca', deElipse(g.pieTrasero, 24, 64), CREMA));

  // ---- la cabeza: gira de verdad (de lado mira la taza; a cámara, se vuelve hacia quien mira)
  const H = G3(g.cabeza.c);
  const R = g.cabeza.rx * S;
  // al asomarse mira abajo, pero sin enseñar la nuca: baja la cabeza la mitad y la gira un poco hacia la cámara (los ojos hacen el resto)
  // de lado no mira del todo hacia +a: 17° hacia la cámara, para que se le vea la cara y no la nuca
  const abajo = Math.max(0, g.inclina - 0.1);
  const psi = mix(0.3, Math.PI / 4, g.giro) + 0.36 * clamp(abajo / 0.45) * (1 - g.giro);
  const cabeceo = -(g.inclina - abajo * 0.55) + g.giro * 0.42;
  const f: V3 = [Math.cos(cabeceo) * Math.cos(psi), Math.cos(cabeceo) * Math.sin(psi), Math.sin(cabeceo)];
  const sg: V3 = [-Math.sin(psi), Math.cos(psi), 0]; // su lado de cerca
  const up = cruz(f, sg);
  const cab: Elip3 = {c: H, u: por3(f, R * 0.9), v: por3(sg, R * 1.02), w: por3(up, R * 0.86)};
  const sup = (d: V3) => enSuperficie(cab, d);
  const enCab = (a: number, b: number, c: number): V3 => mas(mas(mas(H, f, a * R), sg, b * R), up, c * R);
  const mejillas: Elip3[] = [1, -1].map((s) => ({c: enCab(0.24, 0.6 * s, -0.3), u: por3(f, R * 0.42), v: por3(sg, R * 0.44), w: por3(up, R * 0.38)}));
  const hocico: Elip3 = {c: enCab(0.72, 0, -0.3), u: por3(f, R * 0.3), v: por3(sg, R * 0.44), w: por3(up, R * 0.27)};
  const sCab = silueta(cab);
  const fCab = luz(cx, sCab.c, sCab.rx * 1.08, PELO);

  // las orejas: un triángulo redondeado con grosor; hacia atrás al romperse, con sus tics
  const tic = (t0: number) => pulso(t, t0, 0.06, 0.22);
  const atras = pulso(t, T_SUELO, 0.07, 0.35);
  const oreja3 = (s: number) => {
    const {q: c, n: da} = sup([0.12, 0.56 * s, 0.82]);
    const bk = s > 0 ? 0.35 * tic(0.84) + 0.95 * atras + 0.3 * tic(5.55) : 0.95 * atras + 0.35 * tic(1.62);
    const dirPunta = uni(mas(mas(da, f, -(0.08 + 0.85 * bk)), sg, s * (0.18 + 0.55 * bk)));
    const punta = mas(c, dirPunta, R * 0.84);
    const bw = por3(uni(cruz(da, f)), R * 0.4);
    const b1 = mas(mas(c, bw), da, -R * 0.14), b2 = mas(mas(c, bw, -1), da, -R * 0.14);
    let nE = uni(cruz(menos3(punta, b1), menos3(b2, b1)));
    if (dot(nE, f) < 0) nE = por3(nE, -1);
    const forma = (o: V3) => orejaD({
      base: [pr(mas(b1, o)), pr(mas(b2, o))], punta: pr(mas(punta, o)), bc: pr(mas(c, o)), dentro: [[0, 0], [0, 0], [0, 0]],
    });
    const atrasO = por3(nE, -13);
    const dentro = [mix3(mix3(b1, punta, 0.14), c, 0.38), mix3(c, punta, 0.8), mix3(mix3(b2, punta, 0.14), c, 0.38)].map((q) => pr(mas(q, nE, 2)));
    const deFrente = dot(nE, VISTA) > 0;
    return (
      <g key={'oreja' + s}>
        <path d={forma(atrasO)} fill={PELO.der} />
        <path d={forma([0, 0, 0])} fill={deFrente ? fCab : PELO.der} />
        {deFrente && <path d={ruta(dentro)} fill={COL.rosaOreja} stroke={COL.rosaOreja} strokeWidth={9} strokeLinejoin="round" />}
      </g>
    );
  };

  // los ojos: en el plano de la cara, con su párpado de «lo voy a hacer», la pupila que se dilata y la mirada
  const parpado = kv(t, PARPADO);
  const pic = kv(t, PICARDIA);
  const dil = clamp((g.ojoCerca.pupila.rx - 3.6) / Math.max(1, g.ojoCerca.rx * 0.64 - 3.6));
  const mirarCam = clamp(g.giro * 1.5);
  const ojo3 = (s: number) => {
    const {q, n} = sup([0.8, 0.43 * s, 0.13]);
    const vis = dot(n, VISTA);
    if (vis < 0.04) return null;
    const uV = por3(uni(menos3(sg, por3(n, dot(n, sg)))), -1); // hacia la derecha de la pantalla
    const vV = cruz(n, uV); // hacia abajo
    const rx = 31, ry = 33;
    const dir = uni(mix3(uni(menos3(objetivo, q)), VISTA, mirarCam));
    let px = dot(dir, uV) * rx * 0.7, py = dot(dir, vV) * ry * 0.6;
    const lp = Math.hypot(px, py), lmax = rx * 0.42;
    if (lp > lmax) { px *= lmax / lp; py *= lmax / lp; }
    const prx = mix(4.2, rx * 0.62, dil), pry = ry * 0.8;
    const lado = s;
    const linea = (x: number) => -ry + 2 * ry * Math.min(parpado, 0.92) + lado * pic * 0.5 * ry * (x / rx);
    const id = cx.id('ojo');
    const cerrado = parpado > 0.93;
    return (
      <g key={'ojo' + s} transform={planoDe(mas(q, n, 2), uV, vV)}>
        {cerrado ? (
          <path d={`M ${-rx} 4 Q 0 ${-ry * 0.95} ${rx} 4`} fill="none" stroke={COL.tinta} strokeWidth={6.5} strokeLinecap="round" />
        ) : (
          <>
            <clipPath id={id}><ellipse cx={0} cy={0} rx={rx} ry={ry} /></clipPath>
            <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={COL.iris} />
            <g clipPath={`url(#${id})`}>
              <ellipse cx={-rx * 0.15} cy={ry * 0.35} rx={rx} ry={ry * 0.7} fill={COL.irisOsc} opacity={0.35} />
              <ellipse cx={px} cy={py} rx={prx} ry={pry} fill={COL.tinta} />
              <circle cx={px - 0.3 * prx - 6} cy={py - 0.42 * pry} r={7.5} fill="#FFFFFF" />
              <circle cx={px + 0.35 * prx + 3} cy={py + 0.3 * pry} r={3.2} fill="#FFFFFF" opacity={0.9} />
              <path d={`M ${-rx - 4} ${-ry - 6} H ${rx + 4} V ${f1(linea(rx + 4))} L ${-rx - 4} ${f1(linea(-rx - 4))} Z`} fill={PELO.izq} />
              <path d={`M ${-rx - 4} ${f1(linea(-rx - 4))} L ${rx + 4} ${f1(linea(rx + 4))}`} stroke={COL.tinta} strokeWidth={5.5} />
            </g>
            <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke={COL.tinta} strokeWidth={4.2} />
          </>
        )}
      </g>
    );
  };

  // la nariz, la boca (con su sonrisa, la «o» al romperse y la lengua al lamerse) y los bigotes
  const sm = kv(t, SONRISA);
  const oh = pulso(t, T_SUELO + 0.02, 0.06, 0.5);
  const lame = g.lengua ? clamp((g.lengua.ry - 5) / 9) : 0;
  const naso = enSuperficie(hocico, [0.72, 0, 0.7]);
  const uN = por3(uni(menos3(sg, por3(naso.n, dot(naso.n, sg)))), -1);
  const vN = cruz(naso.n, uN);
  const cara3 = dot(naso.n, VISTA) > 0.02 && (
    <g key="nariz" transform={planoDe(mas(naso.q, naso.n, 2), uN, vN)}>
      <path d="M -13 -5 Q 0 -9 13 -5 Q 12 2 1.5 9 L -1.5 9 Q -12 2 -13 -5 Z" fill={COL.nariz} />
      <path d={`M 0 8 L 0 15 M 0 15 C -3 ${21 + sm * 2} -11 ${22 + sm * 1} -17 ${16 - sm * 6} M 0 15 C 3 ${21 + sm * 2} 11 ${22 + sm * 1} 17 ${16 - sm * 6}`}
        fill="none" stroke={COL.tinta} strokeWidth={3.6} strokeLinecap="round" />
      {oh > 0.02 && <ellipse cx={0} cy={26} rx={6 * oh} ry={8 * oh} fill={COL.tinta} />}
      {lame > 0.02 && <ellipse cx={0} cy={24 + 6 * lame} rx={9} ry={4 + 9 * lame} fill={COL.nariz} />}
    </g>
  );
  const bigotes = (cerca: boolean) => {
    const out: React.ReactNode[] = [];
    for (const s of [1, -1]) {
      const lejos = dot(por3(sg, s), VISTA) < -0.05;
      if (lejos === cerca) continue;
      for (let j = 0; j < 3; j++) {
        const vib = 0.02 * Math.sin(t * 7 + j);
        const a = mas(mas(mas(hocico.c, sg, s * R * 0.3), up, R * (0.04 - 0.07 * j)), f, R * 0.12);
        const b = mas(mas(mas(a, sg, s * R * 0.95), f, R * 0.12), up, R * (0.2 - 0.17 * j + vib));
        const m = mas(mix3(a, b, 0.5), up, R * 0.06);
        const [A, Mm, B] = [pr(a), pr(m), pr(b)];
        out.push(<path key={`${s}${j}`} d={`M ${f1(A[0])} ${f1(A[1])} Q ${f1(Mm[0])} ${f1(Mm[1])} ${f1(B[0])} ${f1(B[1])}`} />);
      }
    }
    return <g key={'bigotes' + cerca} fill="none" stroke="#5B4A78" strokeWidth={2.6} strokeLinecap="round" opacity={0.75}>{out}</g>;
  };
  // las rayas de la frente (la «M» de los atigrados)
  const frente = [-1, 0, 1].map((k) => {
    const a = sup([0.66, 0.2 * k, 0.6]), b = sup([0.3, 0.17 * k, 0.95]);
    if (dot(a.n, VISTA) < 0.05) return null;
    const [A, B] = [pr(a.q), pr(b.q)];
    return <path key={k} d={`M ${f1(A[0])} ${f1(A[1])} L ${f1(B[0])} ${f1(B[1])}`} stroke={RAYA} strokeWidth={k === 0 ? 13 : 11} strokeLinecap="round" />;
  });

  const cabeza = (
    <g key="cabeza">
      {bigotes(false)}
      {oreja3(-1)}
      {oreja3(1)}
      {[cab, ...mejillas].map((e, i) => <path key={i} d={elipse2(silueta(e))} fill={fCab} />)}
      {frente}
      {bola(cx, 'hocico', hocico, CREMA)}
      {ojo3(1)}
      {ojo3(-1)}
      {cara3}
      {bigotes(true)}
    </g>
  );

  // la pata de este lado: delante del pecho; cuando se la lame, delante de la cara
  const lMano = mix(42, 30, clamp((Math.hypot(...menos3(G3(g.pataCerca.mano), G3(g.pataCerca.hombro))) - 120) / 100));
  const pataCerca = pata3('pataCerca', g.pataCerca, 50, lMano);
  if (t > 4.95) {
    despues.push(cabeza, pataCerca);
  } else {
    despues.push(pataCerca, cabeza);
  }

  // lo más alto del gato en pantalla (para la etiqueta)
  const alto2 = (e: Elipse) => e.c[1] - Math.sqrt((e.rx * Math.sin(e.ang)) ** 2 + (e.ry * Math.cos(e.ang)) ** 2);
  const techo: P = [mix(sCab.c[0], partes[1].c[0], 0.5), Math.min(alto2(sCab) - R * 0.55, alto2(partes[1]))];
  return {antes, medio, despues, cabeza: H, R, sombras: [cadera, torso, pecho], techo};
};

// ---------------------------------------------------------------- la taza
const ASA: P[] = [[50, -31], [69, -31], [80.5, -21], [84, -1], [78.5, 17], [64, 24], [50, 23]];
const dibujaTaza = (cx: Ctx, c3: V3, ang: number, nivel: number) => {
  const eje: V3 = [Math.sin(ang), 0, Math.cos(ang)];
  const e1: V3 = [Math.cos(ang), 0, -Math.sin(ang)];
  const e2: V3 = [0, 1, 0];
  const R = 52, Rb = 47, H = 59;
  const arriba = mas(c3, eje, H), abajo = mas(c3, eje, -H);
  const boca = circulo3(arriba, por3(e1, R), por3(e2, R), 40).map(pr);
  const culo = circulo3(abajo, por3(e1, Rb), por3(e2, Rb), 40).map(pr);
  const lado = casco([...boca, ...culo]);
  // la luz de lado a lado, como un tubo
  const A = pr(abajo), B = pr(arriba);
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
  let nn: P = [-dy / L, dx / L];
  if (nn[0] + 0.6 * nn[1] < 0) nn = [-nn[0], -nn[1]];
  const m: P = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const r = R * 1.1;
  const gid = cx.id('taza');
  cx.defs.push(
    <linearGradient key={gid} id={gid} gradientUnits="userSpaceOnUse" x1={m[0] - nn[0] * r} y1={m[1] - nn[1] * r} x2={m[0] + nn[0] * r} y2={m[1] + nn[1] * r}>
      <stop offset={0} stopColor={mezcla(TAZA.arriba, '#FFFFFF', 0.3)} />
      <stop offset={0.28} stopColor={TAZA.arriba} />
      <stop offset={0.58} stopColor={TAZA.izq} />
      <stop offset={1} stopColor={TAZA.der} />
    </linearGradient>,
  );
  // el asa: girada hacia la derecha de la pantalla, para que se lea «taza»
  const hd = uni(menos3(e1, e2));
  const asa = ASA.map(([x, y]) => pr(mas(mas(c3, hd, x), eje, -y)));
  const asaDelante = dot(hd, VISTA) > -0.12;
  const dAsa = 'M ' + asa.map((q) => `${f1(q[0])} ${f1(q[1])}`).join(' L ');
  const elAsa = (
    <g key="asa" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={dAsa} stroke={TAZA.der} strokeWidth={17} />
      <path d={dAsa} stroke={TAZA.izq} strokeWidth={9} transform="translate(-1.5 -2)" />
    </g>
  );
  // el corazón pintado en la cara que mira a la cámara
  const nCara = menos3(VISTA, por3(eje, dot(VISTA, eje)));
  const verCara = Math.hypot(...nCara) > 0.3;
  const nc = uni(nCara);
  const deco = verCara && (
    <g key="deco" transform={planoDe(mas(mas(c3, nc, R * 0.99), eje, -4), uni(cruz(nc, eje)), por3(eje, -1))}>
      <path d={corazon(36)} transform="translate(0 4)" fill={COL.coral} />
    </g>
  );
  const verBoca = dot(eje, VISTA) > 0;
  const borde = circulo3(arriba, por3(e1, R - 6), por3(e2, R - 6), 40).map(pr);
  const sup = circulo3(mas(arriba, eje, -14 - (1 - nivel) * 70), por3(e1, R - 8), por3(e2, R - 8), 40).map(pr);
  const clip = cx.id('boca');
  cx.defs.push(<clipPath key={clip} id={clip}><path d={ruta(borde)} /></clipPath>);
  return (
    <g>
      {!asaDelante && elAsa}
      <path d={ruta(lado)} fill={`url(#${gid})`} />
      {deco}
      {verBoca ? (
        <g>
          <path d={ruta(boca)} fill={mezcla(TAZA.arriba, '#FFFFFF', 0.45)} />
          <path d={ruta(borde)} fill={mezcla(TAZA.der, '#FFFFFF', 0.25)} />
          {nivel > 0.02 && (
            <g clipPath={`url(#${clip})`}>
              <path d={ruta(sup)} fill={COL.cafe} />
              <path d={ruta(sup)} fill="none" stroke={COL.cafeLuz} strokeWidth={4} opacity={0.7} />
            </g>
          )}
        </g>
      ) : (
        <path d={ruta(culo)} fill={TAZA.der} />
      )}
      {asaDelante && elAsa}
    </g>
  );
};

// ---------------------------------------------------------------- los trozos: prismas de loza, como piezas de maqueta
const RUMBO = [104, 8, 142, 40, 76, 124].map((g) => (g * Math.PI) / 180); // a dónde sale cada uno, en el suelo (0 = +a, 90 = +l)
const trozo3 = (key: React.Key, pts: P[], c: P, ang: number, i: number, quieto: number) => {
  const forma = pts.map((q) => rot([(q[0] - c[0]) * 1.35, (q[1] - c[1]) * 1.35], -ang));
  const dx = Math.abs(c[0] - IMPACTO[0]) * 1.6 + 30;
  const th = RUMBO[i];
  const h: V3 = [Math.cos(th), Math.sin(th), 0];
  const hp: V3 = [-Math.sin(th), Math.cos(th), 0];
  const tumba = E.inOutCubic(clamp(quieto));
  const ev = uni(mix3([0, 0, 1], hp, tumba));
  const nP = uni(cruz(h, ev));
  let C: V3 = [IMP[0] + h[0] * dx, h[1] * dx, SUELO - c[1]];
  const G = 9;
  const en = (q: P, s: number): V3 => {
    const r = rot(q, ang);
    return mas(mas(mas(C, h, r[0]), ev, -r[1]), nP, s * G);
  };
  let fr = forma.map((q) => en(q, 1)), at = forma.map((q) => en(q, -1));
  const zmin = Math.min(...fr.map((q) => q[2]), ...at.map((q) => q[2]));
  if (zmin < 0) {
    C = mas(C, [0, 0, -zmin]);
    fr = forma.map((q) => en(q, 1));
    at = forma.map((q) => en(q, -1));
  }
  // el sentido de la forma, para saber hacia fuera de cada canto
  let area = 0;
  forma.forEach((q, j) => {
    const b = forma[(j + 1) % forma.length];
    area += q[0] * b[1] - b[0] * q[1];
  });
  const caras3: {pts: V3[]; n: V3; t: Tri}[] = [];
  forma.forEach((_, j) => {
    const k = (j + 1) % forma.length;
    const borde = menos3(fr[k], fr[j]);
    let nn = uni(cruz(borde, nP));
    if (area > 0) nn = por3(nn, -1);
    caras3.push({pts: [fr[j], fr[k], at[k], at[j]], n: nn, t: LOZA});
  });
  const vis = caras3.filter((cc) => dot(cc.n, VISTA) > 0).sort((x, y) => hondo(x.pts[0]) - hondo(y.pts[0]));
  const tapa = dot(nP, VISTA) > 0 ? {pts: fr, n: nP} : {pts: at, n: por3(nP, -1)};
  return {
    prof: hondo(C),
    base: C,
    el: (
      <g key={key}>
        {vis.map((cc, j) => <path key={j} d={ruta3(cc.pts)} fill={tonoN(cc.n, cc.t)} stroke={tonoN(cc.n, cc.t)} strokeWidth={0.8} strokeLinejoin="round" />)}
        <path d={ruta3(tapa.pts)} fill={tonoN(tapa.n, TAZA)} stroke={tonoN(tapa.n, TAZA)} strokeWidth={0.8} strokeLinejoin="round" />
      </g>
    ),
  };
};

// ---------------------------------------------------------------- la cocina
const ventana = (a0: number, a1: number, z0: number, z1: number) => {
  const hond = 34;
  const w = a1 - a0, h = z1 - z0;
  const jamba = ruta3([[a0, LP, z0], [a0, LP, z1], [a0, LP - hond, z1], [a0, LP - hond, z0]]);
  const alfeizar = ruta3([[a0, LP, z0], [a1, LP, z0], [a1, LP - hond, z0], [a0, LP - hond, z0]]);
  return (
    <g key="ventana">
      <g transform={plano.pared([a0, LP - hond, z1])}>
        <rect x={0} y={0} width={w} height={h} fill="url(#isog-cielo)" />
        <circle cx={w * 0.74} cy={h * 0.3} r={46} fill="#FFE7A3" />
        <ellipse cx={w * 0.26} cy={h * 0.2} rx={70} ry={22} fill="#FFFFFF" opacity={0.92} />
        <ellipse cx={w * 0.32} cy={h * 0.17} rx={42} ry={24} fill="#FFFFFF" opacity={0.92} />
        <ellipse cx={w * 0.8} cy={h * 0.5} rx={54} ry={16} fill="#FFFFFF" opacity={0.85} />
        <path d={`M 0 ${h * 0.78} Q ${w * 0.3} ${h * 0.6} ${w * 0.62} ${h * 0.74} T ${w} ${h * 0.7} V ${h} H 0 Z`} fill="#A9E2CB" />
        <path d={`M 0 ${h * 0.88} Q ${w * 0.4} ${h * 0.74} ${w} ${h * 0.86} V ${h} H 0 Z`} fill="#86D3B5" />
      </g>
      <path d={jamba} fill={mezcla(COL.pared, '#3B2F6E', 0.12)} />
      <path d={alfeizar} fill={mezcla(COL.pared, '#FFFFFF', 0.4)} />
      <g transform={plano.pared([a0, LP + 2, z1])}>
        <path d={`M -16 -16 H ${w + 16} V ${h + 16} H -16 Z M 6 6 V ${h - 6} H ${w - 6} V 6 Z`} fillRule="evenodd" fill="#FBFAFF" />
        <rect x={w / 2 - 8} y={6} width={16} height={h - 12} fill="#FBFAFF" />
        <rect x={6} y={h * 0.46 - 8} width={w - 12} height={16} fill="#FBFAFF" />
      </g>
      {/* las cortinas, de cuadros coral, recogidas a los lados */}
      {[0, 1].map((k) => (
        <g key={k} transform={plano.pared([k ? a1 - 70 : a0 - 30, LP + 6, z1 + 30])}>
          <path d={`M 0 0 H 100 C 92 ${h * 0.35} 60 ${h * 0.55} ${k ? 84 : 16} ${h * 0.62} C ${k ? 70 : 30} ${h * 0.8} ${k ? 96 : 4} ${h * 0.95} ${k ? 100 : 0} ${h + 40} H ${k ? 30 : 70} C ${k ? 30 : 70} ${h * 0.8} ${k ? 0 : 100} ${h * 0.6} 0 0 Z`}
            fill="url(#isog-cuadros)" />
        </g>
      ))}
      {caja('repisa', [a0 - 30, LP, z0 - 22], [w + 60, 50, 22], tri('#F3F0FB', 0.6, 0.12))}
      {caja('barra', [a0 - 50, LP, z1 + 26], [w + 100, 20, 12], SOPORTE)}
    </g>
  );
};

const estante = (cx: Ctx, a0: number, z: number) => {
  const botes: [number, number, number, string][] = [[40, 30, 92, COL.coral], [104, 26, 76, COL.amarillo], [160, 28, 100, COL.lila]];
  return (
    <g key="estante">
      {caja('tabla', [a0, LP, z], [260, 110, 16], MADERA)}
      {botes.map(([da, r, h, c], i) => (
        <g key={i}>
          {cilindro(cx, 'b', [a0 + da, LP + 56], z + 16, z + 16 + h, r, r, tri(c, 0.4, 0.2), 24)}
          {cilindro(cx, 't', [a0 + da, LP + 56], z + 16 + h, z + 28 + h, r * 0.86, r * 0.86, tri('#FFF7EE', 0.5, 0.14), 24)}
        </g>
      ))}
      {cilindro(cx, 'maceta', [a0 + 222, LP + 56], z + 16, z + 64, 22, 26, MACETA, 20)}
      {bola(cx, 'hoja', {c: [a0 + 218, LP + 56, z + 96], u: [34, 0, 0], v: [0, 34, 0], w: [0, 0, 34]}, tri('#7FD5B3', 0.45, 0.25))}
      {bola(cx, 'hoja2', {c: [a0 + 238, LP + 70, z + 78], u: [22, 0, 0], v: [0, 22, 0], w: [0, 0, 22]}, tri('#7FD5B3', 0.45, 0.25))}
    </g>
  );
};

// la nevera, contra la pared de la izquierda: dos puertas, sus asas y los imanes (y el dibujo de un pez)
const NV = {a: AP, l: -360, d: [250, 330, 1360] as V3};
const nevera = () => {
  const {a, l, d} = NV;
  return (
    <g key="nevera">
      {caja('cuerpo', [a, l, 0], d, NEVERA)}
      <g transform={plano.frente([a + d[0], l + d[1], d[2]])}>
        <rect x={6} y={436} width={d[1] - 12} height={8} rx={4} fill={mezcla(NEVERA.izq, '#3B2F6E', 0.22)} />
        <rect x={d[1] - 40} y={330} width={16} height={86} rx={8} fill="#F7F5FF" />
        <rect x={d[1] - 40} y={470} width={16} height={360} rx={8} fill="#F7F5FF" />
        <g transform="translate(140 930) rotate(-6)">
          <rect x={4} y={6} width={130} height={104} rx={6} fill="#3B2F6E" opacity={0.12} />
          <rect x={0} y={0} width={130} height={104} rx={6} fill="#FFFFFF" />
          <path d="M 28 52 C 44 28 82 28 96 52 C 82 76 44 76 28 52 Z M 96 52 L 116 36 L 116 68 Z" fill={COL.lila} />
          <circle cx={48} cy={48} r={5} fill="#FFFFFF" />
          <circle cx={65} cy={6} r={8} fill={COL.rojo} />
        </g>
      </g>
    </g>
  );
};

// el taburete, delante a la izquierda
const TB = {a: -260, l: 345, z: 420};
const taburete = (cx: Ctx) => {
  const patas = [45, 135, 225, 315].map((g) => (g * Math.PI) / 180);
  return (
    <g key="taburete">
      {patas.filter((g) => Math.sin(g) + Math.cos(g) < 0).map((g, i) => tubo(cx, 'pa' + i, [TB.a + Math.cos(g) * 50, TB.l + Math.sin(g) * 50, TB.z - 10], [TB.a + Math.cos(g) * 78, TB.l + Math.sin(g) * 78, 0], 8, 7, SOPORTE))}
      {cilindro(cx, 'aro', [TB.a, TB.l], 150, 166, 66, 66, SOPORTE, 32)}
      {patas.filter((g) => Math.sin(g) + Math.cos(g) >= 0).map((g, i) => tubo(cx, 'pb' + i, [TB.a + Math.cos(g) * 50, TB.l + Math.sin(g) * 50, TB.z - 10], [TB.a + Math.cos(g) * 78, TB.l + Math.sin(g) * 78, 0], 8, 7, SOPORTE))}
      {cilindro(cx, 'asiento', [TB.a, TB.l], TB.z - 34, TB.z, 92, 92, ASIENTO, 40)}
    </g>
  );
};

// la planta grande, en el rincón de la ventana
const PL = {a: -40, l: -520};
const HOJAS: [number, number, number, number][] = [
  [0, 0, 300, 84], [-58, 26, 330, 66], [54, -30, 344, 70], [-24, -48, 392, 64], [38, 42, 386, 62], [0, 0, 432, 78], [-44, 12, 474, 58],
  [34, -12, 484, 60], [2, 4, 530, 52],
];
const planta = (cx: Ctx) => {
  const hojas = [...HOJAS].sort((h1, h2) => h1[0] + h1[1] + h1[2] - (h2[0] + h2[1] + h2[2]));
  return (
    <g key="planta">
      {cilindro(cx, 'maceta', [PL.a, PL.l], 0, 200, 54, 70, MACETA)}
      {cilindro(cx, 'borde', [PL.a, PL.l], 184, 210, 76, 76, tri('#F29F83', 0.35, 0.16))}
      <path d={ruta3(circulo3([PL.a, PL.l, 210], [62, 0, 0], [0, 62, 0], 24))} fill="#8C6A5E" />
      {hojas.map(([da, dl, z, r], i) => bola(cx, i, {c: [PL.a + da, PL.l + dl, z], u: [r, 0, 0], v: [0, r, 0], w: [0, 0, r]}, tri('#7FD5B3', 0.45, 0.25)))}
    </g>
  );
};

// el frutero, en la esquina vacía de la mesa
const FR = {a: -350, l: 120};
const FRUTAS: [number, number, number, number, string][] = [[-20, -14, 40, 30, COL.amarillo], [24, -6, 42, 32, '#9BDB7E'], [0, 22, 38, 29, COL.amarillo], [6, 2, 70, 30, '#B7A6F2']];
const frutero = (cx: Ctx) => (
  <g key="frutero">
    {cilindro(cx, 'cuenco', [FR.a, FR.l], TOP, TOP + 46, 50, 74, MACETA, 36)}
    <path d={ruta3(circulo3([FR.a, FR.l, TOP + 46], [62, 0, 0], [0, 62, 0], 32))} fill={mezcla(COL.coral, '#3B2F6E', 0.25)} />
    {FRUTAS.map(([da, dl, z, r, c], i) => bola(cx, i, {c: [FR.a + da, FR.l + dl, TOP + z], u: [r, 0, 0], v: [0, r, 0], w: [0, 0, r]}, tri(c, 0.45, 0.22)))}
  </g>
);

// el comedero, vacío: el motivo
const CO = {a: 40, l: 330};
const comedero = (cx: Ctx) => (
  <g key="comedero">
    {cilindro(cx, 'c', [CO.a, CO.l], 0, 46, 74, 86, tri(COL.lila, 0.42, 0.22), 36)}
    <path d={ruta3(circulo3([CO.a, CO.l, 46], [64, 0, 0], [0, 64, 0], 32))} fill={mezcla(COL.lila, '#3B2F6E', 0.35)} />
    <path d={ruta3(circulo3([CO.a, CO.l, 40], [52, 0, 0], [0, 52, 0], 32))} fill={mezcla(COL.lila, '#FFFFFF', 0.55)} />
    <g transform={plano.suelo([CO.a - 30, CO.l - 30, 41])}>
      <path d="M 10 30 L 50 30 M 22 22 L 22 38 M 32 22 L 32 38 M 42 22 L 42 38 M 50 30 L 58 24 M 50 30 L 58 36" stroke={mezcla(COL.lila, '#3B2F6E', 0.3)} strokeWidth={4} strokeLinecap="round" fill="none" />
    </g>
  </g>
);

// ---------------------------------------------------------------- lo que flota
type Tipo = 'taza' | 'corazon' | 'reloj';
const ICONO: Record<Tipo, {color: string; dibujo: React.ReactNode}> = {
  taza: {color: COL.coral, dibujo: (
    <g>
      <path d="M -30 -14 H 6 V 12 Q 6 24 -6 24 H -18 Q -30 24 -30 12 Z" fill="#FFFFFF" />
      <path d="M 6 -8 Q 18 -8 18 2 Q 18 12 6 12" fill="none" stroke="#FFFFFF" strokeWidth={6} />
      <rect x={24} y={-24} width={10} height={32} rx={5} fill="#FFFFFF" />
      <circle cx={29} cy={19} r={6} fill="#FFFFFF" />
    </g>
  )},
  corazon: {color: COL.rosa, dibujo: <path d={corazon(50)} transform="translate(0 6)" fill="#FFFFFF" />},
  reloj: {color: COL.amarillo, dibujo: (
    <g>
      <circle cx={0} cy={2} r={26} fill="none" stroke="#FFFFFF" strokeWidth={6} />
      <line x1={0} y1={2} x2={0} y2={-12} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" />
      <line x1={0} y1={2} x2={11} y2={9} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" />
    </g>
  )},
};
const Tarjeta: React.FC<{x: number; y: number; color: string; tam?: number; giro?: number; alfa?: number; children: React.ReactNode}> = ({
  x, y, color, tam = 1, giro = 0, alfa = 1, children,
}) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${giro.toFixed(2)}) scale(${tam.toFixed(3)})`} opacity={alfa}>
    <rect x={-50} y={-42} width={100} height={100} rx={24} fill={mezcla(color, '#3B2F6E', 0.28)} />
    <rect x={-50} y={-50} width={100} height={100} rx={24} fill={color} />
    <path d="M -50 -6 V -26 A 24 24 0 0 1 -26 -50 H 26 A 24 24 0 0 1 50 -26 V -6 Z" fill="#FFFFFF" opacity={0.13} />
    {children}
  </g>
);
const TARJETAS: {q: V3; tipo: Tipo; fase: number}[] = [
  {q: [-640, -230, 590], tipo: 'corazon', fase: 0.1},
  {q: [-163, -560, 700], tipo: 'reloj', fase: 0.55},
  {q: [-363, -600, 767], tipo: 'taza', fase: 0.3},
];

// ---------------------------------------------------------------- todo junto
export const Isometrico: React.FC<{t: number}> = ({t: tt}) => {
  const t = clamp(tt, 0, DUR);
  const clave = Math.round(t * 600);
  let n = 0;
  const cx: Ctx = {defs: [], id: (s) => `isog-${s}-${clave}-${n++}`};

  // la cámara: se acerca despacio mientras trama y baja un poco con la taza; tiembla al romperse
  const Z = 1.17 + 0.07 * E.inOutCubic(p(t, 0.1, 2.6)) - 0.03 * E.inOutCubic(p(t, 3.4, 1.4));
  const CC: P = [452, 1040 + 34 * E.inOutCubic(p(t, 2.72, 0.55)) - 20 * E.inOutCubic(p(t, 3.6, 1.2))];
  const [tbx, tby] = temblor(t, T_SUELO, 0.38, 13, 4);
  const camara = `translate(${f1(540 + tbx)} ${f1(960 + tby)}) scale(${Z.toFixed(4)}) translate(${f1(-CC[0])} ${f1(-CC[1])})`;
  const cam = (q: P): P => [540 + tbx + (q[0] - CC[0]) * Z, 960 + tby + (q[1] - CC[1]) * Z];

  // la escena
  const g = gato(t);
  const tz = taza(t);
  const tz3 = W3(tz.c);
  const objetivo: V3 = t < T_SUELO ? mas(tz3, [0, 0, 20]) : [IMP[0] + 40, 60, 20];
  const yo = gato3(cx, g, t, objetivo);
  const cf = cafe(t);
  const tr = trozos(t);
  const vp = vapor(t);

  // la taza: unos meneos al darle los toquecitos (vuelve a quedarse quieta antes de caer)
  const meneo = [1.43, 1.81].reduce((s, t0) => s + (t > t0 ? 0.075 * Math.exp(-(t - t0) * 9) * Math.sin((t - t0) * 34) : 0), 0);
  const angTaza = tz.estado === 'mesa' ? meneo : tz.ang;
  const nivel = tz.estado === 'mesa' ? 1 : 1 - E.outCubic(p(t, T_CAE + 0.04, 0.22));
  const alto = Math.max(0, tz3[2] - 59);
  const sobreMesa = tz3[0] < M.a1 + 10;

  // los trozos
  const piezas = tr.map((q, i) => trozo3(q.n, q.pts, q.c, q.ang, i, q.quieto));

  // el café: el chorro sigue el plano del perfil; la corona y las manchas se abren en el suelo
  const giros = (() => {
    const r = rng(19);
    return Array.from({length: 140}, () => (r() - 0.5) * 2.6);
  })();
  // (sin saltos: el chorro va en el plano del perfil hasta pasar el punto del golpe y desde ahí se abre hacia la cámara)
  const aMundo = (c: P, i: number, zz?: number): V3 => {
    const dx = c[0] - IMPACTO[0];
    const z = zz ?? SUELO - c[1];
    const jit = (giros[i] ?? 0) * 12;
    if (i < 100) {
      if (dx <= 0) return [c[0] - XA, jit, z];
      const ph = 0.85 + (giros[i] ?? 0) * 0.5;
      return [IMP[0] + dx * 0.6 * Math.cos(ph), jit + dx * 0.6 * Math.sin(ph), z];
    }
    const ph = 0.8 + (giros[i] ?? 0) * 0.9;
    return [IMP[0] + Math.abs(dx) * Math.cos(ph), Math.abs(dx) * Math.sin(ph), z];
  };

  // la ruta marcada antes de caer, y el blanco en el suelo
  const ruta: V3[] = [];
  for (let s = T_CAE; s <= T_SUELO + 1e-6; s += 0.4 / 30) ruta.push(mas(W3(taza(s).c), [0, 0, -40]));
  ruta.push([IMP[0], 0, 4]);
  const kRuta = E.inOutCubic(p(t, 2.3, 0.34));
  const fueraRuta = 1 - p(t, T_SUELO + 0.15, 0.3);
  const kBlanco = E.outBack(p(t, 2.42, 0.3)) * (1 - p(t, T_SUELO, 0.08));
  const onda = p(t, T_SUELO, 0.75);

  // el bocadillo «!» y el chispazo
  const kBoca = E.outBack(clamp((t - T_SUELO - 0.02) / 0.18)) * (1 - E.inCubic(clamp((t - 4.5) / 0.3)));
  const latido = 1 + 0.07 * Math.sin(p(t, T_SUELO, 0.6) * Math.PI * 2);

  // la etiqueta que le sigue
  const estado = t < 0.62 ? 'GATO · 4,2 kg' : t < T_SUELO + 0.22 ? 'TRAMANDO' : 'INOCENTE';
  const colEstado = t < 0.62 ? COL.lila : t < T_SUELO + 0.22 ? COL.rojo : COL.menta;
  const cambio = Math.max(pulso(t, 0.62, 0.06, 0.14), pulso(t, T_SUELO + 0.22, 0.06, 0.14));
  const techo = cam(yo.techo);
  const anchoEt = estado.length * 25 + 98;
  const et: P = [Math.max(60 + anchoEt / 2, techo[0] - 190), techo[1] - 40];

  // las sombras del suelo
  const sombrasSuelo = [
    sombraCaja('mesa', [M.a0, -M.l, TOP - M.g], [M.a1 - M.a0, 2 * M.l, M.g]),
    ...[[M.a0 + 20, -M.l + 20], [M.a1 - 54, -M.l + 20], [M.a0 + 20, M.l - 54], [M.a1 - 54, M.l - 54]].map(([a, l], i) =>
      sombraCaja('pm' + i, [a, l, 0], [M.pata, M.pata, TOP - M.g])),
    sombraCaja('nevera', [NV.a, NV.l, 0], NV.d),
    sombraCaja('taburete', [TB.a - 92, TB.l - 92, 0], [184, 184, TB.z]),
    sombraCaja('planta', [PL.a - 70, PL.l - 70, 0], [140, 140, 520]),
    sombraCaja('comedero', [CO.a - 86, CO.l - 86, 0], [172, 172, 46]),
  ];

  const baldosa = 180;
  const suelo = ruta3([[AP, LP, 0], [AB, LP, 0], [AB, LB, 0], [AP, LB, 0]]);

  // lo que va en el suelo delante de la mesa: los trozos, de atrás adelante
  const enSuelo = [...piezas].sort((x, y) => x.prof - y.prof);

  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="isog-fondo" x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={COL.cielo} />
          <stop offset={0.55} stopColor="#F4EEF9" />
          <stop offset={1} stopColor={COL.tierra} />
        </linearGradient>
        <linearGradient id="isog-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#C8E0FA" />
          <stop offset={1} stopColor="#F3EAFB" />
        </linearGradient>
        <pattern id="isog-cuadros" patternUnits="userSpaceOnUse" width={28} height={28}>
          <rect width={28} height={28} fill="#FBD3C8" />
          <rect width={14} height={28} fill={COL.coral} opacity={0.55} />
          <rect width={28} height={14} fill={COL.coral} opacity={0.55} />
        </pattern>
        <pattern id={`isog-baldosas-${clave}`} patternUnits="userSpaceOnUse" width={2 * baldosa} height={2 * baldosa} patternTransform={plano.suelo([AP, LP, 0])}>
          <rect width={2 * baldosa} height={2 * baldosa} fill={COL.suelo} />
          <rect x={0} y={0} width={baldosa} height={baldosa} fill={COL.suelo2} />
          <rect x={baldosa} y={baldosa} width={baldosa} height={baldosa} fill={COL.suelo2} />
          <path d={`M 0 0 H ${2 * baldosa} M 0 ${baldosa} H ${2 * baldosa} M 0 0 V ${2 * baldosa} M ${baldosa} 0 V ${2 * baldosa}`} stroke={COL.junta} strokeWidth={3} />
        </pattern>
        <clipPath id={`isog-suelo-${clave}`}><path d={suelo} /></clipPath>
        <clipPath id={`isog-mesa-${clave}`}><path d={caras([M.a0, -M.l, TOP - M.g], [M.a1 - M.a0, 2 * M.l, M.g]).arriba} /></clipPath>
        <filter id="isog-difusa" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={10} /></filter>
        <filter id="isog-difusa2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={6} /></filter>
        <filter id="isog-flota" x="-40%" y="-40%" width="180%" height="200%">
          <feDropShadow dx={0} dy={16} stdDeviation={10} floodColor={COL.sombra} floodOpacity={0.22} />
        </filter>
        <filter id="isog-vaho" x="-50%" y="-30%" width="200%" height="160%">
          <feDropShadow dx={0} dy={4} stdDeviation={5} floodColor={COL.sombra} floodOpacity={0.3} />
        </filter>
        {cx.defs}
      </defs>

      <rect width={1080} height={1920} fill="url(#isog-fondo)" />

      <g transform={camara}>
        {/* las paredes: la del fondo (ventana) y la de la izquierda (nevera), con su zócalo */}
        <path d={ruta3([[AP, LP, 0], [AB, LP, 0], [AB, LP, ALTO], [AP, LP, ALTO]])} fill={COL.pared} />
        <path d={ruta3([[AP, LP, 0], [AP, LB, 0], [AP, LB, ALTO], [AP, LP, ALTO]])} fill={COL.paredIzq} />
        <path d={ruta3([[AP, LP, 0], [AB, LP, 0], [AB, LP, 380], [AP, LP, 380]])} fill={mezcla(COL.pared, '#3B2F6E', 0.05)} />
        <path d={ruta3([[AP, LP, 0], [AP, LB, 0], [AP, LB, 380], [AP, LP, 380]])} fill={mezcla(COL.paredIzq, '#3B2F6E', 0.05)} />
        {caja('moldura', [AP, LP, 376], [AB - AP, 12, 12], tri('#E9E4F8', 0.6, 0.1))}
        {caja('moldura2', [AP, LP, 376], [12, LB - LP, 12], tri('#E9E4F8', 0.6, 0.1))}
        {caja('zocalo', [AP, LP, 0], [AB - AP, 10, 44], tri(COL.zocalo, 0.4, 0.1))}
        {caja('zocalo2', [AP, LP, 0], [10, LB - LP, 44], tri(COL.zocalo, 0.4, 0.1))}
        {ventana(-760, -340, 560, 1080)}
        {estante(cx, -260, 860)}

        {/* el suelo de cuadros, y el canto coral de la maqueta */}
        <path d={suelo} fill={`url(#isog-baldosas-${clave})`} />
        <path d={ruta3([[AP, LB, 0], [AB, LB, 0], [AB, LB, -72], [AP, LB, -72]])} fill={COL.borde} />
        <path d={ruta3([[AB, LP, 0], [AB, LB, 0], [AB, LB, -72], [AB, LP, -72]])} fill={mezcla(COL.borde, '#3B2F6E', 0.16)} />
        <path d={ruta3([[AP, LB, 0], [AB, LB, 0], [AB, LP, 0]], false)} fill="none" stroke="#F8B7A6" strokeWidth={3} />

        {/* las sombras en el suelo */}
        <g clipPath={`url(#isog-suelo-${clave})`}>
          <g filter="url(#isog-difusa)" fill={COL.sombra} stroke={COL.sombra} opacity={0.15}>{sombrasSuelo}</g>
          {/* la de los trozos */}
          <g filter="url(#isog-difusa2)" fill={COL.sombra} opacity={0.22}>
            {piezas.map((pz, i) => <path key={i} d={ruta3(circulo3([pz.base[0], pz.base[1], 0], [30, 0, 0], [0, 30, 0], 16))} />)}
          </g>
        </g>

        {/* el café en el suelo: el charco y las manchas */}
        {cf.charco && (() => {
          const r0 = cf.charco.rx * 0.72;
          const pts: V3[] = Array.from({length: 28}, (_, i) => {
            const a = (i / 28) * Math.PI * 2;
            const k = 1 + 0.16 * Math.sin(3 * a + 1) + 0.09 * Math.sin(5 * a + 2);
            return [IMP[0] + Math.cos(a) * r0 * k, Math.sin(a) * r0 * k * 0.9, 0.5];
          });
          const d = curva(pts.map(pr), true);
          return (
            <g>
              <path d={d} fill={COL.cafe} />
              <path d={d} fill="none" stroke={COL.cafeLuz} strokeWidth={4} opacity={0.6} transform="translate(-2 -2)" />
            </g>
          );
        })()}
        {cf.manchas.map((s) => {
          const c = aMundo(s.c, s.i, 0.6);
          return <path key={s.i} d={ruta3(circulo3(c, [s.rx * 0.9, 0, 0], [0, s.rx * 0.8, 0], 14))} fill={COL.cafe} />;
        })}

        {/* el blanco, marcado antes de que caiga, y la onda al romperse */}
        {kBlanco > 0.01 && (
          <g>
            <path d={ruta3(circulo3(PUNTO_IMP, [86 * kBlanco, 0, 0], [0, 86 * kBlanco, 0], 48))} fill={COL.coral} fillOpacity={0.12} stroke={COL.coral} strokeWidth={5} strokeDasharray="14 10" />
            <path d={ruta3([mas(PUNTO_IMP, [-34 * kBlanco, 0, 0]), mas(PUNTO_IMP, [34 * kBlanco, 0, 0])], false)} stroke={COL.coral} strokeWidth={6} strokeLinecap="round" />
            <path d={ruta3([mas(PUNTO_IMP, [0, -34 * kBlanco, 0]), mas(PUNTO_IMP, [0, 34 * kBlanco, 0])], false)} stroke={COL.coral} strokeWidth={6} strokeLinecap="round" />
          </g>
        )}
        {onda > 0 && onda < 1 && [0, 0.18].map((dk, i) => {
          const k = clamp((onda - dk) / (1 - dk));
          if (k <= 0) return null;
          const r = 60 + 420 * E.outCubic(k);
          return <path key={i} d={ruta3(circulo3(PUNTO_IMP, [r, 0, 0], [0, r, 0], 64))} fill="none" stroke={COL.rosa} strokeWidth={11 * (1 - k) + 1} opacity={1 - k} />;
        })}

        {/* la nevera y la planta, al fondo */}
        {nevera()}
        {planta(cx)}

        {/* la mesa: las patas, el faldón y el tablero */}
        {[[M.a0 + 20, -M.l + 20], [M.a0 + 20, M.l - 54], [M.a1 - 54, -M.l + 20], [M.a1 - 54, M.l - 54]].map(([a, l], i) =>
          caja('pm' + i, [a, l, 0], [M.pata, M.pata, TOP - M.g], MADERA))}
        {caja('faldon', [M.a0 + 26, -M.l + 26, TOP - M.g - 56], [M.a1 - M.a0 - 52, 2 * M.l - 52, 56], MESA)}
        {caja('tablero', [M.a0, -M.l, TOP - M.g], [M.a1 - M.a0, 2 * M.l, M.g], MESA)}
        {frutero(cx)}
        {/* el salvamanteles, donde estaba la taza, y la sombra del gato y de la taza sobre la mesa */}
        <g transform={plano.suelo([-28, -78, TOP + 0.5])}>
          <rect x={0} y={0} width={150} height={156} rx={20} fill={COL.coral} opacity={0.85} />
          <rect x={14} y={14} width={122} height={128} rx={12} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeDasharray="10 8" opacity={0.8} />
        </g>
        <g clipPath={`url(#isog-mesa-${clave})`}>
          <g filter="url(#isog-difusa)" fill={COL.sombra} opacity={0.2}>
            {yo.sombras.map((e, i) => {
              const c: V3 = [e.c[0] + (e.c[2] - TOP) * 0.3, e.c[1] - (e.c[2] - TOP) * 0.16, TOP];
              const rr = Math.max(Math.hypot(...e.u), Math.hypot(...e.v)) * 0.75;
              return <path key={i} d={ruta3(circulo3(c, [rr, 0, 0], [0, Math.hypot(...e.w), 0], 24))} />;
            })}
            {sobreMesa && tz.estado !== 'suelo' && <path d={ruta3(circulo3([tz3[0] + 16, -8, TOP], [56, 0, 0], [0, 56, 0], 24))} />}
          </g>
        </g>

        {/* la sombra de la taza en el suelo: crece y se oscurece al acercarse */}
        {!sobreMesa && tz.estado !== 'suelo' && (() => {
          const k = 1 - clamp(alto / 560);
          return (
            <path d={ruta3(circulo3([tz3[0], 0, 0.5], [60 * mix(0.35, 1.05, k), 0, 0], [0, 60 * mix(0.35, 1.05, k), 0], 32))}
              fill={COL.sombra} opacity={mix(0.08, 0.38, k * k)} filter="url(#isog-difusa2)" />
          );
        })()}

        {/* el gato y la taza */}
        {yo.antes}
        {tz.estado !== 'suelo' && dibujaTaza(cx, tz3, angTaza, nivel)}
        {yo.despues}

        {/* la ruta prevista: la línea va delante de la taza */}
        {kRuta > 0 && fueraRuta > 0 && (() => {
          const nn = Math.max(2, Math.ceil(ruta.length * kRuta));
          return (
            <path d={ruta3(ruta.slice(0, nn), false)} fill="none" stroke={COL.coral} strokeWidth={5} strokeDasharray="4 13" strokeLinecap="round" opacity={0.95 * fueraRuta} />
          );
        })()}

        {/* el vapor */}
        <g filter="url(#isog-vaho)" fill="none" stroke="#FFFFFF" strokeLinecap="round">
          {vp.map((h, i) => (
            <path key={i} d={curva(h.pts.map((q) => pr(W3(q))))} strokeWidth={13} opacity={h.alfa * 0.8} />
          ))}
        </g>

        {/* el café en el aire: el chorro, de una pieza, y las gotas */}
        {(() => {
          const chorro = cf.gotas.filter((d) => d.i < 100).map((d) => ({q: pr(aMundo(d.c, d.i)), r: d.r}));
          const tramos: P[][] = [];
          chorro.forEach((d, i) => {
            if (i === 0 || Math.hypot(d.q[0] - chorro[i - 1].q[0], d.q[1] - chorro[i - 1].q[1]) > 60) tramos.push([]);
            tramos[tramos.length - 1].push(d.q);
          });
          return tramos.filter((q) => q.length > 1).map((q, i) => (
            <path key={'ch' + i} d={curva(q)} fill="none" stroke={COL.cafe} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" />
          ));
        })()}
        {cf.gotas.map((d) => {
          const q = pr(aMundo(d.c, d.i));
          return (
            <g key={d.i}>
              <circle cx={q[0]} cy={q[1]} r={d.r * K3 * 0.8} fill={COL.cafe} />
              <circle cx={q[0] - d.r * 0.25} cy={q[1] - d.r * 0.25} r={d.r * K3 * 0.25} fill={COL.cafeLuz} />
            </g>
          );
        })}

        {/* el chispazo del golpe */}
        {t >= T_SUELO && t < T_SUELO + 0.32 && (() => {
          const k = E.outCubic(p(t, T_SUELO, 0.32));
          return (
            <g stroke={COL.coral} strokeWidth={12 * (1 - k) + 3} strokeLinecap="round" opacity={1 - k * k}>
              {k < 0.5 && <path d={ruta3(circulo3(mas(PUNTO_IMP, [0, 0, 30]), [70 + 120 * k, 0, 0], [0, 70 + 120 * k, 0], 40))} fill="#FFFFFF" stroke="none" opacity={0.9 * (1 - 2 * k)} />}
              {Array.from({length: 10}, (_, i) => {
                const a = (i / 10) * Math.PI * 2 + 0.3;
                const d: V3 = [Math.cos(a), Math.sin(a), 0.55];
                const A = pr(mas(PUNTO_IMP, d, 70 + 110 * k)), B = pr(mas(PUNTO_IMP, d, 120 + 190 * k));
                return <line key={i} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} />;
              })}
            </g>
          );
        })()}

        {/* los trozos, el taburete y el comedero */}
        {enSuelo.map((pz) => pz.el)}
        {taburete(cx)}
        {comedero(cx)}
      </g>

      {/* las tarjetitas que flotan */}
      <g filter="url(#isog-flota)">
        {TARJETAS.map((tj, i) => {
          const [x, y] = cam(pr(mas(tj.q, [0, 0, 16 * Math.sin(2 * Math.PI * (t / 2 + tj.fase))])));
          // la de la taza tiembla cuando la taza se va
          const susto = tj.tipo === 'taza' ? pulso(t, T_CAE, 0.05, 0.5) : 0;
          const giro = susto * 14 * Math.sin(t * 60);
          return <Tarjeta key={i} x={x} y={y} color={ICONO[tj.tipo].color} tam={1.05 + 0.12 * susto} giro={giro}>{ICONO[tj.tipo].dibujo}</Tarjeta>;
        })}
      </g>

      {/* el bocadillo rojo «!» al romperse */}
      {kBoca > 0.01 && (() => {
        const [bx, by] = cam(pr(mas(PUNTO_IMP, [0, 0, 380])));
        return (
          <g transform={`translate(${f1(bx + 30)} ${f1(by - 20)}) scale(${(kBoca * latido).toFixed(3)}) rotate(6)`} filter="url(#isog-flota)">
            <path d="M -34 40 L -78 104 L 4 46 Z" fill={COL.rojo} />
            <rect x={-62} y={-62} width={124} height={118} rx={40} fill={COL.rojo} />
            <rect x={-10} y={-40} width={20} height={56} rx={10} fill="#FFFFFF" />
            <circle cx={0} cy={34} r={11} fill="#FFFFFF" />
          </g>
        );
      })()}

      {/* la etiqueta que le sigue */}
      <g transform={`translate(${f1(et[0])} ${f1(et[1])}) scale(${(1 + 0.08 * cambio).toFixed(3)})`} filter="url(#isog-flota)">
        <rect x={-anchoEt / 2} y={-40} width={anchoEt} height={80} rx={40} fill="#FFFFFF" />
        <circle cx={-anchoEt / 2 + 42} cy={0} r={15} fill={colEstado} />
        <text x={-anchoEt / 2 + 70} y={14} fontFamily={POPPINS} fontWeight={700} fontSize={40} letterSpacing={1} fill={COL.tinta}>{estado}</text>
      </g>
    </svg>
  );
};
