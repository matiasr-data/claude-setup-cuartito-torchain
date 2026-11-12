import React from 'react';
import {E, clamp, p} from '../../../comun/curvas';
import {MURO_X, PAPELERA, type P} from '../escena';
import {VEL} from './Cuarto';
import {Cota, Escrito, Flecha, Forma, Trazo, W, curva, poli, raya, type Color, type Nube} from './tiza';

// PIZARRA DE TIZA, EL PROFE: lo que se anota en cada lanzamiento, como lo haría un profe que lo explica todo.
// La trayectoria va en puntos (en Pizarra.tsx); aquí, una anotación a mano en el momento clave de cada uno («¡casi!», «Δ = 29 cm»,
// «¡PAM!»…), su flecha, el «¡FALLO!» del final con su doble subrayado, y la puntuación en la esquina con palotes, que gana uno en
// cada fallo. En el 10, «¡DENTRO!» en grande, la papelera rodeada, estrellas, y el 0 de «Dentro» tachado y cambiado por un 1.
// Las posiciones están puestas a mano para cada lanzamiento, donde no pisan la bola ni al muñeco.

// cuánto mide un cm: la papelera tiene 15 cm de radio (así los Δ salen de medir, no de inventar)
const PX_CM = PAPELERA.rBorde / 15;
const cm = (px: number) => Math.round(px / PX_CM);

type Nota =
  | {tipo: 'texto'; t: number; dur?: number; txt: string; x: number; y: number; tam: number; c: Color; rot?: number; ancla?: 'start' | 'middle' | 'end'}
  | {tipo: 'flecha'; t: number; dur?: number; de: P; a: P; comba?: number; c: Color}
  | {tipo: 'cota'; t: number; dur?: number; a: P; b: P; txt: string; c: Color; tam?: number; desde?: number}
  | {tipo: 'delta'; t: number; dur?: number; txt: string; x: number; y: number; tam: number; c: Color}
  | {tipo: 'tacha'; t: number; dur?: number; de: P; a: P; c: Color}
  | {tipo: 'ovalo'; t: number; dur?: number; c0: P; rx: number; ry: number; c: Color}
  | {tipo: 'estrella'; t: number; dur?: number; c0: P; r: number; c: Color};
type Final = {t: number; dentro: boolean; x: number; y: number; tam: number};
type Guion = {notas: Nota[]; fin: Final};

const FALLO = (t: number, x = 560, y = 1786, tam = 118): Final => ({t, dentro: false, x, y, tam});

export const GUIONES: Guion[] = [
  // 0 · rebota en el borde y sale
  {notas: [
    {tipo: 'texto', t: 0.7, txt: '¡casi!', x: 770, y: 972, tam: 80, c: 'amarillo', rot: -6},
    {tipo: 'flecha', t: 0.75, de: [790, 994], a: [742, 1160], comba: 0.25, c: 'amarillo'},
    {tipo: 'delta', t: 0.9, txt: '= 2 cm', x: 800, y: 1046, tam: 54, c: 'azul'},
  ], fin: FALLO(1.3)},
  // 1 · se queda corta
  {notas: [
    {tipo: 'texto', t: 0.66, txt: '¡corta!', x: 486, y: 1010, tam: 80, c: 'amarillo', rot: -5},
    {tipo: 'flecha', t: 0.72, de: [520, 1032], a: [452, 1478], comba: -0.12, c: 'amarillo'},
  ], fin: FALLO(1.02, 600)},
  // 2 · se pasa, pega en la pared y cae detrás
  {notas: [
    {tipo: 'texto', t: 0.7, dur: 0.04, txt: '¡PAM!', x: 712, y: 1084, tam: 90, c: 'amarillo', rot: -8},
    {tipo: 'cota', t: 0.96, a: [PAPELERA.x + PAPELERA.rBorde + 8, 1290], b: [1040, 1290], txt: `= ${cm(MURO_X - PAPELERA.x - PAPELERA.rBorde)} cm`, c: 'azul', tam: 37, desde: 792},
  ], fin: FALLO(1.12)},
  // 3 · da vueltas en el borde y cae fuera
  {notas: [
    {tipo: 'texto', t: 0.64, txt: '¿entra?', x: 740, y: 990, tam: 78, c: 'amarillo', rot: -5},
    {tipo: 'texto', t: 1.3, txt: '¡nooo!', x: 770, y: 1080, tam: 72, c: 'rosa', rot: -6},
  ], fin: FALLO(1.48, 300)},
  // 4 · entra… y sale de un bote
  {notas: [
    {tipo: 'texto', t: 0.74, txt: '¡dentro!', x: 720, y: 1012, tam: 74, c: 'amarillo', rot: -4},
    {tipo: 'tacha', t: 1.12, de: [708, 994], a: [990, 974], c: 'rosa'},
    {tipo: 'texto', t: 1.16, txt: '¡fuera!', x: 750, y: 918, tam: 74, c: 'rosa', rot: -5},
  ], fin: FALLO(1.32)},
  // 5 · pega en el borde y vuelve hacia él
  {notas: [
    {tipo: 'texto', t: 0.7, txt: '¡cuidado!', x: 556, y: 960, tam: 76, c: 'rosa', rot: -6},
  ], fin: FALLO(1.3, 620)},
  // 6 · bota en el suelo y pasa por el lado
  {notas: [
    {tipo: 'texto', t: 0.54, txt: '¡bota!', x: 96, y: 1790, tam: 74, c: 'amarillo', rot: -4},
    {tipo: 'flecha', t: 0.58, de: [312, 1768], a: [526, 1668], comba: -0.2, c: 'amarillo'},
  ], fin: FALLO(1.06, 730, 1800, 100)},
  // 7 · choca con la lámpara y cae
  {notas: [
    {tipo: 'texto', t: 0.48, txt: '¡la lámpara!', x: 560, y: 704, tam: 70, c: 'amarillo', rot: -4},
    {tipo: 'flecha', t: 0.54, de: [592, 646], a: [520, 574], comba: 0.2, c: 'amarillo'},
  ], fin: FALLO(1.06, 600)},
  // 8 · se queda quieta en el borde… y cae fuera
  {notas: [
    {tipo: 'texto', t: 0.8, txt: '¿y ahora?', x: 470, y: 982, tam: 74, c: 'amarillo', rot: -5},
    {tipo: 'flecha', t: 0.86, de: [700, 996], a: [770, 1086], comba: -0.2, c: 'amarillo'},
    {tipo: 'texto', t: 1.36, txt: '¡nooo!', x: 776, y: 1010, tam: 72, c: 'rosa', rot: -6},
  ], fin: FALLO(1.56)},
  // 9 · ¡DENTRO!
  {notas: [
    {tipo: 'ovalo', t: 0.84, c0: [PAPELERA.x, PAPELERA.yBorde + 4], rx: 212, ry: 84, c: 'amarillo'},
    {tipo: 'texto', t: 0.86, txt: '¡DENTRO!', x: 690, y: 1036, tam: 128, c: 'amarillo', rot: -5, ancla: 'middle'},
    {tipo: 'estrella', t: 1.0, c0: [905, 862], r: 34, c: 'amarillo'},
    {tipo: 'estrella', t: 1.08, c0: [940, 1120], r: 26, c: 'rosa'},
    {tipo: 'estrella', t: 1.16, c0: [470, 860], r: 24, c: 'azul'},
  ], fin: {t: 0.9, dentro: true, x: 650, y: 1786, tam: 118}},
];

const DUR: Record<Nota['tipo'], number> = {texto: 0.3, flecha: 0.2, cota: 0.4, delta: 0.3, tacha: 0.1, ovalo: 0.2, estrella: 0.12};
const kDe = (t: number, t0: number, dur: number) => clamp((t - t0) / dur);

const estrellaPts = (c: P, r: number): P[] => Array.from({length: 11}, (_, j) => {
  const a = -Math.PI / 2 + (j * Math.PI) / 5;
  const q = j % 2 ? r * 0.45 : r;
  return [c[0] + Math.cos(a) * q, c[1] + Math.sin(a) * q];
});

const UnaNota: React.FC<{n: Nota; t: number}> = ({n, t}) => {
  const k = kDe(t, n.t, n.dur ?? DUR[n.tipo]);
  if (k <= 0) return null;
  switch (n.tipo) {
    case 'texto': return <Escrito txt={n.txt} x={n.x} y={n.y} tam={n.tam} c={n.c} k={k} rot={n.rot} ancla={n.ancla} />;
    case 'flecha': return <Flecha de={n.de} a={n.a} comba={n.comba} c={n.c} k={E.outCubic(k)} />;
    case 'cota': return <Cota a={n.a} b={n.b} txt={n.txt} c={n.c} k={k} tam={n.tam} desde={n.desde} />;
    case 'delta': {
      const d = `M ${n.x} ${n.y} L ${n.x + n.tam * 0.33} ${n.y - n.tam * 0.68} L ${n.x + n.tam * 0.66} ${n.y} Z`;
      return (
        <g>
          <Trazo d={d} w={W.fino + 0.5} c={n.c} k={clamp(k * 3)} />
          <Escrito txt={n.txt} x={n.x + n.tam * 0.78} y={n.y} tam={n.tam} c={n.c} k={clamp((k - 0.25) / 0.75)} />
        </g>
      );
    }
    case 'tacha': return <Trazo d={raya(n.de, n.a, 0)} w={W.gordo} c={n.c} k={E.outCubic(k)} />;
    case 'ovalo': {
      // un óvalo a mano: da una vuelta y un poco más, sin cerrar del todo
      const pts: P[] = Array.from({length: 34}, (_, j) => {
        const a = -2.6 + (j / 33) * (Math.PI * 2 + 0.5);
        const r = 1 + 0.04 * Math.sin(j * 0.9);
        return [n.c0[0] + Math.cos(a) * n.rx * r, n.c0[1] + Math.sin(a) * n.ry * r - j * 0.6];
      });
      return <Trazo d={curva(pts)} w={W.gordo} c={n.c} k={E.inOutCubic(k)} />;
    }
    case 'estrella': return k >= 0.5 ? <Forma d={poli(estrellaPts(n.c0, n.r * E.outBack(clamp(k)))) } c={n.c} borde={n.c} w={W.fino} tinte={0.5} tapa={false} /> : null;
  }
};

// ---------------------------------------------------------------- la puntuación: «Fallos» con palotes y «Dentro»
const PALO = {x: 830, y0: 78, y1: 138, paso: 19, grupo: 30};
const paloD = (j: number): string => {
  // j: 0..8. De cinco en cinco: cuatro de pie y el quinto tachando
  const g = Math.floor(j / 5), q = j % 5;
  const x0 = PALO.x + g * (4 * PALO.paso + PALO.grupo + 8);
  if (q === 4) return raya([x0 - 10, PALO.y1 - 8], [x0 + 3 * PALO.paso + 10, PALO.y0 + 10], 0);
  const x = x0 + q * PALO.paso + (j % 2) * 1.5;
  return raya([x, PALO.y0 + (q % 2) * 3], [x + 2, PALO.y1 - (q % 3) * 2], 0);
};
export const Marcador: React.FC<{t: number; i: number}> = ({t, i}) => {
  const g = GUIONES[i];
  const tc = t * VEL; // lo de siempre (las palabras, la raya y los palotes de antes) se dibuja con el cuarto
  const kCaja = E.outCubic(p(tc, 0.3, 0.2));
  const kNuevo = g.fin.dentro ? 0 : E.outCubic(p(t, g.fin.t + 0.12, 0.1));
  const kDentro = g.fin.dentro ? p(t, g.fin.t + 0.1, 0.4) : 0;
  return (
    <g>
      <Escrito txt="Fallos" x={636} y={128} tam={54} k={p(tc, 0.3, 0.16)} />
      <Escrito txt="Dentro" x={636} y={218} tam={54} k={p(tc, 0.4, 0.16)} />
      <Trazo d={raya([624, 160], [1012, 156], 0)} w={W.fino} op={0.7} k={kCaja} />
      {Array.from({length: i}, (_, j) => <Trazo key={j} d={paloD(j)} w={W.cuarto} k={E.outCubic(p(tc, 0.36 + j * 0.02, 0.06))} />)}
      {kNuevo > 0 && <Trazo d={paloD(i)} w={W.gordo} c="rosa" k={kNuevo} />}
      {/* el 0 de dentro; en el 10, tachado y un 1 al lado, con su ✓ */}
      <Escrito txt="0" x={846} y={220} tam={60} k={p(tc, 0.46, 0.06)} />
      {kDentro > 0 && (
        <g>
          <Trazo d={raya([828, 222], [886, 172], 0)} w={W.cuarto} c="rosa" k={clamp(kDentro / 0.25)} />
          <Escrito txt="1" x={900} y={222} tam={70} c="amarillo" k={clamp((kDentro - 0.25) / 0.25)} />
          <Trazo d="M 948 190 L 966 214 L 1004 158" w={W.gordo} c="amarillo" k={clamp((kDentro - 0.55) / 0.45)} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- todas las notas y el final de cada lanzamiento
export const Notas: React.FC<{t: number; i: number}> = ({t, i}) => {
  const g = GUIONES[i];
  const f = g.fin;
  const kFin = kDe(t, f.t, 0.26);
  return (
    <g>
      {g.notas.map((n, k) => <UnaNota key={k} n={n} t={t} />)}
      {!f.dentro && kFin > 0 && (
        <g>
          <Escrito txt="¡FALLO!" x={f.x} y={f.y} tam={f.tam} c="rosa" k={kFin} rot={-4} ancla="middle" />
          <Trazo d={raya([f.x - f.tam * 1.7, f.y + 24], [f.x + f.tam * 1.7, f.y + 4], 0)} w={W.gordo} c="rosa" k={kDe(t, f.t + 0.28, 0.08)} />
          <Trazo d={raya([f.x - f.tam * 1.5, f.y + 46], [f.x + f.tam * 1.6, f.y + 28], 0)} w={W.cuarto} c="rosa" k={kDe(t, f.t + 0.36, 0.08)} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- el polvo que suelta la tiza al escribir y en los golpes
export const nubesNotas = (i: number): Nube[] => {
  const g = GUIONES[i];
  const out: Nube[] = [];
  g.notas.forEach((n, k) => {
    const sitio: P = n.tipo === 'texto' || n.tipo === 'delta' ? [n.x + (n.tipo === 'texto' && n.ancla === 'middle' ? 0 : n.tam * 1.4), n.y]
      : n.tipo === 'flecha' || n.tipo === 'tacha' ? n.a : n.tipo === 'cota' ? n.b : n.c0;
    out.push({t: n.t + (n.dur ?? DUR[n.tipo]) * 0.8, x: sitio[0], y: sitio[1], n: 14, ancho: 70, semilla: i * 100 + k});
  });
  if (!g.fin.dentro) out.push({t: g.fin.t + 0.2, x: g.fin.x, y: g.fin.y, n: 26, ancho: 260, semilla: i * 100 + 50});
  else out.push({t: g.fin.t + 0.5, x: 960, y: 200, n: 18, ancho: 80, semilla: i * 100 + 51});
  out.push({t: g.fin.t + 0.22, x: PALO.x + 60, y: PALO.y1, n: 12, ancho: 80, semilla: i * 100 + 52});
  return out;
};
