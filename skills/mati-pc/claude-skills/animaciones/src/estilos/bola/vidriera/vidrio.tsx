import React from 'react';
import {rng} from '../../../comun/curvas';

// VIDRIERA, EL VIDRIO Y EL PLOMO. Cada forma de la escena es un trozo de vidrio de color con el sol detrás:
// su color de fábrica (con un pelo de deriva propia, como cada hoja de vidrio soplado), el centro más encendido que los bordes (el
// vidrio es más grueso y más viejo junto al plomo), su textura (vetas en su ángulo, nubes de grosor, burbujas de semilla y rayitas,
// que viajan con la pieza) y el plomo negro alrededor, con su brillo gris de la sala en el lomo. Lo que se mueve se enciende más.
// Los ids van con «vd-» para no chocar con los de otros estilos cuando la cortinilla pinta dos a la vez.

// ---------------------------------------------------------------- los vidrios (su color con el sol detrás)
export const VID = {
  cobalto: '#1d4fbd', cobalto2: '#2a62d6', cobaltoO: '#163f9c',
  celeste: '#a6dcf8', cielo: '#d6f0fc', nube: '#fbfdf6',
  blanco: '#f5f2e3', blancoV: '#e2efd9', opal: '#fdfcff',
  verde: '#1f9c4c', verdeC: '#47bb5c', verdeO: '#157a3b',
  ambar: '#f7b519', ambarC: '#ffd04f', ambarO: '#dc8f0e',
  naranja: '#f37c1c', naranjaC: '#ffa043',
  rubi: '#c40e2b', rubiC: '#d9203d', rubiO: '#930a20', rubiProfundo: '#5c0720',
  violeta: '#6c2fa3', violetaO: '#4c1f7c',
  murrey: '#842657',
  carne: '#f1c79d', carneO: '#d9a274',
  marron: '#7f3c13', marronC: '#a65a22',
  humo: '#46526a', humoO: '#262d3c',
  turquesa: '#2fc6d6', turquesaC: '#8ae6ec',
  suelo1: '#e6a236', suelo2: '#cc8622', suelo3: '#f0b44c',
  nogal: '#93501f', nogalC: '#b06a2c',
} as const;
export type Vid = keyof typeof VID;

export const PLOMO = '#120f15';
export const GRISALLA = '#2b1508';

// un pelo de deriva en el color, siempre la misma para la misma semilla (±7 % de luz y un poco de tono)
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const aHex = (v: number[]) => '#' + v.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
export const deriva = (c: string, semilla: number, cuanto = 1): string => {
  const r = rng(semilla * 977 + 13);
  const luz = 1 + (r() - 0.5) * 0.14 * cuanto;
  const tono = [(r() - 0.5) * 16 * cuanto, (r() - 0.5) * 12 * cuanto, (r() - 0.5) * 16 * cuanto];
  return aHex(hex(c).map((x, i) => x * luz + tono[i]));
};
export const aclara = (c: string, k: number) => aHex(hex(c).map((x) => x + (255 - x) * k));
export const oscurece = (c: string, k: number) => aHex(hex(c).map((x) => x * (1 - k)));

// ---------------------------------------------------------------- la textura del vidrio (6 losetas, cada una en su ángulo)
const TEX = 200;
const ANGULOS = [12, -34, 58, -71, 95, 27];
const loseta = (k: number) => {
  const r = rng(700 + k * 37);
  const els: React.ReactElement[] = [];
  let n = 0;
  const repite = (x: number, y: number, rad: number, pinta: (ox: number, oy: number) => React.ReactElement[]) => {
    for (const ox of [-TEX, 0, TEX]) for (const oy of [-TEX, 0, TEX]) {
      if (x + ox + rad < 0 || x + ox - rad > TEX || y + oy + rad < 0 || y + oy - rad > TEX) continue;
      els.push(...pinta(ox, oy));
    }
  };
  // las nubes de grosor (el vidrio soplado no es igual de grueso en toda la hoja)
  for (let i = 0; i < 9; i++) {
    const x = r() * TEX, y = r() * TEX, rx = 30 + r() * 60, ry = rx * (0.4 + r() * 0.5);
    const claro = r() < 0.5;
    const op = (claro ? 0.12 : 0.2) * (0.5 + r() * 0.5);
    repite(x, y, rx, (ox, oy) => [<ellipse key={n++} cx={x + ox} cy={y + oy} rx={rx} ry={ry} fill={claro ? 'url(#vd-nubeC)' : 'url(#vd-nubeO)'} opacity={op} />]);
  }
  // las vetas (las ondas del vidrio estirado), todas a lo largo de la loseta: el ángulo lo pone la loseta
  for (let i = 0; i < 16; i++) {
    const y = r() * TEX, amp = 2 + r() * 6, claro = r() < 0.55, w = 0.7 + r() * 1.8;
    const d = `M -10 ${y.toFixed(1)} Q ${(TEX * 0.25).toFixed(1)} ${(y - amp).toFixed(1)} ${(TEX * 0.5).toFixed(1)} ${y.toFixed(1)} T ${(TEX + 10).toFixed(1)} ${y.toFixed(1)}`;
    for (const oy of [-TEX, 0, TEX]) {
      if (y + oy < -10 || y + oy > TEX + 10) continue;
      els.push(<path key={n++} d={d} transform={`translate(0 ${oy})`} fill="none" stroke={claro ? '#ffffff' : '#000000'} strokeOpacity={claro ? 0.08 : 0.11} strokeWidth={w} />);
    }
  }
  // las burbujas de semilla
  for (let i = 0; i < 13; i++) {
    const x = r() * TEX, y = r() * TEX, rad = 1 + r() * 2.6, alargada = 1 + r() * 0.8;
    repite(x, y, rad * 2, (ox, oy) => [
      <ellipse key={n++} cx={x + ox} cy={y + oy} rx={rad * alargada} ry={rad} fill="#ffffff" fillOpacity={0.42} stroke="#000000" strokeOpacity={0.3} strokeWidth={0.7} />,
    ]);
  }
  // las rayitas
  for (let i = 0; i < 4; i++) {
    const x = r() * TEX, y = r() * TEX, a = r() * Math.PI, l = 8 + r() * 18;
    els.push(<line key={n++} x1={x} y1={y} x2={x + Math.cos(a) * l} y2={y + Math.sin(a) * l} stroke="#ffffff" strokeOpacity={0.28} strokeWidth={0.6} />);
  }
  return (
    <pattern key={k} id={`vd-tex-${k}`} width={TEX} height={TEX} patternUnits="userSpaceOnUse" patternTransform={`rotate(${ANGULOS[k]})`}>
      {els}
    </pattern>
  );
};

export const DEFS_VIDRIO = (
  <>
    <radialGradient id="vd-nubeC"><stop offset="0" stopColor="#ffffff" stopOpacity={1} /><stop offset="1" stopColor="#ffffff" stopOpacity={0} /></radialGradient>
    <radialGradient id="vd-nubeO"><stop offset="0" stopColor="#000000" stopOpacity={1} /><stop offset="1" stopColor="#000000" stopOpacity={0} /></radialGradient>
    {/* el centro encendido de cada pieza y sus bordes más gruesos (en su caja: vale para cualquier forma) */}
    <radialGradient id="vd-centro" cx="0.46" cy="0.42" r="0.62">
      <stop offset="0" stopColor="#ffffff" stopOpacity={0.04} />
      <stop offset="0.5" stopColor="#000000" stopOpacity={0} />
      <stop offset="1" stopColor="#000000" stopOpacity={0.3} />
    </radialGradient>
    {[0, 1, 2, 3, 4, 5].map(loseta)}
  </>
);

// ---------------------------------------------------------------- una pieza: el vidrio y su plomo
export type PiezaProps = {
  d: string; // el corte (en las medidas de la pieza o de la pantalla)
  color: string; // el vidrio (ya con su deriva, si se quiere)
  semilla?: number;
  plomo?: number; // el ancho del plomo (más fino en las piezas pequeñas)
  borde?: number; // cuánto se oscurece junto al plomo (0–1)
  luz?: number; // lo que se enciende de más (lo que se mueve): 0–1
  sombra?: number; // la grisalla que lo apaga (el «matting» de un lado): 0–1
  textura?: boolean;
  transform?: string;
  children?: React.ReactNode; // la grisalla pintada encima (antes del plomo)
  sinCentro?: boolean;
  tonoLuz?: string; // hacia qué color se enciende (si no, su mismo color, más claro)
};
export const Pieza: React.FC<PiezaProps> = ({d, color, semilla = 1, plomo = 9, borde = 1, luz = 0, sombra = 0, textura = true, transform, children, sinCentro, tonoLuz}) => (
  <g transform={transform}>
    <path d={d} fill={color} />
    {!sinCentro && <path d={d} fill="url(#vd-centro)" />}
    {textura && <path d={d} fill={`url(#vd-tex-${Math.abs(semilla) % 6})`} />}
    {sombra > 0.01 && <path d={d} fill="#0b0612" fillOpacity={Math.min(0.85, sombra * 0.6)} />}
    {luz > 0.01 && <path d={d} fill={tonoLuz ?? aclara(color, 0.5)} fillOpacity={Math.min(0.85, luz * 0.75)} />}
    {children}
    {borde > 0.01 && (
      <>
        <path d={d} fill="none" stroke="#0b0612" strokeOpacity={0.12 * borde} strokeWidth={plomo + 18 * borde} strokeLinejoin="round" />
        <path d={d} fill="none" stroke="#0b0612" strokeOpacity={0.16 * borde} strokeWidth={plomo + 8 * borde} strokeLinejoin="round" />
      </>
    )}
    {plomo > 0 && (
      <>
        <path d={d} fill="none" stroke={PLOMO} strokeWidth={plomo} strokeLinejoin="round" />
        <path d={d} fill="none" stroke="#6e6878" strokeOpacity={0.4} strokeWidth={Math.max(0.8, plomo * 0.16)} strokeLinejoin="round" />
      </>
    )}
  </g>
);

// una línea de plomo suelta (las de una red: las losetas del suelo, los rombos de la pared, las vetas de la papelera)
export const Plomo: React.FC<{d: string; w?: number; borde?: number}> = ({d, w = 9, borde = 1}) => (
  <>
    {borde > 0.01 && <path d={d} fill="none" stroke="#0b0612" strokeOpacity={0.14 * borde} strokeWidth={w + 16 * borde} strokeLinejoin="round" strokeLinecap="round" />}
    <path d={d} fill="none" stroke={PLOMO} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
    <path d={d} fill="none" stroke="#6e6878" strokeOpacity={0.38} strokeWidth={Math.max(0.8, w * 0.16)} strokeLinejoin="round" strokeLinecap="round" />
  </>
);

// un trazo de grisalla (pintura marrón de horno: la cara, los pliegues), con su punta afinada si se quiere
export const Traza: React.FC<{d: string; w?: number; op?: number; color?: string}> = ({d, w = 4, op = 0.85, color = GRISALLA}) => (
  <path d={d} fill="none" stroke={color} strokeOpacity={op} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);
