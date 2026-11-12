import React from 'react';
import * as THREE from 'three';
import {ALTO, MUNECO, PLACA, STUD, giroRaiz, type Cara, type Pose} from '../escena';
import {RoundedBoxGeometry} from 'three-stdlib';
import {TETON} from '../BloquesPiezas';
import {vidrio} from './CristalEstudio';

// CRISTAL, EL MUÑECO: el mismo muñeco de bloques, con las mismas piezas y los mismos giros que el de juguete
// (BloquesMuneco.tsx; el esqueleto en escena.ts), pero de CRISTAL TALLADO: cada pieza es un prisma de pocas caras o un bloque con los
// cantos achaflanados, con las caras planas (cada una refleja las tiras del estudio por su lado: los brillos nítidos del cristal
// cortado). Casi transparente en el centro y de color solo donde el vidrio es grueso (los cantos): ámbar el cuerpo y los brazos, azul
// las piernas, el pelo ámbar oscuro con sus tetones, las manos y la cabeza de cristal claro. Detrás de él, en el fondo, una luz suave
// que su vidrio dobla (si no, el vidrio claro sobre el negro del estudio es negro). La cara, GRABADA en blanco que brilla, más grande
// y con un velo oscuro alrededor de cada trazo, para que se lea a 505 px sobre lo que haya detrás; la pupila, hueca. La corbata, roja
// y opaca, y el cuello de la camisa, blanco.

const M = MUNECO;

// ---------------------------------------------------------------- los vidrios del muñeco
// (el color de atenuación, calculado para que el centro quede casi claro y los cantos, que cruzan ~7 veces más vidrio, se tiñan del todo)
const mat = {
  ambar: () => vidrio('ambar-tallado', {color: '#fffbf4', atenua: '#f4c878', dist: 100, grosor: 55, rugoso: 0, disp: 9, irid: 0.45, env: 2.1, capa: 0.6, facetas: true}),
  cabeza: () => vidrio('cabeza-tallada', {color: '#ffffff', atenua: '#fff0d8', dist: 400, grosor: 45, rugoso: 0, disp: 9, irid: 0.5, env: 2, capa: 0.6, facetas: true}),
  pelo: () => vidrio('pelo-tallado', {color: '#fff6ea', atenua: '#e8862a', dist: 80, grosor: 40, rugoso: 0, disp: 8, irid: 0.4, env: 2.1, capa: 0.6, facetas: true}),
  piernas: () => vidrio('piernas-talladas', {color: '#f8fbff', atenua: '#99c0f2', dist: 88, grosor: 55, rugoso: 0, disp: 8, irid: 0.4, env: 2.1, capa: 0.6, facetas: true}),
  manos: () => vidrio('manos-talladas', {color: '#ffffff', atenua: '#eef4ff', dist: 400, grosor: 30, rugoso: 0.04, disp: 8, irid: 0.4, env: 2, capa: 0.6, facetas: true}),
  humo: () => vidrio('humo-tallado', {color: '#c8ccd6', atenua: '#3a3e4c', dist: 50, grosor: 30, rugoso: 0, disp: 6, irid: 0.3, env: 2, capa: 0.6, facetas: true}),
};

// ---------------------------------------------------------------- las formas talladas
const formas = new Map<string, THREE.BufferGeometry>();
// un prisma de pocas caras con los cantos achaflanados (los ladrillos redondos, tallados), con la base en y = 0 y una cara de frente
const prisma = (r: number, h: number, lados: number, ch: number) => {
  const k = `p${r}|${h}|${lados}|${ch}`;
  let g = formas.get(k);
  if (!g) {
    const c = Math.min(ch, r / 3, h / 3);
    const perfil = [[0, 0], [r - c, 0], [r, c], [r, h - c], [r - c, h], [0, h]].map(([x, y]) => new THREE.Vector2(x, y));
    g = new THREE.LatheGeometry(perfil, lados, Math.PI / lados);
    formas.set(k, g);
  }
  return g;
};
// un bloque con los cantos achaflanados, centrado
const tallada = (w: number, h: number, d: number, ch: number) => {
  const k = `t${w}|${h}|${d}|${ch}`;
  let g = formas.get(k);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, 1, Math.min(ch, w / 2 - 0.5, h / 2 - 0.5, d / 2 - 0.5));
    formas.set(k, g);
  }
  return g;
};

let ROJO: THREE.MeshPhysicalMaterial | null = null;
const rojo = () => (ROJO ??= new THREE.MeshPhysicalMaterial({color: '#e3121c', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04, emissive: '#5a0306', emissiveIntensity: 1, envMapIntensity: 1.3}));
let BLANCO: THREE.MeshPhysicalMaterial | null = null;
const blanco = () => (BLANCO ??= new THREE.MeshPhysicalMaterial({color: '#f6f3ee', roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.08, emissive: '#ffffff', emissiveIntensity: 0.08, envMapIntensity: 1.1}));

// ---------------------------------------------------------------- la corbata y el cuello (en 3D, con su bisel)
let CORBATA: THREE.ExtrudeGeometry | null = null;
const geoCorbata = () => {
  if (CORBATA) return CORBATA;
  // el dibujo de la de juguete (BloquesMuneco, camisaMat), en px del cuerpo: el nudo arriba y la pala abajo
  const s = new THREE.Shape();
  const k = (M.torso.alto - 4) / 256;
  const P = (x: number, y: number) => [(x - 128) * k, -(y - 28) * k] as const;
  s.moveTo(...P(110, 28));
  s.lineTo(...P(146, 28));
  s.lineTo(...P(138, 60));
  s.lineTo(...P(156, 190));
  s.lineTo(...P(128, 228));
  s.lineTo(...P(100, 190));
  s.lineTo(...P(118, 60));
  s.closePath();
  CORBATA = new THREE.ExtrudeGeometry(s, {depth: 5, bevelEnabled: true, bevelThickness: 2.5, bevelSize: 2, bevelSegments: 3});
  return CORBATA;
};
let CUELLO: THREE.ExtrudeGeometry | null = null;
const geoCuello = () => {
  if (CUELLO) return CUELLO;
  const s = new THREE.Shape();
  const k = (M.torso.alto - 4) / 256;
  const P = (x: number, y: number) => [(x - 128) * k, -y * k] as const;
  s.moveTo(...P(60, 0));
  s.lineTo(...P(128, 70));
  s.lineTo(...P(196, 0));
  s.lineTo(...P(150, 0));
  s.lineTo(...P(128, 30));
  s.lineTo(...P(106, 0));
  s.closePath();
  CUELLO = new THREE.ExtrudeGeometry(s, {depth: 3, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.5, bevelSegments: 2});
  return CUELLO;
};

// ---------------------------------------------------------------- la cara grabada (blanco que brilla; la pupila, hueca)
const CARAS = new Map<string, THREE.MeshBasicMaterial>();
const W = 512, H = 256;
const caraMat = (cara: Cara, ojos: [number, number]): THREE.MeshBasicMaterial => {
  const ox = Math.round(ojos[0] * 4) / 4, oy = Math.round(ojos[1] * 4) / 4;
  const clave = `${cara}|${ox}|${oy}`;
  let m = CARAS.get(clave);
  if (m) return m;
  // se dibuja en blanco en un lienzo aparte y luego se compone: primero un velo oscuro desenfocado (el contraste sobre cualquier fondo)
  // y encima los trazos con su brillo
  const a = document.createElement('canvas');
  a.width = W;
  a.height = H;
  const x = a.getContext('2d')!;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  x.translate(W / 2, 150);
  x.scale(1.14, 1.14); // los rasgos, un pelo más grandes: se tienen que leer a 505 px
  x.translate(-W / 2, -150);
  const tinta = '#fffaf0';
  const cx = W / 2, ojoY = 104, sep = 70;
  const px = ox * 15, py = oy * 10;
  const hueco = (f: () => void) => {
    x.save();
    x.globalCompositeOperation = 'destination-out';
    x.shadowBlur = 0;
    f();
    x.restore();
  };
  x.fillStyle = tinta;
  x.strokeStyle = tinta;
  const ojo = (lado: number, forma: 'normal' | 'grande' | 'cerrado' | 'feliz' | 'medio' | 'susto') => {
    const ex = cx + lado * sep;
    if (forma === 'cerrado') {
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
      x.lineWidth = 8;
      x.beginPath();
      x.ellipse(ex, ojoY, 34, 40, 0, 0, Math.PI * 2);
      x.stroke();
      x.beginPath();
      x.arc(ex + px * 0.8, ojoY + py * 0.8, 11, 0, Math.PI * 2);
      x.fill();
      return;
    }
    const rx = forma === 'grande' ? 31 : 27, ry = forma === 'grande' ? 42 : 36;
    x.beginPath();
    x.ellipse(ex, ojoY, rx, ry, 0, 0, Math.PI * 2);
    x.fill();
    // la pupila: un hueco en el grabado (se ve el vidrio), con su brillo
    hueco(() => {
      x.beginPath();
      x.ellipse(ex + px, ojoY + py, rx * 0.58, ry * 0.6, 0, 0, Math.PI * 2);
      x.fill();
    });
    x.beginPath();
    x.arc(ex + px - rx * 0.22, ojoY + py - ry * 0.26, rx * 0.17, 0, Math.PI * 2);
    x.fill();
    if (forma === 'medio') {
      // el párpado a media asta: se borra la mitad de arriba y queda la raya
      hueco(() => x.fillRect(ex - rx - 8, ojoY - ry - 12, 2 * rx + 16, ry + 8));
      x.lineWidth = 9;
      x.beginPath();
      x.moveTo(ex - rx - 4, ojoY - 4);
      x.lineTo(ex + rx + 4, ojoY - 4);
      x.stroke();
    }
  };
  const cejas = (inc: number, alto: number, grosor = 12) => {
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
      x.lineWidth = 9;
      x.beginPath(); x.ellipse(cx, by, 22, 30, 0, 0, Math.PI * 2); x.stroke();
    } else if (forma === 'dientes') {
      x.beginPath(); x.roundRect(cx - 44, by - 18, 88, 36, 10); x.fill();
      hueco(() => {
        x.lineWidth = 6;
        x.beginPath(); x.moveTo(cx - 40, by); x.lineTo(cx + 40, by); x.stroke();
        for (const dx of [-22, 0, 22]) { x.beginPath(); x.moveTo(cx + dx, by - 15); x.lineTo(cx + dx, by + 15); x.stroke(); }
      });
    } else if (forma === 'grande') {
      x.beginPath(); x.moveTo(cx - 62, by - 26); x.quadraticCurveTo(cx, by - 30, cx + 62, by - 26); x.quadraticCurveTo(cx + 50, by + 48, cx, by + 48);
      x.quadraticCurveTo(cx - 50, by + 48, cx - 62, by - 26); x.fill();
      // la boca abierta: hueca por dentro, con la fila de dientes grabada
      hueco(() => { x.beginPath(); x.ellipse(cx, by + 16, 40, 22, 0, 0, Math.PI * 2); x.fill(); });
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
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const y = c.getContext('2d')!;
  y.filter = 'blur(4px) brightness(0)';
  y.globalAlpha = 0.3;
  y.drawImage(a, 0, 0);
  y.globalAlpha = 1;
  y.filter = 'drop-shadow(0 0 7px rgba(255,214,160,0.95))';
  y.drawImage(a, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  m = new THREE.MeshBasicMaterial({map: t, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(1.15, 1.08, 0.98)});
  CARAS.set(clave, m);
  return m;
};
const geoCaraPanel = (() => {
  let g: THREE.CylinderGeometry | null = null;
  return () => (g ??= new THREE.CylinderGeometry(M.cabeza.r + 2, M.cabeza.r + 2, 84, 40, 1, true, -1.3, 2.6));
})();

// ---------------------------------------------------------------- el muñeco
export const MunecoCristal: React.FC<{pose: Pose; calor: number}> = ({pose, calor}) => {
  const T = M.torso;
  const [bx, by, bz] = pose.base;
  const ambar = mat.ambar(), piernas = mat.piernas(), manos = mat.manos(), humo = mat.humo(), pelo = mat.pelo();
  void calor;
  const brazo = (lado: 1 | -1) => {
    const b = lado > 0 ? pose.izq : pose.der;
    return (
      <group key={lado} position={[lado * M.hombro.x, T.alto - M.hombro.abajo, 0]} rotation={[-b.alza, lado * b.giro, lado * b.abre, 'XZY']}>
        <mesh geometry={prisma(26, 26, 8, 6)} material={ambar} position={[0, -12, 0]} />
        <mesh geometry={prisma(23, M.brazo[0], 8, 4)} material={ambar} position={[0, -M.brazo[0], 0]} />
        <group position={[0, -M.brazo[0], 0]} rotation={[-b.codo, 0, 0]}>
          <mesh geometry={prisma(21.5, M.brazo[1], 8, 4)} material={ambar} position={[0, -M.brazo[1], 0]} />
          <mesh geometry={prisma(M.rMano, 30, 8, 7)} material={manos} position={[0, -M.brazo[1] - 24, 0]} />
        </group>
      </group>
    );
  };
  const pierna = (lado: 1 | -1) => (
    <group key={lado} position={[lado * M.pierna.x, M.cadera * 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* el muslo (el mismo ladrillo tumbado del de juguete, aquí tallado) */}
      <mesh geometry={tallada(STUD - 2, 2 * STUD - 2, ALTO * 0.8, 10)} material={piernas} position={[0, -M.pierna.muslo / 2 + 4, 0]} />
      <group position={[0, -M.pierna.muslo + 8, 0]} rotation={[Math.PI / 2 - pose.patada, 0, 0]}>
        <mesh geometry={tallada(STUD - 2, M.pierna.espinilla, STUD - 2, 10)} material={piernas} position={[0, -M.pierna.espinilla / 2, 0]} />
        <mesh geometry={tallada(STUD - 2, PLACA, 2 * STUD - 2, 6)} material={humo} position={[0, -M.pierna.espinilla - PLACA / 2 + 2, STUD * 0.45]} />
      </group>
    </group>
  );
  return (
    <group position={[bx, -by + pose.salto, bz]} rotation={[0, giroRaiz(pose), 0]} scale={[M.escala, M.escala, M.escala]}>
      <mesh geometry={tallada(2 * STUD - 2, M.cadera, STUD - 2, 6)} material={piernas} position={[0, M.cadera / 2, 0]} />
      {pierna(1)}
      {pierna(-1)}
      <group position={[0, M.cadera, 0]} rotation={[pose.inclina, 0, pose.ladea]}>
        <mesh geometry={tallada(T.an, T.alto, T.fondo, 12)} material={ambar} position={[0, T.alto / 2, 0]} />
        <mesh geometry={geoCuello()} material={blanco()} position={[0, T.alto + 1, T.fondo / 2 + 0.5]} />
        <mesh geometry={geoCorbata()} material={rojo()} position={[0, T.alto - 18, T.fondo / 2 + 1]} />
        <group position={[0, T.alto + M.cuello, 0]} rotation={[pose.cabeza.cabecea, pose.cabeza.gira, pose.cabeza.ladea, 'YXZ']}>
          <mesh geometry={prisma(26, M.cuello + 2, 10, 2)} material={manos} position={[0, -M.cuello - 1, 0]} />
          <mesh geometry={prisma(M.cabeza.r, M.cabeza.alto, 12, 8)} material={mat.cabeza()} />
          <mesh geometry={geoCaraPanel()} material={caraMat(pose.cara, pose.ojos)} position={[0, M.cabeza.alto / 2 + 2, 0]} renderOrder={5} />
          <mesh geometry={prisma(M.cabeza.r + 3, M.pelo, 12, 5)} material={pelo} position={[0, M.cabeza.alto - 4, 0]} />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, j], k) => (
            <mesh key={k} geometry={prisma(TETON.r, TETON.alto, 8, 2)} material={pelo} position={[(i * STUD) / 2, M.cabeza.alto - 4 + M.pelo, (j * STUD) / 2]} />
          ))}
          <mesh geometry={tallada(96, 18, 30, 6)} material={pelo} position={[-6, M.cabeza.alto - 2, M.cabeza.r - 10]} rotation={[0.25, 0, -0.06]} />
        </group>
        {brazo(1)}
        {brazo(-1)}
      </group>
    </group>
  );
};
