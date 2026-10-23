# Seguridad y sesión

## Autenticación (OIDC)

- Librería `angular-oauth2-oidc`, **Authorization Code Flow** (nunca Implicit) con `useSilentRefresh: true`.
  Configuración en `src/app/core/oauth/` y lógica de login/logout en un servicio de `core/services/`.
- Callback en `views/components/auth-callback/`.
- **Tokens en `sessionStorage`** (por pestaña). Nunca los muevas a `localStorage` ni los pongas en URLs o logs.
- Guards funcionales en `src/app/core/guard/` (ver `permisos.md`).
- En logout, limpia permisos, roles y menús (`PermissionService.clearAll()`).

## Token en las peticiones — solo el interceptor

**Norma:** el header `Authorization: Bearer …` se añade **solo** en el interceptor funcional
(`src/app/core/interceptors/auth-token.interceptor.ts`). Cualquier otro sitio que lo añada (servicios HTTP propios,
`fetch` manual, wrappers de `HttpClient`) es **deuda**: no lo copies ni lo amplíes; el contexto del proyecto lista
los casos conocidos.

- No añadas el token a mano en ningún servicio ni uses `fetch` para llamar al API propio.
- El interceptor tiene una lista de patrones públicos (token/connect/login/register/assets/.well-known y hosts de
  terceros). **Si integras una API de terceros, añade su host ahí**: el token del portal no debe salir de la API propia.

## Datos en el navegador

- `localStorage` guarda empresa activa, menús y permisos **cifrados** vía `StoreConfigService`
  (`src/app/shared/services/store-config.service.ts`). Lee y escribe siempre con `lstore.getItem/setItem`, nunca con
  `localStorage` directo, salvo preferencias de UI no sensibles.
- El logout se sincroniza entre pestañas con un evento de `storage`; no lo rompas al tocar el cierre de sesión.

## Sesión inactiva

`IdleTimerService` cierra la sesión por inactividad (`idleTimeoutMinutes` de la configuración en runtime; 30 min por
defecto) y `SessionWarningService` avisa antes de expirar.

## Configuración en runtime

- Una sola imagen para todos los ambientes: URLs y claves públicas se leen de `config.json` en runtime con
  `AppConfigService.get('<clave>')` (p. ej. `apiUrl`). No las hardcodees ni uses `environment.ts` para URLs nuevas.
- **Nunca secretos en el frontend** (`config.json`, `environment*.ts`, código): todo lo que llega al navegador es público.

## XSS y sanitización

- Angular sanitiza interpolaciones y `[href]`/`[src]`. No uses `[innerHTML]` con datos del usuario o del backend sin necesidad.
- `bypassSecurityTrust*` está prohibido salvo revisión explícita.
- Para visores de documentos (PDF/XML) y editores enriquecidos, reutiliza los componentes existentes del proyecto.

## Errores

- Mensajes al usuario vía `ApiErrorService.extract(err, fallbackKey)`; nunca muestres stack traces, `err.message`
  (expone la URL interna del API) ni el cuerpo crudo del error.
- `GlobalErrorHandler` captura lo no manejado; no lo silencies con `try/catch` vacíos.

## Dependencias

`npm audit --audit-level=high` antes de liberar; no agregues paquetes nuevos sin necesidad clara.
