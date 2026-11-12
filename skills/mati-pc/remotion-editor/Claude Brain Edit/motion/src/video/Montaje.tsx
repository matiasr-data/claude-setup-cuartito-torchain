import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {W, H} from '../tokens';
import {CL} from '../lib/anim';
import {Subtitulo, Titular} from '../plantillas/Texto';
import {Chips} from '../plantillas/Chips';
import {AntesDespues, BarraFinal, Flujo, Rotulo, Suscribir} from '../plantillas/Abajo';
import {Cifra, Grafica, Lista, Terminal, Ventana} from '../plantillas/Tarjetas';
import {Miniaturas} from '../plantillas/Miniaturas';

// Montaje genérico dirigido por datos: timeline.json es la fuente de verdad (cámara, transiciones, fondos, gráficos).
export type Evento = {f: number; tipo: 'corte' | 'punch' | 'salida' | 'suave'; s: number; dur: number};
export type Linea = {
  frames: number;
  cara: {fx: number; fy: number};
  camara: Evento[];
  zonas: {from: number; to: number; ax: number; smin: number; seco_from: boolean; seco_to: boolean}[];
  transiciones: {f: number; tipo: 'whip' | 'zoom' | 'flash'; dur: number}[];
  fondos: {from: number; to: number; blur: number; dim: number}[];
  sacudidas: {f: number; fuerza: number; dur: number}[];
  graficos: {id: string; tipo: string; from: number; dur: number; zona: string; capa: number; props: Record<string, unknown>}[];
  // Cámara v2 (zooms progresivos): escala y ancla ya calculadas fotograma a fotograma por scripts/camara.py
  curva?: {s: number[]; ax: number[]; sacudidas: {f: number; fuerza: number; dur: number}[]};
};

const PLANTILLAS: Record<string, React.FC<any>> = {Subtitulo, Titular, Chips, AntesDespues, BarraFinal, Flujo, Rotulo, Suscribir, Cifra, Grafica, Lista, Terminal, Ventana, Miniaturas};

// ── Cámara ───────────────────────────────────────────────────────────────────
// Nada está quieto: dentro de cada plano hay un acercamiento (o apertura) lento y continuo.
const deriva = (e: Evento, f: number) => (e.s < 1.3 ? 0.0009 : -0.0006) * Math.min(Math.max(f - e.f, 0), 100);
const CURVA = {punch: Easing.out(Easing.cubic), salida: Easing.out(Easing.cubic), suave: Easing.inOut(Easing.cubic), corte: Easing.linear};
function escala(cam: Evento[], i: number, f: number): number {
  const e = cam[i];
  const destino = e.s + deriva(e, f);
  if (e.tipo === 'corte' || i === 0 || f >= e.f + e.dur) return destino;
  const origen = escala(cam, i - 1, e.f);
  return origen + (destino - origen) * CURVA[e.tipo]((f - e.f) / e.dur);
}
const indice = (cam: Evento[], f: number) => {
  let i = 0;
  while (i + 1 < cam.length && cam[i + 1].f <= f) i++;
  return i;
};

export const Base: React.FC<{tl: Linea; video: string}> = ({tl, video}) => {
  const f = useCurrentFrame();
  const fc = Math.min(Math.max(f, 0), tl.frames - 1);
  let s = tl.curva ? tl.curva.s[fc] : escala(tl.camara, indice(tl.camara, f), f);
  // ancla horizontal de la cara: centro natural, o tercio derecho cuando hay un panel a la izquierda
  let ax = tl.curva ? tl.curva.ax[fc] : tl.cara.fx;
  for (const z of tl.curva ? [] : tl.zonas) {
    const a = z.seco_from ? (f >= z.from ? 1 : 0) : interpolate(f, [z.from - 5, z.from + 5], [0, 1], {...CL, easing: Easing.inOut(Easing.cubic)});
    const b = z.seco_to ? (f < z.to ? 1 : 0) : interpolate(f, [z.to - 5, z.to + 5], [1, 0], {...CL, easing: Easing.inOut(Easing.cubic)});
    const k = Math.min(a, b);
    if (k > 0) { ax = tl.cara.fx + (z.ax - tl.cara.fx) * k; s = Math.max(s, 1 + (z.smin - 1) * k); }
  }
  // transiciones: el corte se esconde dentro de un movimiento
  let m = 1, dx = 0, dy = 0, blur = 0, blurX = 0, flash = 0;
  for (const t of tl.transiciones) {
    const d = f - t.f;
    if (d < -t.dur || d > t.dur) continue;
    const p = 1 - Math.abs(d) / t.dur; // 0 → 1 (en el corte) → 0
    if (t.tipo === 'whip') {
      const q = p * p;
      m *= 1 + 0.32 * q; blurX = Math.max(blurX, 90 * q); dx += (d < 0 ? -1 : 1) * 0.13 * W * q;
    } else if (t.tipo === 'zoom') {
      const q = d < 0 ? p * p * p : p * p;
      m *= 1 + (d < 0 ? 0.9 : 0.6) * q; blur = Math.max(blur, 16 * q);
    } else if (t.tipo === 'flash') {
      if (d >= 0) { flash = Math.max(flash, 0.8 * p * p); m *= 1 + 0.16 * p * p; }
    }
  }
  for (const k of tl.curva ? tl.curva.sacudidas : tl.sacudidas) {
    const d = f - k.f;
    if (d < 0 || d > k.dur) continue;
    const cae = 1 - d / k.dur;
    dx += Math.sin(d * 2.4) * k.fuerza * cae; dy += Math.cos(d * 3.1) * k.fuerza * 0.7 * cae; m *= 1 + 0.012 * cae;
  }
  // fondo atenuado bajo los gráficos a pantalla completa
  let dim = 1, bf = 0;
  for (const z of tl.fondos) {
    const k = Math.min(interpolate(f, [z.from, z.from + 6], [0, 1], CL), interpolate(f, [z.to - 5, z.to], [1, 0], CL));
    if (k > 0) { dim = Math.min(dim, 1 - (1 - z.dim) * k); bf = Math.max(bf, z.blur * k); }
  }
  if (bf > 0 || blur > 0) m *= 1.05; // el desenfoque no enseña los bordes
  const st = s * m;
  const tx = Math.min(0, Math.max(W - W * st, ax * W - tl.cara.fx * W * st + dx));
  const ty = Math.min(0, Math.max(H - H * st, tl.cara.fy * H - tl.cara.fy * H * st + dy));
  const filtros = [blurX > 0.5 ? 'url(#barrido)' : '', blur + bf > 0.3 ? `blur(${(blur + bf) / st}px)` : '', dim < 0.999 ? `brightness(${dim})` : ''].filter(Boolean).join(' ');
  return (
    <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <filter id="barrido" x="-10%" y="0%" width="120%" height="100%"><feGaussianBlur stdDeviation={`${blurX / st} 0`} /></filter>
      </svg>
      <OffthreadVideo
        src={staticFile(video)}
        muted
        style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${st})`, filter: filtros || undefined}}
      />
      {flash > 0.01 ? <AbsoluteFill style={{backgroundColor: '#fff', opacity: flash}} /> : null}
    </AbsoluteFill>
  );
};

// ── Gráficos (overlay con alfa) ─────────────────────────────────────────────
export const Graficos: React.FC<{tl: Linea; solo?: string | null}> = ({tl, solo}) => (
  <AbsoluteFill>
    {[...tl.graficos]
      .filter((g) => !solo || g.id === solo)
      .sort((a, b) => a.capa - b.capa)
      .map((g) => {
        const C = PLANTILLAS[g.tipo];
        if (!C) return null;
        return (
          <Sequence key={g.id} from={g.from} durationInFrames={g.dur} layout="none">
            <C {...g.props} dur={g.dur} />
          </Sequence>
        );
      })}
  </AbsoluteFill>
);

export const Montaje: React.FC<{tl: Linea; video: string; capas: 'todo' | 'base' | 'graficos'; solo?: string | null}> = ({tl, video, capas, solo}) => (
  <AbsoluteFill>
    {capas !== 'graficos' ? <Base tl={tl} video={video} /> : null}
    {capas !== 'base' ? <Graficos tl={tl} solo={solo} /> : null}
  </AbsoluteFill>
);
