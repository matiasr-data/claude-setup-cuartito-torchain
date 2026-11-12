import {Config} from '@remotion/cli/config';

Config.setOverwriteOutput(true);
// Cuadros en PNG y color en rango normal BT.709: con lo que trae por defecto (JPEG, rango completo) los colores pueden verse
// lavados u oscuros según el móvil.
Config.setVideoImageFormat('png');
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setCrf(16);
// La plastilina es 3D (Three.js): con «angle» la GPU la pinta bien también al sacar el vídeo.
Config.setChromiumOpenGlRenderer('angle');
