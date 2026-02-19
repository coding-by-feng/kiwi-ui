# Kiwi UI - Claude Context

## Project Overview

**Kiwi UI** is a Vue 2 + Element UI frontend for the Kason Tools learning platform. It provides:

- **Word Learning**: Dictionary lookup, word collection, review system
- **AI Features**: YouTube subtitle translation, AI conversations, grammar assistance
- **Tools**: Todo lists, project management, focus timer, PDF tools
- **White Noise**: Ambient sound player with multiple categories

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Vue 2.7 |
| UI Library | Element UI 2.15 |
| State | Vuex 3 |
| Router | Vue Router 3 |
| i18n | vue-i18n 8 (9 languages) |
| HTTP | Axios |
| Audio | Howler.js |
| Build | Vue CLI 4, Webpack |
| CSS | SCSS/SASS |

## Project Structure

```
kiwi-ui/
├── src/
│   ├── main.js                 # Entry point
│   ├── App.vue                 # Root component
│   ├── router/                 # Vue Router config
│   ├── store/                  # Vuex store modules
│   │   └── modules/            # common, user, focus, etc.
│   ├── api/                    # API service functions
│   ├── page/                   # Page components
│   │   ├── ai/                 # AI features
│   │   ├── word/               # Word/dictionary
│   │   ├── user/               # User center
│   │   ├── tools/              # Todo, projects
│   │   ├── whitenoise/         # Ambient sounds
│   │   └── ...
│   ├── components/             # Reusable components
│   ├── i18n/                   # Internationalization
│   │   └── locales/            # en.js, zh-CN.js, ja.js, etc.
│   ├── util/                   # Utilities
│   └── assets/                 # Static assets
├── public/
│   └── assets/
│       └── audio/bgm/          # Background music files
├── scripts/                    # Build scripts
├── dist/                       # Build output
└── package.json
```

## Key Patterns

### Component Structure
- **Pages**: Full page components in `src/page/`
- **Components**: Reusable UI in `src/components/`
- **API calls**: Centralized in `src/api/`

### i18n
- 9 supported languages: EN, ZH-CN, ZH-TW, JA, KO, DE, FR, ES, TH
- Locale files in `src/i18n/locales/`
- Usage: `$t('section.key')` or `this.$t('section.key')`

### State Management
- Vuex modules: `common`, `user`, `focus`, etc.
- Actions for async operations
- Mutations for state changes

### Styling
- SCSS with scoped styles
- Element UI components with custom overrides
- Mobile-responsive design

## Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Running Locally
```bash
npm run serve              # Dev server (localhost API)
npm run serve-prod         # Dev server (prod API)
npm run serve:4001         # Port 4001, prod API
npm run serve:4002         # Port 4002, localhost:8088 API
```

### Building
```bash
npm run build              # Full build with pre-build optimizations
npm run build:quick        # Quick build without optimizations
```

### Other Commands
```bash
npm run lint               # ESLint
npm run clean              # Clean dist and cache
npm run optimize:images    # Compress images
```

## API Integration

- Base URL: Configured via `VUE_APP_API_URL` env var
- Auth: Bearer token in Authorization header
- Response format: `{ code: 0, msg: "Success", data: {} }`

## Important Files

| File | Purpose |
|------|---------|
| `src/main.js` | App bootstrap, plugins |
| `src/router/index.js` | Route definitions |
| `src/store/index.js` | Vuex store setup |
| `src/api/index.js` | API base config |
| `src/i18n/index.js` | i18n setup |
| `vue.config.js` | Webpack/CLI config |

## Common Tasks

### Adding i18n Keys
1. Add to `src/i18n/locales/en.js` (reference)
2. Add translations to all other locale files
3. Use via `$t('section.newKey')`

### Adding a New Page
1. Create component in `src/page/{feature}/`
2. Add route in `src/router/`
3. Add API functions in `src/api/` if needed

### Adding Audio/Media
1. Place files in `public/assets/audio/`
2. Reference as `/assets/audio/filename.mp3`

## Gotchas

- **No markdown tables in WhatsApp/Discord** - use bullet lists
- **Element UI 2.x** - not Element Plus (Vue 3)
- **Vue 2.7** - Composition API available but optional
- **Audio on iOS** - requires user interaction to play
