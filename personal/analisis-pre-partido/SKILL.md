---
name: "analisis-pre-partido"
description: "Usar antes de predecir un partido de fútbol o recomendar apuestas: checklist de contexto, bajas de ambos equipos por rol, escenarios, pre-mortem y post-mortem."
---

# Análisis pre-partido (protocolo de Mati)

Antes de dar probabilidades o recomendar una apuesta, seguir TODOS los pasos. El detalle y el registro de errores están en el doc del proyecto `modelo/protocolo-pre-partido.md` (leerlo si está disponible) y los multiplicadores en `modelo/factores_ajuste.py`.

## A. Contexto
- Competencia y serie: en una vuelta, mirar el resultado Y las estadísticas de la ida (remates, al arco, xG, córners).
- Forma de los dos equipos con xG, no solo resultados.
- Calendario: partido más importante en <=4 días -> posible rotación.
- Localía calibrada: Europa x1,25, Argentina x1,30, Brasil x1,46. Altitud y viaje.
- Árbitro: amarillas y penales por partido. Sin dato -> no apostar tarjetas.

## B. Bajas de LOS DOS equipos, por rol
Para cada baja responder:
1. Qué pierde el equipo (goles, córners, posesión, defensa).
2. Cómo cambia su planteo.
3. Cómo responde el rival (se anima, presiona, carga el área).
Máximo 30% de ajuste total por bajas.

## B2. Método "con / sin" ajustado por el rival
Cada vez que falta un jugador clave o un equipo cambia de formación (o el técnico suele cambiarla contra rivales fuertes):
1. Buscar los partidos anteriores SIN ese jugador o CON esa formación (alineaciones de Sofascore, temporada actual y anterior).
2. Para cada uno, calcular lo esperado contra ESE rival (cuota de cierre o Elo -> goles, córners, tiros al arco esperados).
3. Rendimiento sobre lo esperado = lo que hizo - lo que tocaba. No vale "sin él le ganó 4-0 a un rival débil".
4. Comparar el promedio sin vs con el jugador: esa diferencia es el efecto, ya descontado el rival.
5. Muestra chica = poco peso: peso de los datos = n / (n + 10); el resto, el multiplicador por rol de base.
6. Explicarlo a Mati en palabras simples: cuántas veces pasó, contra quién, cómo le fue y cuánto cambia la predicción.

## C. Mercado como sensor
- Comparar cuota de apertura y actual; si se movió >10%, averiguar por qué antes de apostar.
- Si el modelo y la casa difieren mucho, sospechar primero del modelo.
- Corregir sesgos: la casa sobrevalora al no favorito; en Brasil subvalora al local favorito.

## D. Escenarios (obligatorio)
Correr al menos 3: base, riesgo de formación, riesgo del rival.
- Robusta: EV >= +5% en la mayoría de escenarios -> stake normal.
- Frágil: EV positivo solo en el base -> esperar formación oficial.
Decir explícitamente de qué depende cada apuesta.

## E. Pre-mortem
Escribir 2 formas en que la apuesta puede perder. Si alguna es probable y no está en el modelo, bajar stake o no apostar.

## F. Formación oficial (~60' antes)
Confirmar/descartar escenarios; si la formación es distinta a la habitual, aplicar B2 y recalcular.

## G. Post-mortem
- Resultado, Brier, CLV.
- Clasificar cada error: proceso (regla nueva), modelo (hipótesis a medir con datos), varianza (no cambiar nada).
- Un partido nunca es una regla: es una hipótesis.

## Stakes
Simples, EV >= +5%. Robusta con prob >= 50%: 3.000-5.000 ARS. Valor con prob baja o frágil: un tercio. Nunca combinadas para recuperar.

## Estilo
Español rioplatense, conservador, con analogías de póker cuando ayuden. Mostrar prob., cuota justa, cuota de la casa y EV en una tabla.