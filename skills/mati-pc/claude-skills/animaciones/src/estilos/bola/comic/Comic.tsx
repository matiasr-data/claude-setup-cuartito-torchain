import React, {useId} from 'react';
import {AbsoluteFill} from 'remotion';
import {E, clamp, p, temblor as sacudida} from '../../../comun/curvas';
import {DUR, PLANES, T_PRIMERO, bola, esqueleto, lanzamiento, proyecta, type Cara} from '../escena';
import {
  BOCA, BolaComic, LamparaComic, MesaComic, PapeleraAtras, PapeleraDelante, ParedComic, SombraBola, SueloComic, bolaEntrePapelera, brilloBombilla,
} from './ComicDecorado';
import {MunecoComic, SillaAsiento, SillaAtras} from './ComicMuneco';
import {Alegria, Cartela, Confeti, Estrellitas, Explosion, Globo, Golpe, Letras, Rayos, Velocidad, anchoTexto, type EstiloLetras, type TipoGlobo} from './ComicRotulos';
import {C, TINTA, f1, useLetra, type P} from './ComicTrama';

// LA BOLA DE PAPEL EN CÓMIC (la escena en ../escena.ts). Una viñeta de tebeo con su borde negro sobre papel
// amarillento: tinta negra gruesa en los contornos, tintas planas y vivas (amarillo, rojo, azul, cian) con la trama de puntos en las
// sombras y los degradados, el color corrido un pelo respecto a la tinta (el registro de la imprenta), la cartela del narrador
// arriba, globos del muñeco («¡VAMOS...!», «¿EN SERIO?», «¡#@%&!»), líneas de velocidad detrás de la bola y las onomatopeyas con
// sus letras que saltan («¡BOING!» en el borde, «¡PLOF!» al caer, «¡PAF!» en la pared, «¡CLANG!» en la lámpara…).
// EL REMATE (el lanzamiento 9, el que ENTRA, el último del vídeo): la bola cae dentro, un fotograma de impacto (todo en silueta negra
// sobre rayos rojos y amarillos), y la viñeta explota: los rayos de fondo giran detrás de él, un estallido rojo que se sale de la
// viñeta con «¡DENTRO!» cayendo letra a letra como un sello, la viñeta tiembla, fogonazo, confeti y estrellitas desde la papelera,
// el muñeco celebra con sus rayas de alegría y la cartela cambia a «¡A LA DÉCIMA!».
// Se anima como un dibujo animado: el muñeco, la papelera y la lámpara «a dos» (12 dibujos por segundo, cayendo justo en el primer
// toque) y la bola a 24; los rótulos y la cámara, suaves.

const PASOS = 12;
const PASOS_BOLA = 24;
const MARGEN = 18; // el margen de papel alrededor de la viñeta
const BORDE = 13; // el borde negro de la viñeta

// ---------------------------------------------------------------- el remate (intento 9): sus tiempos
const T_ENTRA = (() => {
  for (let s = 0; s < DUR; s += 1 / 480) if (bola(9, s).dentro) return s;
  return T_PRIMERO[9];
})();
const T_IMPACTO = T_PRIMERO[9]; // cae en los papeles de dentro
const T_FIESTA = T_IMPACTO + 0.066; // dos cuadros a 30 por segundo de fotograma de impacto
const CENTRO_EXPLOSION: P = [540, 690];

// ---------------------------------------------------------------- las onomatopeyas de cada lanzamiento (sale de sus golpes)
type Sonido = {t: number; texto: string; c: P; size: number; giro: number; estilo: EstiloLetras; golpe: P; semilla: number};
const ESTILOS: Record<string, EstiloLetras> = {
  boing: {relleno: C.amarillo, bloque: C.rojo, grosor: 15},
  plof: {relleno: C.crema, bloque: C.azul, grosor: 14},
  paf: {relleno: C.cian, bloque: C.azulSombra, grosor: 14},
  clang: {relleno: C.amarillo, bloque: C.azul, grosor: 15},
  flop: {relleno: C.crema, bloque: C.rojo, grosor: 14},
};
const SONIDOS = new Map<number, Sonido[]>();
const sonidos = (i: number): Sonido[] => {
  const hay = SONIDOS.get(i);
  if (hay) return hay;
  const out: Sonido[] = [];
  if (i !== 9) {
    let ultimo = '';
    const gs = lanzamiento(i, DUR).golpes;
    gs.forEach((g, k) => {
      if ((g.fuerza < 450 && g.tipo !== 'lampara') || g.tipo === ultimo) return;
      ultimo = g.tipo;
      const suave = PLANES[i].especial === 'vueltas' || PLANES[i].especial === 'equilibrio';
      const [texto, estilo, size] =
        g.tipo === 'borde' ? (suave ? ['¡TOC!', ESTILOS.clang, 140] : ['¡BOING!', ESTILOS.boing, 160])
        : g.tipo === 'suelo' ? ['¡PLOF!', ESTILOS.plof, 150]
        : g.tipo === 'muro' ? ['¡PAF!', ESTILOS.paf, 150]
        : g.tipo === 'lampara' ? ['¡CLANG!', ESTILOS.clang, 150]
        : g.tipo === 'pila' ? ['¡FLOP!', ESTILOS.flop, 140]
        : ['¡TONK!', ESTILOS.boing, 140];
      const cp = proyecta(g.p);
      const medio = anchoTexto(texto as string, size as number) / 2 + 30;
      let y = cp[1] - 215;
      if (y < 260) y = cp[1] + 190;
      const x = clamp(cp[0] + (g.tipo === 'muro' ? -170 : g.tipo === 'borde' ? -70 : 30), 70 + medio, 1010 - medio);
      out.push({t: g.t, texto: texto as string, c: [x, Math.min(y, 1760)], size: size as number, giro: k % 2 ? 7 : -8, estilo: estilo as EstiloLetras, golpe: cp, semilla: 11 + k * 5});
    });
  }
  SONIDOS.set(i, out);
  return out;
};

// ---------------------------------------------------------------- los globos (salen de las caras que pone la escena)
type PlanGlobo = {t0: number; t1: number; texto: string; tipo: TipoGlobo};
const GLOBOS = new Map<number, PlanGlobo[]>();
const globos = (i: number): PlanGlobo[] => {
  const hay = GLOBOS.get(i);
  if (hay) return hay;
  // la línea de tiempo de las caras
  const cambios: [number, Cara][] = [];
  for (let s = 0; s <= DUR; s += 1 / 240) {
    const c = lanzamiento(i, s).muneco.cara;
    if (!cambios.length || cambios[cambios.length - 1][1] !== c) cambios.push([s, c]);
  }
  const out: PlanGlobo[] = [];
  let ilusiones = 0;
  for (const [s, c] of cambios) {
    let g: Omit<PlanGlobo, 't0' | 't1'> | null = null;
    if (c === 'ilusion') g = ilusiones++ === 0 ? {texto: '¡VAMOS...!', tipo: 'habla'} : {texto: '¿...?', tipo: 'piensa'};
    else if (c === 'ay') g = {texto: '¡NOOO!', tipo: 'grito'};
    else if (c === 'fastidio') g = {texto: '¡#@%&!', tipo: 'grito'};
    else if (c === 'meh') g = {texto: '¿EN SERIO?', tipo: 'habla'};
    else if (c === 'susto') g = {texto: '¡¡!!', tipo: 'grito'};
    else if (c === 'serio') g = {texto: '...', tipo: 'habla'};
    else if (c === 'feliz' && i !== 9) g = {texto: '¡SÍÍ!', tipo: 'grito'};
    else if (c === 'feliz' && i === 9) {
      // en el remate no habla: grita la viñeta. El globo de antes se va
      if (out.length) out[out.length - 1].t1 = Math.min(out[out.length - 1].t1, T_IMPACTO);
      continue;
    }
    if (!g) continue;
    if (out.length) out[out.length - 1].t1 = s;
    out.push({...g, t0: s, t1: DUR + 1});
  }
  GLOBOS.set(i, out);
  return out;
};

// ---------------------------------------------------------------- la escena dentro de la viñeta
const Escena: React.FC<{i: number; t: number; tq: number; tb: number; pre: string; fiesta: number}> = ({i, t, tq, tb, pre, fiesta}) => {
  const e = lanzamiento(i, tq);
  const b = bola(i, tb);
  const golpesAhora = lanzamiento(i, t).golpes;
  const entre = bolaEntrePapelera(b);
  const rayosVan = fiesta > 0;
  return (
    <g>
      <ParedComic pre={pre} />
      {rayosVan && <Rayos c={CENTRO_EXPLOSION} giro={fiesta * 0.32} />}
      {!rayosVan && <path d={brilloBombilla(e.lampara.ang)} fill={C.amarillo} />}
      <LamparaComic ang={e.lampara.ang} />
      <SueloComic />
      <MesaComic />
      <SillaAtras pose={e.muneco} />
      <SillaAsiento pose={e.muneco} />
      <MunecoComic pose={e.muneco} t={tq} />
      <SombraBola b={b} />
      <PapeleraAtras inclina={e.papelera.inclina} />
      {entre && (
        <g transform={`rotate(${((e.papelera.inclina * 180) / Math.PI).toFixed(3)} 650 1570)`}>
          <BolaComic b={b} />
        </g>
      )}
      <PapeleraDelante inclina={e.papelera.inclina} />
      {!entre && (
        <g>
          <Velocidad i={i} t={tb} golpes={golpesAhora} />
          <BolaComic b={b} />
        </g>
      )}
      {golpesAhora.filter((g) => g.fuerza > 450 && !(i === 9 && g.tipo === 'pila')).map((g, k) => <Golpe key={k} c={proyecta(g.p)} t={t} t0={g.t} r={62} semilla={k + 3} />)}
    </g>
  );
};

// la misma escena en silueta, para el fotograma de impacto
const Silueta: React.FC<{i: number; tq: number; pre: string}> = ({i, tq, pre}) => {
  const e = lanzamiento(i, tq);
  return (
    <g filter={`url(#${pre}sil)`}>
      <LamparaComic ang={e.lampara.ang} />
      <MesaComic />
      <SillaAtras pose={e.muneco} />
      <SillaAsiento pose={e.muneco} />
      <MunecoComic pose={e.muneco} t={tq} />
      <PapeleraAtras inclina={e.papelera.inclina} />
      <PapeleraDelante inclina={e.papelera.inclina} />
    </g>
  );
};

export const Comic: React.FC<{intento: number; t: number}> = ({intento, t: tt}) => {
  useLetra();
  const pre = 'cm' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const i = clamp(Math.round(intento), 0, 9);
  const t = clamp(tt, 0, DUR);
  // a dos: las posturas caen justo en el primer toque de este lanzamiento
  const T1 = T_PRIMERO[i];
  const fase = (pasos: number) => T1 - Math.floor(T1 * pasos) / pasos;
  const paso = Math.floor((t - fase(PASOS)) * PASOS + 1e-6);
  const tq = Math.max(0, paso / PASOS + fase(PASOS));
  const pasoB = Math.floor((t - fase(PASOS_BOLA)) * PASOS_BOLA + 1e-6);
  const tb = Math.max(0, pasoB / PASOS_BOLA + fase(PASOS_BOLA));
  const ahora = lanzamiento(i, t);

  const remate = i === 9;
  const impacto = remate && t >= T_IMPACTO && t < T_FIESTA;
  const fiesta = remate && t >= T_FIESTA ? t - T_FIESTA : -1;

  // la cámara: el empujón de cada golpe; en el remate, se acerca despacio mientras vuela y explota al entrar
  const [ex, ey] = ahora.temblor;
  const [gx, gy] = remate ? sacudida(t, T_FIESTA, 0.6, 30, 5) : [0, 0];
  let zoom = 1;
  if (remate) {
    zoom = t < T_FIESTA ? 1 + 0.045 * E.inOutCubic(p(t, 0.32, T_ENTRA - 0.32)) : 1 + 0.1 * (1 - E.outCubic(p(t, T_FIESTA, 0.5)));
  }
  const giroVineta = fiesta >= 0 ? 1.4 * Math.exp(-5 * fiesta) * Math.sin(fiesta * 38) : 0;
  const sx = ex * 1.6 + gx, sy = ey * 1.6 + gy;
  const camara = `translate(${f1(BOCA[0])} ${f1(BOCA[1])}) scale(${zoom.toFixed(4)}) translate(${f1(-BOCA[0])} ${f1(-BOCA[1])})`;
  const vineta = `translate(${f1(sx)} ${f1(sy)}) rotate(${giroVineta.toFixed(3)} 540 960)`;

  // la cabeza (para los globos y las rayas de alegría)
  const esq = esqueleto(lanzamiento(i, tq).muneco);
  const cab = proyecta(esq.cabeza);
  const manos: P[] = esq.mano.map((m) => proyecta(m));
  const colaGlobo: P = [cab[0] + 10, cab[1] - 100];

  const sonidosAhora = sonidos(i).filter((s) => t >= s.t && t < s.t + 0.62);
  const globo = globos(i).find((g) => t >= g.t0 && t < g.t1);
  const T_CARTELA = T_FIESTA + 0.1;
  const cartela = remate && t >= T_CARTELA ? '¡A LA DÉCIMA!' : `INTENTO ${i + 1}`;

  return (
    <AbsoluteFill style={{background: C.papel}}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id={pre + 'vineta'}>
            <rect x={MARGEN} y={MARGEN} width={1080 - 2 * MARGEN} height={1920 - 2 * MARGEN} />
          </clipPath>
          <filter id={pre + 'sil'} x="-5%" y="-5%" width="110%" height="110%">
            <feFlood floodColor={TINTA} />
            <feComposite in2="SourceAlpha" operator="in" />
          </filter>
          {/* el papel: manchas suaves y grano, multiplicados encima de todo */}
          <filter id={pre + 'papel'} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves={3} seed={7} result="manchas" />
            <feColorMatrix in="manchas" type="matrix" values="0 0 0 0 0.93  0 0 0 0 0.84  0 0 0 0 0.62  0 0 0 -1.6 1.05" result="tinte" />
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={1} seed={3} result="grano" />
            <feColorMatrix in="grano" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 -2.4 1.3" result="motas" />
            <feMerge><feMergeNode in="tinte" /><feMergeNode in="motas" /></feMerge>
          </filter>
        </defs>

        <g transform={vineta}>
          <rect x={MARGEN} y={MARGEN} width={1080 - 2 * MARGEN} height={1920 - 2 * MARGEN} fill={C.crema} />
          <g clipPath={`url(#${pre}vineta)`}>
            {impacto ? (
              // EL FOTOGRAMA DE IMPACTO: rayos rojos y amarillos, todo en silueta y una estrella blanca en la boca
              <g transform={camara}>
                <g>
                  <rect x={-60} y={-60} width={1200} height={2040} fill={C.amarillo} />
                  {Array.from({length: 26}, (_, k) => {
                    const a0 = (k / 26) * Math.PI * 2, a1 = a0 + Math.PI / 26;
                    const R = 2600;
                    return <path key={k} d={`M ${f1(BOCA[0])} ${f1(BOCA[1])} L ${f1(BOCA[0] + Math.cos(a0) * R)} ${f1(BOCA[1] + Math.sin(a0) * R)} L ${f1(BOCA[0] + Math.cos(a1) * R)} ${f1(BOCA[1] + Math.sin(a1) * R)} Z`} fill={C.rojo} />;
                  })}
                </g>
                <Silueta i={i} tq={tq} pre={pre} />
                <g transform={`translate(${f1(BOCA[0])} ${f1(BOCA[1] - 20)})`}>
                  <path d={`M 0 -230 L 40 -60 L 220 -40 L 60 30 L 120 200 L 0 80 L -120 200 L -60 30 L -220 -40 L -40 -60 Z`} fill={C.crema} stroke={TINTA} strokeWidth={10} strokeLinejoin="round" />
                </g>
              </g>
            ) : (
              <g transform={camara}>
                <Escena i={i} t={t} tq={tq} tb={tb} pre={pre} fiesta={fiesta} />
                {/* el confeti, las estrellitas y las rayas de alegría del remate */}
                {fiesta >= 0 && (
                  <g>
                    <Alegria c={[cab[0], cab[1] - 6]} manos={manos} t={t} t0={T_FIESTA + 0.05} />
                    <Confeti t={t} t0={T_FIESTA} o={[BOCA[0], BOCA[1] - 10]} semilla={41} n={56} abre={1.7} vmin={1700} vmax={3300} />
                    <Estrellitas t={t} sitios={[
                      [120, 960, 34, T_FIESTA + 0.12], [400, 900, 26, T_FIESTA + 0.2], [880, 1060, 30, T_FIESTA + 0.16], [180, 1330, 22, T_FIESTA + 0.3],
                      [960, 420, 26, T_FIESTA + 0.26], [110, 420, 30, T_FIESTA + 0.22], [780, 1300, 24, T_FIESTA + 0.34],
                    ]} />
                  </g>
                )}
                {/* las onomatopeyas de los golpes */}
                {sonidosAhora.map((s, k) => (
                  <Letras key={k} texto={s.texto} x={s.c[0]} y={s.c[1]} size={s.size} giro={s.giro} t={t} t0={s.t} t1={s.t + 0.52} estilo={s.estilo} semilla={s.semilla} paso={0.014} />
                ))}
                {globo && <Globo texto={globo.texto} c={[250, 745]} cola={colaGlobo} tipo={globo.tipo} t={t} t0={globo.t0} t1={globo.t1} size={64} semilla={globo.t0 * 100} />}
                {/* el fogonazo del remate (como mucho a media fuerza) */}
                {fiesta >= 0 && fiesta < 0.16 && <rect x={-60} y={-60} width={1200} height={2040} fill={C.crema} opacity={0.55 * (1 - fiesta / 0.16)} />}
              </g>
            )}
          </g>
          <rect x={MARGEN} y={MARGEN} width={1080 - 2 * MARGEN} height={1920 - 2 * MARGEN} fill="none" stroke={TINTA} strokeWidth={BORDE} />
          {/* el «¡DENTRO!», encima del borde: se sale de la viñeta */}
          {/* el confeti del estallido sale de detrás de él (por delante taparía las letras) */}
          {fiesta >= 0 && <Confeti t={t} t0={T_FIESTA + 0.03} o={CENTRO_EXPLOSION} semilla={57} n={36} abre={Math.PI * 2} base={0} vmin={1300} vmax={2600} />}
          {fiesta >= 0 && <Explosion t={t} t0={T_FIESTA} c={CENTRO_EXPLOSION} texto="¡DENTRO!" />}
          <Cartela texto={cartela} t={t} t0={remate && t >= T_CARTELA ? T_CARTELA : -1} size={58} color={remate && t >= T_CARTELA ? C.cian : C.amarillo} />
        </g>
        <rect x={0} y={0} width={1080} height={1920} filter={`url(#${pre}papel)`} style={{mixBlendMode: 'multiply'}} opacity={0.5} />
      </svg>
    </AbsoluteFill>
  );
};

// los tiempos del remate (para probarlo)
export const TIEMPOS_REMATE = {T_ENTRA, T_IMPACTO, T_FIESTA};
