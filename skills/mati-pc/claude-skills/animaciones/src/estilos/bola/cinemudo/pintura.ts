import {rng} from '../../../comun/curvas';
import {PAPELERA, R_BOLA, SUELO, escalaEn, proyecta, type Bola, type Instante, type V3} from '../escena';
import {conPapelera, conoDeLuz, lampara, mesa, papeleraFondo, papeleraFrente, pared, paredDerecha, posBombilla, sombraPapelera, suelo} from './decorado';
import {camino, gris, sombra} from './geometria';
import {munecoPiezas, sombraSilla, type Pieza} from './muneco';

// CINE MUDO, LA PINTURA DE LA ESCENA: lo que pasa en un instante, pintado en grises en tres lienzos de
// 1080 × 1920, por planos:
//   · el FONDO (la pared con su papel y su zócalo, la otra pared, el suelo, la mesa y las sombras), más oscuro y liso;
//   · lo de DELANTE (la lámpara, la silla y el muñeco, y la papelera), claro, en su propio lienzo: su silueta le dice al paso de
//     dibujo que va sin rayado y con contorno grueso; luego se pega encima del fondo;
//   · la BOLA, aparte y sin entintar (va en la capa de encima): lo más blanco del cuadro, con su contorno negro y su halo, y tapada
//     por el frente de la papelera cuando está dentro o detrás de su borde.

// ---------------------------------------------------------------- la bola de papel arrugado
const FORMA = (() => {
  const r = rng(907);
  return Array.from({length: 26}, () => 0.9 + r() * 0.2);
})();
const PLIEGUES = (() => {
  const r = rng(311);
  return Array.from({length: 7}, () => {
    const a = r() * Math.PI * 2, d = r() * 0.6;
    const b = a + (r() - 0.5) * 2.4;
    return [[Math.cos(a) * d, Math.sin(a) * d], [Math.cos(a) * d + Math.cos(b) * 0.36, Math.sin(a) * d + Math.sin(b) * 0.36], [Math.cos(a) * d + Math.cos(b + 0.9) * 0.56, Math.sin(a) * d + Math.sin(b + 0.9) * 0.56]];
  });
})();
// limpia: la bola protagonista (blanca del todo, contorno negro grueso y halo); si no, una bola vieja de la mesa (gris, sin halo)
export const bolaPapel = (ctx: CanvasRenderingContext2D, c: V3, r0: number, giro: number, aplasta: {k: number; n: V3} | null, alfa = 1, semilla = 0, limpia = true) => {
  const p = proyecta(c);
  const r = r0 * escalaEn(c[2]);
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.translate(p[0], p[1]);
  if (limpia) {
    // el halo: la bola brilla como lo más blanco de la copia
    const h = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 2.1);
    h.addColorStop(0, 'rgba(255,255,255,0.5)');
    h.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = h;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  if (aplasta && aplasta.k > 0.01) {
    const a = Math.atan2(aplasta.n[1], aplasta.n[0]);
    ctx.rotate(a);
    ctx.scale(1 - 0.26 * aplasta.k, 1 + 0.16 * aplasta.k);
    ctx.rotate(-a);
  }
  const N = FORMA.length;
  const borde = Array.from({length: N}, (_, k) => {
    const a = (k / N) * Math.PI * 2;
    const f = FORMA[(k + semilla * 7) % N];
    return [Math.cos(a + giro) * r * f, Math.sin(a + giro) * r * f] as [number, number];
  });
  // el contorno negro grueso (por fuera) y el papel
  camino(ctx, borde);
  ctx.strokeStyle = limpia ? '#050404' : gris(0.12);
  ctx.lineWidth = limpia ? Math.max(7, r * 0.3) : Math.max(2.4, r * 0.08);
  ctx.lineJoin = 'round';
  ctx.stroke();
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05);
  const t = limpia ? 1 : 0.7;
  g.addColorStop(0, gris(t));
  g.addColorStop(0.6, gris(t * 0.98));
  g.addColorStop(1, gris(t * (limpia ? 0.9 : 0.82)));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.rotate(giro);
  PLIEGUES.forEach((q) => {
    ctx.strokeStyle = gris(limpia ? 0.78 : 0.38);
    ctx.lineWidth = Math.max(1.4, r * 0.04);
    camino(ctx, q.map(([x, y]) => [x * r, y * r] as [number, number]), false);
    ctx.stroke();
  });
  ctx.restore();
  ctx.restore();
};

const sombraBola = (ctx: CanvasRenderingContext2D, b: Bola) => {
  if (b.dentro) return;
  const alto = SUELO - R_BOLA - b.c[1];
  if (alto > 460) return;
  const k = 1 - alto / 460;
  sombra(ctx, proyecta([b.c[0] + 8, SUELO, b.c[2]]), 64 - alto * 0.04, 17 - alto * 0.012, 0.6 * k);
};

// ---------------------------------------------------------------- la escena entera
export type Estado = {e: Instante; b: Bola; fantasmas: {b: Bola; alfa: number}[]; luzBombilla: number; estelaLampara: number[]};
export type Lienzos = {escena: CanvasRenderingContext2D; frente: CanvasRenderingContext2D; bola: CanvasRenderingContext2D};

export const pintaEscena = (L: Lienzos, s: Estado) => {
  const {e, b} = s;
  const bomb = posBombilla(e.lampara.ang);
  // el fondo
  const f = L.escena;
  f.save();
  f.fillStyle = '#000';
  f.fillRect(0, 0, 1080, 1920);
  pared(f, bomb, s.luzBombilla);
  paredDerecha(f);
  suelo(f, bomb);
  conoDeLuz(f, e.lampara.ang, s.luzBombilla);
  sombraPapelera(f);
  sombraSilla(f);
  sombraBola(f, b);
  mesa(f, (c, r, semilla) => bolaPapel(f, c, r, semilla * 1.7, null, 1, semilla, false));
  f.restore();

  // lo de delante, en su lienzo
  const d = L.frente;
  d.save();
  d.clearRect(0, 0, 1080, 1920);
  lampara(d, e.lampara.ang, s.luzBombilla, s.estelaLampara);
  const piezas: Pieza[] = [];
  munecoPiezas(d, e.muneco, piezas);
  piezas.sort((a, c) => a.z - c.z).forEach((p) => p.pinta());
  conPapelera(d, e.papelera.inclina, () => {
    papeleraFondo(d);
    papeleraFrente(d);
  });
  d.restore();
  f.drawImage(d.canvas, 0, 0);

  // la bola, en su lienzo; si está dentro de la papelera (o detrás del borde de delante), el frente la tapa
  const o = L.bola;
  o.save();
  o.clearRect(0, 0, 1080, 1920);
  for (const fa of s.fantasmas) bolaPapel(o, fa.b.c, R_BOLA, fa.b.giro, null, fa.alfa);
  bolaPapel(o, b.c, R_BOLA, b.giro, b.aplasta);
  const rho = Math.hypot(b.c[0] - PAPELERA.x, b.c[2] - PAPELERA.z);
  const dentro = b.dentro || (rho < PAPELERA.rBorde && b.c[1] > PAPELERA.yBorde - 10);
  if (dentro || b.c[2] < -5) {
    o.globalCompositeOperation = 'destination-out';
    conPapelera(o, e.papelera.inclina, () => papeleraFrente(o));
  }
  o.restore();
};
