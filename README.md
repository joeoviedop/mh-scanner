# Podcast Therapy Scanner 🎙️🧠

**Versión**: MVP v0.1  
**Estado**: Planificación Completa ✅ → Listo para Implementación

---

## 📋 Descripción

Podcast Therapy Scanner es una **herramienta interna** para el equipo de VoyBien que permite:
- 🔍 Escanear canales y playlists de YouTube
- 🎯 Detectar menciones sobre **terapia y salud mental** en videopodcasts
- 🤖 Clasificar automáticamente con **GPT-4 mini**
- 📊 Exportar resultados a CSV/Google Sheets para análisis

### ¿Para qué sirve?

Permite al equipo de VoyBien identificar rápidamente qué creadores de contenido están hablando sobre terapia y salud mental, cuándo lo hacen, y en qué contexto - todo para facilitar colaboraciones, análisis de mercado y creación de contenido relevante.

---

## 🎯 Estado del Proyecto

### Planificación: ✅ COMPLETA

Toda la documentación de planificación está lista:
- ✅ Arquitectura técnica definida
- ✅ Schema de base de datos diseñado
- ✅ Roadmap MVP en 9 fases
- ✅ Stack técnico seleccionado
- ✅ Reglas de trabajo y configuraciones

### Próximos Pasos

**Comenzar implementación con Fase 0: Setup & Foundation**

---

## 📚 Documentación

### Documentos Principales

| Documento | Descripción | Ubicación |
|-----------|-------------|-----------|
| **ARCHITECTURE.md** | Arquitectura técnica completa del sistema | [Ver documento](./ARCHITECTURE.md) |
| **PROJECT_SETUP.md** | Guía de configuración y reglas de trabajo | [Ver documento](./PROJECT_SETUP.md) |
| **MVP_ROADMAP.md** | Plan de implementación en 9 fases | [Ver documento](./docs/MVP_ROADMAP.md) |
| **CONVEX_SCHEMA_PLAN.md** | Diseño del schema de base de datos | [Ver documento](./docs/CONVEX_SCHEMA_PLAN.md) |
| **PRD Original** | Product Requirements Document original | Ver archivo PDF compartido |

### Navegación Rápida

#### Para Desarrolladores
1. Lee **PROJECT_SETUP.md** primero
2. Revisa **ARCHITECTURE.md** para entender la estructura
3. Sigue **MVP_ROADMAP.md** fase por fase
4. Consulta **CONVEX_SCHEMA_PLAN.md** para el backend

#### Para Product Managers
1. Revisa el **PRD Original** para contexto completo
2. Consulta **MVP_ROADMAP.md** para timeline y features
3. Revisa los **Success Metrics** en el roadmap

---

## 🛠 Stack Tecnológico

### Frontend
- **Next.js 14+** (App Router)
- **React 18**
- **TypeScript**
- **TailwindCSS**

### Backend
- **Convex** (Base de datos serverless + API)
- **Next.js API Routes**

### Integraciones
- **YouTube Data API v3** - Listar episodios
- **YouTube Captions API** - Obtener transcripciones
- **OpenAI API (GPT-4 mini)** - Clasificación de menciones
- **Google Sheets API** - Exportación (fase 2)

### Hosting
- **Vercel** - Hosting y deployment
- **Dominio**: `internal.voybien.com`

---

## 📁 Estructura del Proyecto (Planificada)

```
mh-scanner/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Rutas principales de la app
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── forms/            # Formularios
│   ├── episodes/         # Componentes de episodios
│   ├── fragments/        # Componentes de menciones
│   └── export/           # Exportación
├── convex/               # Backend Convex
│   ├── schema.ts         # Schema de BD
│   ├── channels.ts       # Queries/mutations
│   ├── episodes.ts
│   └── fragments.ts
├── lib/                  # Utilidades y servicios
│   ├── integrations/     # APIs externas
│   ├── processing/       # Lógica de negocio
│   ├── utils/           # Helpers
│   └── types/           # TypeScript types
├── docs/                # Documentación
└── hooks/               # Custom React hooks
```

---

## 🚀 Fases del MVP (4-6 semanas)

| Fase | Nombre | Duración | Estado |
|------|--------|----------|--------|
| 0 | Setup & Foundation | 3-5 días | ⏸️ Pendiente |
| 1 | Autenticación Simple | 1-2 días | ⏸️ Pendiente |
| 2 | Input & Scanning | 5-7 días | ⏸️ Pendiente |
| 3 | Transcription Fetching | 3-5 días | ⏸️ Pendiente |
| 4 | Mention Detection & Classification | 7-10 días | ⏸️ Pendiente |
| 5 | Review Interface | 5-7 días | ⏸️ Pendiente |
| 6 | Feedback & Re-ranking | 3-5 días | ⏸️ Pendiente |
| 7 | Export Functionality | 3-4 días | ⏸️ Pendiente |
| 8 | Polish & Testing | 3-5 días | ⏸️ Pendiente |
| 9 | Deployment | 2-3 días | ⏸️ Pendiente |

**Ver detalles completos en**: [docs/MVP_ROADMAP.md](./docs/MVP_ROADMAP.md)

---

## 🎯 Features del MVP

### Must Have ✅
- Formulario de input (URL + date range)
- Listado de episodios encontrados
- Detección de transcripciones disponibles
- Procesamiento de transcripciones
- Detección de menciones con keywords + LLM
- Vista de fragmentos detectados
- Feedback Útil/No útil
- Exportación a CSV
- Autenticación con passcode

### Should Have ⏳
- Vista de transcripción completa con highlights
- Exportación a Google Sheets
- Re-ranking basado en feedback
- Filtros por tipo de mención

### Won't Have (Post-MVP) ❌
- Transcripción automática con Whisper
- Descubrimiento automático de canales (Apify)
- Sistema de comentarios/asignaciones
- Métricas avanzadas

---

## 🔧 Setup para Desarrollo

### Pre-requisitos
```bash
Node.js >= 18.17.0
npm >= 9.0.0
Git
```

### API Keys Necesarias
Antes de comenzar, obtener:
- [ ] YouTube Data API key (Google Cloud Console)
- [ ] OpenAI API key
- [ ] Convex account (gratuito)
- [ ] Google Service Account (para Sheets - fase posterior)

### Instalación (Cuando comience implementación)

```bash
# 1. Clonar repositorio
git clone https://github.com/joeoviedop/mh-scanner.git
cd mh-scanner

# 2. Instalar dependencias (cuando exista package.json)
npm install

# 3. Configurar variables de entorno
cp .env.local.example .env.local
# Llenar todas las API keys

# 4. Inicializar Convex
npx convex dev

# 5. Correr servidor de desarrollo
npm run dev
```

**Ver guía completa**: [PROJECT_SETUP.md](./PROJECT_SETUP.md)

---

## 📊 Flujo de Datos

```
1. Usuario pega URL de canal/playlist
   ↓
2. YouTube Data API → Lista de episodios
   ↓
3. YouTube Captions API → Transcripciones
   ↓
4. Keyword Filter → Detectar menciones iniciales
   ↓
5. OpenAI GPT-4 mini → Clasificar menciones
   ↓
6. Convex DB → Guardar fragmentos clasificados
   ↓
7. Usuario revisa y da feedback
   ↓
8. Re-ranking basado en feedback
   ↓
9. Exportar a CSV/Google Sheets
```

---

## 🔐 Seguridad & Privacidad

### Herramienta Interna
- ✅ **No indexable**: robots.txt bloqueado, meta tags noindex/nofollow
- ✅ **Autenticación simple**: Passcode compartido (sin cuentas individuales)
- ✅ **Dominio privado**: `internal.voybien.com`
- ✅ **HTTPS only**: SSL automático con Vercel
- ✅ **Sin tracking**: No Google Analytics ni cookies de terceros

### Datos
- Solo se almacenan fragmentos de texto (no videos completos)
- Uso autorizado de APIs de YouTube
- Compliance con términos de servicio de todas las APIs

---

## 🤝 Equipo & Contribución

### Mantenido por
**Joe Oviedo** / VoyBien Team

### Workflow
- **Branch principal**: `main`
- **Branch de desarrollo**: `develop`
- **Features**: `feature/[nombre]`
- **Fixes**: `fix/[nombre]`

### Commit Messages
```
feat: agregar funcionalidad X
fix: corregir bug Y
docs: actualizar documentación
refactor: refactorizar módulo Z
chore: actualizar dependencias
```

---

## 📖 Recursos

### Documentación Externa
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Convex Docs](https://docs.convex.dev/)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [OpenAI API](https://platform.openai.com/docs)

### Soporte
Para preguntas o problemas, contactar al equipo de VoyBien.

---

## 📝 Licencia

Uso interno exclusivo de VoyBien. No distribuir.

---

**¿Listo para comenzar?** 🚀  
Lee [PROJECT_SETUP.md](./PROJECT_SETUP.md) y arranca con la **Fase 0: Setup & Foundation** del [MVP_ROADMAP.md](./docs/MVP_ROADMAP.md)

---

**Última actualización**: Octubre 2025  
**Versión**: MVP v0.1 (Planificación Completa)