import React from 'react';
import {Composition} from 'remotion';
import {Prueba} from './Prueba';

// Aquí se registra cada composición: nombre, tamaño, fotogramas por segundo y duración.
export const Root: React.FC = () => {
  return <Composition id="Prueba" component={Prueba} durationInFrames={90} fps={30} width={1920} height={1080} />;
};
