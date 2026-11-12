import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {T, W} from '../tokens';
import {CL, bote, entra, sale} from '../lib/anim';
import {Icono} from './Icono';
import {Chip} from './Chips';

const display = {fontFamily: T.fuente.display, fontWeight: T.peso.display, textTransform: 'uppercase' as const, lineHeight: 1, whiteSpace: 'nowrap' as const};
const rotulo = {fontFamily: T.fuente.tarjetas, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const};

// ── Antes / después: el «antes» se tacha en color semántico y lo sustituye el «después» en Acento ──
export const AntesDespues: React.FC<{dur: number; etiqueta: string; etiqueta2: string; antes: string; despues: string; fAntes: number; fTachar: number; fDespues: number}> = ({dur, etiqueta, etiqueta2, antes, despues, fAntes, fTachar, fDespues}) => {
  const f = useCurrentFrame();
  const fuera = sale(f, dur, 5);
  const eEt = entra(f, 0, 7);
  const eA = entra(f, fAntes, 6);
  const tach = interpolate(f, [fTachar, fTachar + 6], [0, 1], {...CL, easing: Easing.out(Easing.cubic)});
  const cambio = interpolate(f, [fDespues - 3, fDespues + 1], [0, 1], CL);
  const eD = bote(f, fDespues, 9);
  const tam = 132;
  return (
    <AbsoluteFill style={{opacity: fuera}}>
      <div style={{position: 'absolute', left: 0, width: W, top: 716, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
        <div style={{...rotulo, fontSize: 34, color: T.color.metodo, opacity: eEt, transform: `translateY(${(1 - eEt) * 12}px)`, textShadow: T.sombraTexto, background: 'rgba(10,10,20,0.72)', padding: '8px 18px 6px', borderRadius: 8}}>
          {cambio > 0.5 ? etiqueta2 : etiqueta}
        </div>
        <div style={{position: 'relative', height: tam * 1.05, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{...display, position: 'absolute', fontSize: tam, color: T.color.texto, textShadow: T.sombraTexto, opacity: (f >= fAntes ? eA : 0) * (1 - cambio) * (1 - 0.3 * tach), transform: `translateY(${(1 - eA) * 30 - cambio * 26}px) scale(${1.2 - 0.2 * eA})`, paddingTop: tam * 0.1}}>
            <span style={{position: 'relative'}}>
              {antes}
              <span style={{position: 'absolute', left: -14, right: -14, top: '46%', height: tam * 0.1, background: T.color.semantico, borderRadius: tam, transformOrigin: '0 50%', transform: `scaleX(${tach}) rotate(-2deg)`}} />
            </span>
          </div>
          <div style={{...display, position: 'absolute', fontSize: tam, color: T.color.sobreAcento, background: T.color.acento, borderRadius: tam * 0.07, padding: `${tam * 0.12}px ${tam * 0.18}px ${tam * 0.01}px`, opacity: f >= fDespues ? 1 : 0, transform: `scale(${0.7 + 0.3 * eD})`, boxShadow: '0 12px 40px rgba(0,0,0,0.5)'}}>
            {despues}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Barra de vídeo con la recompensa al final (bucle abierto: «te la dejo al final del vídeo») ──
export const BarraFinal: React.FC<{dur: number; etiqueta: string; nota: string; fViaje: [number, number]; fNota: number}> = ({dur, etiqueta, nota, fViaje, fNota}) => {
  const f = useCurrentFrame();
  const e = entra(f, 0, 7);
  const fuera = sale(f, dur, 5);
  const x0 = 380, ancho = 1160, yb = 884;
  const p = interpolate(f, fViaje, [0.16, 1], {...CL, easing: Easing.inOut(Easing.cubic)});
  const llegado = f >= fViaje[1];
  const eM = bote(f, 4, 9);
  const eLlega = bote(f, fViaje[1], 9);
  const eN = entra(f, fNota, 7);
  return (
    <AbsoluteFill style={{opacity: Math.min(e, fuera)}}>
      <div style={{position: 'absolute', left: x0 - 46, top: yb - 126, width: ancho + 92, height: 190, background: 'rgba(10,10,20,0.78)', border: `2px solid ${T.color.borde}`, borderRadius: 22, boxShadow: T.sombraTarjeta, transform: `translateY(${(1 - e) * 24}px)`}} />
      <div style={{position: 'absolute', left: x0, top: yb, width: ancho * e, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.25)'}} />
      <div style={{position: 'absolute', left: x0, top: yb, width: ancho * p * e, height: 10, borderRadius: 5, background: T.color.acento}} />
      <div style={{position: 'absolute', left: x0 + ancho * p * e - 13, top: yb - 8, width: 26, height: 26, borderRadius: 13, background: T.color.acento, boxShadow: '0 0 0 6px rgba(214,255,63,0.25)'}} />
      <div style={{position: 'absolute', left: x0, top: yb - 84, opacity: eN, transform: `translateX(${(1 - eN) * -20}px)`, ...rotulo, fontSize: 38, color: T.color.texto}}>{nota}</div>
      <div style={{position: 'absolute', left: x0 + ancho - 236, top: yb - 104, width: 236, display: 'flex', justifyContent: 'flex-end', transform: `scale(${(0.6 + 0.4 * eM) * (1 + 0.14 * (llegado ? 1 - eLlega : 0) + (llegado ? 0.06 : 0))})`, transformOrigin: '100% 100%', opacity: f >= 4 ? 1 : 0}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, height: 72, padding: '0 26px 0 20px', borderRadius: 16, background: llegado ? T.color.acento : 'rgba(10,10,20,0.9)', border: `2px solid ${T.color.acento}`, color: llegado ? T.color.sobreAcento : T.color.acento, ...display, fontSize: 56}}>
          <Icono nombre="regalo" tam={38} />
          <span style={{paddingTop: 8}}>{etiqueta}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Flujo: nodos unidos por flechas (transformación A → B) o pasos numerados (1 → 2 → 3) ──
type Nodo = {f: number; texto: string; icono?: string | null; acento?: boolean};
export const Flujo: React.FC<{dur: number; nodos: Nodo[]; fFlecha: number; titulo?: string; pasos?: boolean}> = ({dur, nodos, fFlecha, titulo, pasos}) => {
  const f = useCurrentFrame();
  const fuera = sale(f, dur, 5);
  if (pasos) {
    const eT = entra(f, 0, 7);
    return (
      <AbsoluteFill style={{opacity: fuera}}>
        <div style={{position: 'absolute', left: 0, width: W, top: 778, display: 'flex', justifyContent: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 34, padding: '20px 40px 20px 36px', background: 'rgba(10,10,20,0.82)', border: `2px solid ${T.color.borde}`, borderRadius: 24, boxShadow: T.sombraTarjeta, opacity: eT, transform: `translateY(${(1 - eT) * 24}px)`}}>
            <div style={{...display, fontSize: 84, color: T.color.texto, paddingTop: 12}}>{titulo}</div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              {nodos.map((n, i) => {
                const e = bote(f, n.f, 9);
                const lin = i === 0 ? 0 : interpolate(f, [n.f - 5, n.f], [0, 1], CL);
                const activo = f >= n.f;
                return (
                  <React.Fragment key={i}>
                    {i > 0 ? <div style={{width: 74, height: 6, background: 'rgba(255,255,255,0.2)', position: 'relative'}}><div style={{position: 'absolute', inset: 0, background: T.color.acento, transformOrigin: '0 50%', transform: `scaleX(${lin})`}} /></div> : null}
                    <div style={{width: 84, height: 84, borderRadius: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: activo ? (n.acento ? T.color.acento : T.color.metodo) : 'transparent', border: `3px solid ${activo ? 'transparent' : 'rgba(255,255,255,0.3)'}`, color: activo ? T.color.sobreAcento : T.color.tenue, ...display, fontSize: 58, transform: `scale(${activo ? 0.7 + 0.3 * e : 1})`}}>
                      <span style={{paddingTop: 9}}>{n.texto}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }
  const flecha = interpolate(f, [fFlecha, fFlecha + 9], [0, 1], {...CL, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{opacity: fuera}}>
      <div style={{position: 'absolute', left: 0, width: W, top: 792, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26}}>
        {nodos.map((n, i) => {
          const e = bote(f, n.f, 9);
          return (
            <React.Fragment key={i}>
              {i > 0 ? (
                <div style={{width: 150, height: 44, position: 'relative', opacity: f >= fFlecha ? 1 : 0}}>
                  <div style={{position: 'absolute', left: 0, top: 19, height: 6, width: 124 * flecha, background: T.color.acento, borderRadius: 3}} />
                  <div style={{position: 'absolute', left: 124 * flecha - 14, top: 0, color: T.color.acento}}><Icono nombre="flecha" tam={44} grosor={3} /></div>
                </div>
              ) : null}
              <div style={{opacity: f >= n.f ? 1 : 0, transform: `scale(${0.6 + 0.4 * e})`}}>
                <div style={{display: 'inline-flex', alignItems: 'center', gap: 16, height: 104, padding: '0 34px 0 26px', borderRadius: 20, background: n.acento ? T.color.acento : T.color.tarjeta, border: `2px solid ${n.acento ? T.color.acento : T.color.borde}`, color: n.acento ? T.color.sobreAcento : T.color.texto, boxShadow: T.sombraTarjeta, ...display, fontSize: 76}}>
                  {n.icono ? <Icono nombre={n.icono} tam={52} color={n.acento ? T.color.sobreAcento : T.color.metodo} /> : null}
                  <span style={{paddingTop: 11}}>{n.texto}</span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Rótulo (lower third): nombre de persona o lugar ──
export const Rotulo: React.FC<{dur: number; nombre: string; sub: string; fSub: number; icono?: string | null}> = ({dur, nombre, sub, fSub, icono}) => {
  const f = useCurrentFrame();
  const fuera = sale(f, dur, 5);
  const barra = entra(f, 0, 5);
  const eN = entra(f, 3, 7);
  const eS = entra(f, fSub, 7);
  return (
    <AbsoluteFill style={{opacity: fuera, transform: `translateX(${(1 - fuera) * -30}px)`}}>
      <div style={{position: 'absolute', left: 96, top: 716, display: 'flex', gap: 24}}>
        <div style={{width: 10, borderRadius: 5, background: T.color.acento, transformOrigin: '50% 100%', transform: `scaleY(${barra})`}} />
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: '6px 0'}}>
          <div style={{overflow: 'hidden'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 16, ...display, fontSize: 150, color: T.color.texto, textShadow: T.sombraTexto, transform: `translateX(${(1 - eN) * -110}%)`, paddingTop: 18, paddingRight: 20, paddingLeft: 4}}>
              {icono ? <span style={{marginTop: -18}}><Icono nombre={icono} tam={84} color={T.color.acento} grosor={2.4} /></span> : null}
              {nombre}
            </div>
          </div>
          <div style={{opacity: eS, transform: `translateY(${(1 - eS) * 14}px)`, fontFamily: T.fuente.tarjetas, fontWeight: T.peso.tarjetas, fontSize: 38, color: T.color.texto, background: T.color.tarjeta, border: `2px solid ${T.color.borde}`, borderRadius: 10, padding: '10px 20px 9px', whiteSpace: 'nowrap'}}>
            {sub}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Botón de suscripción con cursor (interfaz dibujada) ──
export const Suscribir: React.FC<{dur: number; fClic: number}> = ({dur, fClic}) => {
  const f = useCurrentFrame();
  const e = entra(f, 0, 7);
  const fuera = sale(f, dur, 5);
  const hecho = f >= fClic;
  const hundir = interpolate(f, [fClic - 2, fClic, fClic + 5], [1, 0.93, 1], CL);
  const onda = interpolate(f, [fClic, fClic + 12], [0, 1], CL);
  const viaje = interpolate(f, [4, fClic - 2], [0, 1], {...CL, easing: Easing.inOut(Easing.cubic)});
  const cx = 1130 + (1 - viaje) * 260, cy = 866 + (1 - viaje) * 130;
  const campana = hecho ? Math.sin((f - fClic) * 0.9) * 16 * Math.max(0, 1 - (f - fClic) / 16) : 0;
  return (
    <AbsoluteFill style={{opacity: Math.min(e, fuera)}}>
      <div style={{position: 'absolute', left: 0, width: W, top: 790, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - e) * 28}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '16px 18px 16px 22px', background: T.color.tarjeta, border: `2px solid ${T.color.borde}`, borderRadius: 60, boxShadow: T.sombraTarjeta}}>
          <div style={{width: 74, height: 74, borderRadius: 37, background: T.color.metodo, color: T.color.sobreAcento, display: 'flex', alignItems: 'center', justifyContent: 'center', ...display, fontSize: 54}}><span style={{paddingTop: 8}}>P</span></div>
          <div style={{fontFamily: T.fuente.tarjetas, fontWeight: 700, fontSize: 36, color: T.color.texto, marginRight: 12}}>Pablo</div>
          <div style={{position: 'relative', transform: `scale(${hundir})`}}>
            <div style={{position: 'absolute', inset: -4, borderRadius: 50, border: `4px solid ${T.color.acento}`, opacity: hecho ? 1 - onda : 0, transform: `scale(${1 + onda * 0.35})`}} />
            <div style={{display: 'flex', alignItems: 'center', gap: 12, height: 78, padding: '0 34px', borderRadius: 39, background: hecho ? T.color.acento : T.color.texto, color: T.color.sobreAcento, fontFamily: T.fuente.tarjetas, fontWeight: 700, fontSize: 34, whiteSpace: 'nowrap'}}>
              {hecho ? <span style={{transform: `rotate(${campana}deg)`, transformOrigin: '50% 10%', display: 'flex'}}><Icono nombre="campana" tam={36} grosor={2.6} /></span> : null}
              {hecho ? 'Suscrito' : 'Suscribirme'}
            </div>
          </div>
        </div>
      </div>
      <svg width={54} height={54} viewBox="0 0 24 24" style={{position: 'absolute', left: cx, top: cy, transform: `scale(${hundir})`, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))'}}>
        <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill="#fff" stroke="#0A0A14" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};

export {Chip};
