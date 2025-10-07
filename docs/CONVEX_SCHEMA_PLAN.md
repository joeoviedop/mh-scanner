# Convex Schema & Data Model Plan

Esta es la planificación del schema de base de datos para Convex del Podcast Therapy Scanner MVP.

---

## Overview

Convex es una base de datos NoSQL serverless con queries en tiempo real. Cada tabla almacena documentos con tipos definidos en el schema.

---

## Schema Definition

### Table: `channels`
**Propósito**: Almacenar información de canales/playlists de YouTube escaneados

```typescript
{
  _id: Id<"channels">,
  _creationTime: number, // Auto-generated por Convex
  
  // Identificadores de YouTube
  type: "channel" | "playlist",
  youtubeId: string, // Channel ID o Playlist ID
  youtubeUrl: string, // URL original del usuario
  
  // Metadata
  name: string,
  description?: string,
  thumbnailUrl?: string,
  
  // Estado
  lastScanned?: number, // Timestamp último escaneo
  episodeCount: number, // Total de episodios detectados
  
  // Configuración de escaneo
  scanDateRange?: {
    from: string, // ISO date
    to: string,   // ISO date
  },
  
  updatedAt: number,
}
```

**Indexes**:
- `by_youtube_id`: Para búsqueda rápida por YouTube ID
- `by_creation_time`: Para listar por fecha de creación

---

### Table: `episodes`
**Propósito**: Almacenar información de cada video/episodio detectado

```typescript
{
  _id: Id<"episodes">,
  _creationTime: number,
  
  // Relación con canal
  channelId: Id<"channels">,
  
  // Identificadores de YouTube
  videoId: string,
  videoUrl: string,
  
  // Metadata del video
  title: string,
  description?: string,
  thumbnailUrl: string,
  publishedAt: string, // ISO date
  duration: number, // Duración en segundos
  
  // Estado de transcripción
  hasTranscription: boolean,
  transcriptionLanguage?: string, // e.g., "es", "es-MX"
  
  // Estado de procesamiento
  status: "pending" | "fetching_transcript" | "processing" | "processed" | "error",
  errorMessage?: string,
  
  // Stats
  fragmentsDetected: number, // Número de menciones detectadas
  
  // Timestamps
  processedAt?: number,
  updatedAt: number,
}
```

**Indexes**:
- `by_channel`: Para obtener todos los episodios de un canal
- `by_video_id`: Para búsqueda por YouTube video ID
- `by_published_date`: Para ordenar por fecha de publicación
- `by_status`: Para filtrar por estado de procesamiento

---

### Table: `transcriptions`
**Propósito**: Almacenar las transcripciones completas de YouTube

```typescript
{
  _id: Id<"transcriptions">,
  _creationTime: number,
  
  // Relación con episodio
  episodeId: Id<"episodes">,
  
  // Metadata
  language: string,
  source: "youtube_captions" | "whisper_api", // Para fase 2
  
  // Contenido
  fullText: string, // Texto completo concatenado
  
  // Segmentos con timestamps
  segments: Array<{
    index: number,
    start: number, // Segundos desde inicio
    end: number,   // Segundos desde inicio
    text: string,
  }>,
  
  // Stats
  totalDuration: number, // Duración total en segundos
  wordCount: number,
  
  createdAt: number,
}
```

**Indexes**:
- `by_episode`: Para obtener transcripción por episodio

**Nota**: Considerar si guardar `fullText` o solo `segments` para ahorrar storage. Decisión: guardar ambos para facilidad de búsqueda por keywords.

---

### Table: `fragments`
**Propósito**: Almacenar las menciones/fragmentos detectados con clasificación

```typescript
{
  _id: Id<"fragments">,
  _creationTime: number,
  
  // Relaciones
  episodeId: Id<"episodes">,
  transcriptionId: Id<"transcriptions">,
  channelId: Id<"channels">, // Desnormalizado para queries rápidas
  
  // Ubicación en el video
  timestamp: number, // Timestamp central en segundos
  startTime: number, // Inicio de la ventana de contexto
  endTime: number,   // Fin de la ventana de contexto
  
  // Contenido
  triggerPhrase: string, // La keyword/frase que detonó la detección
  contextText: string,   // Texto del contexto (±45s)
  
  // Clasificación (output del LLM)
  classification: {
    isGenuine: boolean, // ¿Es una mención genuina?
    type: "testimonio" | "recomendación" | "reflexión" | "dato" | "otro",
    tone: "positivo" | "neutro" | "crítico",
    sensitivity: string[], // ["autolesión", "suicidio", "violencia", etc.]
    confidence: number, // 0-100
    rawLLMResponse?: string, // Para debugging
  },
  
  // Re-ranking
  rankScore: number, // Score calculado basado en feedback
  
  // Links
  youtubeUrl: string, // URL con timestamp: youtube.com/watch?v=xxx&t=123
  
  // Estado
  reviewed: boolean, // ¿Ya fue revisado manualmente?
  
  updatedAt: number,
}
```

**Indexes**:
- `by_episode`: Todos los fragmentos de un episodio
- `by_channel`: Todos los fragmentos de un canal (para analytics)
- `by_rank_score`: Para ordenar por relevancia
- `by_confidence`: Para filtrar por nivel de confianza
- `by_classification_type`: Para filtrar por tipo de mención

---

### Table: `feedback`
**Propósito**: Almacenar feedback del usuario sobre fragmentos (para re-ranking)

```typescript
{
  _id: Id<"feedback">,
  _creationTime: number,
  
  // Relación
  fragmentId: Id<"fragments">,
  
  // Feedback
  isUseful: boolean, // Útil / No útil
  
  // Opcional: feedback detallado (fase 2)
  notes?: string,
  
  createdAt: number,
}
```

**Indexes**:
- `by_fragment`: Para obtener feedback de un fragmento

---

### Table: `processingJobs` (opcional - para tracking)
**Propósito**: Tracking de jobs de procesamiento largos (batch processing)

```typescript
{
  _id: Id<"processingJobs">,
  _creationTime: number,
  
  // Tipo de job
  type: "scan_channel" | "process_episodes" | "classify_fragments",
  
  // Relacionado a
  channelId?: Id<"channels">,
  episodeIds?: Id<"episodes">[],
  
  // Estado
  status: "queued" | "running" | "completed" | "failed",
  progress: {
    total: number,
    completed: number,
    failed: number,
  },
  
  // Resultados
  results?: any,
  errorMessage?: string,
  
  // Timestamps
  startedAt?: number,
  completedAt?: number,
  updatedAt: number,
}
```

**Indexes**:
- `by_status`: Para obtener jobs pendientes
- `by_channel`: Jobs relacionados a un canal

---

## Queries Plan

### Queries Principales (convex/queries.ts)

```typescript
// channels.ts
export const getChannelById = query(...)
export const listChannels = query(...) // Paginado
export const getChannelStats = query(...) // Stats aggregadas

// episodes.ts
export const getEpisodeById = query(...)
export const listEpisodesByChannel = query(...) // Con filtros
export const getEpisodeWithTranscription = query(...)

// transcriptions.ts
export const getTranscriptionByEpisode = query(...)

// fragments.ts
export const getFragmentById = query(...)
export const listFragmentsByEpisode = query(...)
export const listFragmentsByChannel = query(...) // Para analytics
export const getFragmentsByConfidence = query(...) // Filtro por confidence
export const getTopFragments = query(...) // Ordenado por rankScore

// feedback.ts
export const getFeedbackByFragment = query(...)
export const getFeedbackStats = query(...) // Stats de feedback
```

---

## Mutations Plan

### Mutations Principales (convex/mutations.ts)

```typescript
// channels.ts
export const createChannel = mutation(...)
export const updateChannel = mutation(...)
export const deleteChannel = mutation(...)

// episodes.ts
export const createEpisode = mutation(...)
export const updateEpisodeStatus = mutation(...)
export const bulkCreateEpisodes = mutation(...) // Batch insert

// transcriptions.ts
export const createTranscription = mutation(...)

// fragments.ts
export const createFragment = mutation(...)
export const updateFragmentRankScore = mutation(...)
export const markFragmentAsReviewed = mutation(...)

// feedback.ts
export const submitFeedback = mutation(...)
export const updateFeedback = mutation(...)
```

---

## Actions Plan

### Actions para APIs externas (convex/actions.ts)

```typescript
// youtube.ts
export const fetchChannelEpisodes = action(...) // YouTube Data API
export const fetchVideoCaptions = action(...) // YouTube Captions API

// llm.ts
export const classifyFragment = action(...) // OpenAI API
export const batchClassifyFragments = action(...) // Batch processing

// export.ts
export const exportToGoogleSheets = action(...) // Google Sheets API
export const generateCSV = action(...) // CSV generation

// reranking.ts
export const recalculateRankScores = action(...) // Basado en feedback
```

---

## Data Flow Examples

### Flow 1: Escanear Canal
```
1. Usuario envía URL de canal
2. Frontend → API Route → Convex Action (fetchChannelEpisodes)
3. Action llama YouTube Data API
4. Mutation: createChannel + bulkCreateEpisodes
5. Return: episodeIds
```

### Flow 2: Procesar Episodio
```
1. Usuario selecciona episodio(s) para procesar
2. Frontend → API Route → Convex Action
3. Para cada episodio:
   a. Action (fetchVideoCaptions) → YouTube Captions API
   b. Mutation (createTranscription)
   c. Processing: keyword filter → detectar menciones
   d. Para cada mención:
      - Action (classifyFragment) → OpenAI API
      - Mutation (createFragment) con clasificación
4. Mutation (updateEpisodeStatus) → "processed"
```

### Flow 3: Feedback & Re-ranking
```
1. Usuario marca fragmento como Útil/No útil
2. Frontend → Mutation (submitFeedback)
3. Trigger: Action (recalculateRankScores)
4. Mutation (updateFragmentRankScore) para todos los fragmentos similares
```

---

## Storage Estimates (MVP)

Asumiendo:
- 10 canales escaneados
- 50 episodios por canal = 500 episodios totales
- 30% tienen transcripciones = 150 episodios procesados
- 5 menciones por episodio = 750 fragmentos

**Estimado de storage**:
```
channels:        10 docs × 1 KB = 10 KB
episodes:        500 docs × 2 KB = 1 MB
transcriptions:  150 docs × 50 KB = 7.5 MB
fragments:       750 docs × 3 KB = 2.25 MB
feedback:        750 docs × 0.5 KB = 375 KB
-------------------------------------------
TOTAL:           ~11 MB
```

Convex free tier: 1 GB storage → MVP bien dentro de límites

---

## Performance Considerations

### Desnormalización Estratégica
Para mejorar performance de queries, desnormalizar:
- `channelId` en `fragments` (evita join con episodes)
- `episodeCount` en `channels` (evita count query)
- `fragmentsDetected` en `episodes` (evita count query)

### Indexing
Definir indexes explícitos para:
- Queries frecuentes (by_channel, by_episode)
- Ordenamiento (by_rank_score, by_confidence)
- Filtros (by_status, by_type)

### Paginación
Implementar paginación en:
- `listChannels`
- `listEpisodesByChannel`
- `listFragmentsByEpisode`

Usar Convex cursor-based pagination para performance.

---

## Migration Strategy (Future)

Para futuras migraciones:
1. Agregar campos opcionales (`field?: type`)
2. Usar migrations script de Convex
3. Mantener backward compatibility
4. Documentar cambios en CHANGELOG.md

---

## Next Steps para Implementación

1. ✅ Crear `convex/schema.ts` con definiciones
2. ✅ Implementar queries básicas (CRUD)
3. ✅ Implementar mutations básicas
4. ✅ Implementar actions para YouTube API
5. ⏳ Implementar actions para OpenAI API
6. ⏳ Implementar logic de re-ranking
7. ⏳ Testing con datos reales

---

**Versión**: MVP v0.1  
**Última actualización**: Octubre 2025  
**Autor**: Joe Oviedo / VoyBien Team
