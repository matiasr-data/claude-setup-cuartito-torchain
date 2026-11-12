import React from 'react';
import * as THREE from 'three';
import {E, clamp, mix, p, rng} from '../../comun/curvas';
import {type V3, arcilla, geoAro, geoBola, geoCapsula, mancha, orienta} from '../PlastilinaArcilla';
import {ESCALA_GATO, T_SUELO, type Elipse, type Gato, type P, type Pata} from './escena';

// 10 · PLASTILINA, EL GATO: el gato de ./escena.ts hecho de plastilina, a lo Aardman. Gordo y redondo, naranja atigrado
// (las rayas son tiras de plastilina más oscura apretadas encima), con el pecho, el hocico y los calcetines blancos. La cabeza gira
// DE VERDAD en 3D (de tres cuartos a mirarte de frente), con ojos grandes de cuenta (iris verde amarillo, pupila que pasa de rendija
// a redonda) y párpados de plastilina que bajan y se inclinan cuando trama algo; orejas con su presión de pulgar rosa, nariz de
// bolita, bigotes de tiras finas y la cola gorda por segmentos, con anillos. Cada pieza tiembla un pelo distinto en cada postura.
// Coordenadas: las del dibujo del gato (escena.ts) con la y hacia arriba (x, −y) y z hacia la cámara; se pinta 1,14 veces más
// grande desde donde se sienta, como en los estilos planos.

export const COL_GATO = {
  pelo: '#EC8A3A', raya: '#B8541A', blanco: '#F8F0E4', nariz: '#EA8790', dentro: '#F3A9A6',
  iris: '#CDDC55', pupila: '#120F12', brillo: '#FFFFFF', boca: '#4A1C17', lengua: '#E2707C', bigote: '#FFF9F0',
};

// el temblor del stop motion: cada pieza se mueve un poco distinto en cada postura
export const tiembla = (paso: number, i: number, amp = 1.5): V3 => {
  const r = rng(paso * 7919 + i * 131 + 5);
  return [(r() - 0.5) * 2 * amp, (r() - 0.5) * 2 * amp, (r() - 0.5) * 0.016];
};

type Curva = (x: number) => number;
type Clave = [number, number, Curva?];
const kv = (t: number, claves: Clave[], def: Curva = E.inOutCubic) => {
  if (t <= claves[0][0]) return claves[0][1];
  for (let i = 1; i < claves.length; i++) {
    const [t1, v1, e] = claves[i];
    const [t0, v0] = claves[i - 1];
    if (t <= t1) return mix(v0, v1, (e || def)(p(t, t0, t1 - t0)));
  }
  return claves[claves.length - 1][1];
};
const pulso = (t: number, t0: number, sube: number, baja: number) =>
  t < t0 ? 0 : t < t0 + sube ? E.outCubic((t - t0) / sube) : 1 - E.inOutCubic(clamp((t - t0 - sube) / baja));

// los gestos que escena.ts no devuelve sueltos (los mismos tiempos que allí)
const PARPADO: Clave[] = [
  [0, 0.1], [0.58, 0.1], [0.76, 0.5], [1.0, 0.5], [1.14, 0.06], [1.56, 0.06], [1.6, 1, E.lin], [1.67, 0.06, E.lin], [2.2, 0.06],
  [2.4, 0.52], [2.74, 0.52], [2.79, 0, E.lin], [4.18, 0.04], [4.36, 0.55], [4.58, 0.55], [4.72, 1], [4.86, 1], [5.0, 0.55],
  [5.12, 0.97],
];
const PICARDIA: Clave[] = [[0, 0], [0.58, 0], [0.76, 1], [1.0, 1], [1.14, 0], [2.2, 0], [2.4, 1], [2.76, 1], [2.8, 0, E.lin], [4.18, 0], [4.36, 0.5]];
const SONRISA: Clave[] = [[0, 0], [0.7, 0], [0.82, 1], [1.0, 1], [1.12, 0], [2.36, 0], [2.5, 1], [2.78, 1], [2.86, 0], [4.3, 0], [4.46, 1], [4.98, 1], [5.1, 0.4]];

const RAD = Math.PI / 180;
const H90 = Math.PI / 2;
const n3 = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const sum3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const mix3 = (a: V3, b: V3, k: number): V3 => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];

type Mat = THREE.Material;
export const Cap: React.FC<{a: V3; b: V3; ra: number; rb: number; mat: Mat; semilla: number; amp?: number; sombra?: boolean; s?: V3}> = ({
  a, b, ra, rb, mat, semilla, amp = 1.2, sombra = true, s = [1, 1, 1],
}) => {
  const {L, quat} = orienta(a, b);
  return (
    <mesh geometry={geoCapsula(Math.max(1, Math.round(L)), ra, rb, semilla, amp)} material={mat} position={a} quaternion={quat} scale={s}
      castShadow={sombra} receiveShadow />
  );
};
export const Bola: React.FC<{c: V3; r: number; mat: Mat; semilla: number; s?: V3; rot?: V3; amp?: number; sombra?: boolean}> = ({
  c, r, mat, semilla, s = [1, 1, 1], rot = [0, 0, 0], amp = 0.9, sombra = true,
}) => <mesh geometry={geoBola(r, semilla, amp)} material={mat} position={c} scale={s} rotation={rot} castShadow={sombra} receiveShadow />;

// una tira de plastilina apretada encima (las rayas): una cadena de cápsulas, más gorda en medio y fina en las puntas
const Tira: React.FC<{pts: V3[]; r: number; mat: Mat; semilla: number}> = ({pts, r, mat, semilla}) => (
  <>
    {pts.slice(0, -1).map((a, i) => {
      const k0 = i / (pts.length - 1), k1 = (i + 1) / (pts.length - 1);
      const ra = r * (0.4 + 0.6 * Math.sin(Math.PI * k0)), rb = r * (0.4 + 0.6 * Math.sin(Math.PI * k1));
      return <Cap key={i} a={a} b={pts[i + 1]} ra={+ra.toFixed(2)} rb={+rb.toFixed(2)} mat={mat} semilla={semilla + i} amp={0.25} sombra={false} />;
    })}
  </>
);
// en un ovoide de semiejes (rx, ry, rz): el anillo a la altura yk (u = 0 delante, π/2 hacia la cámara, π detrás)
const anillo = (rx: number, ry: number, rz: number, yk: number, u: number): V3 => {
  const k = Math.sqrt(Math.max(0, 1 - (yk / ry) ** 2));
  return [rx * k * Math.cos(u), yk, rz * k * Math.sin(u)];
};
// y la diana: círculos alrededor del eje z (el lado del muslo que se ve)
const diana = (rx: number, ry: number, rz: number, psi: number, s: number): V3 => [
  rx * Math.sin(psi) * Math.cos(s), ry * Math.sin(psi) * Math.sin(s), rz * Math.cos(psi),
];
const tramo = (n: number, f: (k: number) => V3): V3[] => Array.from({length: n}, (_, i) => f(i / (n - 1)));

// un trozo del cuerpo: un ovoide de plastilina (la elipse de escena.ts con su fondo rz), con lo que lleva pegado encima
const Ovoide: React.FC<{e: Elipse; rz: number; z?: number; mat: Mat; semilla: number; j?: V3; amp?: number; children?: React.ReactNode}> = ({
  e, rz, z = 0, mat, semilla, j = [0, 0, 0], amp = 1.6, children,
}) => (
  <group position={[e.c[0] + j[0], -e.c[1] + j[1], z]} rotation={[0, 0, -e.ang + j[2]]}>
    <mesh geometry={geoBola(100, semilla, amp)} material={mat} scale={[e.rx / 100, e.ry / 100, rz / 100]} castShadow receiveShadow />
    {children}
  </group>
);

// ---------------------------------------------------------------- la cabeza
const A = 96, B = 88, C = 104; // la cabeza: hacia el hocico, hacia arriba y de lado a lado
const YAW0 = 0.8; // de «lado» la cara no está de perfil puro: tres cuartos, para que se lean los dos ojos
const RE = 28; // el radio del ojo
const CABEZA = 1.15; // la cabeza, más grande que en los estilos planos: es un muñeco
const OJO: V3 = (() => {
  const d = n3([Math.cos(10 * RAD) * Math.cos(34 * RAD), Math.sin(10 * RAD), Math.cos(10 * RAD) * Math.sin(34 * RAD)]);
  const t = 1 / Math.sqrt((d[0] / A) ** 2 + (d[1] / B) ** 2 + (d[2] / C) ** 2);
  return mul3(d, t - RE * 0.55);
})();
const sobreCabeza = (x: number, z: number) => B * Math.sqrt(Math.max(0, 1 - (x / A) ** 2 - (z / C) ** 2));

type Mats = Record<'pelo' | 'raya' | 'blanco' | 'nariz' | 'dentro' | 'iris' | 'pupila' | 'brillo' | 'boca' | 'lengua' | 'bigote', Mat>;

const Ojo: React.FC<{c: V3; lado: 1 | -1; parp: number; pic: number; dil: number; mx: number; my: number; m: Mats}> = ({c, lado, parp, pic, dil, mx, my, m}) => {
  // el párpado: media bola de plastilina que gira sobre el ojo (abierto = metida detrás) y se inclina hacia la nariz cuando trama
  let beta = Math.asin(clamp(1 - 2 * Math.min(parp, 1), -1, 1));
  if (parp < 0.14) beta += (1 - parp / 0.14) * 0.5;
  const sigma = -lado * pic * 0.42;
  const w = mix(0.24, 0.7, dil);
  const hl = n3([0.93, 0.16 - 0.3 * Math.min(parp, 0.55), 0.34]);
  return (
    <group position={c}>
      <mesh geometry={geoBola(RE, 900 + lado, 0.15)} material={m.iris} castShadow receiveShadow />
      {/* la pupila mira a donde va la mirada: rendija cuando trama, redonda y enorme cuando se asusta */}
      <group rotation={[0, mx * 0.3, -my * 0.45]}>
        <mesh geometry={geoBola(RE, 910 + lado, 0)} material={m.pupila} position={[RE * 0.74, 0, 0]} scale={[0.3, 0.8, w]} />
      </group>
      <mesh geometry={geoBola(RE * 0.15, 920, 0)} material={m.brillo} position={mul3(hl, RE * 1.0)} />
      <group rotation={[sigma, 0, beta]}>
        <mesh geometry={geoBola(RE * 1.2, 930 + lado, 0.4, Math.PI / 2, 0)} material={m.pelo} castShadow receiveShadow />
        {/* el canto del párpado, oscuro: es lo que hace que se lea la mirada */}
        <group rotation={[0, H90, 0]}>
          <mesh geometry={geoAro(RE * 1.17, 2.6, Math.PI)} material={m.boca} rotation={[H90, 0, 0]} />
        </group>
      </group>
    </group>
  );
};

const Oreja: React.FC<{lado: 1 | -1; atras: number; tic: number; m: Mats}> = ({lado, atras, tic, m}) => {
  const base: V3 = [-14, 62, lado * 56];
  const dir = n3([-0.14, 1, lado * 0.44]);
  const L = 78;
  const {quat} = orienta([0, 0, 0], mul3(dir, L));
  return (
    <group position={base} rotation={[lado * (0.6 * atras + 0.18 * tic), 0, 0.55 * atras + 0.32 * tic]}>
      <group quaternion={quat}>
        <mesh geometry={geoCapsula(L, 35, 8, 940 + lado, 1)} material={m.pelo} scale={[0.44, 1, 1]} castShadow receiveShadow />
        {/* lo de dentro, rosa, con la presión del pulgar */}
        <mesh geometry={geoCapsula(56, 22, 5, 950 + lado, 0.8)} material={m.dentro} position={[9.5, 9, 0]} scale={[0.26, 1, 1]} />
      </group>
    </group>
  );
};

const Bigotes: React.FC<{lado: 1 | -1; t: number; m: Mats}> = ({lado, t, m}) => {
  const P0: V3 = [92, -22, lado * 18];
  return (
    <>
      {[0, 1, 2].map((j) => {
        const s = sum3(P0, mul3(n3([0.5, 0.25 - 0.24 * j, lado * 0.85]), 20));
        const vib = 1.6 * Math.sin(t * 7 + j);
        const mid = sum3(s, [3, 2 - 3 * j + vib * 0.5, lado * 46]);
        const e = sum3(s, [-8, -4 - 11 * j + vib, lado * 94]);
        return (
          <group key={j}>
            <Cap a={s} b={mid} ra={2.4} rb={2.1} mat={m.bigote} semilla={960 + j} amp={0} sombra={false} />
            <Cap a={mid} b={e} ra={2.1} rb={1.5} mat={m.bigote} semilla={963 + j} amp={0} sombra={false} />
          </group>
        );
      })}
    </>
  );
};

const Cabeza: React.FC<{g: Gato; t: number; paso: number; m: Mats}> = ({g, t, paso, m}) => {
  const jh = tiembla(paso, 42, 1.2);
  const yaw = mix(YAW0, Math.PI / 2, g.giro);
  // lo que no viene suelto en la escena: el párpado, la picardía y la sonrisa (sus mismos tiempos), y la mirada y la pupila (de sus ojos)
  const parp = kv(t, PARPADO), pic = kv(t, PICARDIA), sm = kv(t, SONRISA);
  const o = g.ojoCerca;
  const dil = clamp((o.pupila.rx - 3.6) / Math.max(1, o.rx * 0.64 - 3.6));
  const dc: P = [o.pupila.c[0] - o.c[0], o.pupila.c[1] - o.c[1]];
  const pc: P = [dc[0] * Math.cos(-g.inclina) - dc[1] * Math.sin(-g.inclina), dc[0] * Math.sin(-g.inclina) + dc[1] * Math.cos(-g.inclina)];
  const mx = pc[0] / (0.36 * o.rx), my = pc[1] / (0.3 * o.ry);
  const tic = (t0: number) => pulso(t, t0, 0.06, 0.22);
  const atras = pulso(t, T_SUELO, 0.07, 0.35);
  const lame = g.lengua ? clamp((g.lengua.ry - 5) / 9) : 0;
  const asombro = t >= T_SUELO && t < 3.95; // la boca de recambio en «o»
  const H = g.cabeza.c;
  // las rayas de la frente (la «M») y de los mofletes
  const frente = [-22, 0, 22].map((z, i) => tramo(6, (k) => {
    const x = mix(i === 1 ? 58 : 48, -18, k);
    return [x, sobreCabeza(x, z) - 1, z] as V3;
  }));
  return (
    <group position={[H[0] + jh[0], -H[1] + jh[1], 6]} rotation={[0, 0, -g.inclina + jh[2]]}>
      <group rotation={[0, -yaw, 0]} scale={[CABEZA, CABEZA, CABEZA]}>
        <Bola c={[0, 0, 0]} r={100} mat={m.pelo} semilla={70} s={[A / 100, B / 100, C / 100]} amp={1.6} />
        {/* los mofletes, con sus rayas */}
        {([1, -1] as const).map((lado) => (
          <group key={lado} position={[30, -30, lado * 72]}>
            <mesh geometry={geoBola(42, 71 + lado, 1)} material={m.pelo} scale={[0.9, 0.85, 0.8]} castShadow receiveShadow />
            {[10, -6].map((yk, i) => (
              <Tira key={i} pts={tramo(5, (k) => anillo(37.8, 35.7, 33.6, yk, (lado > 0 ? 1 : -1) * mix(55, 150, k) * RAD))} r={4.6}
                mat={m.raya} semilla={980 + i * 10 + lado} />
            ))}
          </group>
        ))}
        {frente.map((pts, i) => <Tira key={i} pts={pts} r={i === 1 ? 5.6 : 4.8} mat={m.raya} semilla={1000 + i * 10} />)}
        {/* el hocico blanco: las dos almohadillas de los bigotes, la barbilla y la nariz de bolita */}
        <Bola c={[92, -22, 18]} r={21} mat={m.blanco} semilla={73} />
        <Bola c={[92, -22, -18]} r={21} mat={m.blanco} semilla={74} />
        <Bola c={[82, asombro ? -60 : -50, 0]} r={15} mat={m.blanco} semilla={75} s={[1, 0.85, 1.15]} />
        <Bola c={[108, -6, 0]} r={12} mat={m.nariz} semilla={76} s={[0.75, 0.62, 1.15]} amp={0.3} />
        {/* la boca: la raya del centro y la sonrisa de lado (más alta por un lado: la de «lo voy a hacer»), o la «o» del susto */}
        <Cap a={[106.5, -13, 0]} b={[103, -39, 0]} ra={2.2} rb={2.2} mat={m.boca} semilla={77} amp={0} sombra={false} />
        {asombro ? (
          <Bola c={[96, -46, 0]} r={11} mat={m.boca} semilla={78} s={[0.5, 1, 0.9]} amp={0.2} />
        ) : (
          ([1, -1] as const).map((lado) => {
            const k = lado > 0 ? 1.35 : 0.65;
            const pts: V3[] = [[103, -39, 0], [98, -45, lado * 9], [90, -45 + 4 * sm * k, lado * 19], [82, -39 + 8 * sm * k, lado * 26]];
            return (
              <group key={lado}>
                {pts.slice(0, -1).map((a, i) => <Cap key={i} a={a} b={pts[i + 1]} ra={2.4} rb={2.2} mat={m.boca} semilla={79 + i} amp={0} sombra={false} />)}
              </group>
            );
          })
        )}
        {lame > 0.02 && <Bola c={[97, -50 - 7 * lame, 0]} r={12} mat={m.lengua} semilla={82} s={[0.5, 0.45 + 0.55 * lame, 0.75]} />}
        <Bigotes lado={1} t={t} m={m} />
        <Bigotes lado={-1} t={t} m={m} />
        {/* los ojos */}
        <Ojo c={OJO} lado={1} parp={parp} pic={pic} dil={dil} mx={mx} my={my} m={m} />
        <Ojo c={[OJO[0], OJO[1], -OJO[2]]} lado={-1} parp={parp} pic={pic} dil={dil} mx={mx} my={my} m={m} />
        {/* las orejas: un tic al tramar, hacia atrás al romperse la taza, otro al lamerse */}
        <Oreja lado={1} atras={atras} tic={tic(0.84) + tic(5.55)} m={m} />
        <Oreja lado={-1} atras={atras} tic={tic(1.62)} m={m} />
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- las patas de delante: hombro, codo, mano y el pie con sus dedos
const PataArcilla: React.FC<{pt: Pata; z: [number, number]; paso: number; i0: number; m: Mats; lamer?: V3 | null; w?: number}> = ({
  pt, z, paso, i0, m, lamer = null, w = 0,
}) => {
  const j1 = tiembla(paso, i0), j2 = tiembla(paso, i0 + 1);
  const W = (q: P, zz: number, j: V3): V3 => [q[0] + j[0], -q[1] + j[1], zz];
  const ho = W(pt.hombro, z[0], [0, 0, 0]);
  let co = W(pt.codo, mix(z[0], z[1], 0.5), j1), ma = W(pt.mano, z[1], j2);
  // al lamerse, la pata va de verdad al hocico (que con la cabeza girada en 3D está por delante)
  if (lamer && w > 0) {
    ma = mix3(ma, lamer, w);
    co = [co[0], co[1], mix(co[2], lamer[2] * 0.6, w)];
  }
  const mid = mix3(co, ma, 0.42);
  const pie = {...pt.pie, c: [ma[0] + pt.pie.c[0] - pt.mano[0], -(ma[1] - (pt.pie.c[1] - pt.mano[1]))] as P};
  const zPie = ma[2];
  return (
    <group>
      <Cap a={ho} b={co} ra={31} rb={24} mat={m.pelo} semilla={i0 + 1} />
      <Cap a={co} b={mid} ra={24} rb={21} mat={m.pelo} semilla={i0 + 2} />
      <Cap a={mid} b={ma} ra={21} rb={19} mat={m.blanco} semilla={i0 + 3} />
      {/* dos rayas en el brazo */}
      {[0.3, 0.62].map((k, i) => {
        const c = mix3(ho, co, k);
        return <Cap key={i} a={sum3(c, [-24, 6, 10])} b={sum3(c, [-6, 10, 26])} ra={5} rb={3.5} mat={m.raya} semilla={i0 + 6 + i} amp={0.2} sombra={false} />;
      })}
      <group position={[pie.c[0], -pie.c[1], zPie]} rotation={[0, 0, -pie.ang]}>
        <mesh geometry={geoBola(24, i0 + 4, 0.8)} material={m.blanco} scale={[1.34, 0.7, 1]} castShadow receiveShadow />
        {[-11, 0, 11].map((dz, i) => (
          <mesh key={i} geometry={geoBola(8.5, i0 + 10 + i, 0.3)} material={m.blanco} position={[24, 4, dz]} castShadow receiveShadow />
        ))}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- el gato entero
const matsGato = (): Mats => ({
    pelo: arcilla(COL_GATO.pelo), raya: arcilla(COL_GATO.raya, {rough: 0.6}), blanco: arcilla(COL_GATO.blanco, {rough: 0.66}),
    nariz: arcilla(COL_GATO.nariz, {rough: 0.42, brillo: 0.25}), dentro: arcilla(COL_GATO.dentro, {rough: 0.7}),
    iris: arcilla(COL_GATO.iris, {rough: 0.16, brillo: 1, bump: 0.12}), pupila: arcilla(COL_GATO.pupila, {rough: 0.1, brillo: 1, bump: 0.05}),
    brillo: arcilla(COL_GATO.brillo, {rough: 0.2, bump: 0, emite: '#FFFFFF', fuerza: 0.9}), boca: arcilla(COL_GATO.boca, {rough: 0.6, bump: 0.3}),
    lengua: arcilla(COL_GATO.lengua, {rough: 0.4, brillo: 0.3}), bigote: arcilla(COL_GATO.bigote, {rough: 0.35, brillo: 0.3, bump: 0.2}),
});
// lo que brilla (para los reflejos del estudio): [material, cuánto refleja]
export const brillantesGato = (): [THREE.MeshPhysicalMaterial, number][] => {
  const m = matsGato();
  return [[m.iris, 0.6], [m.pupila, 0.9]] as [THREE.MeshPhysicalMaterial, number][];
};

export const GatoArcilla: React.FC<{g: Gato; t: number; paso: number}> = ({g, t, paso}) => {
  const m = matsGato();
  const S = ESCALA_GATO;
  const jt = tiembla(paso, 1), jc = tiembla(paso, 2), jp = tiembla(paso, 3), jb = tiembla(paso, 4), jk = tiembla(paso, 5);
  const tor = g.torso, cad = g.cadera, pec = g.pecho;
  // dónde está el hocico de verdad (la cabeza gira en 3D): ahí va la pata al lamerse
  const wLame = kv(t, [[4.95, 0], [5.15, 1]]);
  const lamer: V3 | null = (() => {
    if (wLame <= 0) return null;
    const yaw = mix(YAW0, Math.PI / 2, g.giro);
    const lx = 92 * CABEZA, ly = -52 * CABEZA;
    const x1 = lx * Math.cos(yaw), z1 = lx * Math.sin(yaw);
    const a = -g.inclina;
    return [g.cabeza.c[0] + x1 * Math.cos(a) - ly * Math.sin(a), -g.cabeza.c[1] + x1 * Math.sin(a) + ly * Math.cos(a) - 6, 6 + z1 + 14];
  })();
  // la cola: cápsulas gordas por segmentos, por detrás del cuerpo, con un anillo oscuro cada tres
  const zc = -38;
  const cola = g.cola.pts.slice(0, -1).map((a, i) => {
    const b = g.cola.pts[i + 1];
    const A3: V3 = [a[0], -a[1], zc], B3: V3 = [b[0], -b[1], zc];
    return (
      <group key={i}>
        <Cap a={A3} b={B3} ra={g.cola.r[i]} rb={g.cola.r[i + 1]} mat={m.pelo} semilla={200 + i} amp={0.8} />
        {i % 3 === 1 && <Cap a={mix3(A3, B3, 0.18)} b={mix3(A3, B3, 0.82)} ra={g.cola.r[i] + 1.6} rb={g.cola.r[i + 1] + 1.6} mat={m.raya} semilla={230 + i} amp={0.3} />}
      </group>
    );
  });
  const pieT = (z: number, semilla: number) => (
    <group position={[g.pieTrasero.c[0], -g.pieTrasero.c[1], z]} rotation={[0, 0, -g.pieTrasero.ang]}>
      <mesh geometry={geoBola(100, semilla, 1)} material={m.blanco} scale={[0.56, 0.2, 0.27]} castShadow receiveShadow />
      {[-10, 0, 10].map((dz, i) => (
        <mesh key={i} geometry={geoBola(9, semilla + 1 + i, 0.3)} material={m.blanco} position={[50, 4, dz]} castShadow receiveShadow />
      ))}
    </group>
  );
  return (
    <group position={[300 * (1 - S), -1010 * (1 - S), 0]} scale={[S, S, S]} dispose={null}>
      {/* la sombra de contacto en la mesa, donde se sienta */}
      <mesh position={[330, -1010 + 0.7, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[340, 210, 1]} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={mancha()} color="#2a1206" transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* lo del otro lado, detrás */}
      <PataArcilla pt={g.pataLejos} z={[-44, -40]} paso={paso} i0={300} m={m} />
      {pieT(-64, 320)}
      {cola}

      {/* el cuerpo: la cadera con su diana de rayas, el lomo con sus anillos, el pecho con el babero blanco y la barriga */}
      <Ovoide e={cad} rz={92} mat={m.pelo} semilla={101} j={jk}>
        {([[30, 40, 205], [52, 55, 195], [74, 68, 182]] as const).map(([psi, s0, s1], i) => (
          <Tira key={i} pts={tramo(7, (k) => diana(cad.rx, cad.ry, 92, psi * RAD, mix(s0, s1, k) * RAD))} r={7} mat={m.raya} semilla={110 + i * 10} />
        ))}
      </Ovoide>
      <Ovoide e={tor} rz={80} mat={m.pelo} semilla={102} j={jt}>
        {([[104, 186, 92], [64, 190, 82], [24, 188, 80], [-16, 186, 86], [-58, 182, 98]] as const).map(([yk, u0, u1], i) => (
          <Tira key={i} pts={tramo(7, (k) => anillo(tor.rx, tor.ry, 80, yk, mix(u0, u1, k) * RAD))} r={7.5} mat={m.raya} semilla={140 + i * 10} />
        ))}
      </Ovoide>
      <Ovoide e={pec} rz={72} mat={m.pelo} semilla={103} j={jp}>
        <mesh geometry={geoBola(100, 104, 1.2)} material={m.blanco} position={[26, -8, 6]} scale={[0.52, 0.92, 0.66]} castShadow receiveShadow />
      </Ovoide>
      <Ovoide e={g.barriga} rz={80} mat={m.blanco} semilla={105} j={jb} />
      <Cap a={[g.cuello[0][0] + jc[0], -g.cuello[0][1] + jc[1], 0]} b={[g.cuello[1][0], -g.cuello[1][1], 0]} ra={60} rb={56} mat={m.pelo} semilla={106} amp={1.4} />
      <Cap a={[g.cuello[0][0] + 22 + jc[0], -g.cuello[0][1] + jc[1], 8]} b={[g.cuello[1][0] + 20, -g.cuello[1][1] - 20, 8]} ra={40} rb={34} mat={m.blanco} semilla={107} amp={1} />

      <Cabeza g={g} t={t} paso={paso} m={m} />

      {/* lo de este lado, delante */}
      {pieT(64, 330)}
      <PataArcilla pt={g.pataCerca} z={[44, 34]} paso={paso} i0={340} m={m} lamer={lamer} w={wLame} />
    </group>
  );
};
