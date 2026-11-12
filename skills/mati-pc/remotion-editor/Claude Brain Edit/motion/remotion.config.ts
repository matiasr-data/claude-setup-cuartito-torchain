import {Config} from '@remotion/cli/config';

// Los gráficos se superponen en CapCut: siempre con alfa (ProRes 4444).
Config.setVideoImageFormat('png');
Config.setPixelFormat('yuva444p10le');
Config.setCodec('prores');
Config.setProResProfile('4444');
