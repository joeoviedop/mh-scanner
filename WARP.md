# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Podcast Therapy Scanner** is an internal tool for VoyBien team to:
- 🔍 Scan YouTube channels/playlists for mental health content
- 🤖 Detect therapy/mental health mentions using GPT-4 mini classification
- 📊 Export results to CSV/Google Sheets for analysis
- 🎯 Enable content collaboration and market analysis

**Status**: Fase 2 Complete ✅ → Ready for Fase 3: Transcription & Processing (MVP v0.1)
**Progress**: 50% complete - Authentication and Input/Scanning infrastructure complete
**Domain**: `internal.voybien.com` (internal tool, not indexable)

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.5.4 (App Router), React 19, TypeScript, TailwindCSS
- **Backend**: Convex (serverless NoSQL DB + real-time API), Next.js API Routes
- **External APIs**: YouTube Data API v3, YouTube Captions API, OpenAI GPT-4 mini, Google Sheets API
- **Hosting**: Vercel

### Data Flow Architecture
```
URL Input → YouTube Data API → Episodes List → YouTube Captions API → 
Transcriptions → Keyword Filter → LLM Classification → Fragments → 
User Review & Feedback → Re-ranking → CSV/Sheets Export
```

### Core Components
- **Scanning Engine**: YouTube API integration for episode discovery
- **Transcription Handler**: Captions fetching and processing
- **Mention Detection**: Two-phase (keyword filter + LLM classification)
- **Classification System**: GPT-4 mini categorizes by type, tone, sensitivity
- **Feedback Loop**: User feedback improves future rankings
- **Export System**: CSV and Google Sheets integration

## Project Structure

**See `ARCHITECTURE.md`** for detailed folder structure and organization.

Key directories:
- `app/` - Next.js App Router (auth & dashboard routes)
- `components/` - React components organized by feature
- `convex/` - Convex backend (schema, queries, mutations)
- `lib/` - Utilities, integrations, and processing logic

## Development Commands

### Initial Setup (Fase 0)
```bash
# Create Next.js project with TypeScript
npx create-next-app@latest mh-scanner --typescript --tailwind --app

# Install core dependencies
npm install convex react-hook-form @hookform/resolvers zod

# Setup Convex
npx convex dev

# Environment setup
cp .env.local.example .env.local
# Fill in all API keys (YouTube, OpenAI, Google, Convex)

# Start development
npm run dev
```

### Daily Development Commands
```bash
# Development server (runs both Next.js and Convex)
npm run dev

# TypeScript type checking
npm run type-check

# Linting and formatting
npm run lint
npm run format

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Convex Specific Commands
```bash
# Start Convex development backend
npx convex dev

# Deploy Convex to production
npx convex deploy

# View Convex dashboard
npx convex dashboard

# Reset/clear Convex data (development only)
npx convex dev --until-success --clear
```

## Key Implementation Phases

### Fase 0: Setup & Foundation (3-5 days)
- Initialize Next.js 14 with TypeScript and TailwindCSS
- Setup Convex database and basic schema
- Obtain API keys (YouTube, OpenAI, Google Service Account)
- Create folder structure and basic UI layout

### ✅ Fase 1: Authentication (COMPLETED)
- [x] Simple passcode-based authentication system
- [x] SEO blocking (noindex, robots.txt)
- [x] Route protection middleware

### ✅ Fase 2: Input & Scanning (COMPLETED)
- [x] YouTube URL parser and validator
- [x] YouTube Data API integration for episode fetching
- [x] Convex backend for channels and episodes
- [x] Episode listing UI with status indicators
- [x] Complete Convex schema with proper indexing
- [x] Form validation and UI components
- [x] Infrastructure setup and build pipeline

### Fase 3: Transcription Fetching (3-5 days)
- YouTube Captions API integration
- Spanish caption prioritization
- Convex schema for transcriptions with timestamps
- Error handling for videos without captions

### Fase 4: Mention Detection & Classification (7-10 days)
- Keyword filter for initial mention detection
- Context extraction (±45 seconds around matches)
- OpenAI GPT-4 mini integration for classification
- Fragment storage with metadata (type, tone, sensitivity, confidence)

### Fase 5: Review Interface (5-7 days)
- Episode detail page with fragment listings
- YouTube player integration with timestamp linking
- Fragment cards with classification badges
- Transcript view with highlights

### Fase 6: Feedback & Re-ranking (3-5 days)
- User feedback system (Useful/Not Useful)
- Re-ranking algorithm based on feedback
- Fragment score updates

### Fase 7: Export Functionality (3-4 days)
- CSV generation with all fragment data
- Google Sheets API integration
- Export buttons and download handling

### Fase 8: Polish & Testing (3-5 days)
- Error handling and validation
- Loading states and empty states
- Responsive design
- Performance optimization

### Fase 9: Deployment (2-3 days)
- Vercel production setup
- Domain configuration (`internal.voybien.com`)
- Environment variables configuration
- Production testing

## Core Data Models (Convex)

### Channels
```typescript
{
  _id: Id<"channels">,
  type: "channel" | "playlist",
  youtubeId: string,
  youtubeUrl: string,
  name: string,
  episodeCount: number,
  lastScanned?: number,
  scanDateRange?: { from: string, to: string }
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
  duration: number,
  hasTranscription: boolean,
  status: "pending" | "processing" | "processed" | "error",
  fragmentsDetected: number
}
```

### Fragments (Detected Mentions)
```typescript
{
  _id: Id<"fragments">,
  episodeId: Id<"episodes">,
  timestamp: number,
  triggerPhrase: string,
  contextText: string,
  classification: {
    isGenuine: boolean,
    type: "testimonio" | "recomendación" | "reflexión" | "dato",
    tone: "positivo" | "neutro" | "crítico",
    sensitivity: string[],
    confidence: number
  },
  rankScore: number,
  youtubeUrl: string,
  reviewed: boolean
}
```

## External API Integration Guidelines

### YouTube APIs
- **Data API**: Channel/playlist scanning, episode metadata
- **Captions API**: Transcription fetching with Spanish prioritization
- Rate limiting: Max 50 episodes per scan, implement caching
- Error handling for private videos and missing captions

### OpenAI Integration
- **Model**: GPT-4 mini for cost efficiency
- **Input**: Context windows (±45s around keyword matches)
- **Output**: Structured classification (type, tone, sensitivity, confidence)
- Cost optimization: Keyword filter before LLM calls

### Google Sheets API
- Service Account authentication
- Append-only operations to existing sheets
- Batch operations for performance

## Security & Privacy

### Internal Tool Constraints
- No public indexing (robots.txt blocked, noindex meta tags)
- Simple passcode authentication (no individual user accounts)
- HTTPS only, hosted on `internal.voybien.com`
- No tracking cookies or external analytics

### Data Handling
- Only store text fragments, not complete videos
- Comply with YouTube API Terms of Service
- Secure API key management in Vercel environment variables

## Development Best Practices

### Code Organization
- Use TypeScript strictly throughout
- Component structure: imports, types, component, exports
- API Routes: input validation, business logic, error handling
- Convex: separate files for each entity (channels, episodes, fragments)

### Naming Conventions
- Files: PascalCase for components, camelCase for utilities, kebab-case for folders
- Variables: camelCase for functions/variables, PascalCase for types
- API Routes: kebab-case (fetch-episodes, detect-mentions)

### Error Handling
- User-friendly error messages in UI
- Comprehensive logging for debugging
- Graceful degradation for missing transcriptions
- Rate limit handling for external APIs

## Testing Strategy (Post-MVP)

### Test Coverage Areas
- Unit tests for utilities (URL parser, keyword filter, timestamp helpers)
- Integration tests for API endpoints
- End-to-end tests for complete scanning workflow
- LLM prompt validation and classification accuracy

## Performance Considerations

### Optimization Strategies
- Keyword filtering before expensive LLM calls
- Batch processing with controlled concurrency
- Convex query optimization with proper indexing
- Client-side pagination for large lists
- Lazy loading for heavy components

### Monitoring
- API rate limit tracking
- LLM cost monitoring
- Processing time metrics
- Error rate monitoring

## Future Enhancements (Post-MVP)

### Phase 2 Features
- Whisper API integration for transcription-less videos
- Apify integration for automatic channel discovery
- Advanced filtering and analytics dashboard
- Collaboration features (comments, assignments)

### Long-term Vision
- Multi-language support
- Clip generation automation
- Video editing tool integration
- Advanced analytics and reporting

## Troubleshooting Common Issues

### YouTube API Issues
- Verify API key permissions and quotas
- Handle private/unavailable videos gracefully
- Check for correct channel/playlist ID extraction

### Convex Issues
- Ensure schema matches data structure
- Check authentication and deployment status
- Monitor function execution logs

### LLM Classification Issues
- Validate prompt structure and examples
- Monitor confidence scores and accuracy
- Iterate on classification prompts based on feedback

## Environment Variables

**See `.env.local.example`** for complete list of required environment variables.

---

## 📊 Current Progress Status

### 📈 **Overall Progress: 50% Complete**

```
Progress: ████████████████████░░░░░░░░░░░░░░░░░░░░ 50% Complete

✅ Phase 0: Setup & Foundation (COMPLETED)
✅ Phase 1: Authentication (COMPLETED) 
✅ Phase 2: Input & Scanning (COMPLETED) ← JUST FINISHED
🔄 Phase 3: Transcription & Processing (NEXT)
⏳ Phase 4: Mention Detection & Classification
⏳ Phase 5: Review Interface
⏳ Phase 6: Feedback & Re-ranking
⏳ Phase 7: Export Functionality
⏳ Phase 8: Polish & Testing
⏳ Phase 9: Deployment
```

### ✅ **Completed Phases**

#### **Phase 0: Setup & Foundation (100% COMPLETE)**
- [x] Next.js 15.5.4 with App Router
- [x] TypeScript + TailwindCSS + ESLint configured
- [x] SEO blocking (internal tool)
- [x] Project structure and documentation
- [x] Production build working

#### **Phase 1: Authentication (100% COMPLETE)**
- [x] Passcode-based authentication system
- [x] Login page with VoyBien branding
- [x] Route protection middleware
- [x] Session management (24h JWT + secure cookies)
- [x] Dashboard layout with logout functionality
- [x] Rate limiting (5 attempts/min)
- [x] Security hardening (timing-safe comparisons, SHA-256)

#### **Phase 2: Input & Scanning (100% COMPLETE)** 🎉
- [x] **YouTube URL Parser**: Complete utility supporting channels, playlists, videos (`src/lib/youtube-parser.ts`)
- [x] **YouTube Data API Client**: Full integration with rate limiting, error handling (`src/lib/youtube-api.ts`)
- [x] **Convex Database**: Complete schema with 6 tables, 33 indexes, full TypeScript types (`convex/schema.ts`)
- [x] **Channel Management**: Full CRUD operations (`convex/channels.ts`)
- [x] **Episode Management**: Complete episode handling (`convex/episodes.ts`)
- [x] **Scanning Form UI**: Responsive form with validation and preview (`src/components/forms/ScanInputForm.tsx`)
- [x] **Episodes List UI**: Complete listing with status indicators (`src/components/episodes/EpisodeList.tsx`)
- [x] **Infrastructure**: NPM scripts, environment variables, build pipeline

### 🔄 **Next Phase: Phase 3 - Transcription & Processing**

#### **Immediate Next Steps:**
1. **API Routes Implementation**
   - `/api/youtube/fetch-episodes` - Fetch episodes from YouTube channels/playlists
   - `/api/youtube/fetch-captions` - Get transcriptions from YouTube
   - `/api/process/detect-mentions` - Process transcriptions for therapy mentions

2. **YouTube Captions Integration**
   - Fetch automatic captions with Spanish prioritization
   - Process and clean transcription text
   - Store with timestamps in Convex

3. **Processing Pipeline Foundation**
   - Keyword filtering for initial mention detection
   - Context extraction (±45 seconds around matches)
   - Preparation for GPT-4 mini integration

## 🔄 Recent Major Updates

### **Phase 2 Implementation (Just Completed - January 2025)**
- **🗄️ Database Architecture**: Complete Convex schema with channels, episodes, transcriptions, fragments, feedback, and scanJobs tables
- **🔌 YouTube Integration**: Robust YouTube Data API client with comprehensive error handling and rate limiting
- **🎯 URL Processing**: Smart YouTube URL parser supporting all formats (channels, playlists, videos)
- **💻 User Interface**: Professional scanning form and episodes listing components
- **🏗️ Infrastructure**: Complete build pipeline, environment setup, and development workflow
- **📊 Data Models**: TypeScript-first approach with Zod validation and complete type safety
- **🔧 Development Tools**: Added `convex:dev` and `convex:deploy` scripts, updated dependencies

### **Technical Deliverables Added:**
```
convex/
├── schema.ts (332 lines) - Complete database schema
├── channels.ts (299 lines) - Channel management functions
├── episodes.ts (424 lines) - Episode management functions
└── _generated/ - Auto-generated TypeScript types

src/lib/
├── youtube-parser.ts (187 lines) - URL parsing utility
└── youtube-api.ts (443 lines) - YouTube API client

src/components/
├── forms/ScanInputForm.tsx (252 lines) - Scanning form
└── episodes/EpisodeList.tsx (280 lines) - Episodes listing
```

---

## 🚀 **READY FOR PHASE 3 - TRANSCRIPTION & PROCESSING**

### ✅ **Current State:**
- **Authentication**: Production-ready passcode system ✅
- **Database**: Full Convex schema with 33 optimized indexes ✅
- **YouTube Integration**: Complete API client with all endpoints ✅
- **UI Components**: Scanning form and episodes listing ✅
- **Build Pipeline**: All validations passing (TypeScript, ESLint, build) ✅
- **Environment**: Production-ready configuration ✅

### 🎯 **Phase 3 Objectives:**
1. **API Routes**: Implement YouTube data fetching endpoints
2. **Captions Integration**: YouTube transcription fetching with Spanish priority
3. **Background Processing**: Job queue system using Convex scanJobs
4. **Text Processing**: Transcription cleaning and preparation
5. **Keyword Detection**: Initial therapy mention filtering

**Status**: Ready to implement transcription fetching and processing pipeline
**Next Coding Session**: Create API routes for YouTube data integration
