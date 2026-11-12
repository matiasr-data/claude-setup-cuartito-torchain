import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three-stdlib';
import {clamp, rng} from '../../comun/curvas';
import {CAM_Y, D, DUR, FOV, MURO_X, SUELO, T_PRIMERO, Z_PARED, bola, lanzamiento, proyecta, temblor, type V3} from './escena';
import {BolaPapel, Lampara, Mesa, Papelera, Paredes, SombraPapelera, Suelo, Sueltas, bombilla} from './BloquesDecorado';
import {Muneco, Silla} from './BloquesMuneco';

// LA BOLA DE PAPEL EN BLOQUES DE JUGUETE (la escena en ./escena.ts). Como una foto macro de stop motion de
// piezas de juguete sobre una mesa: plástico brillante con su reflejo (los paneles de luz de un estudio en cada pieza) y sus tetones,
// colores de juguete, la bola de papel blanco arrugado (mate, con las rayas del cuaderno rotas en cada pliegue), luz cálida con
// sombras suaves, y el fondo desenfocado como un objetivo macro: la pared muy, el suelo de delante bastante, lo del plano de la
// papelera nítido. Se anima «a dos» (12 posturas por segundo, cada pieza temblando un pelo distinto en cada una) y la bola, que
// vuela, «a unos» a 24; la cámara, a 60, con un empujón en cada golpe.
// La técnica es la de la plastilina del gato (../gato/Plastilina.tsx): la cámara de frente con el
// objetivo descentrado (el plano de la papelera sale 1:1 en el lienzo de 1080 × 1920) y varios lienzos apilados con su desenfoque.

const PASOS = 12; // el muñeco, la papelera y la lámpara
const PASOS_BOLA = 24; // la bola
const MARGEN = 40; // los lienzos desenfocados, más grandes para que el desenfoque no oscurezca los bordes
const DESENFOQUE_PARED = 7;
const DESENFOQUE_SUELO = 1.4;
const DESENFOQUE_DELANTE = 4.5;
const CORTE = 300; // desde esta z, el suelo de delante (más desenfocado)
// la luz principal: arriba a la izquierda (por la ventana) y por delante; su sombra cae detrás a la derecha
const LLAVE: V3 = [-0.55, 0.85, 0.62];

const Camara: React.FC<{ancho: number; alto: number}> = ({ancho, alto}) => {
  const {camera} = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = (2 * Math.atan(alto / 2 / D) * 180) / Math.PI;
  cam.aspect = ancho / alto;
  cam.near = 60;
  cam.far = 20000;
  cam.position.set(540, -CAM_Y, D);
  cam.lookAt(540, -CAM_Y, 0);
  cam.setViewOffset(ancho, alto, 0, 960 - CAM_Y, ancho, alto);
  cam.updateProjectionMatrix();
  return null;
};

// el tono y los reflejos del estudio (un cuarto blanco con paneles de luz: dan los brillos rectangulares del plástico)
const Estudio: React.FC<{reflejo: number}> = ({reflejo}) => {
  const {gl, scene} = useThree();
  gl.toneMapping = THREE.NeutralToneMapping;
  gl.toneMappingExposure = 1.0;
  const env = useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const t = pm.fromScene(RoomEnvironment(), 0.04).texture;
    pm.dispose();
    return t;
  }, [gl]);
  scene.environment = env;
  scene.environmentIntensity = reflejo;
  return null;
};

const Luces: React.FC<{objetivo: V3; caja: number; parpadeo: number; mapa: number; bombillaEn: V3; sombras?: boolean}> = ({objetivo, caja, parpadeo, mapa, bombillaEn, sombras = true}) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(...objetivo);
  tgt.updateMatrixWorld();
  const n = Math.hypot(...LLAVE);
  const lejos = 4000;
  const pos: V3 = [objetivo[0] + (LLAVE[0] / n) * lejos, objetivo[1] + (LLAVE[1] / n) * lejos, objetivo[2] + (LLAVE[2] / n) * lejos];
  return (
    <>
      <hemisphereLight args={['#EAF0FF', '#8F7050', 0.42 * parpadeo]} />
      <primitive object={tgt} />
      <directionalLight position={pos} target={tgt} intensity={2.7 * parpadeo} color="#FFE2BE" castShadow={sombras}
        shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} shadow-bias={-0.0004} shadow-normalBias={2} shadow-radius={6} shadow-blurSamples={16}
        shadow-camera-left={-caja} shadow-camera-right={caja} shadow-camera-top={caja} shadow-camera-bottom={-caja}
        shadow-camera-near={100} shadow-camera-far={9000} />
      {/* el relleno por la derecha y el contraluz frío por detrás (el borde brillante de cada pieza) */}
      <directionalLight position={[objetivo[0] + 2600, objetivo[1] + 600, objetivo[2] + 2600]} intensity={0.45 * parpadeo} color="#FFF4E8" />
      <directionalLight position={[objetivo[0] + 1400, objetivo[1] + 1800, objetivo[2] - 3500]} intensity={1.1 * parpadeo} color="#D4E3FF" />
      {/* la bombilla de la lámpara: un charco de luz cálida */}
      <pointLight position={bombillaEn} intensity={0.9 * parpadeo} distance={1500} decay={0} color="#FFD49A" />
    </>
  );
};

export const Bloques: React.FC<{intento: number; t: number}> = ({intento, t: tt}) => {
  const i = clamp(Math.round(intento), 0, 9);
  const t = clamp(tt, 0, DUR);
  // a dos: las posturas caen justo en el primer toque de este lanzamiento
  const T1 = T_PRIMERO[i];
  const fase = (pasos: number) => T1 - Math.floor(T1 * pasos) / pasos;
  const paso = Math.floor((t - fase(PASOS)) * PASOS + 1e-6);
  const tq = Math.max(0, paso / PASOS + fase(PASOS));
  const pasoB = Math.floor((t - fase(PASOS_BOLA)) * PASOS_BOLA + 1e-6);
  const tb = Math.max(0, pasoB / PASOS_BOLA + fase(PASOS_BOLA));
  const e = lanzamiento(i, tq);
  const b = bola(i, tb);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const parpadeo = 1 + (rng(paso * 31 + 3)() - 0.5) * 0.03;
  const bomb = bombilla(e.lampara.ang);
  const bombillaEn: V3 = [bomb[0], -bomb[1], bomb[2] + 20];
  // la cámara: un empujón en cada golpe y un acercamiento lento hacia la papelera (a unos)
  const [sx, sy] = temblor(i, t);
  const mover = `translate(${sx}px, ${sy}px) scale(${1 + 0.025 * (t / DUR)})`;
  const [gx, gy] = proyecta([bomb[0], bomb[1], bomb[2]]);

  const lienzo = (ancho: number, alto: number) => ({
    width: ancho, height: alto, dpr, shadows: 'percentage' as const, gl: {antialias: true, alpha: true},
    camera: {fov: FOV, near: 60, far: 20000, position: [540, -CAM_Y, D] as V3},
  });
  return (
    <AbsoluteFill style={{background: '#7b93ae', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: mover, transformOrigin: '60% 58%'}}>
        {/* la pared del fondo y la de la derecha, muy desenfocadas */}
        <div style={{position: 'absolute', left: -MARGEN, top: -MARGEN, width: 1080 + 2 * MARGEN, height: 1920 + 2 * MARGEN, filter: `blur(${DESENFOQUE_PARED}px)`}}>
          <ThreeCanvas {...lienzo(1080 + 2 * MARGEN, 1920 + 2 * MARGEN)}>
            <Camara ancho={1080 + 2 * MARGEN} alto={1920 + 2 * MARGEN} />
            <Estudio reflejo={0.6} />
            <color attach="background" args={['#7b93ae']} />
            <Luces objetivo={[560, -800, Z_PARED]} caja={1500} parpadeo={parpadeo} mapa={1024} bombillaEn={bombillaEn} />
            <Paredes />
          </ThreeCanvas>
        </div>
        {/* el suelo de atrás, un pelo desenfocado */}
        <div style={{position: 'absolute', inset: 0, filter: `blur(${DESENFOQUE_SUELO}px)`}}>
          <ThreeCanvas {...lienzo(1080, 1920)}>
            <Camara ancho={1080} alto={1920} />
            <Estudio reflejo={0.45} />
            <Luces objetivo={[540, -SUELO, 0]} caja={1200} parpadeo={parpadeo} mapa={512} bombillaEn={bombillaEn} sombras={false} />
            <Suelo desde={Z_PARED} hasta={CORTE} />
          </ThreeCanvas>
        </div>
        {/* el suelo de delante, más desenfocado (lo que está cerca del objetivo) */}
        <div style={{position: 'absolute', left: -MARGEN, top: -MARGEN, width: 1080 + 2 * MARGEN, height: 1920 + 2 * MARGEN, filter: `blur(${DESENFOQUE_DELANTE}px)`}}>
          <ThreeCanvas {...lienzo(1080 + 2 * MARGEN, 1920 + 2 * MARGEN)}>
            <Camara ancho={1080 + 2 * MARGEN} alto={1920 + 2 * MARGEN} />
            <Estudio reflejo={0.45} />
            <Luces objetivo={[540, -SUELO, 600]} caja={1400} parpadeo={parpadeo} mapa={512} bombillaEn={bombillaEn} sombras={false} />
            <Suelo desde={CORTE} hasta={1500} />
            <Sueltas />
          </ThreeCanvas>
        </div>
        {/* nítido: la mesa, la silla, el muñeco, la papelera, la bola y la lámpara, con sus sombras en el suelo */}
        <ThreeCanvas {...lienzo(1080, 1920)} style={{position: 'absolute', left: 0, top: 0}}>
          <Camara ancho={1080} alto={1920} />
          <Estudio reflejo={0.5} />
          <Luces objetivo={[560, -1240, 0]} caja={950} parpadeo={parpadeo} mapa={2048} bombillaEn={bombillaEn} />
          <mesh position={[(MURO_X - 700) / 2, -SUELO + 0.5, 300]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[MURO_X + 700, 1600]} />
            <shadowMaterial color="#3a2410" opacity={0.5} transparent />
          </mesh>
          <Mesa />
          <Silla pose={e.muneco} />
          <Muneco pose={e.muneco} paso={paso} />
          <SombraPapelera />
          <Papelera inclina={e.papelera.inclina} />
          <BolaPapel b={b} />
          <Lampara ang={e.lampara.ang} />
        </ThreeCanvas>
        {/* el brillo de la bombilla */}
        <div style={{position: 'absolute', left: gx - 170, top: gy - 170, width: 340, height: 340, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(255,226,160,0.55) 0%, rgba(255,214,140,0.18) 38%, rgba(255,214,140,0) 70%)', mixBlendMode: 'screen'}} />
      </AbsoluteFill>
      {/* la viñeta cálida de la foto */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 66% at 52% 56%, rgba(0,0,0,0) 56%, rgba(40,24,10,0.36) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
