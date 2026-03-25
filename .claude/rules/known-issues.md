# Known Issues & Guardrails

## Architecture Guardrails

- **Vue 2.7** - NOT Vue 3. Do NOT use Element Plus, Pinia, or Vue 3-only APIs
- **Element UI 2.x** - NOT Element Plus. Check docs for correct component APIs
- **No TypeScript** - Project uses plain JavaScript. Do not introduce `.ts` files
- **Options API** - Composition API is available but the codebase uses Options API exclusively
- **No console.log** in production code - use `messageCenter` from `src/util/msg.js` for user feedback

## iOS Safari Considerations

- Audio playback requires user gesture (cannot autoplay)
- iOS-specific error handling in `main.js` with `sendBeacon`
- Memory management: periodic GC hint via `setInterval` on iOS
- Test touch interactions with `vue-touch` directives

## Auth Flow

- Token stored in localStorage via `src/util/store.js`
- Axios interceptor adds Bearer token when `headers.isToken: true`
- Token expiry checked in both axios response interceptor and router guard
- 401/403/503 all trigger logout + redirect to login
- Refresh token flow exists in Vuex `RefreshToken` action

## Dev Server Proxy

- Dev server at port 8080 proxies `/auth`, `/api`, `/code`, `/admin`, `/tools`
- Proxy target set via `VUE_APP_API_URL` env var
- YouTube captions endpoint (`/api/ytb/captions`) served directly by dev server via `youtube-captions-scraper`

## Webpack

- Split chunks configured extensively for Element UI, Vue core, and vendor libs
- Prefetch disabled, preload configured for initial chunks
- Gzip compression in production builds
- `css.extract: false` - CSS is inlined, not extracted

## AI Features

- Dual AI provider support: backend SSE (`backend`) and direct Gemini API (`gemini`)
- Gemini config in `kiwiConsts.GEMINI_CONFIG`
- SSE client in `src/util/sseClient.js`
- Prompt templates in `src/const/geminiPromptTemplates.js`
- AI modes centralized in `kiwiConsts.SEARCH_AI_MODES`
