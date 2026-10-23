<#
.SYNOPSIS
  Instala la configuracion de Claude Code de WebPOS: capa global (~/.claude) y capa de proyecto (<repo>/.claude).

.DESCRIPTION
  - Antes de cambiar nada crea un respaldo zip en ~/.claude-respaldos/.
  - Solo elimina lo que figura en global/retirado.txt o proyectos/<nombre>/retirado.txt.
  - Nunca toca skills/synced, plugins, settings*.json ni projects.
  - En un proyecto, se niega a instalar si <repo>/.claude/ no esta ignorado por git
    (la capa de proyecto no debe subirse a GitHub).

.EXAMPLE
  .\install.ps1 -WhatIf
  Muestra todo lo que haria, sin cambiar nada.

.EXAMPLE
  .\install.ps1
  Instala la capa global y la de todos los proyectos de proyectos.json que existan en este equipo.

.EXAMPLE
  .\install.ps1 -Solo Proyectos -Proyecto WPPORTALFEEC -Ruta D:\repos\WPPORTALFEEC
  Instala solo la capa de un proyecto en una ruta distinta a la de proyectos.json.
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [ValidateSet('Todo', 'Global', 'Proyectos')]
    [string]$Solo = 'Todo',
    [string[]]$Proyecto,
    [string]$Ruta,
    # Reemplaza un CLAUDE.md existente que no fue instalado por este script (queda en el respaldo).
    [switch]$Forzar
)

$ErrorActionPreference = 'Stop'
$script:Ctx = $PSCmdlet
$Repo = $PSScriptRoot
$ClaudeHome = Join-Path $HOME '.claude'
$Respaldos = Join-Path $HOME '.claude-respaldos'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Marca = '<!-- Gestionado por el repo claude-config: edita alli y ejecuta install.ps1. Los cambios locales se pierden. -->'
$Protegidos = @('synced', 'plugins', 'projects', 'settings.json', 'settings.local.json', 'CLAUDE.md')

function Hacer([string]$Objetivo, [string]$Accion) {
    return $script:Ctx.ShouldProcess($Objetivo, $Accion)
}

function Leer-Lista([string]$Archivo) {
    if (-not (Test-Path $Archivo)) { return @() }
    Get-Content $Archivo |
        ForEach-Object { ($_ -replace '#.*$', '').Trim() } |
        Where-Object { $_ }
}

function Respaldar([string[]]$Rutas, [string]$Nombre) {
    $existentes = @($Rutas | Where-Object { Test-Path $_ })
    if ($existentes.Count -eq 0) { return }
    $zip = Join-Path $Respaldos "$Nombre-$Stamp.zip"
    if (Hacer $zip 'Crear respaldo') {
        New-Item -ItemType Directory -Force $Respaldos | Out-Null
        Compress-Archive -Path $existentes -DestinationPath $zip -Force
        Write-Host "  respaldo: $zip"
    }
}

function Retirar([string]$Base, [string]$Lista) {
    $baseCompleta = (Resolve-Path $Base).Path.TrimEnd('\') + '\'
    foreach ($patron in Leer-Lista $Lista) {
        $items = @(Get-Item -Path (Join-Path $Base $patron) -Force -ErrorAction SilentlyContinue)
        foreach ($item in $items) {
            $completa = $item.FullName
            if (-not $completa.StartsWith($baseCompleta, [StringComparison]::OrdinalIgnoreCase)) {
                Write-Warning "Ignorado (fuera de $Base): $completa"; continue
            }
            $relativa = $completa.Substring($baseCompleta.Length)
            if ($Protegidos -contains ($relativa -split '[\\/]')[-1] -or $relativa -match '^(skills[\\/])?synced') {
                Write-Warning "Ignorado (protegido): $relativa"; continue
            }
            if (Hacer $completa 'Eliminar (retirado)') {
                Remove-Item -LiteralPath $completa -Recurse -Force
                Write-Host "  eliminado: $relativa"
            }
        }
    }
}

function Copiar-Carpeta([string]$Origen, [string]$Destino) {
    if (Hacer $Destino "Instalar desde $Origen") {
        if (Test-Path $Destino) { Remove-Item -LiteralPath $Destino -Recurse -Force }
        New-Item -ItemType Directory -Force (Split-Path $Destino) | Out-Null
        Copy-Item -LiteralPath $Origen -Destination $Destino -Recurse -Force
        Write-Host "  instalado: $Destino"
    }
}

function Copiar-Archivo([string]$Origen, [string]$Destino) {
    if (Hacer $Destino "Instalar desde $Origen") {
        New-Item -ItemType Directory -Force (Split-Path $Destino) | Out-Null
        Copy-Item -LiteralPath $Origen -Destination $Destino -Force
        Write-Host "  instalado: $Destino"
    }
}

function Instalar-ClaudeMd([string]$Origen, [string]$Destino) {
    if (-not (Test-Path $Origen)) { return }
    if ((Test-Path $Destino) -and -not $Forzar) {
        $primera = Get-Content $Destino -TotalCount 1
        if ($primera -ne $Marca) {
            Write-Warning "$Destino existe y no lo instalo este script. Pasa su contenido al repo y usa -Forzar."
            return
        }
    }
    if (Hacer $Destino "Instalar desde $Origen") {
        New-Item -ItemType Directory -Force (Split-Path $Destino) | Out-Null
        $contenido = @($Marca, '') + (Get-Content $Origen -Encoding UTF8)
        [IO.File]::WriteAllLines($Destino, $contenido, (New-Object Text.UTF8Encoding($false)))
        Write-Host "  instalado: $Destino"
    }
}

function Instalar-Global {
    Write-Host "`n== Capa global -> $ClaudeHome" -ForegroundColor Cyan
    New-Item -ItemType Directory -Force $ClaudeHome | Out-Null
    Respaldar @(
        (Join-Path $ClaudeHome 'agents'),
        (Join-Path $ClaudeHome 'skills'),
        (Join-Path $ClaudeHome 'commands'),
        (Join-Path $ClaudeHome 'CLAUDE.md')
    ) 'global'
    Retirar $ClaudeHome (Join-Path $Repo 'global\retirado.txt')

    Get-ChildItem (Join-Path $Repo 'global\agents') -Filter *.md | ForEach-Object {
        Copiar-Archivo $_.FullName (Join-Path $ClaudeHome "agents\$($_.Name)")
    }
    Get-ChildItem (Join-Path $Repo 'global\skills') -Directory | ForEach-Object {
        Copiar-Carpeta $_.FullName (Join-Path $ClaudeHome "skills\$($_.Name)")
    }
    Instalar-ClaudeMd (Join-Path $Repo 'global\CLAUDE.md') (Join-Path $ClaudeHome 'CLAUDE.md')

    # /init-proyecto lee esta ruta para crear la copia versionada de un proyecto nuevo en el repo.
    $rutaRepo = Join-Path $ClaudeHome 'claude-config.ruta'
    if (Hacer $rutaRepo 'Guardar ruta del repo claude-config') {
        Set-Content -Path $rutaRepo -Value $Repo -Encoding ASCII
        Write-Host "  instalado: $rutaRepo"
    }
}

function Rutas-Proyectos {
    $mapa = @{}
    foreach ($archivo in @('proyectos\proyectos.json', 'proyectos\proyectos.local.json')) {
        $p = Join-Path $Repo $archivo
        if (Test-Path $p) {
            (Get-Content $p -Raw | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $mapa[$_.Name] = $_.Value }
        }
    }
    if ($Proyecto) {
        $filtrado = @{}
        foreach ($n in $Proyecto) {
            if (-not (Test-Path (Join-Path $Repo "proyectos\$n"))) { throw "No existe proyectos\$n en el repo." }
            $filtrado[$n] = $mapa[$n]
        }
        $mapa = $filtrado
    }
    if ($Ruta) {
        if ($mapa.Count -ne 1) { throw '-Ruta requiere un solo -Proyecto.' }
        $mapa[@($mapa.Keys)[0]] = $Ruta
    }
    return $mapa
}

function Instalar-Proyecto([string]$Nombre, [string]$Destino) {
    Write-Host "`n== Proyecto $Nombre -> $Destino" -ForegroundColor Cyan
    if (-not $Destino -or -not (Test-Path $Destino)) {
        Write-Warning "No existe en este equipo; se omite. Usa -Proyecto $Nombre -Ruta <ruta> si esta en otro sitio."
        return
    }
    git -C $Destino rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -eq 0) {
        git -C $Destino check-ignore -q '.claude/CLAUDE.md'
        $ok1 = $LASTEXITCODE -eq 0
        git -C $Destino check-ignore -q '.claude/skills/x/SKILL.md'
        $ok2 = $LASTEXITCODE -eq 0
        if (-not ($ok1 -and $ok2)) {
            Write-Error "En $Destino la carpeta .claude/ NO esta ignorada por git. Agrega '.claude/' al .gitignore y vuelve a ejecutar." -ErrorAction Continue
            return
        }
    } else {
        Write-Warning "$Destino no es un repo git; se instala igual."
    }

    $claudeDir = Join-Path $Destino '.claude'
    $origen = Join-Path $Repo "proyectos\$Nombre"
    New-Item -ItemType Directory -Force $claudeDir | Out-Null
    Respaldar @(
        (Join-Path $claudeDir 'agents'),
        (Join-Path $claudeDir 'skills'),
        (Join-Path $claudeDir 'CLAUDE.md')
    ) "proyecto-$Nombre"
    Retirar $claudeDir (Join-Path $origen 'retirado.txt')

    $skills = Join-Path $origen 'skills'
    if (Test-Path $skills) {
        Get-ChildItem $skills -Directory | ForEach-Object {
            Copiar-Carpeta $_.FullName (Join-Path $claudeDir "skills\$($_.Name)")
        }
    }
    Instalar-ClaudeMd (Join-Path $origen 'CLAUDE.md') (Join-Path $claudeDir 'CLAUDE.md')
}

if ($Solo -in 'Todo', 'Global') { Instalar-Global }
if ($Solo -in 'Todo', 'Proyectos') {
    $mapa = Rutas-Proyectos
    foreach ($n in ($mapa.Keys | Sort-Object)) { Instalar-Proyecto $n $mapa[$n] }
}

Write-Host "`nListo. Reinicia Claude Code (o abre una sesion nueva) para que cargue los cambios." -ForegroundColor Green
