import React, {useId} from 'react';
import {loadFont as cargarRajdhani} from '@remotion/google-fonts/Rajdhani';
import {loadFont as cargarMono} from '@remotion/google-fonts/ShareTechMono';
import {E, clamp, kf, mix, p, rng, ruido, temblor} from '../../comun/curvas';
import {
  BORDE, DUR, FONDO_SUELO, IMPACTO, MESA_G, MESA_Y, PX_M, SUELO, TRANSFORMA_GATO, T_CAE, T_SUELO, bigote, cabezaTrazos, cafe, cinta,
  cuerpoTrazos, curva, elipse, enMundo, gato, oreja, pataTrazos, piezasTaza, poli, rot, suma, taza, trozos, vapor,
  type Elipse, type Gato, type P, type Pata,
} from './escena';

// EL GATO EN 1 · HOLOGRAMA: alambre de luz cian sobre un escenario casi negro, tres capas
// (la rejilla de puntos detrás; la cocina, la plataforma del proyector y el gato en medio; los rótulos delante, cada uno en su placa
// oscura con esquinas). El gato es un modelo de CAD: cada parte con su contorno de luz y el borde más brillante (fresnel), anillos a
// lo largo de patas y cola, y en la cabeza meridianos que se deslizan cuando se gira a mirarte. Blanco = «calor», lo activo: los
// ojos, la pata cuando empuja, la oreja que se mueve, el café. El naranja se gasta UNA vez: el contador «TAZAS ROTAS» que da
// vueltas y se fija. Antes de caer, el visor ya calcula la trayectoria y marca en el suelo dónde va a romperse; al caer, la taza
// deja su rastro escaneado; al romperse, el fallo de imagen (tres cuadros), la onda en la plataforma y el contador.

const {fontFamily: RAJDHANI} = cargarRajdhani('normal', {weights: ['500', '600'], subsets: ['latin']});
const {fontFamily: MONO} = cargarMono('normal', {subsets: ['latin']});

const TONO = '#3FE0FF';
const CALOR = '#E6FCFF';
const ACENTO = '#FF9A3C';
const ESCENARIO = '#01070B';
const PUPILA = '#03161E';
const LINEA = '#8FF1FF'; // el contorno de las piezas: el tono, algo más claro
const rgba = (a: number) => `rgba(63, 224, 255, ${clamp(a).toFixed(3)})`;
const blanco = (a: number) => `rgba(230, 252, 255, ${clamp(a).toFixed(3)})`;
const f = (v: number) => v.toFixed(1);
const coma = (n: number, d = 2) => n.toFixed(d).replace('.', ',');
const F3 = 3 / 60; // tres cuadros a 60
const pulso = (t: number, t0: number, sube: number, baja: number) =>
  t < t0 ? 0 : t < t0 + sube ? E.outCubic((t - t0) / sube) : 1 - E.inOutCubic(clamp((t - t0 - sube) / baja));
const ventana = (t: number, a: number, b: number, entra = 0.06, sale = 0.12) => p(t, a, entra) * (1 - p(t, b, sale));
const enE = (e: Elipse, q: P): P => suma(e.c, rot(q, e.ang));

// ------------------------------------------------------------------ las mallas de alambre
// un elipsoide de pie: anillos que lo cruzan (vistos un poco desde arriba) y meridianos a lo largo
const mallaElipse = (e: Elipse, anillos: number[], meridianos: number[]): string => {
  let d = '';
  for (const s of anillos) {
    const y = e.ry * s, w = e.rx * Math.sqrt(Math.max(0, 1 - s * s));
    const pts: P[] = [];
    for (let i = 0; i <= 14; i++) {
      const a = (Math.PI * i) / 14;
      pts.push(enE(e, [-w * Math.cos(a), y + 0.24 * w * Math.sin(a)]));
    }
    d += ' ' + poli(pts, false);
  }
  for (const k of meridianos) {
    const pts: P[] = [];
    for (let i = 0; i <= 32; i++) {
      const a = (2 * Math.PI * i) / 32;
      pts.push(enE(e, [e.rx * k * Math.cos(a), e.ry * Math.sin(a)]));
    }
    d += ' ' + poli(pts, true);
  }
  return d;
};
// la cabeza, un globo: los meridianos se deslizan al girarse (yaw) y los paralelos se quedan
const mallaCabeza = (e: Elipse, yaw: number): {d: string; a: number}[] => {
  const out: {d: string; a: number}[] = [];
  for (let i = 0; i < 10; i++) {
    const phi = (i / 10) * Math.PI * 2 + yaw;
    const z = Math.cos(phi);
    if (z < 0.05) continue;
    const s = Math.sin(phi);
    const pts: P[] = [];
    for (let j = 0; j <= 18; j++) {
      const lat = -Math.PI / 2 + (Math.PI * j) / 18;
      pts.push(enE(e, [e.rx * s * Math.cos(lat), e.ry * Math.sin(lat)]));
    }
    out.push({d: poli(pts, false), a: 0.14 + 0.36 * z});
  }
  for (const lat of [-0.62, -0.12, 0.4]) {
    const y = e.ry * Math.sin(lat), w = e.rx * Math.cos(lat);
    const pts: P[] = [];
    for (let j = 0; j <= 16; j++) {
      const a = (Math.PI * j) / 16;
      pts.push(enE(e, [-w * Math.cos(a), y + 0.2 * w * Math.sin(a)]));
    }
    out.push({d: poli(pts, false), a: 0.38});
  }
  return out;
};
// un tubo de CAD: su eje y unos anillos de lado a lado
const tubo = (a: P, b: P, ra: number, rb: number, n: number) => {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = (b[0] - a[0]) / d, uy = (b[1] - a[1]) / d;
  let anillos = '';
  for (let i = 1; i <= n; i++) {
    const k = i / (n + 1);
    const cx = a[0] + (b[0] - a[0]) * k, cy = a[1] + (b[1] - a[1]) * k;
    const r = (ra + (rb - ra) * k) * 0.94;
    anillos += ` M ${f(cx - uy * r)} ${f(cy + ux * r)} Q ${f(cx + ux * r * 0.45)} ${f(cy + uy * r * 0.45)} ${f(cx + uy * r)} ${f(cy - ux * r)}`;
  }
  return {eje: ` M ${f(a[0])} ${f(a[1])} L ${f(b[0])} ${f(b[1])}`, anillos};
};
// los puntos de una línea hasta la fracción k de su largo (para las guías que se trazan)
const parcial = (pts: P[], k: number): P[] => {
  if (k >= 1) return pts;
  const largos = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  let resto = largos.reduce((a, b) => a + b, 0) * clamp(k);
  const out: P[] = [pts[0]];
  for (let i = 0; i < largos.length; i++) {
    if (resto >= largos[i]) {
      out.push(pts[i + 1]);
      resto -= largos[i];
    } else {
      const u = largos[i] ? resto / largos[i] : 0;
      out.push([mix(pts[i][0], pts[i + 1][0], u), mix(pts[i][1], pts[i + 1][1], u)]);
      break;
    }
  }
  return out;
};
const esquinas = (cx: number, cy: number, hw: number, hh: number, l: number) =>
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
    const x = cx + sx * hw, y = cy + sy * hh;
    return `M ${f(x)} ${f(y - sy * l)} V ${f(y)} H ${f(x - sx * l)}`;
  }).join(' ');

// ------------------------------------------------------------------ la taza
const TAZA_BOCA: P[] = Array.from({length: 25}, (_, i) => [52 * Math.cos((i / 24) * 2 * Math.PI), -59 + 9 * Math.sin((i / 24) * 2 * Math.PI)]);
const TAZA_BASE: P[] = Array.from({length: 13}, (_, i) => [44 * Math.cos((i / 12) * Math.PI), 50 + 8 * Math.sin((i / 12) * Math.PI)]);
const TAZA_CAFE: P[] = Array.from({length: 21}, (_, i) => [45 * Math.cos((i / 20) * 2 * Math.PI), -47 + 7 * Math.sin((i / 20) * 2 * Math.PI)]);
const TAZA_RAYAS: [P, P][] = [[[-26, -51], [-26, 57]], [[26, -51], [26, 57]]];
const tazaHolo = (c: P, ang: number, cafeK: number) => {
  const pz = piezasTaza({c, ang});
  const w = (q: P) => suma(c, rot(q, ang));
  const rayas = TAZA_RAYAS.map(([a, b]) => `M ${f(w(a)[0])} ${f(w(a)[1])} L ${f(w(b)[0])} ${f(w(b)[1])}`).join(' ');
  return (
    <g strokeLinejoin="round">
      <path d={poli(pz.asa)} fill={rgba(0.07)} stroke={rgba(0.9)} strokeWidth={2.2} />
      <path d={poli(pz.cuerpo)} fill={rgba(0.1)} stroke={LINEA} strokeWidth={2.8} />
      <path d={rayas} fill="none" stroke={rgba(0.38)} strokeWidth={1.3} />
      <path d={poli(TAZA_BASE.map(w), false)} fill="none" stroke={rgba(0.45)} strokeWidth={1.3} />
      <path d={poli(TAZA_BOCA.map(w))} fill="none" stroke={rgba(0.85)} strokeWidth={1.8} />
      {cafeK > 0.01 && <path d={poli(TAZA_CAFE.map(w))} fill={blanco(0.55 * cafeK)} stroke={blanco(0.95 * cafeK)} strokeWidth={1.5} />}
    </g>
  );
};
// la trayectoria que calcula el visor antes de que caiga, hasta el punto del suelo
const PREVISTA: P[] = (() => {
  const out: P[] = [];
  for (let i = 0; i <= 30; i++) out.push(taza(T_CAE + ((T_SUELO - T_CAE) * i) / 30 - (i === 30 ? 1e-6 : 0)).c);
  out.push([IMPACTO[0], SUELO + 2]);
  return out;
})();

// ------------------------------------------------------------------ la plataforma del proyector
const PC: P = [460, 1606];
const PR = 450;
const PK = 0.13; // lo aplastada que se ve (perspectiva)
const enPad = (a: number, r: number): P => [PC[0] + Math.cos(a) * r, PC[1] + Math.sin(a) * r * PK];
const HAZ_ARRIBA = 290;
const anchoHaz = (y: number) => mix(PR * 0.9, 300, clamp((PC[1] - y) / (PC[1] - HAZ_ARRIBA)));

// ------------------------------------------------------------------ la cocina, en alambre (lo que no se mueve)
const TAZA0 = piezasTaza({c: [0, 0], ang: 0});
const TAZAS_BALDA: P[] = [[790, 637], [866, 637], [942, 637]];
const LEJOS = (
  <g fill="none" strokeLinejoin="round">
    {/* la ventana, detrás del gato */}
    <g stroke={rgba(0.3)} strokeWidth={1.4}>
      <rect x={96} y={360} width={430} height={420} fill={rgba(0.025)} />
      <rect x={112} y={376} width={398} height={388} stroke={rgba(0.14)} />
      <line x1={311} y1={360} x2={311} y2={780} />
      <line x1={96} y1={560} x2={526} y2={560} />
      <rect x={80} y={780} width={462} height={16} fill={rgba(0.04)} />
      <path d="M 130 540 L 210 430 M 150 548 L 262 392 M 340 740 L 420 620" stroke={rgba(0.12)} />
    </g>
    {/* la balda con más tazas */}
    <g stroke={rgba(0.34)} strokeWidth={1.4}>
      <rect x={744} y={664} width={262} height={12} fill={rgba(0.04)} />
      <path d="M 778 676 V 712 L 812 676 M 972 676 V 712 L 938 676" />
      {TAZAS_BALDA.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(0.46)`} strokeWidth={3}>
          <path d={poli(TAZA0.asa)} />
          <path d={poli(TAZA0.cuerpo)} fill={rgba(0.05)} />
          <path d={poli(TAZA_BOCA)} />
        </g>
      ))}
    </g>
    {/* el radiador, debajo de la mesa */}
    <g stroke={rgba(0.26)} strokeWidth={1.3}>
      <rect x={160} y={1236} width={270} height={232} rx={10} fill={rgba(0.02)} />
      {Array.from({length: 8}, (_, i) => <rect key={i} x={176 + i * 32} y={1250} width={18} height={204} rx={9} />)}
      <line x1={176} y1={1468} x2={176} y2={1540} />
    </g>
  </g>
);
const D: P = [-26, -22]; // la profundidad de la mesa: lo de atrás, arriba a la izquierda
const MESA = (
  <g fill="none" strokeLinejoin="round">
    {/* las patas de atrás, en trazos */}
    <path d={`M ${110 + D[0]} ${MESA_Y + MESA_G + D[1]} V ${SUELO + D[1]} M ${652 + D[0]} ${MESA_Y + MESA_G + 36 + D[1]} V ${SUELO + D[1]}`}
      stroke={rgba(0.22)} strokeWidth={1.2} strokeDasharray="8 8" />
    {/* la cara de arriba del tablero, en perspectiva, y sus tablas */}
    <path d={`M -20 ${MESA_Y} H ${BORDE} L ${BORDE + D[0]} ${MESA_Y + D[1]} H -20`} fill={rgba(0.06)} stroke={rgba(0.7)} strokeWidth={1.6} />
    <path d={Array.from({length: 6}, (_, i) => `M ${70 + i * 120} ${MESA_Y} l ${D[0]} ${D[1]}`).join(' ')} stroke={rgba(0.22)} strokeWidth={1.1} />
    {/* el canto */}
    <rect x={-20} y={MESA_Y} width={BORDE + 20} height={MESA_G} fill={rgba(0.07)} stroke={LINEA} strokeOpacity={0.85} strokeWidth={2} />
    <line x1={-20} y1={MESA_Y + MESA_G / 2} x2={BORDE} y2={MESA_Y + MESA_G / 2} stroke={rgba(0.2)} strokeWidth={1} />
    {/* la regla del borde, que el visor usa para medir */}
    <path d={Array.from({length: 11}, (_, i) => `M ${BORDE - i * 16} ${MESA_Y + MESA_G} v ${i % 5 === 0 ? 14 : 7}`).join(' ')} stroke={rgba(0.65)} strokeWidth={1.3} />
    {/* el faldón y las patas */}
    <rect x={136} y={MESA_Y + MESA_G} width={516} height={36} fill={rgba(0.03)} stroke={rgba(0.55)} strokeWidth={1.5} />
    {[110, 652].map((x) => (
      <g key={x}>
        <rect x={x} y={MESA_Y + MESA_G} width={26} height={SUELO - MESA_Y - MESA_G} fill={rgba(0.05)} stroke={rgba(0.75)} strokeWidth={1.8} />
        <line x1={x + 13} y1={MESA_Y + MESA_G} x2={x + 13} y2={SUELO} stroke={rgba(0.22)} strokeWidth={1} />
        <path d={Array.from({length: 7}, (_, i) => `M ${x} ${MESA_Y + 120 + i * 70} q 13 6 26 0`).join(' ')} stroke={rgba(0.35)} strokeWidth={1.1} />
      </g>
    ))}
    {/* el comedero, vacío */}
    <g stroke={rgba(0.6)} strokeWidth={1.6}>
      <path d={`M 428 ${SUELO} L 440 ${SUELO - 38} L 552 ${SUELO - 38} L 564 ${SUELO} Z`} fill={rgba(0.05)} />
      <ellipse cx={496} cy={SUELO - 38} rx={56} ry={8} />
      <ellipse cx={496} cy={SUELO - 37} rx={44} ry={5} stroke={rgba(0.3)} />
    </g>
  </g>
);

// ------------------------------------------------------------------ los filtros
// el contorno de UNA pieza aunque esté hecha de varias formas (lo que sale al engordar la silueta), el borde por dentro más
// brillante (fresnel: lo que se ve de canto) y un relleno casi transparente
const FiltroSilueta: React.FC<{id: string; linea: string; aLinea: number; aBorde: number; aRelleno: number; grueso: number}> = ({
  id, linea, aLinea, aBorde, aRelleno, grueso,
}) => (
  <filter id={id} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
    <feMorphology in="SourceAlpha" operator="dilate" radius={grueso} result="d" />
    <feComposite in="d" in2="SourceAlpha" operator="out" result="borde" />
    <feMorphology in="SourceAlpha" operator="erode" radius={11} result="e" />
    <feComposite in="SourceAlpha" in2="e" operator="out" result="anillo" />
    <feGaussianBlur in="anillo" stdDeviation={6} result="anilloB" />
    <feComposite in="anilloB" in2="SourceAlpha" operator="in" result="fres" />
    <feFlood floodColor={TONO} floodOpacity={aBorde} />
    <feComposite in2="fres" operator="in" result="fresC" />
    <feFlood floodColor={TONO} floodOpacity={aRelleno} />
    <feComposite in2="SourceAlpha" operator="in" result="rell" />
    <feFlood floodColor={linea} floodOpacity={aLinea} />
    <feComposite in2="borde" operator="in" result="lin" />
    <feMerge>
      <feMergeNode in="rell" />
      <feMergeNode in="fresC" />
      <feMergeNode in="lin" />
    </feMerge>
  </filter>
);

// ------------------------------------------------------------------ el gato, en alambre de luz (en sus medidas de dibujo)
const GatoHolo: React.FC<{g: Gato; t: number; id: string}> = ({g, t, id}) => {
  const u = (s: string) => `url(#${id}-${s})`;
  const lame = !!g.lengua || g.mira === 'pata';
  const cuerpo = cuerpoTrazos(g); // cadera, torso, pecho, barriga, cuello, pie de atrás
  const [cadera, torso, pecho, barriga, cuello] = cuerpo;
  const cabeza = cabezaTrazos(g);
  const pc = pataTrazos(g.pataCerca);
  const pl = pataTrazos(g.pataLejos);
  const cola = cinta(g.cola.pts, g.cola.r);
  // lo activo, en blanco: la pata cuando toca la taza, la oreja cuando se mueve
  const empuja = Math.max(ventana(t, 1.26, 1.45), ventana(t, 1.62, 1.84), ventana(t, 2.36, 2.86));
  const ticCerca = Math.max(pulso(t, 0.84, 0.06, 0.22), pulso(t, T_SUELO, 0.07, 0.35), pulso(t, 5.55, 0.06, 0.22));
  const ticLejos = Math.max(pulso(t, 1.62, 0.06, 0.22), pulso(t, T_SUELO, 0.07, 0.35));
  const yaw = ((1 - g.giro) * Math.PI) / 2;

  const relleno = (ds: string[], filtro: string) => (
    <g filter={u(filtro)}>{ds.map((d, i) => <path key={i} d={d} fill="#fff" />)}</g>
  );
  const mascara = (nombre: string, ds: string[]) => (
    <mask id={`${id}-${nombre}`} maskUnits="userSpaceOnUse" x={-800} y={-800} width={2800} height={3600}>
      <rect x={-800} y={-800} width={2800} height={3600} fill="#fff" />
      {ds.map((d, i) => <path key={i} d={d} fill="#000" />)}
    </mask>
  );
  const pata = (pt: Pata, ds: string[], lejos: boolean, caliente: number) => {
    const a = tubo(pt.hombro, pt.codo, 32, 23, 2), b = tubo(pt.codo, pt.mano, 23, 18, 2);
    const {c, rx, ang} = pt.pie;
    const dedos = [0.3, 0.62].map((s) => {
      const q0 = suma(c, rot([rx * s, -7], ang)), q1 = suma(c, rot([rx * s, 9], ang));
      return ` M ${f(q0[0])} ${f(q0[1])} L ${f(q1[0])} ${f(q1[1])}`;
    }).join('');
    return (
      <g>
        {relleno(ds, lejos ? 'silL' : 'sil')}
        {caliente > 0.01 && <g opacity={caliente}>{relleno(ds, 'silC')}</g>}
        <path d={a.eje + b.eje} fill="none" stroke={rgba(lejos ? 0.16 : 0.3)} strokeWidth={1} />
        <path d={a.anillos + b.anillos + dedos} fill="none" stroke={caliente > 0.5 ? blanco(0.85) : rgba(lejos ? 0.3 : 0.6)} strokeWidth={1.4}
          strokeLinecap="round" />
      </g>
    );
  };
  // la cola: anillos cada dos tramos y su eje
  const anillosCola = (() => {
    const pts = g.cola.pts, r = g.cola.r;
    let d = '';
    for (let i = 2; i < pts.length - 1; i += 2) {
      const a = pts[i - 1], b = pts[i + 1];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      const [cx, cy] = pts[i];
      const rr = r[i] * 0.92;
      d += ` M ${f(cx - uy * rr)} ${f(cy + ux * rr)} Q ${f(cx + ux * rr * 0.5)} ${f(cy + uy * rr * 0.5)} ${f(cx + uy * rr)} ${f(cy - ux * rr)}`;
    }
    return d;
  })();

  return (
    <g>
      <defs>
        {mascara('mDetras', [...cuerpo, ...cabeza, ...pc])}
        {mascara('mCuerpo', [...cabeza, ...pc])}
        {mascara('mCabeza', pc)}
        {mascara('mTorso', [pecho, cuello])}
        {mascara('mCadera', [torso, pecho, barriga, cuello])}
        <clipPath id={`${id}-cPecho`}><path d={pecho} /></clipPath>
        <clipPath id={`${id}-cTorso`}><path d={torso} /></clipPath>
        <clipPath id={`${id}-cCadera`}><path d={cadera} /></clipPath>
        <clipPath id={`${id}-cCab`}><path d={cabeza[0]} /></clipPath>
        {[g.ojoLejos, g.ojoCerca].map((o, i) => <clipPath key={i} id={`${id}-ojo${i}`}><path d={poli(o.visible)} /></clipPath>)}
      </defs>

      {/* lo de detrás: la cola, la otra pata y las orejas, tapados por el cuerpo */}
      <g mask={u('mDetras')}>
        {relleno([cola], 'sil')}
        <path d={curva(g.cola.pts)} fill="none" stroke={rgba(0.26)} strokeWidth={1} />
        <path d={anillosCola} fill="none" stroke={rgba(0.55)} strokeWidth={1.3} />
        {pata(g.pataLejos, pl, true, 0)}
        {[g.orejaLejos, g.orejaCerca].map((o, i) => {
          const tic = i === 0 ? ticLejos : ticCerca;
          return (
            <g key={i}>
              {relleno([oreja(o)], i === 0 ? 'silL' : 'sil')}
              {tic > 0.01 && <g opacity={tic}>{relleno([oreja(o)], 'silC')}</g>}
              <path d={poli(o.dentro)} fill={rgba(0.05)} stroke={tic > 0.4 ? blanco(0.9) : rgba(0.55)} strokeWidth={1.3} strokeLinejoin="round" />
            </g>
          );
        })}
      </g>

      {/* el cuerpo, de una pieza, con su malla */}
      <g mask={u('mCuerpo')}>
        {relleno(cuerpo, 'sil')}
        <g mask={u('mCadera')}>
          <path d={mallaElipse(g.cadera, [-0.55, -0.12, 0.32, 0.7], [0.62, 0.22])} fill="none" stroke={rgba(0.36)} strokeWidth={1.2}
            clipPath={u('cCadera')} />
        </g>
        <g mask={u('mTorso')}>
          <path d={mallaElipse(g.torso, [-0.72, -0.42, -0.12, 0.18, 0.48], [0.5])} fill="none" stroke={rgba(0.36)} strokeWidth={1.2}
            clipPath={u('cTorso')} />
        </g>
        <path d={mallaElipse(g.pecho, [-0.55, -0.15, 0.25, 0.62], [0.5])} fill="none" stroke={rgba(0.4)} strokeWidth={1.2} clipPath={u('cPecho')} />
      </g>

      {/* la pata de este lado, por delante del pecho */}
      {!lame && pata(g.pataCerca, pc, false, empuja)}

      {/* la cabeza: el globo de alambre y la cara */}
      <g mask={lame ? u('mCabeza') : undefined}>
        {relleno(cabeza, 'sil')}
        <g clipPath={u('cCab')}>
          {mallaCabeza(g.cabeza, yaw).map((m, i) => <path key={i} d={m.d} fill="none" stroke={rgba(m.a)} strokeWidth={1.2} />)}
          <path d={elipse(g.hocico)} fill="none" stroke={rgba(0.5)} strokeWidth={1.4} />
        </g>
        {[g.ojoLejos, g.ojoCerca].map((o, i) =>
          o.cerrado ? (
            <path key={i} d={curva(o.arco)} fill="none" stroke={CALOR} strokeWidth={5} strokeLinecap="round" />
          ) : (
            <g key={i}>
              <path d={poli(o.visible)} fill={blanco(0.94)} stroke={CALOR} strokeWidth={2} strokeLinejoin="round" />
              <g clipPath={u(`ojo${i}`)}>
                <path d={elipse(o.pupila)} fill={PUPILA} />
                <circle cx={o.brillo[0]} cy={o.brillo[1]} r={4.5} fill="#fff" />
              </g>
            </g>
          ),
        )}
        <path d={g.bigotes.map(bigote).join(' ')} fill="none" stroke={rgba(0.8)} strokeWidth={1.6} strokeLinecap="round" />
        <path d={poli(g.nariz)} fill={CALOR} stroke={CALOR} strokeWidth={1.5} strokeLinejoin="round" />
        <path d={`M ${f(g.surco[0][0])} ${f(g.surco[0][1])} L ${f(g.surco[1][0])} ${f(g.surco[1][1])}`} stroke={rgba(0.85)} strokeWidth={1.8} />
        <path d={curva(g.boca)} fill="none" stroke="#B8F5FF" strokeWidth={2.8} strokeLinecap="round" />
        {g.lengua && <path d={elipse(g.lengua)} fill={blanco(0.9)} />}
      </g>

      {/* cuando se lame, la pata va delante de la cara */}
      {lame && pata(g.pataCerca, pc, false, 0.5)}
    </g>
  );
};

// ------------------------------------------------------------------ los rótulos
const Placa: React.FC<{x: number; y: number; w: number; h: number; k?: number; destello?: boolean; children?: React.ReactNode}> = ({
  x, y, w, h, k = 1, destello = false, children,
}) => {
  if (k <= 0.001) return null;
  const s = 1 + 0.06 * (1 - k);
  const cx = x + w / 2, cy = y + h / 2;
  return (
    <g opacity={clamp(k * 1.4)} transform={`translate(${f(cx)} ${f(cy)}) scale(${s.toFixed(4)}) translate(${f(-cx)} ${f(-cy)})`}>
      <rect x={x} y={y} width={w} height={h} fill="rgba(1, 10, 16, 0.8)" stroke={destello ? CALOR : rgba(0.5)} strokeWidth={destello ? 2.4 : 1.2} />
      <path d={esquinas(cx, cy, w / 2, h / 2, 14)} fill="none" stroke={destello ? '#fff' : TONO} strokeWidth={2.4} />
      {children}
    </g>
  );
};

// el contador: cada cifra da vueltas y se fija de derecha a izquierda, y la que se fija ya es naranja
const Contador: React.FC<{t: number; t0: number; de: string; a: string; x: number; y: number; tam: number; paso: number; brillo: string}> = ({
  t, t0, de, a, x, y, tam, paso, brillo,
}) => {
  const r = rng(Math.floor(t * 60) * 13 + 7);
  const n = a.length;
  const fija = (i: number) => t0 + paso * (n - 1 - i);
  const todo = t >= fija(0);
  const destello = todo && t < fija(0) + F3;
  const cifras = t < t0
    ? de.split('').map((ch) => ({ch, c: CALOR}))
    : a.split('').map((ch, i) => (t >= fija(i) ? {ch, c: destello ? '#FFFFFF' : ACENTO} : {ch: String(Math.floor(r() * 10)), c: CALOR}));
  return (
    <text x={x} y={y} fontFamily={MONO} fontSize={tam} letterSpacing={4} textAnchor="end" filter={t >= t0 ? brillo : undefined}>
      {cifras.map((q, i) => <tspan key={i} fill={q.c}>{q.ch}</tspan>)}
    </text>
  );
};

const estado = (t: number) =>
  t < 0.6 ? 'OBSERVA' : t < 1.12 ? 'TRAMA ALGO' : t < T_CAE ? 'EMPUJA' : t < 3.28 ? 'MIRA CÓMO CAE' : t < 4.2 ? 'SE ASOMA' : t < 5.0 ? 'INOCENTE' : 'SE LAVA';
const intencion = (t: number): [string, number] =>
  t < 0.62 ? ['BAJA', 0] : t < 1.14 ? ['MEDIA', 0.62] : t < 2.34 ? ['ALTA', 1.14] : t < 3.3 ? ['MÁXIMA', 2.34] : ['NINGUNA', 3.3];
// las veces que mira a cámara, con lo que dice el visor
const MIRADAS: [number, number, string][] = [[0.6, 1.04, 'MIRA A CÁMARA'], [2.34, 2.84, 'MIRA A CÁMARA'], [4.3, 4.98, 'SIN CULPA']];
// los toquecitos: un aro en la taza donde la toca
const TOQUES = [1.43, 1.81, 2.44];
// el contador: empieza a dar vueltas al romperse y la última cifra que se fija es la primera
const PASO_CONTADOR = 0.045;
const T_FIJA = T_SUELO + 3 * PASO_CONTADOR;

// ------------------------------------------------------------------ la escena
export const Holograma: React.FC<{t: number}> = ({t: tt}) => {
  const id = 'hg' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const u = (s: string) => `url(#${id}-${s})`;
  const t = clamp(tt, 0, DUR);
  const g = gato(t);
  const tz = taza(t);
  const cf = cafe(t);
  const tr = trozos(t);
  const vp = vapor(t);
  const rota = t >= T_SUELO;
  const kImp = p(t, T_SUELO, 0.3);
  const fallo = t >= T_SUELO && t < T_SUELO + F3; // tres cuadros, una vez
  const dxFallo = fallo ? (Math.floor(t * 60) % 2 ? 14 : -10) : 0;
  const [sx, sy] = temblor(t, T_SUELO, 0.32, 9, 4);
  const parpadeo = 0.94 + 0.06 * ruido(t * 14, 2); // la luz del holograma no es del todo estable

  // al empezar, el plano de escaneo sube desde la plataforma y va dibujando la escena
  const kScan = E.inOutCubic(p(t, 0.02, 0.6));
  const yScan = mix(1700, 150, kScan);
  const escaneando = kScan < 1;

  // la plataforma: gira despacio; al romperse, se enciende
  const giro = (t * 16 * Math.PI) / 180;
  const marcas = Array.from({length: 48}, (_, i) => {
    const a = (i / 48) * Math.PI * 2 + giro;
    const q0 = enPad(a, PR * 0.9), q1 = enPad(a, PR * (i % 4 === 0 ? 0.975 : 0.935));
    return `M ${f(q0[0])} ${f(q0[1])} L ${f(q1[0])} ${f(q1[1])}`;
  }).join(' ');
  const rayos = Array.from({length: 12}, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - giro * 0.5;
    const q0 = enPad(a, PR * 0.25), q1 = enPad(a, PR * 0.84);
    return `M ${f(q0[0])} ${f(q0[1])} L ${f(q1[0])} ${f(q1[1])}`;
  }).join(' ');
  const encendida = rota ? 1 - kImp : 0;

  // el suelo: líneas que se van al fondo
  const FUGA: P = [PC[0], 980];
  const suelo: string[] = [];
  for (let i = -10; i <= 10; i++) {
    const xs = PC[0] + i * 150;
    const x0 = FUGA[0] + ((xs - FUGA[0]) * (FONDO_SUELO - FUGA[1])) / (1920 - FUGA[1]);
    suelo.push(`M ${f(x0)} ${FONDO_SUELO} L ${f(xs)} 1920`);
  }
  for (let j = 1; j <= 8; j++) {
    const y = FONDO_SUELO + (1920 - FONDO_SUELO) * (j / 8) ** 1.7;
    suelo.push(`M 0 ${f(y)} H 1080`);
  }

  // el polvo que sube por el haz
  const polvo = Array.from({length: 34}, (_, i) => {
    const r = rng(500 + i * 17);
    const x0 = r() * 2 - 1, vel = 50 + r() * 90, fase = r() * 1300, tam = 1.3 + r() * 1.8;
    const sube = (fase + t * vel) % 1300;
    const y = PC[1] - 20 - sube;
    const x = PC[0] + x0 * anchoHaz(y) * 0.88;
    const a = (0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3 + i * 1.7))) * (1 - sube / 1300) * p(sube, 0, 60);
    return <circle key={i} cx={f(x)} cy={f(y)} r={tam} fill={blanco(a)} />;
  });

  // la caída: lo que el visor calcula antes, el rastro de verdad y las tazas fantasma
  const kPrev = p(t, 2.44, 0.2);
  const prevista = kPrev > 0 ? parcial(PREVISTA, kPrev) : [];
  const vaPrevista = 1 - p(t, T_SUELO, 0.25);
  const kMira = E.outCubic(p(t, 2.56, 0.2));
  const rastro: P[] = [];
  if (t >= T_CAE) for (let s = T_CAE; s <= Math.min(t, T_SUELO - 1e-6) + 1e-9; s += 1 / 120) rastro.push(taza(s).c);
  const marcasRastro: string[] = [];
  for (let s = T_CAE + 0.05; s <= Math.min(t, T_SUELO - 0.01); s += 0.05) {
    const a = taza(s - 0.004).c, b = taza(s + 0.004).c, c = taza(s).c;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    marcasRastro.push(`M ${f(c[0] - nx * 12)} ${f(c[1] - ny * 12)} L ${f(c[0] + nx * 12)} ${f(c[1] + ny * 12)}`);
  }
  const vaRastro = 1 - p(t, T_SUELO + 0.15, 0.7);
  const fantasmas = t < T_SUELO ? [0.05, 0.1, 0.15, 0.2].filter((d) => t - d >= T_CAE).map((d) => ({d, tz: taza(t - d)})) : [];
  const cafeEnTaza = 1 - p(t, T_CAE + 0.04, 0.12);

  // el café: el chorro en tramos
  const chorro = cf.gotas.filter((d) => d.i < 100);
  const tramos: P[][] = [];
  chorro.forEach((d, i) => {
    if (i === 0 || Math.hypot(d.c[0] - chorro[i - 1].c[0], d.c[1] - chorro[i - 1].c[1]) > 90) tramos.push([]);
    tramos[tramos.length - 1].push(d.c);
  });

  // ---- los rótulos
  const [valor, desde] = intencion(t);
  const nVis = Math.round(kf(t, [[0.42, 0], [0.62, 2], [0.66, 2], [0.8, 5], [1.14, 5], [1.3, 8], [2.34, 8], [2.44, 10], [3.16, 10], [3.3, 0]]));
  const cambia = t >= desde && t < desde + F3 && desde > 0;
  const maxima = valor === 'MÁXIMA';
  const aparece = (t0: number) => E.outCubic(p(t, t0, 0.2));
  const destello = (t0: number) => t >= t0 + 0.2 && t < t0 + 0.2 + F3;

  // la placa del gato, con su guía hasta la oreja
  const orejaAncla = enMundo([mix(g.orejaCerca.punta[0], g.orejaCerca.bc[0], 0.22), mix(g.orejaCerca.punta[1], g.orejaCerca.bc[1], 0.22)]);
  const codoSujeto: P = [Math.min(orejaAncla[0] - 40, 640), 290];
  const kGuiaSujeto = E.inOutCubic(p(t, 0.42, 0.25));
  const guiaSujeto = kGuiaSujeto > 0 ? parcial([orejaAncla, codoSujeto, ...(codoSujeto[0] > 400 ? [[400, 290] as P] : [])], kGuiaSujeto) : [];

  // el cerco de la cara cuando te mira
  const mirada = MIRADAS.find(([a, b]) => t >= a && t < b + 0.14);
  const H = enMundo(g.cabeza.c);
  const cerco = mirada ? (() => {
    const [a, b, txt] = mirada;
    const k = E.outCubic(p(t, a, 0.2));
    const sale = p(t, b, 0.14);
    const hw = g.cabeza.rx * 1.14 + 18, hh = g.cabeza.ry * 1.14 + 16;
    const c: P = [H[0], H[1] + 10];
    return {k, sale, hw, hh, c, txt, flash: t >= a + 0.2 && t < a + 0.2 + F3, kTxt: p(t, a + 0.1, 0.14) * (1 - sale)};
  })() : null;

  // la placa de la taza: su temperatura, lo que le queda al borde y, al caer, cuánto le falta para el suelo
  const kPlacaTaza = aparece(0.55) * (1 - p(t, T_SUELO + 0.06, 0.14)); // se va antes de que se asome (sus bigotes llegan ahí)
  const kOtra = aparece(5.3); // al final, el visor ya apunta a la siguiente
  const alBorde = Math.max(0, BORDE - tz.c[0]) / PX_M;
  let anclaTaza: P | null = null;
  if (t < T_CAE) anclaTaza = [tz.c[0] + 28, tz.c[1] - 36];
  else if (t < T_SUELO) anclaTaza = [tz.c[0] - 88, tz.c[1] - 88];
  const codoTaza: P = [756, 812];
  const kGuiaTaza = E.inOutCubic(p(t, 0.6, 0.2));
  const guiaTaza = anclaTaza && kGuiaTaza > 0 ? parcial([anclaTaza, codoTaza, [776, 812]], kGuiaTaza) : [];
  const lineaTaza = t < T_CAE - 0.02
    ? {txt: `AL BORDE ${coma(alBorde)} m`, caliente: alBorde < 0.005 && Math.floor(t * 10) % 2 === 0}
    : t < T_SUELO ? {txt: `IMPACTO EN ${coma(Math.max(0, T_SUELO - t))} s`, caliente: true} : {txt: 'SEÑAL PERDIDA', caliente: Math.floor(t * 12) % 2 === 0};

  // el cerco que sigue a la taza al caer
  const cercoTaza = t >= T_CAE && t < T_SUELO + 0.12 ? (() => {
    const k = E.outCubic(p(t, T_CAE, 0.16));
    const va = p(t, T_SUELO, 0.12);
    const c = t < T_SUELO ? tz.c : IMPACTO;
    return {c, k, hb: 88 * (1 + 1.5 * va), alfa: (0.4 + 0.6 * k) * (1 - va), flash: t >= T_CAE + 0.16 && t < T_CAE + 0.16 + F3};
  })() : null;

  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id={`${id}-luz`} cx="0.44" cy="0.5" r="0.62">
          <stop offset="0" stopColor="#0A3A4C" stopOpacity={0.9} />
          <stop offset="0.55" stopColor="#041722" stopOpacity={0.6} />
          <stop offset="1" stopColor={ESCENARIO} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-vineta`} cx="0.5" cy="0.52" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.85} />
        </radialGradient>
        <linearGradient id={`${id}-haz`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={TONO} stopOpacity={0.15} />
          <stop offset="0.6" stopColor={TONO} stopOpacity={0.05} />
          <stop offset="1" stopColor={TONO} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-barrido`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={TONO} stopOpacity={0} />
          <stop offset="0.75" stopColor={TONO} stopOpacity={0.06} />
          <stop offset="0.9" stopColor={CALOR} stopOpacity={0.11} />
          <stop offset="1" stopColor={CALOR} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-escaneo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={TONO} stopOpacity={0.3} />
          <stop offset="1" stopColor={TONO} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${id}-golpe`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.35" stopColor={CALOR} stopOpacity={0.45} />
          <stop offset="1" stopColor={TONO} stopOpacity={0} />
        </radialGradient>
        <pattern id={`${id}-puntos`} width={48} height={48} patternUnits="userSpaceOnUse" patternTransform={`translate(${f(-((t * 7) % 48))} ${f(-((t * 3) % 48))})`}>
          <circle cx={24} cy={24} r={1.6} fill={rgba(0.26)} />
        </pattern>
        <pattern id={`${id}-rayas`} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${f((t * 24) % 6)})`}>
          <rect width={6} height={1.4} fill={rgba(0.06)} />
        </pattern>
        <filter id={`${id}-brillo`} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={9} result="ancho" />
          <feGaussianBlur in="SourceGraphic" stdDeviation={2.5} result="cerca" />
          <feMerge>
            <feMergeNode in="ancho" />
            <feMergeNode in="cerca" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${id}-suave`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={4} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`${id}-brilloT`} x="-20%" y="-40%" width="140%" height="180%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={5} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <FiltroSilueta id={`${id}-sil`} linea={LINEA} aLinea={1} aBorde={0.42} aRelleno={0.07} grueso={2.3} />
        <FiltroSilueta id={`${id}-silL`} linea={LINEA} aLinea={0.55} aBorde={0.24} aRelleno={0.04} grueso={2} />
        <FiltroSilueta id={`${id}-silC`} linea="#FFFFFF" aLinea={1} aBorde={0.9} aRelleno={0.16} grueso={2.8} />
        <clipPath id={`${id}-scan`}><rect x={-200} y={yScan} width={1480} height={2400} /></clipPath>
        {[[470, 90], [1370, 70], [1030, 26]].map(([y, h], i) => (
          <clipPath key={i} id={`${id}-banda${i}`}><rect x={-200} y={y} width={1480} height={h} /></clipPath>
        ))}
      </defs>

      <rect width={1080} height={1920} fill={ESCENARIO} />
      <g id={`${id}-escena`} transform={`translate(${f(sx + dxFallo)} ${f(sy)})`}>
        <rect x={-40} y={-40} width={1160} height={2000} fill={u('luz')} />
        <rect x={-40} y={-40} width={1160} height={2000} fill={u('puntos')} opacity={0.8} />

        <g clipPath={escaneando ? u('scan') : undefined}>
          {/* la cocina de fondo, apagada */}
          <g filter={u('suave')}>{LEJOS}</g>

          {/* el suelo y la pared */}
          <line x1={0} y1={FONDO_SUELO} x2={1080} y2={FONDO_SUELO} stroke={rgba(0.5)} strokeWidth={1.6} />
          <path d={suelo.join(' ')} stroke={rgba(0.16)} strokeWidth={1.2} fill="none" />

          {/* el haz del proyector y el polvo */}
          <path d={`M ${f(PC[0] - PR * 0.9)} ${PC[1]} L ${PC[0] - 300} ${HAZ_ARRIBA} L ${PC[0] + 300} ${HAZ_ARRIBA} L ${f(PC[0] + PR * 0.9)} ${PC[1]} Z`}
            fill={u('haz')} />
          {polvo}

          {/* la plataforma */}
          <g filter={u('suave')} fill="none">
            <ellipse cx={PC[0]} cy={PC[1]} rx={PR} ry={PR * PK} stroke={rgba(0.4)} strokeWidth={1.4} />
            <path d={marcas} stroke={rgba(0.55 + 0.4 * encendida)} strokeWidth={1.4} />
            <ellipse cx={PC[0]} cy={PC[1]} rx={PR * 0.86} ry={PR * 0.86 * PK} stroke={CALOR} strokeOpacity={0.5 + 0.45 * encendida} strokeWidth={2 + 2 * encendida} />
            <ellipse cx={PC[0]} cy={PC[1]} rx={PR * 0.7} ry={PR * 0.7 * PK} stroke={rgba(0.5)} strokeWidth={1.4} strokeDasharray="16 12"
              strokeDashoffset={f(-t * 60)} />
            <path d={rayos} stroke={rgba(0.16)} strokeWidth={1.2} />
            <ellipse cx={PC[0]} cy={PC[1]} rx={PR * 0.42} ry={PR * 0.42 * PK} fill={rgba(0.07)} stroke={rgba(0.45)} strokeWidth={1.3} />
            <ellipse cx={PC[0]} cy={PC[1]} rx={PR * 0.2} ry={PR * 0.2 * PK} stroke={rgba(0.5)} strokeWidth={1.2} />
          </g>

          {/* la mesa y el comedero */}
          <g filter={u('suave')}>{MESA}</g>

          {/* lo que calcula el visor antes de que caiga: la trayectoria y el punto del suelo */}
          {prevista.length > 1 && vaPrevista > 0 && (
            <path d={curva(prevista)} fill="none" stroke={rgba(0.95 * vaPrevista)} strokeWidth={2.6} strokeDasharray="10 9" filter={u('suave')} />
          )}
          {kMira > 0 && t < T_SUELO + 0.02 && (() => {
            const late = 1 + (t > T_CAE ? 0.08 : 0.04) * Math.sin(t * (t > T_CAE ? 60 : 24));
            const rx = 66 * (1 + 1.2 * (1 - kMira)) * late;
            const cx = IMPACTO[0], cy = SUELO + 2;
            const marcasMira = [0, 1, 2, 3].map((i) => {
              const a = (i * Math.PI) / 2;
              const q0: P = [cx + Math.cos(a) * rx, cy + Math.sin(a) * rx * 0.16], q1: P = [cx + Math.cos(a) * (rx + 16), cy + Math.sin(a) * (rx + 16) * 0.16];
              return `M ${f(q0[0])} ${f(q0[1])} L ${f(q1[0])} ${f(q1[1])}`;
            }).join(' ');
            const col = t > T_CAE && Math.floor(t * 20) % 2 === 0 ? CALOR : TONO;
            return (
              <g opacity={kMira} fill="none" filter={u('suave')}>
                <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.16} stroke={col} strokeWidth={2.2} />
                <ellipse cx={cx} cy={cy} rx={rx * 0.45} ry={rx * 0.45 * 0.16} stroke={rgba(0.7)} strokeWidth={1.4} />
                <path d={marcasMira} stroke={col} strokeWidth={2.2} />
                <line x1={cx} y1={cy - 34} x2={cx} y2={cy - 6} stroke={rgba(0.6)} strokeWidth={1.4} />
              </g>
            );
          })()}

          {/* en el suelo: el charco con sus ondas y las manchas */}
          {cf.charco && (
            <g fill="none" filter={u('suave')}>
              <ellipse cx={cf.charco.c[0]} cy={cf.charco.c[1]} rx={cf.charco.rx} ry={cf.charco.ry * 1.2} fill={rgba(0.14)} stroke={rgba(0.85)} strokeWidth={1.8} />
              {[0, 1, 2].map((j) => {
                const kk = ((t - T_SUELO) * 1.3 + j / 3) % 1;
                return (
                  <ellipse key={j} cx={cf.charco!.c[0]} cy={cf.charco!.c[1]} rx={cf.charco!.rx * (0.2 + 0.75 * kk)} ry={cf.charco!.ry * 1.2 * (0.2 + 0.75 * kk)}
                    stroke={blanco((1 - kk) * 0.55)} strokeWidth={1.2} />
                );
              })}
            </g>
          )}
          {cf.manchas.map((s) => (
            <ellipse key={s.i} cx={s.c[0]} cy={s.c[1] + 2} rx={s.rx} ry={s.ry * 1.3} fill={rgba(0.12)} stroke={rgba(0.6)} strokeWidth={1.2} />
          ))}

          {/* la onda en la plataforma cuando se rompe */}
          {rota && [0, 0.1].map((d) => {
            const k = p(t, T_SUELO + d, 0.6);
            if (k <= 0 || k >= 1) return null;
            const rx = 24 + 560 * E.outCubic(k);
            return <ellipse key={d} cx={IMPACTO[0]} cy={SUELO + 4} rx={rx} ry={rx * PK} fill="none" stroke={CALOR} strokeOpacity={0.9 * (1 - k) ** 1.4}
              strokeWidth={1 + 3 * (1 - k)} />;
          })}

          {/* el vapor */}
          <g filter={u('suave')}>
            {vp.map((h, i) => (
              <path key={i} d={curva(h.pts)} fill="none" stroke={rgba(0.75 * h.alfa)} strokeWidth={1.6} strokeDasharray="10 7" strokeLinecap="round" />
            ))}
          </g>

          {/* la caída: el rastro escaneado, las tazas fantasma y la taza */}
          {rastro.length > 1 && vaRastro > 0 && (
            <g opacity={vaRastro}>
              <path d={poli(rastro, false)} fill="none" stroke={blanco(0.6)} strokeWidth={2.2} />
              <path d={marcasRastro.join(' ')} stroke={rgba(0.8)} strokeWidth={1.6} />
            </g>
          )}
          {fantasmas.map(({d, tz: fz}) => {
            const pz = piezasTaza(fz);
            return (
              <g key={d} fill="none" stroke={rgba(0.55 * (1 - d / 0.25))} strokeWidth={1.6} strokeLinejoin="round">
                <path d={poli(pz.cuerpo)} />
                <path d={poli(pz.asaFuera, false)} />
              </g>
            );
          })}
          {tz.estado !== 'suelo' && <g filter={u('brillo')}>{tazaHolo(tz.c, tz.ang, cafeEnTaza)}</g>}

          {/* los toquecitos: un aro donde la pata toca la taza */}
          {TOQUES.map((tp) => {
            const k = p(t, tp, 0.3);
            if (k <= 0 || k >= 1) return null;
            const c = taza(tp).c;
            return <circle key={tp} cx={c[0] - 54} cy={c[1] + 6} r={8 + 46 * E.outCubic(k)} fill="none" stroke={CALOR} strokeOpacity={1 - k} strokeWidth={2.4} />;
          })}

          {/* EL GATO */}
          <g transform={TRANSFORMA_GATO}>
            <g filter={u('brillo')} opacity={parpadeo}>
              <GatoHolo g={g} t={t} id={id} />
            </g>
          </g>

          {/* el café: el chorro en arco, las gotas y la corona al romperse */}
          <g filter={u('brillo')}>
            {tramos.filter((q) => q.length > 1).map((q, i) => (
              <path key={i} d={curva(q)} fill="none" stroke={blanco(0.85)} strokeWidth={5} strokeLinecap="round" />
            ))}
            {cf.gotas.map((d) => <circle key={d.i} cx={f(d.c[0])} cy={f(d.c[1])} r={d.r * 0.6} fill={blanco(0.92)} />)}
          </g>

          {/* los trozos: al rojo blanco y se enfrían al cian */}
          {tr.length > 0 && (
            <g filter={u('brillo')} strokeLinejoin="round">
              {tr.map((q) => (
                <path key={q.n} d={poli(q.pts)} fill={rgba(0.12)} stroke={LINEA} strokeWidth={2.4} />
              ))}
              <g opacity={1 - p(t, T_SUELO + 0.08, 0.5)}>
                {tr.map((q) => <path key={q.n} d={poli(q.pts)} fill="none" stroke="#FFFFFF" strokeWidth={3} />)}
              </g>
            </g>
          )}

          {/* el golpe */}
          {rota && kImp < 1 && (
            <circle cx={IMPACTO[0]} cy={SUELO - 20} r={50 + 300 * E.outCubic(kImp)} fill={u('golpe')} opacity={(1 - kImp) ** 2} />
          )}
        </g>

        {/* el plano de escaneo, al empezar */}
        {escaneando && (
          <g>
            <rect x={0} y={yScan} width={1080} height={140} fill={u('escaneo')} />
            <rect x={0} y={yScan - 2} width={1080} height={4} fill={CALOR} filter={u('brillo')} />
          </g>
        )}

        {/* el barrido de la imagen y las rayas */}
        <rect x={-40} y={((t / 2.4) % 1) * 2200 - 280} width={1160} height={160} fill={u('barrido')} />
        <rect x={-40} y={-40} width={1160} height={2000} fill={u('rayas')} />
      </g>

      <rect width={1080} height={1920} fill={u('vineta')} />

      {/* ---------------- los rótulos, por delante y quietos */}
      <g fontFamily={RAJDHANI}>
        {/* las esquinas y las reglas */}
        {[[44, 64, 1, 1], [1036, 64, -1, 1], [44, 1856, 1, -1], [1036, 1856, -1, -1]].map(([x, y, sx2, sy2], i) => (
          <path key={i} d={`M ${x} ${y + sy2 * 46} V ${y} H ${x + sx2 * 46}`} fill="none" stroke={rgba(0.7)} strokeWidth={2.4} />
        ))}
        {[54, 1026].map((x, i) => (
          <path key={x} d={Array.from({length: 37}, (_, j) => {
            const y = 420 + j * 30 + ((t * (i ? -9 : 9)) % 30);
            return `M ${x} ${f(y)} h ${(i ? -1 : 1) * (j % 5 === 0 ? 14 : 7)}`;
          }).join(' ')} stroke={rgba(0.3)} strokeWidth={1.2} />
        ))}

        <Placa x={70} y={96} w={380} h={92} k={aparece(0.08)} destello={destello(0.08)}>
          <text x={92} y={144} fontSize={38} fontWeight={600} letterSpacing={4} fill={CALOR}>COCINA // PISO 03</text>
          <text x={92} y={174} fontFamily={MONO} fontSize={20} letterSpacing={2} fill={rgba(0.75)}>HOLO-SIM v2.6 · EN DIRECTO</text>
        </Placa>
        <g opacity={aparece(0.1)}>
          <circle cx={866} cy={128} r={8} fill={Math.floor(t * 2) % 2 ? '#FF4D4D' : 'rgba(255,77,77,0.25)'} />
          <text x={884} y={137} fontFamily={MONO} fontSize={24} letterSpacing={2} fill={rgba(0.75)}>REC</text>
          <text x={1008} y={172} fontFamily={MONO} fontSize={18} letterSpacing={2} textAnchor="end" fill={rgba(0.5)}>CÁM 01 · ALZADO</text>
        </g>

        {/* el gato: su placa y la guía hasta la oreja */}
        {guiaSujeto.length > 1 && (
          <g>
            <path d={poli(guiaSujeto, false)} fill="none" stroke={rgba(0.8)} strokeWidth={1.6} />
            <circle cx={orejaAncla[0]} cy={orejaAncla[1]} r={7} fill="none" stroke={CALOR} strokeWidth={2} />
          </g>
        )}
        <Placa x={70} y={222} w={330} h={90} k={aparece(0.3)} destello={destello(0.3)}>
          <text x={92} y={268} fontSize={36} fontWeight={600} letterSpacing={3} fill={CALOR}>SUJETO: GATO_01</text>
          <text x={92} y={296} fontFamily={MONO} fontSize={19} letterSpacing={1.5} fill={rgba(0.75)}>{`ESTADO · ${estado(t)}`}</text>
        </Placa>

        {/* la intención: sube, se pasa al empujar y, rota la taza, ninguna */}
        <Placa x={690} y={222} w={320} h={100} k={aparece(0.4)} destello={destello(0.4) || cambia}>
          <text x={712} y={266} fontSize={32} fontWeight={600} letterSpacing={3} fill={rgba(0.85)}>
            INTENCIÓN: <tspan fill={cambia ? '#FFFFFF' : CALOR}>{valor}</tspan>
          </text>
          {Array.from({length: 10}, (_, i) => {
            const on = i < nVis;
            const late = maxima && on && Math.floor(t * 10 + i * 0.5) % 2 === 0;
            return <rect key={i} x={712 + i * 28} y={282} width={24} height={20} fill={on ? (late ? CALOR : TONO) : rgba(0.1)} fillOpacity={on ? 0.9 : 1}
              stroke={rgba(0.4)} strokeWidth={1} />;
          })}
        </Placa>

        {/* cuando te mira: el cerco se fija en su cara */}
        {cerco && (
          <g>
            <g opacity={(0.35 + 0.65 * cerco.k) * (1 - cerco.sale)}
              transform={`translate(${f(cerco.c[0])} ${f(cerco.c[1])}) rotate(${f(45 * (1 - cerco.k))}) scale(${(1 + 0.7 * (1 - cerco.k)).toFixed(3)}) translate(${f(-cerco.c[0])} ${f(-cerco.c[1])})`}>
              <path d={esquinas(cerco.c[0], cerco.c[1], cerco.hw, cerco.hh, 34)} fill="none" stroke={cerco.flash ? '#FFFFFF' : TONO}
                strokeWidth={cerco.flash ? 4.5 : 3} />
            </g>
            {cerco.kTxt > 0 && (
              <g>
                <path d={`M ${f(cerco.c[0] + cerco.hw)} ${f(cerco.c[1] - cerco.hh)} L 736 392`} fill="none" stroke={rgba(0.8 * cerco.kTxt)} strokeWidth={1.6} />
                <Placa x={716} y={342} w={292} h={50} k={cerco.kTxt}>
                  <text x={736} y={377} fontSize={29} fontWeight={600} letterSpacing={3} fill={CALOR}>{cerco.txt}</text>
                </Placa>
              </g>
            )}
          </g>
        )}

        {/* la taza: su placa y su guía; al caer, el cerco la sigue */}
        {kPlacaTaza > 0 && guiaTaza.length > 1 && (
          <g opacity={kPlacaTaza}>
            <path d={poli(guiaTaza, false)} fill="none" stroke={rgba(0.8)} strokeWidth={1.6} />
            {anclaTaza && <circle cx={anclaTaza[0]} cy={anclaTaza[1]} r={7} fill="none" stroke={CALOR} strokeWidth={2} />}
          </g>
        )}
        {cercoTaza && (
          <g opacity={cercoTaza.alfa}
            transform={`translate(${f(cercoTaza.c[0])} ${f(cercoTaza.c[1])}) rotate(${f(45 * (1 - cercoTaza.k))}) scale(${(1 + 0.7 * (1 - cercoTaza.k)).toFixed(3)}) translate(${f(-cercoTaza.c[0])} ${f(-cercoTaza.c[1])})`}>
            <path d={esquinas(cercoTaza.c[0], cercoTaza.c[1], cercoTaza.hb, cercoTaza.hb, 26)} fill="none" stroke={cercoTaza.flash ? '#FFFFFF' : CALOR}
              strokeWidth={cercoTaza.flash ? 4.5 : 3} />
          </g>
        )}
        <Placa x={776} y={770} w={234} h={84} k={kPlacaTaza} destello={destello(0.55)}>
          <text x={796} y={808} fontSize={32} fontWeight={600} letterSpacing={3} fill={CALOR}>TAZA · 68 °C</text>
          <text x={796} y={838} fontFamily={MONO} fontSize={19} letterSpacing={1.5} fill={lineaTaza.caliente ? CALOR : rgba(0.75)}>{lineaTaza.txt}</text>
        </Placa>
        {/* al final, el visor ya tiene la siguiente */}
        {kOtra > 0 && (
          <g>
            <g opacity={kOtra}
              transform={`translate(866 637) rotate(${f(45 * (1 - kOtra))}) scale(${(1 + 0.8 * (1 - kOtra)).toFixed(3)}) translate(-866 -637)`}>
              <path d={esquinas(866, 637, 50, 46, 16)} fill="none" stroke={destello(5.3) ? '#FFFFFF' : CALOR} strokeWidth={2.6} />
            </g>
            <line x1={866} y1={683} x2={866} y2={770} stroke={rgba(0.8 * kOtra)} strokeWidth={1.6} />
            <Placa x={776} y={770} w={234} h={84} k={kOtra} destello={destello(5.3)}>
              <text x={796} y={808} fontSize={32} fontWeight={600} letterSpacing={3} fill={CALOR}>TAZA_02</text>
              <text x={796} y={838} fontFamily={MONO} fontSize={19} letterSpacing={1.5} fill={rgba(0.75)}>SIGUIENTE OBJETIVO</text>
            </Placa>
          </g>
        )}

        {/* el contador: rota la taza, da vueltas y se fija en naranja */}
        {rota && (() => {
          const k = E.inOutCubic(p(t, T_SUELO + 0.03, 0.12));
          const ancla: P = [IMPACTO[0], SUELO + 4];
          const guia = parcial([ancla, [ancla[0], 1702]], k);
          return (
            <g>
              <path d={poli(guia, false)} fill="none" stroke={rgba(0.85)} strokeWidth={1.6} />
              <circle cx={ancla[0]} cy={ancla[1]} r={9} fill="none" stroke={CALOR} strokeWidth={2.2} />
            </g>
          );
        })()}
        <Placa x={540} y={1702} w={470} h={100} k={aparece(0.5)} destello={destello(0.5) || (t >= T_SUELO && t < T_SUELO + F3) || (t >= T_FIJA && t < T_FIJA + F3)}>
          <text x={562} y={1746} fontSize={34} fontWeight={600} letterSpacing={3} fill={rgba(0.95)}>TAZAS ROTAS</text>
          <text x={562} y={1780} fontFamily={MONO} fontSize={18} letterSpacing={1.5} fill={rgba(0.6)}>REGISTRO · GATO_01</text>
          <Contador t={t} t0={T_SUELO} de="0046" a="0047" x={994} y={1778} tam={62} paso={PASO_CONTADOR} brillo={u('brilloT')} />
        </Placa>

        {/* la telemetría */}
        <g opacity={aparece(0.2)}>
          <text x={70} y={1792} fontFamily={MONO} fontSize={22} letterSpacing={2} fill={rgba(0.7)}>g = 9,81 m/s²  ·  h = 0,75 m</text>
          <text x={70} y={1826} fontFamily={MONO} fontSize={18} letterSpacing={2} fill={rgba(0.45)}>{`T+${coma(t)}  ·  60 FPS  ·  CAPA 2/3`}</text>
        </g>
      </g>

      {/* el fallo de imagen: tres cuadros, una vez, al romperse */}
      {fallo && (
        <g>
          <rect width={1080} height={1920} fill={TONO} opacity={0.13} />
          {[38, -46, 70].map((dx, i) => (
            <g key={i} clipPath={u(`banda${i}`)}>
              <rect x={0} y={0} width={1080} height={1920} fill={ESCENARIO} />
              <use href={`#${id}-escena`} transform={`translate(${dx} 0)`} />
            </g>
          ))}
          <rect x={0} y={H[1] + 60} width={1080} height={6} fill={CALOR} opacity={0.65} />
          <rect x={0} y={1452} width={1080} height={3} fill={CALOR} opacity={0.5} />
        </g>
      )}
    </svg>
  );
};
