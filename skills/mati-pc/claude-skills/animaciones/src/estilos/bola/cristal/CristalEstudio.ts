import * as THREE from 'three';
import {Reflector} from 'three/examples/jsm/objects/Reflector.js';
import {CAM_Y, D, MURO_X, SUELO} from '../escena';

// CRISTAL, EL ESTUDIO (algunos sombreadores, adaptados de código con licencia MIT: ver AVISOS.md).
// Lo que hace que el vidrio se vea vidrio: el vidrio no tiene color propio, enseña lo que tiene detrás y lo que se refleja en él.
//   · los reflejos salen de un estudio de tiras de luz (no de una foto de un cuarto, que ensucia el vidrio de ventanas): dos tiras altas
//     detrás a los lados (dibujan el contorno), una caja de luz arriba, una tira larga al fondo (el horizonte), una carta débil delante
//     y EL BARRIDO, una tira que pasa por delante en cada golpe (su brillo recorre cada canto). Se hornea en un PMREM en cada cuadro.
//   · detrás, el fondo del estudio: casi negro, con un resplandor gris en el centro, dos cajas de luz desenfocadas de pie (lo que el
//     vidrio dobla y lo que el suelo refleja) y el horizonte encendido justo detrás de la papelera.
//   · el suelo, negro brillante: un espejo desenfocado de verdad (Reflector), el charco de la luz principal, las sombras de color de
//     cada pieza de vidrio con sus cáusticas (falsas, pero con su anillo de lente y la dispersión en tres colores), la sombra opaca
//     de la bola y los anillos de luz que deja cada bote.
// Todo en px de la escena, con la y del mundo hacia arriba (y = −la de la pantalla) y z hacia la cámara.

// ---------------------------------------------------------------- los vidrios
export type OpVidrio = {
  color: string; // el tinte de lo que pasa a través
  atenua?: string; // el color que toma con el grosor
  dist?: number; // a qué distancia (px) lo toma
  grosor?: number; // px: cuánto dobla lo de detrás
  rugoso?: number; // 0,02 = transparente; ~0,3 = esmerilado
  ior?: number;
  disp?: number; // dispersión: los bordes de arcoíris
  irid?: number; // iridiscencia en los cantos
  env?: number; // fuerza de los reflejos del estudio
  trans?: number;
  emite?: string;
  brillo?: number;
  capa?: number; // barniz (un segundo reflejo nítido)
  facetas?: boolean; // tallado: cada cara plana con su brillo (cristal cortado), en vez de liso como un caramelo
};
const vidrios = new Map<string, THREE.MeshPhysicalMaterial>();
// cada vidrio con su nombre: se pide por el nombre y se anima por el nombre (el rojo de la papelera se enciende en su golpe)
export const vidrio = (nombre: string, o?: OpVidrio): THREE.MeshPhysicalMaterial => {
  let m = vidrios.get(nombre);
  if (m) return m;
  if (!o) throw new Error(`el vidrio «${nombre}» no existe todavía`);
  m = new THREE.MeshPhysicalMaterial({
    color: o.color, metalness: 0, roughness: o.rugoso ?? 0.02, transmission: o.trans ?? 1, thickness: o.grosor ?? 40, ior: o.ior ?? 1.5,
    dispersion: o.disp ?? 4, attenuationColor: new THREE.Color(o.atenua ?? '#ffffff'), attenuationDistance: o.dist ?? 400,
    specularIntensity: 1, specularColor: new THREE.Color('#ffffff'), envMapIntensity: o.env ?? 1.3,
    iridescence: o.irid ?? 0.35, iridescenceIOR: 1.32, iridescenceThicknessRange: [180, 560],
    clearcoat: o.capa ?? 0.4, clearcoatRoughness: 0.03, side: THREE.DoubleSide, flatShading: o.facetas ?? false,
  });
  if (o.emite) {
    m.emissive = new THREE.Color(o.emite);
    m.emissiveIntensity = o.brillo ?? 0;
  }
  // el vidrio de verdad es más grueso de lado que de frente: en los cantos la luz cruza más vidrio, se tiñe más y se dobla más
  // (por eso un vaso de color es claro en el centro y oscuro en los bordes). three usa un grosor fijo: aquí crece con el ángulo.
  // Y el vidrio es opaco en el lienzo (alfa 1): el lienzo nítido es transparente donde va el fondo (el fondo va en otro lienzo,
  // desenfocado, detrás), y three daría al vidrio un alfa a medias que dejaría ver el fondo dos veces.
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <transmission_fragment>', THREE.ShaderChunk.transmission_fragment.replace('material.thickness = thickness;',
        'material.thickness = thickness * ( 0.4 + 2.4 * pow( 1. - abs( dot( normal, normalize( vViewPosition ) ) ), 2. ) );'))
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n\tgl_FragColor.a = 1.0;');
  };
  m.customProgramCacheKey = () => 'vidrio-cantos';
  vidrios.set(nombre, m);
  return m;
};

// el metal cromado (la base de la silla, las patas de la mesa, el cable de la lámpara): en un estudio negro, un espejo de tiras
const metales = new Map<string, THREE.MeshPhysicalMaterial>();
export const cromo = (color = '#e9edf2', rugoso = 0.16) => {
  const k = color + rugoso;
  let m = metales.get(k);
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({color, metalness: 1, roughness: rugoso, envMapIntensity: 1.25});
    metales.set(k, m);
  }
  return m;
};

// ---------------------------------------------------------------- el estudio de tiras (para los reflejos)
export type Estudio = {escena: THREE.Scene; coloca: (o: {barrido: number; xBarrido: number; giro: number; calor: number}) => void};
export const creaEstudio = (): Estudio => {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color('#000000');
  const raiz = new THREE.Group();
  escena.add(raiz);
  const tira = (w: number, h: number, col: string, fuerza: number) => {
    const mat = new THREE.MeshBasicMaterial({color: new THREE.Color(col).multiplyScalar(fuerza), side: THREE.DoubleSide});
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    raiz.add(m);
    return m;
  };
  const mira = (m: THREE.Mesh, p: [number, number, number]) => {
    m.position.set(...p);
    m.lookAt(0, 0, 0);
  };
  // la cámara mira hacia −z: lo de −z es lo de detrás del vidrio (sus contornos), lo de +z es lo de delante (sus caras)
  const izq = tira(30, 230, '#eef4ff', 5.5);
  const der = tira(30, 230, '#fff5ea', 5);
  const techo = tira(170, 80, '#ffffff', 1.5);
  const horizonte = tira(280, 14, '#e6eeff', 1.6);
  const frente = tira(160, 40, '#ffffff', 0.16);
  const calida = tira(90, 120, '#ffb46a', 0.5); // una carta cálida baja a la izquierda: el ámbar del muñeco
  const barrido = tira(26, 260, '#ffffff', 1);
  mira(izq, [-150, 30, -70]);
  mira(der, [155, 40, -60]);
  mira(techo, [0, 175, 15]);
  mira(horizonte, [0, 18, -190]);
  mira(frente, [0, 10, 175]);
  mira(calida, [-130, -40, 90]);
  const colBarrido = new THREE.Color('#ffffff');
  const colCalida = new THREE.Color('#ffb46a');
  return {
    escena,
    coloca: ({barrido: b, xBarrido, giro, calor}) => {
      // todo el kit gira despacio alrededor del objeto (la cámara que nunca está quieta, hecha con la luz)
      raiz.rotation.y = giro;
      (calida.material as THREE.MeshBasicMaterial).color.copy(colCalida).multiplyScalar(0.5 + calor);
      barrido.visible = b > 0.001;
      if (barrido.visible) {
        // la tira pasa por un arco DETRÁS de la cámara (en +z): su brillo cruza las caras de delante de cada vidrio
        const a = xBarrido * 1.35;
        barrido.position.set(Math.sin(a) * 170, 30, Math.cos(a) * 170);
        barrido.lookAt(0, 0, 0);
        barrido.rotateZ(0.18);
        (barrido.material as THREE.MeshBasicMaterial).color.copy(colBarrido).multiplyScalar(4.5 * b);
      }
    },
  };
};

// ---------------------------------------------------------------- el fondo del estudio (un plano pintado, en el lienzo nítido)
// Se pinta en coordenadas de la pantalla y el plano se pone a la distancia justa para que salga 1:1: así el resplandor queda detrás
// de la papelera y las cajas de luz donde se decide aquí, sin cuentas a ojo.
export const Z_FONDO = -1100;
const S_FONDO = D / (D - Z_FONDO);
const BORDE = 140; // lo que sobra por cada lado (el empujón y el acercamiento de la cámara)
export const HORIZONTE_Y = CAM_Y + (SUELO - CAM_Y) * S_FONDO; // donde el suelo toca el fondo, en la pantalla
// de un punto de la pantalla a su sitio en el plano del fondo (en el mundo)
const enFondo = (sx: number, sy: number): [number, number, number] => [540 + (sx - 540) / S_FONDO, -(CAM_Y + (sy - CAM_Y) / S_FONDO), Z_FONDO];
export const planoFondo = () => {
  const [x0, y0] = enFondo(-BORDE, -BORDE);
  const [x1, y1] = enFondo(1080 + BORDE, 1920 + BORDE);
  return {centro: [(x0 + x1) / 2, (y0 + y1) / 2, Z_FONDO] as [number, number, number], ancho: x1 - x0, alto: y0 - y1};
};
let FONDO: THREE.CanvasTexture | null = null;
export const texturaFondo = () => {
  if (FONDO) return FONDO;
  const k = 0.5; // el lienzo, a media resolución (todo es suave)
  const W = 1080 + 2 * BORDE, H = 1920 + 2 * BORDE;
  const c = document.createElement('canvas');
  c.width = Math.round(W * k);
  c.height = Math.round(H * k);
  const x = c.getContext('2d')!;
  x.scale(k, k);
  x.translate(BORDE, BORDE);
  x.fillStyle = '#020306';
  x.fillRect(-BORDE, -BORDE, W, H);
  // el resplandor gris del estudio, detrás de la papelera (separa los cantos del negro)
  const g = x.createRadialGradient(600, 1260, 0, 600, 1260, 900);
  g.addColorStop(0, 'rgba(36,38,50,1)');
  g.addColorStop(0.45, 'rgba(11,12,17,1)');
  g.addColorStop(1, 'rgba(1,1,3,1)');
  x.fillStyle = g;
  x.fillRect(-BORDE, -BORDE, W, H);
  // dos cajas de luz de pie, desenfocadas: fría detrás de la mesa, cálida a la derecha
  const caja = (cx: number, col: string, fuerza: number, y0 = 140) => {
    x.save();
    x.filter = 'blur(30px)';
    x.globalAlpha = fuerza * 0.6;
    x.fillStyle = col;
    x.fillRect(cx - 50, y0, 100, HORIZONTE_Y + 120 - y0);
    x.filter = 'blur(7px)';
    x.globalAlpha = fuerza;
    x.fillRect(cx - 14, y0 + 30, 28, HORIZONTE_Y + 100 - y0 - 30);
    x.restore();
  };
  caja(96, '#c9dcff', 0.45, 760); // la de la izquierda, debajo de la ventana
  caja(985, '#ffdcc0', 0.45);
  // la luz de fondo detrás del muñeco (la del fotógrafo para separar al protagonista): su vidrio la dobla y se ve vidrio, no un hueco negro
  const m = x.createRadialGradient(280, 1150, 0, 280, 1150, 320);
  m.addColorStop(0, 'rgba(205,190,175,0.95)');
  m.addColorStop(0.45, 'rgba(120,110,104,0.5)');
  m.addColorStop(1, 'rgba(40,40,48,0)');
  x.fillStyle = m;
  x.fillRect(-60, 800, 700, 700);
  // la tira de detrás de la papelera: el vidrio rojo la dobla en cada estría (y el suelo la refleja detrás de su base)
  x.save();
  x.filter = 'blur(34px)';
  x.globalAlpha = 0.4;
  x.fillStyle = '#ffe9e0';
  x.fillRect(700 - 70, 260, 140, HORIZONTE_Y + 200 - 260);
  x.filter = 'blur(8px)';
  x.globalAlpha = 0.85;
  x.fillRect(700 - 16, 300, 32, HORIZONTE_Y + 160 - 300);
  x.restore();
  // el horizonte encendido: la tira larga del fondo, justo donde lo corta el suelo
  x.save();
  x.filter = 'blur(22px)';
  // con el pico JUSTO en la línea del suelo y bajando por debajo igual que por encima: el suelo, al fondo, se funde con esta textura
  const h = x.createLinearGradient(0, HORIZONTE_Y - 220, 0, HORIZONTE_Y + 220);
  h.addColorStop(0, 'rgba(120,118,150,0)');
  h.addColorStop(0.5, 'rgba(150,140,170,0.42)');
  h.addColorStop(1, 'rgba(120,118,150,0)');
  x.fillStyle = h;
  x.fillRect(-BORDE, HORIZONTE_Y - 220, W, 440);
  x.restore();
  FONDO = new THREE.CanvasTexture(c);
  FONDO.colorSpace = THREE.SRGBColorSpace;
  return FONDO;
};

// ---------------------------------------------------------------- la luz del aro de la papelera (una textura de 1 × N, la pinta CristalLuz)
export const N_ARO = 256;
export const datosAro = new Uint8Array(N_ARO * 4);
let ARO: THREE.DataTexture | null = null;
export const texturaAro = () => {
  if (ARO) return ARO;
  ARO = new THREE.DataTexture(datosAro, N_ARO, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  ARO.wrapS = THREE.RepeatWrapping;
  ARO.magFilter = THREE.LinearFilter;
  ARO.minFilter = THREE.LinearFilter;
  ARO.needsUpdate = true;
  return ARO;
};
export const ARO_MAX = 4; // lo que vale 255 en la textura

// el brillo que corre por dentro del aro (se suma encima del vidrio): blanco en lo más fuerte, rosa y rojo en la cola
export const materialLuzAro = () =>
  new THREE.ShaderMaterial({
    uniforms: {uAro: {value: texturaAro()}, uA: {value: new THREE.Color('#ff4a3d')}, uB: {value: new THREE.Color('#ffd2b8')}},
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D uAro; uniform vec3 uA, uB; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        float I = texture2D(uAro, vec2(vUv.x, .5)).r * ${ARO_MAX.toFixed(1)};
        float f = 1. - abs(dot(vN, vV));
        float k = I * (.3 + .9 * f * f);
        vec3 col = mix(uA, uB, clamp(I * .3, 0., .85)) * k + vec3(1., .85, .8) * pow(max(I - 1.4, 0.), 2.) * .35 * (.4 + f);
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });

// ---------------------------------------------------------------- el suelo: espejo negro, sombras de color y cáusticas
export const N_SOMBRAS = 6;
export const N_ONDAS = 8;
const sueloShader = {
  name: 'SueloCristal',
  uniforms: {
    color: {value: null}, tDiffuse: {value: null}, textureMatrix: {value: null},
    uRefl: {value: 0.42}, uT: {value: 0},
    uPozo: {value: new THREE.Vector4(560, 120, 820, 0.11)},
    uLamp: {value: new THREE.Vector4(470, 60, 380, 0.1)},
    uSA: {value: Array.from({length: N_SOMBRAS}, () => new THREE.Vector4())},
    uSB: {value: Array.from({length: N_SOMBRAS}, () => new THREE.Vector4())},
    uST: {value: Array.from({length: N_SOMBRAS}, () => new THREE.Vector3(1, 1, 1))},
    uSR: {value: Array.from({length: N_SOMBRAS}, () => 0)},
    uBola: {value: new THREE.Vector4(0, 0, 0, 0)},
    uOnda: {value: Array.from({length: N_ONDAS}, () => new THREE.Vector4())},
    uOndaCol: {value: Array.from({length: N_ONDAS}, () => new THREE.Vector3(1, 1, 1))},
    uBrillo: {value: new THREE.Vector4(0, 0, 0, 0)},
    uBrilloCol: {value: new THREE.Color('#ff3b30')},
    uFondo: {value: null as THREE.Texture | null}, uRes: {value: new THREE.Vector2(1080, 1920)}, uBorde: {value: 0},
  },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
    void main(){ vUv = textureMatrix * vec4(position, 1.); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform sampler2D tDiffuse, uFondo; uniform vec2 uRes; uniform float uBorde; uniform float uRefl, uT; uniform vec4 uPozo, uLamp, uBola, uBrillo; uniform vec3 uBrilloCol;
    uniform vec4 uSA[${N_SOMBRAS}]; uniform vec4 uSB[${N_SOMBRAS}]; uniform vec3 uST[${N_SOMBRAS}]; uniform float uSR[${N_SOMBRAS}];
    uniform vec4 uOnda[${N_ONDAS}]; uniform vec3 uOndaCol[${N_ONDAS}];
    varying vec4 vUv; varying vec3 vW;
    vec2 h2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
    // las cáusticas: los bordes de un Voronoi (F2 − F1) deformado, una red de hilos de luz que se mueve despacio
    float vor(vec2 p, float t){ vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.;
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 o = h2(i + g); o = .5 + .45 * sin(t + 6.2831 * o);
        float d = length(g + o - f); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
      return d2 - d1; }
    float caus(vec2 p, float t){ vec2 q = p + .55 * vec2(sin(p.y * 1.3 + t), cos(p.x * 1.1 - t * .8)); q += .25 * vec2(sin(q.y * 3.1 - t * 1.3), cos(q.x * 2.7 + t));
      float e = vor(q * 1.4, t); return exp(-e * 7.) * (.55 + .45 * sin(q.x * 2. + q.y)); }
    // distancia al segmento a-b y lo lejos que está a lo largo de él (0 en a, 1 en b)
    vec2 seg(vec2 p, vec2 a, vec2 b){ vec2 ab = b - a; float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1.), 0., 1.); return vec2(length(p - a - ab * h), h); }
    void main(){
      vec2 xz = vW.xz;
      // el espejo, desenfocado (12 muestras en espiral)
      vec3 refl = vec3(0.);
      for (int i = 0; i < 12; i++) { float a = float(i) * 2.39996; float rr = sqrt((float(i) + .5) / 12.) * 6.;
        vec4 uv = vUv + vec4(cos(a) * rr, sin(a) * rr, 0., 0.) * vUv.w / 520.; refl += texture2DProj(tDiffuse, uv).rgb; }
      refl /= 12.;
      // más reflejo cerca de las piezas, menos al fondo (ahí el suelo se funde con el fondo)
      float lejos = smoothstep(-1150., -350., vW.z);
      vec3 col = refl * uRefl * (.35 + .65 * lejos);
      // el charco de la luz principal y el de la bombilla
      float rp = length(xz - uPozo.xy) / uPozo.z;
      vec3 luz = vec3(.86, .9, 1.) * uPozo.w * exp(-rp * rp * 1.6);
      float rl = length(xz - uLamp.xy) / uLamp.z;
      luz += vec3(1., .8, .55) * uLamp.w * exp(-rl * rl * 2.);
      // las sombras de color: cada pieza de vidrio tiñe la luz que le pasa por dentro y la enfoca en hilos (sus cáusticas)
      vec3 filtro = vec3(1.);
      vec3 cau = vec3(0.);
      for (int k = 0; k < ${N_SOMBRAS}; k++) { vec4 A = uSA[k], B = uSB[k]; if (B.y <= 0.) continue;
        vec2 dh = seg(xz, A.xy, A.zw);
        float w = B.x * (.75 + .7 * dh.y);
        float s = smoothstep(w, w * .25, dh.x) * B.y * (1. - .45 * dh.y);
        filtro *= mix(vec3(1.), uST[k] * .55, s);
        if (B.z > 0.) {
          // la luz que el vidrio enfoca, a 2/3 de la sombra: los hilos y, en las piezas huecas (la papelera), la media luna de lente
          // del lado de fuera, con la dispersión (rojo, verde y azul a radios distintos)
          vec2 dir = normalize(A.zw - A.xy + vec2(1e-3));
          vec2 c = mix(A.xy, A.zw, .6);
          vec2 q = xz - c;
          vec2 d = vec2(dot(q, dir) / (B.x * 1.25), dot(q, vec2(-dir.y, dir.x)) / (B.x * .95));
          float r = length(d);
          float luna = smoothstep(-.1, .7, d.x / max(r, 1e-3)) * uSR[k];
          vec3 anillo = vec3(exp(-pow((r - .62) / .05, 2.)), exp(-pow((r - .66) / .05, 2.)), exp(-pow((r - .7) / .05, 2.))) * luna;
          vec2 pp = d * 3.2;
          vec3 hilos = vec3(caus(pp * .985 + B.w, uT), caus(pp + B.w, uT), caus(pp * 1.015 + B.w, uT)) * exp(-r * r * 1.5);
          cau += (hilos * .8 + anillo * .7 + exp(-r * r * 3.) * .35) * uST[k] * B.z;
        }
      }
      col += luz * filtro + cau;
      // la sombra de la bola (opaca: la única sombra negra del estudio)
      if (uBola.w > 0.) { vec2 d = (xz - uBola.xy) / vec2(uBola.z, uBola.z * .75); col *= 1. - uBola.w * exp(-dot(d, d) * 2.2); }
      // el brillo rojo de la papelera cuando la bola entra
      if (uBrillo.w > 0.) { float r = length(xz - uBrillo.xy) / uBrillo.z; col += uBrilloCol * uBrillo.w * exp(-r * r * 1.5); }
      // los anillos de luz que deja cada bote (con su dispersión)
      for (int k = 0; k < ${N_ONDAS}; k++) { vec4 O = uOnda[k]; if (O.w <= 0.) continue;
        vec2 d = xz - O.xy; d.y *= 1.15; float r = length(d); float x = (r - O.z) / (6. + O.z * .06);
        vec3 banda = vec3(exp(-pow(x + .45, 2.) * 2.5), exp(-x * x * 2.5), exp(-pow(x - .45, 2.) * 2.5));
        col += banda * uOndaCol[k] * O.w;
      }
      // al fondo, el suelo se funde con el fondo del estudio (sin línea de horizonte): la misma textura, en el mismo sitio de la pantalla
      vec2 sp = vec2(gl_FragCoord.x / uRes.x * 1080., (1. - gl_FragCoord.y / uRes.y) * 1920.);
      vec3 fondo = texture2D(uFondo, vec2((sp.x + uBorde) / (1080. + 2. * uBorde), 1. - (sp.y + uBorde) / (1920. + 2. * uBorde))).rgb;
      col = mix(fondo, col, smoothstep(-1100., -560., vW.z));
      gl_FragColor = vec4(col, 1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

export type Suelo = {malla: Reflector; U: Record<string, THREE.IUniform>; refleja: (gl: THREE.WebGLRenderer, escena: THREE.Scene, camara: THREE.Camera) => void};
export const creaSuelo = (ancho: number, alto: number): Suelo => {
  const geo = new THREE.PlaneGeometry(4400, 3600);
  const malla = new Reflector(geo, {shader: sueloShader, textureWidth: ancho, textureHeight: alto, clipBias: 0.002, multisample: 4});
  malla.rotation.x = -Math.PI / 2;
  malla.position.set(540, -SUELO, -1100 + 1800);
  // el espejo se pinta UNA vez por cuadro, a mano (si no, el paso del vidrio lo volvería a pintar dentro de sí mismo)
  const pinta = malla.onBeforeRender.bind(malla) as unknown as (r: THREE.WebGLRenderer, s: THREE.Scene, c: THREE.Camera) => void;
  malla.onBeforeRender = () => {};
  const U = (malla.material as THREE.ShaderMaterial).uniforms;
  U.uFondo.value = texturaFondo();
  U.uRes.value.set(ancho * 2, alto * 2);
  U.uBorde.value = BORDE;
  return {malla, U, refleja: (gl, escena, camara) => pinta(gl, escena, camara)};
};

// la pared de la derecha (la del fallo 2): un panel de vidrio de pie, a lo largo de z
export const PANEL = {x: MURO_X, grueso: 8, z0: -900, z1: 700, arriba: -260};
