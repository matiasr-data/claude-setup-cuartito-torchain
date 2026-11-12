import React, {useId} from 'react';
import {loadFont as cargarTilt} from '@remotion/google-fonts/TiltNeon';
import {E, clamp, mix, p, rng, ruido, temblor} from '../../comun/curvas';
import {
  DUR, FONDO_SUELO, IMPACTO, MESA_Y, SUELO, TRANSFORMA_GATO, T_CAE, T_SUELO, bigote, cabezaTrazos, cafe, cinta, cuerpoTrazos, curva,
  elipse, gato, oreja, pataTrazos, piezasTaza, poli, rot, suma, taza, trozos, vapor, type Gato, type Ojo, type P,
} from './escena';

// EL GATO EN 2 · NEÓN CYBERPUNK. La cocina del gato
// de noche, con la megaciudad lluviosa en la ventana de detrás. El gato es una silueta oscura con luz de borde rosa
// por detrás y cian por delante, collar de neón, bigotes de luz y ojos que brillan (más cuando te mira, con un destello). La taza es
// de cerámica oscura con su filo de neón rosa y una franja cian; el vapor, iluminado. El letrero «CAFÉ 24/7» parpadea. La encimera
// y el suelo, mojados: lo reflejan todo. Al caer, la taza deja una estela de luz (como una foto de larga exposición); al romperse,
// fogonazo, chispas de neón, sube la tensión de todos los tubos, el letrero se va un momento y el café queda como un charco oscuro
// que refleja los neones. Al empezar, los neones se encienden parpadeando alrededor de sus ojos.

const {fontFamily: NEON} = cargarTilt('normal', {weights: ['400'], subsets: ['latin']});

const ROSA = '#FF2BD6';
const CIAN = '#2BF0FF';
const VIOLETA = '#8E5BFF';
const NOCHE = '#07020F';
const SILUETA = '#0A0614';
const NUCLEO_ROSA = '#FFE3FA';
const NUCLEO_CIAN = '#E6FEFF';
const OJO = '#D4FF3F'; // los ojos: el verde amarillo de los ojos de gato en la oscuridad, lo único de ese color
const NUCLEO_OJO = '#FBFFE2';
const AMBAR = '#FF9A3C'; // el café
const NUCLEO_AMBAR = '#FFE5C2';

const F = FONDO_SUELO; // donde la pared toca el suelo
const TECHO = 228;
const Y_TUBO = 250;
const TOPE = MESA_Y + 28; // la encimera: su cara de arriba (mojada, refleja) va de MESA_Y a TOPE, y su canto de TOPE a LABIO
const LABIO = TOPE + 20;
const ZOCALO_MUEBLE = SUELO - 30;
const CAJON = LABIO + 112; // donde acaba la fila de cajones
const PUERTAS: [number, number][] = [[-20, 232], [238, 478], [484, 716]];
const TIRADORES = PUERTAS.map(([a, b], i) => (i === 1 ? a + 30 : b - 30));
const Y_ZOCALO = FONDO_SUELO - 34;
const SX = 870; // el centro del letrero
const TUBO_X = 1012; // el tubo cian de la pared derecha

// ---------------------------------------------------------------- tiempo
// un neón que se enciende: apagado, unos golpes y fijo
const enciende = (t: number, t0: number, dur: number, semilla: number) => {
  if (t < t0) return 0.06;
  if (t >= t0 + dur) return 1;
  const paso = Math.floor(((t - t0) / dur) * 8);
  if (paso >= 7) return 1;
  return rng(semilla * 31 + paso * 7 + 1)() < 0.5 ? 0.1 : 0.92;
};
// un zumbido: casi siempre encendido y, en sus ráfagas, a golpes
const zumbido = (t: number, semilla: number, rafagas: [number, number][]) => {
  for (const [a, b] of rafagas) {
    if (t >= a && t < b) {
      const r = rng(Math.floor(t * 30) * 13 + semilla)();
      return r < 0.42 ? 0.08 : r < 0.6 ? 0.5 : 1;
    }
  }
  return 1;
};

// ---------------------------------------------------------------- piezas de neón
// un tubo: el halo ancho, el color y el alma blanca. k = lo encendido que está; sube = la oleada del golpe
const Tubo: React.FC<{d: string; color: string; w?: number; k?: number; sube?: number; alma?: string}> = ({d, color, w = 8, k = 1, sube = 0, alma}) => (
  <g>
    <path d={d} fill="none" stroke={color} strokeWidth={w * (3.4 + 1.6 * sube)} strokeOpacity={(0.16 + 0.14 * sube) * k} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeOpacity={0.95 * k} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={alma ?? (color === CIAN ? NUCLEO_CIAN : NUCLEO_ROSA)} strokeWidth={w * 0.38} strokeOpacity={0.95 * k} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
const recta = (x1: number, y1: number, x2: number, y2: number) => `M ${x1} ${y1} L ${x2} ${y2}`;
const f1 = (n: number) => n.toFixed(1);

// ---------------------------------------------------------------- la ventana y su megaciudad (fija: se calcula una vez)
const VX = 56, VY = 296, VW = 590, VH = 588, VB = VY + VH;
const CRUZ_X = VX + 300, CRUZ_Y = VY + 300;
type Rect = {x: number; y: number; w: number; h: number};
type Luz = Rect & {c: string; a: number};
const LUCES = ['#FF7AE6', '#7FF6FF', '#FFC46B', '#B79BFF'];
const CIUDAD = (() => {
  const r = rng(177);
  const lejos: Rect[] = [], medios: Rect[] = [], cerca: Rect[] = [], luces: Luz[] = [], lucesLejos: Luz[] = [], antenas: P[] = [];
  for (let x = VX - 12; x < VX + VW;) {
    const w = 22 + r() * 40, top = VY + 40 + r() * 220;
    lejos.push({x, y: top, w, h: VB - top});
    if (r() < 0.35) antenas.push([x + w / 2, top - 16]);
    for (let yy = top + 8; yy < VB - 8; yy += 11) {
      for (let xx = x + 4; xx < x + w - 4; xx += 8) {
        if (r() < 0.13) lucesLejos.push({x: xx, y: yy, w: 3, h: 5, c: LUCES[Math.floor(r() * 4)], a: 0.25 + r() * 0.3});
      }
    }
    x += w + 1 + r() * 5;
  }
  for (let x = VX - 20; x < VX + VW;) {
    const w = 40 + r() * 60, top = VY + 190 + r() * 200;
    medios.push({x, y: top, w, h: VB - top});
    for (let yy = top + 12; yy < VB - 8; yy += 15) {
      for (let xx = x + 6; xx < x + w - 7; xx += 11) {
        if (r() < 0.26) luces.push({x: xx, y: yy, w: 5, h: 7, c: LUCES[Math.floor(r() * 4)], a: 0.45 + r() * 0.5});
      }
    }
    x += w + 3 + r() * 10;
  }
  // una torre cerca, oscura, abajo a la derecha: así el vapor de la taza se lee contra algo oscuro
  cerca.push({x: VX + 430, y: VY + 360, w: 180, h: VH - 360});
  return {lejos, medios, cerca, luces, lucesLejos, antenas};
})();
const LLUVIA_FUERA = (() => {
  const r = rng(91);
  return Array.from({length: 78}, () => ({x: VX + r() * (VW + 110), y: r() * (VH + 80), n: 9 + Math.floor(r() * 5), l: 26 + r() * 40, a: 0.25 + r() * 0.35}));
})();
const LLUVIA_DENTRO = (() => {
  const r = rng(13);
  return Array.from({length: 46}, () => ({x: -100 + r() * 1500, y: r() * 2100, n: 3 + Math.floor(r() * 3), l: 50 + r() * 70, a: 0.05 + r() * 0.08}));
})();
const COCHES = (() => {
  const r = rng(5);
  return Array.from({length: 7}, (_, i) => ({x: r() * (VW + 80), y: VY + (i % 2 ? 150 : 186) + r() * 14, n: (i % 2 ? -1 : 1) * (1 + Math.floor(r() * 2)), c: i % 3 ? '#FFE9F9' : '#FF4D6D'}));
})();

// ---------------------------------------------------------------- las chispas del golpe
const CHISPAS = (() => {
  const r = rng(303);
  const cols = [ROSA, CIAN, '#FFFFFF', ROSA, CIAN, VIOLETA];
  return Array.from({length: 44}, (_, i) => {
    const a = ((-174 + r() * 168) * Math.PI) / 180;
    const v = 480 + r() * 950;
    return {v: [Math.cos(a) * v, Math.sin(a) * v - 120] as P, x0: IMPACTO[0] + (r() - 0.5) * 40, vida: 0.35 + r() * 0.5, c: cols[i % cols.length], w: 5 + r() * 4.5, t0: T_SUELO + r() * 0.04, suelo: SUELO + 2 + r() * 24};
  });
})();
const G_CHISPA = 2600;
// vuela, toca el suelo y rebota bajito (así las chispas corren por el suelo mojado)
const enChispa = (ch: (typeof CHISPAS)[number], s: number): P => {
  const y0 = SUELO - 18, vy = ch.v[1];
  const th = (-vy + Math.sqrt(vy * vy + 2 * G_CHISPA * (ch.suelo - y0))) / G_CHISPA;
  if (s <= th) return [ch.x0 + ch.v[0] * s, y0 + vy * s + 0.5 * G_CHISPA * s * s];
  const u = s - th, vy2 = -0.32 * (vy + G_CHISPA * th);
  return [ch.x0 + ch.v[0] * th + ch.v[0] * 0.6 * u, Math.min(ch.suelo, ch.suelo + vy2 * u + 0.5 * G_CHISPA * u * u)];
};
// los rayos: un cortocircuito de neón al romperse (tres zigzags que salen del golpe)
const RAYOS = [-150, -95, -35].map((ang, i) => {
  const r = rng(500 + i);
  const pts: P[] = [[IMPACTO[0], SUELO - 16]];
  const u = rot([1, 0], (ang * Math.PI) / 180);
  for (let j = 1; j <= 6; j++) {
    const base = suma([IMPACTO[0], SUELO - 16], [u[0] * j * 34, u[1] * j * 34]);
    pts.push(suma(base, [(r() - 0.5) * 30, (r() - 0.5) * 30]));
  }
  return pts;
});

// ---------------------------------------------------------------- la taza
const enTaza = (tz: {c: P; ang: number}, q: P) => suma(tz.c, rot(q, tz.ang));
const TazaNeon: React.FC<{tz: {c: P; ang: number}; url: (n: string) => string; sube: number}> = ({tz, url, sube}) => {
  const pz = piezasTaza(tz);
  const franja = poli([enTaza(tz, [-52, 6]), enTaza(tz, [52, 6])], false);
  return (
    <g>
      <path d={poli(pz.asa)} fill="#120A1F" />
      <Tubo d={poli(pz.asa)} color={ROSA} w={4.5} sube={sube} />
      <path d={poli(pz.cuerpo)} fill={url('taza')} />
      <Tubo d={poli(pz.cuerpo)} color={ROSA} w={5.5} sube={sube} />
      <Tubo d={franja} color={CIAN} w={4.5} sube={sube} />
      <Tubo d={poli([...pz.borde], false)} color={ROSA} w={7} sube={sube} alma="#FFFFFF" />
    </g>
  );
};
const TazaFantasma: React.FC<{tz: {c: P; ang: number}; op: number}> = ({tz, op}) => {
  const pz = piezasTaza(tz);
  return (
    <g opacity={op} fill="none" strokeLinejoin="round">
      <path d={poli(pz.cuerpo)} stroke={ROSA} strokeWidth={5} />
      <path d={poli(pz.asa)} stroke={ROSA} strokeWidth={3.5} />
      <path d={poli([enTaza(tz, [-52, 6]), enTaza(tz, [52, 6])], false)} stroke={CIAN} strokeWidth={4} />
    </g>
  );
};

// ---------------------------------------------------------------- el gato
// los ojos: una almendra de luz con su rendija oscura; cerrados, un arco de luz
const OjoNeon: React.FC<{o: Ojo; k: number; clip: string; url: (n: string) => string}> = ({o, k, clip, url}) => {
  if (o.cerrado) {
    return (
      <g>
        <path d={curva(o.arco)} fill="none" stroke={OJO} strokeWidth={16} strokeOpacity={0.25 * k} strokeLinecap="round" />
        <path d={curva(o.arco)} fill="none" stroke={NUCLEO_OJO} strokeWidth={6} strokeOpacity={k} strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      <circle cx={o.c[0]} cy={o.c[1]} r={o.rx * 2.4} fill={url('halo-ojo')} opacity={0.75 * k} />
      <path d={poli(o.visible)} fill={url('ojo')} fillOpacity={0.35 + 0.65 * k} />
      <g clipPath={clip}>
        <path d={elipse(o.pupila)} fill="#06030C" />
        <circle cx={o.brillo[0]} cy={o.brillo[1]} r={Math.max(3.5, o.rx * 0.17)} fill="#FFFFFF" opacity={0.95} />
      </g>
      <path d={poli(o.visible)} fill="none" stroke={NUCLEO_OJO} strokeWidth={2.2} strokeOpacity={0.8 * k} strokeLinejoin="round" />
    </g>
  );
};

const GatoNeon: React.FC<{g: Gato; t: number; id: (n: string) => string; url: (n: string) => string; sube: number}> = ({g, t, id, url, sube}) => {
  const lame = t > 4.95;
  // el collar: un aro de neón alrededor del cuello, por debajo de la cabeza, con su chapita
  const [c0, c1] = g.cuello;
  const ejeCuello = [c0[0] - c1[0], c0[1] - c1[1]] as P;
  const lc = Math.hypot(ejeCuello[0], ejeCuello[1]) || 1;
  const u: P = [ejeCuello[0] / lc, ejeCuello[1] / lc]; // hacia el cuerpo
  const n: P = [-u[1], u[0]];
  const cc: P = [mix(c0[0], c1[0], 0.12), mix(c0[1], c1[1], 0.12)];
  const aro: P[] = Array.from({length: 17}, (_, i) => {
    const a = (i / 16) * Math.PI;
    return suma(cc, [n[0] * Math.cos(a) * 64 + u[0] * Math.sin(a) * 15, n[1] * Math.cos(a) * 64 + u[1] * Math.sin(a) * 15]);
  });
  const delante = aro[0][0] > aro[16][0] ? aro[0] : aro[16];
  const chapa = suma(delante, [u[0] * 18 - n[0] * 6, u[1] * 18 - n[1] * 6]); // cuelga en la garganta
  const kOjo = 0.72 + 0.5 * g.giro; // brillan más al mirarte
  // el destello de los ojos cuando te mira con picardía y cuando te mira satisfecho
  const destello = Math.max(0, g.giro - 0.55) / 0.45 * (p(t, 2.36, 0.12) * (1 - p(t, 2.7, 0.14)) + p(t, 4.32, 0.12) * (1 - p(t, 4.7, 0.2)));
  const pataCerca = (
    <g filter={url('borde')}>
      {pataTrazos(g.pataCerca).map((d, i) => <path key={i} d={d} fill={url('pelo')} />)}
    </g>
  );
  return (
    <g>
      {/* lo de detrás: la otra pata, apagada */}
      <g filter={url('borde-lejos')}>
        {pataTrazos(g.pataLejos).map((d, i) => <path key={i} d={d} fill="#08040F" />)}
      </g>
      {/* la silueta: cola, orejas, cuerpo y cabeza en una sola forma, con su luz de borde */}
      <g filter={url('borde')}>
        <path d={cinta(g.cola.pts, g.cola.r)} fill={url('pelo')} />
        <path d={oreja(g.orejaLejos)} fill={url('pelo')} />
        <path d={oreja(g.orejaCerca)} fill={url('pelo')} />
        {cuerpoTrazos(g).map((d, i) => <path key={i} d={d} fill={url('pelo')} />)}
        {cabezaTrazos(g).map((d, i) => <path key={'c' + i} d={d} fill={url('pelo')} />)}
      </g>
      {/* las orejas por dentro, encendidas en rosa */}
      {[g.orejaLejos, g.orejaCerca].map((o, i) => (
        <path key={'od' + i} d={poli(o.dentro)} fill={url('oreja')} opacity={i === 0 ? 0.55 : 0.85} />
      ))}
      {/* el collar */}
      <path d={curva(aro)} fill="none" stroke={ROSA} strokeWidth={22} strokeOpacity={0.18 + 0.12 * sube} strokeLinecap="round" />
      <path d={curva(aro)} fill="none" stroke={ROSA} strokeWidth={8} strokeLinecap="round" />
      <path d={curva(aro)} fill="none" stroke={NUCLEO_ROSA} strokeWidth={3} strokeLinecap="round" />
      <circle cx={chapa[0]} cy={chapa[1]} r={11} fill={CIAN} opacity={0.3} />
      <circle cx={chapa[0]} cy={chapa[1]} r={7} fill={NUCLEO_CIAN} stroke={CIAN} strokeWidth={2.5} />
      {!lame && pataCerca}
      {/* la cara */}
      {([[g.ojoLejos, 0.62], [g.ojoCerca, 1]] as [Ojo, number][]).map(([o, a], i) => (
        <OjoNeon key={'o' + i} o={o} k={kOjo * a} clip={url('ojo' + i)} url={url} />
      ))}
      {destello > 0.01 && [g.ojoLejos, g.ojoCerca].map((o, i) => (
        <g key={'d' + i} opacity={destello}>
          <line x1={o.c[0] - 105} y1={o.c[1]} x2={o.c[0] + 105} y2={o.c[1]} stroke={OJO} strokeWidth={5} strokeOpacity={0.4} strokeLinecap="round" />
          <line x1={o.c[0] - 55} y1={o.c[1]} x2={o.c[0] + 55} y2={o.c[1]} stroke={NUCLEO_OJO} strokeWidth={2.4} strokeLinecap="round" />
          <line x1={o.c[0]} y1={o.c[1] - 36} x2={o.c[0]} y2={o.c[1] + 36} stroke={NUCLEO_OJO} strokeWidth={2} strokeOpacity={0.8} strokeLinecap="round" />
        </g>
      ))}
      <path d={poli(g.nariz)} fill={ROSA} stroke={NUCLEO_ROSA} strokeWidth={2} strokeLinejoin="round" />
      <path d={`M ${f1(g.surco[0][0])} ${f1(g.surco[0][1])} L ${f1(g.surco[1][0])} ${f1(g.surco[1][1])}`} stroke={NUCLEO_ROSA} strokeWidth={2.4} strokeLinecap="round" />
      <path d={curva(g.boca)} fill="none" stroke={ROSA} strokeWidth={11} strokeOpacity={0.3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={curva(g.boca)} fill="none" stroke={NUCLEO_ROSA} strokeWidth={3.8} strokeLinecap="round" strokeLinejoin="round" />
      {/* los bigotes, de luz */}
      {g.bigotes.map((b, i) => (
        <g key={'b' + i}>
          <path d={bigote(b)} fill="none" stroke={CIAN} strokeWidth={7} strokeOpacity={0.22} strokeLinecap="round" />
          <path d={bigote(b)} fill="none" stroke={NUCLEO_CIAN} strokeWidth={2.6} strokeLinecap="round" />
        </g>
      ))}
      {lame && pataCerca}
      {g.lengua && <path d={elipse(g.lengua)} fill={ROSA} stroke={NUCLEO_ROSA} strokeWidth={2} />}
      {/* los recortes de los ojos (en las medidas del gato) */}
      <defs>
        {[g.ojoLejos, g.ojoCerca].map((o, i) => (
          <clipPath key={i} id={id('ojo' + i)}><path d={poli(o.visible)} /></clipPath>
        ))}
      </defs>
    </g>
  );
};

// la luz de borde: un filo fino y una banda ancha y suave que da volumen. Rosa por arriba y por detrás, cian por delante
const FiltrosBorde: React.FC<{id: (n: string) => string}> = ({id}) => (
  <>
    {([['borde', 1, 1], ['borde-lejos', 0.45, 0.4]] as [string, number, number][]).map(([n, aR, aC]) => (
      <filter key={n} id={id(n)} filterUnits="userSpaceOnUse" x={-60} y={120} width={1160} height={1000} colorInterpolationFilters="sRGB">
        <feOffset in="SourceAlpha" dx={6} dy={5} result="o1" />
        <feComposite in="SourceAlpha" in2="o1" operator="out" result="r1" />
        <feGaussianBlur in="r1" stdDeviation={1.3} result="r1b" />
        <feOffset in="SourceAlpha" dx={24} dy={16} result="o1w" />
        <feComposite in="SourceAlpha" in2="o1w" operator="out" result="r1w" />
        <feGaussianBlur in="r1w" stdDeviation={9} result="r1wb" />
        <feFlood floodColor="#FF4FDF" floodOpacity={aR} result="f1" />
        <feComposite in="f1" in2="r1b" operator="in" result="rosaFilo" />
        <feFlood floodColor={ROSA} floodOpacity={0.6 * aR} result="f1w" />
        <feComposite in="f1w" in2="r1wb" operator="in" result="rosaBanda" />
        <feOffset in="SourceAlpha" dx={-7} dy={-2} result="o2" />
        <feComposite in="SourceAlpha" in2="o2" operator="out" result="r2" />
        <feGaussianBlur in="r2" stdDeviation={1.3} result="r2b" />
        <feOffset in="SourceAlpha" dx={-22} dy={-8} result="o2w" />
        <feComposite in="SourceAlpha" in2="o2w" operator="out" result="r2w" />
        <feGaussianBlur in="r2w" stdDeviation={9} result="r2wb" />
        <feFlood floodColor="#5CF6FF" floodOpacity={aC} result="f2" />
        <feComposite in="f2" in2="r2b" operator="in" result="cianFilo" />
        <feFlood floodColor={CIAN} floodOpacity={0.45 * aC} result="f2w" />
        <feComposite in="f2w" in2="r2wb" operator="in" result="cianBanda" />
        <feMerge result="bandas"><feMergeNode in="rosaBanda" /><feMergeNode in="cianBanda" /></feMerge>
        <feMerge result="filos"><feMergeNode in="rosaFilo" /><feMergeNode in="cianFilo" /></feMerge>
        <feComposite in="bandas" in2="SourceAlpha" operator="in" result="bandasDentro" />
        <feComposite in="filos" in2="SourceAlpha" operator="in" result="filosDentro" />
        <feGaussianBlur in="filos" stdDeviation={6} result="halo" />
        <feMerge>
          <feMergeNode in="halo" />
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="bandasDentro" />
          <feMergeNode in="filosDentro" />
        </feMerge>
      </filter>
    ))}
  </>
);

// ---------------------------------------------------------------- un reflejo partido en rayas, como en el suelo mojado
const Raya: React.FC<{x: number; y0: number; y1: number; ancho: number; color: string; a: number; t: number; s: number}> = ({x, y0, y1, ancho, color, a, t, s}) => {
  const out = [];
  for (let y = y0 + 4, j = 0; y < y1; y += 9, j++) {
    const k = (y - y0) / (y1 - y0);
    const w = ancho * (1 - 0.55 * k) * (0.7 + 0.3 * ruido(j * 0.7 + t * 3, s));
    const dx = 7 * ruido(y * 0.04 + t * 2.2, s + 3);
    out.push(<line key={j} x1={x + dx - w / 2} y1={y} x2={x + dx + w / 2} y2={y} stroke={color} strokeWidth={4} strokeOpacity={a * (1 - k) * (0.6 + 0.4 * ruido(j + t * 4, s + 7))} strokeLinecap="round" />);
  }
  return <g>{out}</g>;
};

export const Neon: React.FC<{t: number}> = ({t: tt}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (n: string) => `gneon-${uid}-${n}`;
  const url = (n: string) => `url(#${id(n)})`;

  const t = clamp(tt, 0, DUR);
  const g = gato(t);
  const tz = taza(t);
  const cf = cafe(t);
  const tr = trozos(t);
  const vp = vapor(t);
  const [sx, sy] = temblor(t, T_SUELO, 0.34, 10, 5);
  // la oleada: al romperse sube la tensión de todos los neones y luego se calma
  const oleada = p(t, T_SUELO - 0.03, 0.04) * (1 - E.outCubic(p(t, T_SUELO + 0.02, 0.75)));
  const amb = 0.3 + 0.7 * E.outCubic(p(t, 0.05, 0.55)); // la sala, que se enciende al empezar

  // los neones: se encienden al empezar y zumban de vez en cuando (y todos a la vez al romperse la taza)
  const kTecho = enciende(t, 0.0, 0.28, 1) * zumbido(t, 77, [[5.1, 5.18]]);
  const kCafe = enciende(t, 0.14, 0.34, 2) * zumbido(t, 3, [[3.1, 3.27], [5.32, 5.4]]);
  const k247 = enciende(t, 0.32, 0.4, 3) * zumbido(t, 9, [[1.45, 1.6], [3.12, 3.52], [4.62, 4.72]]);
  const kIcono = enciende(t, 0.22, 0.3, 8);
  const kTubo = enciende(t, 0.06, 0.3, 4) * zumbido(t, 21, [[3.14, 3.22]]);
  const kCanto = enciende(t, 0.2, 0.26, 5);
  const kBalda = enciende(t, 0.26, 0.3, 6);
  const kZocalo = enciende(t, 0.1, 0.3, 7);

  // ------------------------------------------------ la sala (la pared con todo lo suyo): se pinta una vez y se refleja en el suelo
  const sala = (
    <g>
      <rect x={0} y={TECHO} width={1080} height={F - TECHO} fill={url('pared')} />
      <rect x={0} y={TECHO} width={1080} height={F - TECHO} fill={url('azulejo')} />
      <rect x={0} y={TECHO} width={1080} height={420} fill={url('lavado')} opacity={amb} />
      {/* las manchas de luz en la pared */}
      <ellipse cx={SX} cy={450} rx={300} ry={220} fill={url('poza-rosa')} opacity={0.95 * Math.max(kCafe, 0.15)} />
      <ellipse cx={TUBO_X} cy={1110} rx={210} ry={440} fill={url('poza-cian')} opacity={0.9 * kTubo} />
      <ellipse cx={870} cy={760} rx={230} ry={110} fill={url('poza-rosa')} opacity={0.8 * kBalda} />
      <ellipse cx={VX + VW / 2} cy={VB + 30} rx={460} ry={240} fill={url('poza-rosa')} opacity={0.7} />
      <ellipse cx={360} cy={Y_ZOCALO} rx={700} ry={90} fill={url('poza-cian')} opacity={0.8 * kZocalo} />

      {/* la ventana */}
      <g clipPath={url('cristal')}>
        <rect x={VX} y={VY} width={VW} height={VH} fill={url('cielo')} />
        <ellipse cx={VX + 160} cy={VY + 150} rx={240} ry={80} fill={url('bruma-rosa')} />
        <ellipse cx={VX + 430} cy={VY + 240} rx={260} ry={90} fill={url('bruma-cian')} />
        {CIUDAD.lejos.map((b, i) => <rect key={'l' + i} x={b.x} y={b.y} width={b.w} height={b.h} fill="#240C40" opacity={0.85} />)}
        {CIUDAD.lucesLejos.map((l, i) => <rect key={'wl' + i} x={l.x} y={l.y} width={l.w} height={l.h} fill={l.c} opacity={l.a} />)}
        {CIUDAD.antenas.map(([x, y], i) => (
          <g key={'a' + i}>
            <line x1={x} y1={y} x2={x} y2={y + 16} stroke="#240C40" strokeWidth={2} />
            <circle cx={x} cy={y} r={2.8} fill="#FF4D6D" opacity={Math.floor(t * 2 + i) % 2 ? 1 : 0.2} />
          </g>
        ))}
        {/* el tráfico que vuela */}
        {COCHES.map((cc, i) => {
          const xx = VX - 40 + ((((cc.x + (cc.n * (VW + 80) * t) / DUR) % (VW + 80)) + (VW + 80)) % (VW + 80));
          return <rect key={'c' + i} x={xx} y={cc.y} width={16} height={4} rx={2} fill={cc.c} />;
        })}
        {CIUDAD.medios.map((b, i) => <rect key={'m' + i} x={b.x} y={b.y} width={b.w} height={b.h} fill="#13052A" />)}
        {CIUDAD.luces.map((l, i) => <rect key={'w' + i} x={l.x} y={l.y} width={l.w} height={l.h} fill={l.c} opacity={l.a} />)}
        {/* la valla «MIAU» y el hotel en vertical */}
        <rect x={VX + 26} y={VY + 64} width={168} height={76} rx={5} fill="#160828" />
        <rect x={VX + 26} y={VY + 64} width={168} height={76} rx={5} fill={url('valla')} opacity={0.22} />
        <rect x={VX + 26} y={VY + 64} width={168} height={76} rx={5} fill="none" stroke={url('valla')} strokeWidth={3} />
        <text x={VX + 110} y={VY + 118} fontFamily={NEON} fontSize={44} letterSpacing={4} fill={NUCLEO_CIAN} stroke={CIAN} strokeWidth={1.2} textAnchor="middle">MIAU</text>
        <rect x={VX + 24} y={VY + 214} width={36} height={176} rx={4} fill="#0A0418" />
        <rect x={VX + 24} y={VY + 214} width={36} height={176} rx={4} fill="none" stroke={ROSA} strokeWidth={3} />
        {'HOTEL'.split('').map((ch, i) => (
          <text key={ch + i} x={VX + 42} y={VY + 248 + i * 32} fontFamily={NEON} fontSize={29} fill={NUCLEO_ROSA} stroke={ROSA} strokeWidth={1.4} textAnchor="middle">{ch}</text>
        ))}
        {CIUDAD.cerca.map((b, i) => (
          <g key={'ce' + i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#090314" />
            <rect x={b.x} y={b.y} width={b.w} height={2} fill={CIAN} opacity={0.55} />
          </g>
        ))}
        {/* la lluvia de fuera, sin costura */}
        {LLUVIA_FUERA.map((gg, i) => {
          const largo = VH + 80;
          const y = VY - 60 + ((gg.y + (gg.n * largo * t) / DUR) % largo);
          const x = gg.x - 0.2 * (y - VY);
          return <line key={'g' + i} x1={x} y1={y} x2={x - 0.2 * gg.l} y2={y + gg.l} stroke="#E4D6FF" strokeOpacity={gg.a} strokeWidth={1.5} />;
        })}
        <path d={`M ${VX + 40} ${VY} L ${VX + 200} ${VY} L ${VX - 40} ${VB} L ${VX - 200} ${VB} Z`} fill="#FFFFFF" opacity={0.04} />
        <path d={`M ${VX + 360} ${VY} L ${VX + 420} ${VY} L ${VX + 180} ${VB} L ${VX + 120} ${VB} Z`} fill="#FFFFFF" opacity={0.03} />
      </g>
      <rect x={VX} y={VY} width={VW} height={VH} rx={6} fill="none" stroke="#0A0414" strokeWidth={22} />
      <path d={`M ${CRUZ_X} ${VY} V ${VB} M ${VX} ${CRUZ_Y} H ${VX + VW}`} stroke="#0A0414" strokeWidth={14} />
      <rect x={VX - 11} y={VY - 11} width={VW + 22} height={VH + 22} rx={10} fill="none" stroke={CIAN} strokeOpacity={0.5 * amb} strokeWidth={2} />
      <path d={`M ${CRUZ_X + 7} ${VY} V ${VB} M ${VX} ${CRUZ_Y - 7} H ${VX + VW}`} stroke={ROSA} strokeOpacity={0.35 * amb} strokeWidth={1.5} />
      <rect x={VX - 20} y={VB + 4} width={VW + 40} height={16} fill="#0A0414" />
      <Tubo d={recta(VX - 16, VB + 5, VX + VW + 16, VB + 5)} color={CIAN} w={3} k={0.75 * amb} />

      {/* el letrero: la tacita, CAFÉ (rosa, zumba) y 24/7 (cian, parpadea de verdad) */}
      <g transform={`translate(${SX} 330) scale(1.25)`}>
        <Tubo d="M -30 -14 L 30 -14 L 26 22 Q 25 28 18 28 L -18 28 Q -25 28 -26 22 Z" color={CIAN} w={3.6} k={kIcono} sube={oleada} />
        <Tubo d="M 30 -4 Q 46 -5 45 8 Q 44 19 28 17" color={CIAN} w={3.2} k={kIcono} sube={oleada} />
        {[-13, 0, 13].map((dx, i) => (
          <Tubo key={i} d={`M ${dx} -22 q -6 -7 0 -14 q 6 -7 0 -14`} color={ROSA} w={2.8} k={kIcono * zumbido(t, 30 + i, [[1.1 + i * 0.7, 1.2 + i * 0.7]])} sube={oleada} />
        ))}
      </g>
      <g fontFamily={NEON} textAnchor="middle">
        <text x={SX} y={490} fontSize={126} letterSpacing={5} fill="none" stroke={ROSA} strokeWidth={20 + 10 * oleada} strokeOpacity={0.2 * kCafe} strokeLinejoin="round">CAFÉ</text>
        <text x={SX} y={490} fontSize={126} letterSpacing={5} fill={NUCLEO_ROSA} fillOpacity={Math.max(0.1, kCafe)} stroke={ROSA} strokeWidth={4.5} strokeOpacity={Math.max(0.14, kCafe)}>CAFÉ</text>
        <text x={SX} y={582} fontSize={84} letterSpacing={8} fill="none" stroke={CIAN} strokeWidth={16 + 8 * oleada} strokeOpacity={0.2 * k247} strokeLinejoin="round">24/7</text>
        <text x={SX} y={582} fontSize={84} letterSpacing={8} fill={NUCLEO_CIAN} fillOpacity={Math.max(0.1, k247)} stroke={CIAN} strokeWidth={3.5} strokeOpacity={Math.max(0.14, k247)}>24/7</text>
      </g>

      {/* la balda: botes en silueta con su filo, y una tira rosa debajo */}
      <rect x={714} y={692} width={316} height={12} fill="#0B0518" />
      {([[738, 610, 44, 82, VIOLETA], [792, 640, 40, 52, CIAN], [846, 594, 30, 98, VIOLETA], [890, 628, 46, 64, ROSA], [952, 650, 52, 42, VIOLETA]] as [number, number, number, number, string][]).map(([x, y, w, h, c], i) => (
        <g key={'bo' + i}>
          <rect x={x} y={y} width={w} height={h} rx={i === 2 ? 10 : 7} fill={SILUETA} />
          <rect x={x} y={y} width={w} height={h} rx={i === 2 ? 10 : 7} fill="none" stroke={c} strokeOpacity={0.55 * amb} strokeWidth={2} />
          <rect x={x + 4} y={y - 9} width={w - 8} height={10} rx={3} fill="#120822" stroke={c} strokeOpacity={0.35 * amb} strokeWidth={1.5} />
        </g>
      ))}
      <Tubo d={recta(722, 706, 1022, 706)} color={ROSA} w={4} k={kBalda} sube={oleada} />

      {/* el tubo de la pared derecha */}
      <rect x={TUBO_X - 9} y={742} width={18} height={12} rx={3} fill="#1A0D2C" />
      <rect x={TUBO_X - 9} y={1472} width={18} height={12} rx={3} fill="#1A0D2C" />
      <Tubo d={recta(TUBO_X, 758, TUBO_X, 1468)} color={CIAN} w={9} k={kTubo} sube={oleada} />

      {/* el zócalo */}
      <rect x={0} y={Y_ZOCALO} width={1080} height={F - Y_ZOCALO} fill="#0A0414" />
      <Tubo d={recta(-20, Y_ZOCALO + 4, 1100, Y_ZOCALO + 4)} color={CIAN} w={5} k={kZocalo} sube={oleada} />
    </g>
  );

  // ------------------------------------------------ el mueble: la encimera mojada, los armarios, el comedero y la cafetera
  const mueble = (
    <g>
      {/* la cafetera, en la encimera */}
      <rect x={54} y={858} width={98} height={152} rx={12} fill={SILUETA} />
      <rect x={54} y={858} width={98} height={152} rx={12} fill="none" stroke={VIOLETA} strokeOpacity={0.55 * amb} strokeWidth={2} />
      <rect x={70} y={878} width={40} height={16} rx={3} fill={CIAN} opacity={0.75 * kCanto} />
      <circle cx={134} cy={886} r={5} fill={ROSA} opacity={Math.floor(t * 1.5) % 2 ? 1 : 0.35} />
      <rect x={88} y={928} width={26} height={22} rx={3} fill="#140A22" />
      <path d="M 86 976 L 116 976 L 113 1000 L 89 1000 Z" fill="#140A22" />
      <path d="M 86 976 L 116 976" stroke={ROSA} strokeWidth={3} strokeLinecap="round" opacity={amb} />
      {/* la encimera: su cara de arriba (mojada) y su canto con la tira cian */}
      <rect x={-20} y={MESA_Y} width={740} height={TOPE - MESA_Y} fill={url('encimera')} />
      <line x1={-20} y1={MESA_Y + 0.5} x2={720} y2={MESA_Y + 0.5} stroke={VIOLETA} strokeOpacity={0.5} strokeWidth={1.5} />
      <rect x={-20} y={TOPE} width={740} height={LABIO - TOPE} fill="#0C0618" />
      <Tubo d={recta(-20, TOPE + 1, 716, TOPE + 1)} color={CIAN} w={4} k={kCanto} sube={oleada} />
      <line x1={720} y1={MESA_Y} x2={720} y2={LABIO} stroke={CIAN} strokeOpacity={0.6 * kCanto} strokeWidth={2} />
      {/* los armarios */}
      <rect x={-20} y={LABIO} width={740} height={ZOCALO_MUEBLE - LABIO} fill={url('armario')} />
      <rect x={-20} y={LABIO} width={740} height={220} fill={url('luz-canto')} opacity={kCanto} />
      {PUERTAS.map(([a, b], i) => {
        const xa = i === 1 ? a + 30 : b - 30;
        return (
          <g key={'pu' + i}>
            {/* el cajón, con su tirador cian, y la puerta, con el suyo rosa y un brillo de laca */}
            <rect x={a + 6} y={LABIO + 10} width={b - a - 12} height={CAJON - LABIO - 16} rx={6} fill="none" stroke={VIOLETA} strokeOpacity={0.42 * amb} strokeWidth={2} />
            <Tubo d={recta((a + b) / 2 - 42, (LABIO + CAJON) / 2, (a + b) / 2 + 42, (LABIO + CAJON) / 2)} color={CIAN} w={3.5} k={amb} sube={oleada} />
            <rect x={a + 6} y={CAJON + 4} width={b - a - 12} height={ZOCALO_MUEBLE - CAJON - 14} rx={6} fill="none" stroke={VIOLETA} strokeOpacity={0.38 * amb} strokeWidth={2} />
            <path d={`M ${a + 40} ${CAJON + 4} L ${a + 110} ${CAJON + 4} L ${a + 30} ${ZOCALO_MUEBLE - 10} L ${a + 6} ${ZOCALO_MUEBLE - 10} L ${a + 6} ${CAJON + 260} Z`} fill="#FFFFFF" opacity={0.035} />
            <Tubo d={recta(xa, CAJON + 34, xa, CAJON + 116)} color={ROSA} w={3.5} k={amb} sube={oleada} />
          </g>
        );
      })}
      <line x1={720} y1={LABIO} x2={720} y2={ZOCALO_MUEBLE} stroke={VIOLETA} strokeOpacity={0.5 * amb} strokeWidth={2} />
      <rect x={-20} y={ZOCALO_MUEBLE} width={734} height={SUELO - ZOCALO_MUEBLE} fill="#04020A" />
      <Tubo d={recta(-20, ZOCALO_MUEBLE + 2, 710, ZOCALO_MUEBLE + 2)} color={CIAN} w={3} k={0.8 * kZocalo} sube={oleada} />
      {/* el comedero, vacío */}
      <path d={`M 428 ${SUELO} L 440 ${SUELO - 38} L 552 ${SUELO - 38} L 564 ${SUELO} Z`} fill="#0E0718" />
      <Tubo d={recta(442, SUELO - 37, 550, SUELO - 37)} color={ROSA} w={3.5} k={amb} sube={oleada} />
    </g>
  );

  // ------------------------------------------------ la taza, su estela y lo que pasa al romperse
  const enMesa = tz.estado === 'mesa';
  const hayEstela = t >= T_CAE + 0.02 && t < T_SUELO + 0.15;
  const estela: React.ReactNode[] = [];
  if (hayEstela) {
    const fin = Math.min(t, T_SUELO - 1e-4);
    const ini = Math.max(T_CAE, fin - 0.17);
    const apaga = 1 - p(t, T_SUELO, 0.15);
    const N = 16;
    const marcas: [P, string, number][] = [[[-52, -59], ROSA, 1], [[52, -59], ROSA, 1], [[91, 4], CIAN, 0.9], [[0, 59], VIOLETA, 0.7]];
    marcas.forEach(([q, col, a], m) => {
      const pts: P[] = [];
      for (let i = 0; i <= N; i++) pts.push(enTaza(taza(mix(ini, fin, i / N)), q));
      for (let i = 1; i <= N; i++) {
        const k = i / N;
        estela.push(
          <line key={`e${m}-${i}`} x1={pts[i - 1][0]} y1={pts[i - 1][1]} x2={pts[i][0]} y2={pts[i][1]} stroke={col} strokeWidth={3 + 15 * k * k}
            strokeOpacity={a * k * apaga} strokeLinecap="round" />,
          <line key={`n${m}-${i}`} x1={pts[i - 1][0]} y1={pts[i - 1][1]} x2={pts[i][0]} y2={pts[i][1]} stroke="#FFFFFF" strokeWidth={1 + 3.5 * k * k}
            strokeOpacity={0.85 * a * k * k * apaga} strokeLinecap="round" />,
        );
      }
    });
    [0.045, 0.09].forEach((d, i) => {
      const s = fin - d;
      if (s > T_CAE + 0.04) estela.push(<TazaFantasma key={'f' + i} tz={taza(s)} op={(0.34 - i * 0.16) * apaga} />);
    });
  }
  // la luz de la taza en la pared y en el suelo (al caer, el suelo se enciende antes de que llegue)
  const cerca = clamp((tz.c[1] - 1150) / 400);
  const luzTaza = tz.estado !== 'suelo' && (
    <g>
      <circle cx={tz.c[0]} cy={tz.c[1]} r={170} fill={url('poza-rosa')} opacity={enMesa ? 0.7 : 1} />
      {!enMesa && <ellipse cx={tz.c[0]} cy={SUELO + 6} rx={70 + 90 * cerca} ry={14 + 12 * cerca} fill={url('poza-rosa')} opacity={1.4 * cerca} />}
    </g>
  );
  const vaporLuz = vp.map((h, i) => (
    <g key={'v' + i} opacity={h.alfa}>
      <path d={curva(h.pts)} fill="none" stroke={ROSA} strokeWidth={20} strokeOpacity={0.12} strokeLinecap="round" />
      <path d={curva(h.pts)} fill="none" stroke="#FFD4F6" strokeWidth={8} strokeOpacity={0.3} strokeLinecap="round" />
      <path d={curva(h.pts.slice(0, 11))} fill="none" stroke="#FFF4FD" strokeWidth={3} strokeOpacity={0.75} strokeLinecap="round" />
    </g>
  ));

  // el café: el chorro en arco (ámbar, encendido), las gotas de la corona como chispas y el charco que refleja
  const chorro = cf.gotas.filter((d) => d.i < 100);
  const tramos: P[][] = [];
  chorro.forEach((d, i) => {
    if (i === 0 || Math.hypot(d.c[0] - chorro[i - 1].c[0], d.c[1] - chorro[i - 1].c[1]) > 90) tramos.push([]);
    tramos[tramos.length - 1].push(d.c);
  });
  // el chorro se suaviza (las gotas salen con algo de azar a los lados y, unidas tal cual, parecen un collar)
  const suave = (q: P[]): P[] => q.map((_, i) => {
    if (i === 0 || i === q.length - 1) return q[i];
    const a = Math.max(0, i - 2), b = Math.min(q.length - 1, i + 2);
    let x = 0, y = 0;
    for (let j = a; j <= b; j++) { x += q[j][0]; y += q[j][1]; }
    return [x / (b - a + 1), y / (b - a + 1)] as P;
  });
  const antes = new Map(cafe(Math.max(0, t - 0.03)).gotas.map((d) => [d.i, d.c] as [number, P]));
  const corona = cf.gotas.filter((d) => d.i >= 100);

  const charco = cf.charco ? {...cf.charco, ry: cf.charco.ry * 1.5} : null; // visto un poco desde arriba
  const kGolpe = p(t, T_SUELO, 1);
  const chispas = CHISPAS.map((ch, i) => {
    const s = t - ch.t0;
    if (s <= 0 || s > ch.vida) return null;
    const a = enChispa(ch, Math.max(0, s - 0.055)), b = enChispa(ch, s);
    const k = 1 - s / ch.vida;
    return <line key={'ch' + i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={ch.c} strokeWidth={ch.w * (0.4 + 0.6 * k)} strokeOpacity={k} strokeLinecap="round" />;
  });
  const rayos = t >= T_SUELO && t < T_SUELO + 0.14 && RAYOS.map((pts, i) => {
    const vis = Math.floor((t - T_SUELO) * 60 + i) % 2 === 0;
    return vis ? <Tubo key={'r' + i} d={poli(pts, false)} color={i === 1 ? ROSA : CIAN} w={3} k={1 - p(t, T_SUELO, 0.14) * 0.5} /> : null;
  });

  const objetos = (
    <g>
      {luzTaza}
      {estela}
      {vaporLuz}
      {tz.estado !== 'suelo' && <TazaNeon tz={tz} url={url} sube={oleada} />}
      {/* el chorro */}
      {tramos.filter((q) => q.length > 1).map(suave).map((q, i) => (
        <g key={'tr' + i}>
          <path d={curva(q)} fill="none" stroke={AMBAR} strokeWidth={34} strokeOpacity={0.2} strokeLinecap="round" />
          <path d={curva(q)} fill="none" stroke="#C25A12" strokeWidth={18} strokeOpacity={0.95} strokeLinecap="round" />
          <path d={curva(q)} fill="none" stroke={AMBAR} strokeWidth={9} strokeLinecap="round" />
          <path d={curva(q)} fill="none" stroke={NUCLEO_AMBAR} strokeWidth={2} strokeOpacity={0.8} strokeLinecap="round" />
        </g>
      ))}
      {tramos.filter((q) => q.length === 1).map((q, i) => <circle key={'go' + i} cx={q[0][0]} cy={q[0][1]} r={7} fill={AMBAR} stroke="#C25A12" strokeWidth={3} />)}
      {/* el charco: oscuro, con su borde de café encendido y los neones dentro */}
      {charco && (
        <g>
          <ellipse cx={charco.c[0]} cy={charco.c[1]} rx={charco.rx} ry={charco.ry} fill="#140704" opacity={0.95} />
          <g clipPath={url('charco')}>
            <use href={`#${id('sala')}`} transform={`matrix(1 0 0 -1 0 ${2 * F})`} opacity={0.75} />
            <rect x={SX - 40} y={charco.c[1] - charco.ry} width={80} height={charco.ry * 2} fill={ROSA} opacity={0.7 * Math.max(kCafe, 0.2)} />
            <rect x={SX - 10} y={charco.c[1] - charco.ry} width={20} height={charco.ry * 2} fill={NUCLEO_ROSA} opacity={0.85 * Math.max(kCafe, 0.2)} />
            <rect x={752} y={charco.c[1] - charco.ry} width={26} height={charco.ry * 2} fill={CIAN} opacity={0.7} />
            <rect x={TUBO_X - 30} y={charco.c[1] - charco.ry} width={14} height={charco.ry * 2} fill={CIAN} opacity={0.8 * kTubo} />
          </g>
          <ellipse cx={charco.c[0]} cy={charco.c[1]} rx={charco.rx} ry={charco.ry} fill="none" stroke={AMBAR} strokeWidth={2.6} strokeOpacity={0.85} />
          <path d={`M ${charco.c[0] - charco.rx * 0.8} ${charco.c[1] - charco.ry * 0.55} Q ${charco.c[0]} ${charco.c[1] - charco.ry * 1.05} ${charco.c[0] + charco.rx * 0.8} ${charco.c[1] - charco.ry * 0.55}`}
            fill="none" stroke={NUCLEO_ROSA} strokeWidth={2} strokeOpacity={0.7} strokeLinecap="round" />
          {/* las ondas que deja al caer */}
          {[0, 0.16, 0.32].map((d, i) => {
            const k = p(t, T_SUELO + d, 0.6);
            if (k <= 0 || k >= 1) return null;
            return <ellipse key={'on' + i} cx={charco.c[0]} cy={charco.c[1]} rx={40 + 240 * E.outCubic(k)} ry={8 + 34 * E.outCubic(k)} fill="none" stroke={i === 1 ? ROSA : CIAN} strokeWidth={4 * (1 - k) + 1} strokeOpacity={0.8 * (1 - k)} />;
          })}
        </g>
      )}
      {cf.manchas.map((s) => (
        <ellipse key={'ma' + s.i} cx={s.c[0]} cy={s.c[1]} rx={s.rx} ry={s.ry * 1.3} fill="#1A0904" stroke={AMBAR} strokeWidth={1.4} strokeOpacity={0.4} />
      ))}
      {/* la corona del café, en chispas ámbar */}
      {corona.map((d) => {
        const a = antes.get(d.i) ?? d.c;
        return (
          <g key={'co' + d.i}>
            <line x1={a[0]} y1={a[1]} x2={d.c[0]} y2={d.c[1]} stroke={AMBAR} strokeWidth={d.r * 0.9} strokeOpacity={0.55} strokeLinecap="round" />
            <circle cx={d.c[0]} cy={d.c[1]} r={d.r * 0.55} fill={NUCLEO_AMBAR} />
          </g>
        );
      })}
      {/* los trozos: cerámica oscura con su filo de neón, que se apaga un poco al quedarse quietos */}
      {tr.map((q) => {
        const col = q.n % 2 ? ROSA : CIAN;
        const k = 1 - 0.35 * q.quieto;
        return (
          <g key={'tz' + q.n}>
            <path d={poli(q.pts)} fill="#140A22" />
            <path d={poli(q.pts)} fill="none" stroke={col} strokeWidth={17} strokeOpacity={0.22 * k} strokeLinejoin="round" />
            <path d={poli(q.pts)} fill="none" stroke={col} strokeWidth={6} strokeOpacity={0.95 * k} strokeLinejoin="round" />
            <path d={poli(q.pts)} fill="none" stroke={q.n % 2 ? NUCLEO_ROSA : NUCLEO_CIAN} strokeWidth={1.6} strokeOpacity={k} strokeLinejoin="round" />
          </g>
        );
      })}
      {chispas}
      {rayos}
    </g>
  );

  // ------------------------------------------------ el techo
  const FUGA: P = [540, 760];
  const vigas = [];
  for (let i = -6; i <= 12; i++) {
    const xs = i * 150 - 60;
    const at = (y: number) => FUGA[0] + ((xs - FUGA[0]) * (FUGA[1] - y)) / FUGA[1];
    vigas.push(<line key={i} x1={at(0)} y1={0} x2={at(TECHO)} y2={TECHO} stroke="#000" strokeOpacity={0.5} strokeWidth={4} />);
    vigas.push(<line key={'b' + i} x1={at(0) + 4} y1={0} x2={at(TECHO) + 3} y2={TECHO} stroke="#4A1A6E" strokeOpacity={0.45} strokeWidth={1.4} />);
  }
  [30, 80, 132, 182].forEach((y, j) => vigas.push(<line key={'h' + j} x1={0} y1={y} x2={1080} y2={y} stroke="#000" strokeOpacity={0.4} strokeWidth={3} />));

  // ------------------------------------------------ el suelo
  const juntas = [];
  for (let i = -6; i <= 14; i++) {
    const xs = i * 150 - 40;
    const at = (y: number) => FUGA[0] + ((xs - FUGA[0]) * (y - FUGA[1])) / (SUELO - FUGA[1]);
    juntas.push(<line key={'f' + i} x1={at(F)} y1={F} x2={at(1920)} y2={1920} stroke="#000" strokeOpacity={0.42} strokeWidth={2.2} />);
  }
  [1572, 1640, 1740, 1870].forEach((y, j) => juntas.push(<line key={'h' + j} x1={0} y1={y} x2={1080} y2={y} stroke="#000" strokeOpacity={0.32} strokeWidth={1.8} />));

  // la lluvia de dentro (muy tenue), sin costura en los 6 s
  const LARGO = 2100;
  const gotasDentro = LLUVIA_DENTRO.map((gg, i) => {
    const y = ((gg.y + (gg.n * LARGO * t) / DUR) % LARGO) - 120;
    const x = gg.x - 0.16 * y;
    return <line key={i} x1={x} y1={y} x2={x - 0.16 * gg.l} y2={y + gg.l} stroke="#D9C8FF" strokeOpacity={gg.a} strokeWidth={1.6} />;
  });
  const deriva = Math.sin((2 * Math.PI * t) / DUR);
  const flash = t >= T_SUELO && t < T_SUELO + 0.4 ? 1 - E.outCubic(p(t, T_SUELO, 0.4)) : 0;

  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
      <defs>
        {/* el brillo: solo lo que pasa de cierta luz se esparce, y se suma */}
        <filter id={id('bloom')} filterUnits="userSpaceOnUse" x={-40} y={-40} width={1160} height={2000} colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0.42 0.42 0.42 0 -0.3" result="luz" />
          <feGaussianBlur in="luz" stdDeviation={18} result="ancho" />
          <feGaussianBlur in="luz" stdDeviation={5} result="cerca" />
          <feComposite in="ancho" in2="cerca" operator="arithmetic" k2={1.05 + 0.9 * oleada} k3={0.75 + 0.45 * oleada} result="halo" />
          <feComposite in="SourceGraphic" in2="halo" operator="arithmetic" k2={1} k3={1} />
        </filter>
        <filter id={id('reflejo')} filterUnits="userSpaceOnUse" x={-40} y={F - 10} width={1160} height={1920 - F + 60} colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2 5" result="a" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="5 18" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="a" /></feMerge>
        </filter>
        <filter id={id('reflejo-obj')} filterUnits="userSpaceOnUse" x={-40} y={SUELO - 10} width={1160} height={1920 - SUELO + 60}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5 8" />
        </filter>
        <filter id={id('reflejo-mesa')} filterUnits="userSpaceOnUse" x={-40} y={MESA_Y - 4} width={800} height={TOPE - MESA_Y + 10}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5 3" />
        </filter>
        <FiltrosBorde id={id} />
        <clipPath id={id('sala-clip')}><rect x={-40} y={TECHO} width={1160} height={F - TECHO} /></clipPath>
        <clipPath id={id('cristal')}><rect x={VX} y={VY} width={VW} height={VH} rx={6} /></clipPath>
        <clipPath id={id('encimera-clip')}><rect x={-20} y={MESA_Y} width={740} height={TOPE - MESA_Y} /></clipPath>
        {charco && <clipPath id={id('charco')}><ellipse cx={charco.c[0]} cy={charco.c[1]} rx={charco.rx} ry={charco.ry} /></clipPath>}
        <linearGradient id={id('desvanece')} gradientUnits="userSpaceOnUse" x1={0} y1={F} x2={0} y2={1920}>
          <stop offset={0} stopColor="#fff" stopOpacity={1} />
          <stop offset={0.5} stopColor="#fff" stopOpacity={0.75} />
          <stop offset={1} stopColor="#fff" stopOpacity={0.45} />
        </linearGradient>
        <mask id={id('mascara-suelo')} maskUnits="userSpaceOnUse" x={-40} y={F} width={1160} height={1920 - F + 40}>
          <rect x={-40} y={F} width={1160} height={1920 - F + 40} fill={url('desvanece')} />
        </mask>
        <linearGradient id={id('desvanece-obj')} gradientUnits="userSpaceOnUse" x1={0} y1={SUELO} x2={0} y2={1900}>
          <stop offset={0} stopColor="#fff" stopOpacity={0.9} />
          <stop offset={1} stopColor="#fff" stopOpacity={0.12} />
        </linearGradient>
        <mask id={id('mascara-obj')} maskUnits="userSpaceOnUse" x={-40} y={SUELO} width={1160} height={1920 - SUELO + 40}>
          <rect x={-40} y={SUELO} width={1160} height={1920 - SUELO + 40} fill={url('desvanece-obj')} />
        </mask>

        <pattern id={id('azulejo')} width={96} height={48} patternUnits="userSpaceOnUse" x={0} y={TECHO}>
          <line x1={0} y1={0.5} x2={96} y2={0.5} stroke="#000" strokeOpacity={0.5} strokeWidth={2.5} />
          <line x1={0} y1={3} x2={96} y2={3} stroke="#6A2A9A" strokeOpacity={0.22} strokeWidth={1.2} />
          <line x1={0.5} y1={0} x2={0.5} y2={24} stroke="#000" strokeOpacity={0.45} strokeWidth={2.5} />
          <line x1={48.5} y1={24} x2={48.5} y2={48} stroke="#000" strokeOpacity={0.45} strokeWidth={2.5} />
          <line x1={0} y1={24.5} x2={96} y2={24.5} stroke="#000" strokeOpacity={0.5} strokeWidth={2.5} />
          <line x1={0} y1={27} x2={96} y2={27} stroke="#6A2A9A" strokeOpacity={0.22} strokeWidth={1.2} />
        </pattern>
        <linearGradient id={id('pared')} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor="#220938" />
          <stop offset={0.25} stopColor="#150529" />
          <stop offset={0.7} stopColor="#12052A" />
          <stop offset={1} stopColor="#1A0838" />
        </linearGradient>
        <linearGradient id={id('techo')} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor="#0A0318" />
          <stop offset={0.7} stopColor="#170630" />
          <stop offset={1} stopColor="#34104E" />
        </linearGradient>
        <linearGradient id={id('resplandor-techo')} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={ROSA} stopOpacity={0} />
          <stop offset={1} stopColor={ROSA} stopOpacity={0.3} />
        </linearGradient>
        <linearGradient id={id('lavado')} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={ROSA} stopOpacity={0.3} />
          <stop offset={1} stopColor={ROSA} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={id('bruma-sala')} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={ROSA} stopOpacity={0.1} />
          <stop offset={0.45} stopColor="#B04BFF" stopOpacity={0.05} />
          <stop offset={1} stopColor={CIAN} stopOpacity={0.08} />
        </linearGradient>
        <linearGradient id={id('suelo')} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor="#150828" />
          <stop offset={1} stopColor="#07020F" />
        </linearGradient>
        <linearGradient id={id('niebla')} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={CIAN} stopOpacity={0} />
          <stop offset={0.55} stopColor={CIAN} stopOpacity={0.16} />
          <stop offset={1} stopColor={CIAN} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={id('cielo')} gradientUnits="userSpaceOnUse" x1={0} y1={VY} x2={0} y2={VB}>
          <stop offset={0} stopColor="#0B0220" />
          <stop offset={0.5} stopColor="#2B0A4A" />
          <stop offset={1} stopColor="#8A1A72" />
        </linearGradient>
        <linearGradient id={id('valla')} x1={0} y1={0} x2={1} y2={0}>
          <stop offset={0} stopColor="#22D3FF" />
          <stop offset={1} stopColor="#8E5BFF" />
        </linearGradient>
        <linearGradient id={id('encimera')} gradientUnits="userSpaceOnUse" x1={0} y1={MESA_Y} x2={0} y2={TOPE}>
          <stop offset={0} stopColor="#1E0C34" />
          <stop offset={1} stopColor="#0E0620" />
        </linearGradient>
        <linearGradient id={id('armario')} gradientUnits="userSpaceOnUse" x1={0} y1={LABIO} x2={0} y2={ZOCALO_MUEBLE}>
          <stop offset={0} stopColor="#140824" />
          <stop offset={1} stopColor="#0A0414" />
        </linearGradient>
        <linearGradient id={id('luz-canto')} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={CIAN} stopOpacity={0.2} />
          <stop offset={1} stopColor={CIAN} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={id('luz-zocalo')} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={CIAN} stopOpacity={0.3} />
          <stop offset={1} stopColor={CIAN} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={id('taza')} x1={0} y1={0} x2={1} y2={1}>
          <stop offset={0} stopColor="#2A1240" />
          <stop offset={1} stopColor="#0C0618" />
        </linearGradient>
        {/* el pelo del gato: más morado por detrás (la luz rosa) y azulado por delante (la cian) */}
        <linearGradient id={id('pelo')} gradientUnits="userSpaceOnUse" x1={150} y1={0} x2={660} y2={0}>
          <stop offset={0} stopColor="#2E0F44" />
          <stop offset={0.5} stopColor="#150A26" />
          <stop offset={1} stopColor="#0B2440" />
        </linearGradient>
        <radialGradient id={id('ojo')} cx={0.5} cy={0.55} r={0.62}>
          <stop offset={0} stopColor={NUCLEO_OJO} />
          <stop offset={0.5} stopColor={OJO} />
          <stop offset={1} stopColor="#7FC400" />
        </radialGradient>
        <radialGradient id={id('halo-ojo')}>
          <stop offset={0} stopColor={OJO} stopOpacity={0.55} />
          <stop offset={0.4} stopColor={OJO} stopOpacity={0.16} />
          <stop offset={1} stopColor={OJO} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={id('oreja')} x1={0} y1={1} x2={0} y2={0}>
          <stop offset={0} stopColor={ROSA} stopOpacity={0.15} />
          <stop offset={1} stopColor="#FF7FEA" stopOpacity={0.85} />
        </linearGradient>
        <radialGradient id={id('poza-rosa')}>
          <stop offset={0} stopColor={ROSA} stopOpacity={0.3} />
          <stop offset={1} stopColor={ROSA} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id('poza-cian')}>
          <stop offset={0} stopColor={CIAN} stopOpacity={0.24} />
          <stop offset={1} stopColor={CIAN} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id('destello')}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset={0.2} stopColor="#FFC2F3" stopOpacity={0.55} />
          <stop offset={0.55} stopColor={ROSA} stopOpacity={0.18} />
          <stop offset={1} stopColor={ROSA} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id('bruma-rosa')}>
          <stop offset={0} stopColor={ROSA} stopOpacity={0.22} />
          <stop offset={1} stopColor={ROSA} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id('bruma-cian')}>
          <stop offset={0} stopColor={CIAN} stopOpacity={0.16} />
          <stop offset={1} stopColor={CIAN} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id('vineta')} cx={0.5} cy={0.5} r={0.75}>
          <stop offset={0.55} stopColor="#000" stopOpacity={0} />
          <stop offset={1} stopColor="#000" stopOpacity={0.78} />
        </radialGradient>

        <g id={id('sala')} clipPath={url('sala-clip')}>{sala}</g>
        <g id={id('mueble')}>{mueble}</g>
        <g id={id('objetos')}>{objetos}</g>
        <g id={id('gato')} transform={TRANSFORMA_GATO}>
          <GatoNeon g={g} t={t} id={id} url={url} sube={oleada} />
        </g>
      </defs>

      <rect x={-40} y={-40} width={1160} height={2000} fill={NOCHE} />
      <g transform={`translate(${sx} ${sy})`}>
        <g filter={url('bloom')}>
          {/* el techo */}
          <rect x={-40} y={-40} width={1160} height={TECHO + 40} fill={url('techo')} />
          {vigas}
          <rect x={-40} y={100} width={1160} height={TECHO - 100} fill={url('resplandor-techo')} opacity={kTecho} />
          <rect x={-40} y={TECHO - 8} width={1160} height={10} fill="#0B0418" />
          {[90, 330, 570, 810, 1050].map((x) => <rect key={x} x={x - 7} y={TECHO - 4} width={14} height={Y_TUBO - TECHO + 2} fill="#1A0D2C" />)}

          {/* la sala y su reflejo en el suelo mojado */}
          <use href={`#${id('sala')}`} />
          <rect x={-40} y={F} width={1160} height={1960 - F} fill={url('suelo')} />
          <g mask={url('mascara-suelo')}>
            <g filter={url('reflejo')}>
              <use href={`#${id('sala')}`} transform={`matrix(1 0 0 -1 0 ${2 * F})`} />
            </g>
          </g>
          {juntas}
          {/* lo que está en el suelo se refleja desde el suelo */}
          <g mask={url('mascara-obj')} opacity={0.85}>
            <g filter={url('reflejo-obj')}>
              <use href={`#${id('mueble')}`} transform={`matrix(1 0 0 -1 0 ${2 * SUELO})`} />
              <use href={`#${id('objetos')}`} transform={`matrix(1 0 0 -1 0 ${2 * SUELO})`} />
            </g>
          </g>
          {/* el reflejo largo y partido de los neones en el suelo mojado */}
          <Raya x={SX} y0={F + 4} y1={1920} ancho={190} color={ROSA} a={0.62 * Math.max(kCafe, 0.15)} t={t} s={1} />
          <Raya x={SX} y0={F + 4} y1={1800} ancho={70} color={CIAN} a={0.3 * Math.max(k247, 0.1)} t={t} s={11} />
          <Raya x={TUBO_X} y0={F + 4} y1={1920} ancho={56} color={CIAN} a={0.7 * kTubo} t={t} s={2} />
          {TIRADORES.map((x, i) => <Raya key={'rt' + i} x={x} y0={SUELO + 4} y1={1860} ancho={30} color={ROSA} a={0.42 * amb} t={t} s={20 + i} />)}
          <Raya x={496} y0={SUELO + 4} y1={1800} ancho={110} color={ROSA} a={0.35 * amb} t={t} s={30} />
          {flash > 0 && <Raya x={IMPACTO[0]} y0={SUELO + 4} y1={1920} ancho={300} color="#FFD0F5" a={0.9 * flash} t={t} s={40} />}
          <rect x={-40} y={SUELO} width={780} height={60} fill={url('luz-zocalo')} opacity={kZocalo} />

          {/* el tubo grande del techo, por delante */}
          <Tubo d={recta(-40, Y_TUBO, 1120, Y_TUBO)} color={ROSA} w={11} k={kTecho} sube={oleada} />

          {/* la bruma de la sala */}
          <rect x={-40} y={TECHO} width={1160} height={F - TECHO} fill={url('bruma-sala')} />
          <rect x={-40} y={F - 110} width={1160} height={200} fill={url('niebla')} />

          {/* el mueble y, en la encimera mojada, el reflejo del gato y de la taza */}
          <use href={`#${id('mueble')}`} />
          <g clipPath={url('encimera-clip')} opacity={0.6}>
            <g filter={url('reflejo-mesa')}>
              <use href={`#${id('gato')}`} transform={`matrix(1 0 0 -1 0 ${2 * MESA_Y})`} />
              <use href={`#${id('objetos')}`} transform={`matrix(1 0 0 -1 0 ${2 * MESA_Y})`} />
            </g>
          </g>

          {/* la taza, el café y los trozos; y el gato */}
          <use href={`#${id('objetos')}`} />
          <use href={`#${id('gato')}`} />

          {/* el golpe: el fogonazo */}
          {flash > 0 && (
            <g>
              <circle cx={IMPACTO[0]} cy={SUELO - 20} r={90 + 340 * (1 - flash)} fill={url('destello')} opacity={flash} />
              <ellipse cx={IMPACTO[0]} cy={SUELO + 4} rx={120 + 380 * (1 - flash)} ry={22 + 50 * (1 - flash)} fill="none" stroke={NUCLEO_CIAN} strokeWidth={6 * flash} strokeOpacity={flash} />
            </g>
          )}

          {/* la lluvia tenue y la bruma que va y viene */}
          <g>{gotasDentro}</g>
          <ellipse cx={260 + 60 * deriva} cy={560} rx={520} ry={300} fill={url('bruma-rosa')} />
          <ellipse cx={820 - 50 * deriva} cy={1300} rx={480} ry={260} fill={url('bruma-cian')} />
        </g>
      </g>

      <rect width={1080} height={1920} fill={url('vineta')} />
      {kGolpe > 0 && kGolpe < 1 && <rect width={1080} height={1920} fill="#FFD6F7" opacity={0.12 * oleada} />}
    </svg>
  );
};
