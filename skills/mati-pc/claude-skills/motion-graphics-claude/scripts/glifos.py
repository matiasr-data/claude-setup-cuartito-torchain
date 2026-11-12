"""glifos.py · que ningún texto dibujado con PIL salga con «□» (tofu). Auditoría 27-10-2026.

Lo que pasó: en una tarjeta hecha con PIL el «▶» salió como un cuadrado vacío porque la fuente no tenía ese glifo, y nadie
lo vio hasta revisarlo a mano. PIL no avisa nunca: dibuja el glifo .notdef (□) o nada.

Uso desde Python (copia este archivo o añade su carpeta a sys.path):
    from glifos import faltan, dibujar_texto, fuente_con
    faltan('C:/Windows/Fonts/arial.ttf', 'Dale ▶ y ✓')           -> ['▶']   (lista de caracteres que la fuente NO tiene)
    fuente_con('Dale ▶', ['SF-Compact-Display-Bold.otf', 'seguisym.ttf'])  -> la primera fuente que los tiene todos
    dibujar_texto(draw, (x, y), 'Dale ▶', fuente, fill=(255, 255, 255))
        dibuja el texto; los símbolos que la fuente no tiene (▶ ⏸ ✓ ✕ → ← ↑ ↓ ● ★ +) los dibuja como FORMAS vectoriales,
        y si falta cualquier otro carácter lanza ValueError (mejor un error que un «□» en el vídeo).

Desde la consola:
    python glifos.py "Texto con ▶ ✓" [fuente1.ttf fuente2.otf ...]
    → dice qué caracteres le faltan a cada fuente (sin fuentes: prueba las habituales de Windows). Código 1 si a todas les falta algo.
"""
import os
import sys

from PIL import ImageFont

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

NOTDEF = chr(0xF0001)   # carácter de uso privado que ninguna fuente tiene: su dibujo ES el «□» de esa fuente
INVISIBLES = set(' \t\n\r\u00a0\u200b\u200c\u200d\u2060\ufe0e\ufe0f\u00ad')
SIMBOLOS = {'▶': 'play', '►': 'play', '⏵': 'play', '⏸': 'pausa', '✓': 'check', '✔': 'check', '✕': 'cruz', '✗': 'cruz', '✖': 'cruz',
            '→': 'flecha', '←': 'izquierda', '↑': 'arriba', '↓': 'abajo', '●': 'punto', '★': 'estrella', '+': 'mas'}
HABITUALES = [os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'motor', 'fuentes', 'InterTight-700.ttf'),
              'C:/Windows/Fonts/segoeuib.ttf', 'C:/Windows/Fonts/seguisym.ttf', 'C:/Windows/Fonts/arialbd.ttf',
              '/Library/Fonts/Arial.ttf']


def _fuente(f, tam=64):
    return f if isinstance(f, ImageFont.FreeTypeFont) else ImageFont.truetype(str(f), tam)


def _huella(font, ch):
    m = font.getmask(ch)
    return m.size, bytes(m)


def faltan(fuente, texto):
    """Caracteres de «texto» que la fuente no tiene (se dibujarían como □ o no se verían)."""
    font = _fuente(fuente)
    tofu = _huella(font, NOTDEF)
    malos = []
    for ch in dict.fromkeys(texto):   # sin repetir, en orden
        if ch in INVISIBLES:
            continue
        h = _huella(font, ch)
        if h == tofu or not any(h[1]):
            malos.append(ch)
    return malos


def fuente_con(texto, candidatas=None, tam=64):
    """Ruta de la primera fuente de la lista que tiene TODOS los caracteres del texto (o None)."""
    for c in candidatas or HABITUALES:
        if os.path.exists(str(c)) and not faltan(ImageFont.truetype(str(c), tam), texto):
            return c
    return None


def dibujar_simbolo(draw, nombre, caja, fill):
    """Dibuja un símbolo como forma vectorial dentro de caja = (x0, y0, x1, y1)."""
    x0, y0, x1, y1 = caja
    w, h = x1 - x0, y1 - y0
    s = min(w, h)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    g = max(2, round(s * 0.16))   # grosor del trazo
    P = lambda fx, fy: (cx + (fx - 0.5) * s, cy + (fy - 0.5) * s)
    if nombre == 'play':
        draw.polygon([P(0.22, 0.12), P(0.88, 0.5), P(0.22, 0.88)], fill=fill)
    elif nombre == 'pausa':
        draw.rounded_rectangle([P(0.2, 0.15), P(0.42, 0.85)], radius=s * 0.05, fill=fill)
        draw.rounded_rectangle([P(0.58, 0.15), P(0.8, 0.85)], radius=s * 0.05, fill=fill)
    elif nombre == 'check':
        draw.line([P(0.16, 0.52), P(0.4, 0.76), P(0.86, 0.26)], fill=fill, width=g, joint='curve')
    elif nombre == 'cruz':
        draw.line([P(0.22, 0.22), P(0.78, 0.78)], fill=fill, width=g)
        draw.line([P(0.78, 0.22), P(0.22, 0.78)], fill=fill, width=g)
    elif nombre in ('flecha', 'izquierda', 'arriba', 'abajo'):
        a, b, p1, p2 = {'flecha': ((0.12, 0.5), (0.86, 0.5), (0.6, 0.26), (0.6, 0.74)),
                        'izquierda': ((0.88, 0.5), (0.14, 0.5), (0.4, 0.26), (0.4, 0.74)),
                        'arriba': ((0.5, 0.88), (0.5, 0.14), (0.26, 0.4), (0.74, 0.4)),
                        'abajo': ((0.5, 0.12), (0.5, 0.86), (0.26, 0.6), (0.74, 0.6))}[nombre]
        draw.line([P(*a), P(*b)], fill=fill, width=g)
        draw.line([P(*p1), P(*b), P(*p2)], fill=fill, width=g, joint='curve')
    elif nombre == 'punto':
        draw.ellipse([P(0.25, 0.25), P(0.75, 0.75)], fill=fill)
    elif nombre == 'estrella':
        import math
        pts = []
        for i in range(10):
            r = 0.46 if i % 2 == 0 else 0.19
            ang = -math.pi / 2 + i * math.pi / 5
            pts.append(P(0.5 + r * math.cos(ang), 0.5 + r * math.sin(ang)))
        draw.polygon(pts, fill=fill)
    elif nombre == 'mas':
        draw.line([P(0.5, 0.18), P(0.5, 0.82)], fill=fill, width=g)
        draw.line([P(0.18, 0.5), P(0.82, 0.5)], fill=fill, width=g)
    else:
        raise ValueError(f'símbolo desconocido: {nombre}')


def dibujar_texto(draw, xy, texto, fuente, fill=(255, 255, 255), **kw):
    """Como draw.text, pero sin tofu: los símbolos que faltan se dibujan como formas; cualquier otro carácter que falte → ValueError.
    Devuelve la x final (para seguir escribiendo a la derecha)."""
    font = _fuente(fuente)
    malos = set(faltan(font, texto))
    raros = [c for c in malos if c not in SIMBOLOS]
    if raros:
        raise ValueError(f'La fuente {getattr(font, "path", font)} no tiene {raros}: se verían como «□». Usa fuente_con() para elegir otra.')
    x, y = xy
    asc, desc = font.getmetrics()
    trozo = ''
    for ch in texto + '\0':
        if ch == '\0' or ch in malos:
            if trozo:
                draw.text((x, y), trozo, font=font, fill=fill, **kw)
                x += font.getlength(trozo)
                trozo = ''
            if ch in malos:
                alto = asc * 0.8   # algo más que la altura de las mayúsculas
                y0 = y + asc - alto
                dibujar_simbolo(draw, SIMBOLOS[ch], (x + alto * 0.08, y0, x + alto * 1.08, y0 + alto), fill)
                x += alto * 1.2
        else:
            trozo += ch
    return x


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    texto = sys.argv[1]
    fuentes = sys.argv[2:] or [f for f in HABITUALES if os.path.exists(f)]
    alguna = False
    for f in fuentes:
        if not os.path.exists(f):
            print(f'·  {f}: no existe')
            continue
        m = faltan(f, texto)
        alguna = alguna or not m
        nombre = ' '.join(ImageFont.truetype(f, 20).getname())
        print(f"{'✓' if not m else '✗'}  {os.path.basename(f)} ({nombre})" + (f": le faltan {' '.join(m)}" if m else ''))
    if not alguna:
        print('Ninguna fuente tiene todos los caracteres: dibuja los símbolos con dibujar_texto() / VK.icono().')
    sys.exit(0 if alguna else 1)


if __name__ == '__main__':
    main()
