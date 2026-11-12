import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {rng} from '../../../comun/curvas';
import {ALTO, LAMPARA, MESA, PAPELERA, PLACA, R_BOLA, SILLA, STUD, SUELO, giroRaiz, type Bola, type Pose} from '../escena';
import {geoCaja, geoPapel, geoRedondo, geoTorno} from '../BloquesPiezas';
import {PANEL, cromo, materialLuzAro, planoFondo, texturaAro, texturaFondo, vidrio} from './CristalEstudio';

// CRISTAL, LAS PIEZAS: la oficina soplada en vidrio. La papelera, un vaso de cristal rojo tallado (con estrías,
// como un jarrón de cristal cortado: cada estría dobla la luz a su manera) y de pared gruesa, con su aro de cristal y la luz que corre
// por dentro de él; dentro, los papeles de otros días, opacos, que se ven rojos a través del vidrio. La mesa, una losa de vidrio verde
// agua con patas cromadas, su pantalla encendida, la taza de vidrio y dos bolas viejas; la silla, de vidrio azul sobre su pie de cromo;
// la lámpara, una pantalla esmerilada que brilla por la bombilla de dentro; la pared de la derecha, un panel de vidrio de pie con el
// canto encendido; y la bola, de papel blanco, lo único opaco y claro: una perla en medio de tanto vidrio.

const PB = PAPELERA;
const ALTO_PAP = SUELO - PB.yBorde;

// ---------------------------------------------------------------- el fondo del estudio (el plano pintado)
export const Fondo: React.FC = () => {
  const p = planoFondo();
  return (
    <mesh position={[p.centro[0], p.centro[1], p.centro[2]]}>
      <planeGeometry args={[p.ancho, p.alto]} />
      <meshBasicMaterial map={texturaFondo()} />
    </mesh>
  );
};

// ---------------------------------------------------------------- la pared de cristal de la derecha
// Vista casi de canto, un vidrio de verdad haría de espejo del techo del estudio (un bloque claro arriba a la derecha). Se dibuja como
// se ve en una foto de estudio: una lámina apenas tintada con su brillo y los cantos pulidos encendidos (el de pie, al fondo, y el
// del suelo), que son los que dicen que ahí hay una pared de vidrio.
let LAMINA: THREE.CanvasTexture | null = null;
const texturaLamina = () => {
  if (LAMINA) return LAMINA;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, 'rgba(170,205,255,0.10)');
  g.addColorStop(0.35, 'rgba(170,205,255,0.03)');
  g.addColorStop(0.55, 'rgba(220,235,255,0.16)');
  g.addColorStop(0.62, 'rgba(170,205,255,0.03)');
  g.addColorStop(1, 'rgba(170,205,255,0.06)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 64);
  LAMINA = new THREE.CanvasTexture(c);
  LAMINA.colorSpace = THREE.SRGBColorSpace;
  return LAMINA;
};
export const PanelCristal: React.FC = () => {
  const alto = SUELO - PANEL.arriba;
  const largo = PANEL.z1 - PANEL.z0;
  const lamina = useMemo(() => new THREE.MeshBasicMaterial({map: texturaLamina(), transparent: true, depthWrite: false, side: THREE.DoubleSide}), []);
  const canto = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color('#e4f4ff').multiplyScalar(1.1), toneMapped: false}), []);
  const cantoSuelo = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color('#bfe2ff').multiplyScalar(0.7), toneMapped: false}), []);
  return (
    <group position={[PANEL.x, -SUELO, 0]}>
      <mesh material={lamina} position={[0, alto / 2, (PANEL.z0 + PANEL.z1) / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[largo, alto]} />
      </mesh>
      <mesh material={canto} position={[0, alto / 2, PANEL.z0]}>
        <boxGeometry args={[4, alto, 4]} />
      </mesh>
      <mesh material={cantoSuelo} position={[0, 1.5, (PANEL.z0 + PANEL.z1) / 2]}>
        <boxGeometry args={[3, 3, largo]} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- la mesa y lo de encima
let PANTALLA: THREE.CanvasTexture | null = null;
const texturaPantalla = () => {
  if (PANTALLA) return PANTALLA;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 160;
  const x = c.getContext('2d')!;
  // la pantalla apagada detrás del vidrio ahumado: casi negra, con un velo azul, y las líneas de texto encendidas
  const g = x.createLinearGradient(0, 0, 256, 160);
  g.addColorStop(0, '#050b12');
  g.addColorStop(1, '#0b1b28');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 160);
  const R = rng(77);
  x.shadowColor = 'rgba(110,210,255,0.9)';
  x.shadowBlur = 6;
  x.fillStyle = 'rgba(150,225,255,0.85)';
  for (let k = 0; k < 7; k++) x.fillRect(22, 22 + k * 18, 60 + R() * 150, 5);
  PANTALLA = new THREE.CanvasTexture(c);
  PANTALLA.colorSpace = THREE.SRGBColorSpace;
  return PANTALLA;
};
let PAPEL_VIEJO: THREE.MeshStandardMaterial | null = null;
const papelViejo = () => (PAPEL_VIEJO ??= new THREE.MeshStandardMaterial({color: '#d9d3c6', roughness: 0.85, flatShading: true, emissive: '#2a2620'}));

export const Mesa: React.FC = () => {
  const top = SUELO - MESA.alto;
  const cx = (MESA.x0 + MESA.x1) / 2, cz = (MESA.z0 + MESA.z1) / 2;
  const grueso = PLACA * 1.6;
  const losa = vidrio('mesa', {color: '#ecfff9', atenua: '#3fcfae', dist: 110, grosor: 50, rugoso: 0.02, disp: 6, irid: 0.3, env: 1.4});
  const humo = vidrio('monitor', {color: '#5d6270', atenua: '#151821', dist: 30, grosor: 26, rugoso: 0.05, disp: 3, irid: 0.3, env: 1.6});
  const taza = vidrio('taza', {color: '#f4fbff', atenua: '#bfe9ff', dist: 300, grosor: 18, rugoso: 0.02, disp: 6, irid: 0.4, env: 1.5});
  const pantalla = useMemo(() => new THREE.MeshBasicMaterial({map: texturaPantalla(), toneMapped: false, color: new THREE.Color(0.85, 0.85, 0.85)}), []);
  const papel = useMemo(() => new THREE.MeshStandardMaterial({color: '#e9e6df', roughness: 0.7, emissive: '#1a1916'}), []);
  const tazaPerfil: [number, number][] = [[0, 0], [24, 0], [27, 3], [29, ALTO * 0.95], [25, ALTO * 0.95], [23, 6], [0, 6]];
  return (
    <group dispose={null}>
      <mesh geometry={geoCaja(5 * STUD, grueso, 3 * STUD, 6)} material={losa} position={[cx, -top - grueso / 2, cz]} />
      {[MESA.x0 + 30, MESA.x1 - 30].map((x) => [MESA.z0 + 30, MESA.z1 - 30].map((z) => (
        <mesh key={`${x}-${z}`} material={cromo()} position={[x, -SUELO + (MESA.alto - grueso) / 2, z]}>
          <cylinderGeometry args={[7, 7, MESA.alto - grueso, 20]} />
        </mesh>
      )))}
      {/* el monitor: pie y marco de vidrio ahumado, la pantalla encendida */}
      <group position={[40, -top, -170]} rotation={[0, 0.45, 0]}>
        <mesh geometry={geoCaja(2 * STUD, PLACA, 2 * STUD, 6)} material={humo} position={[0, PLACA / 2, 0]} />
        <mesh material={cromo()} position={[0, PLACA + ALTO * 0.55, 0]}>
          <cylinderGeometry args={[8, 8, ALTO * 1.1, 16]} />
        </mesh>
        <mesh geometry={geoCaja(4 * STUD, 3 * ALTO, 26, 8)} material={humo} position={[0, PLACA + ALTO * 1.05 + 1.5 * ALTO, 12]} />
        <mesh material={pantalla} position={[0, PLACA + ALTO * 1.05 + 1.5 * ALTO, 26]}>
          <planeGeometry args={[4 * STUD - 26, 3 * ALTO - 26]} />
        </mesh>
      </group>
      {/* la taza de vidrio con su asa, los papeles y dos bolas de otros días */}
      <group position={[205, -top, -80]}>
        <mesh geometry={geoTorno('taza-cristal', tazaPerfil, 48)} material={taza} />
        <mesh position={[32, ALTO * 0.5, 0]} material={taza}>
          <torusGeometry args={[15, 5, 12, 28]} />
        </mesh>
      </group>
      {[0, 1, 2].map((k) => (
        <mesh key={k} geometry={geoCaja(150, 5, 110, 2)} material={papel} position={[150 + k * 3, -top + 4 + k * 6, -190 + k * 4]} rotation={[0, 0.08 * (k - 1), 0]} />
      ))}
      <mesh geometry={geoPapel(34, 21)} material={papelViejo()} position={[-10, -top + 36, -90]} rotation={[0.4, 1, 0.2]} />
      <mesh geometry={geoPapel(32, 22)} material={papelViejo()} position={[60, -top + 34, -60]} rotation={[1.1, 0.3, 0.7]} />
    </group>
  );
};

// ---------------------------------------------------------------- la silla (gira con él)
export const Silla: React.FC<{pose: Pose}> = ({pose}) => {
  const azul = vidrio('silla', {color: '#c6dcff', atenua: '#2f66e0', dist: 120, grosor: 50, rugoso: 0.04, disp: 5, irid: 0.4, env: 1.45});
  const yAsiento = SUELO - SILLA.asiento;
  return (
    <group position={[SILLA.x, -SUELO, SILLA.z]}>
      {[0, 1, 2, 3, 4].map((k) => {
        const a = (k / 5) * Math.PI * 2 + 0.3;
        return (
          <group key={k} rotation={[0, a, 0]}>
            <mesh geometry={geoCaja(18, 14, 3 * STUD * 0.8, 6)} material={cromo()} position={[0, 26, STUD * 1.1]} />
            <mesh material={cromo('#c9ced6', 0.22)} position={[0, 12, STUD * 2.1]}>
              <sphereGeometry args={[12, 20, 14]} />
            </mesh>
          </group>
        );
      })}
      <mesh geometry={geoRedondo(28, 30, 0, 8)} material={cromo()} position={[0, 18, 0]} />
      <mesh material={cromo()} position={[0, 48 + (yAsiento - 70) / 2, 0]}>
        <cylinderGeometry args={[12, 14, yAsiento - 70, 24]} />
      </mesh>
      <group rotation={[0, giroRaiz(pose), 0]}>
        <mesh geometry={geoCaja(3 * STUD, PLACA * 1.5, 3 * STUD, 14)} material={azul} position={[0, yAsiento - PLACA * 0.75, -6]} />
        <mesh geometry={geoCaja(3 * STUD, ALTO * 2.1, STUD * 0.7, 14)} material={azul} position={[0, yAsiento - 4 + ALTO * 1.05, -STUD * 1.5 - 4]} />
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- la lámpara (gira desde su gancho)
export const Lampara: React.FC<{ang: number; brillo: number}> = ({ang, brillo}) => {
  const L = LAMPARA;
  const perfil: [number, number][] = [[L.rAbajo - 3, -L.alto / 2], [L.rAbajo, -L.alto / 2 + 3], [L.rArriba + 2, L.alto / 2 - 4], [L.rArriba - 4, L.alto / 2]];
  const pant = vidrio('pantalla', {color: '#fff3e2', atenua: '#ffd9a8', dist: 200, grosor: 22, rugoso: 0.3, disp: 2, irid: 0.3, env: 1.2, emite: '#ffc27a', brillo: 0.5});
  pant.emissiveIntensity = 0.45 + 0.8 * brillo;
  const bombilla = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color('#fff2d4').multiplyScalar(2.2), toneMapped: false}), []);
  bombilla.color.set('#fff2d4').multiplyScalar(2.2 + 2 * brillo);
  return (
    <group position={[L.x, -L.yGancho, 0]} rotation={[0, 0, ang]}>
      <mesh position={[0, -(L.largo - L.alto / 2) / 2, 0]} material={cromo('#30343c', 0.3)}>
        <cylinderGeometry args={[3, 3, L.largo - L.alto / 2, 10]} />
      </mesh>
      <group position={[0, -L.largo, 0]}>
        <mesh geometry={geoTorno('pantalla-cristal', perfil, 64)} material={pant} />
        <mesh geometry={geoRedondo(20, PLACA, 0, 4)} material={cromo()} position={[0, L.alto / 2 - 4, 0]} />
        <mesh position={[0, -L.alto / 2 + 14, 0]} material={bombilla}>
          <sphereGeometry args={[25, 24, 16]} />
        </mesh>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- la papelera de cristal rojo tallado
// La pared, sólida y gruesa (un perfil cerrado: fuera, el canto de arriba, dentro y el fondo), con 18 estrías por fuera.
const ESTRIAS = 18;
const geoVaso = (() => {
  let g: THREE.BufferGeometry | null = null;
  return () => {
    if (g) return g;
    const top = ALTO_PAP - PB.tubo + 3;
    const rFuera = (y: number) => PB.rBase + PB.pared + (PB.rBorde - PB.rBase) * (y / top);
    const rDentro = (y: number) => PB.rBase - PB.pared + (PB.rBorde - PB.rBase) * (y / top);
    const perfil: [number, number][] = [[0, 0], [PB.rBase + PB.pared - 7, 0], [PB.rBase + PB.pared - 2, 1.5], [rFuera(7), 7]];
    const nFuera = 14;
    for (let k = 1; k <= nFuera; k++) {
      const y = 7 + ((top - 7) * k) / nFuera;
      perfil.push([rFuera(y), y]);
    }
    const marca = perfil.length; // hasta aquí, lo de fuera (lleva estrías)
    perfil.push([rDentro(top), top], [rDentro(top - 4), top - 4]);
    for (let k = 1; k <= 8; k++) {
      const y = top - 4 - ((top - 4 - 26) * k) / 8;
      perfil.push([rDentro(y), y]);
    }
    perfil.push([PB.rBase - PB.pared - 8, 18], [PB.rBase - PB.pared - 14, 16], [0, 16]);
    const lathe = new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), 144);
    const pos = lathe.attributes.position as THREE.BufferAttribute;
    const n = perfil.length;
    for (let v = 0; v < pos.count; v++) {
      const j = v % n;
      if (j < 3 || j >= marca) continue;
      const x = pos.getX(v), z = pos.getZ(v), y = pos.getY(v);
      const a = Math.atan2(z, x);
      const r = Math.hypot(x, z);
      // la estría: un lomo redondo entre dos cortes, más suave arriba y abajo
      const borde = Math.min(1, (y - 7) / 30, (top - y) / 24);
      const lomo = Math.pow(Math.abs(Math.cos((a * ESTRIAS) / 2)), 0.7);
      const r2 = r + 6.5 * lomo * Math.max(0, borde) - 2;
      pos.setXYZ(v, (x / r) * r2, y, (z / r) * r2);
    }
    lathe.deleteAttribute('normal');
    lathe.deleteAttribute('uv');
    g = mergeVertices(lathe, 0.01);
    g.computeVertexNormals();
    return g;
  };
})();

export const Papelera: React.FC<{inclina: number; luz: number; dentro: number; carga: number}> = ({inclina, luz, dentro, carga}) => {
  // (el color de atenuación nunca con un canal a cero: se lo come entero y el vidrio parece gelatina de un solo rojo)
  const vaso = vidrio('papelera', {color: '#ffd8d2', atenua: '#cc2232', dist: 60, grosor: 34, rugoso: 0.02, ior: 1.52, disp: 6, irid: 0.3, env: 1.6, emite: '#ff1f14', brillo: 0});
  const aro = vidrio('aro', {color: '#ffe4de', atenua: '#e0303c', dist: 70, grosor: 26, rugoso: 0.02, disp: 7, irid: 0.45, env: 1.7, emite: '#ff3424', brillo: 0});
  // lo encendido: el aro con su luz, y todo el vaso cuando la bola entra (o mientras se carga, con la bola en equilibrio encima)
  vaso.emissiveIntensity = 0.5 * dentro + 0.3 * carga;
  aro.emissiveIntensity = 0.02 + 0.2 * luz + 0.9 * dentro + 0.6 * carga;
  const luzAro = useMemo(materialLuzAro, []);
  texturaAro().needsUpdate = true;
  const pila = useMemo(() => {
    const R = rng(88);
    return Array.from({length: 7}, (_, k) => {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 66;
      return {p: [Math.cos(a) * d, ALTO_PAP - (PB.yPila - PB.yBorde) - 18 + R() * 16, Math.sin(a) * d] as [number, number, number], rot: [R() * 3, R() * 3, R() * 3] as [number, number, number], s: 30 + R() * 8, k};
    });
  }, []);
  const papel = useMemo(() => new THREE.MeshStandardMaterial({color: '#e8e2d4', roughness: 0.85, flatShading: true, emissive: '#ff6a50', emissiveIntensity: 0}), []);
  papel.emissiveIntensity = 0.05 + 0.4 * dentro + 0.25 * carga;
  return (
    <group position={[PB.x, -SUELO, PB.z]} rotation={[0, 0, -inclina]}>
      <mesh geometry={geoVaso()} material={vaso} />
      <mesh position={[0, ALTO_PAP, 0]} rotation={[Math.PI / 2, 0, 0]} material={aro}>
        <torusGeometry args={[PB.rBorde, PB.tubo, 24, 144]} />
      </mesh>
      <mesh position={[0, ALTO_PAP, 0]} rotation={[Math.PI / 2, 0, 0]} material={luzAro} renderOrder={6}>
        <torusGeometry args={[PB.rBorde, PB.tubo + 1.2, 16, 256]} />
      </mesh>
      {pila.map((q) => (
        <mesh key={q.k} geometry={geoPapel(q.s, 40 + q.k)} material={papel} position={q.p} rotation={q.rot} />
      ))}
      {/* la luz de dentro cuando entra: tiñe los papeles y el vidrio desde el centro */}
      {dentro + carga > 0.01 && <pointLight position={[0, ALTO_PAP * 0.55, 0]} color="#ff4a30" intensity={2.2 * dentro + 1.6 * carga} distance={700} decay={0} />}
    </group>
  );
};

// ---------------------------------------------------------------- la bola de papel: blanca, opaca, una perla
let PAPEL_BLANCO: THREE.CanvasTexture | null = null;
const texturaPapelBlanco = () => {
  if (PAPEL_BLANCO) return PAPEL_BLANCO;
  const N = 256;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const x = c.getContext('2d')!;
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, N, N);
  // las rayas del cuaderno, muy suaves (en lo oscuro, la bola tiene que leerse blanca)
  x.strokeStyle = 'rgba(120,160,225,0.28)';
  x.lineWidth = 4;
  for (let y = 14; y < N; y += 40) {
    x.beginPath();
    x.moveTo(0, y);
    x.lineTo(N, y);
    x.stroke();
  }
  PAPEL_BLANCO = new THREE.CanvasTexture(c);
  PAPEL_BLANCO.wrapS = PAPEL_BLANCO.wrapT = THREE.RepeatWrapping;
  PAPEL_BLANCO.colorSpace = THREE.SRGBColorSpace;
  return PAPEL_BLANCO;
};
let PERLA: THREE.MeshPhysicalMaterial | null = null;
const perla = () =>
  (PERLA ??= new THREE.MeshPhysicalMaterial({
    color: '#ffffff', map: texturaPapelBlanco(), roughness: 0.62, metalness: 0, flatShading: true,
    sheen: 0.8, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.4, clearcoat: 0.15, clearcoatRoughness: 0.4,
    emissive: '#ffffff', emissiveIntensity: 0.1, envMapIntensity: 0.9,
  }));

export const BolaCristal: React.FC<{b: Bola}> = ({b}) => {
  const [x, y, z] = b.c;
  const n = new THREE.Vector3(b.aplasta.n[0], -b.aplasta.n[1], b.aplasta.n[2]).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
  const k = b.aplasta.k;
  return (
    <group position={[x, -y, z]} quaternion={q}>
      <group scale={[1 + 0.16 * k, 1 - 0.26 * k, 1 + 0.16 * k]}>
        <group quaternion={q.clone().invert()}>
          <mesh geometry={geoPapel(R_BOLA, 7)} material={perla()} rotation={[b.vuelco, 0.4, -b.giro]} />
        </group>
      </group>
    </group>
  );
};
