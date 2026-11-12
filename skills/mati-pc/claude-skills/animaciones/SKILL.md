---
name: animaciones
description: Anima una escena en uno de 20 estilos con su código exacto. Los 10 del gato que tira la taza (holograma, neón cyberpunk, papel recortado, isométrico, plano azul, cámara térmica, anime, Matrix, acuarela y plastilina) y los 10 de la bola de papel a la papelera (pixel art, bloques de juguete, pizarra de tiza, años 30, vidriera, tinta china, grabado japonés, cine mudo, cristal y cómic). Úsala cuando la persona escriba /animaciones, pida uno de estos estilos, quiera ver el gato o la bola de papel en un estilo o quiera pintar su propia escena (su producto, su mascota, su negocio) en uno de ellos.
argument-hint: "[estilo] [tu escena]"
---

# 20 estilos de animación

Un proyecto de Remotion (React, SVG y canvas; los 3D, en Three.js) con 20 estilos en dos escenas:

- **Del 1 al 10, el gato:** mira la taza, te mira, la empuja y a los 2,7 s la taza cae y se rompe.
- **Del 11 al 20, la bola de papel:** un muñeco de bloques, sentado en su silla de oficina, lanza una bola de papel a la papelera.
  Hay 10 lanzamientos: falla 9 (rebota en el borde, se queda corta, choca con la lámpara…) y el 10 entra.

Cada estilo es una **piel**: el papel, los colores, el trazo, las letras, los rótulos y cómo cuenta el golpe. El código de cada
estilo es el exacto del vídeo, así que no hay que inventar nada: se copia la piel y se cambia lo que pasa.

**La carpeta de esta skill** es la que sale arriba como «Base directory». Aquí la llamamos `SKILL_DIR`.

## Antes de nada (una vez por conversación)

1. `node --version` tiene que dar 18 o más. Si no hay Node, instálalo y vuelve a comprobar:
   - Mac: `brew install node` (o el instalador de https://nodejs.org, versión LTS).
   - Windows: `winget install OpenJS.NodeJS.LTS` (después, cierra y abre la terminal).
2. Si en `SKILL_DIR` no está `node_modules`, corre `npm install` ahí (unos 20 s).
3. La primera vez que sacas un vídeo, Remotion baja su navegador (unos 100 MB) solo. Dile a la persona que espere.

## Los 20 estilos

**Parte 1 · el gato** (6 s; la escena, en `src/estilos/gato/escena.ts`)

| Nº | Estilo | Para sacarlo | Su piel | Su código |
|---|---|---|---|---|
| 1 | Holograma | `holograma` | `piel/holograma.md` | `src/estilos/gato/Holograma.tsx` |
| 2 | Neón cyberpunk | `neon` | `piel/neon.md` | `src/estilos/gato/Neon.tsx` |
| 3 | Papel recortado | `papel` | `piel/papel.md` | `src/estilos/gato/Papel.tsx` (+ `PapelGato`, `PapelCocina`, `PapelTintas`, `PapelCorte`, `../PapelGeo`) |
| 4 | Isométrico | `isometrico` | `piel/isometrico.md` | `src/estilos/gato/Isometrico.tsx` (+ `../IsometricoMotor`) |
| 5 | Plano azul | `plano-azul` | `piel/plano-azul.md` | `src/estilos/gato/PlanoAzul.tsx` |
| 6 | Cámara térmica | `termica` | `piel/termica.md` | `src/estilos/gato/Termica.tsx` |
| 7 | Anime | `anime` | `piel/anime.md` | `src/estilos/gato/Anime.tsx` (+ `AnimeGato`, `AnimeCocina`, `../AnimeCel`) |
| 8 | Matrix (arte ASCII) | `matrix` | `piel/matrix.md` | `src/estilos/gato/Ascii.tsx` (+ `AsciiMotor`) |
| 9 | Acuarela | `acuarela` | `piel/acuarela.md` | `src/estilos/gato/Acuarela.tsx` |
| 10 | Plastilina (3D) | `plastilina` | `piel/plastilina.md` | `src/estilos/gato/Plastilina.tsx` (+ `PlastilinaGato`, `PlastilinaCocina`, `PlastilinaTaza`, `../PlastilinaArcilla`) |

**Parte 2 · la bola de papel** (2 s, el lanzamiento entero; la escena, en `src/estilos/bola/escena.ts`)

| Nº | Estilo | Para sacarlo | Su piel | Su código |
|---|---|---|---|---|
| 11 | Pixel art | `pixel-art` | `piel/pixel-art.md` | `src/estilos/bola/pixel/PixelArt.tsx` (+ `PixelMotor`, `PixelFuente`, `PixelDecorado`, `PixelMuneco`, `PixelPiezas`) |
| 12 | Bloques de juguete (3D) | `bloques` | `piel/bloques.md` | `src/estilos/bola/Bloques.tsx` (+ `BloquesDecorado`, `BloquesMuneco`, `BloquesPiezas`) |
| 13 | Pizarra de tiza | `pizarra` | `piel/pizarra.md` | `src/estilos/bola/pizarra/Pizarra.tsx` (+ `tiza`, `Cuarto`, `Actores`, `Notas`, `cuerpos`) |
| 14 | Años 30 | `anos-30` | `piel/anos-30.md` | `src/estilos/bola/anos30/Anos30.tsx` (+ `tinta`, `partes`, `Muneco30`, `Decorado30`, `Efectos30`, `Pelicula30`) |
| 15 | Vidriera | `vidriera` | `piel/vidriera.md` | `src/estilos/bola/vidriera/Vidriera.tsx` (+ `vidrio`, `geo`, `VidrieraFondo`, `VidrieraMuneco`, `VidrieraObjetos`) |
| 16 | Tinta china | `tinta-china` | `piel/tinta-china.md` | `src/estilos/bola/tinta/TintaChina.tsx` (+ `pincel`, `papel`, `cuarto`, `figuras`, `geometria`, `caligrafia`) |
| 17 | Grabado japonés | `grabado-japones` | `piel/grabado-japones.md` | `src/estilos/bola/ukiyoe/GrabadoJapones.tsx` (+ `imprenta`, `fondo`, `figuras`, `geometria`) |
| 18 | Cine mudo | `cine-mudo` | `piel/cine-mudo.md` | `src/estilos/bola/cinemudo/CineMudo.tsx` (+ `pintura`, `decorado`, `muneco`, `geometria`, `pelicula`, `rotulo`) |
| 19 | Cristal (3D) | `cristal` | `piel/cristal.md` | `src/estilos/bola/cristal/Cristal.tsx` (+ `CristalEstudio`, `CristalLuz`, `CristalMuneco`, `CristalPared`, `CristalPiezas`) |
| 20 | Cómic | `comic` | `piel/comic.md` | `src/estilos/bola/comic/Comic.tsx` (+ `ComicTrama`, `ComicDecorado`, `ComicMuneco`, `ComicRotulos`) |

Lo que pasa en cada escena, sin estilo: `src/estilos/gato/escena.ts` y `src/estilos/bola/escena.ts`. Las ayudas de movimiento:
`src/comun/curvas.ts`. Los nombres valen con tilde o sin ella y en mayúsculas o minúsculas («Neón» = `neon`, «Matrix» = `matrix`,
«Años 30» = `anos-30`, «Grabado japonés» = `grabado-japones`, «Cómic» = `comic`).

## A · El gato en un estilo (`/animaciones plano azul`)

Desde `SKILL_DIR`, y el vídeo a la carpeta donde está trabajando la persona (su carpeta actual, no la de la skill):

```
npx remotion render src/index.ts plano-azul "<su carpeta>/gato-plano-azul.mp4"
```

- Son 6 s en vertical, 1080 × 1920 y 60 cuadros por segundo. Sale igual que en el vídeo.
- Para verlo rápido: `--scale=0.5`. En 4K: `--scale=2`.
- Para mirar un cuadro antes: `npx remotion still src/index.ts plano-azul "<su carpeta>/foto.png" --frame=190` (el golpe es
  hacia el cuadro 190).
- Para verlo en vivo y tocarlo: `npx remotion studio src/index.ts`.

## A · La bola de papel en un estilo (`/animaciones cine mudo`)

Igual que el gato, desde `SKILL_DIR`:

```
npx remotion render src/index.ts cine-mudo "<su carpeta>/bola-cine-mudo.mp4"
```

- Son 2 s (el lanzamiento entero) en vertical, 1080 × 1920 y 60 cuadros por segundo.
- **Cada estilo sale con su lanzamiento del vídeo:** el 11 (pixel art) con el 1… el 20 (cómic) con el 10, el que entra. Para otro,
  `--props='{"intento":3}'` (del 1 al 10): `npx remotion render src/index.ts cine-mudo "<su carpeta>/bola.mp4" --props='{"intento":10}'`.
- En el vídeo, cada estilo se veía de 0,2 a 1,8 s (la bola ya viene en el aire). Para lo mismo: `--frames=12-107`.
- **Para la foto, el golpe de cada intento** (cuándo toca por primera vez y el primer cuadro en que se ve). Los rótulos (el cartel
  del cine mudo, el «¡FALLO!» del pixel art, el «¡DENTRO!» del cómic…) salen después del golpe: para una foto con el rótulo ya
  entero, hacia 1,1–1,4 s (cuadros 66–84).

| Intento | Qué pasa | Toca en | Cuadro |
|---|---|---|---|
| 1 | Rebota en el borde y sale | 0,64 s | 39 |
| 2 | Se queda corta | 0,60 s | 36 |
| 3 | Se pasa, pega en la pared y cae detrás | 0,74 s | 45 |
| 4 | Da vueltas en el borde… y cae fuera | 0,56 s | 34 |
| 5 | Entra… y sale de un bote | 0,72 s | 44 |
| 6 | Pega en el borde y vuelve hacia él | 0,66 s | 40 |
| 7 | Bota en el suelo y pasa por el lado | 0,50 s | 30 |
| 8 | Choca con la lámpara y cae | 0,44 s | 27 |
| 9 | Se queda quieta en el borde… y cae fuera | 0,70 s | 42 |
| 10 | ¡DENTRO! | 0,80 s | 48 |

  `npx remotion still src/index.ts cine-mudo "<su carpeta>/foto.png" --frame=27`

## B · Su escena en un estilo (`/animaciones neón: mi perro robando un calcetín`)

1. **Lo que falta, en UN mensaje.** Qué pasa (quién, qué hace y **el momento**: el golpe, la sorpresa, lo que se quiere ver
   pasar), cuánto dura (6 s si no dice) y el estilo. Si no da un momento, propónle uno: cada estilo tiene su forma de contarlo.
2. **Lee la ficha del estilo entera** (`piel/<estilo>.md`) y después su código. La piel se copia tal cual: los colores, los
   filtros, el fondo, el trazo, las letras, los rótulos y el ritmo. No la reinventes: es lo que hace que se vea igual que el vídeo.
3. **Su proyecto, en su carpeta.** Crea `<su carpeta>/<nombre-corto>/` y copia ahí desde `SKILL_DIR`: `package.json`,
   `tsconfig.json`, `remotion.config.ts`, `AVISOS.md` y las carpetas `src/` y `public/` enteras. Corre `npm install` dentro. Así
   su trabajo queda en su carpeta y la skill no se toca.
4. **La escena, aparte del estilo**, como el gato o la bola, en una carpeta hermana de `gato/` y `bola/`: `src/estilos/<su-escena>/`.
   - `escena.ts`: lo que pasa (las piezas y sus posiciones en 1080 × 1920, todo calculado del tiempo `t`), como
     `src/estilos/gato/escena.ts`. Si su escena tiene varias versiones del mismo momento (como los 10 lanzamientos), mira
     `src/estilos/bola/escena.ts`: ahí todo sale de `lanzamiento(intento, t)`, y cada estilo recibe `{intento, t}`.
   - `<Estilo>.tsx`: **una copia del archivo del estilo** (y de sus ayudantes de `gato/`, si los tiene) donde se conserva la piel
     y se cambian el gato, la taza y la cocina por sus cosas, dibujadas con las mismas ayudas (los mismos trazos, filtros y
     materiales de la ficha).
   - Los imports: `../../comun/curvas`, `../formas` y `../camara3d` siguen valiendo (misma profundidad); las ayudas de geometría
     que el estilo tomaba de `./escena` del gato (`poli`, `curva`, `elipse`, `rot`, `suma`…) se importan de `../gato/escena`.
   - **Si copia un estilo de la bola** (vive en su carpeta, un piso más abajo: `src/estilos/bola/cinemudo/…`), en su escena sus
     imports `../../../comun/curvas` pasan a `../../comun/curvas`, y lo que tomaba de `../escena` (`proyecta`, las medidas, el
     esqueleto del muñeco…) se importa de `../bola/escena` o se rehace en su `escena.ts`. Los bloques, que están en la raíz de
     `bola/`, toman la escena de `./escena`.
   - En `src/Root.tsx`, una composición nueva con su nombre. El `Estilo` que ya está solo pinta los del gato: la suya va con su
     propio envoltorio, que le pasa el segundo `t`:
     ```tsx
     const MiEscena: React.FC = () => {
       const frame = useCurrentFrame();
       const {fps} = useVideoConfig();
       return <AbsoluteFill style={{background: '#000'}}><PlanoAzulMovil t={frame / fps} /></AbsoluteFill>;
     };
     // y dentro de Root:
     <Composition id="movil-plano-azul" component={MiEscena} width={1080} height={1920} fps={60} durationInFrames={360} />
     ```
   - **Dónde cabe su escena:** cada estilo tiene sitios ocupados (la cabecera, las cajas de abajo, el medidor, el visor…; la
     ficha dice dónde). Dibuja lo suyo en el hueco que dejan, no encima.
   - **Si su objeto de lado no se lee** (un móvil, una carta, una tarjeta), dibújalo de frente o en dos vistas, como un plano:
     de lado para el movimiento y de frente para lo que se tiene que leer.
5. **Primero una foto**, en el segundo del momento: míralo tú antes de enseñárselo. Si en ese momento se escribe un texto,
   sácala 0,3 s después de que termine (si no, sale cortado y parece un error que no es). Después el vídeo en baja (`--scale=0.5`) y,
   cuando le guste, el final.
6. **Los retoques, con sus palabras** («más lento», «el perro más grande», «más brillo»).

Para ahorrar cuota: un estilo cada vez (si quiere varios, el segundo cuando el primero esté aprobado), no reescribas lo que ya
funciona y no leas los 20 estilos para hacer uno.

## Reglas

- **El mismo segundo da siempre el mismo cuadro:** todo sale de `t`. Nada de `Math.random()`: `rng(semilla)` de `curvas.ts`.
- **En vertical, 1080 × 1920.** Lo importante, entre x 60 y x 1020: al tocar un Reel, Instagram corta los lados.
- **Los 3D (la plastilina, los bloques y el cristal) y los que pintan con WebGL (la tinta china y el cine mudo)** necesitan
  `--gl=angle`, que ya va en `remotion.config.ts`.
- **Las letras** vienen de Google Fonts: la primera vez hace falta internet. Dos van dentro: la del sello de la tinta china (en
  `caligrafia.ts`) y la del rótulo del cine mudo (`public/fuentes/`).
- **Los archivos que lista `AVISOS.md`** están adaptados de código de otros con licencia MIT: si se copian, su aviso va con ellos.
- Los ids de los filtros SVG tienen que ser únicos en la página: si se pintan dos estilos a la vez, cada uno con los suyos.

## Si algo falla

- «Cannot find module»: falta `npm install` en esa carpeta.
- La plastilina, los bloques, el cristal, la tinta china o el cine mudo salen negros o vacíos: que no falte
  `Config.setChromiumOpenGlRenderer('angle')` en `remotion.config.ts`.
- El cine mudo se queda esperando la letra: falta `public/fuentes/PlayfairDisplay-Black.ttf` en esa carpeta.
- Algo sale cortado en el neón o el holograma: sus filtros cubren una zona fija (lo dice su ficha); agrándala si lo nuevo se sale.
