import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {T, W} from '../tokens';
import {CL, bote, entra, sale} from '../lib/anim';
import {Icono} from './Icono';

// Chips: etiquetas que entran en cascada, cada una en la palabra que la nombra.
// columna → lista a la izquierda (la cara manda); fila → centradas abajo.
type Item = {f: number; texto: string; icono?: string | null};
export const Chip: React.FC<{texto: string; icono?: string | null; activo?: boolean; alto?: number; cuerpo?: number}> = ({texto, icono, activo, alto = 66, cuerpo = 30}) => (
  <div
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 14, height: alto, padding: `0 ${alto * 0.4}px 0 ${icono ? alto * 0.28 : alto * 0.4}px`,
      background: T.color.tarjeta, border: `2px solid ${activo ? T.color.acento : T.color.borde}`, borderRadius: alto * 0.24, boxShadow: T.sombraTarjeta,
      fontFamily: T.fuente.tarjetas, fontWeight: 700, fontSize: cuerpo, letterSpacing: 1.6, color: T.color.texto, whiteSpace: 'nowrap',
    }}
  >
    {icono ? <Icono nombre={icono} tam={alto * 0.52} color={activo ? T.color.acento : T.color.metodo} /> : null}
    <span style={{paddingTop: 2}}>{texto}</span>
  </div>
);

export const Chips: React.FC<{items: Item[]; dur: number; disposicion?: 'fila' | 'columna'; x?: number; y?: number; pulsos?: {f: number; i: number}[]}> = ({items, dur, disposicion = 'fila', x = 96, y = 838, pulsos = []}) => {
  const f = useCurrentFrame();
  const ultimo = items.reduce((a, it, i) => (f >= it.f ? i : a), -1);
  const chip = (it: Item, i: number) => {
    const col = disposicion === 'columna';
    const e = col ? entra(f, it.f, 7) : bote(f, it.f, 9);
    const s = sale(f, dur - (col ? (items.length - 1 - i) * 2 : 0), 5);
    const pulso = pulsos.filter((p) => p.i === i).reduce((a, p) => Math.max(a, interpolate(f, [p.f, p.f + 3, p.f + 11], [0, 1, 0], CL)), 0);
    const visto = f >= it.f;
    return (
      <div key={i} style={{opacity: visto ? Math.min(entra(f, it.f, 5), s) : 0, transform: col ? `translateX(${(1 - e) * -46 + (1 - s) * -30}px)` : `scale(${(0.6 + 0.4 * e) * (1 + 0.12 * pulso)}) translateY(${(1 - s) * 16}px)`}}>
        <Chip texto={it.texto} icono={it.icono} activo={i === ultimo || pulso > 0.05} alto={col ? 82 : 86} cuerpo={col ? 37 : 39} />
      </div>
    );
  };
  if (disposicion === 'columna') {
    return (
      <AbsoluteFill>
        <div style={{position: 'absolute', left: x, top: y, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16}}>{items.map(chip)}</div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, width: W, top: y - 43, display: 'flex', justifyContent: 'center', gap: 18}}>{items.map(chip)}</div>
    </AbsoluteFill>
  );
};
