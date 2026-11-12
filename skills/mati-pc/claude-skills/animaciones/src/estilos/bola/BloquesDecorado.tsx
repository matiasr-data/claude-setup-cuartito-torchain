import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rng} from '../../comun/curvas';
import {ALTO, LAMPARA, MESA, MURO_X, PAPELERA, PLACA, R_BOLA, STUD, SUELO, Z_PARED, type Bola} from './escena';
import {COL, geoCaja, geoLadrillo, geoPapel, geoRedondo, geoTeton, geoTetonesAro, geoTorno, mancha, papelMat, papelViejo, plastico} from './BloquesPiezas';

// BLOQUES DE JUGUETE, EL DECORADO: la oficina de bloques. Detrás, una pared de ladrillos de 2 × 4 a soga,
// azul arena (va desenfocada), con su ventana de marco blanco (el cielo, nubes y árboles de piezas redondas) y un póster de
// baloncesto; a la derecha, la otra pared, la del fallo 2; el suelo, una placa base beis con sus tetones (mate, como piden las placas
// grandes); la mesa de él a la izquierda con su monitor, la taza, los papeles y dos bolas de otros días; la lámpara que cuelga (la
// del fallo 7) con su bombilla encendida; y la papelera roja de ladrillos redondos, con su aro blanco de tetones.
// Todo en px del plano de la papelera, con la y del mundo hacia arriba (y = −la de la pantalla) y z hacia la cámara.

const r = (semilla: number) => rng(semilla);

// ---------------------------------------------------------------- las paredes (van en el lienzo desenfocado)
const PARED_COLS = ['#7d95b0', '#7690ab', '#8299b3', '#7a92ad', '#879eb7', '#738ca7'];
const VENTANA = {x0: 0, x1: 6 * STUD, fila0: 11, fila1: 16}; // el hueco, en tetones y filas desde el suelo
const filaY = (k: number) => SUELO - (k + 1) * ALTO; // arriba de la fila k
type Ladrillo = {x: number; y: number; z: number; largo: number; col: string; eje: 'x' | 'z'};

const ladrillosPared = (): Ladrillo[] => {
  const out: Ladrillo[] = [];
  const R = r(404);
  const filas = 23;
  // la del fondo: a soga, cada fila desplazada medio ladrillo; el hueco de la ventana corta los ladrillos en su sitio
  for (let k = 0; k < filas; k++) {
    const y = filaY(k);
    const tramos: [number, number][] = k >= VENTANA.fila0 && k <= VENTANA.fila1 ? [[-8 * STUD, VENTANA.x0], [VENTANA.x1, 25 * STUD]] : [[-8 * STUD, 25 * STUD]];
    for (const [a, b] of tramos) {
      let x = a;
      if (k % 2) {
        out.push({x, y, z: Z_PARED - STUD, largo: 2, col: PARED_COLS[(R() * PARED_COLS.length) | 0], eje: 'x'});
        x += 2 * STUD;
      }
      while (x < b - 1) {
        const largo = Math.min(4, Math.round((b - x) / STUD));
        if (largo >= 1) out.push({x, y, z: Z_PARED - STUD, largo, col: PARED_COLS[(R() * PARED_COLS.length) | 0], eje: 'x'});
        x += largo * STUD;
      }
    }
  }
  // la de la derecha: igual, a lo largo de z
  for (let k = 0; k < filas; k++) {
    const y = filaY(k);
    let z = Z_PARED - (k % 2 ? 2 * STUD : 0);
    while (z < 1500) {
      out.push({x: MURO_X + STUD, y, z, largo: 4, col: PARED_COLS[(R() * PARED_COLS.length) | 0], eje: 'z'});
      z += 4 * STUD;
    }
  }
  return out;
};

// el póster: una diana (lo que él quiere y no le sale), que desenfocada se sigue leyendo
let POSTER: THREE.CanvasTexture | null = null;
const texturaPoster = () => {
  if (POSTER) return POSTER;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 340;
  const x = c.getContext('2d')!;
  x.fillStyle = '#f2cd37';
  x.fillRect(0, 0, 256, 340);
  const anillos = ['#c91a09', '#ffffff', '#c91a09', '#ffffff', '#c91a09'];
  anillos.forEach((col, k) => {
    x.fillStyle = col;
    x.beginPath();
    x.arc(128, 150, 104 - k * 21, 0, Math.PI * 2);
    x.fill();
  });
  // la flecha, clavada fuera del centro
  x.strokeStyle = '#1b2a34';
  x.lineWidth = 7;
  x.beginPath();
  x.moveTo(170, 108);
  x.lineTo(232, 52);
  x.stroke();
  x.fillStyle = '#0055bf';
  x.beginPath();
  x.moveTo(232, 52); x.lineTo(250, 30); x.lineTo(222, 40); x.closePath(); x.fill();
  x.fillStyle = '#1b2a34';
  x.fillRect(40, 282, 176, 16);
  x.fillRect(70, 308, 116, 12);
  POSTER = new THREE.CanvasTexture(c);
  POSTER.colorSpace = THREE.SRGBColorSpace;
  return POSTER;
};

// el cielo de la ventana (con su degradado), encendido
let CIELO: THREE.CanvasTexture | null = null;
const texturaCielo = () => {
  if (CIELO) return CIELO;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#5fb0ea');
  g.addColorStop(0.7, '#a8daf6');
  g.addColorStop(1, '#e6f5fb');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 256);
  CIELO = new THREE.CanvasTexture(c);
  CIELO.colorSpace = THREE.SRGBColorSpace;
  return CIELO;
};

export const Paredes: React.FC = () => {
  const lad = useMemo(ladrillosPared, []);
  // un InstancedMesh por largo y orientación, con el color de cada ladrillo
  const grupos = useMemo(() => {
    const m = new Map<string, Ladrillo[]>();
    for (const l of lad) {
      const k = `${l.eje}${l.largo}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(l);
    }
    return [...m.entries()].map(([k, ls]) => {
      const eje = k[0] as 'x' | 'z', largo = Number(k.slice(1));
      const geo = eje === 'x' ? geoLadrillo(largo, 2, ALTO, false) : geoLadrillo(2, largo, ALTO, false);
      const mesh = new THREE.InstancedMesh(geo, plastico('#ffffff'), ls.length);
      const o = new THREE.Object3D();
      ls.forEach((l, i) => {
        if (eje === 'x') o.position.set(l.x + (largo * STUD) / 2, -(l.y + ALTO), l.z);
        else o.position.set(l.x, -(l.y + ALTO), l.z + (largo * STUD) / 2);
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
        mesh.setColorAt(i, new THREE.Color(l.col));
      });
      mesh.receiveShadow = true;
      return mesh;
    });
  }, [lad]);
  const blanco = plastico(COL.blanco);
  const yV0 = filaY(VENTANA.fila1), yV1 = filaY(VENTANA.fila0 - 1); // arriba y abajo del hueco
  const zF = Z_PARED; // la cara de la pared
  return (
    <group dispose={null}>
      {grupos.map((g, i) => <primitive key={i} object={g} />)}
      {/* lo de fuera: el cielo, dos nubes de placas redondas y unos árboles de ladrillos redondos */}
      <mesh position={[(VENTANA.x0 + VENTANA.x1) / 2, -(yV0 + yV1) / 2, zF - 260]}>
        <planeGeometry args={[VENTANA.x1 - VENTANA.x0 + 500, yV1 - yV0 + 500]} />
        <meshBasicMaterial map={texturaCielo()} toneMapped={false} />
      </mesh>
      {[[90, 300, 1], [300, 250, 0.8]].map(([cx, cy, s], n) => (
        <group key={n} position={[cx, -cy, zF - 220]} scale={[s, s, s]}>
          {[[-46, 8, 34], [-10, -8, 44], [30, 4, 36], [62, 12, 24]].map(([bx, by, br], k) => (
            <mesh key={k} geometry={geoRedondo(br, 26, 0, 8)} material={plastico(COL.blanco, {emite: '#ffffff', fuerza: 0.35})} position={[bx, -by, 0]} rotation={[Math.PI / 2, 0, 0]} />
          ))}
        </group>
      ))}
      {[[60, 610, 70], [170, 580, 92], [290, 600, 80], [380, 620, 64]].map(([cx, cy, cr], k) => (
        <mesh key={k} geometry={geoRedondo(cr, 40, 0, 12)} material={plastico(k % 2 ? COL.verde : '#4b9f4a')} position={[cx, -cy, zF - 200]} rotation={[Math.PI / 2, 0, 0]} />
      ))}
      {/* el marco de la ventana: ladrillos blancos alrededor, el parteluz y el alféizar */}
      <mesh geometry={geoCaja(VENTANA.x1 - VENTANA.x0 + 40, 40, 70)} material={blanco} position={[(VENTANA.x0 + VENTANA.x1) / 2, -(yV0 - 4), zF + 10]} castShadow receiveShadow />
      <mesh geometry={geoCaja(VENTANA.x1 - VENTANA.x0 + 70, 34, 110)} material={blanco} position={[(VENTANA.x0 + VENTANA.x1) / 2, -(yV1 + 14), zF + 30]} castShadow receiveShadow />
      {[VENTANA.x0, VENTANA.x1].map((xx, k) => (
        <mesh key={k} geometry={geoCaja(36, yV1 - yV0 + 30, 70)} material={blanco} position={[xx, -(yV0 + yV1) / 2, zF + 10]} castShadow receiveShadow />
      ))}
      <mesh geometry={geoCaja(22, yV1 - yV0, 40)} material={blanco} position={[(VENTANA.x0 + VENTANA.x1) / 2, -(yV0 + yV1) / 2, zF - 20]} castShadow receiveShadow />
      <mesh geometry={geoCaja(VENTANA.x1 - VENTANA.x0, 22, 40)} material={blanco} position={[(VENTANA.x0 + VENTANA.x1) / 2, -(yV0 + (yV1 - yV0) * 0.45), zF - 20]} castShadow receiveShadow />
      {/* una maceta en el alféizar */}
      <mesh geometry={geoRedondo(30, 52, 1, 5)} material={plastico(COL.naranja)} position={[300, -(yV1 - 3), zF + 50]} castShadow receiveShadow />
      {[[-0.4, 70], [0, 92], [0.45, 66]].map(([a, l], k) => (
        <mesh key={k} geometry={geoRedondo(13, l, 0, 5)} material={plastico(COL.verde)} position={[300, -(yV1 - 3) + 45, zF + 50]} rotation={[0, 0, a]} castShadow />
      ))}
      {/* el póster */}
      <mesh geometry={geoCaja(270, 360, 10, 4)} material={blanco} position={[808, -412, zF + 6]} castShadow receiveShadow />
      <mesh position={[808, -412, zF + 11.5]}>
        <planeGeometry args={[250, 340]} />
        <meshPhysicalMaterial map={texturaPoster()} roughness={0.3} clearcoat={0.6} />
      </mesh>
      {/* una balda con libros de ladrillos, en la pared del fondo a la derecha */}
      <mesh geometry={geoLadrillo(6, 2, PLACA, true)} material={plastico(COL.blanco)} position={[820, -830, zF + 70]} castShadow receiveShadow />
      {[COL.rojo, COL.amarillo, COL.verde, COL.azul, COL.naranja].map((c, k) => (
        <mesh key={k} geometry={geoLadrillo(1, 2, ALTO * (1.6 + (k % 3) * 0.3), false)} material={plastico(c)} position={[680 + k * 60, -830 + PLACA, zF + 70]}
          rotation={[0, 0, k === 4 ? -0.35 : 0]} castShadow receiveShadow />
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- el suelo: una placa base con tetones (en dos trozos: el de delante, más desenfocado)
export const Suelo: React.FC<{desde: number; hasta: number}> = ({desde, hasta}) => {
  const mat = plastico(COL.suelo, {mate: true});
  const tetones = useMemo(() => {
    const xs: number[] = [];
    for (let x = -12 * STUD + STUD / 2; x < MURO_X; x += STUD) xs.push(x);
    const zs: number[] = [];
    for (let z = Z_PARED + STUD / 2; z < hasta; z += STUD) if (z >= desde) zs.push(z);
    const m = new THREE.InstancedMesh(geoTeton(), mat, xs.length * zs.length);
    const o = new THREE.Object3D();
    let i = 0;
    for (const x of xs) for (const z of zs) {
      o.position.set(x, -SUELO, z);
      o.updateMatrix();
      m.setMatrixAt(i++, o.matrix);
    }
    m.receiveShadow = true;
    return m;
  }, [desde, hasta, mat]);
  const x0 = -12 * STUD, x1 = MURO_X;
  return (
    <group dispose={null}>
      <mesh geometry={geoCaja(x1 - x0, 40, hasta - desde, 2)} material={mat} position={[(x0 + x1) / 2, -SUELO - 20, (desde + hasta) / 2]} receiveShadow />
      <primitive object={tetones} />
    </group>
  );
};

// unas piezas sueltas en el suelo de delante, en las esquinas (desenfocadas, como en una foto macro), lejos de donde cae la bola
export const Sueltas: React.FC = () => (
  <group dispose={null}>
    <mesh geometry={geoLadrillo(2, 4, ALTO)} material={plastico(COL.amarillo)} position={[190, -SUELO, 540]} rotation={[0, 0.55, 0]} castShadow receiveShadow />
    <mesh geometry={geoLadrillo(1, 2, ALTO)} material={plastico(COL.azul)} position={[340, -SUELO, 700]} rotation={[0, -0.35, 0]} castShadow receiveShadow />
    <mesh geometry={geoLadrillo(2, 2, ALTO)} material={plastico(COL.verde)} position={[990, -SUELO, 560]} rotation={[0, 0.25, 0]} castShadow receiveShadow />
    {[[190, 540, 300, 210], [340, 700, 130, 90], [990, 560, 190, 170]].map(([x, z, sx, sz], k) => (
      <mesh key={k} position={[x + 14, -SUELO + 13, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[sx, sz, 1]} renderOrder={2}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={mancha()} color="#1a1008" transparent opacity={0.45} depthWrite={false} toneMapped={false} />
      </mesh>
    ))}
  </group>
);

// ---------------------------------------------------------------- la mesa y lo de encima
export const Mesa: React.FC = () => {
  const top = SUELO - MESA.alto;
  const nogal = plastico(COL.nogal), gris = plastico(COL.grisClaro), oscuro = plastico(COL.negro);
  const cx = (MESA.x0 + MESA.x1) / 2, cz = (MESA.z0 + MESA.z1) / 2;
  const grueso = PLACA * 1.5;
  const sombra = (x: number, z: number, sx: number, sz: number, o = 0.5) => (
    <mesh position={[x, -SUELO + 0.8, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[sx, sz, 1]} renderOrder={2}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={mancha()} color="#1a1008" transparent opacity={o} depthWrite={false} toneMapped={false} />
    </mesh>
  );
  const papelA = papelViejo('#f2eedd'), papelB = papelViejo('#e9e4cf');
  return (
    <group dispose={null}>
      <mesh geometry={geoLadrillo(5, 3, grueso)} material={nogal} position={[cx, -top - grueso, cz]} castShadow receiveShadow />
      {[MESA.x0 + 30, MESA.x1 - 30].map((x) => [MESA.z0 + 30, MESA.z1 - 30].map((z) => (
        <group key={`${x}-${z}`}>
          <mesh geometry={geoLadrillo(1, 1, MESA.alto - grueso, false)} material={gris} position={[x, -SUELO, z]} castShadow receiveShadow />
          {sombra(x + 8, z, 110, 80)}
        </group>
      )))}
      {/* el monitor: su pie, la pantalla (encendida, un poco) y su marco */}
      <group position={[40, -top, -170]} rotation={[0, 0.45, 0]}>
        <mesh geometry={geoLadrillo(2, 2, PLACA, true)} material={oscuro} castShadow receiveShadow />
        <mesh geometry={geoLadrillo(1, 1, ALTO * 1.1, false)} material={oscuro} position={[0, PLACA, 0]} castShadow receiveShadow />
        <mesh geometry={geoCaja(4 * STUD, 3 * ALTO, 30)} material={oscuro} position={[0, PLACA + ALTO * 1.05 + 1.5 * ALTO, 12]} castShadow receiveShadow />
        <mesh geometry={geoCaja(4 * STUD - 26, 3 * ALTO - 26, 4, 3)} material={plastico(COL.celeste, {emite: '#7fd6e8', fuerza: 0.5})} position={[0, PLACA + ALTO * 1.05 + 1.5 * ALTO, 28]} />
      </group>
      {/* la taza roja con su asa, los papeles apilados y dos bolas de otros días */}
      <group position={[205, -top, -80]}>
        <mesh geometry={geoRedondo(28, ALTO * 0.95, 0, 5)} material={plastico(COL.rojo)} castShadow receiveShadow />
        <mesh position={[30, ALTO * 0.5, 0]} castShadow material={plastico(COL.rojo)}>
          <torusGeometry args={[16, 6, 10, 24]} />
        </mesh>
      </group>
      {[0, 1, 2].map((k) => (
        <mesh key={k} geometry={geoCaja(150, 7, 110, 2)} material={plastico(COL.blanco, {mate: true})} position={[150 + k * 3, -top + 15 + k * 7, -190 + k * 4]} rotation={[0, 0.08 * (k - 1), 0]} castShadow receiveShadow />
      ))}
      <mesh geometry={geoPapel(34, 21)} material={papelA} position={[-10, -top + 42, -90]} rotation={[0.4, 1, 0.2]} castShadow receiveShadow />
      <mesh geometry={geoPapel(32, 22)} material={papelB} position={[60, -top + 40, -60]} rotation={[1.1, 0.3, 0.7]} castShadow receiveShadow />
    </group>
  );
};

// ---------------------------------------------------------------- la lámpara que cuelga (gira desde su gancho)
export const Lampara: React.FC<{ang: number}> = ({ang}) => {
  const L = LAMPARA;
  const perfil: [number, number][] = [[0, -L.alto / 2], [L.rAbajo - 6, -L.alto / 2], [L.rAbajo, -L.alto / 2 + 4], [L.rArriba + 2, L.alto / 2 - 4], [L.rArriba - 4, L.alto / 2], [0, L.alto / 2]];
  return (
    <group position={[L.x, -L.yGancho, 0]} rotation={[0, 0, ang]}>
      <mesh position={[0, -(L.largo - L.alto / 2) / 2, 0]} castShadow>
        <cylinderGeometry args={[3.5, 3.5, L.largo - L.alto / 2, 10]} />
        <meshStandardMaterial color="#1b1b1f" roughness={0.6} />
      </mesh>
      <group position={[0, -L.largo, 0]}>
        <mesh geometry={geoTorno('lampara', perfil, 48)} material={plastico(COL.naranja)} castShadow receiveShadow />
        <mesh geometry={geoRedondo(22, PLACA, 1, 4)} material={plastico(COL.naranja)} position={[0, L.alto / 2 - 2, 0]} castShadow />
        {/* la bombilla, encendida */}
        <mesh position={[0, -L.alto / 2 - 14, 0]}>
          <sphereGeometry args={[26, 24, 16]} />
          <meshStandardMaterial color="#fff6dc" emissive="#ffe3a0" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
};
// dónde está la bombilla (en px de la escena: x, y de la pantalla y z), para su luz y su brillo
export const bombilla = (ang: number): [number, number, number] => {
  const L = LAMPARA;
  const d = L.largo + L.alto / 2 + 14;
  return [L.x + d * Math.sin(ang), L.yGancho + d * Math.cos(ang), 0];
};

// ---------------------------------------------------------------- la papelera: ladrillos redondos rojos apilados, el aro blanco con tetones
const PB = PAPELERA;
const ALTO_PAP = SUELO - PB.yBorde; // del suelo al centro del aro
export const Papelera: React.FC<{inclina: number}> = ({inclina}) => {
  const rojo = plastico(COL.rojo), blanco = plastico(COL.blanco), oscuro = plastico('#8e1308');
  // el perfil de fuera (con una junta en cada ladrillo) y el de dentro
  const fuera = useMemo(() => {
    const p: [number, number][] = [[0, 0], [PB.rBase + PB.pared - 3, 0], [PB.rBase + PB.pared, 3]];
    const top = ALTO_PAP - PB.tubo;
    const rEn = (y: number) => PB.rBase + PB.pared + (PB.rBorde - PB.rBase) * (y / top);
    for (let k = 1; k < 5; k++) {
      const y = k * ALTO;
      p.push([rEn(y - 3), y - 3], [rEn(y) - 2.5, y - 0.8], [rEn(y) - 2.5, y + 0.8], [rEn(y + 3), y + 3]);
    }
    p.push([rEn(top), top]);
    return p;
  }, []);
  const dentro: [number, number][] = [[PB.rBorde - PB.pared, ALTO_PAP - PB.tubo], [PB.rBase - PB.pared + 4, 18], [PB.rBase - PB.pared, 14], [0, 14]];
  const aro: [number, number][] = [
    [PB.rBorde - PB.tubo, ALTO_PAP - PB.tubo - 4], [PB.rBorde + PB.tubo, ALTO_PAP - PB.tubo - 4], [PB.rBorde + PB.tubo + 2, ALTO_PAP - PB.tubo],
    [PB.rBorde + PB.tubo + 2, ALTO_PAP + 6], [PB.rBorde + PB.tubo - 2, ALTO_PAP + 10], [PB.rBorde - PB.tubo + 2, ALTO_PAP + 10],
    [PB.rBorde - PB.tubo - 2, ALTO_PAP + 6], [PB.rBorde - PB.tubo - 2, ALTO_PAP - PB.tubo], [PB.rBorde - PB.tubo, ALTO_PAP - PB.tubo - 4],
  ];
  const pila = useMemo(() => {
    const R = r(88);
    return Array.from({length: 7}, (_, k) => {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 72;
      return {p: [Math.cos(a) * d, ALTO_PAP - (PB.yPila - PB.yBorde) - 18 + R() * 16, Math.sin(a) * d] as [number, number, number], rot: [R() * 3, R() * 3, R() * 3] as [number, number, number], s: 30 + R() * 8, k};
    });
  }, []);
  return (
    <group position={[PB.x, -SUELO, PB.z]} rotation={[0, 0, -inclina]}>
      <mesh geometry={geoTorno('papelera-fuera', fuera, 64)} material={rojo} castShadow receiveShadow />
      <mesh geometry={geoTorno('papelera-dentro', dentro, 64)} material={oscuro} receiveShadow />
      <mesh geometry={geoTorno('papelera-aro', aro, 64)} material={blanco} castShadow receiveShadow />
      {/* las costillas de fuera (entre tetón y tetón): así se lee papelera y no vaso */}
      {Array.from({length: 18}, (_, k) => {
        const a = ((k + 0.5) / 18) * Math.PI * 2;
        const alto = ALTO_PAP - PB.tubo - 10;
        const r0 = PB.rBase + PB.pared, r1 = PB.rBorde + PB.pared;
        return (
          <group key={k} rotation={[0, -a, 0]}>
            <mesh geometry={geoCaja(9, alto, 12, 4)} material={rojo} position={[(r0 + r1) / 2 + 2, alto / 2 + 4, 0]} rotation={[0, 0, -Math.atan2(r1 - r0, ALTO_PAP)]} castShadow receiveShadow />
          </group>
        );
      })}
      <mesh geometry={geoTetonesAro(PB.rBorde, 18, ALTO_PAP + 9)} material={blanco} castShadow receiveShadow />
      {pila.map((q) => (
        <mesh key={q.k} geometry={geoPapel(q.s, 40 + q.k)} material={papelViejo(q.k % 2 ? '#f1ecd8' : '#e7e1c8')} position={q.p} rotation={q.rot} receiveShadow />
      ))}
    </group>
  );
};
export const SombraPapelera: React.FC = () => (
  <mesh position={[PB.x + 18, -SUELO + 0.8, PB.z + 6]} rotation={[-Math.PI / 2, 0, 0]} scale={[PB.rBase * 3.1, PB.rBase * 2.4, 1]} renderOrder={2}>
    <planeGeometry args={[1, 1]} />
    <meshBasicMaterial map={mancha()} color="#1a1008" transparent opacity={0.6} depthWrite={false} toneMapped={false} />
  </mesh>
);

// ---------------------------------------------------------------- la bola de papel
export const BolaPapel: React.FC<{b: Bola}> = ({b}) => {
  const [x, y, z] = b.c;
  // se aplasta a lo largo de la normal del golpe (sin perder volumen)
  const n = new THREE.Vector3(b.aplasta.n[0], -b.aplasta.n[1], b.aplasta.n[2]).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
  const k = b.aplasta.k;
  const alto = SUELO - R_BOLA - y; // sobre el suelo
  return (
    <>
      <group position={[x, -y, z]} quaternion={q}>
        <group scale={[1 + 0.16 * k, 1 - 0.26 * k, 1 + 0.16 * k]}>
          <group quaternion={q.clone().invert()}>
            <mesh geometry={geoPapel(R_BOLA, 7)} material={papelMat()} rotation={[b.vuelco, 0.4, -b.giro]} castShadow receiveShadow />
          </group>
        </group>
      </group>
      {!b.dentro && alto < 420 && (
        <mesh position={[x + 6, -SUELO + 0.9, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[110 - alto * 0.08, 80 - alto * 0.06, 1]} renderOrder={2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={mancha()} color="#1a1008" transparent opacity={0.55 * (1 - alto / 420)} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </>
  );
};
