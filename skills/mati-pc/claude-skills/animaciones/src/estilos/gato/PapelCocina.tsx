import React from 'react';
import {rng} from '../../comun/curvas';
import {BORDE, FONDO_SUELO, MESA_G, MESA_Y, SUELO, type P} from './escena';
import {circuloPts, hojaPts, nubePts, recorte, rectPts, tiraPts} from '../PapelGeo';
import {chincheta, f, type Tinta} from './PapelTintas';
import {cuadratica} from './PapelCorte';

// La cocina de papel del gato: la pared de rayas con su guirnalda, una repisa con tarros y una maceta, un cuadro con un
// pez (el gato ya sabe lo que quiere), la ventana con el cielo, el sol y la ciudad, cortinas lila con su cenefa, el zócalo de
// azulejos menta, el suelo de baldosas en perspectiva, la mesa de madera con sus patas y el comedero vacío. Todo se arma una vez
// (las piezas no cambian de un cuadro a otro: el borde de cada una es siempre el mismo).

const F = FONDO_SUELO;
let semilla = 100;
const S = () => (semilla += 37);

// una pieza de papel cortada: su forma, su cartulina y la sombra que deja sobre lo de detrás
const pz = (pts: P[], t: Tinta, s: string | null = 's1', amp = 1.5, props?: React.SVGProps<SVGPathElement>, paso = 18) => (
  <path key={semilla} d={recorte(pts, S(), amp, paso)} fill={f(t)} filter={s ? `url(#gpp-${s})` : undefined} {...props} />
);

// las hojas de una planta de papel, en abanico, cada una con su pliegue claro
export const hojasPlanta = (base: P, alto: number, ancho: number, sem: number, n = 9, abre = 125) => {
  const r = rng(sem);
  const hojas: {orden: number; pts: P[]; mitad: P[]; i: number}[] = [];
  for (let i = 0; i < n; i++) {
    const lado = i / (n - 1) - 0.5;
    const ang = (-90 + lado * abre + (r() - 0.5) * 14) * (Math.PI / 180);
    const largo = alto * (1 - Math.abs(lado) * 0.75) * (0.85 + r() * 0.25);
    const curva = lado * (0.9 + r() * 0.5);
    const w = Math.max(8, ancho * (0.17 + r() * 0.05));
    const b: P = [base[0] + lado * ancho * 0.18, base[1] + 4];
    hojas.push({orden: Math.abs(lado) + r() * 0.05, pts: hojaPts(b, ang, largo, w, curva), mitad: hojaPts(b, ang, largo, w, curva, true), i});
  }
  return hojas.sort((a, b) => b.orden - a.orden);
};
const planta = (base: P, alto: number, ancho: number, sem: number, tintas: Tinta[], claro: Tinta, s = 's1', n = 9, abre = 125) =>
  hojasPlanta(base, alto, ancho, sem, n, abre).map((h) => (
    <g key={'h' + sem + '-' + h.i}>
      {pz(h.pts, tintas[h.i % tintas.length], s, 1.1)}
      {pz(h.mitad, claro, null, 0.8, {opacity: 0.5})}
    </g>
  ));

// ---------------------------------------------------------------- la pared de arriba: repisa, cuadro, ventana y cortinas
const repisa = (
  <g>
    {/* los tarros: cristal, lo de dentro, la etiqueta y la tapa */}
    {([
      {x: 58, w: 66, h: 104, tapa: 'coral', dentro: 'cafeC', lleno: 0.62},
      {x: 134, w: 54, h: 84, tapa: 'mostaza', dentro: 'mostaza', lleno: 0.55},
      {x: 198, w: 46, h: 64, tapa: 'menta', dentro: 'crema', lleno: 0.7},
    ] as {x: number; w: number; h: number; tapa: Tinta; dentro: Tinta; lleno: number}[]).map((j) => {
      const y0 = 452 - j.h;
      return (
        <g key={j.x}>
          {pz(rectPts(j.x, y0 + 8, j.w, j.h - 8, 10), 'cristal', 's1', 1.2)}
          {pz(rectPts(j.x + 5, y0 + 8 + (j.h - 8) * (1 - j.lleno), j.w - 10, (j.h - 8) * j.lleno - 5, 7), j.dentro, null, 0.9)}
          {pz(rectPts(j.x + 8, y0 + j.h * 0.42, j.w - 16, j.h * 0.24, 2), 'crema', 's0', 0.7)}
          {pz(rectPts(j.x - 4, y0, j.w + 8, 16, 4), j.tapa, 's0', 1)}
          {pz(rectPts(j.x + 9, y0 + 14, 6, j.h - 30, 3), 'nube', null, 0.4, {opacity: 0.55})}
        </g>
      );
    })}
    {/* la maceta con su planta */}
    {planta([252, 398], 104, 104, 71, ['verde1', 'verde2', 'verde3'], 'verde3', 's1', 7, 110)}
    {pz([[224, 398], [282, 398], [276, 452], [230, 452]], 'terracota', 's1', 1.2)}
    {pz([[220, 394], [286, 394], [285, 414], [221, 414]], 'terracota2', 's0', 1)}
    {/* la tabla y sus escuadras */}
    {pz([[88, 470], [112, 470], [96, 506]], 'madera2', 's1', 0.8)}
    {pz([[270, 470], [294, 470], [286, 506]], 'madera2', 's1', 0.8)}
    {pz(rectPts(40, 450, 286, 22, 2), 'madera', 's2', 1.2)}
  </g>
);

const cuadro = (() => {
  const x = 64, y = 586, w = 160, h = 136;
  const pez: P[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * 2 * Math.PI;
    pez.push([x + 84 + 38 * Math.cos(a), y + 70 + 22 * Math.sin(a) * (Math.cos(a) > 0 ? 1 : 0.9)]);
  }
  return (
    <g>
      {chincheta([x + w / 2, y - 26], 6, false, 'clavo-cuadro')}
      <path d={`M ${x + w / 2} ${y - 26} L ${x + 18} ${y + 4} M ${x + w / 2} ${y - 26} L ${x + w - 18} ${y + 4}`} stroke="#6E5236" strokeWidth={2.2} fill="none" />
      {pz(rectPts(x, y, w, h, 3), 'madera', 's2')}
      {pz(rectPts(x + 14, y + 14, w - 28, h - 28), 'lamina', 's0', 1)}
      {pz([[x + 34, y + 120], [x + 58, y + 84], [x + 74, y + 120]], 'verde3', 's0', 0.8)}
      {pz([[x + 110, y + 120], [x + 124, y + 96], [x + 136, y + 120]], 'verde1', 's0', 0.8)}
      {pz([[x + 44, y + 54], [x + 52, y + 70], [x + 44, y + 86], [x + 62, y + 70]].map((q) => [q[0] + 6, q[1]] as P), 'coralO', 's0', 0.6)}
      {pz(pez, 'coral', 's0', 0.9)}
      {pz(circuloPts([x + 104, y + 64], 6, 10), 'nube', null, 0.3)}
      <circle cx={x + 105} cy={y + 64} r={2.6} fill="#2A1A14" />
      {pz(circuloPts([x + 132, y + 44], 6, 10), 'nube', 's0', 0.4)}
      {pz(circuloPts([x + 140, y + 30], 4, 8), 'nube', 's0', 0.4)}
    </g>
  );
})();

// la ventana: el cielo, el sol, las nubes y la ciudad detrás; el marco con la cruz por delante, que hace sombra sobre todo eso
const VX = 600, VY = 296, VW = 400, VH = 504, VM = 18;
const ventana = (() => {
  const ciudad: React.ReactElement[] = [];
  const edificios: [number, number, number, Tinta][] = [
    [VX + 20, 640, 70, 'ciudad2'], [VX + 84, 590, 62, 'ciudad1'], [VX + 140, 664, 56, 'ciudad2'], [VX + 196, 612, 72, 'ciudad1'],
    [VX + 262, 652, 50, 'ciudad2'], [VX + 306, 600, 76, 'ciudad1'],
  ];
  for (const [x, y, w, t] of edificios) {
    ciudad.push(pz(rectPts(x, y, w, VY + VH - VM - y + 2), t, 's1', 1.2));
    for (let yy = y + 20; yy + 16 < VY + VH - VM - 10; yy += 32) {
      for (let xx = x + 12; xx + 11 < x + w - 8; xx += 22) ciudad.push(pz(rectPts(xx, yy, 11, 15), 'ventanita', null, 0.5));
    }
  }
  const ext = recorte(rectPts(VX, VY, VW, VH, 6), 901, 1.5, 18);
  const int = recorte(rectPts(VX + VM, VY + VM, VW - 2 * VM, VH - 2 * VM), 902, 1.2, 18);
  return (
    <g>
      {pz(rectPts(VX + 6, VY + 6, VW - 12, VH - 12), 'cielo', null, 0)}
      {pz(circuloPts([VX + VW - 92, VY + 96], 38, 18), 'sol', 's0', 1)}
      {pz(nubePts(VX + 120, VY + 120, 0.95), 'nube', 's0', 1.2)}
      {pz(nubePts(VX + 300, VY + 214, 0.7), 'nube', 's0', 1.2)}
      {ciudad}
      <path d={ext + ' ' + int} fillRule="evenodd" fill={f('marco')} filter="url(#gpp-s2)" />
      {pz(tiraPts([VX + VW / 2, VY + 10], [VX + VW / 2, VY + VH - 10], 14), 'marco', 's2', 1)}
      {pz(tiraPts([VX + 10, VY + VH / 2], [VX + VW - 10, VY + VH / 2], 14), 'marco', 's2', 1)}
      {/* el alféizar, con una maceta de hierbas */}
      {pz(rectPts(VX - 22, VY + VH - 4, VW + 44, 28, 3), 'repisa', 's2', 1.3)}
      {planta([VX + VW - 66, VY + VH - 50], 96, 92, 83, ['verde2', 'verde1', 'verde3'], 'verde3', 's1', 8, 120)}
      {pz([[VX + VW - 98, VY + VH - 52], [VX + VW - 34, VY + VH - 52], [VX + VW - 40, VY + VH - 4], [VX + VW - 92, VY + VH - 4]], 'terracota', 's1', 1.2)}
      {pz([[VX + VW - 102, VY + VH - 56], [VX + VW - 30, VY + VH - 56], [VX + VW - 31, VY + VH - 38], [VX + VW - 101, VY + VH - 38]], 'terracota2', 's0', 1)}
    </g>
  );
})();

// las cortinas lila, recogidas con un cordón mostaza, y la cenefa de ondas con lunares
const cortina = (x0: number, lado: 1 | -1) => {
  // x0: el borde de fuera; la cortina se recoge hacia fuera a media altura
  const xs = (k: number) => x0 + lado * k;
  const izq: P[] = [], der: P[] = [];
  const y0 = VY - 10, yr = 590, y1 = VY + VH - 26;
  for (let i = 0; i <= 12; i++) {
    const y = y0 + ((y1 - y0) * i) / 12;
    const u = (y - yr) / (y < yr ? yr - y0 : y1 - yr);
    const ancho = y < yr ? 40 + 52 * u * u : 40 + 34 * Math.sqrt(Math.max(0, u));
    izq.push([xs(-6), y]);
    der.push([xs(ancho), y]);
  }
  const forma = [...izq, ...der.reverse()];
  const pliegue = (k: number) => tiraPts([xs(k * 70), y0 + 8], [xs(k * 22), yr - 6], 5);
  const pliegue2 = (k: number) => tiraPts([xs(k * 20), yr + 10], [xs(k * 56), y1 - 6], 5);
  return (
    <g key={x0}>
      {pz(lado === 1 ? forma : [...forma].reverse(), 'cortina', 's3', 1.4)}
      {pz(pliegue(0.45), 'cortinaO', null, 0.6, {opacity: 0.7})}
      {pz(pliegue(0.85), 'cortinaO', null, 0.6, {opacity: 0.7})}
      {pz(pliegue2(0.5), 'cortinaO', null, 0.6, {opacity: 0.7})}
      {pz(rectPts(Math.min(xs(-10), xs(50)), yr - 9, 60, 18, 8), 'mostaza', 's1', 0.9)}
    </g>
  );
};
const cenefa = (() => {
  const x0 = VX - 18, x1 = VX + VW + 18, y0 = VY - 36, y1 = VY + 26;
  const n = 6;
  const abajo: P[] = [];
  for (let i = 0; i <= n * 8; i++) {
    const u = i / (n * 8);
    const x = x1 - (x1 - x0) * u;
    abajo.push([x, y1 + 16 * Math.abs(Math.sin(Math.PI * n * u))]);
  }
  const forma: P[] = [[x0, y0], [x1, y0], ...abajo];
  const r = rng(55);
  const lunares: React.ReactElement[] = [];
  for (let i = 0; i < 9; i++) {
    lunares.push(pz(circuloPts([x0 + 26 + i * 50 + (r() - 0.5) * 8, y0 + 22 + (i % 2) * 22], 6, 10), 'crema', null, 0.4, {opacity: 0.9}));
  }
  return (
    <g>
      {pz(forma, 'cortina', 's3', 1.4)}
      {lunares}
      {pz(rectPts(x0 - 14, y0 - 10, x1 - x0 + 28, 14, 7), 'madera2', 's2', 1)}
      {chincheta([x0 - 4, y0 - 3], 7, false, 'barra1')}
      {chincheta([x1 + 4, y0 - 3], 7, false, 'barra2')}
    </g>
  );
})();

// ---------------------------------------------------------------- abajo: los azulejos, el suelo, el zócalo
const Y_AZ = 1106;
const azulejos = (() => {
  const r = rng(91);
  const T = 86;
  const els: React.ReactElement[] = [];
  const tintas: Tinta[] = ['azulejo1', 'azulejo2', 'azulejo3'];
  for (let y = Y_AZ; y < F; y += T) {
    for (let x = -14; x < 1080; x += T) {
      const t = tintas[Math.floor(r() * 3)];
      els.push(pz(rectPts(x + 3, y + 3, T - 6, Math.min(T, F - y) - 6, 3), t, null, 0.9, undefined, 22));
      // el brillo de la loza, en una esquina
      if (r() < 0.7) els.push(pz([[x + 13, y + 13], [x + 34, y + 13], [x + 13, y + 32]], 'crema', null, 0.4, {opacity: 0.45}));
    }
  }
  return <g filter="url(#gpp-s0)">{els}</g>;
})();

// el suelo de tablas de cartulina madera: filas que se ensanchan hacia la cámara, tablas de largos distintos
const suelo = (() => {
  const altos = [38, 44, 50, 58, 66, 76, 88];
  const tintas: Tinta[] = ['suelo1', 'suelo2', 'suelo3', 'suelo4'];
  const r = rng(77);
  const els: React.ReactElement[] = [];
  let y = F;
  altos.forEach((h) => {
    let x = -40 - r() * 200, prev = -1;
    while (x < 1100) {
      const w = 300 + r() * 330;
      let ti = Math.floor(r() * 4);
      if (ti === prev) ti = (ti + 1) % 4;
      prev = ti;
      els.push(pz(rectPts(x + 1.2, y + 1.4, w - 2.4, h - 2.4), tintas[ti], null, 0.9, undefined, 26));
      x += w;
    }
    y += h;
  });
  return (
    <g>
      <rect x={-20} y={F} width={1120} height={1960 - F} fill={f('junta')} />
      {els}
      <rect x={-20} y={F} width={1120} height={70} fill="url(#gpp-rincon)" />
    </g>
  );
})();

export const FONDO = (
  <g>
    <rect x={-20} y={-20} width={1120} height={F + 40} fill={f('pared')} />
    {repisa}
    {cuadro}
    {ventana}
    {cortina(VX - 14, 1)}
    {cortina(VX + VW + 14, -1)}
    {cenefa}
    {/* el zócalo de azulejos con su moldura, y debajo de la mesa, su sombra */}
    <rect x={-20} y={Y_AZ - 4} width={1120} height={F - Y_AZ + 8} fill={f('llaga')} />
    {azulejos}
    <rect x={-20} y={MESA_Y + MESA_G} width={BORDE + 60} height={170} fill="url(#gpp-bajomesa)" />
    {pz(rectPts(-20, Y_AZ - 20, 1120, 20, 2), 'moldura', 's1', 1.4, undefined, 22)}
    {suelo}
    {pz(rectPts(-20, F - 26, 1120, 32, 2), 'zocalo', 's1', 1.6, undefined, 22)}
  </g>
);

// ---------------------------------------------------------------- la mesa y el comedero (delante del golpe de cartulina)
const PATA = (x: number) => [[x, MESA_Y + MESA_G - 4], [x + 26, MESA_Y + MESA_G - 4], [x + 23, SUELO], [x + 3, SUELO]] as P[];
export const MESA = (
  <g>
    <g filter="url(#gpp-s4)">
      {pz(PATA(110), 'madera3', null, 1.2)}
      {pz(PATA(652), 'madera3', null, 1.2)}
      {pz(rectPts(136, MESA_Y + MESA_G - 4, 516, 38, 2), 'madera2', null, 1.2)}
      {pz(rectPts(-30, MESA_Y, BORDE + 30, MESA_G, 4), 'madera', null, 1.4, undefined, 22)}
    </g>
    {pz(rectPts(-30, MESA_Y + MESA_G - 9, BORDE + 28, 7, 2), 'madera2', null, 0.6, {opacity: 0.7})}
    {pz(rectPts(-30, MESA_Y + 3, BORDE + 26, 5, 2), 'crema', null, 0.5, {opacity: 0.35})}
    {/* el comedero vacío, con una espina de pez pegada */}
    <ellipse cx={494} cy={SUELO + 2} rx={96} ry={11} fill="url(#gpp-contacto)" />
    {pz([[420, SUELO - 46], [568, SUELO - 46], [556, SUELO], [432, SUELO]], 'coral', 's2', 1.3)}
    {pz(rectPts(414, SUELO - 54, 160, 14, 6), 'coralO', 's0', 1)}
    {pz(tiraPts([458, SUELO - 22], [528, SUELO - 22], 5), 'crema', null, 0.4)}
    {[470, 486, 502, 516].map((x) => (
      <g key={x}>{pz(tiraPts([x, SUELO - 32], [x + 4, SUELO - 12], 4), 'crema', null, 0.3)}</g>
    ))}
    {pz([[528, SUELO - 22], [542, SUELO - 32], [542, SUELO - 12]], 'crema', null, 0.4)}
    {pz(circuloPts([452, SUELO - 22], 6, 8), 'crema', null, 0.3)}
  </g>
);

// ---------------------------------------------------------------- la guirnalda (sus banderines se mecen un pelo en cada paso)
const G_Y0 = 64, G_COMBA = 92;
const gB = (x: number): P => [x, G_Y0 + (4 * G_COMBA * x * (1080 - x)) / (1080 * 1080)];
const G_COLORES: Tinta[] = ['coral', 'mostaza', 'menta', 'crema', 'lila', 'verde3', 'azul'];
const BANDERINES = Array.from({length: 13}, (_, i) => {
  const x = 30 + i * 85;
  const b = gB(x);
  const d = (4 * G_COMBA * (1080 - 2 * x)) / (1080 * 1080);
  const a = Math.atan(d);
  const tx = Math.cos(a), ty = Math.sin(a), nx = -Math.sin(a), ny = Math.cos(a);
  const pts: P[] = [[b[0] - tx * 27, b[1] - ty * 27], [b[0] + tx * 27, b[1] + ty * 27], [b[0] + nx * 66, b[1] + ny * 66]];
  return {b, d: recorte(pts, 300 + i * 7, 1.2, 14), t: G_COLORES[i % G_COLORES.length]};
});
const CUERDA = cuadratica([-40, gB(-40)[1]], [540, G_Y0 + 2 * G_COMBA], [1120, gB(1120)[1]], 24)
  .map((q, i) => `${i ? 'L' : 'M'} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
export const guirnalda = (n: number) => {
  const r = rng(6000 + n * 29);
  return (
    <g>
      <path d={CUERDA} fill="none" stroke="#6E5236" strokeWidth={2.4} />
      {BANDERINES.map((b, i) => (
        <path key={i} d={b.d} fill={f(b.t)} filter="url(#gpp-s1)" transform={`rotate(${((r() - 0.5) * 3.2).toFixed(2)} ${b.b[0].toFixed(1)} ${b.b[1].toFixed(1)})`} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- la planta de delante, cerca de la cámara (abajo a la izquierda)
const FRENTE_HOJAS = hojasPlanta([40, 2000], 400, 380, 61, 9, 120);
const FRENTE_D = FRENTE_HOJAS.map((h) => ({d: recorte(h.pts, 6100 + h.i, 1.4, 18), m: recorte(h.mitad, 6200 + h.i, 1, 18), t: (['verdeO1', 'verdeO2', 'verdeO3'] as Tinta[])[h.i % 3]}));
export const frente = (n: number) => {
  const r = rng(7000 + n * 37);
  return (
    <g transform={`rotate(${((r() - 0.5) * 0.9).toFixed(2)} 40 2000)`}>
      {FRENTE_D.map((h, i) => (
        <g key={i}>
          <path d={h.d} fill={f(h.t)} filter="url(#gpp-s5)" />
          <path d={h.m} fill={f('verde1')} opacity={0.4} />
        </g>
      ))}
    </g>
  );
};
