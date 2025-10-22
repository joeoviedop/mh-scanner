# Podcast Therapy Scanner

**Internal tool for VoyBien team** - Scan YouTube channels/playlists for mental health content mentions.

## Tech Stack
- **Frontend**: Next.js 15.5.4 (App Router), React 19, TypeScript
- **Backend**: Convex (serverless NoSQL DB + real-time API)
- **External APIs**: YouTube Data API v3, YouTube Captions API, OpenAI GPT-4 mini

## Development

### Prerequisites
- Node.js ≥ 18.17.0
- npm ≥ 9.0.0

### Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint check
npm run type-check   # TypeScript validation
npm run format       # Format code with Prettier
npm run convex:dev   # Convex development server
npm run convex:deploy # Deploy Convex to production
```

## Project Structure
- `app/` - Next.js App Router (auth & dashboard routes)
- `components/` - React components organized by feature
- `convex/` - Convex backend (schema, queries, mutations)
- `lib/` - Utilities, integrations, and processing logic

## Guidelines
- TypeScript mandatory everywhere
- Follow ESLint rules and Prettier formatting
- Use kebab-case for folders, PascalCase for components
- Never hardcode secrets - use environment variables

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
- [x] YouTube URL parser and validator (`lib/integrations/youtube/youtube-parser.ts`)
- [x] YouTube Data API integration (`lib/integrations/youtube/youtube-api.ts`)
- [x] Complete Convex database schema (`convex/schema.ts`)
- [x] Channel management functions (`convex/channels.ts`)
- [x] Episode management functions (`convex/episodes.ts`)
- [x] Scanning form UI component (`components/forms/ScanInputForm.tsx`)
- [x] API pública para iniciar escaneos desde el dashboard (`/api/youtube/scan`)
- [x] Acción Convex para registrar fuentes y descargar episodios (`convex/channelActions.ts`)
- [x] Episodes listing UI component (`components/episodes/EpisodeList.tsx`)
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

### **Fase 6: Feedback & Re-ranking (COMPLETED)** ✅
- [x] Sistema de feedback contextual con botones “Útil / No útil” y motivos configurables por fragmento
- [x] Algoritmo de re-ranking que combina confianza del modelo y señal de feedback humano
- [x] Tableros de métricas con cobertura, tasa de acierto y ranking promedio por episodio
- [x] Análisis de patrones de error y recomendaciones automáticas para iterar los prompts de clasificación

## ✅ **Validation Results**
- `npm run lint`
- `npm run type-check`

## 🚀 **Next Phase: QA & Launch Readiness (Fase 7)**
- Revisión end-to-end de flujos críticos con smoke tests automatizados
- Documentación de procesos de soporte y resolución de falsos positivos
- Preparación de materiales para entrenamiento interno del equipo VoyBien

### Documentación clave
- `docs/architecture.md` — Mapa del sistema y flujos end-to-end
- `docs/decisions.md` — Registro vivo de decisiones técnicas (ADRs ligeros)
- `docs/pitfalls.md` — Lista de gotchas y errores comunes
- `docs/checklists.md` — Checklists de setup, QA y releases
- `docs/rewrite-playbook.md` — Guía táctica para reconstruir el proyecto con los aprendizajes actuales
