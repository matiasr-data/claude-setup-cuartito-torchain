import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {T, W} from '../tokens';
import {CL, bote, entra, sale, vivo} from '../lib/anim';
import {Icono} from './Icono';

// Pantalla completa: resultados de búsqueda dibujados (sin logos ajenos) y un sello que cae encima.
const TITULOS = ['EDITA CON CLAUDE', 'CLAUDE + CAPCUT', '100% AUTOMÁTICO', 'EDICIÓN CON IA', 'SIN TOCAR NADA', 'VÍDEOS EN 5 MIN'];
const TINTES = ['#8E9BFF', '#5B6CFF', '#B48EFF', '#6FA8FF', '#8E9BFF', '#7C6CFF'];

export const Miniaturas: React.FC<{dur: number; entran: number; busca: [number, number]; consulta: string; sello: number; textoSello: string}> = ({dur, entran, busca, consulta, sello, textoSello}) => {
  const f = useCurrentFrame();
  const e = entra(f, 0, 6);
  const fuera = sale(f, dur, 5);
  const n = Math.floor(interpolate(f, busca, [0, consulta.length], CL));
  const eS = interpolate(f, [sello, sello + 5], [0, 1], CL);
  const caido = f >= sello;
  const aw = 500, ah = 281, gap = 34;
  const x0 = (W - (aw * 3 + gap * 2)) / 2;
  return (
    <AbsoluteFill style={{opacity: Math.min(e, fuera)}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${vivo(f, dur, 0.035)})`}}>
        {/* barra de búsqueda */}
        <div style={{position: 'absolute', left: (W - 980) / 2, top: 128, width: 980, height: 78, borderRadius: 39, background: 'rgba(10,10,20,0.9)', border: `2px solid ${T.color.borde}`, display: 'flex', alignItems: 'center', gap: 18, padding: '0 30px', opacity: e, transform: `translateY(${(1 - e) * -20}px)`}}>
          <Icono nombre="lupa" tam={34} color={T.color.metodo} />
          <div style={{fontFamily: T.fuente.tarjetas, fontWeight: T.peso.tarjetas, fontSize: 34, color: T.color.texto, whiteSpace: 'nowrap'}}>
            {consulta.slice(0, n)}
            <span style={{display: 'inline-block', width: 3, height: 38, marginLeft: 3, verticalAlign: -7, background: Math.floor(f / 8) % 2 === 0 ? T.color.texto : 'transparent'}} />
          </div>
        </div>
        {/* rejilla de miniaturas, en cascada */}
        {TITULOS.map((t, i) => {
          const fi = entran + i * 3;
          const p = bote(f, fi, 10);
          const col = i % 3, fila = Math.floor(i / 3);
          return (
            <div key={i} style={{position: 'absolute', left: x0 + col * (aw + gap), top: 256 + fila * (ah + 112), width: aw, opacity: f >= fi ? (caido ? 1 - 0.45 * eS : 1) : 0, transform: `scale(${0.7 + 0.3 * p})`}}>
              <div style={{width: aw, height: ah, borderRadius: 18, overflow: 'hidden', position: 'relative', background: `linear-gradient(135deg, ${TINTES[i]}55 0%, #14142A 62%)`, border: `2px solid ${T.color.borde}`, boxShadow: T.sombraTarjeta}}>
                <div style={{position: 'absolute', left: 26, right: 26, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontFamily: T.fuente.display, fontWeight: 700, fontSize: 82, lineHeight: 0.95, color: T.color.texto, textTransform: 'uppercase', paddingTop: 12}}>{t}</div>
                <div style={{position: 'absolute', right: 14, bottom: 12, fontFamily: T.fuente.tarjetas, fontWeight: 700, fontSize: 20, color: '#fff', background: 'rgba(0,0,0,0.75)', borderRadius: 6, padding: '4px 8px'}}>{['12:04', '8:31', '15:20', '10:47', '6:58', '21:13'][i]}</div>
              </div>
              <div style={{display: 'flex', gap: 14, marginTop: 14, alignItems: 'center'}}>
                <div style={{width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.18)', flex: 'none'}} />
                <div style={{display: 'flex', flexDirection: 'column', gap: 9, flex: 1}}>
                  <div style={{height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.3)', width: `${[86, 72, 90, 64, 80, 70][i]}%`}} />
                  <div style={{height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.14)', width: `${[48, 56, 40, 52, 44, 60][i]}%`}} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* sello */}
      <div style={{position: 'absolute', left: 0, width: W, top: 372, display: 'flex', justifyContent: 'center', opacity: caido ? 1 : 0}}>
        <div style={{fontFamily: T.fuente.display, fontWeight: 700, fontSize: 300, lineHeight: 1, color: T.color.semantico, border: `16px solid ${T.color.semantico}`, borderRadius: 30, padding: '46px 60px 0', background: 'rgba(10,10,20,0.86)', transform: `rotate(-7deg) scale(${2.4 - 1.4 * eS})`, boxShadow: '0 30px 100px rgba(0,0,0,0.7)', letterSpacing: 6}}>
          {textoSello}
        </div>
      </div>
    </AbsoluteFill>
  );
};
