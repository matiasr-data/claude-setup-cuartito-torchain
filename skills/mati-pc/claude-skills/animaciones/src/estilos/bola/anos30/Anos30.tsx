import React, {useId} from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {clamp, rng, ruido} from '../../../comun/curvas';
import {DUR, PAPELERA, R_BOLA, T_PRIMERO, bola, centroLampara, lanzamiento, proyecta, temblor} from '../escena';
import {Lienzo} from './tinta';
import {dibujaBalda, dibujaCortinas, dibujaCuadro, dibujaLampara, dibujaLuz, dibujaRadio, papeleraDelante, papeleraDetras, pintaFondo, sombraPapelera, type EstadoPapelera} from './Decorado30';
import {dibujaMuneco, dibujaSilla, sombraSilla} from './Muneco30';
import {arcosAro, bolaDetras, dibujaBola, dibujaGolpes, estrellasMareo, sombraBola} from './Efectos30';
import {Pelicula30, texturaAcuarela} from './Pelicula30';
import type {TipoBoca, TipoOjo} from './partes';

// LA BOLA DE PAPEL EN DIBUJO ANIMADO DE LOS AÑOS 30 (la escena en ../escena.ts).
// Blanco y negro de tinta gruesa: el muñeco de siempre hecho
// personaje de los 30 (brazos y piernas de manguera, guantes blancos, zapatones, ojos de pastel cortado), y todo lo de la oficina vivo
// y balanceándose al compás de una banda de 144 por minuto (cada tiempo cae justo en el primer toque de la bola): la papelera tiene
// cara y mira la bola (le duele cada golpe en el borde y se burla cuando falla), la lámpara también mira, la radio canta, los libros
// bailan, las cortinas se mecen. Animado «a dos» (12 dibujos por segundo, con la tinta que hierve en cada uno), la bola «a unos» (24),
// aplastar y estirar exagerados, estrellas y líneas de impacto en cada golpe, y encima la película vieja: grano, rayas, polvo,
// parpadeo, la viñeta redonda y el vaivén del proyector. La cámara, a 60, con un empujón en cada golpe.
// Misma firma que Bloques: intento 0..9 y t en segundos del lanzamiento.

const PASOS = 12; // el muñeco, el decorado y la tinta
const PASOS_BOLA = 24; // la bola
const PULSO = 60 / 144; // un tiempo de la banda (10 cuadros de 24)
const PB = PAPELERA;
const hash = (n: number) => rng(Math.floor(n * 7919) + 3)();

// el telón de fondo, pintado una vez
const FONDO = (() => {
  const L = new Lienzo('a30f', 0, 0);
  pintaFondo(L);
  return L.els;
})();

export const Anos30: React.FC<{intento: number; t: number}> = ({intento, t: tt}) => {
  const i = clamp(Math.round(intento), 0, 9);
  const t = clamp(tt, 0, DUR);
  const T1 = T_PRIMERO[i];
  // a dos: los dibujos caen justo en el primer toque de este lanzamiento
  const fase = (pasos: number) => T1 - Math.floor(T1 * pasos) / pasos;
  const paso = Math.floor((t - fase(PASOS)) * PASOS + 1e-6);
  const tq = Math.max(0, paso / PASOS + fase(PASOS));
  const pasoB = Math.floor((t - fase(PASOS_BOLA)) * PASOS_BOLA + 1e-6);
  const tb = Math.max(0, pasoB / PASOS_BOLA + fase(PASOS_BOLA));
  const e = lanzamiento(i, tq);
  const b = bola(i, tb);
  // el compás: un tiempo cae en el primer toque
  const pulso = (tq - T1) / PULSO;
  const latido = Math.cos(2 * Math.PI * pulso);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const L = new Lienzo(`a30${uid}`, paso, 2.1);

  // dónde está la bola en la pantalla (lo que miran la papelera y la lámpara)
  const bS = proyecta(b.c);
  const boca0 = proyecta([PB.x, PB.yBorde, 0]);
  const dist = Math.hypot(bS[0] - boca0[0], bS[1] - boca0[1]);
  const rho = Math.hypot(b.c[0] - PB.x, b.c[2] - PB.z);

  // ---- la papelera: respira (menos cuando la bola anda cerca), se aplasta con los golpes y pone su cara
  const cerca = clamp(1 - dist / 320);
  const resp = 0.045 * (1 - cerca);
  let aplasta = 0;
  let duele = false;
  for (const g of e.golpes) {
    const u = tq - g.t;
    if (u < 0 || !['borde', 'papelera', 'pila'].includes(g.tipo)) continue;
    if (u < 0.5) aplasta += clamp(g.fuerza / 2600) * 0.09 * Math.exp(-8 * u) * Math.cos(20 * u);
    if (g.tipo !== 'pila' && g.fuerza > 300 && u < 0.28) duele = true;
  }
  aplasta *= 1 - 0.8 * cerca;
  const fuera = !b.dentro && b.c[1] > PB.yBorde + 30 && rho > PB.rBorde + PB.tubo + R_BOLA * 0.6 && tq > T1 + 0.05;
  let cara: {ojos: TipoOjo; boca: TipoBoca; abre: number; alto: number; inc: number};
  if (i === 9 && tq >= T1) cara = {ojos: 'feliz', boca: 'grande', abre: 0.62, alto: 1, inc: -0.3};
  else if (b.dentro && tq >= T1) cara = {ojos: 'feliz', boca: 'risa', abre: 0.55, alto: 1, inc: -0.3};
  else if (duele) cara = {ojos: 'aprieta', boca: 'ondas', abre: 0.6, alto: 0.4, inc: -1};
  else if (fuera) cara = {ojos: 'feliz', boca: 'lengua', abre: 0.5, alto: 0, inc: 0.9};
  else if (dist < 340) cara = {ojos: 'grande', boca: 'o', abre: 0.7, alto: 1, inc: -0.5};
  else cara = {ojos: 'abierto', boca: 'sonrisa', abre: 0.6, alto: 0, inc: 0};
  const papelera: EstadoPapelera = {
    inclina: e.papelera.inclina, sx: 1 - 0.6 * resp * latido + 0.6 * aplasta, sy: 1 + resp * latido - aplasta,
    ojos: cara.ojos, boca: cara.boca, abre: cara.abre, mira: bS, cejasAlto: cara.alto, cejasInc: cara.inc,
  };

  // ---- la lámpara: mira la bola; si la golpea, aprieta los ojos y se marea
  const gLamp = e.golpes.find((g) => g.tipo === 'lampara');
  const cL = centroLampara(e.lampara.ang);
  let ojosL: TipoOjo = Math.hypot(bS[0] - cL[0], bS[1] - cL[1]) < 300 ? 'grande' : 'abierto';
  let mareo = false;
  if (gLamp) {
    ojosL = tq - gLamp.t < 0.25 ? 'aprieta' : 'espiral';
    mareo = tq - gLamp.t >= 0.25;
  }
  const gMuro = e.golpes.find((g) => g.tipo === 'muro');

  // ---- se pinta de atrás adelante
  dibujaLuz(L, e.lampara.ang);
  dibujaCortinas(L, latido);
  dibujaCuadro(L, Math.cos(2 * Math.PI * pulso * 0.5), gMuro ? tq - gMuro.t : -1);
  dibujaBalda(L, pulso);
  dibujaRadio(L, pulso, tq, i === 9 && tq >= T1 + 0.05);
  sombraSilla(L);
  sombraPapelera(L, papelera);
  sombraBola(L, b);
  dibujaLampara(L, {ang: e.lampara.ang, ojos: ojosL, mira: bS, giro: tq * 14}, pulso);
  dibujaSilla(L, e.muneco, latido);
  dibujaMuneco(L, e.muneco, latido, tq);
  papeleraDetras(L, papelera);
  const detras = bolaDetras(b);
  if (detras) {
    arcosAro(L, i, tb, b);
    dibujaBola(L, i, tb, b);
  }
  papeleraDelante(L, papelera);
  if (!detras) {
    arcosAro(L, i, tb, b);
    dibujaBola(L, i, tb, b);
  }
  dibujaGolpes(L, e.golpes, tq);
  if (mareo) estrellasMareo(L, [cL[0], cL[1] - 70], tq, 110, 26);

  // ---- la cámara: el empujón de cada golpe (a unos), el vaivén del proyector y un acercamiento lento
  const [sx, sy] = temblor(i, t);
  const f24 = Math.floor(tt * 24 + 1e-6);
  const salto = hash(f24 * 7.1) > 0.97 ? (hash(f24) - 0.5) * 6 : 0;
  const wx = ruido(tt * 1.3, 21) * 1.4 + salto, wy = ruido(tt * 1.1 + 40, 22) * 1.6 + salto * 0.6;
  const mover = `translate(${sx + wx}px, ${sy + wy}px) scale(${1.01 + 0.02 * (t / DUR)})`;
  return (
    <AbsoluteFill style={{background: '#050505', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: mover, transformOrigin: '58% 60%', filter: 'contrast(1.13)'}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{FONDO}</svg>
        {/* la acuarela del telón y el grano del papel */}
        <Img src={texturaAcuarela()} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}} />
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{L.els}</svg>
      </AbsoluteFill>
      <Pelicula30 t={tt} />
    </AbsoluteFill>
  );
};
