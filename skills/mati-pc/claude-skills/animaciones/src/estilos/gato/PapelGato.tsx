import React from 'react';
import {mix, rng} from '../../comun/curvas';
import {recorte} from '../PapelGeo';
import {capsulaLocal, corte, cuadratica, elipsePts, trazo, tf} from './PapelCorte';
import {chincheta, f, type Tinta} from './PapelTintas';
import {resta, rot, suma, type Elipse, type Gato, type Oreja, type Ojo, type P, type Pata} from './escena';

// EL GATO, una marioneta de cartulina: el cuerpo de una pieza (con su pecho de crema y las rayas de atigrado), la cabeza con su
// hocico, las orejas con el papel rosa dentro, los ojos de papel, la nariz, la boca y los bigotes de tiras finas; las patas y la cola
// en segmentos unidos con encuadernadores de latón. Cada pieza se corta UNA vez en sus medidas (el borde nunca cambia) y se coloca
// en cada paso con trasladar, girar y escalar; así la fibra del papel también viaja con la pieza. En cada paso cada grupo se recoloca
// un pelo distinto, como cuando se mueve a mano. Se pinta en las medidas del dibujo de escena.ts (quien lo usa lo envuelve en
// TRANSFORMA_GATO).

const f1 = (n: number) => n.toFixed(1);
const ang = (a: P, b: P) => Math.atan2(b[1] - a[1], b[0] - a[0]);
const dist = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const mixP = (a: P, b: P, k: number): P => [mix(a[0], b[0], k), mix(a[1], b[1], k)];

// las piezas, cortadas una vez en sus medidas
const R = {
  cadera: [122, 103], torso: [95, 168], pecho: [74, 112], barriga: [74, 48], pieT: [54, 17], cabeza: [110, 96], hocico: [40, 30], pie: [31, 15],
} as const;
const CORTE = {
  cadera: recorte(elipsePts(122, 103, 48), 11, 1.6, 16),
  torso: recorte(elipsePts(95, 168, 52), 12, 1.6, 16),
  pecho: recorte(elipsePts(74, 112, 44), 13, 1.5, 16),
  barriga: recorte(elipsePts(74, 48, 36), 14, 1.5, 16),
  pieT: recorte(elipsePts(54, 17, 28), 15, 1.2, 14),
  cabeza: recorte(elipsePts(110, 96, 48), 16, 1.6, 16),
  hocico: recorte(elipsePts(40, 30, 28), 17, 1.1, 12),
  pie: recorte(elipsePts(31, 15, 24), 18, 1, 12),
  pieL: recorte(elipsePts(31, 15, 24), 19, 1, 12),
  brazo: recorte(capsulaLocal(102, 32, 23), 20, 1.4, 16),
  antebrazo: recorte(capsulaLocal(96, 23, 18), 21, 1.3, 16),
  brazoL: recorte(capsulaLocal(102, 32, 23), 22, 1.4, 16),
  antebrazoL: recorte(capsulaLocal(96, 23, 18), 23, 1.3, 16),
  babero: recorte(elipsePts(44, 86, 36), 24, 1.2, 14),
  muslo: recorte(elipsePts(84, 76, 40), 25, 1.4, 16),
  mejilla: recorte(elipsePts(15, 11, 16), 26, 0.6, 10),
};
// las rayas de atigrado: cuñas que entran desde el borde (se recortan con la silueta)
const cuna = (a: P, b: P, w: number): P[] => {
  const n = rot([b[0] - a[0], b[1] - a[1]], Math.PI / 2);
  const d = Math.hypot(n[0], n[1]) || 1;
  const k = w / 2 / d;
  return [[a[0] + n[0] * k, a[1] + n[1] * k], b, [a[0] - n[0] * k, a[1] - n[1] * k]];
};
const RAYAS_TORSO = [-118, -64, -10, 44].map((y, i) => recorte(cuna([-112, y], [-36 + (i % 2) * 8, y + 18], 26), 40 + i, 1, 10));
const RAYAS_CADERA = [205, 232, 259].map((g, i) => {
  const a = (g * Math.PI) / 180;
  return recorte(cuna([Math.cos(a) * 140, Math.sin(a) * 120], [Math.cos(a) * 62, Math.sin(a) * 52], 26), 50 + i, 1, 10);
});
// un toque mínimo en cada paso: el grupo se mueve y gira un pelo sobre su articulación
const toque = (r: () => number, ancla: P, a = 1.3, g = 0.55) => {
  const jx = (r() - 0.5) * 2 * a, jy = (r() - 0.5) * 2 * a, jr = (r() - 0.5) * 2 * g;
  return `translate(${jx.toFixed(2)} ${jy.toFixed(2)}) rotate(${jr.toFixed(2)} ${f1(ancla[0])} ${f1(ancla[1])})`;
};
const elip = (d: string, e: Elipse, base: readonly [number, number], t: Tinta, props?: React.SVGProps<SVGPathElement>) => (
  <path d={d} transform={tf(e.c, e.ang, e.rx / base[0], e.ry / base[1])} fill={f(t)} {...props} />
);

// la oreja en puntos: la curva de fuera (base → punta → base) y el triángulo rosa de dentro
const orejaPts = (o: Oreja): P[] => {
  const [b1, b2] = o.base;
  const ax = resta(o.punta, o.bc);
  const l = Math.max(1, Math.hypot(ax[0], ax[1]));
  const n: P = [-ax[1] / l, ax[0] / l];
  const c1 = suma(mixP(b1, o.punta, 0.55), [n[0] * 10, n[1] * 10]);
  const c2 = suma(mixP(b2, o.punta, 0.55), [-n[0] * 10, -n[1] * 10]);
  return [...cuadratica(b1, c1, o.punta, 9), ...cuadratica(o.punta, c2, b2, 9).slice(1), mixP(b2, b1, 0.5)];
};
const dentroPts = (o: Oreja): P[] => {
  const [a, p, b] = o.dentro;
  const m = mixP(a, b, 0.5);
  return [...cuadratica(a, mixP(mixP(a, p, 0.5), m, -0.15), p, 5), ...cuadratica(p, mixP(mixP(b, p, 0.5), m, -0.15), b, 5).slice(1), m];
};

const PataPapel: React.FC<{pt: Pata; lejos: boolean; r: () => number}> = ({pt, lejos, r}) => {
  const piel: Tinta = lejos ? 'naranjaL' : 'naranja';
  const dedos = [0.3, 0.62].map((s) => {
    const a = rot([R.pie[0] * s, -7], pt.pie.ang), b = rot([R.pie[0] * s, 8], pt.pie.ang);
    return trazo([suma(pt.pie.c, a), suma(pt.pie.c, b)], 3.4, 2.4);
  });
  return (
    <g>
      <g transform={toque(r, pt.hombro, 1, 0.4)}>
        <path d={lejos ? CORTE.brazoL : CORTE.brazo} transform={tf(pt.hombro, ang(pt.hombro, pt.codo))} fill={f(piel)} filter="url(#gpp-s2)" />
        <g transform={toque(r, pt.codo, 1, 0.5)}>
          <g filter="url(#gpp-s2)">
            <path d={lejos ? CORTE.antebrazoL : CORTE.antebrazo} transform={tf(pt.codo, ang(pt.codo, pt.mano))} fill={f(piel)} />
          </g>
          <path d={lejos ? CORTE.pieL : CORTE.pie} transform={tf(pt.pie.c, pt.pie.ang)} fill={f(lejos ? 'pelajeL' : 'pelaje')} filter="url(#gpp-s1)" />
          {dedos.map((d, i) => <path key={i} d={corte(d, 60 + i, 0.4, 10)} fill={f(lejos ? 'naranjaL' : 'pelajeL')} />)}
          {chincheta(pt.codo, lejos ? 6 : 7, lejos, 'codo')}
        </g>
        {!lejos && chincheta(pt.hombro, 8, false, 'hombro')}
      </g>
    </g>
  );
};

const OjoPapel: React.FC<{o: Ojo; id: string; s: number}> = ({o, id, s}) => {
  if (o.cerrado) {
    // cerrado: una tira curva de tinta (la sonrisa del ojo)
    return <path d={corte(trazo(o.arco, 7, 7), s, 0.5, 16)} fill={f('tinta')} />;
  }
  const d = corte(o.visible, s, 0.6, 30);
  return (
    <g>
      <path d={d} fill={f('tinta')} stroke="#3A2416" strokeWidth={6.5} strokeLinejoin="round" />
      <path d={d} fill={f('iris')} />
      <clipPath id={id}><path d={d} /></clipPath>
      <g clipPath={`url(#${id})`}>
        <path d={recorte(elipsePts(o.pupila.rx, o.pupila.ry, 22), s + 5, 0.4, 8)} transform={tf(o.pupila.c, o.pupila.ang)} fill="#1E120B" />
        <circle cx={o.brillo[0]} cy={o.brillo[1]} r={5.5} fill="#FFFDF6" />
        <circle cx={o.brillo[0] + 9} cy={o.brillo[1] + 11} r={2.4} fill="#FFFDF6" opacity={0.8} />
      </g>
    </g>
  );
};

export const GatoPapel: React.FC<{g: Gato; n: number; lame: boolean; uid: string}> = ({g, n, lame, uid}) => {
  const r = rng(5000 + n * 131);
  const cuerpoIds = `${uid}-cuerpo`, cabezaIds = `${uid}-cabeza`;
  const th = g.inclina;
  const H = g.cabeza.c;
  const enCab = (q: P): P => suma(H, rot(q, th));
  const L = (a: P, b: P) => enCab(mixP(a, b, g.giro));

  // el cuello: una cápsula que cambia un poco de largo (corte con puntos fijos)
  const lc = dist(g.cuello[0], g.cuello[1]);
  const cuello = corte(capsulaLocal(lc, 62, 58), 30, 1.5, 40);

  // la cola en cinco segmentos con un encuadernador en cada unión, de la base a la punta; cada uno con su anillo
  const cp = g.cola.pts, cr = g.cola.r;
  const cortes = [0, 3, 6, 9, 12, 16];
  const cola = cortes.slice(0, -1).map((i0, k) => {
    const i1 = cortes[k + 1];
    const a = cp[i0], b = cp[i1];
    const l = dist(a, b);
    const ra = cr[i0] + 1, rb = cr[i1] + (k === 4 ? 0 : 1);
    const rm = (x: number) => (ra + ((rb - ra) * x) / l) * 0.97;
    const anillo = (x: number, w: number): P[] => [[x - w, -rm(x - w)], [x + w, -rm(x + w)], [x + w * 0.6, rm(x + w)], [x - w * 1.3, rm(x - w)]];
    // la punta, de naranja oscuro: media luna dentro de la punta redonda
    const punta: P[] = [[l - 5, -rb * 0.97], ...Array.from({length: 9}, (_, j) => {
      const a = -Math.PI / 2 + (j / 8) * Math.PI;
      return [l + Math.cos(a) * rb * 0.97, Math.sin(a) * rb * 0.97] as P;
    }), [l - 5, rb * 0.97]];
    const anillos = k === 4 ? [anillo(l * 0.3, 6), anillo(l * 0.66, 6), punta] : [anillo(l * 0.55, 6.5)];
    return {a, b, ang: ang(a, b), d: corte(capsulaLocal(l, ra, rb), 70 + k, 1.3, 30), anillos: anillos.map((q, j) => corte(q, 80 + k * 5 + j, 0.6, 10))};
  });

  // la cabeza: rayas en la frente, mejillas, hocico, nariz, boca, bigotes
  const borde = (x: number) => -96 * Math.sqrt(Math.max(0, 1 - (x / 110) ** 2)); // la frente: el borde de arriba de la cabeza
  const frente = [-1, 0, 1].map((j) => {
    const xp = 15 + j * 25, xf = j * 26, largo = j === 0 ? 40 : 31;
    const base = L([xp, borde(xp) - 8], [xf, borde(xf) - 8]);
    const punta = L([xp - 4, borde(xp) + largo], [xf * 0.85, borde(xf) + largo]);
    return corte(cuna(rot(resta(base, H), -th), rot(resta(punta, H), -th), 18), 90 + j, 0.8, 10);
  });
  const mejillas: [P, number][] = [[L([36, 34], [-64, 26]), 1], [L([104, 30], [64, 26]), g.giro]];
  const boca = corte(trazo(g.boca, 4.6, 4.6), 95, 0.4, 20);
  const surco = corte(trazo([g.surco[0], g.surco[1]], 3.6, 3.6), 96, 0.3, 8);
  const nariz = corte(g.nariz, 97, 0.5, 12);
  const bigotes = g.bigotes.map((b, i) => corte(trazo(cuadratica(b[0], b[1], b[2], 6), 4.6, 2), 100 + i, 0.4, 18));

  const orejas = [g.orejaLejos, g.orejaCerca].map((o, i) => ({fuera: corte(orejaPts(o), 110 + i, 1.4, 30), dentro: corte(dentroPts(o), 115 + i, 0.8, 16)}));

  const patas = <PataPapel pt={g.pataCerca} lejos={false} r={r} />;
  const rCabeza = rng(9100 + n * 17);

  return (
    <g filter="url(#gpp-sg)">
      {/* lo de detrás: la otra pata y la cola */}
      <PataPapel pt={g.pataLejos} lejos r={r} />
      <g>
        {cola.map((s, k) => (
          <g key={k} transform={toque(r, s.a, 0.8, 0.5)}>
            <g filter="url(#gpp-s2)">
              <path d={s.d} transform={tf(s.a, s.ang)} fill={f('naranja')} />
            </g>
            {s.anillos.map((d, j) => <path key={j} d={d} transform={tf(s.a, s.ang)} fill={f('naranjaO')} />)}
            {k > 0 && chincheta(s.a, 6, false, 'c' + k)}
          </g>
        ))}
      </g>

      {/* el cuerpo, de una pieza: cadera, tronco, pecho, barriga y cuello (una sola sombra) */}
      <g transform={toque(r, g.cadera.c, 1, 0.3)}>
        <clipPath id={cuerpoIds}>
          <path d={CORTE.cadera} transform={tf(g.cadera.c, g.cadera.ang, g.cadera.rx / R.cadera[0], g.cadera.ry / R.cadera[1])} />
          <path d={CORTE.torso} transform={tf(g.torso.c, g.torso.ang, g.torso.rx / R.torso[0], g.torso.ry / R.torso[1])} />
        </clipPath>
        <g filter="url(#gpp-s3)">
          {elip(CORTE.cadera, g.cadera, R.cadera, 'naranja')}
          {elip(CORTE.torso, g.torso, R.torso, 'naranja')}
          {elip(CORTE.barriga, g.barriga, R.barriga, 'naranja')}
          {elip(CORTE.pecho, g.pecho, R.pecho, 'naranja')}
          <path d={cuello} transform={tf(g.cuello[0], ang(g.cuello[0], g.cuello[1]))} fill={f('naranja')} />
        </g>
        <g clipPath={`url(#${cuerpoIds})`}>
          {RAYAS_TORSO.map((d, i) => <path key={'t' + i} d={d} transform={tf(g.torso.c, g.torso.ang)} fill={f('naranjaO')} />)}
          {RAYAS_CADERA.map((d, i) => <path key={'c' + i} d={d} transform={tf(g.cadera.c, g.cadera.ang)} fill={f('naranjaO')} />)}
        </g>
        {/* el muslo, pegado encima con su encuadernador; el pecho de crema y la pata de atrás */}
        <path d={CORTE.muslo} transform={`${tf(g.cadera.c, g.cadera.ang)} translate(18 6)`} fill={f('naranjaC')} filter="url(#gpp-s1)" />
        <path d={CORTE.babero} transform={`${tf(g.pecho.c, g.pecho.ang, g.pecho.rx / R.pecho[0], g.pecho.ry / R.pecho[1])} translate(26 22)`} fill={f('pelaje')} filter="url(#gpp-s0)" />
        {elip(CORTE.pieT, g.pieTrasero, R.pieT, 'pelaje', {filter: 'url(#gpp-s1)'})}
        {chincheta(suma(g.cadera.c, rot([18, 6], g.cadera.ang)), 8.5, false, 'cadera')}
      </g>

      {!lame && patas}

      {/* la cabeza: las orejas detrás, la cara de una pieza y encima lo pegado */}
      <g transform={toque(rCabeza, g.cuello[1], 1.2, 0.5)}>
        {orejas.map((o, i) => (
          <g key={i} filter="url(#gpp-s2)">
            <path d={o.fuera} fill={f(i === 0 ? 'naranjaL' : 'naranja')} />
            <path d={o.dentro} fill={f('rosa')} filter="url(#gpp-s0)" />
          </g>
        ))}
        <clipPath id={cabezaIds}>
          <path d={CORTE.cabeza} transform={tf(H, th, g.cabeza.rx / R.cabeza[0], g.cabeza.ry / R.cabeza[1])} />
        </clipPath>
        {elip(CORTE.cabeza, g.cabeza, R.cabeza, 'naranja', {filter: 'url(#gpp-s3)'})}
        <g clipPath={`url(#${cabezaIds})`}>
          {frente.map((d, i) => <path key={i} d={d} transform={tf(H, th)} fill={f('naranjaO')} />)}
        </g>
        {mejillas.map(([c, k], i) => k > 0.05 && (
          <path key={'m' + i} d={CORTE.mejilla} transform={tf(c, th)} fill={f('rosa')} opacity={0.7 * k} />
        ))}
        {elip(CORTE.hocico, g.hocico, R.hocico, 'pelaje', {filter: 'url(#gpp-s1)'})}
        {[g.ojoLejos, g.ojoCerca].map((o, i) => <OjoPapel key={i} o={o} id={`${uid}-ojo${i}`} s={120 + i * 7} />)}
        <path d={surco} fill={f('tinta')} />
        <path d={boca} fill={f('tinta')} />
        <path d={nariz} fill={f('rosaO')} filter="url(#gpp-s0)" />
        <g filter="url(#gpp-s0)">
          {bigotes.map((d, i) => <path key={i} d={d} fill={f('pelaje')} />)}
        </g>
        {g.lengua && elip(recorte(elipsePts(11, 14, 18), 98, 0.5, 8), {...g.lengua, ry: g.lengua.ry}, [11, 14], 'rosaO', {filter: 'url(#gpp-s0)'})}
      </g>

      {lame && patas}
    </g>
  );
};
