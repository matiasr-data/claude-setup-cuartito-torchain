import React from 'react';
import {rng} from '../../comun/curvas';
import {Cel, Destello, type Tinta} from '../AnimeCel';
import {BORDE, FONDO_SUELO, MESA_G, MESA_Y, SUELO, type P} from './escena';

// 7 · ANIME, la cocina del gato: un decorado pintado de tarde, como los de una serie de televisión.
// La pared crema con su zócalo de friso, la ventana a la derecha con el cielo del atardecer, las nubes en cel,
// la ciudad lila y el sol que entra en rayos diagonales con su polvo; a la izquierda, el reloj y la balda con los botes; el suelo de
// tablas en perspectiva; la mesa de madera y, debajo, el cuenco vacío (el motivo). La luz entra de arriba a la derecha (la ventana),
// como en AnimeCel: la sombra de cada cel cae del lado contrario.

const F = FONDO_SUELO;
const TAU = Math.PI * 2;
const f1 = (n: number) => n.toFixed(1);
const circ = (x: number, y: number, r: number) =>
  `M ${f1(x - r)} ${f1(y)} A ${r} ${r} 0 1 0 ${f1(x + r)} ${f1(y)} A ${r} ${r} 0 1 0 ${f1(x - r)} ${f1(y)} Z`;
const caja = (x: number, y: number, w: number, h: number) => `M ${f1(x)} ${f1(y)} H ${f1(x + w)} V ${f1(y + h)} H ${f1(x)} Z`;
const cajaR = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${f1(x + r)} ${f1(y)} H ${f1(x + w - r)} Q ${f1(x + w)} ${f1(y)} ${f1(x + w)} ${f1(y + r)} V ${f1(y + h - r)} Q ${f1(x + w)} ${f1(y + h)} ${f1(x + w - r)} ${f1(y + h)} H ${f1(x + r)} Q ${f1(x)} ${f1(y + h)} ${f1(x)} ${f1(y + h - r)} V ${f1(y + r)} Q ${f1(x)} ${f1(y)} ${f1(x + r)} ${f1(y)} Z`;

export const MADERA: Tinta = {luz: '#CD8C55', sombra: '#985B33', brillo: '#F0B47C', linea: '#4A2A1A'};
const MARCO: Tinta = {luz: '#FFF8EC', sombra: '#E4CCAE', brillo: '#FFFFFF', linea: '#9A7A5E'};
const VOLANTE: Tinta = {luz: '#9FDDC8', sombra: '#68B4A0', brillo: '#D4F5E8', linea: '#2D6A5C'};
const MACETA: Tinta = {luz: '#E5814F', sombra: '#B25634', brillo: '#F7A77B', linea: '#5A2818'};
const HOJA: Tinta = {luz: '#64BC6E', sombra: '#3A8A4E', brillo: '#9BDD90', linea: '#1E4C2B'};
const CUENCO: Tinta = {luz: '#FF8FB0', sombra: '#DB5F87', brillo: '#FFC2D4', linea: '#5C1530'};

// ---------------------------------------------------------------- la ventana (marco por fuera)
export const VENTANA = {x: 600, y: 182, w: 420, h: 556};
const VID = {x: VENTANA.x + 18, y: VENTANA.y + 18, w: VENTANA.w - 36, h: VENTANA.h - 36};
const MX = VID.x + VID.w / 2; // el parteluz
const MY = 446; // el travesaño
export const SOL: P = [928, 336];
const PANES: [number, number, number, number][] = [
  [VID.x, VID.y, MX - 7, MY - 7], [MX + 7, VID.y, VID.x + VID.w, MY - 7],
  [VID.x, MY + 7, MX - 7, VID.y + VID.h], [MX + 7, MY + 7, VID.x + VID.w, VID.y + VID.h],
];
const D: P = [-620, 900]; // por dónde caen los rayos

const NUBE: [number, number, number][] = [[0, 0, 34], [36, -18, 44], [78, -2, 34], [42, 12, 30], [-32, 10, 24], [108, 10, 24], [72, 16, 26]];
const NUBES: [number, number, number][] = [[660, 300, 0.78], [846, 410, 0.95], [1010, 520, 0.7], [690, 560, 0.6]];

const Ventana: React.FC<{t: number; pre: string}> = ({t, pre}) => {
  const r = rng(5);
  const edificios = Array.from({length: 11}, (_, i) => ({x: VID.x - 10 + i * 38 + r() * 10, w: 30 + r() * 26, h: 46 + r() * 110}));
  const cerca = Array.from({length: 6}, (_, i) => ({x: VID.x + 6 + i * 66 + r() * 20, w: 46 + r() * 26, h: 30 + r() * 70}));
  return (
    <g>
      <defs><clipPath id={pre + 'vid'}><rect x={VID.x} y={VID.y} width={VID.w} height={VID.h} /></clipPath></defs>
      {/* el halo de la ventana en la pared */}
      <ellipse cx={VENTANA.x + VENTANA.w / 2} cy={VENTANA.y + VENTANA.h / 2 + 30} rx={560} ry={640} fill={`url(#${pre}halo)`} />
      <Cel id={pre + 'vm'} ds={[caja(VENTANA.x, VENTANA.y, VENTANA.w, VENTANA.h)]} tinta={MARCO} grosor={1.6} s={10} h={3} />
      <g clipPath={`url(#${pre}vid)`}>
        <rect x={VID.x} y={VID.y} width={VID.w} height={VID.h} fill={`url(#${pre}cielo)`} />
        <circle cx={SOL[0]} cy={SOL[1]} r={170} fill={`url(#${pre}sol)`} />
        <circle cx={SOL[0]} cy={SOL[1]} r={38} fill="#FFF8E4" />
        <g filter={`url(#${pre}suave)`}>
          {NUBES.map(([x, y, k], i) => (
            <g key={i} transform={`translate(${f1(x + 7 * t * (1 + i * 0.3))} ${y}) scale(${k})`}>
              <Cel id={`${pre}n${i}`} ds={NUBE.map(([a, b, rr]) => circ(a, b, rr))} tinta={{luz: '#FFFDF6', sombra: '#EBC3D6', brillo: '#FFE9C2'}} s={11} h={4} L={[0.45, -0.89]} />
            </g>
          ))}
        </g>
        {edificios.map((b, i) => <rect key={'l' + i} x={b.x} y={VID.y + VID.h - b.h} width={b.w} height={b.h + 10} fill="#D9C6EC" />)}
        {cerca.map((b, i) => (
          <g key={'c' + i}>
            <Cel id={`${pre}ed${i}`} ds={[caja(b.x, VID.y + VID.h - b.h, b.w, b.h + 10)]} tinta={{luz: '#B9A5DF', sombra: '#9483C4'}} s={9} />
            {Array.from({length: Math.floor((b.w - 8) / 14) * Math.floor(b.h / 20)}, (_, k) => {
              const cols = Math.floor((b.w - 8) / 14);
              const cx = k % cols, cy = Math.floor(k / cols);
              const on = (cx * 7 + cy * 3 + i) % 3 !== 0;
              return <rect key={k} x={b.x + 6 + cx * 14} y={VID.y + VID.h - b.h + 9 + cy * 20} width={6} height={9} fill={on ? '#FFF0C4' : '#8E7EC0'} opacity={on ? 0.85 : 0.6} />;
            })}
          </g>
        ))}
        {/* el reflejo del cristal */}
        <path d={`M ${VID.x + 40} ${VID.y + VID.h} L ${VID.x + 100} ${VID.y + VID.h} L ${VID.x + 300} ${VID.y} L ${VID.x + 240} ${VID.y} Z`} fill="#FFFFFF" opacity={0.17} />
        <path d={`M ${VID.x + 124} ${VID.y + VID.h} L ${VID.x + 142} ${VID.y + VID.h} L ${VID.x + 342} ${VID.y} L ${VID.x + 324} ${VID.y} Z`} fill="#FFFFFF" opacity={0.15} />
      </g>
      <path d={`M ${VID.x} ${VID.y + VID.h} V ${VID.y} H ${VID.x + VID.w}`} fill="none" stroke="#CDB394" strokeWidth={5} />
      <Cel id={pre + 'pv'} ds={[caja(MX - 7, VID.y, 14, VID.h)]} tinta={MARCO} grosor={1.3} s={5} h={2} />
      <Cel id={pre + 'ph'} ds={[caja(VID.x, MY - 7, VID.w, 14)]} tinta={MARCO} grosor={1.3} s={5} h={2} />
      {/* el alféizar, con su maceta */}
      <Cel id={pre + 'al'} ds={[caja(VENTANA.x - 18, VENTANA.y + VENTANA.h - 4, VENTANA.w + 36, 22)]} tinta={MARCO} grosor={1.6} s={7} h={3} />
      <rect x={VENTANA.x - 12} y={VENTANA.y + VENTANA.h + 18} width={VENTANA.w + 24} height={6} fill="#C9A47C" opacity={0.6} />
      <g>
        {[[-0.5, 1], [0.1, 1.15], [0.6, 0.95]].map(([a, k], i) => {
          const b: P = [968, VENTANA.y + VENTANA.h - 44];
          const tip: P = [b[0] + Math.sin(a) * 52 * k, b[1] - Math.cos(a) * 52 * k];
          const n: P = [Math.cos(a) * 14, Math.sin(a) * 14];
          const m: P = [(b[0] + tip[0]) / 2, (b[1] + tip[1]) / 2];
          return <Cel key={i} id={`${pre}vh${i}`} ds={[`M ${f1(b[0])} ${f1(b[1])} Q ${f1(m[0] + n[0])} ${f1(m[1] + n[1])} ${f1(tip[0])} ${f1(tip[1])} Q ${f1(m[0] - n[0])} ${f1(m[1] - n[1])} ${f1(b[0])} ${f1(b[1])} Z`]} tinta={HOJA} grosor={1.6} s={5} h={2} />;
        })}
        <Cel id={pre + 'vmc'} ds={[`M 940 ${VENTANA.y + VENTANA.h - 48} H 996 L 990 ${VENTANA.y + VENTANA.h - 4} H 946 Z`]} tinta={MACETA} grosor={1.6} s={6} h={2} />
      </g>
      {/* el volante de tela de arriba, de cuadros menta */}
      <rect x={VENTANA.x - 34} y={VENTANA.y - 30} width={VENTANA.w + 68} height={7} rx={3} fill="#8A6A4E" />
      <Cel id={pre + 'vo'} ds={[(() => {
        const x0 = VENTANA.x - 28, x1 = VENTANA.x + VENTANA.w + 28, y0 = VENTANA.y - 26, y1 = VENTANA.y + 38;
        const n = 9, w = (x1 - x0) / n;
        let d = `M ${x0} ${y0} H ${x1} V ${y1}`;
        for (let i = n - 1; i >= 0; i--) d += ` Q ${f1(x0 + (i + 0.5) * w)} ${f1(y1 + 22)} ${f1(x0 + i * w)} ${y1}`;
        return d + ' Z';
      })()]} tinta={VOLANTE} grosor={1.8} s={8} h={3} />
      <g opacity={0.35} clipPath={`url(#${pre}vo)`}>
        {Array.from({length: 18}, (_, i) => <rect key={i} x={VENTANA.x - 28 + i * 28} y={VENTANA.y - 30} width={12} height={100} fill="#FFFFFF" />)}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- el reloj y la balda con los botes (a la izquierda)
const Reloj: React.FC<{t: number; pre: string}> = ({t, pre}) => {
  const [x, y] = [196, 286];
  const mano = (a: number, l: number, w: number, color: string) => {
    const ar = (a * Math.PI) / 180;
    return <line x1={x} y1={y} x2={x + Math.sin(ar) * l} y2={y - Math.cos(ar) * l} stroke={color} strokeWidth={w} strokeLinecap="round" />;
  };
  return (
    <g>
      <Cel id={pre + 'ra'} ds={[circ(x, y, 60)]} tinta={{luz: '#EA605C', sombra: '#B83F4A', brillo: '#FF9C92', linea: '#6A2229'}} grosor={1.8} s={8} h={3} />
      <Cel id={pre + 'rb'} ds={[circ(x, y, 48)]} tinta={{luz: '#FFFDF6', sombra: '#E9DDEA'}} s={6} />
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * TAU;
        const r1 = i % 3 === 0 ? 36 : 40;
        return <line key={i} x1={x + Math.cos(a) * r1} y1={y + Math.sin(a) * r1} x2={x + Math.cos(a) * 44} y2={y + Math.sin(a) * 44} stroke="#6B5A63" strokeWidth={i % 3 === 0 ? 3 : 2} />;
      })}
      {mano(170, 24, 6, '#2B1B22')}
      {mano(240, 36, 4.5, '#2B1B22')}
      {mano(6 * Math.floor(t + 20), 38, 2, '#E0483E')}
      <circle cx={x} cy={y} r={4.5} fill="#2B1B22" />
    </g>
  );
};

const Balda: React.FC<{pre: string}> = ({pre}) => {
  const Y = 538; // la cara de arriba de la balda
  const bote = (id: string, x: number, w: number, h: number, dentro: string, tapa: string) => (
    <g key={id}>
      <Cel id={pre + id} ds={[cajaR(x, Y - h, w, h, 10)]} tinta={{luz: '#E3F2F6', sombra: '#B9D6E2', linea: '#5F7F8E'}} grosor={1.4} s={7} h={2} />
      <path d={cajaR(x + 6, Y - h * 0.68, w - 12, h * 0.68 - 6, 7)} fill={dentro} />
      <path d={cajaR(x + 6, Y - h * 0.68, (w - 12) * 0.35, h * 0.68 - 6, 7)} fill="#000000" opacity={0.12} />
      <rect x={x + 8} y={Y - h + 16} width={6} height={h - 30} rx={3} fill="#FFFFFF" opacity={0.85} />
      <Cel id={pre + id + 't'} ds={[cajaR(x - 4, Y - h - 14, w + 8, 18, 5)]} tinta={{luz: tapa, sombra: '#00000000', linea: '#3A2418'}} grosor={1.4} s={0} />
      <rect x={x - 4} y={Y - h - 4} width={w + 8} height={8} fill="#000000" opacity={0.18} />
    </g>
  );
  return (
    <g>
      {bote('b1', 58, 62, 104, '#F2C14E', '#E8685A')}
      {bote('b2', 140, 58, 78, '#8A5534', '#F5E7CF')}
      {/* la maceta colgante, con hojas que caen por el borde */}
      {[[-0.9, 1.0], [-0.35, 1.2], [0.25, 1.05], [0.85, 0.9]].map(([a, k], i) => {
        const b: P = [256, Y - 52];
        const tip: P = [b[0] + Math.sin(a) * 64 * k, b[1] - Math.cos(a) * 64 * k];
        const n: P = [Math.cos(a) * 16, Math.sin(a) * 16];
        const m: P = [(b[0] + tip[0]) / 2, (b[1] + tip[1]) / 2];
        return <Cel key={i} id={`${pre}bh${i}`} ds={[`M ${f1(b[0])} ${f1(b[1])} Q ${f1(m[0] + n[0])} ${f1(m[1] + n[1])} ${f1(tip[0])} ${f1(tip[1])} Q ${f1(m[0] - n[0])} ${f1(m[1] - n[1])} ${f1(b[0])} ${f1(b[1])} Z`]} tinta={HOJA} grosor={1.6} s={5} h={2} />;
      })}
      {[0, 1].map((i) => (
        <path key={i} d={`M ${284 + i * 18} ${Y - 30} C ${300 + i * 24} ${Y + 10} ${296 + i * 26} ${Y + 60} ${304 + i * 30} ${Y + 96 + i * 30}`} fill="none" stroke="#3A8A4E" strokeWidth={4} strokeLinecap="round" />
      ))}
      {[[318, Y + 50], [324, Y + 92], [348, Y + 128], [312, Y + 20]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={13} ry={8} transform={`rotate(${30 + i * 25} ${x} ${y})`} fill="#64BC6E" stroke="#1E4C2B" strokeWidth={1.6} />
      ))}
      <Cel id={pre + 'bm'} ds={[`M 222 ${Y - 58} H 290 L 282 ${Y} H 230 Z`]} tinta={MACETA} grosor={1.6} s={7} h={2} />
      {/* la balda y sus escuadras */}
      <Cel id={pre + 'bd'} ds={[caja(36, Y, 340, 18)]} tinta={MADERA} grosor={1.6} s={6} h={3} />
      {[70, 330].map((x) => <path key={x} d={`M ${x} ${Y + 18} V ${Y + 62} L ${x + 8} ${Y + 62} L ${x + 34} ${Y + 18} Z`} fill="#8A5A3A" stroke="#4A2A1A" strokeWidth={1.5} />)}
      <rect x={36} y={Y + 18} width={340} height={10} fill="#6B3A1C" opacity={0.18} />
    </g>
  );
};

// ---------------------------------------------------------------- los rayos del sol y su polvo
const Rayos: React.FC<{t: number; pre: string}> = ({t, pre}) => {
  const vive = 0.85 + 0.15 * Math.sin((TAU * t) / 3);
  const r = rng(55);
  const polvo = Array.from({length: 30}, (_, k) => {
    const u = 0.1 + r() * 0.85, v = r(), fase = r(), tam = 2 + r() * 2.6;
    const x = VID.x + v * VID.w + D[0] * u + 14 * Math.sin(TAU * (t / 6 + fase));
    const y = VID.y + VID.h * 0.3 + D[1] * u - 20 * Math.sin(TAU * (t / 6 + fase * 2));
    const a = 0.3 + 0.7 * Math.abs(Math.sin(TAU * (t / 3 + fase)));
    return k % 7 === 0 ? <Destello key={k} x={x} y={y} r={tam * 2.6} alfa={a} giro={20} /> : <circle key={k} cx={x} cy={y} r={tam} fill="#FFF8E2" opacity={a * 0.85} />;
  });
  return (
    <g>
      <defs>
        {PANES.map(([x0, y0, x1], k) => (
          <linearGradient key={k} id={`${pre}rayo${k}`} gradientUnits="userSpaceOnUse" x1={(x0 + x1) / 2} y1={y0} x2={(x0 + x1) / 2 + D[0]} y2={y0 + D[1]}>
            <stop offset={0} stopColor="#FFF4D4" stopOpacity={0.6} />
            <stop offset={0.55} stopColor="#FFF4D4" stopOpacity={0.26} />
            <stop offset={1} stopColor="#FFF2CE" stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      <g opacity={vive} style={{mixBlendMode: 'screen'}}>
        {PANES.map(([x0, y0, x1, y1], k) => (
          <path key={k} fill={`url(#${pre}rayo${k})`}
            d={`M ${f1(x0)} ${f1(y0)} L ${f1(x1)} ${f1(y0)} L ${f1(x1)} ${f1(y1)} L ${f1(x1 + D[0])} ${f1(y1 + D[1])} L ${f1(x0 + D[0])} ${f1(y1 + D[1])} L ${f1(x0 + D[0])} ${f1(y0 + D[1])} Z`} />
        ))}
      </g>
      {polvo}
    </g>
  );
};

// ---------------------------------------------------------------- el suelo de tablas, en perspectiva (fuga a la altura de sus ojos)
const FUGA: P = [560, 760];
const Suelo: React.FC<{pre: string}> = ({pre}) => {
  const at = (xPared: number, y: number) => FUGA[0] + ((xPared - FUGA[0]) * (y - FUGA[1])) / (F - FUGA[1]);
  const W = 96;
  const filas = [F, 1600, 1690, 1800, 1940];
  const tablas: React.ReactNode[] = [], juntas: React.ReactNode[] = [];
  for (let i = -9; i <= 16; i++) {
    const xa = i * W - 20, xb = xa + W;
    for (let j = 0; j < filas.length - 1; j++) {
      const y0 = filas[j], y1 = filas[j + 1];
      const tono = rng(i * 31 + j * 7 + 3)();
      tablas.push(
        <path key={`t${i}_${j}`} d={`M ${f1(at(xa, y0))} ${y0} L ${f1(at(xb, y0))} ${y0} L ${f1(at(xb, y1))} ${y1} L ${f1(at(xa, y1))} ${y1} Z`}
          fill={tono > 0.5 ? '#FFFFFF' : '#5A2E10'} opacity={tono > 0.5 ? (tono - 0.5) * 0.16 : (0.5 - tono) * 0.16} />,
      );
      // las juntas de testa, al tresbolillo
      if (j > 0 && (i + j) % 2 === 0) juntas.push(<line key={`j${i}_${j}`} x1={at(xa, y0)} y1={y0} x2={at(xb, y0)} y2={y0} stroke="#9A6235" strokeWidth={2} />);
    }
    juntas.push(<line key={'l' + i} x1={at(xa, F)} y1={F} x2={at(xa, 1940)} y2={1940} stroke="#9A6235" strokeWidth={2.2} />);
    const xv = xa + W * 0.4;
    juntas.push(<line key={'v' + i} x1={at(xv, 1640)} y1={1640} x2={at(xv, 1760)} y2={1760} stroke="#EDBD89" strokeWidth={1.8} opacity={0.6} />);
  }
  return (
    <g>
      <rect x={-20} y={F} width={1120} height={1920 - F + 80} fill={`url(#${pre}suelo)`} />
      {tablas}
      {juntas}
      <rect x={-20} y={F} width={1120} height={40} fill="#FFE2B4" opacity={0.3} />
    </g>
  );
};

// ---------------------------------------------------------------- la alfombra trenzada, el saco de pienso (cerrado) y el trapo
const Alfombra: React.FC = () => {
  const c: P = [400, SUELO + 22];
  const anillos: [number, string][] = [[352, '#B9A5DF'], [318, '#FFF3E0'], [286, '#7FC9B8'], [246, '#FFF3E0'], [212, '#F59AB0'], [170, '#FFF3E0'], [128, '#B9A5DF']];
  return (
    <g>
      <ellipse cx={c[0]} cy={c[1] + 6} rx={360} ry={58} fill="#5A2C12" opacity={0.2} />
      <ellipse cx={c[0]} cy={c[1]} rx={356} ry={56} fill="#3E2A4E" />
      {anillos.map(([rx, col], i) => <ellipse key={i} cx={c[0]} cy={c[1]} rx={rx} ry={rx * 0.155} fill={col} />)}
      <ellipse cx={c[0]} cy={c[1] - 4} rx={340} ry={44} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.35} strokeDasharray="10 12" />
    </g>
  );
};

const Saco: React.FC<{pre: string}> = ({pre}) => {
  const x = 176, y = SUELO - 4, w = 132, h = 196;
  return (
    <g>
      <ellipse cx={x + w / 2} cy={y + 2} rx={w * 0.62} ry={8} fill="#4A230E" opacity={0.3} />
      <Cel id={pre + 'sa'} ds={[`M ${x + 6} ${y - h} L ${x + w - 6} ${y - h} L ${x + w + 4} ${y - 14} Q ${x + w + 4} ${y} ${x + w - 10} ${y} L ${x + 10} ${y} Q ${x - 4} ${y} ${x - 4} ${y - 14} Z`]}
        tinta={{luz: '#EFCB92', sombra: '#C99B5E', brillo: '#FFE6B8', linea: '#5A3A1C'}} grosor={2} s={12} h={3} />
      {/* el doblez de arriba */}
      <Cel id={pre + 'sd'} ds={[caja(x + 2, y - h - 8, w - 4, 30)]} tinta={{luz: '#E2B97A', sombra: '#B88A52', linea: '#5A3A1C'}} grosor={2} s={6} />
      {[0.25, 0.5, 0.75].map((k) => <line key={k} x1={x + 2 + (w - 4) * k} y1={y - h - 6} x2={x + 2 + (w - 4) * k} y2={y - h + 20} stroke="#8A6236" strokeWidth={1.6} />)}
      {/* la etiqueta: un pescado y una huella */}
      <ellipse cx={x + w / 2} cy={y - h * 0.46} rx={46} ry={40} fill="#FFFDF5" stroke="#5A3A1C" strokeWidth={2} />
      <g transform={`translate(${x + w / 2 - 4} ${y - h * 0.5})`}>
        <path d="M -26 0 C -14 -16 12 -16 22 0 C 12 16 -14 16 -26 0 Z" fill="#FF9A5A" stroke="#5A2818" strokeWidth={2} />
        <path d="M 22 0 L 36 -12 L 34 12 Z" fill="#FF9A5A" stroke="#5A2818" strokeWidth={2} strokeLinejoin="round" />
        <circle cx={-14} cy={-3} r={3.4} fill="#2B1B22" />
      </g>
      <g transform={`translate(${x + w / 2} ${y - h * 0.18})`} fill="#C99B5E">
        <ellipse cx={0} cy={4} rx={9} ry={7} />
        {[-11, -4, 4, 11].map((dx, i) => <circle key={i} cx={dx} cy={i === 0 || i === 3 ? -4 : -9} r={3.6} />)}
      </g>
    </g>
  );
};

const Trapo: React.FC<{t: number; pre: string}> = ({t, pre}) => {
  const x = 940, y = 906, w = 76, h = 150;
  const mece = 1.6 * Math.sin((TAU * t) / 2.4);
  return (
    <g>
      <circle cx={x + w / 2} cy={y - 10} r={8} fill="#8A6A4E" stroke="#4A2A1A" strokeWidth={2} />
      <g transform={`rotate(${mece.toFixed(2)} ${x + w / 2} ${y - 6})`}>
        <Cel id={pre + 'tp'} ds={[`M ${x + w / 2} ${y - 8} L ${x + w} ${y + 10} L ${x + w - 4} ${y + h} L ${x + 4} ${y + h} L ${x} ${y + 10} Z`]} tinta={VOLANTE} grosor={1.8} s={9} h={3} />
        <g clipPath={`url(#${pre}tp)`} fill="#FFFFFF" opacity={0.45}>
          {[0, 1, 2, 3].map((i) => <rect key={'v' + i} x={x + 4 + i * 20} y={y} width={9} height={h} />)}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={'h' + i} x={x} y={y + 14 + i * 20} width={w} height={9} />)}
        </g>
        <rect x={x + 2} y={y + h - 22} width={w - 6} height={8} fill="#E0483E" opacity={0.85} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- el cuenco vacío, debajo de la mesa
const Cuenco: React.FC<{pre: string}> = ({pre}) => (
  <g>
    <ellipse cx={494} cy={SUELO + 4} rx={86} ry={9} fill="#6B3A1C" opacity={0.25} />
    <Cel id={pre + 'cn'} ds={[`M 424 ${SUELO - 40} H 564 L 548 ${SUELO} H 440 Z`]} tinta={CUENCO} grosor={2} s={9} h={3} />
    <ellipse cx={494} cy={SUELO - 40} rx={70} ry={8} fill="#B8476C" stroke="#5C1530" strokeWidth={2} />
    {/* la espina de pescado */}
    <g stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" fill="none">
      <path d={`M 470 ${SUELO - 20} H 512`} />
      {[478, 488, 498].map((x) => <path key={x} d={`M ${x} ${SUELO - 28} L ${x + 5} ${SUELO - 20} L ${x} ${SUELO - 12}`} />)}
      <path d={`M 512 ${SUELO - 20} L 522 ${SUELO - 28} M 512 ${SUELO - 20} L 522 ${SUELO - 12}`} />
    </g>
    <circle cx={466} cy={SUELO - 20} r={4} fill="#FFFFFF" />
  </g>
);

// ---------------------------------------------------------------- la mesa: el tablero visto un poco desde arriba, el faldón y las patas
export const Mesa: React.FC<{pre: string}> = ({pre}) => (
  <g>
    {/* la sombra en el suelo */}
    <ellipse cx={392} cy={SUELO + 6} rx={340} ry={18} fill="#5A2C12" opacity={0.22} />
    {[123, 665].map((x) => <ellipse key={x} cx={x} cy={SUELO + 2} rx={28} ry={6} fill="#4A230E" opacity={0.35} />)}
    <Cel id={pre + 'mp'} ds={[caja(110, MESA_Y + MESA_G - 4, 26, SUELO - MESA_Y - MESA_G + 4), caja(652, MESA_Y + MESA_G - 4, 26, SUELO - MESA_Y - MESA_G + 4)]} tinta={MADERA} grosor={2} s={8} h={3} />
    <Cel id={pre + 'mf'} ds={[caja(124, MESA_Y + MESA_G - 2, 540, 40)]} tinta={{luz: '#B67644', sombra: '#87502C', linea: '#4A2A1A'}} grosor={2} s={7} />
    <rect x={124} y={MESA_Y + MESA_G - 2} width={540} height={10} fill="#4A2A1A" opacity={0.3} />
    {/* el tablero: la cara de arriba (clara) y el canto */}
    <Cel id={pre + 'mt'} ds={[`M -30 ${MESA_Y - 16} H ${BORDE - 12} L ${BORDE} ${MESA_Y} H -30 Z`]} tinta={{luz: '#EAB27A', sombra: '#D79A62', brillo: '#FFD4A0', linea: '#4A2A1A'}} grosor={2} s={4} h={2} L={[0.6, -0.8]} />
    <Cel id={pre + 'mc'} ds={[caja(-30, MESA_Y, BORDE + 30, MESA_G)]} tinta={MADERA} grosor={2} s={10} h={3} />
    <path d={`M 40 ${MESA_Y + 12} H 300 M 380 ${MESA_Y + 24} H 640`} stroke="#E8A874" strokeWidth={2} opacity={0.7} />
  </g>
);

// ---------------------------------------------------------------- todo el fondo
export const Cocina: React.FC<{t: number; pre: string}> = ({t, pre}) => (
  <g>
    <defs>
      <linearGradient id={pre + 'pared'} x1={0} y1={0} x2={0} y2={1}>
        <stop offset={0} stopColor="#E8C496" />
        <stop offset={0.2} stopColor="#F3DAB4" />
        <stop offset={0.6} stopColor="#F8E7CC" />
        <stop offset={1} stopColor="#F1D6B0" />
      </linearGradient>
      <linearGradient id={pre + 'techo'} x1={0} y1={0} x2={0} y2={1}>
        <stop offset={0} stopColor="#8A5A30" stopOpacity={0.22} />
        <stop offset={1} stopColor="#8A5A30" stopOpacity={0} />
      </linearGradient>
      <radialGradient id={pre + 'halo'}>
        <stop offset={0} stopColor="#FFF8E6" stopOpacity={0.8} />
        <stop offset={0.6} stopColor="#FFF3DA" stopOpacity={0.3} />
        <stop offset={1} stopColor="#FFF3DA" stopOpacity={0} />
      </radialGradient>
      <linearGradient id={pre + 'cielo'} gradientUnits="userSpaceOnUse" x1={0} y1={VID.y} x2={0} y2={VID.y + VID.h}>
        <stop offset={0} stopColor="#6A9DE0" />
        <stop offset={0.36} stopColor="#A8CCEF" />
        <stop offset={0.64} stopColor="#F5DCD2" />
        <stop offset={0.84} stopColor="#FFC895" />
        <stop offset={1} stopColor="#FFB07A" />
      </linearGradient>
      <radialGradient id={pre + 'sol'}>
        <stop offset={0} stopColor="#FFF6D8" stopOpacity={1} />
        <stop offset={0.35} stopColor="#FFE9B8" stopOpacity={0.6} />
        <stop offset={1} stopColor="#FFDCA0" stopOpacity={0} />
      </radialGradient>
      <linearGradient id={pre + 'suelo'} gradientUnits="userSpaceOnUse" x1={0} y1={F} x2={0} y2={1920}>
        <stop offset={0} stopColor="#E4AE74" />
        <stop offset={0.45} stopColor="#D89D62" />
        <stop offset={1} stopColor="#C2864E" />
      </linearGradient>
      <filter id={pre + 'suave'} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation={1.4} />
      </filter>
    </defs>

    {/* la pared, el techo y la moldura */}
    <rect x={-20} y={-20} width={1120} height={F + 20} fill={`url(#${pre}pared)`} />
    <rect x={-20} y={-20} width={1120} height={112} fill="#D5AF83" />
    <rect x={-20} y={92} width={1120} height={20} fill="#FFF1DA" />
    <rect x={-20} y={112} width={1120} height={4} fill="#B98E62" />
    <rect x={-20} y={116} width={1120} height={150} fill={`url(#${pre}techo)`} />

    {/* el zócalo de friso */}
    <rect x={-20} y={1180} width={1120} height={F - 1180} fill="#EBCCA2" />
    {Array.from({length: 26}, (_, i) => <rect key={i} x={i * 44 - 10} y={1196} width={3} height={F - 1222} fill="#D9B184" />)}
    <rect x={-20} y={1166} width={1120} height={16} fill="#FFF2DD" />
    <rect x={-20} y={1182} width={1120} height={5} fill="#C99F72" opacity={0.8} />

    <Ventana t={t} pre={pre} />
    <Reloj t={t} pre={pre} />
    <Balda pre={pre} />

    {/* el rodapié */}
    <rect x={-20} y={F - 26} width={1120} height={26} fill="#B87C4C" />
    <rect x={-20} y={F - 26} width={1120} height={4} fill="#DDA673" />

    <Trapo t={t} pre={pre} />
    <Suelo pre={pre} />
    <Alfombra />
    <Saco pre={pre} />
    <Cuenco pre={pre} />
    <Rayos t={t} pre={pre} />
  </g>
);
