# Seguridad y sesión

## Autenticación (OIDC con WPAuthServer)

- Librería `angular-oauth2-oidc`, Authorization Code Flow. Configuración en `src/app/core/oauth/oauth-server-config.ts`
  y lógica de login/logout en `src/app/core/services/oauth-server.service.ts`.
- Callback en `views/components/auth-callback/`.
- **Tokens en `sessionStorage`** (por pestaña). Nunca los muevas a `localStorage` ni los pongas en URLs o logs.
- Guards funcionales en `src/app/core/guard/` (ver `permisos.md`).

## Interceptor del token

`src/app/core/interceptors/auth-token.interceptor.ts` es el **único** sitio que añade `Authorization: Bearer …`.

- No añadas el token a mano en ningún servicio.
- Tiene una lista `publicPatterns` (token/connect/login/register/assets/.well-known y hosts de terceros como
  `webposonline.com`). **Si integras una API de terceros, añade su host ahí**: el token del portal no debe salir de la API propia.

## Datos en el navegador

- `localStorage` guarda empresa activa, menús y permisos **cifrados** vía `StoreConfigService`
  (`src/app/shared/services/store-config.service.ts`). Lee y escribe siempre con `lstore.getItem/setItem`, nunca con
  `localStorage` directo, salvo preferencias de UI no sensibles.
- El logout se sincroniza entre pestañas con un evento de `storage` (`SESSION_LOGOUT_KEY`); no lo rompas al tocar el cierre de sesión.

## Sesión inactiva

`IdleTimerService` (`core/services/idle-timer.service.ts`) cierra la sesión por inactividad: `idleTimeoutMinutes` de la
configuración en runtime, 30 min por defecto. `SessionWarningService` avisa antes de expirar.

## Configuración en runtime

- Una sola imagen para todos los ambientes: las URLs y claves públicas se leen de `config.json` en runtime con
  `AppConfigService.get('<clave>')` (p. ej. `apiUrl`). No las hardcodees ni uses `environment.ts` para URLs nuevas.
- **Nunca secretos en el frontend** (`config.json`, `environment*.ts`, código): todo lo que llega al navegador es público.

## XSS y sanitización

- Angular sanitiza interpolaciones y `[href]`/`[src]`. No uses `[innerHTML]` con datos del usuario o del backend sin necesidad.
- `bypassSecurityTrust*` está prohibido salvo revisión explícita (hoy no se usa en el repo).
- El contenido del editor Quill y los PDF/XML del SRI se muestran por los componentes existentes; reutilízalos.

## Errores

- Mensajes al usuario vía `ApiErrorService.extract()`; nunca muestres stack traces ni el cuerpo crudo del error.
- `GlobalErrorHandler` (`core/services/global-error-handler.service.ts`) captura lo no manejado; no lo silencies con `try/catch` vacíos.

## Dependencias

`npm audit --audit-level=high` antes de liberar; no agregues paquetes nuevos sin necesidad clara.
