import {clamp, rng} from '../../../comun/curvas';
import {ALTO, LAMPARA, MESA, MURO_X, PAPELERA, PLACA, STUD, SUELO, Z_PARED, escalaEn, proyecta, type P, type V3} from '../escena';
import {caja, camino, cilindro, esfera, gris, nor, poli, ry, sombra, type Marco, enMarco, ejeMarco} from './geometria';

// CINE MUDO, EL DECORADO: la oficina de los bloques (BloquesDecorado.tsx), con todo en su sitio y sus
// medidas, pero de los años 20 y sin nada de juguete: la pared con papel pintado art déco suave (finas rayas dobles y un abanico
// pequeño, apenas marcado) y su zócalo de madera con plafones; la otra pared, de yeso en sombra; el suelo de tablones; la ventana
// con los tejados de la ciudad; el cartel de la diana; la balda con sus libros; la mesa; la lámpara que cuelga; y la papelera de
// chapa (un cubo de metal con dos nervios y el borde enrollado).
// Los planos: el fondo, más oscuro y liso (el rayado solo cae en sus sombras grandes); lo de
// delante (la lámpara, la papelera, el muñeco y su silla) va claro, sin rayado y con contorno grueso: se pinta en su propio lienzo
// (pintura.ts) y su silueta le dice al paso de dibujo qué va limpio.
// Coordenadas de la pantalla (y hacia abajo) y z hacia la cámara, como en escena.ts.

const zF = Z_PARED;
const filaY = (k: number) => SUELO - (k + 1) * ALTO; // las medidas de la ventana salen de las filas de ladrillo de los bloques
const VENTANA = {x0: 0, x1: 6 * STUD, fila0: 11, fila1: 16};
const yV0 = filaY(VENTANA.fila1), yV1 = filaY(VENTANA.fila0 - 1); // arriba y abajo del hueco
const Y_ZOCALO = SUELO - 3.2 * ALTO; // arriba del zócalo (en el plano de la pared)

// para pintar lo que es plano en un z fijo (la pared, el cartel): las medidas del mundo en ese plano, ya en la pantalla
const enPlano = (ctx: CanvasRenderingContext2D, z: number) => {
  const s = escalaEn(z);
  ctx.translate(540, 300);
  ctx.scale(s, s);
  ctx.translate(-540, -300);
};
const EJES: [V3, V3, V3] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

// ---------------------------------------------------------------- la pared del fondo, la ventana, el cartel y la balda
const PAPEL = 0.36; // el papel pintado
export const pared = (ctx: CanvasRenderingContext2D, bombilla: P, luzBombilla: number) => {
  ctx.save();
  enPlano(ctx, zF);
  ctx.fillStyle = gris(PAPEL);
  ctx.fillRect(-700, -500, 2500, SUELO + 520);
  // el papel pintado: rayas dobles finas cada 128 px y, entre ellas, un abanico pequeño al tresbolillo (apenas marcado)
  ctx.strokeStyle = gris(PAPEL - 0.1);
  ctx.lineWidth = 2;
  for (let x = -640; x < 1700; x += 128) {
    for (const dx of [0, 9]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, -500);
      ctx.lineTo(x + dx, Y_ZOCALO);
      ctx.stroke();
    }
  }
  ctx.fillStyle = gris(PAPEL - 0.08);
  for (let fila = 0; fila < 14; fila++) {
    const y = -420 + fila * 150;
    if (y > Y_ZOCALO - 60) break;
    for (let x = -640 + 68 + (fila % 2) * 64; x < 1700; x += 128) {
      // el abanico: medio círculo y cuatro rayos
      ctx.beginPath();
      ctx.arc(x, y, 18, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.stroke();
      for (let r = 1; r < 4; r++) {
        const a = Math.PI + (r * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18);
        ctx.stroke();
      }
    }
  }
  // el zócalo de madera: más oscuro, con su moldura arriba y sus plafones
  ctx.fillStyle = gris(0.28);
  ctx.fillRect(-700, Y_ZOCALO, 2500, SUELO - Y_ZOCALO + 10);
  ctx.fillStyle = gris(0.5);
  ctx.fillRect(-700, Y_ZOCALO - 14, 2500, 10);
  ctx.fillStyle = gris(0.22);
  ctx.fillRect(-700, Y_ZOCALO - 4, 2500, 6);
  for (let x = -640; x < 1700; x += 230) {
    const y0 = Y_ZOCALO + 34, h = SUELO - Y_ZOCALO - 74;
    ctx.fillStyle = gris(0.32);
    ctx.fillRect(x, y0, 190, h);
    ctx.fillStyle = gris(0.4);
    ctx.fillRect(x, y0, 190, 5);
    ctx.fillStyle = gris(0.24);
    ctx.fillRect(x, y0 + h - 5, 190, 5);
  }

  // la ventana: el cielo (claro, pero no blanco: lo más blanco es la bola) y los tejados de la ciudad
  ctx.save();
  ctx.beginPath();
  ctx.rect(VENTANA.x0, yV0, VENTANA.x1 - VENTANA.x0, yV1 - yV0);
  ctx.clip();
  const cielo = ctx.createLinearGradient(0, yV0, 0, yV1);
  cielo.addColorStop(0, gris(0.64));
  cielo.addColorStop(1, gris(0.76));
  ctx.fillStyle = cielo;
  ctx.fillRect(VENTANA.x0 - 10, yV0 - 10, VENTANA.x1 + 20, yV1 - yV0 + 20);
  for (const [cx, cy, s] of [[90, 300, 1], [300, 250, 0.8]]) {
    for (const [bx, by, br] of [[-46, 8, 34], [-10, -8, 44], [30, 4, 36], [62, 12, 24]]) {
      esfera(ctx, [cx + bx * s, cy + by * s, zF], br * s, 0.74, 0);
    }
  }
  const tejados: [number, number, number][] = [[-20, 600, 0], [70, 560, 1], [150, 610, 0], [215, 540, 1], [300, 590, 0], [360, 620, 1]];
  tejados.forEach(([x, y, dos], k) => {
    const w = k === tejados.length - 1 ? 60 : tejados[k + 1][0] - x;
    const t = 0.2 + (k % 2) * 0.06;
    ctx.fillStyle = gris(t);
    ctx.beginPath();
    if (dos) {
      ctx.moveTo(x, yV1 + 10); ctx.lineTo(x, y + 30); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w, y + 30); ctx.lineTo(x + w, yV1 + 10);
    } else {
      ctx.moveTo(x, yV1 + 10); ctx.lineTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, yV1 + 10);
    }
    ctx.closePath();
    ctx.fill();
    if (k % 2 === 0) {
      const cx = x + w * 0.62;
      ctx.fillRect(cx, y - 46, 22, 50);
      ctx.fillRect(cx - 4, y - 52, 30, 8);
    }
    ctx.fillStyle = gris(0.5);
    for (let f = 0; f < 3; f++) {
      if ((k + f) % 2) continue;
      ctx.fillRect(x + 12 + f * 22, y + 50 + (f % 2) * 34, 12, 18);
    }
  });
  ctx.restore();
  ctx.restore();

  // el marco de la ventana (gris medio, para que la bola no se pierda contra él) y el alféizar
  const xc = (VENTANA.x0 + VENTANA.x1) / 2;
  const marco = 0.56;
  caja(ctx, [xc, yV0 - 4, zF + 10], EJES, [212, 20, 35], marco);
  for (const x of [VENTANA.x0, VENTANA.x1]) caja(ctx, [x, (yV0 + yV1) / 2, zF + 10], EJES, [18, (yV1 - yV0 + 30) / 2, 35], marco);
  caja(ctx, [xc, (yV0 + yV1) / 2, zF - 20], EJES, [11, (yV1 - yV0) / 2, 20], marco - 0.06);
  caja(ctx, [xc, yV0 + (yV1 - yV0) * 0.45, zF - 20], EJES, [(VENTANA.x1 - VENTANA.x0) / 2, 11, 20], marco - 0.06);
  caja(ctx, [xc, yV1 + 14, zF + 30], EJES, [227, 17, 55], marco);
  cilindro(ctx, [300, yV1 - 3, zF + 50], [0, -1, 0], 30, 52, 0.42, {n: 20});
  for (const [a, l] of [[-0.4, 70], [0, 92], [0.45, 66]]) {
    cilindro(ctx, [300, yV1 - 3 - 45, zF + 50], nor([Math.sin(a), -Math.cos(a), 0]), 12, l, 0.3, {n: 12});
  }

  // el cartel: la diana (lo que él quiere y no le sale), en grises apagados
  caja(ctx, [808, 412, zF + 6], EJES, [135, 180, 5], 0.6, {borde: 0.5});
  ctx.save();
  enPlano(ctx, zF + 11.5);
  const X0 = 808 - 125, Y0 = 412 - 170, k = 250 / 256;
  ctx.fillStyle = gris(0.66);
  ctx.fillRect(X0, Y0, 250, 340);
  const [dcx, dcy] = [X0 + 128 * k, Y0 + 150 * k];
  [0.14, 0.7, 0.14, 0.7, 0.14].forEach((t, i) => {
    ctx.fillStyle = gris(t);
    ctx.beginPath();
    ctx.arc(dcx, dcy, (104 - i * 21) * k, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.strokeStyle = gris(0.06);
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(X0 + 170 * k, Y0 + 108 * k);
  ctx.lineTo(X0 + 232 * k, Y0 + 52 * k);
  ctx.stroke();
  ctx.fillStyle = gris(0.2);
  ctx.beginPath();
  ctx.moveTo(X0 + 232 * k, Y0 + 52 * k);
  ctx.lineTo(X0 + 252 * k, Y0 + 28 * k);
  ctx.lineTo(X0 + 220 * k, Y0 + 38 * k);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = gris(0.1);
  ctx.fillRect(X0 + 40 * k, Y0 + 282 * k, 176 * k, 16 * k);
  ctx.fillRect(X0 + 70 * k, Y0 + 308 * k, 116 * k, 12 * k);
  ctx.restore();

  // la balda con sus libros (lomos lisos)
  caja(ctx, [820, 830 - PLACA / 2, zF + 70], EJES, [192, PLACA / 2, 64], 0.56);
  [0.26, 0.6, 0.34, 0.22, 0.5].forEach((t, i) => {
    const alto = ALTO * (1.6 + (i % 3) * 0.3);
    const pie: V3 = [680 + i * 60, 830 - PLACA, zF + 70];
    if (i === 4) {
      const a = 0.35;
      const ux: V3 = [Math.cos(a), Math.sin(a), 0], uy: V3 = [Math.sin(a), -Math.cos(a), 0];
      caja(ctx, [pie[0] + (uy[0] * alto) / 2, pie[1] + (uy[1] * alto) / 2, pie[2]], [ux, uy, [0, 0, 1]], [30, alto / 2, 62], t);
    } else {
      caja(ctx, [pie[0], pie[1] - alto / 2, pie[2]], EJES, [30, alto / 2, 62], t);
    }
  });

  // la luz: el charco de la bombilla en la pared (se mueve con la lámpara) y los rincones oscuros
  const [bx, by] = bombilla;
  const charco = ctx.createRadialGradient(bx, by + 30, 20, bx, by + 30, 460);
  charco.addColorStop(0, `rgba(255,255,255,${0.24 * luzBombilla})`);
  charco.addColorStop(0.4, `rgba(255,255,255,${0.09 * luzBombilla})`);
  charco.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = charco;
  ctx.fillRect(0, 0, 1080, 1500);
  const rincon = ctx.createRadialGradient(560, 800, 320, 560, 800, 1150);
  rincon.addColorStop(0, 'rgba(0,0,0,0)');
  rincon.addColorStop(1, `rgba(0,0,0,${0.5 + 0.1 * (1 - luzBombilla)})`);
  ctx.fillStyle = rincon;
  ctx.fillRect(0, 0, 1080, 1500);
};

// ---------------------------------------------------------------- la pared de la derecha: yeso en sombra, con su zócalo
export const paredDerecha = (ctx: CanvasRenderingContext2D) => {
  const z0 = zF, z1 = 260;
  const pt = (y: number, z: number) => proyecta([MURO_X, y, z]);
  poli(ctx, [pt(-500, z0), pt(-500, z1), pt(SUELO, z1), pt(SUELO, z0)], gris(0.24));
  poli(ctx, [pt(Y_ZOCALO, z0), pt(Y_ZOCALO, z1), pt(SUELO, z1), pt(SUELO, z0)], gris(0.18));
  camino(ctx, [pt(Y_ZOCALO - 10, z0), pt(Y_ZOCALO - 10, z1)], false);
  ctx.strokeStyle = gris(0.36);
  ctx.lineWidth = 8;
  ctx.stroke();
  camino(ctx, [pt(-500, z0), pt(SUELO, z0)], false);
  ctx.strokeStyle = gris(0.06);
  ctx.lineWidth = 5;
  ctx.stroke();
};

// ---------------------------------------------------------------- el suelo de tablones, en perspectiva
export const suelo = (ctx: CanvasRenderingContext2D, bombilla: P) => {
  const R = rng(77);
  const z0 = zF, z1 = 1100;
  const pt = (x: number, z: number) => proyecta([x, SUELO, z]);
  const ANCHO = 96;
  for (let x = -12 * STUD; x < MURO_X; x += ANCHO) {
    const x1 = Math.min(MURO_X, x + ANCHO);
    const t = 0.38 + R() * 0.05;
    let z = z0 - R() * 600;
    while (z < z1) {
      const largo = 520 + R() * 380;
      const za = Math.max(z0, z), zb = Math.min(z1, z + largo);
      if (zb > za) {
        const tt = t + (R() - 0.5) * 0.04;
        poli(ctx, [pt(x + 2, za + 2), pt(x1 - 2, za + 2), pt(x1 - 2, zb - 2), pt(x + 2, zb - 2)], gris(tt));
        ctx.strokeStyle = gris(tt - 0.07);
        ctx.lineWidth = 1.4;
        const xv = x + 30 + R() * 30;
        const pts: P[] = [];
        for (let s = 0; s <= 8; s++) {
          const zz = za + ((zb - za) * s) / 8;
          pts.push(pt(xv + Math.sin(zz * 0.012 + x) * 5, zz));
        }
        camino(ctx, pts, false);
        ctx.stroke();
      }
      z += largo;
    }
  }
  ctx.strokeStyle = gris(0.14);
  ctx.lineWidth = 2.6;
  for (let x = -12 * STUD; x <= MURO_X; x += ANCHO) {
    camino(ctx, [pt(x, z0), pt(x, z1)], false);
    ctx.stroke();
  }
  // el rodapié
  poli(ctx, [pt(-900, z0), pt(MURO_X, z0), proyecta([MURO_X, SUELO - 40, z0]), proyecta([-900, SUELO - 40, z0])], gris(0.22), gris(0.1), 2.5);
  // la luz: el charco bajo la lámpara y el suelo que se oscurece hacia delante
  const c = proyecta([bombilla[0], SUELO, 0]);
  ctx.save();
  ctx.translate(c[0], c[1]);
  ctx.scale(1, 0.32);
  const g = ctx.createRadialGradient(0, 0, 30, 0, 0, 760);
  g.addColorStop(0, 'rgba(255,255,255,0.16)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-1600, -2400, 3200, 4800);
  ctx.restore();
  const del = ctx.createLinearGradient(0, pt(0, 150)[1], 0, 1920);
  del.addColorStop(0, 'rgba(0,0,0,0)');
  del.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = del;
  ctx.fillRect(0, pt(0, 150)[1], 1080, 1920);
};

// ---------------------------------------------------------------- la mesa, su pantalla, la taza, los papeles y dos bolas viejas
export const mesa = (ctx: CanvasRenderingContext2D, bolaVieja: (c: V3, r: number, semilla: number) => void) => {
  const top = SUELO - MESA.alto;
  const grueso = PLACA * 1.5;
  const cx = (MESA.x0 + MESA.x1) / 2, cz = (MESA.z0 + MESA.z1) / 2;
  for (const x of [MESA.x0 + 30, MESA.x1 - 30]) for (const z of [MESA.z0 + 30, MESA.z1 - 30]) sombra(ctx, proyecta([x + 10, SUELO, z]), 70, 22, 0.45);
  for (const x of [MESA.x0 + 30, MESA.x1 - 30]) for (const z of [MESA.z0 + 30, MESA.z1 - 30]) {
    caja(ctx, [x, SUELO - (MESA.alto - grueso) / 2, z], EJES, [22, (MESA.alto - grueso) / 2, 22], 0.3);
  }
  caja(ctx, [cx, top + grueso / 2, cz], EJES, [160, grueso / 2, 96], 0.32);
  const mon: Marco = {o: [40, -top, -170], m: ry(0.45), s: 1};
  const ej: [V3, V3, V3] = [ejeMarco(mon, [1, 0, 0]), ejeMarco(mon, [0, 1, 0]), ejeMarco(mon, [0, 0, 1])];
  caja(ctx, enMarco(mon, [0, PLACA / 2, 0]), ej, [64, PLACA / 2, 64], 0.14);
  caja(ctx, enMarco(mon, [0, PLACA + ALTO * 0.55, 0]), ej, [32, ALTO * 0.55, 32], 0.14);
  const yP = PLACA + ALTO * 1.05 + 1.5 * ALTO;
  caja(ctx, enMarco(mon, [0, yP, 12]), ej, [128, 115, 15], 0.12);
  caja(ctx, enMarco(mon, [0, yP, 28]), ej, [115, 102, 2], 0.5, {borde: 0.3, grueso: 2});
  cilindro(ctx, [205, top, -80], [0, -1, 0], 28, ALTO * 0.95, 0.24, {tapa: 0.1});
  for (let k = 0; k < 3; k++) {
    const a = 0.08 * (k - 1);
    caja(ctx, [150 + k * 3, top - 4 - k * 7, -190 + k * 4], [[Math.cos(a), 0, -Math.sin(a)], [0, 1, 0], [Math.sin(a), 0, Math.cos(a)]], [75, 3.5, 55], 0.62, {borde: 0.5, grueso: 1.8});
  }
  bolaVieja([-10, top - 34, -90], 34, 21);
  bolaVieja([60, top - 32, -60], 32, 22);
};

// ---------------------------------------------------------------- la lámpara que cuelga (gira desde su gancho) y su luz
export const posBombilla = (ang: number): P => {
  const d = LAMPARA.largo + LAMPARA.alto / 2 + 14;
  return [LAMPARA.x + d * Math.sin(ang), LAMPARA.yGancho + d * Math.cos(ang)];
};
export const conoDeLuz = (ctx: CanvasRenderingContext2D, ang: number, luzBombilla: number) => {
  if (luzBombilla <= 0.01) return;
  const L = LAMPARA;
  ctx.save();
  ctx.translate(L.x, L.yGancho);
  ctx.rotate(-ang);
  const y0 = L.largo + L.alto / 2;
  const g = ctx.createLinearGradient(0, y0, 0, y0 + 760);
  g.addColorStop(0, `rgba(255,255,255,${0.12 * luzBombilla})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-L.rAbajo + 6, y0);
  ctx.lineTo(L.rAbajo - 6, y0);
  ctx.lineTo(L.rAbajo + 330, y0 + 760);
  ctx.lineTo(-L.rAbajo - 330, y0 + 760);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};
// la lámpara; con «estela», dos copias tenues en los ángulos de antes (se ve que se mueve)
export const lampara = (ctx: CanvasRenderingContext2D, ang: number, luzBombilla: number, estela: number[] = []) => {
  const L = LAMPARA;
  const una = (a: number, alfa: number) => {
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.translate(L.x, L.yGancho);
    ctx.rotate(-a);
    ctx.strokeStyle = gris(0.06);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, L.largo - L.alto / 2);
    ctx.stroke();
    const yc = L.largo;
    const yb = yc + L.alto / 2 + 14;
    const brillo = clamp(luzBombilla);
    ctx.beginPath();
    ctx.arc(0, yb, 27, 0, Math.PI * 2);
    ctx.fillStyle = gris(0.4 + 0.42 * brillo);
    ctx.fill();
    ctx.strokeStyle = gris(0.1);
    ctx.lineWidth = 3;
    ctx.stroke();
    const g = ctx.createLinearGradient(-L.rAbajo, 0, L.rAbajo, 0);
    g.addColorStop(0, gris(0.74));
    g.addColorStop(0.45, gris(0.6));
    g.addColorStop(1, gris(0.36));
    ctx.beginPath();
    ctx.moveTo(-L.rArriba, yc - L.alto / 2);
    ctx.lineTo(L.rArriba, yc - L.alto / 2);
    ctx.lineTo(L.rAbajo, yc + L.alto / 2);
    ctx.ellipse(0, yc + L.alto / 2, L.rAbajo, 9, 0, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = gris(0.06);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, yc + L.alto / 2, L.rAbajo - 3, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = gris(0.36 + 0.4 * brillo);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = gris(0.4);
    ctx.fillRect(-20, yc - L.alto / 2 - 22, 40, 24);
    ctx.strokeRect(-20, yc - L.alto / 2 - 22, 40, 24);
    ctx.restore();
  };
  estela.forEach((a, k) => una(a, 0.22 / (k + 1)));
  una(ang, 1);
};

// ---------------------------------------------------------------- la papelera de chapa: el fondo (lo de dentro y el borde de atrás) y el frente
const PB = PAPELERA;
const anilloXY = (r: number, y: number, a0: number, a1: number, n = 40): P[] =>
  Array.from({length: n + 1}, (_, k) => {
    const a = a0 + ((a1 - a0) * k) / n;
    return proyecta([PB.x + r * Math.cos(a), y, PB.z + r * Math.sin(a)]);
  });
const R_FUERA = PB.rBorde + PB.tubo + 2; // el borde enrollado, por fuera
const R_DENTRO = PB.rBorde - PB.tubo - 2;
const Y_ARO_ARRIBA = PB.yBorde - PB.tubo;
const Y_ARO_ABAJO = PB.yBorde + PB.tubo;

// gira la papelera desde su base (como en escena.ts: + = se va a la derecha)
export const conPapelera = (ctx: CanvasRenderingContext2D, inclina: number, pinta: () => void) => {
  const b = proyecta([PB.x, SUELO, PB.z]);
  ctx.save();
  ctx.translate(b[0], b[1]);
  ctx.rotate(inclina);
  ctx.translate(-b[0], -b[1]);
  pinta();
  ctx.restore();
};

export const sombraPapelera = (ctx: CanvasRenderingContext2D) => {
  sombra(ctx, proyecta([PB.x + 30, SUELO, PB.z + 10]), PB.rBase * 1.75, PB.rBase * 0.5, 0.62);
};

export const papeleraFondo = (ctx: CanvasRenderingContext2D) => {
  const boca = anilloXY(R_DENTRO, Y_ARO_ARRIBA, 0, Math.PI * 2, 56);
  camino(ctx, boca);
  const c = proyecta([PB.x, Y_ARO_ARRIBA, PB.z]);
  const g = ctx.createLinearGradient(0, c[1] - 40, 0, c[1] + 40);
  g.addColorStop(0, gris(0.26));
  g.addColorStop(1, gris(0.04));
  ctx.fillStyle = g;
  ctx.fill();
  // el borde enrollado de atrás: su cara de arriba y su cara de dentro
  const fuera = anilloXY(R_FUERA, Y_ARO_ARRIBA, Math.PI, Math.PI * 2);
  const dentro = anilloXY(R_DENTRO, Y_ARO_ARRIBA, Math.PI * 2, Math.PI);
  poli(ctx, [...fuera, ...dentro], gris(0.72), gris(0.2), 2.6);
  const dentroAbajo = anilloXY(R_DENTRO, Y_ARO_ABAJO + 6, Math.PI, Math.PI * 2);
  poli(ctx, [...anilloXY(R_DENTRO, Y_ARO_ARRIBA, Math.PI, Math.PI * 2), ...dentroAbajo.reverse()], gris(0.5), gris(0.2), 2);
};

export const papeleraFrente = (ctx: CanvasRenderingContext2D) => {
  // el cubo: un cono truncado de chapa, liso, con la luz por la izquierda
  const rB = PB.rBase + PB.pared, rT = PB.rBorde + PB.pared;
  const yT = Y_ARO_ABAJO, yB = SUELO;
  const pB = anilloXY(rB, yB, 0, Math.PI, 36), pT = anilloXY(rT, yT, 0, Math.PI, 36);
  const silueta = [...pT, ...pB.reverse()];
  const izq = proyecta([PB.x - rT, yT, 0]), der = proyecta([PB.x + rT, yT, 0]);
  const g = ctx.createLinearGradient(izq[0], 0, der[0], 0);
  g.addColorStop(0, gris(0.66));
  g.addColorStop(0.28, gris(0.8));
  g.addColorStop(0.62, gris(0.62));
  g.addColorStop(1, gris(0.4));
  camino(ctx, silueta);
  ctx.fillStyle = g;
  ctx.fill();
  // la costura de la chapa y dos nervios (una raya oscura con su brillo debajo)
  const costura = 2.45;
  const ca = proyecta([PB.x + (rB + 1) * Math.cos(costura), yB - 4, PB.z + (rB + 1) * Math.sin(costura)]);
  const cb = proyecta([PB.x + (rT + 1) * Math.cos(costura), yT + 4, PB.z + (rT + 1) * Math.sin(costura)]);
  ctx.strokeStyle = gris(0.42);
  ctx.lineWidth = 3;
  camino(ctx, [ca, cb], false);
  ctx.stroke();
  for (const f of [0.32, 0.68]) {
    const y = yB - (yB - yT) * f;
    const r = rB + (rT - rB) * f + 2;
    ctx.strokeStyle = gris(0.32);
    ctx.lineWidth = 4;
    camino(ctx, anilloXY(r, y, 0.04, Math.PI - 0.04, 30), false);
    ctx.stroke();
    ctx.strokeStyle = gris(0.86);
    ctx.lineWidth = 3;
    camino(ctx, anilloXY(r, y + 6, 0.3, Math.PI - 0.6, 26), false);
    ctx.stroke();
  }
  camino(ctx, silueta);
  ctx.strokeStyle = gris(0.05);
  ctx.lineWidth = 4;
  ctx.stroke();
  // el borde enrollado de delante: la cara de fuera (una banda) y la de arriba
  const fA = anilloXY(R_FUERA, Y_ARO_ARRIBA, 0, Math.PI), fB = anilloXY(R_FUERA, Y_ARO_ABAJO, Math.PI, 0);
  const banda = ctx.createLinearGradient(izq[0], 0, der[0], 0);
  banda.addColorStop(0, gris(0.78));
  banda.addColorStop(0.35, gris(0.86));
  banda.addColorStop(1, gris(0.46));
  camino(ctx, [...fA, ...fB]);
  ctx.fillStyle = banda;
  ctx.fill();
  ctx.strokeStyle = gris(0.08);
  ctx.lineWidth = 3;
  ctx.stroke();
  poli(ctx, [...anilloXY(R_FUERA, Y_ARO_ARRIBA, 0, Math.PI), ...anilloXY(R_DENTRO, Y_ARO_ARRIBA, Math.PI, 0)], gris(0.76), gris(0.12), 2.6);
};
