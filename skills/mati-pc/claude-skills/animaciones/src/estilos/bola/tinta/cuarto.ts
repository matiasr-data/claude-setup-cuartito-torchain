import {rng} from '../../../comun/curvas';
import {SUELO, Z_PARED, proyecta} from '../escena';
import {LETRA_PINCEL, INSCRIPCION} from './caligrafia';
import {BERMELLON, curvaQ, gota, masa, pinta, reserva, sello, trazo, type Capas, type OpTrazo, type Q} from './pincel';
import type {P2} from './geometria';

// TINTA CHINA, EL CUARTO: lo que no se mueve, pintado una vez. Sugerido con pocas pinceladas y mucho papel
// en blanco (留白): la ventana con su marco de cuatro trazos y, fuera, unas montañas que se pierden en la niebla; una orquídea en el
// alféizar; en la pared, un rollo colgado con un ensō (la diana: lo que él quiere y no le sale) y, a su lado, la inscripción en
// columna, 十投一中 («de diez tiros, uno entra»), con el sello rojo debajo; la mesa con su monitor y dos bolas de otros días; el
// suelo, una aguada gris que se va aclarando y unas pocas rayas secas.
// Todo en el mismo sitio que en los bloques (las medidas de escena.ts): la pared del fondo se proyecta con su z.

const T = (L: Capas, pts: Q[], o: OpTrazo, am = 1) => pinta(L, trazo(pts, o), 1, am);
const pw = (x: number, y: number): P2 => proyecta([x, y, Z_PARED]); // un punto de la pared del fondo
const recorta = (L: Capas, x0: number, y0: number, x1: number, y1: number, f: () => void) => {
  for (const c of [L.mojada, L.seca]) {
    c.save();
    c.beginPath();
    c.rect(x0, y0, x1 - x0, y1 - y0);
    c.clip();
  }
  f();
  for (const c of [L.mojada, L.seca]) c.restore();
};

// la ventana: el hueco en la pared (los ladrillos de la fila 11 a la 16 y de x 0 a 384, como en los bloques)
const ALTO_LAD = 1.2 * 64;
const V = {x0: 0, x1: 6 * 64, y0: SUELO - 17 * ALTO_LAD, y1: SUELO - 11 * ALTO_LAD};

const paisaje = (L: Capas) => {
  const a = pw(V.x0, V.y0), b = pw(V.x1, V.y1);
  // el sol rojo (el segundo bermellón): entra antes que las montañas, que lo tapan por abajo (la tinta va encima del rojo)
  const sol: [number, number] = [312, 372], rSol = 50;
  const disco: [number, number][] = [];
  for (let i = 0; i < 40; i++) {
    const t = (i / 40) * Math.PI * 2;
    disco.push([sol[0] + rSol * Math.cos(t), sol[1] + rSol * Math.sin(t)]);
  }
  masa(L.color, disco, 0.95, 1.4, 70, null, BERMELLON.join(','));
  recorta(L, a[0] + 6, a[1] + 6, b[0] - 6, b[1] - 6, () => {
    const R = rng(71);
    // el cielo, una aguada que se aclara hacia abajo
    masa(L.mojada, [[a[0], a[1]], [b[0], a[1]], [b[0], a[1] + 150], [a[0], a[1] + 150]], 0.12, 2, 71, [0, a[1], 0, a[1] + 150, 1, 0]);
    // la cordillera de lejos: picos en punta que tapan el sol por abajo y se deshacen hacia abajo en la niebla
    const lejos: [number, number][] = [];
    for (let x = a[0] - 10; x <= b[0] + 10; x += 5) {
      const y = 540 - 70 * Math.exp(-(((x - 130) / 40) ** 2)) - 145 * Math.exp(-(((x - 288) / 34) ** 2)) - 120 * Math.exp(-(((x - 368) / 30) ** 2)) + 5 * (R() - 0.5);
      lejos.push([x, y]);
    }
    masa(L.mojada, [...lejos, [b[0] + 10, 620], [a[0] - 10, 620]], 0.46, 2, 72, [0, 395, 0, 600, 1, 0]);
    T(L, lejos.filter((_, i) => i % 2 === 0), {w: 4.5, tono: 0.55, seca: 0.5, perfil: 'punta', semilla: 73, pulso: 0.4});
    // la de cerca: oscura, con sus rayas de 披麻 y los puntos de musgo en la cresta
    const cerca: [number, number][] = [];
    for (let x = a[0] - 10; x <= b[0] + 10; x += 5) {
      const y = 650 - 110 * Math.exp(-(((x - 330) / 52) ** 2)) - 55 * Math.exp(-(((x - 200) / 44) ** 2)) + 5 * (R() - 0.5);
      cerca.push([x, y]);
    }
    masa(L.mojada, [...cerca, [b[0] + 10, 700], [a[0] - 10, 700]], 0.82, 2, 74, [0, 530, 0, 690, 1, 0.08]);
    T(L, cerca.filter((_, i) => i % 2 === 0 && cerca[i][0] > 140), {w: 7, tono: 0.92, seca: 0.4, perfil: 'pincel', semilla: 75, pulso: 0.5});
    for (let k = 0; k < 7; k++) {
      const x = 262 + k * 17, y = 650 - 110 * Math.exp(-(((x - 330) / 52) ** 2)) + 14;
      T(L, [[x, y], [x + 9, y + 26], [x + 6, y + 44]], {w: 4, tono: 0.8, seca: 0.55, perfil: 'punta', semilla: 76 + k});
    }
    for (let k = 0; k < 8; k++) {
      const x = 280 + k * 12 + 6 * R(), y = 650 - 110 * Math.exp(-(((x - 330) / 52) ** 2)) - 2;
      gota(L.seca, x, y, 3.2 + 2 * R(), 0.95, R() * 3, 0.7, 80 + k);
    }
    // dos pájaros, delante del cielo
    for (const [x, y, s] of [[150, 330, 1.2], [182, 352, 0.9]]) {
      T(L, [[x - 9 * s, y - 3 * s], [x - 3 * s, y - 2 * s], [x, y + 2 * s]], {w: 3.2, tono: 0.95, seca: 0.2, perfil: 'punta', semilla: 90 + x});
      T(L, [[x, y + 2 * s], [x + 4 * s, y - 3 * s], [x + 11 * s, y - 5 * s]], {w: 3.2, tono: 0.95, seca: 0.2, perfil: 'punta', semilla: 91 + x});
    }
  });
};

const ventana = (L: Capas) => {
  paisaje(L);
  const yM = V.y0 + (V.y1 - V.y0) * 0.45;
  // el marco: cuatro trazos que se pasan un pelo de las esquinas, y la cruz más fina
  T(L, [pw(V.x0 - 8, V.y0 + 2), pw((V.x0 + V.x1) / 2, V.y0 - 1), pw(V.x1 + 10, V.y0 + 3)], {w: 22, tono: 0.97, seca: 0.36, perfil: 'pincel', semilla: 101, pulso: 0.45});
  T(L, [pw(V.x0 + 1, V.y0 - 8), pw(V.x0 - 1, V.y1 + 6)], {w: 21, tono: 0.97, seca: 0.34, perfil: 'pincel', semilla: 102, pulso: 0.45});
  T(L, [pw(V.x1, V.y0 - 6), pw(V.x1 - 2, V.y1 + 8)], {w: 21, tono: 0.97, seca: 0.4, perfil: 'pincel', semilla: 103, pulso: 0.45});
  T(L, [pw((V.x0 + V.x1) / 2, V.y0 + 4), pw((V.x0 + V.x1) / 2 + 2, V.y1 - 2)], {w: 11, tono: 0.9, seca: 0.45, perfil: 'pincel', semilla: 104, pulso: 0.4});
  T(L, [pw(V.x0 + 4, yM), pw(V.x1 - 4, yM - 2)], {w: 11, tono: 0.9, seca: 0.45, perfil: 'pincel', semilla: 105, pulso: 0.4});
  // el alféizar, con su sombra
  masa(L.mojada, [pw(V.x0 - 24, V.y1 + 20), pw(V.x1 + 34, V.y1 + 20), pw(V.x1 + 30, V.y1 + 52), pw(V.x0 - 20, V.y1 + 58)], 0.14, 4, 106, [0, 690, 0, 740, 1, 0]);
  T(L, [pw(V.x0 - 36, V.y1 + 15), pw(V.x1 + 40, V.y1 + 13)], {w: 30, tono: 0.98, seca: 0.28, perfil: 'pincel', semilla: 107, oscuro: [0, 1], lado: 0.6, pulso: 0.4});
  // la orquídea en su maceta (sobre el alféizar, donde los bloques tienen su planta)
  const m0 = pw(300, V.y1 - 3);
  const maceta: P2[] = [[m0[0] - 27, m0[1] - 46], [m0[0] + 27, m0[1] - 46], [m0[0] + 21, m0[1] - 2], [m0[0] - 21, m0[1] - 2]];
  reserva(L, maceta, 1, 1, 108);
  masa(L.mojada, maceta, 0.3, 1.5, 109, [m0[0] - 27, 0, m0[0] + 27, 0, 0.4, 1]);
  T(L, [maceta[0], maceta[3]], {w: 7, tono: 0.9, seca: 0.35, perfil: 'pincel', semilla: 110});
  T(L, [maceta[1], maceta[2]], {w: 8, tono: 0.92, seca: 0.35, perfil: 'pincel', semilla: 111});
  T(L, [[maceta[0][0] - 4, maceta[0][1]], [maceta[1][0] + 4, maceta[1][1]]], {w: 9, tono: 0.92, seca: 0.3, perfil: 'parejo', semilla: 112});
  const raiz: P2 = [m0[0], m0[1] - 48];
  const hojas: [P2, P2, number][] = [
    [[m0[0] - 60, m0[1] - 150], [m0[0] - 120, m0[1] - 120], 10],
    [[m0[0] - 10, m0[1] - 190], [m0[0] + 22, m0[1] - 210], 9],
    [[m0[0] + 50, m0[1] - 140], [m0[0] + 96, m0[1] - 92], 10],
    [[m0[0] + 30, m0[1] - 80], [m0[0] + 86, m0[1] - 60], 8],
    [[m0[0] - 34, m0[1] - 96], [m0[0] - 80, m0[1] - 62], 8],
  ];
  hojas.forEach(([ctl, fin, w], k) => T(L, curvaQ(raiz, ctl, fin, 10), {w: w * 1.3, tono: 0.97, seca: 0.28, perfil: 'lente', semilla: 113 + k}));
  // la flor: dos pétalos claros y el punto oscuro
  const fl: P2 = [m0[0] - 66, m0[1] - 168];
  T(L, curvaQ(raiz, [m0[0] - 34, m0[1] - 150], fl, 8), {w: 2.4, tono: 0.7, seca: 0.4, perfil: 'punta', semilla: 120});
  for (const [dx, dy] of [[-14, -8], [10, -12], [-4, 12]]) T(L, [fl, [fl[0] + dx, fl[1] + dy]], {w: 9, tono: 0.35, seca: 0.1, mojada: 1, perfil: 'lente', semilla: 121 + dx});
  gota(L.seca, fl[0], fl[1], 3.2, 0.95, 0, 1, 125);
};

// el rollo colgado (donde los bloques tienen su póster de la diana): seda clara, sus dos varillas y un ensō
const rollo = (L: Capas) => {
  const c = pw(808, 412);
  const x0 = c[0] - 88, x1 = c[0] + 88, y0 = c[1] - 196, y1 = c[1] + 196;
  T(L, [[c[0], y0 - 58], [x0 + 10, y0 - 2]], {w: 2.4, tono: 0.62, seca: 0.4, perfil: 'parejo', semilla: 130});
  T(L, [[c[0], y0 - 58], [x1 - 10, y0 - 2]], {w: 2.4, tono: 0.62, seca: 0.4, perfil: 'parejo', semilla: 131});
  gota(L.seca, c[0], y0 - 58, 4, 0.9, 0, 1, 132);
  masa(L.mojada, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 0.2, 1.5, 133);
  masa(L.mojada, [[x0 + 14, y0 + 30], [x1 - 14, y0 + 30], [x1 - 14, y1 - 44], [x0 + 14, y1 - 44]], 0.06, 1.5, 134);
  T(L, [[x0 + 14, y0 + 30], [x1 - 14, y0 + 30], [x1 - 14, y1 - 44], [x0 + 14, y1 - 44], [x0 + 14, y0 + 30]], {w: 2.2, tono: 0.4, seca: 0.6, perfil: 'parejo', semilla: 135});
  T(L, [[x0 - 10, y0], [x1 + 10, y0]], {w: 13, tono: 0.92, seca: 0.25, perfil: 'parejo', semilla: 136});
  T(L, [[x0 - 14, y1], [x1 + 14, y1]], {w: 16, tono: 0.92, seca: 0.25, perfil: 'parejo', semilla: 137});
  gota(L.seca, x0 - 16, y1, 9, 0.95, 0, 0.9, 138);
  gota(L.seca, x1 + 16, y1, 9, 0.95, 0, 0.9, 139);
  // el ensō: casi cerrado, más seco al final
  const ce: P2 = [c[0], c[1] - 40], r = 56;
  const pts: Q[] = [];
  for (let i = 0; i <= 26; i++) {
    const a = -1.25 + (i / 26) * Math.PI * 1.88;
    pts.push([ce[0] + r * Math.cos(a) * (1 + 0.03 * Math.sin(a * 3)), ce[1] + r * Math.sin(a)]);
  }
  T(L, pts, {w: 22, tono: 0.98, seca: 0.34, perfil: 'pincel', semilla: 140, cerdas: 20, pulso: 0.4});
  // dos rayas de firma y un sellito
  T(L, [[x1 - 34, c[1] + 54], [x1 - 33, c[1] + 104]], {w: 3.2, tono: 0.75, seca: 0.4, perfil: 'punta', semilla: 141});
  T(L, [[x1 - 34, c[1] + 112], [x1 - 34, c[1] + 128]], {w: 3.2, tono: 0.75, seca: 0.4, perfil: 'punta', semilla: 142});
  sello(L.color, x1 - 42, c[1] + 136, 16, 9);
};

// la mesa (a su izquierda, un poco detrás), su monitor y dos bolas de otros días
const mesa = (L: Capas) => {
  const yTop = SUELO - 4.5 * ALTO_LAD;
  const p = (x: number, y: number, z: number) => proyecta([x, y, z]);
  // la sombra de debajo
  const sombra: P2[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    sombra.push(p(100 + 210 * Math.cos(a), SUELO, -140 + 130 * Math.sin(a)));
  }
  masa(L.mojada, sombra, 0.12, 7, 150);
  // las patas
  T(L, [p(-30, yTop + 30, -220), p(-30, SUELO, -220)], {w: 10, tono: 0.55, seca: 0.45, perfil: 'parejo', semilla: 151});
  T(L, [p(220, yTop + 30, -220), p(220, SUELO, -220)], {w: 11, tono: 0.6, seca: 0.45, perfil: 'parejo', semilla: 152});
  T(L, [p(220, yTop + 30, -60), p(220, SUELO, -60)], {w: 14, tono: 0.8, seca: 0.4, perfil: 'parejo', semilla: 153});
  // el tablero: una aguada y el canto de delante, cargado
  const tablero: P2[] = [p(-60, yTop, -250), p(250, yTop, -250), p(250, yTop, -30), p(-60, yTop, -30)];
  masa(L.mojada, tablero, 0.4, 2, 154);
  T(L, [p(-60, yTop, -250), p(250, yTop, -250)], {w: 5, tono: 0.6, seca: 0.5, perfil: 'parejo', semilla: 155});
  T(L, [p(250, yTop, -250), p(250, yTop + 30, -30)], {w: 6, tono: 0.7, seca: 0.4, perfil: 'parejo', semilla: 156});
  T(L, [p(-70, yTop + 16, -30), p(100, yTop + 17, -30), p(254, yTop + 15, -30)], {w: 40, tono: 0.98, seca: 0.28, perfil: 'pincel', semilla: 157, oscuro: [0, 1], lado: 0.7, cerdas: 34, pulso: 0.35});
  // el monitor (girado hacia él): el marco cargado, la pantalla clara con unas velitas, el pie
  const ang = 0.45, cx = 40, cz = -170;
  const enM = (lx: number, ly: number): P2 => p(cx + lx * Math.cos(ang), ly, cz - lx * Math.sin(ang));
  const yC = yTop - (0.4 * 64 + ALTO_LAD * 1.05 + 1.5 * ALTO_LAD), h = 1.5 * ALTO_LAD;
  T(L, [enM(0, yTop - 4), enM(2, yTop - 0.4 * 64 - ALTO_LAD * 1.05)], {w: 16, tono: 0.85, seca: 0.35, perfil: 'parejo', semilla: 158});
  T(L, [enM(-46, yTop - 3), enM(46, yTop - 5)], {w: 12, tono: 0.85, seca: 0.35, perfil: 'pincel', semilla: 159});
  const pant: P2[] = [enM(-128, yC - h), enM(128, yC - h), enM(128, yC + h), enM(-128, yC + h)];
  reserva(L, pant, 1, 1, 160);
  masa(L.mojada, pant, 0.26, 2, 161);
  T(L, [enM(-140, yC - h), enM(128, yC - h - 2)], {w: 19, tono: 0.97, seca: 0.3, perfil: 'pincel', semilla: 162, pulso: 0.4});
  T(L, [enM(128, yC - h - 6), enM(128, yC + h + 4)], {w: 19, tono: 0.97, seca: 0.3, perfil: 'pincel', semilla: 163, pulso: 0.4});
  T(L, [enM(-140, yC + h), enM(130, yC + h)], {w: 19, tono: 0.97, seca: 0.3, perfil: 'pincel', semilla: 164, pulso: 0.4});
  // las velitas en la pantalla (lo que mira todo el día)
  const R = rng(165);
  let y = yC + 30;
  for (let k = 0; k < 6; k++) {
    const lx = -60 + k * 30, sube = R() > 0.3;
    const largo = 16 + 22 * R();
    const y0 = y, y1 = sube ? y - largo : y + largo * 0.6;
    const a = enM(lx, Math.min(y0, y1) - 8), b = enM(lx, Math.max(y0, y1) + 8);
    T(L, [a, b], {w: 2, tono: 0.6, seca: 0.3, perfil: 'parejo', semilla: 166 + k});
    T(L, [enM(lx, y0), enM(lx, y1)], {w: 8, tono: sube ? 0.35 : 0.8, seca: 0.15, perfil: 'parejo', semilla: 172 + k});
    y = y1;
  }
  // dos bolas de papel de otros días, encima de la mesa
  for (const [x, yb, z, r, s] of [[-10, yTop - 30, -90, 27, 0], [60, yTop - 28, -60, 28, 1]]) {
    const c = p(x, yb, z);
    const aro: P2[] = [];
    for (let i = 0; i < 20; i++) aro.push([c[0] + r * Math.cos((i / 20) * 6.283), c[1] + r * Math.sin((i / 20) * 6.283)]);
    reserva(L, aro);
    masa(L.mojada, aro, 0.12, 1, 180 + s, [c[0] - r, c[1] - r, c[0] + r, c[1] + r, 0, 1.4]);
    const pts: Q[] = [];
    for (let i = 0; i <= 18; i++) {
      const a = 0.5 + s * 2 + (i / 18) * Math.PI * 1.85;
      pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
    }
    T(L, pts, {w: 6.5, tono: 0.9, seca: 0.32, perfil: 'pincel', semilla: 182 + s, cerdas: 8});
    T(L, [[c[0] - r * 0.4, c[1] - r * 0.2], [c[0] + r * 0.1, c[1] + r * 0.1], [c[0] - r * 0.1, c[1] + r * 0.5]], {w: 2.5, tono: 0.7, seca: 0.4, perfil: 'punta', semilla: 184 + s});
  }
};

// la pared de abajo, el suelo y la esquina: dos aguadas grandes que se corren por los bordes (la de la pared nace en la niebla y
// se carga hacia el suelo; la del suelo es más oscura en la esquina y acaba abajo en un borde irregular, con su marea)
const suelo = (L: Capas) => {
  const yP = proyecta([0, SUELO, Z_PARED])[1];
  const R = rng(189);
  const niebla: [number, number][] = [];
  for (let x = -40; x <= 1120; x += 40) niebla.push([x, 800 + 40 * Math.sin(x * 0.009 + 0.4) + 18 * Math.sin(x * 0.027) + 10 * (R() - 0.5)]);
  masa(L.mojada, [...niebla, [1120, yP + 4], [-40, yP + 4]], 0.4, 7, 188, [0, 790, 0, yP, 0, 1]);
  const fondo: [number, number][] = [];
  for (let x = 1120; x >= -40; x -= 40) fondo.push([x, 1858 + 26 * Math.sin(x * 0.012 + 1.3) + 14 * Math.sin(x * 0.033) + 8 * (R() - 0.5)]);
  masa(L.mojada, [[-40, yP], [1120, yP], ...fondo], 0.34, 7, 190, [0, yP, 0, 1880, 1.25, 0.6]);
  masa(L.mojada, [[-40, yP], [1120, yP], [1120, yP + 60], [-40, yP + 50]], 0.22, 8, 198, [0, yP, 0, yP + 60, 1, 0]);
  T(L, [[-30, yP + 1], [300, yP - 1], [640, yP + 2], [1004, yP]], {w: 13, tono: 0.92, seca: 0.38, perfil: 'pincel', semilla: 191, pulso: 0.4});
  // la esquina con la pared de la derecha (la del fallo 3)
  const esq = proyecta([1060, SUELO, Z_PARED]);
  T(L, [[esq[0], 1000], [esq[0] + 1, yP]], {w: 8, tono: 0.75, seca: 0.55, perfil: 'sube', semilla: 192});
  T(L, [esq, proyecta([1060, SUELO, 260])], {w: 8, tono: 0.75, seca: 0.5, perfil: 'pincel', semilla: 193});
  // unas rayas secas, de lejos a cerca
  T(L, [[30, 1488], [180, 1486], [330, 1490]], {w: 6, tono: 0.62, seca: 0.66, perfil: 'punta', semilla: 194});
  T(L, [[560, 1474], [760, 1476], [960, 1472]], {w: 6, tono: 0.6, seca: 0.66, perfil: 'punta', semilla: 195});
  T(L, [[600, 1760], [820, 1756], [990, 1762]], {w: 7, tono: 0.55, seca: 0.7, perfil: 'punta', semilla: 197});
};

// el bambú de delante, en la esquina de abajo a la izquierda: la caña en tres trazos con sus nudos y las hojas de pincel (cada
// hoja, un trazo que apoya y sale en punta). Enmarca el cuadro sin tocar la acción (todo por debajo de y 1690).
const bambu = (L: Capas) => {
  const cana: [number, number][] = [[18, 1960], [46, 1872], [72, 1786], [94, 1712]];
  for (let k = 0; k < 3; k++) {
    const a = cana[k], b = cana[k + 1];
    T(L, [[a[0], a[1] - 5], [b[0], b[1] + 6]], {w: 26 - k * 3, tono: 0.9, seca: 0.32, mojada: 0.3, perfil: 'parejo', semilla: 200 + k, cerdas: 18, pulso: 0.2});
    T(L, [[b[0] - 15, b[1] + 3], [b[0] + 15, b[1] - 1]], {w: 8, tono: 0.98, seca: 0.2, perfil: 'clavo', semilla: 204 + k});
  }
  // las ramitas
  const rama1: [number, number][] = [[94, 1712], [160, 1700], [228, 1712]];
  const rama2: [number, number][] = [[72, 1786], [150, 1800], [214, 1832]];
  T(L, rama1, {w: 4.5, tono: 0.9, seca: 0.3, perfil: 'pincel', semilla: 208});
  T(L, rama2, {w: 4.5, tono: 0.9, seca: 0.3, perfil: 'pincel', semilla: 209});
  // las hojas: [desde, hasta, ancho, tono]
  const hojas: [[number, number], [number, number], number, number][] = [
    [[228, 1712], [356, 1730], 26, 0.97], [[226, 1714], [330, 1772], 24, 0.97], [[222, 1710], [318, 1696], 20, 0.8],
    [[214, 1832], [340, 1862], 28, 0.97], [[212, 1834], [300, 1900], 24, 0.92], [[210, 1830], [326, 1814], 22, 0.75],
    [[96, 1716], [30, 1700], 20, 0.85], [[94, 1720], [6, 1752], 22, 0.97],
    [[150, 1800], [214, 1890], 20, 0.7],
  ];
  hojas.forEach(([a, b, w, tono], k) => {
    const m: [number, number] = [(a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.12, (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.12];
    T(L, [a, m, b], {w, tono, seca: 0.22, mojada: 0.2, perfil: 'clavo', semilla: 210 + k, cerdas: 14, pulso: 0.15});
  });
};

// la inscripción en columna y el sello (arriba a la derecha, al lado del rollo)
const inscripcion = (L: Capas) => {
  const x = 952, y0 = 252, tam = 58;
  INSCRIPCION.forEach((ch, k) => {
    const y = y0 + k * tam * 1.06;
    for (const [c, a, dx] of [[L.seca, 0.94, 0], [L.mojada, 0.3, 1.2]] as [CanvasRenderingContext2D, number, number][]) {
      c.save();
      c.globalAlpha = a;
      c.fillStyle = '#000';
      c.font = `${tam}px ${LETRA_PINCEL}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(ch, x + dx, y + dx);
      c.restore();
    }
  });
  sello(L.color, x - 30, y0 + 4 * tam * 1.06 + 4, 60, 3);
};

export const pintaCuarto = (L: Capas) => {
  suelo(L);
  bambu(L);
  ventana(L);
  rollo(L);
  mesa(L);
  inscripcion(L);
};
