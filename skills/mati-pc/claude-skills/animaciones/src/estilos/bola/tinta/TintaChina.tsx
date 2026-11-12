import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender} from 'remotion';
import {E, clamp} from '../../../comun/curvas';
import {DUR, PAPELERA, T_PRIMERO, bola, lanzamiento, proyecta, temblor} from '../escena';
import {LETRA_DATOS, LETRA_PINCEL} from './caligrafia';
import {pintaCuarto} from './cuarto';
import {bolaTinta, lampara, muneco, papeleraFondo, papeleraFrente, rastro, salpicaduras, sombras} from './figuras';
import {haceCompositor, type Compositor} from './papel';
import {BERMELLON, gota, reserva, sello, type Capas} from './pincel';

// LA BOLA DE PAPEL EN TINTA CHINA (la escena en ../escena.ts). Una
// pintura de tinta y aguada sobre papel de arroz: el papel cálido con su fibra, todo a pincel con tinta negra (trazos que cambian de
// grosor, el pincel que se seca y deja el blanco volante, aguadas grises que se corren y acumulan el pigmento en el borde), mucho
// papel en blanco, y un solo color: el bermellón del sello (el sello, la corbata y el aro de la papelera). La bola es un ensō; su
// rastro, un trazo seco que se deshace; en cada golpe salta tinta, y lo que salpica se queda en el papel.
// Cómo se hace: tres lienzos de solo alfa (la tinta mojada, la seca y el color, ./pincel.ts) que el papel junta en WebGL2
// (./papel.ts). El cuarto se pinta una vez (./cuarto.ts); lo que se mueve, en cada cuadro (./figuras.ts).
// El ritmo: el muñeco «a dos» (12 dibujos por segundo, cayendo justo en el primer toque), la bola y la tinta a 24,
// la cámara a 60; las aguadas hierven 10 veces por segundo (cada 6 cuadros).
// La composición es la de los bloques (en el vídeo, la cortinilla pasa de uno a otro): todo sale de las medidas de escena.ts.

const PASOS = 12;
const PASOS_BOLA = 24;
const HIERVE = 10;
const PAPEL_CSS = '#EFE8D8';

type Lienzos = {mojada: HTMLCanvasElement; seca: HTMLCanvasElement; color: HTMLCanvasElement; capas: Capas; dpr: number};
const lienzos = (dpr: number): Lienzos => {
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = Math.round(1080 * dpr);
    c.height = Math.round(1920 * dpr);
    return c;
  };
  const mojada = mk(), seca = mk(), color = mk();
  const cx = (c: HTMLCanvasElement) => c.getContext('2d')!;
  return {mojada, seca, color, capas: {mojada: cx(mojada), seca: cx(seca), color: cx(color)}, dpr};
};
const enEscala = (L: Lienzos) => {
  for (const c of [L.capas.mojada, L.capas.seca, L.capas.color]) c.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
};

// el cuarto, pintado una vez por escala
const CUARTOS = new Map<number, Lienzos>();
const cuarto = (dpr: number) => {
  let c = CUARTOS.get(dpr);
  if (!c) {
    c = lienzos(dpr);
    enEscala(c);
    pintaCuarto(c.capas);
    CUARTOS.set(dpr, c);
  }
  return c;
};

// la letra de la inscripción (va dentro del código: ./caligrafia.ts)
let LETRA: Promise<void> | null = null;
const cargaLetra = () =>
  (LETRA ??= (async () => {
    const f = new FontFace(LETRA_PINCEL, `url(${LETRA_DATOS})`);
    await f.load();
    document.fonts.add(f);
  })().catch(() => undefined));

// en qué instante va cada cosa: «a dos» el muñeco y a 24 la bola, con las posturas cayendo justo en el primer toque
export const tiempos = (i: number, t: number) => {
  const T1 = T_PRIMERO[i];
  const fase = (pasos: number) => T1 - Math.floor(T1 * pasos) / pasos;
  const paso = Math.floor((t - fase(PASOS)) * PASOS + 1e-6);
  const tq = Math.max(0, paso / PASOS + fase(PASOS));
  const pasoB = Math.floor((t - fase(PASOS_BOLA)) * PASOS_BOLA + 1e-6);
  const tb = Math.max(0, pasoB / PASOS_BOLA + fase(PASOS_BOLA));
  const pasoH = Math.floor(t * HIERVE + 1e-6);
  return {tq, tb, pasoH};
};

// el sello grande del ¡DENTRO!: cae un pelo grande y torcido y se asienta de golpe, como estampado a mano
const SELLO_DENTRO = {x: 904, y: 985, lado: 148, giro: -0.07};
const selloDentro = (L: Capas, u: number) => {
  if (u <= 0) return;
  const k = E.outCubic(clamp(u / 0.09));
  // el papel limpio debajo (la tinta va encima del rojo en el papel: sin esto, la aguada de la pared lo ensuciaría)
  const S = (SELLO_DENTRO.lado / 2) * (1 + 0.4 * (1 - k)) * 1.04, g = SELLO_DENTRO.giro - 0.12 * (1 - k);
  const esq: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [
    SELLO_DENTRO.x + S * (a * Math.cos(g) - b * Math.sin(g)), SELLO_DENTRO.y + S * (a * Math.sin(g) + b * Math.cos(g))]);
  reserva(L, esq, clamp(u / 0.035), 0, 0, false);
  const c = L.color;
  c.save();
  c.translate(SELLO_DENTRO.x, SELLO_DENTRO.y);
  c.rotate(SELLO_DENTRO.giro - 0.12 * (1 - k));
  c.scale(1 + 0.4 * (1 - k), 1 + 0.4 * (1 - k));
  c.globalAlpha = clamp(u / 0.035);
  sello(c, -SELLO_DENTRO.lado / 2, -SELLO_DENTRO.lado / 2, SELLO_DENTRO.lado, 21);
  c.restore();
  // la pasta que salpica un poco al estampar
  if (u > 0.02) {
    for (let j = 0; j < 9; j++) {
      const a = j * 2.4 + 0.3, d = SELLO_DENTRO.lado * (0.62 + 0.18 * Math.sin(j * 5.1));
      gota(c, SELLO_DENTRO.x + Math.cos(a) * d, SELLO_DENTRO.y + Math.sin(a) * d, 1.6 + 2.4 * Math.abs(Math.sin(j * 3.3)), 0.9, 0, 1, 1200 + j, BERMELLON.join(','));
    }
  }
};

const pintaCuadro = (F: Lienzos, C: Lienzos, i: number, t: number) => {
  const {tq, tb, pasoH} = tiempos(i, t);
  const e = lanzamiento(i, tq);
  const b = bola(i, tb);
  const golpes = lanzamiento(i, tb).golpes;
  const hv = pasoH % 3;
  // cada cuadro arranca del cuarto ya pintado
  const pares: [CanvasRenderingContext2D, HTMLCanvasElement][] = [[F.capas.mojada, C.mojada], [F.capas.seca, C.seca], [F.capas.color, C.color]];
  for (const [c, fuente] of pares) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
    c.drawImage(fuente, 0, 0);
  }
  enEscala(F);
  const L = F.capas;
  lampara(L, e.lampara.ang, hv);
  sombras(L, b, e.papelera.inclina);
  muneco(L, e.muneco, hv);
  const inc = e.papelera.inclina;
  const q = proyecta(b.c);
  const detras = !b.dentro && b.c[2] < PAPELERA.z - 20 && Math.abs(q[0] - PAPELERA.x) < 240 && q[1] > PAPELERA.yBorde - 120;
  // la tinta que salta desde dentro (cuando cae en los papeles) va entre el fondo y el frente: lo que cae por debajo del borde, lo tapa
  if (b.dentro) {
    papeleraFondo(L, inc, hv);
    salpicaduras(L, i, golpes, tb, true);
    rastro(L, i, tb);
    bolaTinta(L, b, hv);
    papeleraFrente(L, inc, hv);
    salpicaduras(L, i, golpes, tb);
  } else if (detras) {
    rastro(L, i, tb);
    bolaTinta(L, b, hv);
    papeleraFondo(L, inc, hv);
    salpicaduras(L, i, golpes, tb, true);
    papeleraFrente(L, inc, hv);
    salpicaduras(L, i, golpes, tb);
  } else {
    papeleraFondo(L, inc, hv);
    salpicaduras(L, i, golpes, tb, true);
    papeleraFrente(L, inc, hv);
    salpicaduras(L, i, golpes, tb);
    rastro(L, i, tb);
    bolaTinta(L, b, hv);
  }
  // ¡DENTRO!: el sello rojo 中 («en el blanco»: la última letra de la inscripción) se estampa al lado de la papelera
  const dentro = golpes.find((g) => g.tipo === 'pila');
  if (i === 9 && dentro) selloDentro(L, tb - dentro.t - 0.05);
  return pasoH;
};

export const TintaChina: React.FC<{intento: number; t: number}> = ({intento, t: tt}) => {
  const i = clamp(Math.round(intento), 0, 9);
  const t = clamp(tt, 0, DUR);
  const ref = useRef<HTMLCanvasElement>(null);
  const comp = useRef<Compositor | null>(null);
  const cuadro = useRef<Lienzos | null>(null);
  const [dpr] = useState(() => Math.min(3, Math.max(0.25, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)));
  const [espera] = useState(() => delayRender('Tinta china: la letra de la inscripción'));
  const suelta = useRef(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vivo = true;
    cargaLetra().then(() => {
      if (vivo) setListo(true);
    });
    return () => {
      vivo = false;
      if (!suelta.current) {
        suelta.current = true;
        continueRender(espera);
      }
    };
  }, [espera]);

  useLayoutEffect(() => {
    if (!listo || !ref.current) return;
    if (!comp.current) comp.current = haceCompositor(ref.current);
    if (!cuadro.current) cuadro.current = lienzos(dpr);
    const pasoH = pintaCuadro(cuadro.current, cuarto(dpr), i, t);
    // las aguadas hierven: el ruido que las corre se mueve un pelo en cada paso
    const hierve: [number, number] = [0.22 * Math.sin(pasoH * 2.1), 0.22 * Math.cos(pasoH * 1.7)];
    comp.current(cuadro.current.mojada, cuadro.current.seca, cuadro.current.color, dpr, {fuerza: 1.75, corre: 8, marea: 1.8, hierve, vineta: 0.34, calido: 0.6});
    if (!suelta.current) {
      suelta.current = true;
      continueRender(espera);
    }
  }, [listo, i, t, dpr, espera]);

  // la cámara: un empujón en cada golpe y un acercamiento lento hacia la papelera (a unos), como en los bloques
  const [sx, sy] = temblor(i, t);
  const mover = `translate(${sx}px, ${sy}px) scale(${1 + 0.025 * (t / DUR)})`;
  return (
    <AbsoluteFill style={{background: PAPEL_CSS, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: mover, transformOrigin: '60% 58%'}}>
        <canvas ref={ref} width={Math.round(1080 * dpr)} height={Math.round(1920 * dpr)}
          style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
