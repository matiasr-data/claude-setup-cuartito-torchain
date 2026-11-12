import {E, clamp, mix, rng} from '../../../comun/curvas';
import {CAMARA, LAMPARA, MUNECO, PAPELERA, R_BOLA, SILLA, SUELO, bola as bolaEn, escalaEn, proyecta, type Bola, type Cara, type Golpe, type Pose, type V3} from '../escena';
import {BERMELLON, contorno, curvaQ, gota, masa, pinta, reserva, trazo, type Capas, type OpTrazo, type Q} from './pincel';
import {aplica, cajaPts, cilindroPts, cuerpo, enCabeza, enCuerpo, enRaiz, envolvente, huesos, pm, por, resta, suma, type Cuerpo, type P2} from './geometria';

// TINTA CHINA, LO QUE SE MUEVE: el muñeco en su silla, la papelera, la lámpara, la bola de papel, su rastro
// de pincel seco y la tinta que salta en cada golpe. Todo se pinta a pincel con ./pincel.ts y se ordena de atrás adelante: antes de
// pintar algo, se le «reserva» el papel (se borra la tinta de lo que queda detrás), como hace el pintor con lo que va delante.
// El muñeco es xieyi (写意): cada pieza, una aguada clara y un trazo cargado cuyo borde oscuro ES el contorno (没骨, sin línea);
// la cara, pocos trazos de tinta quemada; la corbata, el único rojo de su ropa.

const T = (L: Capas, pts: Q[], o: OpTrazo, p = 1, am = 1) => {
  const s = trazo(pts, o);
  pinta(L, s, p, am);
  return s;
};
// el trazo cargado (el borde oscuro hacia `oscuro`): sus cerdas van a la capa mojada, así el contorno se corre un pelo
const cargado = (w: number, tono: number, oscuro: [number, number], semilla: number, o: Partial<OpTrazo> = {}): OpTrazo => ({
  w, tono, oscuro, lado: 0.85, cerdasMojadas: true, cuerpo: 0.22, seca: 0.38, mojada: 0.9, perfil: 'tunica', semilla, ...o,
});
const norm2 = (v: P2): P2 => {
  const l = Math.hypot(v[0], v[1]);
  return l > 1e-6 ? [v[0] / l, v[1] / l] : [0, -1];
};
const elipse2 = (c: P2, rx: number, ry: number, n = 24, ang = 0): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = rx * Math.cos(a), y = ry * Math.sin(a);
    out.push([c[0] + x * Math.cos(ang) - y * Math.sin(ang), c[1] + x * Math.sin(ang) + y * Math.cos(ang)]);
  }
  return out;
};
const lejos = (a: P2, b: P2, k: number): P2 => [a[0] + (a[0] - b[0]) * k, a[1] + (a[1] - b[1]) * k];
const CAM_MUNDO: V3 = [CAMARA[0], -CAMARA[1], CAMARA[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a: V3): V3 => por(a, 1 / Math.max(1e-9, Math.hypot(a[0], a[1], a[2])));
// cuánto mira una cara hacia la cámara (0 = de canto o de espaldas, 1 = de frente)
const deFrente = (punto: V3, normal: V3) => clamp(dot(unit(normal), unit(resta(CAM_MUNDO, punto))) * 3.5);

// ---------------------------------------------------------------- la cara (pocos trazos de tinta quemada, que giran con la cabeza)
// Las medidas son las de la cara impresa de los bloques (un lienzo de 512 × 256 que envuelve el cilindro de la cabeza), así las
// caras de los dos estilos son las mismas: cambian enteras, como las de recambio.
const CX = 256, OJO_Y = 104, SEP = 70, BOCA_Y = 196;
const enCara = (c: Cuerpo, px: number, py: number): V3 => {
  const th = -1.3 + (2.6 * px) / 512;
  const y = MUNECO.cabeza.alto / 2 + 2 + 42 - (py / 256) * 84;
  const r = MUNECO.cabeza.r + 0.5;
  return enCabeza(c, [r * Math.sin(th), y, r * Math.cos(th)]);
};
const caraTinta = (L: Capas, c: Cuerpo, cara: Cara, ojos: [number, number], hv: number) => {
  const m = (px: number, py: number): P2 => pm(enCara(c, px, py));
  const vis = deFrente(enCara(c, CX, 128), aplica(c.MH, [0, 0, 1]));
  if (vis < 0.05) return;
  const am = vis;
  const px = ojos[0] * 16, py = ojos[1] * 10;
  let sem = 900;
  const linea = (pts: [number, number][], w: number, tono = 0.95) =>
    T(L, pts.map(([a, b]) => m(a, b)), {w, tono, seca: 0.22, perfil: 'punta', semilla: sem++, hierve: hv, cerdas: 6, aspero: 0.18}, 1, am);
  const arco = (cx: number, cy: number, r: number, a0: number, a1: number, w: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const a = mix(a0, a1, i / 10);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    linea(pts, w);
  };
  const poli = (pts: [number, number][]) => pts.map(([a, b]) => m(a, b));
  const ovalo = (cx: number, cy: number, rx: number, ry: number) => {
    const out: [number, number][] = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return out;
  };
  const punto = (cx: number, cy: number, rx: number, ry: number, brillo = true) => {
    masa(L.seca, poli(ovalo(cx, cy, rx, ry)), 0.95 * am, 0.6, sem++);
    masa(L.mojada, poli(ovalo(cx, cy, rx * 0.9, ry * 0.9)), 0.35 * am, 0.6, sem++);
    // el brillo del ojo: papel en blanco
    if (brillo) reserva(L, poli(ovalo(cx - rx * 0.3, cy - ry * 0.34, rx * 0.34, rx * 0.34)), 1, 0, 0, false);
  };
  const ojo = (lado: number, forma: 'normal' | 'grande' | 'cerrado' | 'feliz' | 'medio' | 'susto') => {
    const ex = CX + lado * SEP;
    if (forma === 'cerrado') {
      linea([[ex - 30, OJO_Y + (lado > 0 ? 4 : 0)], [ex, OJO_Y - 10], [ex + 30, OJO_Y + (lado > 0 ? 0 : 4)]], 6.5);
      return;
    }
    if (forma === 'feliz') {
      arco(ex, OJO_Y + 16, 26, Math.PI * 1.12, Math.PI * 1.88, 7);
      return;
    }
    if (forma === 'susto') {
      reserva(L, poli(ovalo(ex, OJO_Y, 34, 40)), 1, 0, 0, false);
      const pts = ovalo(ex, OJO_Y, 34, 40);
      linea([...pts, pts[0], pts[1]], 3.6, 0.85);
      punto(ex + px * 0.8, OJO_Y + py * 0.8, 11, 11, false);
      return;
    }
    const rx = forma === 'grande' ? 30 : 26, ry = forma === 'grande' ? 42 : 36;
    punto(ex + px, OJO_Y + py, rx, ry);
    if (forma === 'medio') {
      // el párpado a media asta: «¿en serio?»
      reserva(L, poli([[ex - rx - 8, OJO_Y - ry - 10], [ex + rx + 8, OJO_Y - ry - 10], [ex + rx + 8, OJO_Y - 4], [ex - rx - 8, OJO_Y - 4]]), 1, 0, 0, false);
      linea([[ex - rx - 6, OJO_Y - 4], [ex + rx + 6, OJO_Y - 5]], 6);
    }
  };
  const cejas = (inc: number, alto: number, w = 6.5) => {
    for (const lado of [-1, 1]) {
      const ex = CX + lado * SEP, y0 = OJO_Y - 62 - alto;
      const a: [number, number] = [ex - lado * 30, y0 + inc * 14], b: [number, number] = [ex + lado * 30, y0 - inc * 14];
      linea(curvaQ(a, [ex, y0 - 6], b, 6).map((q) => [q[0], q[1]] as [number, number]), w);
    }
  };
  const boca = (forma: 'linea' | 'sonrisa' | 'o' | 'dientes' | 'triste' | 'grande' | 'ondas' | 'lado') => {
    const by = BOCA_Y;
    if (forma === 'linea') linea([[CX - 30, by], [CX + 30, by]], 6);
    else if (forma === 'lado') linea(curvaQ([CX - 34, by + 6], [CX, by + 2], [CX + 38, by - 8], 6).map((q) => [q[0], q[1]] as [number, number]), 6);
    else if (forma === 'sonrisa') arco(CX, by - 30, 40, Math.PI * 0.2, Math.PI * 0.8, 6.5);
    else if (forma === 'triste') arco(CX, by + 34, 38, Math.PI * 1.2, Math.PI * 1.8, 6.5);
    else if (forma === 'o') {
      masa(L.seca, poli(ovalo(CX, by, 22, 30)), 0.92 * am, 0.6, sem++);
      masa(L.mojada, poli(ovalo(CX, by, 20, 27)), 0.4 * am, 0.6, sem++);
    } else if (forma === 'dientes') {
      const caja: [number, number][] = [[CX - 44, by - 18], [CX + 44, by - 18], [CX + 44, by + 18], [CX - 44, by + 18], [CX - 44, by - 18]];
      linea(caja, 4.2);
      linea([[CX - 44, by], [CX + 44, by]], 2.6, 0.8);
      for (const dx of [-22, 0, 22]) linea([[CX + dx, by - 18], [CX + dx, by + 18]], 2.4, 0.8);
    } else if (forma === 'grande') {
      const d: [number, number][] = [];
      d.push([CX - 62, by - 26]);
      for (let i = 1; i <= 8; i++) d.push([mix(CX - 62, CX + 62, i / 8), by - 26 - 3 * Math.sin((Math.PI * i) / 8)]);
      for (let i = 1; i < 12; i++) {
        const a = (i / 12) * Math.PI;
        d.push([CX + 62 * Math.cos(a), by - 6 + 54 * Math.sin(a)]);
      }
      masa(L.seca, poli(d), 0.94 * am, 0.6, sem++);
      // los dientes, papel en blanco
      reserva(L, poli([[CX - 52, by - 21], [CX + 52, by - 21], [CX + 46, by - 7], [CX - 46, by - 7]]), 1, 0, 0, false);
    } else if (forma === 'ondas') {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 8; i++) pts.push([CX - 44 + i * 11, by + (i % 2 ? -7 : 7)]);
      linea(pts, 4.8);
    }
  };
  switch (cara) {
    case 'atento': cejas(0.35, -6); ojo(-1, 'normal'); ojo(1, 'normal'); boca('linea'); break;
    case 'ilusion': cejas(-0.3, 8); ojo(-1, 'grande'); ojo(1, 'grande'); boca('sonrisa'); break;
    case 'tension': cejas(-0.5, 2); ojo(-1, 'grande'); ojo(1, 'grande'); boca('dientes'); break;
    case 'ay': cejas(-0.7, 16); ojo(-1, 'grande'); ojo(1, 'grande'); boca('o'); break;
    case 'fastidio': cejas(0.8, -8, 7.5); ojo(-1, 'cerrado'); ojo(1, 'cerrado'); boca('triste'); break;
    case 'meh': cejas(0, 4); ojo(-1, 'medio'); ojo(1, 'medio'); boca('lado'); break;
    case 'susto': cejas(-0.6, 20); ojo(-1, 'susto'); ojo(1, 'susto'); boca('ondas'); break;
    case 'feliz': cejas(-0.4, 14); ojo(-1, 'feliz'); ojo(1, 'feliz'); boca('grande'); break;
    case 'serio': cejas(0.1, -2); ojo(-1, 'medio'); ojo(1, 'medio'); boca('linea'); break;
  }
};

// ---------------------------------------------------------------- el muñeco y su silla
const SILLA_O: V3 = [SILLA.x, -SUELO, SILLA.z]; // el pie de la silla, en el mundo
const Y_ASIENTO = SUELO - SILLA.asiento;

// las esquinas redondeadas (Chaikin): la silueta de un bloque pintado a pincel no tiene picos
export const suaviza = (pts: P2[], veces = 2): P2[] => {
  let p = pts;
  for (let k = 0; k < veces; k++) {
    const q: P2[] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    p = q;
  }
  return p;
};
// una silueta cerrada en dos cadenas, de su punto más alto al más bajo: la de la izquierda y la de la derecha
const cadenas = (h: P2[]): [P2[], P2[]] => {
  let iA = 0, iB = 0;
  h.forEach((q, i) => {
    if (q[1] < h[iA][1]) iA = i;
    if (q[1] > h[iB][1]) iB = i;
  });
  const cadena = (paso: number) => {
    const out: P2[] = [];
    for (let i = iA; ; i = (i + paso + h.length) % h.length) {
      out.push(h[i]);
      if (i === iB || out.length > h.length) break;
    }
    return out;
  };
  const c1 = cadena(1), c2 = cadena(-1);
  const media = (cc: P2[]) => cc.reduce((s, q) => s + q[0], 0) / cc.length;
  return media(c1) < media(c2) ? [c1, c2] : [c2, c1];
};
const cada = <X,>(a: X[], k: number): X[] => a.filter((_, i) => i % k === 0 || i === a.length - 1);

// un miembro xieyi: una aguada (el cuerpo) y, encima, el contorno cargado del lado de la sombra y una línea seca del lado de la luz
const miembro = (L: Capas, pts: Q[], w: number, o: {aguada: number; borde: number; oscuro: P2; semilla: number; hv: number; wBorde?: number; perfil?: OpTrazo['perfil']}) => {
  const s = trazo(pts, {w, tono: o.aguada, seca: 0, mojada: 1, cerda: 0, perfil: o.perfil ?? 'parejo', aspero: 0.05, semilla: o.semilla, hierve: o.hv});
  reserva(L, contorno(s, 0.5));
  pinta(L, s);
  let ax = 0, ay = 0;
  for (let i = 0; i < s.n; i++) { ax += s.nx[i]; ay += s.ny[i]; }
  const lado = Math.sign(ax * o.oscuro[0] + ay * o.oscuro[1] || 1);
  const borde = (k: number): Q[] => cada(s.P.map((p, i) => [p[0] + s.nx[i] * (s.ws[i] / 2) * k, p[1] + s.ny[i] * (s.ws[i] / 2) * k] as Q), 3);
  const wb = o.wBorde ?? 12;
  T(L, borde(lado * (1 - wb / w)), {w: wb, tono: o.borde, seca: 0.26, mojada: 0.25, perfil: 'pincel', semilla: o.semilla + 1, cerdas: 14, hierve: o.hv, aspero: 0.22, pulso: 0.45});
  T(L, borde(-lado * 0.9), {w: 6, tono: o.borde * 0.9, seca: 0.42, perfil: 'punta', semilla: o.semilla + 2, cerdas: 6, hierve: o.hv, pulso: 0.5});
  return s;
};

type Pieza = {z: number; pinta: () => void};

export const muneco = (L: Capas, pose: Pose, hv: number) => {
  const c = cuerpo(pose);
  const H = huesos(pose);
  const M = MUNECO;
  const enSilla = (v: V3): V3 => suma(SILLA_O, aplica(c.MR, v));
  const piezas: Pieza[] = [];

  // --- la silla: la base de cinco patas y el poste (siempre lo primero: está en el suelo, debajo de todo)
  {
    const cubo = pm(suma(SILLA_O, [0, 34, 0]));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.3;
      const d: V3 = [Math.sin(a), 0, Math.cos(a)];
      const fin = suma(SILLA_O, suma(por(d, 128), [0, 30, 0]));
      const rueda = pm(suma(SILLA_O, suma(por(d, 134), [0, 12, 0])));
      T(L, [cubo, pm(fin)], {w: 18, tono: 0.95, seca: 0.32, perfil: 'clavo', semilla: 300 + k, hierve: hv});
      gota(L.seca, rueda[0], rueda[1], 10, 0.9, 0, 0.8, 310 + k);
    }
    gota(L.mojada, cubo[0], cubo[1], 22, 0.7, 0, 0.6, 316);
    const p0 = pm(suma(SILLA_O, [0, 40, 0])), p1 = pm(suma(SILLA_O, [0, Y_ASIENTO - 30, 0]));
    T(L, [p0, p1], {w: 22, tono: 0.88, seca: 0.3, perfil: 'parejo', semilla: 320, hierve: hv});
  }
  // --- el respaldo y el asiento (giran con él; un pelo detrás de todo lo suyo): una aguada oscura con su borde
  const bloqueSilla = (pts3: V3[], semilla: number, aguada: number) => {
    const h = suaviza(envolvente(pts3.map(pm)), 2);
    reserva(L, h, 1);
    masa(L.mojada, h, aguada, 1.2, semilla);
    const [iz, de] = cadenas(h);
    T(L, cada(iz, 2), {w: 16, tono: 0.97, seca: 0.28, perfil: 'pincel', semilla: semilla + 1, hierve: hv, pulso: 0.45});
    T(L, cada(de, 2), {w: 12, tono: 0.9, seca: 0.38, perfil: 'pincel', semilla: semilla + 2, hierve: hv, pulso: 0.45});
  };
  const respaldo = cajaPts(enSilla, 192, 161, 64, Y_ASIENTO - 4).map((v) => suma(v, aplica(c.MR, [0, 0, -100])));
  piezas.push({z: enSilla([0, 300, -100])[2] - 40, pinta: () => bloqueSilla(respaldo, 330, 0.78)});
  const asiento = cajaPts(enSilla, 192, 38, 192, Y_ASIENTO - 38).map((v) => suma(v, aplica(c.MR, [0, 0, -6])));
  piezas.push({z: enSilla([0, Y_ASIENTO, -6])[2] - 30, pinta: () => bloqueSilla(asiento, 340, 0.72)});

  // --- las piernas (el pantalón oscuro): de la cadera a la rodilla y al pie, con el zapato en tinta quemada
  const frente = aplica(c.MR, [0, 0, 1]);
  for (const k of [0, 1] as const) {
    const lado = k === 0 ? -1 : 1;
    const cad = enRaiz(c, [lado * M.pierna.x, M.cadera * 0.5, -6]);
    const rod = H.rodilla[k], pie = H.pie[k];
    const z = (cad[2] + rod.z + pie.z) / 3;
    piezas.push({
      z,
      pinta: () => {
        const pts: Q[] = [lejos(pm(cad), rod.p, 0.1), pm(cad), rod.p, pie.p];
        miembro(L, pts, 62, {aguada: k === 0 ? 0.66 : 0.78, borde: 0.98, oscuro: [0.3, 1], semilla: 400 + k * 10, hv, wBorde: 20});
        // el zapato: un trazo de clavo hacia delante
        const pw: V3 = [H.e.pie[k][0], -H.e.pie[k][1], H.e.pie[k][2]];
        const a = pm(suma(pw, por(frente, -16))), b = pm(suma(pw, por(frente, 60)));
        T(L, [a, b], {w: 30, tono: 0.97, seca: 0.18, mojada: 0.25, perfil: 'clavo', semilla: 420 + k, hierve: hv});
      },
    });
  }

  // --- el cuerpo: un bloque (la camisa clara) con su contorno de pincel, el cuello de la camisa y la corbata roja
  const caja = cajaPts((v) => enCuerpo(c, v), M.torso.an, M.torso.alto, M.torso.fondo);
  const zTorso = enCuerpo(c, [0, M.torso.alto / 2, 0])[2];
  piezas.push({
    z: zTorso,
    pinta: () => {
      const h = suaviza(envolvente(caja.map(pm)), 1);
      reserva(L, h, 1);
      const xs = h.map((q) => q[0]);
      masa(L.mojada, h, 0.26, 1.2, 501, [Math.min(...xs), 0, Math.max(...xs), 0, 0.1, 1]);
      const [iz, de] = cadenas(h);
      T(L, cada(iz, 1), {w: 17, tono: 0.97, seca: 0.28, perfil: 'pincel', semilla: 502, hierve: hv, pulso: 0.5});
      T(L, cada(de, 1), {w: 20, tono: 0.98, seca: 0.26, perfil: 'pincel', semilla: 503, hierve: hv, pulso: 0.5});
      // la arista de delante (entre la cara de delante y la del lado), fina
      const aristas = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
        const a = enCuerpo(c, [(sx * M.torso.an) / 2, 0, (sz * M.torso.fondo) / 2]);
        const b = enCuerpo(c, [(sx * M.torso.an) / 2, M.torso.alto, (sz * M.torso.fondo) / 2]);
        return {a: pm(a), b: pm(b), z: (a[2] + b[2]) / 2};
      });
      const medio = [...aristas].sort((p, q) => q.z - p.z)[0];
      T(L, [medio.b, medio.a], {w: 4.5, tono: 0.62, seca: 0.5, perfil: 'punta', semilla: 504, hierve: hv});
      // el cinturón
      const ab = [[-1, 1], [1, 1]].map(([sx, sz]) => pm(enCuerpo(c, [(sx * M.torso.an) / 2, 5, (sz * M.torso.fondo) / 2])));
      T(L, [ab[0], ab[1]], {w: 15, tono: 0.95, seca: 0.32, perfil: 'pincel', semilla: 505, hierve: hv, pulso: 0.4});
      // la camisa por delante, si se ve: el cuello en V y la corbata (el rojo)
      const f = M.torso.fondo / 2 + 0.6;
      const vis = deFrente(enCuerpo(c, [0, M.torso.alto * 0.6, f]), aplica(c.MC, [0, 0, 1]));
      if (vis > 0.05) {
        const q = (x: number, y: number): P2 => pm(enCuerpo(c, [x, y, f]));
        const tieQ: [number, number][] = [[-12, 110], [12, 110], [9, 92], [17, 26], [0, 8], [-17, 26], [-9, 92]];
        reserva(L, tieQ.map(([x, y]) => q(x, y)), vis, 0, 0, false);
        masa(L.color, tieQ.map(([x, y]) => q(x, y)), 0.97 * vis, 0.8, 506, null, BERMELLON.join(','));
        T(L, [q(-12, 92), q(12, 92)], {w: 2.5, tono: 0.6, seca: 0.4, perfil: 'punta', semilla: 510, hierve: hv}, 1, vis);
        T(L, [q(-40, M.torso.alto - 1), q(-4, M.torso.alto - 28), q(0, M.torso.alto - 32)], {w: 6, tono: 0.88, seca: 0.3, perfil: 'punta', semilla: 507, hierve: hv}, 1, vis);
        T(L, [q(40, M.torso.alto - 1), q(4, M.torso.alto - 28), q(0, M.torso.alto - 32)], {w: 6, tono: 0.88, seca: 0.3, perfil: 'punta', semilla: 508, hierve: hv}, 1, vis);
        T(L, [q(30, 66), q(54, 66), q(54, 44)], {w: 3.5, tono: 0.55, seca: 0.55, perfil: 'punta', semilla: 509, hierve: hv}, 1, vis * 0.8);
      }
    },
  });

  // --- la cabeza: un ladrillo redondo (papel casi en blanco) con su contorno de pincel, el pelo de tinta y la cara
  piezas.push({
    z: Math.max(H.cabeza.z, zTorso + 6),
    pinta: () => {
      const f = (v: V3) => enCabeza(c, v);
      T(L, [pm(enCuerpo(c, [0, M.torso.alto - 4, 0])), pm(f([0, 8, 0]))], {w: 30, tono: 0.7, seca: 0.3, perfil: 'parejo', semilla: 600, hierve: hv});
      const h = suaviza(envolvente(cilindroPts(f, M.cabeza.r, 0, M.cabeza.alto, 32).map(pm)), 2);
      reserva(L, h, 1);
      const xs = h.map((q) => q[0]);
      masa(L.mojada, h, 0.2, 1, 602, [Math.min(...xs), 0, Math.max(...xs), 0, 0.12, 1]);
      const [iz, de] = cadenas(h);
      T(L, cada(iz, 1), {w: 15, tono: 0.98, seca: 0.26, perfil: 'pincel', semilla: 603, hierve: hv, pulso: 0.55});
      T(L, cada(de, 1), {w: 18, tono: 0.98, seca: 0.24, perfil: 'pincel', semilla: 604, hierve: hv, pulso: 0.55});
      caraTinta(L, c, pose.cara, pose.ojos, hv);
      // el pelo: pincel MOJADO (una aguada cargada que se corre y acumula el pigmento en el borde) y, por fuera, el borde SECO:
      // pasadas de pincel áspero que se salen de la silueta, mechones de punta y el flequillo que cae sobre la frente
      const pelo = suaviza(envolvente(cilindroPts(f, M.cabeza.r + 3, M.cabeza.alto - 4, M.cabeza.alto + M.pelo + 2, 28).map(pm)), 2);
      reserva(L, pelo, 1);
      masa(L.mojada, pelo, 0.95, 4, 606);
      for (let k = 0; k < 3; k++) {
        const y = M.cabeza.alto + 6 + k * 9, rr = M.cabeza.r + 10 - k * 9;
        const arco: Q[] = [];
        for (let j = 0; j <= 8; j++) {
          const a = -1.5 + (j / 8) * 3;
          arco.push(pm(f([rr * Math.sin(a), y + 5 * Math.sin(j * 1.7), rr * Math.cos(a)])));
        }
        T(L, k % 2 ? arco.reverse() : arco, {w: 26 - k * 4, tono: 0.97, seca: 0.62, perfil: 'pincel', semilla: 608 + k, cerdas: 26, hierve: hv, pulso: 0.4});
      }
      // mechones que salen de la coronilla, secos en la punta
      for (let k = 0; k < 4; k++) {
        const a = -1.1 + k * 0.7, rr = M.cabeza.r * 0.75;
        const p0 = f([rr * Math.sin(a), M.cabeza.alto + M.pelo, rr * Math.cos(a)]);
        const p1 = f([(rr + 30) * Math.sin(a + 0.35), M.cabeza.alto + M.pelo + 10 - 4 * (k % 2), (rr + 30) * Math.cos(a + 0.35)]);
        T(L, [pm(p0), pm(p1)], {w: 16, tono: 0.97, seca: 0.5, perfil: 'clavo', semilla: 616 + k, cerdas: 10, hierve: hv});
      }
      // el flequillo
      for (let k = 0; k < 4; k++) {
        const a = -0.7 + k * 0.4, rr = M.cabeza.r + 4;
        const p0 = f([rr * Math.sin(a), M.cabeza.alto + 6, rr * Math.cos(a)]);
        const p1 = f([rr * Math.sin(a + 0.22), M.cabeza.alto - 18 - 7 * (k % 2), (rr + 3) * Math.cos(a + 0.22)]);
        T(L, [pm(p0), pm(p1)], {w: 19, tono: 0.98, seca: 0.42, perfil: 'clavo', semilla: 612 + k, cerdas: 12, hierve: hv});
      }
    },
  });

  // --- los brazos (la manga clara con su contorno cargado) y las manos (un aro de pincel)
  for (const k of [0, 1] as const) {
    const h = H.hombro[k], co = H.codo[k], ma = H.mano[k];
    const z = (h.z + co.z + ma.z) / 3 + (k === 0 ? 4 : -4);
    piezas.push({
      z,
      pinta: () => {
        const pts: Q[] = [lejos(h.p, co.p, 0.16), h.p, co.p, ma.p];
        miembro(L, pts, 50, {aguada: k === 1 ? 0.28 : 0.17, borde: k === 1 ? 0.92 : 0.98, oscuro: [0.35, 1], semilla: 700 + k * 10, hv, wBorde: 16});
        // la mano
        const r = M.rMano * M.escala * escalaEn(ma.z);
        const dir = norm2([ma.p[0] - co.p[0], ma.p[1] - co.p[1]]);
        const cm: P2 = [ma.p[0] + dir[0] * r * 0.5, ma.p[1] + dir[1] * r * 0.5];
        const aro = elipse2(cm, r, r * 0.96, 22);
        reserva(L, aro);
        masa(L.mojada, aro, 0.08, 1, 730 + k);
        const giro = Math.atan2(dir[1], dir[0]) + 2.2;
        const ring: Q[] = [];
        for (let i = 0; i <= 18; i++) {
          const a = giro + (i / 18) * Math.PI * 1.85;
          ring.push([cm[0] + r * Math.cos(a), cm[1] + r * Math.sin(a)]);
        }
        T(L, ring, {w: 9, tono: 0.97, seca: 0.28, perfil: 'pincel', semilla: 740 + k, hierve: hv, cerdas: 9, pulso: 0.5});
      },
    });
  }
  piezas.sort((a, b) => a.z - b.z).forEach((p) => p.pinta());
};

// ---------------------------------------------------------------- la papelera: un cubo de duelas con dos aros, uno de laca roja
const PB = PAPELERA;
const R_ARRIBA = PB.rBorde + PB.pared, R_ABAJO = PB.rBase + PB.pared;
const enPap = (phi: number, y: number, r: number, inc: number): P2 => {
  const x = r * Math.cos(phi), z = PB.z + r * Math.sin(phi);
  const dy = y - SUELO, c = Math.cos(inc), s = Math.sin(inc);
  return proyecta([PB.x + x * c - dy * s, SUELO + x * s + dy * c, z]);
};
const rDe = (y: number) => mix(R_ARRIBA, R_ABAJO, clamp((y - PB.yBorde) / (SUELO - PB.yBorde)));
const arcoPap = (a0: number, a1: number, y: number, r: number, inc: number, n = 20): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) out.push(enPap(mix(a0, a1, i / n), y, r, inc));
  return out;
};
const siluetaPap = (inc: number) => envolvente([...arcoPap(0, Math.PI * 2, PB.yBorde, PB.rBorde + 18, inc, 40), ...arcoPap(0, Math.PI * 2, SUELO, R_ABAJO, inc, 40)]);
const frentePap = (inc: number): P2[] => [...arcoPap(0, Math.PI, PB.yBorde + 6, R_ARRIBA + 2, inc, 24), ...arcoPap(Math.PI, 0, SUELO, R_ABAJO, inc, 24)];

// lo de atrás: el hueco por dentro y el borde de atrás (lo que queda detrás de una bola que cae dentro)
export const papeleraFondo = (L: Capas, inc: number, hv: number) => {
  reserva(L, siluetaPap(inc), 1, 1.5, 800);
  const boca = arcoPap(0, Math.PI * 2, PB.yBorde, PB.rBorde - 4, inc, 36);
  const ys = boca.map((q) => q[1]);
  masa(L.mojada, boca, 0.97, 2, 801, [0, Math.min(...ys), 0, Math.max(...ys), 0.42, 1]);
  T(L, arcoPap(Math.PI * 1.02, Math.PI * 1.98, PB.yBorde, PB.rBorde, inc, 24), {w: 22, tono: 0.97, seca: 0.3, perfil: 'pincel', semilla: 802, hierve: hv, pulso: 0.4});
};
// lo de delante: el cuerpo de duelas, los aros y el borde de delante (el que tapa lo que cae dentro)
export const papeleraFrente = (L: Capas, inc: number, hv: number) => {
  const fr = frentePap(inc);
  reserva(L, fr, 1, 1.5, 810);
  const xs = fr.map((q) => q[0]);
  masa(L.mojada, fr, 0.62, 3, 811, [Math.min(...xs), 0, Math.max(...xs), 0, 0.1, 1]);
  // la sombra de debajo del borde (el aro tapa la luz): una aguada que baja y se corre
  masa(L.mojada, [...arcoPap(0, Math.PI, PB.yBorde + 10, R_ARRIBA, inc, 20), ...arcoPap(Math.PI, 0, PB.yBorde + 70, rDe(PB.yBorde + 70), inc, 20)], 0.3, 4, 812, [0, PB.yBorde + 10, 0, PB.yBorde + 80, 1, 0]);
  // las duelas
  for (let k = 0; k < 9; k++) {
    const phi = ((k + 0.5) / 9) * Math.PI;
    const a = enPap(phi, PB.yBorde + 22, rDe(PB.yBorde + 22), inc), b = enPap(phi, SUELO - 6, R_ABAJO, inc);
    T(L, [a, b], {w: 6.5, tono: 0.8, seca: 0.48, perfil: 'punta', semilla: 820 + k, hierve: hv, cerdas: 7, pulso: 0.35});
  }
  // los dos aros: arriba, laca roja; abajo, tinta
  const y1 = PB.yBorde + 0.2 * (SUELO - PB.yBorde), y2 = PB.yBorde + 0.8 * (SUELO - PB.yBorde);
  const aroRojo = trazo(arcoPap(Math.PI * 0.99, Math.PI * 0.01, y1, rDe(y1) + 2, inc, 24), {w: 26, tono: 0.97, seca: 0.12, perfil: 'parejo', semilla: 830, color: BERMELLON, solido: true, cerdas: 14});
  reserva(L, contorno(aroRojo, 0), 1, 0, 0, false);
  pinta(L, aroRojo);
  T(L, arcoPap(Math.PI * 0.99, Math.PI * 0.01, y1 + 12, rDe(y1 + 12) + 2, inc, 24), {w: 3.5, tono: 0.7, seca: 0.5, perfil: 'punta', semilla: 831, hierve: hv});
  T(L, arcoPap(Math.PI * 0.99, Math.PI * 0.01, y2, rDe(y2) + 2, inc, 24), {w: 17, tono: 0.95, seca: 0.32, perfil: 'pincel', semilla: 832, hierve: hv, pulso: 0.4});
  // los costados, cargados hacia fuera, y el fondo
  T(L, [enPap(Math.PI, PB.yBorde + 4, R_ARRIBA, inc), enPap(Math.PI, SUELO, R_ABAJO, inc)], {w: 26, tono: 0.98, seca: 0.25, mojada: 0.2, perfil: 'pincel', semilla: 840, cerdas: 20, hierve: hv, pulso: 0.5});
  T(L, [enPap(0, PB.yBorde + 4, R_ARRIBA, inc), enPap(0, SUELO, R_ABAJO, inc)], {w: 32, tono: 0.98, seca: 0.22, mojada: 0.25, perfil: 'pincel', semilla: 841, cerdas: 22, hierve: hv, pulso: 0.5});
  T(L, arcoPap(Math.PI, 0, SUELO - 2, R_ABAJO, inc, 24), {w: 16, tono: 0.95, seca: 0.35, perfil: 'pincel', semilla: 842, hierve: hv, pulso: 0.45});
  // el borde de delante: el trazo más seguro de todos
  T(L, arcoPap(Math.PI * 1.01, Math.PI * -0.01, PB.yBorde, PB.rBorde + 2, inc, 28), {w: 36, tono: 0.99, seca: 0.24, mojada: 0.2, perfil: 'pincel', semilla: 843, oscuro: [0, 1], lado: 0.6, cerdas: 30, hierve: hv, pulso: 0.45});
};

// ---------------------------------------------------------------- la lámpara que cuelga
export const lampara = (L: Capas, ang: number, hv: number) => {
  const g: P2 = [LAMPARA.x, LAMPARA.yGancho];
  const d: P2 = [Math.sin(ang), Math.cos(ang)], q: P2 = [Math.cos(ang), -Math.sin(ang)];
  const en = (a: number, l: number): P2 => [g[0] + d[0] * a + q[0] * l, g[1] + d[1] * a + q[1] * l];
  const a0 = LAMPARA.largo - LAMPARA.alto / 2, a1 = LAMPARA.largo + LAMPARA.alto / 2;
  T(L, [en(0, 0), en(a0 * 0.5, 0.5), en(a0 - 4, 0)], {w: 5, tono: 0.95, seca: 0.35, perfil: 'parejo', semilla: 850, hierve: hv});
  // la pantalla: una masa oscura con el borde cargado
  const tulipa: P2[] = [en(a0, -LAMPARA.rArriba - 2), en(a0, LAMPARA.rArriba + 2), en(a1, LAMPARA.rAbajo)];
  for (let i = 1; i < 10; i++) tulipa.push(en(a1 + 7 * Math.sin((Math.PI * i) / 10), LAMPARA.rAbajo - (2 * LAMPARA.rAbajo * i) / 10));
  tulipa.push(en(a1, -LAMPARA.rAbajo));
  reserva(L, tulipa, 1, 1.5, 851);
  masa(L.mojada, tulipa, 0.97, 2.5, 852, [en(a0, -60)[0], 0, en(a0, 60)[0], 0, 0.6, 1]);
  T(L, [en(a0 + 2, -LAMPARA.rArriba), en(a1 - 2, -LAMPARA.rAbajo)], cargado(18, 0.98, [-1, 0], 853, {hierve: hv, perfil: 'pincel', pulso: 0.4}));
  T(L, [en(a0 + 2, LAMPARA.rArriba), en(a1 - 2, LAMPARA.rAbajo)], cargado(18, 0.98, [1, 0], 854, {hierve: hv, perfil: 'pincel', pulso: 0.4}));
  const borde: P2[] = [];
  for (let i = 0; i <= 12; i++) borde.push(en(a1 + 7 * Math.sin((Math.PI * i) / 12), -LAMPARA.rAbajo + (2 * LAMPARA.rAbajo * i) / 12));
  T(L, borde, {w: 17, tono: 0.99, seca: 0.22, perfil: 'pincel', semilla: 855, hierve: hv, pulso: 0.4});
  T(L, [en(a0 - 14, -12), en(a0 - 14, 12)], {w: 16, tono: 0.95, seca: 0.2, perfil: 'punto', semilla: 856});
  // la bombilla: papel en blanco con su aro
  const b = en(a1 + 22, 0);
  const aro = elipse2(b, 21, 21, 20);
  reserva(L, aro);
  const ring: Q[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = 0.4 + (i / 16) * Math.PI * 1.75;
    ring.push([b[0] + 21 * Math.cos(a), b[1] + 21 * Math.sin(a)]);
  }
  T(L, ring, {w: 6, tono: 0.85, seca: 0.35, perfil: 'pincel', semilla: 857, cerdas: 6});
};

// ---------------------------------------------------------------- la bola: un ensō (円相) con sus pliegues
export const bolaTinta = (L: Capas, b: Bola, hv: number) => {
  const c = proyecta(b.c);
  const r = R_BOLA * escalaEn(b.c[2]);
  const n = norm2([b.aplasta.n[0], b.aplasta.n[1]]);
  const t: P2 = [-n[1], n[0]];
  const k = b.aplasta.k;
  const sa = 1 - 0.26 * k, sp = 1 + 0.16 * k;
  const en = (u: P2): P2 => {
    const a = u[0] * n[0] + u[1] * n[1], p = u[0] * t[0] + u[1] * t[1];
    return [c[0] + n[0] * a * sa + t[0] * p * sp, c[1] + n[1] * a * sa + t[1] * p * sp];
  };
  const polar = (rr: number, a: number): P2 => en([rr * Math.cos(a + b.giro), rr * Math.sin(a + b.giro)]);
  // el papel arrugado no es redondo: un contorno con bultos (fijos a la bola, giran con ella)
  const bulto = (a: number) => 1 + 0.045 * Math.sin(a * 5 + 0.7) + 0.03 * Math.sin(a * 3 + 2.1);
  const silueta: P2[] = [];
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    silueta.push(polar(r * 1.04 * bulto(a), a));
  }
  reserva(L, silueta);
  // la sombra del papel, abajo a la derecha (fija a la pantalla: la luz no gira con la bola)
  masa(L.mojada, silueta, 0.2, 1.5, 860, [c[0] - r, c[1] - r, c[0] + r, c[1] + r, 0, 1.3]);
  // el ensō: un solo trazo de tinta quemada que casi se cierra, más seco al final
  const anillo: Q[] = [];
  for (let i = 0; i <= 28; i++) {
    const a = -0.9 + (i / 28) * Math.PI * 1.9;
    anillo.push([...polar(r * 0.97 * bulto(a), a), 1]);
  }
  T(L, anillo, {w: Math.max(8, r * 0.38), tono: 0.99, seca: 0.3, pulso: 0.35, perfil: 'pincel', semilla: 861, cerdas: 14, hueco: 2.6 * r * 3, hierve: hv});
  // los pliegues: dos quebradas finas que cruzan el papel, y una sombra de pliegue
  // (quebradas y rectas: una curva suelta dentro de un círculo se lee como una boca)
  const pl: [number, number][][] = [
    [[0.88, 2.75], [0.18, 2.2], [0.5, 0.95], [0.9, 0.62]],
    [[0.7, 4.55], [0.42, 5.3]],
  ];
  pl.forEach((q, j) => {
    for (let s = 0; s < q.length - 1; s++) T(L, [polar(q[s][0] * r, q[s][1]), polar(q[s + 1][0] * r, q[s + 1][1])], {w: Math.max(2.2, r * 0.06), tono: 0.55, seca: 0.4, perfil: 'punta', semilla: 862 + j * 4 + s, cerdas: 4});
  });
  masa(L.mojada, [polar(0.18 * r, 2.2), polar(0.5 * r, 0.95), polar(0.75 * r, 1.7)], 0.17, 0.5, 866);
};

// el rastro: un trazo seco de pincel que sigue el arco de lo que recorrió la bola (~0,4 s): nace grueso detrás de ella, se afila y
// se rompe al final (la tinta se acaba en el pincel). Empieza en el borde de la bola, no en su centro, así no queda un muñón.
export const rastro = (L: Capas, i: number, tb: number) => {
  const r = R_BOLA * escalaEn(bolaEn(i, tb).c[2]);
  const c0 = proyecta(bolaEn(i, tb).c);
  const pts: Q[] = [];
  let ult: P2 | null = null, largo = 0;
  for (let k = 0; k <= 32; k++) {
    const tk = tb - k / 80;
    if (tk < 0) break;
    const q = proyecta(bolaEn(i, tk).c);
    if (Math.hypot(q[0] - c0[0], q[1] - c0[1]) < r * 0.7) continue; // lo de debajo de la bola, fuera
    if (ult) {
      const d = Math.hypot(q[0] - ult[0], q[1] - ult[1]);
      if (d < 3) continue;
      largo += d;
    }
    pts.push([q[0], q[1], 1]);
    ult = q;
  }
  if (pts.length < 3 || largo < 50) return;
  const am = clamp((largo - 50) / 90);
  T(L, pts, {w: r * 1.05, tono: 0.85, seca: 0.64, perfil: 'clavo', semilla: 870 + i, cerdas: 20, hueco: 420, apaga: 0.95, aspero: 0.2, pulso: 0.2}, 1, am);
};

// la tinta que salta en cada golpe: una mancha que estalla con sus lenguas, gotas que vuelan y se quedan en el papel (como en el
// papel de verdad: lo que salpica, se queda). Los golpes fuertes, entera; los flojos, solo unas gotas.
export const salpicaduras = (L: Capas, i: number, golpes: Golpe[], tb: number, soloPila = false) => {
  golpes.forEach((g, gi) => {
    if (g.t > tb || (g.fuerza < 420 && g.tipo !== 'lampara')) return;
    if (soloPila !== (g.tipo === 'pila')) return;
    const u = tb - g.t;
    const fuerte = g.fuerza >= 1100 || g.tipo === 'lampara' || g.tipo === 'muro'; // la lámpara y la pared son el golpe de su lanzamiento
    const k = g.tipo === 'lampara' || g.tipo === 'muro' ? Math.max(0.75, clamp(g.fuerza / 2200)) : clamp(g.fuerza / 2200, 0.3, 1.15);
    // la de los papeles de dentro sale por la boca de la papelera, como un surtidor de tinta
    const c0 = g.tipo === 'pila' ? proyecta([g.p[0], PB.yBorde + 8, g.p[2] + 30]) : proyecta(g.p);
    const n = g.tipo === 'pila' ? ([0, -1] as P2) : norm2([g.n[0], g.n[1]]);
    const base = Math.atan2(n[1], n[0]);
    const R = rng(i * 1000 + gi * 37 + 5);
    const sale = E.outCubic(clamp(u / 0.07));
    // la mancha y sus lenguas, que nacen del golpe hacia fuera
    const lenguas = fuerte ? 7 : 0;
    for (let j = 0; j < lenguas; j++) {
      const ang = base + (j / (lenguas - 1) - 0.5) * 2.7 + (R() - 0.5) * 0.3;
      const largo = (55 + 85 * R()) * k * (g.tipo === 'pila' ? 1.5 : 1);
      const w = (9 + 8 * R()) * k;
      const a: P2 = [c0[0] + Math.cos(ang) * 10, c0[1] + Math.sin(ang) * 10];
      const b: P2 = [c0[0] + Math.cos(ang) * (10 + largo * sale), c0[1] + Math.sin(ang) * (10 + largo * sale)];
      const m: P2 = [(a[0] + b[0]) / 2 + Math.cos(ang + 1.57) * 6 * (R() - 0.5), (a[1] + b[1]) / 2 + Math.sin(ang + 1.57) * 6 * (R() - 0.5)];
      if (sale > 0.05) T(L, [a, m, b], {w, tono: 0.95, seca: 0.22, mojada: 0.3, perfil: 'clavo', semilla: 880 + gi * 10 + j, cerdas: 8});
    }
    if (fuerte) {
      gota(L.seca, c0[0], c0[1], (26 + 24 * k) * sale, 0.97, base, 0.8, 1040 + gi);
      gota(L.mojada, c0[0], c0[1], (44 + 36 * k) * sale, 0.5, base, 0.75, 1060 + gi);
    }
    // las gotas
    const nd = Math.round((fuerte ? 16 : 3) + (fuerte ? 20 : 3) * k);
    for (let j = 0; j < nd; j++) {
      // en abanico alrededor del rebote, disparadas: las grandes, pocas y cerca; las chicas, muchas y lejos
      const ang = base + (R() - 0.5) * (g.tipo === 'pila' ? 1.5 : 2.5); // la de dentro sale hacia arriba, no hacia él
      const v = (760 + 1500 * R()) * k;
      const rr = (3.5 + 13 * R() * R()) * (0.75 + 0.45 * k);
      const vuela = 0.1 + 0.2 * R();
      const sat = R();
      const tau = Math.min(u, vuela);
      const x = c0[0] + Math.cos(ang) * v * tau, y = c0[1] + Math.sin(ang) * v * tau + 0.5 * 2600 * tau * tau;
      if (u < vuela) {
        const vx = Math.cos(ang) * v, vy = Math.sin(ang) * v + 2600 * tau;
        gota(L.seca, x, y, rr * 1.2, 0.95, Math.atan2(vy, vx), 0.45, 890 + j);
        // la estela de la gota en el aire
        if (rr > 4) T(L, [[x, y], [x - vx * 0.035, y - vy * 0.035]], {w: rr * 1.5, tono: 0.85, seca: 0.45, perfil: 'clavo', semilla: 1100 + j, cerdas: 5});
      } else {
        gota(L.seca, x, y, rr, 0.92, sat * 6, 0.85, 890 + j);
        gota(L.mojada, x, y, rr * 1.4, 0.3, 0, 1, 940 + j);
        if (sat > 0.4) gota(L.seca, x - Math.cos(ang) * rr * 3, y - Math.sin(ang) * rr * 3, rr * 0.4, 0.85, 0, 1, 990 + j);
      }
    }
  });
};

// ---------------------------------------------------------------- las sombras en el suelo: aguadas grises que se corren
const enSuelo = (x: number, z: number, rx: number, rz: number, n = 26): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(proyecta([x + rx * Math.cos(a), SUELO, z + rz * Math.sin(a)]));
  }
  return out;
};
export const sombras = (L: Capas, b: Bola, inc: number) => {
  masa(L.mojada, enSuelo(PB.x + 52 + inc * 300, PB.z - 10, 186, 130), 0.2, 7, 1100);
  masa(L.mojada, enSuelo(SILLA.x + 30, SILLA.z, 168, 140), 0.17, 7, 1101);
  const alto = SUELO - R_BOLA - b.c[1];
  if (!b.dentro && alto < 420) {
    const k = 1 - alto / 420;
    masa(L.mojada, enSuelo(b.c[0] + 8, b.c[2], 54 * (0.6 + 0.4 * k), 40 * (0.6 + 0.4 * k), 18), 0.32 * k, 3, 1102);
  }
};
