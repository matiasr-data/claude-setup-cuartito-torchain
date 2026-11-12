import React from 'react';
import {clamp} from '../../../comun/curvas';
import {ALTO, MUNECO, PLACA, SILLA, STUD, SUELO, esqueleto, giroRaiz, type Cara, type P, type Pose, type V3} from '../escena';
import {caja3, capsula, cilindro3, cruz, e3, elipse, enCara, f1, l2, n3, p3, pr, r2, r3, recto, s3, suave, type Cara3} from './geo';
import {Pieza, Traza, VID, aclara} from './vidrio';

// VIDRIERA, EL MUÑECO Y SU SILLA. El mismo muñeco de bloques, en su sitio y con su postura (el esqueleto de
// escena.ts), hecho marioneta de vidrio emplomado: el cuerpo, una caja de ámbar (la cara de delante encendida, el lado apagado con
// grisalla, la de arriba más clara) con el cuello blanco y la corbata de rubí metidos en plomo; las piernas, ladrillos de violeta; los
// brazos, tubos de ámbar con su codo y las manos de vidrio opalino; la cabeza, un cilindro de vidrio color carne con el pelo marrón y
// la cara pintada en grisalla (los ojos grandes, las cejas gruesas y la boca: como en las vidrieras, la expresión vive en las cejas y
// en la boca, y se cambia la cara entera, nunca se deforma). Gira con su silla de vidrio verde. Lo que se mueve se enciende.

const M = MUNECO;
const K = M.escala;
const CAM: V3 = [540, 300, 3582.8];
const visible = (q: V3, n: V3) => p3(n, r3(CAM, q)) > 0;

// ---------------------------------------------------------------- la cara pintada (en px de la superficie de la cabeza)
// u: hacia su izquierda; v: hacia abajo. Las medidas, las de la cara impresa de los bloques (BloquesMuneco.tsx) pasadas a px.
type Ojo = 'normal' | 'grande' | 'cerrado' | 'feliz' | 'medio' | 'susto';
type Boca = 'linea' | 'sonrisa' | 'o' | 'dientes' | 'triste' | 'grande' | 'ondas' | 'lado';
const CARAS: Record<Cara, {cejas: [number, number, number?]; ojo: Ojo; boca: Boca}> = {
  atento: {cejas: [0.35, -6], ojo: 'normal', boca: 'linea'},
  ilusion: {cejas: [-0.3, 8], ojo: 'grande', boca: 'sonrisa'},
  tension: {cejas: [-0.5, 2], ojo: 'grande', boca: 'dientes'},
  ay: {cejas: [-0.7, 16], ojo: 'grande', boca: 'o'},
  fastidio: {cejas: [0.8, -8, 14], ojo: 'cerrado', boca: 'triste'},
  meh: {cejas: [0, 4], ojo: 'medio', boca: 'lado'},
  susto: {cejas: [-0.6, 20], ojo: 'susto', boca: 'ondas'},
  feliz: {cejas: [-0.4, 14], ojo: 'feliz', boca: 'grande'},
  serio: {cejas: [0.1, -2], ojo: 'medio', boca: 'linea'},
};
const TINTA = '#1d0d05';

const pintaOjo = (forma: Ojo, ox: number, oy: number) => {
  const px = ox * 5.5, py = oy * 3.8;
  if (forma === 'cerrado') return <Traza d="M -12 1 Q 0 -6 12 1" w={5.5} op={0.95} color={TINTA} />;
  if (forma === 'feliz') return <Traza d="M -12 5 Q 0 -11 12 5" w={5.5} op={0.95} color={TINTA} />;
  if (forma === 'susto') {
    return (
      <g>
        <ellipse cx={0} cy={0} rx={12.5} ry={15} fill="#fffdf6" stroke={TINTA} strokeWidth={3.2} />
        <circle cx={px * 0.8} cy={py * 0.8} r={4.6} fill={TINTA} />
      </g>
    );
  }
  const rx = forma === 'grande' ? 11 : 9.6, ry = forma === 'grande' ? 15.5 : 13.6;
  return (
    <g>
      <ellipse cx={px} cy={py} rx={rx} ry={ry} fill={TINTA} fillOpacity={0.96} />
      <circle cx={px - rx * 0.32} cy={py - ry * 0.36} r={rx * 0.32} fill="#fffaf0" fillOpacity={0.92} />
      {forma === 'medio' && (
        <g>
          <rect x={px - rx - 3} y={py - ry - 4} width={2 * rx + 6} height={ry + 2.5} fill={VID.carne} />
          <Traza d={`M ${f1(px - rx - 2)} ${f1(py - 1.5)} L ${f1(px + rx + 2)} ${f1(py - 1.5)}`} w={3.8} op={0.95} color={TINTA} />
        </g>
      )}
    </g>
  );
};
const pintaCeja = (inc: number, lado: number, grosor = 12) => (
  <Traza d={`M ${f1(-lado * 11.5)} ${f1(inc * 5.5)} Q 0 -2.5 ${f1(lado * 11.5)} ${f1(-inc * 5.5)}`} w={grosor * 0.42} op={0.95} color={TINTA} />
);
const pintaBoca = (forma: Boca) => {
  switch (forma) {
    case 'linea': return <Traza d="M -12 0 L 12 0" w={4.4} op={0.95} color={TINTA} />;
    case 'lado': return <Traza d="M -13 2.5 Q 0 1 15 -3.5" w={4.4} op={0.95} color={TINTA} />;
    case 'sonrisa': return <Traza d="M -12.5 -2.5 Q 0 10 12.5 -2.5" w={4.4} op={0.95} color={TINTA} />;
    case 'triste': return <Traza d="M -11.5 4 Q 0 -6 11.5 4" w={4.4} op={0.95} color={TINTA} />;
    case 'o':
      return (
        <g>
          <ellipse cx={0} cy={0} rx={8.6} ry={11.6} fill={TINTA} />
          <ellipse cx={0} cy={5.4} rx={5} ry={4.2} fill="#d9364a" />
        </g>
      );
    case 'dientes':
      return (
        <g>
          <rect x={-17} y={-7} width={34} height={14} rx={4} fill="#fffdf4" stroke={TINTA} strokeWidth={3.2} />
          <path d="M -17 0 L 17 0 M -8.5 -7 L -8.5 7 M 0 -7 L 0 7 M 8.5 -7 L 8.5 7" stroke={TINTA} strokeWidth={2.2} />
        </g>
      );
    case 'grande':
      return (
        <g>
          <path d="M -24 -10 Q 0 -12 24 -10 Q 19 19 0 19 Q -19 19 -24 -10 Z" fill={TINTA} />
          <path d="M -21 -8.5 Q 0 -10 21 -8.5 L 18.5 -2.5 Q 0 -1.5 -18.5 -2.5 Z" fill="#fffdf4" />
          <ellipse cx={0} cy={11.6} rx={11.5} ry={5.4} fill="#d9364a" />
        </g>
      );
    case 'ondas':
      return <Traza d="M -17 2.7 L -12.7 -2.7 L -8.5 2.7 L -4.2 -2.7 L 0 2.7 L 4.2 -2.7 L 8.5 2.7 L 12.7 -2.7 L 17 2.7" w={3.6} op={0.95} color={TINTA} />;
  }
};

// ---------------------------------------------------------------- la cabeza: un cilindro y su cara envuelta en él
type Cabeza = {abajo: V3; U: V3; F: V3; L: V3; r: number; alto: number};
const enCabeza = (c: Cabeza, th: number, h: number, dr = 0): V3 =>
  s3(s3(c.abajo, e3(c.U, h)), s3(e3(c.F, (c.r + dr) * Math.cos(th)), e3(c.L, (c.r + dr) * Math.sin(th))));
// la transformación que pone un dibujo plano (u, v en px) sobre la cabeza en (th, h)
const sobreCabeza = (c: Cabeza, th: number, h: number): {m: string; vis: number} => {
  const q = enCabeza(c, th, h);
  const n: V3 = s3(e3(c.F, Math.cos(th)), e3(c.L, Math.sin(th)));
  const o = pr(q);
  const du = pr(enCabeza(c, th + 1 / c.r, h)), dv = pr(enCabeza(c, th, h + 1));
  const a = r2(du, o), b = r2(o, dv); // b: hacia abajo
  const vis = p3(n, n3(r3(CAM, q)));
  return {m: `matrix(${a[0].toFixed(4)} ${a[1].toFixed(4)} ${b[0].toFixed(4)} ${b[1].toFixed(4)} ${o[0].toFixed(1)} ${o[1].toFixed(1)})`, vis};
};

const H_OJOS = 57.9 * K, H_CEJAS = 76 * K, H_BOCA = 27.7 * K, TH_OJO = 0.355;

// ---------------------------------------------------------------- piezas que se ordenan por profundidad
type Item = {z: number; el: React.ReactElement};

const caraCaja = (c: Cara3, col: string, semilla: number, key: string, opts: {arriba?: boolean; lado?: boolean; luz?: number; plomo?: number} = {}) => (
  <Pieza key={key} d={recto(c.pts)} color={opts.arriba ? aclara(col, 0.2) : col} semilla={semilla} plomo={opts.plomo ?? 8}
    sombra={opts.lado ? 0.42 : 0} luz={opts.luz ?? 0} borde={0.7} />
);

// lo que se calienta: cuánto se mueve cada parte (px por segundo, en la pantalla)
export type Calor = {cabeza: number; der: number; izq: number; cuerpo: number};
export const calor = (ahora: Pose, antes: Pose, dt: number): Calor => {
  const a = esqueleto(ahora), b = esqueleto(antes);
  const v = (p: V3, q: V3) => l2(r2(pr(p), pr(q))) / dt;
  const k = (x: number) => clamp((x - 120) / 900);
  return {cabeza: k(v(a.cabeza, b.cabeza)), der: k(v(a.mano[0], b.mano[0])), izq: k(v(a.mano[1], b.mano[1])), cuerpo: k(v(a.pecho, b.pecho) * 1.5)};
};

export const MunecoVidrio: React.FC<{pose: Pose; calor: Calor}> = ({pose, calor: cal}) => {
  const s = esqueleto(pose);
  const items: Item[] = [];
  const U = n3(r3(s.cuello, s.pecho));
  const L = n3(r3(s.hombro[1], s.hombro[0]));
  const F = n3(cruz(L, U));
  // la raíz (lo que gira con la silla): su lado y su frente, horizontales
  const a = giroRaiz(pose);
  const Lr: V3 = [Math.cos(a), 0, -Math.sin(a)], Fr: V3 = [Math.sin(a), 0, Math.cos(a)], Arriba: V3 = [0, -1, 0];

  // ---- la silla (gira con él)
  const base: V3 = [SILLA.x, SUELO, SILLA.z];
  const enSilla = (lx: number, alto: number, lz: number): V3 => [base[0] + lx * Lr[0] + lz * Fr[0], SUELO - alto, base[2] + lx * Lr[2] + lz * Fr[2]];
  const yAsiento = SUELO - SILLA.asiento;
  const asiento = caja3(enSilla(0, yAsiento - PLACA * 0.75, -6), [Lr, Arriba, Fr], [1.5 * STUD, PLACA * 0.75, 1.5 * STUD]);
  const respaldo = caja3(enSilla(0, yAsiento - 4 + ALTO * 1.05, -STUD * 1.5 - 4), [Lr, Arriba, Fr], [1.5 * STUD, ALTO * 1.05, STUD / 2]);
  asiento.forEach((c, k) => items.push({z: c.z - 30, el: caraCaja(c, VID.verde, 300 + k, 'as' + k, {arriba: c.eje === 1 && c.signo === 1, lado: c.eje !== 1 && !(c.eje === 2 && c.signo === 1)})}));
  respaldo.forEach((c, k) => items.push({z: c.z - 40, el: caraCaja(c, VID.verde, 310 + k, 're' + k, {arriba: c.eje === 1 && c.signo === 1, lado: c.eje === 0})}));
  // el poste, el buje y las cinco patas con sus ruedas (no giran)
  const poste = recto(capsula(pr([base[0], SUELO - 52, base[2]]), pr([base[0], SUELO - yAsiento + 18, base[2]]), 15, 15, 4));
  items.push({z: base[2] - 25, el: <Pieza key="poste" d={poste} color={VID.humo} semilla={7} plomo={7} borde={0.5} />});
  const buje = cilindro3([base[0], SUELO - 22, base[2]], [0, -1, 0], 36, 30, 20);
  items.push({z: base[2] - 20, el: <Pieza key="buje" d={recto(buje)} color={VID.humoO} semilla={8} plomo={7} borde={0.5} />});
  for (let k = 0; k < 5; k++) {
    const ak = (k / 5) * Math.PI * 2 + 0.3;
    const dir: V3 = [Math.sin(ak), 0, Math.cos(ak)], lat: V3 = [Math.cos(ak), 0, -Math.sin(ak)];
    const c: V3 = [base[0] + dir[0] * STUD * 0.95, SUELO - 26 - PLACA / 2, base[2] + dir[2] * STUD * 0.95];
    const pata = caja3(c, [lat, Arriba, dir], [STUD / 2, PLACA / 2, 1.5 * STUD]);
    const rueda = elipse(pr([base[0] + dir[0] * STUD * 2.1, SUELO - 12, base[2] + dir[2] * STUD * 2.1]), 14, 11, 14);
    pata.forEach((f, q) => items.push({z: c[2] - 20, el: caraCaja(f, VID.humoO, 320 + k * 3 + q, `pa${k}-${q}`, {arriba: f.eje === 1 && f.signo === 1, plomo: 6})}));
    items.push({z: c[2] + dir[2] * 70 - 21, el: <Pieza key={'ru' + k} d={suave(rueda, 0.5)} color={VID.humo} semilla={k} plomo={5} borde={0.3} />});
  }

  // ---- las piernas: el muslo tumbado, la espinilla y el pie (ladrillos violeta; el pie, humo)
  const piernas = ([0, 1] as const).map((k) => {
    const lado = k === 0 ? -1 : 1;
    const cad = s3(s.cadera, e3(Lr, lado * M.pierna.x * K));
    const rod = s.rodilla[k], pie = s.pie[k];
    const largo = Math.hypot(...r3(rod, cad));
    const eje = n3(r3(rod, cad));
    const muslo = caja3(s3(e3(s3(cad, rod), 0.5), e3(Arriba, -22)), [Lr, n3(cruz(eje, Lr)), eje], [STUD * 0.5 * K, ALTO * 0.4 * K, largo / 2 + 16]);
    const eje2 = n3(r3(pie, rod));
    const esp = caja3(e3(s3(rod, pie), 0.5), [Lr, eje2, n3(cruz(Lr, eje2))], [STUD * 0.5 * K, Math.hypot(...r3(pie, rod)) / 2 + 10, STUD * 0.5 * K]);
    const pc: V3 = s3(s3(pie, e3(Arriba, -PLACA * K * 0.5 + 2)), e3(Fr, STUD * 0.45 * K));
    const zapato = caja3(pc, [Lr, Arriba, Fr], [STUD * 0.5 * K, PLACA * 0.5 * K, STUD * K]);
    return {k, muslo, esp, zapato, z: (cad[2] + rod[2]) / 2};
  });
  for (const p of piernas) {
    p.esp.forEach((c, q) => items.push({z: p.z + 6, el: caraCaja(c, VID.violeta, 330 + p.k * 9 + q, `es${p.k}-${q}`, {lado: c.eje !== 2 || c.signo < 0})}));
    p.zapato.forEach((c, q) => items.push({z: p.z + 7, el: caraCaja(c, VID.humoO, 340 + p.k * 9 + q, `za${p.k}-${q}`, {arriba: c.eje === 1, plomo: 7})}));
    p.muslo.forEach((c, q) => items.push({z: p.z + 8, el: caraCaja(c, VID.violeta, 350 + p.k * 9 + q, `mu${p.k}-${q}`, {arriba: c.eje === 1 && p3(c.n, Arriba) > 0.3, lado: c.eje === 0})}));
  }
  // la cadera: una placa violeta bajo el cuerpo
  const cadera = caja3(s.cadera, [Lr, Arriba, Fr], [STUD * K, M.cadera * K * 0.5, STUD * 0.5 * K]);
  cadera.forEach((c, q) => items.push({z: s.cadera[2] + 1, el: caraCaja(c, VID.violetaO, 360 + q, 'ca' + q, {arriba: c.eje === 1})}));

  // ---- el cuerpo: la caja de ámbar, con el cuello blanco y la corbata de rubí metidos en plomo
  const T = M.torso;
  const tm: [number, number, number] = [(T.an / 2) * K, (T.alto / 2) * K, (T.fondo / 2) * K];
  const te: [V3, V3, V3] = [L, U, F];
  const cuerpo = caja3(s.pecho, te, tm);
  const enPecho = (x: number, y: number): P => enCara(s.pecho, te, tm, 2, 1, ((x - 128) / 128) * 0.93, ((128 - y) / 128) * 0.97);
  const delante = cuerpo.find((c) => c.eje === 2 && c.signo === 1);
  const zc = s.pecho[2];
  cuerpo.forEach((c, q) => {
    const arriba = c.eje === 1 && c.signo === 1;
    items.push({z: zc + (c === delante ? 2 : 0), el: caraCaja(c, VID.ambar, 370 + q, 'cu' + q, {arriba, lado: c.eje === 0 || (c.eje === 2 && c.signo < 0), luz: cal.cuerpo * 0.5, plomo: 9})});
  });
  if (delante) {
    const cuello = [enPecho(60, 0), enPecho(106, 0), enPecho(128, 30), enPecho(150, 0), enPecho(196, 0), enPecho(128, 74)];
    const corbata = [enPecho(118, 60), enPecho(138, 60), enPecho(156, 190), enPecho(128, 228), enPecho(100, 190)];
    const nudo = [enPecho(110, 28), enPecho(146, 28), enPecho(138, 62), enPecho(118, 62)];
    const bolsillo = [enPecho(172, 112), enPecho(214, 112), enPecho(214, 148), enPecho(172, 148)];
    const pliegue = [enPecho(40, 120), enPecho(52, 180), enPecho(46, 236)];
    items.push({z: zc + 3, el: (
      <g key="camisa">
        <Pieza d={recto(cuello)} color={VID.blanco} semilla={2} plomo={6} borde={0.4} />
        <Pieza d={suave(corbata, 0.2)} color={VID.rubi} semilla={3} plomo={6} borde={0.4} />
        <Pieza d={recto(nudo)} color={VID.rubiO} semilla={4} plomo={6} borde={0.3} />
        <Traza d={recto(bolsillo)} w={3} op={0.5} />
        <Traza d={`M ${pliegue.map((q) => `${f1(q[0])} ${f1(q[1])}`).join(' L ')}`} w={3} op={0.35} />
      </g>
    )});
  }

  // ---- la cabeza: el cuello gris, el cilindro de carne con su cara, el pelo marrón
  const Fh0 = s.frente;
  const Uh = n3(r3(U, e3(Fh0, p3(U, Fh0))));
  const Fh = n3(r3(Fh0, e3(Uh, p3(Fh0, Uh))));
  const Lh = n3(cruz(Uh, Fh));
  const altoC = M.cabeza.alto * K, rC = M.cabeza.r * K;
  const cab: Cabeza = {abajo: s3(s.cabeza, e3(Uh, -altoC / 2)), U: Uh, F: Fh, L: Lh, r: rC, alto: altoC};
  const zh = s.cabeza[2];
  const cuelloGris = cilindro3(s3(cab.abajo, e3(Uh, -M.cuello * K - 2)), Uh, M.cuello * K + 6, 28 * K, 18);
  items.push({z: zh - 1, el: <Pieza key="cuellito" d={recto(cuelloGris)} color={VID.humo} semilla={5} plomo={6} borde={0.4} />});
  const sil = cilindro3(cab.abajo, Uh, altoC, rC, 30);
  const cara = CARAS[pose.cara];
  const ojos = pose.ojos;
  const rasgos: React.ReactElement[] = [];
  for (const lado of [-1, 1]) {
    const o = sobreCabeza(cab, lado * TH_OJO, H_OJOS);
    if (o.vis > 0.08) rasgos.push(<g key={'o' + lado} transform={o.m} opacity={clamp(o.vis * 4)}>{pintaOjo(cara.ojo, ojos[0], ojos[1])}</g>);
    const c = sobreCabeza(cab, lado * TH_OJO, H_CEJAS - cara.cejas[1] * -0.387);
    if (c.vis > 0.08) rasgos.push(<g key={'c' + lado} transform={c.m} opacity={clamp(c.vis * 4)}>{pintaCeja(cara.cejas[0], lado, cara.cejas[2])}</g>);
  }
  const b = sobreCabeza(cab, 0, H_BOCA);
  if (b.vis > 0.05) rasgos.push(<g key="boca" transform={b.m} opacity={clamp(b.vis * 4)}>{pintaBoca(cara.boca)}</g>);
  items.push({z: zh, el: (
    <Pieza key="cabeza" d={recto(sil)} color={VID.carne} semilla={9} plomo={9} luz={cal.cabeza * 0.7}>
      {/* la grisalla de volumen del cilindro: los dos lados, apagados */}
      <path d={recto(sil)} fill="url(#vd-cilindro)" />
      {rasgos}
    </Pieza>
  )});
  // el pelo: la placa redonda (arriba más clara) y el flequillo encima de la frente
  const pelo = cilindro3(s3(cab.abajo, e3(Uh, altoC - 12)), Uh, PLACA * K + 12, rC + 4, 30);
  const tapa = Array.from({length: 26}, (_, q) => pr(enCabeza(cab, (q / 26) * Math.PI * 2, altoC + PLACA * K, 4)));
  const fleco: P[] = [];
  const n = 9;
  for (let q = 0; q <= n; q++) fleco.push(pr(enCabeza(cab, -1.05 + (q / n) * 1.85, altoC + 3, 6)));
  for (let q = n; q >= 0; q--) {
    const onda = q % 2 ? 6 : 0;
    fleco.push(pr(enCabeza(cab, -1.05 + (q / n) * 1.85, altoC - 9 - onda, 6)));
  }
  items.push({z: zh + 1, el: (
    <g key="pelo">
      <Pieza d={recto(pelo)} color={VID.marron} semilla={10} plomo={9} luz={cal.cabeza * 0.5} />
      <Pieza d={suave(tapa, 0.4)} color={VID.marronC} semilla={11} plomo={7} borde={0.4} luz={cal.cabeza * 0.5} />
      <Pieza d={suave(fleco, 0.25)} color={VID.marron} semilla={12} plomo={7} borde={0.4} luz={cal.cabeza * 0.5}>
        <Traza d={`M ${f1(fleco[2][0])} ${f1(fleco[2][1])} L ${f1(fleco[2 * n - 1][0])} ${f1(fleco[2 * n - 1][1])}`} w={2.5} op={0.35} color="#f6c48a" />
      </Pieza>
    </g>
  )});

  // ---- los brazos: el de arriba, el antebrazo y la mano de vidrio opalino
  for (const k of [0, 1] as const) {
    const h = s.hombro[k], c = s.codo[k], m = s.mano[k];
    const H = pr(h), C = pr(c), Mn = pr(m);
    const e = (q: V3) => 3582.8 / (3582.8 - q[2]);
    const dir = r2(Mn, C), dl = Math.max(1, l2(dir));
    const manoC: P = [Mn[0] + (dir[0] / dl) * 9, Mn[1] + (dir[1] / dl) * 9];
    const luz = (k === 0 ? cal.der : cal.izq) * 0.8;
    const z = (h[2] + c[2] + m[2]) / 3;
    items.push({z, el: (
      <g key={'br' + k}>
        <Pieza d={recto(capsula(H, C, 27 * e(h), 25 * e(c), 7))} color={VID.ambar} semilla={20 + k} plomo={8} luz={luz} sombra={k === 1 ? 0.2 : 0} />
        <Pieza d={recto(capsula(C, Mn, 25 * e(c), 23 * e(m), 7))} color={VID.ambarC} semilla={22 + k} plomo={8} luz={luz} sombra={k === 1 ? 0.2 : 0} />
        <Pieza d={suave(elipse(manoC, 25 * e(m), 25 * e(m), 14), 0.5)} color={VID.opal} semilla={24 + k} plomo={7} borde={0.4} luz={luz}>
          <Traza d={`M ${f1(manoC[0] - 9)} ${f1(manoC[1] + 6)} q 9 6 18 0`} w={2.6} op={0.35} />
        </Pieza>
      </g>
    )});
  }

  items.sort((a2, b2) => a2.z - b2.z);
  return <g>{items.map((it, q) => <React.Fragment key={q}>{it.el}</React.Fragment>)}</g>;
};

// dónde está cada parte (para los halos de lo que se mueve)
export const partes = (pose: Pose) => {
  const s = esqueleto(pose);
  return {cabeza: pr(s.cabeza), der: pr(s.mano[0]), izq: pr(s.mano[1]), pecho: pr(s.pecho)};
};
