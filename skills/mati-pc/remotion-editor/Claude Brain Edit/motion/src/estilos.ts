// Opciones de estilo PROPUESTAS al creador (modo Configuración).
// Cuando elija una, se vuelca a perfil-creador.md y de ahí sale src/tokens.ts: los gráficos solo leen tokens.
export type Estilo = {
  id: string;
  nombre: string;
  idea: string;
  color: {fondo: string; texto: string; textoSobreVideo: string; metodo: string; acento: string; sobreAcento: string; semantico: string};
  fuente: {display: string; subtitulos: string; tarjetas: string; premium: string | null};
  peso: {display: number; subtitulos: number; tarjetas: number};
  displayMayus: boolean;
  radio: number;
};

export const ESTILOS: Record<string, Estilo> = {
  A: {
    id: 'A',
    nombre: 'Cálido sobrio',
    idea: 'Sale de la luz ámbar de tu estantería. Tarjetas oscuras, un solo acento cálido.',
    color: {fondo: '#111113', texto: '#F7F3EA', textoSobreVideo: '#FFFFFF', metodo: '#C8B48A', acento: '#FFB627', sobreAcento: '#111113', semantico: '#E5484D'},
    fuente: {display: 'Avenir Next', subtitulos: 'Avenir Next', tarjetas: 'Avenir Next', premium: 'Didot'},
    peso: {display: 800, subtitulos: 700, tarjetas: 600},
    displayMayus: false,
    radio: 22,
  },
  B: {
    id: 'B',
    nombre: 'Eléctrico',
    idea: 'Sale del brillo azul y magenta de tu pantalla. Más energía, mayúsculas condensadas.',
    color: {fondo: '#0A0A14', texto: '#FFFFFF', textoSobreVideo: '#FFFFFF', metodo: '#8E9BFF', acento: '#D6FF3F', sobreAcento: '#0A0A14', semantico: '#FF4D5E'},
    fuente: {display: 'DIN Condensed', subtitulos: 'Helvetica Neue', tarjetas: 'Helvetica Neue', premium: null},
    peso: {display: 700, subtitulos: 700, tarjetas: 500},
    displayMayus: true,
    radio: 10,
  },
  C: {
    id: 'C',
    nombre: 'Editorial claro',
    idea: 'Tarjetas claras tipo papel sobre tu set oscuro. Más revista que YouTuber.',
    color: {fondo: '#F3EEE4', texto: '#151515', textoSobreVideo: '#F7F2E8', metodo: '#1F4B3F', acento: '#FF5B2E', sobreAcento: '#FFFFFF', semantico: '#C62828'},
    fuente: {display: 'Futura', subtitulos: 'Futura', tarjetas: 'Futura', premium: 'Baskerville'},
    peso: {display: 700, subtitulos: 700, tarjetas: 500},
    displayMayus: false,
    radio: 6,
  },
};
