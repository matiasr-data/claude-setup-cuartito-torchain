# 6 · Cámara térmica
**En una frase:** la escena vista por una cámara de infrarrojos: cada cosa se pinta en gris según lo caliente que está, un filtro de sensor lo pasa a la paleta «hierro» y encima va un visor nítido con miras, escala y lecturas.

## La piel (igual en cualquier escena)
- **La técnica (lo que lo hace todo): se pinta en temperaturas, no en colores.**
  - Cada cosa lleva una temperatura en °C. `aV(°C)` la pasa a un valor de 0 a 1 (`T_MIN`, 14 °C, es 0; `T_MAX`, 40 °C, es 1) y `gris(v)` la pinta en gris (`rgb(n,n,n)`). Más caliente, más claro; de 40 °C para arriba, blanco.
  - Todo eso va dentro de `<g filter="url(#tt-sensor)">`, que hace de sensor: desenfoca 1,5 px, suma un grano que cambia 30 veces por segundo (`semilla`), suma unas bandas horizontales fijas, saca la luminancia y la pasa por `TABLA` (65 valores por canal sacados de `HIERRO`), que la vuelve color.
  - Por eso, para pintar cualquier escena basta con decir cuánto calienta cada cosa: el color sale solo. Y como todo es gris, un degradado es un cambio de calor y la opacidad mezcla temperaturas.
- **Colores:**
  - La paleta `HIERRO` (valor → rgb): 0 → (0, 0, 6) · 0,2 → (52, 0, 102) · 0,4 → (132, 8, 138) · 0,5 → (176, 18, 112) · 0,66 → (232, 76, 22) · 0,82 → (250, 172, 28) · 0,9 → (253, 214, 82) · 1 → (255, 255, 252). Negro, morado, rojo, naranja, amarillo y blanco.
  - El visor: `BLANCO` `#FBF8FF` (marcos, miras y letras); `AMBAR` `#FFE45C` (lo que importa ahora: la mira en el momento, el MÁX y el estado); `#FF3B3B` el punto de REC (apagado, al 0,22); las cajas, `rgba(20, 0, 44, 0.5)`; la sombra de las letras, `SOMBRA` (`rgba(12, 0, 28, 0.72)`, 5 px por detrás); y `#2A0050`, la letra sobre la caja blanca del aviso.
- **Letras:** `MONO` (Share Tech Mono), solo en el visor y en mayúsculas.
- **El trazo / la luz / el material:**
  - No hay líneas: manchas de gris con degradados, el centro más caliente que el borde, y el borde con un trazo algo más frío (el pelo de canto).
  - Cada grupo pasa por un desenfoque (`tt-b1_5`, `tt-b2_5`, `tt-b4`, `tt-b6`, `tt-b10`, `tt-b16`, `tt-b24`): 2,5 para los objetos, 4 para el escenario y de 10 a 24 para el aire y los halos.
  - El protagonista se pinta dos veces: con `tt-b24` al 0,5 (su halo de calor) y con `tt-b2_5` encima. `tg-foco` (blanco que se apaga hacia fuera) marca un punto caliente.
  - Lo que se va deja su calor: una mancha tibia que se enfría con `enfria`.
- **El fondo y el escenario:** pared de 0,37 arriba a 0,3 abajo (`tt-pared`), suelo de 0,22 a 0,07 (`tt-suelo`) y la madera más fría (`MESA`, 0,17) para que se recorte. Detrás del protagonista, algo frío (la ventana, de 0,02 a 0,1) para que resalte, y una fuente de calor al fondo (el radiador, 0,5 y 0,68, con su aire caliente que sube). La viñeta `tt-vineta` (negro hasta el 0,4 en los bordes) va dentro del sensor: enfría las esquinas.
- **Los rótulos y adornos fijos** (el visor, nítido y fuera del filtro):
  - Cuatro esquinas de 58 px; «● REC» y la línea de la cámara («CÁM IR 02 · … · HIERRO») arriba a la izquierda; la fecha, la hora y «CUADRO nnnn · 60 Hz» a la derecha.
  - La mira P1 (círculo de 34 con cuatro marcas y su caja «P1 xx,x °C») en lo más caliente del sujeto, sin taparle la cara. La mira P2 (cuadro de trazos de 68 con cruz) en el objeto que importa.
  - La escala a la derecha (en 968, 400; 26 × 600, con `tt-escala`): marcas cada 5 °C, «40,0 °C» y «14,0 °C», y las flechas P1 y P2 a su temperatura («P2 ▲» si se sale).
  - Abajo: MÁX, MÍN, MEDIA, «EMIS. 0,95» y «SUJETO 01 · … · ESTADO». Los números, con un decimal y coma (`fmt`).
- **El movimiento:** fluido, cuadro a cuadro. El grano del sensor cambia 30 veces por segundo y las bandas no se mueven. Las lecturas se refrescan 4 veces por segundo (`q`), con un poco de azar de `rng` en cada refresco. El punto de REC se enciende y se apaga cada medio segundo y el contador de cuadros sube 60 por segundo. La cámara no tiembla.
- **El momento:** se cuenta con calor.
  - Mientras la taza está en la mesa, P2 la sigue en blanco. Al caer, P2 se pone en `AMBAR` y el café sale en un arco blanco (núcleo a 1 y halo a 0,95).
  - En el golpe, un fogonazo de calor (`tg-foco`, de radio 60 a 260 y de 0,75 a 0 en 0,35 s). P2 salta al charco y su caja pasa a «DERRAME xx,x °C» en blanco, encendiéndose y apagándose cada 1/8 s entre 0,1 y 0,7 s.
  - Después todo se enfría a la vista (`enfria`): el charco, las gotas y los trozos van del blanco al amarillo, al rojo y al morado, y el estado del sujeto se pone en `AMBAR` («INOCENTE»).

## Dónde está en el código
- **Piel (se reutiliza tal cual)**, en `src/estilos/gato/Termica.tsx`:
  - `T_MIN`, `T_MAX`, `aV` (°C → 0–1), `gris` (0–1 → gris) y `fmt` (un decimal con coma).
  - `HIERRO`, `enHierro` (valor → rgb), `TABLA` (la paleta para el filtro) y `hex` (valor → color, para la escala).
  - `PARED_ARRIBA`, `PARED_ABAJO`, `SUELO_ATRAS`, `SUELO_DELANTE` y `MESA`: las temperaturas de la sala.
  - En el `<defs>`: `tt-sensor` (el sensor), `tt-b1_5` … `tt-b24` (los desenfoques), `tt-pared`, `tt-suelo`, `tt-vineta`, `tt-escala` y `tg-foco`.
  - `SOMBRA`, `BLANCO`, `AMBAR`, `MONO` y `Visor` (marco, REC, escala, miras y lecturas; sus textos y `estadoSujeto` son de la escena).
  - `enfria(t0, tau)`, dentro de `Termica`: baja de 1 a 0 con el tiempo, para enfriar lo que haga falta.
- **Ayudas:** `E`, `clamp`, `mix`, `p` y `rng` de `src/comun/curvas.ts`; `poli`, `curva`, `elipse`, `cinta`, `rot` y `suma` de `src/estilos/gato/escena.ts`; `capsula` de `src/estilos/formas.ts`.
- **Lo del gato y la taza (lo que se rehace con tu escena):** `GatoCalor` y su `<g id="tt-gato">`, `estadoSujeto`, `tCafe`, `mira2`, `tMax`, `huellaTaza`, `huellasPatas` y los degradados `tt-cristal`, `tt-taza`, `tt-calorRad` y `tt-charco`; en `Termica`, la ventana, el radiador, la mesa, el comedero, el vapor, la taza, el café, el charco, las manchas, los trozos y el fogonazo en `IMPACTO`. Y lo que viene de `src/estilos/gato/escena.ts`: `gato`, `taza`, `piezasTaza`, `cafe`, `trozos`, `vapor`, `TRANSFORMA_GATO`, `enMundo`, `FONDO_SUELO` (donde se juntan pared y suelo) y las medidas de la sala.

## Pintar tu escena en este estilo
1. Copia `src/estilos/gato/Termica.tsx` a `src/estilos/<tu-escena>/Termica.tsx` (los imports, como dice `SKILL.md`) y deja la piel: `aV`, `gris`, `HIERRO`, `TABLA`, el `<defs>` del sensor, los desenfoques, la pared, el suelo, la viñeta y el `Visor`. Pon tu línea de horizonte en vez de `FONDO_SUELO`.
2. Haz la lista de temperaturas de tu escena en °C y pinta cada cosa con `gris(aV(°C))`. Lo vivo y lo que funciona (personas, animales, motores, comida, pantallas), arriba; el cristal, el metal y lo de fuera, abajo. Guarda el blanco para lo más caliente del momento.
3. Pinta cada objeto con manchas de gris: un degradado con el centro más caliente, el borde con un trazo algo más frío y el grupo dentro de un `tt-b*`. Pon algo frío detrás de tu protagonista y dale su halo (dos `<use>`: `tt-b24` al 0,5 y `tt-b2_5`).
4. Lo que pasa, cuéntalo como calor: algo que se calienta o se enfría con `enfria(t0, tau)`, una huella tibia donde estuvo algo y un `tg-foco` para el golpe.
5. El visor: P1 a lo más caliente de tu protagonista, P2 al objeto del momento (en `AMBAR` cuando pasa), y cambia la línea de la cámara, «SUJETO 01 · …» y los estados de `estadoSujeto`.
6. El orden: dentro de `<g filter="url(#tt-sensor)">`, la pared → lo frío del fondo → las fuentes de calor → suelo y muebles → las huellas → los objetos → el protagonista (halo y él) → los efectos → `tt-vineta`, la última. El `Visor`, fuera del filtro y al final.

**Errores fáciles:**
- Pintar con un color dentro del sensor: el filtro solo mira la luminancia, así que un rojo sale como algo frío. Dentro, solo `gris()`.
- Meter el visor dentro del filtro: las letras salen borrosas y teñidas de hierro.
- Repetir ids: `tt-*` y `tg-*` valen para toda la página. `GatoCalor` usa `url(#tg-foco)`, que se define en `Termica`: si copias el dibujo solo, pierde su punto caliente. Y `tt-sensor` mide 1080 × 1920 (`userSpaceOnUse`): si cambias el lienzo, cámbialo también.
