# Podcast Therapy Scanner

**Internal tool for VoyBien team** - Scan YouTube channels/playlists for mental health content mentions.

## 🚀 Current Status: Fase 1 Complete ✅

**Progress: 30% Complete** - Authentication system working, ready for scanning functionality.

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


## ✅ **What's Completed**

### **Fase 0: Setup & Foundation**
- Next.js 15.5.4 with App Router + TypeScript + TailwindCSS
- ESLint, Prettier, production build working
- SEO blocking for internal tool
- Project documentation and structure

### **Fase 1: Authentication** 
- Passcode-based authentication system
- Login page with VoyBien branding
- Protected routes with middleware
- Session management (24h JWT + secure cookies)
- Dashboard layout with logout functionality
- Rate limiting and security hardening

## ✅ **Validation Results**
All development tools passing: lint, type-check, build, format

## 🚀 **Next Phase: Input & Scanning (Fase 2)**
- YouTube URL parser and validator
- YouTube Data API integration
- Channel/playlist scanning form
- Episodes listing with metadata
- Convex database schema

### Documentación clave
- `WARP.md` — Project overview and coding agent guidance
- `ARCHITECTURE.md` — Technical architecture and data models
