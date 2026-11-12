import React from 'react';
import type {P} from './formas';

// 7 · ANIME, las herramientas del celuloide. Cada forma se pinta como en un cel de televisión: el contorno por detrás (así un grupo de
// piezas, una pierna o un brazo, tiene una sola silueta limpia), el color en sombra, encima el color en luz desplazado hacia la luz y
// recortado a la forma (lo que queda sin tapar es la sombra, plana y de borde duro, del lado contrario a la luz) y, si toca, un brillo
// duro en el filo que da a la luz. Solo con recortes (clipPath), sin máscaras: es lo que más rápido pinta el navegador.

export const LUZ: P = [0.6, -0.8]; // la luz de la tarde entra de arriba a la derecha (la ventana)
const f2 = (n: number) => n.toFixed(2);
export const mueve = (L: P, k: number) => `translate(${f2(L[0] * k)} ${f2(L[1] * k)})`;
export const girar = ([x, y]: P, a: number): P => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

export type Tinta = {luz: string; sombra: string; brillo?: string; linea?: string};

export const Cel: React.FC<{
  id: string; ds: string[]; tinta: Tinta; grosor?: number; s?: number; h?: number; L?: P; opacidad?: number;
}> = ({id, ds, tinta, grosor = 3, s = 8, h = 4, L = LUZ, opacidad}) => {
  const {luz, sombra, brillo, linea} = tinta;
  const hacia = mueve(L, s);
  return (
    <g opacity={opacidad}>
      <defs>
        <clipPath id={id}>{ds.map((d, i) => <path key={i} d={d} />)}</clipPath>
        {brillo && <clipPath id={id + 'h'}>{ds.map((d, i) => <path key={i} d={d} transform={mueve(L, -h)} />)}</clipPath>}
      </defs>
      {linea && ds.map((d, i) => (
        <path key={'l' + i} d={d} fill={linea} stroke={linea} strokeWidth={grosor * 2} strokeLinejoin="round" />
      ))}
      {ds.map((d, i) => <path key={'s' + i} d={d} fill={sombra} />)}
      <g clipPath={`url(#${id})`}>
        {brillo && <g transform={hacia}>{ds.map((d, i) => <path key={i} d={d} fill={brillo} />)}</g>}
        <g clipPath={brillo ? `url(#${id}h)` : undefined}>
          <g transform={hacia}>{ds.map((d, i) => <path key={i} d={d} fill={luz} />)}</g>
        </g>
      </g>
    </g>
  );
};

// el destello de cuatro puntas del anime («kira»)
export const estrella = (r: number, k = 0.16) => {
  const q = r * k;
  return `M 0 ${-r} C ${q} ${-q} ${q} ${-q} ${r} 0 C ${q} ${q} ${q} ${q} 0 ${r} C ${-q} ${q} ${-q} ${q} ${-r} 0 C ${-q} ${-q} ${-q} ${-q} 0 ${-r} Z`;
};
export const Destello: React.FC<{x: number; y: number; r: number; giro?: number; alfa?: number; color?: string}> = ({
  x, y, r, giro = 0, alfa = 1, color = '#FFE7A0',
}) => (r <= 0.5 || alfa <= 0.01 ? null : (
  <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(giro)})`} opacity={alfa}>
    <path d={estrella(r * 1.55, 0.2)} fill={color} opacity={0.55} />
    <path d={estrella(r)} fill="#FFFFFF" />
    <circle r={r * 0.2} fill="#FFFFFF" />
  </g>
));
