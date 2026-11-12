import React from 'react';
import {E, clamp, mix, p} from '../../comun/curvas';
import {Cel, LUZ, mueve, type Tinta} from '../AnimeCel';
import {
  arcoElipse, bigote, cinta, cuerpoTrazos, curva, elipse, oreja, pataTrazos, poli, resta, rot, suma,
  type Elipse, type Gato, type Ojo, type Oreja, type P, type Pata,
} from './escena';

// 7 · ANIME, el gato: un gato de serie de televisión en cel. Gris lavanda con la luz de la tarde (la sombra azul violeta, de borde
// duro, del lado contrario a la ventana, y un filo cálido en el lado que da al sol), el hocico, el pecho y los calcetines blancos,
// las rayas de atigrado en la frente y la cola, y unos ojos enormes de oro con la pupila de rendija cuando trama, dos brillos y la
// raya gruesa del párpado. La boca en «ω», el colmillito y el rubor cuando te mira travieso; con el susto, los ojos como platos
// (blancos, la pupila un punto que tiembla) y la cola erizada. Se pinta en las medidas de dibujo del gato (quien lo usa lo envuelve
// en TRANSFORMA_GATO). Todo con recortes, sin máscaras.

export const LINEA = '#2B2446';
const PELO: Tinta = {luz: '#BBBADD', sombra: '#7577AD', brillo: '#FFE2C2', linea: LINEA};
const PELO_L: Tinta = {luz: '#9D9DC9', sombra: '#62649C', linea: LINEA};
const RAYA = '#4E4F8A';
const BLANCO = {luz: '#FFFDF7', sombra: '#CACAE7'};
const BLANCO_L = {luz: '#E6E6F4', sombra: '#ABACCF'};
const ROSA = '#FFAEC2';
const ROSA_S = '#E4849F';
const NARIZ = '#F47C9A';
const IRIS = '#FFC93A';
const IRIS_S = '#E58A1E';
const IRIS_L = '#FFF0A0';
const PUPILA = '#22142C';

const mixP = (a: P, b: P, k: number): P => [mix(a[0], b[0], k), mix(a[1], b[1], k)];
const por = (a: P, k: number): P => [a[0] * k, a[1] * k];
const norma = (a: P): P => { const d = Math.hypot(a[0], a[1]) || 1; return [a[0] / d, a[1] / d]; };
const f1 = (n: number) => n.toFixed(1);
const escalaEn = (c: P, k: number) => `translate(${f1(c[0])} ${f1(c[1])}) scale(${k.toFixed(4)}) translate(${f1(-c[0])} ${f1(-c[1])})`;

// la sonrisa de la escena (gato/escena.ts no la exporta): para el colmillo y el rubor
const SONRISA: [number, number][] = [[0, 0], [0.7, 0], [0.82, 1], [1.0, 1], [1.12, 0], [2.36, 0], [2.5, 1], [2.78, 1], [2.86, 0], [4.3, 0], [4.46, 1], [4.98, 1], [5.1, 0.4]];
export const sonrisa = (t: number) => {
  if (t <= SONRISA[0][0]) return SONRISA[0][1];
  for (let i = 1; i < SONRISA.length; i++) {
    const [t1, v1] = SONRISA[i], [t0, v0] = SONRISA[i - 1];
    if (t <= t1) return mix(v0, v1, E.inOutCubic(p(t, t0, t1 - t0)));
  }
  return SONRISA[SONRISA.length - 1][1];
};

// una mancha de otro color dentro de una forma en cel (el hocico blanco, el pecho, los calcetines): su sombra sigue a la de la
// forma madre, así el terminador es uno solo
const Mancha: React.FC<{id: string; ds: string[]; madre: string[]; madreId: string; tinta: {luz: string; sombra: string}; s: number}> = ({
  id, ds, madre, madreId, tinta, s,
}) => (
  <g clipPath={`url(#${madreId})`}>
    <defs><clipPath id={id}>{ds.map((d, i) => <path key={i} d={d} />)}</clipPath></defs>
    {ds.map((d, i) => <path key={i} d={d} fill={tinta.sombra} />)}
    <g clipPath={`url(#${id})`}><g transform={mueve(LUZ, s)}>{madre.map((d, i) => <path key={i} d={d} fill={tinta.luz} />)}</g></g>
  </g>
);

// ---------------------------------------------------------------- los ojos
// la raya del párpado: el tramo de arriba del contorno visible (de la esquina de un lado a la del otro)
const cadenaArriba = (o: Ojo): P[] => {
  const loc = o.visible.map((q) => rot(resta(q, o.c), -o.ang));
  const n = loc.length;
  if (n < 3) return [];
  let iL = 0, iR = 0;
  loc.forEach((q, i) => {
    if (q[0] < loc[iL][0]) iL = i;
    if (q[0] > loc[iR][0]) iR = i;
  });
  const cadena = (a: number, b: number) => {
    const out: number[] = [];
    for (let i = a, k = 0; k <= n; i = (i + 1) % n, k++) {
      out.push(i);
      if (i === b) break;
    }
    return out;
  };
  const c1 = cadena(iL, iR), c2 = cadena(iR, iL).reverse();
  const media = (c: number[]) => c.reduce((s, i) => s + loc[i][1], 0) / c.length;
  return (media(c1) < media(c2) ? c1 : c2).map((i) => o.visible[i]);
};

const OjoAnime: React.FC<{o: Ojo; id: string; susto: number; t: number; rabillo: -1 | 1 | 0; k: number}> = ({o, id, susto, t, rabillo, k}) => {
  if (o.cerrado) {
    // contento: el arco hacia arriba, grueso, con su rabillo
    const a = o.arco;
    const fin = rabillo < 0 ? a[0] : a[a.length - 1];
    return (
      <g transform={escalaEn(o.c, k)}>
        <path d={curva(a)} fill="none" stroke={LINEA} strokeWidth={6.5} strokeLinecap="round" />
        {rabillo !== 0 && <path d={`M ${f1(fin[0])} ${f1(fin[1])} l ${rabillo * 9} 5`} stroke={LINEA} strokeWidth={4} strokeLinecap="round" />}
      </g>
    );
  }
  const vis = poli(o.visible);
  const arriba = cadenaArriba(o);
  const flick = (() => {
    if (!rabillo || arriba.length < 2) return null;
    const fin = rabillo < 0 ? arriba[0] : arriba[arriba.length - 1];
    const v = rot([rabillo * 11, -5], o.ang);
    return <path d={`M ${f1(fin[0])} ${f1(fin[1])} l ${f1(v[0])} ${f1(v[1])}`} stroke={LINEA} strokeWidth={4.5} strokeLinecap="round" />;
  })();
  if (susto > 0.5) {
    // los ojos como platos: blancos, más grandes, la pupila un punto que tiembla
    const tiembla = Math.floor(t * 30) % 2 ? 1.6 : -1.6;
    const pc = suma(o.pupila.c, [tiembla, 0]);
    return (
      <g transform={escalaEn(o.c, k * 1.22)}>
        <defs><clipPath id={id}><path d={vis} /></clipPath></defs>
        <path d={vis} fill="#FFFFFF" stroke={LINEA} strokeWidth={2.6} strokeLinejoin="round" />
        <g clipPath={`url(#${id})`}>
          <path d={elipse({c: suma(o.c, rot([0, -o.ry * 1.05], o.ang)), rx: o.rx * 1.4, ry: o.ry * 0.5, ang: o.ang})} fill="#DCDCF0" />
          <circle cx={pc[0]} cy={pc[1]} r={o.rx * 0.22} fill={PUPILA} />
          <circle cx={pc[0] + 2} cy={pc[1] - 2.5} r={o.rx * 0.07} fill="#FFFFFF" />
        </g>
        <path d={poli(arriba, false)} fill="none" stroke={LINEA} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  const pu = o.pupila;
  const chico = suma(pu.c, rot([0.45 * pu.rx + 4, 0.5 * pu.ry], o.ang));
  return (
    <g transform={escalaEn(o.c, k)}>
      <defs><clipPath id={id}><path d={vis} /></clipPath></defs>
      <path d={vis} fill={IRIS} />
      <g clipPath={`url(#${id})`}>
        {/* la sombra del párpado, arriba, y la luz que rebota abajo: el iris en capas */}
        <path d={elipse({c: suma(o.c, rot([0, -o.ry * 0.98], o.ang)), rx: o.rx * 1.45, ry: o.ry * 0.62, ang: o.ang})} fill={IRIS_S} />
        <path d={elipse({c: suma(o.c, rot([o.rx * 0.08, o.ry * 0.8], o.ang)), rx: o.rx * 0.72, ry: o.ry * 0.36, ang: o.ang})} fill={IRIS_L} />
        <path d={elipse(pu)} fill={PUPILA} />
        {/* los dos brillos */}
        <path d={elipse({c: o.brillo, rx: o.rx * 0.27, ry: o.ry * 0.3, ang: o.ang - 0.5})} fill="#FFFFFF" />
        <circle cx={chico[0]} cy={chico[1]} r={o.rx * 0.11} fill="#FFFFFF" />
      </g>
      <path d={vis} fill="none" stroke={LINEA} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={poli(arriba, false)} fill="none" stroke={LINEA} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      {flick}
    </g>
  );
};

// ---------------------------------------------------------------- las piezas
// un mechón de pelo en el borde de una elipse (la mejilla): dos picos
const mechon = (e: Elipse, a: number, ancho = 0.2, largo = 1.2): string => {
  const pt = (ang: number, k: number): P => suma(e.c, rot([Math.cos(ang) * e.rx * k, Math.sin(ang) * e.ry * k], e.ang));
  return poli([pt(a - ancho, 0.9), pt(a - ancho * 0.45, largo), pt(a, 0.96), pt(a + ancho * 0.5, largo * 0.95), pt(a + ancho, 0.9)]);
};

// la cola erizada: los dos bordes alternan el radio, así sale en picos
const colaErizada = (pts: P[], r: number[], k: number): string => {
  const izq: P[] = [], der: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const dir = norma(resta(pts[i + 1], pts[i]));
    const n: P = [-dir[1], dir[0]];
    for (let s = 0; s < 2; s++) {
      const q = mixP(pts[i], pts[i + 1], s / 2);
      const base = mix(r[i], r[i + 1], s / 2);
      const crece = clamp(i / 3);
      // los picos, de largo desigual (pelo de verdad, no una oruga)
      const h1 = 0.8 + 0.7 * Math.abs(Math.sin(i * 12.9898 + 3.1)), h2 = 0.8 + 0.7 * Math.abs(Math.sin(i * 78.233 + 1.7));
      const fuera = (h: number) => base * (1 + k * crece * (s === 0 ? 1.15 * h : 0.4));
      izq.push(suma(q, por(n, fuera(h1))));
      der.push(suma(q, por(n, -fuera(h2))));
    }
  }
  const fin = pts[pts.length - 1];
  const u = norma(resta(fin, pts[pts.length - 2]));
  const punta = suma(fin, por(u, r[r.length - 1] * (1 + 1.6 * k)));
  return poli([...izq, punta, ...der.reverse()]);
};

const PataAnime: React.FC<{pt: Pata; id: string; lejos: boolean}> = ({pt, id, lejos}) => {
  const ds = pataTrazos(pt);
  const {c, rx, ang} = pt.pie;
  const dedos = [0.3, 0.62].map((s) => {
    const a = suma(c, rot([rx * s, -4], ang)), b = suma(c, rot([rx * s, 10], ang));
    return `M ${f1(a[0])} ${f1(a[1])} L ${f1(b[0])} ${f1(b[1])}`;
  }).join(' ');
  return (
    <g>
      <Cel id={id} ds={ds} tinta={lejos ? PELO_L : PELO} grosor={3} s={7} h={3} />
      <Mancha id={id + 'm'} ds={[elipse({...pt.pie, rx: pt.pie.rx * 1.08, ry: pt.pie.ry * 1.25})]} madre={ds} madreId={id} tinta={lejos ? BLANCO_L : BLANCO} s={7} />
      <path d={dedos} stroke={LINEA} strokeWidth={2} strokeLinecap="round" opacity={0.75} />
    </g>
  );
};

const OrejaAnime: React.FC<{o: Oreja; id: string; lejos: boolean}> = ({o, id, lejos}) => {
  const [d0, d1, d2] = o.dentro;
  const pelillos = [0.35, 0.65].map((k) => {
    const a = mixP(d0, d2, k), b = mixP(a, d1, 0.55);
    return `M ${f1(a[0])} ${f1(a[1])} L ${f1(b[0])} ${f1(b[1])}`;
  }).join(' ');
  return (
    <g>
      <Cel id={id} ds={[oreja(o)]} tinta={lejos ? PELO_L : PELO} grosor={3} s={7} h={3} />
      <path d={poli(o.dentro)} fill={lejos ? ROSA_S : ROSA} stroke={LINEA} strokeWidth={1.4} strokeLinejoin="round" />
      <path d={poli([d1, mixP(d0, d1, 0.15), mixP(d1, mixP(d0, d2, 0.5), 0.75)])} fill={ROSA_S} opacity={lejos ? 0 : 0.9} />
      <path d={pelillos} stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" opacity={0.9} />
    </g>
  );
};

// ---------------------------------------------------------------- el gato entero
export type Gesto = {susto: number; erizo: number; rubor: number; colmillo: number};

export const GatoAnime: React.FC<{g: Gato; t: number; pre: string; gesto: Gesto}> = ({g, t, pre, gesto}) => {
  const lame = t > 4.95;
  const H = g.cabeza.c, th = g.inclina, gi = g.giro;
  const enCab = (q: P): P => suma(H, rot(q, th));
  const L = (a: P, b: P): P => enCab(mixP(a, b, gi));

  // el cuerpo, de una pieza, y sus manchas
  const cuerpo = cuerpoTrazos(g);
  const pechoBlanco: Elipse = {c: suma(g.pecho.c, rot([g.pecho.rx * 0.42, 6], g.pecho.ang)), rx: g.pecho.rx * 0.78, ry: g.pecho.ry * 0.9, ang: g.pecho.ang};
  const cuelloBlanco: Elipse = {c: mixP(g.cuello[0], g.cuello[1], 0.45), rx: 44, ry: 52, ang: g.pecho.ang};
  const muslo = curva(arcoElipse(g.cadera, -2.25, -0.4));
  const rayasLomo = [0, 1, 2].map((i) => {
    const a = suma(g.torso.c, rot([-g.torso.rx * 1.05, -60 + i * 46], g.torso.ang));
    const b = suma(g.torso.c, rot([-g.torso.rx * 0.45, -48 + i * 46], g.torso.ang));
    const n = rot([0, 9], g.torso.ang);
    return poli([suma(a, n), suma(a, por(n, -1)), b]);
  });

  // la cabeza: elipse, hocico y los mechones de las mejillas
  const cab = g.cabeza;
  const mechones = gi < 0.5 ? [mechon(cab, 2.3), mechon(cab, 2.62, 0.17, 1.17)] : [mechon(cab, 2.7), mechon(cab, Math.PI - 2.7)];
  const cabeza = [elipse(cab), elipse(g.hocico), ...mechones];
  const hocicoBlanco = [
    elipse({...g.hocico, rx: g.hocico.rx * 1.12, ry: g.hocico.ry * 1.15}),
    elipse({c: L([62, 56], [0, 60]), rx: mix(52, 64, gi), ry: 32, ang: th}),
  ];
  // las rayas de la frente (la «M» del atigrado), de lado y de frente
  const rayasFrente = [-1, 0, 1].map((j) => {
    const top = L([28 + j * 22, -100], [j * 24, -102]);
    const fondo = L([30 + j * 20 - (j === 0 ? 0 : 2), -64 + Math.abs(j) * 8], [j * 21, -64 + Math.abs(j) * 8]);
    const n = rot([7 - Math.abs(j), 0], th);
    return poli([suma(top, n), suma(top, por(n, -1)), fondo]);
  });
  const rubor = gesto.rubor;
  const mejillas: P[] = gi > 0.5 ? [L([0, 0], [-64, 26]), L([0, 0], [64, 26])] : [L([0, 30], [0, 0])];

  // la boca en «ω» y el colmillito
  const colmillo = gesto.colmillo > 0.05 && gi > 0.6 ? (() => {
    const a = L([0, 0], [-15, 46.5]), b = L([0, 0], [-7, 46]), c = L([0, 0], [-11, 54 * 1]);
    return poli([a, b, c]);
  })() : null;

  return (
    <g>
      {/* lo de detrás: la otra pata y la cola */}
      <PataAnime pt={g.pataLejos} id={pre + 'pl'} lejos />
      {(() => {
        const ds = [gesto.erizo > 0.01 ? colaErizada(g.cola.pts, g.cola.r, gesto.erizo) : cinta(g.cola.pts, g.cola.r)];
        const pts = g.cola.pts;
        const bandas = [6, 9, 12, 15].map((i) => {
          const q = pts[i], u = norma(resta(pts[Math.min(pts.length - 1, i + 1)], pts[i - 1]));
          const n: P = [-u[1] * 60, u[0] * 60];
          const w = por(u, 6);
          return poli([suma(suma(q, n), w), suma(suma(q, n), por(w, -1)), suma(suma(q, por(n, -1)), por(w, -1)), suma(suma(q, por(n, -1)), w)]);
        });
        return (
          <g>
            <Cel id={pre + 'co'} ds={ds} tinta={PELO} grosor={3} s={7} h={3} />
            <g clipPath={`url(#${pre}co)`} fill={RAYA} opacity={0.5 * (1 - clamp(gesto.erizo * 3))}>{bandas.map((d, i) => <path key={i} d={d} />)}</g>
          </g>
        );
      })()}
      {/* las orejas, detrás de la cabeza */}
      <OrejaAnime o={g.orejaLejos} id={pre + 'ol'} lejos={gi < 0.5} />
      <OrejaAnime o={g.orejaCerca} id={pre + 'oc'} lejos={false} />

      {/* el cuerpo */}
      <Cel id={pre + 'cu'} ds={cuerpo} tinta={PELO} grosor={3} s={16} h={5} />
      <g clipPath={`url(#${pre}cu)`} fill={RAYA} opacity={0.38}>{rayasLomo.map((d, i) => <path key={i} d={d} />)}</g>
      <Mancha id={pre + 'cub'} ds={[elipse(pechoBlanco), elipse(cuelloBlanco)]} madre={cuerpo} madreId={pre + 'cu'} tinta={BLANCO} s={16} />
      <Mancha id={pre + 'cut'} ds={[elipse({...g.pieTrasero, rx: g.pieTrasero.rx * 1.1, ry: g.pieTrasero.ry * 1.4})]} madre={cuerpo} madreId={pre + 'cu'} tinta={BLANCO} s={10} />
      <path d={muslo} fill="none" stroke={LINEA} strokeWidth={2.6} strokeLinecap="round" opacity={0.85} />
      {/* la sombra que echa la cabeza sobre el pecho (dura, hacia abajo a la izquierda) */}
      <path d={elipse({...cab, c: suma(cab.c, [-16, 30])})} fill="#3E3478" opacity={0.3} clipPath={`url(#${pre}cu)`} />

      {/* la pata de este lado, por delante del pecho (si se la lame, delante de la cara) */}
      {!lame && <PataAnime pt={g.pataCerca} id={pre + 'pc'} lejos={false} />}

      {/* la cabeza */}
      <Cel id={pre + 'ca'} ds={cabeza} tinta={PELO} grosor={3} s={12} h={4.5} />
      <g clipPath={`url(#${pre}ca)`} fill={RAYA} opacity={0.42}>{rayasFrente.map((d, i) => <path key={i} d={d} />)}</g>
      <Mancha id={pre + 'cab'} ds={hocicoBlanco} madre={cabeza} madreId={pre + 'ca'} tinta={BLANCO} s={12} />
      {/* el rubor, con sus rayitas */}
      {rubor > 0.02 && mejillas.map((m, i) => (
        <g key={i} opacity={rubor}>
          <path d={elipse({c: m, rx: 17, ry: 8, ang: th})} fill="#FF8DA6" opacity={0.6} />
          {[-8, 0, 8].map((dx) => {
            const a = suma(m, rot([dx - 3, 4], th)), b = suma(m, rot([dx + 3, -4], th));
            return <path key={dx} d={`M ${f1(a[0])} ${f1(a[1])} L ${f1(b[0])} ${f1(b[1])}`} stroke="#E8607E" strokeWidth={2} strokeLinecap="round" />;
          })}
        </g>
      ))}
      {/* los ojos */}
      <OjoAnime o={g.ojoLejos} id={pre + 'jl'} susto={gesto.susto} t={t} rabillo={gi > 0.5 ? 1 : 0} k={1.12} />
      <OjoAnime o={g.ojoCerca} id={pre + 'jc'} susto={gesto.susto} t={t} rabillo={-1} k={1.12} />
      {/* la nariz, la boca, el colmillo y los bigotes */}
      <path d={poli(g.nariz)} fill={NARIZ} stroke={LINEA} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={`M ${f1(g.surco[0][0])} ${f1(g.surco[0][1])} L ${f1(g.surco[1][0])} ${f1(g.surco[1][1])}`} stroke={LINEA} strokeWidth={2.4} strokeLinecap="round" />
      {colmillo && <path d={colmillo} fill="#FFFFFF" stroke={LINEA} strokeWidth={1.6} strokeLinejoin="round" opacity={clamp(gesto.colmillo * 2)} />}
      <path d={curva(g.boca)} fill="none" stroke={LINEA} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
      {g.bigotes.map((b, i) => <path key={i} d={bigote(b)} fill="none" stroke={LINEA} strokeWidth={2} strokeLinecap="round" opacity={0.75} />)}

      {/* la pata, delante de todo cuando se la lame, y la lengua */}
      {lame && <PataAnime pt={g.pataCerca} id={pre + 'pc'} lejos={false} />}
      {g.lengua && <path d={elipse(g.lengua)} fill="#FF8FA8" stroke={LINEA} strokeWidth={2.2} />}
    </g>
  );
};
