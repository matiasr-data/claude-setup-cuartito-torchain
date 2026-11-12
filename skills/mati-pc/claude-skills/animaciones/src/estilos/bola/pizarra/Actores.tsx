import React from 'react';
import {clamp, rng} from '../../../comun/curvas';
import {PAPELERA, R_BOLA, SUELO, escalaEn, proyecta, type Bola, type Cara, type Golpe, type P, type Pose, type V3} from '../escena';
import {lampara, muneco, papelera, silla, type Caja, type PiezaMuneco} from './cuerpos';
import {Capsula, Forma, TIZA, Trazo, W, curva, poli, type Color} from './tiza';

// PIZARRA DE TIZA, LO QUE SE MUEVE: el muñeco en su silla, la papelera, la lámpara y la bola, redibujados
// en cada paso (12 por segundo) con el pulso de la tiza, y los trazos de golpe. Cada cosa tapa lo de detrás con la pizarra y se
// rellena «de canto» con su tiza de color: la camisa amarilla, el pantalón azul, la papelera rosa, la pantalla de la lámpara amarilla.

const PB = PAPELERA;
const sum3 = (a: V3, n: V3, k: number): V3 => [a[0] + n[0] * k, a[1] + n[1] * k, a[2] + n[2] * k];

// ---------------------------------------------------------------- una caja de tiza: su silueta y las aristas de dentro
const CajaTiza: React.FC<{c: Caja; color?: Color | null; borde?: Color; w?: number; trama?: string}> = ({c, color = null, borde = 'blanco', w = W.gordo, trama}) => (
  <g>
    <Forma d={poli(c.silueta)} c={color} borde={borde} w={w} trama={trama} />
    {c.aristas.map(([a, b], k) => <Trazo key={k} d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`} w={w * 0.62} c={borde} />)}
  </g>
);

// ---------------------------------------------------------------- el muñeco y su silla
const Pieza: React.FC<{p: PiezaMuneco}> = ({p}) => {
  if (p.tipo === 'torso') {
    return (
      <g>
        <CajaTiza c={p.caja} color="amarillo" />
        {p.ve && (
          <g>
            <Forma d={poli(p.corbata)} c="rosa" borde="rosa" w={W.fino} tinte={0.5} />
            <Trazo d={poli(p.cuello, false)} w={W.detalle} />
          </g>
        )}
      </g>
    );
  }
  if (p.tipo === 'brazo') {
    return (
      <g>
        <Capsula pts={p.pts.slice(0, 2)} r={25} c="amarillo" />
        <Capsula pts={p.pts.slice(1)} r={23} c="amarillo" />
        <Forma d={curva(circulo(p.mano, p.rMano), true)} w={W.gordo * 0.85} />
      </g>
    );
  }
  if (p.tipo === 'pierna') {
    return (
      <g>
        <Capsula pts={p.muslo} r={31} c="azul" />
        <Capsula pts={p.espinilla} r={29} c="azul" />
        <Capsula pts={p.pie} r={15} />
      </g>
    );
  }
  // la cabeza: el cilindro, la tapa, el pelo rayado muy apretado y la cara
  return (
    <g>
      <Forma d={curva(p.silueta, true)} c="blanco" trama="pz-trama-suave" tinte={0.07} w={W.gordo} />
      {p.tapa.length > 0 && <Trazo d={curva(p.tapa, true)} w={W.fino} op={0.8} />}
      <Forma d={curva(p.pelo, true)} c="blanco" trama="pz-trama-densa" tinte={0.18} w={W.gordo * 0.8} />
      {p.flequillo.map((f, k) => <Trazo key={k} d={curva(f)} w={W.detalle} />)}
      {p.cara.map((r, k) =>
        r.relleno ? (
          <path key={k} d={curva(r.d, true)} fill={TIZA.blanco} />
        ) : (
          <Trazo key={k} d={r.cerrado ? curva(r.d, true) : curva(r.d)} w={r.w ?? 5} />
        ),
      )}
    </g>
  );
};

const circulo = (c: P, r: number, n = 14): P[] => Array.from({length: n}, (_, j) => [c[0] + Math.cos((j / n) * Math.PI * 2) * r, c[1] + Math.sin((j / n) * Math.PI * 2) * r]);

export const MunecoTiza: React.FC<{pose: Pose}> = ({pose}) => {
  const m = muneco(pose);
  const s = silla(pose);
  return (
    <g>
      {/* la sombra en el suelo, rayada */}
      <path d={curva(elipse([228, SUELO + 18], 190, 34), true)} fill="url(#pz-trama-suave)" opacity={0.42} />
      {/* la base de cinco patas (las de detrás primero), el poste, el respaldo y el asiento */}
      {[...s.patas].sort((a, b) => a.z - b.z).map((q, k) => (
        <g key={k}>
          <Capsula pts={[q.de, q.a]} r={10} />
          <Forma d={curva(circulo(q.rueda, 13), true)} w={W.detalle} />
        </g>
      ))}
      <Capsula pts={s.poste} r={13} />
      <CajaTiza c={s.respaldo} color="azul" borde="azul" trama="pz-trama-suave" />
      <CajaTiza c={s.asiento} color="azul" borde="azul" trama="pz-trama-suave" />
      {m.piezas.map((p, k) => <Pieza key={k} p={p} />)}
    </g>
  );
};

// lo que siente, dibujado alrededor de la cabeza (como en un cómic de pizarra)
export const Gestos: React.FC<{cara: Cara; pose: Pose; paso: number}> = ({cara, pose}) => {
  const m = muneco(pose);
  const [cx, cy] = m.cabeza;
  const r = m.r;
  const rayas = (angs: number[], c: Color = 'blanco') =>
    angs.map((a, k) => {
      const u: P = [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)];
      return <Trazo key={`${a}-${k}`} d={`M ${cx + u[0] * (r + 34)} ${cy - 30 + u[1] * (r + 34)} L ${cx + u[0] * (r + 70)} ${cy - 30 + u[1] * (r + 70)}`} w={W.detalle} c={c} />;
    });
  const gota = (x: number, y: number) => (
    <Forma d={`M ${x} ${y - 26} C ${x + 6} ${y - 12}, ${x + 14} ${y - 2}, ${x + 14} ${y + 8} C ${x + 14} ${y + 18}, ${x - 14} ${y + 18}, ${x - 14} ${y + 8} C ${x - 14} ${y - 2}, ${x - 6} ${y - 12}, ${x} ${y - 26} Z`}
      c="azul" borde="azul" w={W.fino} tinte={0.45} />
  );
  const estrella = (x: number, y: number, rr: number, k: number) => {
    const pts: P[] = Array.from({length: 10}, (_, j) => {
      const a = -Math.PI / 2 + (j * Math.PI) / 5 + k * 0.3;
      const q = j % 2 ? rr * 0.45 : rr;
      return [x + Math.cos(a) * q, y + Math.sin(a) * q];
    });
    return <Forma key={k} d={poli(pts)} c="amarillo" borde="amarillo" w={W.fino} tinte={0.5} tapa={false} />;
  };
  if (cara === 'ay') return <g>{rayas([-150, -115, -80, -45])}{gota(cx - r - 26, cy - 44)}</g>;
  if (cara === 'susto') return <g>{rayas([-160, -125, -90, -55, -20])}</g>;
  if (cara === 'tension') return <g>{gota(cx + r + 24, cy - 40)}</g>;
  if (cara === 'feliz') return <g>{estrella(cx - r - 46, cy - 70, 26, 0)}{estrella(cx + r + 40, cy - 96, 22, 1)}{estrella(cx + 4, cy - r - 120, 18, 2)}</g>;
  if (cara === 'fastidio') {
    // la nube de garabato sobre la cabeza
    const pts: P[] = Array.from({length: 40}, (_, j) => {
      const a = (j / 40) * Math.PI * 6;
      return [cx + 10 + Math.cos(a) * (34 - j * 0.4) + j * 1.4 - 28, cy - r - 96 + Math.sin(a) * 16];
    });
    return <Trazo d={curva(pts)} w={W.fino} />;
  }
  if (cara === 'meh' || cara === 'serio') {
    return <g>{[0, 1, 2].map((k) => <circle key={k} cx={cx + r + 26 + k * 22} cy={cy - 66} r={5.5} fill={TIZA.blanco} />)}</g>;
  }
  return null;
};

const elipse = (c: P, rx: number, ry: number, n = 28): P[] => Array.from({length: n}, (_, j) => [c[0] + Math.cos((j / n) * Math.PI * 2) * rx, c[1] + Math.sin((j / n) * Math.PI * 2) * ry]);

// ---------------------------------------------------------------- la papelera (detrás: la boca y el aro de atrás; delante: el cuerpo y el aro)
const PAP = papelera();
export const PapeleraAtras: React.FC = () => (
  <g>
    {/* la sombra rayada en el suelo */}
    <path d={curva(elipse([PB.x + 30, SUELO + 8], PB.rBase * 1.55, 34), true)} fill="url(#pz-trama-suave)" opacity={0.45} />
    {/* la boca: dentro está oscuro, con dos papeles de otros días */}
    <path d={curva(PAP.boca, true)} fill="#16261f" />
    {[[-52, 4, 30], [40, -6, 26]].map(([dx, dy, r], k) => (
      <path key={k} d={curva(bolaPts([PAP.pila[0] + dx, PAP.pila[1] - 70 + dy], r, 40 + k, 0), true)} fill="none" stroke={TIZA.blanco} strokeWidth={W.fino} opacity={0.55} />
    ))}
    <Trazo d={curva(PAP.aroAtras)} w={W.gordo + 3} />
  </g>
);
export const PapeleraDelante: React.FC = () => (
  <g>
    <Forma d={poli(PAP.cuerpo)} c="rosa" borde="blanco" w={W.gordo} />
    {PAP.costillas.map(([a, b], k) => <Trazo key={k} d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`} w={W.fino} op={0.75} />)}
    <Trazo d={curva(PAP.aroDelante)} w={W.gordo + 3} />
    <Trazo d={curva(PAP.aroDentro, true)} w={W.fino} op={0.85} />
  </g>
);
// gira desde su base cuando le dan
export const giroPapelera = (inclina: number) => `rotate(${(inclina * 180) / Math.PI} ${PB.x} ${SUELO})`;

// ---------------------------------------------------------------- la lámpara
export const LamparaTiza: React.FC<{ang: number; luz: number}> = ({ang, luz}) => {
  const l = lampara(ang);
  const [bx, by] = l.bombilla;
  return (
    <g>
      <Trazo d={`M ${l.gancho[0]} ${l.gancho[1]} L ${l.cuello[0]} ${l.cuello[1]}`} w={W.detalle} />
      {/* los rayos de luz de la bombilla (amarillos, como los pinta un profe) */}
      {Array.from({length: 7}, (_, k) => {
        const a = Math.atan2(l.dir[1], l.dir[0]) + ((k - 3) / 3) * 1.25;
        const r0 = 46, r1 = 78 + (k % 2) * 14 + luz * 6;
        return <Trazo key={k} d={`M ${bx + Math.cos(a) * r0} ${by + Math.sin(a) * r0} L ${bx + Math.cos(a) * r1} ${by + Math.sin(a) * r1}`} w={W.detalle} c="amarillo" />;
      })}
      <Forma d={curva(circulo([bx, by], l.rBombilla, 16), true)} c="amarillo" borde="blanco" w={W.detalle} tinte={0.35} />
      <Forma d={poli(l.pantalla)} c="amarillo" borde="blanco" w={W.gordo} />
    </g>
  );
};

// ---------------------------------------------------------------- la bola de papel: un círculo abollado con sus pliegues, que gira
const bolaPts = (c: P, r: number, semilla: number, giro: number): P[] => {
  const R = rng(semilla);
  const bultos = Array.from({length: 11}, () => 0.86 + R() * 0.2);
  return bultos.map((b, j) => {
    const a = (j / bultos.length) * Math.PI * 2 + giro;
    return [c[0] + Math.cos(a) * r * b, c[1] + Math.sin(a) * r * b];
  });
};
export const BolaTiza: React.FC<{b: Bola}> = ({b}) => {
  const c = proyecta(b.c);
  const r = R_BOLA * escalaEn(b.c[2]);
  // se aplasta a lo largo de la normal del golpe
  const n: P = [b.aplasta.n[0], b.aplasta.n[1]];
  const ang = (Math.atan2(n[1], n[0]) * 180) / Math.PI;
  const k = b.aplasta.k;
  const giro = -b.giro;
  const pliegues = [0, 1, 2].map((j) => {
    const a = giro + j * 2.1;
    const R = rng(90 + j);
    const pts: P[] = Array.from({length: 4}, (_, q) => {
      const s = -0.55 + q * 0.36;
      return [c[0] + Math.cos(a) * r * s + Math.cos(a + 1.57) * r * (R() - 0.5) * 0.5, c[1] + Math.sin(a) * r * s + Math.sin(a + 1.57) * r * (R() - 0.5) * 0.5];
    });
    return poli(pts, false);
  });
  return (
    <g transform={`rotate(${ang} ${c[0]} ${c[1]}) translate(${c[0]} ${c[1]}) scale(${1 - 0.26 * k} ${1 + 0.16 * k}) translate(${-c[0]} ${-c[1]}) rotate(${-ang} ${c[0]} ${c[1]})`}>
      <Forma d={poli(bolaPts(c, r, 7, giro))} c="blanco" w={W.gordo} trama="pz-trama-suave" tinte={0.2} />
      {pliegues.map((d, j) => <Trazo key={j} d={d} w={W.fino} />)}
    </g>
  );
};
// su sombra en el suelo (rayada), que crece y se aprieta al bajar
export const SombraBola: React.FC<{b: Bola}> = ({b}) => {
  if (b.dentro) return null;
  const alto = SUELO - R_BOLA - b.c[1];
  if (alto > 520) return null;
  const q = proyecta([b.c[0], SUELO, b.c[2]]);
  const k = 1 - alto / 520;
  return <path d={curva(elipse([q[0] + 6, q[1] + 4], 30 + 34 * k, 8 + 8 * k), true)} fill="url(#pz-trama-suave)" opacity={0.25 + 0.4 * k} />;
};

// ---------------------------------------------------------------- los trazos de golpe: rayas que salen del punto donde toca
export const Golpes: React.FC<{golpes: Golpe[]; t: number}> = ({golpes, t}) => (
  <g>
    {golpes.map((g, gi) => {
      const u = t - g.t;
      const fuerte = g.tipo !== 'suelo' || gi === golpes.findIndex((h) => h.tipo === 'suelo');
      if (u < -0.02 || u > 0.34 || g.fuerza < 420 || !fuerte) return null;
      // un estallido alrededor de la bola en el sitio del golpe, abierto hacia donde rebota (no hacia la superficie que toca)
      const c = proyecta(sum3(g.p, g.n, R_BOLA));
      const rb = R_BOLA * escalaEn(g.p[2]);
      const base = Math.atan2(g.n[1], g.n[0]);
      const tam = clamp(g.fuerza / 2200, 0.5, 1);
      const k = clamp(u / 0.34);
      const n = g.tipo === 'suelo' ? 6 : 8;
      return (
        <g key={gi}>
          {Array.from({length: n}, (_, j) => {
            const a = base + (-1 + (2 * j) / (n - 1)) * 2.2;
            const r0 = rb + 14 + 40 * k * tam, r1 = r0 + (40 + (j % 2) * 24) * tam * (1 - 0.6 * k);
            return <Trazo key={j} d={`M ${c[0] + Math.cos(a) * r0} ${c[1] + Math.sin(a) * r0} L ${c[0] + Math.cos(a) * r1} ${c[1] + Math.sin(a) * r1}`} w={W.detalle + 1} c={j % 3 === 1 ? 'amarillo' : 'blanco'} />;
          })}
        </g>
      );
    })}
  </g>
);

// lo que tapa la papelera a la bola cuando está detrás o dentro
export const bolaDetras = (b: Bola) => b.dentro || (b.c[2] < -4 && Math.abs(b.c[0] - PB.x) < PB.rBorde + R_BOLA + 30 && b.c[1] > PB.yBorde - R_BOLA);
