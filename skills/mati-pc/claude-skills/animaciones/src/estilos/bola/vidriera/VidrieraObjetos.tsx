import React from 'react';
import {E, clamp, rng} from '../../../comun/curvas';
import {ALTO, LAMPARA, PAPELERA, R_BOLA, SUELO, escalaEn, type Bola, type Golpe, type P} from '../escena';
import {aMano, elipse, f1, pr, recto, rota2, s2, suave} from './geo';
import {Pieza, Plomo, Traza, VID, deriva} from './vidrio';

// VIDRIERA, LO QUE SE MUEVE: la papelera de rubí (duelas y aros de plomo: así se lee redonda), con su aro de
// vidrio blanco y sus perlas; la bola, un vidrio blanco opalino arrugado (sus facetas, con un plomo finito, y sus pliegues pintados),
// que es lo más encendido de todo; la lámpara de vidrio naranja con su bombilla (la única luz de la historia: su color no lo lleva
// ningún vidrio); y los golpes: un destello en el vidrio y unas líneas de luz que salen corriendo del punto donde pega.

const PB = PAPELERA;
const Y_ARO = PB.yBorde - 6; // la cara de arriba del aro
const rFuera = (y: number) => PB.rBase + PB.pared + (PB.rBorde - PB.rBase) * clamp((SUELO - y) / (SUELO - PB.yBorde));
const enPapelera = (y: number, r: number, phi: number): P => pr([PB.x + r * Math.cos(phi), y, PB.z + r * Math.sin(phi)]);
const arco = (y: number, r: number, a0: number, a1: number, n = 8): P[] => Array.from({length: n + 1}, (_, i) => enPapelera(y, r, a0 + ((a1 - a0) * i) / n));

const R_ARO_FUERA = PB.rBorde + PB.tubo + 4;
const R_ARO_DENTRO = PB.rBorde - PB.tubo - 3;
const DUELAS = 12; // alrededor (6 por delante)
const FILAS = [PB.yBorde + PB.tubo, SUELO - 4 * ALTO, SUELO - 3 * ALTO, SUELO - 2 * ALTO, SUELO - ALTO, SUELO];

// el pivote del tambaleo: la base, en la pantalla
export const PIVOTE_PAPELERA = pr([PB.x, SUELO, PB.z]);
const giroPapelera = (inclina: number) => `rotate(${((inclina * 180) / Math.PI).toFixed(3)} ${f1(PIVOTE_PAPELERA[0])} ${f1(PIVOTE_PAPELERA[1])})`;

// la silueta de delante (para la luz de dentro)
export const siluetaPapelera = (): P[] => [
  ...arco(Y_ARO, R_ARO_FUERA, Math.PI, 2 * Math.PI, 16),
  ...arco(SUELO, rFuera(SUELO), 0, Math.PI, 16),
];
export const bocaPapelera = (): P[] => elipsePapelera(Y_ARO, R_ARO_DENTRO);
// todo lo que queda por encima del borde de delante (lo de la bola que asoma por la boca)
export const sobreBordePapelera = (): P[] => {
  const a = arco(Y_ARO, R_ARO_DENTRO + 2, 0, Math.PI, 24);
  return [[a[0][0] + 60, -400], ...[[a[0][0] + 60, a[0][1]] as P], ...a, [a[a.length - 1][0] - 60, a[a.length - 1][1]], [a[a.length - 1][0] - 60, -400]];
};
const elipsePapelera = (y: number, r: number, n = 36) => Array.from({length: n}, (_, i) => enPapelera(y, r, (i / n) * Math.PI * 2));

// ---------------------------------------------------------------- la papelera, por detrás: la boca (lo de dentro) y la mitad de atrás del aro
export const PapeleraAtras: React.FC<{inclina: number; luzDentro: number}> = ({inclina, luzDentro}) => {
  const boca = elipsePapelera(Y_ARO, R_ARO_DENTRO);
  const atras = [...arco(Y_ARO, R_ARO_DENTRO, Math.PI, 2 * Math.PI, 18), ...arco(Y_ARO, R_ARO_FUERA, 2 * Math.PI, Math.PI, 18)];
  const cortes = [Math.PI * 1.33, Math.PI * 1.67];
  const perlas = Array.from({length: 18}, (_, k) => (k + 0.5) * ((Math.PI * 2) / 18)).filter((a) => Math.sin(a) < 0);
  return (
    <g transform={giroPapelera(inclina)}>
      <Pieza d={suave(boca, 0.4)} color={VID.rubiProfundo} semilla={31} plomo={8} borde={0.3}>
        <path d={suave(boca, 0.4)} fill="url(#vd-boca)" />
        {luzDentro > 0.01 && <path d={suave(boca, 0.4)} fill="url(#vd-bocaLuz)" opacity={luzDentro} />}
      </Pieza>
      <Pieza d={recto(atras)} color={VID.blancoV} semilla={32} plomo={8} borde={0.5} luz={luzDentro * 0.6}>
        {cortes.map((a, k) => <Plomo key={k} d={recto([enPapelera(Y_ARO, R_ARO_DENTRO, a), enPapelera(Y_ARO, R_ARO_FUERA, a)], false)} w={6} borde={0} />)}
      </Pieza>
      {perlas.map((a, k) => {
        const c = enPapelera(Y_ARO - 4, PB.rBorde, a);
        return <Pieza key={k} d={suave(elipse(c, 8.5, 6.5, 10), 0.5)} color={VID.opal} semilla={k} plomo={4.5} borde={0} textura={false} sinCentro />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------- la papelera, por delante: las duelas y la mitad de delante del aro
export const PapeleraDelante: React.FC<{inclina: number; luzDentro: number; golpe: number}> = ({inclina, luzDentro, golpe}) => {
  const panos: React.ReactElement[] = [];
  const paso = (Math.PI * 2) / DUELAS;
  for (let k = 0; k < DUELAS / 2; k++) {
    const a0 = k * paso, a1 = (k + 1) * paso;
    const am = (a0 + a1) / 2;
    for (let j = 0; j < FILAS.length - 1; j++) {
      const y0 = FILAS[j], y1 = FILAS[j + 1];
      // las juntas se cruzan como en un muro (cada fila, media duela corrida): así se lee de ladrillos
      const des = j % 2 ? paso / 2 : 0;
      const b0 = Math.max(0, a0 - des), b1 = Math.min(Math.PI, a1 - des);
      const pts = [...arco(y0, rFuera(y0), b0, b1, 5), ...arco(y1, rFuera(y1), b1, b0, 5)];
      const lado = 1 - Math.sin(am);
      const sombra = 0.12 + 0.75 * lado ** 1.3 * (Math.cos(am) > 0 ? 1.1 : 0.85) + j * 0.03;
      // lo de dentro la enciende (más cerca de la boca, más)
      const luz = luzDentro * Math.max(0, 0.6 - j * 0.15) * Math.sin(am) + golpe * 0.35;
      panos.push(<Pieza key={`${k}-${j}`} d={recto(pts)} color={deriva(j % 2 ? VID.rubi : VID.rubiC, 500 + k * 7 + j, 0.9)} semilla={k + j * 3} plomo={7.5}
        sombra={sombra} luz={luz} borde={0.8} tonoLuz="#ff6a24" />);
      if (j % 2 && k === 0) {
        // la media duela que queda a la izquierda en las filas corridas
        const ptsB = [...arco(y0, rFuera(y0), Math.PI - des, Math.PI, 3), ...arco(y1, rFuera(y1), Math.PI, Math.PI - des, 3)];
        panos.push(<Pieza key={`f${j}`} d={recto(ptsB)} color={deriva(VID.rubiO, 560 + j)} semilla={j} plomo={7.5} sombra={0.85} borde={0.6} />);
      }
    }
  }
  // el aro: la cara de arriba (por delante) y su canto
  const delante = [...arco(Y_ARO, R_ARO_DENTRO, 0, Math.PI, 18), ...arco(PB.yBorde + PB.tubo + 4, R_ARO_FUERA - 2, Math.PI, 0, 18)];
  const cortes = [Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75];
  const perlas = Array.from({length: 18}, (_, k) => (k + 0.5) * ((Math.PI * 2) / 18)).filter((a) => Math.sin(a) >= 0);
  return (
    <g transform={giroPapelera(inclina)}>
      {panos}
      <Pieza d={recto(delante)} color={VID.blanco} semilla={41} plomo={8} borde={0.6} luz={luzDentro * 0.5 + golpe * 0.6}>
        {cortes.map((a, k) => <Plomo key={k} d={recto([enPapelera(Y_ARO, R_ARO_DENTRO, a), enPapelera(PB.yBorde + PB.tubo + 4, R_ARO_FUERA - 2, a)], false)} w={6} borde={0} />)}
        <path d={recto([...arco(PB.yBorde + 4, R_ARO_FUERA - 1, 0.15, Math.PI - 0.15, 14), ...arco(PB.yBorde + PB.tubo + 2, R_ARO_FUERA - 2, Math.PI - 0.15, 0.15, 14)])} fill="#2a1a30" fillOpacity={0.16} />
      </Pieza>
      {perlas.map((a, k) => {
        const c = enPapelera(Y_ARO - 4, PB.rBorde, a);
        const s = escalaEn(PB.rBorde * Math.sin(a));
        return <Pieza key={k} d={suave(elipse(c, 9 * s, 7 * s, 10), 0.5)} color={VID.opal} semilla={k} plomo={4.5} borde={0} textura={false} sinCentro luz={golpe} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------- la bola: vidrio blanco opalino arrugado
// sus facetas, en las medidas de la bola (radio 1): un contorno irregular y tres cortes desde un punto de dentro
const BOLA = (() => {
  const r = rng(2025);
  const n = 13;
  const borde: P[] = Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.25;
    const rr = 0.9 + r() * 0.16;
    return [Math.cos(a) * rr, Math.sin(a) * rr];
  });
  const nucleo: P = [0.12, -0.1];
  const cortes = [0, 4, 8, 11];
  const facetas = cortes.map((c0, k) => {
    const c1 = cortes[(k + 1) % cortes.length];
    const pts: P[] = [nucleo];
    for (let i = c0; i !== c1; i = (i + 1) % n) pts.push(borde[i]);
    pts.push(borde[c1]);
    return pts;
  });
  const pliegues: P[][] = [
    [[-0.55, -0.25], [-0.2, -0.38], [0.05, -0.62]],
    [[-0.5, 0.35], [-0.15, 0.2], [0.1, 0.42]],
    [[0.45, 0.05], [0.62, 0.4]],
    [[0.2, -0.3], [0.5, -0.45]],
  ];
  return {borde, facetas, pliegues};
})();
const OPALES = [VID.opal, '#eef3ff', '#fff6e6', '#f2eefc'];

export const BolaVidrio: React.FC<{b: Bola}> = ({b}) => {
  const [x, y] = pr(b.c);
  const R = R_BOLA * escalaEn(b.c[2]);
  const giro = ((b.giro + b.vuelco * 0.5) * 180) / Math.PI;
  const esc = (pts: P[]) => pts.map(([u, v]) => [u * R, v * R] as P);
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) rotate(${giro.toFixed(1)})`}>
      {BOLA.facetas.map((f, k) => (
        <Pieza key={k} d={recto(esc(f))} color={OPALES[k]} semilla={k + 2} plomo={3.2} borde={0.15} luz={0.35}>
          {/* la lechosidad del opalino: un velo azulado hacia el borde */}
          <path d={recto(esc(f))} fill="url(#vd-opal)" />
        </Pieza>
      ))}
      {BOLA.pliegues.map((p, k) => <Traza key={k} d={`M ${esc(p).map((q) => `${f1(q[0])} ${f1(q[1])}`).join(' L ')}`} w={2} op={0.4} />)}
      {/* el plomo de fuera, más grueso */}
      <path d={recto(esc(BOLA.borde))} fill="none" stroke="#120f15" strokeWidth={7} strokeLinejoin="round" />
      <path d={recto(esc(BOLA.borde))} fill="none" stroke="#6e6878" strokeOpacity={0.4} strokeWidth={1} strokeLinejoin="round" />
    </g>
  );
};

// la grisalla del suelo bajo la bola (cuanto más baja, más oscura)
export const ManchaBola: React.FC<{b: Bola}> = ({b}) => {
  if (b.dentro) return null;
  const alto = SUELO - R_BOLA - b.c[1];
  if (alto > 460) return null;
  const c = pr([b.c[0], SUELO, b.c[2]]);
  const e = escalaEn(b.c[2]);
  const k = 1 - alto / 460;
  return <ellipse cx={c[0]} cy={c[1]} rx={(56 - alto * 0.03) * e} ry={14 * e} fill="url(#vd-mancha)" opacity={0.8 * k} />;
};

// ---------------------------------------------------------------- la lámpara que cuelga (gira desde su gancho)
export const bombillaEn = (ang: number): P => {
  const L = LAMPARA;
  const d = L.largo + L.alto / 2 + 14;
  return [L.x + d * Math.sin(ang), L.yGancho + d * Math.cos(ang)];
};
export const LamparaVidrio: React.FC<{ang: number; luz: number}> = ({ang, luz}) => {
  const L = LAMPARA;
  const yc = L.yGancho + L.largo; // el centro de la pantalla
  const arriba = yc - L.alto / 2, abajo = yc + L.alto / 2;
  const pantalla = [[L.x - L.rArriba, arriba], [L.x + L.rArriba, arriba], [L.x + L.rAbajo, abajo - 4], [L.x + L.rAbajo - 8, abajo + 3], [L.x - L.rAbajo + 8, abajo + 3], [L.x - L.rAbajo, abajo - 4]] as P[];
  const corte = (k: number): [P, P] => [[L.x + L.rArriba * k, arriba], [L.x + (L.rAbajo - 6) * k, abajo + 2]];
  const bomb: P = [L.x, abajo + 14];
  return (
    <g transform={`rotate(${((-ang * 180) / Math.PI).toFixed(3)} ${L.x} ${L.yGancho})`}>
      {/* el cable: plomo */}
      <path d={`M ${L.x} ${L.yGancho} L ${L.x} ${arriba - 10}`} stroke="#120f15" strokeWidth={7} />
      <Pieza d={recto(aMano([[L.x - 24, arriba - 16], [L.x + 24, arriba - 16], [L.x + 24, arriba + 2], [L.x - 24, arriba + 2]], 71, 0.6))} color={VID.naranja} semilla={4} plomo={6} borde={0.4} />
      {/* la bombilla, encendida (detrás de la pantalla asoma por abajo) */}
      <Pieza d={suave(elipse(bomb, 27, 27, 16), 0.5)} color="#fffbe6" semilla={2} plomo={6} borde={0} luz={1} sinCentro textura={false} />
      <Pieza d={recto(pantalla)} color={VID.naranja} semilla={5} plomo={8} luz={luz}>
        <path d={recto(pantalla)} fill="url(#vd-pantallaLampara)" />
        <Plomo d={recto(corte(-0.38), false)} w={6} borde={0} />
        <Plomo d={recto(corte(0.38), false)} w={6} borde={0} />
      </Pieza>
    </g>
  );
};

// ---------------------------------------------------------------- los golpes: el destello y las líneas de luz
// t0: el paso en el que se ve el golpe (la bola va «a dos»); u, lo que lleva desde entonces (la luz va «a unos»)
export const Destellos: React.FC<{golpes: {g: Golpe; t0: number}[]; t: number; boca: P}> = ({golpes, t, boca}) => {
  const out: React.ReactElement[] = [];
  golpes.forEach(({g, t0}, n) => {
    const u = t - t0;
    if (u < 0 || u > 0.5) return;
    const minimo = g.tipo === 'suelo' ? 1300 : g.tipo === 'muro' ? 450 : g.tipo === 'lampara' ? 250 : 380;
    if (g.fuerza < minimo) return;
    const k = clamp((g.fuerza - minimo * 0.6) / 2000, 0.25, 1) * (g.tipo === 'suelo' ? 0.55 : g.tipo === 'pila' ? 0.7 : 1);
    // dentro de la papelera, la luz sale por la boca
    const c: P = g.tipo === 'pila' ? boca : pr(g.p);
    const r = rng(Math.round(g.t * 1000) + 7);
    const fuerte = (1 - clamp(u / (g.tipo === 'pila' ? 0.16 : 0.26))) ** 2;
    const lineas: string[] = [];
    const nl = 7 + Math.round(4 * k);
    const hacia = g.tipo === 'pila' || g.tipo === 'suelo' ? [-Math.PI * 0.94, -Math.PI * 0.06] : [-Math.PI, Math.PI];
    for (let i = 0; i < nl; i++) {
      const a = hacia[0] + ((i + 0.5) / nl) * (hacia[1] - hacia[0]) + (r() - 0.5) * 0.35;
      const largo = (120 + 230 * k) * (0.6 + r() * 0.55) * E.outCubic(clamp(u / 0.13));
      const pts: P[] = [c];
      const tramos = 4;
      for (let q = 1; q <= tramos; q++) {
        const d = (largo * q) / tramos;
        const lat = q < tramos ? (r() - 0.5) * 22 : 0;
        pts.push(s2(c, rota2([d, lat], a)));
      }
      const desde = Math.round(clamp((u - 0.1) / 0.3) * tramos); // se apagan desde el centro hacia fuera
      lineas.push(recto(pts.slice(desde), false));
    }
    const op = (1 - clamp(u / 0.5)) ** 1.3;
    out.push(
      <g key={n} style={{mixBlendMode: 'screen'}}>
        <circle cx={c[0]} cy={c[1]} r={(70 + 170 * k) * (0.6 + 0.6 * E.outCubic(clamp(u / 0.08)))} fill="url(#vd-destello)" opacity={fuerte * (0.6 + 0.4 * k)} />
        <g opacity={op * 0.55} filter="url(#vd-desenfoque6)" fill="none" stroke="#ffe2a0" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round">
          {lineas.map((d, i) => <path key={i} d={d} />)}
        </g>
        <g opacity={op} fill="none" stroke="#fff6d8" strokeWidth={4.5 * (1 - clamp(u / 0.5)) + 1} strokeLinecap="round" strokeLinejoin="round">
          {lineas.map((d, i) => <path key={i} d={d} />)}
        </g>
      </g>,
    );
  });
  return <>{out}</>;
};

