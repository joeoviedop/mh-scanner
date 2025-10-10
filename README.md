# Podcast Therapy Scanner

**Internal tool for VoyBien team** - Scan YouTube channels/playlists for mental health content mentions.

## 🚀 Current Status: Fase 5 Complete ✅

**Progress: 80% Complete** - Interfaz de revisión y gestión de episodios implementada. Sistema completo de transcripciones y análisis IA con páginas dedicadas.

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

### Escanear una nueva fuente
1. Inicia sesión con el passcode interno.
2. En el dashboard (Inicio), pega la URL del canal/playlist/video y selecciona la frecuencia de escaneo.
3. Envía el formulario para registrar la fuente y disparar el escaneo inicial.
4. El escaneo omite automáticamente Shorts (videos < 2 minutos) para enfocarse en episodios largos.
5. Dirígete a **Episodios** para solicitar transcripciones y ejecutar la detección de menciones sobre el contenido importado.

### Configuración de credenciales externas
1. **Obligatorias:**
   - `YOUTUBE_API_KEY` para listar canales y episodios con la Data API v3.
   - `APIFY_TOKEN` para generar transcripciones (actor `pintostudio/youtube-transcript-scraper`).
2. **Opcional (OAuth YouTube):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` sólo si en el futuro necesitas subtítulos privados del propietario.
3. Define las variables en Convex con `npx convex env set <NOMBRE> <valor>` y reinicia `npx convex dev`.


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

### **Fase 2: Input & Scanning (COMPLETED)**
- [x] YouTube URL parser and validator (`src/lib/youtube-parser.ts`)
- [x] YouTube Data API integration (`src/lib/youtube-api.ts`)
- [x] Complete Convex database schema (`convex/schema.ts`)
- [x] Channel management functions (`convex/channels.ts`)
- [x] Episode management functions (`convex/episodes.ts`)
- [x] Scanning form UI component (`src/components/forms/ScanInputForm.tsx`)
- [x] API pública para iniciar escaneos desde el dashboard (`/api/youtube/scan`)
- [x] Acción Convex para registrar fuentes y descargar episodios (`convex/channelActions.ts`)
- [x] Episodes listing UI component (`src/components/episodes/EpisodeList.tsx`)
- [x] Infrastructure setup (NPM scripts, environment variables)

- [x] API route para solicitar transcripciones (`/api/youtube/fetch-captions`)
- [x] Transcripción automática utilizando Apify (`lib/integrations/youtube/captions.ts`, `lib/integrations/apify/transcript.ts`)
- [x] Omisión de Shorts en el escaneo y mensajes claros cuando Apify no devuelve contenido
- [x] Acciones Convex para orquestar trabajos de transcripción (`convex/transcriptionActions.ts`, `convex/scanJobs.ts`)
- [x] Persistencia de transcripciones y coincidencias iniciales en Convex (`convex/transcriptions.ts`)
- [x] UI del dashboard con controles para disparar transcripciones y estados

### **Fase 4: Mention Detection & Classification (COMPLETED)** ✅
- [x] Filtro de palabras clave y extracción de contexto (`lib/processing/keyword-filter.ts`)
- [x] Cliente OpenAI GPT-4 mini con respuesta estructurada (`lib/integrations/llm/openai.ts`)
- [x] Acciones Convex para detección y clasificación de menciones (`convex/mentionActions.ts`, `convex/fragments.ts`)
- [x] API y UI para revisar fragmentos detectados con enlaces a YouTube
- [x] Actualización de estados de episodios y almacenamiento de fragmentos clasificados

### **Fase 5: Review Interface (COMPLETED)** ✅
- [x] **Páginas dedicadas por episodio** (`/dashboard/episodes/[episodeId]`)
- [x] **Gestión completa de transcripciones** con controles manuales y visualización de estados
- [x] **Vista mejorada de transcripciones** con modo texto completo y segmentos timestamped
- [x] **Resaltado de keywords** automático en transcripciones para términos de terapia
- [x] **Interfaz profesional** con metadatos, thumbnail, duración, canal y navegación
- [x] **Análisis de fragmentos** con clasificación IA, confianza, sensibilidad y enlaces a YouTube
- [x] **Integración con Apify** completamente funcional con fixes de env variables y API format

## ✅ **Validation Results**
- `npm run lint`
- `npm run type-check`

## 🚀 **Next Phase: Feedback & Re-ranking (Fase 6)**
- Sistema de feedback con botones "Útil / No útil" en cada fragmento
- Algoritmo de re-ranking basado en feedback acumulado
- Dashboard de métricas de calidad y precisión del sistema
- Análisis de patrones para mejorar prompts de clasificación

### Documentación clave
- `WARP.md` — Project overview and coding agent guidance
- `ARCHITECTURE.md` — Technical architecture and data models
