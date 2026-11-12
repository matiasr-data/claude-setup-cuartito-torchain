import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {E, clamp, mix} from '../../../comun/curvas';
import {DUR, LAMPARA, PLANES, T_PRIMERO, _trayecto, bola, esqueleto, lampara as lamparaEn, lanzamiento, proyecta, temblor, type P} from '../escena';
import {azar, bailaEn, parpadeoEn, polvo, proyector} from './pelicula';
import {pintaEscena} from './pintura';
import {FUENTE_ROTULO, irisAbierto, mezclaIris, pintaIris, pintaRotulo, type Iris, type Rotulo} from './rotulo';

// LA BOLA DE PAPEL EN CINE MUDO (la escena en ../escena.ts).
// Una comedia de los años 20 proyectada: la oficina de época dibujada como un grabado (tinta y aguadas;
// el rayado, solo en las sombras grandes del fondo), blanco y negro de copia vieja (negros profundos, blancos que queman y un pelo de
// sepia), grano grueso de plata, rayas y polvo que cruzan el cuadro, el parpadeo del proyector, la imagen que baila en la ventanilla,
// el iris ovalado y la cadencia de manivela: la acción va a 18 posturas por segundo y un 12 % acelerada (como una comedia de
// Chaplin), y la película (el grano, las rayas, el baile) a 24.
// Por planos: el fondo, oscuro y liso; lo de delante (la lámpara, el muñeco de comedia muda y su silla, la papelera de chapa),
// claro, sin rayado y con contorno grueso; y la bola, lo más blanco del cuadro, con contorno negro y halo, siempre separada de lo
// que tenga detrás.
// El golpe: la acción se queda quieta dos posturas (1/9 s) con la bola aplastada contra lo que toca, la imagen da un salto (se ve
// la línea negra entre fotogramas) y un destello; en el de la lámpara, la lámpara ya arranca a balancearse en esa pausa (con su
// estela) y la bombilla parpadea como un cortocircuito. Cada lanzamiento lleva su rótulo de cine mudo, pequeño, arriba, en un marco
// art déco, y al final el iris se cierra un poco sobre la reacción del muñeco.
// Cómo se hace: la escena se pinta en grises (pintura.ts, decorado.ts, muneco.ts), un paso en WebGL la entinta como un grabado y otro
// la pasa a copia de cine (pelicula.ts, adaptado de un motor con licencia MIT: ver AVISOS.md), y encima va el polvo. Todo sale de (intento, t).

const FPS_ACCION = 18;
const ACELERA = 1.12;
const FPS_PELICULA = 24;

// el rótulo de cada lanzamiento (en segundos de su tarjeta, que enseña de 0,2 a 1,8)
const ROTULOS: Rotulo[] = [
  {texto: '¡POR UN PELO!', desde: 0.72, hasta: 1.42},
  {texto: '¡NI CERCA!', desde: 0.68, hasta: 1.4},
  {texto: '¡DEMASIADO!', desde: 0.8, hasta: 1.5},
  {texto: '¡CASI…!', desde: 1.06, hasta: 1.66},
  {texto: '¡ESTABA DENTRO!', desde: 0.98, hasta: 1.62},
  {texto: '¡CUIDADO!', desde: 0.74, hasta: 1.42},
  {texto: '¡OTRA VEZ!', desde: 0.62, hasta: 1.34},
  {texto: '¡LA LÁMPARA!', desde: 0.5, hasta: 1.24},
  {texto: '¿ENTRA…?', desde: 0.82, hasta: 1.36},
  {texto: '¡DENTRO!', desde: 0.88, hasta: 1.58},
];
// cuándo se cierra el iris al final (en segundos de la tarjeta): cuando la cara de la reacción ya se ha leído
const IRIS_CIERRA = 1.46;
const IRIS_DURA = 0.28;
// la pausa del golpe: posturas que la acción se queda quieta en el primer toque
const PARADA = 2;
const PATADA_LAMPARA = [0.04, 0.085]; // lo que ya se ha ido la lámpara en cada postura de la pausa (radianes)

// ---------------------------------------------------------------- el tiempo
// la acción: pasos de 1/18 s con uno justo en el primer toque, la pausa del golpe y, desde ahí, un 12 % más deprisa (el toque cae
// donde en los demás estilos)
export const tiempoAccion = (i: number, t: number) => {
  const T1 = T_PRIMERO[i];
  const k = Math.floor((t - T1) * FPS_ACCION + 1e-6);
  const kk = k < 0 ? k : Math.max(0, k - (PARADA - 1));
  return {k, parada: k >= 0 && k < PARADA ? k : -1, tq: clamp(T1 + (kk / FPS_ACCION) * ACELERA, 0, DUR)};
};
const aTarjeta = (i: number, tEscena: number) => {
  const T1 = T_PRIMERO[i];
  return T1 + (tEscena > T1 ? (PARADA - 1) / FPS_ACCION : 0) + (tEscena - T1) / ACELERA;
};
// el ángulo de la lámpara en la postura k (exagerado como en una comedia: un 60 % más; en la pausa del golpe ya arranca)
const anguloLampara = (i: number, k: number) => {
  if (PLANES[i].especial !== 'lampara' || k < 0) return 0;
  if (k < PARADA) return PATADA_LAMPARA[k];
  return lamparaEn(i, T_PRIMERO[i] + ((k - (PARADA - 1)) / FPS_ACCION) * ACELERA).ang * 1.6;
};

// ---------------------------------------------------------------- el iris del final: abraza la cabeza del muñeco y donde queda la bola
const IRIS_FIN: Iris[] = [];
const irisFin = (i: number): Iris => {
  if (IRIS_FIN[i]) return IRIS_FIN[i];
  const e = lanzamiento(i, DUR);
  const cab = proyecta(esqueleto(e.muneco).cabeza);
  const bo = proyecta(e.bola.c);
  const cx = mix(cab[0], bo[0], 0.45), cy = mix(cab[1], bo[1], 0.45) + 40;
  const r = Math.max(430, Math.hypot(cab[0] - cx, cab[1] - cy) + 210, Math.hypot(bo[0] - cx, bo[1] - cy) + 170);
  return (IRIS_FIN[i] = {cx, cy, rx: r, ry: r * 1.12, suave: 0.2});
};

// ---------------------------------------------------------------- la letra del rótulo (Playfair Display Black, OFL, en public/fuentes)
let FUENTE: Promise<void> | null = null;
const cargaFuente = () =>
  (FUENTE ??= (async () => {
    const f = new FontFace(FUENTE_ROTULO, `url(${staticFile('fuentes/PlayfairDisplay-Black.ttf')})`, {weight: '900'});
    await f.load();
    document.fonts.add(f);
  })());

// los lienzos de trabajo (uno por pestaña del render)
let LIENZOS: {escena: HTMLCanvasElement; frente: HTMLCanvasElement; bola: HTMLCanvasElement; capa: HTMLCanvasElement} | null = null;
const lienzos = () => {
  if (LIENZOS) return LIENZOS;
  const nuevo = () => {
    const c = document.createElement('canvas');
    c.width = 1080;
    c.height = 1920;
    return c;
  };
  return (LIENZOS = {escena: nuevo(), frente: nuevo(), bola: nuevo(), capa: nuevo()});
};

// ---------------------------------------------------------------- un cuadro
const dibuja = (destino: HTMLCanvasElement, intento: number, t: number) => {
  const i = clamp(Math.round(intento), 0, 9);
  const {k, tq, parada} = tiempoAccion(i, t);
  const e = lanzamiento(i, tq);
  const golpes = _trayecto(i).golpes; // todos (los que ya pasaron están en e.golpes)
  // la lámpara (y su estela mientras se mueve deprisa)
  e.lampara.ang = anguloLampara(i, k);
  const estelaLampara = [k - 1, k - 2].map((j) => anguloLampara(i, j)).filter((a, n) => Math.abs(a - e.lampara.ang) > 0.015 * (n + 1));
  // la pausa del golpe: la bola, aplastada contra lo que toca; en la lámpara, pegada a ella mientras arranca
  if (parada >= 0 && golpes.length) {
    e.bola.aplasta = {k: 0.55, n: golpes[0].n};
    if (golpes[0].tipo === 'lampara') {
      const a = e.lampara.ang;
      const rx = e.bola.c[0] - LAMPARA.x, ry = e.bola.c[1] - LAMPARA.yGancho;
      e.bola.c = [LAMPARA.x + rx * Math.cos(a) + ry * Math.sin(a), LAMPARA.yGancho - rx * Math.sin(a) + ry * Math.cos(a), e.bola.c[2]];
    }
  }
  // el sobresalto de comedia muda: después de la pausa da un bote en la silla y echa la cabeza atrás (a 18 posturas, de golpe)
  const u = tq - T_PRIMERO[i];
  if (u > 0 && u < 0.32) {
    const k2 = Math.sin(Math.PI * Math.min(1, u / 0.32)) * (1 - (u / 0.32) * 0.4);
    e.muneco.salto += 34 * k2;
    e.muneco.cabeza.cabecea -= 0.22 * k2;
  }
  const cuadro = Math.floor(t * FPS_PELICULA + 1e-6);

  // la bombilla: un pelo viva siempre; si la bola le da, parpadea como un cortocircuito
  let luzB = 1 - 0.05 * azar(cuadro * 3.1);
  const gl = e.golpes.find((g) => g.tipo === 'lampara');
  if (gl) {
    const u = tq - gl.t;
    const patron = [0.12, 1.15, 0.25, 0.9, 0.05, 0.05, 1.1, 0.5, 1, 0.8, 1];
    if (u >= 0 && u < patron.length / 20) luzB = patron[Math.floor(u * 20)];
  }
  // el obturador: si la bola va rápida, deja un rastro corto
  const atras = bola(i, Math.max(0, tq - 0.02));
  const rapida = Math.hypot(e.bola.c[0] - atras.c[0], e.bola.c[1] - atras.c[1]) > 18;
  const fantasmas = rapida ? [1, 2].map((j) => ({b: bola(i, Math.max(0, tq - j * 0.012 * ACELERA)), alfa: 0.32 / j})) : [];

  const lz = lienzos();
  pintaEscena({escena: lz.escena.getContext('2d')!, frente: lz.frente.getContext('2d')!, bola: lz.bola.getContext('2d')!},
    {e, b: e.bola, fantasmas: parada >= 0 ? [] : fantasmas, luzBombilla: luzB, estelaLampara});

  // la capa: la bola (sin entintar: lo más blanco del cuadro), el iris y el rótulo
  const cc = lz.capa.getContext('2d')!;
  cc.clearRect(0, 0, 1080, 1920);
  cc.drawImage(lz.bola, 0, 0);
  const kIris = E.inOutCubic(clamp((t - IRIS_CIERRA) / IRIS_DURA));
  pintaIris(cc, mezclaIris(irisAbierto, irisFin(i), kIris * 0.85));
  const ro = ROTULOS[i];
  if (t >= ro.desde && t < ro.hasta) {
    const cuadroRo = cuadro - Math.floor(ro.desde * FPS_PELICULA);
    const tiembla: P = [(azar(cuadro * 1.7) - 0.5) * 5, (azar(cuadro * 2.3) - 0.5) * 4];
    pintaRotulo(cc, ro.texto, 540, 206, clamp(cuadroRo / 3), tiembla);
  }

  // el golpe: salto de cuadro y destello (el primero, fuerte; los otros golpes fuertes, un pelo)
  let salto = 0, expo = 1;
  golpes.forEach((g, n) => {
    const d = cuadro - Math.ceil(aTarjeta(i, g.t) * FPS_PELICULA - 1e-6); // el primer cuadro de película que ya lo enseña
    if (n === 0) {
      if (d === 0) { salto += 46; expo *= 1.62; }
      else if (d === 1) { salto -= 10; expo *= 1.1; }
    } else if (g.fuerza > 1700 && g.tipo !== 'pila') {
      if (d === 0) { salto += 16; expo *= 1.18; }
      else if (d === 1) { expo *= 1.06; }
    }
  });
  const fuerza = 0.8;
  const [bx, by] = bailaEn(cuadro, fuerza);
  const [sx, sy] = temblor(i, tq);
  const pr = proyector();
  pr.proyecta(lz.escena, lz.frente, lz.capa, {paso: Math.floor(k / 2) + i * 40}, {
    cuadro, fuerza, expo: expo * parpadeoEn(cuadro, fuerza) * (0.94 + 0.06 * luzB), baila: [bx + sx * 1.4, by + sy * 1.4 + salto], semilla: 3.1 + i,
  });
  const d = destino.getContext('2d')!;
  d.drawImage(pr.canvas, 0, 0);
  polvo(d, 1080, 1920, cuadro, fuerza);
};

export const CineMudo: React.FC<{intento: number; t: number}> = ({intento, t}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [lista, setLista] = useState(false);
  const [espera] = useState(() => delayRender('Cine mudo: la letra del rótulo'));
  useEffect(() => {
    cargaFuente()
      .catch((err) => console.error(err))
      .finally(() => setLista(true));
  }, []);
  useLayoutEffect(() => {
    if (lista && ref.current) dibuja(ref.current, intento, t);
  }, [lista, intento, t]);
  useEffect(() => {
    if (lista) continueRender(espera);
  }, [lista, espera]);
  return <canvas ref={ref} width={1080} height={1920} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000'}} />;
};
