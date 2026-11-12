import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';

// Gráfico de prueba: una tarjeta que entra y un texto que aparece después.
// En Remotion toda animación depende del número de fotograma (useCurrentFrame), no de animaciones CSS.
export const Prueba: React.FC = () => {
  const frame = useCurrentFrame();
  const tarjeta = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const texto = interpolate(frame, [12, 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const acento = interpolate(frame, [26, 36], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{backgroundColor: '#0A0A14', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{opacity: tarjeta, transform: `translateY(${(1 - tarjeta) * 50}px)`, display: 'flex', alignItems: 'center', gap: 28}}>
        <span style={{fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', fontSize: 110, fontWeight: 700, color: '#FFFFFF', opacity: texto}}>Remotion</span>
        <span
          style={{
            fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', fontSize: 110, fontWeight: 700, color: '#0A0A14',
            background: '#D6FF3F', borderRadius: 18, padding: '6px 34px', opacity: acento, transform: `scale(${0.8 + 0.2 * acento})`,
          }}
        >
          funciona
        </span>
      </div>
    </AbsoluteFill>
  );
};
