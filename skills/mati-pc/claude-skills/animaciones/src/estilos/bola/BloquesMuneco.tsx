import React from 'react';
import * as THREE from 'three';
import {rng} from '../../comun/curvas';
import {ALTO, MUNECO, PLACA, SILLA, SUELO, STUD, giroRaiz, type Cara, type Pose, type V3} from './escena';
import {COL, geoCaja, geoLadrillo, geoRedondo, mancha, plastico} from './BloquesPiezas';

// BLOQUES DE JUGUETE, EL MUÑECO Y SU SILLA. Un muñeco hecho de ladrillos (nada de la figura de ninguna marca):
// el cuerpo, un bloque de 2 × 2 amarillo con la camisa y la corbata impresas; las piernas, ladrillos de 1 × 1 azul oscuro (el muslo,
// tumbado y con sus tetones, porque está sentado); los brazos, ladrillos redondos con su codo y las manos blancas; la cabeza, un
// ladrillo redondo blanco con la cara impresa y su «pelo» de placa redonda marrón con cuatro tetones. Las caras se cambian enteras,
// como las caras de recambio del stop motion, y las pupilas miran a donde mira él. Gira con su silla de oficina azul.
// Los giros, los mismos que el esqueleto de escena.ts (ahí están explicados).

const M = MUNECO;

// el temblor del stop motion: cada pieza, un pelo distinto en cada postura
const tiembla = (paso: number, i: number, amp = 1.1): V3 => {
  const r = rng(paso * 7919 + i * 131 + 5);
  return [(r() - 0.5) * 2 * amp, (r() - 0.5) * 2 * amp, (r() - 0.5) * 0.014];
};

// ---------------------------------------------------------------- las caras impresas
const CARAS = new Map<string, THREE.CanvasTexture>();
const W = 512, H = 256;
const textoCara = (cara: Cara, ox: number, oy: number): THREE.CanvasTexture => {
  const k = `${cara}|${ox.toFixed(1)}|${oy.toFixed(1)}`;
  let t = CARAS.get(k);
  if (t) return t;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  const tinta = '#16131a';
  const cx = W / 2, ojoY = 104, sep = 70;
  const px = ox * 16, py = oy * 10; // las pupilas, hacia donde mira
  const ojo = (lado: number, forma: 'normal' | 'grande' | 'cerrado' | 'feliz' | 'medio' | 'susto') => {
    const ex = cx + lado * sep;
    x.fillStyle = tinta;
    x.strokeStyle = tinta;
    if (forma === 'cerrado') {
      // apretados: una raya que baja hacia fuera
      x.lineWidth = 13;
      x.beginPath();
      x.moveTo(ex - 30, ojoY + (lado > 0 ? 4 : 0));
      x.quadraticCurveTo(ex, ojoY - 12, ex + 30, ojoY + (lado > 0 ? 0 : 4));
      x.stroke();
      return;
    }
    if (forma === 'feliz') {
      x.lineWidth = 14;
      x.beginPath();
      x.arc(ex, ojoY + 14, 26, Math.PI * 1.1, Math.PI * 1.9);
      x.stroke();
      return;
    }
    if (forma === 'susto') {
      x.fillStyle = '#ffffff';
      x.lineWidth = 7;
      x.beginPath();
      x.ellipse(ex, ojoY, 34, 40, 0, 0, Math.PI * 2);
      x.fill();
      x.stroke();
      x.fillStyle = tinta;
      x.beginPath();
      x.arc(ex + px * 0.8, ojoY + py * 0.8, 10, 0, Math.PI * 2);
      x.fill();
      return;
    }
    const rx = forma === 'grande' ? 30 : 26, ry = forma === 'grande' ? 42 : 36;
    x.beginPath();
    x.ellipse(ex + px, ojoY + py, rx, ry, 0, 0, Math.PI * 2);
    x.fill();
    // el brillo
    x.fillStyle = '#ffffff';
    x.beginPath();
    x.arc(ex + px - rx * 0.32, ojoY + py - ry * 0.36, rx * 0.3, 0, Math.PI * 2);
    x.fill();
    if (forma === 'medio') {
      // el párpado a media asta (del color de la cabeza): mirada de «¿en serio?»
      x.fillStyle = COL.blanco;
      x.fillRect(ex - rx - 6, ojoY - ry - 8, 2 * rx + 12, ry + 4);
      x.strokeStyle = tinta;
      x.lineWidth = 9;
      x.beginPath();
      x.moveTo(ex - rx - 4, ojoY - 4);
      x.lineTo(ex + rx + 4, ojoY - 4);
      x.stroke();
    }
  };
  // las cejas: [inclinación hacia dentro (+ = enfado), altura]
  const cejas = (inc: number, alto: number, grosor = 12) => {
    x.strokeStyle = tinta;
    x.lineWidth = grosor;
    for (const lado of [-1, 1]) {
      const ex = cx + lado * sep;
      const y0 = ojoY - 62 - alto;
      x.beginPath();
      x.moveTo(ex - lado * 30, y0 + inc * 14);
      x.quadraticCurveTo(ex, y0 - 6, ex + lado * 30, y0 - inc * 14);
      x.stroke();
    }
  };
  const boca = (forma: 'linea' | 'sonrisa' | 'o' | 'dientes' | 'triste' | 'grande' | 'ondas' | 'lado') => {
    const by = 196;
    x.strokeStyle = tinta;
    x.fillStyle = tinta;
    x.lineWidth = 11;
    if (forma === 'linea') {
      x.beginPath(); x.moveTo(cx - 30, by); x.lineTo(cx + 30, by); x.stroke();
    } else if (forma === 'lado') {
      x.beginPath(); x.moveTo(cx - 34, by + 6); x.quadraticCurveTo(cx, by + 2, cx + 38, by - 8); x.stroke();
    } else if (forma === 'sonrisa') {
      x.beginPath(); x.arc(cx, by - 30, 40, Math.PI * 0.2, Math.PI * 0.8); x.stroke();
    } else if (forma === 'triste') {
      x.beginPath(); x.arc(cx, by + 34, 38, Math.PI * 1.2, Math.PI * 1.8); x.stroke();
    } else if (forma === 'o') {
      x.beginPath(); x.ellipse(cx, by, 22, 30, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#d9474f';
      x.beginPath(); x.ellipse(cx, by + 14, 13, 11, 0, 0, Math.PI * 2); x.fill();
    } else if (forma === 'dientes') {
      x.fillStyle = '#ffffff';
      x.beginPath(); x.roundRect(cx - 44, by - 18, 88, 36, 10); x.fill(); x.stroke();
      x.lineWidth = 6;
      x.beginPath(); x.moveTo(cx - 44, by); x.lineTo(cx + 44, by); x.stroke();
      for (const dx of [-22, 0, 22]) { x.beginPath(); x.moveTo(cx + dx, by - 18); x.lineTo(cx + dx, by + 18); x.stroke(); }
    } else if (forma === 'grande') {
      // la sonrisa enorme, abierta: dientes arriba y la lengua
      x.beginPath(); x.moveTo(cx - 62, by - 26); x.quadraticCurveTo(cx, by - 30, cx + 62, by - 26); x.quadraticCurveTo(cx + 50, by + 48, cx, by + 48);
      x.quadraticCurveTo(cx - 50, by + 48, cx - 62, by - 26); x.fill();
      x.fillStyle = '#ffffff';
      x.beginPath(); x.moveTo(cx - 54, by - 22); x.quadraticCurveTo(cx, by - 26, cx + 54, by - 22); x.lineTo(cx + 48, by - 6); x.quadraticCurveTo(cx, by - 4, cx - 48, by - 6); x.fill();
      x.fillStyle = '#d9474f';
      x.beginPath(); x.ellipse(cx, by + 30, 30, 14, 0, 0, Math.PI * 2); x.fill();
    } else if (forma === 'ondas') {
      x.beginPath();
      for (let i = 0; i <= 8; i++) {
        const xx = cx - 44 + i * 11, yy = by + (i % 2 ? -7 : 7);
        if (i === 0) x.moveTo(xx, yy);
        else x.lineTo(xx, yy);
      }
      x.stroke();
    }
  };
  switch (cara) {
    case 'atento': cejas(0.35, -6); ojo(-1, 'normal'); ojo(1, 'normal'); boca('linea'); break;
    case 'ilusion': cejas(-0.3, 8); ojo(-1, 'grande'); ojo(1, 'grande'); boca('sonrisa'); break;
    case 'tension': cejas(-0.5, 2); ojo(-1, 'grande'); ojo(1, 'grande'); boca('dientes'); break;
    case 'ay': cejas(-0.7, 16); ojo(-1, 'grande'); ojo(1, 'grande'); boca('o'); break;
    case 'fastidio': cejas(0.8, -8, 14); ojo(-1, 'cerrado'); ojo(1, 'cerrado'); boca('triste'); break;
    case 'meh': cejas(0, 4); ojo(-1, 'medio'); ojo(1, 'medio'); boca('lado'); break;
    case 'susto': cejas(-0.6, 20); ojo(-1, 'susto'); ojo(1, 'susto'); boca('ondas'); break;
    case 'feliz': cejas(-0.4, 14); ojo(-1, 'feliz'); ojo(1, 'feliz'); boca('grande'); break;
    case 'serio': cejas(0.1, -2); ojo(-1, 'medio'); ojo(1, 'medio'); boca('linea'); break;
  }
  t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  CARAS.set(k, t);
  return t;
};
const matsCara = new Map<string, THREE.MeshPhysicalMaterial>();
const caraMat = (cara: Cara, ojos: [number, number]) => {
  const ox = Math.round(ojos[0] * 4) / 4, oy = Math.round(ojos[1] * 4) / 4;
  const k = `${cara}|${ox}|${oy}`;
  let m = matsCara.get(k);
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({map: textoCara(cara, ox, oy), transparent: true, roughness: 0.3, clearcoat: 0.85, clearcoatRoughness: 0.08, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2});
    matsCara.set(k, m);
  }
  return m;
};
// la camisa y la corbata impresas en el cuerpo
let CAMISA: THREE.MeshPhysicalMaterial | null = null;
const camisaMat = () => {
  if (CAMISA) return CAMISA;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const x = c.getContext('2d')!;
  // el cuello blanco
  x.fillStyle = '#ffffff';
  x.beginPath(); x.moveTo(60, 0); x.lineTo(128, 70); x.lineTo(196, 0); x.lineTo(150, 0); x.lineTo(128, 30); x.lineTo(106, 0); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(0,0,0,0.25)';
  x.lineWidth = 4;
  x.stroke();
  // la corbata roja
  x.fillStyle = COL.rojo;
  x.beginPath(); x.moveTo(110, 28); x.lineTo(146, 28); x.lineTo(138, 60); x.lineTo(156, 190); x.lineTo(128, 228); x.lineTo(100, 190); x.lineTo(118, 60); x.closePath(); x.fill();
  x.fillStyle = '#8f1206';
  x.beginPath(); x.moveTo(110, 28); x.lineTo(146, 28); x.lineTo(138, 60); x.lineTo(118, 60); x.closePath(); x.fill();
  // un bolsillo
  x.strokeStyle = 'rgba(90,60,0,0.45)';
  x.lineWidth = 5;
  x.strokeRect(170, 110, 46, 40);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  CAMISA = new THREE.MeshPhysicalMaterial({map: t, transparent: true, roughness: 0.3, clearcoat: 0.85, clearcoatRoughness: 0.08, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2});
  return CAMISA;
};

const geoCaraPanel = (() => {
  let g: THREE.CylinderGeometry | null = null;
  return () => (g ??= new THREE.CylinderGeometry(M.cabeza.r + 0.5, M.cabeza.r + 0.5, 84, 40, 1, true, -1.3, 2.6));
})();

// ---------------------------------------------------------------- el muñeco
export const Muneco: React.FC<{pose: Pose; paso: number}> = ({pose, paso}) => {
  const amarillo = plastico(COL.amarillo), azul = plastico(COL.azulOscuro), blanco = plastico(COL.blanco), gris = plastico(COL.grisOscuro);
  const pelo = plastico(COL.marron), negro = plastico(COL.negro);
  const T = M.torso;
  const [bx, by, bz] = pose.base;
  const j0 = tiembla(paso, 1), jt = tiembla(paso, 2, 0.8), jh = tiembla(paso, 3, 0.8);
  const brazo = (lado: 1 | -1) => {
    const b = lado > 0 ? pose.izq : pose.der;
    const jb = tiembla(paso, lado > 0 ? 4 : 5, 0.7);
    return (
      <group key={lado} position={[lado * M.hombro.x, T.alto - M.hombro.abajo, 0]} rotation={[-b.alza + jb[2], lado * b.giro, lado * b.abre, 'XZY']}>
        <mesh geometry={geoRedondo(26, 26, 0, 8)} material={amarillo} position={[0, -12, 0]} castShadow receiveShadow />
        <mesh geometry={geoRedondo(24, M.brazo[0], 0, 5)} material={amarillo} position={[0, -M.brazo[0], 0]} castShadow receiveShadow />
        <group position={[0, -M.brazo[0], 0]} rotation={[-b.codo, 0, 0]}>
          <mesh geometry={geoRedondo(22.5, M.brazo[1], 0, 5)} material={amarillo} position={[0, -M.brazo[1], 0]} castShadow receiveShadow />
          {/* la mano: una pieza redonda blanca con su pinza */}
          <mesh geometry={geoRedondo(M.rMano, 30, 0, 9)} material={blanco} position={[0, -M.brazo[1] - 24, 0]} castShadow receiveShadow />
        </group>
      </group>
    );
  };
  const pierna = (lado: 1 | -1) => (
    <group key={lado} position={[lado * M.pierna.x, M.cadera * 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* el muslo: un ladrillo de 1 × 2 tumbado, con los tetones hacia arriba */}
      <mesh geometry={geoLadrillo(1, 2, ALTO * 0.8)} material={azul} rotation={[Math.PI / 2, 0, 0]} position={[0, -M.pierna.muslo / 2 + 4, -ALTO * 0.4]} castShadow receiveShadow />
      <group position={[0, -M.pierna.muslo + 8, 0]} rotation={[Math.PI / 2 - pose.patada, 0, 0]}>
        <mesh geometry={geoLadrillo(1, 1, M.pierna.espinilla, false)} material={azul} position={[0, -M.pierna.espinilla, 0]} castShadow receiveShadow />
        {/* el pie, una placa de 1 × 2 */}
        <mesh geometry={geoLadrillo(1, 2, PLACA, false)} material={negro} position={[0, -M.pierna.espinilla - PLACA + 2, STUD * 0.45]} castShadow receiveShadow />
      </group>
    </group>
  );
  return (
    <group position={[bx + j0[0], -by + pose.salto + j0[1], bz]} rotation={[0, giroRaiz(pose) + j0[2], 0]} scale={[M.escala, M.escala, M.escala]}>
      {/* la cadera: una placa de 2 × 1 */}
      <mesh geometry={geoLadrillo(2, 1, M.cadera, false)} material={azul} castShadow receiveShadow />
      {pierna(1)}
      {pierna(-1)}
      {/* el cuerpo, con su camisa impresa delante */}
      <group position={[jt[0], M.cadera + jt[1], 0]} rotation={[pose.inclina + jt[2], 0, pose.ladea]}>
        <mesh geometry={geoCaja(T.an, T.alto, T.fondo)} material={amarillo} position={[0, T.alto / 2, 0]} castShadow receiveShadow />
        <mesh material={camisaMat()} position={[0, T.alto / 2 + 2, T.fondo / 2 + 0.6]} renderOrder={3}>
          <planeGeometry args={[T.an - 10, T.alto - 4]} />
        </mesh>
        {/* la cabeza: el cuello, el ladrillo redondo, la cara impresa y el pelo */}
        <group position={[jh[0], T.alto + M.cuello, jh[1]]} rotation={[pose.cabeza.cabecea + jh[2], pose.cabeza.gira, pose.cabeza.ladea, 'YXZ']}>
          <mesh geometry={geoRedondo(28, M.cuello + 2, 0, 3)} material={gris} position={[0, -M.cuello - 1, 0]} castShadow receiveShadow />
          <mesh geometry={geoRedondo(M.cabeza.r, M.cabeza.alto, 0, 9)} material={blanco} castShadow receiveShadow />
          <mesh geometry={geoCaraPanel()} material={caraMat(pose.cara, pose.ojos)} position={[0, M.cabeza.alto / 2 + 2, 0]} renderOrder={3} />
          <mesh geometry={geoRedondo(M.cabeza.r + 3, M.pelo, 2, 5)} material={pelo} position={[0, M.cabeza.alto - 4, 0]} castShadow receiveShadow />
          {/* el flequillo: una placa redonda de lado, encima de la frente */}
          <mesh geometry={geoCaja(96, 18, 30, 8)} material={pelo} position={[-6, M.cabeza.alto - 2, M.cabeza.r - 10]} rotation={[0.25, 0, -0.06]} castShadow />
        </group>
        {brazo(1)}
        {brazo(-1)}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------- la silla de oficina (gira con él)
export const Silla: React.FC<{pose: Pose}> = ({pose}) => {
  const azul = plastico(COL.azul), gris = plastico(COL.grisOscuro), negro = plastico(COL.negro);
  const yAsiento = SUELO - SILLA.asiento; // alto del asiento sobre el suelo
  const sombra = (x: number, z: number, s: number, o = 0.5) => (
    <mesh position={[x, -SUELO + 0.8, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[s, s * 0.8, 1]} renderOrder={2}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={mancha()} color="#1a1008" transparent opacity={o} depthWrite={false} toneMapped={false} />
    </mesh>
  );
  return (
    <group>
      {sombra(SILLA.x + 10, SILLA.z, 300, 0.55)}
      <group position={[SILLA.x, -SUELO, SILLA.z]}>
        {/* la base de cinco patas con ruedas (placas de 1 × 3 y tetones redondos) */}
        {[0, 1, 2, 3, 4].map((k) => {
          const a = (k / 5) * Math.PI * 2 + 0.3;
          return (
            <group key={k} rotation={[0, a, 0]}>
              <mesh geometry={geoLadrillo(1, 3, PLACA, false)} material={negro} position={[0, 26, STUD * 0.95]} castShadow receiveShadow />
              <mesh geometry={geoRedondo(13, 22, 0, 5)} material={gris} position={[0, 2, STUD * 2.1]} castShadow receiveShadow />
            </group>
          );
        })}
        <mesh geometry={geoRedondo(30, 36, 0, 6)} material={negro} position={[0, 22, 0]} castShadow receiveShadow />
        {/* el poste */}
        <mesh geometry={geoRedondo(16, yAsiento - 70, 0, 3)} material={gris} position={[0, 52, 0]} castShadow receiveShadow />
        {/* el asiento y el respaldo, que giran con él */}
        <group rotation={[0, giroRaiz(pose), 0]}>
          <mesh geometry={geoLadrillo(3, 3, PLACA * 1.5, true)} material={azul} position={[0, yAsiento - PLACA * 1.5, -6]} castShadow receiveShadow />
          <mesh geometry={geoLadrillo(3, 1, ALTO * 2.1, true)} material={azul} position={[0, yAsiento - 4, -STUD * 1.5 - 4]} castShadow receiveShadow />
        </group>
      </group>
    </group>
  );
};
