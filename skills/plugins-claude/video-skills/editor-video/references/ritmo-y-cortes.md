# Ritmo y cortes

## El ritmo lo da el cambio de TIPO de plano, no la tijera
El espectador no se cansa del encuadre: se cansa de recibir el mismo tipo de información. Si cada pocos segundos cambia qué clase de cosa está mirando, no hacen falta cortes rápidos para mantenerlo enganchado. Es más barato de ver y más caro de producir, y eso es lo que se lee como profesional.

[MEDIDO] Un vídeo de referencia con millones de visitas cortaba cada 4,85 s de media (3,7 s de mediana) y solo el 16 % de sus planos bajaba de 2 s. No era un vídeo de corte rápido. Lo que no hacía nunca era poner dos planos seguidos del mismo tipo.

## Nunca dos planos consecutivos del mismo tipo
Esta regla convierte una decisión difícil ("¿cuándo corto?") en una fácil ("¿qué tipo toca ahora?"). Tipos por defecto (el perfil puede redefinirlos):

| Tipo | Función |
|---|---|
| Cara a cámara | El hilo |
| Pantalla / captura | El cómo |
| B-roll de metáfora | La comparación |
| B-roll real | La prueba |
| Cortinilla de capítulo | El cambio de tema |

Ejemplo de secuencia: cara → pantalla → cara → b-roll → cortinilla → cara…

Si el bruto es un plano fijo a cámara y no hay material, consigue la variedad con gráficos a pantalla completa, capturas e interfaces dibujadas, no con cortes que no existen.

## Limpieza del bruto
- **Quédate con la última toma buena.** En repeticiones, falsos arranques y frases fallidas, elimina las anteriores: al repetir, la persona ya sabe lo que quiere decir y la última toma es la más limpia de ritmo e intención.
- **Dos tipos de hueco, dos pasadas.** El hueco largo (más de ~2 s) es aire muerto y se quita. El micro-hueco (~0,2 s) que queda en la unión de dos cortes se percibe como tropezón, no como silencio: revisa las uniones aparte. Quitar solo los largos deja un vídeo correcto que suena a trompicones.
- **Muletillas fuera** ("eh", "o sea") salvo que formen parte del estilo del creador.
- El corte termina cuando el transcript de lo conservado se lee como un discurso limpio y continuo.

## Excepciones
- **Vlog: el hueco sin voz no es silencio, es el mejor material.** Paisajes, actividades, ambiente: son el contenido. Un cortador por silencio se los lleva. Conserva unos segundos de cada hueco (repartidos a los dos lados) y revisa que no desaparezcan los momentos visuales clave.
- **Hay vídeos que no se cortan.** Si el creador graba el bruto como montaje final, no cortes: tu trabajo es la capa de gráficos, sonido y subtítulos encima. Pregúntalo en la configuración del perfil.

## Ritmo por tramos
El gancho va a densidad de `gancho`; el cuerpo, a la del formato (ver `formatos.md`). Dentro del cuerpo, el ritmo sigue al contenido: explicación densa → más pausado; enumeraciones y energía → más rápido; frase clave → una pausa breve antes para darle peso.

## Precisión técnica del corte
- **Un corte solo cae en un silencio**, nunca a mitad de palabra. Usa las marcas de tiempo por palabra y deja unas centésimas de margen al principio y al final de cada palabra para no comerte su ataque ni su cola.
- **Una risa no es un silencio.** Antes de quitar un hueco, mide el nivel del audio: si hay sonido (risa, reacción, respiración expresiva), es contenido y se queda.
- **Corta con trim + concat** de vídeo y audio juntos, no con filtros de selección de fotogramas, que desincronizan el audio con el tiempo.
