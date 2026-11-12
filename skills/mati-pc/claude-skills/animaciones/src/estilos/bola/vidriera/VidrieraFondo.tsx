import React from 'react';
import {rng} from '../../../comun/curvas';
import {ALTO, MESA, MURO_X, PAPELERA, PLACA, SILLA, STUD, SUELO, Z_PARED, type P, type V3} from '../escena';
import {aMano, caja3, cilindro3, elipse, enCara, pr, recto, suave, suaveAbierto, type Cara3} from './geo';
import {GRISALLA, Pieza, Plomo, Traza, VID, aclara, deriva} from './vidrio';

// VIDRIERA, EL DECORADO: la oficina de los bloques hecha vidriera, con todo en su sitio (la cortinilla pasa
// de un estilo a otro y nada puede saltar). La pared del fondo es la red de rombos de cobalto de las vidrieras viejas, cada rombo con
// su florecita de grisalla; en ella, la ventana de la oficina (el vidrio más claro: por ahí entra el sol), el póster de la diana
// (anillos de rubí y blanco en ámbar), la balda con sus libros, la mesa con su monitor turquesa, la taza y dos bolas de otros días;
// el suelo, losetas de ámbar en perspectiva con su red de plomo; a la derecha, la otra pared en morado. Todo quieto: se calcula una
// vez. Las sombras no existen en el vidrio: lo que asienta las cosas es la grisalla («matting») pintada en el suelo.

const pared = (x: number, y: number, z = Z_PARED): P => pr([x, y, z]);
const suelo = (x: number, z: number): P => pr([x, SUELO, z]);

// ---------------------------------------------------------------- la pared: la red de rombos
const ROMBO = {a: 64, b: 88, x0: 540, y0: 26};
const X_PARED = pr([MURO_X, 0, Z_PARED])[0]; // donde empieza la pared de la derecha (≈ 1005)
const Y_SUELO = suelo(540, Z_PARED)[1]; // donde empieza el suelo (≈ 1437)
const vRombo = (i: number, j: number): P => {
  const r = rng(i * 131 + j * 7919 + 17);
  return [ROMBO.x0 + i * ROMBO.a + (r() - 0.5) * 12, ROMBO.y0 + j * ROMBO.b + (r() - 0.5) * 12];
};

const Rombos: React.FC = () => {
  const fills: React.ReactElement[] = [];
  const motivos: React.ReactElement[] = [];
  const I0 = -9, I1 = 9, J0 = -1, J1 = 18;
  for (let i = I0; i <= I1; i++) for (let j = J0; j <= J1; j++) {
    if ((i + j) % 2 === 0) continue;
    const c: P = [ROMBO.x0 + i * ROMBO.a, ROMBO.y0 + j * ROMBO.b];
    if (c[0] < -40 || c[0] > X_PARED + 70 || c[1] > Y_SUELO + 90) continue;
    const pts = [vRombo(i - 1, j), vRombo(i, j - 1), vRombo(i + 1, j), vRombo(i, j + 1)];
    const r = rng(i * 53 + j * 977);
    const base = r() < 0.5 ? VID.cobalto : r() < 0.6 ? VID.cobalto2 : VID.cobaltoO;
    const k = `${i}-${j}`;
    fills.push(<path key={k} d={recto(pts)} fill={deriva(base, i * 31 + j * 7, 1.3)} />);
    fills.push(<path key={k + 'c'} d={recto(pts)} fill="url(#vd-centro)" />);
    // la florecita: cuatro pétalos y el botón (grisalla) y el toque rascado (la luz que deja pasar la pintura raspada)
    const flor = (j + 100) % 2 === 0;
    const s = 0.8 + r() * 0.25;
    if (flor) {
      const pet = [0, 1, 2, 3].map((q) => {
        const a = (q * Math.PI) / 2 + Math.PI / 4;
        const px = c[0] + Math.cos(a) * 11 * s, py = c[1] + Math.sin(a) * 11 * s;
        return `M ${(px - 7 * s).toFixed(1)} ${py.toFixed(1)} a ${(7 * s).toFixed(1)} ${(7 * s).toFixed(1)} 0 1 0 ${(14 * s).toFixed(1)} 0 a ${(7 * s).toFixed(1)} ${(7 * s).toFixed(1)} 0 1 0 ${(-14 * s).toFixed(1)} 0`;
      }).join(' ');
      motivos.push(<path key={k + 'f'} d={pet} fill={GRISALLA} fillOpacity={0.42} />);
      motivos.push(<circle key={k + 'b'} cx={c[0]} cy={c[1]} r={4.5 * s} fill="#ffffff" fillOpacity={0.3} />);
    } else {
      motivos.push(<circle key={k + 'a'} cx={c[0]} cy={c[1]} r={15 * s} fill="none" stroke={GRISALLA} strokeOpacity={0.4} strokeWidth={4} />);
      motivos.push(<circle key={k + 'p'} cx={c[0]} cy={c[1]} r={4 * s} fill={GRISALLA} fillOpacity={0.45} />);
      motivos.push(<path key={k + 'r'} d={`M ${(c[0] - 9 * s).toFixed(1)} ${(c[1] - 9 * s).toFixed(1)} q ${(4 * s).toFixed(1)} ${(-5 * s).toFixed(1)} ${(10 * s).toFixed(1)} ${(-4 * s).toFixed(1)}`}
        fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" />);
    }
  }
  // el plomo: las diagonales de la red (cada una, una línea que pasa por los vértices compartidos)
  const plomos: React.ReactElement[] = [];
  for (let c0 = I0 - J1; c0 <= I1 - J0; c0++) {
    if ((c0 + 1000) % 2 !== 0) continue;
    const a: P[] = [], b: P[] = [];
    for (let j = J0; j <= J1; j++) {
      const i = j + c0;
      if (i >= I0 - 1 && i <= I1 + 1) a.push(vRombo(i, j));
      const i2 = c0 - j;
      if (i2 >= I0 - 1 && i2 <= I1 + 1) b.push(vRombo(i2, j));
    }
    if (a.length > 1) plomos.push(<Plomo key={'a' + c0} d={recto(a, false)} w={8} />);
    if (b.length > 1) plomos.push(<Plomo key={'b' + c0} d={recto(b, false)} w={8} />);
  }
  return (
    <g>
      {fills}
      <rect x={0} y={0} width={X_PARED} height={Y_SUELO} fill="url(#vd-tex-1)" />
      {motivos}
      {plomos}
    </g>
  );
};

// ---------------------------------------------------------------- la pared de la derecha (en perspectiva, morada)
const ParedDerecha: React.FC = () => {
  const out: React.ReactElement[] = [];
  const zs = [Z_PARED, Z_PARED + 128, Z_PARED + 256, Z_PARED + 384];
  for (let k = 0; k < 12; k++) {
    const y1 = SUELO - k * 2 * ALTO, y0 = SUELO - (k + 1) * 2 * ALTO;
    for (let m = 0; m < zs.length - 1; m++) {
      const z0 = zs[m] + (k % 2 ? 64 : 0), z1 = zs[m + 1] + (k % 2 ? 64 : 0);
      const pts = [pr([MURO_X, y0, z0]), pr([MURO_X, y0, z1]), pr([MURO_X, y1, z1]), pr([MURO_X, y1, z0])];
      out.push(<Pieza key={`${k}-${m}`} d={recto(pts)} color={deriva(VID.murrey, k * 7 + m, 1.4)} semilla={k + m} plomo={8} sombra={0.25} />);
    }
  }
  return <g>{out}</g>;
};

// ---------------------------------------------------------------- el suelo: losetas de ámbar en perspectiva
const Suelo: React.FC = () => {
  const xs: number[] = [];
  for (let x = MURO_X; x > -900; x -= 2 * STUD) xs.push(x);
  const zs: number[] = [];
  for (let z = Z_PARED; z < 1000; z += 2 * STUD) zs.push(z);
  const v = (k: number, m: number): P => {
    const r = rng(k * 211 + m * 3301 + 5);
    const borde = k === 0 || m === 0;
    return suelo(xs[k] + (borde ? 0 : (r() - 0.5) * 16), zs[m] + (borde ? 0 : (r() - 0.5) * 16));
  };
  const fills: React.ReactElement[] = [];
  for (let k = 0; k < xs.length - 1; k++) for (let m = 0; m < zs.length - 1; m++) {
    const pts = [v(k, m), v(k + 1, m), v(k + 1, m + 1), v(k, m + 1)];
    const base = (k + m) % 2 ? VID.suelo1 : VID.suelo2;
    fills.push(<path key={`${k}-${m}`} d={recto(pts)} fill={deriva(base, k * 17 + m * 5, 1.2)} />);
    fills.push(<path key={`${k}-${m}c`} d={recto(pts)} fill="url(#vd-centro)" />);
    // un rombito de grisalla en cada loseta (la que se ve de lejos se pierde: solo en las de delante)
    if (m > 2 && (k + m) % 2 === 0) {
      const c = suelo((xs[k] + xs[k + 1]) / 2, (zs[m] + zs[m + 1]) / 2);
      const s = pr([0, SUELO, (zs[m] + zs[m + 1]) / 2]);
      const e = (s[1] - 300) / 1270; // la escala a esa profundidad
      const w = 22 * e, h = 9 * e;
      fills.push(<path key={`${k}-${m}m`} d={`M ${c[0] - w} ${c[1]} L ${c[0]} ${c[1] - h} L ${c[0] + w} ${c[1]} L ${c[0]} ${c[1] + h} Z`} fill={GRISALLA} fillOpacity={0.28} />);
    }
  }
  const plomos: React.ReactElement[] = [];
  for (let k = 0; k < xs.length; k++) plomos.push(<Plomo key={'x' + k} d={recto(zs.map((_, m) => v(k, m)), false)} w={8} />);
  for (let m = 0; m < zs.length; m++) plomos.push(<Plomo key={'z' + m} d={recto(xs.map((_, k) => v(k, m)), false)} w={8} />);
  const y0 = Y_SUELO;
  return (
    <g>
      {fills}
      <rect x={0} y={y0} width={1080} height={1920 - y0} fill="url(#vd-tex-2)" />
      {plomos}
    </g>
  );
};

// la grisalla del suelo bajo lo que pesa (la silla, la papelera, las patas de la mesa)
const manchaSuelo = (x: number, z: number, rx: number, rz: number, op: number, key: string) => {
  const c = suelo(x, z);
  const e = (c[1] - 300) / 1270;
  const ry = Math.abs(suelo(x, z + rz)[1] - suelo(x, z - rz)[1]) / 2;
  return <ellipse key={key} cx={c[0]} cy={c[1]} rx={rx * e} ry={ry} fill="url(#vd-mancha)" opacity={op} />;
};
const Manchas: React.FC = () => (
  <g>
    {manchaSuelo(SILLA.x + 10, SILLA.z, 190, 150, 0.75, 'silla')}
    {manchaSuelo(PAPELERA.x + 14, PAPELERA.z + 4, 175, 150, 0.85, 'papelera')}
    {[MESA.x0 + 30, MESA.x1 - 30].map((x) => [MESA.z0 + 30, MESA.z1 - 30].map((z) => manchaSuelo(x + 6, z, 62, 50, 0.6, `m${x}${z}`)))}
  </g>
);

// ---------------------------------------------------------------- la ventana de la oficina (por ella entra el sol)
export const SOL_VENTANA: P = [318, 392];
const VENT = {x0: 0, x1: 6 * STUD, yA: SUELO - 17 * ALTO, yB: SUELO - 11 * ALTO};
// una nube: la unión de sus círculos, vista desde su centro
const nube = (circ: [number, number, number][], n = 44): P[] => {
  const cx = circ.reduce((s, c) => s + c[0], 0) / circ.length, cy = circ.reduce((s, c) => s + c[1], 0) / circ.length;
  const out: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
    let best = 0;
    for (const [x, y, r] of circ) {
      const ox = x - cx, oy = y - cy;
      const b = ox * dx + oy * dy, c = ox * ox + oy * oy - r * r, disc = b * b - c;
      if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc));
    }
    out.push([cx + dx * best, cy + dy * best]);
  }
  return out;
};

const Ventana: React.FC = () => {
  const {x0, x1, yA, yB} = VENT;
  const xm = (x0 + x1) / 2, yT = yA + (yB - yA) * 0.45;
  const hueco = recto([pared(x0, yA), pared(x1, yA), pared(x1, yB), pared(x0, yB)]);
  // los cuatro vidrios del cielo (arriba más azul, abajo más claro, como un cielo de verdad)
  const panos: [number, number, number, number, string][] = [
    [x0, yA, xm, yT, VID.celeste], [xm, yA, x1, yT, VID.celeste], [x0, yT, xm, yB, VID.cielo], [xm, yT, x1, yB, VID.cielo],
  ];
  const zN = Z_PARED - 220, zA = Z_PARED - 200;
  const nubes = [[90, 300, 1], [300, 250, 0.8]].map(([cx, cy, s]) =>
    nube(([[-46, 8, 34], [-10, -8, 44], [30, 4, 36], [62, 12, 24]] as [number, number, number][]).map(([bx, by, br]) => {
      const q = pr([cx + bx * s, cy + by * s, zN]);
      return [q[0], q[1], br * s * 0.85] as [number, number, number];
    })),
  );
  const arboles = ([[60, 610, 70], [170, 580, 92], [290, 600, 80], [380, 620, 64]] as [number, number, number][]).map(([x, y, r]) => {
    const q = pr([x, y, zA]);
    return {c: q, r: r * 0.853};
  });
  // la maceta y sus hojas, en el alféizar
  const zM = Z_PARED + 50;
  const maceta = recto(aMano([pr([300 - 32, SUELO - 11 * ALTO - 3 - 52, zM]), pr([300 + 32, SUELO - 11 * ALTO - 3 - 52, zM]), pr([300 + 26, SUELO - 11 * ALTO - 3, zM]), pr([300 - 26, SUELO - 11 * ALTO - 3, zM])], 61, 1));
  const base = pr([300, SUELO - 11 * ALTO - 3 - 45, zM]);
  const hojas = ([[-0.4, 70], [0, 92], [0.45, 66]] as [number, number][]).map(([a, l], k) => {
    const tip: P = pr([300 - Math.sin(a) * l, SUELO - 11 * ALTO - 3 - 45 - Math.cos(a) * l, zM]);
    const dx = tip[0] - base[0], dy = tip[1] - base[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    const w = 13;
    const mid: P = [base[0] + dx * 0.5, base[1] + dy * 0.5];
    return {k, d: suave([base, [mid[0] + nx * w, mid[1] + ny * w], tip, [mid[0] - nx * w, mid[1] - ny * w]], 0.9), base, tip};
  });
  // el marco: arriba, los lados, el parteluz, el travesaño y el alféizar (vidrio blanco verdoso)
  const marco: [P[], string, number][] = [
    [[pared(x0 - 20, yA - 24, Z_PARED + 10), pared(x1 + 20, yA - 24, Z_PARED + 10), pared(x1 + 20, yA + 16, Z_PARED + 10), pared(x0 - 20, yA + 16, Z_PARED + 10)], VID.blancoV, 1],
    [[pared(x0 - 18, yA - 4, Z_PARED + 10), pared(x0 + 18, yA - 4, Z_PARED + 10), pared(x0 + 18, yB + 15, Z_PARED + 10), pared(x0 - 18, yB + 15, Z_PARED + 10)], VID.blancoV, 2],
    [[pared(x1 - 18, yA - 4, Z_PARED + 10), pared(x1 + 18, yA - 4, Z_PARED + 10), pared(x1 + 18, yB + 15, Z_PARED + 10), pared(x1 - 18, yB + 15, Z_PARED + 10)], VID.blancoV, 3],
    [[pared(xm - 11, yA, Z_PARED - 20), pared(xm + 11, yA, Z_PARED - 20), pared(xm + 11, yB, Z_PARED - 20), pared(xm - 11, yB, Z_PARED - 20)], VID.blanco, 4],
    [[pared(x0 + 16, yT - 11, Z_PARED - 20), pared(x1 - 16, yT - 11, Z_PARED - 20), pared(x1 - 16, yT + 11, Z_PARED - 20), pared(x0 + 16, yT + 11, Z_PARED - 20)], VID.blanco, 5],
  ];
  const zS0 = Z_PARED - 25, zS1 = Z_PARED + 85, yS = yB + 14 - 17;
  const alfeizarArriba = [pr([x0 - 35, yS, zS0]), pr([x1 + 35, yS, zS0]), pr([x1 + 35, yS, zS1]), pr([x0 - 35, yS, zS1])];
  const alfeizarDelante = [pr([x0 - 35, yS, zS1]), pr([x1 + 35, yS, zS1]), pr([x1 + 35, yS + 34, zS1]), pr([x0 - 35, yS + 34, zS1])];
  return (
    <g>
      <defs>
        <clipPath id="vd-hueco"><path d={hueco} /></clipPath>
      </defs>
      <g clipPath="url(#vd-hueco)">
        {panos.map(([a, b, c, d, col], k) => (
          <Pieza key={k} d={recto([pared(a, b), pared(c, b), pared(c, d), pared(a, d)])} color={deriva(col, 400 + k, 0.6)} semilla={k + 2} plomo={8} borde={0.6} />
        ))}
        {/* el sol, detrás de todo: un disco de vidrio dorado casi blanco, con su corona de rayos pintados */}
        <Pieza d={suave(elipse(SOL_VENTANA, 40, 40, 20), 0.5)} color="#fff4c8" semilla={7} plomo={7} borde={0} sinCentro>
          <circle cx={SOL_VENTANA[0]} cy={SOL_VENTANA[1]} r={24} fill="#ffffff" fillOpacity={0.7} />
        </Pieza>
        {Array.from({length: 10}, (_, q) => {
          const a = (q / 10) * Math.PI * 2 + 0.2;
          const p0: P = [SOL_VENTANA[0] + Math.cos(a) * 50, SOL_VENTANA[1] + Math.sin(a) * 50];
          const p1: P = [SOL_VENTANA[0] + Math.cos(a) * 74, SOL_VENTANA[1] + Math.sin(a) * 74];
          return <Pieza key={'s' + q} d={recto([p0, [p1[0] + Math.sin(a) * 7, p1[1] - Math.cos(a) * 7], [p1[0] - Math.sin(a) * 7, p1[1] + Math.cos(a) * 7]])} color={VID.ambarC} semilla={q} plomo={5} borde={0} />;
        })}
        {nubes.map((pts, k) => <Pieza key={'n' + k} d={suave(pts, 0.4)} color={VID.nube} semilla={9 + k} plomo={7} borde={0.4} />)}
        {arboles.map((a, k) => (
          <Pieza key={'a' + k} d={suave(aMano(elipse(a.c, a.r, a.r, 22), 80 + k, 2), 0.5)} color={deriva(k % 2 ? VID.verde : VID.verdeC, 90 + k)} semilla={k} plomo={8}>
            {/* las hojas, pintadas: arquitos de grisalla y sus toques rascados */}
            {Array.from({length: 7}, (_, q) => {
              const r = rng(300 + k * 11 + q);
              const px = a.c[0] + (r() - 0.5) * a.r * 1.2, py = a.c[1] + (r() - 0.6) * a.r * 1.1;
              return <path key={q} d={`M ${(px - 9).toFixed(1)} ${py.toFixed(1)} q 9 -9 18 0`} fill="none" stroke={GRISALLA} strokeOpacity={0.5} strokeWidth={3.2} strokeLinecap="round" />;
            })}
          </Pieza>
        ))}
      </g>
      {marco.map(([pts, col, k]) => <Pieza key={'m' + k} d={recto(aMano(pts, 120 + k, 0.8))} color={deriva(col, 130 + k, 0.5)} semilla={k + 3} plomo={8} borde={0.5} />)}
      {/* el alféizar, con la maceta y sus hojas encima */}
      <Pieza d={recto(alfeizarDelante)} color={deriva(VID.blancoV, 141, 0.4)} semilla={1} plomo={8} borde={0.6} sombra={0.18} />
      <Pieza d={recto(alfeizarArriba)} color={aclara(VID.blanco, 0.2)} semilla={2} plomo={7} borde={0.3} />
      {hojas.map((h) => <Pieza key={'h' + h.k} d={h.d} color={deriva(VID.verdeC, 150 + h.k)} semilla={h.k + 1} plomo={6} borde={0.4} />)}
      <Pieza d={maceta} color={VID.naranja} semilla={4} plomo={7} borde={0.6}>
        <path d={recto([pr([300 - 32, SUELO - 11 * ALTO - 3 - 52, zM]), pr([300 + 32, SUELO - 11 * ALTO - 3 - 52, zM]), pr([300 + 30, SUELO - 11 * ALTO - 3 - 40, zM]), pr([300 - 30, SUELO - 11 * ALTO - 3 - 40, zM])])}
          fill={GRISALLA} fillOpacity={0.3} />
      </Pieza>
    </g>
  );
};

// ---------------------------------------------------------------- el póster de la diana (lo que él quiere y no le sale)
const Poster: React.FC = () => {
  const z = Z_PARED + 6;
  const W = 250, H = 340;
  const x0 = 808 - W / 2, y0 = 412 - H / 2;
  const enPoster = (u: number, v: number): P => pr([x0 + (u / 256) * W, y0 + (v / 340) * H, z + 5]);
  const marco = [pr([808 - 135, 412 - 180, z]), pr([808 + 135, 412 - 180, z]), pr([808 + 135, 412 + 180, z]), pr([808 - 135, 412 + 180, z])];
  const papel = [enPoster(0, 0), enPoster(256, 0), enPoster(256, 340), enPoster(0, 340)];
  const c = enPoster(128, 150);
  const esc = (enPoster(256, 0)[0] - enPoster(0, 0)[0]) / 256;
  const anillos = [104, 83, 62, 41, 20].map((r, k) => ({r: r * esc, col: k % 2 ? VID.blanco : VID.rubi, k}));
  const flecha = [enPoster(170, 108), enPoster(232, 52)];
  const pluma = [enPoster(232, 52), enPoster(252, 28), enPoster(240, 46), enPoster(258, 40), enPoster(236, 58)];
  return (
    <g>
      <Pieza d={recto(marco)} color={VID.blanco} semilla={5} plomo={9} borde={0.5} />
      <Pieza d={recto(aMano(papel, 171, 1))} color={VID.ambar} semilla={6} plomo={8}>
        {/* los dos renglones de abajo, pintados */}
        <path d={recto([enPoster(40, 282), enPoster(216, 282), enPoster(216, 298), enPoster(40, 298)])} fill={GRISALLA} fillOpacity={0.75} />
        <path d={recto([enPoster(70, 308), enPoster(186, 308), enPoster(186, 320), enPoster(70, 320)])} fill={GRISALLA} fillOpacity={0.6} />
      </Pieza>
      {anillos.map((a) => (
        <Pieza key={a.k} d={suave(aMano(elipse(c, a.r, a.r, 30), 180 + a.k, 0.8), 0.5)} color={deriva(a.col, 190 + a.k, 0.6)} semilla={a.k + 1} plomo={a.k > 2 ? 6 : 8} borde={0.5} />
      ))}
      <Plomo d={recto(flecha, false)} w={7} borde={0.3} />
      <Pieza d={recto(pluma)} color={VID.cobalto2} semilla={3} plomo={5} borde={0.2} />
    </g>
  );
};

// ---------------------------------------------------------------- la balda con sus libros
const Balda: React.FC = () => {
  const zB = Z_PARED + 70;
  const z0 = zB - 64, z1 = zB + 64;
  const yA = 830 - PLACA; // arriba de la balda (y de la pantalla)
  const arriba = [pr([628, yA, z0]), pr([1012, yA, z0]), pr([1012, yA, z1]), pr([628, yA, z1])];
  const delante = [pr([628, yA, z1]), pr([1012, yA, z1]), pr([1012, 830, z1]), pr([628, 830, z1])];
  const cols = [VID.rubi, VID.ambar, VID.verde, VID.cobalto2, VID.naranja];
  const libros = cols.map((col, k) => {
    const h = ALTO * (1.6 + (k % 3) * 0.3);
    const cx = 680 + k * 60;
    const giro = k === 4 ? 0.35 : 0;
    // el libro, de lado (lomo hacia la cámara), girado si se cae
    const esq = (dx: number, dy: number, z: number): P => {
      const x = cx + dx * Math.cos(giro) + dy * Math.sin(giro), y = yA - (dy * Math.cos(giro) - dx * Math.sin(giro));
      return pr([x, y, z]);
    };
    const lomo = [esq(-32, h, z1), esq(32, h, z1), esq(32, 0, z1), esq(-32, 0, z1)];
    const tapa = [esq(-32, h, z0), esq(32, h, z0), esq(32, h, z1), esq(-32, h, z1)];
    return {k, col, lomo, tapa, a: esq(-32, h * 0.22, z1), b: esq(32, h * 0.22, z1), a2: esq(-32, h * 0.8, z1), b2: esq(32, h * 0.8, z1)};
  });
  return (
    <g>
      {libros.map((l) => (
        <g key={l.k}>
          <Pieza d={recto(l.tapa)} color={aclara(l.col, 0.25)} semilla={l.k} plomo={6} borde={0.3} />
          <Pieza d={recto(aMano(l.lomo, 210 + l.k, 0.6))} color={deriva(l.col, 220 + l.k, 0.6)} semilla={l.k + 2} plomo={8} borde={0.6}>
            <Traza d={recto([l.a, l.b], false)} w={4} op={0.55} />
            <Traza d={recto([l.a2, l.b2], false)} w={4} op={0.55} />
          </Pieza>
        </g>
      ))}
      <Pieza d={recto(arriba)} color={aclara(VID.blanco, 0.3)} semilla={4} plomo={7} borde={0.3} />
      <Pieza d={recto(delante)} color={VID.blancoV} semilla={5} plomo={8} borde={0.5} sombra={0.15} />
    </g>
  );
};

// ---------------------------------------------------------------- la mesa: las patas, el tablero, el monitor, la taza, los papeles y dos bolas viejas
const caras = (cs: Cara3[], col: string, semilla: number, key: string, plomo = 8) =>
  cs.map((c, k) => {
    // la grisalla de volumen: la cara de arriba, más clara; las de los lados, más apagadas
    const arriba = c.eje === 1 && c.signo === -1;
    const lado = c.eje === 0;
    return <Pieza key={key + k} d={recto(c.pts)} color={arriba ? aclara(col, 0.18) : col} semilla={semilla + k} plomo={plomo} sombra={lado ? 0.38 : arriba ? 0 : 0.08} borde={0.7} />;
  });
const X: V3 = [1, 0, 0], Y: V3 = [0, 1, 0], Zv: V3 = [0, 0, 1];

const Mesa: React.FC = () => {
  const top = SUELO - MESA.alto;
  const grueso = PLACA * 1.5;
  const cx = (MESA.x0 + MESA.x1) / 2, cz = (MESA.z0 + MESA.z1) / 2;
  const patas = [MESA.x0 + 30, MESA.x1 - 30].flatMap((x) => [MESA.z0 + 30, MESA.z1 - 30].map((z) => ({x, z})));
  const alto = MESA.alto - grueso;
  // el monitor: girado 0,45 rad, de pie en la mesa
  const g = 0.45;
  const ejeX: V3 = [Math.cos(g), 0, -Math.sin(g)], ejeZ: V3 = [Math.sin(g), 0, Math.cos(g)];
  const mBase: V3 = [40, top, -170];
  const enMon = (dx: number, dy: number, dz: number): V3 => [mBase[0] + ejeX[0] * dx + ejeZ[0] * dz, mBase[1] - dy, mBase[2] + ejeX[2] * dx + ejeZ[2] * dz];
  const pantallaC = enMon(0, PLACA + ALTO * 1.05 + 1.5 * ALTO, 12);
  const pantM: [number, number, number] = [2 * STUD, 1.5 * ALTO, 15];
  const pantE: [V3, V3, V3] = [ejeX, [0, -1, 0], ejeZ];
  const pantalla = caja3(pantallaC, pantE, pantM);
  const vidrioPant = [-0.86, 0.86].flatMap((u) => [0.84, -0.84].map((v) => [u, v] as [number, number]));
  const pant = [vidrioPant[0], vidrioPant[2], vidrioPant[3], vidrioPant[1]].map(([u, v]) => enCara(pantallaC, pantE, pantM, 2, 1, u, v));
  const cuello = caja3(enMon(0, PLACA + (ALTO * 1.1) / 2, 0), pantE, [STUD / 2, (ALTO * 1.1) / 2, STUD / 2]);
  const pie = caja3(enMon(0, PLACA / 2, 0), pantE, [STUD, PLACA / 2, STUD]);
  // la taza roja
  const taza = cilindro3([205, top, -80], [0, -1, 0], ALTO * 0.95, 28, 22);
  const asa = elipse(pr([235, top - ALTO * 0.5, -80]), 17, 17, 16);
  const bocaTaza = elipse(pr([205, top - ALTO * 0.95, -80]), 27, 6, 18);
  // los papeles (tres hojas apiladas) y las dos bolas de otros días
  const hojas = [0, 1, 2].map((k) => {
    const c: V3 = [150 + k * 3, top - 15 - k * 7, -190 + k * 4];
    const a = 0.08 * (k - 1);
    const d = (dx: number, dz: number): V3 => [c[0] + dx * Math.cos(a) + dz * Math.sin(a), c[1], c[2] - dx * Math.sin(a) + dz * Math.cos(a)];
    return [d(-75, -55), d(75, -55), d(75, 55), d(-75, 55)].map(pr);
  });
  const bolas = ([[-10, top - 42, -90, 34, 7], [60, top - 40, -60, 32, 11]] as [number, number, number, number, number][]).map(([x, y, z, r, s]) => {
    const c = pr([x, y, z]);
    const R = rng(s);
    return {c, d: suave(Array.from({length: 11}, (_, i) => {
      const a = (i / 11) * Math.PI * 2;
      const rr = r * (0.84 + R() * 0.2);
      return [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr] as P;
    }), 0.3), s};
  });
  return (
    <g>
      {patas.map((p, k) => <g key={k}>{caras(caja3([p.x, SUELO - alto / 2, p.z], [X, Y, Zv], [STUD / 2, alto / 2, STUD / 2]), VID.humo, 30 + k * 3, 'p' + k)}</g>)}
      {caras(caja3([cx, top + grueso / 2, cz], [X, Y, Zv], [(5 * STUD) / 2, grueso / 2, (3 * STUD) / 2]), VID.nogal, 40, 't', 9)}
      {/* las vetas del tablero, pintadas (en la cara de arriba) */}
      <g>
        {[0.25, 0.55, 0.8].map((v, k) => (
          <Traza key={k} d={suaveAbierto([pr([MESA.x0 + 10, top, MESA.z0 + 40 + v * 150]), pr([MESA.x0 + 140, top, MESA.z0 + 34 + v * 150]), pr([MESA.x1 - 10, top, MESA.z0 + 44 + v * 150])])} w={2.5} op={0.4} />
        ))}
      </g>
      {caras(pie, VID.humoO, 50, 'pie', 7)}
      {caras(cuello, VID.humoO, 54, 'cu', 7)}
      {caras(pantalla, VID.humoO, 58, 'pa', 9)}
      <Pieza d={recto(pant)} color={VID.turquesa} semilla={2} plomo={6} borde={0.7} luz={0.15}>
        {/* la pantalla encendida: dos renglones de luz */}
        <Traza d={recto([enCara(pantallaC, pantE, pantM, 2, 1, -0.6, 0.35), enCara(pantallaC, pantE, pantM, 2, 1, 0.5, 0.35)], false)} w={6} op={0.25} color="#ffffff" />
        <Traza d={recto([enCara(pantallaC, pantE, pantM, 2, 1, -0.6, 0.05), enCara(pantallaC, pantE, pantM, 2, 1, 0.2, 0.05)], false)} w={6} op={0.2} color="#ffffff" />
      </Pieza>
      {hojas.map((h, k) => <Pieza key={'h' + k} d={recto(h)} color={k % 2 ? VID.blanco : aclara(VID.blancoV, 0.2)} semilla={k} plomo={5} borde={0.3} />)}
      <Pieza d={suave(asa, 0.5)} color={VID.rubiO} semilla={3} plomo={6} borde={0.3} />
      <Pieza d={recto(taza)} color={VID.rubi} semilla={4} plomo={7} borde={0.6} />
      <Pieza d={suave(bocaTaza, 0.5)} color={VID.rubiProfundo} semilla={5} plomo={5} borde={0.2} />
      {bolas.map((b) => <Pieza key={'b' + b.s} d={b.d} color={VID.blanco} semilla={b.s} plomo={6} borde={0.4} />)}
    </g>
  );
};

// ---------------------------------------------------------------- todo el decorado, de atrás adelante (se arma una vez)
let FONDO: React.ReactElement | null = null;
export const fondo = () =>
  (FONDO ??= (
    <g>
      <Rombos />
      <ParedDerecha />
      <Suelo />
      <Manchas />
      <Ventana />
      <Poster />
      <Balda />
      <Mesa />
    </g>
  ));

export {Y_SUELO, X_PARED};
