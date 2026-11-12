import React, {useMemo, useRef} from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {clamp} from '../../../comun/curvas';
import {CAM_Y, D, DUR, FOV, LAMPARA, MESA, PAPELERA, R_BOLA, SILLA, SUELO, centroLampara, esqueleto, lanzamiento, proyecta, type V3} from '../escena';
import {N_ONDAS, N_SOMBRAS, creaEstudio, creaSuelo, type Suelo} from './CristalEstudio';
import {barrido, destellos, llenado, luzAro, ondas, puntoAro, type Destello} from './CristalLuz';
import {MunecoCristal} from './CristalMuneco';
import {Camara, FondoDesenfocado, FondoSoloVidrio} from './CristalPared';
import {BolaCristal, Lampara, Mesa, PanelCristal, Papelera, Silla} from './CristalPiezas';

// LA BOLA DE PAPEL EN CRISTAL (la escena en ../escena.ts). La
// misma oficina, en el mismo sitio, pero soplada en vidrio y fotografiada como un producto de lujo: un estudio negro con tiras de luz
// que dibujan los cantos de cada pieza, el suelo negro de espejo con las sombras de color y las cáusticas que deja el vidrio, y la bola
// de papel blanco, lo único opaco, brillando como una perla. Lo que pasa se cuenta con luz: el aro de la papelera se enciende donde lo
// toca la bola y le corren cometas por dentro en cada golpe, la tira del barrido cruza todos los cantos, saltan destellos y un tintineo
// de destellos pequeños por el borde, cada bote deja un anillo de luz en el suelo, y cuando entra la papelera se enciende por dentro.
// Va fluido (a 60, nada a pasos), con la cámara que se acerca despacio y un empujón en cada golpe, y el desenfoque de estudio en el
// suelo de delante. Dos lienzos: detrás, desenfocado, el fondo del estudio con las vitrinas de la pared (la ventana, la diana y la
// balda, CristalPared); delante, nítido y transparente donde va el fondo, todo lo demás. El vidrio solo dobla lo que está en su
// lienzo: por eso el nítido lleva también el fondo, pero solo para el vidrio y el espejo (FondoSoloVidrio).

const LUZ: V3 = [-0.45, 0.8, -0.6]; // hacia dónde está la luz principal: detrás, arriba y a la izquierda (contraluz, como en las fotos de vidrio)
const nl = Math.hypot(...LUZ);
const SOMBRA: [number, number] = [-LUZ[0] / LUZ[1], -LUZ[2] / LUZ[1]]; // lo que se corre la sombra en el suelo por cada px de alto

type Mando = {barrido: number; xBarrido: number; giro: number; calor: number; uT: number};

// el que manda en cada cuadro, justo antes de pintar: hornea los reflejos del estudio (con el barrido donde toca) y pinta el espejo
const Director: React.FC<{mando: Mando; suelo: Suelo}> = ({mando, suelo}) => {
  const {gl, scene, camera} = useThree();
  gl.toneMapping = THREE.NeutralToneMapping;
  gl.toneMappingExposure = 1.08;
  gl.setClearColor('#000000', 0);
  const estudio = useMemo(creaEstudio, []);
  const pm = useMemo(() => new THREE.PMREMGenerator(gl), [gl]);
  const antes = useRef<THREE.WebGLRenderTarget | null>(null);
  useFrame(() => {
    estudio.coloca(mando);
    const rt = pm.fromScene(estudio.escena, 0, 1, 1000, {size: 256});
    scene.environment = rt.texture;
    scene.environmentIntensity = 1;
    if (antes.current) antes.current.dispose();
    antes.current = rt;
    (suelo.U.uT as THREE.IUniform<number>).value = mando.uT;
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    suelo.refleja(gl, scene, camera);
  });
  return null;
};

const Luces: React.FC<{bombilla: V3; brillo: number}> = ({bombilla, brillo}) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(560, -1250, 0);
  tgt.updateMatrixWorld();
  const lejos = 4000;
  return (
    <>
      <hemisphereLight args={['#cfd9ff', '#120e0a', 0.22]} />
      <primitive object={tgt} />
      {/* el contraluz: detrás, arriba, a la izquierda (el canto blanco de la bola y el brillo de cada pieza) */}
      <directionalLight position={[560 + (LUZ[0] / nl) * lejos, -1250 + (LUZ[1] / nl) * lejos, (LUZ[2] / nl) * lejos]} target={tgt} intensity={2.4} color="#fff3e6" />
      {/* el relleno de delante, frío y suave: la cara blanca de la bola */}
      <directionalLight position={[560 + 1800, -1250 + 900, 3400]} target={tgt} intensity={1.15} color="#e8f0ff" />
      <pointLight position={bombilla} intensity={1.0 + 1.6 * brillo} distance={1300} decay={0} color="#ffcf8f" />
    </>
  );
};

// las estrellas de cuatro puntas (con su halo)
const Destellos: React.FC<{lista: Destello[]}> = ({lista}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', pointerEvents: 'none'}}>
    <defs>
      <radialGradient id="halo-cristal">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="30%" stopColor="#ffffff" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <filter id="brillo-cristal" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    {lista.map((d, k) => (
      <g key={k} transform={`translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) rotate(${d.giro.toFixed(1)}) scale(${(d.tam / 2).toFixed(2)})`} opacity={clamp(d.a)}>
        <circle r={0.55} fill="url(#halo-cristal)" />
        <g filter="url(#brillo-cristal)">
          <path d="M0,-1 L0.06,-0.06 L1,0 L0.06,0.06 L0,1 L-0.06,0.06 L-1,0 L-0.06,-0.06 Z" fill={d.col} />
          <path d="M0,-0.42 L0.035,-0.035 L0.42,0 L0.035,0.035 L0,0.42 L-0.035,0.035 L-0.42,0 L-0.035,-0.035 Z" fill={d.col} transform="rotate(45)" />
        </g>
      </g>
    ))}
  </svg>
);

const halo = (x: number, y: number, r: number, col: string, a: number, ry = r): React.ReactNode =>
  a > 0.004 ? (
    <div style={{position: 'absolute', left: x - r, top: y - ry, width: 2 * r, height: 2 * ry, borderRadius: '50%', pointerEvents: 'none', mixBlendMode: 'screen',
      background: `radial-gradient(closest-side, ${col.replace('A', a.toFixed(3))} 0%, ${col.replace('A', (a * 0.35).toFixed(3))} 45%, ${col.replace('A', '0')} 100%)`}} />
  ) : null;

export const Cristal: React.FC<{intento: number; t: number}> = ({intento, t: tt}) => {
  const i = clamp(Math.round(intento), 0, 9);
  const t = clamp(tt, 0, DUR);
  const e = lanzamiento(i, t);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const suelo = useMemo(() => creaSuelo(Math.round(540 * dpr), Math.round(960 * dpr)), [dpr]);

  // la luz que cuenta la historia
  const {media: luzMedia, carga} = luzAro(i, t);
  const ll = llenado(i, t);
  const dentro = ll.k * (0.85 + 0.15 * Math.sin((t - ll.desde) * 9));
  const bar = barrido(i, t);
  const lista = destellos(i, t, e.papelera.inclina);
  const golpeLampara = e.golpes.find((g) => g.tipo === 'lampara');
  const brilloLampara = golpeLampara ? Math.exp(-(t - golpeLampara.t) / 0.35) * (0.7 + 0.3 * Math.sin((t - golpeLampara.t) * 60)) : 0;
  const calor = e.muneco.cara === 'feliz' ? 1 : e.muneco.cara === 'ilusion' ? 0.45 : e.muneco.cara === 'tension' ? 0.25 : 0;
  const mando: Mando = {barrido: bar.b, xBarrido: bar.x, giro: -0.16 + 0.32 * (t / DUR), calor, uT: t * 0.9};

  // la bombilla (donde está con el balanceo de la lámpara)
  const cl = centroLampara(e.lampara.ang);
  const dB = LAMPARA.alto / 2 + 10;
  const bomb: V3 = [cl[0] + dB * Math.sin(e.lampara.ang), cl[1] + dB * Math.cos(e.lampara.ang), 0];

  // ---- lo que pinta el suelo: las sombras de color, la de la bola, los anillos y el brillo de dentro
  const U = suelo.U;
  {
    const sA = U.uSA.value as THREE.Vector4[], sB = U.uSB.value as THREE.Vector4[], sT = U.uST.value as THREE.Vector3[];
    const pc = esqueleto(e.muneco).pecho;
    const altoPecho = SUELO - pc[1];
    // (anillo: la media luna de lente, solo en lo hueco: la papelera)
    const sombras: {a: [number, number]; h: number; r: number; o: number; c: number; tinte: [number, number, number]; semilla: number; anillo?: number}[] = [
      {a: [PAPELERA.x, PAPELERA.z], h: (SUELO - PAPELERA.yBorde) * 0.92, r: PAPELERA.rBase * 1.2, o: 0.62, c: 0.75 + 0.6 * luzMedia + 2.2 * dentro + 0.8 * carga, tinte: [1, 0.22, 0.2], semilla: 0, anillo: 1},
      {a: [pc[0], pc[2]], h: altoPecho * 0.9, r: 92, o: 0.5, c: 0.55 + 0.4 * calor, tinte: [1, 0.62, 0.22], semilla: 3.1},
      {a: [SILLA.x, SILLA.z], h: 140, r: 130, o: 0.45, c: 0.12, tinte: [0.35, 0.55, 1], semilla: 7.7},
      {a: [(MESA.x0 + MESA.x1) / 2, (MESA.z0 + MESA.z1) / 2], h: 260, r: 150, o: 0.4, c: 0.14, tinte: [0.35, 1, 0.85], semilla: 5.3},
    ];
    for (let k = 0; k < N_SOMBRAS; k++) {
      const s = sombras[k];
      if (!s) {
        sB[k].set(0, 0, 0, 0);
        continue;
      }
      sA[k].set(s.a[0], s.a[1], s.a[0] + SOMBRA[0] * s.h, s.a[1] + SOMBRA[1] * s.h);
      sB[k].set(s.r, s.o, s.c, s.semilla);
      sT[k].set(...s.tinte);
      (U.uSR.value as number[])[k] = s.anillo ?? 0;
    }
    // la sombra de la bola (se corre y se abre con la altura); dentro de la papelera no llega al suelo
    const c = e.bola.c;
    const h = SUELO - R_BOLA - c[1];
    (U.uBola.value as THREE.Vector4).set(c[0] + SOMBRA[0] * (h + R_BOLA), c[2] + SOMBRA[1] * (h + R_BOLA), 62 + h * 0.12, e.bola.dentro ? 0 : 0.85 * clamp(1 - h / 700));
    const on = ondas(i, t);
    const oV = U.uOnda.value as THREE.Vector4[], oC = U.uOndaCol.value as THREE.Vector3[];
    for (let k = 0; k < N_ONDAS; k++) {
      const o = on[k];
      if (!o) oV[k].set(0, 0, 0, 0);
      else {
        oV[k].set(o.x, o.z, o.r, o.w);
        oC[k].set(...o.col);
      }
    }
    (U.uBrillo.value as THREE.Vector4).set(PAPELERA.x, PAPELERA.z, 330, 0.5 * dentro + 0.22 * carga + 0.03 * luzMedia);
    (U.uLamp.value as THREE.Vector4).set(bomb[0], 40, 360, 0.09 + 0.12 * brilloLampara);
  }

  // ---- la cámara: se acerca despacio (a unos) y da un empujón en cada golpe
  const [sx, sy] = e.temblor;
  const mover = `translate(${sx}px, ${sy}px) scale(${1 + 0.025 * (t / DUR)})`;

  // ---- los brillos de encima (lo que en una foto hace el objetivo con las luces fuertes)
  const pB = proyecta(e.bola.c);
  const pBomb = proyecta(bomb);
  const pBoca = proyecta([PAPELERA.x, PAPELERA.yBorde + 70, PAPELERA.z]);
  const aroDcha = puntoAro(0), aroIzq = puntoAro(Math.PI);

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: mover, transformOrigin: '60% 58%'}}>
        <FondoDesenfocado dpr={dpr} desenfoque={6} />
        <ThreeCanvas width={1080} height={1920} dpr={dpr} gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}}
          camera={{fov: FOV, near: 60, far: 20000, position: [540, -CAM_Y, D]}} style={{position: 'absolute', left: 0, top: 0}}>
          <Camara ancho={1080} alto={1920} />
          <Director mando={mando} suelo={suelo} />
          <Luces bombilla={[bomb[0], -bomb[1], bomb[2] + 20]} brillo={brilloLampara} />
          <FondoSoloVidrio />
          <primitive object={suelo.malla} />
          <PanelCristal />
          <Mesa />
          <Silla pose={e.muneco} />
          <MunecoCristal pose={e.muneco} calor={calor} />
          <Papelera inclina={e.papelera.inclina} luz={luzMedia} dentro={dentro} carga={carga} />
          <BolaCristal b={e.bola} />
          <Lampara ang={e.lampara.ang} brillo={brilloLampara} />
        </ThreeCanvas>
        {/* los halos: la bombilla, la perla y la boca de la papelera cuando se enciende */}
        {halo(pBomb[0], pBomb[1] + 6, 230, 'rgba(255,214,150,A)', 0.42 + 0.35 * brilloLampara)}
        {halo(pB[0], pB[1], R_BOLA * 2.4, 'rgba(255,255,255,A)', 0.2)}
        {halo(pBoca[0], pBoca[1] - 20, 300, 'rgba(255,70,50,A)', 0.55 * dentro, 220)}
        {halo((aroDcha[0] + aroIzq[0]) / 2, aroDcha[1], 200, 'rgba(255,90,70,A)', 0.06 * luzMedia + 0.25 * carga, 60)}
        {carga > 0.01 && halo(pB[0] - 6, pB[1] + 52, 120, 'rgba(255,120,95,A)', 0.5 * carga, 70)}
        {halo(pBoca[0], pBoca[1] - 20, 260, 'rgba(255,60,40,A)', 0.42 * carga, 190)}
        <Destellos lista={lista} />
        {/* el desenfoque de estudio: el suelo de delante, fuera de foco */}
        <div style={{position: 'absolute', left: -20, right: -20, top: 1640, height: 320, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 55%)', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 55%)', pointerEvents: 'none'}} />
      </AbsoluteFill>
      {/* la viñeta del estudio */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 52% 58%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
