import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {T, W, H} from '../tokens';
import {CL, bote, entra, sale, vivo} from '../lib/anim';
import {Icono} from './Icono';
import {Chip} from './Chips';

const display = {fontFamily: T.fuente.display, fontWeight: T.peso.display, textTransform: 'uppercase' as const, lineHeight: 1, whiteSpace: 'nowrap' as const};
const rotulo = {fontFamily: T.fuente.tarjetas, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const};
const tarjeta = {background: T.color.tarjeta, border: `2px solid ${T.color.borde}`, borderRadius: 22, boxShadow: T.sombraTarjeta};

// Primero el envase, después el contenido: la tarjeta llega y entonces entra lo de dentro.
const Envase: React.FC<{f: number; dur: number; x: number; y: number; ancho: number; children: React.ReactNode; relleno?: number | string}> = ({f, dur, x, y, ancho, children, relleno = 34}) => {
  const e = entra(f, 0, 7);
  const s = sale(f, dur, 5);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: ancho, ...tarjeta, padding: relleno, opacity: Math.min(e, s), transform: `translateX(${(1 - e) * -50 + (1 - s) * -40}px) scale(${vivo(f, dur, 0.02)})`, transformOrigin: '0 50%'}}>
      {children}
    </div>
  );
};

// ── Terminal: interfaz dibujada de «instalar la skill» ──
export const Terminal: React.FC<{dur: number; comando: string; escribe: [number, number]; carga: [number, number]; hecho: number; textoHecho: string; nota: string}> = ({dur, comando, escribe, carga, hecho, textoHecho, nota}) => {
  const f = useCurrentFrame();
  const n = Math.floor(interpolate(f, escribe, [0, comando.length], CL));
  const barra = interpolate(f, carga, [0, 1], {...CL, easing: Easing.inOut(Easing.cubic)});
  const eH = bote(f, hecho, 9);
  const cursor = f < escribe[1] + 4 && Math.floor(f / 6) % 2 === 0;
  return (
    <AbsoluteFill>
      <Envase f={f} dur={dur} x={96} y={356} ancho={640} relleno={0}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '18px 22px', borderBottom: `2px solid ${T.color.borde}`}}>
          {[0, 1, 2].map((i) => <div key={i} style={{width: 14, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.22)'}} />)}
          <div style={{...rotulo, fontSize: 20, color: T.color.tenue, marginLeft: 10}}>Claude</div>
        </div>
        <div style={{padding: '26px 28px 30px', fontFamily: T.fuente.mono, fontSize: 30, color: T.color.texto, display: 'flex', flexDirection: 'column', gap: 22}}>
          <div style={{whiteSpace: 'nowrap'}}>
            <span style={{color: T.color.metodo}}>›&nbsp;</span>
            {comando.slice(0, n)}
            <span style={{display: 'inline-block', width: 16, height: 32, marginLeft: 3, verticalAlign: -5, background: cursor ? T.color.texto : 'transparent'}} />
          </div>
          <div style={{height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.14)', overflow: 'hidden', opacity: f >= carga[0] ? 1 : 0}}>
            <div style={{height: '100%', width: `${barra * 100}%`, background: T.color.metodo, borderRadius: 6}} />
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: f >= hecho ? 1 : 0, transform: `scale(${0.8 + 0.2 * eH})`, transformOrigin: '0 50%'}}>
            <div style={{width: 46, height: 46, borderRadius: 23, background: T.color.acento, color: T.color.sobreAcento, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icono nombre="check" tam={30} grosor={3.4} /></div>
            <div style={{fontFamily: T.fuente.tarjetas, fontWeight: 700, fontSize: 36}}>{textoHecho}</div>
            <div style={{...rotulo, fontSize: 22, letterSpacing: 2, color: T.color.sobreAcento, background: T.color.acento, borderRadius: 8, padding: '8px 12px 6px'}}>{nota}</div>
          </div>
        </div>
      </Envase>
    </AbsoluteFill>
  );
};

// ── Lista: enumeración en cascada (razones numeradas o checklist). El ítem activo lleva el acento. ──
type Fila = {f: number; texto: string; destacada?: boolean};
export const Lista: React.FC<{dur: number; antetitulo: string; titulo: string; filas: Fila[]; variante: 'numeros' | 'checks'}> = ({dur, antetitulo, titulo, filas, variante}) => {
  const f = useCurrentFrame();
  const activo = filas.reduce((a, fl, i) => (f >= fl.f ? i : a), -1);
  const alto = 190 + filas.length * (variante === 'checks' ? 78 : 96) + 60;
  const eT = entra(f, 5, 7);
  return (
    <AbsoluteFill>
      <Envase f={f} dur={dur} x={96} y={Math.max(T.seguro.arriba + 20, 470 - alto / 2)} ancho={variante === 'checks' ? 640 : 860} relleno={40}>
        <div style={{opacity: eT, transform: `translateY(${(1 - eT) * 14}px)`}}>
          <div style={{...rotulo, fontSize: 28, color: T.color.metodo}}>{antetitulo}</div>
          <div style={{...display, fontSize: 124, color: T.color.texto, paddingTop: 20, marginBottom: 8}}>{titulo}</div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: variante === 'checks' ? 12 : 18}}>
          {filas.map((fl, i) => {
            const e = entra(f, fl.f, 7);
            const eB = bote(f, fl.f, 9);
            const visto = f >= fl.f;
            const esActivo = i === activo;
            if (fl.destacada) {
              return (
                <div key={i} style={{marginTop: 10, opacity: visto ? e : 0.0, transform: `scale(${0.85 + 0.15 * eB})`, transformOrigin: '0 50%', background: T.color.acento, color: T.color.sobreAcento, borderRadius: 14, padding: '14px 20px 12px', fontFamily: T.fuente.tarjetas, fontWeight: 700, fontSize: 42, whiteSpace: 'nowrap', alignSelf: 'flex-start'}}>
                  {fl.texto}
                </div>
              );
            }
            const tamI = variante === 'checks' ? 54 : 68;
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, opacity: visto ? e * (esActivo ? 1 : 0.62) : 0.0, transform: `translateX(${(1 - e) * -30}px)`}}>
                <div style={{width: tamI, height: tamI, borderRadius: tamI / 2, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: esActivo ? T.color.acento : 'transparent', border: `2.5px solid ${esActivo ? T.color.acento : T.color.metodo}`, color: esActivo ? T.color.sobreAcento : T.color.metodo, transform: `scale(${0.6 + 0.4 * eB})`, ...display, fontSize: 50}}>
                  {variante === 'checks' ? <Icono nombre="check" tam={32} grosor={3.4} /> : <span style={{paddingTop: 7}}>{i + 1}</span>}
                </div>
                <div style={{fontFamily: T.fuente.tarjetas, fontWeight: esActivo ? 700 : T.peso.tarjetas, fontSize: variante === 'checks' ? 44 : 43, color: T.color.texto, whiteSpace: 'nowrap'}}>{fl.texto}</div>
              </div>
            );
          })}
        </div>
      </Envase>
    </AbsoluteFill>
  );
};

// ── Cifra: número grande. Completa (con fondo atenuado), compacta (abajo) o lateral (tarjeta a la izquierda). ──
type Paso = {f: number; v: string};
type MiniChip = {f: number; texto: string; icono?: string};
export const Cifra: React.FC<{
  dur: number; pasos?: Paso[]; prefijo?: string; sufijo?: string; antetitulo?: string; etiqueta?: {f: number; texto: string}; tachar?: number;
  rueda?: number[]; compacta?: boolean; lateral?: boolean; cuenta?: {f: number; de: number; a: number; dur: number}; chips?: MiniChip[];
}> = ({dur, pasos = [], prefijo = '', sufijo, antetitulo, etiqueta, tachar, rueda, compacta, lateral, cuenta, chips = []}) => {
  const f = useCurrentFrame();
  const fuera = sale(f, dur, 5);
  const chipsFila = (
    <div style={{display: 'flex', gap: 14, justifyContent: lateral ? 'flex-start' : 'center'}}>
      {chips.map((c, i) => {
        const e = bote(f, c.f, 9);
        return <div key={i} style={{opacity: f >= c.f ? 1 : 0, transform: `scale(${0.6 + 0.4 * e})`}}><Chip texto={c.texto} icono={c.icono} activo={f >= c.f && (i === chips.length - 1 || f < chips[i + 1].f)} alto={72} cuerpo={33} /></div>;
      })}
    </div>
  );
  if (lateral && cuenta) {
    const v = Math.round(interpolate(f, [cuenta.f, cuenta.f + cuenta.dur], [cuenta.de, cuenta.a], {...CL, easing: Easing.out(Easing.quad)}));
    const golpe = bote(f, cuenta.f + cuenta.dur, 8);
    const eC = entra(f, 4, 7);
    return (
      <AbsoluteFill>
        <Envase f={f} dur={dur} x={96} y={300} ancho={640}>
          <div style={{opacity: eC}}>
            <div style={{...rotulo, fontSize: 24, color: T.color.metodo}}>{antetitulo}</div>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 22, marginTop: 6, marginBottom: 2}}>
              <div style={{...display, fontSize: 280, color: T.color.acento, paddingTop: 34, minWidth: 210, transform: `scale(${f >= cuenta.f + cuenta.dur ? 1.14 - 0.14 * golpe : 1})`, transformOrigin: '0 80%'}}>{f >= cuenta.f ? v : cuenta.de}</div>
              <div style={{...display, fontSize: 120, color: T.color.texto}}>{sufijo}</div>
            </div>
            {chipsFila}
          </div>
        </Envase>
      </AbsoluteFill>
    );
  }
  // valor actual
  let idx = -1;
  pasos.forEach((p, i) => { if (f >= p.f) idx = i; });
  let valor = idx >= 0 ? pasos[idx].v : '';
  let visible = idx >= 0;
  if (rueda && pasos.length && f < pasos[0].f) {
    const ini = pasos[0].f - rueda.length * 2;
    if (f >= ini) { valor = String(rueda[Math.min(Math.floor((f - ini) / 2), rueda.length - 1)]); visible = true; }
  }
  const fPaso = idx >= 0 ? pasos[idx].f : 0;
  const pop = bote(f, fPaso, 8);
  const tach = tachar === undefined ? 0 : interpolate(f, [tachar, tachar + 6], [0, 1], {...CL, easing: Easing.out(Easing.cubic)});
  if (compacta) {
    const tam = 170;
    return (
      <AbsoluteFill style={{opacity: fuera}}>
        <div style={{position: 'absolute', left: 0, width: W, top: 672, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
          <div style={{...display, fontSize: tam, color: T.color.sobreAcento, background: idx >= 0 ? T.color.acento : T.color.texto, borderRadius: tam * 0.08, padding: `${tam * 0.13}px ${tam * 0.2}px 0`, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', opacity: visible ? 1 : 0, transform: `scale(${idx >= 0 ? 1.22 - 0.22 * pop : 0.94})`, letterSpacing: 2, marginBottom: 12}}>{prefijo}{valor}</div>
          {chipsFila}
        </div>
      </AbsoluteFill>
    );
  }
  // completa
  const tam = 430;
  const escala = pasos.length > 1 && idx >= 0 ? 0.74 + 0.26 * (idx / (pasos.length - 1)) : 1;
  const eEt = etiqueta ? entra(f, etiqueta.f, 7) : 0;
  return (
    <AbsoluteFill style={{opacity: Math.min(entra(f, 0, 6), fuera)}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, transform: `scale(${vivo(f, dur, 0.04)})`}}>
        {antetitulo ? <div style={{...rotulo, fontSize: 30, color: T.color.metodo}}>{antetitulo}</div> : null}
        <div style={{position: 'relative', ...display, fontSize: tam, color: T.color.acento, opacity: visible ? 1 - 0.4 * tach : 0, transform: `scale(${escala * (1.22 - 0.22 * pop)})`, paddingTop: tam * 0.12, textShadow: '0 20px 80px rgba(0,0,0,0.6)'}}>
          {prefijo}{valor}
          <span style={{position: 'absolute', left: -30, right: -30, top: '50%', height: 34, background: T.color.semantico, borderRadius: 20, transformOrigin: '0 50%', transform: `scaleX(${tach}) rotate(-4deg)`, boxShadow: '0 8px 30px rgba(0,0,0,0.5)'}} />
        </div>
        {etiqueta ? <div style={{...display, fontSize: 110, color: T.color.texto, opacity: f >= etiqueta.f ? eEt : 0, transform: `translateY(${(1 - eEt) * 26}px)`, marginTop: -30}}>{etiqueta.texto}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

// ── Ventana: b-roll real en una ventana flotante con el mismo marco siempre ──
export const Ventana: React.FC<{dur: number; imagen: string; titulo: string; sub: string; fRotulo: number}> = ({dur, imagen, titulo, sub, fRotulo}) => {
  const f = useCurrentFrame();
  const e = entra(f, 0, 8);
  const s = sale(f, dur, 5);
  const eR = entra(f, fRotulo, 7);
  const ancho = 740;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 96, top: 236, width: ancho, opacity: Math.min(e, s), transform: `translateY(${(1 - e) * 40}px) scale(${0.92 + 0.08 * e}) translateX(${(1 - s) * -40}px)`, transformOrigin: '0 50%'}}>
        <div style={{...tarjeta, overflow: 'hidden', borderRadius: 20}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'rgba(10,10,20,0.96)'}}>
            {[0, 1, 2].map((i) => <div key={i} style={{width: 13, height: 13, borderRadius: 7, background: 'rgba(255,255,255,0.22)'}} />)}
            <div style={{...rotulo, fontSize: 18, color: T.color.tenue, marginLeft: 10}}>Ejemplo del vídeo</div>
          </div>
          <div style={{width: ancho, height: (ancho * 9) / 16, overflow: 'hidden', position: 'relative'}}>
            <Img src={staticFile(imagen)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.04 + 0.07 * (f / dur)})`, transformOrigin: '58% 38%'}} />
            <div style={{position: 'absolute', left: 18, right: 18, bottom: 16, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.3)'}}>
              <div style={{width: `${18 + 30 * (f / dur)}%`, height: '100%', borderRadius: 3, background: T.color.acento}} />
            </div>
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 20, opacity: eR, transform: `translateX(${(1 - eR) * -24}px)`}}>
          <div style={{...display, fontSize: 92, color: T.color.sobreAcento, background: T.color.acento, borderRadius: 10, padding: '14px 18px 0'}}>{titulo}</div>
          <div style={{fontFamily: T.fuente.tarjetas, fontWeight: T.peso.tarjetas, fontSize: 32, color: T.color.texto, background: T.color.tarjeta, border: `2px solid ${T.color.borde}`, borderRadius: 10, padding: '10px 18px 8px', whiteSpace: 'nowrap'}}>{sub}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Gráfica: la línea que se dispara ──
export const Grafica: React.FC<{dur: number; fSube: number; etiqueta: string}> = ({dur, fSube, etiqueta}) => {
  const f = useCurrentFrame();
  const a = 560, b = 300;
  const p1 = interpolate(f, [5, fSube], [0, 0.45], CL);
  const p2 = interpolate(f, [fSube, fSube + 14], [0, 0.55], {...CL, easing: Easing.out(Easing.cubic)});
  const p = p1 + p2;
  const pts: [number, number][] = [[0, 262], [70, 254], [140, 258], [210, 244], [260, 240], [330, 196], [400, 132], [470, 64], [540, 14]];
  const largo = pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0]} ${q[1]}`).join(' ');
  const fin = bote(f, fSube + 13, 8);
  return (
    <AbsoluteFill>
      <Envase f={f} dur={dur} x={96} y={310} ancho={640}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16}}>
          <div style={{...rotulo, fontSize: 24, color: T.color.metodo}}>{etiqueta}</div>
          <div style={{color: T.color.acento, opacity: f >= fSube + 13 ? 1 : 0, transform: `scale(${0.5 + 0.5 * fin})`}}><Icono nombre="sube" tam={52} grosor={2.8} /></div>
        </div>
        <svg width={a} height={b} viewBox={`0 0 ${a} ${b}`} style={{display: 'block', overflow: 'visible'}}>
          {[60, 130, 200, 270].map((y) => <line key={y} x1={0} x2={a} y1={y} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />)}
          <path d={d} fill="none" stroke={T.color.acento} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={largo} strokeDashoffset={largo * (1 - p)} />
        </svg>
      </Envase>
    </AbsoluteFill>
  );
};
