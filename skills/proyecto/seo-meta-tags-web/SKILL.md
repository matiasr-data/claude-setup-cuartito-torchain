---
name: seo-meta-tags-web
description: Checklist y plantilla de meta tags (título, descripción, canonical, Open Graph, idioma es-AR), textos alternativos y datos estructurados para los sitios de la Fundación Torchain y El Cuartito. Usar al revisar o mejorar el SEO básico de una página.
---

# Meta tags y SEO básico

## Primero verificar
Abrir el código fuente real de la página y revisar el `<head>`. No confiar en resúmenes: confirmar qué tags existen y cuáles están mal escritas (por ejemplo `meta-description` en vez de `name="description"`).

## Plantilla
```html
<html lang="es-AR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>[Nombre] | [Qué hace en pocas palabras]</title>
  <meta name="description" content="[140 a 160 caracteres con llamado a la acción]">
  <link rel="canonical" href="https://[dominio]/[ruta]">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_AR">
  <meta property="og:site_name" content="[Nombre]">
  <meta property="og:title" content="[Título para compartir]">
  <meta property="og:description" content="[Descripción corta]">
  <meta property="og:image" content="https://[dominio]/img/compartir-1200x630.jpg">
  <meta property="og:url" content="https://[dominio]/[ruta]">
  <meta name="twitter:card" content="summary_large_image">
</head>
```

## Checklist
- Título único por página, de 50 a 60 caracteres.
- Descripción única, de 140 a 160 caracteres.
- Imagen para compartir de 1200×630 (es la que se ve al pegar el link en WhatsApp o en la bio de Instagram).
- Texto alternativo descriptivo en cada foto ("Voluntarios clasificando ropa donada"), no genérico ("Campaña 2").
- Un solo `<h1>` por página, con jerarquía de títulos ordenada.
- Favicon.
- `sitemap.xml` y `robots.txt`, y registrar el sitio en Google Search Console.
- Datos estructurados (JSON-LD) de organización sin fines de lucro (fundación) o de negocio local y eventos (El Cuartito).
- Velocidad: imágenes optimizadas y videos livianos.
- Enlaces internos entre páginas (programas, inscripción, contacto, privacidad).

## Páginas recomendadas para la fundación
Inicio, Programas, Agenda de charlas, Inscripción, Nuestro impacto, Equipo y aliados, Contacto, Privacidad. Una sola página limita mucho el posicionamiento.

## Entrega
Mostrar un prototipo local y el listado de cambios antes de publicar. No desplegar sin aprobación del dueño.
