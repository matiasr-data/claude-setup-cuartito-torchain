import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {loadFont} from '@remotion/google-fonts/YujiSyuku';
import {E, clamp, rng} from '../../../comun/curvas';
import {DUR, T_PRIMERO, bola, lanzamiento, temblor} from '../escena';
import {MARCO, decorado} from './fondo';
import {bolaEscena, capaBola, estela, farol, golpesVisibles, muneco, papeleraDelante, papeleraDetras, salpica, silla} from './figuras';
import {H, Plancha, TINTA, W, estampa, lienzo, sello, texturas} from './imprenta';

// LA BOLA DE PAPEL EN GRABADO JAPONÉS (ukiyo-e; la escena en ../escena.ts). Una estampa de madera de la época
// Edo: tintas planas de azul de Prusia, bermellón, ocre, verde y carne sobre papel washi con su fibra, el contorno negro de la
// plancha de líneas, los degradados frotados a mano (bokashi) en el cielo de la ventana y en el suelo, la veta del cerezo que asoma
// en las tintas y cada color un pelo fuera de registro. El cuarto es un interior japonés (la ventana con el Fuji, el tokonoma, el
// tatami, el farol de papel); la cartela vertical dice el intento y lleva su sello. Todo se mueve a pasos, como el papel recortado:
// el muñeco, la papelera y el farol a 12 posturas por segundo (cada paso, una impresión un pelo distinta), la bola a 24; en cada
// golpe salen las garras de espuma de Hokusai con sus gotas. Si entra (el 10), un sello rojo grande lo firma: ¡DENTRO!
// La estampa no se mueve (es una lámina): solo da un respingo en los golpes fuertes.

const {fontFamily: YUJI, waitUntilDone} = loadFont('normal', {
  weights: ['400'],
  // el latín para la cartela y solo los trozos de la fuente con los caracteres que se usan (no los 120 del japonés):
  // 紙 y 球 (el sello y el farol) en el [104]; 七 [96], 転 [112], 八 [101] y 起 [106] (el refrán del rollo)
  subsets: ['latin', ...(['[104]', '[96]', '[112]', '[101]', '[106]'] as unknown as 'latin'[])],
});
const FUENTE = `"${YUJI}"`;

const PASOS = 12;
const PASOS_BOLA = 24;

// ---------------------------------------------------------------- la cartela vertical con el intento, y su sello
const CARTELAS = new Map<string, HTMLCanvasElement>();
const cartela = (intento: number, dpr: number) => {
  const k = `${intento}|${dpr}`;
  const ya = CARTELAS.get(k);
  if (ya) return ya;
  const w = 96, letra = 31, paso = 34;
  const palabra = 'INTENTO';
  const alto1 = palabra.length * paso + 26;
  const num = String(intento);
  const tamNum = num.length > 1 ? 64 : 92;
  const alto2 = num.length > 1 ? 2 * tamNum * 0.86 + 28 : tamNum + 30;
  const h = alto1 + alto2;
  const c = lienzo((w + 20) * dpr, (h + 20) * dpr);
  const x = c.getContext('2d')!;
  x.setTransform(dpr, 0, 0, dpr, 10 * dpr, 10 * dpr);
  // el papel crema de la tira y la pestaña de arriba en rosa bermellón
  x.fillStyle = '#f3e6c3';
  x.fillRect(0, 0, w, h);
  x.fillStyle = TINTA.beniL;
  x.fillRect(1.5, 1.5, w - 3, alto1);
  // la veta y las motas, también aquí
  const tx = texturas();
  x.save();
  x.globalCompositeOperation = 'source-atop';
  x.globalAlpha = 0.12;
  x.drawImage(tx.veta, -500, -300);
  x.globalCompositeOperation = 'destination-out';
  x.globalAlpha = 0.25;
  x.drawImage(tx.motas, -200, -100, W / 2, H / 2);
  x.restore();
  x.strokeStyle = TINTA.sumi;
  x.lineWidth = 3.4;
  x.strokeRect(0, 0, w, h);
  x.lineWidth = 1.3;
  x.strokeRect(5, 5, w - 10, h - 10);
  x.lineWidth = 1.8;
  x.beginPath();
  x.moveTo(5, alto1);
  x.lineTo(w - 5, alto1);
  x.stroke();
  x.fillStyle = TINTA.sumi;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.font = `400 ${letra}px ${FUENTE}`;
  [...palabra].forEach((ch, i) => x.fillText(ch, w / 2, 16 + paso / 2 + i * paso));
  x.font = `400 ${tamNum}px ${FUENTE}`;
  if (num.length > 1) [...num].forEach((ch, i) => x.fillText(ch, w / 2, alto1 + 14 + tamNum * 0.43 + i * tamNum * 0.86));
  else x.fillText(num, w / 2, alto1 + alto2 / 2 + 4);
  CARTELAS.set(k, c);
  return c;
};

// ---------------------------------------------------------------- pintar un cuadro
let PLANCHA: Plancha | null = null;
const pintar = (lz: HTMLCanvasElement, intento: number, tt: number, dpr: number) => {
  const i = clamp(Math.round(intento), 0, 9);
  const t = clamp(tt, 0, DUR);
  // a pasos: las posturas caen justo en el primer toque de este lanzamiento
  const T1 = T_PRIMERO[i];
  const fase = (pasos: number) => T1 - Math.floor(T1 * pasos) / pasos;
  const paso = Math.floor((t - fase(PASOS)) * PASOS + 1e-6);
  const tq = Math.max(0, paso / PASOS + fase(PASOS));
  const pasoB = Math.floor((t - fase(PASOS_BOLA)) * PASOS_BOLA + 1e-6);
  const tb = Math.max(0, pasoB / PASOS_BOLA + fase(PASOS_BOLA));
  const e = lanzamiento(i, tq);
  const b = bola(i, tb);

  const x = lz.getContext('2d')!;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = 1;
  // el paspartú (lo que asoma si la lámina da un respingo)
  x.fillStyle = TINTA.monte;
  x.fillRect(0, 0, lz.width, lz.height);
  const [sx, sy] = temblor(i, t);
  x.translate(sx * 0.6 * dpr, sy * 0.6 * dpr);
  x.drawImage(decorado(dpr, FUENTE), 0, 0);

  // lo que se mueve, en su plancha
  if (!PLANCHA || PLANCHA.dpr !== dpr) PLANCHA = new Plancha(dpr);
  const pl = PLANCHA;
  pl.limpia();
  const r = rng(paso * 977 + 13);
  pl.extra = [(r() - 0.5) * 0.9, (r() - 0.5) * 0.9];
  farol(pl, e.lampara.ang, FUENTE);
  silla(pl, e.muneco);
  muneco(pl, e.muneco, paso);
  const capa = capaBola(b);
  const golpes = golpesVisibles(e.golpes, tq);
  const enLaPila = golpes.filter((g) => g.tipo === 'pila');
  const resto = golpes.filter((g) => g.tipo !== 'pila');
  const pintaBola = () => {
    estela(pl, (s) => bola(i, s).c, tb);
    bolaEscena(pl, b);
  };
  if (capa === 'detras') pintaBola();
  papeleraDetras(pl, e.papelera.inclina);
  // lo que cae dentro (la bola y el golpe en el fondo) queda tapado por la pared de delante
  enLaPila.forEach((g) => salpica(pl, g, tq - g.t, Math.round(g.t * 1000) + 7, 1.55));
  if (capa === 'dentro') pintaBola();
  papeleraDelante(pl, e.papelera.inclina);
  // las garras de espuma salen por detrás de la bola (la bola se queda delante, a la vista)
  resto.forEach((g) => salpica(pl, g, tq - g.t, Math.round(g.t * 1000) + 7, g.tipo === 'suelo' ? 1.1 : 1));
  if (capa === 'delante') pintaBola();

  x.save();
  x.setTransform(dpr, 0, 0, dpr, sx * 0.6 * dpr, sy * 0.6 * dpr);
  x.beginPath();
  x.rect(MARCO.x0, MARCO.y0, MARCO.x1 - MARCO.x0, MARCO.y1 - MARCO.y0);
  x.clip();
  x.setTransform(1, 0, 0, 1, sx * 0.6 * dpr, sy * 0.6 * dpr);
  estampa(x, pl, {veta: 0.13, baren: 0.26, motas: 0.26, motasLinea: 0.1, papelDebajo: true});
  // la fibra del washi asomando por encima de toda la tinta
  x.globalAlpha = 1;
  x.drawImage(texturas().fibra, 0, 0, W * dpr, H * dpr);
  x.restore();

  // el filete doble de la estampa
  x.save();
  x.setTransform(dpr, 0, 0, dpr, sx * 0.6 * dpr, sy * 0.6 * dpr);
  x.strokeStyle = TINTA.sumi;
  x.lineWidth = 5;
  x.strokeRect(MARCO.x0, MARCO.y0, MARCO.x1 - MARCO.x0, MARCO.y1 - MARCO.y0);
  x.lineWidth = 1.6;
  x.strokeRect(MARCO.x0 - 9, MARCO.y0 - 9, MARCO.x1 - MARCO.x0 + 18, MARCO.y1 - MARCO.y0 + 18);
  // la cartela y el sello
  const ct = cartela(i + 1, dpr);
  const cx0 = 908, cy0 = 70;
  x.drawImage(ct, cx0 - 10, cy0 - 10, ct.width / dpr, ct.height / dpr);
  const s1 = sello(['紙', '球'], 62, FUENTE, {semilla: 3});
  const alto = ct.height / dpr - 20;
  x.save();
  x.globalAlpha = 0.94;
  x.globalCompositeOperation = 'multiply';
  x.translate(cx0 + 48, cy0 + alto + 46);
  x.rotate(-0.04);
  x.drawImage(s1, -s1.width / 2, -s1.height / 2);
  x.restore();
  // ¡DENTRO!: un sello grande que se estampa (de grande a su tamaño) cuando entra
  if (i === 9) {
    const t0 = 0.88;
    const u = tq - t0;
    if (u >= 0) {
      const sg = sello(['¡DENTRO!'], 175, FUENTE, {semilla: 9, redondo: true, tam: 0.62, ancho: 2.2});
      const k = u < 0.2 ? 1.4 - 0.4 * E.outCubic(clamp(u / 0.16)) : 1;
      x.save();
      x.globalAlpha = 0.93 * clamp(u / 0.06 + 0.3);
      x.translate(516, 868); // a la izquierda del rollo, sin pisarlo
      x.rotate(-0.12);
      x.scale(k, k);
      x.drawImage(sg, -sg.width / 2, -sg.height / 2);
      x.restore();
    }
  }
  x.restore();
};

export const GrabadoJapones: React.FC<{intento: number; t: number}> = ({intento, t}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [dpr] = useState(() => Math.min(2, Math.max(0.25, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)));
  const [espera] = useState(() => delayRender('Grabado japonés: la letra de la cartela y el sello'));
  const suelta = useRef(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vivo = true;
    waitUntilDone()
      .then(() => Promise.all([document.fonts.load(`400 40px ${FUENTE}`, 'INTENTO 0123456789'), document.fonts.load(`400 40px ${FUENTE}`, '紙球七転八起')]))
      .catch(() => undefined)
      .then(() => {
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
    pintar(ref.current, intento, t, dpr);
    if (!suelta.current) {
      suelta.current = true;
      continueRender(espera);
    }
  }, [intento, t, listo, dpr, espera]);

  return (
    <canvas ref={ref} width={Math.round(W * dpr)} height={Math.round(H * dpr)}
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%', background: TINTA.monte}} />
  );
};
