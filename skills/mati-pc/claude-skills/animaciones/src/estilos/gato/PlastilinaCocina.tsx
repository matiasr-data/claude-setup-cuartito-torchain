import React from 'react';
import * as THREE from 'three';
import {rng} from '../../comun/curvas';
import {type V3, TESELA, arcilla, geoAro, geoBola, geoCaja, geoCapsula, mancha, orienta, relieve} from '../PlastilinaArcilla';
import {D} from '../camara3d';
import {MESA_G, MESA_Y, SUELO} from './escena';

// 10 · PLASTILINA, LA COCINA DEL GATO: la mesa de madera de plastilina (nítida, donde pasa todo), y detrás una cocina
// de plastilina: pared verde agua con azulejos crema abajo, la ventana con su cielo, nubes y cortinas mostaza, el reloj, la balda
// con botes y una planta, la lámpara colgada, el radiador debajo de la mesa y el suelo de tablas con el comedero.
// LA CÁMARA: mira de frente (el plano del gato, z = 0, sale 1:1 en la pantalla: el gato en el mismo sitio y del mismo tamaño que en
// los estilos planos), pero está a la altura de sus ojos (y 560) con el objetivo descentrado, como una cámara de mesa: así se ve
// la tabla de la mesa por encima, el café dentro de la taza y el suelo donde se rompe.

export const CAM_Y = 560; // a qué altura de la pantalla está la cámara (en el plano z = 0)
export const Z_PARED = -400;
const PR = 220; // media profundidad de la mesa

// una capa a la profundidad z, escalada para que sus coordenadas (las de la pantalla) caigan en su sitio
export const Capa: React.FC<{z: number; children: React.ReactNode}> = ({z, children}) => {
  const s = (D - z) / D;
  return <group position={[540 * (1 - s), -CAM_Y * (1 - s), z]} scale={[s, s, s]}>{children}</group>;
};
// a qué profundidad está el suelo que en la pantalla sale en la y dada (para lo que se queda en el suelo)
export const zSuelo = (y: number) => D * (1 - (SUELO - CAM_Y) / Math.max(1, y - CAM_Y));

export const COL_COCINA = {
  pared: '#93C9BC', azulejo: '#F3E9D6', azulejo2: '#E9C25A', junta: '#CDBFA6', moldura: '#F1E5CE',
  cielo: '#A6D8F2', nube: '#FCF8F2', marco: '#F7F1E6', cortina: '#E7B443', cortina2: '#D99E2E', arbol: '#6DAA5E',
  reloj: '#FBF5EA', relojAro: '#E3A93A', aguja: '#2C2627', madera: '#C98247', vena: '#94562D', balda: '#B9733F',
  bote1: '#F4EAD8', bote2: '#5FA5A0', tapa: '#E3A93A', maceta: '#C9663F', hoja: '#4F9A55', hoja2: '#6DB06A',
  lampara: '#E6AE3C', bombilla: '#FFF2C9', cable: '#3A2E2A', radiador: '#5E9D94', suelo1: '#D4A26C', suelo2: '#C9955F', suelo3: '#DCAE79',
  hueco: '#7A4E2E', zocalo: '#F1E5CE', comedero: '#3E8E8A', pienso: '#8A5226', mesa: '#C77C43', mesaVena: '#8E5230', mesaPata: '#B86E3A',
};
const C = COL_COCINA;

// un plano con la textura de relieve a la escala de la arcilla
const planos = new Map<string, THREE.PlaneGeometry>();
const geoPlano = (w: number, h: number) => {
  const k = `${w}x${h}`;
  let g = planos.get(k);
  if (g) return g;
  g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / TESELA, (uv.getY(i) * h) / TESELA);
  planos.set(k, g);
  return g;
};

const Caja: React.FC<{x: number; y: number; w: number; h: number; d: number; z?: number; r?: number; mat: THREE.Material; sombra?: boolean}> = ({
  x, y, w, h, d, z = 0, r = 6, mat, sombra = true,
}) => <mesh geometry={geoCaja(w, h, d, r)} material={mat} position={[x + w / 2, -(y + h / 2), z]} castShadow={sombra} receiveShadow />;
const Palo: React.FC<{a: V3; b: V3; r: number; rb?: number; mat: THREE.Material; semilla: number; amp?: number}> = ({a, b, r, rb, mat, semilla, amp = 0.5}) => {
  const {L, quat} = orienta(a, b);
  return <mesh geometry={geoCapsula(Math.max(1, Math.round(L)), r, rb ?? r, semilla, amp)} material={mat} position={a} quaternion={quat} castShadow receiveShadow />;
};

// ---------------------------------------------------------------- la pared (va desenfocada)
export const Pared: React.FC<{t: number}> = ({t}) => {
  const m = (c: string, o?: Parameters<typeof arcilla>[1]) => arcilla(c, o);
  // los azulejos: crema, con alguno mostaza suelto
  const azulejos: React.ReactNode[] = [];
  const r = rng(515);
  for (let fila = 0; fila < 8; fila++) {
    for (let col = 0; col < 16; col++) {
      const x = -160 + col * 92 + (r() - 0.5) * 3, y = 906 + fila * 92 + (r() - 0.5) * 3;
      const acento = (fila * 5 + col * 3) % 11 === 4;
      azulejos.push(<Caja key={`${fila}-${col}`} x={x} y={y} w={86} h={86} d={12} z={8} r={9} mat={m(acento ? C.azulejo2 : C.azulejo, {rough: 0.5, brillo: 0.25})} />);
    }
  }
  // el reloj: la aguja de los segundos salta cada segundo
  const seg = Math.floor(t) * 6 * (Math.PI / 180) + 1.1;
  return (
    <group dispose={null}>
      <mesh geometry={geoPlano(7000, 5000)} position={[540, -900, Z_PARED]} receiveShadow>
        <meshStandardMaterial color={C.pared} roughness={0.95} bumpMap={relieve()} bumpScale={1.1} />
      </mesh>
      {/* el zócalo, de verdad en el suelo */}
      <mesh geometry={geoCaja(7000, 46, 24, 10)} material={m(C.zocalo)} position={[540, -SUELO + 23, Z_PARED + 12]} castShadow receiveShadow />
      <Capa z={Z_PARED + 1}>
        {/* abajo, los azulejos sobre la junta, con su moldura */}
        <Caja x={-200} y={896} w={1500} h={760} d={4} z={2} r={2} mat={m(C.junta, {rough: 0.9})} sombra={false} />
        {azulejos}
        <Caja x={-200} y={872} w={1500} h={26} d={30} z={14} r={8} mat={m(C.moldura)} />

        {/* la ventana: el cielo, un árbol, dos nubes, el marco con su cruz y el alféizar */}
        <mesh position={[285, -505, 3]}>
          <planeGeometry args={[390, 510]} />
          <meshStandardMaterial color={C.cielo} emissive={C.cielo} emissiveIntensity={0.6} roughness={1} />
        </mesh>
        {[[130, 360, 1], [370, 300, 0.8]].map(([nx, ny, s], n) => (
          <group key={n} position={[nx, -ny, 10]} scale={[s, s, s]}>
            {[[-38, 8, 24], [-10, -6, 34], [24, 2, 28], [50, 10, 19]].map(([bx, by, br], k) => (
              <mesh key={k} geometry={geoBola(br, 300 + n * 10 + k, 0.8)} material={m(C.nube, {rough: 0.8})} position={[bx, -by, 0]} scale={[1, 0.85, 0.45]} />
            ))}
          </group>
        ))}
        {[[150, 700, 80], [235, 690, 62], [95, 680, 58], [330, 735, 54], [410, 720, 70]].map(([ax, ay, ar], k) => (
          <mesh key={k} geometry={geoBola(ar, 320 + k, 1.2)} material={m(k % 2 ? C.arbol : C.hoja, {rough: 0.75})} position={[ax, -ay, 8]} scale={[1, 0.9, 0.35]} />
        ))}
        <Caja x={80} y={240} w={410} h={22} d={36} z={16} mat={m(C.marco)} />
        <Caja x={80} y={748} w={410} h={22} d={36} z={16} mat={m(C.marco)} />
        <Caja x={80} y={240} w={22} h={530} d={36} z={16} mat={m(C.marco)} />
        <Caja x={468} y={240} w={22} h={530} d={36} z={16} mat={m(C.marco)} />
        <Caja x={278} y={250} w={14} h={510} d={24} z={14} mat={m(C.marco)} />
        <Caja x={90} y={498} w={390} h={14} d={24} z={14} mat={m(C.marco)} />
        <Caja x={60} y={766} w={450} h={22} d={70} z={30} mat={m(C.marco)} />
        {/* las cortinas mostaza, con sus pliegues, y la barra */}
        <Palo a={[20, -222, 50]} b={[560, -222, 50]} r={7} mat={m(C.cable, {rough: 0.5})} semilla={340} />
        {[[30, 1], [430, -1]].map(([x0], n) =>
          [0, 1, 2, 3].map((k) => {
            const x = x0 + 18 + k * 26;
            return (
              <Palo key={`${n}-${k}`} a={[x, -232, 40 + (k % 2) * 10]} b={[x + (n ? -1 : 1) * (k * 6 - 6), -800, 40 + (k % 2) * 10]} r={17}
                rb={20} mat={m(k % 2 ? C.cortina : C.cortina2)} semilla={350 + n * 10 + k} amp={1} />
            );
          }),
        )}

        {/* el reloj */}
        <group position={[905, -300, 12]}>
          <mesh geometry={geoBola(76, 360, 0.5)} material={m(C.reloj, {rough: 0.7})} scale={[1, 1, 0.16]} castShadow receiveShadow />
          <mesh geometry={geoAro(76, 10)} material={m(C.relojAro)} position={[0, 0, 4]} castShadow />
          {Array.from({length: 12}, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <mesh key={i} geometry={geoBola(4.5, 361, 0)} material={m(C.aguja)} position={[Math.sin(a) * 60, Math.cos(a) * 60, 13]} />;
          })}
          <Palo a={[0, 0, 15]} b={[Math.sin(0.9) * 36, Math.cos(0.9) * 36, 15]} r={4.5} mat={m(C.aguja)} semilla={362} />
          <Palo a={[0, 0, 18]} b={[Math.sin(5.1) * 54, Math.cos(5.1) * 54, 18]} r={3.4} mat={m(C.aguja)} semilla={363} />
          <Palo a={[0, 0, 21]} b={[Math.sin(seg) * 58, Math.cos(seg) * 58, 21]} r={1.8} mat={m('#D9473C')} semilla={364} />
          <mesh geometry={geoBola(7, 365, 0)} material={m(C.aguja)} position={[0, 0, 22]} />
        </group>

        {/* la balda con los botes y la planta */}
        <Caja x={720} y={612} w={350} h={22} d={90} z={45} mat={m(C.balda)} />
        <Caja x={748} y={512} w={66} h={100} d={66} z={45} r={18} mat={m(C.bote1)} />
        <Caja x={744} y={500} w={74} h={20} d={72} z={45} r={9} mat={m(C.tapa)} />
        <Caja x={834} y={538} w={60} h={74} d={60} z={45} r={18} mat={m(C.bote2)} />
        <Caja x={831} y={527} w={66} h={16} d={66} z={45} r={7} mat={m(C.bote1)} />
        <Caja x={912} y={556} w={50} h={56} d={50} z={45} r={14} mat={m(C.bote1)} />
        <Caja x={985} y={556} w={66} h={56} d={60} z={45} r={14} mat={m(C.maceta)} />
        {[[-0.5, 70], [-0.15, 92], [0.2, 84], [0.55, 66], [0.05, 60]].map(([a, l], k) => (
          <Palo key={k} a={[1018, -560, 45]} b={[1018 + Math.sin(a) * l, -560 + Math.cos(a) * l, 45 + (k - 2) * 6]} r={9} rb={4}
            mat={m(k % 2 ? C.hoja2 : C.hoja)} semilla={380 + k} amp={0.6} />
        ))}

        {/* el radiador, debajo de la mesa */}
        <Caja x={160} y={1240} w={270} h={226} d={14} z={20} r={8} mat={m(C.radiador)} />
        {Array.from({length: 8}, (_, i) => (
          <Palo key={i} a={[180 + i * 33, -1258, 40]} b={[180 + i * 33, -1448, 40]} r={13} mat={m(C.radiador, {rough: 0.5, brillo: 0.2})} semilla={390 + i} amp={0.4} />
        ))}
        <Palo a={[170, -1466, 30]} b={[170, -1560, 30]} r={8} mat={m(C.radiador)} semilla={400} />
        <Palo a={[420, -1466, 30]} b={[420, -1560, 30]} r={8} mat={m(C.radiador)} semilla={401} />
      </Capa>

      {/* la lámpara colgada, un poco por delante de la pared */}
      <Capa z={-160}>
        <Palo a={[660, 120, 0]} b={[660, -160, 0]} r={4} mat={m(C.cable, {rough: 0.5})} semilla={410} />
        <mesh geometry={geoBola(78, 411, 0.8, Math.PI / 2)} material={m(C.lampara, {rough: 0.5, brillo: 0.2})} position={[660, -238, 0]} scale={[1, 0.8, 1]} castShadow receiveShadow />
        <mesh geometry={geoBola(70, 413, 0.2, Math.PI / 2)} material={m(C.bombilla, {emite: '#FFE7A6', fuerza: 0.6})} position={[660, -240, 0]} scale={[1, 0.62, 1]} rotation={[Math.PI, 0, 0]} />
        <mesh geometry={geoBola(26, 412, 0)} material={m(C.bombilla, {rough: 0.3, emite: '#FFE7A6', fuerza: 2})} position={[660, -250, 0]} />
      </Capa>
    </group>
  );
};

// ---------------------------------------------------------------- el suelo de tablas y el comedero (va un poco desenfocado)
export const Suelo: React.FC = () => {
  const tablas: React.ReactNode[] = [];
  const r = rng(717);
  const cols = [C.suelo1, C.suelo2, C.suelo3];
  for (let fila = 0; fila < 15; fila++) {
    const z = Z_PARED + 50 + fila * 98;
    let x = -1400 - r() * 600;
    let k = 0;
    while (x < 2500) {
      const largo = 700 + r() * 600;
      tablas.push(
        <mesh key={`${fila}-${k}`} geometry={geoCaja(Math.round(largo - 6), 14, 92, 5)} material={arcilla(cols[(fila + k) % 3], {rough: 0.72})}
          position={[x + largo / 2, -SUELO - 7, z]} castShadow receiveShadow />,
      );
      x += largo;
      k++;
    }
  }
  const zc = -170;
  const xc = 540 + (494 - 540) * ((D - zc) / D);
  return (
    <group dispose={null}>
      <mesh geometry={geoPlano(7000, 1700)} position={[540, -SUELO - 10, Z_PARED + 850]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={C.hueco} roughness={1} />
      </mesh>
      {tablas}
      {/* el comedero: un cuenco verde agua con pienso */}
      <group position={[xc, -SUELO, zc]}>
        <mesh geometry={geoBola(64, 430, 0.8, Math.PI / 2)} material={arcilla(C.comedero, {rough: 0.5, brillo: 0.2})} rotation={[Math.PI, 0, 0]}
          position={[0, 34, 0]} scale={[1, 0.55, 1]} castShadow receiveShadow />
        <mesh geometry={geoAro(60, 7)} material={arcilla(C.comedero, {rough: 0.5, brillo: 0.2})} rotation={[Math.PI / 2, 0, 0]} position={[0, 34, 0]} castShadow />
        {Array.from({length: 22}, (_, i) => {
          const rr = rng(440 + i);
          const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * 48;
          return <mesh key={i} geometry={geoBola(8, 450 + (i % 5), 0.5)} material={arcilla(C.pienso, {rough: 0.8})}
            position={[Math.cos(a) * d, 34 + rr() * 5, Math.sin(a) * d]} castShadow />;
        })}
      </group>
      <mesh position={[xc + 10, -SUELO + 0.6, zc]} rotation={[-Math.PI / 2, 0, 0]} scale={[200, 130, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={mancha()} color="#3a1c0c" transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- la mesa (nítida): el tablero con sus vetas, el faldón y las patas
export const Mesa: React.FC = () => {
  const madera = arcilla(C.mesa, {rough: 0.6});
  const vena = arcilla(C.mesaVena, {rough: 0.7, bump: 0.4});
  const pata = arcilla(C.mesaPata, {rough: 0.62});
  const y0 = MESA_Y, g = MESA_G;
  const linea = (a: V3, b: V3, r: number, semilla: number) => <Palo key={semilla} a={a} b={b} r={r} mat={vena} semilla={semilla} amp={0.2} />;
  return (
    <group dispose={null}>
      <mesh geometry={geoCaja(780, g, 2 * PR, 12)} material={madera} position={[330, -(y0 + g / 2), 0]} castShadow receiveShadow />
      {/* las juntas de las tablas del tablero y las vetas del canto */}
      {linea([-60, -y0 + 0.4, -74], [708, -y0 + 0.4, -74], 2.4, 470)}
      {linea([-60, -y0 + 0.4, 74], [708, -y0 + 0.4, 74], 2.4, 471)}
      {linea([-60, -(y0 + 12), PR + 0.3], [420, -(y0 + 11), PR + 0.3], 1.6, 472)}
      {linea([150, -(y0 + 22), PR + 0.3], [700, -(y0 + 24), PR + 0.3], 1.6, 473)}
      {linea([-60, -(y0 + 29), PR + 0.3], [260, -(y0 + 28), PR + 0.3], 1.4, 474)}
      {/* el faldón y las cuatro patas */}
      <mesh geometry={geoCaja(522, 36, 18, 6)} material={pata} position={[394, -(y0 + g + 18), PR - 24]} castShadow receiveShadow />
      <mesh geometry={geoCaja(522, 36, 18, 6)} material={pata} position={[394, -(y0 + g + 18), -PR + 24]} castShadow receiveShadow />
      {[123, 665].map((x) => [PR - 26, -PR + 26].map((z) => (
        <mesh key={`${x}-${z}`} geometry={geoCaja(30, SUELO - y0 - g + 2, 30, 9)} material={pata} position={[x, -(y0 + g + (SUELO - y0 - g) / 2), z]}
          castShadow receiveShadow />
      )))}
      {[123, 665].map((x) => [PR - 26, -PR + 26].map((z) => (
        <mesh key={`s${x}-${z}`} position={[x + 12, -SUELO + 0.8, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[90, 60, 1]} renderOrder={2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={mancha()} color="#2a1206" transparent opacity={0.5} depthWrite={false} toneMapped={false} />
        </mesh>
      )))}
    </group>
  );
};
