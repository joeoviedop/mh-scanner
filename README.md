# Podcast Therapy Scanner

**Internal tool for VoyBien team** - Scan YouTube channels/playlists for mental health content mentions.

## 🚀 Current Status: Fase 0 Complete ✅

**Progress: 15% Complete** - Foundation established, ready for authentication implementation.

Este proyecto Next.js se generó siguiendo las convenciones definidas en `ARCHITECTURE.md` y `PROJECT_SETUP.md`.

### Requisitos previos

- Node.js ≥ 18.17.0 (instalado)
- npm ≥ 9.0.0 (instalado)

### Scripts disponibles

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run start      # Servir la build
npm run lint       # Revisar linting
```

### Primeros pasos

1. Instala dependencias: `npm install`
2. Levanta el servidor: `npm run dev`
3. Visita `http://localhost:3000`

### Notas de configuración inicial

- `next.config.ts` ya fuerza `noindex/nofollow` y habilita Server Actions
- Paths de TypeScript (`@/components`, `@/lib`, `@/hooks`) configurados
- Tailwind listo en `app/globals.css`
- `.eslintrc.json` y `.gitignore` alineados con la guía del proyecto

## ✅ **What's Completed (Fase 0)**

- Next.js 15.5.4 with App Router
- TypeScript with strict configuration
- TailwindCSS 4.1.14 with custom VoyBien brand colors
- ESLint 8.57.0 with TypeScript compatibility
- SEO blocking (noindex/nofollow) for internal tool
- Complete project documentation suite
- Development environment ready

## 🚀 **Next Phase: Authentication (Fase 1)**

- Simple passcode-based authentication
- Login page with form validation
- Route protection middleware
- Session management

### Documentación clave

- `WARP.md` — Project overview and progress tracking
- `PROJECT_SETUP.md` — Reglas de trabajo y configuraciones
- `ARCHITECTURE.md` — Estructura objetivo
- `docs/MVP_ROADMAP.md` — Fases de implementación
- `docs/CONVEX_SCHEMA_PLAN.md` — Modelo de datos planificado
