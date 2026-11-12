// Curvas y ayudas de movimiento.
// Todo se calcula a partir del tiempo: el mismo segundo da siempre el mismo cuadro.

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const p = (t: number, a: number, d: number) => (d <= 0 ? (t >= a ? 1 : 0) : clamp((t - a) / d));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;

type Curva = (x: number) => number;
export const E = {
  lin: ((x) => x) as Curva,
  outQuad: ((x) => 1 - (1 - x) * (1 - x)) as Curva,
  inCubic: ((x) => x * x * x) as Curva,
  outCubic: ((x) => 1 - (1 - x) ** 3) as Curva,
  inOutCubic: ((x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)) as Curva,
  outQuint: ((x) => 1 - (1 - x) ** 5) as Curva,
  inExpo: ((x) => (x <= 0 ? 0 : 2 ** (10 * x - 10))) as Curva,
  outExpo: ((x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x))) as Curva,
  outBack: ((x) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2) as Curva,
  // muelle: sale rápido, se pasa y se asienta. osc = cuántas veces rebota, amort = lo que tarda en calmarse
  muelle: (x: number, osc = 1.4, amort = 6.5) => {
    if (x >= 1) return 1;
    if (x <= 0) return 0;
    const w = 2 * Math.PI * osc;
    return 1 - Math.exp(-amort * x) * (Math.cos(w * x) + (amort / w) * Math.sin(w * x));
  },
};

export const tw = (t: number, a: number, d: number, de: number, a2: number, e: Curva = E.outCubic) =>
  mix(de, a2, e(p(t, a, d)));

// Fotogramas clave: kf(t, [[0, 0], [0.5, 1, E.outBack], ...]). La curva de cada clave dice cómo se LLEGA a ella.
export const kf = (t: number, claves: [number, number, Curva?][]) => {
  if (t <= claves[0][0]) return claves[0][1];
  for (let i = 1; i < claves.length; i++) {
    const [t1, v1, e] = claves[i];
    const [t0, v0] = claves[i - 1];
    if (t <= t1) return mix(v0, v1, (e || E.outCubic)(p(t, t0, t1 - t0)));
  }
  return claves[claves.length - 1][1];
};

// Azar con semilla (mulberry32): mismos números siempre
export const rng = (semilla: number) => {
  let s = semilla | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};
const h = (i: number, s: number) => rng(i * 7919 + s * 104729)() * 2 - 1;
export const ruido = (x: number, s = 1) => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return mix(h(i, s), h(i + 1, s), u);
};

// Temblor de cámara que se apaga: [dx, dy]
export const temblor = (t: number, t0: number, dur = 0.35, amp = 14, semilla = 3): [number, number] => {
  const k = p(t, t0, dur);
  if (k <= 0 || k >= 1) return [0, 0];
  const a = amp * (1 - k) ** 2;
  return [a * ruido((t - t0) * 38, semilla), a * ruido((t - t0) * 38, semilla + 9)];
};
