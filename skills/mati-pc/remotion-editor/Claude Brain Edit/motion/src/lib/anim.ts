import {Easing, interpolate} from 'remotion';

export const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// La entrada es más lenta que la salida: 7 fotogramas con desaceleración, 5 con aceleración.
export const entra = (f: number, ini = 0, dur = 7) => interpolate(f, [ini, ini + dur], [0, 1], {...CL, easing: Easing.out(Easing.cubic)});
export const sale = (f: number, fin: number, dur = 5) => interpolate(f, [fin - dur, fin], [1, 0], {...CL, easing: Easing.in(Easing.cubic)});
// Entrada con un pequeño rebote (para piezas pequeñas: chips, sellos, insignias).
export const bote = (f: number, ini = 0, dur = 9) => interpolate(f, [ini, ini + dur], [0, 1], {...CL, easing: Easing.out(Easing.back(1.7))});
// Movimiento residual: nada está quieto del todo mientras permanece en pantalla.
export const vivo = (f: number, dur: number, cuanto = 0.025) => 1 + cuanto * Math.min(f / Math.max(dur, 1), 1);
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
