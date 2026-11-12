import React from 'react';
import {loadFont as cargarMono} from '@remotion/google-fonts/ShareTechMono';
import {E, clamp, mix, p, rng} from '../../comun/curvas';
import {
  BORDE, DUR, FONDO_SUELO, IMPACTO, MESA_G, MESA_Y, SUELO, TRANSFORMA_GATO, T_CAE, T_SUELO, bigote, cafe, cinta, curva, elipse,
  enMundo, gato, oreja, pataTrazos, piezasTaza, poli, rot, suma, taza, trozos, vapor, type Gato, type P,
} from './escena';

// EL GATO EN 6 · CÁMARA TÉRMICA. Todo se pinta en gris según
// su temperatura (el 0 son 14 °C y el 1, 40 °C) y un filtro hace de sensor (desenfoca un poco, mete ruido y pasa el gris por la
// paleta «hierro»: negro → morado → rojo → naranja → amarillo → blanco). El gato, caliente: el cuerpo naranja, la cabeza amarilla, las
// orejas por dentro y los ojos al blanco (así se leen el «lo voy a hacer» y el guiño), la cola algo más fría y los bigotes fríos.
// El café, al blanco con su vapor; la taza, tibia abajo y caliente donde está el café; la ventana negra detrás de él para que
// resalte; el radiador naranja debajo de la mesa; la mesa y el suelo fríos. Al caer, el café sale en un arco blanco, el charco y las
// salpicaduras quedan calientes en el suelo y se van enfriando (blanco → amarillo → rojo → morado). Encima, el visor nítido: la mira
// P1 en su ojo, la P2 sigue a la taza (y después al charco), la escala, «● REC» y las lecturas, con el estado del sujeto.

const {fontFamily: MONO} = cargarMono('normal', {subsets: ['latin']});

const T_MIN = 14;
const T_MAX = 40;
const aV = (c: number) => (c - T_MIN) / (T_MAX - T_MIN);
const gris = (v: number) => {
  const n = Math.round(clamp(v) * 255);
  return `rgb(${n},${n},${n})`;
};
const fmt = (x: number) => x.toFixed(1).replace('.', ',');

const HIERRO: [number, number, number, number][] = [
  [0, 0, 0, 6], [0.1, 22, 0, 60], [0.2, 52, 0, 102], [0.3, 90, 2, 134], [0.4, 132, 8, 138], [0.5, 176, 18, 112],
  [0.58, 208, 38, 70], [0.66, 232, 76, 22], [0.74, 244, 122, 8], [0.82, 250, 172, 28], [0.9, 253, 214, 82],
  [0.96, 255, 242, 172], [1, 255, 255, 252],
];
const enHierro = (v: number): [number, number, number] => {
  const x = clamp(v);
  for (let i = 1; i < HIERRO.length; i++) {
    const [b, ...cb] = HIERRO[i];
    const [a, ...ca] = HIERRO[i - 1];
    if (x <= b) {
      const k = (x - a) / (b - a);
      return [mix(ca[0], cb[0], k), mix(ca[1], cb[1], k), mix(ca[2], cb[2], k)];
    }
  }
  return [255, 255, 252];
};
const TABLA = [0, 1, 2].map((canal) => Array.from({length: 65}, (_, i) => (enHierro(i / 64)[canal] / 255).toFixed(4)).join(' '));
const hex = (v: number) => {
  const [r, g, b] = enHierro(v).map((n) => Math.round(n));
  return `rgb(${r},${g},${b})`;
};

// ------------------------------------------------------------------ las temperaturas (en gris)
const PARED_ARRIBA = 0.37;
const PARED_ABAJO = 0.3;
const SUELO_ATRAS = 0.22;
const SUELO_DELANTE = 0.07;
const MESA = 0.17; // la madera, más fría que la pared: así se recorta la mesa

// el gato, en calor (se pinta en sus medidas de dibujo; quien lo usa lo envuelve en TRANSFORMA_GATO)
const GatoCalor: React.FC<{g: Gato; id: string}> = ({g, id}) => {
  const cola = g.cola.pts;
  const pc = g.pataCerca, pl = g.pataLejos;
  const lame = !!g.lengua || g.mira === 'pata';
  const piezasCuerpo = [elipse(g.cadera), elipse(g.torso), elipse(g.pecho), elipse(g.barriga), elipse(g.pieTrasero)];
  const axila = suma(g.pecho.c, rot([-10, 40], g.pecho.ang));
  const cuello = g.cuello[1];
  const pata = (pt: typeof pc, frio: number, k: string) => (
    <g key={k}>
      {pataTrazos(pt).map((d, i) => (
        <path key={i} d={d} fill={i === 2 ? gris(0.84 - frio) : `url(#${id}-pata)`} stroke={gris(0.6 - frio)} strokeWidth={7} strokeLinejoin="round" />
      ))}
    </g>
  );
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-cuerpo`} gradientUnits="userSpaceOnUse" cx={g.pecho.c[0] - 20} cy={g.pecho.c[1] + 30} r={300}>
          <stop offset={0} stopColor={gris(0.86)} />
          <stop offset={0.45} stopColor={gris(0.77)} />
          <stop offset={1} stopColor={gris(0.62)} />
        </radialGradient>
        <radialGradient id={`${id}-cabeza`} gradientUnits="userSpaceOnUse" cx={g.cabeza.c[0] + 10} cy={g.cabeza.c[1] + 18} r={150}>
          <stop offset={0} stopColor={gris(0.93)} />
          <stop offset={0.55} stopColor={gris(0.85)} />
          <stop offset={1} stopColor={gris(0.72)} />
        </radialGradient>
        <linearGradient id={`${id}-cola`} gradientUnits="userSpaceOnUse" x1={cola[0][0]} y1={cola[0][1]} x2={cola[cola.length - 1][0]} y2={cola[cola.length - 1][1]}>
          <stop offset={0} stopColor={gris(0.72)} />
          <stop offset={1} stopColor={gris(0.5)} />
        </linearGradient>
        <linearGradient id={`${id}-pata`} gradientUnits="userSpaceOnUse" x1={pc.hombro[0]} y1={pc.hombro[1]} x2={pc.mano[0]} y2={pc.mano[1]}>
          <stop offset={0} stopColor={gris(0.76)} />
          <stop offset={1} stopColor={gris(0.68)} />
        </linearGradient>
      </defs>
      {pata(pl, 0.08, 'lejos')}
      <path d={cinta(cola, g.cola.r)} fill={`url(#${id}-cola)`} stroke={gris(0.48)} strokeWidth={6} />
      {[g.orejaLejos, g.orejaCerca].map((o, i) => (
        <g key={i}>
          <path d={oreja(o)} fill={gris(0.8)} stroke={gris(0.7)} strokeWidth={5} strokeLinejoin="round" />
          <path d={poli(o.dentro)} fill={gris(0.98)} />
        </g>
      ))}
      {/* el cuerpo: el borde algo más frío (el pelo se ve de canto) y el relleno con un solo degradado */}
      {piezasCuerpo.map((d, i) => <path key={'b' + i} d={d} fill="none" stroke={gris(0.6)} strokeWidth={12} />)}
      {piezasCuerpo.map((d, i) => <path key={'f' + i} d={d} fill={`url(#${id}-cuerpo)`} />)}
      <path d={`M ${g.cuello[0][0]} ${g.cuello[0][1]} L ${cuello[0]} ${cuello[1]}`} stroke={gris(0.82)} strokeWidth={118} strokeLinecap="round" />
      <circle cx={axila[0]} cy={axila[1]} r={60} fill="url(#tg-foco)" opacity={0.45} />
      {!lame && pata(pc, 0, 'cerca')}
      {/* la cabeza */}
      <path d={elipse(g.cabeza)} fill={`url(#${id}-cabeza)`} stroke={gris(0.72)} strokeWidth={8} />
      <path d={elipse(g.hocico)} fill={gris(0.88)} />
      {[g.ojoLejos, g.ojoCerca].map((o, i) =>
        o.cerrado ? (
          <path key={i} d={curva(o.arco)} fill="none" stroke={gris(1)} strokeWidth={9} strokeLinecap="round" />
        ) : (
          <g key={i}>
            <path d={poli(o.visible)} fill={gris(1)} stroke={gris(0.97)} strokeWidth={3} strokeLinejoin="round" />
            {/* la pupila, un poco menos caliente: se nota hacia dónde mira */}
            <clipPath id={`${id}-ojo${i}`}><path d={poli(o.visible)} /></clipPath>
            <path d={elipse(o.pupila)} fill={gris(0.9)} clipPath={`url(#${id}-ojo${i})`} />
          </g>
        ),
      )}
      <path d={poli(g.nariz)} fill={gris(1)} />
      <path d={curva(g.boca)} fill="none" stroke={gris(0.97)} strokeWidth={5} strokeLinecap="round" />
      {g.bigotes.map((b, i) => <path key={i} d={bigote(b)} fill="none" stroke={gris(0.44)} strokeWidth={3.2} strokeLinecap="round" />)}
      {lame && pata(pc, 0, 'cerca')}
      {g.lengua && <path d={elipse(g.lengua)} fill={gris(1)} />}
    </g>
  );
};

// ------------------------------------------------------------------ el visor
const SOMBRA = {paintOrder: 'stroke' as const, stroke: 'rgba(12, 0, 28, 0.72)', strokeWidth: 5, strokeLinejoin: 'round' as const};
const BLANCO = '#FBF8FF';
const AMBAR = '#FFE45C';

const estadoSujeto = (t: number) =>
  t < 0.6 ? 'OBSERVANDO' : t < 1.12 ? 'TRAMANDO' : t < T_CAE ? 'EMPUJANDO' : t < T_SUELO + 0.15 ? 'MIRANDO' : t < 5.0 ? 'INOCENTE' : 'ASEÁNDOSE';

const Visor: React.FC<{t: number; g: Gato; mira2: P; tTaza: number; tMax: number; derrame: boolean}> = ({t, g, mira2, tTaza, tMax, derrame}) => {
  const q = Math.floor(t * 4); // el sensor refresca las lecturas 4 veces por segundo
  const jit = (s: number, a: number) => (rng(q * 31 + s)() - 0.5) * 2 * a;
  const tOjo = 38.4 + Math.round(jit(1, 0.12) * 10) / 10;
  const min = 12.8 + jit(2, 0.12);
  const media = 22.6 + (derrame ? 0.5 : 0) + jit(3, 0.1);

  // P1: la mira en la oreja por dentro (lo más caliente; así no tapa los ojos, que son su cara)
  const d = g.orejaCerca.dentro;
  const ojo = enMundo([(d[0][0] + d[1][0] + d[2][0]) / 3, (d[0][1] + d[1][1] + d[2][1]) / 3 + 6]);
  const R = 34;
  const caja = {x: clamp(ojo[0] - 400, 70, 700), y: clamp(ojo[1] - 120, 250, 900), w: 236, h: 54};
  // P2: la taza, y luego el charco
  const caja2 = {x: clamp(mira2[0] - 340, 90, 760), y: clamp(mira2[1] + 60, 1084, 1470), w: derrame ? 300 : 236, h: 52};
  const cayendo = t >= T_CAE && t < T_SUELO;
  const dS = t - T_SUELO;
  const parpadeo = dS < 0.1 || dS > 0.7 || Math.floor((dS - 0.1) * 8) % 2 === 0;

  const BX = 968, BY = 400, BW = 26, BH = 600;
  const enBarra = (temp: number) => BY + BH - clamp(aV(temp)) * BH;

  const seg = String(20 + Math.floor(t)).padStart(2, '0');
  const cuadro = String(2214 + Math.floor(t * 60)).padStart(4, '0');
  const rec = Math.floor(t * 2) % 2 === 0;
  const color2 = cayendo || derrame ? AMBAR : BLANCO;

  return (
    <g fontFamily={MONO} fill={BLANCO}>
      {[[60, 64, 1, 1], [1020, 64, -1, 1], [60, 1856, 1, -1], [1020, 1856, -1, -1]].map(([x, y, sx, sy], i) => (
        <path key={i} d={`M ${x} ${y + sy * 58} V ${y} H ${x + sx * 58}`} fill="none" stroke={BLANCO} strokeOpacity={0.85} strokeWidth={3} />
      ))}
      <circle cx={96} cy={131} r={11} fill={rec ? '#FF3B3B' : 'rgba(255, 59, 59, 0.22)'} />
      <text x={118} y={143} fontSize={36} letterSpacing={2} {...SOMBRA}>REC</text>
      <text x={84} y={190} fontSize={23} letterSpacing={1.5} fillOpacity={0.82} {...SOMBRA}>CÁM IR 02 · COCINA · HIERRO</text>
      <text x={1000} y={143} fontSize={30} letterSpacing={1.5} textAnchor="end" {...SOMBRA}>{`07/11/2026  07:12:${seg}`}</text>
      <text x={1000} y={190} fontSize={23} letterSpacing={1.5} textAnchor="end" fillOpacity={0.82} {...SOMBRA}>{`CUADRO ${cuadro} · 60 Hz`}</text>

      {/* P1, en el ojo */}
      <g stroke={BLANCO} strokeWidth={3} fill="none">
        <circle cx={ojo[0]} cy={ojo[1]} r={R} />
        {[0, 90, 180, 270].map((a) => {
          const u = rot([1, 0], (a * Math.PI) / 180);
          return <line key={a} x1={ojo[0] + u[0] * (R - 10)} y1={ojo[1] + u[1] * (R - 10)} x2={ojo[0] + u[0] * (R + 16)} y2={ojo[1] + u[1] * (R + 16)} />;
        })}
        <path d={`M ${ojo[0] - R * 0.71} ${ojo[1] - R * 0.71} L ${caja.x + caja.w + 30} ${caja.y + caja.h / 2} H ${caja.x + caja.w}`} strokeWidth={2} />
      </g>
      <circle cx={ojo[0]} cy={ojo[1]} r={3.5} fill={BLANCO} />
      <rect x={caja.x} y={caja.y} width={caja.w} height={caja.h} fill="rgba(20, 0, 44, 0.5)" stroke={BLANCO} strokeWidth={2.5} />
      <text x={caja.x + 16} y={caja.y + 38} fontSize={32} letterSpacing={1}>{`P1 ${fmt(tOjo)} °C`}</text>

      {/* P2: sigue a la taza; al caer, en ámbar; rota, el aviso del derrame */}
      <g stroke={color2} strokeWidth={3} fill="none">
        <rect x={mira2[0] - 34} y={mira2[1] - 34} width={68} height={68} strokeDasharray="18 32" strokeDashoffset={9} />
        <line x1={mira2[0] - 12} y1={mira2[1]} x2={mira2[0] + 12} y2={mira2[1]} />
        <line x1={mira2[0]} y1={mira2[1] - 12} x2={mira2[0]} y2={mira2[1] + 12} />
        <path d={`M ${mira2[0] - 30} ${mira2[1] + 30} L ${caja2.x + caja2.w} ${caja2.y + caja2.h / 2}`} strokeWidth={2} />
      </g>
      {derrame ? (
        parpadeo && (
          <g>
            <rect x={caja2.x} y={caja2.y} width={caja2.w} height={caja2.h} fill={BLANCO} />
            <text x={caja2.x + 14} y={caja2.y + 37} fontSize={30} letterSpacing={1} fill="#2A0050">{`DERRAME ${fmt(tTaza)} °C`}</text>
          </g>
        )
      ) : (
        <g>
          <rect x={caja2.x} y={caja2.y} width={caja2.w} height={caja2.h} fill="rgba(20, 0, 44, 0.5)" stroke={color2} strokeWidth={2.5} />
          <text x={caja2.x + 16} y={caja2.y + 37} fontSize={30} letterSpacing={1} fill={color2}>{`P2 ${fmt(tTaza)} °C`}</text>
        </g>
      )}

      {/* la escala */}
      <rect x={BX} y={BY} width={BW} height={BH} fill="url(#tt-escala)" stroke={BLANCO} strokeOpacity={0.8} strokeWidth={1.6} />
      {[15, 20, 25, 30, 35].map((tc) => (
        <line key={tc} x1={BX - 10} y1={enBarra(tc)} x2={BX} y2={enBarra(tc)} stroke={BLANCO} strokeOpacity={0.7} strokeWidth={2} />
      ))}
      <text x={1004} y={BY - 18} fontSize={25} textAnchor="end" letterSpacing={1} {...SOMBRA}>{`${fmt(T_MAX)} °C`}</text>
      <text x={1004} y={BY + BH + 40} fontSize={25} textAnchor="end" letterSpacing={1} {...SOMBRA}>{`${fmt(T_MIN)} °C`}</text>
      <path d={`M ${BX - 4} ${enBarra(tOjo)} l -16 -9 v 18 Z`} fill={BLANCO} />
      <text x={BX - 24} y={enBarra(tOjo) + 8} fontSize={21} textAnchor="end" {...SOMBRA}>P1</text>
      <path d={`M ${BX - 4} ${enBarra(Math.min(tTaza, T_MAX))} l -16 -9 v 18 Z`} fill={color2} />
      <text x={BX - 24} y={enBarra(Math.min(tTaza, T_MAX)) + 8} fontSize={21} textAnchor="end" fill={color2} {...SOMBRA}>{tTaza > T_MAX ? 'P2 ▲' : 'P2'}</text>

      {/* abajo, las lecturas */}
      <text x={84} y={1700} fontSize={31} letterSpacing={1} fill={AMBAR} {...SOMBRA}>{`MÁX ${fmt(tMax)} °C`}</text>
      <text x={84} y={1746} fontSize={31} letterSpacing={1} {...SOMBRA}>{`MÍN ${fmt(min)} °C`}</text>
      <text x={500} y={1700} fontSize={31} letterSpacing={1} {...SOMBRA}>{`MEDIA ${fmt(media)} °C`}</text>
      <text x={500} y={1746} fontSize={31} letterSpacing={1} {...SOMBRA}>EMIS. 0,95</text>
      <text x={84} y={1798} fontSize={24} letterSpacing={1.5} {...SOMBRA}>
        SUJETO 01 · GATO · <tspan fill={t >= T_SUELO + 0.15 && t < 5 ? AMBAR : BLANCO}>{estadoSujeto(t)}</tspan>
      </text>
    </g>
  );
};

// ------------------------------------------------------------------ la escena
export const Termica: React.FC<{t: number}> = ({t: tt}) => {
  const t = clamp(tt, 0, DUR);
  const g = gato(t);
  const tz = taza(t);
  const pzT = piezasTaza(tz);
  const cf = cafe(t);
  const tr = trozos(t);
  const vp = vapor(t);
  const semilla = Math.floor(tt * 30);
  const F = FONDO_SUELO;

  // el café se enfría: en la taza 68 °C; derramado, baja deprisa
  const enfria = (t0: number, tau: number) => Math.exp(-Math.max(0, t - t0) / tau);
  const tCafe = t < T_SUELO ? 68.4 - 0.25 * t : 26 + (68.4 - 0.25 * T_SUELO - 26) * enfria(T_SUELO, 2.6);
  const derrame = t >= T_SUELO;
  const mira2: P = derrame ? [IMPACTO[0] + 4, SUELO + 4] : tz.c;
  const tMax = tCafe + 0.3;

  // las huellas tibias en la mesa: donde estuvo la taza y donde apoyó las patas para asomarse
  const huellaTaza = clamp((t - 1.31) / 0.05) * enfria(1.31, 1.6) * 0.32;
  const huellasPatas = t > 4.2 ? [612, 584].map((x) => ({x, k: enfria(4.25, 1.4) * 0.3})) : [];

  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id="tt-sensor" filterUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920} colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={1.5} result="b" />
          <feTurbulence type="fractalNoise" baseFrequency={0.75} numOctaves={1} seed={semilla} result="n0" />
          <feColorMatrix in="n0" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="n" />
          <feComposite in="b" in2="n" operator="arithmetic" k1={0} k2={1} k3={0.075} k4={-0.0375} result="bn" />
          <feTurbulence type="fractalNoise" baseFrequency="0.32 0.0012" numOctaves={1} seed={7} result="r0" />
          <feColorMatrix in="r0" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="r" />
          <feComposite in="bn" in2="r" operator="arithmetic" k1={0} k2={1} k3={0.035} k4={-0.0175} result="todo" />
          <feColorMatrix in="todo" type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 0 1" result="lum" />
          <feComponentTransfer in="lum">
            <feFuncR type="table" tableValues={TABLA[0]} />
            <feFuncG type="table" tableValues={TABLA[1]} />
            <feFuncB type="table" tableValues={TABLA[2]} />
            <feFuncA type="identity" />
          </feComponentTransfer>
        </filter>
        {[1.5, 2.5, 4, 6, 10, 16, 24].map((s) => (
          <filter key={s} id={`tt-b${String(s).replace('.', '_')}`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2700}>
            <feGaussianBlur stdDeviation={s} />
          </filter>
        ))}
        <linearGradient id="tt-pared" x1={0} y1={0} x2={0} y2={F} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={gris(PARED_ARRIBA)} />
          <stop offset={1} stopColor={gris(PARED_ABAJO)} />
        </linearGradient>
        <linearGradient id="tt-suelo" x1={0} y1={F} x2={0} y2={1920} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={gris(SUELO_ATRAS)} />
          <stop offset={1} stopColor={gris(SUELO_DELANTE)} />
        </linearGradient>
        <linearGradient id="tt-cristal" x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={gris(0.02)} />
          <stop offset={1} stopColor={gris(0.1)} />
        </linearGradient>
        <linearGradient id="tt-taza" gradientUnits="userSpaceOnUse" x1={pzT.boca[0]} y1={pzT.boca[1]} x2={pzT.eje[1][0]} y2={pzT.eje[1][1]}>
          <stop offset={0} stopColor={gris(t < T_CAE + 0.2 ? 0.97 : 0.86)} />
          <stop offset={0.45} stopColor={gris(0.86)} />
          <stop offset={1} stopColor={gris(0.62)} />
        </linearGradient>
        <linearGradient id="tt-calorRad" x1={0} y1={1} x2={0} y2={0}>
          <stop offset={0} stopColor={gris(0.62)} stopOpacity={0.9} />
          <stop offset={1} stopColor={gris(0.62)} stopOpacity={0} />
        </linearGradient>
        <radialGradient id="tg-foco">
          <stop offset={0} stopColor={gris(1)} />
          <stop offset={1} stopColor={gris(1)} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="tt-charco">
          <stop offset={0} stopColor={gris(0.2 + 0.8 * enfria(T_SUELO, 2.2))} />
          <stop offset={0.7} stopColor={gris(0.2 + 0.7 * enfria(T_SUELO, 1.6))} />
          <stop offset={1} stopColor={gris(SUELO_ATRAS)} />
        </radialGradient>
        <radialGradient id="tt-vineta" cx={0.5} cy={0.48} r={0.72}>
          <stop offset={0.6} stopColor="#000" stopOpacity={0} />
          <stop offset={1} stopColor="#000" stopOpacity={0.4} />
        </radialGradient>
        <linearGradient id="tt-escala" x1={0} y1={1} x2={0} y2={0}>
          {HIERRO.map(([o]) => <stop key={o} offset={o} stopColor={hex(o)} />)}
        </linearGradient>
        <g id="tt-gato" transform={TRANSFORMA_GATO}>
          <GatoCalor g={g} id="tg" />
        </g>
      </defs>

      {/* ---------------- la imagen de calor, en gris; el sensor la pasa a color */}
      <g filter="url(#tt-sensor)">
        <rect width={1080} height={1920} fill="url(#tt-pared)" />

        {/* la ventana, fría: negra detrás del gato */}
        <g filter="url(#tt-b4)">
          <rect x={96} y={360} width={430} height={420} fill="url(#tt-cristal)" stroke={gris(0.24)} strokeWidth={18} />
          <line x1={311} y1={360} x2={311} y2={780} stroke={gris(0.22)} strokeWidth={12} />
          <line x1={96} y1={560} x2={526} y2={560} stroke={gris(0.22)} strokeWidth={12} />
          <rect x={80} y={780} width={462} height={16} fill={gris(0.33)} />
        </g>

        {/* el radiador, caliente, con el aire caliente que sube y su reflejo en el suelo */}
        <rect x={140} y={1060} width={310} height={190} fill="url(#tt-calorRad)" filter="url(#tt-b24)" opacity={0.5} />
        <g filter="url(#tt-b4)">
          <rect x={160} y={1236} width={270} height={232} rx={10} fill={gris(0.5)} />
          {Array.from({length: 8}, (_, i) => (
            <rect key={i} x={176 + i * 32} y={1250} width={18} height={204} rx={9} fill={gris(0.68)} />
          ))}
        </g>

        {/* el suelo */}
        <rect x={0} y={F} width={1080} height={1920 - F} fill="url(#tt-suelo)" />
        <rect x={0} y={F - 12} width={1080} height={14} fill={gris(0.33)} filter="url(#tt-b1_5)" />
        <ellipse cx={296} cy={1585} rx={170} ry={26} fill={gris(0.42)} opacity={0.5} filter="url(#tt-b16)" />

        {/* la mesa y el comedero, fríos */}
        <g filter="url(#tt-b2_5)">
          <rect x={-20} y={MESA_Y} width={BORDE + 20} height={MESA_G} fill={gris(MESA + 0.04)} />
          <rect x={136} y={MESA_Y + MESA_G} width={516} height={36} fill={gris(MESA - 0.02)} />
          <rect x={110} y={MESA_Y + MESA_G} width={26} height={SUELO - MESA_Y - MESA_G} fill={gris(MESA - 0.02)} />
          <rect x={652} y={MESA_Y + MESA_G} width={26} height={SUELO - MESA_Y - MESA_G} fill={gris(MESA - 0.02)} />
          <path d={`M 428 ${SUELO} L 440 ${SUELO - 38} L 552 ${SUELO - 38} L 564 ${SUELO} Z`} fill={gris(0.2)} />
        </g>
        {/* el calor que deja: el gato sentado, la taza que estuvo y las patas al asomarse */}
        <g filter="url(#tt-b6)">
          <ellipse cx={330} cy={MESA_Y + 6} rx={180} ry={12} fill={gris(0.56)} />
          {huellaTaza > 0.01 && <ellipse cx={600} cy={MESA_Y + 6} rx={50} ry={9} fill={gris(MESA + 0.04 + huellaTaza)} />}
          {huellasPatas.map((h, i) => <ellipse key={i} cx={h.x + 10} cy={MESA_Y + 6} rx={34} ry={8} fill={gris(MESA + 0.04 + h.k)} />)}
        </g>

        {/* el vapor */}
        {vp.map((h, i) => (
          <g key={i} opacity={h.alfa}>
            <path d={curva(h.pts)} fill="none" stroke={gris(0.8)} strokeWidth={18} strokeLinecap="round" filter="url(#tt-b10)" opacity={0.7} />
            <path d={curva(h.pts.slice(0, 10))} fill="none" stroke={gris(0.95)} strokeWidth={6} strokeLinecap="round" filter="url(#tt-b2_5)" />
          </g>
        ))}

        {/* la taza: tibia abajo, caliente donde está el café */}
        {tz.estado !== 'suelo' && (
          <g filter="url(#tt-b2_5)">
            <path d={poli(pzT.asa)} fill={gris(0.66)} />
            <path d={poli(pzT.cuerpo)} fill="url(#tt-taza)" stroke={gris(0.7)} strokeWidth={4} />
            {t < T_CAE + 0.15 && <path d={poli([...pzT.borde], false)} stroke={gris(1)} strokeWidth={8} strokeLinecap="round" />}
          </g>
        )}

        {/* EL GATO: su halo de calor y él */}
        <g filter="url(#tt-b24)" opacity={0.5}>
          <use href="#tt-gato" />
        </g>
        <g filter="url(#tt-b2_5)">
          <use href="#tt-gato" />
        </g>

        {/* el café: el chorro en arco, al blanco */}
        {(() => {
          const chorro = cf.gotas.filter((d) => d.i < 100);
          const tramos: P[][] = [];
          chorro.forEach((d, i) => {
            if (i === 0 || Math.hypot(d.c[0] - chorro[i - 1].c[0], d.c[1] - chorro[i - 1].c[1]) > 90) tramos.push([]);
            tramos[tramos.length - 1].push(d.c);
          });
          return (
            <g>
              <g filter="url(#tt-b10)" opacity={0.85}>
                {tramos.filter((q) => q.length > 1).map((q, i) => <path key={i} d={curva(q)} fill="none" stroke={gris(0.95)} strokeWidth={22} strokeLinecap="round" />)}
                {cf.gotas.map((d) => <circle key={d.i} cx={d.c[0]} cy={d.c[1]} r={d.r * 1.8} fill={gris(0.92)} />)}
              </g>
              <g filter="url(#tt-b1_5)">
                {tramos.filter((q) => q.length > 1).map((q, i) => <path key={i} d={curva(q)} fill="none" stroke={gris(1)} strokeWidth={8} strokeLinecap="round" />)}
                {cf.gotas.map((d) => <circle key={d.i} cx={d.c[0]} cy={d.c[1]} r={d.r} fill={gris(1)} />)}
              </g>
            </g>
          );
        })()}

        {/* en el suelo: el charco y las manchas, que se enfrían */}
        {cf.charco && (
          <g filter="url(#tt-b4)">
            <ellipse cx={cf.charco.c[0]} cy={cf.charco.c[1]} rx={cf.charco.rx * 1.15} ry={cf.charco.ry * 1.5} fill={gris(0.2 + 0.5 * enfria(T_SUELO, 1.8))} opacity={0.7} />
            <ellipse cx={cf.charco.c[0]} cy={cf.charco.c[1]} rx={cf.charco.rx} ry={cf.charco.ry * 1.2} fill="url(#tt-charco)" />
          </g>
        )}
        <g filter="url(#tt-b4)">
          {cf.manchas.map((s) => (
            <ellipse key={s.i} cx={s.c[0]} cy={s.c[1] + 4} rx={s.rx} ry={s.ry * 1.5} fill={gris(SUELO_ATRAS + (1 - SUELO_ATRAS) * enfria(s.t0, 1.5))} />
          ))}
        </g>
        {/* los trozos: calientes por dentro (mojados de café) y se enfrían */}
        <g filter="url(#tt-b1_5)">
          {tr.map((q) => (
            <path key={q.n} d={poli(q.pts)} fill={gris(0.5 + 0.42 * enfria(T_SUELO, 1.8))} stroke={gris(0.55 + 0.3 * enfria(T_SUELO, 1.2))} strokeWidth={4} strokeLinejoin="round" />
          ))}
        </g>

        {/* el golpe: un fogonazo de calor donde cae */}
        {t >= T_SUELO && t < T_SUELO + 0.35 && (() => {
          const k = p(t, T_SUELO, 0.35);
          return <circle cx={IMPACTO[0]} cy={SUELO - 10} r={60 + 200 * E.outCubic(k)} fill="url(#tg-foco)" opacity={0.75 * (1 - k)} />;
        })()}

        <rect width={1080} height={1920} fill="url(#tt-vineta)" />
      </g>

      {/* ---------------- el visor, nítido y por delante */}
      <Visor t={t} g={g} mira2={mira2} tTaza={tCafe} tMax={tMax} derrame={derrame} />
    </svg>
  );
};
