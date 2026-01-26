# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tsundoku (積読) - A React Native (Expo) app for managing unread books ("tsundoku" in Japanese). The app allows users to track their book collection with features like barcode scanning, ISBN lookup, reading status management, cloud sync, and statistics.

## Development Commands

```bash
# Start the development server
npm start

# Platform-specific
npm run ios
npm run android
npm run web

# Linting and formatting
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
npm run format        # Format code with Prettier

# EAS Build (requires eas-cli)
eas build --platform ios --profile development        # Dev build for simulator
eas build --platform ios --profile development:device # Dev build for device
eas build --platform ios --profile production         # Production build
eas submit --platform ios                             # Submit to App Store
```

Note: `npm run postinstall` runs `patch-package` to apply patches in the `patches/` directory.

## Architecture

### Navigation Structure
- **RootNavigator** (`src/navigation/RootNavigator.tsx`): Native stack navigator for modal screens
- **TabNavigator** (`src/navigation/TabNavigator.tsx`): Bottom tab navigation with 5 tabs (Home, Bookshelf, AddBook, Stats, Settings)

### State Management & Data Flow
```
SQLite (local) <──> Zustand Store <──> React Components
       │                  │
       └──────────────────┼──────────> Supabase (cloud)
                          │
               useDatabase hook (syncs SQLite → Zustand on init)
```

- **Zustand store** (`src/store/bookStore.ts`): In-memory book collection state
- **Database** (`src/services/database.ts`): SQLite persistence via expo-sqlite
- **useDatabase hook** (`src/hooks/useDatabase.ts`): Initializes DB and loads books into Zustand on app start

### Cloud Sync (Supabase)
- **AuthContext** (`src/contexts/AuthContext.tsx`): Apple Sign In authentication via Supabase
- **SyncContext** (`src/contexts/SyncContext.tsx`): Manages sync state and triggers
- **cloudDatabase.ts** (`src/services/cloudDatabase.ts`): CRUD operations against Supabase `books` table
- **syncService.ts** (`src/services/syncService.ts`): Conflict resolution and incremental/full sync logic
- Books have `syncStatus` field: `synced` | `pending` | `error`
- Local SQLite is the source of truth; cloud syncs bidirectionally with conflict resolution

### Context Providers
- **ThemeProvider** (`src/contexts/ThemeContext.tsx`): Light/dark/system theme with AsyncStorage persistence
- **SettingsProvider** (`src/contexts/SettingsContext.tsx`): App settings
- **AuthProvider**: Supabase session management with Apple Sign In
- **SyncProvider**: Cloud sync state

### Book API Integration
- `src/services/bookApi.ts`: Fetches book info by ISBN
- **OpenBD API**: Priority for Japanese books
- **Google Books API**: Fallback
- Both APIs are queried in parallel; results are merged with OpenBD taking precedence

### Key Types (`src/types/book.ts`)
- `Book`: Complete book data including metadata and user data
- `BookStatus`: 'unread' | 'reading' | 'paused' | 'completed'
- `Priority`: 'high' | 'medium' | 'low'
- `SyncStatus`: 'synced' | 'pending' | 'error'

### Directory Structure
```
src/
├── components/    # Reusable UI components
├── constants/     # Theme colors, status definitions
├── contexts/      # React Context providers (Theme, Settings, Auth, Sync)
├── hooks/         # Custom hooks (useDatabase)
├── navigation/    # React Navigation setup
├── screens/       # Screen components
├── services/      # API calls, database, notifications, sync
├── store/         # Zustand store
├── types/         # TypeScript type definitions
└── utils/         # Helper functions
docs/              # Support web pages (terms, privacy, disclaimer)
patches/           # Patches applied via patch-package
```

## Code Style

- TypeScript with strict mode
- ESLint + Prettier enforced
- Single quotes, semicolons, 2-space indentation
- Trailing commas (es5 style)

## 厳守するルール

- 修正後には利用規約、プライバシーポリシー、免責事項に内容を正確に反映してください。
- 同様にサポート用Webページ（`docs/` 内のHTMLファイル）の記載も修正を反映してください。
