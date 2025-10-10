# Podcast Therapy Scanner

**Internal tool for VoyBien team** - Scan YouTube channels/playlists for mental health content mentions.

## 🚀 Current Status: Fase 2 Complete ✅

**Progress: 50% Complete** - Authentication and Input/Scanning infrastructure complete.

Este proyecto Next.js se generó siguiendo las convenciones definidas en `ARCHITECTURE.md` y `PROJECT_SETUP.md`.

### Requisitos previos
- Node.js ≥ 18.17.0 (instalado)
- npm ≥ 9.0.0 (instalado)

### Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servir la build
npm run lint         # Revisar linting
npm run type-check   # Validación TypeScript
npm run format       # Formatear código con Prettier
npm run convex:dev   # Servidor de desarrollo Convex
npm run convex:deploy # Deploy Convex a producción
```

### Primeros pasos
1. Instala dependencias: `npm install`
2. Levanta el servidor: `npm run dev`
3. Visita `http://localhost:3000`


## ✅ **What's Completed**

### **Fase 0: Setup & Foundation**
- Next.js 15.5.4 with App Router + TypeScript + TailwindCSS
- ESLint, Prettier, production build working
- SEO blocking for internal tool
- Project documentation and structure

### **Fase 1: Authentication (COMPLETED)** 
- [x] Passcode-based authentication system
- [x] Login page with VoyBien branding
- [x] Protected routes with middleware
- [x] Session management (24h JWT + secure cookies)
- [x] Dashboard layout with logout functionality
- [x] Rate limiting and security hardening

### **Fase 2: Input & Scanning (COMPLETED)** 🎉
- [x] YouTube URL parser and validator (`src/lib/youtube-parser.ts`)
- [x] YouTube Data API integration (`src/lib/youtube-api.ts`)
- [x] Complete Convex database schema (`convex/schema.ts`)
- [x] Channel management functions (`convex/channels.ts`)
- [x] Episode management functions (`convex/episodes.ts`)
- [x] Scanning form UI component (`src/components/forms/ScanInputForm.tsx`)
- [x] Episodes listing UI component (`src/components/episodes/EpisodeList.tsx`)
- [x] Infrastructure setup (NPM scripts, environment variables)

## ✅ **Validation Results**
All development tools passing: lint, type-check, build, format, Convex deployment

## 🚀 **Next Phase: Transcription & Processing (Fase 3)**
- API Routes for YouTube data fetching
- YouTube Captions API integration
- Background processing with scanJobs
- Text processing pipeline
- Keyword filtering foundation

### Documentación clave
- `WARP.md` — Project overview and coding agent guidance
- `ARCHITECTURE.md` — Technical architecture and data models
