// LOS 20 ESTILOS, en el orden de los vídeos: del 1 al 10, el gato que tira la taza; del 11 al 20, la bola de papel.
// `id` es el que usa el código (gato/estilos.ts y bola/estilos.ts); `composicion`, el nombre que se escribe para sacarlo en vídeo;
// `nombre`, como se dice.
export const ORDEN = [
  {id: 'holograma', composicion: 'holograma', nombre: 'Holograma'},
  {id: 'neon', composicion: 'neon', nombre: 'Neón cyberpunk'},
  {id: 'papel', composicion: 'papel', nombre: 'Papel recortado'},
  {id: 'isometrico', composicion: 'isometrico', nombre: 'Isométrico'},
  {id: 'plano-azul', composicion: 'plano-azul', nombre: 'Plano azul'},
  {id: 'termica', composicion: 'termica', nombre: 'Cámara térmica'},
  {id: 'anime', composicion: 'anime', nombre: 'Anime'},
  {id: 'ascii', composicion: 'matrix', nombre: 'Matrix'}, // arte ASCII: la escena pasada a letras verdes
  {id: 'acuarela', composicion: 'acuarela', nombre: 'Acuarela'},
  {id: 'plastilina', composicion: 'plastilina', nombre: 'Plastilina'},
] as const;
export type IdEstilo = (typeof ORDEN)[number]['id'];

// La bola de papel: un muñeco de bloques lanza una bola de papel a la papelera y hay 10 lanzamientos (falla 9 y entra el 10).
// Cada estilo sale por defecto con su lanzamiento del vídeo (`intento`, del 1 al 10: el estilo 11 enseña el 1… el 20, el 10, el que
// entra), y se le puede pedir cualquier otro.
export const ORDEN_BOLA = [
  {id: 'pixel', composicion: 'pixel-art', nombre: 'Pixel art', intento: 1},
  {id: 'bloques', composicion: 'bloques', nombre: 'Bloques de juguete', intento: 2},
  {id: 'pizarra', composicion: 'pizarra', nombre: 'Pizarra de tiza', intento: 3},
  {id: 'anos30', composicion: 'anos-30', nombre: 'Años 30', intento: 4},
  {id: 'vidriera', composicion: 'vidriera', nombre: 'Vidriera', intento: 5},
  {id: 'tinta', composicion: 'tinta-china', nombre: 'Tinta china', intento: 6},
  {id: 'ukiyoe', composicion: 'grabado-japones', nombre: 'Grabado japonés', intento: 7},
  {id: 'cinemudo', composicion: 'cine-mudo', nombre: 'Cine mudo', intento: 8},
  {id: 'cristal', composicion: 'cristal', nombre: 'Cristal', intento: 9},
  {id: 'comic', composicion: 'comic', nombre: 'Cómic', intento: 10},
] as const;
export type IdEstiloBola = (typeof ORDEN_BOLA)[number]['id'];
