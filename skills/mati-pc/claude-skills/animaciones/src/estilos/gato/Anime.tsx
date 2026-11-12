import React, {useId} from 'react';
import {loadFont as cargarPop} from '@remotion/google-fonts/MochiyPopOne';
import {E, clamp, mix, p, rng, temblor} from '../../comun/curvas';
import {Cel, Destello, LUZ, girar, type Tinta} from '../AnimeCel';
import {corazon} from '../formas';
import {
  DUR, IMPACTO, MESA_Y, SUELO, TRANSFORMA_GATO, T_CAE, T_SUELO, cafe, cinta, curva, enMundo, gato, piezasTaza, poli, resta, rot, suma, taza,
  trozos, vapor, type P,
} from './escena';
import {Cocina, Mesa} from './AnimeCocina';
import {GatoAnime, LINEA, sonrisa, type Gesto} from './AnimeGato';

// EL GATO EN 7 · ANIME. La escena de ./escena.ts como un capítulo de una serie japonesa de televisión (las
// herramientas del cel, en ../AnimeCel.tsx): el gato es un cel (contorno fino y oscuro, colores planos,
// la sombra de borde duro del lado contrario a la ventana y un filo cálido del lado del sol), los ojos enormes de oro con dos brillos;
// la cocina es un decorado pintado de tarde (AnimeCocina.tsx). EL MOMENTO: te mira y, al empujar, la cámara se mete de golpe a su
// cara de travieso (la «ω», la pupila de rendija, el destello en el ojo, las líneas de velocidad); a los 0,5 s ya ha vuelto y la
// taza cae girando con sus líneas de movimiento y el café en arco; al romperse, un fotograma de impacto (fondo plano rojo, rayos
// blancos, las siluetas en negro y «¡CRASH!»), el golpe con su onda y su estrella, y el gato con los ojos como platos, la gota de
// sudor, la cola erizada y un «!?» rojo. Luego se asoma, te mira satisfecho con los ojos cerrados y se lame la pata.

const {fontFamily: POP} = cargarPop('normal', {weights: ['400'], subsets: ['latin']});

const TAU = Math.PI * 2;
const f1 = (n: number) => n.toFixed(1);
const por = (a: P, k: number): P => [a[0] * k, a[1] * k];
const norma = (a: P): P => { const d = Math.hypot(a[0], a[1]) || 1; return [a[0] / d, a[1] / d]; };

const TAZA: Tinta = {luz: '#F2554B', sombra: '#B7304A', brillo: '#FFA48A', linea: '#43121E'};
const CAFE = '#7A4425';
const CAFE_LUZ = '#B8784A';
const CAFE_LINEA = '#2C140B';

// ---------------------------------------------------------------- los tiempos del momento
const Z0 = 2.36; // la cámara se mete a su cara (justo cuando acaba de girarse a cámara)
const Z_IDA = 0.09;
const Z1 = 2.62; // y empieza a volver
const Z_VUELTA = 0.24; // a los 2,86 s está otra vez en su sitio: 0,5 s en total
const Z_ESC = 0.8; // cuánto se acerca
const H0: P = enMundo(gato(2.5).cabeza.c); // a dónde se acerca: su cara a mitad del empujón (fija, sin bailar con la cabeza)
const M_CARA: P = [520, 700]; // dónde queda su cara en la pantalla: arriba, con la pata y la taza abajo a la derecha
const T_IMP = 0.066; // el fotograma de impacto: dos cuadros a 30 por segundo
const SUSTO = [T_SUELO, 3.52] as const;

const gesto = (t: number, giro: number): Gesto => {
  const sm = sonrisa(t);
  const erizo = t < T_SUELO ? 0 : E.outCubic(p(t, T_SUELO, 0.06)) * (1 - E.inOutCubic(p(t, 3.5, 0.4)));
  return {
    susto: t >= SUSTO[0] && t < SUSTO[1] ? 1 : 0,
    erizo,
    rubor: giro > 0.5 ? clamp(0.35 + sm) : 0,
    colmillo: giro > 0.6 ? sm : 0,
  };
};

// ---------------------------------------------------------------- las líneas de velocidad del punch-in (en la pantalla, no en el mundo)
const Velocidad: React.FC<{t: number; c: P; fuerza: number}> = ({t, c, fuerza}) => {
  if (fuerza <= 0.02) return null;
  const r = rng(900 + Math.floor(t * 15)); // se redibujan a 15 por segundo, como en la tele
  const out: React.ReactNode[] = [];
  const N = 100;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU + (r() - 0.5) * 0.05;
    const r0 = 300 + r() * 240 + (1 - fuerza) * 500;
    const w = 3 + r() * 13;
    const blanca = r() < 0.14;
    if (r() < 0.2) continue;
    const ux = Math.cos(a), uy = Math.sin(a);
    const x0 = c[0] + ux * r0, y0 = c[1] + uy * r0 * 1.3;
    const x1 = c[0] + ux * 1900, y1 = c[1] + uy * 1900 * 1.3;
    out.push(
      <path key={i} d={`M ${f1(x0)} ${f1(y0)} L ${f1(x1 - uy * w)} ${f1(y1 + ux * w)} L ${f1(x1 + uy * w)} ${f1(y1 - ux * w)} Z`}
        fill={blanca ? '#FFFFFF' : '#2A1626'} opacity={blanca ? 0.85 : 0.88} />,
    );
  }
  return <g opacity={Math.min(1, fuerza * 1.4)}>{out}</g>;
};

// ---------------------------------------------------------------- la taza en cel, con su corazón y su brillo duro
const TazaAnime: React.FC<{c: P; ang: number; id: string}> = ({c, ang, id}) => {
  const pz = piezasTaza({c, ang});
  return (
    <g>
      <Cel id={id} ds={[poli(pz.asa), poli(pz.cuerpo)]} tinta={TAZA} grosor={2.8} s={11} h={4} />
      <g transform={`translate(${f1(c[0])} ${f1(c[1])}) rotate(${((ang * 180) / Math.PI).toFixed(2)})`}>
        <path d="M -52 -59 H 52 V -49 H -52 Z" fill="#FF8B78" />
        <path d="M -52 -50 H 52" stroke="#43121E" strokeWidth={1.6} opacity={0.6} />
        <g transform="translate(4 8)"><path d={corazon(46)} fill="#FFFFFF" /></g>
        <path d={'M -39 -40 Q -42 -10 -38 22'} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" opacity={0.9} />
      </g>
    </g>
  );
};

// las líneas de movimiento de la taza al caer (detrás de ella, en la dirección contraria a la que va)
const LineasCaida: React.FC<{t: number}> = ({t}) => {
  if (t < T_CAE + 0.03 || t >= T_SUELO) return null;
  const a = taza(t).c, b = taza(t - 0.04).c;
  const v = resta(a, b);
  const vel = Math.hypot(v[0], v[1]) / 0.04;
  const u = norma(v), n: P = [-u[1], u[0]];
  const largo = 50 + clamp(vel / 1700) * 260;
  const r = rng(300 + Math.floor(t * 15));
  const lineas = [-2, -1, 0, 1, 2].map((k) => {
    const off = k * 26 + (r() - 0.5) * 12;
    const s0 = suma(suma(a, por(u, -62 - Math.abs(k) * 12)), por(n, off));
    const s1 = suma(s0, por(u, -largo * (1 - Math.abs(k) * 0.2)));
    return {s0, s1, k};
  });
  return (
    <g strokeLinecap="round" opacity={clamp((t - T_CAE - 0.03) / 0.06)}>
      {lineas.map(({s0, s1, k}) => (
        <line key={k} x1={s0[0]} y1={s0[1]} x2={s1[0]} y2={s1[1]} stroke={k === 0 || k === 2 ? '#FFFFFF' : '#3A2340'} strokeWidth={k === 0 ? 7 : 4} opacity={0.9} />
      ))}
    </g>
  );
};

// la estela: una cinta blanca que sigue la trayectoria de la taza al caer (el «smear» de la tele)
const Estela: React.FC<{t: number}> = ({t}) => {
  if (t < T_CAE + 0.06 || t >= T_SUELO + 0.03) return null;
  const pts: P[] = [];
  for (let k = 0; k <= 14; k++) {
    const s = clamp(t - k * 0.012, T_CAE, T_SUELO - 1e-4);
    const q = taza(s).c;
    if (!pts.length || Math.hypot(q[0] - pts[pts.length - 1][0], q[1] - pts[pts.length - 1][1]) > 3) pts.push(q);
  }
  if (pts.length < 3) return null;
  const r = pts.map((_, i) => mix(46, 3, i / (pts.length - 1)));
  const izq: P[] = [], der: P[] = [];
  pts.forEach((q, i) => {
    const u = norma(resta(pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]));
    const n: P = [-u[1], u[0]];
    izq.push(suma(q, por(n, r[i])));
    der.push(suma(q, por(n, -r[i])));
  });
  const vive = t < T_SUELO ? 1 : 1 - p(t, T_SUELO, 0.03);
  return (
    <g opacity={vive}>
      <path d={curva([...izq, ...der.reverse()], true)} fill="#FF7A66" opacity={0.42} />
      <path d={curva(pts.slice(0, Math.ceil(pts.length * 0.8)))} fill="none" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" opacity={0.85} />
    </g>
  );
};

// los toquecitos: tres rayitas donde la pata toca la taza
const Toque: React.FC<{t: number; t0: number; c: P}> = ({t, t0, c}) => {
  const k = p(t, t0, 0.18);
  if (k <= 0 || k >= 1) return null;
  return (
    <g stroke={LINEA} strokeWidth={4} strokeLinecap="round" opacity={1 - k}>
      {[-128, -95, -62].map((a) => {
        const ar = (a * Math.PI) / 180, r0 = 20 + 12 * k, r1 = r0 + 20;
        return <line key={a} x1={c[0] + Math.cos(ar) * r0} y1={c[1] + Math.sin(ar) * r0} x2={c[0] + Math.cos(ar) * r1} y2={c[1] + Math.sin(ar) * r1} />;
      })}
    </g>
  );
};

// la estrella dentada del golpe
const estrellaGolpe = (r: number, n = 13, semilla = 3) => {
  const rr = rng(semilla);
  const pts: P[] = [];
  for (let i = 0; i < 2 * n; i++) {
    const a = (i / (2 * n)) * TAU - Math.PI / 2;
    const R = i % 2 ? r * 0.42 : r * (0.72 + rr() * 0.55);
    pts.push([Math.cos(a) * R, Math.sin(a) * R * 0.66]);
  }
  return poli(pts);
};

// la nota musical de cuando está contento (dibujada: la letra no la trae)
const nota = 'M -10 8 a 11 8 -20 1 0 22 -4 V -34 L 22 -26 V -16 L 12 -22 V 4 Z';

export const Anime: React.FC<{t: number}> = ({t: tt}) => {
  const pre = 'ga' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const t = clamp(tt, 0, DUR);
  const g = gato(t);
  const tz = taza(t);
  const cf = cafe(t);
  const tr = trozos(t);
  const vp = vapor(t);
  const ge = gesto(t, g.giro);

  // la cámara: se mete a su cara de golpe y vuelve; con el golpe, tiembla
  const zIda = E.outCubic(p(t, Z0, Z_IDA));
  const zVuelta = 1 - E.inOutCubic(p(t, Z1, Z_VUELTA));
  const z = t >= Z0 && t < Z1 + Z_VUELTA ? Math.min(zIda, zVuelta) : 0;
  const esc = 1 + Z_ESC * z;
  const M: P = [mix(H0[0], M_CARA[0], z), mix(H0[1], M_CARA[1], z)];
  const [sx, sy] = temblor(t, T_SUELO, 0.45, 20, 5);
  const camara = `translate(${f1(M[0] + sx)} ${f1(M[1] + sy)}) scale(${esc.toFixed(4)}) translate(${f1(-H0[0])} ${f1(-H0[1])})`;
  const deshaz = `translate(${f1(H0[0])} ${f1(H0[1])}) scale(${(1 / esc).toFixed(5)}) translate(${f1(-M[0] - sx)} ${f1(-M[1] - sy)})`;
  // un empujón de cámara con el golpe, hacia donde cae
  const kGolpe = t >= T_SUELO ? (1 - p(t, T_SUELO, 0.3)) ** 2 : 0;
  const golpe = kGolpe > 0 ? `translate(${IMPACTO[0]} ${SUELO}) scale(${(1 + 0.07 * kGolpe).toFixed(4)}) translate(${-IMPACTO[0]} ${-SUELO})` : undefined;

  // dónde está cada cosa de la cara en el mundo
  const Hw = enMundo(g.cabeza.c);
  const enCab = (q: P): P => enMundo(suma(g.cabeza.c, rot(q, g.inclina)));
  const ojo = enMundo(g.ojoCerca.c);

  // los destellos: el de «lo voy a hacer» (0,64 s) y el del empujón (2,42 s), en el ojo
  const kira = (t0: number, r: number) => {
    const k = p(t, t0, 0.32);
    if (k <= 0 || k >= 1) return null;
    const s = Math.sin(Math.PI * k) ** 0.7;
    // en el rabillo del ojo de este lado (de frente, el de la izquierda)
    return <Destello x={ojo[0] - 30} y={ojo[1] - 12} r={r * s} giro={k * 90} />;
  };

  const impacto = t >= T_SUELO && t < T_SUELO + T_IMP;
  const kCrash = p(t, T_SUELO, 0.22);
  const crashFuera = p(t, 3.68, 0.16);
  const crashTiembla = t < 3.5 ? (Math.floor(t * 30) % 2 ? 2.5 : -2.5) : 0;
  const kSusto = p(t, T_SUELO + 0.02, 0.14);
  const fueraSusto = 1 - p(t, SUSTO[1] + 0.1, 0.14);
  const gota = enCab([-128, -2]);
  const signo = suma(Hw, [140, -230]);
  const centroSusto = enCab([0, -60]);
  const kFeliz = p(t, 4.4, 0.2) * (1 - p(t, 5.05, 0.2));

  // el café en arco, por tramos seguidos: cada tramo es una cinta que adelgaza con el radio de sus gotas
  const chorro = cf.gotas.filter((d) => d.i < 100);
  const tramos: (typeof chorro)[] = [];
  chorro.forEach((d, i) => {
    if (i === 0 || Math.hypot(d.c[0] - chorro[i - 1].c[0], d.c[1] - chorro[i - 1].c[1]) > 90) tramos.push([]);
    tramos[tramos.length - 1].push(d);
  });

  // la sombra de la taza: en la mesa, y al caer, la del suelo que crece
  const kSombra = tz.estado === 'cae' ? clamp((tz.c[1] - MESA_Y) / (SUELO - MESA_Y)) : 0;

  const escena = (sil = false) => {
    const q = sil ? pre + 'x' : pre;
    return (
      <g>
        <Mesa pre={q} />
        <g transform={TRANSFORMA_GATO}>
          <GatoAnime g={g} t={t} pre={q + 'g'} gesto={ge} />
        </g>
      </g>
    );
  };

  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id={pre + 'tarde'} cx={1} cy={0.12} r={0.9}>
          <stop offset={0} stopColor="#FFC67A" stopOpacity={0.22} />
          <stop offset={1} stopColor="#FFC67A" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={pre + 'vineta'} cx={0.5} cy={0.5} r={0.75}>
          <stop offset={0.62} stopColor="#4A2410" stopOpacity={0} />
          <stop offset={1} stopColor="#4A2410" stopOpacity={0.28} />
        </radialGradient>
        <filter id={pre + 'sil'} x="-5%" y="-5%" width="110%" height="110%">
          <feFlood floodColor="#1E0F24" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
      </defs>
      <rect width={1080} height={1920} fill="#F3DDBB" />

      <g transform={golpe}>
        <g transform={camara}>
          <Cocina t={t} pre={pre + 'k'} />
          {/* las líneas de velocidad, fijas a la pantalla y por detrás de él: la silueta queda limpia */}
          <g transform={deshaz}><Velocidad t={t} c={[M[0] + sx, M[1] + sy]} fuerza={z} /></g>

          {/* en el suelo: la sombra de la taza que cae, las manchas y el charco */}
          {kSombra > 0 && <ellipse cx={tz.c[0]} cy={SUELO + 4} rx={18 + 46 * kSombra} ry={4 + 6 * kSombra} fill="#4A230E" opacity={0.1 + 0.3 * kSombra} />}
          {cf.charco && (
            <g>
              <ellipse cx={cf.charco.c[0]} cy={cf.charco.c[1]} rx={cf.charco.rx + 3} ry={cf.charco.ry + 3} fill={CAFE_LINEA} />
              <ellipse cx={cf.charco.c[0]} cy={cf.charco.c[1]} rx={cf.charco.rx} ry={cf.charco.ry} fill={CAFE} />
              <ellipse cx={cf.charco.c[0] + cf.charco.rx * 0.12} cy={cf.charco.c[1] - cf.charco.ry * 0.3} rx={cf.charco.rx * 0.62} ry={cf.charco.ry * 0.38} fill={CAFE_LUZ} />
              <ellipse cx={cf.charco.c[0] + cf.charco.rx * 0.32} cy={cf.charco.c[1] - cf.charco.ry * 0.38} rx={cf.charco.rx * 0.14} ry={cf.charco.ry * 0.16} fill="#FFFFFF" opacity={0.85} />
            </g>
          )}
          {cf.manchas.map((s) => (
            <ellipse key={s.i} cx={s.c[0]} cy={s.c[1] + 2} rx={s.rx} ry={s.ry} fill={CAFE} stroke={CAFE_LINEA} strokeWidth={1.6} />
          ))}

          {/* la mesa y el gato */}
          {tz.estado === 'mesa' && <ellipse cx={tz.c[0] + 4} cy={MESA_Y - 3} rx={50} ry={5} fill="#4A230E" opacity={0.3} />}
          {escena()}

          {/* el vapor: hilos blancos que se rizan */}
          {vp.map((h, i) => (
            <g key={i} opacity={h.alfa}>
              <path d={curva(h.pts)} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.35} />
              <path d={curva(h.pts.slice(0, 11))} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
            </g>
          ))}

          {/* la taza, entera mientras no llega al suelo, con sus líneas de movimiento al caer */}
          <Estela t={t} />
          <LineasCaida t={t} />
          {tz.estado !== 'suelo' && <TazaAnime c={tz.c} ang={tz.ang} id={pre + 'tz'} />}
          <Toque t={t} t0={1.4} c={[tz.c[0] - 58, tz.c[1] - 50]} />
          <Toque t={t} t0={1.78} c={[tz.c[0] - 58, tz.c[1] - 50]} />
          <Toque t={t} t0={2.4} c={[tz.c[0] - 58, tz.c[1] - 50]} />

          {/* el café: el chorro en arco y las gotas, como UN líquido (primero todo el contorno, después todo el color, después la luz) */}
          {cf.gotas.length > 0 && (() => {
            // la línea del chorro, suavizada (las gotas de la escena salen con un poco de azar de lado y harían una ramita)
            const suave = (q: typeof chorro): P[] => {
              let pts = q.map((d) => d.c);
              for (let vuelta = 0; vuelta < 3; vuelta++) {
                pts = pts.map((c, i) => (i === 0 || i === pts.length - 1 ? c : [(pts[i - 1][0] + 2 * c[0] + pts[i + 1][0]) / 4, (pts[i - 1][1] + 2 * c[1] + pts[i + 1][1]) / 4]));
              }
              return pts;
            };
            // cada tramo: la lámina que sale ancha de la boca (lo más nuevo) y, más lejos, se rompe en gotas sueltas (una de cada
            // dos, para que no se toquen); rota la taza, ya solo gotas
            const enTaza = t < T_SUELO;
            const lineas: {pts: P[]; r: number[]}[] = [];
            const sueltas: typeof chorro = [];
            tramos.forEach((q) => {
              const corte = enTaza && q.length > 4 ? Math.floor(q.length * 0.5) : q.length;
              q.slice(0, corte).forEach((d, i) => { if ((corte - i) % 2 === 1) sueltas.push(d); });
              const lam = q.slice(Math.max(0, corte - 1));
              if (lam.length > 2) lineas.push({pts: suave(lam), r: lam.map((_, i) => mix(4, 15, (i / (lam.length - 1)) ** 0.8))});
            });
            sueltas.push(...cf.gotas.filter((d) => d.i >= 100));
            const largos = lineas.map((l) => cinta(l.pts, l.r));
            const capa = (color: string, extra: number) => (
              <g>
                {largos.map((d, i) => <path key={'c' + i} d={d} fill={color} stroke={color} strokeWidth={extra * 2} strokeLinejoin="round" />)}
                {sueltas.map((d) => <circle key={d.i} cx={d.c[0]} cy={d.c[1]} r={clamp(d.r * 0.62, 4, 11) + extra} fill={color} />)}
              </g>
            );
            return (
              <g>
                {capa(CAFE_LINEA, 3)}
                {capa(CAFE, 0)}
                {lineas.map((l, i) => (
                  <path key={'l' + i} d={curva(l.pts.slice(1, -1))} fill="none" stroke={CAFE_LUZ} strokeWidth={3.5} strokeLinecap="round" transform="translate(3 -2)" />
                ))}
                {sueltas.filter((d) => d.r > 8).map((d) => <circle key={'b' + d.i} cx={d.c[0] + d.r * 0.16} cy={d.c[1] - d.r * 0.2} r={d.r * 0.15} fill="#FFFFFF" opacity={0.85} />)}
              </g>
            );
          })()}

          {/* el golpe: la onda en el suelo, la estrella, las rayas y el polvo */}
          {t >= T_SUELO && t < T_SUELO + 0.5 && (() => {
            const k = p(t, T_SUELO, 0.42);
            const kE = p(t, T_SUELO, 0.26);
            const rE = 150 * E.outBack(clamp(kE * 3)) * (1 - E.inCubic(kE));
            const r = rng(12);
            return (
              <g>
                <ellipse cx={IMPACTO[0]} cy={SUELO - 2} rx={60 + 420 * E.outCubic(k)} ry={(60 + 420 * E.outCubic(k)) * 0.15} fill="none" stroke="#FFFFFF" strokeWidth={12 * (1 - k)} opacity={1 - k * 0.6} />
                {rE > 1 && (
                  <g transform={`translate(${IMPACTO[0]} ${SUELO - 26})`}>
                    <path d={estrellaGolpe(rE)} fill="#FFE04A" stroke="#3A1420" strokeWidth={4} strokeLinejoin="round" />
                    <path d={estrellaGolpe(rE * 0.6, 13, 9)} fill="#FFFFFF" />
                  </g>
                )}
                {Array.from({length: 11}, (_, i) => {
                  const a = ((192 + i * 15.6) * Math.PI) / 180;
                  const r1 = 90 + 160 * E.outCubic(k), r2 = r1 + 70 * (1 - k) + 14;
                  return <line key={i} x1={IMPACTO[0] + Math.cos(a) * r1} y1={SUELO - 20 + Math.sin(a) * r1 * 0.85} x2={IMPACTO[0] + Math.cos(a) * r2}
                    y2={SUELO - 20 + Math.sin(a) * r2 * 0.85} stroke={LINEA} strokeWidth={6} strokeLinecap="round" opacity={1 - k * k} />;
                })}
                {Array.from({length: 7}, (_, i) => {
                  const lado = i % 2 ? 1 : -1;
                  const x = IMPACTO[0] + lado * (40 + i * 26 + r() * 20) * (0.5 + 0.5 * E.outCubic(k));
                  const y = SUELO - 14 - r() * 18 - 30 * E.outCubic(k);
                  return <circle key={'p' + i} cx={x} cy={y} r={(12 + r() * 14) * (0.4 + 0.9 * E.outCubic(k))} fill="#FFF3E0" stroke="#C9996C" strokeWidth={2} opacity={(1 - k) * 0.9} />;
                })}
              </g>
            );
          })()}

          {/* los trozos de la taza, en cel */}
          {tr.map((q) => <Cel key={q.n} id={`${pre}tr${q.n}`} ds={[poli(q.pts)]} tinta={TAZA} grosor={2.6} s={7} h={3} L={girar(LUZ, 0)} />)}

          {/* los destellos: lo decide (0,64 s) y lo hace (2,42 s) */}
          {kira(0.62, 20)}
          {kira(2.4, 30)}
          {t >= 2.38 && t < 2.9 && [[-170, -110, 22, 2.4], [178, -40, 26, 2.45], [150, 120, 16, 2.5], [-140, 90, 14, 2.55]].map(([dx, dy, r, t0], i) => {
            const k = p(t, t0, 0.32);
            return k > 0 && k < 1 ? <Destello key={i} x={H0[0] + dx} y={H0[1] + dy} r={r * Math.sin(Math.PI * k)} giro={t * 120 + i * 30} /> : null;
          })}

          {/* el susto: las rayitas, la gota de sudor y el «!?» */}
          {t >= T_SUELO && t < SUSTO[1] + 0.25 && (
            <g opacity={fueraSusto}>
              {[-138, -100, -62].map((a, i) => {
                const ar = (a * Math.PI) / 180, r0 = 120, r1 = 120 + 44 * E.outBack(kSusto);
                const bx = Math.floor(t * 30) % 2 ? 1.5 : -1.5;
                return <line key={i} x1={centroSusto[0] + Math.cos(ar) * r0 + bx} y1={centroSusto[1] + Math.sin(ar) * r0} x2={centroSusto[0] + Math.cos(ar) * r1 + bx} y2={centroSusto[1] + Math.sin(ar) * r1}
                  stroke={LINEA} strokeWidth={7} strokeLinecap="round" />;
              })}
              <g transform={`translate(${f1(gota[0])} ${f1(gota[1] + 20 * p(t, T_SUELO + 0.1, 0.6))}) scale(${(1.4 * E.outBack(p(t, T_SUELO + 0.04, 0.15))).toFixed(3)})`}>
                <path d="M 0 -22 C 7 -8 14 2 14 10 C 14 18 7 24 0 24 C -7 24 -14 18 -14 10 C -14 2 -7 -8 0 -22 Z" fill="#A9DCFF" stroke="#24527F" strokeWidth={2.8} />
                <path d="M 0 2 C 6 6 8 12 6 18 C 10 14 10 6 0 2 Z" fill="#6FB6EE" />
                <ellipse cx={-5} cy={8} rx={3} ry={5} fill="#FFFFFF" />
              </g>
              <g transform={`translate(${f1(signo[0])} ${f1(signo[1])}) rotate(12) scale(${E.outBack(p(t, T_SUELO + 0.04, 0.16)).toFixed(3)})`}>
                <text x={0} y={0} textAnchor="middle" fontFamily={POP} fontSize={118} fill="#F23B30" stroke="#3A0E10" strokeWidth={10} strokeLinejoin="round" paintOrder="stroke">!?</text>
              </g>
            </g>
          )}

          {/* contento: destellos alrededor de la cabeza y una nota */}
          {kFeliz > 0 && [[-150, -60, 18], [150, -120, 22], [170, 20, 14], [-120, 60, 12]].map(([dx, dy, r], i) => (
            <Destello key={i} x={Hw[0] + dx} y={Hw[1] + dy} r={r * kFeliz * (0.75 + 0.25 * Math.sin(t * 14 + i * 2))} giro={t * 40 + i * 20} />
          ))}
          {kFeliz > 0 && (
            <g transform={`translate(${f1(Hw[0] + 150 + 10 * Math.sin(t * 6))} ${f1(Hw[1] - 190 - 40 * p(t, 4.4, 0.8))}) rotate(${(10 * Math.sin(t * 7)).toFixed(1)}) scale(${(1.5 * kFeliz).toFixed(3)})`}>
              <path d={nota} fill="#FF6F91" stroke="#3A0E1E" strokeWidth={3} strokeLinejoin="round" />
            </g>
          )}

          {/* «¡CRASH!» */}
          {t >= T_SUELO && crashFuera < 1 && (
            <g transform={`translate(${560 + crashTiembla} ${1336}) rotate(-9) scale(${(E.outBack(clamp(kCrash * 1.6)) * (1 - 0.3 * crashFuera)).toFixed(3)})`} opacity={1 - crashFuera}>
              <text x={0} y={0} textAnchor="middle" fontFamily={POP} fontSize={150} fill="#FFDD3C" stroke="#E0303A" strokeWidth={30} strokeLinejoin="round" paintOrder="stroke">¡CRASH!</text>
              <text x={0} y={0} textAnchor="middle" fontFamily={POP} fontSize={150} fill="#FFDD3C" stroke="#2A0E18" strokeWidth={12} strokeLinejoin="round" paintOrder="stroke">¡CRASH!</text>
            </g>
          )}
        </g>
      </g>

      {/* el fogonazo de un instante, al meterse la cámara */}
      {t >= Z0 && t < Z0 + 0.08 && <rect width={1080} height={1920} fill="#FFFFFF" opacity={0.6 * (1 - p(t, Z0, 0.08))} />}

      {/* EL FOTOGRAMA DE IMPACTO: fondo rojo plano, rayos blancos, las siluetas en negro y el «¡CRASH!» */}
      {impacto && (
        <g>
          <rect width={1080} height={1920} fill="#FF4A34" />
          {Array.from({length: 44}, (_, i) => {
            const r = rng(70 + i);
            const a = (i / 44) * TAU + (r() - 0.5) * 0.08;
            const w = 6 + r() * 26;
            const c: P = [IMPACTO[0], SUELO - 30];
            const r0 = 60 + r() * 60;
            const ux = Math.cos(a), uy = Math.sin(a);
            return <path key={i} d={`M ${f1(c[0] + ux * r0)} ${f1(c[1] + uy * r0)} L ${f1(c[0] + ux * 2400 - uy * w)} ${f1(c[1] + uy * 2400 + ux * w)} L ${f1(c[0] + ux * 2400 + uy * w)} ${f1(c[1] + uy * 2400 - ux * w)} Z`} fill="#FFFFFF" opacity={0.92} />;
          })}
          <g filter={`url(#${pre}sil)`}>
            <g transform={camara}>{escena(true)}</g>
          </g>
          {/* en la silueta, solo los ojos como platos, en blanco */}
          <g transform={camara}>
            <g transform={TRANSFORMA_GATO}>
              {[g.ojoLejos, g.ojoCerca].map((o, i) => (
                <g key={i}>
                  <path d={poli(o.visible)} fill="#FFFFFF" transform={`translate(${f1(o.c[0])} ${f1(o.c[1])}) scale(1.37) translate(${f1(-o.c[0])} ${f1(-o.c[1])})`} />
                  <circle cx={o.pupila.c[0]} cy={o.pupila.c[1]} r={o.rx * 0.24} fill="#1E0F24" />
                </g>
              ))}
            </g>
          </g>
          <g transform={camara}>
            <g transform={`translate(${IMPACTO[0]} ${SUELO - 26})`}><path d={estrellaGolpe(170)} fill="#FFFFFF" /></g>
            {tr.map((q) => <path key={q.n} d={poli(q.pts)} fill="#1E0F24" />)}
            <g transform="translate(560 1336) rotate(-9)">
              <text x={0} y={0} textAnchor="middle" fontFamily={POP} fontSize={150} fill="#FFFFFF" stroke="#1E0F24" strokeWidth={14} strokeLinejoin="round" paintOrder="stroke">¡CRASH!</text>
            </g>
          </g>
        </g>
      )}

      {/* la luz de la tarde y la viñeta suave */}
      <rect width={1080} height={1920} fill={`url(#${pre}tarde)`} />
      <rect width={1080} height={1920} fill={`url(#${pre}vineta)`} />
    </svg>
  );
};
