---
name: create-pull-request
description: Crea un Pull Request en GitHub siguiendo las convenciones del proyecto. Úsala cuando el usuario quiera abrir un PR, subir cambios para revisión, o publicar una rama.
triggers:
  - crear pr
  - crear pull request
  - abrir pr
  - subir para revisión
  - publicar rama
---

# Crear Pull Request con Convenciones

Crea un PR siguiendo las convenciones del proyecto. Ejecuta los pasos de forma autónoma pero preguntando al usuario lo necesario.

---

## Paso 1 — Preguntar rama destino

Mostrar al usuario las ramas remotas disponibles:

```bash
git branch -r | grep -v HEAD | sed 's/origin\///' | sort
```

Mostrar el resultado como lista numerada y preguntar:

```
¿A qué rama va dirigido este PR?

1. develop
2. main
3. master
(o escribe el nombre directamente)
```

Esperar respuesta del usuario. Guardar como `<rama-destino>`.

---

## Paso 2 — Preguntar reviewer

Mostrar la lista y preguntar. **Esperar respuesta antes de continuar.**

```
¿Quién será el reviewer de este PR? (elige UNO o escribe el username)

1. jsalaswp
2. cmontaluisawp
3. kguzman2799
4. jccabezas
5. zmales
6. Escribir manualmente
```

- Aceptar **solo uno** a menos que el usuario explícitamente pida más de uno
- Si escribe un username directamente, usar ese valor

Guardar como `<reviewer>` (un solo valor por defecto).

---

## Paso 3 — Preguntar assignee

Mostrar la lista y preguntar. **Esperar respuesta antes de continuar.**

```
¿A quién deseas asignar este PR? (elige UNO o varios separados por coma, máximo 10)

1. jsalaswp
2. cmontaluisawp
3. kguzman2799
4. jccabezas
5. zmales
6. A mí mismo
7. Escribir manualmente
```

- Si elige "A mí mismo", ejecutar `gh api user --jq '.login'` para obtener el username real del usuario autenticado en `gh` y usar ese valor
- **No usar `@me`** — siempre resolver al username real
- Si escribe usernames directamente, usar esos valores

Guardar como `<assignees>`.

---

## Paso 4 — Preguntar labels

Mostrar la lista y preguntar. **Esperar respuesta antes de continuar.**

```
¿Qué labels deseas aplicar? (elige uno o varios separados por coma)

1.  bug            → Algo no funciona correctamente
2.  documentation  → Mejoras o adiciones a la documentación
3.  duplicate      → Este issue o PR ya existe
4.  enhancement    → Nueva funcionalidad o mejora de una existente
5.  good first issue → Bueno para nuevos colaboradores
6.  help wanted    → Se necesita atención extra
7.  invalid        → Esto no parece correcto
8.  question       → Se necesita más información
9.  refactor       → Cambio de código sin impacto funcional
10. wontfix        → No se trabajará en esto
11. Ninguno
12. Escribir manualmente
```

Guardar como `<labels>`. Si eligió "Ninguno", dejar vacío y omitir el flag `--label` del comando final.

---

## Paso 5 — Recopilar información del branch actual

```bash
git rev-parse --abbrev-ref HEAD
git log <rama-destino>..HEAD --oneline
git diff <rama-destino>...HEAD --stat
git diff <rama-destino>...HEAD
git remote get-url origin
```

> Si no hay commits adicionales respecto a la rama destino, indicarlo al usuario y detener el proceso.

---

## Paso 6 — Asegurar que el branch está en remoto

Antes de ejecutar el push, **pedir confirmación explícita al usuario**:

```
¿Deseas que suba el branch "<branch-actual>" al remoto para poder crear el PR?

Esto ejecutará: git push -u origin <branch-actual>
```

Esperar respuesta afirmativa antes de continuar. Si el usuario dice que no, detener el proceso e indicar que debe subir el branch manualmente.

Una vez confirmado, ejecutar:

```bash
git push -u origin <branch-actual>
```

Si el push falla, informar al usuario con el error exacto y detener el proceso.

---

## Paso 7 — Generar título del PR

Analiza los commits y construye el título basado en el cambio más significativo:

```
tipo(alcance): descripción en español, infinitivo, max 72 chars
```

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Sin cambio funcional |
| `docs` | Documentación |
| `style` | Formato/estilos |
| `test` | Tests |
| `chore` | Mantenimiento |
| `perf` | Rendimiento |

---

## Paso 8 — Generar descripción completa

Construir con información real extraída del diff y los commits:

```markdown
## Checklist previo al merge

- [ ] Código compila sin errores
- [ ] Código compila sin warnings
- [ ] Pruebas unitarias pasan
- [ ] Está actualizado con <rama-destino>

---

## Cambios

### <Área/módulo detectado del diff>
- <cambio concreto extraído del diff>

---

## Pruebas

- [ ] <prueba unitaria relevante al cambio>
- [ ] <prueba manual del flujo principal afectado>
- [ ] <prueba de caso borde o error>

---

## Impacto

- <migraciones, appsettings, nuevas dependencias, cambios de API>
- Si no hay impacto especial: "Sin cambios breaking. No requiere configuración adicional."

---

## Commits incluidos

| Hash | Descripción |
|------|-------------|
| `<hash>` | <mensaje completo del commit> |

---

## Revisión

- Mínimo **1 aprobación** antes de mergear
- Resolver **todos los comentarios** antes del merge
- **No mergear** tu propio PR sin aprobación
```

---

## Paso 9 — Crear el PR

**Opción A — Si `gh` está disponible** (`gh --version` retorna sin error):

Construir el comando dinámicamente:
- Siempre incluir: `--title`, `--base`, `--reviewer`, `--assignee`, `--body`
- Solo incluir `--label` si `<labels>` no está vacío

```bash
gh pr create \
  --title "<título generado>" \
  --base <rama-destino> \
  --reviewer <reviewer> \
  --assignee <assignees> \
  --label "<labels>" \
  --body "<descripción generada>"
```

Mostrar la URL del PR creado al finalizar.

**Opción B — Si `gh` NO está disponible**:

Informar al usuario que GitHub CLI no está instalado y mostrar las instrucciones de instalación según el sistema operativo:

```
GitHub CLI (gh) no está instalado. Para instalarlo:

── Windows ──────────────────────────────────────────
  winget install --id GitHub.cli
  # o con Chocolatey:
  choco install gh

── macOS ────────────────────────────────────────────
  brew install gh

── Linux (Debian/Ubuntu) ────────────────────────────
  (type -p wget >/dev/null || (sudo apt update && sudo apt-get install wget -y)) \
    && sudo mkdir -p -m 755 /etc/apt/keyrings \
    && out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    && cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
    && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && sudo apt update && sudo apt install gh -y

── Linux (Fedora/RHEL) ──────────────────────────────
  sudo dnf install gh

Después de instalar, autentícate con:
  gh auth login

Una vez autenticado, vuelve a ejecutar /create-pull-request
```

Adicionalmente, como fallback hasta que instalen `gh`:
1. Extraer owner y repo de la URL remota
2. Construir URL: `https://github.com/<owner>/<repo>/compare/<rama-destino>...<branch-actual>`
3. Guardar la descripción con `create_markdown_file` como `PR-<branch-actual>.md`
4. Mostrar al usuario:
   - La URL directa para abrir el PR en GitHub manualmente
   - Reviewer, assignees y labels sugeridos para aplicar en la UI
   - La ruta del archivo con la descripción lista para pegar
