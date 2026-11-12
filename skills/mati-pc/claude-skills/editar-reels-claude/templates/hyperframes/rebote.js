// El rebote «estilo Apple» de Viegas Estudio (expresión rebote-al-llegar de After Effects), como ease de GSAP.
//   valor + vel · fuerza · sin(rebotes · t · 2π) / e^(frenado · t)
// Los keyframes LLEGAN CON VELOCIDAD (curva u²) y el rebote hace el final.
// Dura «llegada + 0,8 s»: con 2,5 rebotes/s el seno vuelve a 0 justo al terminar (sin salto final).
const rb = (vel, fuerza, rebotes, frenado, t) => vel * fuerza * Math.sin(rebotes * t * 2 * Math.PI) / Math.exp(frenado * t);
const VB = (fuerza = 0.12, llegada = 0.3) => (p) => {
  const tot = llegada + 0.8, t = p * tot;
  if (t < llegada) { const u = t / llegada; return u * u; }
  return 1 + rb(2 / llegada, fuerza, 2.5, 5, t - llegada);
};

// Valores probados:
//   tarjetas de cristal ......... duration: 1.1, ease: VB(0.07)
//   escalas grandes (desde 0,3) .. duration: 1.1, ease: VB(0.045)
//   saltos de la mascota ......... duration: 1.12, ease: VB(0.04, 0.32)
//   TEXTOS (subtítulos) .......... SIN rebote: duration: 0.3-0.45, ease: "power3.out"
//
// Ejemplo:
//   tl.fromTo("#mi-tarjeta", { opacity: 0, y: 110, scale: .92, filter: "blur(24px)" },
//             { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.1, ease: VB(0.07) }, 2.38);
//   tl.to("#mi-tarjeta", { opacity: 0, y: -50, filter: "blur(16px)", duration: 0.22, ease: "power2.in" }, 4.40);
//
// Zooms de cámara: NUNCA cortes. Tween con curva sobre un contenedor sin tiempo (#zoom) que envuelve el vídeo:
//   tl.fromTo("#zoom", { scale: 1 }, { scale: 1.05, duration: 1.6, ease: "power2.inOut" }, 7.0);  // acercar hacia la idea
//   tl.fromTo("#zoom", { scale: 1.05 }, { scale: 1, duration: 1.4, ease: "power2.inOut" }, 9.3);  // alejar
//   #zoom { transform-origin: 50% 30%; }   máximo 5-10 %
