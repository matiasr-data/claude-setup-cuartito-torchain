// CINE MUDO, LA PELÍCULA: lo que convierte la pintura en gris de la escena en una copia de cine de los años
// 20. Dos pasadas en WebGL2 sobre un lienzo propio (uno por pestaña del render, compartido por todas las tarjetas):
//   1 · EL DIBUJO (el «Redraw»): la pintura en grises se entinta como un grabado: líneas
//       de tinta en el lado oscuro de cada borde (diferencia de dos desenfoques), el gris en 5 aguadas suaves y el rayado a 45° (y
//       cruzado) en las sombras, que se vuelve a dibujar en cada paso de la animación (el trazo «hierve», como dibujado a mano).
//   2 · LA COPIA (su «FilmPost»): la capa de encima (el iris y el rótulo) se mezcla y todo pasa a la plata vieja: curva en S, negro y
//       blanco de copia, el halo de los blancos que queman, el parpadeo del proyector, la imagen que baila en la ventanilla (y el salto
//       de cuadro en el golpe, que enseña la línea negra entre fotogramas), las rayas verticales (blancas, emulsión rascada; negras,
//       suciedad), los bordes quemados, la viñeta y un grano grueso de plata en dos tamaños.
// Después, en 2D, el polvo, el pelo en la ventanilla y alguna mancha (polvo()).
// Los sombreadores están adaptados de un motor con licencia MIT (ver AVISOS.md), pasados a 1080 × 1920 y engordados para que
// se lean en la tarjeta del vídeo (505 px de ancho): el grano, las rayas, el polvo y el rayado, del doble.

const VS = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p*.5+.5; gl_Position = vec4(p,0,1); }`;
const CAB = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform vec2 R; uniform sampler2D T;`;

// la luminancia (el lienzo de origen viene con su fila de arriba en v = 0: se le da la vuelta aquí, y desde ahí todo va al derecho de GL)
const FS_LUM = CAB + `
uniform float con;
void main(){
  vec3 c = texture(T, vec2(uv.x, 1.-uv.y)).rgb;
  float L = dot(c, vec3(.30,.59,.11));
  L = clamp((L - .5) * con + .5, 0., 1.);
  o = vec4(vec3(L), 1.);
}`;
// desenfoque gaussiano en una dirección
const FS_DESENFOCA = CAB + `
uniform vec2 dir; uniform float sig;
void main(){
  float s = 0., w = 0.;
  int n = int(ceil(sig*3.));
  for (int i = -14; i <= 14; i++) { if (i < -n || i > n) continue; float x = float(i); float k = exp(-x*x/(2.*sig*sig)); s += texture(T, uv + dir*x/R).r * k; w += k; }
  o = vec4(vec3(s/w), 1.);
}`;
// el dibujo: tinta, aguadas y rayado
const FS_DIBUJO = CAB + `
uniform sampler2D A, B, Lm, F; uniform float paso, p, eps, phi, niveles, hueco, tinta, papel, aguadaOscura, aguadaGam, h1, h2, h3, bordeF;
float h21(vec2 q){ q = fract(q*vec2(123.34,456.21)); q += dot(q,q+45.32); return fract(q.x*q.y); }
float vn(vec2 q){ vec2 i=floor(q), f=fract(q); vec2 u=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),u.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x), u.y); }
// una familia de rayas: ángulo a, separación g, grosor w (más grueso cuanto más oscuro), con el pulso de la mano y trazos cortados
float raya(vec2 px, float a, float g, float w, float bk){
  vec2 d = vec2(cos(a), sin(a));
  float tiembla = (vn(px * .012 + bk * 3.7) - .5) * 3.2 + (vn(px*.07 + bk) - .5) * 1.1;
  float t = dot(px, vec2(-d.y, d.x)) + tiembla + bk * 17.31;
  float f = abs(fract(t / g) - .5) * g;
  float corta = smoothstep(.16, .3, vn(vec2(dot(px, d) * .022, floor(t / g) * 1.7 + bk)));
  return (1. - smoothstep(w * .5, w * .5 + 1.1, f)) * corta;
}
void main(){
  vec2 px = vec2(uv.x, 1.-uv.y) * R;
  float g1 = texture(A, uv).r, g2 = texture(B, uv).r, L = texture(Lm, uv).r;
  // la tinta: en el lado oscuro de cada borde
  float Dg = g1 - g2;
  float ink = smoothstep(eps, eps + 1. / phi, -Dg * p);
  // las aguadas: el gris en escalones suaves
  float Ls = mix(L, g1, .6);
  float q = Ls * (niveles - 1.);
  float fq = floor(q), fr = q - fq;
  float st = (fq + smoothstep(.3, .7, fr)) / (niveles - 1.);
  float ag = mix(aguadaOscura, papel, pow(st, aguadaGam));
  // el rayado en las sombras: 45°, luego cruzado, luego casi horizontal; se redibuja en cada paso
  float bk = paso;
  float dk = 1. - Ls;
  float h = 0.;
  h = max(h, raya(px, .785, hueco, 1.3 + dk * 2.0, bk) * smoothstep(h1, h1 + .08, dk));
  h = max(h, raya(px, -.785, hueco * 1.1, 1.2 + dk * 1.8, bk + 5.) * smoothstep(h2, h2 + .08, dk));
  h = max(h, raya(px, .12, hueco * .85, 1.2 + dk * 1.6, bk + 9.) * smoothstep(h3, h3 + .06, dk));
  // los planos: lo de delante (el muñeco, la silla, la lámpara y la papelera, marcados en F) va limpio, sin rayado, y con un
  // contorno grueso alrededor de su silueta; el rayado queda para las sombras grandes del fondo
  vec2 fuv = vec2(uv.x, 1.-uv.y);
  float m = texture(F, fuv).a;
  float e = 0.;
  for (int j = 0; j < 12; j++) {
    float a = float(j) * .5236;
    e = max(e, abs(texture(F, fuv + vec2(cos(a), sin(a)) * bordeF / R).a - m));
  }
  float contorno = smoothstep(.3, .65, e);
  h *= 1. - smoothstep(.05, .4, m);
  float c = mix(ag, tinta, h * .9);
  c = mix(c, tinta, ink);
  c = mix(c, tinta, contorno);
  o = vec4(vec3(c), 1.);
}`;
// el brillo para el halo: solo el dibujo, en pequeño (la bola trae su propio halo por fuera de su contorno negro, que así no se lava)
const FS_HALO = CAB + `
void main(){
  float L = texture(T, uv).r;
  o = vec4(vec3(max(0., L - .62) / .38), 1.);
}`;
// la copia
const FS_COPIA = CAB + `
uniform sampler2D O, H; uniform float cuadro, semilla, fuerza, grano, parpadea, rayas, quema, vineta, halo, sepia, negro, blanco, contraste, expo;
uniform vec2 baila;
float h21(vec2 q){ q = fract(q*vec2(123.34,456.21)); q += dot(q,q+45.32); return fract(q.x*q.y); }
float h11(float x){ return fract(sin(x*127.1+311.7)*43758.5453); }
float vn(vec2 q){ vec2 i=floor(q), f=fract(q); vec2 u=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),u.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 q){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vn(q); q*=2.07; a*=.5; } return s; }
void main(){
  vec2 px = vec2(uv.x, 1.-uv.y)*R;           // en píxeles, desde arriba a la izquierda
  vec2 q = px - baila;                         // la imagen baila bajo la ventanilla, que no se mueve
  vec2 st = q / R;
  vec2 sg = vec2(st.x, 1.-st.y);
  // un pelo blanda (copia de copia)
  float c0 = texture(T, sg).r;
  float c1 = (texture(T, sg+vec2(1.,0)/R).r + texture(T, sg-vec2(1.,0)/R).r + texture(T, sg+vec2(0,1.)/R).r + texture(T, sg-vec2(0,1.)/R).r)*.25;
  float L = mix(c0, c1, .4);
  // la capa de encima (el iris y el rótulo), dentro de la copia
  vec4 cap = texture(O, st);
  L = mix(L, dot(cap.rgb, vec3(.3,.59,.11)), cap.a);
  // el halo: los blancos sangran
  L += halo * .3 * texture(H, sg).r;
  // la exposición (con el parpadeo ya dentro) y la densidad desigual del cuadro
  float dens = (fbm(vec2(st.x*1.3, st.y*1.1)*1.6 + vec2(cuadro*.021, semilla)) - .5) * .12 * parpadea * fuerza;
  L = L * expo + dens;
  // la curva en S
  L = clamp(L, 0., 1.2);
  float s = L*L*(3.-2.*L); L = mix(L, s, clamp(contraste-1., -1., 1.) + .35);
  // el negro y el blanco de la copia
  L = mix(negro, blanco, clamp(L, 0., 1.));
  // las rayas verticales (blancas: emulsión rascada; negras: suciedad del negativo)
  float scr = 0.;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float vida = floor((cuadro + fi*17.) / (4. + fi*3.));
    float on = step(1. - rayas*fuerza*(.6 - fi*.09), h11(vida*3.1 + fi*7.7));
    float x = h11(vida*1.7 + fi) * R.x + sin(cuadro*.37 + fi)*4.;
    float w = 1.4 + h11(vida + fi*2.) * 2.4;
    float d = abs(px.x - x);
    float trozo = step(.22, vn(vec2(px.y*.005 + fi*9., vida)));
    float oscura = step(.6, h11(vida*9.1 + fi));
    scr += on * trozo * smoothstep(w, 0., d) * (oscura > .5 ? -.6 : .75);
  }
  L += scr;
  // los bordes quemados: oscurecen a manchas desde el borde
  vec2 e = min(st, 1. - st); float ed = min(e.x*R.x/R.y, e.y) * 1.25;
  float qn = fbm(st*vec2(3.,2.4) + vec2(semilla*.3, cuadro*.004));
  float qm = smoothstep(.1 + qn*.1, 0., ed) * quema * fuerza;
  L *= 1. - qm*.6;
  // la viñeta
  vec2 cv = st - .5; float vig = dot(cv*vec2(1.,.62), cv*vec2(1.,.62));
  L *= 1. - vineta * smoothstep(.06, .34, vig) * .55;
  // el grano de plata, grueso: dos tamaños, más fuerte en los medios
  float g1 = h21(floor(px/2.6) + vec2(cuadro*13.1, cuadro*7.7)) - .5;
  float g2 = vn(px/5.5 + vec2(cuadro*31.7, cuadro*11.3)) - .5;
  float gm = 1. - abs(L - .5)*1.2;
  L += (g1*.11 + g2*.12) * grano * gm;
  L = clamp(L, 0., 1.);
  // el tono: plata, con un poco de sepia
  vec3 plata = vec3(L) * vec3(.985, .99, 1.0);
  vec3 sep = mix(vec3(.08,.055,.04), vec3(.62,.52,.40), smoothstep(0., .6, L));
  sep = mix(sep, vec3(.97,.93,.85), smoothstep(.5, 1., L));
  vec3 c = mix(plata, sep, sepia);
  c += vec3(.03,.01,-.008) * qm;
  // fuera de la imagen (el salto de cuadro enseña la línea entre fotogramas): negro
  float dentro = step(0., st.x) * step(st.x, 1.) * step(0., st.y) * step(st.y, 1.);
  // la ventanilla del proyector: las esquinas redondeadas con su borde blando
  vec2 r2 = abs(px - R*.5) - (R*.5 - vec2(46.));
  float dv = length(max(r2, 0.)) + min(max(r2.x, r2.y), 0.) - 46.;
  float ventanilla = 1. - smoothstep(-14., 2., dv);
  o = vec4(c * dentro * ventanilla, 1.);
}`;

type Uni = Record<string, number | [number, number]>;
type Rt = {t: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number};

export type OpcionesDibujo = {paso: number; sigma?: number; k?: number; p?: number; eps?: number; phi?: number; niveles?: number; hueco?: number;
  tinta?: number; papel?: number; aguadaOscura?: number; aguadaGam?: number; h1?: number; h2?: number; h3?: number; contraste?: number; bordeF?: number};
export type OpcionesCopia = {cuadro: number; semilla?: number; fuerza?: number; grano?: number; parpadea?: number; rayas?: number; quema?: number;
  vineta?: number; halo?: number; sepia?: number; negro?: number; blanco?: number; contraste?: number; expo?: number; baila?: [number, number]};

export class Proyector {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private pLum: WebGLProgram;
  private pDes: WebGLProgram;
  private pDib: WebGLProgram;
  private pHalo: WebGLProgram;
  private pCopia: WebGLProgram;
  private texEscena: WebGLTexture;
  private texCapa: WebGLTexture;
  private texFrente: WebGLTexture;
  private rt: Record<'L' | 'A1' | 'A2' | 'B1' | 'B2' | 'D' | 'Q0' | 'Q1' | 'Q2', Rt>;
  constructor(readonly w = 1080, readonly h = 1920) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = h;
    const gl = this.canvas.getContext('webgl2', {preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false});
    if (!gl) throw new Error('Cine mudo: este navegador no tiene WebGL2 (render con --gl=angle)');
    this.gl = gl;
    const sh = (tipo: number, src: string) => {
      const s = gl.createShader(tipo)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'sombreador');
      return s;
    };
    const prog = (fs: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'programa');
      return p;
    };
    this.pLum = prog(FS_LUM);
    this.pDes = prog(FS_DESENFOCA);
    this.pDib = prog(FS_DIBUJO);
    this.pHalo = prog(FS_HALO);
    this.pCopia = prog(FS_COPIA);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    for (const p of [this.pLum, this.pDes, this.pDib, this.pHalo, this.pCopia]) {
      const l = gl.getAttribLocation(p, 'p');
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
    }
    const tex = () => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    this.texEscena = tex();
    this.texCapa = tex();
    this.texFrente = tex();
    const rt = (ww: number, hh: number): Rt => {
      const t = tex();
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, ww, hh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      return {t, fb, w: ww, h: hh};
    };
    const qw = Math.round(w / 4), qh = Math.round(h / 4);
    this.rt = {L: rt(w, h), A1: rt(w, h), A2: rt(w, h), B1: rt(w, h), B2: rt(w, h), D: rt(w, h), Q0: rt(qw, qh), Q1: rt(qw, qh), Q2: rt(qw, qh)};
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private pasada(prog: WebGLProgram, destino: Rt | null, texs: [string, WebGLTexture][], uni: Uni) {
    const gl = this.gl;
    gl.useProgram(prog);
    const w = destino ? destino.w : this.w, h = destino ? destino.h : this.h;
    gl.bindFramebuffer(gl.FRAMEBUFFER, destino ? destino.fb : null);
    gl.viewport(0, 0, w, h);
    texs.forEach(([nombre, t], i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.uniform1i(gl.getUniformLocation(prog, nombre), i);
    });
    gl.uniform2f(gl.getUniformLocation(prog, 'R'), w, h);
    for (const k in uni) {
      const v = uni[k], l = gl.getUniformLocation(prog, k);
      if (l == null) continue;
      if (Array.isArray(v)) gl.uniform2f(l, v[0], v[1]);
      else gl.uniform1f(l, v);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private sube(t: WebGLTexture, lienzo: HTMLCanvasElement) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lienzo);
  }

  // la escena (pintura en grises), lo de delante (su alfa dice qué va limpio y con contorno) y la capa de encima (la bola, el iris y
  // el rótulo, con su alfa) → la copia, en this.canvas
  proyecta(escena: HTMLCanvasElement, frente: HTMLCanvasElement, capa: HTMLCanvasElement, d: OpcionesDibujo, c: OpcionesCopia) {
    const {L, A1, A2, B1, B2, D, Q0, Q1, Q2} = this.rt;
    this.sube(this.texEscena, escena);
    this.sube(this.texFrente, frente);
    this.sube(this.texCapa, capa);
    this.pasada(this.pLum, L, [['T', this.texEscena]], {con: d.contraste ?? 1.08});
    const sig = d.sigma ?? 1.5, k = d.k ?? 1.6;
    this.pasada(this.pDes, A1, [['T', L.t]], {dir: [1, 0], sig});
    this.pasada(this.pDes, A2, [['T', A1.t]], {dir: [0, 1], sig});
    this.pasada(this.pDes, B1, [['T', L.t]], {dir: [1, 0], sig: sig * k});
    this.pasada(this.pDes, B2, [['T', B1.t]], {dir: [0, 1], sig: sig * k});
    this.pasada(this.pDib, D, [['A', A2.t], ['B', B2.t], ['Lm', L.t], ['F', this.texFrente]], {
      paso: d.paso, p: d.p ?? 16, eps: d.eps ?? 0.3, phi: d.phi ?? 4, niveles: d.niveles ?? 5, hueco: d.hueco ?? 8.5, tinta: d.tinta ?? 0.05,
      papel: d.papel ?? 0.97, aguadaOscura: d.aguadaOscura ?? 0.15, aguadaGam: d.aguadaGam ?? 0.9, h1: d.h1 ?? 0.7, h2: d.h2 ?? 0.8, h3: d.h3 ?? 0.9, bordeF: d.bordeF ?? 4,
    });
    // el halo, a un cuarto de tamaño y bien desenfocado
    this.pasada(this.pHalo, Q0, [['T', D.t]], {});
    this.pasada(this.pDes, Q1, [['T', Q0.t]], {dir: [1, 0], sig: 4.5});
    this.pasada(this.pDes, Q2, [['T', Q1.t]], {dir: [0, 1], sig: 4.5});
    this.pasada(this.pCopia, null, [['T', D.t], ['O', this.texCapa], ['H', Q2.t]], {
      cuadro: c.cuadro, semilla: c.semilla ?? 3.1, fuerza: c.fuerza ?? 0.75, grano: c.grano ?? 1, parpadea: c.parpadea ?? 1, rayas: c.rayas ?? 0.85,
      quema: c.quema ?? 1, vineta: c.vineta ?? 1, halo: c.halo ?? 1, sepia: c.sepia ?? 0.14, negro: c.negro ?? 0.02, blanco: c.blanco ?? 0.95,
      contraste: c.contraste ?? 1.45, expo: c.expo ?? 1, baila: c.baila ?? [0, 0],
    });
    return this.canvas;
  }
}

let PROYECTOR: Proyector | null = null;
export const proyector = () => (PROYECTOR ??= new Proyector(1080, 1920));

// ------------------------------------------------------------------ el azar de cada cuadro (siempre el mismo para el mismo cuadro)
export const azar = (n: number) => {
  const s = Math.sin(n * 91.3458 + 17.123) * 47453.5453;
  return s - Math.floor(s);
};

// el baile de la imagen en la ventanilla y el parpadeo del proyector, por cuadro de película (24 por segundo)
export const bailaEn = (cuadro: number, fuerza: number): [number, number] => {
  const r = azar;
  const x = (Math.sin(cuadro * 0.31) * 0.6 + Math.sin(cuadro * 0.113 + 1.3) * 0.8 + (r(cuadro) - 0.5) * 0.6) * 2.4 * fuerza;
  let y = (Math.sin(cuadro * 0.23 + 0.7) * 0.7 + Math.sin(cuadro * 0.071 + 2.1) * 0.9 + (r(cuadro + 99) - 0.5) * 0.8) * 2.8 * fuerza;
  if (r(Math.floor(cuadro / 2) * 3.7) < 0.03 * fuerza) y += 7 * fuerza; // de vez en cuando, un salto de la perforación
  return [x, y];
};
export const parpadeoEn = (cuadro: number, fuerza: number) =>
  1 + ((azar(cuadro + 7) - 0.5) * 0.12 + Math.sin(cuadro * 1.9) * 0.03 + Math.sin(cuadro * 0.37) * 0.025) * fuerza;

// ------------------------------------------------------------------ el polvo, el pelo en la ventanilla y alguna mancha (en 2D, encima)
export const polvo = (g: CanvasRenderingContext2D, w: number, h: number, cuadro: number, fuerza: number) => {
  const r = azar;
  g.save();
  const n = Math.floor((3 + r(cuadro * 1.3) * 9) * fuerza);
  for (let i = 0; i < n; i++) {
    const a = r(cuadro * 7.1 + i * 3.3), b = r(cuadro * 3.7 + i * 5.9), c = r(cuadro * 1.9 + i * 8.1);
    const px = a * w, py = b * h, rad = 1.6 + c * c * 6.5;
    const blanca = r(cuadro + i * 11.7) < 0.4;
    g.fillStyle = blanca ? `rgba(240,234,220,${0.55 + c * 0.4})` : `rgba(10,8,6,${0.6 + c * 0.35})`;
    g.beginPath();
    const m = 5 + Math.floor(c * 4);
    for (let j = 0; j < m; j++) {
      const an = (j / m) * Math.PI * 2, rr = rad * (0.55 + r(i * 13 + j + cuadro) * 0.75);
      const x = px + Math.cos(an) * rr, y = py + Math.sin(an) * rr;
      if (j) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.fill();
  }
  // un pelo atrapado en la ventanilla: dura unos 10 cuadros y se mueve
  const vidaPelo = Math.floor(cuadro / 10);
  if (r(vidaPelo * 5.3) < 0.3 * fuerza) {
    const hx = r(vidaPelo * 2.1) * w, hy = r(vidaPelo * 4.7) * h, largo = 90 + r(vidaPelo) * 160;
    g.strokeStyle = 'rgba(8,6,4,0.8)';
    g.lineWidth = 2.4;
    g.beginPath();
    for (let j = 0; j <= 24; j++) {
      const u = j / 24;
      const x = hx + Math.sin(u * 5 + vidaPelo) * 26 * u + u * largo * 0.6, y = hy + u * largo + Math.sin(u * 9 + cuadro * 0.3) * 5;
      if (j) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.stroke();
  }
  // una mancha grande, rara, de un solo cuadro
  if (r(cuadro * 2.9) < 0.02 * fuerza) {
    const bx = (0.2 + r(cuadro) * 0.6) * w, by = (0.15 + r(cuadro * 3) * 0.3) * h;
    g.fillStyle = 'rgba(245,238,222,0.45)';
    g.beginPath();
    g.arc(bx, by, 18 + r(cuadro * 5) * 30, 0, 7);
    g.fill();
  }
  g.restore();
};
