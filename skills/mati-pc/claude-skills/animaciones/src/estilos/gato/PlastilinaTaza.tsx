import React from 'react';
import * as THREE from 'three';
import {E, clamp, mix, p, rng} from '../../comun/curvas';
import {type V3, TESELA, arcilla, geoAro, geoBola, geoCapsula, geoFigura, mancha, orienta, relieve} from '../PlastilinaArcilla';
import {IMPACTO, MESA_Y, SUELO, T_CAE, T_SUELO, cafe, taza, trozos, vapor, type P} from './escena';
import {Capa, zSuelo} from './PlastilinaCocina';
import {tiembla} from './PlastilinaGato';

// 10 · PLASTILINA, LA TAZA: una taza roja de plastilina con lunares blancos, su asa y el café brillante dentro; el vapor
// de algodón. Cae girando a saltos de stop motion (también sobre su eje: el asa viene hacia la cámara), y al romperse: seis trozos
// gordos de plastilina que saltan, rebotan y se quedan de pie en el suelo, migas, el chorro y la corona de café hechos de plastilina
// marrón muy brillante, y el charco que se extiende con sus gotas. Todo sale de escena.ts (taza, trozos, cafe, vapor).

export const COL_TAZA = {taza: '#D8392F', lunar: '#FFF6EA', dentro: '#F6EADB', cafe: '#6A3613', crema: '#9A5E33'};

// ---------------------------------------------------------------- piezas de torno (la taza): perfil (radio, altura) que gira
const tornos = new Map<string, THREE.BufferGeometry>();
const geoTorno = (perfil: [number, number][], clave: string, seg = 44): THREE.BufferGeometry => {
  let geo = tornos.get(clave);
  if (geo) return geo;
  geo = new THREE.LatheGeometry(perfil.map(([x, y]) => new THREE.Vector2(x, y)), seg, Math.PI, Math.PI * 2); // la costura, detrás
  const arco: number[] = [0];
  for (let j = 1; j < perfil.length; j++) arco.push(arco[j - 1] + Math.hypot(perfil[j][0] - perfil[j - 1][0], perfil[j][1] - perfil[j - 1][1]));
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i <= seg; i++) for (let j = 0; j < perfil.length; j++) {
    uv.setXY(i * perfil.length + j, ((i / seg) * 2 * Math.PI * 52) / TESELA, arco[j] / TESELA);
  }
  tornos.set(clave, geo);
  return geo;
};
const arco = (cx: number, cy: number, r: number, a0: number, a1: number, n: number): [number, number][] =>
  Array.from({length: n + 1}, (_, i) => {
    const a = mix(a0, a1, i / n);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
const H = Math.PI / 2;
const FUERA: [number, number][] = [[0, -59], [30, -59], ...arco(38, -45, 14, -H, 0, 6).slice(1), [52, 0], [52, 54], ...arco(48.75, 55.5, 3.25, 0, H, 4).slice(1)];
const DENTRO: [number, number][] = [...arco(48.75, 55.5, 3.25, H, Math.PI, 4), [45.5, -36], ...arco(37.5, -36, 8, 0, -H, 4).slice(1), [0, -44]];
// los lunares: [ángulo alrededor (desde el asa hacia la cámara), altura]
const LUNARES: [number, number][] = [[30, 26], [75, 30], [120, 24], [165, 28], [8, -20], [52, -24], [97, -18], [142, -22], [-25, 2], [205, 0]];

const Taza3D: React.FC<{c: P; ang: number; giro: number; conCafe: boolean; mats: Record<string, THREE.Material>}> = ({c, ang, giro, conCafe, mats}) => (
  <group position={[c[0], -c[1], 0]} rotation={[0, 0, -ang]}>
    <group rotation={[0, giro, 0]}>
      <mesh geometry={geoTorno(FUERA, 'taza-fuera')} material={mats.taza} castShadow receiveShadow />
      <mesh geometry={geoTorno(DENTRO, 'taza-dentro')} material={mats.dentro} castShadow receiveShadow />
      <mesh geometry={geoAro(27, 9, Math.PI)} material={mats.taza} position={[52, 3, 0]} rotation={[0, 0, -H]} castShadow receiveShadow />
      {LUNARES.map(([a, h], i) => {
        const th = (a * Math.PI) / 180;
        return (
          <mesh key={i} geometry={geoBola(8.5, 500 + i, 0.2)} material={mats.lunar} position={[52.5 * Math.cos(th), h, 52.5 * Math.sin(th)]}
            rotation={[0, -th, 0]} scale={[0.3, 1, 1]} />
        );
      })}
      {conCafe && (
        <group position={[0, 41, 0]} rotation={[-H, 0, 0]}>
          <mesh material={mats.cafe}>
            <circleGeometry args={[45, 40]} />
          </mesh>
          <mesh geometry={geoAro(41, 3.2)} material={mats.crema} position={[0, 0, 0.5]} />
        </group>
      )}
    </group>
  </group>
);

// ---------------------------------------------------------------- el vapor de algodón
const algodones = new Map<number, THREE.MeshStandardMaterial>();
const algodon = (op: number, dpr: number) => {
  const k = Math.round(op * 20);
  let m = algodones.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({color: '#FFFFFF', roughness: 1, transparent: true, opacity: k / 20, depthWrite: false, bumpMap: relieve()});
    algodones.set(k, m);
  }
  m.bumpScale = 9 * dpr;
  return m;
};
const Vapor3D: React.FC<{tq: number; paso: number; dpr: number}> = ({tq, paso, dpr}) => (
  <group>
    {vapor(tq).map((h, i) =>
      [1, 4, 7, 10, 13].map((jj, k) => {
        const q = h.pts[Math.min(jj, h.pts.length - 1)];
        const q2 = h.pts[Math.min(jj + 2, h.pts.length - 1)];
        const r = rng(paso * 97 + i * 13 + k);
        const rad = mix(15, 7, k / 4) * (0.9 + r() * 0.2);
        const op = h.alfa * (0.72 - k * 0.1);
        if (op < 0.05) return null;
        const m = algodon(op, dpr);
        // una hebra de algodón estirada a lo largo de por donde sube (deshilachada por el relieve)
        const ang = Math.atan2(q2[0] - q[0], -(q2[1] - q[1]) || -1);
        return (
          <group key={`${i}-${k}`} position={[q[0] + (r() - 0.5) * 3, -q[1] + (r() - 0.5) * 3, 4]} rotation={[0, 0, -ang + (r() - 0.5) * 0.3]}>
            <mesh geometry={geoBola(rad, 600 + (k % 3), 0.8)} material={m} scale={[0.85, 2.1, 0.8]} />
            <mesh geometry={geoBola(rad * 0.7, 610 + (k % 3), 0.6)} material={m} position={[rad * 0.55 * (k % 2 ? 1 : -1), rad * 0.9, 2]} scale={[0.8, 1.6, 0.8]} />
          </group>
        );
      }),
    )}
  </group>
);

// ---------------------------------------------------------------- los trozos: su forma (constante) y dónde se quedan
const FORMAS = (() => {
  const tr = trozos(T_SUELO + 0.001);
  return tr.map((q) => q.pts.map(([x, y]): [number, number] => {
    const dx = x - q.c[0], dy = y - q.c[1];
    const a = -q.ang;
    return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
  }));
})();
// un lunar o dos en cada trozo, donde caben
const dentro = (pt: [number, number], poly: [number, number][]) => {
  let s = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) s = !s;
  }
  return s;
};
const LUNARES_TROZO = FORMAS.map((f, n) => {
  const r = rng(700 + n);
  const out: [number, number][] = [];
  for (let k = 0; k < 30 && out.length < (n === 5 ? 0 : 2); k++) {
    const q: [number, number] = [(r() - 0.5) * 60, (r() - 0.5) * 50];
    const lejos = out.every((o) => Math.hypot(o[0] - q[0], o[1] - q[1]) > 26);
    const borde = [[9, 0], [-9, 0], [0, 9], [0, -9]].every(([dx, dy]) => dentro([q[0] + dx, q[1] + dy], f));
    if (lejos && borde) out.push(q);
  }
  return out;
});

// EL SALTO DE LOS TROZOS. Salen de donde los suelta escena.ts y en su misma dirección, pero con más fuerza (en la escena saltan
// ~70 px, y en una tarjeta pequeña no se lee): suben hasta ~250 px girando, botan dos veces como plastilina, resbalan un poco y se
// quedan tumbados sobre su lado más largo. Hacia la derecha, menos, para que no se salgan del cuadro.
const G_TROZO = 6500;
const APLASTA = 1 / 12 - 0.01; // lo que dura la postura del aplastón
type Fis = {p0: P; v: P; w: number; a0: number; piso: number; rho: number; estables: number[]};
const FIS: Fis[] = (() => {
  const a = trozos(T_SUELO), b = trozos(T_SUELO + 0.002), reposo = trozos(5.95);
  return a.map((q, n) => {
    const forma = FORMAS[n];
    let vx = (b[n].c[0] - q.c[0]) / 0.002, vy = (b[n].c[1] - q.c[1]) / 0.002;
    vx *= vx < 0 ? 2.0 : 0.9;
    vy *= 1.75;
    const w = ((b[n].ang - q.ang) / 0.002) * 1.3;
    const rho = Math.max(...forma.map(([x, y]) => Math.hypot(x, y))) * 0.6;
    // los ángulos en los que queda apoyado en uno de sus lados largos (el lado abajo y en horizontal)
    const lados = forma.map((pt, i) => {
      const q2 = forma[(i + 1) % forma.length];
      const L = Math.hypot(q2[0] - pt[0], q2[1] - pt[1]);
      let nx = (q2[1] - pt[1]) / L, ny = -(q2[0] - pt[0]) / L;
      const m: [number, number] = [(pt[0] + q2[0]) / 2 + nx * 3, (pt[1] + q2[1]) / 2 + ny * 3];
      if (dentro(m, forma)) { nx = -nx; ny = -ny; }
      return {L, a: Math.PI / 2 - Math.atan2(ny, nx)};
    });
    const Lmax = Math.max(...lados.map((l) => l.L));
    return {p0: q.c, v: [vx, vy] as P, w, a0: q.ang, piso: reposo[n].c[1] + 8, rho, estables: lados.filter((l) => l.L > 0.55 * Lmax).map((l) => l.a)};
  });
})();
const salto = (f: Fis, tau: number): {c: P; ang: number; quieto: number} => {
  const G = G_TROZO;
  const yl = f.piso - f.rho;
  const y0 = Math.min(f.p0[1], yl - 1);
  const t1 = (-f.v[1] + Math.sqrt(f.v[1] ** 2 + 2 * G * (yl - y0))) / G;
  if (tau < t1) return {c: [f.p0[0] + f.v[0] * tau, y0 + f.v[1] * tau + 0.5 * G * tau * tau], ang: f.a0 + f.w * tau, quieto: 0};
  let x = f.p0[0] + f.v[0] * t1, ang = f.a0 + f.w * t1, vx = f.v[0] * 0.6, w = f.w * 0.55, s = tau - t1;
  let vb = -0.42 * (f.v[1] + G * t1);
  for (let bote = 0; bote < 2; bote++) {
    const tb = (-2 * vb) / G;
    if (s < tb) return {c: [x + vx * s, yl + vb * s + 0.5 * G * s * s], ang: ang + w * s, quieto: 0};
    x += vx * tb;
    ang += w * tb;
    s -= tb;
    vb *= 0.35;
    vx *= 0.6;
    w *= 0.5;
  }
  const DUR_R = 0.16;
  const u = Math.min(s, DUR_R);
  const k = E.outCubic(u / DUR_R);
  let meta = ang, mejor = Infinity;
  for (const a of f.estables) {
    const c = a + 2 * Math.PI * Math.round((ang - a) / (2 * Math.PI));
    if (Math.abs(c - ang) < mejor) { mejor = Math.abs(c - ang); meta = c; }
  }
  return {c: [x + vx * u * (1 - u / (2 * DUR_R)), yl], ang: mix(ang, meta, k), quieto: k};
};

const Trozos3D: React.FC<{tq: number; paso: number; mats: Record<string, THREE.Material>}> = ({tq, paso, mats}) => {
  // en la primera postura del golpe la taza se aplasta entera (TazaArcilla); los trozos salen en la siguiente
  if (tq < T_SUELO + APLASTA) return null;
  const tau = tq - T_SUELO - APLASTA + 0.04;
  return (
    <group>
      {FIS.map((f, n) => {
        const q = salto(f, tau);
        const z = zSuelo(f.piso);
        // su punto más bajo: nunca dentro del suelo, y al pararse, apoyado en él
        const bajo = Math.max(...FORMAS[n].map(([x, y]) => q.c[1] + x * Math.sin(q.ang) + y * Math.cos(q.ang)));
        const dy = Math.min(0, f.piso - 1 - bajo) + q.quieto * Math.max(0, f.piso - 1 - bajo);
        const j = tiembla(paso, 70 + n, 0.8);
        const vuela = 1 - q.quieto;
        // da vueltas en el aire (así se ve el crema de dentro) y se queda un poco inclinado
        const tumbo = 0.25 + 1.3 * vuela * Math.sin(n * 2.1 + tau * 17);
        const giroY = 0.9 * vuela * Math.cos(n * 1.3 + tau * 11) + (n % 2 ? 0.25 : -0.25);
        return (
          <Capa key={n} z={z}>
            <group position={[q.c[0] + j[0], -(q.c[1] + dy) + j[1], 0]} rotation={[tumbo, giroY, -q.ang]}>
              {/* un trozo de taza: fino, rojo por fuera (con su lunar) y crema por dentro, que se ve cuando da vueltas */}
              <mesh geometry={geoFigura(FORMAS[n], n === 5 ? 16 : 11, n === 5 ? 5 : 3.5, `trozo-${n}`)} material={mats.taza} position={[0, 0, 4]} castShadow receiveShadow />
              {n !== 5 && <mesh geometry={geoFigura(FORMAS[n], 9, 3, `trozo-${n}`)} material={mats.dentro} position={[0, 0, -5]} scale={[0.97, 0.97, 1]} castShadow receiveShadow />}
              {LUNARES_TROZO[n].slice(0, 1).map(([lx, ly], k) => (
                <mesh key={k} geometry={geoBola(8, 520 + k, 0.2)} material={mats.lunar} position={[lx, -ly, 9.5]} scale={[1, 1, 0.3]} />
              ))}
            </group>
            <mesh position={[q.c[0] + 8, -f.piso + 0.6, 0]} rotation={[-H, 0, 0]} scale={[110, 50, 1]} renderOrder={2}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial map={mancha()} color="#2a1206" transparent opacity={0.45 * clamp(1 - (f.piso - q.c[1] - f.rho) / 160)} depthWrite={false} toneMapped={false} />
            </mesh>
          </Capa>
        );
      })}
    </group>
  );
};

// ---------------------------------------------------------------- las migas que saltan al romperse
const G_MIGA = 6200;
const MIGAS = (() => {
  const r = rng(91);
  return Array.from({length: 20}, (_, i) => ({
    v: [(r() - 0.5) * 1400 - 150, -(500 + r() * 950)] as P, rad: 4 + r() * 7, prof: -4 + r() * 24, blanca: i % 4 === 2, dx: (r() - 0.5) * 50,
  }));
})();
const Migas: React.FC<{tq: number; mats: Record<string, THREE.Material>}> = ({tq, mats}) => {
  if (tq < T_SUELO) return null;
  const tau = tq - T_SUELO;
  return (
    <group>
      {MIGAS.map((m, i) => {
        const y0 = SUELO - 34, x0 = IMPACTO[0] + m.dx, piso = SUELO + m.prof - m.rad * 0.6;
        const t1 = (-m.v[1] + Math.sqrt(m.v[1] ** 2 + 2 * G_MIGA * (piso - y0))) / G_MIGA;
        let c: P;
        if (tau < t1) c = [x0 + m.v[0] * tau, y0 + m.v[1] * tau + 0.5 * G_MIGA * tau * tau];
        else {
          const vy1 = -0.3 * (m.v[1] + G_MIGA * t1), vx1 = 0.4 * m.v[0], x1 = x0 + m.v[0] * t1;
          const t2 = (-2 * vy1) / G_MIGA, s = tau - t1;
          c = s < t2 ? [x1 + vx1 * s, piso + vy1 * s + 0.5 * G_MIGA * s * s] : [x1 + vx1 * t2, piso];
        }
        return (
          <Capa key={i} z={zSuelo(SUELO + m.prof)}>
            <mesh geometry={geoBola(m.rad, 540 + i, 0.4)} material={m.blanca ? mats.lunar : mats.taza} position={[c[0], -c[1], 0]} scale={[1.2, 0.8, 1]} castShadow />
          </Capa>
        );
      })}
    </group>
  );
};

// ---------------------------------------------------------------- el café: chorro y corona de gotas, manchas y el charco
const charcos = new Map<string, THREE.BufferGeometry>();
const geoCharco = (): THREE.BufferGeometry => {
  let g = charcos.get('c');
  if (g) return g;
  const sh = new THREE.Shape();
  const n = 56;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const R = 1 + 0.1 * Math.sin(3 * a + 0.7) + 0.07 * Math.sin(5 * a + 2.1) + 0.05 * Math.sin(8 * a + 1.3);
    const x = 160 * R * Math.cos(a), y = 100 * R * Math.sin(a);
    if (i === 0) sh.moveTo(x, y);
    else sh.lineTo(x, y);
  }
  g = new THREE.ExtrudeGeometry(sh, {depth: 2, bevelEnabled: true, bevelThickness: 5, bevelSize: 7, bevelSegments: 4, curveSegments: 8});
  g.translate(0, 0, 5);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / TESELA, uv.getY(i) / TESELA);
  g.computeVertexNormals();
  charcos.set('c', g);
  return g;
};

const Cafe3D: React.FC<{tq: number; mats: Record<string, THREE.Material>}> = ({tq, mats}) => {
  const cf = cafe(tq);
  const sig = new Map(cafe(tq + 0.012).gotas.map((d) => [d.i, d.c]));
  // el chorro como un líquido de plastilina: las gotas seguidas se juntan en un tubo liso (suavizado, sin zigzag) que adelgaza, y
  // donde se separan quedan gotas sueltas
  const chorro = cf.gotas.filter((d) => d.i < 100).sort((a, b) => a.i - b.i);
  const grupos: (typeof chorro)[] = [];
  chorro.forEach((d, k) => {
    if (k === 0 || Math.hypot(d.c[0] - chorro[k - 1].c[0], d.c[1] - chorro[k - 1].c[1]) > 46) grupos.push([]);
    grupos[grupos.length - 1].push(d);
  });
  const tramos: React.ReactNode[] = [];
  const sueltas = new Set<number>();
  grupos.forEach((gr, gi) => {
    if (gr.length < 3) { gr.forEach((d) => sueltas.add(d.i)); return; }
    const rIni = Math.max(...gr.map((d) => d.r)), rFin = Math.min(...gr.map((d) => d.r));
    const lis = gr.map((_, k) => {
      const v = gr.slice(Math.max(0, k - 2), k + 3);
      // grueso donde sale de la taza (las últimas gotas) y fino en la punta: sin bultos de oruga
      return {c: [v.reduce((s2, d) => s2 + d.c[0], 0) / v.length, v.reduce((s2, d) => s2 + d.c[1], 0) / v.length] as P, r: mix(rFin, rIni, k / (gr.length - 1))};
    });
    for (let k = 1; k < lis.length; k++) {
      const a2 = lis[k - 1], b2 = lis[k];
      tramos.push(<CapCafe key={`t${gi}-${k}`} a={[a2.c[0], -a2.c[1], 0]} b={[b2.c[0], -b2.c[1], 0]} ra={a2.r * 0.66} rb={b2.r * 0.66} mat={mats.cafe} />);
    }
    sueltas.add(gr[0].i);
    sueltas.add(gr[gr.length - 1].i);
  });
  const zc = zSuelo(SUELO + 6);
  return (
    <group>
      {tramos}
      {cf.gotas.filter((d) => d.i >= 100 || sueltas.has(d.i)).map((d) => {
        const n = sig.get(d.i);
        const v: V3 = n ? [(n[0] - d.c[0]) / 0.012, -(n[1] - d.c[1]) / 0.012, 0] : [0, -1, 0];
        const vel = Math.hypot(v[0], v[1]);
        const {quat} = orienta([0, 0, 0], vel > 1 ? v : [0, 1, 0]);
        const k = Math.min(0.9, vel / 1500);
        const rr = d.i >= 100 ? d.r * 1.6 : d.r * 1.12; // la corona del golpe, más gorda para que se lea
        return (
          <mesh key={d.i} geometry={geoBola(10, 560 + (d.i % 7), 0.2)} material={mats.cafe} position={[d.c[0], -d.c[1], 0]} quaternion={quat}
            scale={[(rr / 10) * (1 - 0.25 * k), (rr / 10) * (1 + k), (rr / 10) * (1 - 0.25 * k)]} castShadow />
        );
      })}
      {cf.manchas.map((s) => (
        <Capa key={`m${s.i}`} z={zSuelo(s.c[1])}>
          <mesh geometry={geoBola(10, 580 + (s.i % 5), 0.2)} material={mats.cafe} position={[s.c[0], -s.c[1] + 1, 0]}
            scale={[s.rx / 10, 0.32, (s.rx * 0.7) / 10]} />
        </Capa>
      ))}
      {cf.charco && (
        <Capa z={zc}>
          <group position={[cf.charco.c[0], -cf.charco.c[1], 0]} rotation={[-H, 0, 0]}>
            <mesh geometry={geoCharco()} material={mats.cafe} scale={[cf.charco.rx / 160, (cf.charco.rx * 0.6) / 100, 1]} receiveShadow />
          </group>
        </Capa>
      )}
    </group>
  );
};
const CapCafe: React.FC<{a: V3; b: V3; ra: number; rb: number; mat: THREE.Material}> = ({a, b, ra, rb, mat}) => {
  const {L, quat} = orienta(a, b);
  return <mesh geometry={geoCapsula(Math.max(1, Math.round(L)), +ra.toFixed(1), +rb.toFixed(1), 590, 0.2)} material={mat} position={a} quaternion={quat} castShadow />;
};

// ---------------------------------------------------------------- todo lo de la taza
// el café: plastilina marrón con barniz (como el líquido del stop motion): muy brillante, sin terciopelo ni relieve
let cafeHecho: THREE.MeshPhysicalMaterial | null = null;
const cafeMat = () =>
  (cafeHecho ??= new THREE.MeshPhysicalMaterial({
    color: COL_TAZA.cafe, roughness: 0.1, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, specularIntensity: 1, sheen: 0,
  }));
const matsTaza = () => ({
  taza: arcilla(COL_TAZA.taza, {rough: 0.38, brillo: 0.4}), lunar: arcilla(COL_TAZA.lunar, {rough: 0.45, brillo: 0.3}),
  dentro: arcilla(COL_TAZA.dentro, {rough: 0.5, brillo: 0.2}),
  cafe: cafeMat(), crema: arcilla(COL_TAZA.crema, {rough: 0.35, brillo: 0.6, bump: 0.3}),
});
// lo que brilla (para los reflejos del estudio): [material, cuánto refleja]
export const brillantesTaza = (): [THREE.MeshPhysicalMaterial, number][] => {
  const m = matsTaza();
  return [[m.cafe, 1.1], [m.crema, 0.6], [m.taza, 0.45], [m.lunar, 0.3]];
};

export const TazaArcilla: React.FC<{tq: number; paso: number; dpr: number}> = ({tq, paso, dpr}) => {
  const mats: Record<string, THREE.Material> = matsTaza();
  const tz = taza(tq);
  const antes = taza(Math.max(0, tq - 1 / 12));
  const quieta = Math.hypot(tz.c[0] - antes.c[0], tz.c[1] - antes.c[1]) < 0.5 && tz.estado === 'mesa';
  const j = quieta ? ([0, 0, 0] as V3) : tiembla(paso, 60, 0.9);
  // en el aire también gira sobre su eje: el asa viene hacia la cámara
  const giro = tq > T_CAE ? -0.95 * E.inOutCubic(p(tq, T_CAE, T_SUELO - T_CAE)) : 0;
  // la sombra que crece en el suelo mientras cae, y la de la mesa mientras está encima
  // el golpe: una postura con la taza aplastada contra el suelo, como plastilina, antes de saltar en trozos
  const aplastada = tq >= T_SUELO && tq < T_SUELO + APLASTA;
  const tzA = taza(T_SUELO - 1e-4);
  const kCae = tz.estado === 'cae' ? clamp((tz.c[1] - MESA_Y) / (SUELO - MESA_Y - 60)) : 0;
  return (
    <group dispose={null}>
      {tz.estado !== 'suelo' && <Taza3D c={[tz.c[0] + j[0], tz.c[1] + j[1]]} ang={tz.ang + j[2]} giro={giro} conCafe={tq < 2.76} mats={mats} />}
      {aplastada && (
        <group position={[tzA.c[0], -(SUELO - 2), 0]} scale={[1.28, 0.64, 1.2]}>
          <Taza3D c={[0, tzA.c[1] - (SUELO - 2)]} ang={tzA.ang} giro={-0.95} conCafe={false} mats={mats} />
        </group>
      )}
      {tz.estado === 'mesa' && (
        <mesh position={[tz.c[0] + 12, -MESA_Y + 0.7, 0]} rotation={[-H, 0, 0]} scale={[170, 120, 1]} renderOrder={2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={mancha()} color="#2a1206" transparent opacity={0.55} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {kCae > 0 && (
        <mesh position={[tz.c[0] + 20, -SUELO + 0.7, 0]} rotation={[-H, 0, 0]} scale={[mix(260, 150, kCae), mix(150, 90, kCae), 1]} renderOrder={2}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={mancha()} color="#2a1206" transparent opacity={0.15 + 0.4 * kCae} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      <Trozos3D tq={tq} paso={paso} mats={mats} />
      <Migas tq={tq} mats={mats} />
      <Cafe3D tq={tq} mats={mats} />
      <Vapor3D tq={tq} paso={paso} dpr={dpr} />
    </group>
  );
};
