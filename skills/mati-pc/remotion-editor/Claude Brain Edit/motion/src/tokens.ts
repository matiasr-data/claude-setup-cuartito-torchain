// Tokens de diseño. Salen de perfil-creador.md (roles de color y tipografía); los gráficos solo leen de aquí.
// Estilo activo: B · Eléctrico. Para cambiar de estilo basta con editar este archivo y volver a renderizar.
export const T = {
  color: {
    fondo: '#0A0A14',
    texto: '#FFFFFF',
    metodo: '#8E9BFF',
    acento: '#D6FF3F',
    sobreAcento: '#0A0A14',
    semantico: '#FF4D5E',
    tarjeta: 'rgba(10,10,20,0.90)',
    borde: 'rgba(255,255,255,0.16)',
    tenue: 'rgba(255,255,255,0.62)',
  },
  fuente: {
    display: '"DIN Condensed", "DIN Alternate", Impact, sans-serif',
    subtitulos: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    tarjetas: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    mono: 'Menlo, "SF Mono", monospace',
  },
  peso: {display: 700, subtitulos: 700, tarjetas: 500},
  displayMayus: true,
  radio: 12,
  // Zonas seguras 16:9 (1920×1080)
  seguro: {arriba: 108, abajo: 130, lado: 96},
  sombraTexto: '-3px 0 0 rgba(10,10,20,0.9), 3px 0 0 rgba(10,10,20,0.9), 0 -3px 0 rgba(10,10,20,0.9), 0 3px 0 rgba(10,10,20,0.9), -2px -2px 0 rgba(10,10,20,0.9), 2px -2px 0 rgba(10,10,20,0.9), -2px 2px 0 rgba(10,10,20,0.9), 2px 2px 0 rgba(10,10,20,0.9), 0 8px 30px rgba(0,0,0,0.85)',
  sombraTarjeta: '0 30px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35)',
} as const;

export const W = 1920;
export const H = 1080;
