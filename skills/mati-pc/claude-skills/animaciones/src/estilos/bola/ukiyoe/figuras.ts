import {E, clamp, mix, rng} from '../../../comun/curvas';
import {
  LAMPARA, MUNECO, PAPELERA, PLACA, R_BOLA, SILLA, STUD, SUELO, escalaEn, esqueleto, giroRaiz, proyecta,
  type Bola, type Cara, type Golpe, type Pose, type V3,
} from '../escena';
import {bolaPapel, circulo, pintaCaja, pr} from './geometria';
import {Plancha, TINTA, elipse, mueve, poli, rect, suave, talla, tiembla, type P} from './imprenta';

// EL GRABADO JAPONÉS, LO QUE SE MUEVE: el farol de papel que cuelga (la lámpara del fallo 7), la silla, el
// muñeco (el mismo de los bloques: camisa amarilla, corbata roja, pantalón azul y su tupé castaño, pero con la línea del ukiyo-e:
// la cara en pocos trazos, los ojos de un trazo, los pelos finos del nacimiento del pelo), la papelera (un cubo de duelas lacado en
// bermellón, con sus aros), la bola en papel sin imprimir, su estela de viento y, en cada golpe, las garras de espuma de Hokusai con
// sus gotas en racimo. Todo en las medidas de escena.ts, proyectado con su cámara: así cada cosa está donde está en los bloques.

const sum = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const res = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const esc = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const nor = (a: V3): V3 => esc(a, 1 / Math.max(1e-9, Math.hypot(a[0], a[1], a[2])));
const rot2 = ([x, y]: P, a: number): P => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

// una cápsula entre dos puntos de la pantalla (los brazos, las piernas), con su temblor de mano
const capsula = (a: P, b: P, ra: number, rb: number, n = 12): P[] => {
  const L = Math.max(1e-3, Math.hypot(b[0] - a[0], b[1] - a[1]));
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const s = clamp((ra - rb) / L, -0.95, 0.95);
  const al = Math.acos(s);
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = al + (i / n) * (2 * Math.PI - 2 * al);
    out.push([a[0] + ra * Math.cos(t + ang), a[1] + ra * Math.sin(t + ang)]);
  }
  for (let i = 0; i <= n; i++) {
    const t = -al + (i / n) * 2 * al;
    out.push([b[0] + rb * Math.cos(t + ang), b[1] + rb * Math.sin(t + ang)]);
  }
  return out;
};
// la envolvente de unos círculos (el cuerpo)
const envolvente = (cs: [P, number][]): P[] => {
  const pts: P[] = [];
  for (const [c, r] of cs) for (let k = 0; k < 20; k++) pts.push([c[0] + r * Math.cos((k / 20) * Math.PI * 2), c[1] + r * Math.sin((k / 20) * Math.PI * 2)]);
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cruz = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const abajo: P[] = [], arriba: P[] = [];
  for (const p of pts) {
    while (abajo.length >= 2 && cruz(abajo[abajo.length - 2], abajo[abajo.length - 1], p) <= 0) abajo.pop();
    abajo.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (arriba.length >= 2 && cruz(arriba[arriba.length - 2], arriba[arriba.length - 1], p) <= 0) arriba.pop();
    arriba.push(p);
  }
  return [...abajo.slice(0, -1), ...arriba.slice(0, -1)];
};
const area = (p: P[]) => p.reduce((s, q, i) => s + q[0] * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * q[1], 0) / 2;

// ---------------------------------------------------------------- el farol de papel (chōchin)
export const farol = (pl: Plancha, ang: number, fuente: string) => {
  const L = LAMPARA;
  const m = new DOMMatrix().translate(L.x, L.yGancho).rotate((-ang * 180) / Math.PI);
  const loc = (p: Path2D) => mueve(p, m);
  const pt = (x: number, y: number): P => {
    const v = new DOMPoint(x, y).matrixTransform(m);
    return [v.x, v.y];
  };
  const cy = L.largo - 4;
  const c = pt(0, cy);
  // la luz: un bokashi amarillo pálido alrededor (no tapa nada)
  const halo = pl.cC.createRadialGradient(c[0], c[1], 70, c[0], c[1], 270);
  halo.addColorStop(0, 'rgba(247,214,120,0.42)');
  halo.addColorStop(0.55, 'rgba(247,214,120,0.14)');
  halo.addColorStop(1, 'rgba(247,214,120,0)');
  pl.tinte(elipse(c[0], c[1], 270, 270), halo, 'ocre');
  pl.raya(poli([pt(0, 0), pt(0, cy - 104)], false), 3.2);
  // el cuerpo: papel encendido, con sus costillas de bambú y el carácter
  const cuerpo = loc(elipse(0, cy, 80, 86));
  pl.papel(cuerpo);
  const luz = pl.cC.createRadialGradient(c[0], c[1] - 10, 6, c[0], c[1], 92);
  luz.addColorStop(0, 'rgba(250,222,140,0.95)');
  luz.addColorStop(0.65, 'rgba(240,196,104,0.55)');
  luz.addColorStop(1, 'rgba(214,150,70,0.6)');
  pl.tinte(cuerpo, luz, 'ocre');
  pl.texto('球', 0, cy + 4, `400 78px ${fuente}`, TINTA.beni, 'rojo', m);
  const costillas = new Path2D();
  for (let k = 1; k < 11; k++) {
    const y = cy - 86 + k * 15.6;
    const w = 80 * Math.sqrt(Math.max(0, 1 - ((y - cy) / 86) ** 2));
    costillas.moveTo(-w, y);
    costillas.quadraticCurveTo(0, y + 6, w, y);
  }
  pl.raya(loc(costillas), 1.7, TINTA.maderaO, 0.85);
  pl.raya(cuerpo, 4.6);
  // los aros de laca de arriba y de abajo, el asa y la borla
  pl.negro(loc(rect(-34, cy - 98, 34, cy - 80)), TINTA.sumi, 1, true);
  pl.negro(loc(rect(-12, cy - 108, 12, cy - 98)), TINTA.sumi, 1, true);
  pl.negro(loc(rect(-32, cy + 76, 32, cy + 92)), TINTA.sumi, 1, true);
  const borla = loc(poli([[-6, cy + 92], [6, cy + 92], [9, cy + 132], [-9, cy + 132]]));
  pl.tinta(borla, TINTA.beni, 'rojo');
  pl.raya(borla, 2);
};

// ---------------------------------------------------------------- un cilindro de pie (el poste de la silla, su buje)
const cilindro = (pl: Plancha, cx: number, cz: number, r: number, yArriba: number, yAbajo: number, col: string, negro = false) => {
  const cuerpo = poli([...circulo(cx, yArriba, cz, r, 14, 0, Math.PI), ...circulo(cx, yAbajo, cz, r, 14, Math.PI, 0)]);
  const tapa = poli(circulo(cx, yArriba, cz, r, 24));
  if (negro) {
    pl.negro(cuerpo, col, 1, true);
    pl.negro(tapa, TINTA.sumiL, 1, true);
  } else {
    pl.tinta(cuerpo, col, 'gris');
    pl.tinta(tapa, TINTA.grisL, 'gris');
    pl.raya(cuerpo, 2.6);
    pl.raya(tapa, 2.2);
  }
};

// ---------------------------------------------------------------- la silla de oficina (gira con él)
export const silla = (pl: Plancha, pose: Pose) => {
  const th = giroRaiz(pose);
  const yA = SUELO - SILLA.asiento; // el alto del asiento sobre el suelo
  const piv: V3 = [SILLA.x, 0, SILLA.z];
  // la base: cinco patas con ruedas, de atrás hacia delante
  const patas = [0, 1, 2, 3, 4].map((k) => (k / 5) * Math.PI * 2 + 0.3).sort((a, b) => Math.cos(a) - Math.cos(b));
  for (const a of patas) {
    const rueda: V3 = [SILLA.x + STUD * 2.1 * Math.sin(a), SUELO - 13, SILLA.z + STUD * 2.1 * Math.cos(a)];
    cilindro(pl, rueda[0], rueda[2], 13, SUELO - 24, SUELO - 2, TINTA.gris);
    pintaCaja(pl, [SILLA.x + STUD * 0.95 * Math.sin(a), SUELO - 26 - PLACA / 2, SILLA.z + STUD * 0.95 * Math.cos(a)], [54, PLACA, STUD * 2.6],
      {arriba: TINTA.sumiL, frente: TINTA.sumi, lado: TINTA.sumi}, 'gris', {giro: a, negro: true, linea: 2.2});
  }
  cilindro(pl, SILLA.x, SILLA.z, 30, SUELO - 58, SUELO - 22, TINTA.sumi, true);
  cilindro(pl, SILLA.x, SILLA.z, 15, SUELO - (yA - 18), SUELO - 52, TINTA.gris);
  const azul = {arriba: TINTA.prusiaL, frente: TINTA.prusia, lado: TINTA.prusiaO};
  // la tela de la silla: lunares en papel, en filas al tresbolillo (un komon de Edo), recortados a cada cara
  const motivo = (f: {pts: P[]}) => {
    const xs = f.pts.map((q) => q[0]), ys = f.pts.map((q) => q[1]);
    const lunares = new Path2D();
    for (let fy = 0, y = Math.min(...ys) + 6; y < Math.max(...ys); fy++, y += 15) {
      for (let x = Math.min(...xs) + 6 + (fy % 2) * 8; x < Math.max(...xs); x += 16) {
        lunares.moveTo(x + 2.6, y);
        lunares.arc(x, y, 2.6, 0, Math.PI * 2);
      }
    }
    pl.recorte = poli(f.pts);
    pl.papel(lunares);
    pl.recorte = null;
  };
  // el respaldo (detrás de él) y el asiento
  const respaldo = 2.1 * 76.8;
  pintaCaja(pl, [SILLA.x, SUELO - (yA - 4) - respaldo / 2, SILLA.z - STUD * 1.5 - 4], [3 * STUD, respaldo, STUD], azul, 'azul', {giro: th, piv, linea: 4, motivo});
  pintaCaja(pl, [SILLA.x, SUELO - yA + (PLACA * 1.5) / 2, SILLA.z - 6], [3 * STUD, PLACA * 1.5, 3 * STUD], azul, 'azul', {giro: th, piv, linea: 4, motivo});
};

// ---------------------------------------------------------------- la cara de estampa
// La cabeza es una esfera de radio R; cada rasgo vive en ella en ángulos (a: de lado, + hacia su izquierda; b: + hacia abajo) y se
// lleva a la pantalla con hacia dónde mira la cara. Así los rasgos se acortan solos al girar y nunca salen de la cabeza.
type Base = {c: P; R: number; f: V3; r: V3; d: V3};
const enCabeza = (B: Base, a: number, b: number): {p: P; z: number} => {
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  const v = sum(sum(esc(B.f, ca * cb), esc(B.r, sa * cb)), esc(B.d, sb));
  return {p: [B.c[0] + B.R * v[0], B.c[1] + B.R * v[1]], z: v[2]};
};
const enC = (B: Base, pts: [number, number][]) => pts.map(([a, b]) => enCabeza(B, a, b).p);

const cara = (pl: Plancha, B: Base, gesto: Cara, ojos: P) => {
  const sumi = TINTA.sumi;
  // los rasgos, un poco más grandes que en una estampa de verdad: tienen que leerse en pequeño
  const K = 1.26;
  const R = B.R * 1.18;
  const enCk = (a: number, b: number) => enCabeza(B, a * K, b * K + 0.02);
  const enCK = (pts: [number, number][]) => pts.map(([a, b]) => enCk(a, b).p);
  const lado = [-1, 1] as const;
  const ojoX = 0.36;
  const pupila: P = [ojos[0] * 0.07, ojos[1] * 0.04];
  // los ojos
  type FormaOjo = 'almendra' | 'grande' | 'redondo' | 'cerrado' | 'feliz' | 'medio';
  const ojo = (s: -1 | 1, forma: FormaOjo) => {
    const a0 = s * ojoX;
    if (enCk(a0, 0).z < 0.12) return;
    if (forma === 'cerrado') {
      // apretados: un «>» y un «<»
      const pts = enCK([[a0 - s * 0.12, -0.07], [a0 + s * 0.08, 0.0], [a0 - s * 0.12, 0.07]]);
      pl.negro(talla(pts, R * 0.07, {afina: [0.2, 0.2], semilla: 3 + s, per: 4}));
      return;
    }
    if (forma === 'feliz') {
      const pts = enCK([[a0 - 0.14, 0.04], [a0 - 0.07, -0.04], [a0, -0.065], [a0 + 0.07, -0.04], [a0 + 0.14, 0.04]]);
      pl.negro(talla(pts, R * 0.075, {afina: [0.25, 0.25], semilla: 5 + s, per: 4}));
      return;
    }
    if (forma === 'redondo') {
      const blanco = enCK(Array.from({length: 16}, (_, k) => [a0 + 0.12 * Math.cos((k / 16) * Math.PI * 2), 0.12 * Math.sin((k / 16) * Math.PI * 2)] as [number, number]));
      pl.papel(poli(blanco));
      pl.negro(poli(enCK(Array.from({length: 12}, (_, k) => [a0 + pupila[0] * 0.6 + 0.042 * Math.cos((k / 12) * Math.PI * 2), pupila[1] * 0.6 + 0.042 * Math.sin((k / 12) * Math.PI * 2)] as [number, number]))));
      pl.raya(poli(blanco), R * 0.05);
      return;
    }
    const alto = forma === 'grande' ? 0.1 : 0.068;
    const bajo = forma === 'grande' ? 0.075 : 0.05;
    const arribaL: [number, number][] = forma === 'medio'
      ? [[a0 - 0.15, 0.0], [a0, -0.012], [a0 + 0.15, -0.004]]
      : [[a0 - 0.15, 0.012], [a0 - 0.06, -alto * 0.95], [a0 + 0.04, -alto], [a0 + 0.15, -0.004]];
    const abajoL: [number, number][] = [[a0 + 0.15, -0.004], [a0 + 0.02, bajo], [a0 - 0.15, 0.012]];
    const contornoOjo = enCK([...arribaL, ...abajoL.slice(1)]);
    pl.papel(suave(contornoOjo, true));
    // la pupila (si el párpado está a media asta, se corta)
    const pc: P = [a0 + pupila[0], 0.008 + pupila[1] + (forma === 'medio' ? 0.02 : 0)];
    const rr = forma === 'grande' ? 0.06 : 0.052;
    pl.recorte = suave(contornoOjo, true);
    pl.negro(poli(enCK(Array.from({length: 14}, (_, k) => [pc[0] + rr * Math.cos((k / 14) * Math.PI * 2), pc[1] + rr * 1.1 * Math.sin((k / 14) * Math.PI * 2)] as [number, number]))));
    pl.papel(poli(enCK(Array.from({length: 8}, (_, k) => [pc[0] - rr * 0.35 + 0.018 * Math.cos((k / 8) * Math.PI * 2), pc[1] - rr * 0.4 + 0.018 * Math.sin((k / 8) * Math.PI * 2)] as [number, number]))));
    pl.recorte = null;
    // el párpado de arriba, grueso; el de abajo, fino
    pl.negro(talla(enCK(arribaL), R * (forma === 'medio' ? 0.09 : 0.072), {afina: [0.15, 0.3], semilla: 7 + s, per: 4}));
    pl.raya(suave(enCK(abajoL)), R * 0.028);
  };
  // las cejas: inclinación (+ = enfado, la punta de dentro baja) y altura
  const cejas = (inc: number, alto: number, grueso = 0.075) => {
    for (const s of lado) {
      const a0 = s * ojoX;
      if (enCk(a0, -0.2).z < 0.1) continue;
      const y = -0.22 - alto;
      const pts = enCK([[a0 - s * 0.15, y - inc * 0.05], [a0 - s * 0.02, y - 0.03], [a0 + s * 0.14, y + inc * 0.06]]);
      pl.negro(talla(s < 0 ? pts : pts, R * grueso, {afina: [0.15, 0.55], semilla: 11 + s, per: 4}));
    }
  };
  type FormaBoca = 'linea' | 'sonrisa' | 'abierta' | 'dientes' | 'o' | 'triste' | 'lado' | 'grande';
  const boca = (forma: FormaBoca) => {
    const y = 0.43;
    if (forma === 'linea') pl.negro(talla(enCK([[-0.12, y], [0, y + 0.005], [0.12, y]]), R * 0.045, {semilla: 2, per: 4}));
    else if (forma === 'sonrisa') pl.negro(talla(enCK([[-0.15, y - 0.03], [-0.05, y + 0.03], [0.05, y + 0.03], [0.15, y - 0.03]]), R * 0.05, {semilla: 3, per: 4}));
    else if (forma === 'triste') pl.negro(talla(enCK([[-0.14, y + 0.04], [-0.04, y - 0.02], [0.06, y - 0.02], [0.14, y + 0.04]]), R * 0.05, {semilla: 4, per: 4}));
    else if (forma === 'lado') pl.negro(talla(enCK([[-0.13, y + 0.03], [0.02, y + 0.01], [0.14, y - 0.04]]), R * 0.048, {semilla: 5, per: 4}));
    else if (forma === 'o') {
      const o = enCK(Array.from({length: 14}, (_, k) => [0.075 * Math.cos((k / 14) * Math.PI * 2), y + 0.02 + 0.095 * Math.sin((k / 14) * Math.PI * 2)] as [number, number]));
      pl.tinta(poli(o), TINTA.beniO, 'rojo');
      pl.raya(poli(o), R * 0.045);
    } else if (forma === 'abierta' || forma === 'grande') {
      const g = forma === 'grande' ? 1.45 : 1;
      const pts: [number, number][] = [];
      for (let k = 0; k <= 10; k++) pts.push([mix(-0.15, 0.15, k / 10) * g, y - 0.03]);
      for (let k = 1; k < 10; k++) {
        const u = k / 10;
        pts.push([mix(0.15, -0.15, u) * g * (0.92 + 0.08 * Math.sin(u * Math.PI)), y - 0.03 + 0.15 * g * Math.sin(u * Math.PI)]);
      }
      const p = poli(enCK(pts));
      pl.tinta(p, TINTA.beni, 'rojo');
      if (forma === 'grande') {
        pl.papel(poli(enCK([[-0.17, y - 0.02], [0.17, y - 0.02], [0.15, y + 0.03], [-0.15, y + 0.03]])));
        pl.tinta(poli(enCK(Array.from({length: 12}, (_, k) => [0.08 * Math.cos((k / 12) * Math.PI * 2), y + 0.13 + 0.035 * Math.sin((k / 12) * Math.PI * 2)] as [number, number]))), TINTA.beniL, 'rojo');
      }
      pl.raya(p, R * 0.045);
    } else if (forma === 'dientes') {
      const d = enCK([[-0.16, y - 0.035], [0.16, y - 0.035], [0.15, y + 0.045], [-0.15, y + 0.045]]);
      pl.papel(poli(d));
      const lineas = new Path2D();
      const m1 = enCK([[-0.16, y + 0.005], [0.16, y + 0.005]]);
      lineas.moveTo(...m1[0]);
      lineas.lineTo(...m1[1]);
      for (const a of [-0.08, 0, 0.08]) {
        const q = enCK([[a, y - 0.035], [a, y + 0.045]]);
        lineas.moveTo(...q[0]);
        lineas.lineTo(...q[1]);
      }
      pl.raya(lineas, R * 0.025);
      pl.raya(poli(d), R * 0.042);
    }
  };
  // el rubor (bokashi rosa en las mejillas) cuando se ilusiona o celebra
  if (gesto === 'feliz' || gesto === 'ilusion') {
    for (const s of lado) {
      const q = enCk(s * 0.46, 0.24);
      if (q.z < 0.15) continue;
      const g = pl.cC.createRadialGradient(q.p[0], q.p[1], 0, q.p[0], q.p[1], R * 0.2);
      g.addColorStop(0, 'rgba(224,120,110,0.55)');
      g.addColorStop(1, 'rgba(224,120,110,0)');
      pl.tinte(elipse(q.p[0], q.p[1], R * 0.2, R * 0.2), g, 'rojo');
    }
  }
  // la nariz: un gancho de un trazo
  pl.negro(talla(enCK([[0.02, 0.1], [0.07, 0.24], [0.0, 0.27]]), R * 0.035, {afina: [0.4, 0.2], semilla: 9, per: 4}));
  switch (gesto) {
    case 'atento': cejas(0.1, 0); ojo(-1, 'almendra'); ojo(1, 'almendra'); boca('linea'); break;
    case 'ilusion': cejas(-0.4, 0.05); ojo(-1, 'grande'); ojo(1, 'grande'); boca('abierta'); break;
    case 'tension': cejas(0.7, -0.02); ojo(-1, 'grande'); ojo(1, 'grande'); boca('dientes'); break;
    case 'ay': cejas(-0.8, 0.06); ojo(-1, 'cerrado'); ojo(1, 'cerrado'); boca('o'); break;
    case 'fastidio': cejas(0.9, -0.03, 0.085); ojo(-1, 'medio'); ojo(1, 'medio'); boca('triste'); break;
    case 'meh': cejas(0, 0.02); ojo(-1, 'medio'); ojo(1, 'medio'); boca('lado'); break;
    case 'susto': cejas(-0.7, 0.09); ojo(-1, 'redondo'); ojo(1, 'redondo'); boca('o'); break;
    case 'feliz': cejas(-0.5, 0.08); ojo(-1, 'feliz'); ojo(1, 'feliz'); boca('grande'); break;
    case 'serio': cejas(0.2, 0); ojo(-1, 'medio'); ojo(1, 'medio'); boca('linea'); break;
  }
  void sumi;
};

const cabeza = (pl: Plancha, c: P, R: number, frente: V3, gesto: Cara, ojos: P) => {
  // la cara se lee en pequeño solo si se ve: se inclina como mucho un poco hacia arriba o abajo y nunca pasa de tres cuartos
  const f0 = nor(frente);
  const f = nor([f0[0] * 0.85, clamp(f0[1] * 0.45, -0.22, 0.26), Math.max(f0[2], 0.62)]);
  let r: V3 = [f[2], 0, -f[0]];
  if (Math.hypot(r[0], r[2]) < 1e-3) r = [1, 0, 0];
  r = nor(r);
  const d: V3 = nor([f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]]);
  const B: Base = {c, R, f, r, d};
  const sg = f[0] >= 0 ? 1 : -1; // hacia qué lado de la pantalla mira
  // la silueta: un huevo con el tupé (un bulto arriba, hacia la cara)
  const tq = Math.atan2(-0.9, f[0] * 0.55);
  const sil: P[] = Array.from({length: 72}, (_, k) => {
    const th = (k / 72) * Math.PI * 2;
    let dt = th - tq;
    dt = Math.atan2(Math.sin(dt), Math.cos(dt));
    const bulto = Math.abs(dt) < 0.8 ? 0.2 * Math.cos((dt / 0.8) * (Math.PI / 2)) ** 2 : 0;
    const rr = R * (1 + bulto);
    return [c[0] + rr * Math.cos(th), c[1] + rr * Math.sin(th) * (Math.sin(th) > 0 ? 1.08 : 1)];
  });
  const silueta = poli(sil);
  pl.tinta(silueta, TINTA.carne, 'carne');
  // la cara: un cono alrededor de donde mira (un pelo hacia abajo); lo que se sale por detrás, al borde de la silueta
  const fc = nor(sum(f, esc(d, 0.28)));
  const rc = nor(res(r, esc(fc, r[0] * fc[0] + r[1] * fc[1] + r[2] * fc[2])));
  const dc: V3 = nor([fc[1] * rc[2] - fc[2] * rc[1], fc[2] * rc[0] - fc[0] * rc[2], fc[0] * rc[1] - fc[1] * rc[0]]);
  const caraPts: P[] = Array.from({length: 48}, (_, k) => {
    const ph = (k / 48) * Math.PI * 2, be = 1.2;
    const v = sum(esc(fc, Math.cos(be)), esc(sum(esc(rc, Math.cos(ph)), esc(dc, Math.sin(ph))), Math.sin(be)));
    let x = v[0], y = v[1];
    if (v[2] < 0) {
      const l = Math.hypot(x, y) || 1;
      x /= l;
      y /= l;
    }
    return [c[0] + R * x * 1.03, c[1] + R * y * 1.03];
  });
  const caraP = poli(caraPts);
  // el pelo: todo lo de arriba de la línea de las orejas (más baja por la nuca que por la cara)
  const linea: P[] = [[c[0] - sg * R * 1.5, c[1] + R * 0.6], [c[0] + sg * R * 1.5, c[1] + R * 0.05]];
  const arribaP = poli([[linea[0][0], c[1] - R * 1.7], [linea[1][0], c[1] - R * 1.7], linea[1], linea[0]]);
  pl.recorte = silueta;
  pl.tinta(arribaP, TINTA.pelo, 'ocre');
  // los pelos finos (kewari): del nacimiento hacia la coronilla, un poco curvados
  const corona: P = [c[0] - sg * R * 0.6, c[1] - R * 0.95];
  const finos = new Path2D();
  const yLinea = (x: number) => mix(linea[0][1], linea[1][1], (x - linea[0][0]) / (linea[1][0] - linea[0][0]));
  caraPts.forEach((q, k) => {
    if (k % 2 || q[1] > yLinea(q[0]) - 6) return;
    const m: P = [mix(q[0], corona[0], 0.45) + sg * 8, mix(q[1], corona[1], 0.45) - 4];
    finos.moveTo(q[0], q[1]);
    finos.quadraticCurveTo(m[0], m[1], mix(q[0], corona[0], 0.78), mix(q[1], corona[1], 0.78));
  });
  pl.raya(finos, 1.4, '#120c08', 0.95);
  // la cara se vuelve a pintar encima del pelo
  pl.tinta(caraP, TINTA.carne, 'carne');
  pl.recorte = arribaP;
  pl.raya(caraP, R * 0.045);
  pl.recorte = null;
  // la oreja de este lado (por encima del pelo)
  for (const s of [-1, 1]) {
    const q = enCabeza(B, s * 1.45, 0.1);
    if (q.z < 0.05) continue;
    const o = elipse(q.p[0], q.p[1], R * 0.13, R * 0.2);
    pl.tinta(o, TINTA.carne, 'carne');
    pl.raya(o, R * 0.05);
    const dentro = new Path2D();
    dentro.arc(q.p[0], q.p[1], R * 0.07, -1.2, 1.6);
    pl.raya(dentro, R * 0.025);
  }
  // los rasgos (recortados a la cabeza)
  pl.recorte = silueta;
  cara(pl, B, gesto, ojos);
  pl.recorte = null;
  pl.raya(suave(tiembla(sil, 0.6, 2), true), R * 0.085);
};

// ---------------------------------------------------------------- el muñeco
type Pieza = {z: number; pinta: () => void};
export const muneco = (pl: Plancha, pose: Pose, paso: number) => {
  const s = esqueleto(pose);
  const k = MUNECO.escala;
  const P2 = (v: V3) => proyecta(v);
  const sz = (v: V3) => escalaEn(v[2]);
  // el temblor del papel recortado: cada pieza, un pelo distinta en cada paso
  const jit = (i: number): P => {
    const r = rng(paso * 7919 + i * 131 + 5);
    return [(r() - 0.5) * 2.2, (r() - 0.5) * 2.2];
  };
  const mv = (p: P, j: P): P => [p[0] + j[0], p[1] + j[1]];
  const media: V3 = esc(res(s.rodilla[0], s.rodilla[1]), 0.5);
  const cadera: [V3, V3] = [sum(s.cadera, media), res(s.cadera, media)];
  const F: V3 = [Math.cos(pose.gira), 0, Math.sin(pose.gira)]; // hacia dónde mira el cuerpo
  const A: V3 = [-F[2], 0, F[0]]; // su costado
  const piezas: Pieza[] = [];
  const contornoK = 5.4;

  // las piernas: el muslo y la espinilla con su raya diplomática, y el zapato
  for (const l of [0, 1] as const) {
    const j = jit(10 + l);
    const a = mv(P2(cadera[l]), j), b = mv(P2(s.rodilla[l]), j), p = mv(P2(s.pie[l]), j);
    const e = sz(s.rodilla[l]);
    piezas.push({
      z: (cadera[l][2] + s.rodilla[l][2]) / 2 + 2,
      pinta: () => {
        const muslo = capsula(a, b, 37 * k * e * 0.85, 33 * k * e * 0.85);
        const pm = poli(tiembla(muslo, 0.5, 20 + l));
        pl.tinta(pm, TINTA.pantalon, 'azul');
        pl.recorte = pm;
        const rayas = new Path2D();
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        for (let q = -2; q <= 2; q++) {
          const o = rot2([0, q * 11], ang);
          rayas.moveTo(a[0] + o[0] - Math.cos(ang) * 40, a[1] + o[1] - Math.sin(ang) * 40);
          rayas.lineTo(b[0] + o[0] + Math.cos(ang) * 40, b[1] + o[1] + Math.sin(ang) * 40);
        }
        pl.trazoTinta(rayas, 1.6, TINTA.prusiaL, 'azul', 0.8);
        pl.recorte = null;
        pl.raya(pm, contornoK);
      },
    });
    piezas.push({
      z: (s.rodilla[l][2] + s.pie[l][2]) / 2 + 1,
      pinta: () => {
        const esp = capsula(b, p, 32 * k * e * 0.85, 27 * k * e * 0.85);
        const pe = poli(tiembla(esp, 0.5, 30 + l));
        pl.tinta(pe, TINTA.pantalon, 'azul');
        pl.recorte = pe;
        const rayas = new Path2D();
        const ang = Math.atan2(p[1] - b[1], p[0] - b[0]);
        for (let q = -2; q <= 2; q++) {
          const o = rot2([0, q * 11], ang);
          rayas.moveTo(b[0] + o[0] - Math.cos(ang) * 40, b[1] + o[1] - Math.sin(ang) * 40);
          rayas.lineTo(p[0] + o[0] + Math.cos(ang) * 40, p[1] + o[1] + Math.sin(ang) * 40);
        }
        pl.trazoTinta(rayas, 1.6, TINTA.prusiaL, 'azul', 0.8);
        pl.recorte = null;
        pl.raya(pe, contornoK);
        // el zapato, negro de laca, hacia donde mira
        const talon = mv(P2(sum(s.pie[l], sum(esc(F, -16), [0, 10, 0]))), j);
        const punta = mv(P2(sum(s.pie[l], sum(esc(F, 54), [0, 18, 0]))), j);
        pl.negro(poli(capsula(talon, punta, 19 * e, 15 * e)), TINTA.sumi, 1, true);
      },
    });
  }
  // los brazos: manga amarilla (brazo y antebrazo) y la mano
  for (const l of [0, 1] as const) {
    const j = jit(20 + l);
    const h = mv(P2(s.hombro[l]), j), c = mv(P2(s.codo[l]), j), m = mv(P2(s.mano[l]), j);
    const e = sz(s.codo[l]);
    piezas.push({
      z: (s.hombro[l][2] + s.codo[l][2]) / 2,
      pinta: () => {
        const p = poli(tiembla(capsula(h, c, 28 * e, 25 * e), 0.5, 40 + l));
        pl.tinta(p, TINTA.amarillo, 'ocre');
        pl.raya(p, contornoK);
      },
    });
    piezas.push({
      z: (s.codo[l][2] + s.mano[l][2]) / 2 + 0.5,
      pinta: () => {
        const p = poli(tiembla(capsula(c, m, 25 * e, 21 * e), 0.5, 50 + l));
        pl.tinta(p, TINTA.amarillo, 'ocre');
        // el pliegue del codo
        const ang = Math.atan2(m[1] - c[1], m[0] - c[0]);
        const pli = rot2([0, 14 * e], ang);
        pl.negro(talla([[c[0] + pli[0] * 0.2, c[1] + pli[1] * 0.2], [c[0] + Math.cos(ang) * 16 + pli[0] * 0.6, c[1] + Math.sin(ang) * 16 + pli[1] * 0.6]], 3, {per: 3, semilla: 60 + l}));
        pl.raya(p, contornoK);
      },
    });
    piezas.push({
      z: s.mano[l][2] + 1,
      pinta: () => {
        const ang = Math.atan2(m[1] - c[1], m[0] - c[0]);
        const mano = poli(tiembla(capsula([m[0] - Math.cos(ang) * 6, m[1] - Math.sin(ang) * 6], [m[0] + Math.cos(ang) * 12, m[1] + Math.sin(ang) * 12], 22 * e, 19 * e, 8), 0.6, 70 + l));
        pl.tinta(mano, TINTA.carne, 'carne');
        pl.raya(mano, 4.2);
        // el pulgar, un trazo
        const pu = rot2([0, -16 * e], ang);
        pl.negro(talla([[m[0] + pu[0] * 0.3, m[1] + pu[1] * 0.3], [m[0] + Math.cos(ang) * 10 + pu[0] * 0.7, m[1] + Math.sin(ang) * 10 + pu[1] * 0.7]], 2.6, {per: 3, semilla: 80 + l}));
      },
    });
  }
  // el cuerpo: la camisa amarilla, el cuello blanco y la corbata roja
  {
    const j = jit(1);
    const e = sz(s.pecho);
    const tronco = envolvente([
      [mv(P2(s.hombro[0]), j), 30 * e], [mv(P2(s.hombro[1]), j), 30 * e], [mv(P2(s.cuello), j), 36 * e],
      [mv(P2(s.pecho), j), 56 * e], [mv(P2(cadera[0]), j), 42 * e], [mv(P2(cadera[1]), j), 42 * e],
    ]);
    const frente = F[2] > -0.25;
    piezas.push({
      z: s.pecho[2],
      pinta: () => {
        const pt = poli(tiembla(tronco, 0.6, 3));
        pl.tinta(pt, TINTA.amarillo, 'ocre');
        pl.recorte = pt;
        // los pliegues de la camisa (dos trazos desde la sisa)
        for (const l of [0, 1] as const) {
          const h = mv(P2(s.hombro[l]), j), cc = mv(P2(s.cadera), j);
          pl.negro(talla([[mix(h[0], cc[0], 0.25), mix(h[1], cc[1], 0.25)], [mix(h[0], cc[0], 0.5) + 6, mix(h[1], cc[1], 0.5)]], 3, {per: 3, semilla: 90 + l}));
        }
        if (frente) {
          const fondo = (MUNECO.torso.fondo / 2) * k;
          const top = sum(sum(s.cuello, esc(F, fondo * 0.95)), [0, 6, 0]);
          const bot = sum(sum(s.pecho, esc(F, fondo * 1.02)), [0, 58, 0]);
          // el cuello de la camisa, en papel
          for (const sgn of [-1, 1]) {
            const q = [sum(top, esc(A, sgn * 4)), sum(top, esc(A, sgn * 36 * k)), sum(sum(top, esc(A, sgn * 14 * k)), [0, 30, 0])].map((v) => mv(P2(v), j));
            pl.papel(poli(q));
            pl.raya(poli(q), 3);
          }
          // la corbata: el nudo y la pala que se ensancha
          const nudo = [sum(sum(top, esc(A, -9 * k)), [0, 4, 0]), sum(sum(top, esc(A, 9 * k)), [0, 4, 0]), sum(sum(top, esc(A, 7 * k)), [0, 24, 0]), sum(sum(top, esc(A, -7 * k)), [0, 24, 0])].map((v) => mv(P2(v), j));
          const pala = [sum(sum(top, esc(A, -6 * k)), [0, 22, 0]), sum(sum(top, esc(A, 6 * k)), [0, 22, 0]), sum(bot, esc(A, 14 * k)), sum(bot, [0, 18, 0]), sum(bot, esc(A, -14 * k))].map((v) => mv(P2(v), j));
          pl.tinta(poli(pala), TINTA.beni, 'rojo');
          pl.raya(poli(pala), 3);
          pl.tinta(poli(nudo), TINTA.beni, 'rojo');
          pl.raya(poli(nudo), 3);
        }
        pl.recorte = null;
        pl.raya(pt, contornoK + 0.6);
      },
    });
  }
  // el cuello y la cabeza (siempre delante del cuerpo)
  {
    const j = jit(2);
    const c = mv(P2(s.cabeza), j);
    const R = MUNECO.cabeza.r * k * 0.95 * sz(s.cabeza);
    const base = mv(P2(s.cuello), j);
    piezas.push({
      z: Math.max(s.cuello[2], s.pecho[2]) + 0.5,
      pinta: () => {
        const p = poli(capsula(base, [c[0], c[1] + R * 0.5], 22, 24));
        pl.tinta(p, TINTA.carne, 'carne');
        pl.raya(p, 4);
      },
    });
    piezas.push({
      z: Math.max(s.cabeza[2], s.pecho[2]) + 1,
      pinta: () => cabeza(pl, c, R, s.frente, pose.cara, pose.ojos),
    });
  }
  piezas.sort((a, b) => a.z - b.z);
  for (const p of piezas) p.pinta();
};

// ---------------------------------------------------------------- la papelera: un cubo de duelas lacado en bermellón, con dos aros
const PB = PAPELERA;
const Y_ARO = PB.yBorde - 10; // la cara de arriba del canto
const R_FUERA = PB.rBorde + PB.tubo + 2; // 156
const R_DENTRO = PB.rBorde - PB.tubo + 2; // 128
const rCuerpo = (y: number) => mix(PB.rBorde + PB.pared, PB.rBase + PB.pared, clamp((y - PB.yBorde) / (SUELO - PB.yBorde)));
const enCubo = (r: number, y: number, phi: number, inc: number): P => {
  const x = PB.x + r * Math.cos(phi), z = PB.z + r * Math.sin(phi);
  const dx = x - PB.x, dy = y - SUELO, c = Math.cos(inc), s = Math.sin(inc);
  return proyecta([PB.x + dx * c - dy * s, SUELO + dx * s + dy * c, z]);
};
const arcoCubo = (r: number, y: number, a0: number, a1: number, inc: number, n = 28): P[] =>
  Array.from({length: n + 1}, (_, k) => enCubo(r, y, mix(a0, a1, k / n), inc));

export const papeleraDetras = (pl: Plancha, inc: number) => {
  // el canto de arriba entero y, dentro, la boca oscura que se hunde
  const aro = poli(arcoCubo(R_FUERA, Y_ARO, 0, Math.PI * 2, inc, 56));
  pl.tinta(aro, TINTA.ocreL, 'ocre');
  const bocaPts = arcoCubo(R_DENTRO, Y_ARO, 0, Math.PI * 2, inc, 56);
  const boca = poli(bocaPts);
  const ys = bocaPts.map((q) => q[1]);
  const g = pl.cC.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
  g.addColorStop(0, TINTA.beniO);
  g.addColorStop(0.55, '#4a150c');
  g.addColorStop(1, '#1e0b06');
  pl.tinta(boca, g, 'rojo');
  // las duelas de dentro, en la pared del fondo
  const dentro = new Path2D();
  for (let k = 1; k < 10; k++) {
    const phi = Math.PI + (k / 10) * Math.PI;
    const a = enCubo(R_DENTRO, Y_ARO, phi, inc), b = enCubo(R_DENTRO - 10, Y_ARO + 60, phi, inc);
    dentro.moveTo(a[0], a[1]);
    dentro.lineTo(b[0], b[1]);
  }
  pl.recorte = boca;
  pl.raya(dentro, 1.8, TINTA.sumi, 0.6);
  pl.recorte = null;
  pl.raya(aro, 4.4);
  pl.raya(boca, 3);
};

export const papeleraDelante = (pl: Plancha, inc: number) => {
  const yTop = Y_ARO + 18;
  const cuerpoPts = [...arcoCubo(rCuerpo(yTop), yTop, -0.04, Math.PI + 0.04, inc), ...arcoCubo(rCuerpo(SUELO), SUELO, Math.PI + 0.04, -0.04, inc)];
  const cuerpo = poli(cuerpoPts);
  pl.tinta(cuerpo, TINTA.bermellon, 'rojo');
  pl.recorte = cuerpo;
  // las duelas
  const duelas = new Path2D();
  for (let k = -7; k <= 7; k++) {
    const phi = Math.PI / 2 + k * 0.205;
    const a = enCubo(rCuerpo(yTop), yTop, phi, inc), b = enCubo(rCuerpo(SUELO), SUELO, phi, inc);
    duelas.moveTo(a[0], a[1]);
    duelas.lineTo(b[0], b[1]);
  }
  pl.raya(duelas, 2.2, TINTA.beniO, 0.9);
  // el brillo de la laca: una banda más clara a la izquierda (tinta plana, como en las estampas)
  const brillo = poli([...arcoCubo(rCuerpo(yTop) + 1, yTop, 2.2, 2.55, inc, 6), ...arcoCubo(rCuerpo(SUELO) + 1, SUELO, 2.55, 2.2, inc, 6)]);
  pl.tinta(brillo, TINTA.beniL, 'rojo', 0.75);
  // los dos aros, de laca negra con su filete
  for (const [y0, y1] of [[yTop + 64, yTop + 92], [SUELO - 112, SUELO - 84]]) {
    const aroP = poli([...arcoCubo(rCuerpo(y0) + 4, y0, -0.05, Math.PI + 0.05, inc), ...arcoCubo(rCuerpo(y1) + 4, y1, Math.PI + 0.05, -0.05, inc)]);
    pl.negro(aroP, TINTA.sumi, 1, true);
    const filete = poli(arcoCubo(rCuerpo((y0 + y1) / 2) + 5, (y0 + y1) / 2, 0.1, Math.PI - 0.1, inc), false);
    pl.trazoTinta(filete, 2.2, TINTA.ocre, 'ocre');
  }
  pl.recorte = null;
  pl.raya(suave(tiembla(cuerpoPts, 0.7, 8), false), 5.2);
  // el canto de delante (su lado y la mitad de delante de la cara de arriba), por encima de lo que caiga dentro
  const lado = poli([...arcoCubo(R_FUERA, Y_ARO, -0.02, Math.PI + 0.02, inc), ...arcoCubo(R_FUERA - 2, Y_ARO + 20, Math.PI + 0.02, -0.02, inc)]);
  pl.tinta(lado, TINTA.ocre, 'ocre');
  const cara = poli([...arcoCubo(R_FUERA, Y_ARO, 0, Math.PI, inc), ...arcoCubo(R_DENTRO, Y_ARO, Math.PI, 0, inc)]);
  pl.tinta(cara, TINTA.ocreL, 'ocre');
  pl.raya(poli(arcoCubo(R_FUERA, Y_ARO, 0, Math.PI, inc), false), 4.4);
  pl.raya(poli(arcoCubo(R_DENTRO, Y_ARO, 0, Math.PI, inc), false), 3);
  pl.raya(poli(arcoCubo(R_FUERA - 2, Y_ARO + 20, -0.02, Math.PI + 0.02, inc), false), 4.4);
  for (const phi of [-0.02, Math.PI + 0.02]) {
    const a = enCubo(R_FUERA, Y_ARO, phi, inc), b = enCubo(R_FUERA - 2, Y_ARO + 20, phi, inc);
    pl.raya(poli([a, b], false), 4.4);
  }
};

// ¿la bola va detrás de la papelera, dentro (entre la boca y la pared de delante) o delante?
export const capaBola = (b: Bola): 'detras' | 'dentro' | 'delante' => {
  const [x, y, z] = b.c;
  const rho = Math.hypot(x - PB.x, z - PB.z);
  if (b.dentro || (rho < PB.rBorde + R_BOLA + 24 && z < PB.z + 10 && y > PB.yBorde - 140)) return 'dentro';
  if (z < PB.z - 40 && Math.abs(x - PB.x) < PB.rBorde + 70) return 'detras';
  return 'delante';
};

// ---------------------------------------------------------------- la bola y su estela de viento
export const bolaEscena = (pl: Plancha, b: Bola) => {
  const c = proyecta(b.c);
  const R = R_BOLA * escalaEn(b.c[2]);
  const n = b.aplasta.n;
  const l = Math.hypot(n[0], n[1]) || 1;
  bolaPapel(pl, c, R, b.giro, 17, {k: b.aplasta.k, n: [n[0] / l, n[1] / l]});
};
export const estela = (pl: Plancha, pos: (t: number) => V3, t: number) => {
  const pts: P[] = [];
  for (let k = 12; k >= 0; k--) pts.push(proyecta(pos(Math.max(0, t - k * 0.012))));
  const largo = pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
  if (largo < 70) return;
  const R = R_BOLA * escalaEn(pos(t)[2]);
  const fin = pts[pts.length - 1];
  const usados = pts.filter((q) => Math.hypot(q[0] - fin[0], q[1] - fin[1]) > R * 1.1);
  if (usados.length < 4) return;
  // tres rayas de viento finas (como en los cuadernos de Hokusai): la del medio más larga, afiladas atrás
  for (const [o, ancho, quita] of [[-0.62, 5.2, 4], [0, 7, 0], [0.62, 5.2, 4]] as [number, number, number][]) {
    const tramo = usados.slice(Math.min(quita, usados.length - 2));
    const des = tramo.map((q, i) => {
      const a = tramo[Math.max(0, i - 1)], b = tramo[Math.min(tramo.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      return [q[0] - (dy / d) * R * o, q[1] + (dx / d) * R * o] as P;
    });
    pl.negro(talla(des, ancho, {afina: [0.55, 0.1], semilla: 3 + o * 10, per: 4}), TINTA.sumi, 0.9);
  }
};

// ---------------------------------------------------------------- el golpe: garras de espuma (Hokusai) y gotas en racimo
export const salpica = (pl: Plancha, g: Golpe, u: number, semilla: number, mayor = 1) => {
  if (u < 0 || u > 0.5) return;
  const p0 = proyecta(g.p);
  let n: P = [g.n[0], g.n[1]];
  const ln = Math.hypot(n[0], n[1]);
  n = ln < 0.2 ? [0, -1] : [n[0] / ln, n[1] / ln];
  const lado: P = [-n[1], n[0]];
  const S = clamp((g.tipo === 'lampara' ? Math.max(g.fuerza, 1500) : g.fuerza) / 2400, 0.25, 1.25);
  const L = (105 + 150 * S) * mayor;
  const crece = 0.55 + 0.45 * E.outCubic(clamp(u / 0.09)); // en el mismo paso del golpe ya revienta
  const apaga = 1 - clamp((u - 0.28) / 0.2);
  if (apaga <= 0) return;
  const riza = 0.4 + 0.6 * clamp(u / 0.26); // cuánto se gancha la punta (va a más)
  const r = rng(semilla);
  const angN = Math.atan2(n[1], n[0]);
  const Rb = R_BOLA * escalaEn(g.p[2]);
  const garras = S > 0.55 ? [-60, -38, -15, 15, 38, 60] : [-50, -18, 18, 50];
  // la curva de una garra: sale recta y se gancha hacia fuera al final (como el labio de una ola)
  const curva = (x0: number, y0: number, h0: number, largo: number, sg: number, giro: number, pasos = 14): P[] => {
    const pts: P[] = [];
    let h = h0, x = x0, y = y0;
    const tot = Array.from({length: pasos}, (_, k) => ((k + 1) / pasos) ** 2.2).reduce((a, b) => a + b, 0);
    for (let k = 0; k <= pasos; k++) {
      pts.push([x, y]);
      h += (sg * giro * ((k + 1) / pasos) ** 2.2) / tot;
      x += (Math.cos(h) * largo) / pasos;
      y += (Math.sin(h) * largo) / pasos;
    }
    return pts;
  };
  for (const [gi, gdeg] of garras.entries()) {
    const sg = gdeg >= 0 ? 1 : -1;
    const ang = (gdeg + (r() - 0.5) * 10) * (Math.PI / 180);
    const lf = (1 - Math.abs(gdeg) / 150) * (0.85 + r() * 0.3);
    const largo = L * lf * crece * (0.45 + 0.55 * apaga);
    if (largo < 10) continue;
    const x0 = p0[0] + n[0] * Rb * 0.2 + lado[0] * sg * Rb * 0.5, y0 = p0[1] + n[1] * Rb * 0.2 + lado[1] * sg * Rb * 0.5;
    const pts = curva(x0, y0, angN + ang, largo, sg, 2.7 * riza);
    const ancho = (13 + 13 * S) * Math.min(1.3, mayor) * (0.55 + 0.45 * apaga);
    // detrás, la capa azul pálida un poco corrida; delante, el azul de Prusia con su línea de espuma en papel
    const atras = talla(pts.map(([a, b]) => [a + sg * 7 - n[0] * 3, b + 4 - n[1] * 3] as P), ancho * 1.15, {afina: [0.05, 0.8], semilla: semilla + gi, per: 3});
    pl.tinta(atras, TINTA.prusiaP, 'azul');
    pl.raya(atras, 1.2, TINTA.prusiaO, 0.7);
    const garra = talla(pts, ancho, {afina: [0.08, 0.9], semilla: semilla + gi + 20, per: 3});
    pl.tinta(garra, TINTA.prusia, 'azul');
    pl.raya(garra, 1.7);
    pl.papelTrazo(suave(pts.slice(2, 10)), Math.max(1.4, ancho * 0.16));
    // los dedos de la punta: tres ganchitos que se rizan hacia el mismo lado (la garra de espuma)
    for (const [donde, df, dl, dg] of [[9, 0.45, 0.24, 2.4], [11, 0.85, 0.18, 2.6], [12, 1.25, 0.13, 2.6]] as [number, number, number, number][]) {
      const base = pts[donde];
      const hb = Math.atan2(pts[donde + 1][1] - base[1], pts[donde + 1][0] - base[0]);
      const q = curva(base[0], base[1], hb + sg * df, largo * dl, sg, dg * riza, 6);
      const dedo = talla(q, ancho * 0.5, {afina: [0.1, 0.9], semilla: semilla + gi * 3 + donde, per: 3});
      pl.tinta(dedo, TINTA.prusia, 'azul');
      pl.raya(dedo, 1.3);
    }
  }
  // en el suelo, dos anillos de ola que se abren (la mitad de delante, como líneas de agua)
  if (g.tipo === 'suelo') {
    for (const [k, retraso] of [[0, 0], [1, 0.07]] as [number, number][]) {
      const v = u - retraso;
      if (v < 0) continue;
      const rr = (55 + 150 * E.outCubic(clamp(v / 0.3))) * (0.7 + 0.4 * S) * (k ? 0.72 : 1);
      const fuerza = 1 - clamp(v / 0.34);
      if (fuerza <= 0) continue;
      const anillo = poli(circulo(g.p[0], SUELO - 1, g.p[2], rr, 30, -0.15, Math.PI + 0.15), false);
      pl.trazoTinta(anillo, 10 * fuerza + 2, TINTA.prusia, 'azul');
      pl.raya(anillo, 1.4, TINTA.sumi, fuerza);
      pl.papelTrazo(anillo, 2.4 * fuerza + 0.5);
    }
  }
  // las gotas: una grande, unas medianas y muchas pequeñas, en racimo, que vuelan y caen
  const nG = Math.round((7 + 9 * S) * Math.min(1.4, mayor));
  for (let k = 0; k < nG; k++) {
    const a = angN + (r() < 0.5 ? -1 : 1) * (0.25 + r() * 1.05);
    const v = (420 + 780 * r()) * (0.6 + 0.5 * S) * Math.min(1.3, mayor);
    const vx = Math.cos(a) * v, vy = Math.sin(a) * v;
    const tt = 0.04 + u * 0.9;
    const px = p0[0] + vx * tt, py = p0[1] + vy * tt + 0.5 * 2600 * tt * tt;
    const rad = (k === 0 ? 10 + 6 * S : k < 4 ? 6.5 : 3.8) * (1 - clamp((u - 0.24) / 0.2));
    if (rad < 1) continue;
    const vyy = vy + 2600 * tt;
    const dv = Math.hypot(vx, vyy) || 1;
    const ux = vx / dv, uy = vyy / dv;
    // la gota: un círculo con su cola hacia atrás
    const gota = new Path2D();
    const ang0 = Math.atan2(uy, ux);
    gota.moveTo(px - ux * rad * 2.6, py - uy * rad * 2.6);
    gota.arc(px, py, rad, ang0 - Math.PI / 2 - 0.25, ang0 + Math.PI / 2 + 0.25);
    gota.closePath();
    pl.tinta(gota, TINTA.prusia, 'azul');
    pl.raya(gota, 1.3);
    if (rad > 5) pl.papel(elipse(px - rad * 0.3, py - rad * 0.35, rad * 0.28, rad * 0.22));
  }
};

export const golpesVisibles = (golpes: Golpe[], t: number) => golpes.filter((g) => (g.fuerza > 330 || g.tipo === 'lampara') && t - g.t >= 0 && t - g.t < 0.5);
export const DUR_SALPICA = 0.5;
void SUELO;
