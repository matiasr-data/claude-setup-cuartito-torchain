import React from 'react';
import {loadFont as cargarArquitecto} from '@remotion/google-fonts/ArchitectsDaughter';
import {loadFont as cargarB612} from '@remotion/google-fonts/B612';
import {E, clamp, kf, p, ruido, temblor} from '../../comun/curvas';
import {
  BORDE, DUR, IMPACTO, MESA_G, MESA_Y, PX_M, SUELO, TRANSFORMA_GATO, T_CAE, T_REAL, T_SUELO, arcoElipse, enMundo, bigote, cabezaTrazos, cafe, cinta, cuerpoTrazos,
  curva, elipse, gato, oreja, pataTrazos, piezasTaza, poli, rot, suma, taza, trozos, vapor, type Gato, type P, type Pata,
} from './escena';

// EL GATO EN 5 · PLANO AZUL.
// Líneas blancas sobre papel de cianotipia, cuatro grosores, ejes de raya y punto, lo de detrás en trazos, cotas que miden en vivo,
// globos con letra y número, la cartela abajo y letra de delineante. El humor es el del ingeniero que documenta muy en serio a un
// gato tirando una taza: la mirada a cámara marcada con ⊙ (un vector que sale del plano), la distancia al borde que baja, la
// TRAYECTORIA PREVISTA dibujada antes de que caiga, la caída en estroboscopia (la taza cada 0,1 s), g y el tiempo de caída en vivo,
// el despiece numerado y UN color más, una sola vez: el sello rojo «ROTA».

const {fontFamily: MANO} = cargarArquitecto();
const {fontFamily: TECNICA} = cargarB612('normal', {weights: ['400', '700'], subsets: ['latin']});

const LINEA = '#E7F0F9';
const PAPEL = '#1F4590';
const SELLO = '#E0483E';
const W = {contorno: 3.4, detalle: 2.1, fina: 1.35, pelo: 1};
const EJE = '28 7 5 7';
const OCULTA = '10 7';
const FANTASMA = '30 7 6 7 6 7';
const T_SELLO = T_SUELO + 0.28;

const m = (n: number) => n.toFixed(2).replace('.', ',');
const escribe = (txt: string, t: number, t0: number, dur = 0.35) => txt.slice(0, Math.ceil(txt.length * clamp((t - t0) / dur)));

// un trazo que se dibuja solo (k de 0 a 1) y, ya dibujado, con su tipo de línea
const T: React.FC<{d: string; w: number; k?: number; dash?: string; fill?: string; op?: number}> = ({d, w, k = 1, dash, fill = 'none', op = 1}) => {
  if (k <= 0) return null;
  const dib = k < 1;
  return (
    <path d={d} fill={fill} fillOpacity={fill === 'none' ? undefined : dib ? k : 1} stroke={LINEA} strokeWidth={w} opacity={op}
      pathLength={dib ? 1 : undefined} strokeDasharray={dib ? `${k} 2` : dash} strokeLinejoin="round" strokeLinecap="round" />
  );
};
// varias formas que se leen como UNA silueta: primero el contorno al doble de grueso, después el papel encima
const Union: React.FC<{ds: string[]; w: number; k: number}> = ({ds, w, k}) =>
  k <= 0 ? null : (
    <g>
      {ds.map((d, i) => <T key={'s' + i} d={d} w={w * 2} k={k} />)}
      {ds.map((d, i) => <path key={'f' + i} d={d} fill={PAPEL} opacity={clamp(k * 1.6)} />)}
    </g>
  );

const Cota: React.FC<{a: P; b: P; txt: string; vertical?: boolean; abajo?: boolean; tam?: number}> = ({a, b, txt, vertical, abajo, tam = 28}) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  const fl = Math.min(18, d / 2.5);
  const flecha = (q: P, s: number) =>
    `M ${q[0]} ${q[1]} L ${q[0] + s * (ux * fl - uy * 6)} ${q[1] + s * (uy * fl + ux * 6)} L ${q[0] + s * (ux * fl + uy * 6)} ${q[1] + s * (uy * fl - ux * 6)} Z`;
  const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
  return (
    <g>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={LINEA} strokeWidth={W.pelo + 0.3} />
      {d > 4 && <path d={flecha(a, 1)} fill={LINEA} />}
      {d > 4 && <path d={flecha(b, -1)} fill={LINEA} />}
      {vertical ? (
        <text x={cx - 14} y={cy} fontFamily={MANO} fontSize={tam} fill={LINEA} textAnchor="middle" transform={`rotate(-90 ${cx - 14} ${cy})`}>{txt}</text>
      ) : (
        <text x={cx} y={abajo ? cy + tam + 6 : cy - 14} fontFamily={MANO} fontSize={tam} fill={LINEA} textAnchor="middle">{txt}</text>
      )}
    </g>
  );
};

const Bisagra: React.FC<{c: P; r?: number}> = ({c, r = 8}) => (
  <g>
    <circle cx={c[0]} cy={c[1]} r={r} fill={PAPEL} stroke={LINEA} strokeWidth={W.detalle} />
    <line x1={c[0] - r - 5} y1={c[1]} x2={c[0] + r + 5} y2={c[1]} stroke={LINEA} strokeWidth={W.pelo} />
    <line x1={c[0]} y1={c[1] - r - 5} x2={c[0]} y2={c[1] + r + 5} stroke={LINEA} strokeWidth={W.pelo} />
  </g>
);

const Globo: React.FC<{c: P; txt: string; r?: number; k?: number}> = ({c, txt, r = 24, k = 1}) =>
  k <= 0 ? null : (
    <g opacity={clamp(k * 2)}>
      <circle cx={c[0]} cy={c[1]} r={r} fill={PAPEL} stroke={LINEA} strokeWidth={W.detalle} />
      <text x={c[0]} y={c[1] + r * 0.4} fontFamily={MANO} fontSize={r * 1.15} fill={LINEA} textAnchor="middle">{txt}</text>
    </g>
  );

// ⊙: un vector que sale del plano, hacia quien mira (así marca un ingeniero «mira a cámara»)
const Fuera: React.FC<{c: P; r?: number}> = ({c, r = 13}) => (
  <g>
    <circle cx={c[0]} cy={c[1]} r={r} fill="none" stroke={LINEA} strokeWidth={W.detalle} />
    <circle cx={c[0]} cy={c[1]} r={r * 0.3} fill={LINEA} />
  </g>
);

// la taza: el asa, el cuerpo con su papel, el borde, el nivel del café (que queda detrás, en trazos) y su eje
const DibujoTaza: React.FC<{c: P; ang: number; k: number; fantasma?: boolean}> = ({c, ang, k, fantasma}) => {
  const pz = piezasTaza({c, ang});
  if (fantasma) {
    return (
      <g opacity={0.75}>
        <T d={poli(pz.asaFuera, false)} w={W.fina} dash={OCULTA} />
        <T d={poli(pz.cuerpo)} w={W.fina} dash={OCULTA} />
      </g>
    );
  }
  return (
    <g>
      <T d={poli(pz.asa)} w={W.contorno} k={k} fill={PAPEL} />
      <T d={poli(pz.cuerpo)} w={W.contorno} k={k} fill={PAPEL} />
      <T d={poli([...pz.cafe], false)} w={W.fina} k={k} dash={OCULTA} />
      <T d={poli([...pz.eje], false)} w={W.pelo} k={k} dash={EJE} op={0.9} />
    </g>
  );
};

const Pie: React.FC<{pt: Pata; k: number}> = ({pt, k}) => {
  // dos rayitas de dedos en la punta de la pata
  const {c, rx, ang} = pt.pie;
  const d = [0.35, 0.68].map((s) => {
    const a = suma(c, rot([rx * s, -6], ang)), b = suma(c, rot([rx * s, 9], ang));
    return `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`;
  }).join(' ');
  return <T d={d} w={W.fina} k={k} />;
};

const DibujoGato: React.FC<{g: Gato; t: number; k: number}> = ({g, t, k}) => {
  const lame = t > 4.95;
  const cuerpo = cuerpoTrazos(g);
  const kD = clamp((k - 0.35) / 0.65); // los detalles, después del contorno
  const muslo = curva(arcoElipse(g.cadera, -2.2, -0.35));
  const pechoPelo = [0, 1, 2].map((i) => {
    const a = suma(g.pecho.c, rot([g.pecho.rx * 0.55, 10 + i * 28], g.pecho.ang));
    const b = suma(g.pecho.c, rot([g.pecho.rx * 0.82, 22 + i * 28], g.pecho.ang));
    return `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`;
  }).join(' ');
  return (
    <g>
      {/* lo de detrás: la otra pata y la cola, con su eje */}
      <Union ds={pataTrazos(g.pataLejos)} w={W.detalle} k={k} />
      <Pie pt={g.pataLejos} k={kD} />
      <Union ds={[cinta(g.cola.pts, g.cola.r)]} w={W.contorno} k={k} />
      <T d={curva(g.cola.pts)} w={W.pelo} k={kD} dash={EJE} />
      {/* las orejas, detrás de la cabeza */}
      {[g.orejaLejos, g.orejaCerca].map((o, i) => (
        <g key={i}>
          <T d={oreja(o)} w={W.contorno} k={k} fill={PAPEL} />
          <T d={poli(o.dentro, false)} w={W.fina} k={kD} />
        </g>
      ))}
      {/* el cuerpo, de una pieza */}
      <Union ds={cuerpo} w={W.contorno} k={k} />
      <T d={muslo} w={W.detalle} k={kD} />
      <T d={pechoPelo} w={W.fina} k={kD} />
      {/* la pata de este lado, por delante del pecho (cuando se la lame, también delante de la cara) */}
      {!lame && <Union ds={pataTrazos(g.pataCerca)} w={W.contorno} k={k} />}
      {!lame && <Pie pt={g.pataCerca} k={kD} />}
      {/* la cabeza */}
      <Union ds={cabezaTrazos(g)} w={W.contorno} k={k} />
      {[g.ojoLejos, g.ojoCerca].map((o, i) =>
        o.cerrado ? (
          <T key={i} d={curva(o.arco)} w={W.detalle + 0.8} k={kD} />
        ) : (
          <g key={i}>
            <clipPath id={`pa-ojo${i}`}><path d={poli(o.visible)} /></clipPath>
            <T d={poli(o.visible)} w={W.detalle} k={kD} fill={PAPEL} />
            {kD > 0.5 && (
              <g clipPath={`url(#pa-ojo${i})`}>
                <path d={elipse(o.pupila)} fill={LINEA} />
                <circle cx={o.brillo[0]} cy={o.brillo[1]} r={5} fill={PAPEL} />
              </g>
            )}
          </g>
        ),
      )}
      {kD > 0.3 && <path d={poli(g.nariz)} fill={LINEA} stroke={LINEA} strokeWidth={2} strokeLinejoin="round" />}
      <T d={`M ${g.surco[0][0]} ${g.surco[0][1]} L ${g.surco[1][0]} ${g.surco[1][1]}`} w={W.fina} k={kD} />
      <T d={curva(g.boca)} w={W.fina + 0.3} k={kD} />
      {g.bigotes.map((b, i) => <T key={i} d={bigote(b)} w={W.pelo + 0.3} k={kD} />)}
      {/* la pata de este lado: delante de todo cuando se la lame */}
      {lame && <Union ds={pataTrazos(g.pataCerca)} w={W.contorno} k={k} />}
      {lame && <Pie pt={g.pataCerca} k={kD} />}
      {g.lengua && <T d={elipse(g.lengua)} w={W.detalle} fill={PAPEL} />}
      {/* sus articulaciones, como un mecanismo */}
      {kD >= 1 && !lame && [g.pataCerca.hombro, g.pataCerca.codo, g.pataCerca.mano].map((q, i) => <Bisagra key={i} c={q} r={i === 0 ? 9 : 7} />)}
      {kD >= 1 && <Bisagra c={g.cola.pts[3]} r={7} />}
    </g>
  );
};

// la aguja sube cuando trama, se pasa al empujar y, rota la taza, cae a INOCENTE con su rebote
const Intencion: React.FC<{t: number}> = ({t}) => {
  const k = E.outCubic(p(t, 0.35, 0.5));
  if (k <= 0) return null;
  const v = kf(t, [
    [0, 0.12], [0.45, 0.16], [0.66, 0.72, E.outBack], [1.0, 0.72], [1.2, 0.52], [1.34, 0.62, E.outBack], [1.7, 0.6], [1.82, 0.7, E.outBack],
    [2.2, 0.7], [2.42, 0.96, E.outBack], [2.7, 1.0], [2.8, 1.06, E.outCubic], [3.12, 1.03], [3.5, 0.03, E.outBack], [6, 0.03],
  ]) + 0.012 * ruido(t * 9, 4);
  const C: P = [900, 420], R = 84;
  const ang = (a: number) => ((200 + 140 * a) * Math.PI) / 180;
  const en = (a: number, r: number): P => [C[0] + Math.cos(ang(a)) * r, C[1] + Math.sin(ang(a)) * r];
  const [a0, a1] = [en(0, R), en(1, R)];
  const punta = en(v, R - 14);
  const estado = t < 0.6 ? 'EN REPOSO' : t < 3.3 ? 'TRAMANDO' : 'INOCENTE';
  return (
    <g>
      <T d={`M ${a0[0]} ${a0[1]} A ${R} ${R} 0 0 1 ${a1[0]} ${a1[1]}`} w={W.detalle} k={k} />
      {k >= 1 && Array.from({length: 11}, (_, i) => {
        const q0 = en(i / 10, R), q1 = en(i / 10, R - (i % 5 === 0 ? 18 : 10));
        return <line key={i} x1={q0[0]} y1={q0[1]} x2={q1[0]} y2={q1[1]} stroke={LINEA} strokeWidth={i % 5 === 0 ? W.detalle : W.pelo} />;
      })}
      {k >= 1 && <path d={`M ${en(0.8, R - 4)[0]} ${en(0.8, R - 4)[1]} A ${R - 4} ${R - 4} 0 0 1 ${en(1, R - 4)[0]} ${en(1, R - 4)[1]}`} fill="none" stroke={LINEA} strokeWidth={8} opacity={0.5} />}
      <g opacity={k}>
        <line x1={C[0]} y1={C[1]} x2={punta[0]} y2={punta[1]} stroke={LINEA} strokeWidth={W.contorno} strokeLinecap="round" />
        <Bisagra c={C} r={8} />
        <text x={a0[0] - 6} y={a0[1] + 30} fontFamily={MANO} fontSize={22} fill={LINEA} textAnchor="middle">0</text>
        <text x={a1[0] + 4} y={a1[1] + 30} fontFamily={MANO} fontSize={22} fill={LINEA} textAnchor="middle">MÁX</text>
        <text x={C[0]} y={C[1] + 48} fontFamily={TECNICA} fontWeight={700} fontSize={22} letterSpacing={2} fill={LINEA} textAnchor="middle">INTENCIÓN</text>
        <text x={C[0]} y={C[1] + 84} fontFamily={MANO} fontSize={30} fill={LINEA} textAnchor="middle">{estado}</text>
      </g>
    </g>
  );
};

export const PlanoAzul: React.FC<{t: number}> = ({t: tt}) => {
  const t = clamp(tt, 0, DUR);
  const g = gato(t);
  const tz = taza(t);
  const pzT = piezasTaza(tz);
  const cf = cafe(t);
  const tr = trozos(t);
  const vp = vapor(t);
  const [b1x, b1y] = temblor(t, T_SUELO, 0.3, 7, 3);
  const [b2x, b2y] = temblor(t, T_SELLO, 0.25, 5, 7);

  // se dibuja solo al empezar
  const kMesa = E.outCubic(p(t, 0.02, 0.55));
  const kGato = E.outCubic(p(t, 0.08, 0.75));
  const kTaza = E.outCubic(p(t, 0.18, 0.5));
  const kFondo = p(t, 0.3, 0.6);
  const kCota = p(t, 0.55, 0.45);

  // la trayectoria: la prevista (se traza antes de que caiga) y la de verdad, con la taza cada 0,1 s
  const prevista: P[] = [];
  for (let s = T_CAE; s <= T_SUELO + 1e-6; s += 0.4 / 24) prevista.push(taza(s).c);
  const kPrev = E.inOutCubic(p(t, 2.2, 0.38));
  const fantasmas = [0.1, 0.2, 0.3].filter((d) => t > T_CAE + d).map((d) => taza(T_CAE + d));
  const tCaida = clamp((t - T_CAE) / (T_SUELO - T_CAE)) * T_REAL;
  const angGrados = Math.round((tz.ang * 180) / Math.PI);

  // la nota que acompaña a su mirada
  const notas: [number, number, string, boolean][] = [
    [0.6, 1.04, 'MIRA A CÁMARA', true], [2.34, 2.84, 'OTRA VEZ A CÁMARA', true], [3.28, 4.1, 'NOTA: EL GATO LO SABÍA.', false],
    [4.3, 5.0, 'SATISFECHO', true], [5.16, 6.1, 'MANTENIMIENTO DE PATA', false],
  ];
  const nota = notas.find(([a, b]) => t >= a && t < b);
  const NX = 456, NY = 316;

  // la cota que baja hasta el borde
  const alBorde = Math.max(0, BORDE - tz.c[0]);
  const sello = p(t, T_SELLO, 0.12);

  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id="pa-manchas" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.006" numOctaves={4} seed={11} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.165  0 0 0 0 0.345  0 0 0 0 0.651  0.9 0 0 0 -0.32" />
        </filter>
        <filter id="pa-vetas" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0006 0.045" numOctaves={2} seed={4} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.75  0 0 0 0 0.85  0 0 0 0 0.98  0.9 0 0 0 -0.42" />
        </filter>
        <filter id="pa-motas" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={2} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.9  0 0 0 0 0.95  0 0 0 0 1  6 0 0 0 -4.6" />
        </filter>
        <filter id="pa-tinta" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves={1} seed={9} result="g" />
          <feDisplacementMap in="SourceGraphic" in2="g" scale={1.6} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={0.35} />
        </filter>
        <filter id="pa-sello" x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves={2} seed={5} result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.5" result="huecos" />
          <feComposite in="SourceGraphic" in2="huecos" operator="in" />
        </filter>
        <radialGradient id="pa-borde" cx="0.5" cy="0.5" r="0.72">
          <stop offset="0.7" stopColor="#CFE0F5" stopOpacity={0} />
          <stop offset="1" stopColor="#CFE0F5" stopOpacity={0.14} />
        </radialGradient>
        <pattern id="pa-cuadros" width={200} height={200} patternUnits="userSpaceOnUse">
          {[0, 40, 80, 120, 160].map((q) => (
            <g key={q}>
              <line x1={q} y1={0} x2={q} y2={200} stroke={LINEA} strokeOpacity={q === 0 ? 0.17 : 0.07} strokeWidth={1} />
              <line x1={0} y1={q} x2={200} y2={q} stroke={LINEA} strokeOpacity={q === 0 ? 0.17 : 0.07} strokeWidth={1} />
            </g>
          ))}
        </pattern>
        <pattern id="pa-trama" width={12} height={12} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={12} height={12} fill={PAPEL} />
          <line x1={0} y1={0} x2={0} y2={12} stroke={LINEA} strokeWidth={1.1} strokeOpacity={0.8} />
        </pattern>
        <pattern id="pa-liquido" width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <rect width={9} height={9} fill={PAPEL} />
          <line x1={0} y1={0} x2={0} y2={9} stroke={LINEA} strokeWidth={1.6} />
        </pattern>
        <pattern id="pa-tierra" width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={16} stroke={LINEA} strokeWidth={1.2} />
        </pattern>
      </defs>

      <g transform={`translate(${b1x + b2x} ${b1y + b2y})`}>
        {/* la hoja */}
        <rect x={-20} y={-20} width={1120} height={1960} fill="#18336B" />
        <rect width={1080} height={1920} filter="url(#pa-manchas)" opacity={0.55} />
        <rect width={1080} height={1920} filter="url(#pa-vetas)" opacity={0.18} />
        <rect width={1080} height={1920} filter="url(#pa-motas)" opacity={0.25} />
        <rect width={1080} height={1920} fill="url(#pa-cuadros)" />
        <rect width={1080} height={1920} fill="url(#pa-borde)" />
        <rect x={36} y={36} width={1008} height={1848} fill="none" stroke={LINEA} strokeWidth={W.detalle} />
        <rect x={48} y={48} width={984} height={1824} fill="none" stroke={LINEA} strokeWidth={W.pelo} />

        <g filter="url(#pa-tinta)">
          {/* la cabecera */}
          <text x={72} y={136} fontFamily={MANO} fontSize={46} fill={LINEA}>{escribe('FIG. 05', t, 0, 0.25)}</text>
          <text x={72} y={180} fontFamily={MANO} fontSize={29} fill={LINEA} opacity={0.92}>{escribe('EL GATO Y LA TAZA — ALZADO LATERAL', t, 0.1, 0.45)}</text>
          <T d="M 72 200 L 640 200" w={W.fina} k={kMesa} />

          {/* lo de detrás, en trazos: la ventana y el radiador */}
          <g opacity={kFondo}>
            <rect x={96} y={360} width={430} height={420} fill="none" stroke={LINEA} strokeWidth={W.fina} strokeDasharray={OCULTA} />
            <line x1={311} y1={360} x2={311} y2={780} stroke={LINEA} strokeWidth={W.pelo} strokeDasharray={OCULTA} />
            <line x1={96} y1={560} x2={526} y2={560} stroke={LINEA} strokeWidth={W.pelo} strokeDasharray={OCULTA} />
            <rect x={80} y={780} width={462} height={14} fill="none" stroke={LINEA} strokeWidth={W.fina} strokeDasharray={OCULTA} />
            <rect x={160} y={1236} width={270} height={232} rx={10} fill="none" stroke={LINEA} strokeWidth={W.fina} strokeDasharray={OCULTA} />
            {Array.from({length: 8}, (_, i) => (
              <line key={i} x1={184 + i * 32} y1={1250} x2={184 + i * 32} y2={1454} stroke={LINEA} strokeWidth={W.pelo} strokeDasharray={OCULTA} />
            ))}
            <text x={170} y={1226} fontFamily={MANO} fontSize={22} fill={LINEA} opacity={0.8}>RADIADOR (DETRÁS)</text>
          </g>

          {/* la mesa: tablero en sección, faldón, patas y la línea de rotura a la izquierda */}
          <T d={`M 70 ${MESA_Y} H ${BORDE} V ${MESA_Y + MESA_G} H 70`} w={W.contorno} k={kMesa} />
          {kMesa > 0.5 && <rect x={70} y={MESA_Y} width={BORDE - 70} height={MESA_G} fill="url(#pa-trama)" opacity={(kMesa - 0.5) * 2} />}
          <T d={`M 70 ${MESA_Y} H ${BORDE} V ${MESA_Y + MESA_G} H 70`} w={W.contorno} k={kMesa >= 1 ? 1 : 0} />
          <T d={`M 70 ${MESA_Y - 12} L 70 ${MESA_Y + 6} L 58 ${MESA_Y + 14} L 82 ${MESA_Y + 26} L 70 ${MESA_Y + 34} L 70 ${MESA_Y + MESA_G + 12}`} w={W.fina} k={kMesa} />
          <T d={`M 136 ${MESA_Y + MESA_G} V ${MESA_Y + 72} H 652 V ${MESA_Y + MESA_G}`} w={W.detalle} k={kMesa} />
          <T d={`M 110 ${MESA_Y + MESA_G} V ${SUELO} M 136 ${MESA_Y + MESA_G} V ${SUELO}`} w={W.contorno} k={kMesa} />
          <T d={`M 652 ${MESA_Y + MESA_G} V ${SUELO} M 678 ${MESA_Y + MESA_G} V ${SUELO}`} w={W.contorno} k={kMesa} />

          {/* el suelo */}
          {kMesa > 0 && <rect x={48} y={SUELO} width={984} height={30} fill="url(#pa-tierra)" opacity={0.7 * kMesa} />}
          <T d={`M 48 ${SUELO} H 1032`} w={W.contorno} k={kMesa} />

          {/* el comedero, vacío (el motivo) */}
          <T d={`M 428 ${SUELO} L 440 ${SUELO - 38} L 552 ${SUELO - 38} L 564 ${SUELO} Z`} w={W.contorno} k={kMesa} fill={PAPEL} />
          <T d={`M 446 ${SUELO - 26} H 546`} w={W.pelo} k={kCota} dash={OCULTA} />
          {kCota > 0 && (
            <g opacity={kCota}>
              <line x1={428} y1={SUELO - 30} x2={330} y2={SUELO - 70} stroke={LINEA} strokeWidth={W.pelo} />
              <Globo c={[306, SUELO - 80]} txt="C" r={22} />
              <text x={110} y={SUELO - 118} fontFamily={MANO} fontSize={25} fill={LINEA}>COMEDERO (VACÍO)</text>
            </g>
          )}

          {/* la trayectoria prevista: el gato ya la tenía calculada */}
          {kPrev > 0 && t < T_SUELO + 2.9 && (
            <g>
              <path d={curva(prevista)} fill="none" stroke={LINEA} strokeWidth={W.fina} pathLength={kPrev < 1 ? 1 : undefined}
                strokeDasharray={kPrev < 1 ? `${kPrev} 2` : FANTASMA} />
              <text x={862} y={936} fontFamily={MANO} fontSize={24} fill={LINEA}>{escribe('TRAYECTORIA', t, 2.36, 0.25)}</text>
              <text x={862} y={966} fontFamily={MANO} fontSize={24} fill={LINEA}>{escribe('PREVISTA', t, 2.48, 0.2)}</text>
              <line x1={856} y1={958} x2={prevista[5][0] + 14} y2={prevista[5][1] + 6} stroke={LINEA} strokeWidth={W.pelo} opacity={p(t, 2.4, 0.1)} />
            </g>
          )}
          {/* g y el tiempo de caída */}
          {t > 2.3 && (
            <g opacity={p(t, 2.3, 0.15)}>
              <text x={458} y={1190} fontFamily={MANO} fontSize={28} fill={LINEA}>g = 9,81 m/s²</text>
              <line x1={530} y1={1204} x2={530} y2={1240} stroke={LINEA} strokeWidth={W.detalle} />
              <path d="M 530 1254 L 521 1234 L 539 1234 Z" fill={LINEA} />
              <text x={452} y={1304} fontFamily={MANO} fontSize={38} fill={LINEA}>{`t = ${m(tCaida)} s`}</text>
            </g>
          )}

          {/* la taza en estroboscopia */}
          {fantasmas.map((f, i) => <DibujoTaza key={i} c={f.c} ang={f.ang} k={1} fantasma />)}
          {fantasmas.length > 0 && (
            <text x={692} y={1384} fontFamily={MANO} fontSize={22} fill={LINEA} opacity={p(t, T_CAE + 0.12, 0.2)}>CADA 0,1 s</text>
          )}

          {/* el vapor */}
          {vp.map((h, i) => (
            <path key={i} d={curva(h.pts)} fill="none" stroke={LINEA} strokeWidth={W.fina} strokeDasharray="12 9" opacity={h.alfa * kTaza} strokeLinecap="round" />
          ))}

          {/* la taza, entera mientras no llega al suelo */}
          {tz.estado !== 'suelo' && <DibujoTaza c={tz.c} ang={tz.ang} k={kTaza} />}
          {tz.estado === 'cae' && tz.c[1] > MESA_Y + 70 && (
            <g>
              <path d={(() => {
                const r = 92;
                const a0 = -Math.PI / 2, a1 = a0 + tz.ang;
                const q0 = suma(tz.c, [Math.cos(a0) * r, Math.sin(a0) * r]), q1 = suma(tz.c, [Math.cos(a1) * r, Math.sin(a1) * r]);
                return `M ${q0[0]} ${q0[1]} A ${r} ${r} 0 ${tz.ang > Math.PI ? 1 : 0} 1 ${q1[0]} ${q1[1]}`;
              })()} fill="none" stroke={LINEA} strokeWidth={W.fina} />
              <text x={tz.c[0] - 150} y={tz.c[1] - 70} fontFamily={MANO} fontSize={28} fill={LINEA}>{`θ = ${angGrados}°`}</text>
            </g>
          )}

          {/* el café: gotas, charco y manchas */}
          {(() => {
            const chorro = cf.gotas.filter((d) => d.i < 100);
            const tramos: P[][] = [];
            chorro.forEach((d, i) => {
              if (i === 0 || Math.hypot(d.c[0] - chorro[i - 1].c[0], d.c[1] - chorro[i - 1].c[1]) > 90) tramos.push([]);
              tramos[tramos.length - 1].push(d.c);
            });
            return tramos.filter((q) => q.length > 1).map((q, i) => (
              <path key={'ch' + i} d={curva(q)} fill="none" stroke={LINEA} strokeWidth={5} strokeLinecap="round" opacity={0.9} />
            ));
          })()}
          {cf.gotas.map((d) => <circle key={d.i} cx={d.c[0]} cy={d.c[1]} r={d.r * 0.75} fill={LINEA} />)}
          {cf.charco && (
            <path d={`M ${cf.charco.c[0] - cf.charco.rx} ${SUELO} Q ${cf.charco.c[0]} ${SUELO - 2.2 * cf.charco.ry} ${cf.charco.c[0] + cf.charco.rx} ${SUELO} Z`}
              fill="url(#pa-liquido)" stroke={LINEA} strokeWidth={W.detalle} />
          )}
          {cf.manchas.map((s) => (
            <path key={s.i} d={`M ${s.c[0] - s.rx} ${SUELO} Q ${s.c[0]} ${SUELO - 1.8 * s.ry} ${s.c[0] + s.rx} ${SUELO} Z`} fill={LINEA} />
          ))}

          {/* el golpe: rayas que salen del punto donde cae */}
          {t >= T_SUELO && t < T_SUELO + 0.3 && (() => {
            const k = p(t, T_SUELO, 0.3);
            return Array.from({length: 9}, (_, i) => {
              const a = ((196 + i * 18.5) * Math.PI) / 180;
              const r1 = 70 + 130 * E.outCubic(k), r2 = r1 + 60 * (1 - k) + 12;
              return (
                <line key={'gl' + i} x1={IMPACTO[0] + Math.cos(a) * r1} y1={SUELO - 6 + Math.sin(a) * r1 * 0.8} x2={IMPACTO[0] + Math.cos(a) * r2}
                  y2={SUELO - 6 + Math.sin(a) * r2 * 0.8} stroke={LINEA} strokeWidth={W.contorno} strokeLinecap="round" opacity={1 - k * k} />
              );
            });
          })()}

          {/* los trozos, y su despiece numerado */}
          {tr.map((q) => <T key={q.n} d={poli(q.pts)} w={W.contorno} fill={PAPEL} />)}
          {tr.map((q) => {
            const k = p(t, T_SUELO + 0.42 + q.n * 0.07, 0.15);
            if (k <= 0) return null;
            const alto = q.n % 2 === 0 ? 120 : 82;
            const gx = Math.min(985, Math.max(95, q.c[0] + (q.n % 3 === 0 ? 24 : -8)));
            return (
              <g key={'g' + q.n} opacity={k}>
                <line x1={q.c[0]} y1={q.c[1] - 6} x2={gx} y2={SUELO - alto + 20} stroke={LINEA} strokeWidth={W.pelo} />
                <Globo c={[gx, SUELO - alto]} txt={String(q.n)} r={19} />
              </g>
            );
          })}

          {/* EL GATO */}
          <g transform={TRANSFORMA_GATO}>
            <DibujoGato g={g} t={t} k={kGato} />
          </g>

          {/* su línea de mira, cuando no mira a cámara */}
          {g.giro < 0.2 && kGato >= 1 && (g.mira === 'taza' || g.mira === 'abajo') && (
            <line x1={enMundo(g.ojoCerca.c)[0]} y1={enMundo(g.ojoCerca.c)[1]} x2={g.objetivo[0]} y2={g.objetivo[1] - 40} stroke={LINEA} strokeWidth={W.pelo}
              strokeDasharray={FANTASMA} opacity={0.75} />
          )}

          {/* la distancia al borde, que baja */}
          {t < T_CAE + 0.05 && kCota > 0 && (
            <g opacity={kCota * (1 - p(t, T_CAE, 0.05))}>
              <line x1={tz.c[0]} y1={MESA_Y + 4} x2={tz.c[0]} y2={MESA_Y + 100} stroke={LINEA} strokeWidth={W.pelo} strokeDasharray={EJE} />
              <line x1={BORDE} y1={MESA_Y + MESA_G + 4} x2={BORDE} y2={MESA_Y + 100} stroke={LINEA} strokeWidth={W.pelo} />
              <Cota a={[tz.c[0], MESA_Y + 86]} b={[BORDE, MESA_Y + 86]} txt={`AL BORDE ${m(alBorde / PX_M)} m`} abajo tam={27} />
            </g>
          )}
          {/* la altura de la mesa */}
          {kCota > 0 && (
            <g opacity={kCota}>
              <line x1={BORDE + 6} y1={MESA_Y} x2={1018} y2={MESA_Y} stroke={LINEA} strokeWidth={W.pelo} />
              <Cota a={[1006, MESA_Y]} b={[1006, SUELO]} txt="h = 0,75 m" vertical />
            </g>
          )}

          {/* A · el gato, B · la taza (y, rota, la FIG. 2: la taza, antes) */}
          {kCota > 0 && (
            <g opacity={kCota}>
              <line x1={112} y1={272} x2={enMundo(g.orejaCerca.punta)[0] - 8} y2={enMundo(g.orejaCerca.punta)[1] - 4} stroke={LINEA} strokeWidth={W.pelo} />
              <Globo c={[100, 250]} txt="A" />
              <text x={134} y={260} fontFamily={MANO} fontSize={28} fill={LINEA}>GATO · 4,2 kg</text>
            </g>
          )}
          {kCota > 0 && t < 3.1 && (
            <g opacity={kCota * (1 - p(t, 2.9, 0.2))}>
              <line x1={800} y1={272} x2={pzT.borde[1][0] - 8} y2={pzT.borde[1][1] - 8} stroke={LINEA} strokeWidth={W.pelo} />
              <Globo c={[800, 250]} txt="B" />
              <text x={832} y={260} fontFamily={MANO} fontSize={28} fill={LINEA}>TAZA · 68 °C</text>
            </g>
          )}
          {t > 3.22 && (() => {
            const k = E.outCubic(p(t, 3.22, 0.45));
            return (
              <g>
                <T d="M 176 1150 H 432 V 1414 H 176 Z" w={W.detalle} k={k} fill={PAPEL} />
                <text x={194} y={1188} fontFamily={MANO} fontSize={25} fill={LINEA}>{escribe('FIG. 2', t, 3.3, 0.15)}</text>
                <text x={194} y={1218} fontFamily={MANO} fontSize={25} fill={LINEA}>{escribe('LA TAZA, ANTES', t, 3.4, 0.3)}</text>
                <g transform="translate(304 1316) scale(0.72) translate(-304 -1316)">
                  <DibujoTaza c={[304, 1316]} ang={0} k={k} />
                </g>
                {k >= 1 && <Cota a={[266, 1382]} b={[342, 1382]} txt="" />}
                <text x={304} y={1404} fontFamily={MANO} fontSize={20} fill={LINEA} textAnchor="middle" opacity={p(t, 3.6, 0.2)}>Ø 0,08 m</text>
              </g>
            );
          })()}

          {/* el indicador de INTENCIÓN: la aguja es la cara del mecanismo */}
          <Intencion t={t} />

          {/* la nota de su mirada */}
          {nota && (
            <g>
              {nota[3] && <Fuera c={[NX + 14, NY - 10]} />}
              <text x={nota[3] ? NX + 36 : NX} y={NY} fontFamily={MANO} fontSize={28} fill={LINEA}>{escribe(nota[2], t, nota[0], 0.3)}</text>
              {(() => {
                const q = enMundo(suma(g.cabeza.c, rot([60, -80], g.inclina)));
                return <line x1={NX + 60} y1={NY + 10} x2={q[0]} y2={q[1]} stroke={LINEA} strokeWidth={W.pelo} opacity={p(t, nota[0], 0.1)} />;
              })()}
            </g>
          )}

          {/* notas generales y cartela */}
          <rect x={72} y={1676} width={452} height={160} fill={PAPEL} fillOpacity={0.6} stroke={LINEA} strokeWidth={W.fina} />
          <text x={88} y={1710} fontFamily={TECNICA} fontWeight={700} fontSize={20} letterSpacing={2} fill={LINEA}>NOTAS GENERALES</text>
          <text x={88} y={1750} fontFamily={MANO} fontSize={23} fill={LINEA}>1. El gato no empuja: comprueba.</text>
          <text x={88} y={1784} fontFamily={MANO} fontSize={23} fill={LINEA}>2. Caída libre: 0,75 m en 0,39 s.</text>
          <text x={88} y={1818} fontFamily={MANO} fontSize={23} fill={LINEA}>{escribe('3. Despiece: 6 piezas (fig. 2).', t, 3.7, 0.5)}</text>

          <rect x={560} y={1676} width={448} height={160} fill={PAPEL} fillOpacity={0.6} stroke={LINEA} strokeWidth={W.detalle} />
          {[1716, 1756, 1796].map((y) => <line key={y} x1={560} y1={y} x2={1008} y2={y} stroke={LINEA} strokeWidth={W.pelo} />)}
          <line x1={800} y1={1756} x2={800} y2={1836} stroke={LINEA} strokeWidth={W.pelo} />
          <g fontFamily={TECNICA} fontSize={19} letterSpacing={1.5} fill={LINEA}>
            <text x={574} y={1704} fontWeight={700} fontSize={22}>PROYECTO: LA COCINA</text>
            <text x={574} y={1743}>PLANO: CAÍDA LIBRE DE TAZA</text>
            <text x={574} y={1783}>ESCALA 1:10</text>
            <text x={814} y={1783}>HOJA 05/10</text>
            <text x={574} y={1823}>DIBUJÓ: CLAUDE</text>
            <text x={814} y={1823}>ESTADO:</text>
          </g>
        </g>

        {/* el sello: el único color que no es azul, una vez */}
        {sello > 0 && (
          <g transform={`translate(880 1770) rotate(-9) scale(${1 + 0.6 * (1 - E.outCubic(sello))})`} opacity={0.15 + 0.8 * sello} filter="url(#pa-sello)">
            <rect x={-128} y={-54} width={256} height={104} rx={10} fill="none" stroke={SELLO} strokeWidth={8} />
            <text x={0} y={24} fontFamily={TECNICA} fontWeight={700} fontSize={72} letterSpacing={8} fill={SELLO} textAnchor="middle">ROTA</text>
          </g>
        )}
      </g>
    </svg>
  );
};
