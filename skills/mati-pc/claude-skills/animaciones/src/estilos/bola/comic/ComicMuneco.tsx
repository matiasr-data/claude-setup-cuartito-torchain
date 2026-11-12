import React from 'react';
import {clamp} from '../../../comun/curvas';
import {ALTO, MUNECO, PLACA, SILLA, STUD, SUELO, esqueleto, escalaEn, type Cara, type Pose, type V3} from '../escena';
import {Forma} from './ComicDecorado';
import {C, REG, TINTA, caja, cajaDe, capsula, circulo, cruz, curva, dentroDe, envolvente, f1, poli, por, pr, punto, resta, suma, trama, unit, type P} from './ComicTrama';

// CÓMIC, EL MUÑECO Y SU SILLA. El mismo muñeco de los bloques (camisa amarilla con corbata roja, pantalón
// azul marino, pelo castaño, su silla azul de oficina) dibujado como el protagonista de un tebeo: contorno grueso de tinta, colores
// planos, la cara con la trama de puntos rojos de la piel de los cómics de los 60 y MUCHA expresión (ojos que se abren como platos,
// cejas que suben, la boca enorme, la gota de sudor, las rayas del susto). Sale del esqueleto de escena.ts: cada pieza en su sitio
// de la pantalla (con proyecta) y ordenada por lo cerca que está de la cámara.

const S = MUNECO.escala;
const PIEL_BASE = '#FFE2C6';

// ---------------------------------------------------------------- ayudas
type Pieza = {z: number; el: React.ReactNode};
const enCapsula = (a: P, b: P, r: number) => (x: number, y: number) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const k = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy + 1e-9));
  return Math.hypot(x - a[0] - dx * k, y - a[1] - dy * k) < r - 1.5;
};
// una cápsula de tela con su sombra de puntos del lado de abajo a la derecha (la luz viene de arriba a la izquierda)
const Tubo: React.FC<{a: P; b: P; ra: number; rb: number; fill: string; puntos: string; tinta?: number; dens?: number}> = ({a, b, ra, rb, fill, puntos, tinta = 7, dens = 1}) => {
  const r = Math.max(ra, rb);
  const caj: [number, number, number, number] = [Math.min(a[0], b[0]) - r, Math.min(a[1], b[1]) - r, Math.max(a[0], b[0]) + r, Math.max(a[1], b[1]) + r];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  // la normal del tubo que mira abajo a la derecha
  let nx = -dy / l, ny = dx / l;
  if (nx * 0.6 + ny * 0.8 < 0) { nx = -nx; ny = -ny; }
  const dentro = (x: number, y: number) => enCapsula(a, b, (ra + rb) / 2)(x, y);
  const pts = trama(caj, 11, 75, (x, y) => {
    const k = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (l * l));
    const cx = a[0] + dx * k, cy = a[1] + dy * k;
    const rr = ra + (rb - ra) * k;
    return clamp(((x - cx) * nx + (y - cy) * ny) / rr * 0.9 + 0.05) * dens;
  }, dentro);
  return <Forma d={capsula(a, b, ra, rb)} fill={fill} tinta={tinta} puntos={pts} colorPuntos={puntos} />;
};

// ---------------------------------------------------------------- la silla (gira con él)
const ejesSilla = (pose: Pose) => {
  const g = pose.gira;
  const L0: V3 = [Math.sin(g), 0, -Math.cos(g)], F0: V3 = [Math.cos(g), 0, Math.sin(g)], U0: V3 = [0, -1, 0];
  return {L0, F0, U0};
};
const CajaPlana: React.FC<{c: V3; a: V3; b: V3; d: V3; luz: string; puntos: string; tope?: string; tinta?: number}> = ({c, a, b, d, luz, puntos, tope, tinta = 7}) => {
  const caras = caja(c, a, b, d);
  return (
    <g>
      {caras.map((q, k) => {
        const arriba = q.n[1] < -0.6;
        const dens = arriba ? 0 : clamp((0.32 - q.luz) * 1.25, 0, 0.8);
        const pts = dens > 0.05 ? trama(cajaDe(q.pts), 11, 75, () => dens, dentroDe(q.pts)) : undefined;
        return <Forma key={k} d={poli(q.pts)} fill={arriba && tope ? tope : luz} tinta={3.5} puntos={pts} colorPuntos={puntos} />;
      })}
      <path d={poli(envolvente(caras.flatMap((q) => q.pts)))} fill="none" stroke={TINTA} strokeWidth={tinta} strokeLinejoin="round" />
    </g>
  );
};
export const SillaAtras: React.FC<{pose: Pose}> = ({pose}) => {
  const {L0, F0, U0} = ejesSilla(pose);
  const base: V3 = [SILLA.x, SUELO - 40, SILLA.z];
  // las cinco patas con sus ruedas (fijas: no giran con él), ordenadas de atrás adelante
  const patas = [0, 1, 2, 3, 4].map((k) => {
    const a = (k / 5) * Math.PI * 2 + 0.3;
    const dir: V3 = [Math.sin(a), 0, Math.cos(a)];
    const punta = suma(base, por(dir, 128));
    const rueda: V3 = [punta[0] + dir[0] * 8, SUELO - 14, punta[2] + dir[2] * 8];
    return {punta, rueda, z: punta[2]};
  }).sort((p, q) => p.z - q.z);
  const respaldo: V3 = suma([SILLA.x, SILLA.asiento - ALTO * 1.05 + 4, SILLA.z], por(F0, -STUD * 1.5 - 4));
  return (
    <g>
      {patas.map((p, k) => (
        <g key={k}>
          <Forma d={circulo(pr(p.rueda), 15)} fill={C.gris} tinta={5} />
          <Forma d={capsula(pr(base), pr(p.punta), 16, 13)} fill="#2B2D3E" tinta={6} />
        </g>
      ))}
      <Forma d={circulo(pr(base), 30)} fill="#2B2D3E" tinta={6} />
      <Tubo a={pr([SILLA.x, SUELO - 58, SILLA.z])} b={pr([SILLA.x, SILLA.asiento + PLACA * 1.5, SILLA.z])} ra={15} rb={15} fill={C.gris} puntos={C.grisOscuro} tinta={6} />
      <CajaPlana c={respaldo} a={por(L0, 96)} b={por(U0, ALTO * 1.05)} d={por(F0, 32)} luz={C.azul} puntos={C.azulSombra} tope={C.azulClaro} />
    </g>
  );
};
export const SillaAsiento: React.FC<{pose: Pose}> = ({pose}) => {
  const {L0, F0, U0} = ejesSilla(pose);
  const c: V3 = suma([SILLA.x, SILLA.asiento + PLACA * 0.75, SILLA.z], por(F0, -6));
  return <CajaPlana c={c} a={por(L0, 96)} b={por(U0, PLACA * 0.75)} d={por(F0, 96)} luz={C.azul} puntos={C.azulSombra} tope={C.azulClaro} />;
};

// ---------------------------------------------------------------- la cara
type Ojo = 'normal' | 'grande' | 'brillo' | 'cerrado' | 'feliz' | 'medio' | 'susto';
type Boca = 'linea' | 'sonrisa' | 'grande' | 'o' | 'dientes' | 'triste' | 'ondas' | 'lado';
type Rasgos = {ojo: Ojo; ceja: [number, number]; boca: Boca; sudor?: boolean; rubor?: boolean; susto?: boolean};
const RASGOS: Record<Cara, Rasgos> = {
  atento: {ojo: 'normal', ceja: [0.3, 0], boca: 'linea'},
  ilusion: {ojo: 'brillo', ceja: [-0.4, 9], boca: 'sonrisa', rubor: true},
  tension: {ojo: 'grande', ceja: [-0.55, 5], boca: 'dientes', sudor: true},
  ay: {ojo: 'grande', ceja: [-0.75, 16], boca: 'o', sudor: true, susto: true},
  fastidio: {ojo: 'cerrado', ceja: [0.9, -4], boca: 'triste'},
  meh: {ojo: 'medio', ceja: [-0.1, 4], boca: 'lado'},
  susto: {ojo: 'susto', ceja: [-0.65, 20], boca: 'ondas', sudor: true, susto: true},
  feliz: {ojo: 'feliz', ceja: [-0.45, 14], boca: 'grande', rubor: true},
  serio: {ojo: 'medio', ceja: [0.15, -2], boca: 'linea'},
};
const BOCA_OSCURA = '#6E1020';

const OjoComic: React.FC<{x: number; y: number; sq: number; lado: number; tipo: Ojo; px: number; py: number}> = ({x, y, sq, lado, tipo, px, py}) => {
  const ink = {stroke: TINTA, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};
  if (tipo === 'cerrado') {
    // apretados: «>  <»
    const s = -lado;
    return <path d={`M ${f1(x - s * 15 * sq)} ${f1(y - 11)} L ${f1(x + s * 11 * sq)} ${f1(y)} L ${f1(x - s * 15 * sq)} ${f1(y + 11)}`} {...ink} strokeWidth={7} />;
  }
  if (tipo === 'feliz') {
    return <path d={`M ${f1(x - 17 * sq)} ${f1(y + 7)} Q ${f1(x)} ${f1(y - 18)} ${f1(x + 17 * sq)} ${f1(y + 7)}`} {...ink} strokeWidth={8} />;
  }
  const [rx, ry, rp] = tipo === 'susto' ? [21, 27, 4.5] : tipo === 'grande' || tipo === 'brillo' ? [18, 24, 10] : tipo === 'medio' ? [16, 18, 8.5] : [15, 20, 8.5];
  const ox = px * (rx - rp - 3) * 0.75 * sq, oy = py * (ry - rp - 3) * 0.6;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={rx * sq} ry={ry} fill={C.crema} stroke={TINTA} strokeWidth={5} />
      <ellipse cx={x + ox} cy={y + oy} rx={rp * Math.max(0.55, sq)} ry={rp} fill={TINTA} />
      {tipo !== 'susto' && <circle cx={x + ox - rp * 0.35} cy={y + oy - rp * 0.4} r={rp * 0.36} fill={C.crema} />}
      {tipo === 'brillo' && <circle cx={x + ox + rp * 0.4} cy={y + oy + rp * 0.35} r={rp * 0.2} fill={C.crema} />}
      {tipo === 'medio' && (
        <g>
          <path d={`M ${f1(x - rx * sq - 2)} ${f1(y + 1)} A ${f1(rx * sq + 2)} ${f1(ry + 2)} 0 0 1 ${f1(x + rx * sq + 2)} ${f1(y + 1)} Z`} fill={PIEL_BASE} />
          <path d={`M ${f1(x - rx * sq - 3)} ${f1(y + 1)} L ${f1(x + rx * sq + 3)} ${f1(y + 1)}`} {...ink} strokeWidth={6} />
        </g>
      )}
    </g>
  );
};
const BocaComic: React.FC<{x: number; y: number; sq: number; tipo: Boca; t: number}> = ({x, y, sq, tipo, t}) => {
  const X = (v: number) => f1(x + v * sq);
  const Y = (v: number) => f1(y + v);
  const ink = {stroke: TINTA, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none', strokeWidth: 6.5};
  switch (tipo) {
    case 'linea': return <path d={`M ${X(-20)} ${Y(0)} L ${X(20)} ${Y(0)}`} {...ink} />;
    case 'lado': return <path d={`M ${X(-22)} ${Y(6)} Q ${X(4)} ${Y(7)} ${X(24)} ${Y(-9)}`} {...ink} />;
    case 'sonrisa': return <path d={`M ${X(-25)} ${Y(-5)} Q ${X(0)} ${Y(20)} ${X(25)} ${Y(-5)}`} {...ink} />;
    case 'triste': return <path d={`M ${X(-22)} ${Y(9)} Q ${X(0)} ${Y(-11)} ${X(22)} ${Y(9)}`} {...ink} />;
    case 'ondas': {
      const tiembla = Math.floor(t * 15) % 2 ? 1.5 : -1.5;
      return <path d={`M ${X(-26)} ${Y(tiembla)} L ${X(-17)} ${Y(-6)} L ${X(-8)} ${Y(5)} L ${X(1)} ${Y(-6)} L ${X(10)} ${Y(5)} L ${X(19)} ${Y(-6)} L ${X(27)} ${Y(2)}`} {...ink} strokeWidth={5.5} />;
    }
    case 'o': return (
      <g>
        <ellipse cx={x} cy={y + 4} rx={14 * sq} ry={18} fill={BOCA_OSCURA} stroke={TINTA} strokeWidth={5.5} />
        <ellipse cx={x} cy={y + 14} rx={8 * sq} ry={5} fill={C.rojo} />
      </g>
    );
    case 'dientes': return (
      <g>
        <rect x={x - 27 * sq} y={y - 12} width={54 * sq} height={24} rx={8} fill={C.crema} stroke={TINTA} strokeWidth={5.5} />
        <path d={`M ${X(-27)} ${Y(0)} L ${X(27)} ${Y(0)} M ${X(-9)} ${Y(-12)} L ${X(-9)} ${Y(12)} M ${X(9)} ${Y(-12)} L ${X(9)} ${Y(12)}`} stroke={TINTA} strokeWidth={3.5} />
      </g>
    );
    case 'grande': return (
      <g>
        <path d={`M ${X(-36)} ${Y(-12)} Q ${X(0)} ${Y(-16)} ${X(36)} ${Y(-12)} Q ${X(32)} ${Y(38)} ${X(0)} ${Y(40)} Q ${X(-32)} ${Y(38)} ${X(-36)} ${Y(-12)} Z`} fill={BOCA_OSCURA} />
        <path d={`M ${X(-30)} ${Y(-10)} Q ${X(0)} ${Y(-13)} ${X(30)} ${Y(-10)} L ${X(28)} ${Y(1)} Q ${X(0)} ${Y(-1)} ${X(-28)} ${Y(1)} Z`} fill={C.crema} />
        <ellipse cx={x} cy={y + 27} rx={17 * sq} ry={9} fill={C.rojo} />
        <path d={`M ${X(-36)} ${Y(-12)} Q ${X(0)} ${Y(-16)} ${X(36)} ${Y(-12)} Q ${X(32)} ${Y(38)} ${X(0)} ${Y(40)} Q ${X(-32)} ${Y(38)} ${X(-36)} ${Y(-12)} Z`} {...ink} />
      </g>
    );
  }
};

// la cabeza: un bloque redondeado con la trama de la piel, el pelo y la cara que mira hacia donde dice «frente»
const Cabeza: React.FC<{c: P; giro: number; s: number; frente: V3; ojos: P; cara: Cara; t: number}> = ({c, giro, s, frente, ojos, cara, t}) => {
  const W = 84, H = 70;
  const R = RASGOS[cara];
  // la cara gira menos que la cabeza de verdad: en un tebeo se dibuja de tres cuartos, con los dos ojos a la vista
  const alfa = clamp(Math.atan2(frente[0], frente[2]), -1.15, 1.15) * 0.6;
  const cabecea = clamp(frente[1], -0.7, 0.7);
  const ojosY = -4 + cabecea * 16;
  const forma = `M ${-W} ${-H + 44} Q ${-W} ${-H} ${-W + 44} ${-H} L ${W - 44} ${-H} Q ${W} ${-H} ${W} ${-H + 44} L ${W} ${H - 40} Q ${W} ${H} ${W - 40} ${H} L ${-W + 40} ${H} Q ${-W} ${H} ${-W} ${H - 40} Z`;
  // la trama de la piel en la cabeza sin girar (los puntos van fijos a la cabeza; son pequeños, no se nota)
  const enCabeza = (x: number, y: number) => Math.abs(x) < W - 3 && Math.abs(y) < H - 3 && !(Math.abs(x) > W - 40 && Math.abs(y) > H - 40 && Math.hypot(Math.abs(x) - (W - 40), Math.abs(y) - (H - 40)) > 37);
  const piel = trama([-W, -H, W, H], 9, 15, (x, y) => 0.36 + clamp((x * 0.5 + y * 0.35) / W) * 0.55, enCabeza);
  const lados = [-1, 1];
  const ojo = (lado: number) => {
    const az = alfa + lado * 0.5;
    return {x: Math.sin(az) * W * 0.86, sq: Math.max(0.2, Math.cos(az)) ** 0.7, ve: Math.cos(az) > 0.08};
  };
  const ox = Math.sin(alfa) * W * 0.5;
  const bx = Math.sin(alfa) * W * 0.84, sqB = Math.max(0.35, Math.cos(alfa)) ** 0.5;
  // el pelo, con el tupé hacia donde mira
  const pelo: P[] = [
    [-W - 9, -4], [-W - 11, -H * 0.72], [-W * 0.72, -H - 16], [-W * 0.25, -H - 24], [-W * 0.05, -H - 46], [W * 0.14, -H - 24], [W * 0.38, -H - 40],
    [W * 0.56, -H - 16], [W + 11, -H * 0.72], [W + 9, -4], [W - 4, -H * 0.38], [ox + W * 0.42, -H * 0.5], [ox + W * 0.16, -H * 0.18],
    [ox - W * 0.06, -H * 0.46], [ox - W * 0.36, -H * 0.3], [ox - W * 0.62, -H * 0.5], [-W + 4, -H * 0.38],
  ];
  const sombraPelo = trama([-W - 12, -H - 48, W + 12, 0], 9, 75, (x) => clamp(x / W * 0.8 + 0.2), dentroDe(pelo));
  const tiembla = Math.floor(t * 15) % 2 ? 2 : -2;
  const lejos = alfa > 0 ? -1 : 1; // el lado de la cabeza que se aleja de la cara (ahí va la gota de sudor)
  return (
    <g transform={`translate(${f1(c[0])} ${f1(c[1])}) rotate(${f1(giro)}) scale(${s.toFixed(3)})`}>
      {/* las orejas (detrás) */}
      {lados.map((l) => {
        const az = alfa + l * Math.PI / 2;
        const x = Math.sin(az) * (W + 2);
        return Math.abs(x) > W * 0.7 ? <Forma key={l} d={circulo([x, 6], 17)} fill={PIEL_BASE} tinta={6} /> : null;
      })}
      <Forma d={forma} fill={PIEL_BASE} tinta={8} puntos={piel} colorPuntos={C.pielPuntos} />
      {/* el rubor */}
      {R.rubor && lados.map((l) => {
        const o = ojo(l);
        return o.ve ? (
          <g key={'r' + l}>
            <ellipse cx={o.x} cy={ojosY + 27} rx={16 * o.sq} ry={8} fill="#FF7F95" />
            <path d={`M ${f1(o.x - 9 * o.sq)} ${f1(ojosY + 31)} l 5 -8 M ${f1(o.x - 1 * o.sq)} ${f1(ojosY + 31)} l 5 -8 M ${f1(o.x + 7 * o.sq)} ${f1(ojosY + 31)} l 5 -8`} stroke={TINTA} strokeWidth={2.5} strokeLinecap="round" />
          </g>
        ) : null;
      })}
      {/* la nariz, hacia donde mira */}
      <path d={`M ${f1(bx + 2)} ${f1(ojosY + 10)} q ${f1(10 * Math.sign(alfa || 1))} 9 ${f1(1 * Math.sign(alfa || 1))} 15`} fill="none" stroke={TINTA} strokeWidth={4.5} strokeLinecap="round" />
      {/* los ojos y las cejas */}
      {lados.map((l) => {
        const o = ojo(l);
        if (!o.ve) return null;
        const [inc, alto] = R.ceja;
        const yC = ojosY - 33 - alto;
        const xi = o.x - l * 13 * o.sq, xo = o.x + l * 16 * o.sq;
        return (
          <g key={'o' + l}>
            <OjoComic x={o.x} y={ojosY} sq={o.sq} lado={l} tipo={R.ojo} px={ojos[0]} py={ojos[1]} />
            <path d={`M ${f1(xi)} ${f1(yC + inc * 9)} Q ${f1((xi + xo) / 2)} ${f1(yC - 5)} ${f1(xo)} ${f1(yC - inc * 9)}`} fill="none" stroke={TINTA} strokeWidth={8} strokeLinecap="round" />
          </g>
        );
      })}
      <BocaComic x={bx} y={38 + cabecea * 12} sq={sqB} tipo={R.boca} t={t} />
      {/* el pelo y su brillo */}
      <Forma d={curva(pelo, true)} fill={C.marron} tinta={7} puntos={sombraPelo} colorPuntos="#4A220C" />
      <path d={`M ${f1(-W * 0.62)} ${f1(-H - 2)} Q ${f1(-W * 0.4)} ${f1(-H - 16)} ${f1(-W * 0.12)} ${f1(-H - 16)}`} fill="none" stroke={C.crema} strokeWidth={7} strokeLinecap="round" />
      {/* la gota de sudor */}
      {R.sudor && (
        <g transform={`translate(${f1(lejos * (W + 6))} ${f1(-H * 0.35 + ((t * 70) % 26))})`}>
          <Forma d="M 0 -24 C 8 -9 15 1 15 10 C 15 19 8 25 0 25 C -8 25 -15 19 -15 10 C -15 1 -8 -9 0 -24 Z" fill={C.sudor} tinta={4.5} />
          <ellipse cx={-5} cy={9} rx={3} ry={6} fill={C.crema} />
        </g>
      )}
      {/* las rayas del susto, encima de la cabeza */}
      {R.susto && [-34, 0, 34].map((dx, k) => (
        <path key={'s' + k} d={`M ${f1(dx * 1.1 + tiembla)} ${f1(-H - 62 - (k === 1 ? 10 : 0))} L ${f1(dx * 1.45 + tiembla)} ${f1(-H - 96 - (k === 1 ? 14 : 0))}`} stroke={TINTA} strokeWidth={7} strokeLinecap="round" />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- el muñeco entero
export const MunecoComic: React.FC<{pose: Pose; t: number}> = ({pose, t}) => {
  const E = esqueleto(pose);
  const L = unit(resta(E.hombro[1], E.hombro[0]));
  let U = unit(resta(E.cuello, E.pecho));
  U = unit(resta(U, por(L, punto(U, L))));
  const F = cruz(U, L);
  const Fh = unit([F[0], 0, F[2]]);
  const sz = (v: V3) => escalaEn(v[2]);

  // las piernas (der = 0, izq = 1)
  const pierna = (k: 0 | 1): Pieza => {
    const lado = k === 1 ? 1 : -1;
    const cad = suma(E.cadera, por(L, lado * MUNECO.pierna.x * S));
    const rod = E.rodilla[k], pie = E.pie[k];
    const talon = pr(suma(suma(pie, por(Fh, -10)), [0, 6, 0])), punta = pr(suma(suma(pie, por(Fh, 42)), [0, 8, 0]));
    const s = sz(rod);
    return {
      z: (cad[2] + rod[2] + pie[2]) / 3,
      el: (
        <g key={'p' + k}>
          <Tubo a={pr(rod)} b={pr(pie)} ra={27 * s} rb={25 * s} fill={C.marino} puntos={C.marinoSombra} />
          <Forma d={capsula(talon, punta, 17 * s, 19 * s)} fill="#2A2733" tinta={6} />
          <path d={`M ${f1(talon[0] + (punta[0] - talon[0]) * 0.45)} ${f1(talon[1] - 9 * s)} L ${f1(talon[0] + (punta[0] - talon[0]) * 0.85)} ${f1(punta[1] - 8 * s)}`} stroke={C.crema} strokeWidth={5} strokeLinecap="round" />
          <Tubo a={pr(cad)} b={pr(rod)} ra={31 * s} rb={29 * s} fill={C.marino} puntos={C.marinoSombra} />
        </g>
      ),
    };
  };
  const brazo = (k: 0 | 1): Pieza => {
    const h = E.hombro[k], c = E.codo[k], m = E.mano[k];
    const s = sz(c);
    const dir = unit(resta(m, c));
    const mano = pr(suma(m, por(dir, 8)));
    const pul = pr(suma(suma(m, por(dir, 2)), por(L, (k === 1 ? -1 : 1) * 16)));
    return {
      z: (h[2] + c[2] + m[2]) / 3,
      el: (
        <g key={'b' + k}>
          <Tubo a={pr(h)} b={pr(c)} ra={26 * s} rb={23 * s} fill={C.amarillo} puntos={C.amarilloSombra} />
          <Tubo a={pr(c)} b={pr(m)} ra={23 * s} rb={21 * s} fill={C.amarillo} puntos={C.amarilloSombra} />
          {/* el puño de la camisa y la mano */}
          <Forma d={capsula(pr(suma(m, por(dir, -10))), pr(m), 22 * s, 22 * s)} fill={C.crema} tinta={5} />
          <Forma d={circulo(pul, 10 * s)} fill={PIEL_BASE} tinta={5} />
          <Forma d={circulo(mano, 22 * s)} fill={PIEL_BASE} tinta={6}
            puntos={trama([mano[0] - 22, mano[1] - 22, mano[0] + 22, mano[1] + 22], 9, 15, (x, y) => 0.36 + clamp(((x - mano[0]) * 0.6 + (y - mano[1]) * 0.8) / 22) * 0.5, (x, y) => Math.hypot(x - mano[0], y - mano[1]) < 19 * s)}
            colorPuntos={C.pielPuntos} />
        </g>
      ),
    };
  };
  // el cuerpo: una caja con la camisa, el cuello blanco y la corbata
  const torso = (): React.ReactNode => {
    const T = MUNECO.torso;
    const a = por(L, (T.an / 2) * S), b = por(U, (T.alto / 2) * S), d = por(F, (T.fondo / 2) * S);
    const caras = caja(E.pecho, a, b, d);
    const delante = suma(E.pecho, d);
    const en = (u: number, v: number): P => pr(suma(suma(delante, por(a, u)), por(b, v)));
    const cuello: P[] = [en(-0.52, 1), en(0.52, 1), en(0, 0.38)];
    const nudo: P[] = [en(-0.11, 0.93), en(0.11, 0.93), en(0.08, 0.7), en(-0.08, 0.7)];
    const corbata: P[] = [en(-0.08, 0.72), en(0.08, 0.72), en(0.17, -0.5), en(0, -0.82), en(-0.17, -0.5)];
    const bolsillo: P[] = [en(0.42, 0.42), en(0.78, 0.42), en(0.78, 0.05), en(0.42, 0.05)];
    return (
      <g key="torso">
        {caras.map((q, k) => {
          const arriba = q.n[1] < -0.6;
          const dens = arriba ? 0 : clamp((0.3 - q.luz) * 1.2, 0, 0.75);
          const pts = dens > 0.05 ? trama(cajaDe(q.pts), 11, 75, () => dens, dentroDe(q.pts)) : undefined;
          return <Forma key={k} d={poli(q.pts)} fill={arriba ? '#FFE36A' : C.amarillo} tinta={4} puntos={pts} colorPuntos={C.amarilloSombra} />;
        })}
        <path d={poli(envolvente(caras.flatMap((q) => q.pts)))} fill="none" stroke={TINTA} strokeWidth={7.5} strokeLinejoin="round" />
        <Forma d={poli(cuello)} fill={C.crema} tinta={4.5} />
        <Forma d={poli(corbata)} fill={C.rojo} tinta={4.5} />
        <Forma d={poli(nudo)} fill={C.rojo} tinta={4.5} />
        <path d={poli(bolsillo)} fill="none" stroke={C.amarilloSombra} strokeWidth={4} transform={`translate(${REG[0]} ${REG[1]})`} />
        <path d={poli(bolsillo)} fill="none" stroke={TINTA} strokeWidth={3} />
      </g>
    );
  };
  const cabeza = (): React.ReactNode => {
    const cc = pr(E.cabeza), cu = pr(E.cuello);
    const up: P = [cc[0] - cu[0], cc[1] - cu[1]];
    const n = Math.hypot(up[0], up[1]) || 1;
    const giro = (Math.atan2(up[0] / n, -up[1] / n) * 180) / Math.PI;
    const s = sz(E.cabeza);
    const centro: P = [cc[0] + (up[0] / n) * 8, cc[1] + (up[1] / n) * 8];
    return (
      <g key="cabeza">
        <Forma d={capsula(cu, cc, 21 * s, 21 * s)} fill={PIEL_BASE} tinta={6} />
        <Cabeza c={centro} giro={giro} s={s} frente={E.frente} ojos={pose.ojos} cara={pose.cara} t={t} />
      </g>
    );
  };

  const pies = [pierna(0), pierna(1)].sort((p, q) => p.z - q.z);
  const brazos = [brazo(0), brazo(1)].sort((p, q) => p.z - q.z);
  const zTorso = E.pecho[2];
  return (
    <g>
      {pies.map((p) => p.el)}
      {brazos[0].z < zTorso && brazos[0].el}
      {torso()}
      {brazos[0].z >= zTorso && brazos[0].el}
      {cabeza()}
      {brazos[1].el}
    </g>
  );
};
