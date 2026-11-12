import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';

// Gráfico de prueba del modo Configuración: comprueba render y transparencia.
// Sin estilo de marca a propósito (los tokens salen de perfil-creador.md).
export const Prueba: React.FC = () => {
  const frame = useCurrentFrame();
  const entrada = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const texto = interpolate(frame, [8, 15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          padding: '36px 64px',
          borderRadius: 24,
          background: 'rgba(20,20,20,0.85)',
          opacity: entrada,
          transform: `translateY(${(1 - entrada) * 40}px)`,
        }}
      >
        <span style={{fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 72, fontWeight: 700, color: 'white', opacity: texto}}>
          Prueba de transparencia
        </span>
      </div>
    </AbsoluteFill>
  );
};
