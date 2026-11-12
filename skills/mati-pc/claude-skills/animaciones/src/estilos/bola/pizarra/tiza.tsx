import React from 'react';
import {loadFont as cargarKalam} from '@remotion/google-fonts/Kalam';
import {clamp, rng} from '../../../comun/curvas';
import {CAMARA, proyecta, type P, type V3} from '../escena';

// PIZARRA DE TIZA, LA PIEL: lo que hace que algo parezca tiza sobre una pizarra, sin nada de la escena.
// La tiza es un trazo normal que pasa por un filtro: un ruido
// lento le tuerce el borde (el pulso de la mano; cambia de semilla en cada dibujo, a 12 por segundo, y así «tiembla»), un ruido fino
// le arranca granos (el diente de la pizarra, siempre el mismo, porque la pizarra no cambia) y un halo suave de polvo alrededor.
// Los rellenos van «de canto», como se pinta con la tiza tumbada: rayas de color con el mismo grano, sobre la pizarra.

export const {fontFamily: MANO} = cargarKalam('normal', {weights: ['700'], subsets: ['latin', 'latin-ext']});

// las tizas: blanca para todo, y tres de color (amarillo, rosa y azul claro)
export const TIZA = {blanco: '#F4F2EA', amarillo: '#FFE070', rosa: '#FF92BC', azul: '#92D4FF'};
export type Color = keyof typeof TIZA;
// la pizarra: verde oscuro de aula; OCULTA es el relleno que tapa lo de detrás (el tono medio de la pizarra)
export const PIZARRA = '#213a2f';
export const OCULTA = '#22392f';
// los grosores: el contorno de lo que se mueve, el del cuarto, los detalles y lo fino
export const W = {gordo: 9, cuarto: 6.5, detalle: 5.5, fino: 4};

// ---------------------------------------------------------------- vectores y caminos
export const sum = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const res = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const esc = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const pto = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const lar = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const nor = (a: V3): V3 => esc(a, 1 / Math.max(1e-9, lar(a)));
export const vista = (c: V3): V3 => nor(res(CAMARA, c)); // de un punto a la cámara

const f = (q: P) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
export const poli = (pts: P[], cerrar = true) => (pts.length ? `M ${pts.map(f).join(' L ')}${cerrar ? ' Z' : ''}` : '');
// una curva suave por los puntos (Catmull-Rom)
export const curva = (pts: P[], cerrar = false) => {
  const n = pts.length;
  if (n < 2) return '';
  const g = (i: number) => (cerrar ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M ${f(pts[0])}`;
  const fin = cerrar ? n : n - 1;
  for (let i = 0; i < fin; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f(c1)} ${f(c2)} ${f(p2)}`;
  }
  return d + (cerrar ? ' Z' : '');
};
// la envolvente convexa (para la silueta de una caja o un cilindro vistos en perspectiva)
export const envolvente = (pts: P[]): P[] => {
  const q = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (q.length < 3) return q;
  const x = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const abajo: P[] = [];
  for (const p of q) {
    while (abajo.length >= 2 && x(abajo[abajo.length - 2], abajo[abajo.length - 1], p) <= 0) abajo.pop();
    abajo.push(p);
  }
  const arriba: P[] = [];
  for (let i = q.length - 1; i >= 0; i--) {
    const p = q[i];
    while (arriba.length >= 2 && x(arriba[arriba.length - 2], arriba[arriba.length - 1], p) <= 0) arriba.pop();
    arriba.push(p);
  }
  return [...abajo.slice(0, -1), ...arriba.slice(0, -1)];
};
// un segmento que se pasa un pelo por los dos lados (como raya la tiza una esquina: el trazo no se para justo en el vértice)
export const raya = (a: P, b: P, pasa = 7) => {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const u: P = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
  return `M ${f([a[0] - u[0] * pasa, a[1] - u[1] * pasa])} L ${f([b[0] + u[0] * pasa, b[1] + u[1] * pasa])}`;
};
// un rectángulo a mano: cuatro rayas que se cruzan en las esquinas
export const rectMano = (x0: number, y0: number, x1: number, y1: number, pasa = 7) =>
  [raya([x0, y0], [x1, y0], pasa), raya([x1, y0], [x1, y1], pasa), raya([x1, y1], [x0, y1], pasa), raya([x0, y1], [x0, y0], pasa)].join(' ');
// los puntos de un círculo en 3D (centro, dos ejes del plano y el radio), ya en la pantalla
export const aro3 = (c: V3, e1: V3, e2: V3, r: number, n = 48, a0 = 0, a1 = Math.PI * 2): P[] =>
  Array.from({length: n + 1}, (_, j) => {
    const a = a0 + ((a1 - a0) * j) / n;
    return proyecta(sum(c, sum(esc(e1, Math.cos(a) * r), esc(e2, Math.sin(a) * r))));
  });

// ---------------------------------------------------------------- los filtros, las tramas y los degradados (una vez por página)
// semilla: la del pulso de lo que se mueve (cambia en cada dibujo); prefijo, por si hubiera dos pizarras en la misma página
export const Defs: React.FC<{semilla: number; prefijo: string}> = ({semilla, prefijo: x}) => (
  <defs>
    {/* LA TIZA: el borde torcido, el grano del diente de la pizarra y el polvo alrededor */}
    {(['quieta', 'viva'] as const).map((nombre) => (
      <filter key={nombre} id={`${x}-${nombre}`} x={-60} y={-60} width={1200} height={2040} filterUnits="userSpaceOnUse">
        <feTurbulence type="fractalNoise" baseFrequency={0.032} numOctaves={2} seed={nombre === 'quieta' ? 7 : semilla} result="pulso" />
        <feDisplacementMap in="SourceGraphic" in2="pulso" scale={nombre === 'quieta' ? 5 : 6.5} xChannelSelector="R" yChannelSelector="G" result="mano" />
        <feTurbulence type="fractalNoise" baseFrequency={0.62} numOctaves={3} seed={3} result="diente" />
        <feColorMatrix in="diente" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3.4 0 0 0 2.45" result="huecos" />
        <feComposite in="mano" in2="huecos" operator="in" result="grano" />
        <feGaussianBlur in="mano" stdDeviation={2.6} result="halo" />
        <feColorMatrix in="halo" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.26 0" result="polvo" />
        <feMerge>
          <feMergeNode in="polvo" />
          <feMergeNode in="grano" />
        </feMerge>
      </filter>
    ))}
    {/* el borrón: lo que se borró con el borrador (la tiza de antes, corrida y casi ida) */}
    <filter id={`${x}-borron`} x={-60} y={-60} width={1200} height={2040} filterUnits="userSpaceOnUse">
      <feGaussianBlur stdDeviation={7} />
    </filter>
    {/* la pizarra: manchas lentas, el grano fino y las pasadas del borrador de otros días (rayadas en su dirección) */}
    <filter id={`${x}-manchas`} x={0} y={0} width={1080} height={1920} filterUnits="userSpaceOnUse">
      <feTurbulence type="fractalNoise" baseFrequency={0.0028} numOctaves={4} seed={21} />
      <feColorMatrix type="matrix" values="0 0 0 0 0.20  0 0 0 0 0.33  0 0 0 0 0.27  1.6 0 0 0 -0.55" />
    </filter>
    <filter id={`${x}-polvillo`} x={0} y={0} width={1080} height={1920} filterUnits="userSpaceOnUse">
      <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} seed={5} />
      <feColorMatrix type="matrix" values="0 0 0 0 0.9  0 0 0 0 0.95  0 0 0 0 0.9  5 0 0 0 -3.1" />
    </filter>
    <filter id={`${x}-pasadas`} x={-200} y={-200} width={1480} height={2320} filterUnits="userSpaceOnUse">
      <feTurbulence type="fractalNoise" baseFrequency="0.0016 0.04" numOctaves={2} seed={13} result="rayas" />
      <feColorMatrix in="rayas" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.75" result="m" />
      <feGaussianBlur in="SourceGraphic" stdDeviation={26} result="b" />
      <feComposite in="b" in2="m" operator="in" />
    </filter>
    <filter id={`${x}-madera`} x={-40} y={-40} width={1160} height={2000} filterUnits="userSpaceOnUse">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.22" numOctaves={3} seed={8} result="veta" />
      <feColorMatrix in="veta" type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.12  0 0 0 0 0.05  1.3 0 0 0 -0.35" result="v" />
      <feComposite in="v" in2="SourceGraphic" operator="in" />
    </filter>
    <filter id={`${x}-maderaV`} x={-40} y={-40} width={1160} height={2000} filterUnits="userSpaceOnUse">
      <feTurbulence type="fractalNoise" baseFrequency="0.22 0.006" numOctaves={3} seed={9} result="veta" />
      <feColorMatrix in="veta" type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.12  0 0 0 0 0.05  1.3 0 0 0 -0.35" result="v" />
      <feComposite in="v" in2="SourceGraphic" operator="in" />
    </filter>
    {/* las tramas de canto: una por tiza, y la blanca más apretada (el pelo, la pila de papeles) */}
    {(Object.keys(TIZA) as Color[]).map((c) => (
      <pattern key={c} id={`${x}-trama-${c}`} width={10} height={10} patternUnits="userSpaceOnUse" patternTransform="rotate(-34)">
        <line x1={0} y1={-1} x2={0} y2={11} stroke={TIZA[c]} strokeWidth={6} />
      </pattern>
    ))}
    <pattern id={`${x}-trama-suave`} width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(-34)">
      <line x1={0} y1={-1} x2={0} y2={17} stroke={TIZA.blanco} strokeWidth={3} />
    </pattern>
    <pattern id={`${x}-trama-densa`} width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(52)">
      <line x1={0} y1={-1} x2={0} y2={8} stroke={TIZA.blanco} strokeWidth={4} />
    </pattern>
    <radialGradient id={`${x}-luz`} cx="0.32" cy="0.28" r="0.85">
      <stop offset="0" stopColor="#ffffff" stopOpacity={0.07} />
      <stop offset="0.55" stopColor="#ffffff" stopOpacity={0} />
      <stop offset="0.8" stopColor="#000000" stopOpacity={0.12} />
      <stop offset="1" stopColor="#000000" stopOpacity={0.34} />
    </radialGradient>
    <linearGradient id={`${x}-marco`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#a8703f" />
      <stop offset="0.45" stopColor="#8a5527" />
      <stop offset="1" stopColor="#5e3615" />
    </linearGradient>
    <linearGradient id={`${x}-marcoV`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#6a3e1a" />
      <stop offset="0.5" stopColor="#93602f" />
      <stop offset="1" stopColor="#6a3e1a" />
    </linearGradient>
    <linearGradient id={`${x}-repisa`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#b47b48" />
      <stop offset="0.3" stopColor="#9a6534" />
      <stop offset="1" stopColor="#4d2b10" />
    </linearGradient>
  </defs>
);

// ---------------------------------------------------------------- las piezas de tiza
// un trazo que se dibuja solo (k de 0 a 1, de su principio a su final)
export const Trazo: React.FC<{d: string; w?: number; c?: Color; k?: number; op?: number; dash?: string}> = ({d, w = W.cuarto, c = 'blanco', k = 1, op = 1, dash}) => {
  if (k <= 0 || !d) return null;
  const dib = k < 1;
  return (
    <path d={d} fill="none" stroke={TIZA[c]} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={op}
      pathLength={dib ? 1 : undefined} strokeDasharray={dib ? `${k} 2` : dash} />
  );
};

// una forma de tiza: primero tapa lo de detrás (con la pizarra), luego su relleno de canto y encima el contorno
export const Forma: React.FC<{d: string; c?: Color | null; borde?: Color; w?: number; tapa?: boolean; tinte?: number; trama?: string; op?: number}> = ({
  d, c = null, borde = 'blanco', w = W.gordo, tapa = true, tinte = 0.52, trama, op = 1,
}) => (
  <g opacity={op}>
    {tapa && <path d={d} fill={OCULTA} />}
    {c && <path d={d} fill={TIZA[c]} fillOpacity={tinte} />}
    {c && trama !== 'nada' && <path d={d} fill={`url(#${trama ?? `pz-trama-${c}`})`} opacity={0.9} />}
    <path d={d} fill="none" stroke={TIZA[borde]} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
  </g>
);

// una pieza alargada (un brazo, una pierna): la cápsula entre dos o más puntos, con su contorno, su tapa y su relleno
export const Capsula: React.FC<{pts: P[]; r: number; c?: Color | null; borde?: Color; w?: number}> = ({pts, r, c = null, borde = 'blanco', w = W.gordo}) => {
  const d = poli(pts, false);
  return (
    <g>
      <path d={d} fill="none" stroke={TIZA[borde]} strokeWidth={2 * r + w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={OCULTA} strokeWidth={2 * r - w * 0.6} strokeLinecap="round" strokeLinejoin="round" />
      {c && <path d={d} fill="none" stroke={TIZA[c]} strokeOpacity={0.52} strokeWidth={2 * r - w * 0.6} strokeLinecap="round" strokeLinejoin="round" />}
      {c && <path d={d} fill="none" stroke={`url(#pz-trama-${c})`} strokeOpacity={0.9} strokeWidth={2 * r - w * 1.6} strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  );
};

// lo que se escribe a mano, letra a letra (con su k de 0 a 1)
export const Escrito: React.FC<{txt: string; x: number; y: number; tam: number; c?: Color; k: number; rot?: number; ancla?: 'start' | 'middle' | 'end'; op?: number}> = ({
  txt, x, y, tam, c = 'blanco', k, rot = 0, ancla = 'start', op = 1,
}) => {
  if (k <= 0) return null;
  const letras = [...txt];
  const n = Math.ceil(letras.length * clamp(k));
  // con ancla al centro o al final, el texto entero se mide igual: se escribe en su sitio, sin moverse
  return (
    <text x={x} y={y} fontFamily={MANO} fontWeight={700} fontSize={tam} fill={TIZA[c]} textAnchor={ancla} opacity={op} transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>
      {letras.map((l, j) => (
        <tspan key={j} fillOpacity={j < n ? 1 : 0}>{l}</tspan>
      ))}
    </text>
  );
};

// una flecha de tiza: el cuerpo curvo se dibuja y, al llegar, la punta (dos rayas)
export const Flecha: React.FC<{de: P; a: P; comba?: number; c?: Color; k: number; w?: number}> = ({de, a, comba = 0.2, c = 'amarillo', k, w = W.detalle}) => {
  if (k <= 0) return null;
  const m: P = [(de[0] + a[0]) / 2, (de[1] + a[1]) / 2];
  const dx = a[0] - de[0], dy = a[1] - de[1];
  const ctrl: P = [m[0] - dy * comba, m[1] + dx * comba];
  const d = `M ${f(de)} Q ${f(ctrl)} ${f(a)}`;
  const ang = Math.atan2(a[1] - ctrl[1], a[0] - ctrl[0]);
  const punta = (s: number) => {
    const b = ang + Math.PI + s * 0.5;
    return `M ${f(a)} L ${f([a[0] + Math.cos(b) * 34, a[1] + Math.sin(b) * 34])}`;
  };
  const kp = clamp((k - 0.75) / 0.25);
  return (
    <g>
      <Trazo d={d} w={w} c={c} k={Math.min(1, k / 0.75)} />
      <Trazo d={punta(1)} w={w} c={c} k={kp} />
      <Trazo d={punta(-1)} w={w} c={c} k={kp} />
    </g>
  );
};

// una cota de profe: la raya con sus dos puntas, las rayitas de los extremos y la medida debajo (con su Δ dibujada)
export const Cota: React.FC<{a: P; b: P; txt: string; c?: Color; k: number; tam?: number; abajo?: number; desde?: number}> = ({a, b, txt, c = 'azul', k, tam = 50, abajo = 58, desde}) => {
  if (k <= 0) return null;
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const u: P = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
  const nn: P = [-u[1], u[0]];
  const punta = (q: P, s: number) =>
    `M ${f(q)} L ${f([q[0] + s * (u[0] * 26 + nn[0] * 12), q[1] + s * (u[1] * 26 + nn[1] * 12)])} M ${f(q)} L ${f([q[0] + s * (u[0] * 26 - nn[0] * 12), q[1] + s * (u[1] * 26 - nn[1] * 12)])}`;
  const tope = (q: P) => `M ${f([q[0] + nn[0] * 22, q[1] + nn[1] * 22])} L ${f([q[0] - nn[0] * 22, q[1] - nn[1] * 22])}`;
  const kl = clamp(k / 0.5), kp = clamp((k - 0.4) / 0.2), kt = clamp((k - 0.55) / 0.45);
  const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2 + abajo;
  // la Δ (Kalam no la tiene): un triángulo de tiza delante del texto
  const ancho = tam * 0.5 * txt.length + tam * 0.75;
  const x0 = desde ?? cx - ancho / 2;
  const delta = `M ${f([x0, cy])} L ${f([x0 + tam * 0.33, cy - tam * 0.66])} L ${f([x0 + tam * 0.66, cy])} Z`;
  return (
    <g>
      <Trazo d={tope(a)} w={W.fino} c={c} k={kl} />
      <Trazo d={tope(b)} w={W.fino} c={c} k={kl} />
      <Trazo d={`M ${f(a)} L ${f(b)}`} w={W.fino + 0.5} c={c} k={kl} />
      <Trazo d={punta(a, 1)} w={W.fino + 0.5} c={c} k={kp} />
      <Trazo d={punta(b, -1)} w={W.fino + 0.5} c={c} k={kp} />
      <Trazo d={delta} w={W.fino + 0.5} c={c} k={clamp(kt * 3)} />
      <Escrito txt={txt} x={x0 + tam * 0.75} y={cy} tam={tam} c={c} k={clamp((kt - 0.2) / 0.8)} />
    </g>
  );
};

// ---------------------------------------------------------------- el polvo que cae
// una nube: cuándo y dónde se suelta, cuántos granos, en qué ancho y con qué fuerza salen
export type Nube = {t: number; x: number; y: number; n: number; ancho: number; fuerza?: number; semilla: number};
export const Polvo: React.FC<{nubes: Nube[]; t: number}> = ({nubes, t}) => {
  const granos: React.ReactNode[] = [];
  for (const nb of nubes) {
    const u = t - nb.t;
    if (u < 0 || u > 1.6) continue;
    const r = rng(nb.semilla * 977 + 11);
    const fz = nb.fuerza ?? 1;
    for (let j = 0; j < nb.n; j++) {
      const x0 = nb.x + (r() - 0.5) * nb.ancho, y0 = nb.y + (r() - 0.5) * nb.ancho * 0.35;
      const vx = (r() - 0.5) * 150 * fz, vy = -r() * 170 * fz;
      const vida = 0.8 + r() * 0.9, tam = 3 + r() * 4, retraso = r() * 0.12;
      const uu = u - retraso;
      if (uu < 0 || uu > vida) continue;
      // el polvo frena en el aire (mucho rozamiento) y cae despacio
      const fr = (1 - Math.exp(-3.2 * uu)) / 3.2;
      const x = x0 + vx * fr + Math.sin(uu * 5 + j) * 4;
      const y = y0 + vy * fr + 130 * uu * uu + 30 * uu;
      granos.push(<rect key={`${nb.semilla}-${j}`} x={x} y={y} width={tam} height={tam} fill={TIZA.blanco} opacity={0.75 * (1 - uu / vida)} />);
    }
  }
  return <g>{granos}</g>;
};
