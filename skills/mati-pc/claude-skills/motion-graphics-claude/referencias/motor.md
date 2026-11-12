# API del motor (motor.js)

```html
<link rel="stylesheet" href="../motor/estilo.css">
<script src="../motor/motor.js"></script>
<script>
escena({ duracion: 5, ancho: 1920, alto: 1080, fondo: 'marca' }, (MG) => {
  // 1) crear los elementos (una sola vez)
  const t1 = MG.el(`<div class="mg-abs mg-titulo" style="font-size:110px">Hola <em>mundo</em></div>`);
  // 2) devolver la función que pinta el instante t (se llama en cada fotograma, en cualquier orden)
  return (t) => { MG.camara(t, 1, 1.08); const e = MG.entra(t1, t, 0.3, { dy: 120 }); MG.pon(t1, 300 + e.x, 400 + e.y, e.s); };
});
</script>
```

**Regla de oro:** la función de pintar depende **solo de `t`**. Nada de `Math.random()` sin semilla, de `Date.now()` ni de estado que dependa del fotograma anterior. Así cada fotograma es exacto y el render se puede hacer en paralelo.

| Función | Qué hace |
|---|---|
| `MG.el(html, padre?)` | crea un elemento dentro del mundo (`.mg-abs` = posición absoluta) |
| `MG.entra(el, t, t0, {d, dx, dy, escala0, curva, base, extra, desenfoque})` | fundido + desplazamiento + escala con curva + **desenfoque de movimiento**; devuelve `{x, y, s, p}` para `pon` |
| `MG.pon(el, x, y, s, extra)` | coloca el elemento (`translate` + `scale` + transformaciones extra) |
| `MG.camara(t, z0, z1, ox, oy)` | zoom lineal de toda la escena (la cámara nunca se para) |
| `MG.desenfoca(el, sx, sy)` | desenfoque direccional a mano (σ en px) |
| `MG.tarjeta(src, w, h, t0, {desde, bucle, fijo})` | tarjeta con un **vídeo** colocado fotograma a fotograma |
| `MG.video(src, t0, …)` · `MG.registrar(video, {...})` | vídeos sin tarjeta (texturas 3D, montajes propios) |
| `MG.texto(txt, clase, 'palabras'|'letras')` + `MG.animaTexto(el, t, t0, {paso, d, dy, curva})` | texto que entra por palabras o letras, escalonado |
| `MG.linea(d, color, ancho)` → `.dibuja(p)` | trazo SVG que se dibuja de 0 a 1 |
| `MG.contador(el, t, t0, t1, desde, hasta, {sufijo, prefijo, decimales, curva})` | número que cuenta |
| `MG.curvas.*` · `MG.k(t, a, b)` · `MG.lerp(a, b, x)` | curvas (ver curvas.md), progreso 0–1 entre a y b, interpolación |

Clases útiles (`estilo.css`): `.mg-titulo` (con `<em>` en el color de acento), `.mg-sub`, `.mg-chip`, `.mg-cristal`, `.mg-tarjeta`, `.mg-brillo`.
Fondos: `fondo: 'marca'` (rejilla y halo), `'transparente'` (para render con alfa) o ninguno.
Fondo configurable (opcional, se combina con `fondo: 'marca'`):
- `trama: { tipo: 'rejilla'|'lineas'|'puntos'|'nada', tamano: 70, intensidad: .5 }`: tamaño en px; intensidad 0–1 (1 = la de la marca). Puntos discretos: `tamano: 36, intensidad: .5`.
- `halo: .3` o `{ fuerza: .3, x: 50, y: 112 }`. `MG.halo(x, y)` lo mueve en cada fotograma (p. ej. siguiendo al elemento principal).
- `degradado: 'aurora'|'barrido'|'suave'` o `{ tipo, fuerza: .35, ciclo: 12 }`: degradado animado con el acento y el acento 2. Lo mueve el motor según t, así que el render es exacto; si `ciclo` divide la duración, el bucle cierra perfecto.
Vista previa en el navegador: abre el HTML con `?ver` al final de la dirección.

## Kit de escenas (`motor/kit-escenas.js`, auditoría 27-10-2026)
Se carga **antes** de `motor.js`: `<script src="../motor/kit-escenas.js"></script>`. No depende de nada (también sirve en escenas sin motor).

| Función | Qué hace |
|---|---|
| `MG.conecta(a, b, {forma, desde, hasta, puntoA, puntoB, color, ancho, curvatura})` → `.pinta(x)` · `.punto(u)` | línea entre dos nodos **medida en cada fotograma**: sale del borde real de `a` y llega al de `b` aunque se muevan, reboten o cambien de tamaño. `forma`: `'curva'` (por defecto), `'recta'`, `'codo'`. `desde`/`hasta`: `'auto'`, `'derecha'`, `'izquierda'`, `'arriba'`, `'abajo'`. `.punto(u)` da `{x, y}` para un pulso que viaja por la línea. Llama a `.pinta()` **después** de colocar los nodos. Solo se ve si sus nodos se ven. |
| `MG.juntos(n, t0, paso=0.08, max=0.5)` | instantes de entrada para que los `n` nodos de un diagrama entren juntos |
| `VK.icono(nombre, tam, color)` | SVG: `play`, `pausa`, `check`, `cruz`, `flecha`, `izquierda`, `arriba`, `abajo`, `mas`, `menos`, `punto`, `estrella` |
| `VK.simbolos(el)` | cambia ▶ ✓ ✕ → ← ↑ ↓ ● ★ del texto de `el` por esos SVG |
| `VK.pildora({etiqueta, texto, tono: 'cristal'|'oscuro'|'coral', icono, padre})` | píldora diseñada; `*palabra*` = palabra clave en coral |
| `VK.tarjetaVideo({miniatura, titulo, etiqueta, ancho, padre})` | tarjeta de «vídeo anterior»: miniatura limpia, play dibujado en la esquina, etiqueta y título debajo |
| `VK.duracion(T, porDefecto, nombre)` | duración desde el plan (`window.TT[escena].dur`); si falta, `comprobar` da ERROR |
| `VK.comprobar(o)` · `VK.comprobarEscena(o)` | autocomprobación (la usa `render.mjs comprobar`) |

Lo que mira `comprobar` en cada muestra (cada 0,2 s): líneas cuyo extremo no toca un nodo visible (`linea-suelta`) o llega a un nodo que aún no se ve · texto sobre la cara / zona prohibida (`--cara`) o fuera de la zona segura (`--zona reel|youtube`) · texto y cajas cortados por el borde sin moverse · textos que se pisan · caracteres que salen como «□» o invisibles · fuentes que no carga · vídeos que no cargan · nodos de un diagrama que salen de uno en uno · duración distinta del plan. ERROR = no se renderiza; aviso = míralo en la hoja.
Una línea decorativa que no une nodos: ponle `data-libre` (o a su `<svg>`) y no se comprueba.
