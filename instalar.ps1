<#
  Instalador de skills para Claude Code (Windows / PowerShell)

  Uso:
    .\instalar.ps1 -Listar                              # muestra los packs y cuantas skills tiene cada uno
    .\instalar.ps1                                      # instala los packs por defecto: proyecto + herramientas
    .\instalar.ps1 -Packs proyecto,herramientas,redes   # instala los packs elegidos
    .\instalar.ps1 -Packs todo                          # instala todo (NO recomendado: carga demasiadas skills)
    .\instalar.ps1 -Packs redes -Forzar                 # sobrescribe skills que ya existan

  Destino por defecto: %USERPROFILE%\.claude\skills
  Nota: el pack "personal" no se instala salvo que lo pidas a proposito.
#>
param(
  [string[]]$Packs = @("proyecto", "herramientas"),
  [string]$Destino = (Join-Path $env:USERPROFILE ".claude\skills"),
  [switch]$Listar,
  [switch]$Forzar
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$defFile = Join-Path $raiz "packs.json"
if (-not (Test-Path $defFile)) { Write-Host "No encuentro packs.json junto al instalador." -ForegroundColor Red; exit 1 }
$defs = Get-Content $defFile -Raw -Encoding UTF8 | ConvertFrom-Json

function Get-SkillDirs([string]$rutaRelativa) {
  $ruta = Join-Path $raiz $rutaRelativa
  if (-not (Test-Path $ruta)) { return @() }
  $items = Get-ChildItem -Path $ruta -Recurse -Filter "SKILL.md" -File -ErrorAction SilentlyContinue
  return $items | ForEach-Object { $_.Directory }
}

if ($Listar) {
  Write-Host ""
  Write-Host "Packs disponibles:" -ForegroundColor Cyan
  foreach ($p in $defs.PSObject.Properties) {
    $n = 0
    foreach ($r in $p.Value) { $n += (Get-SkillDirs $r | Measure-Object).Count }
    "{0,-16} {1,4} skills" -f $p.Name, $n | Write-Host
  }
  Write-Host ""
  Write-Host "Recomendado para empezar: proyecto, herramientas y, segun la tarea, redes, seo, web-diseno o documentos." -ForegroundColor Yellow
  Write-Host "Ojo: cada skill instalada suma texto al contexto de Claude. Instala solo lo que vayas a usar." -ForegroundColor Yellow
  exit 0
}

foreach ($p in $Packs) {
  if (-not ($defs.PSObject.Properties.Name -contains $p)) {
    Write-Host "El pack '$p' no existe. Usa -Listar para ver los disponibles." -ForegroundColor Red
    exit 1
  }
}

if (-not (Test-Path $Destino)) { New-Item -ItemType Directory -Path $Destino -Force | Out-Null }

$instaladas = @{}
$omitidas = 0
$duplicadas = 0
$copiadas = 0

foreach ($p in $Packs) {
  Write-Host "Pack: $p" -ForegroundColor Cyan
  foreach ($r in $defs.$p) {
    foreach ($dir in (Get-SkillDirs $r)) {
      $nombre = $dir.Name
      if ($instaladas.ContainsKey($nombre)) { $duplicadas++; continue }
      $dest = Join-Path $Destino $nombre
      if ((Test-Path $dest) -and (-not $Forzar)) {
        Write-Host "  ya existe, se omite: $nombre" -ForegroundColor DarkYellow
        $omitidas++
        $instaladas[$nombre] = $true
        continue
      }
      & robocopy $dir.FullName $dest /E /NFL /NDL /NJH /NJS /NP /XD node_modules .git | Out-Null
      if ($LASTEXITCODE -ge 8) { Write-Host "  error al copiar: $nombre" -ForegroundColor Red; continue }
      $instaladas[$nombre] = $true
      $copiadas++
    }
  }
}

Write-Host ""
Write-Host "Listo. Copiadas: $copiadas | ya existian: $omitidas | repetidas entre packs: $duplicadas" -ForegroundColor Green
Write-Host "Destino: $Destino"
Write-Host "Cerra y volve a abrir Claude Code para que cargue las skills nuevas."
