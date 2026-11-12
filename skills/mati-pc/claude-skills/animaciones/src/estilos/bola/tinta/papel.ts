// EL PAPEL DE ARROZ: el que junta las tres capas de tinta en la pantalla, en WebGL2. Pasado del
// compositor de un motor con licencia MIT (ver AVISOS.md), con una sola imagen y sin
// transiciones. Lo que hace:
//   · el papel: cálido, con nubes de pulpa, fibras largas en tres direcciones, el grano fino y alguna mota oscura;
//   · la tinta MOJADA se corre (un desenfoque con ruido de 12 muestras) y acumula el pigmento en el borde (la marea oscura de la
//     aguada); la SECA solo tiembla con la fibra y la muerde el diente del papel;
//   · la tinta va de gris frío (poca) a negro cálido (mucha) y se MULTIPLICA con el papel, nunca encima;
//   · el bermellón del sello entra en el papel desigual, como la pasta de verdad;
//   · las aguadas «hierven»: el ruido que las corre cambia un pelo en cada paso (hierve).
// Todo en unidades de la escena (1080 × 1920): con otra escala (--scale) sale igual, solo más fino.

const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const FS = `#version 300 es
precision highp float; out vec4 o;
uniform sampler2D tMojada, tSeca, tColor;
uniform vec2 res;        // px del lienzo
uniform float dpr;       // px del lienzo por unidad de la escena
uniform float corre;     // lo que se corre la tinta mojada (en unidades)
uniform float marea;     // lo que se acumula el pigmento en su borde
uniform vec2 hierve;     // el desplazamiento del ruido de las aguadas (cambia en cada paso)
uniform float vineta, calido, fuerza;
uniform vec3 papelCol;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = 0., w = .5; for(int i=0;i<5;i++){ a += w*vn(p); p = p*2.03 + 17.1; w *= .5; } return a; }
float fibra(vec2 p, float ang){ float c = cos(ang), s = sin(ang); vec2 q = vec2(c*p.x + s*p.y, -s*p.x + c*p.y);
  float n = vn(vec2(q.x*.018, q.y*.9)); return smoothstep(.78, .95, n); }
vec3 papel(vec2 p){
  float nube = fbm(p*.0028) - .5, nube2 = fbm(p*.011 + 3.) - .5;
  float fb = fibra(p, .35) + fibra(p + 91., 2.1) * .8 + fibra(p*1.7 + 13., 1.2) * .6;
  float grano = vn(p*.9) - .5;
  vec3 c = papelCol * (1. + nube*.08 + nube2*.035 + grano*.035);
  c += vec3(.02,.018,.013) * fb;
  c -= vec3(.014,.016,.02) * smoothstep(.66,.9, vn(p*.05 + 7.));   // motas de pulpa
  return c;
}
const vec2 PD[12] = vec2[](vec2(-.326,-.406), vec2(-.840,-.074), vec2(-.696,.457), vec2(-.203,.621), vec2(.962,-.195), vec2(.473,-.480),
  vec2(.519,.767), vec2(.185,-.893), vec2(.507,.064), vec2(.896,.412), vec2(-.322,-.933), vec2(-.792,-.598));
float tinta(vec2 fc, vec2 p){
  float R = corre * dpr;
  vec2 desv = vec2(fbm(p*.012 + hierve), fbm(p*.012 + 31. + hierve)) - .5;
  vec2 pluma = vec2(vn(p*.21 + hierve*2.7), vn(p*.21 + 7. + hierve*2.7)) - .5;
  vec2 q = fc + desv * R * 1.1 + pluma * R * .35;
  float a = 0., b = 0.;
  for (int i = 0; i < 12; i++) {
    a += texture(tMojada, (q + PD[i] * R * .5) / res).a;
    b += texture(tMojada, (q + PD[i] * R * 1.35) / res).a;
  }
  a /= 12.; b /= 12.;
  float s0 = texture(tMojada, q / res).a;
  float borde = max(0., a - b);
  float g1 = vn(p*.35 + hierve), g2 = fbm(p*.06);
  float mojada = mix(s0, a, .72) * (.86 + .22*g2) + borde * marea * (.8 + .5*g1) + b * .10;
  // la seca: tiembla con la fibra y la muerde el diente del papel
  vec2 j = vec2(vn(p*.7), vn(p*.7 + 5.)) - .5;
  float seca = texture(tSeca, (fc + j * 1.6 * dpr) / res).a;
  float diente = smoothstep(.62, .9, vn(p*.55 + 3.)) * .45;
  seca *= 1. - diente * (1. - seca*.5);
  return clamp(1. - (1. - clamp(mojada, 0., 1.)) * (1. - clamp(seca, 0., 1.)), 0., 1.);
}
vec3 colorTinta(float D){ return mix(vec3(.46,.48,.5), vec3(.035,.03,.028), smoothstep(.0, .72, D)); }
void main(){
  vec2 fc = gl_FragCoord.xy; fc.y = res.y - fc.y;
  vec2 p = fc / dpr;
  vec3 pc = papel(p);
  // el bermellón entra primero en el papel (la pasta del sello no agarra pareja) y la tinta va ENCIMA: así una montaña
  // puede tapar el sol y una duela cruzar el aro rojo
  vec4 col = texture(tColor, fc / res);
  float pasta = smoothstep(.2, .45, vn(p*.8 + 11.)) * .2 + .8;
  vec3 c = mix(pc, col.rgb * (pc / papelCol), col.a * pasta);
  // la tinta, con fuerza: la densidad se curva hacia arriba (los negros, negros de verdad)
  float D = tinta(fc, p);
  D = 1. - pow(1. - D, fuerza);
  c *= mix(vec3(1.), colorTinta(D), clamp(D*1.08, 0., 1.));
  vec2 uv = fc / res - .5;
  c *= 1. - vineta * dot(uv*vec2(1.,.82), uv*vec2(1.,.82)) * 1.2;
  c = mix(c, c * vec3(1.02, .99, .93), calido);
  o = vec4(clamp(c, 0., 1.), 1.);
}`;

export type OpPapel = {fuerza?: number; corre?: number; marea?: number; hierve?: [number, number]; vineta?: number; calido?: number; papel?: [number, number, number]};
export type Compositor = (mojada: HTMLCanvasElement, seca: HTMLCanvasElement, color: HTMLCanvasElement, dpr: number, o?: OpPapel) => void;

export const haceCompositor = (canvas: HTMLCanvasElement): Compositor => {
  const gl = canvas.getContext('webgl2', {preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false});
  if (!gl) throw new Error('Tinta china: este navegador no tiene WebGL2');
  const sh = (t: number, s: string) => {
    const x = gl.createShader(t)!;
    gl.shaderSource(x, s);
    gl.compileShader(x);
    if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x) ?? 'shader');
    return x;
  };
  const pr = gl.createProgram()!;
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr) ?? 'programa');
  gl.useProgram(pr);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(pr, n);
  const nombres = ['tMojada', 'tSeca', 'tColor'];
  const tex = nombres.map((n, i) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.uniform1i(U(n), i);
    return t;
  });
  const sube = (i: number, cv: HTMLCanvasElement) => {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, tex[i]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  };
  return (mojada, seca, color, dpr, o = {}) => {
    const W = canvas.width, H = canvas.height;
    gl.viewport(0, 0, W, H);
    sube(0, mojada);
    sube(1, seca);
    sube(2, color);
    gl.uniform2f(U('res'), W, H);
    gl.uniform1f(U('dpr'), dpr);
    gl.uniform1f(U('corre'), o.corre ?? 6);
    gl.uniform1f(U('fuerza'), o.fuerza ?? 1);
    gl.uniform1f(U('marea'), o.marea ?? 0.9);
    const h = o.hierve ?? [0, 0];
    gl.uniform2f(U('hierve'), h[0], h[1]);
    gl.uniform1f(U('vineta'), o.vineta ?? 0.22);
    gl.uniform1f(U('calido'), o.calido ?? 0.5);
    const pc = o.papel ?? [0.95, 0.925, 0.868];
    gl.uniform3f(U('papelCol'), pc[0], pc[1], pc[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
};
