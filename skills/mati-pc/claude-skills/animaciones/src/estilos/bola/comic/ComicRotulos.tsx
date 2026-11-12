import React from 'react';
import {E, clamp, mix, p, rng} from '../../../comun/curvas';
import {R_BOLA, bola, escalaEn, proyecta, type Golpe as GolpeEscena} from '../escena';
import {C, LETRA, TINTA, anchoLetra, circulo, curva, elipse, estallido, estrella, f1, poli, trama, type P} from './ComicTrama';

// CÓMIC, LOS RÓTULOS Y LOS EFECTOS: las onomatopeyas con sus letras que saltan (cada una con su giro, su
// contorno grueso y su sombra de bloque), los globos (de hablar, de pensar y de gritar), la cartela amarilla de arriba, las líneas
// de velocidad detrás de la bola, la estrella de cada golpe y el remate del intento 10: los rayos de fondo, el estallido rojo que
// se sale de la viñeta con el «¡DENTRO!» que cae letra a letra como un sello, el confeti y las estrellitas.

// ---------------------------------------------------------------- letras sueltas que saltan
export type EstiloLetras = {relleno: string; bloque: string; grosor: number; bloqueEn?: number};
export const Letras: React.FC<{
  texto: string; x: number; y: number; size: number; giro?: number; t: number; t0: number; t1?: number; estilo: EstiloLetras;
  modo?: 'salta' | 'sello' | 'ola'; semilla?: number; paso?: number; espacio?: number;
}> = ({texto, x, y, size, giro = 0, t, t0, t1, estilo, modo = 'salta', semilla = 1, paso = 0.03, espacio = 0.02}) => {
  if (t < t0) return null;
  const sale = t1 !== undefined ? E.inCubic(p(t, t1, 0.1)) : 0;
  if (sale >= 1) return null;
  const letras = [...texto];
  const r = rng(semilla);
  const ruido = letras.map(() => ({giro: (r() - 0.5) * 13, dy: (r() - 0.5) * 0.13, tam: 1 + (r() - 0.5) * 0.16}));
  const anchos = letras.map((c, j) => anchoLetra(c) * size * ruido[j].tam * (1 + espacio));
  const total = anchos.reduce((a, b) => a + b, 0);
  let cx = x - total / 2;
  const tiembla = Math.floor(t * 15);
  const bloque = estilo.bloqueEn ?? 0.075;
  return (
    <g transform={`rotate(${giro.toFixed(2)} ${f1(x)} ${f1(y)})`}>
      {letras.map((c, j) => {
        const w = anchos[j];
        const lx = cx + w / 2;
        cx += w;
        const a = t0 + j * paso;
        if (t < a) return null;
        const k = p(t, a, modo === 'sello' ? 0.075 : 0.16);
        let esc = modo === 'sello' ? (k < 1 ? mix(2.3, 1, E.inCubic(k)) : 1 + 0.06 * Math.exp(-14 * (t - a - 0.09)) * Math.sin(40 * (t - a - 0.09))) : modo === 'ola' ? 1 : E.outBack(k);
        esc *= 1 - sale;
        // la ola: cuando ya está quieta, cada letra da un saltito, una detrás de otra
        const u = t - t0 - 0.3;
        const ola = modo === 'ola' && u > 0 ? -size * 0.13 * Math.max(0, Math.sin((u * 1.9 - j * 0.1) * Math.PI * 2)) ** 3 : 0;
        if (esc <= 0.01) return null;
        const rt = rng(semilla * 31 + j * 7 + tiembla * 101);
        const jx = (rt() - 0.5) * 2.4, jy = (rt() - 0.5) * 2.4;
        const fs = size * ruido[j].tam;
        const comun = {x: 0, y: 0, textAnchor: 'middle' as const, dominantBaseline: 'central' as const, fontFamily: LETRA, fontSize: fs};
        return (
          <g key={j} transform={`translate(${f1(lx + jx)} ${f1(y + ruido[j].dy * size + jy + ola)}) rotate(${ruido[j].giro.toFixed(1)}) scale(${esc.toFixed(3)})`}>
            <text {...comun} dx={fs * bloque} dy={fs * bloque} fill={estilo.bloque} stroke={TINTA} strokeWidth={estilo.grosor} strokeLinejoin="round" paintOrder="stroke">{c}</text>
            <text {...comun} fill={estilo.relleno} stroke={TINTA} strokeWidth={estilo.grosor} strokeLinejoin="round" paintOrder="stroke">{c}</text>
          </g>
        );
      })}
    </g>
  );
};
// el ancho de un texto en la letra del cómic (para ajustar los globos)
export const anchoTexto = (texto: string, size: number) => [...texto].reduce((a, c) => a + anchoLetra(c) * size, 0);

// ---------------------------------------------------------------- los globos
export type TipoGlobo = 'habla' | 'piensa' | 'grito';
export const Globo: React.FC<{texto: string; c: P; cola: P; tipo: TipoGlobo; t: number; t0: number; t1: number; size?: number; semilla?: number}> = ({
  texto, c, cola, tipo, t, t0, t1, size = 66, semilla = 3,
}) => {
  if (t < t0 || t >= t1) return null;
  const k = E.outBack(p(t, t0, 0.16)) * (1 - E.inCubic(p(t, t1 - 0.08, 0.08)));
  if (k <= 0.01) return null;
  const w = Math.max(150, anchoTexto(texto, size) + 90), h = size * 1.75;
  const rx = w / 2, ry = h / 2;
  // la forma, en piezas sueltas (en un solo camino, los giros contrarios de los bultos abrían agujeros)
  const formas: string[] = [];
  if (tipo === 'grito') {
    formas.push(poli(estallido(c[0], c[1], rx * 1.22, ry * 1.42, 13, semilla, 0.74)));
  } else if (tipo === 'piensa') {
    const n = 11;
    formas.push(poli(elipse(c, rx * 0.9, ry * 0.85, 30)));
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2;
      formas.push(circulo([c[0] + Math.cos(a) * rx * 0.86, c[1] + Math.sin(a) * ry * 0.78], Math.min(rx, ry) * 0.5));
    }
    // las burbujitas hacia él
    [0.62, 0.8, 0.93].forEach((u, j) => formas.push(circulo([mix(c[0], cola[0], u), mix(c[1] + ry * 0.7, cola[1], u)], 15 - j * 4)));
  } else {
    // la elipse con su colita hacia él
    const dx = cola[0] - c[0], dy = cola[1] - c[1];
    const a = Math.atan2(dy, dx);
    const b1: P = [c[0] + Math.cos(a - 0.22) * rx * 0.8, c[1] + Math.sin(a - 0.22) * ry * 0.8];
    const b2: P = [c[0] + Math.cos(a + 0.22) * rx * 0.8, c[1] + Math.sin(a + 0.22) * ry * 0.8];
    formas.push(poli(elipse(c, rx, ry, 44)), poli([b1, cola, b2]));
  }
  const salto = tipo === 'grito' ? (Math.floor(t * 15) % 2 ? 2 : -2) : 0;
  return (
    <g transform={`translate(${f1(c[0] + salto)} ${f1(c[1])}) scale(${k.toFixed(3)}) translate(${f1(-c[0])} ${f1(-c[1])})`}>
      {/* el contorno: todo junto en tinta, gordo; encima el relleno sin borde (así la colita y el globo son una sola forma) */}
      {formas.map((d, j) => <path key={'t' + j} d={d} fill={TINTA} stroke={TINTA} strokeWidth={13} strokeLinejoin="round" />)}
      {formas.map((d, j) => <path key={'r' + j} d={d} fill={tipo === 'grito' ? C.amarillo : C.crema} />)}
      <text x={c[0]} y={c[1] + 3} textAnchor="middle" dominantBaseline="central" fontFamily={LETRA} fontSize={size} fill={TINTA}>{texto}</text>
    </g>
  );
};

// ---------------------------------------------------------------- la cartela amarilla de arriba (la del narrador)
export const Cartela: React.FC<{texto: string; t: number; t0?: number; size?: number; color?: string}> = ({texto, t, t0 = -1, size = 60, color = C.amarillo}) => {
  const w = anchoTexto(texto, size) + 64;
  const k = t0 < 0 ? 1 : E.outBack(p(t, t0, 0.18));
  const x0 = 18, y0 = 18, h = size * 1.45;
  return (
    <g transform={`translate(${x0} ${y0}) scale(${k.toFixed(3)}) translate(${-x0} ${-y0})`}>
      <rect x={x0 + 9} y={y0 + 9} width={w} height={h} fill={TINTA} />
      <rect x={x0} y={y0} width={w} height={h} fill={color} stroke={TINTA} strokeWidth={8} strokeLinejoin="round" />
      <text x={x0 + 32} y={y0 + h / 2 + 3} dominantBaseline="central" fontFamily={LETRA} fontSize={size} fill={TINTA} letterSpacing={1.5}>{texto}</text>
    </g>
  );
};

// ---------------------------------------------------------------- las líneas de velocidad detrás de la bola (siguen su camino)
export const Velocidad: React.FC<{i: number; t: number; golpes: GolpeEscena[]}> = ({i, t, golpes}) => {
  const b = bola(i, t);
  if (b.dentro) return null;
  const desde = Math.max(0, ...golpes.filter((g) => g.t <= t).map((g) => g.t + 0.02));
  const pts: P[] = [];
  for (let k = 0; k <= 16; k++) {
    const s = t - k * 0.011;
    if (s < desde) break;
    pts.push(proyecta(bola(i, s).c));
  }
  if (pts.length < 4) return null;
  const v = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) / 0.011;
  if (v < 700) return null;
  const R = R_BOLA * escalaEn(b.c[2]);
  const fuerza = clamp((v - 700) / 1600);
  const lineas = [-0.62, 0, 0.62].map((off, j) => {
    const largo = Math.round((j === 1 ? 16 : 12) * (0.45 + 0.55 * fuerza));
    const camino: P[] = [];
    for (let k = 0; k < Math.min(pts.length - 1, largo); k++) {
      const a = pts[k], q = pts[k + 1];
      const dx = a[0] - q[0], dy = a[1] - q[1];
      const l = Math.hypot(dx, dy) || 1;
      const n: P = [-dy / l, dx / l];
      const pt: P = [a[0] + n[0] * off * R, a[1] + n[1] * off * R];
      if (Math.hypot(pt[0] - pts[0][0], pt[1] - pts[0][1]) < R * 1.25) continue;
      camino.push(pt);
    }
    return camino;
  });
  return (
    <g opacity={1}>
      {lineas.map((l, j) => (l.length > 1 ? <path key={j} d={curva(l)} fill="none" stroke={TINTA} strokeWidth={j === 1 ? 7 : 5} strokeLinecap="round" /> : null))}
    </g>
  );
};

// ---------------------------------------------------------------- la estrella de cada golpe
export const Golpe: React.FC<{c: P; t: number; t0: number; r?: number; semilla?: number}> = ({c, t, t0, r = 70, semilla = 5}) => {
  const k = p(t, t0, 0.2);
  if (t < t0 || k >= 1) return null;
  const s = E.outBack(clamp(k * 2.5)) * (1 - E.inCubic(clamp((k - 0.5) * 2)));
  return (
    <g transform={`translate(${f1(c[0])} ${f1(c[1])}) scale(${s.toFixed(3)})`}>
      <path d={poli(estallido(0, 0, r, r * 0.8, 9, semilla, 0.5))} fill={C.amarillo} stroke={TINTA} strokeWidth={6} strokeLinejoin="round" />
      <path d={poli(estallido(0, 0, r * 0.55, r * 0.45, 9, semilla + 1, 0.5))} fill={C.crema} />
      {Array.from({length: 8}, (_, j) => {
        const a = (j / 8) * Math.PI * 2 + 0.2;
        return <path key={j} d={`M ${f1(Math.cos(a) * r * 1.15)} ${f1(Math.sin(a) * r * 0.95)} L ${f1(Math.cos(a) * r * 1.55)} ${f1(Math.sin(a) * r * 1.3)}`} stroke={TINTA} strokeWidth={6} strokeLinecap="round" />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------- el remate: los rayos de fondo
let PUNTOS_RAYOS: string | null = null;
export const Rayos: React.FC<{c: P; giro: number; n?: number}> = ({c, giro, n = 22}) => {
  const R = 2600;
  const cuñas: string[] = [];
  for (let k = 0; k < n; k++) {
    const a0 = giro + (k / n) * Math.PI * 2, a1 = a0 + Math.PI / n;
    cuñas.push(poli([c, [c[0] + Math.cos(a0) * R, c[1] + Math.sin(a0) * R], [c[0] + Math.cos(a1) * R, c[1] + Math.sin(a1) * R]]));
  }
  // los puntos rojos que se apiñan hacia los bordes (fijos a la página)
  PUNTOS_RAYOS ??= trama([-40, -40, 1120, 1960], 22, 15, (x, y) => clamp((Math.hypot(x - 540, (y - 700) * 0.8) - 260) / 700) ** 1.2 * 0.95);
  return (
    <g>
      <rect x={-60} y={-60} width={1200} height={2040} fill={C.amarillo} />
      <path d={cuñas.join(' ')} fill={C.naranja} />
      <path d={PUNTOS_RAYOS} fill={C.rojo} />
    </g>
  );
};

// ---------------------------------------------------------------- el confeti y las estrellitas
type Papelito = {o: P; ang: number; v: number; giro: number; w: number; h: number; col: string; forma: 'tira' | 'estrella' | 'punto'; fase: number};
const papelitos = (semilla: number, n: number, o: P, abre: number, base: number, vmin: number, vmax: number): Papelito[] => {
  const r = rng(semilla);
  const cols = [C.amarillo, C.rojo, C.azul, C.cian, C.crema, C.verde];
  return Array.from({length: n}, (_, k) => ({
    o: [o[0] + (r() - 0.5) * 160, o[1] + (r() - 0.5) * 30] as P,
    ang: base + (r() - 0.5) * abre,
    v: vmin + r() * (vmax - vmin),
    giro: (r() - 0.5) * 22,
    w: 26 + r() * 22,
    h: 13 + r() * 9,
    col: cols[k % cols.length],
    forma: (r() < 0.22 ? 'estrella' : r() < 0.3 ? 'punto' : 'tira') as Papelito['forma'],
    fase: r() * 6.28,
  }));
};
const PAPELITOS = new Map<string, Papelito[]>();
export const Confeti: React.FC<{t: number; t0: number; o: P; semilla: number; n?: number; abre?: number; base?: number; vmin?: number; vmax?: number}> = ({
  t, t0, o, semilla, n = 60, abre = 2.2, base = -Math.PI / 2, vmin = 1300, vmax = 2900,
}) => {
  if (t < t0) return null;
  const clave = `${semilla}|${n}|${f1(o[0])}|${f1(o[1])}|${abre}|${base}|${vmin}|${vmax}`;
  let ps = PAPELITOS.get(clave);
  if (!ps) {
    ps = papelitos(semilla, n, o, abre, base, vmin, vmax);
    PAPELITOS.set(clave, ps);
  }
  const u = t - t0;
  const kD = 2.2; // el aire frena los papelitos
  const fr = (1 - Math.exp(-kD * u)) / kD;
  return (
    <g>
      {ps.map((q, k) => {
        const vx = Math.cos(q.ang) * q.v, vy = Math.sin(q.ang) * q.v;
        // cae con la gravedad, frenado: al final baja despacio, meciéndose
        const x = q.o[0] + vx * fr + Math.sin(u * 7 + q.fase) * 30 * clamp(u * 2);
        const y = q.o[1] + vy * fr + 420 * u * u + 110 * u;
        if (y > 2000) return null;
        const g = q.giro * u * 57 + q.fase * 57;
        const voltea = Math.cos(u * 11 + q.fase);
        const s = E.outBack(clamp(u / 0.12));
        if (q.forma === 'estrella') {
          return <path key={k} d={poli(estrella([0, 0], q.w * 0.75, 5, 0.45))} transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(g)}) scale(${s.toFixed(2)})`} fill={C.amarillo} stroke={TINTA} strokeWidth={4} strokeLinejoin="round" />;
        }
        if (q.forma === 'punto') return <circle key={k} cx={x} cy={y} r={11 * s} fill={q.col} stroke={TINTA} strokeWidth={3.5} />;
        return (
          <rect key={k} x={-q.w / 2} y={-q.h / 2} width={q.w} height={q.h} fill={q.col} stroke={TINTA} strokeWidth={4}
            transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(g)}) scale(${(s * Math.max(0.15, Math.abs(voltea))).toFixed(2)} ${s.toFixed(2)})`} />
        );
      })}
    </g>
  );
};
export const Estrellitas: React.FC<{t: number; sitios: [number, number, number, number][]}> = ({t, sitios}) => (
  <g>
    {sitios.map(([x, y, r, t0], k) => {
      if (t < t0) return null;
      const u = t - t0;
      const s = E.outBack(clamp(u / 0.18)) * (0.82 + 0.18 * Math.sin(u * 12 + k));
      return (
        <g key={k} transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(u * 90 + k * 20)}) scale(${s.toFixed(3)})`}>
          <path d={poli(estrella([0, 0], r, 4, 0.36))} fill={k % 2 ? C.crema : C.amarillo} stroke={TINTA} strokeWidth={5} strokeLinejoin="round" />
        </g>
      );
    })}
  </g>
);

const PUNTOS_E = new Map<string, string>();
const PUNTOS_ESTALLIDO = (c: P) => {
  const k = `${c[0]}|${c[1]}`;
  let d = PUNTOS_E.get(k);
  if (!d) {
    d = trama([c[0] - 440, c[1] - 200, c[0] + 440, c[1] + 200], 15, 15, (x, y) => clamp(Math.hypot((x - c[0]) / 420, (y - c[1]) / 180) - 0.45) * 1.1);
    PUNTOS_E.set(k, d);
  }
  return d;
};
// ---------------------------------------------------------------- el gran estallido del «¡DENTRO!» (se sale de la viñeta)
export const Explosion: React.FC<{t: number; t0: number; c: P; texto: string}> = ({t, t0, c, texto}) => {
  if (t < t0) return null;
  const u = t - t0;
  const crece = mix(0.55, 1, E.outBack(clamp(u / 0.16)));
  const late = 1 + 0.025 * Math.sin(u * 2 * Math.PI * 3.2) * clamp((u - 0.25) / 0.2);
  const salto = u < 0.6 ? (Math.floor(t * 30) % 2 ? 3 : -3) * (1 - u / 0.6) : 0;
  const giro = -7;
  const ks = clamp(u / 0.09);
  const sello = ks < 1 ? mix(2.2, 1, E.inCubic(ks)) : 1 + 0.07 * Math.exp(-12 * (u - 0.09)) * Math.sin(36 * (u - 0.09));
  const fuera = poli(estallido(c[0], c[1], 520, 260, 17, 77, 0.7, 0.1));
  const dentro = poli(estallido(c[0], c[1], 420, 180, 17, 78, 0.78, 0.25));
  return (
    <g transform={`translate(${f1(c[0] + salto)} ${f1(c[1])}) rotate(${giro}) scale(${late.toFixed(3)}) translate(${f1(-c[0])} ${f1(-c[1])})`}>
      {/* el estallido nace ya grande (del 55 %) y se pasa un poco: el primer cuadro después del impacto ya grita */}
      <g transform={`translate(${f1(c[0])} ${f1(c[1])}) scale(${crece.toFixed(3)}) translate(${f1(-c[0])} ${f1(-c[1])})`}>
        <path d={fuera} fill={TINTA} transform="translate(18 20)" />
        <path d={fuera} fill={C.rojo} stroke={TINTA} strokeWidth={11} strokeLinejoin="round" />
        <path d={dentro} fill={C.amarillo} stroke={TINTA} strokeWidth={6} strokeLinejoin="round" />
        <path d={PUNTOS_ESTALLIDO(c)} fill={C.naranja} />
      </g>
      {/* la palabra entera cae como un sello (de 2,2 veces a su tamaño en 0,09 s, con su rebote) y después hace la ola */}
      <g transform={`translate(${f1(c[0])} ${f1(c[1])}) scale(${sello.toFixed(3)}) translate(${f1(-c[0])} ${f1(-c[1])})`}>
        <Letras texto={texto} x={c[0]} y={c[1] + 4} size={222} t={t} t0={t0} estilo={{relleno: C.crema, bloque: C.azul, grosor: 17, bloqueEn: 0.07}} modo="ola" semilla={9} paso={0} espacio={0.04} />
      </g>
    </g>
  );
};

// las rayas de alegría alrededor de la cabeza y las rayitas de movimiento de los puños (que suben y bajan)
export const Alegria: React.FC<{c: P; manos: P[]; t: number; t0: number}> = ({c, manos, t, t0}) => {
  if (t < t0) return null;
  const u = t - t0;
  const k = E.outBack(clamp(u / 0.15));
  const late = 0.85 + 0.15 * Math.sin(u * 20);
  return (
    <g>
      {[-160, -128, -96, -64, -32, 0].map((a, j) => {
        const r = ((a - 2) * Math.PI) / 180;
        const r0 = 132 * k, r1 = (132 + 80 * late) * k;
        return <path key={j} d={`M ${f1(c[0] + Math.cos(r) * r0)} ${f1(c[1] + Math.sin(r) * r0 * 0.95)} L ${f1(c[0] + Math.cos(r) * r1)} ${f1(c[1] + Math.sin(r) * r1 * 0.95)}`} stroke={TINTA} strokeWidth={10} strokeLinecap="round" />;
      })}
      {manos.map((m, j) => {
        const lado = m[0] < c[0] ? -1 : 1;
        return [0, 1].map((q) => {
          const x = m[0] + lado * (38 + q * 16), y = m[1] + 14 + q * 8;
          return <path key={`${j}-${q}`} d={`M ${f1(x)} ${f1(y - 26)} Q ${f1(x + lado * 12)} ${f1(y)} ${f1(x)} ${f1(y + 26)}`} fill="none" stroke={TINTA} strokeWidth={7} strokeLinecap="round" opacity={k} />;
        });
      })}
    </g>
  );
};
