# Changelog - Podcast Therapy Scanner

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Fallback público mediante `lib/integrations/youtube/watchPage.ts` para obtener subtítulos desde `ytInitialPlayerResponse`
- Conversión automática de pistas `srv3` a segmentos (misma estructura TTML)
- Soporte para subtítulos WebVTT y traducciones automáticas (`tlang`) desde timedtext
- Registro enriquecido de depuración cuando no se encuentran subtítulos públicos
- Integración opcional con Apify (`lib/integrations/apify/transcript.ts`) para obtener transcripciones cuando YouTube no expone subtítulos públicos

### Changed
- El flujo de transcripción ya no requiere OAuth; `lib/integrations/youtube/captions.ts` prioriza subtítulos públicos (watch page + timedtext)
- `convex/transcriptionActions.fetchCaptionsForEpisode` depende exclusivamente del nuevo mecanismo público
- `channelActions.scanSource` omite Shorts (videos < 2 minutos) y reporta episodios descartados en el resumen

## [0.5.1] - 2025-01-10 - **Dashboard Scanning UI**

### Added
- Formulario en el dashboard para registrar canales, playlists o videos y disparar el escaneo inicial
- API pública `/api/youtube/scan` que valida URLs y delega en Convex la descarga de episodios
- Acción `channelActions.scanSource` para crear/actualizar fuentes en Convex y poblar episodios automáticamente
- Navegación en el header hacia la vista de episodios

### Changed
- `/dashboard/episodes` se consolidó como la ruta oficial para gestionar transcripciones y detecciones

## [0.5.0] - 2025-01-10 - **Fase 4 Complete** ✅

### 🎆 **MILESTONE: Mention Detection & Classification Implemented**
**Progress: 70% Complete** - Episodios listos con hallazgos clasificados por IA

### Added
- **Keyword Detection Pipeline**
  - `lib/processing/keyword-filter.ts` para coincidencias con ventana de contexto ±45s
  - Nuevas listas de keywords normalizadas (`lib/constants/therapy-keywords.ts`)
- **OpenAI GPT-4 mini Integration**
  - Cliente tipado con respuesta JSON (`lib/integrations/llm/openai.ts`)
  - Acción Convex `mentionActions.detectMentionsForEpisode` con soporte de scanJobs
- **Fragments Persistence & API**
  - Mutaciones y queries en `convex/fragments.ts`
  - Endpoint `/api/episodes/[episodeId]/fragments` para consumo desde el dashboard
- **Dashboard Enhancements**
  - Vista de fragmentos clasificados en `app/(dashboard)/episodes/EpisodesPageClient.tsx`
  - Controles para disparar detección de menciones desde la UI

### Changed
- Actualización de `convex/scanJobs.ts` para manejar nuevos tipos de trabajos
- `convex/episodes.ts` ahora agrega métricas de menciones (conteo y confianza promedio)

### Validation
- `npm run lint`
- `npm run type-check`

## [0.4.0] - 2025-01-10 - **Fase 3 Complete** ✅

### 🎆 **MILESTONE: Transcription & Processing Implemented**
**Progress: 60% Complete** - Transcripciones automáticas listas para análisis

### Added
- **YouTube Captions Pipeline**
  - Cliente TTML con priorización de español (`lib/integrations/youtube/captions.ts`)
  - Acción Convex `transcriptionActions.fetchCaptionsForEpisode`
  - Mutaciones `convex/transcriptions.ts` para guardar segmentos y metadata
- **Scan Jobs Support**
  - Nuevo módulo `convex/scanJobs.ts` para crear/actualizar jobs
- **API Routes**
  - `/api/youtube/fetch-captions` para solicitar transcripciones
- **Dashboard Enhancements**
  - Actualización de `EpisodeList.tsx` con controles de transcripción
  - Nueva página `app/(dashboard)/episodes/page.tsx` + cliente asociado

### Changed
- `convex/episodes.ts` amplió estados (`transcribing`) y tiempos de procesamiento
- README/WARP actualizados a reflejar progreso y comandos

### Validation
- `npm run lint`
- `npm run type-check`

## [0.3.0] - 2025-01-10 - **Fase 2 Complete** ✅

### 🎆 **MILESTONE: Input & Scanning Infrastructure Implemented**
**Progress: 50% Complete** - Ready for YouTube transcription and processing functionality

### Added
- **Complete YouTube Integration**:
  - YouTube URL parser supporting channels, playlists, videos (`src/lib/youtube-parser.ts`)
  - YouTube Data API client with rate limiting and error handling (`src/lib/youtube-api.ts`)
  - Comprehensive type safety with Zod schemas
- **Complete Convex Database**:
  - Full schema with 6 tables: channels, episodes, transcriptions, fragments, feedback, scanJobs
  - Channel management functions with CRUD operations (`convex/channels.ts`)
  - Episode management functions with status tracking (`convex/episodes.ts`)
  - 33 optimized database indexes automatically generated
- **User Interface Components**:
  - Professional scanning form with URL validation and preview (`src/components/forms/ScanInputForm.tsx`)
  - Episodes listing with status indicators and stats (`src/components/episodes/EpisodeList.tsx`)
  - Responsive design with loading states and error handling
- **Infrastructure & Development**:
  - Updated NPM scripts: `convex:dev` and `convex:deploy`
  - Complete `.env.local.example` with all environment variables
  - Enhanced dependencies: react-hook-form, @hookform/resolvers, zod, date-fns

### Technical Implementation
- **Database Schema**: Complete Convex schema with proper relationships and indexing
- **API Integration**: YouTube Data API v3 with comprehensive error handling
- **Type Safety**: Full TypeScript implementation with Zod validation
- **Component Architecture**: Reusable, maintainable React components
- **Development Workflow**: Enhanced build pipeline and validation

### Changed
- Updated project progress to 50% complete
- Enhanced development commands and workflow
- Improved documentation and architecture planning

## [0.2.0] - 2025-01-10 - **Fase 1 Complete** ✅

### 🎆 **MILESTONE: Authentication System Implemented**
**Progress: 30% Complete** - Ready for YouTube scanning functionality

### Added
- **Complete Authentication System**:
  - Passcode-based login with rate limiting (5 attempts/min)
  - Session management with 24h JWT + secure httpOnly cookies
  - Route protection middleware
  - Login page with VoyBien branding
  - Dashboard layout with logout functionality
- **Security Features**:
  - SHA-256 hashing with timing-safe comparisons
  - HTTPS-only cookies in production
  - SameSite strict cookie policy
  - Rate limiting protection against brute force
- **UI Components**:
  - Professional login page with error handling
  - Protected dashboard layout
  - Logout button with loading states
  - Responsive design with Tailwind CSS

### Technical Implementation
- **Authentication Library**: Custom JWT implementation in `/lib/auth.ts`
- **API Routes**: `/api/auth/verify-passcode` and `/api/auth/logout`
- **Middleware**: Route protection in `/middleware.ts`
- **Pages**: Login form in `/app/(auth)/login/` and dashboard in `/app/(dashboard)/`

### Changed
- Updated project progress to 30% complete
- Root page now redirects to dashboard (or login if unauthenticated)

## [0.1.1] - 2025-01-07 - **Fase 0 VALIDATED** ✅

### 🎆 **MILESTONE: Foundation Validated & Production Ready**
**Progress: 20% Complete** - All validations passing, ready for authentication

### Added
- **Complete Validation Suite**:
  - npm ci: Dependencies management tested
  - npm run lint: ESLint configuration validated
  - npm run type-check: TypeScript strict mode passing
  - npm run build: Production build successful (3.3s)
  - npm run format: Prettier applied to entire codebase
- **Enhanced Foundation**:
  - Prettier configuration (.prettierrc) with project standards
  - Base UI components (Header.tsx, Footer.tsx, not-found.tsx)
  - Convex schema foundation (schema.ts placeholder)
  - SEO blocking complete (robots.txt + X-Robots-Tag headers)
  - PostCSS pipeline for TailwindCSS 4 compatibility

### Fixed
- Next.js 15 serverActions configuration updated to object format
- TailwindCSS 4 PostCSS plugin configuration corrected
- TypeScript compatibility issues resolved

### Changed
- Updated TailwindCSS to version 4.1.14
- Enhanced project documentation with validation results
- Progress tracking updated to reflect 20% completion

## [0.1.0] - 2025-01-07 - **Fase 0 Complete** ✅

### 🎆 **MILESTONE: Foundation Established**
**Progress: 15% Complete** - Ready for Fase 1: Authentication

### Added
- **Core Setup**:
  - Next.js 15.5.4 with App Router
  - TypeScript with strict configuration and path aliases
  - TailwindCSS for styling with brand colors
  - ESLint 8.57.0 with TypeScript compatibility
- **Security & SEO**:
  - SEO blocking (noindex/nofollow) for internal tool
  - YouTube thumbnails domain configuration
- **Project Structure**:
  - Clean architecture following ARCHITECTURE.md
  - Proper .gitignore configuration
  - Complete folder structure setup
- **Documentation Suite**:
  - ARCHITECTURE.md: Technical architecture and folder structure
  - PROJECT_SETUP.md: Development guidelines and conventions
  - MVP_ROADMAP.md: 9-phase implementation plan
  - CONVEX_SCHEMA_PLAN.md: Database schema and data flow
  - WARP.md: Agent guidance and project overview
- **Development Environment**:
  - Git repository with proper history
  - Development server ready
  - All tooling configured and working

### ⚙️ **Technical Specifications Achieved**
- **Framework**: Next.js 15.5.4 (latest, exceeds requirement of 14+)
- **Language**: TypeScript with strict mode
- **Styling**: TailwindCSS 4.1.14 with PostCSS pipeline
- **Quality**: ESLint + TypeScript ESLint for code quality
- **Architecture**: App Router structure ready for scalability
- **SEO**: Complete blocking for internal tool privacy

### 🚀 **Ready for Next Phase**
- **Fase 1: Authentication** - Simple passcode system
- **Target**: Login page, route protection, session management
- **Timeline**: 1-2 days according to MVP_ROADMAP.md

### 📈 **Project Health**
- **Documentation**: Comprehensive and up-to-date with validation results
- **Code Quality**: ESLint passing, TypeScript strict mode, Prettier applied
- **Architecture**: Clean, scalable, follows best practices
- **Version Control**: Proper commit history with conventional commits
- **Dependencies**: All up-to-date and compatible
- **Build System**: Production build optimized (3.3s compile time)
- **Validation**: All development tools working correctly
- **Branch Management**: Feature branch ready for PR merge

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Git repository initialization
- Basic project structure

### Changed

### Deprecated

### Removed

### Fixed

### Security