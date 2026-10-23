---
name: wpportal-contexto
description: Contexto exclusivo del portal Angular WPPORTALFEEC (facturación electrónica Ecuador) — dominio, features, rama de integración, comandos, rutas y recursos de permiso reales, deuda conocida que no se debe copiar y desviaciones permitidas respecto a angular-webpos. Uso interno - la leen los agentes frontend-angular, code-review y design-fix en su paso 0.
user-invocable: false
---

# WPPORTALFEEC — contexto del proyecto

Complementa la skill global `angular-webpos` (norma de empresa). Aquí solo hay hechos de este repo.

## Dominio

Portal web de **facturación electrónica para Ecuador** (SRI): empresas emisoras gestionan sus datos maestros y
emiten/consultan comprobantes (facturas, notas, retenciones, guías de remisión), y consultan documentos recibidos.
Angular 20 standalone, Bootstrap 5, NgRx Signal Store, ngx-translate, OIDC contra WPAuthServer.
Backend: API .NET `WPApiPortalFeEc` (`C:\webpos\ecuador\WPApiPortalFeEc`).

## Features (`src/app/views/components/`)

| Feature | Contenido | Rutas |
|---|---|---|
| `admin` | Datos maestros: usuarios, empresas, sucursales, clientes, proveedores, transportistas, productos, puntos de emisión (con secuenciales), firmas, email, tipos de documento, códigos de retención, configuraciones, API keys | `admin/admin.routes.ts` |
| `CompanyAdmin` | Usuarios y menús de la empresa | `company-admin.routes.ts` |
| `Documents` | Generar, consultar, recibidos, ventas, retenciones, guías, carga de documentos | `my-company.routes.ts` |
| `account`, `configs`, `init` | Cuenta, configuración, selección de empresa/resumen inicial | `*.routes.ts` propios |
| `register`, `plans`, `legal`, `site`, `auth-callback`, `page-error` | Público / OIDC / errores | `app.routes.ts` |

## Ramas y comandos

- **Rama de integración: `dev`.** Las ramas `feature/*` y `fix/*` salen de `dev` y vuelven a `dev` por PR.
  `main` está congelada (sin cambios desde 2026-01); no abras PR contra `main`.
- `npm start` / `npm run build` / `npm run build:prod`: ejecutan antes `npm run config` (`set-env.ts` y
  `set-version.ts`), que genera la configuración. `npx ng build` directo se salta ese paso.
- Tests: `npm test` (todo) o `npx jest test/<ruta>`. Specs en `test/` espejo de `src/app/`.
- Config runtime: `src/assets/config.json` (plantilla `config.example.json`).

## Referencias del repo para encajar

- **Estructura** de un CRUD: `views/components/admin/carrier/` (lista + `edit-carrier/`),
  `store/admin/carrier/`, `store/signal-store/carrier/carrier.store.ts`, `test/views/components/admin/carrier/`.
  Úsalo para ver dónde va cada pieza y qué compartidos importar, **no como modelo de estilo** (ver deuda abajo):
  el código nuevo parte de `assets/plantilla-crud/` de `angular-webpos`.
- Tema SweetAlert correcto: `SWAL_THEME` en `Documents/generate-documents/generate-documents.component.ts`.
- Errores HTTP bien resueltos: `errorEffect` de `edit-carrier.component.ts` (usa `ApiErrorService`).
- Empresa activa: `lstore.getItem('selectedCompany')?.companyLicCod`.

## Permisos

- Roles con acceso total: `WPAdmin`, `webpos_admin`, `WPSupport`, `webpos_support`, `FeEcAdmin`.
- Los permisos no son granulares por recurso: una fila por tipo de usuario (`admin`/`usuario`/`cliente`); `resource`
  es informativo, pero se pasa siempre.
- Recursos en uso: `clientes`, `proveedores`, `transportistas`, `productos`, `sucursal`, `punto-emision`,
  `secuencial`, `empresa`, `usuario`.
- Guards (`core/guard/`): `authGuard`, `adminRouteGuard`, `wpAdminOnlyRouteGuard`, `usuarioRouteGuard`,
  `clientRoleGuard`, `notFoundGuard`.
- `[wpDisableIfNoPermission]` existe pero hoy no se usa en ninguna plantilla.

## Deuda conocida — no copiar

- **`BaseService` con `byCompany = true` no funciona**: `_services.base.ts` lee `lstore.getItem('company')`, pero la
  app guarda la empresa como `'selectedCompany'` (nadie escribe `'company'`). La URL sale sin empresa. Pasa
  `companyLicCod` explícito en la ruta (`getByCompany`).
- **`_config/lang/en.ts:28` importa `company-user.es`**: la pantalla de usuarios de empresa sale en español con el
  idioma en inglés, y `company-user.en.ts` queda sin registrar. Lo detecta `check-i18n.js`.
- **Colores literales en carrier** (y otras pantallas): `confirmButtonColor: '#d33'` / `cancelButtonColor: '#3085d6'`
  en `carrier.component.ts` (≈21 archivos usan `confirmButtonColor`), `.required-asterisk { color: #dc3545 }` en
  `edit-carrier.component.scss`, y `[overlayColor]="'rgba(0,0,0,0.25)'"` en `edit-carrier.component.html`.
- **`errorEffect` de `carrier.component.ts`** lee `err.error.detail` / `err.message` a mano (expone la URL del API);
  usa `ApiErrorService.extract()`.
- **`exportColumns` con etiquetas literales en español** en 13 de los 14 componentes que exportan (p. ej. carrier).
- **`Authorization` añadido fuera del interceptor**: `HttpConfigService`
  (`core/services/Interceptors/token-inject.service.ts`, inyectado en ~16 servicios) y un `fetch` a
  `/connect/userinfo` en `app.component.ts`. No los uses ni los amplíes.
- **`@Input`/`@Output` y `CommonModule`** en modales legados (`edit-carrier`, `edit-supplier`…): código nuevo con `input()/output()`.
- **`BlockUIDirective`** tiene colores literales como valores por defecto; no los repliques en plantillas.
- **Hallazgos preexistentes de `check-styles.js`** sobre `src/app`: 226 en 92 archivos a 2026-10-23 (≈36 son
  `[overlayColor]` literales en `wpBlockUI`). Ejecútalo solo sobre los archivos que tocas.
- **Angular Material instalado** (tema `indigo-pink` en `angular.json`; usado en `admin/user/edit-user` e
  `init/summary`): no lo uses en pantallas nuevas.

## Desviaciones permitidas

- Los servicios heredan el constructor de `BaseService` (inyección por constructor) — es la norma global.
- `wp-table-common` y sus eventos son `any` heredado: tipa el evento en tu componente con una interfaz local.
- Ninguna otra: lo demás sigue `angular-webpos`.
