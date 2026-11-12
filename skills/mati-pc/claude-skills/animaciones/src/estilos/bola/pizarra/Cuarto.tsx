import React from 'react';
import {E, p} from '../../../comun/curvas';
import {MURO_X, SUELO, Z_PARED, proyecta, type P} from '../escena';
import {mesa} from './cuerpos';
import {Escrito, Forma, Trazo, W, curva, poli, raya, rectMano, type Color} from './tiza';

// PIZARRA DE TIZA, LO QUE NO SE MUEVE: la pizarra con su marco de madera y su repisa (las tizas y el
// borrador), las pasadas del borrador de otros días, y el cuarto dibujado en tiza, que se dibuja solo trazo a trazo al empezar:
// el suelo de tablas y la esquina (en perspectiva, con el mismo punto de fuga que la cámara de los bloques), la mesa con su monitor,
// la ventana y la diana de la pared. La mesa, la esquina y el suelo están donde los bloques; la ventana y la diana, también.

// ---------------------------------------------------------------- la pizarra (el fondo) y el marco
export const BORDE = {izq: 22, der: 1058, arriba: 30, abajo: 1846};

export const Fondo: React.FC = () => (
  <g>
    <rect x={-40} y={-40} width={1160} height={2000} fill="#213a2f" />
    <rect x={0} y={0} width={1080} height={1920} filter="url(#pz-manchas)" opacity={0.55} />
    {/* las pasadas del borrador de otros días: anchas, curvas y rayadas en su dirección */}
    <g filter="url(#pz-pasadas)" opacity={0.3}>
      <path d="M -60 520 C 220 380, 620 420, 1140 300" fill="none" stroke="#ffffff" strokeWidth={170} opacity={0.5} />
      <path d="M 120 900 C 420 760, 760 840, 1100 740" fill="none" stroke="#ffffff" strokeWidth={120} opacity={0.32} />
      <path d="M -80 1380 C 260 1300, 560 1420, 900 1330" fill="none" stroke="#ffffff" strokeWidth={130} opacity={0.3} />
      <path d="M 560 1700 C 760 1640, 940 1700, 1160 1620" fill="none" stroke="#ffffff" strokeWidth={110} opacity={0.3} />
    </g>
    {/* lo que quedó de una lección borrada (casi ido) */}
    <g opacity={0.075} filter="url(#pz-borron)">
      <text x={590} y={210} fontFamily="serif" fontSize={74} fill="#ffffff" transform="rotate(-3 590 210)">3 × 4 = 12</text>
      <text x={120} y={800} fontFamily="serif" fontSize={60} fill="#ffffff">a + b</text>
    </g>
    <rect x={0} y={0} width={1080} height={1920} filter="url(#pz-polvillo)" opacity={0.5} />
  </g>
);

export const LuzPizarra: React.FC = () => <rect x={-40} y={-40} width={1160} height={2000} fill="url(#pz-luz)" />;

// el marco de madera, la repisa con sus tizas y el borrador (son objetos de verdad: no se dibujan)
export const Marco: React.FC = () => {
  const {izq, der, arriba, abajo} = BORDE;
  const tizas: {x: number; l: number; c: string; a: number}[] = [
    {x: 150, l: 92, c: '#f1efe6', a: -0.04}, {x: 270, l: 54, c: '#f6dc78', a: 0.06}, {x: 780, l: 70, c: '#f3a1bb', a: -0.08}, {x: 880, l: 84, c: '#a6d8f2', a: 0.03},
  ];
  return (
    <g>
      {/* la sombra del marco sobre la pizarra */}
      <rect x={izq} y={arriba} width={der - izq} height={14} fill="#000" opacity={0.28} />
      <rect x={izq} y={arriba} width={10} height={abajo - arriba} fill="#000" opacity={0.22} />
      <rect x={der - 8} y={arriba} width={8} height={abajo - arriba} fill="#000" opacity={0.16} />
      {/* los listones */}
      <rect x={-40} y={-40} width={1160} height={arriba + 40} fill="url(#pz-marco)" />
      <rect x={-40} y={-40} width={1160} height={arriba + 40} filter="url(#pz-madera)" opacity={0.55} />
      <rect x={-40} y={-40} width={izq + 40} height={2000} fill="url(#pz-marcoV)" />
      <rect x={-40} y={-40} width={izq + 40} height={2000} filter="url(#pz-maderaV)" opacity={0.5} />
      <rect x={der} y={-40} width={1120 - der} height={2000} fill="url(#pz-marcoV)" />
      <rect x={der} y={-40} width={1120 - der} height={2000} filter="url(#pz-maderaV)" opacity={0.5} />
      <line x1={izq - 1} y1={arriba} x2={der + 1} y2={arriba} stroke="#3d220b" strokeWidth={2} />
      <line x1={izq} y1={arriba} x2={izq} y2={abajo} stroke="#3d220b" strokeWidth={2} />
      <line x1={der} y1={arriba} x2={der} y2={abajo} stroke="#3d220b" strokeWidth={2} />
      {/* la repisa: la cara de arriba (donde descansan las tizas) y el canto */}
      <rect x={-40} y={abajo} width={1160} height={2000 - abajo} fill="url(#pz-repisa)" />
      <rect x={-40} y={abajo} width={1160} height={2000 - abajo} filter="url(#pz-madera)" opacity={0.45} />
      <rect x={-40} y={abajo} width={1160} height={5} fill="#d7a26c" opacity={0.6} />
      <rect x={-40} y={abajo + 30} width={1160} height={3} fill="#3a1f08" opacity={0.6} />
      {/* el polvo de tiza en la repisa */}
      {Array.from({length: 90}, (_, k) => {
        const x = ((k * 211) % 1040) + 20, y = abajo + 6 + ((k * 37) % 20);
        return <rect key={k} x={x} y={y} width={2 + (k % 3)} height={2} fill="#f2efe4" opacity={0.25 + (k % 4) * 0.08} />;
      })}
      {/* las tizas */}
      {tizas.map((q, k) => (
        <g key={k} transform={`rotate(${(q.a * 180) / Math.PI} ${q.x + q.l / 2} ${abajo + 16})`}>
          <rect x={q.x + 3} y={abajo + 15} width={q.l} height={14} rx={7} fill="#000" opacity={0.35} />
          <rect x={q.x} y={abajo + 9} width={q.l} height={15} rx={7} fill={q.c} />
          <rect x={q.x + 4} y={abajo + 11} width={q.l - 10} height={4} rx={2} fill="#ffffff" opacity={0.35} />
        </g>
      ))}
      {/* el borrador: madera arriba, fieltro gris abajo, con su polvo */}
      <g transform={`rotate(-2 560 ${abajo + 18})`}>
        <rect x={478} y={abajo + 14} width={170} height={24} rx={5} fill="#000" opacity={0.35} />
        <rect x={470} y={abajo + 18} width={170} height={14} rx={3} fill="#7d7d78" />
        <rect x={470} y={abajo + 4} width={170} height={16} rx={5} fill="#b9824a" />
        <rect x={476} y={abajo + 6} width={158} height={4} rx={2} fill="#e0b17d" opacity={0.6} />
        <rect x={470} y={abajo + 26} width={170} height={6} fill="#e9e6dc" opacity={0.45} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- el cuarto en tiza, que se dibuja solo
// Cada trazo con su momento: arranca en t0 y tarda dur. Lo importante (el suelo, la esquina y la mesa) está antes de que empiece
// la tarjeta (0,2 s); los detalles (las tablas, la ventana, la diana) se siguen dibujando durante el primer tercio.
type TrazoCuarto = {d: string; t0: number; dur: number; w?: number; c?: Color; op?: number};
const pr = (x: number, y: number, z: number): P => proyecta([x, y, z]);

const lineasCuarto = (): TrazoCuarto[] => {
  const out: TrazoCuarto[] = [];
  const esquina = pr(MURO_X, SUELO, Z_PARED);
  // el suelo contra la pared del fondo, el zócalo, la esquina y el suelo contra la pared de la derecha
  out.push({d: raya(pr(-40, SUELO, Z_PARED), esquina, 0), t0: 0, dur: 0.16, w: W.cuarto});
  out.push({d: raya(pr(-40, SUELO - 46, Z_PARED), pr(MURO_X, SUELO - 46, Z_PARED), 0), t0: 0.08, dur: 0.18, w: W.fino, op: 0.75});
  out.push({d: raya(esquina, pr(MURO_X, -260, Z_PARED), 0), t0: 0.04, dur: 0.16, w: W.cuarto});
  out.push({d: raya(esquina, pr(MURO_X, SUELO, 760), 0), t0: 0.06, dur: 0.14, w: W.cuarto});
  out.push({d: raya(pr(MURO_X, SUELO - 46, Z_PARED), pr(MURO_X, SUELO - 46, 760), 0), t0: 0.14, dur: 0.16, w: W.fino, op: 0.75});
  // las tablas del suelo, hacia el punto de fuga
  [-420, -170, 80, 330, 580, 830].forEach((x, k) => {
    out.push({d: raya(pr(x, SUELO, Z_PARED), pr(x, SUELO, 760), 0), t0: 0.12 + k * 0.035, dur: 0.2, w: W.fino, op: 0.38});
  });
  // juntas sueltas entre tabla y tabla
  [[-170, 80, 140], [330, 580, -260], [580, 830, 420], [80, 330, 520], [-420, -170, -120]].forEach(([a, b, z], k) => {
    out.push({d: raya(pr(a, SUELO, z), pr(b, SUELO, z), 0), t0: 0.3 + k * 0.03, dur: 0.1, w: W.fino, op: 0.32});
  });
  // las juntas de la pared de la derecha (unas rayas de ladrillo, para que se lea que es pared)
  [1180, 1000, 820, 640].forEach((y, k) => {
    out.push({d: raya(pr(MURO_X, y, Z_PARED), pr(MURO_X, y, 300), 0), t0: 0.2 + k * 0.03, dur: 0.12, w: W.fino, op: 0.3});
  });
  // la ventana: el marco, el cristal, la cruz y el alféizar
  const [x0, y0, x1, y1] = [56, 250, 402, 690];
  out.push({d: rectMano(x0, y0, x1, y1, 9), t0: 0.2, dur: 0.18, w: W.cuarto});
  out.push({d: rectMano(x0 + 22, y0 + 22, x1 - 22, y1 - 22, 0), t0: 0.27, dur: 0.16, w: W.fino, op: 0.85});
  out.push({d: raya([(x0 + x1) / 2, y0 + 22], [(x0 + x1) / 2, y1 - 22], 0), t0: 0.33, dur: 0.08, w: W.detalle});
  out.push({d: raya([x0 + 22, 470], [x1 - 22, 470], 0), t0: 0.36, dur: 0.08, w: W.detalle});
  out.push({d: rectMano(x0 - 22, y1, x1 + 22, y1 + 26, 8), t0: 0.38, dur: 0.12, w: W.cuarto});
  // lo de fuera: el sol con sus rayos, una nube y las copas de dos árboles
  const sol: P = [150, 345];
  out.push({d: curva(Array.from({length: 17}, (_, j) => [sol[0] + Math.cos((j / 16) * 6.283) * 34, sol[1] + Math.sin((j / 16) * 6.283) * 34] as P)), t0: 0.4, dur: 0.1, w: W.detalle, c: 'amarillo'});
  for (let j = 0; j < 8; j++) {
    const a = (j / 8) * 6.283 + 0.2;
    out.push({d: raya([sol[0] + Math.cos(a) * 46, sol[1] + Math.sin(a) * 46], [sol[0] + Math.cos(a) * 64, sol[1] + Math.sin(a) * 64], 0), t0: 0.46 + j * 0.008, dur: 0.05, w: W.fino, c: 'amarillo'});
  }
  out.push({d: 'M 262 360 C 252 330, 290 318, 302 338 C 312 314, 352 320, 350 348 C 372 350, 372 378, 350 380 L 270 380 C 248 380, 246 362, 262 360 Z', t0: 0.44, dur: 0.12, w: W.fino});
  out.push({d: 'M 90 650 C 70 610, 110 570, 150 590 C 170 550, 240 556, 240 600 C 262 590, 300 610, 290 650', t0: 0.48, dur: 0.12, w: W.fino, c: 'azul', op: 0.8});
  // la diana de la pared (la del póster de los bloques)
  out.push({d: rectMano(690, 260, 900, 548, 9), t0: 0.3, dur: 0.16, w: W.cuarto});
  [86, 60, 34].forEach((r, k) => {
    out.push({d: curva(Array.from({length: 25}, (_, j) => [795 + Math.cos((j / 24) * 6.283 - 1.5) * r, 392 + Math.sin((j / 24) * 6.283 - 1.5) * r] as P)), t0: 0.36 + k * 0.05, dur: 0.12, w: W.detalle, c: k === 1 ? 'blanco' : 'rosa'});
  });
  out.push({d: raya([808, 380], [872, 318], 0), t0: 0.52, dur: 0.06, w: W.detalle});
  out.push({d: 'M 872 318 L 850 322 M 872 318 L 866 340', t0: 0.56, dur: 0.04, w: W.detalle});
  out.push({d: raya([730, 504], [860, 504], 0), t0: 0.5, dur: 0.06, w: W.detalle, op: 0.8});
  out.push({d: raya([750, 526], [840, 526], 0), t0: 0.53, dur: 0.05, w: W.detalle, op: 0.8});
  return out;
};
const LINEAS = lineasCuarto();

// el cuarto se dibuja más deprisa que lo que dicen sus tiempos (VEL veces): a los 0,42 s está entero, y en la tarjeta (que empieza
// en 0,2) se ve terminarse solo en su primer quinto
export const VEL = 1.4;
// cuándo termina de dibujarse el cuarto (lo usa el polvo)
export const FIN_CUARTO = Math.max(...LINEAS.map((l) => l.t0 + l.dur)) / VEL;

const kDe = (t: number, t0: number, dur: number) => E.outCubic(p(t, t0, dur));

const MESA = mesa();
export const Cuarto: React.FC<{t: number}> = ({t: tReal}) => {
  const t = tReal * VEL;
  const km = kDe(t, 0, 0.2);
  const m = MESA;
  return (
    <g>
      {LINEAS.map((l, k) => <Trazo key={k} d={l.d} w={l.w} c={l.c} k={kDe(t, l.t0, l.dur)} op={l.op} />)}
      {/* la mesa: las patas, el tablero y lo de encima (el monitor encendido con su gráfico, la taza, los papeles y dos bolas) */}
      {km > 0 && (
        <g opacity={Math.min(1, km * 1.6)}>
          {m.patas.map((c, k) => <Forma key={k} d={poli(c.silueta)} w={W.cuarto} />)}
          <Forma d={poli(m.tablero.silueta)} c="amarillo" w={W.cuarto} trama="pz-trama-suave" tinte={0.1} />
          {m.tablero.aristas.map(([a, b], k) => <Trazo key={k} d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`} w={W.fino} />)}
          <Forma d={poli(m.papeles.silueta)} w={W.fino} />
          <Forma d={poli(m.pie.silueta)} w={W.fino} />
          <Forma d={poli(m.pantalla.silueta)} w={W.cuarto} />
          <Forma d={poli(m.vidrio)} c="azul" borde="azul" w={W.fino} tinte={0.22} />
          <Trazo d={poli(grafico(m.vidrio), false)} w={W.fino} c="amarillo" k={kDe(t, 0.14, 0.12)} />
          <Forma d={poli(m.taza.silueta)} c="rosa" w={W.fino} tinte={0.3} />
          <Trazo d={curva(m.asa, false)} w={W.fino} />
          {m.bolas.map((b, k) => (
            <Forma key={k} d={curva(Array.from({length: 9}, (_, j) => [b.c[0] + Math.cos(j * 0.698 + k) * b.r * (0.88 + 0.12 * ((j * 7 + k) % 3) / 2), b.c[1] + Math.sin(j * 0.698 + k) * b.r * 0.9] as P), true)} w={W.fino} />
          ))}
        </g>
      )}
    </g>
  );
};
// un gráfico que sube en el monitor (un guiño: él tiene una app de gráficos)
const grafico = (q: P[]): P[] => {
  const [a, b, , d] = q; // arriba-izq, arriba-der, abajo-der, abajo-izq
  const en = (u: number, v: number): P => [a[0] + (b[0] - a[0]) * u + (d[0] - a[0]) * v, a[1] + (b[1] - a[1]) * u + (d[1] - a[1]) * v];
  return [[0.1, 0.78], [0.28, 0.6], [0.42, 0.68], [0.6, 0.4], [0.74, 0.5], [0.9, 0.2]].map(([u, v]) => en(u, v));
};

// ---------------------------------------------------------------- la cabecera de la lección (arriba a la izquierda)
export const Cabecera: React.FC<{t: number; intento: number}> = ({t: tReal, intento}) => {
  const t = tReal * VEL;
  return (
  <g>
    <Escrito txt={`Tiro nº ${intento + 1}`} x={64} y={150} tam={74} k={p(t, 0.22, 0.26)} rot={-2} />
    <Trazo d={raya([62, 176], [372, 168], 0)} w={W.detalle} k={kDe(t, 0.46, 0.1)} />
  </g>
  );
};
