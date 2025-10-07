# Podcast Therapy Scanner

**Internal tool for VoyBien team** - Scan YouTube channels/playlists for mental health content mentions.

## 🚀 Current Status: Fase 0 Complete & Validated ✅

**Progress: 20% Complete** - Foundation established, validated, and production-ready.

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

## ✅ **What's Completed (Fase 0) - VALIDATED**
- Next.js 15.5.4 with App Router
- TypeScript with strict configuration and path aliases
- TailwindCSS 4.1.14 with custom VoyBien brand colors + PostCSS pipeline
- ESLint 8.57.0 with TypeScript compatibility
- Prettier code formatting applied project-wide
- SEO blocking (noindex/nofollow headers + robots.txt) for internal tool
- Base UI components (Header, Footer, not-found page)
- Convex schema foundation established
- Complete project documentation suite
- Development environment ready and production build tested
- **All validations passing**: lint, type-check, build, format

## ✅ **Validation Results (All Passing)**
- `npm ci`: Dependencies installed successfully
- `npm run lint`: ESLint passing (TypeScript compatibility warning expected)
- `npm run type-check`: All TypeScript types validated
- `npm run build`: Production build successful (3.3s compile time)
- `npm run format`: Prettier formatting applied to entire codebase

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
