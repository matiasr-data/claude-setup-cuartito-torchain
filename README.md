# claude-setup-cuartito-torchain

Repositorio privado para preparar Claude en la computadora de Tobías Perona (El Cuartito y Fundación Torchain): skills, instalador, prompt de arranque y plan inicial.

> Repositorio privado. Contiene el plan con datos de las organizaciones. No lo hagas público.

## Qué hay adentro

| Carpeta o archivo | Qué es |
|---|---|
| `prompts/PROMPT-PC-TOBIAS.md` | Prompt para pegar en Claude Code en la PC de Tobías |
| `plan/PLAN-INICIAL.md` | Diagnóstico, auditoría, oportunidades y plan 2026–2027 de la fundación |
| `skills/proyecto/` | Skills nuevas hechas para este proyecto (contexto, formatos de contenido, auditoría, calendario de eventos, embudo de charlas, privacidad, SEO, reporte semanal, guardarraíles) |
| `skills/mati-cuenta/` | Skills de la cuenta de Claude de Mati |
| `skills/plugins-claude/` | Skills de los plugins instalados en Claude, agrupadas por plugin |
| `skills/mati-pc/` | Skills que están en la computadora de Mati (`.claude`, proyecto de videos, contenido minero, LinkedIn, Playwright) |
| `skills/anthropic-ejemplos/` y `skills/anthropic-public/` | Skills de ejemplo y públicas de Anthropic |
| `skills/gemini-antigravity/` | Skills de Gemini/Antigravity (Google). No son para Claude; se guardan como referencia |
| `personal/` | Skills personales de Mati. **No se instalan salvo que se pidan a propósito** |
| `packs.json` | Define qué skills entran en cada pack |
| `instalar.ps1` | Instalador para Windows (PowerShell) |

## Cómo usarlo en la PC de Tobías

1. **Descargar el repo.** Con Git instalado:
   ```powershell
   git clone https://github.com/matiasr-data/claude-setup-cuartito-torchain.git
   ```
   Como es privado, Git va a pedir iniciar sesión en GitHub con la cuenta de Mati (se abre el navegador). Alternativa: invitar a Tobías como colaborador de solo lectura, o bajar el ZIP desde GitHub con la sesión de Mati.
2. **Ver los packs:**
   ```powershell
   cd claude-setup-cuartito-torchain
   .\instalar.ps1 -Listar
   ```
   Si PowerShell bloquea el script: `Set-ExecutionPolicy -Scope Process Bypass` y volver a ejecutarlo.
3. **Instalar lo mínimo primero:**
   ```powershell
   .\instalar.ps1                                  # proyecto + herramientas
   .\instalar.ps1 -Packs redes,seo                 # para trabajar redes y SEO
   .\instalar.ps1 -Packs web-diseno,documentos     # para web y documentos
   ```
4. Cerrar y volver a abrir Claude Code.
5. **Al terminar:** cerrar la sesión de GitHub de Mati en esa PC (Administrador de credenciales de Windows, entradas `git:https://github.com`) y no dejar claves guardadas.

## Packs

`proyecto`, `herramientas`, `redes`, `seo`, `video`, `web-diseno`, `documentos`, `datos`, `desarrollo`, `manifold`, `extras-cuenta`, `anthropic`, `todo` y `personal`.

## Recomendaciones

- **No instales `todo`.** Cada skill suma su descripción al contexto de Claude y consume parte del límite del plan Pro. Instalá solo los packs que vayas a usar.
- **Revisá las skills de terceros** con la skill `skill-inspector` (pack `herramientas`) antes de instalarlas en una computadora ajena.
- `manifold` necesita créditos y una conexión propia de Manifold; no funciona sin eso.
- `personal` no se instala en la PC de Tobías.

## Seguridad

- Se copiaron solo carpetas de skills. No se incluyeron credenciales, archivos `.env`, tokens ni configuraciones de Claude.
- Se revisó el contenido con búsquedas de claves y tokens antes de subirlo.
- Si encontrás un dato sensible en el repo, borralo y avisá.

## Licencias

Las skills de terceros (plugins, Anthropic, Gemini, LinkedIn, etc.) conservan sus propias licencias y archivos `LICENSE`. Este repo es de uso privado para trabajar con el proyecto; no lo redistribuyas ni lo hagas público.
