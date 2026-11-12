import React from 'react';
import {rng} from '../../comun/curvas';
import type {P} from './escena';

// Las cartulinas del gato en PAPEL RECORTADO: cada color es una hoja con su fibra, sus manchas y sus motas,
// las sombras suaves entre capas y el encuadernador de latón. Los ids van con «gpp-» para no
// chocar con los de otros estilos cuando la cortinilla pinta dos a la vez (son siempre iguales: dos copias no se estorban).

export const TINTAS = {
  // la cocina
  pared: '#ECDDC3', moldura: '#F4EBDB', zocalo: '#B27B4B', llaga: '#E2D6BF',
  azulejo1: '#A6D8C8', azulejo2: '#93CCB9', azulejo3: '#B8E1D3',
  suelo1: '#C08552', suelo2: '#C98F5B', suelo3: '#B77B49', suelo4: '#CF9A66', junta: '#8C5934',
  madera: '#CB905A', madera2: '#A86F3F', madera3: '#B57C4A',
  marco: '#F7F0E3', cielo: '#BEDDE9', nube: '#FFFFFF', ciudad1: '#8FB3C7', ciudad2: '#7B9EB5', ventanita: '#E4F0F4', repisa: '#EFE4D0',
  sol: '#F6C453', cortina: '#A893D3', cortinaO: '#8C76BE', cristal: '#DCEBEF', lamina: '#CDE6EE',
  coral: '#E2553F', coralO: '#BE3F2D', mostaza: '#F0B43C', menta: '#4AA497', lila: '#9A86C9', azul: '#5B8FCB', crema: '#F8EFDD',
  verde1: '#3E9B51', verde2: '#2D7C42', verde3: '#63B967', verdeO1: '#2A6B3A', verdeO2: '#1F5631', verdeO3: '#3F8B4A',
  terracota: '#D36A40', terracota2: '#B65632', tinta: '#3A2416',
  // el gato, atigrado naranja con el pecho y los calcetines de crema
  naranja: '#EE8C3A', naranjaL: '#C9702B', naranjaO: '#C65C1C', naranjaC: '#F6A35A', pelaje: '#FBEBD3', pelajeL: '#DCC7A8',
  rosa: '#F4A3A6', rosaO: '#E06F7C', iris: '#B9D652',
  // la taza y el café
  cobalto: '#2F62B5', cobaltoO: '#204A8E', loza: '#FBF4E6', cafe: '#5A311B', cafeC: '#8A5631',
} as const;
export type Tinta = keyof typeof TINTAS;
export const f = (t: Tinta) => `url(#gpp-${t})`;

const TP = 216; // la loseta de la pared: 5 justas en el ancho
const TG = 300;

// el papel: fibra, manchas y motas en una loseta que casa por los cuatro lados
const grano = (id: string, T: number, semilla: number) => {
  const r = rng(semilla);
  const els: React.ReactElement[] = [];
  const area = (T / 300) ** 2;
  let k = 0;
  for (let i = 0; i < Math.round(15 * area); i++) {
    const x = r() * T, y = r() * T, rx = 36 + r() * 80, ry = rx * (0.55 + r() * 0.7);
    const claro = r() < 0.5;
    const op = (claro ? 0.15 : 0.11) * (0.5 + r() * 0.5);
    for (const ox of [-T, 0, T]) for (const oy of [-T, 0, T]) {
      if (x + ox + rx < 0 || x + ox - rx > T || y + oy + ry < 0 || y + oy - ry > T) continue;
      els.push(<ellipse key={k++} cx={x + ox} cy={y + oy} rx={rx} ry={ry} fill={claro ? 'url(#gpp-claro)' : 'url(#gpp-oscuro)'} opacity={op} />);
    }
  }
  for (let i = 0; i < Math.round(70 * area); i++) {
    const x = r() * T, y = r() * T, a = r() * Math.PI * 2, l = 5 + r() * 15;
    const claro = r() < 0.55;
    els.push(
      <path key={k++} d={`M ${x.toFixed(1)} ${y.toFixed(1)} q ${(Math.cos(a + 0.5) * l * 0.5).toFixed(1)} ${(Math.sin(a + 0.5) * l * 0.5).toFixed(1)} ${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)}`}
        fill="none" stroke={claro ? '#FFFFFF' : '#5A3A20'} strokeOpacity={claro ? 0.13 : 0.07} strokeWidth={0.6 + r() * 0.6} strokeLinecap="round" />,
    );
  }
  for (let i = 0; i < Math.round(55 * area); i++) {
    els.push(<circle key={k++} cx={(r() * T).toFixed(1)} cy={(r() * T).toFixed(1)} r={(0.6 + r() * 1).toFixed(2)} fill="#4A2E18" opacity={0.1} />);
  }
  return <g id={id}>{els}</g>;
};

const sombra = (id: string, dx: number, dy: number, sd: number, op: number) => (
  <filter id={`gpp-${id}`} filterUnits="userSpaceOnUse" x={-3000} y={-1500} width={9000} height={5000} colorInterpolationFilters="sRGB">
    <feDropShadow dx={dx} dy={dy} stdDeviation={sd} floodColor="#3A200C" floodOpacity={op} />
  </filter>
);

export const DEFS = (
  <defs>
    <radialGradient id="gpp-claro"><stop offset="0" stopColor="#FFFFFF" stopOpacity={1} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></radialGradient>
    <radialGradient id="gpp-oscuro"><stop offset="0" stopColor="#6B4426" stopOpacity={1} /><stop offset="1" stopColor="#6B4426" stopOpacity={0} /></radialGradient>
    <radialGradient id="gpp-contacto"><stop offset="0" stopColor="#3A200C" stopOpacity={0.45} /><stop offset="0.6" stopColor="#3A200C" stopOpacity={0.2} /><stop offset="1" stopColor="#3A200C" stopOpacity={0} /></radialGradient>
    <radialGradient id="gpp-laton" cx="0.38" cy="0.34" r="0.7">
      <stop offset="0" stopColor="#FFF2BE" /><stop offset="0.45" stopColor="#E3B64C" /><stop offset="1" stopColor="#9C7020" />
    </radialGradient>
    <radialGradient id="gpp-luz" cx="0.75" cy="0.25" r="0.8">
      <stop offset="0" stopColor="#FFF3D9" stopOpacity={0.24} /><stop offset="0.6" stopColor="#FFF3D9" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="gpp-vineta" cx="0.5" cy="0.48" r="0.78">
      <stop offset="0.6" stopColor="#3A1F0C" stopOpacity={0} /><stop offset="1" stopColor="#3A1F0C" stopOpacity={0.42} />
    </radialGradient>
    <linearGradient id="gpp-rincon" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#3A200C" stopOpacity={0.32} /><stop offset="1" stopColor="#3A200C" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="gpp-bajomesa" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2A1606" stopOpacity={0.34} /><stop offset="1" stopColor="#2A1606" stopOpacity={0} />
    </linearGradient>
    {grano('gpp-gr-0', TG, 11)}
    {grano('gpp-gr-1', TG, 23)}
    {grano('gpp-gr-2', TG, 37)}
    {grano('gpp-gr-p', TP, 5)}
    {(Object.keys(TINTAS) as Tinta[]).map((t, i) => {
      const pared = t === 'pared';
      const T = pared ? TP : TG;
      return (
        <pattern key={t} id={`gpp-${t}`} width={T} height={T} patternUnits="userSpaceOnUse">
          <rect width={T} height={T} fill={TINTAS[t]} />
          {pared && [0, 1, 2].map((j) => (
            // el papel pintado: rayas anchas un poco más oscuras, con el borde suave
            <g key={j}>
              <rect x={(j * T) / 3} width={T / 6} height={T} fill="#D9C3A0" opacity={0.32} />
              <rect x={(j * T) / 3 + 4} width={T / 6 - 8} height={T} fill="#D9C3A0" opacity={0.18} />
              <rect x={(j * T) / 3 + T / 6 + 14} width={3} height={T} fill="#FFFFFF" opacity={0.28} />
            </g>
          ))}
          <use href={pared ? '#gpp-gr-p' : `#gpp-gr-${i % 3}`} />
        </pattern>
      );
    })}
    {sombra('s0', 1.6, 2.6, 1.6, 0.3)}
    {sombra('s1', 3.5, 6, 4, 0.36)}
    {sombra('s2', 5, 8, 5, 0.4)}
    {sombra('s3', 6, 10, 5.5, 0.44)}
    {sombra('s4', 9, 15, 6, 0.42)}
    {sombra('s5', 11, 17, 10, 0.42)}
    {sombra('sg', 14, 18, 12, 0.3)}
  </defs>
);

// un encuadernador de latón: la cabeza redonda con su brillo y su sombrita
export const chincheta = (c: P, r = 8, lejos = false, key: React.Key = 'ch') => (
  <g key={key}>
    <circle cx={c[0] + r * 0.22} cy={c[1] + r * 0.34} r={r} fill="#2E1806" opacity={0.38} />
    <circle cx={c[0]} cy={c[1]} r={r} fill="url(#gpp-laton)" stroke="#7E5717" strokeWidth={0.9} />
    <circle cx={c[0] - r * 0.3} cy={c[1] - r * 0.32} r={r * 0.28} fill="#FFF8E0" opacity={0.85} />
    {lejos && <circle cx={c[0]} cy={c[1]} r={r} fill="#2E1806" opacity={0.28} />}
  </g>
);
