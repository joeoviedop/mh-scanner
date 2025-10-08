# Project Setup Guide - MH Scanner

Este documento describe las reglas de trabajo, configuraciones y convenciones para el proyecto Podcast Therapy Scanner.

---

## 🎯 Filosofía del Proyecto

### Principios Core
1. **Simplicidad primero**: No optimizar prematuramente
2. **Type-safe**: TypeScript estricto en todo el proyecto
3. **Modular**: Cada módulo debe ser reemplazable
4. **Costo-consciente**: Usar APIs solo cuando sea necesario
5. **Privacidad**: Herramienta interna, sin exposición pública

---

## 🛠 Tech Stack & Versiones

### Requerimientos
```json
{
  "node": ">=18.17.0",
  "npm": ">=9.0.0",
  "typescript": "^5.2.0"
}
```

### Dependencias Principales
```json
{
  "next": "15.5.4",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "typescript": "^5",
  "tailwindcss": "^4.1.14"
}
```

### Integraciones
- **YouTube Data API v3**: Listar videos
- **OpenAI API**: GPT-4 mini para clasificación
- **Google Sheets API**: Exportación de resultados
- **Apify**: Preparado para fase 2 (no MVP)

---

## 📁 Estructura de Carpetas

Seguir la estructura definida en `ARCHITECTURE.md`. Reglas clave:

### `/app` - Next.js App Router
- **Route Groups**: Usar `(auth)` y `(dashboard)` para organizar rutas
- **Naming**: kebab-case para folders, PascalCase para componentes
- **Colocación**: Server Components por defecto, marcar `'use client'` solo cuando sea necesario

### `/components`
- Organizar por funcionalidad, no por tipo
- Cada componente debe tener:
  - Un solo propósito (SRP)
  - Props tipadas con TypeScript
  - Documentación JSDoc si la lógica es compleja

### `/lib`
- **integrations/**: Un folder por servicio externo
- **processing/**: Lógica core de negocio
- **utils/**: Funciones auxiliares puras
- **types/**: Tipos compartidos entre módulos

### `/convex`
- Cada entidad tiene su propio archivo (channels.ts, episodes.ts, etc.)
- Usar queries para lectura, mutations para escritura
- Actions para llamadas externas (YouTube API, OpenAI, etc.)

---

## ⚙️ Configuraciones de Desarrollo

### TypeScript (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### ESLint (`.eslintrc.json`)
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### Prettier (`.prettierrc`)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Next.js Config (`next.config.js`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Deshabilitar SSR para evitar SEO exposure
  experimental: {
    serverActions: true,
  },
  // No indexable
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      ],
    },
  ],
  images: {
    domains: ['i.ytimg.com'], // YouTube thumbnails
  },
}

module.exports = nextConfig
```

### Tailwind Config (`tailwind.config.ts`)
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // VoyBien brand colors (ajustar según branding)
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
      },
    },
  },
  plugins: [],
}
export default config
```

---

## 🔐 Variables de Entorno

**Ver `.env.local.example`** para la lista completa de variables requeridas.

### Setup Inicial
1. Copiar `.env.local.example` a `.env.local`
2. Llenar todas las variables requeridas
3. **Nunca** commitear `.env.local`

---

## 📝 Convenciones de Código

### Naming Conventions

#### Files & Folders
- **Components**: PascalCase (`ScanInputForm.tsx`)
- **Utilities**: camelCase (`url-parser.ts`)
- **Folders**: kebab-case (`episodes/`, `youtube/`)
- **API Routes**: kebab-case (`fetch-episodes/`)

#### Variables & Functions
```typescript
// ✅ Good
const episodeCount = 10;
function fetchEpisodes() {}
const isProcessing = false;

// ❌ Bad
const episode_count = 10;
function FetchEpisodes() {}
const IsProcessing = false;
```

#### Types & Interfaces
```typescript
// ✅ Prefer types
type Episode = {
  id: string;
  title: string;
}

// ⚠️ Interfaces solo cuando necesites extend
interface BaseEntity {
  _id: string;
  createdAt: number;
}

interface Episode extends BaseEntity {
  title: string;
}
```

### Component Structure
```typescript
// 1. Imports (agrupados)
import { useState, useEffect } from 'react'; // React
import { useQuery } from 'convex/react'; // External libs
import { api } from '@/convex/_generated/api'; // Internal libs
import { Button } from '@/components/ui/button'; // Components

// 2. Types
type EpisodeCardProps = {
  episodeId: string;
  onSelect: (id: string) => void;
};

// 3. Component
export function EpisodeCard({ episodeId, onSelect }: EpisodeCardProps) {
  // 3a. Hooks
  const episode = useQuery(api.episodes.getById, { id: episodeId });
  const [isExpanded, setIsExpanded] = useState(false);

  // 3b. Handlers
  const handleClick = () => {
    setIsExpanded(!isExpanded);
    onSelect(episodeId);
  };

  // 3c. Early returns
  if (!episode) return <div>Loading...</div>;

  // 3d. Render
  return (
    <div onClick={handleClick}>
      {/* JSX */}
    </div>
  );
}
```

### API Route Structure
```typescript
// app/api/youtube/fetch-episodes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchYouTubeEpisodes } from '@/lib/integrations/youtube/episodes';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validate input
    const body = await request.json();
    const { channelUrl, dateRange } = body;

    if (!channelUrl) {
      return NextResponse.json(
        { error: 'Channel URL is required' },
        { status: 400 }
      );
    }

    // 2. Business logic
    const episodes = await fetchYouTubeEpisodes(channelUrl, dateRange);

    // 3. Return response
    return NextResponse.json({ episodes });

  } catch (error) {
    console.error('Error fetching episodes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🧪 Testing (Future - No MVP)

### Test Structure (preparado para fase 2)
```
__tests__/
  ├── unit/
  │   ├── lib/
  │   │   └── url-parser.test.ts
  │   └── processing/
  │       └── keyword-filter.test.ts
  ├── integration/
  │   └── api/
  │       └── youtube.test.ts
  └── e2e/
      └── scan-flow.test.ts
```

---

## 🚀 Comandos de Desarrollo

**See `WARP.md`** for complete list of development commands.

Essential commands:
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - Code linting
- `npm run type-check` - TypeScript validation

---

## 🔄 Git Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/[feature-name]`: Nueva funcionalidad
- `fix/[bug-name]`: Bug fixes

### Commit Messages
```
feat: add YouTube episode fetching
fix: resolve timestamp parsing issue
docs: update architecture documentation
refactor: extract keyword filter to separate module
chore: update dependencies
```

### Pull Request Template
```markdown
## Description
[Descripción de los cambios]

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactoring

## Testing
- [ ] Tested locally
- [ ] No console errors
- [ ] TypeScript passes

## Screenshots (if UI changes)
[Add screenshots]
```

---

## 📊 Monitoring & Logging (Future)

### Error Handling
```typescript
// Usar try-catch en boundaries
try {
  const result = await externalAPI();
  return result;
} catch (error) {
  console.error('Error in [context]:', error);
  // Log to monitoring service (future: Sentry)
  throw new Error('User-friendly error message');
}
```

### Logging Levels
- `console.log`: Development only (remove before commit)
- `console.warn`: Warnings que no rompen funcionalidad
- `console.error`: Errores críticos

---

## 🔒 Security Checklist

### Before Every Commit
- [ ] No API keys hardcoded
- [ ] No sensitive data in code
- [ ] `.env.local` not committed
- [ ] Input validation in API routes
- [ ] Error messages don't leak internal details

### Before Deploy
- [ ] All environment variables set in Vercel
- [ ] robots.txt blocks indexing
- [ ] X-Robots-Tag header configured
- [ ] Passcode protection working
- [ ] HTTPS only

---

## 📚 Resources & Documentation

### Official Docs
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev/)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [OpenAI API](https://platform.openai.com/docs)

### Internal Docs
- `ARCHITECTURE.md`: Arquitectura técnica completa
- `docs/API.md`: API endpoints (crear durante implementación)
- `docs/DEPLOYMENT.md`: Guía de deployment (crear antes de deploy)

---

## ✅ Ready to Start Coding Checklist

Antes de empezar a codificar, asegúrate de tener:

- [ ] Node.js >=18.17.0 instalado
- [ ] npm >=9.0.0 instalado
- [ ] Git configurado
- [ ] Editor con TypeScript support (VSCode recomendado)
- [ ] YouTube API key obtenida
- [ ] OpenAI API key obtenida
- [ ] Google Cloud Service Account creado (para Sheets)
- [ ] Convex account creado
- [ ] `.env.local` configurado con todas las keys

Una vez completado, estás listo para ejecutar:
```bash
npm install
npx convex dev
npm run dev
```

---

**Última actualización**: Octubre 2025  
**Mantenido por**: Joe Oviedo / VoyBien Team
