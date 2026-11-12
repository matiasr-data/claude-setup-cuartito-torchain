import {E, clamp, mix} from '../../../comun/curvas';

// CINE MUDO, EL RÓTULO Y EL IRIS. Van en la capa de encima, que la copia mezcla con la imagen antes del grano
// (así tienen el mismo parpadeo, la misma plata y las mismas rayas que todo lo demás).
//   · El iris: el óvalo negro de las cámaras de entonces, con el borde blando. Durante la acción, abierto (solo oscurece las esquinas);
//     al final, se cierra un poco sobre la reacción del muñeco y donde quedó la bola («el iris en la mirada»).
//   · El rótulo: un intertítulo pequeño, negro, con su marco art déco (una raya fina por fuera y otra con las esquinas en escalón por
//     dentro, un abanico arriba y otro abajo, y un rombo en cada esquina). Entra de golpe (un corte, como entonces) con un pelo de
//     rebote, y la letra tiembla un poco, como un grito.

export const FUENTE_ROTULO = 'CineMudoRotulo';
const PAPEL = '#efe9dc';

export type Iris = {cx: number; cy: number; rx: number; ry: number; suave: number};
export const irisAbierto: Iris = {cx: 540, cy: 1010, rx: 720, ry: 1120, suave: 0.24};

export const mezclaIris = (a: Iris, b: Iris, k: number): Iris => ({
  cx: mix(a.cx, b.cx, k), cy: mix(a.cy, b.cy, k), rx: mix(a.rx, b.rx, k), ry: mix(a.ry, b.ry, k), suave: mix(a.suave, b.suave, k),
});

export const pintaIris = (ctx: CanvasRenderingContext2D, ir: Iris) => {
  ctx.save();
  ctx.translate(ir.cx, ir.cy);
  ctx.scale(1, ir.ry / ir.rx);
  const g = ctx.createRadialGradient(0, 0, ir.rx * (1 - ir.suave), 0, 0, ir.rx);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.5, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = g;
  ctx.fillRect(-4000, -4000, 8000, 8000);
  ctx.restore();
};

// el marco con las esquinas en escalón
const escalon = (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, s: number) => {
  ctx.beginPath();
  ctx.moveTo(x0 + 2 * s, y0);
  ctx.lineTo(x1 - 2 * s, y0); ctx.lineTo(x1 - 2 * s, y0 + s); ctx.lineTo(x1 - s, y0 + s); ctx.lineTo(x1 - s, y0 + 2 * s); ctx.lineTo(x1, y0 + 2 * s);
  ctx.lineTo(x1, y1 - 2 * s); ctx.lineTo(x1 - s, y1 - 2 * s); ctx.lineTo(x1 - s, y1 - s); ctx.lineTo(x1 - 2 * s, y1 - s); ctx.lineTo(x1 - 2 * s, y1);
  ctx.lineTo(x0 + 2 * s, y1); ctx.lineTo(x0 + 2 * s, y1 - s); ctx.lineTo(x0 + s, y1 - s); ctx.lineTo(x0 + s, y1 - 2 * s); ctx.lineTo(x0, y1 - 2 * s);
  ctx.lineTo(x0, y0 + 2 * s); ctx.lineTo(x0 + s, y0 + 2 * s); ctx.lineTo(x0 + s, y0 + s); ctx.lineTo(x0 + 2 * s, y0 + s);
  ctx.closePath();
};
// el abanico art déco: rayos en medio círculo (hacia abajo si dir = 1)
const abanico = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, dir: 1 | -1) => {
  ctx.beginPath();
  ctx.arc(x, y, r * 0.32, dir > 0 ? 0 : Math.PI, dir > 0 ? Math.PI : Math.PI * 2);
  ctx.fill();
  for (let k = 0; k <= 8; k++) {
    const a = (k / 8) * Math.PI * dir;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.stroke();
  }
};

export type Rotulo = {texto: string; desde: number; hasta: number};

// el rótulo, centrado en (cx, cy); entra: de 0 a 1 en su primer instante (el rebote); tiembla: la letra, en px
export const pintaRotulo = (ctx: CanvasRenderingContext2D, texto: string, cx: number, cy: number, entra: number, tiembla: [number, number]) => {
  ctx.save();
  ctx.translate(cx, cy);
  const k = 0.9 + 0.1 * E.outBack(clamp(entra));
  ctx.scale(k, k);
  let tam = 78;
  ctx.font = `900 ${tam}px ${FUENTE_ROTULO}, Georgia, serif`;
  let w = ctx.measureText(texto).width;
  if (w > 690) {
    tam = Math.floor((tam * 690) / w);
    ctx.font = `900 ${tam}px ${FUENTE_ROTULO}, Georgia, serif`;
    w = ctx.measureText(texto).width;
  }
  const W = Math.max(430, w + 156), H = 196;
  // la tarjeta negra, con una sombra que la separa de la imagen
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(-W / 2 + 10, -H / 2 + 12, W, H);
  ctx.fillStyle = '#070605';
  ctx.fillRect(-W / 2, -H / 2, W, H);
  ctx.strokeStyle = PAPEL;
  ctx.fillStyle = PAPEL;
  // la raya fina de fuera y la de las esquinas en escalón
  ctx.lineWidth = 3;
  ctx.strokeRect(-W / 2 + 10, -H / 2 + 10, W - 20, H - 20);
  ctx.lineWidth = 5;
  escalon(ctx, -W / 2 + 24, -H / 2 + 24, W / 2 - 24, H / 2 - 24, 13);
  ctx.stroke();
  // los rombos de las esquinas
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = sx * (W / 2 - 24 - 13), y = sy * (H / 2 - 24 - 13);
    ctx.beginPath();
    ctx.moveTo(x, y - 8); ctx.lineTo(x + 8, y); ctx.lineTo(x, y + 8); ctx.lineTo(x - 8, y);
    ctx.closePath();
    ctx.fill();
  }
  // los abanicos, arriba y abajo, con sus rayas a los lados
  ctx.lineWidth = 3;
  abanico(ctx, 0, -H / 2 + 24, 24, 1);
  abanico(ctx, 0, H / 2 - 24, 24, -1);
  for (const sy of [-1, 1]) {
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sx * 40, sy * (H / 2 - 36));
      ctx.lineTo(sx * (W / 4 + 10), sy * (H / 2 - 36));
      ctx.stroke();
    }
  }
  // la letra
  ctx.font = `900 ${tam}px ${FUENTE_ROTULO}, Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PAPEL;
  ctx.fillText(texto, tiembla[0], tiembla[1] + tam * 0.06);
  ctx.restore();
};
