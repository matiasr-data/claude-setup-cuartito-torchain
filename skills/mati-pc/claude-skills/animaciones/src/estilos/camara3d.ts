// La cámara de la plastilina (3D): con este ángulo de visión y a esta distancia, el plano z = 0 sale 1:1 en el lienzo de
// 1080 × 1920, así lo que está en ese plano cae en el mismo sitio y del mismo tamaño que en los estilos planos.
export const FOV = 30;
export const D = 960 / Math.tan((FOV / 2) * (Math.PI / 180)); // la distancia de la cámara al plano z = 0
