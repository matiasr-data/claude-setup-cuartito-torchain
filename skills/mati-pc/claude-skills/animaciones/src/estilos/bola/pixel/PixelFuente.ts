import {C, Lienzo, T, contorno, volcar} from './PixelMotor';

// PIXEL ART · LA LETRA. Una letra de píxeles propia, de 7 de alto y ancho variable (hecha
// a mano): mayúsculas, números y lo justo para el marcador y los rótulos («TIRO 1/10», «¡FALLO!», «¡DENTRO!»). Se pinta
// dentro del lienzo de índices, a 1 × en el marcador y a 3 × en los rótulos, con su contorno de tinta y su degradado por filas.

const G: Record<string, string[]> = {};
const def = (ch: string, ...filas: string[]) => {
  G[ch] = filas;
};
def('A', '.###.', '##.##', '##.##', '#####', '##.##', '##.##', '##.##');
def('B', '####.', '##.##', '##.##', '####.', '##.##', '##.##', '####.');
def('C', '.####', '##...', '##...', '##...', '##...', '##...', '.####');
def('D', '####.', '##.##', '##.##', '##.##', '##.##', '##.##', '####.');
def('E', '#####', '##...', '##...', '####.', '##...', '##...', '#####');
def('F', '#####', '##...', '##...', '####.', '##...', '##...', '##...');
def('G', '.####', '##...', '##...', '##.##', '##.##', '##.##', '.####');
def('H', '##.##', '##.##', '##.##', '#####', '##.##', '##.##', '##.##');
def('I', '####', '.##.', '.##.', '.##.', '.##.', '.##.', '####');
def('J', '..###', '...##', '...##', '...##', '...##', '##.##', '.###.');
def('K', '##.##', '##.##', '####.', '###..', '####.', '##.##', '##.##');
def('L', '##...', '##...', '##...', '##...', '##...', '##...', '#####');
def('M', '#...#', '##.##', '#####', '#####', '##.##', '##.##', '##.##');
def('N', '##..#', '###.#', '#####', '##.##', '##.##', '##.##', '##.##');
def('O', '.###.', '##.##', '##.##', '##.##', '##.##', '##.##', '.###.');
def('P', '####.', '##.##', '##.##', '####.', '##...', '##...', '##...');
def('Q', '.###.', '##.##', '##.##', '##.##', '##.##', '##.#.', '.##.#');
def('R', '####.', '##.##', '##.##', '####.', '####.', '##.##', '##.##');
def('S', '.####', '##...', '##...', '.###.', '...##', '...##', '####.');
def('T', '######', '..##..', '..##..', '..##..', '..##..', '..##..', '..##..');
def('U', '##.##', '##.##', '##.##', '##.##', '##.##', '##.##', '.###.');
def('V', '##.##', '##.##', '##.##', '##.##', '##.##', '.###.', '..#..');
def('W', '##.##', '##.##', '##.##', '#####', '#####', '##.##', '#...#');
def('X', '##.##', '##.##', '.###.', '..#..', '.###.', '##.##', '##.##');
def('Y', '##.##', '##.##', '##.##', '.###.', '..##.', '..##.', '..##.');
def('Z', '#####', '...##', '..##.', '.##..', '##...', '##...', '#####');
def('0', '.###.', '##.##', '##.##', '##.##', '##.##', '##.##', '.###.');
def('1', '.##', '###', '.##', '.##', '.##', '.##', '.##');
def('2', '####.', '...##', '...##', '.###.', '##...', '##...', '#####');
def('3', '####.', '...##', '...##', '.###.', '...##', '...##', '####.');
def('4', '##.##', '##.##', '##.##', '#####', '...##', '...##', '...##');
def('5', '#####', '##...', '####.', '...##', '...##', '...##', '####.');
def('6', '.###.', '##...', '####.', '##.##', '##.##', '##.##', '.###.');
def('7', '#####', '...##', '..##.', '..##.', '.##..', '.##..', '.##..');
def('8', '.###.', '##.##', '##.##', '.###.', '##.##', '##.##', '.###.');
def('9', '.###.', '##.##', '##.##', '.####', '...##', '...##', '.###.');
def('!', '##', '##', '##', '##', '##', '..', '##');
def('¡', '##', '..', '##', '##', '##', '##', '##');
def('?', '####.', '...##', '...##', '.###.', '.##..', '.....', '.##..');
def('/', '...##', '...##', '..##.', '..#..', '.##..', '##...', '##...');
def('+', '.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....');
def('.', '..', '..', '..', '..', '..', '..', '##');
def(':', '..', '##', '##', '..', '##', '##', '..');
def(' ', '..', '..', '..', '..', '..', '..', '..');

export const ALTO_LETRA = 7;
const glifo = (ch: string) => G[ch] ?? G['?'];
export const ancho = (s: string, esc = 1) => {
  let w = 0;
  for (const ch of s) w += (glifo(ch)[0].length + 1) * esc;
  return Math.max(0, w - esc);
};

// escribe un texto; color puede ser un índice o una función de la fila (0..6) y la columna de la letra; devuelve el borde derecho
export const texto = (l: Lienzo, s: string, x0: number, y0: number, color: number | ((fila: number, k: number) => number), sombra: number | null = null, esc = 1) => {
  let x = Math.round(x0);
  let k = 0;
  for (const ch of s) {
    const g = glifo(ch);
    for (let y = 0; y < g.length; y++) {
      for (let b = 0; b < g[y].length; b++) {
        if (g[y][b] !== '#') continue;
        if (sombra !== null) l.rect(x + b * esc + 1, y0 + y * esc + 1, esc, esc, sombra);
      }
    }
    for (let y = 0; y < g.length; y++) {
      for (let b = 0; b < g[y].length; b++) {
        if (g[y][b] !== '#') continue;
        l.rect(x + b * esc, y0 + y * esc, esc, esc, typeof color === 'number' ? color : color(y, k));
      }
    }
    x += (g[0].length + 1) * esc;
    k++;
  }
  return x;
};

// el rótulo grande de juego: cada letra con su salto (dy por letra), el degradado por filas, un contorno de tinta y su sombra dura
const CAPA = new Lienzo();
export const rotulo = (l: Lienzo, s: string, cx: number, y0: number, esc: number, color: (fila: number, k: number) => number, salto: (k: number) => number = () => 0, borde2: number | null = null) => {
  CAPA.limpiar();
  CAPA.ox = l.ox;
  CAPA.oy = l.oy;
  let x = Math.round(cx - ancho(s, esc) / 2);
  let k = 0;
  for (const ch of s) {
    texto(CAPA, ch, x, y0 + salto(k), (f) => color(f, k), null, esc);
    x += (glifo(ch)[0].length + 1) * esc;
    k++;
  }
  contorno(CAPA, C.tinta);
  if (borde2 !== null) contorno(CAPA, borde2);
  // la sombra dura: la silueta ya contorneada, dos píxeles más abajo, en tinta (se lee como letra con canto, de recreativa)
  const w = CAPA.w;
  for (let i = CAPA.d.length - 1; i >= 2 * w; i--) if (CAPA.d[i] === T && CAPA.d[i - 2 * w] !== T) CAPA.d[i] = C.tinta;
  volcar(CAPA, l);
};
