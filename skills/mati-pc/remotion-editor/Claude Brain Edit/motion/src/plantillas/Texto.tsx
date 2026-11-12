import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {fitText} from '@remotion/layout-utils';
import {T, W} from '../tokens';
import {CL, sale} from '../lib/anim';

// ── Subtítulo de énfasis ─────────────────────────────────────────────────────
// Palabra a palabra, al fotograma en que se pronuncia: entra un poco más grande y apagada y se asienta en ~0,16 s.
// Un solo realce por plano: el color Acento como fondo, con texto oscuro encima.
type Palabra = {f: number; texto: string; realce?: boolean};
export const Subtitulo: React.FC<{lineas: Palabra[][]; dur: number; tam?: number; y?: number}> = ({lineas, dur, tam = 64, y = 850}) => {
  const f = useCurrentFrame();
  const fuera = sale(f, dur, 4);
  const alto = tam * 1.3;
  const hueco = tam * 0.26;
  // Contorno oscuro + sombra: el texto se lee igual sobre la camiseta blanca que sobre el fondo oscuro.
  const contorno = `${[[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, -2], [-2, 2], [2, 2]].map(([x, y]) => `${x}px ${y}px 0 rgba(10,10,20,0.92)`).join(', ')}, 0 6px 26px rgba(0,0,0,0.85)`;
  return (
    <AbsoluteFill style={{opacity: fuera}}>
      <div style={{position: 'absolute', left: 0, width: W, top: y - (lineas.length * alto) / 2, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {/* velo suave detrás del bloque */}
        <div style={{position: 'absolute', left: W / 2 - 620, width: 1240, top: -70, bottom: -70, background: 'radial-gradient(ellipse at center, rgba(10,10,20,0.62) 0%, rgba(10,10,20,0.3) 45%, rgba(10,10,20,0) 72%)', opacity: interpolate(f, [0, 5], [0, 1], CL)}} />
        {lineas.map((linea, li) => (
          <div key={li} style={{position: 'relative', display: 'flex', alignItems: 'center', height: alto, fontFamily: T.fuente.subtitulos, fontWeight: T.peso.subtitulos, fontSize: tam, letterSpacing: -0.5, whiteSpace: 'nowrap'}}>
            {linea.map((p, i) => {
              const t = interpolate(f, [p.f, p.f + 5], [0, 1], {...CL, easing: Easing.out(Easing.cubic)});
              const visto = f >= p.f;
              const antes = i > 0 && !!linea[i - 1].realce, despues = i < linea.length - 1 && !!linea[i + 1].realce;
              const r = tam * 0.14;
              return (
                <span key={i} style={{position: 'relative', display: 'inline-block', padding: p.realce ? `${tam * 0.02}px ${hueco / 2 + (despues ? 0 : tam * 0.1)}px ${tam * 0.06}px ${hueco / 2 + (antes ? 0 : tam * 0.1)}px` : `0 ${hueco / 2}px`, margin: p.realce ? `0 ${despues ? 0 : tam * 0.04}px 0 ${antes ? 0 : tam * 0.04}px` : 0}}>
                  {p.realce ? (
                    <span style={{position: 'absolute', top: 0, bottom: 0, left: antes ? -2 : 0, right: 0, background: T.color.acento, opacity: visto ? 1 : 0, borderRadius: `${antes ? 0 : r}px ${despues ? 0 : r}px ${despues ? 0 : r}px ${antes ? 0 : r}px`, transform: antes ? undefined : `scale(${0.9 + 0.1 * t})`}} />
                  ) : null}
                  <span style={{position: 'relative', display: 'inline-block', opacity: visto ? 0.5 + 0.5 * t : 0, transform: `scale(${1.16 - 0.16 * t})`, color: p.realce ? T.color.sobreAcento : T.color.texto, textShadow: p.realce ? 'none' : contorno}}>{p.texto}</span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ── Titular ──────────────────────────────────────────────────────────────────
// Texto grande (rol Display, máx. ~5 palabras), palabra a palabra. Un acento por plano. Tachado en color semántico.
type PalabraT = {f: number; texto: string; acento?: boolean};
export const Titular: React.FC<{palabras: PalabraT[]; dur: number; y?: number; tam?: number; tachar?: number; ancho?: number}> = ({palabras, dur, y = 800, tam = 150, tachar, ancho = 1560}) => {
  const f = useCurrentFrame();
  const fuera = sale(f, dur, 5);
  const texto = palabras.map((p) => p.texto).join(' ');
  // El texto se ajusta midiéndolo, nunca contando letras.
  const medido = fitText({text: texto, withinWidth: ancho - palabras.length * tam * 0.3, fontFamily: 'DIN Condensed', fontWeight: 700, letterSpacing: '0.01em'}).fontSize;
  const cuerpo = Math.min(tam, medido);
  const tach = tachar === undefined ? 0 : interpolate(f, [tachar, tachar + 6], [0, 1], {...CL, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{opacity: fuera, transform: `translateY(${(1 - fuera) * -14}px)`}}>
      <div style={{position: 'absolute', left: 0, width: W, top: y - cuerpo * 0.56, display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: cuerpo * 0.2, fontFamily: T.fuente.display, fontWeight: T.peso.display, fontSize: cuerpo, lineHeight: 1, letterSpacing: '0.01em', textTransform: 'uppercase', whiteSpace: 'nowrap'}}>
          {palabras.map((p, i) => {
            const t = interpolate(f, [p.f, p.f + 6], [0, 1], {...CL, easing: Easing.out(Easing.cubic)});
            const visto = f >= p.f;
            return (
              <span key={i} style={{position: 'relative', display: 'inline-block', opacity: visto ? t : 0, transform: `translateY(${(1 - t) * 34}px) scale(${1.22 - 0.22 * t})`, padding: p.acento ? `${cuerpo * 0.1}px ${cuerpo * 0.16}px 0` : `${cuerpo * 0.1}px 0 0`}}>
                {p.acento ? <span style={{position: 'absolute', inset: `0 0 ${cuerpo * 0.04}px 0`, background: T.color.acento, borderRadius: cuerpo * 0.07, boxShadow: '0 12px 40px rgba(0,0,0,0.5)'}} /> : null}
                <span style={{position: 'relative', color: p.acento ? T.color.sobreAcento : T.color.texto, textShadow: p.acento ? 'none' : T.sombraTexto, opacity: tach > 0 && !p.acento ? 1 - 0.35 * tach : 1}}>{p.texto}</span>
              </span>
            );
          })}
          {tachar !== undefined ? (
            <span style={{position: 'absolute', left: -cuerpo * 0.12, right: -cuerpo * 0.12, top: '50%', height: cuerpo * 0.1, marginTop: -cuerpo * 0.02, background: T.color.semantico, borderRadius: cuerpo, transformOrigin: '0 50%', transform: `scaleX(${tach}) rotate(-2deg)`, boxShadow: '0 4px 18px rgba(0,0,0,0.5)'}} />
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
