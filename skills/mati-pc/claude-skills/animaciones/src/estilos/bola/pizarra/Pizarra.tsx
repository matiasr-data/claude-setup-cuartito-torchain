import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp} from '../../../comun/curvas';
import {DUR, T_PRIMERO, _trayecto, bola, lanzamiento, proyecta, temblor, type P} from '../escena';
import {BolaTiza, Gestos, Golpes, LamparaTiza, MunecoTiza, PapeleraAtras, PapeleraDelante, SombraBola, bolaDetras, giroPapelera} from './Actores';
import {Cabecera, Cuarto, FIN_CUARTO, Fondo, LuzPizarra, Marco, VEL} from './Cuarto';
import {Marcador, Notas, nubesNotas} from './Notas';
import {Defs, Polvo, TIZA, type Nube} from './tiza';

// LA BOLA DE PAPEL EN PIZARRA DE TIZA (la escena en ../escena.ts).
// Una pizarra verde de aula con su marco de madera y su repisa,
// con las pasadas del borrador de otros días, y todo en tiza que se dibuja sola: el cuarto se traza al empezar; el muñeco, su silla,
// la papelera, la lámpara y la bola se redibujan a pasos (12 por segundo, como la animación de tiza de verdad), cada dibujo con el
// pulso un pelo distinto y el borrón del anterior todavía en la pizarra. El profe lo anota todo: la trayectoria en puntos amarillos,
// los trazos de golpe, una nota a mano en cada fallo con su flecha («¡PAM!», «Δ = 29 cm»…), el «¡FALLO!» rosa del final y los
// palotes de la esquina. El polvo de tiza cae al escribir y en cada golpe.
// Todo sale del tiempo t y en el mismo sitio que los bloques (la misma cámara, el mismo empujón en los golpes y el mismo
// acercamiento lento): en el vídeo, la cortinilla pasa de un estilo a otro sin que nada salte.

const PASOS = 12;

// la trayectoria en puntos: un punto cada 32 px del camino que lleva la bola en la pantalla (se calcula una vez por lanzamiento)
type Punto = {t: number; p: P; detras: boolean};
const PUNTOS: Punto[][] = [];
const puntos = (i: number) => {
  if (PUNTOS[i]) return PUNTOS[i];
  const out: Punto[] = [];
  let ant: P | null = null, lleva = 0;
  for (let s = 0.04; s <= DUR; s += 1 / 600) {
    const b = bola(i, s);
    const q = proyecta(b.c);
    if (ant) lleva += Math.hypot(q[0] - ant[0], q[1] - ant[1]);
    ant = q;
    if (lleva >= 32 || !out.length) {
      out.push({t: s, p: q, detras: bolaDetras(b)});
      lleva = 0;
    }
  }
  return (PUNTOS[i] = out);
};

const Rastro: React.FC<{i: number; t: number; detras: boolean}> = ({i, t, detras}) => (
  <g>
    {puntos(i).filter((q) => q.detras === detras && q.t < t - 0.035).map((q, k) => (
      <circle key={k} cx={q.p[0]} cy={q.p[1]} r={6.5} fill={TIZA.amarillo} />
    ))}
  </g>
);

// el polvo: al dibujarse el cuarto, en cada nota y en cada golpe fuerte
const nubes = (i: number): Nube[] => {
  const out: Nube[] = [
    {t: 0.5 / VEL, x: 230, y: 700, n: 14, ancho: 300, semilla: 1},
    {t: 0.56 / VEL, x: 795, y: 548, n: 12, ancho: 180, semilla: 2},
    {t: 0.48 / VEL, x: 220, y: 176, n: 10, ancho: 260, semilla: 3},
    {t: FIN_CUARTO, x: 700, y: 1437, n: 10, ancho: 500, semilla: 4},
  ];
  lanzamiento(i, DUR).golpes.forEach((g, k) => {
    if (g.fuerza < 500) return;
    const q = proyecta(g.p);
    out.push({t: g.t, x: q[0], y: q[1], n: g.tipo === 'suelo' ? 14 : 30, ancho: 70, fuerza: 1.8, semilla: 500 + k});
  });
  return [...out, ...nubesNotas(i)];
};
const NUBES: Nube[][] = [];

export const Pizarra: React.FC<{intento: number; t: number}> = ({intento, t: tt}) => {
  const i = clamp(Math.round(intento), 0, 9);
  const t = clamp(tt, 0, DUR);
  // a pasos: los dibujos caen justo en el primer toque de este lanzamiento
  const T1 = T_PRIMERO[i];
  const fase = T1 - Math.floor(T1 * PASOS) / PASOS;
  const paso = Math.floor((t - fase) * PASOS + 1e-6);
  const tq = Math.max(0, paso / PASOS + fase);
  const e = lanzamiento(i, tq);
  const antes = lanzamiento(i, Math.max(0, tq - 1 / PASOS));
  const b = e.bola;
  const detras = bolaDetras(b);
  // la cámara: el mismo empujón en cada golpe y el mismo acercamiento lento que los bloques (a unos)
  const [sx, sy] = temblor(i, t);
  const mover = `translate(${sx}px, ${sy}px) scale(${1 + 0.025 * (t / DUR)})`;
  const nb = (NUBES[i] ??= nubes(i));
  const pap = giroPapelera(e.papelera.inclina);
  return (
    <AbsoluteFill style={{background: '#1b3027', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: mover, transformOrigin: '60% 58%'}}>
        <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Defs semilla={(paso * 7 + 3) % 997} prefijo="pz" />
          <Fondo />
          {/* lo que está quieto: el cuarto, la cabecera y la puntuación */}
          <g filter="url(#pz-quieta)">
            <Cuarto t={tq} />
            <Cabecera t={tq} intento={i} />
            <Marcador t={tq} i={i} />
          </g>
          {/* el borrón del dibujo anterior (se borró para dibujar este) */}
          {tq > 1 / PASOS && (
            <g filter="url(#pz-borron)" opacity={0.2}>
              <MunecoTiza pose={antes.muneco} />
              <BolaTiza b={antes.bola} />
            </g>
          )}
          {/* lo que se mueve, redibujado en cada paso */}
          <g filter="url(#pz-viva)">
            <LamparaTiza ang={e.lampara.ang} luz={0} />
            <MunecoTiza pose={e.muneco} />
            <Gestos cara={e.muneco.cara} pose={e.muneco} paso={paso} />
            <g transform={pap}><PapeleraAtras /></g>
            <Rastro i={i} t={tq} detras />
            {detras && <SombraBola b={b} />}
            {detras && <BolaTiza b={b} />}
            <g transform={pap}><PapeleraDelante /></g>
            <Rastro i={i} t={tq} detras={false} />
            {!detras && <SombraBola b={b} />}
            {!detras && <BolaTiza b={b} />}
            <Golpes golpes={_trayecto(i).golpes} t={tq} />
          </g>
          {/* lo que anota el profe */}
          <g filter="url(#pz-quieta)">
            <Notas t={tq} i={i} />
          </g>
          <Polvo nubes={nb} t={tq} />
          <LuzPizarra />
          <Marco />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
