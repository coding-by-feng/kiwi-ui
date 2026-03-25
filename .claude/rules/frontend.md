# Frontend Conventions

## Framework: Vue 2.7 + Element UI 2.15

- Options API is the standard (Composition API available but not used)
- Element UI components with `Kiwi`-prefixed wrappers in `src/components/ui/`
- SCSS scoped styles per component

## File Organization

- **Pages**: `src/page/{feature}/` - full page components
- **Components**: `src/components/` - reusable UI (`ui/` for Kiwi wrappers, `common/` for shared)
- **API**: `src/api/{domain}.js` - one file per domain (ai, todo, login, etc.)
- **Store**: `src/store/modules/{module}.js` - Vuex modules (common, user, todo, focus)
- **Utils**: `src/util/` - utility functions by concern (auth, audio, date, lang, etc.)
- **Constants**: `src/const/kiwiConsts.js` - centralized constants (routes, API bases, config keys)

## Routing

- Routes defined in `src/router/page/index.js` using named views
- All tool pages are children of `/index/tools/` with named `<router-view>` slots
- Route constants in `kiwiConsts.ROUTES` and `kiwiConsts.ROUTE_PREFIX`
- Lazy loading route at `/lazy/tools/` for minimal pages

## API Layer

- All HTTP via `src/router/axios.js` (configured axios instance with interceptors)
- Import as `import request from '@/router/axios'`
- Auth token via `headers: { isToken: true }` (interceptor adds Bearer token)
- API base paths in `kiwiConsts.API_BASE` (e.g., `/api/word`, `/api/ai`)
- Response format: `{ code: 0, msg: "Success", data: {} }`

## State Management (Vuex)

- Modules: `user`, `common`, `tags`, `todo`, `focus`
- Use `getStore`/`setStore` from `src/util/store.js` for localStorage-backed state
- Mutations for sync state changes, actions for async operations

## i18n

- 9 locales in `src/i18n/locales/` (en, zh-CN, zh-TW, ja, ko, de, fr, es, th)
- Usage: `$t('section.key')` in templates, `this.$t()` in scripts
- Always add keys to `en.js` first, then all other locale files
- Element UI integrated: `i18n: (key, value) => i18n.t(key, value)`

## Path Aliases

- `@` = `src/`
- `@i` = `src/assets/`

## Styling

- SCSS with `<style lang="scss" scoped>`
- Global styles in `src/styles/common.scss`
- Element UI theme overrides as needed
- Mobile-responsive design required

## Audio

- Howler.js for audio playback
- Audio files in `public/assets/audio/`
- iOS requires user interaction to initiate playback

## Package Manager

- npm (package-lock.json)
- Node 16+
