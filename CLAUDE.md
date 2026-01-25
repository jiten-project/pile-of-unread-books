# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tsundoku (積読) - A React Native (Expo) app for managing unread books ("tsundoku" in Japanese). The app allows users to track their book collection with features like barcode scanning, ISBN lookup, reading status management, and statistics.

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
```

## Architecture

### Navigation Structure
- **RootNavigator** (`src/navigation/RootNavigator.tsx`): Native stack navigator for modal screens
- **TabNavigator** (`src/navigation/TabNavigator.tsx`): Bottom tab navigation with 5 tabs (Home, Bookshelf, AddBook, Stats, Settings)

### State Management
- **Zustand store** (`src/store/bookStore.ts`): Manages book collection state
- **Database** (`src/services/database.ts`): SQLite persistence via expo-sqlite
- **useDatabase hook** (`src/hooks/useDatabase.ts`): Syncs Zustand state with SQLite

### Context Providers
- **ThemeProvider** (`src/contexts/ThemeContext.tsx`): Light/dark/system theme management with AsyncStorage persistence
- **SettingsProvider** (`src/contexts/SettingsContext.tsx`): App settings

### Book API Integration
- `src/services/bookApi.ts`: Fetches book info by ISBN using OpenBD API (priority for Japanese books) and Google Books API (fallback)
- Both APIs are queried in parallel; results are merged with OpenBD taking precedence

### Key Types
- `Book`: Complete book data including metadata and user data
- `BookStatus`: 'unread' | 'reading' | 'paused' | 'completed'
- `Priority`: 'high' | 'medium' | 'low'
- Types are in `src/types/book.ts`

### Directory Structure
```
src/
├── components/    # Reusable UI components
├── constants/     # Theme colors, status definitions
├── contexts/      # React Context providers
├── hooks/         # Custom hooks (useDatabase)
├── navigation/    # React Navigation setup
├── screens/       # Screen components
├── services/      # API calls, database, notifications
├── store/         # Zustand store
├── types/         # TypeScript type definitions
└── utils/         # Helper functions
```

## Code Style

- TypeScript with strict mode
- ESLint + Prettier enforced
- Single quotes, semicolons, 2-space indentation
- Trailing commas (es5 style)

## 厳守するルール

- 修正後には利用規約、プライバシーポリシー、免責事項に内容を正確に反映すしてください。
- 同様にサポート用Webページの記載も修正を反映してください