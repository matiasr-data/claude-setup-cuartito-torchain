import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, rng, ruido} from '../../../comun/curvas';
import {DUR, PAPELERA, R_BOLA, T_PRIMERO, bola, escalaEn, lanzamiento, temblor, type Bola, type P} from '../escena';
import {fondo} from './VidrieraFondo';
import {MunecoVidrio, calor, partes} from './VidrieraMuneco';
import {BolaVidrio, Destellos, LamparaVidrio, ManchaBola, PapeleraAtras, PapeleraDelante, PIVOTE_PAPELERA, bocaPapelera, bombillaEn, siluetaPapelera, sobreBordePapelera} from './VidrieraObjetos';
import {DEFS_VIDRIO, Pieza, Plomo, VID, deriva} from './vidrio';
import {centro, f1, pr, recto, rota2, s2, suave} from './geo';

// LA BOLA DE PAPEL EN VIDRIERA (la escena en ../escena.ts, que no se toca). Toda la oficina es una vidriera
// vista desde dentro con el sol detrás: cada forma, un trozo de vidrio de color (cobalto, rubí, ámbar, verde, violeta) con su textura,
// separado por plomo negro grueso; la luz pasa y brilla, y lo que se mueve brilla más. El sol entra por la ventana de la oficina (su
// vidrio es el más claro) y cruza la sala en rayos de colores con polvo que caen sobre la papelera. La bola es un vidrio blanco
// opalino, lo más encendido de todo, con su halo; cuando cae dentro, la papelera se enciende por dentro como un farol (la luz sale
// por la boca y atraviesa el rubí) y se apaga si la bola sale. En cada golpe, un destello en el vidrio y unas líneas de luz que salen
// corriendo, y la vidriera tiembla dos pasos. El marco: la cenefa de rubí con sus perlas y el filete blanco, y dos barras de hierro.
// Las piezas se mueven «a dos» (12 posturas por segundo, alineadas al primer toque, como en los bloques); la luz, el polvo y los
// destellos, «a unos».

const PASOS = 12;
const PB = PAPELERA;
const SOL: P = [300, 420]; // el sol, en la ventana de la oficina: por ahí entra la luz
const MARCO = {piedra: 10, cenefa: 36, filete: 44};
const BARRAS = [330, 1762];

// ---------------------------------------------------------------- los degradados y los filtros
const DEFS = (
  <defs>
    {DEFS_VIDRIO}
    <radialGradient id="vd-mancha"><stop offset="0" stopColor="#14061c" stopOpacity={0.7} /><stop offset="0.6" stopColor="#14061c" stopOpacity={0.32} /><stop offset="1" stopColor="#14061c" stopOpacity={0} /></radialGradient>
    <linearGradient id="vd-cilindro" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor="#3a1606" stopOpacity={0.42} /><stop offset="0.3" stopColor="#3a1606" stopOpacity={0} />
      <stop offset="0.7" stopColor="#3a1606" stopOpacity={0} /><stop offset="1" stopColor="#3a1606" stopOpacity={0.42} />
    </linearGradient>
    <linearGradient id="vd-boca" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#ff6a85" stopOpacity={0.4} /><stop offset="0.5" stopColor="#000000" stopOpacity={0.1} /><stop offset="1" stopColor="#000000" stopOpacity={0.6} />
    </linearGradient>
    <radialGradient id="vd-bocaLuz" cx="0.5" cy="0.62" r="0.62">
      <stop offset="0" stopColor="#ffe9a6" /><stop offset="0.5" stopColor="#ffab3c" /><stop offset="1" stopColor="#e2482c" />
    </radialGradient>
    <radialGradient id="vd-opal" cx="0.42" cy="0.38" r="0.7">
      <stop offset="0" stopColor="#ffffff" stopOpacity={0} /><stop offset="0.7" stopColor="#c9d6ff" stopOpacity={0.2} /><stop offset="1" stopColor="#9fb0e0" stopOpacity={0.38} />
    </radialGradient>
    <linearGradient id="vd-pantallaLampara" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#000000" stopOpacity={0.18} /><stop offset="1" stopColor="#fff1c0" stopOpacity={0.4} />
    </linearGradient>
    <radialGradient id="vd-destello">
      <stop offset="0" stopColor="#ffffff" /><stop offset="0.22" stopColor="#fff3c8" stopOpacity={0.85} />
      <stop offset="0.6" stopColor="#ffd27a" stopOpacity={0.25} /><stop offset="1" stopColor="#ffd27a" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="vd-halo">
      <stop offset="0" stopColor="#ffffff" stopOpacity={0.95} /><stop offset="0.3" stopColor="#f4f0ff" stopOpacity={0.45} /><stop offset="1" stopColor="#e8e4ff" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="vd-luzDentro" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#ffe6a8" stopOpacity={0.9} /><stop offset="0.45" stopColor="#ff8a3a" stopOpacity={0.45} /><stop offset="1" stopColor="#ff3a3a" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="vd-haloCalido">
      <stop offset="0" stopColor="#fff2cc" stopOpacity={0.85} /><stop offset="1" stopColor="#ffd890" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="vd-bombilla">
      <stop offset="0" stopColor="#fff8dc" /><stop offset="0.25" stopColor="#ffd88a" stopOpacity={0.55} /><stop offset="1" stopColor="#ffb860" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="vd-sol" gradientUnits="userSpaceOnUse" cx={SOL[0]} cy={SOL[1]} r={360}>
      <stop offset="0" stopColor="#fffbea" stopOpacity={0.75} /><stop offset="0.4" stopColor="#fff1cc" stopOpacity={0.28} /><stop offset="1" stopColor="#fff1cc" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="vd-luzFondo" gradientUnits="userSpaceOnUse" cx={SOL[0]} cy={SOL[1]} r={1700}>
      <stop offset="0" stopColor="#ffffff" /><stop offset="0.3" stopColor="#f1eefc" /><stop offset="0.66" stopColor="#b7b4d2" /><stop offset="1" stopColor="#85839f" />
    </radialGradient>
    <radialGradient id="vd-luzGeneral" gradientUnits="userSpaceOnUse" cx={480} cy={1000} r={1500}>
      <stop offset="0" stopColor="#ffffff" /><stop offset="0.6" stopColor="#f6f4fa" /><stop offset="1" stopColor="#b8b5cc" />
    </radialGradient>
    <radialGradient id="vd-vineta" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.62" stopColor="#0b0610" stopOpacity={0} /><stop offset="1" stopColor="#0b0610" stopOpacity={0.5} />
    </radialGradient>
    <radialGradient id="vd-polvo"><stop offset="0" stopColor="#fffbea" /><stop offset="1" stopColor="#fff2c8" stopOpacity={0} /></radialGradient>
    <filter id="vd-desenfoque6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={6} /></filter>
    <filter id="vd-desenfoque16" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={16} /></filter>
    {/* la irradiación: el vidrio que más brilla se come un poco el plomo (y todo brilla un pelo alrededor) */}
    <filter id="vd-bloom" filterUnits="userSpaceOnUse" x={-120} y={-120} width={1320} height={2160} colorInterpolationFilters="sRGB">
      <feColorMatrix in="SourceGraphic" type="matrix" values="2.2 0 0 0 -1.25  0 2.2 0 0 -1.25  0 0 2.2 0 -1.25  0 0 0 1 0" result="alto" />
      <feGaussianBlur in="alto" stdDeviation={8} result="b1" />
      <feGaussianBlur in="alto" stdDeviation={28} result="b2" />
      <feComposite in="b1" in2="b2" operator="arithmetic" k1={0} k2={0.55} k3={0.45} k4={0} result="bm" />
      <feBlend in="SourceGraphic" in2="bm" mode="screen" />
    </filter>
  </defs>
);

// ---------------------------------------------------------------- el marco: la cenefa de rubí con perlas, el filete blanco, las barras de hierro
let MARCO_EL: React.ReactElement | null = null;
const marco = () => {
  if (MARCO_EL) return MARCO_EL;
  const {piedra: a, cenefa: b, filete: c} = MARCO;
  const W = 1080, H = 1920;
  const tiras: [number, number, number, number][] = [[b, a, W - b, b], [b, H - b, W - b, H - a], [a, b, b, H - b], [W - b, b, W - a, H - b]];
  const filetes: [number, number, number, number][] = [[b, b, W - b, c], [b, H - c, W - b, H - b], [b, c, c, H - c], [W - c, c, W - b, H - c]];
  const rect = (x0: number, y0: number, x1: number, y1: number) => recto([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
  const perlas: P[] = [];
  const m = (a + b) / 2;
  for (let x = b + 22; x < W - b - 10; x += 42) perlas.push([x, m], [x, H - m]);
  for (let y = b + 22; y < H - b - 10; y += 42) perlas.push([m, y], [W - m, y]);
  const dPerlas = perlas.map(([x, y]) => `M ${x - 8} ${y} a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0`).join(' ');
  const cortes: React.ReactElement[] = [];
  let n = 0;
  for (let x = b + 168; x < W - b - 60; x += 168) cortes.push(<Plomo key={n++} d={`M ${x + 21} ${a} L ${x + 21} ${b}`} w={6} borde={0} />, <Plomo key={n++} d={`M ${x + 21} ${H - b} L ${x + 21} ${H - a}`} w={6} borde={0} />);
  for (let y = b + 168; y < H - b - 60; y += 168) cortes.push(<Plomo key={n++} d={`M ${a} ${y + 21} L ${b} ${y + 21}`} w={6} borde={0} />, <Plomo key={n++} d={`M ${W - b} ${y + 21} L ${W - a} ${y + 21}`} w={6} borde={0} />);
  const esquinas: P[] = [[a, a], [W - b, a], [a, H - b], [W - b, H - b]];
  MARCO_EL = (
    <g>
      {tiras.map((t, k) => <Pieza key={'t' + k} d={rect(...t)} color={deriva(VID.rubi, 600 + k, 0.6)} semilla={k} plomo={0} borde={0.4} />)}
      {cortes}
      <path d={dPerlas} fill={VID.opal} />
      <path d={dPerlas} fill="url(#vd-opal)" />
      <path d={dPerlas} fill="none" stroke="#120f15" strokeWidth={4} />
      {filetes.map((t, k) => <Pieza key={'f' + k} d={rect(...t)} color={VID.blancoV} semilla={k + 2} plomo={0} borde={0.2} />)}
      {esquinas.map(([x, y], k) => (
        <Pieza key={'e' + k} d={rect(x, y, x + b - a, y + b - a)} color={VID.ambar} semilla={k} plomo={5} borde={0.3}>
          <circle cx={x + (b - a) / 2} cy={y + (b - a) / 2} r={5} fill="#2b1508" fillOpacity={0.7} />
        </Pieza>
      ))}
      {/* el plomo de la cenefa: por fuera, entre la cenefa y el filete y el grueso que la une al cuadro */}
      <Plomo d={rect(a, a, W - a, H - a)} w={6} borde={0} />
      <Plomo d={rect(b, b, W - b, H - b)} w={5} borde={0} />
      <Plomo d={rect(c, c, W - c, H - c)} w={10} borde={0.8} />
      {/* las barras de hierro (por dentro de la sala, delante del vidrio) */}
      {BARRAS.map((y, k) => (
        <g key={'b' + k}>
          <rect x={b - 4} y={y - 7} width={W - 2 * b + 8} height={14} rx={3} fill="#17131a" />
          <rect x={b - 4} y={y - 6} width={W - 2 * b + 8} height={2} fill="#7b7484" opacity={0.5} />
          {[0.18, 0.5, 0.82].map((q) => <rect key={q} x={b + (W - 2 * b) * q - 6} y={y - 12} width={12} height={24} rx={3} fill="#17131a" />)}
        </g>
      ))}
    </g>
  );
  return MARCO_EL;
};

// ---------------------------------------------------------------- los rayos de sol en el aire, con su polvo
// dorados (sobre el rubí de la papelera, un rayo blanco lo volvía rosa) y uno frío, el que atraviesa el cobalto
const RAYOS = [
  {o: [150, 420] as P, w0: 70, w1: 300, col: '#ffdc8a', op: 0.16},
  {o: [235, 470] as P, w0: 60, w1: 250, col: '#a9c6ff', op: 0.12},
  {o: [320, 520] as P, w0: 80, w1: 340, col: '#ffd27a', op: 0.19},
  {o: [380, 600] as P, w0: 50, w1: 220, col: '#ffb070', op: 0.11},
];
const DIR_RAYO: P = (() => {
  const d: P = [0.43, 1];
  const l = Math.hypot(d[0], d[1]);
  return [d[0] / l, d[1] / l];
})();
const LARGO_RAYO = 1300;
const perfilRayo = (s: number) => (s < 0.34 ? s / 0.34 : Math.max(0, 1 - (s - 0.34) / 0.56));
const enRayo = (k: number, s: number, lat: number): P => {
  const R = RAYOS[k];
  const n: P = [-DIR_RAYO[1], DIR_RAYO[0]];
  const w = R.w0 + (R.w1 - R.w0) * s;
  return [R.o[0] + DIR_RAYO[0] * LARGO_RAYO * s + n[0] * lat * w, R.o[1] + DIR_RAYO[1] * LARGO_RAYO * s + n[1] * lat * w];
};
const POLVO = (() => {
  const r = rng(4242);
  return Array.from({length: 90}, () => ({k: Math.floor(r() * RAYOS.length), s: 0.1 + r() * 0.8, lat: (r() - 0.5) * 0.9, rad: 1.3 + r() * 2.4, f: r() * 6.28, w: 1.5 + r() * 3, vy: 8 + r() * 16}));
})();
const Rayos: React.FC<{t: number}> = ({t}) => (
  <g style={{mixBlendMode: 'screen'}}>
    <defs>
      {RAYOS.map((R, k) => {
        const a = enRayo(k, 0, 0), b = enRayo(k, 1, 0);
        return (
          <linearGradient key={k} id={`vd-rayo-${k}`} gradientUnits="userSpaceOnUse" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}>
            <stop offset="0" stopColor={R.col} stopOpacity={0} /><stop offset="0.34" stopColor={R.col} stopOpacity={1} /><stop offset="0.9" stopColor={R.col} stopOpacity={0} />
          </linearGradient>
        );
      })}
    </defs>
    <g filter="url(#vd-desenfoque16)">
      {RAYOS.map((R, k) => (
        <path key={k} d={recto([enRayo(k, 0, -0.5), enRayo(k, 1, -0.5), enRayo(k, 1, 0.5), enRayo(k, 0, 0.5)])} fill={`url(#vd-rayo-${k})`}
          opacity={R.op * (0.85 + 0.25 * ruido(t * 1.7 + k * 3.1, 5))} />
      ))}
    </g>
    {POLVO.map((q, i) => {
      const p = enRayo(q.k, q.s, q.lat);
      const x = p[0] + 9 * Math.sin(t * 0.8 + q.f), y = p[1] - q.vy * t + 6 * Math.cos(t * 0.6 + q.f * 1.3);
      const brilla = 0.25 + 0.75 * Math.abs(Math.sin(t * q.w + q.f));
      return <circle key={i} cx={f1(x)} cy={f1(y)} r={q.rad * 2.2} fill="url(#vd-polvo)" opacity={perfilRayo(q.s) * brilla * 0.9} />;
    })}
  </g>
);

// ---------------------------------------------------------------- la escena
type Capa = 'detras' | 'medio' | 'delante';
const capaBola = (b: Bola): Capa => {
  const [x, , z] = b.c;
  const rho = Math.hypot(x - PB.x, z - PB.z);
  if (z < -(PB.rBorde + 10) && Math.abs(x - PB.x) < PB.rBorde + 70) return 'detras';
  if (rho < PB.rBorde + 20 && z < 40) return 'medio';
  return 'delante';
};

export const Vidriera: React.FC<{intento: number; t: number}> = ({intento, t: tt}) => {
  const i = clamp(Math.round(intento), 0, 9);
  const t = clamp(tt, 0, DUR);
  // a dos: las posturas caen justo en el primer toque de este lanzamiento
  const T1 = T_PRIMERO[i];
  const fase = T1 - Math.floor(T1 * PASOS) / PASOS;
  const paso = Math.floor((t - fase) * PASOS + 1e-6);
  const tq = Math.max(0, paso / PASOS + fase);
  const e = lanzamiento(i, tq);
  const antes = lanzamiento(i, Math.max(0, tq - 1 / PASOS));
  const b = e.bola;
  const cal = calor(e.muneco, antes.muneco, 1 / PASOS);
  // la luz de dentro de la papelera: encendida mientras la bola está dentro; se apaga en un suspiro cuando sale
  let luzDentro = 0;
  for (let k = 0; k <= 5; k++) {
    const tk = tq - k / PASOS;
    if (tk < 0) break;
    if (bola(i, tk).dentro) {
      luzDentro = Math.exp(-(tq - tk) / 0.11);
      break;
    }
  }
  // y mientras asoma por la boca, sigue encendida (es el momento de «¿entró?»)
  const enBoca = Math.hypot(b.c[0] - PB.x, b.c[2] - PB.z) < PB.rBorde - 10 && b.c[1] > PB.yBorde - R_BOLA;
  if (enBoca) luzDentro = Math.max(luzDentro, 0.85);
  if (luzDentro > 0) luzDentro *= 0.9 + 0.1 * Math.sin(t * 9);
  // cuánto lleva dentro sin salir (la del 10 se queda: su luz crece)
  let lleva = 0;
  while (lleva < 12 && tq - (lleva + 1) / PASOS >= 0 && bola(i, tq - (lleva + 1) / PASOS).dentro) lleva++;
  const crece = bola(i, tq).dentro ? clamp(lleva / 6) : 0;
  // los golpes: se ven en el paso en que la bola llega (t0); su luz corre a unos
  const golpes = lanzamiento(i, t).golpes.map((g) => ({g, t0: fase + Math.ceil((g.t - fase) * PASOS - 1e-6) / PASOS})).filter((q) => q.t0 <= t + 1e-6);
  const golpePap = Math.max(0, ...golpes.filter((q) => ['borde', 'papelera', 'pila'].includes(q.g.tipo) && q.g.fuerza > 300).map((q) => 1 - clamp((t - q.t0) / 0.18)));
  const golpeBola = Math.max(0, ...golpes.filter((q) => q.g.fuerza > 400).map((q) => 1 - clamp((t - q.t0) / 0.15)));
  // la cámara: dos pasos de temblor en cada golpe y el acercamiento lento de los bloques (para que la cortinilla case)
  const [sx, sy] = temblor(i, tq);
  const k = 1 + 0.025 * (t / DUR);
  const mover = `translate(${f1(sx)} ${f1(sy)}) translate(648 1113.6) scale(${k.toFixed(5)}) translate(-648 -1113.6)`;

  const capa = capaBola(b);
  const bolaEl = <BolaVidrio b={{...b}} />;
  const [bx, by] = pr(b.c);
  const R = R_BOLA * escalaEn(b.c[2]);
  const boca = centro(bocaPapelera());
  const bocaGirada = s2(rota2([boca[0] - PIVOTE_PAPELERA[0], boca[1] - PIVOTE_PAPELERA[1]], e.papelera.inclina), PIVOTE_PAPELERA);
  const giroPap = `rotate(${((e.papelera.inclina * 180) / Math.PI).toFixed(3)} ${f1(PIVOTE_PAPELERA[0])} ${f1(PIVOTE_PAPELERA[1])})`;
  const silueta = siluetaPapelera();
  const pos = partes(e.muneco);
  const bomb = bombillaEn(e.lampara.ang);
  const pulso = 0.85 + 0.15 * Math.sin(t * 7);
  const sobreBorde = sobreBordePapelera();
  const asoma = capa === 'medio' && b.c[1] > PB.yBorde - 2.2 * R_BOLA;

  return (
    <AbsoluteFill style={{background: '#211a1c', overflow: 'hidden'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {DEFS}
        <defs>
          <clipPath id="vd-papelera"><path d={suave(silueta, 0.2)} transform={giroPap} /></clipPath>
          <clipPath id="vd-sobreBorde"><path d={recto(sobreBorde)} transform={giroPap} /></clipPath>
        </defs>
        <g transform={mover}>
          <g filter="url(#vd-bloom)">
            {/* el decorado, con la luz del sol que cae desde la ventana */}
            {fondo()}
            <rect x={-60} y={-60} width={1200} height={2040} fill="url(#vd-luzFondo)" style={{mixBlendMode: 'multiply'}} />
            <rect x={-60} y={-60} width={1200} height={2040} fill="url(#vd-sol)" style={{mixBlendMode: 'screen'}} opacity={0.9 + 0.1 * ruido(t * 1.3, 2)} />
            <ManchaBola b={b} />
            {/* lo que se mueve, de atrás adelante */}
            <LamparaVidrio ang={e.lampara.ang} luz={golpes.some((q) => q.g.tipo === 'lampara' && t - q.t0 < 0.2) ? 0.6 : 0} />
            <MunecoVidrio pose={e.muneco} calor={cal} />
            {capa === 'detras' && bolaEl}
            <PapeleraAtras inclina={e.papelera.inclina} luzDentro={luzDentro} />
            {capa === 'medio' && bolaEl}
            <PapeleraDelante inclina={e.papelera.inclina} luzDentro={luzDentro} golpe={golpePap} />
            {capa === 'delante' && bolaEl}
            <rect x={-60} y={-60} width={1200} height={2040} fill="url(#vd-luzGeneral)" style={{mixBlendMode: 'multiply'}} />
            {/* las luces: lo que más brilla se enciende más */}
            <g style={{mixBlendMode: 'screen'}}>
              <circle cx={bomb[0]} cy={bomb[1]} r={210} fill="url(#vd-bombilla)" opacity={0.85} />
              {luzDentro > 0.01 && (
                <g opacity={luzDentro}>
                  <g clipPath="url(#vd-papelera)">
                    <ellipse cx={bocaGirada[0]} cy={bocaGirada[1] + 70} rx={190} ry={190} fill="url(#vd-luzDentro)" opacity={0.75} />
                  </g>
                  {/* la luz que se escapa por la boca, hacia arriba */}
                  <g filter="url(#vd-desenfoque16)" opacity={(0.7 + 0.3 * crece) * pulso}>
                    {[-0.42, -0.2, 0, 0.2, 0.42].map((a, q) => {
                      const base = bocaGirada;
                      const largo = (380 + (q % 2) * 120) * (1 + 0.45 * crece);
                      const tip = s2(base, rota2([0, -largo], a + e.papelera.inclina));
                      const ancho = 34 + (q % 2) * 10;
                      const l0 = s2(base, rota2([-ancho, 0], a)), r0 = s2(base, rota2([ancho, 0], a));
                      const l1 = s2(tip, rota2([-ancho * 2.4, 0], a)), r1 = s2(tip, rota2([ancho * 2.4, 0], a));
                      return <path key={q} d={recto([l0, r0, r1, l1])} fill="#ffcf70" opacity={0.5 - Math.abs(a) * 0.4} />;
                    })}
                  </g>
                </g>
              )}
              <circle cx={bx} cy={by} r={R * (capa === 'medio' && b.dentro ? 2.8 : 2.4)} fill="url(#vd-halo)" opacity={(b.dentro ? 0.55 : 0.7) + 0.25 * golpeBola} />
              {[['cabeza', cal.cabeza, 110], ['der', cal.der, 80], ['izq', cal.izq, 80]].map(([n, c, r]) => {
                const q = pos[n as 'cabeza' | 'der' | 'izq'];
                return (c as number) > 0.02 ? <circle key={n as string} cx={q[0]} cy={q[1]} r={r as number} fill="url(#vd-haloCalido)" opacity={(c as number) * 0.55} /> : null;
              })}
            </g>
            {asoma && <g clipPath="url(#vd-sobreBorde)">{bolaEl}</g>}
            {marco()}
          </g>
          {/* los golpes, por encima de todo (la luz atraviesa el vidrio) */}
          <Destellos golpes={golpes} t={t} boca={bocaGirada} />
          {/* los rayos de sol en el aire de la sala, con su polvo */}
          <Rayos t={t} />
        </g>
        <rect x={0} y={0} width={1080} height={1920} fill="url(#vd-vineta)" />
      </svg>
    </AbsoluteFill>
  );
};
