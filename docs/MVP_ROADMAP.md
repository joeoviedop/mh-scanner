# MVP Roadmap - Podcast Therapy Scanner v0.1

Este documento define el plan de implementación del MVP en fases organizadas y accionables.

---

## 🎯 Objetivo del MVP

Construir una herramienta funcional interna para el equipo de VoyBien que permita:

1. Escanear canales/playlists de YouTube
2. Detectar menciones sobre terapia/salud mental
3. Clasificar y rankear esas menciones
4. Exportar resultados para análisis

**Timeline estimado**: 4-6 semanas  
**Criterio de éxito**: Usuario puede escanear un canal y obtener CSV con menciones detectadas y clasificadas

---

## 📋 Features del MVP

### Must Have (Bloqueantes)

- ✅ Formulario de input (URL + date range)
- ✅ Listado de episodios encontrados
- ✅ Detección de transcripciones disponibles
- ✅ Procesamiento de transcripciones
- ✅ Detección de menciones con keywords
- ✅ Clasificación con LLM (GPT-4 mini)
- ✅ Vista de fragmentos detectados
- ✅ Feedback Útil/No útil
- ✅ Exportación a CSV
- ✅ Autenticación con passcode

### Should Have (Importantes pero no bloqueantes)

- ⏳ Vista de transcripción completa con highlights
- ⏳ Exportación a Google Sheets
- ⏳ Re-ranking basado en feedback
- ⏳ Filtros por tipo de mención
- ⏳ Edición de timestamps

### Could Have (Nice to have)

- ⏳ Batch processing de múltiples episodios
- ⏳ Dashboard con stats
- ⏳ Progress indicators durante procesamiento
- ⏳ Cache de YouTube API calls

### Won't Have (Fuera del MVP)

- ❌ Transcripción automática con Whisper
- ❌ Descubrimiento automático de canales (Apify)
- ❌ Sistema de comentarios/asignaciones
- ❌ Métricas avanzadas
- ❌ Generación de Clip Kits

---

## 🚀 Fases de Implementación

### **Fase 0: Setup & Foundation** (3-5 días)

#### 0.1 Inicialización del Proyecto

- [ ] Crear proyecto Next.js 14 con TypeScript
- [ ] Instalar dependencias core (React, Next, Tailwind)
- [ ] Configurar TypeScript (`tsconfig.json`)
- [ ] Configurar ESLint y Prettier
- [ ] Setup Git + `.gitignore`

#### 0.2 Setup de Convex

- [ ] Crear cuenta en Convex
- [ ] Instalar Convex SDK
- [ ] Inicializar proyecto Convex (`npx convex dev`)
- [ ] Crear `convex/schema.ts` con tablas básicas

#### 0.3 Obtención de API Keys

- [ ] YouTube Data API key (Google Cloud Console)
- [ ] OpenAI API key
- [ ] Google Service Account (para Sheets - fase posterior)
- [ ] Configurar `.env.local` con todas las keys

#### 0.4 Estructura de Carpetas

- [ ] Crear estructura según `ARCHITECTURE.md`:
  - `/app` (routes)
  - `/components` (UI)
  - `/lib` (utils, integrations, processing)
  - `/convex` (backend)
  - `/hooks` (custom hooks)
  - `/docs` (documentation)

#### 0.5 Base UI Setup

- [ ] Configurar Tailwind con brand colors
- [ ] Instalar shadcn/ui (opcional)
- [ ] Crear layout base con Header/Footer
- [ ] Crear página 404

**Deliverable**: Proyecto inicializado, estructura creada, dev environment funcional

---

### **Fase 1: Autenticación Simple** (1-2 días)

#### 1.1 Página de Login

- [ ] Crear `/app/(auth)/login/page.tsx`
- [ ] Form con input de passcode
- [ ] Validación client-side básica

#### 1.2 Verificación de Passcode

- [ ] API route: `/app/api/auth/verify-passcode/route.ts`
- [ ] Comparar con `INTERNAL_PASSCODE` de env
- [ ] Generar token simple (JWT o session cookie)

#### 1.3 Protección de Rutas

- [ ] Middleware para verificar autenticación
- [ ] Redirect a `/login` si no autenticado
- [ ] Guardar estado de auth en Context o cookie

#### 1.4 SEO Blocking

- [ ] Agregar meta tags `noindex, nofollow` en layout
- [ ] Crear `robots.txt` que bloquea todo
- [ ] Configurar headers en `next.config.js`

**Deliverable**: Sistema de auth funcional, app no indexable

---

### **Fase 2: Input & Scanning** (5-7 días)

#### 2.1 UI - Formulario de Escaneo

- [ ] Crear `/app/(dashboard)/page.tsx`
- [ ] Componente `ScanInputForm.tsx`:
  - Input de URL (channel o playlist)
  - Selector de date range con presets
  - Botón "Escanear"
  - Validación de URL de YouTube

#### 2.2 YouTube URL Parser

- [ ] Crear `/lib/utils/url-parser.ts`
- [ ] Extraer channel ID o playlist ID
- [ ] Detectar tipo (channel vs playlist)
- [ ] Validar formato

#### 2.3 YouTube Data API Integration

- [ ] Crear `/lib/integrations/youtube/client.ts`
  - Inicializar cliente de YouTube API
  - Manejo de rate limits
  - Error handling
- [ ] Crear `/lib/integrations/youtube/episodes.ts`
  - `fetchChannelVideos(channelId, dateRange)`
  - `fetchPlaylistVideos(playlistId, dateRange)`
  - Filtrar por date range
  - Paginación (máx 50 resultados)

#### 2.4 Convex Backend - Channels & Episodes

- [ ] Implementar Convex schema para `channels` y `episodes`
- [ ] Crear mutations:
  - `createChannel(data)`
  - `bulkCreateEpisodes(episodeData[])`
- [ ] Crear queries:
  - `getChannelById(id)`
  - `listEpisodesByChannel(channelId)`

#### 2.5 API Route - Scan Channel

- [ ] Crear `/app/api/youtube/scan-channel/route.ts`
- [ ] Flow:
  1. Parse URL
  2. Fetch videos de YouTube API
  3. Crear canal en Convex
  4. Crear episodios en batch
  5. Return channel ID + episode count

#### 2.6 UI - Listado de Episodios

- [ ] Crear `/app/(dashboard)/episodes/page.tsx`
- [ ] Componente `EpisodeList.tsx`
- [ ] Componente `EpisodeCard.tsx`:
  - Thumbnail
  - Título
  - Fecha de publicación
  - Duración
  - Estado de transcripción (badge)
- [ ] Loading states
- [ ] Error handling

**Deliverable**: Usuario puede escanear un canal y ver listado de episodios

---

### **Fase 3: Transcription Fetching** (3-5 días)

#### 3.1 YouTube Captions API Integration

- [ ] Crear `/lib/integrations/youtube/captions.ts`
- [ ] `fetchCaptions(videoId)`:
  - Obtener lista de captions disponibles
  - Priorizar español (es, es-MX, es-ES)
  - Fetch caption track
  - Parse formato de captions (XML o SRT)
  - Convertir a formato unificado con timestamps

#### 3.2 Convex Backend - Transcriptions

- [ ] Implementar schema para `transcriptions`
- [ ] Crear mutation:
  - `createTranscription(episodeId, data)`
- [ ] Crear query:
  - `getTranscriptionByEpisode(episodeId)`

#### 3.3 API Route - Fetch Captions

- [ ] Crear `/app/api/youtube/fetch-captions/route.ts`
- [ ] Flow:
  1. Recibir episodeId
  2. Fetch captions de YouTube
  3. Guardar en Convex (transcriptions)
  4. Actualizar episode status
  5. Return transcription ID

#### 3.4 UI - Procesamiento de Episodios

- [ ] Agregar botón "Procesar" en `EpisodeCard`
- [ ] Agregar "Procesar Todos" en `EpisodeList`
- [ ] Loading indicator durante fetch
- [ ] Actualizar estado en tiempo real (Convex reactivity)

#### 3.5 Error Handling

- [ ] Manejar videos sin transcripción
- [ ] Manejar transcripciones en otros idiomas
- [ ] Mostrar mensajes de error claros al usuario

**Deliverable**: Usuario puede obtener transcripciones de episodios

---

### **Fase 4: Mention Detection & Classification** (7-10 días)

#### 4.1 Keyword Filter

- [ ] Crear `/lib/constants/keywords.ts`
  - Lista de keywords de terapia/salud mental
  - Variaciones y sinónimos
- [ ] Crear `/lib/processing/keyword-filter.ts`
  - `findKeywordMatches(text, keywords)`
  - Buscar todas las ocurrencias
  - Return: posiciones de matches

#### 4.2 Context Extractor

- [ ] Crear `/lib/processing/context-extractor.ts`
- [ ] `extractContext(transcription, matchPosition, windowSize = 45)`
  - Extraer ±45 segundos alrededor del match
  - Incluir timestamps
  - Return: context object con text + timestamps

#### 4.3 OpenAI Integration

- [ ] Crear `/lib/integrations/llm/client.ts`
  - Inicializar OpenAI client
  - Configurar GPT-4 mini
  - Manejo de rate limits y errores
- [ ] Crear `/lib/integrations/llm/prompts.ts`
  - Prompt para clasificación de menciones
  - Include instructions para:
    - Verificar si es mención genuina
    - Clasificar tipo (testimonio, recomendación, etc.)
    - Evaluar tono
    - Detectar sensibilidad
    - Calcular confidence

#### 4.4 Mention Detector

- [ ] Crear `/lib/processing/mention-detector.ts`
- [ ] `detectMentions(transcription)`:
  1. Run keyword filter
  2. Para cada match:
     - Extract context
     - Classify con LLM
     - Return fragment object

#### 4.5 Convex Backend - Fragments

- [ ] Implementar schema para `fragments`
- [ ] Crear mutations:
  - `createFragment(data)`
  - `bulkCreateFragments(fragments[])`
- [ ] Crear queries:
  - `listFragmentsByEpisode(episodeId)`
  - `getFragmentById(id)`

#### 4.6 Convex Action - Process Episode

- [ ] Crear `/convex/actions.ts`
- [ ] Action `processEpisode(episodeId)`:
  1. Get transcription
  2. Detect mentions
  3. For each mention:
     - Classify with LLM (external API call)
     - Save fragment
  4. Update episode status to "processed"

#### 4.7 API Route - Process Episode

- [ ] Crear `/app/api/process/detect-mentions/route.ts`
- [ ] Trigger Convex action
- [ ] Stream progress updates (opcional)

#### 4.8 Timestamp Helper

- [ ] Crear `/lib/utils/timestamp-helpers.ts`
- [ ] `formatTimestamp(seconds)` → "1:23:45"
- [ ] `generateYouTubeUrl(videoId, timestamp)` → URL con &t=

**Deliverable**: Episodios procesados con menciones detectadas y clasificadas

---

### **Fase 5: Review Interface** (5-7 días)

#### 5.1 UI - Episode Detail Page

- [ ] Crear `/app/(dashboard)/episodes/[id]/page.tsx`
- [ ] Layout con dos columnas:
  - Columna izquierda: Lista de fragmentos
  - Columna derecha: Player de YouTube embebido

#### 5.2 Fragment Card Component

- [ ] Crear `/components/fragments/FragmentCard.tsx`
- [ ] Mostrar:
  - Trigger phrase (highlighted)
  - Context text
  - Timestamp (clickable)
  - Classification badges (tipo, tono)
  - Confidence score (progress bar)
  - Sensitivity warnings (si aplica)
- [ ] Botones de acción:
  - "Útil" / "No útil"
  - Copiar URL con timestamp
  - Ver en YouTube (new tab)

#### 5.3 Fragment List Component

- [ ] Crear `/components/fragments/FragmentList.tsx`
- [ ] Listar todos los fragmentos del episodio
- [ ] Ordenar por:
  - Timestamp (default)
  - Confidence score
  - Rank score (si ya hay feedback)
- [ ] Filtros:
  - Por tipo de mención
  - Por nivel de confidence
  - Solo revisados / no revisados

#### 5.4 Transcript View (opcional - Should Have)

- [ ] Crear `/components/fragments/TranscriptView.tsx`
- [ ] Mostrar transcripción completa
- [ ] Highlight fragmentos detectados
- [ ] Click en highlight → scroll a fragment card

#### 5.5 YouTube Player Integration

- [ ] Embed YouTube player con react-player o iframe
- [ ] Sincronizar con timestamp al hacer click
- [ ] Auto-play en timestamp

**Deliverable**: Interfaz completa de revisión de menciones

---

### **Fase 6: Feedback & Re-ranking** (3-5 días)

#### 6.1 Convex Backend - Feedback

- [ ] Implementar schema para `feedback`
- [ ] Crear mutations:
  - `submitFeedback(fragmentId, isUseful)`
- [ ] Crear queries:
  - `getFeedbackByFragment(fragmentId)`
  - `getFeedbackStats()`

#### 6.2 Re-ranker Logic

- [ ] Crear `/lib/processing/reranker.ts`
- [ ] `calculateRankScore(fragment, feedbackHistory)`:
  - Factor en confidence
  - Factor en feedback positivo/negativo
  - Factor en classification type
  - Return: updated rank score

#### 6.3 Feedback Buttons Component

- [ ] Crear `/components/fragments/FeedbackButtons.tsx`
- [ ] Toggle entre Útil / No útil
- [ ] Visual feedback (color change)
- [ ] Guardar en Convex

#### 6.4 Re-ranking Trigger

- [ ] Después de cada feedback:
  - Trigger re-ranking de fragmentos similares
  - Actualizar rank scores en Convex
  - UI re-render con nuevo orden

**Deliverable**: Sistema de feedback funcional con re-ranking

---

### **Fase 7: Export Functionality** (3-4 días)

#### 7.1 CSV Export

- [ ] Crear `/lib/utils/csv-generator.ts`
- [ ] `generateCSV(fragments)`:
  - Convertir array de fragmentos a CSV format
  - Columnas:
    - Video Title
    - Video URL
    - Timestamp
    - Trigger Phrase
    - Context
    - Classification Type
    - Tone
    - Confidence
    - YouTube Link with Timestamp
    - Useful (Yes/No)

#### 7.2 API Route - Export CSV

- [ ] Crear `/app/api/export/csv/route.ts`
- [ ] Accept: array de fragmentIds o episodeId
- [ ] Generate CSV
- [ ] Return: file download

#### 7.3 Export Buttons Component

- [ ] Crear `/components/export/ExportButtons.tsx`
- [ ] Botones:
  - "Exportar a CSV" (este episodio)
  - "Exportar a CSV" (todos los episodios del canal)
- [ ] Trigger download

#### 7.4 Google Sheets Export (opcional - Should Have)

- [ ] Crear `/lib/integrations/google-sheets/client.ts`
  - Setup Google Service Account
  - Authenticate
- [ ] Crear `/lib/integrations/google-sheets/exporter.ts`
  - `exportToSheet(fragments, sheetId)`
  - Append rows to existing sheet
- [ ] API Route: `/app/api/export/google-sheets/route.ts`
- [ ] Agregar botón "Exportar a Google Sheets"

**Deliverable**: Funcionalidad de exportación completa

---

### **Fase 8: Polish & Testing** (3-5 días)

#### 8.1 Error Handling & Validation

- [ ] Validar inputs en todos los API routes
- [ ] Mostrar mensajes de error user-friendly
- [ ] Error boundaries en componentes críticos
- [ ] Logging de errores para debugging

#### 8.2 Loading States

- [ ] Skeleton loaders en listas
- [ ] Spinners durante API calls
- [ ] Progress indicators para batch processing
- [ ] Disable buttons durante loading

#### 8.3 Empty States

- [ ] No channels scanned yet
- [ ] No episodes found
- [ ] No transcription available
- [ ] No mentions detected

#### 8.4 Responsive Design

- [ ] Mobile-friendly (básico)
- [ ] Tablet-friendly
- [ ] Desktop optimizado

#### 8.5 Performance Optimization

- [ ] Lazy loading de componentes pesados
- [ ] Memoization de queries repetitivas
- [ ] Implementar cache básico (opcional)

#### 8.6 Manual Testing

- [ ] Test completo del happy path:
  1. Login
  2. Scan channel
  3. Fetch transcriptions
  4. Process episodes
  5. Review fragments
  6. Give feedback
  7. Export CSV
- [ ] Test error scenarios:
  - Invalid URL
  - No transcription available
  - API rate limits
  - Network errors

#### 8.7 Documentation

- [ ] Actualizar README con:
  - Setup instructions
  - Usage guide
  - Screenshots
- [ ] Crear `docs/API.md` con API endpoints
- [ ] Crear `docs/DEPLOYMENT.md` con deployment steps

**Deliverable**: MVP pulido, testeado y documentado

---

### **Fase 9: Deployment** (2-3 días)

#### 9.1 Vercel Setup

- [ ] Crear proyecto en Vercel
- [ ] Conectar repo de GitHub
- [ ] Configurar environment variables:
  - All API keys
  - Passcode
  - Convex URL

#### 9.2 Convex Deployment

- [ ] Deploy Convex production:
  - `npx convex deploy`
- [ ] Configurar Convex production URL
- [ ] Verificar schema en production

#### 9.3 Domain Configuration

- [ ] Configurar subdominio `internal.voybien.com`
- [ ] Configurar SSL (automático con Vercel)
- [ ] Verificar headers de seguridad

#### 9.4 Production Testing

- [ ] Test completo en production
- [ ] Verificar que APIs funcionan
- [ ] Verificar rate limits
- [ ] Monitorear logs

#### 9.5 Launch Checklist

- [ ] ✅ Auth funcional
- [ ] ✅ Scanning funcional
- [ ] ✅ Processing funcional
- [ ] ✅ Export funcional
- [ ] ✅ No indexable por Google
- [ ] ✅ HTTPS only
- [ ] ✅ Error tracking configurado
- [ ] ✅ Backups configurados (Convex auto)

**Deliverable**: MVP en producción y accesible

---

## 📊 Progress Tracking

### Checklist Global del MVP

**Fase 0: Setup & Foundation**

- [ ] 0.1 Inicialización del Proyecto
- [ ] 0.2 Setup de Convex
- [ ] 0.3 Obtención de API Keys
- [ ] 0.4 Estructura de Carpetas
- [ ] 0.5 Base UI Setup

**Fase 1: Autenticación Simple**

- [ ] 1.1 Página de Login
- [ ] 1.2 Verificación de Passcode
- [ ] 1.3 Protección de Rutas
- [ ] 1.4 SEO Blocking

**Fase 2: Input & Scanning**

- [ ] 2.1 UI - Formulario de Escaneo
- [ ] 2.2 YouTube URL Parser
- [ ] 2.3 YouTube Data API Integration
- [ ] 2.4 Convex Backend - Channels & Episodes
- [ ] 2.5 API Route - Scan Channel
- [ ] 2.6 UI - Listado de Episodios

**Fase 3: Transcription Fetching**

- [ ] 3.1 YouTube Captions API Integration
- [ ] 3.2 Convex Backend - Transcriptions
- [ ] 3.3 API Route - Fetch Captions
- [ ] 3.4 UI - Procesamiento de Episodios
- [ ] 3.5 Error Handling

**Fase 4: Mention Detection & Classification**

- [ ] 4.1 Keyword Filter
- [ ] 4.2 Context Extractor
- [ ] 4.3 OpenAI Integration
- [ ] 4.4 Mention Detector
- [ ] 4.5 Convex Backend - Fragments
- [ ] 4.6 Convex Action - Process Episode
- [ ] 4.7 API Route - Process Episode
- [ ] 4.8 Timestamp Helper

**Fase 5: Review Interface**

- [ ] 5.1 UI - Episode Detail Page
- [ ] 5.2 Fragment Card Component
- [ ] 5.3 Fragment List Component
- [ ] 5.4 Transcript View (opcional)
- [ ] 5.5 YouTube Player Integration

**Fase 6: Feedback & Re-ranking**

- [ ] 6.1 Convex Backend - Feedback
- [ ] 6.2 Re-ranker Logic
- [ ] 6.3 Feedback Buttons Component
- [ ] 6.4 Re-ranking Trigger

**Fase 7: Export Functionality**

- [ ] 7.1 CSV Export
- [ ] 7.2 API Route - Export CSV
- [ ] 7.3 Export Buttons Component
- [ ] 7.4 Google Sheets Export (opcional)

**Fase 8: Polish & Testing**

- [ ] 8.1 Error Handling & Validation
- [ ] 8.2 Loading States
- [ ] 8.3 Empty States
- [ ] 8.4 Responsive Design
- [ ] 8.5 Performance Optimization
- [ ] 8.6 Manual Testing
- [ ] 8.7 Documentation

**Fase 9: Deployment**

- [ ] 9.1 Vercel Setup
- [ ] 9.2 Convex Deployment
- [ ] 9.3 Domain Configuration
- [ ] 9.4 Production Testing
- [ ] 9.5 Launch Checklist

---

## 🚨 Risks & Mitigation

### Risk 1: YouTube API Rate Limits

**Impacto**: Alto  
**Probabilidad**: Media  
**Mitigación**:

- Implementar cache de llamadas
- Limitar número de episodios por scan (max 50)
- Considerar múltiples API keys en rotación

### Risk 2: OpenAI Costs

**Impacto**: Medio  
**Probabilidad**: Media  
**Mitigación**:

- Usar GPT-4 mini (más barato)
- Filtrar con keywords antes del LLM
- Limitar contexto a ±45s (no texto completo)
- Monitorear costos diariamente

### Risk 3: Videos sin Transcripción

**Impacto**: Medio  
**Probabilidad**: Alta  
**Mitigación**:

- Mostrar claramente cuáles tienen transcripción
- Preparar Whisper API para fase 2
- Educar al usuario sobre limitación

### Risk 4: Clasificación Incorrecta del LLM

**Impacto**: Medio  
**Probabilidad**: Media  
**Mitigación**:

- Iterar en el prompt
- Mostrar confidence score
- Sistema de feedback para mejorar
- Revisión manual siempre requerida

### Risk 5: Performance con Muchos Episodios

**Impacto**: Bajo  
**Probabilidad**: Baja  
**Mitigación**:

- Paginación en listas
- Lazy loading
- Batch processing limitado (max 10 simultáneos)

---

## 📈 Success Metrics

### MVP Success Criteria

- [ ] Usuario puede escanear un canal en < 30 segundos
- [ ] 80%+ de episodios con transcripción son procesados sin errores
- [ ] LLM detecta al menos 5 menciones por episodio relevante
- [ ] Exportación a CSV funciona en < 5 segundos
- [ ] Zero security incidents
- [ ] Uptime > 99%

### Post-MVP Metrics (para evaluar)

- Número de canales escaneados por semana
- Número de menciones detectadas
- Tasa de feedback positivo (Útil vs No útil)
- Tiempo promedio de revisión por episodio
- Exportaciones realizadas

---

## 🔄 Post-MVP Roadmap (Fase 2)

### Short-term (1-2 meses post-MVP)

1. **Whisper Integration**: Transcripción automática
2. **Google Sheets Export**: Integración completa
3. **Batch Processing**: Procesar múltiples episodios simultáneamente
4. **Dashboard**: Stats y métricas agregadas

### Medium-term (3-6 meses post-MVP)

1. **Apify Integration**: Descubrimiento automático de canales
2. **Advanced Filtering**: Filtros complejos por sensibilidad, tone, etc.
3. **Collaboration**: Sistema de comentarios y asignaciones
4. **Webhook Notifications**: Notificar cuando se detectan menciones nuevas

### Long-term (6+ meses post-MVP)

1. **Clip Kit Generator**: Generación automática de briefs
2. **Video Editing Integration**: Conexión con herramientas de edición
3. **Analytics Dashboard**: Métricas avanzadas y visualizaciones
4. **Multi-language Support**: Soporte para inglés y otros idiomas

---

## 📝 Notes & Assumptions

### Assumptions

- Videos tienen subtítulos en español (YouTube Captions)
- GPT-4 mini es suficiente para clasificación
- Equipo de VoyBien tiene cuentas necesarias (Google Cloud, OpenAI, Convex)
- Subdominio `internal.voybien.com` está disponible
- Max 10 usuarios concurrentes (herramienta interna)

### Out of Scope para MVP

- Mobile app nativa
- Usuarios múltiples con roles
- Sistema de permisos granular
- Integraciones con redes sociales
- Automatización de publicación

---

**Versión**: MVP v0.1  
**Última actualización**: Octubre 2025  
**Autor**: Joe Oviedo / VoyBien Team

---

**Next Steps**:  
Una vez aprobado este roadmap, comenzar con Fase 0: Setup & Foundation
