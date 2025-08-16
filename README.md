# Kason Tools (Web + Electron)

Kason Tools is a Vue 2.7 + Element UI application with an optional Electron shell. It provides fast vocabulary lookup, learning tools (YouTube assistant, grammar listening, BGM), user accounts, i18n, and AI-assisted features.


- Word search and detail view
- Starred list (review)
- Grammar listening player (local audio assets)
- YouTube learning tools and player
- AI response detail and call history
- User login and user center
- About and BGM tabs
- i18n (multiple locales) and mobile-friendly layout


- Vue 2.7.x, Vue Router 3.x, Vuex 3.x
- Element UI 2.15.x, Avue 2.x
- Axios (wrapped with interceptors, NProgress)
- vue-i18n 8.x
- pdfjs-dist, vue-pdf-embed (PDF viewing)
- Electron 22 (optional desktop app)
- Build tooling: @vue/cli-service 4.5, Webpack 4, Terser, Compression


- src/page/**: views and tabbed layout (Index.vue)
- src/router/**: router instance, route definitions, axios wrapper
- src/store/**: Vuex store
- src/i18n/**: localization
- src/styles/**: global styles
- src/const/**: constants (website paths, response codes)
- public/**: index.html, static assets, Electron preload and main scripts
- scripts/**: packaging and helper scripts


- Node: 16.x LTS recommended (compatible with Vue CLI 4 and Electron 22)
- npm: 8+
- macOS/Windows/Linux


1) Install dependencies
- npm install

2) Environment variables
- VUE_APP_API_URL: Backend API base URL (default http://localhost:9991 if unset)
- IS_ELECTRON: Set to true only when you need to force Electron-specific behavior. For dev, electron-dev script sets it automatically.

You can export variables in your shell or create .env files (e.g., .env.development, .env.production) as per Vue CLI.

3) Start web dev server
- npm run serve

4) Start Electron (loads the dev server)
- npm run electron-dev


- Production web build
- npm run build
  - Output: dist/

- Package Electron app (runs build first)
- macOS: npm run dist-mac (or pack-mac)
- Windows: npm run dist-win (or pack-win)
- Linux: npm run dist-linux (or pack-linux)
- All: npm run dist-all

Electron artifacts are written to dist_electron/.


- Hash mode (default). Routes are under /#/ ...
- Route bootstrap: src/router/router.js plus Avue dynamic formatting
- Permission guard: src/permission.js redirects unauthenticated users to login tab unless path is whitelisted (website.noAuthPath)

Common tab routes (under /index/tools):
- search, starList, youtube, userCenter, userLogin, about, bgm
- Details: /index/tools/detail?active=search
- Lazy variant: /lazy/tools/detail (IndexLazy.vue)


Axios wrapper: src/router/axios.js
- NProgress integration
- Bearer token injection (when headers.isToken)
- Electron-aware baseURL and headers
- Centralized error handling via Element Message

Important: In production builds, axios is externalized by webpack and is expected to be provided by a CDN script tag in public/index.html. See Troubleshooting below if the app does not start.


- Vue CLI config: vue.config.js
  - publicPath: '/' for web, './' for Electron
  - Externals in production: axios, wechat (remove or adjust if not using global scripts)
  - Transpile: pdfjs-dist, @smallwei/avue, vue-pdf-embed
  - SplitChunks tuned for mobile; gzip compression in production
  - CSS: sass-loader configured via sassOptions (precision)
  - DevServer proxy forwards API paths to VUE_APP_API_URL

- Electron builder: package.json > build
  - mac/win/linux targets; resources packaged from dist/


- i18n usage: src/i18n/** and Index.vue integrates a language switcher
- Grammar listening assets in public/grammar/mp3 and text in public/grammar/txt
- BGM assets under public/bgm
- PDF support via pdfjs-dist/vue-pdf-embed


If the site shows only the fallback “Loading; Please wait …” message after deployment, check the following:

1) Remove incorrect Vue plugin usage
- Do NOT call Vue.use(router instance). The router is already installed via Vue.use(VueRouter) and passed into new Vue({ router }).
- File: src/main.js — remove the line: Vue.use(router)

2) Ensure axios CDN is loading (only affects production)
- vue.config.js externalizes axios in production. That means window.axios must exist.
- public/index.html includes axios from https://cdn.bootcss.com/axios/0.19.0/axios.min.js.
- If the CDN is blocked/slow, the app will fail at startup.

Options:
- Preferred: stop externalizing axios. In vue.config.js remove 'axios' from configureWebpack.externals for production so it’s bundled.
- Or switch to a reliable CDN (e.g., jsdelivr, unpkg) and/or add a local fallback loader.

3) Check browser console for errors
- 404/blocked CDN, “plugin.apply is not a function” (caused by Vue.use(router)), CORS, etc.

4) API base URL
- Ensure VUE_APP_API_URL points to a reachable server and that CORS is configured. The app makes requests under /auth, /wordBiz, /ai-biz, /code, /admin.

5) Sass loader option error
- If you see: “options has an unknown property 'precision'”, use loaderOptions.sass.sassOptions.precision in vue.config.js (already configured here).

6) PDF large bundle warning
- “[BABEL] Note: … pdf.js exceeds 500KB” is a warning and can be ignored, or load pdfjs from CDN if needed.


- Element UI is large; splitChunks already separates vendor chunks to keep initial load reasonable.
- You can toggle gzip in vue.config.js and analyze bundles with ANALYZE=1 npm run build.


- This repository currently has no explicit license. Add one if you plan to distribute builds.


- Keep dependencies aligned with Vue CLI 4 (Webpack 4) and Electron 22.
- Recommended Node 16.x for consistent builds.
- When updating sass-loader (>=8) use sassOptions instead of deprecated top-level options.
