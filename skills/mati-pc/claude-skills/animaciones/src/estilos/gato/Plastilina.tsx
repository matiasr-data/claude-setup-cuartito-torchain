import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three-stdlib';
import {clamp, p, rng, temblor} from '../../comun/curvas';
import {ajustaRelieve, type V3} from '../PlastilinaArcilla';
import {D, FOV} from '../camara3d';
import {DUR, SUELO, T_SUELO, gato} from './escena';
import {CAM_Y, COL_COCINA, Mesa, Pared, Suelo, Z_PARED} from './PlastilinaCocina';
import {GatoArcilla, brillantesGato} from './PlastilinaGato';
import {TazaArcilla, brillantesTaza} from './PlastilinaTaza';

// EL GATO EN 10 · PLASTILINA (claymation): la escena de ./escena.ts como una película de stop motion a lo Aardman. Un
// gato naranja atigrado de plastilina mate y algo cerosa (huellas de dedo, presiones de pulgar, bultos), sentado en una mesa de
// madera de plastilina en una cocina de plastilina, con luz cálida de estudio y sombras suaves. Te mira de frente con los párpados
// a media asta mientras empuja la taza, y la taza roja cae girando a saltos y se rompe en trozos gordos que rebotan, con el café de
// plastilina brillante. Todo lo que se anima va «a dos» (12 posturas por segundo, y en cada una todo tiembla un pelo distinto); la
// cámara (el golpe al romperse) va «a unos», como en el stop motion con grúa.
// Tres lienzos, como un objetivo macro: la pared muy desenfocada, el suelo un poco y, nítido, lo que está en el plano del gato (la
// mesa, él, la taza y lo que se rompe). La cámara mira de frente y el plano del gato sale 1:1: el gato, en el mismo sitio y del mismo
// tamaño que en los estilos planos (escena.ts), pero a la altura de sus ojos (PlastilinaCocina, CAM_Y).

const PASOS = 12; // posturas por segundo
// las posturas caen justo en el golpe (3,1 s): así el primer cuadro roto es el del golpe
const FASE = T_SUELO - Math.floor(T_SUELO * PASOS) / PASOS;
const MARGEN = 48; // el lienzo de la pared es más grande para que el desenfoque no oscurezca los bordes
const DESENFOQUE = 11; // px de desenfoque de la pared (a 1080)
const DESENFOQUE_SUELO = 3;

// la luz principal: arriba a la izquierda y por delante; su sombra cae detrás y a la derecha
const LLAVE: V3 = [-0.45, 1, 0.55];

const Camara: React.FC<{ancho: number; alto: number}> = ({ancho, alto}) => {
  const {camera} = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = (2 * Math.atan(alto / 2 / D) * 180) / Math.PI;
  cam.aspect = ancho / alto;
  cam.near = 60;
  cam.far = 20000;
  cam.position.set(540, -CAM_Y, D);
  cam.lookAt(540, -CAM_Y, 0);
  // el objetivo descentrado: la cámara está a la altura de los ojos del gato, pero el cuadro es el de siempre
  cam.setViewOffset(ancho, alto, 0, 960 - CAM_Y, ancho, alto);
  cam.updateProjectionMatrix();
  return null;
};

const Tono: React.FC = () => {
  const {gl} = useThree();
  gl.toneMapping = THREE.NeutralToneMapping;
  gl.toneMappingExposure = 1.0;
  return null;
};

// los reflejos del estudio, solo en lo que brilla (el café, el esmalte de la taza, los ojos): un cuarto blanco de estudio
// alrededor, como las cajas de luz de una foto de producto. La plastilina mate no lo lleva.
const Entorno: React.FC = () => {
  const {gl} = useThree();
  const tex = useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const t = pm.fromScene(RoomEnvironment(), 0.04).texture;
    pm.dispose();
    return t;
  }, [gl]);
  for (const [m, k] of [...brillantesTaza(), ...brillantesGato()]) {
    if (m.envMap !== tex) {
      m.envMap = tex;
      m.needsUpdate = true;
    }
    m.envMapIntensity = k;
    m.sheen = 0; // lo que brilla no lleva el terciopelo de la plastilina
    m.clearcoatRoughness = Math.min(m.clearcoatRoughness, 0.08);
  }
  return null;
};

// las luces de estudio: cielo cálido, la principal con sombra suave, un relleno por la derecha, un contraluz y (en el plano del gato)
// una luz baja por detrás que saca el brillo al café y el borde a la silueta, y otra débil desde la cámara para el brillo de los ojos
const Luces: React.FC<{objetivo: V3; caja: number; parpadeo: number; mapa: number; frente?: boolean}> = ({objetivo, caja, parpadeo, mapa, frente}) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(...objetivo);
  tgt.updateMatrixWorld();
  const n = Math.hypot(...LLAVE);
  const lejos = 4000;
  const pos: V3 = [objetivo[0] + (LLAVE[0] / n) * lejos, objetivo[1] + (LLAVE[1] / n) * lejos, objetivo[2] + (LLAVE[2] / n) * lejos];
  return (
    <>
      <hemisphereLight args={['#FFF1DE', '#A5704B', 1.2 * parpadeo]} />
      <primitive object={tgt} />
      <directionalLight position={pos} target={tgt} intensity={2.5 * parpadeo} color="#FFE2BD" castShadow
        shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} shadow-bias={-0.0003} shadow-normalBias={2.5} shadow-radius={7}
        shadow-blurSamples={16}
        shadow-camera-left={-caja} shadow-camera-right={caja} shadow-camera-top={caja} shadow-camera-bottom={-caja}
        shadow-camera-near={100} shadow-camera-far={9000} />
      <directionalLight position={[objetivo[0] + 2500, objetivo[1] + 800, objetivo[2] + 3000]} intensity={0.75 * parpadeo} color="#FFF3E2" />
      <directionalLight position={[objetivo[0] + 1200, objetivo[1] + 1500, objetivo[2] - 3500]} intensity={1.1 * parpadeo} color="#FFE7C9" />
      {frente && (
        <>
          <directionalLight position={[objetivo[0] + 300, objetivo[1] + 1100, objetivo[2] - 4000]} intensity={1.2 * parpadeo} color="#FFF0DA" />
          <directionalLight position={[objetivo[0] - 600, objetivo[1] + 900, objetivo[2] + 4000]} intensity={0.35 * parpadeo} color="#FFFFFF" />
        </>
      )}
    </>
  );
};

export const Plastilina: React.FC<{t: number}> = ({t: tt}) => {
  const t = clamp(tt, 0, DUR);
  // a dos: el tiempo salta de 1/12 en 1/12 de segundo (con las posturas puestas para que una caiga en el golpe)
  const paso = Math.max(0, Math.floor((t - FASE) * PASOS + 1e-6));
  const tq = paso / PASOS + FASE;
  const g = gato(tq);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  ajustaRelieve(dpr);
  // el parpadeo de la luz entre foto y foto (muy poco)
  const parpadeo = 1 + (rng(paso * 31 + 3)() - 0.5) * 0.035;
  // el golpe: la cámara tiembla un momento (a unos, suave)
  const [sx, sy] = temblor(t, T_SUELO, 0.36, 10, 5);
  const golpe = t >= T_SUELO ? 1 - p(t, T_SUELO, 0.36) : 0;
  const mover = `translate(${sx}px, ${sy}px) scale(${1 + 0.02 * golpe})`;

  return (
    <AbsoluteFill style={{background: COL_COCINA.pared, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: mover, transformOrigin: '50% 60%'}}>
        {/* la pared, muy desenfocada */}
        <div style={{position: 'absolute', left: -MARGEN, top: -MARGEN, width: 1080 + 2 * MARGEN, height: 1920 + 2 * MARGEN, filter: `blur(${DESENFOQUE}px)`}}>
          <ThreeCanvas width={1080 + 2 * MARGEN} height={1920 + 2 * MARGEN} dpr={dpr} shadows="percentage" gl={{antialias: true}}
            camera={{fov: FOV, near: 60, far: 20000, position: [540, -CAM_Y, D]}}>
            <Camara ancho={1080 + 2 * MARGEN} alto={1920 + 2 * MARGEN} />
            <Tono />
            <color attach="background" args={[COL_COCINA.pared]} />
            <Luces objetivo={[560, -900, Z_PARED]} caja={1500} parpadeo={parpadeo} mapa={2048} />
            <Pared t={t} />
          </ThreeCanvas>
        </div>
        {/* el suelo, un poco desenfocado */}
        <div style={{position: 'absolute', inset: 0, filter: `blur(${DESENFOQUE_SUELO}px)`}}>
          <ThreeCanvas width={1080} height={1920} dpr={dpr} shadows="percentage" gl={{antialias: true, alpha: true}}
            camera={{fov: FOV, near: 60, far: 20000, position: [540, -CAM_Y, D]}}>
            <Camara ancho={1080} alto={1920} />
            <Tono />
            <Luces objetivo={[540, -SUELO, 200]} caja={1300} parpadeo={parpadeo} mapa={1024} />
            <Suelo />
          </ThreeCanvas>
        </div>
        {/* nítido: la mesa, el gato y la taza, con sus sombras en el suelo */}
        <ThreeCanvas width={1080} height={1920} dpr={dpr} shadows="percentage" gl={{antialias: true, alpha: true}} style={{position: 'absolute', left: 0, top: 0}}
          camera={{fov: FOV, near: 60, far: 20000, position: [540, -CAM_Y, D]}}>
          <Camara ancho={1080} alto={1920} />
          <Tono />
          <Luces objetivo={[540, -1050, 0]} caja={1000} parpadeo={parpadeo} mapa={2048} frente />
          <Entorno />
          <mesh position={[540, -SUELO + 0.3, 300]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[3000, 1400]} />
            <shadowMaterial color="#4A240E" opacity={0.42} transparent />
          </mesh>
          <Mesa />
          <GatoArcilla g={g} t={tq} paso={paso} />
          <TazaArcilla tq={tq} paso={paso} dpr={dpr} />
        </ThreeCanvas>
      </AbsoluteFill>
      {/* la viñeta cálida de la foto */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 78% 64% at 50% 48%, rgba(0,0,0,0) 58%, rgba(60,30,10,0.34) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
