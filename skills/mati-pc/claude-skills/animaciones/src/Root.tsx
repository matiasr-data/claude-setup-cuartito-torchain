import React from 'react';
import {AbsoluteFill, Composition, useCurrentFrame, useVideoConfig} from 'remotion';
import {DUR} from './estilos/gato/escena';
import {ESTILOS_GATO} from './estilos/gato/estilos';
import {DUR as DUR_BOLA} from './estilos/bola/escena';
import {ESTILOS as ESTILOS_BOLA} from './estilos/bola/estilos';
import {ORDEN, ORDEN_BOLA, type IdEstilo, type IdEstiloBola} from './estilos/orden';

// Una composición por estilo, con el nombre que se escribe al pedirla: `npx remotion render src/index.ts plano-azul out/plano-azul.mp4`.
// Todas en vertical, 1080 × 1920 y 60 cuadros por segundo. Cada estilo recibe solo el segundo en el que va (t) y pinta ese cuadro:
// el mismo segundo da siempre el mismo cuadro.
//   · Del 1 al 10, el gato (./estilos/gato/escena.ts): 6 segundos.
//   · Del 11 al 20, la bola de papel (./estilos/bola/escena.ts): el lanzamiento entero, 2 segundos. Con `intento` (del 1 al 10)
//     se escoge cuál: `--props='{"intento":3}'`. Si no se dice, cada estilo sale con el suyo del vídeo.

const Estilo: React.FC<{estilo: IdEstilo}> = ({estilo}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const Pinta = ESTILOS_GATO[estilo];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Pinta t={frame / fps} />
    </AbsoluteFill>
  );
};

const PINTA_BOLA = Object.fromEntries(ESTILOS_BOLA.map((e) => [e.id, e.C]));

const EstiloBola: React.FC<{estilo: IdEstiloBola; intento: number}> = ({estilo, intento}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const Pinta = PINTA_BOLA[estilo];
  // en el código los lanzamientos van del 0 al 9; al pedirlos, del 1 al 10
  const i = Math.min(10, Math.max(1, Math.round(Number(intento) || 1))) - 1;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Pinta intento={i} t={frame / fps} />
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <>
    {ORDEN.map((e) => (
      <Composition key={e.id} id={e.composicion} component={Estilo} defaultProps={{estilo: e.id}}
        width={1080} height={1920} fps={60} durationInFrames={Math.round(DUR * 60)} />
    ))}
    {ORDEN_BOLA.map((e) => (
      <Composition key={e.id} id={e.composicion} component={EstiloBola} defaultProps={{estilo: e.id, intento: e.intento as number}}
        width={1080} height={1920} fps={60} durationInFrames={Math.round(DUR_BOLA * 60)} />
    ))}
  </>
);
