# Arquitectura - Podcast Therapy Scanner MVP v0.1

## Visión General

Podcast Therapy Scanner es una web app interna diseñada para el equipo de VoyBien que permite escanear canales y playlists de YouTube para detectar menciones sobre terapia y salud mental en videopodcasts en español.

## Stack Tecnológico

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui (opcional)
- **State Management**: React Context + Hooks
- **Type Safety**: TypeScript

### Backend

- **API**: Next.js API Routes (App Router)
- **Database & Real-time**: Convex (NoSQL serverless)
- **Cron Jobs**: Vercel Cron Jobs
- **Cache**: Opcional - Upstash Redis / Vercel KV

### Integraciones Externas

- **YouTube Data API v3**: Listar episodios
- **YouTube Captions API**: Obtener transcripciones
- **LLM**: GPT-4 mini (OpenAI API)
- **Google Sheets API**: Exportación de resultados
- **Apify**: Preparado pero no activo en MVP

### Hosting & Deploy

- **Hosting**: Vercel
- **Domain**: internal.voybien.com
- **Environment**: Staging + Production

---

## Estructura del Proyecto

```
mh-scanner/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   └── login/                # Página de login con passcode
│   ├── (dashboard)/              # Main app route group
│   │   ├── page.tsx              # Dashboard principal / Input form
│   │   ├── episodes/             # Listado de episodios
│   │   │   ├── page.tsx          # Lista de episodios
│   │   │   └── [id]/             # Detalle de episodio individual
│   │   │       ├── page.tsx      # Vista de revisión (fragmentos + transcripción)
│   │   │       └── loading.tsx
│   │   └── layout.tsx            # Layout del dashboard
│   ├── api/                      # API Routes
│   │   ├── youtube/              # Endpoints YouTube
│   │   │   ├── fetch-episodes/
│   │   │   └── fetch-captions/
│   │   ├── process/              # Processing endpoints
│   │   │   ├── detect-mentions/
│   │   │   └── classify-fragments/
│   │   ├── export/               # Export endpoints
│   │   │   ├── csv/
│   │   │   └── google-sheets/
│   │   └── auth/                 # Simple auth
│   │       └── verify-passcode/
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── not-found.tsx
│
├── components/                   # React components
│   ├── ui/                       # Base UI components (shadcn/ui)
│   ├── forms/                    # Form components
│   │   ├── ScanInputForm.tsx     # Formulario principal de escaneo
│   │   └── DateRangeSelector.tsx
│   ├── episodes/                 # Episode-related components
│   │   ├── EpisodeList.tsx
│   │   ├── EpisodeCard.tsx
│   │   └── EpisodeFilters.tsx
│   ├── fragments/                # Fragment/mention components
│   │   ├── FragmentCard.tsx      # Tarjeta individual de mención
│   │   ├── FragmentList.tsx
│   │   ├── TranscriptView.tsx    # Vista de transcripción completa
│   │   └── FeedbackButtons.tsx   # Útil/No útil
│   ├── export/                   # Export components
│   │   └── ExportButtons.tsx
│   └── layout/                   # Layout components
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Sidebar.tsx
│
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── channels.ts               # Queries/mutations para canales
│   ├── episodes.ts               # Queries/mutations para episodios
│   ├── transcriptions.ts         # Queries/mutations para transcripciones
│   ├── fragments.ts              # Queries/mutations para fragmentos detectados
│   ├── feedback.ts               # Queries/mutations para feedback
│   ├── crons.ts                  # Cron jobs configuration
│   └── _generated/               # Generated Convex files
│
├── lib/                          # Shared utilities & services
│   ├── integrations/             # External API clients
│   │   ├── youtube/
│   │   │   ├── client.ts         # YouTube API client
│   │   │   ├── episodes.ts       # Episode fetching logic
│   │   │   └── captions.ts       # Captions fetching logic
│   │   ├── llm/
│   │   │   ├── client.ts         # OpenAI client
│   │   │   ├── classifier.ts     # Classification logic
│   │   │   └── prompts.ts        # LLM prompts
│   │   ├── google-sheets/
│   │   │   ├── client.ts         # Google Sheets client
│   │   │   └── exporter.ts       # Export logic
│   │   └── apify/
│   │       └── adapter.ts        # Apify adapter (preparado, no activo)
│   ├── processing/               # Core processing logic
│   │   ├── keyword-filter.ts     # Filtro de keywords inicial
│   │   ├── context-extractor.ts  # Extracción de ventanas de contexto (±45s)
│   │   ├── mention-detector.ts   # Detector de menciones
│   │   └── reranker.ts           # Re-ranking basado en feedback
│   ├── utils/                    # Utility functions
│   │   ├── date-helpers.ts
│   │   ├── url-parser.ts         # Parser de URLs de YouTube
│   │   ├── timestamp-helpers.ts  # Manejo de timestamps
│   │   └── validators.ts
│   ├── constants/                # Constants & config
│   │   ├── keywords.ts           # Keywords de terapia/salud mental
│   │   ├── classifications.ts    # Tipos de clasificación
│   │   └── config.ts             # App config
│   └── types/                    # TypeScript types
│       ├── youtube.ts
│       ├── fragment.ts
│       ├── episode.ts
│       └── index.ts
│
├── hooks/                        # Custom React hooks
│   ├── useEpisodes.ts
│   ├── useFragments.ts
│   ├── useFeedback.ts
│   └── useAuth.ts
│
├── public/                       # Static assets
│   ├── robots.txt                # Bloqueado - no indexable
│   └── favicon.ico
│
├── docs/                         # Documentation
│   ├── API.md                    # API documentation
│   ├── DEPLOYMENT.md             # Deployment guide
│   └── PRD.md                    # PRD original
│
├── .env.local.example            # Environment variables template
├── .env.local                    # Local environment (gitignored)
├── .eslintrc.json                # ESLint config
├── .prettierrc                   # Prettier config
├── .gitignore
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json
└── README.md
```

---

## Flujo de Datos

### 1. Input & Scanning

```
Usuario → ScanInputForm → API Route (/api/youtube/fetch-episodes)
         ↓
    Convex (channels, episodes)
         ↓
    YouTube Data API v3
```

### 2. Transcription Fetching

```
EpisodeList → API Route (/api/youtube/fetch-captions)
         ↓
    YouTube Captions API
         ↓
    Convex (transcriptions)
```

### 3. Mention Detection

```
Transcription → Keyword Filter → Context Extractor
         ↓
    API Route (/api/process/detect-mentions)
         ↓
    LLM Classifier (GPT-4 mini)
         ↓
    Convex (fragments) con metadata:
    - tema (testimonio, recomendación, reflexión, dato)
    - tono (positivo, neutro, crítico)
    - sensibilidad (autolesión, suicidio, etc.)
    - confianza (0-100)
```

### 4. Review & Feedback

```
FragmentCard → FeedbackButtons → Convex (feedback)
         ↓
    Re-ranker (ajusta pesos para futuras detecciones)
```

### 5. Export

```
ExportButtons → API Route (/api/export/csv o /google-sheets)
         ↓
    CSV Download o Google Sheets API
```

---

## Modelos de Datos (Convex Schema)

### Channels

```typescript
{
  _id: Id<"channels">,
  channelId: string,
  channelUrl: string,
  channelName: string,
  createdAt: number,
  updatedAt: number
}
```

### Episodes

```typescript
{
  _id: Id<"episodes">,
  channelId: Id<"channels">,
  videoId: string,
  title: string,
  publishedAt: string,
  duration: number, // en segundos
  thumbnailUrl: string,
  hasTranscription: boolean,
  status: "pending" | "processing" | "processed" | "error",
  createdAt: number,
  updatedAt: number
}
```

### Transcriptions

```typescript
{
  _id: Id<"transcriptions">,
  episodeId: Id<"episodes">,
  language: string,
  text: string, // Full transcription text
  segments: Array<{
    start: number,
    end: number,
    text: string
  }>,
  createdAt: number
}
```

### Fragments (Menciones detectadas)

```typescript
{
  _id: Id<"fragments">,
  episodeId: Id<"episodes">,
  transcriptionId: Id<"transcriptions">,
  triggerPhrase: string, // Frase que detonó la detección
  contextText: string, // Contexto ±45s
  timestamp: number, // Timestamp en segundos
  classification: {
    type: "testimonio" | "recomendación" | "reflexión" | "dato",
    tone: "positivo" | "neutro" | "crítico",
    sensitivity: string[], // ["autolesión", "suicidio", etc.]
    confidence: number // 0-100
  },
  youtubeUrl: string, // URL con timestamp
  rankScore: number, // Score de re-ranking
  createdAt: number,
  updatedAt: number
}
```

### Feedback

```typescript
{
  _id: Id<"feedback">,
  fragmentId: Id<"fragments">,
  isUseful: boolean,
  createdAt: number
}
```

---

## Principios de Arquitectura

### 1. Modularidad

- Cada integración externa (YouTube, LLM, Google Sheets) debe ser reemplazable
- Los servicios están desacoplados mediante interfaces claras
- El adaptador de Apify está listo pero inactivo en MVP

### 2. Bajo Costo

- Solo procesar episodios con subtítulos disponibles
- Usar filtro de keywords antes del LLM para reducir llamadas
- Cache opcional para reducir llamadas redundantes a YouTube API

### 3. Privacidad & Seguridad

- No indexable: robots.txt bloqueado, meta tags noindex/nofollow
- Autenticación simple por passcode compartido
- Variables de entorno seguras en Vercel
- Sin cookies de terceros ni analytics externos

### 4. Type Safety

- TypeScript en todo el proyecto
- Validación de datos en fronteras (API routes, forms)
- Tipos compartidos entre frontend y backend

### 5. Escalabilidad Preparada

- Arquitectura lista para agregar Apify
- Preparado para transcripción bajo demanda (Whisper API)
- Sistema de feedback para mejorar detección sin fine-tuning

---

## Variables de Entorno

```bash
# YouTube
YOUTUBE_API_KEY=

# OpenAI
OPENAI_API_KEY=

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=

# Auth
INTERNAL_PASSCODE=

# Convex
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=

# Optional - Cache
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Optional - Apify (preparado pero no activo)
APIFY_API_TOKEN=
```

---

## Próximos Pasos (Post-MVP)

1. **Transcripción bajo demanda**: Whisper API para videos sin subtítulos
2. **Descubrimiento automático**: Apify para encontrar canales relevantes
3. **Sistema de comentarios**: Colaboración interna
4. **Dashboard de métricas**: Menciones por país, tema, canal
5. **Clip Kit**: Generación automática de briefs de clip
6. **Integración con edición**: Co-posting y edición de video

---

## Notas de Implementación

### Keywords Iniciales

```
- "terapia"
- "psicólogo", "psicóloga"
- "salud mental"
- "terapeuta"
- "sesión de terapia"
- "fui a terapia"
- "mi psicóloga me dijo"
- "me ayudó la terapia"
- "tratamiento psicológico"
```

### Contexto de Detección

- Ventana: ±45 segundos alrededor de keyword match
- Máximo 90 segundos de contexto por fragmento
- Incluir timestamps exactos para linking a YouTube

### LLM Prompt Structure

```
Analiza este fragmento de un podcast y determina:
1. ¿Es una mención genuina sobre terapia/salud mental? (Sí/No)
2. Tipo: testimonio, recomendación, reflexión, dato
3. Tono: positivo, neutro, crítico
4. Sensibilidad: detectar menciones de autolesión, suicidio, violencia
5. Confianza: 0-100

Fragmento: [contexto]
```

---

**Versión**: MVP v0.1  
**Última actualización**: Octubre 2025  
**Autor**: Joe Oviedo / VoyBien Team
