#!/usr/bin/env python3
"""Métricas de ritmo a partir de los cortes detectados por extraer_frames.sh.

Uso: medir_ritmo.py <carpeta_datos> [--gancho 30] [--excluir "245-269,619-645"]
--excluir: tramos en segundos que no son edición del autor (anuncios, intros ajenas).
Escribe ritmo.json en la carpeta y lo muestra por pantalla.
"""
import argparse
import json
import statistics
from pathlib import Path


def parse_excluir(texto):
    tramos = []
    for parte in filter(None, (texto or "").split(",")):
        a, b = parte.split("-")
        tramos.append((float(a), float(b)))
    return tramos


def quitar_tramos(cortes, duracion, tramos):
    """Elimina los tramos excluidos y re-mapea los tiempos como si no existieran."""
    tramos = sorted(tramos)
    nuevos = []
    for c in cortes:
        if any(a <= c <= b for a, b in tramos):
            continue
        desplaz = sum(b - a for a, b in tramos if b < c)
        nuevos.append(c - desplaz)
    total = duracion - sum(b - a for a, b in tramos)
    return nuevos, total


def metricas(cortes, inicio, fin):
    dentro = [c for c in cortes if inicio < c < fin]
    limites = [inicio] + dentro + [fin]
    planos = [b - a for a, b in zip(limites, limites[1:]) if b > a]
    minutos = (fin - inicio) / 60
    if not planos:
        return None
    return {
        "duracion_s": round(fin - inicio, 2),
        "cortes": len(dentro),
        "cortes_por_minuto": round(len(dentro) / minutos, 1) if minutos else 0,
        "media_plano_s": round(statistics.mean(planos), 2),
        "mediana_plano_s": round(statistics.median(planos), 2),
        "pct_planos_menos_2s": round(100 * sum(p < 2 for p in planos) / len(planos)),
        "plano_mas_corto_s": round(min(planos), 2),
        "plano_mas_largo_s": round(max(planos), 2),
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("carpeta")
    p.add_argument("--gancho", type=float, default=30, help="segundos que cuentan como gancho")
    p.add_argument("--excluir", default="", help='tramos a excluir, ej. "245-269,619-645"')
    a = p.parse_args()

    d = Path(a.carpeta)
    duracion = float((d / "duracion.txt").read_text().strip())
    cortes = sorted(float(x) for x in (d / "cortes.txt").read_text().split() if x)
    tramos = parse_excluir(a.excluir)
    if tramos:
        cortes, duracion = quitar_tramos(cortes, duracion, tramos)

    gancho = min(a.gancho, duracion)
    resultado = {
        "excluido": a.excluir or None,
        "total": metricas(cortes, 0, duracion),
        "gancho": metricas(cortes, 0, gancho),
        "cuerpo": metricas(cortes, gancho, duracion) if duracion > gancho else None,
    }
    salida = json.dumps(resultado, indent=2, ensure_ascii=False)
    print(salida)
    (d / "ritmo.json").write_text(salida)


if __name__ == "__main__":
    main()
