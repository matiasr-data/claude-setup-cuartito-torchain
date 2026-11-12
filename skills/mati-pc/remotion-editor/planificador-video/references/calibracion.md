# Calibración: cómo el planificador mejora con cada vídeo

Un buen método da un buen punto de partida. Lo que lo vuelve excelente es ajustarse, vídeo a vídeo, al criterio del creador y de los mejores editores. Para eso hay dos fuentes de ejemplos, y las dos se leen **antes** de puntuar.

## 1. Las correcciones del creador
Guárdalas en `planificacion/ejemplos.md`, en la raíz del proyecto (créalo si no existe). Cada vez que el creador corrija un plan (quite una animación, añada otra, cambie un tipo de visual o un zoom), añade una entrada:

```markdown
## <fecha> · <vídeo>
- Frase: "<texto literal>"
- Plan propuesto: <qué propusiste y con qué nota>
- Corrección: <qué decidió el creador>
- Por qué: <su motivo, con sus palabras si lo dio>
- Regla que se deduce: <en una línea, general>
```

Cómo usarlas:
- Si una frase nueva se parece a un ejemplo corregido, aplica la corrección.
- Si varias correcciones apuntan en la misma dirección (por ejemplo, siempre quita las animaciones de metáforas), ajusta el umbral o la regla y dilo en el plan: "Ajuste por calibración: …".
- Cuando una regla deducida se repita en tres vídeos o más, propón al creador subirla a la skill.

## 2. Lo que animan los mejores editores
Cuando se analiza un vídeo de referencia (el analizador de `editor-video`), se genera `referencias/<nombre>/frases-animadas.md`: qué frases animó ese editor, cuáles dejó sin nada y con qué tipo de visual. Úsalas igual que las correcciones, pero con menos peso: el gusto del creador manda sobre el de la referencia.

Antes de tratar un patrón de varias referencias como regla, comprueba que vienen de editores distintos. Tres vídeos copiados entre sí son una sola fuente.

## Qué no se calibra
Las prohibiciones del perfil del creador y las reglas de branding no se negocian con ejemplos: se cumplen siempre.
