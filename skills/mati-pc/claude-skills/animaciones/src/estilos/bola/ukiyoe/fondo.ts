import {clamp, mix, rng} from '../../../comun/curvas';
import {ALTO, MESA, MURO_X, PLACA, STUD, SUELO, Z_PARED} from '../escena';
import {bolaPapel, circulo, pintaCaja, pr} from './geometria';
import {H, Plancha, TINTA, W, bokashi, elipse, estampa, lienzo, poli, recta, rect, suave, talla, texturas, tiembla, type P} from './imprenta';

// EL GRABADO JAPONÉS, EL DECORADO FIJO. La misma oficina de los bloques, como un interior de estampa de Edo:
// la pared de yeso con su bokashi bajo la viga; a la izquierda, la ventana abierta con la persiana de bambú enrollada, un shoji
// corrido y el paisaje (el cielo en bokashi de azul de Prusia a melocotón, el Fuji con su nieve que baja en dedos, las bandas de
// niebla en papel, el mar a bandas y la rama de pino); a la derecha, el tokonoma con su rollo colgado (un ensō, el círculo de un
// trazo que no se cierra: como el aro que no se deja) y, en la tarima, un jarrón con una rama de ciruelo; arriba, el ranma con olas seigaiha y la viga; abajo,
// el tatami con sus ribetes negros; y su mesa de madera con la pantalla, la taza, los papeles y dos bolas de otros días.
// Se imprime una vez (por pestaña y resolución) y se guarda: así cada cuadro solo pinta lo que se mueve.

export const MARCO = {x0: 22, y0: 22, x1: 1058, y1: 1898};
export const PISO = pr(540, SUELO, Z_PARED)[1]; // la línea del suelo contra la pared del fondo (≈ 1437)
const ESQ = pr(MURO_X, SUELO, Z_PARED); // la esquina de la pared de la derecha
// el borde del suelo contra la pared de la derecha, hasta el borde de la estampa
const bordeDerecho = (): P => {
  const a = ESQ, b = pr(MURO_X, SUELO, 400);
  const k = (MARCO.x1 - a[0]) / (b[0] - a[0]);
  return [MARCO.x1, mix(a[1], b[1], k)];
};
const VIGA = {y0: 112, y1: 152};
const VENT = {x0: 40, y0: 226, x1: 428, y1: 722, ox0: 58, oy0: 244, ox1: 410, oy1: 702};
const TOKO = {x0: 616, x1: 990, y0: 212};
export const POSTE = {x0: 588, x1: 614};

// un rectángulo con el pulso de la mano
const rectT = (x0: number, y0: number, x1: number, y1: number, semilla: number, amp = 1): P[] =>
  tiembla([...recta([x0, y0], [x1, y0], 4).slice(0, 4), ...recta([x1, y0], [x1, y1], 4).slice(0, 4), ...recta([x1, y1], [x0, y1], 4).slice(0, 4),
    ...recta([x0, y1], [x0, y0], 4).slice(0, 4)], amp, semilla);

// ---------------------------------------------------------------- la ventana y su paisaje
const paisaje = (pl: Plancha) => {
  const {ox0, oy0, ox1, oy1} = VENT;
  const hueco = rect(ox0, oy0, ox1, oy1);
  pl.recorte = hueco;
  // el cielo: azul de Prusia arriba que se abre a un azul pálido y, en el horizonte, el melocotón del amanecer
  pl.degradado(hueco, bokashi(ox0, oy0 + 10, ox1, oy0 + 250, TINTA.prusia, TINTA.prusiaPP, 1, 0.9, {rugoso: 18, semilla: 4, curva: 0.8}), 'azul');
  pl.degradado(hueco, bokashi(ox0, oy0 + 230, ox1, oy0 + 360, TINTA.prusiaPP, TINTA.beniP, 0, 0.95, {rugoso: 14, semilla: 9}), 'rojo', false);
  // el monte: laderas cóncavas, la cumbre mellada (cráter) y la nieve que baja en dedos por las cárcavas
  const cx = 290, cimaY = 392, baseY = 616, izq = 70, der = 520;
  const ladera = (lado: -1 | 1, n = 16): P[] => {
    const ancho = lado < 0 ? cx - 22 - izq : der - (cx + 22);
    return Array.from({length: n + 1}, (_, k) => {
      const s = k / n;
      return [cx + lado * (22 + ancho * s), cimaY + (baseY - cimaY) * Math.pow(s, lado < 0 ? 1.55 : 1.75)] as P;
    });
  };
  const cumbre: P[] = [[cx - 22, cimaY], [cx - 11, cimaY - 6], [cx - 2, cimaY + 1], [cx + 9, cimaY - 7], [cx + 22, cimaY]];
  const monte: P[] = [...ladera(-1).reverse(), ...cumbre.slice(1, -1), ...ladera(1)];
  const montePath = poli([...monte, [der, baseY + 40], [izq, baseY + 40]]);
  pl.degradado(montePath, bokashi(ox0, cimaY - 10, ox1, baseY + 10, TINTA.prusia, TINTA.prusiaL, 1, 0.85, {rugoso: 10, semilla: 6}), 'azul');
  // la sombra del lado derecho, una banda de tinta más oscura (antes que la nieve: la nieve queda en papel)
  const sombra: P[] = [[cx + 22, cimaY], ...ladera(1, 12), [cx + 110, baseY], [cx + 40, cimaY + 70]];
  pl.tinta(suave(sombra, true), TINTA.prusiaO, 'azul', 0.55);
  // la nieve: el borde de abajo ondula y cuelga en dedos estrechos y afilados de largo distinto; el de arriba es el del monte
  const r = rng(77);
  const nx0 = cx - 92, nx1 = cx + 98;
  const yLad = (x: number) => {
    const lado = x < cx ? -1 : 1;
    const ancho = lado < 0 ? cx - 22 - izq : der - (cx + 22);
    const s = clamp((Math.abs(x - cx) - 22) / ancho);
    return cimaY + (baseY - cimaY) * Math.pow(s, lado < 0 ? 1.55 : 1.75);
  };
  // la línea de la nieve: ondula despacio entre dedo y dedo (nada de dientes: eso parece una corona); los dedos, estrechos y
  // afilados, de largo distinto, bajan por las cárcavas
  const baseN = (x: number) => cimaY + 34 + 9 * Math.sin((x - nx0) * 0.05) + 5 * Math.sin((x - nx0) * 0.13 + 1);
  const dedosX = [nx0 + 22, nx0 + 47, nx0 + 66, nx0 + 92, nx0 + 118, nx0 + 140, nx0 + 163];
  const nieve: P[] = [[nx0, yLad(nx0)]];
  let xPrev = nx0;
  for (const dx of dedosX) {
    // el tramo ondulado hasta el dedo
    for (let k = 1; k <= 3; k++) {
      const xx = mix(xPrev, dx - 5, k / 3);
      nieve.push([xx, Math.max(yLad(xx) + 3, baseN(xx))]);
    }
    const largo = 18 + r() * 46, w = 3.5 + r() * 3;
    nieve.push([dx - w * 0.4, Math.max(yLad(dx) + 3, baseN(dx) + largo * 0.45)], [dx + r() * 3, Math.max(yLad(dx) + 4, baseN(dx) + largo)],
      [dx + w, Math.max(yLad(dx + 5) + 3, baseN(dx + 5) + largo * 0.35)], [dx + 6, Math.max(yLad(dx + 6) + 3, baseN(dx + 6))]);
    xPrev = dx + 6;
  }
  for (let k = 1; k <= 3; k++) {
    const xx = mix(xPrev, nx1, k / 3);
    nieve.push([xx, Math.max(yLad(xx) + 2, baseN(xx))]);
  }
  nieve.push([nx1, yLad(nx1)], ...monte.filter(([x]) => x > nx0 && x < nx1).reverse());
  pl.papel(poli(nieve));
  // las bandas de niebla (suyari-gasumi): largas, redondeadas, en papel
  const kasumi = (x0: number, x1: number, y: number, h: number) => {
    const p = new Path2D();
    p.moveTo(x0 + h / 2, y - h / 2);
    p.lineTo(x1 - h / 2, y - h / 2);
    p.arc(x1 - h / 2, y, h / 2, -Math.PI / 2, Math.PI / 2);
    p.lineTo(x0 + h / 2, y + h / 2);
    p.arc(x0 + h / 2, y, h / 2, Math.PI / 2, Math.PI * 1.5);
    p.closePath();
    return p;
  };
  // (en papel, con un velo de azul muy pálido, y finas: si no, parecen barras)
  for (const [k0, k1, ky, kh] of [[ox0 - 40, 300, 560, 17], [250, ox1 + 60, 600, 14], [ox0 - 30, 210, 494, 11]] as [number, number, number, number][]) {
    pl.papel(kasumi(k0, k1, ky, kh));
    pl.tinte(kasumi(k0, k1, ky, kh), TINTA.prusiaPP, 'azul', 0.35);
  }
  // el mar a bandas, con crestas en papel
  const mar = rect(ox0, 612, ox1, oy1);
  pl.degradado(mar, bokashi(ox0, 610, ox1, oy1, TINTA.prusiaL, TINTA.prusiaO, 1, 1, {rugoso: 6, semilla: 12}), 'azul');
  for (let f = 0; f < 4; f++) {
    const y = 630 + f * 20;
    const paso = 34 - f * 2;
    for (let x = ox0 - 20 + (f % 2) * 16; x < ox1 + 20; x += paso) {
      const ola = new Path2D();
      ola.moveTo(x, y + 5);
      ola.quadraticCurveTo(x + paso * 0.3, y - 6, x + paso * 0.62, y + 1);
      ola.quadraticCurveTo(x + paso * 0.52, y - 1, x + paso * 0.46, y + 4);
      pl.papelTrazo(ola, 2.4 + f * 0.3);
    }
  }
  // dos pájaros lejos
  for (const [bx, by, s] of [[176, 318, 1], [204, 338, 0.8]] as [number, number, number][]) {
    const p = new Path2D();
    p.moveTo(bx - 12 * s, by - 3 * s);
    p.quadraticCurveTo(bx - 5 * s, by - 7 * s, bx, by + 1 * s);
    p.quadraticCurveTo(bx + 5 * s, by - 7 * s, bx + 12 * s, by - 4 * s);
    pl.raya(p, 2.4, TINTA.sumi);
  }
  // la rama de pino que entra por la derecha: el tronco tallado y las almohadillas de agujas, planas por arriba
  const rama: P[] = [[ox1 + 20, 590], [ox1 - 24, 576], [360, 556], [322, 552]];
  pl.tinta(talla(rama, 20, {afina: [0, 0.7], semilla: 5}), TINTA.maderaO, 'ocre');
  pl.negro(talla(rama.map(([x, y]) => [x, y - 9] as P), 3.4, {afina: [0.1, 0.6], semilla: 6}));
  pl.negro(talla(rama.map(([x, y]) => [x, y + 9] as P), 3.4, {afina: [0.1, 0.6], semilla: 7}));
  const almohadilla = (x: number, y: number, w: number, h: number, s: number) => {
    const p: P[] = [];
    for (let k = 0; k <= 18; k++) {
      const a = Math.PI + (k / 18) * Math.PI;
      p.push([x + Math.cos(a) * w, y + Math.sin(a) * h * 0.35]);
    }
    for (let k = 0; k <= 14; k++) {
      const u = k / 14;
      p.push([x + w - u * 2 * w, y + h * (0.55 + 0.25 * Math.sin(u * Math.PI)) + (k % 2 ? 4 : 0)]);
    }
    const path = poli(tiembla(p, 1.2, s));
    pl.tinta(path, TINTA.pino, 'verde');
    pl.raya(path, 2.6);
    // las agujas: abanicos de rayitas por debajo
    for (let k = 1; k < 9; k++) {
      const ax = x - w + (k / 9) * 2 * w, ay = y + h * 0.15;
      const ab = new Path2D();
      for (const g of [-0.5, 0, 0.5]) {
        ab.moveTo(ax, ay);
        ab.lineTo(ax + g * 10, ay + h * 0.6);
      }
      pl.raya(ab, 1.2, TINTA.sumi, 0.8);
    }
  };
  almohadilla(372, 548, 44, 24, 1);
  almohadilla(330, 540, 34, 20, 2);
  pl.recorte = null;
  // el shoji corrido a la izquierda: papel con su rejilla de listones
  const sx0 = ox0, sx1 = 156;
  pl.papel(rect(sx0, oy0, sx1, oy1));
  pl.tinta(rect(sx0, oy0, sx1, oy1), TINTA.yesoL, 'gris', 0.5);
  const rejilla = new Path2D();
  for (const x of [sx0 + 33, sx0 + 66]) {
    rejilla.moveTo(x, oy0);
    rejilla.lineTo(x, oy1);
  }
  for (let y = oy0 + 52; y < oy1; y += 52) {
    rejilla.moveTo(sx0, y);
    rejilla.lineTo(sx1, y);
  }
  pl.raya(rejilla, 2.6, TINTA.maderaO);
  pl.tinta(rect(sx1 - 7, oy0, sx1 + 3, oy1), TINTA.madera, 'ocre');
  pl.raya(poli(rectT(sx0, oy0, sx1 + 3, oy1, 4, 0.6)), 3);
  // la persiana de bambú enrollada arriba, con sus cordones
  const rollo = rect(ox0 - 4, oy0, ox1 + 4, oy0 + 34);
  pl.tinta(rollo, TINTA.paja, 'ocre');
  const tiras = new Path2D();
  for (let y = oy0 + 6; y < oy0 + 34; y += 6) {
    tiras.moveTo(ox0 - 4, y);
    tiras.lineTo(ox1 + 4, y);
  }
  pl.raya(tiras, 1.3, TINTA.maderaO, 0.8);
  pl.raya(poli(rectT(ox0 - 4, oy0, ox1 + 4, oy0 + 34, 5, 0.6)), 3);
  for (const x of [196, 360]) {
    const cordon = new Path2D();
    cordon.moveTo(x - 8, oy0 - 2);
    cordon.quadraticCurveTo(x, oy0 + 50, x + 8, oy0 - 2);
    pl.trazoTinta(cordon, 4, TINTA.beni, 'rojo');
    pl.raya(cordon, 1.2);
    const borla = poli([[x - 5, oy0 + 40], [x + 5, oy0 + 40], [x + 7, oy0 + 74], [x - 7, oy0 + 74]]);
    pl.tinta(borla, TINTA.beni, 'rojo');
    pl.raya(borla, 2);
  }
  // el marco de madera y el alféizar
  const marco = new Path2D();
  marco.addPath(poli(rectT(VENT.x0, VENT.y0, VENT.x1, VENT.y1, 6, 0.7)));
  marco.addPath(poli(rectT(ox0, oy0, ox1, oy1, 7, 0.5).reverse()));
  pl.tinta(marco, TINTA.madera, 'ocre');
  pl.raya(poli(rectT(VENT.x0, VENT.y0, VENT.x1, VENT.y1, 6, 0.7)), 4.2);
  pl.raya(poli(rectT(ox0, oy0, ox1, oy1, 7, 0.5)), 3.4);
  const alfeizar = rectT(VENT.x0 - 10, oy1 + 6, VENT.x1 + 10, VENT.y1 + 16, 8, 0.6);
  pl.tinta(poli(alfeizar), TINTA.maderaL, 'ocre');
  pl.raya(poli(alfeizar), 3.6);
};

// ---------------------------------------------------------------- el tokonoma: el rollo colgado y el jarrón
const tokonoma = (pl: Plancha, fuente: string) => {
  const {x0, x1, y0} = TOKO;
  pl.tinta(rect(x0, y0, x1, PISO), TINTA.yesoO, 'ocre');
  pl.degradado(rect(x0, y0, x1, PISO), bokashi(x0, y0, x1, y0 + 260, TINTA.maderaO, TINTA.yesoO, 0.32, 0, {rugoso: 16, semilla: 21}), 'gris', false);
  // la viga de arriba del hueco
  const viga = rectT(x0 - 6, y0 - 22, x1 + 6, y0, 9, 0.6);
  pl.tinta(poli(viga), TINTA.madera, 'ocre');
  pl.raya(poli(viga), 3.4);
  // el clavo, el cordón y el rollo colgado (largo, como son: casi hasta la tarima)
  const cx = 803;
  const cuerda = new Path2D();
  cuerda.moveTo(cx - 62, 248);
  cuerda.lineTo(cx, 214);
  cuerda.lineTo(cx + 62, 248);
  pl.raya(cuerda, 2.2);
  pl.negro(elipse(cx, 213, 5, 5));
  const rx0 = cx - 72, rx1 = cx + 72;
  const Y = {ten: 246, ich0: 312, pint0: 322, pint1: 960, ich1: 970, fin: 1040};
  const tela = rect(rx0, Y.ten, rx1, Y.fin);
  pl.tinta(tela, TINTA.prusia, 'azul');
  // el brocado: rombitos ocres
  const r = rng(31);
  for (let f = 0, y = Y.ten + 10; y < Y.fin - 4; f++, y += 13) {
    for (let x = rx0 + 6 + (f % 2) * 6; x < rx1 - 4; x += 12) {
      if (y > Y.ich0 - 4 && y < Y.ich1 + 4) continue;
      const q = 2.2 + r() * 0.6;
      pl.tinta(poli([[x, y - q], [x + q, y], [x, y + q], [x - q, y]]), TINTA.ocre, 'ocre', 0.85);
    }
  }
  // las tiras del ichimonji y el papel de la pintura
  pl.tinta(rect(rx0 + 10, Y.ich0, rx1 - 10, Y.ich1), TINTA.ocreL, 'ocre');
  pl.papel(rect(rx0 + 14, Y.pint0, rx1 - 14, Y.pint1));
  pl.tinta(rect(rx0 + 14, Y.pint0, rx1 - 14, Y.pint1), TINTA.yesoL, 'gris', 0.55);
  for (const x of [cx - 26, cx + 26]) {
    pl.tinta(rect(x - 5, Y.ten, x + 5, Y.ich0 + 6), TINTA.prusiaL, 'azul');
    pl.raya(rect(x - 5, Y.ten, x + 5, Y.ich0 + 6), 1.6);
  }
  // el ensō: un círculo de un trazo, grueso donde carga el pincel y abierto arriba a la derecha (como el aro que no se deja)
  const enso: P[] = Array.from({length: 26}, (_, k) => {
    const a = -1.05 - (k / 25) * 5.5;
    const rr = 54 + 3 * Math.sin(k * 0.9);
    return [cx - 4 + Math.cos(a) * rr, 470 + Math.sin(a) * rr];
  });
  pl.negro(talla(enso, 16, {afina: [0.04, 0.42], semilla: 11, temblor: 0.35, per: 4}));
  // la columna del refrán, de arriba abajo: 七転八起, «cae siete veces, se levanta ocho» (como él con la bola), y el sello
  [...'七転八起'].forEach((ch, k) => pl.letraNegra(ch, cx, 616 + k * 72, `400 62px ${fuente}`));
  pl.tinta(rect(cx - 13, 884, cx + 13, 910), TINTA.beni, 'rojo');
  pl.papel(rect(cx - 8, 889, cx - 3, 905));
  pl.papel(rect(cx + 2, 889, cx + 8, 895));
  pl.raya(poli(rectT(rx0, Y.ten, rx1, Y.fin, 12, 0.5)), 3);
  pl.raya(poli(rectT(rx0 + 10, Y.ich0, rx1 - 10, Y.ich1, 13, 0.4)), 2);
  // el palo de abajo, con sus cabezas
  pl.negro(rect(rx0 - 12, Y.fin - 2, rx1 + 12, Y.fin + 12));
  pl.negro(elipse(rx0 - 14, Y.fin + 5, 7, 9));
  pl.negro(elipse(rx1 + 14, Y.fin + 5, 7, 9));
  // la tarima del tokonoma, con su canto de laca
  const tarima = rectT(x0, PISO - 56, x1, PISO, 15, 0.5);
  pl.tinta(poli(tarima), TINTA.madera, 'ocre');
  pl.negro(rect(x0, PISO - 58, x1, PISO - 46));
  pl.raya(poli(tarima), 3.2);
  // en la tarima, a la derecha: un jarrón alto de celadón con una rama de ciruelo en flor
  const jx = 912, jy = PISO - 58;
  const jarron: P[] = [[jx - 22, jy], [jx - 34, jy - 40], [jx - 36, jy - 86], [jx - 20, jy - 118], [jx - 13, jy - 140], [jx - 18, jy - 154],
    [jx + 18, jy - 154], [jx + 13, jy - 140], [jx + 20, jy - 118], [jx + 36, jy - 86], [jx + 34, jy - 40], [jx + 22, jy]];
  pl.tinta(suave(jarron, true), TINTA.celadon, 'verde');
  pl.raya(suave(tiembla(jarron, 0.6, 3), true), 3.4);
  const ondas = new Path2D();
  for (const yq of [jy - 70, jy - 58]) {
    ondas.moveTo(jx - 34, yq);
    for (let k = 1; k <= 8; k++) ondas.lineTo(jx - 34 + k * 8.5, yq + (k % 2 ? -4 : 4));
  }
  pl.raya(ondas, 2, TINTA.pino);
  const rama: P[] = [[jx - 2, jy - 150], [jx - 14, jy - 230], [jx + 8, jy - 300], [jx - 6, jy - 360]];
  pl.negro(talla(rama, 7, {afina: [0.1, 0.6], semilla: 3}));
  pl.negro(talla([[jx - 10, jy - 220], [jx - 48, jy - 262], [jx - 62, jy - 300]], 4.6, {afina: [0.1, 0.7], semilla: 4}));
  pl.negro(talla([[jx + 6, jy - 290], [jx + 38, jy - 312], [jx + 44, jy - 340]], 4, {afina: [0.1, 0.7], semilla: 5}));
  for (const [fx, fy] of [[jx - 6, jy - 360], [jx - 62, jy - 300], [jx - 46, jy - 262], [jx + 44, jy - 340], [jx + 9, jy - 296], [jx - 14, jy - 232], [jx + 30, jy - 308]] as P[]) {
    const flor = new Path2D();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
      flor.moveTo(fx + Math.cos(a) * 5, fy + Math.sin(a) * 5);
      flor.arc(fx + Math.cos(a) * 5, fy + Math.sin(a) * 5, 4.6, 0, Math.PI * 2);
    }
    pl.tinta(flor, TINTA.beniP, 'rojo');
    pl.raya(flor, 1.3);
    pl.tinta(elipse(fx, fy, 2, 2), TINTA.beni, 'rojo');
  }
  pl.raya(poli(rectT(x0, y0, x1, PISO, 16, 0.6)), 3.4);
};

// ---------------------------------------------------------------- arriba: el techo, el ranma con olas y la viga
const arriba = (pl: Plancha) => {
  const {x0, x1} = MARCO;
  pl.tinta(rect(x0, 0, x1, 64), TINTA.maderaO, 'ocre');
  const tablas = new Path2D();
  for (let x = x0 + 40; x < x1; x += 92) {
    tablas.moveTo(x, 0);
    tablas.lineTo(x, 64);
  }
  pl.raya(tablas, 2.2);
  // el ranma: un panel calado con olas seigaiha
  const panel = rect(x0, 64, x1, VIGA.y0);
  pl.tinta(panel, TINTA.prusiaL, 'azul');
  pl.recorte = panel;
  const R = 22;
  for (let f = 0; f < 4; f++) {
    const y = 64 + f * 13 + 14;
    for (let x = x0 - R + (f % 2) * R; x < x1 + R; x += 2 * R) {
      for (const k of [1, 0.66, 0.33]) {
        const a = new Path2D();
        a.arc(x, y + R * 0.4, R * k, Math.PI, Math.PI * 2);
        pl.papelTrazo(a, 2.4);
      }
    }
  }
  pl.recorte = null;
  pl.raya(rect(x0, 64, x1, VIGA.y0), 3.4);
  // la viga (nageshi)
  const viga = rectT(x0 - 4, VIGA.y0, x1 + 4, VIGA.y1, 30, 0.6);
  pl.tinta(poli(viga), TINTA.madera, 'ocre');
  pl.tinta(rect(x0, VIGA.y1 - 9, x1, VIGA.y1), TINTA.maderaO, 'ocre');
  pl.raya(poli(viga), 4);
};

// ---------------------------------------------------------------- el suelo de tatami
const suelo = (pl: Plancha) => {
  const bd = bordeDerecho();
  const piso = poli([[MARCO.x0 - 10, PISO], [ESQ[0], PISO], bd, [MARCO.x1 + 10, MARCO.y1 + 10], [MARCO.x0 - 10, MARCO.y1 + 10]]);
  pl.recorte = piso;
  const filas = [Z_PARED, -120, 180, 480, 780, 1100];
  const r = rng(55);
  const tonos = [TINTA.tatami, TINTA.tatami2, TINTA.tatami3];
  const juntas = (k: number) => (k % 2 ? [-1500, -360, 240, 840, 2400] : [-1500, -660, -60, 540, 1140, 2400]);
  for (let k = 0; k < filas.length - 1; k++) {
    const za = filas[k], zb = filas[k + 1];
    const js = juntas(k);
    for (let j = 0; j < js.length - 1; j++) {
      const xa = js[j], xb = js[j + 1];
      const q = [pr(xa, SUELO, za), pr(xb, SUELO, za), pr(xb, SUELO, zb), pr(xa, SUELO, zb)];
      pl.tinta(poli(q), tonos[(k * 3 + j + Math.floor(r() * 2)) % 3], 'verde');
      // la trama de la paja: rayas finas a lo largo de la estera
      const trama = new Path2D();
      for (let z = za + 9; z < zb - 4; z += 9) {
        const a = pr(xa, SUELO, z), b = pr(xb, SUELO, z);
        trama.moveTo(a[0], a[1]);
        trama.lineTo(b[0], b[1]);
      }
      pl.trazoTinta(trama, 1.3, TINTA.tatamiO, 'verde', 0.55);
    }
    // las juntas de las cabeceras
    const jl = new Path2D();
    for (const x of js.slice(1, -1)) {
      const a = pr(x, SUELO, za), b = pr(x, SUELO, zb);
      jl.moveTo(a[0], a[1]);
      jl.lineTo(b[0], b[1]);
    }
    pl.raya(jl, 2.4);
  }
  // los ribetes negros (heri) en los cantos largos
  for (let k = 0; k < filas.length - 1; k++) {
    const z = filas[k];
    const za = k === 0 ? z : z - 14, zb = z + (k === 0 ? 22 : 14);
    const q = [pr(-1500, SUELO, za), pr(2400, SUELO, za), pr(2400, SUELO, zb), pr(-1500, SUELO, zb)];
    pl.negro(poli(q), TINTA.sumi, 0.94, true);
    const hilo = new Path2D();
    const a = pr(-1500, SUELO, (za + zb) / 2), b = pr(2400, SUELO, (za + zb) / 2);
    hilo.moveTo(a[0], a[1]);
    hilo.lineTo(b[0], b[1]);
    pl.trazoTinta(hilo, 1.2, TINTA.ocre, 'ocre', 0.7);
  }
  // el bokashi del suelo: más oscuro hacia delante (el borde de la estampa)
  pl.degradado(rect(MARCO.x0, 1700, MARCO.x1, MARCO.y1), bokashi(MARCO.x0, 1730, MARCO.x1, MARCO.y1, TINTA.maderaO, TINTA.maderaO, 0, 0.5, {rugoso: 26, semilla: 31, curva: 1.3}), 'gris', false);
  pl.recorte = null;
  pl.raya(poli([[MARCO.x0, PISO], [ESQ[0], PISO], bd], false), 3.4);
};

// ---------------------------------------------------------------- el primer plano, recortado por el marco (como en las estampas)
// abajo a la izquierda, un abanico abierto en el suelo con su sol rojo y sus olas; abajo a la derecha, la esquina de un cojín
// (zabuton) de índigo con su borla. Están lejos de por donde rueda la bola.
const primerPlano = (pl: Plancha) => {
  // el abanico: el pie en (90, suelo, 640), abierto hacia el fondo
  const piv: [number, number, number] = [96, SUELO, 650];
  const enAb = (rr: number, a: number) => pr(piv[0] + rr * Math.cos(a), SUELO - 2, piv[2] + rr * Math.sin(a));
  const a0 = -1.32, a1 = 0.62, r0 = 78, r1 = 236;
  const papelAb: P[] = [...Array.from({length: 25}, (_, k) => enAb(r1, mix(a0, a1, k / 24))), ...Array.from({length: 25}, (_, k) => enAb(r0, mix(a1, a0, k / 24)))];
  const pAb = poli(papelAb);
  pl.papel(pAb);
  pl.recorte = pAb;
  // su pintura: el cielo en bokashi, un sol bermellón y una banda de olas
  pl.tinta(pAb, TINTA.beniP, 'rojo', 0.55);
  const sol = enAb(170, -0.35);
  pl.tinta(elipse(sol[0], sol[1], 30, 22), TINTA.beni, 'rojo');
  const olas: P[] = [...Array.from({length: 25}, (_, k) => enAb(r0, mix(a0, a1, k / 24))), ...Array.from({length: 25}, (_, k) => enAb(132 + 8 * Math.sin(k * 1.3), mix(a1, a0, k / 24)))];
  pl.tinta(poli(olas), TINTA.prusia, 'azul');
  for (let k = 0; k < 9; k++) {
    const q = enAb(120, mix(a0, a1, (k + 0.5) / 9));
    const ola = new Path2D();
    ola.arc(q[0], q[1] + 6, 10, Math.PI * 1.05, Math.PI * 1.95);
    pl.papelTrazo(ola, 2.4);
  }
  pl.recorte = null;
  // las varillas
  const varillas = new Path2D();
  for (let k = 0; k <= 12; k++) {
    const a = mix(a0, a1, k / 12);
    const p0 = enAb(10, a), p1 = enAb(r1, a);
    varillas.moveTo(p0[0], p0[1]);
    varillas.lineTo(p1[0], p1[1]);
  }
  const palos: P[] = [enAb(0, 0), ...Array.from({length: 13}, (_, k) => enAb(r0, mix(a0, a1, k / 12)))];
  pl.tinta(poli(palos), TINTA.maderaP, 'ocre');
  pl.raya(varillas, 1.6);
  pl.raya(pAb, 3.6);
  pl.negro(elipse(...enAb(0, 0), 7, 5));
  // el cojín: la esquina de un zabuton de índigo con rombos en papel y una borla
  const cz = [1010, 0, 540] as const, ang = 0.22, lado = 165;
  const sup = (yy: number, desde: number, hasta: number, n = 48): P[] => Array.from({length: n + 1}, (_, k) => {
    const t = mix(desde, hasta, k / n);
    const c = Math.cos(t), si = Math.sin(t);
    const lx = lado * Math.sign(c) * Math.abs(c) ** 0.45, lz = lado * Math.sign(si) * Math.abs(si) ** 0.45;
    return pr(cz[0] + lx * Math.cos(ang) + lz * Math.sin(ang), yy, cz[2] - lx * Math.sin(ang) + lz * Math.cos(ang));
  });
  const arriba = sup(SUELO - 20, 0, Math.PI * 2, 96);
  const canto = poli([...sup(SUELO - 20, 0.2, Math.PI - 0.2), ...sup(SUELO - 2, Math.PI - 0.2, 0.2)]);
  pl.tinta(canto, TINTA.prusiaL, 'azul');
  pl.raya(canto, 3.4);
  const pCo = poli(arriba);
  pl.tinta(pCo, TINTA.prusia, 'azul');
  pl.recorte = pCo;
  const rombos = new Path2D();
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    const lx = i * 42 + (j % 2 ? 21 : 0), lz = j * 42;
    const q = pr(cz[0] + lx * Math.cos(ang) + lz * Math.sin(ang), SUELO - 20, cz[2] - lx * Math.sin(ang) + lz * Math.cos(ang));
    rombos.moveTo(q[0], q[1] - 7);
    rombos.lineTo(q[0] + 9, q[1]);
    rombos.lineTo(q[0], q[1] + 7);
    rombos.lineTo(q[0] - 9, q[1]);
    rombos.closePath();
  }
  pl.papel(rombos);
  pl.recorte = null;
  pl.raya(suave(tiembla(arriba, 0.8, 9), true), 3.8);
  const esquina = sup(SUELO - 20, Math.PI * 1.02, Math.PI * 1.02, 0)[0];
  const borla = poli([[esquina[0] - 6, esquina[1]], [esquina[0] + 6, esquina[1]], [esquina[0] + 12, esquina[1] + 44], [esquina[0] - 12, esquina[1] + 44]]);
  pl.tinta(borla, TINTA.beni, 'rojo');
  pl.raya(borla, 2.2);
};

// ---------------------------------------------------------------- la mesa y lo de encima
const mesa = (pl: Plancha) => {
  const top = SUELO - MESA.alto;
  const grueso = PLACA * 1.5;
  const madera = {arriba: TINTA.maderaP, frente: TINTA.madera, lado: TINTA.maderaO};
  for (const z of [MESA.z0 + 30, MESA.z1 - 30]) {
    for (const x of [MESA.x0 + 30, MESA.x1 - 30]) {
      const alto = MESA.alto - grueso;
      pintaCaja(pl, [x, SUELO - alto / 2, z], [44, alto, 44], madera, 'ocre', {linea: 3, semilla: x + z});
    }
  }
  pintaCaja(pl, [(MESA.x0 + MESA.x1) / 2, top + grueso / 2, (MESA.z0 + MESA.z1) / 2], [MESA.x1 - MESA.x0, grueso, MESA.z1 - MESA.z0], madera, 'ocre', {linea: 4.2, semilla: 3});
  // la pantalla: pie, cuello y la caja lacada en negro, girada hacia él; dentro, olas seigaiha en bokashi
  const piv: [number, number, number] = [40, top, -170];
  const negro = {arriba: TINTA.sumiL, frente: TINTA.sumi, lado: '#36312c'};
  pintaCaja(pl, [40, top - PLACA / 2, -170], [128, PLACA, 110], negro, 'gris', {giro: 0.45, piv, negro: true, linea: 2.4});
  pintaCaja(pl, [40, top - PLACA - (ALTO * 1.1) / 2, -170], [52, ALTO * 1.1, 40], negro, 'gris', {giro: 0.45, piv, negro: true, linea: 2.4});
  const yc = top - (PLACA + ALTO * 1.05 + 1.5 * ALTO);
  pintaCaja(pl, [40, yc, -170 + 12], [4 * STUD, 3 * ALTO, 30], negro, 'gris', {giro: 0.45, piv, negro: true, linea: 3});
  // la cara de la pantalla
  const cara = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
    const a = 0.45, lx = sx * (4 * STUD - 28) / 2, lz = 12 + 16;
    const dx = lx * Math.cos(a) + lz * Math.sin(a), dz = -lx * Math.sin(a) + lz * Math.cos(a);
    return pr(40 + dx, yc + (sy * (3 * ALTO - 26)) / 2, -170 + dz);
  });
  const pantalla = poli(cara);
  const ys = cara.map((q) => q[1]);
  const pg = pl.cC.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
  pg.addColorStop(0, TINTA.prusiaL);
  pg.addColorStop(1, TINTA.prusiaPP);
  pl.tinta(pantalla, pg, 'azul');
  pl.recorte = pantalla;
  const xs = cara.map((q) => q[0]);
  const R = 15;
  for (let f = 0; f < 4; f++) {
    const y = Math.max(...ys) - 8 - f * 16;
    for (let x = Math.min(...xs) - R + (f % 2) * R; x < Math.max(...xs) + R; x += 2 * R) {
      for (const k of [1, 0.6]) {
        const a = new Path2D();
        a.arc(x, y, R * k, Math.PI, Math.PI * 2);
        pl.papelTrazo(a, 1.8);
      }
    }
  }
  pl.recorte = null;
  pl.raya(pantalla, 2.4);
  // los papeles apilados
  for (let k = 0; k < 3; k++) {
    const cx = 150 + k * 3, cz = -190 + k * 4, y = top - 2 - k * 5, a = 0.08 * (k - 1);
    const q = [[-75, -55], [75, -55], [75, 55], [-75, 55]].map(([lx, lz]) => pr(cx + lx * Math.cos(a) + lz * Math.sin(a), y, cz - lx * Math.sin(a) + lz * Math.cos(a)));
    pl.papel(poli(q));
    pl.raya(poli(q), 2.2);
  }
  // la taza (un yunomi de celadón, sin asa) con su té
  const tx = 205, tz = -80, tr = 28, th = ALTO * 0.95;
  const boca = circulo(tx, top - th, tz, tr, 32);
  const frente = [...circulo(tx, top - th, tz, tr, 16, 0, Math.PI), ...circulo(tx, top, tz, tr * 0.86, 16, Math.PI, 0)];
  pl.tinta(poli(frente), TINTA.celadon, 'verde');
  pl.raya(poli(frente), 3);
  pl.tinta(poli(boca), TINTA.verdeO, 'verde');
  pl.raya(poli(boca), 2.4);
  // dos bolas de otros días
  bolaPapel(pl, pr(-10, top - 36, -90), 34 * 0.98, 0.6, 3, undefined, 3.6);
  bolaPapel(pl, pr(60, top - 34, -60), 32 * 0.99, 2.2, 5, undefined, 3.6);
};

// ---------------------------------------------------------------- la estampa entera del decorado
const pintaDecorado = (pl: Plancha, fuente: string) => {
  const {x0, x1} = MARCO;
  // la pared de yeso, con su bokashi bajo la viga
  const pared = rect(x0, VIGA.y1 - 4, x1, PISO);
  pl.tinta(pared, TINTA.yeso, 'ocre');
  pl.degradado(pared, bokashi(x0, VIGA.y1, x1, VIGA.y1 + 520, TINTA.maderaO, TINTA.yeso, 0.55, 0, {rugoso: 26, semilla: 2, curva: 0.8}), 'gris', false);
  tokonoma(pl, fuente);
  // la pared de la derecha (la del fallo 2), de un yeso más oscuro
  const bd = bordeDerecho();
  const lado = poli([[ESQ[0], VIGA.y1], [x1 + 10, VIGA.y1], [x1 + 10, bd[1]], bd, [ESQ[0], PISO]]);
  pl.tinta(lado, TINTA.yesoO, 'ocre');
  pl.tinta(lado, TINTA.maderaO, 'gris', 0.18);
  paisaje(pl);
  // los pilares
  const pilar = (a: number, b: number, s: number) => {
    const p = rectT(a, VIGA.y1, b, PISO + 2, s, 0.5);
    pl.tinta(poli(p), TINTA.madera, 'ocre');
    pl.tinta(rect(b - 7, VIGA.y1, b, PISO), TINTA.maderaO, 'ocre');
    pl.raya(poli(p), 3.6);
  };
  pilar(POSTE.x0, POSTE.x1, 40);
  pilar(ESQ[0] - 14, ESQ[0] + 12, 41);
  arriba(pl);
  suelo(pl);
  primerPlano(pl);
  mesa(pl);
};

// el decorado ya estampado, sobre su papel (uno por resolución)
const CACHE = new Map<string, HTMLCanvasElement>();
export const decorado = (dpr: number, fuente: string) => {
  const ya = CACHE.get(`${dpr}|${fuente}`);
  if (ya) return ya;
  const tx = texturas();
  const c = lienzo(W * dpr, H * dpr);
  const x = c.getContext('2d')!;
  x.drawImage(tx.papel, 0, 0, W * dpr, H * dpr);
  const pl = new Plancha(dpr);
  pintaDecorado(pl, fuente);
  x.save();
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.beginPath();
  x.rect(MARCO.x0, MARCO.y0, MARCO.x1 - MARCO.x0, MARCO.y1 - MARCO.y0);
  x.clip();
  x.setTransform(1, 0, 0, 1, 0, 0);
  estampa(x, pl, {veta: 0.15, baren: 0.32, motas: 0.3, motasLinea: 0.12, papelDebajo: false});
  x.restore();
  CACHE.set(`${dpr}|${fuente}`, c);
  return c;
};
