import type React from 'react';
import {PixelArt} from './pixel/PixelArt';
import {Bloques} from './Bloques';
import {Pizarra} from './pizarra/Pizarra';
import {Anos30} from './anos30/Anos30';
import {Vidriera} from './vidriera/Vidriera';
import {TintaChina} from './tinta/TintaChina';
import {GrabadoJapones} from './ukiyoe/GrabadoJapones';
import {CineMudo} from './cinemudo/CineMudo';
import {Cristal} from './cristal/Cristal';
import {Comic} from './comic/Comic';

// LOS 10 ESTILOS DE LA BOLA DE PAPEL, en el orden del vídeo. El estilo N enseña el
// intento N de la escena (escena.ts: el 1 rebota en el borde… el 10 entra). «nombre» es como se dice.
type Estilo = React.FC<{intento: number; t: number}>;
export const ESTILOS: {id: string; nombre: string; C: Estilo}[] = [
  {id: 'pixel', nombre: 'Pixel art', C: PixelArt},
  {id: 'bloques', nombre: 'Bloques de juguete', C: Bloques},
  {id: 'pizarra', nombre: 'Pizarra de tiza', C: Pizarra},
  {id: 'anos30', nombre: 'Años 30', C: Anos30},
  {id: 'vidriera', nombre: 'Vidriera', C: Vidriera},
  {id: 'tinta', nombre: 'Tinta china', C: TintaChina},
  {id: 'ukiyoe', nombre: 'Grabado japonés', C: GrabadoJapones},
  {id: 'cinemudo', nombre: 'Cine mudo', C: CineMudo},
  {id: 'cristal', nombre: 'Cristal', C: Cristal},
  {id: 'comic', nombre: 'Cómic', C: Comic},
];
