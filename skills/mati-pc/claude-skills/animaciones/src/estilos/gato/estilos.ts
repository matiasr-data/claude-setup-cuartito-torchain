import type React from 'react';
import type {IdEstilo} from '../orden';
import {Acuarela} from './Acuarela';
import {Anime} from './Anime';
import {Ascii} from './Ascii';
import {Holograma} from './Holograma';
import {Isometrico} from './Isometrico';
import {Neon} from './Neon';
import {Papel} from './Papel';
import {PlanoAzul} from './PlanoAzul';
import {Plastilina} from './Plastilina';
import {Termica} from './Termica';

// LA ESCENA DEL GATO EN LOS 10 ESTILOS. El gato mira la taza, te mira, la empuja mirándote a cámara y a los 2,7 s la taza cae y se rompe (./escena.ts).
export const ESTILOS_GATO: Record<IdEstilo, React.FC<{t: number}>> = {
  holograma: Holograma, neon: Neon, papel: Papel, isometrico: Isometrico, 'plano-azul': PlanoAzul,
  termica: Termica, anime: Anime, ascii: Ascii, acuarela: Acuarela, plastilina: Plastilina,
};
