import React from 'react';
import {Composition} from 'remotion';
import {Prueba} from './plantillas/Prueba';
import {TableroEstilo} from './plantillas/TableroEstilo';
import {Montaje, Linea} from './video/Montaje';
import video02oct from './datos/video-02oct.json';

// Un montaje por vídeo: los datos (timeline.json) salen de proyectos/<nombre>/trabajo/scripts/timeline.py.
// La composición va a 30 fps exactos: el vídeo base se re-etiqueta a 30 y el resultado se devuelve a 29,97 al empaquetar.
const tl02 = video02oct as unknown as Linea;

export const Root: React.FC = () => {
  return (
    <>
      <Composition id="TableroEstilo" component={TableroEstilo} durationInFrames={1} fps={30} width={1920} height={1080} defaultProps={{estilo: 'A'}} />
      <Composition id="Prueba" component={Prueba} durationInFrames={60} fps={30} width={1920} height={1080} />
      <Composition id="Video02oct" component={Montaje as React.FC<any>} durationInFrames={tl02.frames} fps={30} width={1920} height={1080}
        defaultProps={{tl: tl02, video: 'video-02oct/base30.mp4', capas: 'todo', solo: null}} />
      <Composition id="Video02octBase" component={Montaje as React.FC<any>} durationInFrames={tl02.frames} fps={30} width={1920} height={1080}
        defaultProps={{tl: tl02, video: 'video-02oct/base30.mp4', capas: 'base', solo: null}} />
      <Composition id="Video02octGraficos" component={Montaje as React.FC<any>} durationInFrames={tl02.frames} fps={30} width={1920} height={1080}
        defaultProps={{tl: tl02, video: 'video-02oct/base30.mp4', capas: 'graficos', solo: null}} />
    </>
  );
};
