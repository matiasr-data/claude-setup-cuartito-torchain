import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three-stdlib';
import {rng} from '../../../comun/curvas';
import {ALTO, CAM_Y, D, FOV, PLACA, STUD, SUELO, Z_PARED} from '../escena';
import {creaEstudio, planoFondo, texturaFondo, vidrio} from './CristalEstudio';
import {Fondo} from './CristalPiezas';

// CRISTAL, LA PARED: lo que en los bloques cuelga de la pared (la ventana, el cartel de la diana y la balda con
// sus libros), en el mismo sitio y del mismo tamaño, pero como vitrinas de producto: piezas de vidrio con su luz detrás.
//   · la ventana: un panel de vidrio esmerilado con el cielo frío detrás y la silueta de los árboles, su marco de barras de cristal
//     tallado, el alféizar y una maceta de vidrio ámbar con hojas verdes;
//   · la diana: una losa de cristal ahumado con los anillos rojos y blancos encendidos detrás y una lente de vidrio encima que los agranda;
//   · la balda: una losa de cristal con su luz en el canto, y los libros, bloques de vidrio de colores con la luz de detrás.
// Va en su propio lienzo, DESENFOCADO detrás de todo (como la pared de los bloques): llena la parte de arriba sin quitarle el sitio a la
// papelera. El lienzo nítido lleva el mismo fondo solo para que su vidrio lo doble (FondoSoloVidrio).

// la cámara de todos los lienzos: de frente, con el objetivo descentrado (el plano de la papelera sale 1:1)
export const Camara: React.FC<{ancho: number; alto: number}> = ({ancho, alto}) => {
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

// el fondo en el lienzo nítido: solo se pinta en lo que ve el vidrio (y el espejo del suelo), nunca en la pantalla. Así el vidrio
// lo dobla y el lienzo se queda transparente ahí, dejando ver el fondo desenfocado de detrás.
export const FondoSoloVidrio: React.FC = () => {
  const malla = useMemo(() => {
    const p = planoFondo();
    const mat = new THREE.MeshBasicMaterial({map: texturaFondo()});
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.ancho, p.alto), mat);
    m.position.set(...p.centro);
    m.onBeforeRender = (r) => {
      mat.colorWrite = r.getRenderTarget() !== null;
    };
    return m;
  }, []);
  return <primitive object={malla} />;
};

// ---------------------------------------------------------------- las piezas
const cajas = new Map<string, THREE.BufferGeometry>();
// una caja de cristal tallado: sus cantos, chaflanes planos (con facetas cada uno brilla por su lado)
const geoTallada = (w: number, h: number, d: number, ch: number) => {
  const k = `${w}|${h}|${d}|${ch}`;
  let g = cajas.get(k);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, 1, Math.min(ch, w / 2 - 0.5, h / 2 - 0.5, d / 2 - 0.5));
    cajas.set(k, g);
  }
  return g;
};
const lienzo = (w: number, h: number, pinta: (x: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  pinta(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const luz = (tex: THREE.Texture, fuerza: number) => new THREE.MeshBasicMaterial({map: tex, toneMapped: false, color: new THREE.Color(fuerza, fuerza, fuerza)});

// la ventana de los bloques: de x 0 a 6 tetones, de la fila 11 a la 16 (BloquesDecorado, VENTANA)
const filaY = (k: number) => SUELO - (k + 1) * ALTO;
const V = {x0: 0, x1: 6 * STUD, y0: filaY(16), y1: filaY(10)};
const ZF = Z_PARED;

const texturaCielo = () =>
  lienzo(256, 320, (x) => {
    const g = x.createLinearGradient(0, 0, 0, 320);
    g.addColorStop(0, '#8dbbe6');
    g.addColorStop(0.65, '#cfe5f6');
    g.addColorStop(1, '#eef7ff');
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 320);
    // dos nubes y los árboles (las mismas manchas que en los bloques, pasadas al lienzo: x de −10 a 394, y de y0 − 10 a y1 + 10)
    const X = (v: number) => ((v + 10) / (V.x1 - V.x0 + 20)) * 256;
    const Y = (v: number) => ((v - (V.y0 - 10)) / (V.y1 - V.y0 + 20)) * 320;
    const S = 256 / (V.x1 - V.x0 + 20);
    x.fillStyle = 'rgba(255,255,255,0.85)';
    for (const [cx, cy, s] of [[90, 300, 1], [300, 250, 0.8]]) {
      for (const [bx, by, br] of [[-46, 8, 34], [-10, -8, 44], [30, 4, 36], [62, 12, 24]]) {
        x.beginPath();
        x.arc(X(cx + bx * s), Y(cy + by * s), br * s * S, 0, Math.PI * 2);
        x.fill();
      }
    }
    for (const [cx, cy, r, c] of [[60, 610, 70, '#3c6c6c'], [170, 580, 92, '#33605f'], [290, 600, 80, '#3c6c6c'], [380, 620, 64, '#33605f']] as [number, number, number, string][]) {
      x.fillStyle = c;
      x.beginPath();
      x.arc(X(cx), Y(cy), r * S, 0, Math.PI * 2);
      x.fill();
      x.fillRect(X(cx) - 4, Y(cy), 8, 320);
    }
  });

const texturaDiana = () =>
  lienzo(256, 340, (x) => {
    // el cartel de los bloques (texturaPoster) encendido por detrás: fondo ámbar muy oscuro, los anillos y la flecha que brillan
    const g = x.createRadialGradient(128, 150, 20, 128, 170, 230);
    g.addColorStop(0, '#3a2408');
    g.addColorStop(1, '#140c04');
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 340);
    x.shadowColor = 'rgba(255,120,90,0.9)';
    x.shadowBlur = 14;
    ['#ff3a2a', '#fff1e6', '#ff3a2a', '#fff1e6', '#ff3a2a'].forEach((col, k) => {
      x.fillStyle = col;
      x.beginPath();
      x.arc(128, 150, 104 - k * 21, 0, Math.PI * 2);
      x.fill();
    });
    x.shadowColor = 'rgba(255,240,220,0.9)';
    x.strokeStyle = '#fff6ea';
    x.lineWidth = 7;
    x.beginPath();
    x.moveTo(170, 108);
    x.lineTo(232, 52);
    x.stroke();
    x.fillStyle = '#9fd0ff';
    x.beginPath();
    x.moveTo(232, 52); x.lineTo(250, 30); x.lineTo(222, 40); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,236,210,0.8)';
    x.fillRect(40, 282, 176, 14);
    x.fillRect(70, 308, 116, 10);
  });

const texturaLuzBalda = () =>
  lienzo(64, 64, (x) => {
    const g = x.createRadialGradient(32, 40, 2, 32, 40, 40);
    g.addColorStop(0, '#fff4e4');
    g.addColorStop(0.55, '#8a7a6a');
    g.addColorStop(1, '#000000');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
  });

// una lente plano-convexa (la de encima de la diana), mirando a la cámara
const geoLente = (r: number, alto: number) => {
  const perfil: THREE.Vector2[] = [];
  for (let k = 0; k <= 16; k++) {
    const a = (k / 16) * (Math.PI / 2);
    perfil.push(new THREE.Vector2(r * Math.sin(a), alto * Math.cos(a)));
  }
  perfil.push(new THREE.Vector2(r, 0), new THREE.Vector2(0, 0));
  const g = new THREE.LatheGeometry(perfil, 48);
  g.rotateX(Math.PI / 2);
  return g;
};

const LIBROS = ['#ffd6d2', '#fff0d2', '#dcffe6', '#dcebff', '#ffe6d2'];
const LIBROS_ATENUA = ['#d8203a', '#e8900e', '#1f9e5a', '#2f62e8', '#e86a1a'];

export const Vitrinas: React.FC = () => {
  const marco = vidrio('marco', {color: '#f6fbff', atenua: '#cfe8f0', dist: 260, grosor: 34, rugoso: 0.01, disp: 8, irid: 0.4, env: 2, facetas: true});
  const esmerilado = vidrio('ventana', {color: '#eef6ff', atenua: '#d6ecff', dist: 900, grosor: 10, rugoso: 0.42, disp: 2, irid: 0.2, env: 0.9});
  const losa = vidrio('losa', {color: '#f2e6dc', atenua: '#8a6a52', dist: 140, grosor: 24, rugoso: 0.01, disp: 6, irid: 0.35, env: 1.8, facetas: true});
  const lente = vidrio('lente', {color: '#ffffff', atenua: '#f4f8ff', dist: 2000, grosor: 70, rugoso: 0.0, disp: 9, irid: 0.3, env: 1.8});
  const maceta = vidrio('maceta', {color: '#ffe0b0', atenua: '#e8820e', dist: 70, grosor: 30, rugoso: 0.02, disp: 6, irid: 0.4, env: 1.8, facetas: true});
  const hoja = vidrio('hoja', {color: '#d8ffe0', atenua: '#1f9e5a', dist: 50, grosor: 20, rugoso: 0.02, disp: 6, irid: 0.4, env: 1.8, emite: '#3cd27a', brillo: 0.12, facetas: true});
  const cielo = useMemo(() => luz(texturaCielo(), 0.8), []);
  const diana = useMemo(() => luz(texturaDiana(), 0.85), []);
  const luzBalda = useMemo(() => luz(texturaLuzBalda(), 0.6), []);
  const led = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color('#ffe8cc').multiplyScalar(1.6), toneMapped: false}), []);
  const libros = useMemo(() => LIBROS.map((c, k) => vidrio(`libro-${k}`, {color: c, atenua: LIBROS_ATENUA[k], dist: 70, grosor: 40, rugoso: 0.01, disp: 7, irid: 0.4, env: 2, emite: LIBROS_ATENUA[k], brillo: 0.06, facetas: true})), []);
  const vx = (V.x0 + V.x1) / 2, vy = (V.y0 + V.y1) / 2, vw = V.x1 - V.x0, vh = V.y1 - V.y0;
  return (
    <group dispose={null}>
      {/* LA VENTANA: el cielo encendido detrás, el vidrio esmerilado, el marco y el parteluz de cristal tallado, el alféizar */}
      <mesh material={cielo} position={[vx, -vy, ZF - 70]}>
        <planeGeometry args={[vw + 20, vh + 20]} />
      </mesh>
      <mesh geometry={geoTallada(vw, vh, 8, 2)} material={esmerilado} position={[vx, -vy, ZF - 20]} />
      <mesh geometry={geoTallada(vw + 40, 40, 60, 9)} material={marco} position={[vx, -(V.y0 - 4), ZF + 10]} />
      <mesh geometry={geoTallada(vw + 70, 34, 110, 9)} material={marco} position={[vx, -(V.y1 + 14), ZF + 30]} />
      {[V.x0, V.x1].map((xx, k) => (
        <mesh key={k} geometry={geoTallada(36, vh + 30, 60, 9)} material={marco} position={[xx, -vy, ZF + 10]} />
      ))}
      <mesh geometry={geoTallada(22, vh, 40, 6)} material={marco} position={[vx, -vy, ZF - 4]} />
      <mesh geometry={geoTallada(vw, 22, 40, 6)} material={marco} position={[vx, -(V.y0 + vh * 0.45), ZF - 4]} />
      {/* la maceta del alféizar, de vidrio ámbar, con sus hojas verdes (las ilumina la ventana de detrás) */}
      <group position={[300, -(V.y1 - 3), ZF + 50]}>
        <mesh material={maceta} position={[0, 26, 0]}>
          <cylinderGeometry args={[30, 24, 52, 10, 1]} />
        </mesh>
        {[[-0.4, 70], [0, 92], [0.45, 66]].map(([a, l], k) => (
          <group key={k} position={[0, 45, 0]} rotation={[0, 0, a]}>
            <mesh material={hoja} position={[0, l / 2, 0]}>
              <cylinderGeometry args={[9, 13, l, 6, 1]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* LA DIANA: el cartel encendido detrás de una losa de cristal ahumado, con la lente encima de los anillos */}
      <mesh material={diana} position={[808, -412, ZF - 34]}>
        <planeGeometry args={[250, 340]} />
      </mesh>
      <mesh geometry={geoTallada(270, 360, 22, 7)} material={losa} position={[808, -412, ZF + 2]} />
      <mesh geometry={geoLente(108, 34)} material={lente} position={[808, -(412 - 360 / 2 + 150 * (360 / 340)), ZF + 14]} />

      {/* LA BALDA: la losa con su luz en el canto y los libros de colores, con la luz de detrás */}
      <mesh material={luzBalda} position={[820, -(830 - 130), ZF - 60]}>
        <planeGeometry args={[440, 300]} />
      </mesh>
      <mesh geometry={geoTallada(6 * STUD, PLACA, 2 * STUD, 5)} material={marco} position={[820, -830 + PLACA / 2, ZF + 70]} />
      <mesh material={led} position={[820, -830 + 2, ZF + 70 + STUD - 2]}>
        <boxGeometry args={[6 * STUD - 16, 3, 3]} />
      </mesh>
      {LIBROS.map((_, k) => {
        const h = ALTO * (1.6 + (k % 3) * 0.3);
        const R = rng(k * 17 + 3);
        return (
          <group key={k} position={[680 + k * 60, -830 + PLACA, ZF + 70]} rotation={[0, (R() - 0.5) * 0.12, k === 4 ? -0.35 : 0]}>
            <mesh geometry={geoTallada(STUD - 6, h, 2 * STUD - 10, 6)} material={libros[k]} position={[0, h / 2, 0]} />
          </group>
        );
      })}
    </group>
  );
};

// los reflejos del lienzo de detrás: el mismo estudio de tiras, quieto (va desenfocado: no hace falta hornearlo en cada cuadro)
const EstudioFijo: React.FC = () => {
  const {gl, scene} = useThree();
  gl.toneMapping = THREE.NeutralToneMapping;
  gl.toneMappingExposure = 1.08;
  const env = useMemo(() => {
    const e = creaEstudio();
    e.coloca({barrido: 0, xBarrido: 0, giro: 0, calor: 0});
    const pm = new THREE.PMREMGenerator(gl);
    const t = pm.fromScene(e.escena, 0, 1, 1000, {size: 256}).texture;
    pm.dispose();
    return t;
  }, [gl]);
  scene.environment = env;
  return null;
};

// el lienzo de detrás, desenfocado: el fondo del estudio y las vitrinas de la pared
const MARGEN = 40;
export const FondoDesenfocado: React.FC<{dpr: number; desenfoque: number}> = ({dpr, desenfoque}) => (
  <div style={{position: 'absolute', left: -MARGEN, top: -MARGEN, width: 1080 + 2 * MARGEN, height: 1920 + 2 * MARGEN, filter: `blur(${desenfoque}px) brightness(0.72) saturate(0.85)`}}>
    <ThreeCanvas width={1080 + 2 * MARGEN} height={1920 + 2 * MARGEN} dpr={dpr} gl={{antialias: true, alpha: false}}
      camera={{fov: FOV, near: 60, far: 20000, position: [540, -CAM_Y, D]}}>
      <Camara ancho={1080 + 2 * MARGEN} alto={1920 + 2 * MARGEN} />
      <EstudioFijo />
      <hemisphereLight args={['#cfd9ff', '#120e0a', 0.3]} />
      <Fondo />
      <Vitrinas />
    </ThreeCanvas>
  </div>
);
