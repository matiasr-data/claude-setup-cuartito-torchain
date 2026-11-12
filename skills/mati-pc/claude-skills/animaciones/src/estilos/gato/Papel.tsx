import React from 'react';
import {loadFont} from '@remotion/google-fonts/LilitaOne';
import {clamp, mix, rng} from '../../comun/curvas';
import {
  DUR, IMPACTO, MESA_Y, SUELO, TRANSFORMA_GATO, T_CAE, T_SUELO, cafe, gato, piezasTaza, resta, rot, suma, taza, trozos, vapor, type P,
} from './escena';
import {circuloPts, recorte, rectPts, tiraPts} from '../PapelGeo';
import {DEFS, f, type Tinta} from './PapelTintas';
import {FONDO, MESA, frente, guirnalda} from './PapelCocina';
import {GatoPapel} from './PapelGato';
import {corte, elipsePts, manchaPts, tf, trazo} from './PapelCorte';

// EL GATO EN 3 · PAPEL RECORTADO: stop motion
// de cartulina, cada cosa una hoja cortada a tijera con su fibra y su sombra suave sobre lo de detrás, animado «a dos» (12 pasos por
// segundo, cada pieza recolocada a mano un pelo distinta en cada paso). El gato es una marioneta de papel atigrada con encuadernadores
// de latón (PapelGato.tsx) en una cocina de papel (PapelCocina.tsx). La taza, de cartulina cobalto con lunares, humea papel de seda;
// al caer gira a saltitos con sus rayas de velocidad y el café sale en una cinta marrón con gotas de papel; al romperse, el golpe:
// una estrella de cartulina que salta del suelo como un desplegable, «¡CRAC!» en letras pegadas, los trozos y las astillas con su
// sombra, el charco que crece a saltos y vapor de papel de seda que sube de él.

const {fontFamily: LILITA} = loadFont('normal', {weights: ['400'], subsets: ['latin']});
const PASOS = 12;

// ---------------------------------------------------------------- la taza, cortada una vez en sus medidas
const TAZA0 = piezasTaza({c: [0, 0], ang: 0});
const TAZA = {
  asa: recorte(TAZA0.asa, 501, 1, 12),
  cuerpo: recorte(TAZA0.cuerpo, 502, 1.2, 14),
  base: recorte(rectPts(-51, 42, 102, 16, 11), 503, 0.8, 12),
  boca: recorte(elipsePts(51, 11, 30, [0, -59]), 504, 0.8, 12),
  cafe: recorte(elipsePts(42, 6.5, 26, [0, -57]), 505, 0.6, 10),
  lunares: ([[-28, -28, 8], [17, -36, 6], [-6, 0, 7.5], [28, 8, 8], [-32, 28, 6], [10, 30, 6.5]] as [number, number, number][]).map(
    ([x, y, r], i) => recorte(circuloPts([x, y], r, 12), 510 + i, 0.5, 6),
  ),
  brillo: recorte(rectPts(-42, -46, 9, 70, 4), 520, 0.5, 10),
};

// los trozos: su forma en sus propias medidas (sale de trozos() al tocar el suelo)
const TROZOS_LOCAL = trozos(T_SUELO + 1e-4).map((q) => ({
  n: q.n,
  d: recorte(q.pts.map((v) => rot(resta(v, q.c), -q.ang)), 600 + q.n * 7, 1, 11),
  lunar: q.n === 2 || q.n === 4 || q.n === 5,
}));
const LUNAR_TROZO = recorte(circuloPts([0, 2], 7, 12), 640, 0.5, 6);

// las astillas: diez pedacitos que saltan del golpe, rebotan una vez y se quedan
const ASTILLAS = (() => {
  const r = rng(808);
  return Array.from({length: 10}, (_, i) => {
    const lado = i % 2 === 0 ? -1 : 1;
    const tam = 7 + r() * 8;
    const forma: P[] = [[-tam, -tam * 0.4], [tam * (0.6 + r() * 0.5), -tam * (0.5 + r() * 0.4)], [tam * 0.2, tam * (0.6 + r() * 0.4)]];
    return {
      d: recorte(forma, 700 + i, 0.5, 6), t: (i % 3 === 2 ? 'loza' : 'cobalto') as Tinta,
      v: [lado * (140 + r() * 520), -(380 + r() * 820)] as P, w: (r() - 0.5) * 30, suelo: SUELO - 4 + r() * 26, x0: (r() - 0.5) * 40,
    };
  });
})();
const GS = 7000;
const astilla = (a: (typeof ASTILLAS)[number], tau: number): {c: P; ang: number} => {
  const p0: P = [IMPACTO[0] + a.x0, SUELO - 30];
  const t1 = (-a.v[1] + Math.sqrt(a.v[1] ** 2 + 2 * GS * (a.suelo - p0[1]))) / GS;
  if (tau < t1) return {c: [p0[0] + a.v[0] * tau, p0[1] + a.v[1] * tau + 0.5 * GS * tau * tau], ang: a.w * tau};
  const vy = -0.25 * (a.v[1] + GS * t1);
  const t2 = (-2 * vy) / GS;
  const s = Math.min(tau - t1, t2);
  const x1 = p0[0] + a.v[0] * t1;
  return {c: [x1 + a.v[0] * 0.4 * s, a.suelo + vy * s + 0.5 * GS * s * s], ang: a.w * (t1 + 0.3 * s)};
};

// ---------------------------------------------------------------- el golpe: la estrella desplegable y «¡CRAC!»
const estrellaMedia = (R: number, r0: number, puntas: number, semilla: number): P[] => {
  const r = rng(semilla);
  const out: P[] = [];
  const N = puntas * 2;
  for (let i = 0; i <= N; i++) {
    const a = Math.PI + (i / N) * Math.PI + (i > 0 && i < N ? (r() - 0.5) * 0.06 : 0);
    const rad = (i % 2 === 1 ? R : r0) * (i > 0 && i < N ? 0.88 + r() * 0.22 : 1);
    out.push([rad * Math.cos(a), Math.min(0, rad * Math.sin(a))]);
  }
  return out;
};
const ESTRELLA = [
  {d: recorte(estrellaMedia(256, 160, 9, 41), 811, 1.6, 16), t: 'mostaza' as Tinta, s: 's3'},
  {d: recorte(estrellaMedia(182, 116, 9, 42), 812, 1.4, 16), t: 'crema' as Tinta, s: 's2'},
  {d: recorte(estrellaMedia(104, 66, 7, 43), 813, 1.2, 14), t: 'coral' as Tinta, s: 's2'},
];
const T_GOLPE = Math.ceil(T_SUELO * PASOS - 1e-6) / PASOS; // el primer paso con la taza rota
const subeEstrella = (tq: number) => {
  const k = Math.round((tq - T_GOLPE) * PASOS);
  if (k < 0) return 0;
  const sube = [1.22, 0.9, 1.05, 1][Math.min(k, 3)];
  const baja = [1, 0.62, 0.22, 0][clamp(Math.round((tq - 3.58) * PASOS), 0, 3)];
  return sube * (tq >= 3.58 ? baja : 1);
};
const LETRAS: [string, number][] = [['¡', 0.34], ['C', 0.62], ['R', 0.64], ['A', 0.66], ['C', 0.62], ['!', 0.34]];
const CRAC = {c: [716, 1336] as P, tam: 118, giro: -7};
const TINTA_CRAC = '#2F62B5';

// ---------------------------------------------------------------- piezas de papel de seda y de café
// el vapor: cintas de papel de seda (translúcido), con su borde de tijera fijo
const seda = (pts: P[], i: number, alfa: number, key: string) => {
  if (alfa <= 0.02 || pts.length < 2) return null;
  const ancho = trazo(pts, 22, 7);
  const fino = trazo(pts.slice(0, Math.max(3, Math.round(pts.length * 0.7))), 9, 4);
  return (
    <g key={key} opacity={Math.min(1, alfa * 1.1)} filter="url(#gpp-s0)">
      <path d={corte(ancho, 900 + i, 1.3, 46)} fill="#FFFFFF" opacity={0.58} />
      <path d={corte(fino, 950 + i, 0.8, 28)} fill="#FFFFFF" opacity={0.7} />
    </g>
  );
};
// el chorro, suavizado (dos pasadas de Chaikin) para que sea una cinta de líquido y no un collar de gotas
const suave = (pts: P[], r: number[]) => {
  // primero una media de cada gota con sus vecinas (las gotas salen con un poco de azar a los lados: así no hace zigzag)
  const n = pts.length;
  let q = pts.map((_, i) => {
    let sx = 0, sy = 0, sr = 0, k = 0;
    for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) {
      const w = j === i ? 2 : 1;
      sx += pts[j][0] * w; sy += pts[j][1] * w; sr += r[j] * w; k += w;
    }
    return i === 0 || i === n - 1 ? [pts[i][0], pts[i][1], sr / k] : [sx / k, sy / k, sr / k];
  });
  for (let k = 0; k < 2; k++) {
    const out: number[][] = [q[0]];
    for (let i = 0; i + 1 < q.length; i++) {
      const a = q[i], b = q[i + 1];
      out.push(a.map((x, j) => 0.75 * x + 0.25 * b[j]), a.map((x, j) => 0.25 * x + 0.75 * b[j]));
    }
    out.push(q[q.length - 1]);
    q = out;
  }
  return {pts: q.map((v) => [v[0], v[1]] as P), r: q.map((v) => v[2])};
};
// una cinta de ancho variable (el radio de cada gota) con las dos puntas redondeadas
const cintaPts = (pts: P[], r: number[], k: number): P[] => {
  const izq: P[] = [], der: P[] = [];
  const n = pts.length;
  pts.forEach((q, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const ux = b[0] - a[0], uy = b[1] - a[1];
    const d = Math.hypot(ux, uy) || 1;
    const w = r[i] * k;
    izq.push([q[0] - (uy / d) * w, q[1] + (ux / d) * w]);
    der.push([q[0] + (uy / d) * w, q[1] - (ux / d) * w]);
  });
  const tapa = (c: P, dir: P, w: number): P[] => [-0.6, 0, 0.6].map((a) => {
    const u = rot(dir, a);
    return [c[0] + u[0] * w, c[1] + u[1] * w] as P;
  });
  const u0 = resta(pts[0], pts[1]), u1 = resta(pts[n - 1], pts[n - 2]);
  const l0 = Math.hypot(u0[0], u0[1]) || 1, l1 = Math.hypot(u1[0], u1[1]) || 1;
  return [...izq, ...tapa(pts[n - 1], [u1[0] / l1, u1[1] / l1], r[n - 1] * k).reverse(), ...der.reverse(), ...tapa(pts[0], [u0[0] / l0, u0[1] / l0], r[0] * k).reverse()];
};
const GOTA = Array.from({length: 8}, (_, i) => recorte(circuloPts([0, 0], 10, 14), 1000 + i, 0.7, 6));
const CHARCO = {
  fondo: corte(manchaPts(160, 18, 77, 44, 0.18), 1100, 1.2, 44),
  luz: corte(manchaPts(86, 7, 78, 30, 0.2), 1101, 0.8, 30),
  brillo: corte(rectPts(-46, -3, 60, 5, 2), 1102, 0.4, 10),
};
const MANCHAS = Array.from({length: 12}, (_, i) => corte(manchaPts(10, 4, 1200 + i, 22, 0.25), 1300 + i, 0.4, 22));

export const Papel: React.FC<{t: number}> = ({t: tt}) => {
  const uid = 'gp' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const t = clamp(tt, 0, DUR);
  const n = Math.floor(t * PASOS + 1e-6); // «a dos»: 12 pasos por segundo
  const tq = n / PASOS;
  const g = gato(tq);
  const tz = taza(tq);
  const cf = cafe(tq);
  const tr = trozos(tq);
  const vp = vapor(tq);
  const lame = tq > 4.95;

  // el golpe sacude el decorado (como si alguien hubiera dado en la mesa)
  const kG = Math.round((tq - T_GOLPE) * PASOS);
  const sac: P = kG === 0 ? [9, -7] : kG === 1 ? [-6, 4] : kG === 2 ? [3, -2] : [0, 0];

  // la taza en su sitio (en la mesa, un pelo recolocada en cada paso)
  const rT = rng(3300 + n * 19);
  const enMesa = tz.estado === 'mesa';
  const jT: P = enMesa ? [(rT() - 0.5) * 1.4, (rT() - 0.5) * 0.6] : [0, 0];
  const cT = suma(tz.c, jT);
  const conCafe = tz.ang < 0.55;

  // las rayas de velocidad, mientras vuela
  const rayas = (() => {
    if (tz.estado !== 'cae' || tq < T_CAE + 0.04) return null;
    const a = taza(tq - 0.012).c, b = taza(tq + 0.012).c;
    const v = resta(b, a);
    const l = Math.hypot(v[0], v[1]);
    if (l < 4) return null;
    const u: P = [v[0] / l, v[1] / l], nn: P = [-u[1], u[0]];
    return [-1, 0, 1].map((k) => {
      const ini = suma(tz.c, [-u[0] * (84 + 16 * Math.abs(k)) + nn[0] * k * 38, -u[1] * (84 + 16 * Math.abs(k)) + nn[1] * k * 38]);
      const fin = suma(ini, [-u[0] * (70 + 60 * (1 - Math.abs(k))), -u[1] * (70 + 60 * (1 - Math.abs(k)))]);
      return <path key={k} d={recorte(tiraPts(ini, fin, 11), 860 + k, 0.7, 10)} fill={f('crema')} filter="url(#gpp-s1)" />;
    });
  })();

  // el café en el aire: la cinta del chorro y sus gotas
  const chorro = cf.gotas.filter((d) => d.i < 100);
  const tramos: {pts: P[]; r: number[]; ids: number[]}[] = [];
  chorro.forEach((d, i) => {
    if (i === 0 || Math.hypot(d.c[0] - chorro[i - 1].c[0], d.c[1] - chorro[i - 1].c[1]) > 90) tramos.push({pts: [], r: [], ids: []});
    const tr0 = tramos[tramos.length - 1];
    tr0.pts.push(d.c);
    tr0.r.push(d.r);
    tr0.ids.push(d.i);
  });
  // mientras cae, el chorro es una cinta; al llegar al suelo se rompe en gotas
  // la punta (las gotas más viejas) ya se ha roto en gotas; el resto es una cinta que engorda hacia la boca de la taza, con ondas
  const conCinta = tramos.filter((q) => q.pts.length > 3 && tq < T_SUELO).map((q) => {
    const k0 = Math.floor(q.pts.length * 0.3);
    const pts = q.pts.slice(k0), ids = q.ids.slice(k0), m = pts.length;
    const r = pts.map((_, j) => mix(7, 17, j / Math.max(1, m - 1)) * (1 + 0.22 * Math.sin(j * 1.7 + ids[0] * 0.3)));
    return {pts, ids, r};
  });
  const enCinta = new Set(conCinta.flatMap((q) => q.ids));
  const sueltas = cf.gotas.filter((d) => !enCinta.has(d.i));
  const cintas = conCinta.map((q) => suave(q.pts, q.r));
  // cada gota suelta se estira un poco en la dirección en la que va (una lágrima, no una bolita)
  const antes = new Map(cafe(tq - 1 / 60).gotas.map((d) => [d.i, d.c] as [number, P]));
  const estira = (d: {c: P; i: number}) => {
    const a = antes.get(d.i);
    if (!a) return {ang: 0, k: 1};
    const v = resta(d.c, a);
    const l = Math.hypot(v[0], v[1]) * 60;
    return {ang: Math.atan2(v[1], v[0]), k: 1 + Math.min(0.9, l / 1600)};
  };

  const sube = subeEstrella(tq);
  const kCrac = Math.round((tq - T_GOLPE) * PASOS);
  const escCrac = kCrac < 0 ? 0 : tq >= 3.92 ? [0.6, 0][clamp(Math.round((tq - 3.92) * PASOS), 0, 1)] : [1.28, 0.9, 1.05, 1][Math.min(kCrac, 3)];

  const parpadeo = rng(400 + n)() * 0.035; // la luz de un stop motion nunca es igual de un cuadro a otro

  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
      {DEFS}
      <rect width={1080} height={1920} fill="#ECDDC3" />
      <g transform={`translate(${sac[0]} ${sac[1]})`}>
        {FONDO}
        {guirnalda(n)}

        {/* el golpe: una estrella de cartulina que salta del suelo detrás de la taza, como un desplegable */}
        {sube > 0 && (
          <g transform={`translate(${IMPACTO[0]} ${SUELO + 4}) rotate(${(rng(70 + n)() - 0.5) * 3}) scale(${(0.92 + 0.08 * sube).toFixed(3)} ${sube.toFixed(3)})`}>
            {ESTRELLA.map((e, i) => <path key={i} d={e.d} fill={f(e.t)} filter={`url(#gpp-${e.s})`} />)}
          </g>
        )}

        {MESA}
        {/* las sombras de contacto en la mesa: el gato sentado y la taza */}
        <ellipse cx={378} cy={MESA_Y + 3} rx={210} ry={11} fill="url(#gpp-contacto)" />
        {enMesa && <ellipse cx={cT[0] + 6} cy={MESA_Y + 2} rx={62} ry={7} fill="url(#gpp-contacto)" />}

        {/* el vapor de papel de seda (de la taza y, después, del charco) */}
        {vp.map((h, i) => seda(h.pts, i + (tq > T_SUELO ? 3 : 0), h.alfa, 'v' + i))}

        {rayas}

        {/* la taza: el asa, el cuerpo cobalto con lunares, la base, la boca de loza con el café */}
        {tz.estado !== 'suelo' && (
          <g transform={tf(cT, tz.ang)}>
            <path d={TAZA.asa} fill={f('cobalto')} filter="url(#gpp-s2)" />
            <path d={TAZA.cuerpo} fill={f('cobalto')} filter="url(#gpp-s2)" />
            <path d={TAZA.base} fill={f('cobaltoO')} />
            {TAZA.lunares.map((d, i) => <path key={i} d={d} fill={f('loza')} />)}
            <path d={TAZA.brillo} fill="#FFFFFF" opacity={0.22} />
            <path d={TAZA.boca} fill={f('loza')} filter="url(#gpp-s0)" />
            {conCafe && <path d={TAZA.cafe} fill={f('cafe')} />}
          </g>
        )}

        {/* el café en el aire: la cinta y las gotas, de papel marrón */}
        <g filter="url(#gpp-s1)">
          {cintas.map((q, i) => <path key={'c' + i} d={corte(cintaPts(q.pts, q.r, 1), 1400 + i, 0.45, 90)} fill={f('cafe')} />)}
          {sueltas.map((d) => {
            const e = estira(d);
            const s0 = (d.r * 1.12) / 10;
            return (
              <path key={d.i} d={GOTA[d.i % GOTA.length]} fill={f('cafe')}
                transform={`${tf(d.c, e.ang)} scale(${(s0 * e.k).toFixed(3)} ${(s0 / Math.sqrt(e.k)).toFixed(3)})`} />
            );
          })}
        </g>
        {/* el brillo del café: una tira más clara pegada encima */}
        {cintas.map((q, i) => (
          <path key={'cb' + i} d={corte(cintaPts(q.pts.map((v) => suma(v, [-4, -4])), q.r, 0.38), 1450 + i, 0.4, 40)} fill={f('cafeC')} />
        ))}
        {sueltas.filter((d) => d.r >= 11).map((d) => (
          <circle key={'b' + d.i} cx={d.c[0] - d.r * 0.3} cy={d.c[1] - d.r * 0.3} r={d.r * 0.26} fill={f('cafeC')} />
        ))}

        {/* en el suelo: el charco que crece a saltos, las manchas, los trozos y las astillas */}
        {cf.charco && (
          <g transform={`translate(${cf.charco.c[0]} ${cf.charco.c[1]})`}>
            <path d={CHARCO.fondo} transform={`scale(${(cf.charco.rx / 160).toFixed(3)} ${(cf.charco.ry / 18).toFixed(3)})`} fill={f('cafe')} filter="url(#gpp-s1)" />
            <path d={CHARCO.luz} transform={`translate(-10 -3) scale(${(cf.charco.rx / 160).toFixed(3)} ${(cf.charco.ry / 18).toFixed(3)})`} fill={f('cafeC')} opacity={0.8} />
            <path d={CHARCO.brillo} transform={`scale(${(cf.charco.rx / 160).toFixed(3)} 1)`} fill="#FFF6E6" opacity={0.5} />
          </g>
        )}
        <g filter="url(#gpp-s0)">
          {cf.manchas.map((s) => (
            <path key={s.i} d={MANCHAS[s.i % MANCHAS.length]} transform={`translate(${s.c[0].toFixed(1)} ${s.c[1].toFixed(1)}) scale(${(s.rx / 10).toFixed(3)} ${(s.ry / 4).toFixed(3)})`} fill={f('cafe')} />
          ))}
        </g>
        {tr.map((q) => {
          const L = TROZOS_LOCAL[q.n - 1];
          return (
            <g key={'t' + q.n} transform={tf(q.c, q.ang)}>
              <path d={L.d} fill={f('cobalto')} filter="url(#gpp-s2)" />
              {L.lunar && <path d={LUNAR_TROZO} fill={f('loza')} />}
            </g>
          );
        })}
        {tq >= T_SUELO && ASTILLAS.map((a, i) => {
          const s = astilla(a, tq - T_SUELO);
          return <path key={'a' + i} d={a.d} transform={tf(s.c, s.ang)} fill={f(a.t)} filter="url(#gpp-s1)" />;
        })}

        {/* EL GATO */}
        <g transform={TRANSFORMA_GATO}>
          <GatoPapel g={g} n={n} lame={lame} uid={uid} />
        </g>

        {/* ¡CRAC!: letras de cartulina pegadas a mano, cada una un poco torcida */}
        {escCrac > 0 && (() => {
          const r = rng(1500 + n * 7);
          const total = LETRAS.reduce((s, [, w]) => s + w, 0) * CRAC.tam;
          let x = -total / 2;
          return (
            <g transform={`translate(${CRAC.c[0]} ${CRAC.c[1]}) rotate(${CRAC.giro}) scale(${escCrac.toFixed(3)})`} filter="url(#gpp-s4)">
              {LETRAS.map(([l, w], i) => {
                const cx = x + (w * CRAC.tam) / 2;
                x += w * CRAC.tam;
                const giro = [-8, 5, -4, 7, -6, 9][i] + (r() - 0.5) * 3;
                const dy = [4, -6, 2, -8, 0, 6][i] + (r() - 0.5) * 2;
                return (
                  <text key={i} x={cx} y={CRAC.tam * 0.36 + dy} transform={`rotate(${giro.toFixed(1)} ${cx.toFixed(1)} ${dy.toFixed(1)})`}
                    fontFamily={LILITA} fontSize={CRAC.tam} textAnchor="middle" fill={i % 2 ? TINTA_CRAC : '#E2553F'}
                    stroke="#FBF3E2" strokeWidth={20} strokeLinejoin="round" paintOrder="stroke">{l}</text>
                );
              })}
            </g>
          );
        })()}

        {frente(n)}
      </g>

      {/* la luz cálida de la ventana, la viñeta y el parpadeo de la luz entre cuadros */}
      <rect width={1080} height={1920} fill="url(#gpp-luz)" />
      <rect width={1080} height={1920} fill="url(#gpp-vineta)" />
      <rect width={1080} height={1920} fill="#1E1006" opacity={0.012 + parpadeo} />
    </svg>
  );
};
