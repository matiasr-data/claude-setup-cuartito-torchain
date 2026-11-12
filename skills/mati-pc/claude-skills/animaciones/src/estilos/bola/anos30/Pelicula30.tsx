import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {rng, ruido} from '../../../comun/curvas';

// LA PELÍCULA VIEJA (adaptada de código con licencia MIT, ver AVISOS.md, y pasada a Remotion): encima de la escena, el
// grano (seis láminas de grano pintadas una vez y barajadas en cada cuadro, a 24), el parpadeo de la luz del proyector, las rayas
// verticales que se arrastran unos cuadros, las motas de polvo (distintas en cada cuadro), algún pelo de vez en cuando, la viñeta
// fuerte y la ventanilla con las esquinas redondas. Y la mancha de acuarela del fondo (las texturas, pintadas en un canvas una vez).

const hash = (n: number) => rng(Math.floor(n * 7919) + 101)();

// ---------------------------------------------------------------- las texturas (se pintan una vez por pestaña del navegador)
const cache: Record<string, string> = {};
const lienzo = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return {c, x: c.getContext('2d')!};
};
// las manchas de la acuarela y el grano del papel (sobre el telón de fondo)
export const texturaAcuarela = (): string => {
  if (cache.acuarela) return cache.acuarela;
  if (typeof document === 'undefined') return '';
  const {c, x} = lienzo(540, 960);
  const r = rng(77);
  x.filter = 'blur(9px)';
  for (let i = 0; i < 170; i++) {
    const rad = 10 + r() * 46;
    x.fillStyle = r() > 0.5 ? `rgba(30,28,25,${0.035 + r() * 0.06})` : `rgba(255,253,245,${0.03 + r() * 0.05})`;
    x.beginPath();
    x.ellipse(r() * 540, r() * 960, rad, rad * (0.5 + r() * 0.6), r() * 3, 0, 7);
    x.fill();
  }
  x.filter = 'none';
  for (let i = 0; i < (540 * 960) / 260; i++) {
    x.fillStyle = r() > 0.5 ? 'rgba(20,18,15,.08)' : 'rgba(255,255,250,.06)';
    x.fillRect(r() * 540, r() * 960, 1 + r() * 1.4, 1 + r() * 1.4);
  }
  cache.acuarela = c.toDataURL('image/png');
  return cache.acuarela;
};
// el grano de la película: gris medio con ruido (se funde con «overlay»: el gris medio no cambia nada)
const N_GRANO = 6;
export const texturaGrano = (k: number): string => {
  const id = `grano${k}`;
  if (cache[id]) return cache[id];
  if (typeof document === 'undefined') return '';
  const {c, x} = lienzo(400, 712);
  const img = x.createImageData(400, 712);
  const r = rng(900 + k * 31);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + ((r() + r() + r()) / 3 - 0.5) * 230;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  cache[id] = c.toDataURL('image/jpeg', 0.82);
  return cache[id];
};

// ---------------------------------------------------------------- el desgaste de la película (en el cuadro de 24 en que está)
export const Pelicula30: React.FC<{t: number}> = ({t}) => {
  const f = Math.floor(t * 24 + 1e-6);
  const W = 1080, H = 1920;
  // el parpadeo del proyector
  const fl = (hash(f * 1.618) - 0.5) * 0.09 + ruido(t * 3, 5) * 0.03;
  const els: React.ReactNode[] = [];
  // las rayas verticales: de 0 a 3, cada una dura unos cuadros y se arrastra un poco
  const seg = Math.floor(t * 2.3);
  for (let i = 0; i < 3; i++) {
    if (hash(seg * 13.7 + i * 3.1) < 0.45) continue;
    const sx = 40 + hash(seg * 5.3 + i) * (W - 80) + Math.sin(t * 7 + i) * 8;
    const claro = hash(seg + i * 9) > 0.4;
    const y0 = hash(seg * 3 + i) * H * 0.5;
    els.push(<line key={`r${i}`} x1={sx} y1={y0} x2={sx + (hash(f + i) - 0.5) * 4} y2={y0 + H * (0.4 + hash(seg + i * 5) * 0.6)}
      stroke={claro ? 'rgba(245,242,230,.55)' : 'rgba(10,10,8,.5)'} strokeWidth={1.4 + hash(seg * 2 + i) * 2.2} />);
  }
  // las motas de polvo (distintas en cada cuadro)
  const nd = 4 + Math.floor(hash(f * 2.7) * 7);
  for (let i = 0; i < nd; i++) {
    const rr = 1.6 + hash(f + i * 4.4) * 4.6;
    els.push(<ellipse key={`p${i}`} cx={hash(f * 11.1 + i * 1.7) * W} cy={hash(f * 17.3 + i * 2.9) * H} rx={rr * (1 + hash(i + f) * 1.4)} ry={rr}
      transform={`rotate(${hash(i * 3 + f) * 180} ${hash(f * 11.1 + i * 1.7) * W} ${hash(f * 17.3 + i * 2.9) * H})`}
      fill={hash(f * 1.3 + i) > 0.35 ? 'rgba(12,11,10,.8)' : 'rgba(250,248,240,.75)'} />);
  }
  // algún pelo de vez en cuando
  const s0 = Math.floor(t * 1.5);
  if (hash(s0 * 9.9) > 0.7) {
    const hx = 80 + hash(s0 * 2.2) * (W - 160), hy = 120 + hash(s0 * 4.4) * (H - 240);
    let d = `M${hx} ${hy}`;
    for (let i = 1; i <= 9; i++) d += `L${hx + i * 9 + Math.sin(i * 1.3 + s0) * 11} ${hy + Math.sin(i * 0.9 + s0 * 2) * 14 + i * 5}`;
    els.push(<path key="pelo" d={d} fill="none" stroke="rgba(15,14,12,.65)" strokeWidth={2.2} />);
  }
  const g = Math.floor(hash(f * 3.1) * N_GRANO);
  const gx = -Math.floor(hash(f * 5.7) * 40), gy = -Math.floor(hash(f * 8.3) * 40);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* el grano */}
      <Img src={texturaGrano(g)} style={{position: 'absolute', left: gx, top: gy, width: W + 60, height: H + 80, mixBlendMode: 'overlay', opacity: 0.55}} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="a30vin" cx="50%" cy="50%" r="72%">
            <stop offset="0.48" stopColor="#000" stopOpacity={0} />
            <stop offset="0.78" stopColor="#000" stopOpacity={0.22} />
            <stop offset="1" stopColor="#000" stopOpacity={0.66} />
          </radialGradient>
          <filter id="a30borde" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="9" /></filter>
        </defs>
        {/* el parpadeo */}
        <rect x={0} y={0} width={W} height={H} fill={fl > 0 ? '#FFFCF0' : '#000'} opacity={Math.abs(fl)} />
        {els}
        {/* la viñeta */}
        <rect x={0} y={0} width={W} height={H} fill="url(#a30vin)" />
        {/* la ventanilla con las esquinas redondas y su sombra por dentro */}
        <rect x={10} y={10} width={W - 20} height={H - 20} rx={46} fill="none" stroke="rgba(0,0,0,.6)" strokeWidth={26} filter="url(#a30borde)" />
        <path d={`M0 0H${W}V${H}H0Z M10 56 Q10 10 56 10 H${W - 56} Q${W - 10} 10 ${W - 10} 56 V${H - 56} Q${W - 10} ${H - 10} ${W - 56} ${H - 10} H56 Q10 ${H - 10} 10 ${H - 56} Z`}
          fill="#050505" fillRule="evenodd" />
      </svg>
    </AbsoluteFill>
  );
};
