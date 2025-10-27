// Onboarding tour utilities using driver.js
// Runs once per browser (first visit) unless reset. Safe to call after Vue mount.

import {driver as createDriver} from 'driver.js'

const TOUR_STORAGE_KEY = 'kiwi.tour.v1.completed'
const TOUR_ENABLE_STORAGE_KEY = 'kiwi.tour.enabled'
const TOUR_ICON_VISIBILITY_KEY = 'kiwi.tour.icon.visible'

function getDriverFactory() {
  try {
    if (typeof createDriver === 'function') return createDriver
  } catch (_) {}
  try {
    if (typeof window !== 'undefined') {
      // Fallbacks if bundled differently
      if (typeof window.driver === 'function') return window.driver
      if (window.Driver && typeof window.Driver === 'function') {
        // Wrap class into factory
        return (opts) => new window.Driver(opts)
      }
    }
  } catch (_) {}
  return null
}

function safeQuery(selector) {
  try { return document.querySelector(selector) } catch (_) { return null }
}

function elementExists(selector) {
  return !!safeQuery(selector)
}

function findTabItem(name) {
  // Try common Element UI tab item patterns
  // 1) id="tab-<name>"
  let el = safeQuery(`#main-tabs .el-tabs__item#tab-${name}`)
  if (el) return el
  // 2) aria-controls="pane-<name>"
  el = safeQuery(`#main-tabs .el-tabs__item[aria-controls*="${name}"]`)
  if (el) return el
  // 3) any item whose id includes name
  el = safeQuery(`#main-tabs .el-tabs__item[id*="${name}"]`)
  if (el) return el
  // 4) fallback by position if you know the template order (best-effort)
  //    search(1), starList(2), todo(3), youtube(4), aiHistory(5), userCenter(6), login(7), about(8)
  const order = {
    search: 1, starList: 2, todo: 3, youtube: 4, aiHistory: 5, userCenter: 6, login: 7, about: 8
  }
  const idx = order[name]
  if (idx) {
    el = safeQuery(`#main-tabs .el-tabs__header .el-tabs__item:nth-child(${idx})`)
    if (el) return el
  }
  return null
}

function buildSteps(router) {
  // touch router to avoid unused warnings and allow future route-aware logic
  const _currentPath = router && router.currentRoute ? router.currentRoute.path : ''
  void _currentPath

  const steps = []

  // Welcome overlay
  steps.push({
    element: 'body',
    popover: {
      title: 'Welcome to Kason Tools',
      description: 'A quick tour to help you get started. You can exit anytime.',
      position: 'center'
    }
  })

  // Main tabs container
  if (elementExists('#main-tabs')) {
    steps.push({
      element: '#main-tabs',
      popover: {
        title: 'Feature Tabs',
        description: 'Switch between Search, Collections, To‑do, YouTube, AI History, User Center, and About. Some tabs appear after login or can be toggled in settings.',
        position: 'bottom'
      }
    })
  }

  // Specific tabs (best-effort, only if visible)
  const searchTab = findTabItem('search')
  if (searchTab) {
    steps.push({
      element: searchTab,
      popover: {
        title: 'Search',
        description: 'Look up words or paste text. Dictionary shows suggestions; AI modes open a dedicated view.',
        position: 'bottom'
      }
    })
  }

  const todoTab = findTabItem('todo')
  if (todoTab) {
    steps.push({
      element: todoTab,
      popover: {
        title: 'To‑do',
        description: 'Plan study tasks with progress, history, analytics, and a gamified ranking.',
        position: 'bottom'
      }
    })
  }

  const starTab = findTabItem('starList')
  if (starTab) {
    steps.push({
      element: starTab,
      popover: {
        title: 'Collections',
        description: 'Save words and phrases for spaced review and organized practice.',
        position: 'bottom'
      }
    })
  }

  // Login tab (only shown when not logged in)
  const loginTab = findTabItem('login')
  if (loginTab) {
    steps.push({
      element: loginTab,
      popover: {
        title: 'Login',
        description: 'Sign in to unlock YouTube, AI History, and Collections syncing.',
        position: 'bottom'
      }
    })
  }

  // YouTube and AI History tabs (usually require login)
  const ytTab = findTabItem('youtube')
  if (ytTab) {
    steps.push({
      element: ytTab,
      popover: {
        title: 'YouTube',
        description: 'Learn from videos with subtitle‑aware tools and instant lookup (login required).',
        position: 'bottom'
      }
    })
  }

  const aiHistoryTab = findTabItem('aiHistory')
  if (aiHistoryTab) {
    steps.push({
      element: aiHistoryTab,
      popover: {
        title: 'AI History',
        description: 'Review your recent AI prompts and responses (login required).',
        position: 'bottom'
      }
    })
  }

  // User Center tab (shown when logged in)
  const userCenterTab = findTabItem('userCenter')
  if (userCenterTab) {
    steps.push({
      element: userCenterTab,
      popover: {
        title: 'User Center',
        description: 'Customize hotkeys, enable/disable feature tabs, and tweak app preferences.',
        position: 'bottom'
      }
    })
  }

  // About tab (if present)
  const aboutTab = findTabItem('about')
  if (aboutTab) {
    steps.push({
      element: aboutTab,
      popover: {
        title: 'About',
        description: 'Learn more about Kason Tools and its features.',
        position: 'bottom'
      }
    })
  }

  // Language switcher if present (header area)
  const langSwitcher = safeQuery('.language-switcher-container, #language-switcher, [data-role="language-switcher"]')
  if (langSwitcher) {
    steps.push({
      element: langSwitcher,
      popover: {
        title: 'App Language',
        description: 'Switch the interface language of the application.',
        position: 'left'
      }
    })
  }

  // Search controls inside Search tab
  const searchInput = safeQuery('#search-input')
  if (searchInput) {
    steps.push({
      element: searchInput,
      popover: {
        title: 'Type to Search',
        description: 'Enter a word or paste text. Press Enter to search; AI modes support multi‑line input.',
        position: 'bottom'
      }
    })
  }

  const modeSelect = safeQuery('#mode-select-prepend, #mode-select')
  if (modeSelect) {
    steps.push({
      element: modeSelect,
      popover: {
        title: 'Choose Mode',
        description: 'Switch between Dictionary and AI modes (translation, explanation, grammar, synonyms, etc.).',
        position: 'bottom'
      }
    })
  }

  const langSelect = safeQuery('#language-select')
  if (langSelect) {
    steps.push({
      element: langSelect,
      popover: {
        title: 'Target Language',
        description: 'Pick the language used for translations and explanations in AI modes.',
        position: 'bottom'
      }
    })
  }

  const searchBtn = safeQuery('#search-submit-btn')
  if (searchBtn) {
    steps.push({
      element: searchBtn,
      popover: {
        title: 'Run Search',
        description: 'Click or press Enter. AI modes open in a dedicated view.',
        position: 'left'
      }
    })
  }

  const aiHistoryBtn = safeQuery('#ai-history-btn')
  if (aiHistoryBtn) {
    steps.push({
      element: aiHistoryBtn,
      popover: {
        title: 'AI History Shortcut',
        description: 'Jump directly to your recent AI results from Search.',
        position: 'bottom'
      }
    })
  }

  // Floating Help button (if present)
  const helpBtn = safeQuery('.help-tour-button')
  if (helpBtn) {
    steps.push({
      element: helpBtn,
      popover: {
        title: 'Help & Tour',
        description: 'Use this floating button anytime to re‑run or reset the guided tour.',
        position: 'left'
      }
    })
  }

  // Final tip
  steps.push({
    element: '#main-tabs',
    popover: {
      title: 'Tip',
      description: 'Re‑run this tour later from the Help button or via window.KiwiTour in the console.',
      position: 'bottom'
    }
  })

  // Detailed steps per tab’s internal UI (Collections, To‑do, YouTube modes, AI History, User Center, Login, About). Steps are conditional on element existence and use stable classes/ids discovered in the components.
  // Collections (StarList)
  const starListRoot = safeQuery('.starlist-container')
  if (starListRoot) {
    const ctrlBar = safeQuery('.starlist-container .control-bar')
    if (ctrlBar) steps.push({
      element: ctrlBar,
      popover: { title: 'Collections Controls', description: 'Use these controls to switch list type, review/read modes, add lists, and refresh.', position: 'bottom' }
    })
    const listType = safeQuery('.starlist-container .control-bar .ctrl-select')
    if (listType) steps.push({
      element: listType,
      popover: { title: 'List Type', description: 'Switch between Paraphrase, Word, and Example collections.', position: 'bottom' }
    })
    const listTable = safeQuery('.starlist-container .starlist-table')
    if (listTable) steps.push({
      element: listTable,
      popover: { title: 'Your Lists', description: 'Click a list name to open details. Use the per-row menu to start review/read modes.', position: 'top' }
    })
    const rowSelect = safeQuery('.starlist-container .row-select')
    if (rowSelect) steps.push({
      element: rowSelect,
      popover: { title: 'Quick Mode', description: 'Start review or read directly for a specific list.', position: 'left' }
    })
  }

  // To‑do
  const todoRoot = safeQuery('.todo-gamification, .todo-view')
  if (todoRoot) {
    const taskInput = safeQuery('.task-input')
    if (taskInput) steps.push({
      element: taskInput,
      popover: { title: 'Add Tasks', description: 'Enter a title, optional description, points, and frequency, then click Add.', position: 'bottom' }
    })
    const filters = safeQuery('.task-filter-section')
    if (filters) steps.push({
      element: filters,
      popover: { title: 'Filter Tasks', description: 'Filter by status and frequency, or reset all to Pending.', position: 'bottom' }
    })
    const tasksList = safeQuery('.tasks-list')
    if (tasksList) steps.push({
      element: tasksList,
      popover: { title: 'Manage Tasks', description: 'Mark success/fail, edit, delete, or reset status from here.', position: 'top' }
    })
    const historyDate = safeQuery('.history-tab .responsive-date-picker, .history-tab .el-date-editor')
    if (historyDate) steps.push({
      element: historyDate,
      popover: { title: 'History', description: 'Pick a date to review completed tasks and their outcomes.', position: 'bottom' }
    })
    const trashClear = safeQuery('.trash-tab .clear-trash-btn')
    if (trashClear) steps.push({
      element: trashClear,
      popover: { title: 'Trash', description: 'Restore or permanently delete tasks. Clear all trash here.', position: 'left' }
    })
    const analytics = safeQuery('.analytics-tab .analytics-controls')
    if (analytics) steps.push({
      element: analytics,
      popover: { title: 'Analytics', description: 'Switch chart type to analyze monthly progress and success rate.', position: 'bottom' }
    })
  }

  // YouTube
  const ytSwitch = safeQuery('.youtube-page .ytb-mode-switch')
  if (ytSwitch) steps.push({
    element: ytSwitch,
    popover: { title: 'YouTube Modes', description: 'Toggle between Favorites, Channel manager, and the Player.', position: 'bottom' }
  })
  const ytChannelManager = safeQuery('.youtube-channel-manager')
  if (ytChannelManager) {
    const channelHeader = safeQuery('#youtubeChannelManagerHead')
    if (channelHeader) steps.push({
      element: channelHeader,
      popover: { title: 'Channel Manager', description: 'Manage your channels and browse their videos.', position: 'bottom' }
    })
    const submitCard = safeQuery('.youtube-channel-manager .submit-card .input-with-submit')
    if (submitCard) steps.push({
      element: submitCard,
      popover: { title: 'Add Channel', description: 'Paste a YouTube channel link or name, then submit to add.', position: 'bottom' }
    })
    const pagination = safeQuery('.youtube-channel-manager .pagination-container')
    if (pagination) steps.push({
      element: pagination,
      popover: { title: 'Browse', description: 'Use pagination to navigate channels or videos.', position: 'top' }
    })
  }
  const ytFavorites = safeQuery('.youtube-favorites')
  if (ytFavorites) {
    const innerTabs = safeQuery('.youtube-favorites .inner-tabs')
    if (innerTabs) steps.push({
      element: innerTabs,
      popover: { title: 'Favorites', description: 'Switch between favorite Videos and favorite Channels.', position: 'bottom' }
    })
  }
  const ytPlayer = safeQuery('.youtube-player')
  if (ytPlayer) {
    const urlInput = safeQuery('.youtube-player .url-input')
    if (urlInput) steps.push({
      element: urlInput,
      popover: { title: 'Enter Video URL', description: 'Paste a YouTube URL and click Load to fetch subtitles and tools.', position: 'bottom' }
    })
    const favBtn = safeQuery('.youtube-player .favorite-btn')
    if (favBtn) steps.push({
      element: favBtn,
      popover: { title: 'Favorite Video', description: 'Toggle favorite for the current video.', position: 'left' }
    })
    const subsHeader = safeQuery('.youtube-player .subtitles-header')
    if (subsHeader) steps.push({
      element: subsHeader,
      popover: { title: 'Subtitles Timeline', description: 'Scroll and click to jump; auto-centering can be enabled.', position: 'left' }
    })
    const transHeader = safeQuery('.youtube-player .translated-subtitles-header')
    if (transHeader) steps.push({
      element: transHeader,
      popover: { title: 'Translated Subtitles', description: 'Stream translations live and download when ready.', position: 'left' }
    })
    const splitter = safeQuery('.youtube-player .splitter')
    if (splitter) steps.push({
      element: splitter,
      popover: { title: 'Resize Panels', description: 'Drag to adjust video vs. subtitles space.', position: 'left' }
    })
  }

  // AI History
  const aiHistoryRoot = safeQuery('.ai-call-history')
  if (aiHistoryRoot) {
    const filtersCard = safeQuery('.ai-call-history .filter-card')
    if (filtersCard) steps.push({
      element: filtersCard,
      popover: { title: 'Filter AI History', description: 'Filter by mode, language, and status; clear filters anytime.', position: 'bottom' }
    })
    const historyItem = safeQuery('.ai-call-history .history-item')
    if (historyItem) steps.push({
      element: historyItem,
      popover: { title: 'History Items', description: 'Open details, copy prompts, re-run, archive, or delete.', position: 'top' }
    })
    const paginator = safeQuery('.ai-call-history .pagination-container')
    if (paginator) steps.push({
      element: paginator,
      popover: { title: 'Pagination', description: 'Navigate across pages of your AI calls.', position: 'top' }
    })
  }

  // User Center
  const userCenterRoot = safeQuery('.user-center-container')
  if (userCenterRoot) {
    const logoutBtn = safeQuery('.user-center-container .logout-button')
    if (logoutBtn) steps.push({
      element: logoutBtn,
      popover: { title: 'Logout', description: 'Sign out from your account here.', position: 'left' }
    })
    const hotkeysBtn = safeQuery('.user-center-container .hotkeys-icon-btn')
    if (hotkeysBtn) steps.push({
      element: hotkeysBtn,
      popover: { title: 'Search Mode Hotkeys', description: 'Configure custom keyboard shortcuts for Search modes.', position: 'left' }
    })
    const featureToggles = safeQuery('.user-center-container .feature-toggles')
    if (featureToggles) steps.push({
      element: featureToggles,
      popover: { title: 'Feature Tabs', description: 'Show or hide feature tabs like To‑do, YouTube, About, and Collections.', position: 'top' }
    })
  }

  // Login
  const loginGoogle = safeQuery('.login-container .google-login')
  if (loginGoogle) steps.push({
    element: loginGoogle,
    popover: { title: 'Google Login', description: 'Sign in with your Google account to unlock all features.', position: 'bottom' }
  })

  // About
  const runTourBtn = safeQuery('#run-tour-btn')
  if (runTourBtn) steps.push({
    element: runTourBtn,
    popover: { title: 'Run Guided Tour', description: 'You can re-run the guided tour anytime from About.', position: 'bottom' }
  })

  return steps
}

function startOnboardingTour(router, markCompleteOnClose = true) {
  const steps = buildSteps(router).filter(s => !!s.element)
  if (!steps.length) return null

  // Respect global tour enabled flag
  if (!isTourGloballyEnabled()) return null

  const factory = getDriverFactory()
  if (!factory) return null

  let drv
  try {
    drv = factory({
      animate: true,
      opacity: 0.4,
      padding: 6,
      allowClose: true,
      overlayClickNext: false,
      showButtons: ['next', 'previous', 'close']
    })
  } catch (e) {
    console.error('[tour] Failed to create Driver instance:', e)
    return null
  }

  if (markCompleteOnClose) {
    try {
      const markDisabled = () => {
        localStorage.setItem(TOUR_STORAGE_KEY, '1')
        // Auto-disable future tours and hide icon after first run completion
        setTourGloballyEnabled(false)
        setHelpIconVisible(false)
        try { window.dispatchEvent(new Event('tour-settings-updated')) } catch (_) {}
      }
      drv.on('reset', markDisabled)
      drv.on('destroyed', markDisabled)
    } catch (_) {}
  }

  try {
    if (typeof drv.setSteps === 'function') drv.setSteps(steps)
    // Some versions accept steps in options; setSteps covers both safely
    if (typeof drv.drive === 'function') drv.drive()
    else if (typeof drv.start === 'function') drv.start()
    else {
      console.error('[tour] Driver instance has no drive/start method')
      return null
    }
  } catch (e) {
    console.error('[tour] Failed to start Driver tour:', e)
    return null
  }
  return drv
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function waitForSelector(selector, timeout = 6000, interval = 100) {
  const start = Date.now()
  let el = null
  while (Date.now() - start < timeout) {
    el = safeQuery(selector)
    if (el) return el
    await sleep(interval)
  }
  return null
}

async function activateTab(name, router) {
  // Try clicking the tab header
  const tabEl = findTabItem(name)
  if (tabEl) {
    try { tabEl.click() } catch (_) {}
  }
  // Also attempt router replace to ensure query.active stays in sync
  try {
    const q = (router && router.currentRoute && router.currentRoute.query) ? { ...router.currentRoute.query } : {}
    if (q.active !== name) {
      q.active = name
      q.now = Date.now()
      // Avoid creating new history entry
      if (router && typeof router.replace === 'function') {
        router.replace({ path: (router.currentRoute && router.currentRoute.path) || '/index/tools/detail', query: q })
      }
    }
  } catch (_) {}
  // Give the view a moment to mount
  await sleep(100)
}

function createDriverInstance() {
  const factory = getDriverFactory()
  if (!factory) return null
  try {
    return factory({
      animate: true,
      opacity: 0.4,
      padding: 6,
      allowClose: true,
      overlayClickNext: false,
      showButtons: ['next', 'previous', 'close']
    })
  } catch (e) {
    console.error('[tour] Failed to create Driver instance:', e)
    return null
  }
}

function collectSearchSteps() {
  const steps = []
  const searchInput = safeQuery('#search-input')
  if (searchInput) steps.push({ element: searchInput, popover: { title: 'Type to Search', description: 'Enter a word or paste text. Press Enter to search; AI modes support multi‑line input.', position: 'bottom' } })
  const modeSelect = safeQuery('#mode-select-prepend, #mode-select')
  if (modeSelect) steps.push({ element: modeSelect, popover: { title: 'Choose Mode', description: 'Switch between Dictionary and AI modes (translation, explanation, grammar, synonyms, etc.).', position: 'bottom' } })
  const langSelect = safeQuery('#language-select')
  if (langSelect) steps.push({ element: langSelect, popover: { title: 'Target Language', description: 'Pick the language used for translations and explanations in AI modes.', position: 'bottom' } })
  const searchBtn = safeQuery('#search-submit-btn')
  if (searchBtn) steps.push({ element: searchBtn, popover: { title: 'Run Search', description: 'Click or press Enter. AI modes open in a dedicated view.', position: 'left' } })
  const aiHistoryBtn = safeQuery('#ai-history-btn')
  if (aiHistoryBtn) steps.push({ element: aiHistoryBtn, popover: { title: 'AI History Shortcut', description: 'Jump directly to your recent AI results from Search.', position: 'bottom' } })
  return steps
}

function collectStarListSteps() {
  const steps = []
  const ctrlBar = safeQuery('.starlist-container .control-bar')
  if (ctrlBar) steps.push({ element: ctrlBar, popover: { title: 'Collections Controls', description: 'Switch list type, start review/read, add lists, and refresh.', position: 'bottom' } })
  const listType = safeQuery('.starlist-container .control-bar .ctrl-select')
  if (listType) steps.push({ element: listType, popover: { title: 'List Type', description: 'Toggle Paraphrase, Word, or Example collections.', position: 'bottom' } })
  const listTable = safeQuery('.starlist-container .starlist-table')
  if (listTable) steps.push({ element: listTable, popover: { title: 'Your Lists', description: 'Click a list to open details. Use per‑row menu to start review/read.', position: 'top' } })
  const rowSelect = safeQuery('.starlist-container .row-select')
  if (rowSelect) steps.push({ element: rowSelect, popover: { title: 'Quick Mode', description: 'Launch review/read for a specific list.', position: 'left' } })
  return steps
}

function collectTodoSteps() {
  const steps = []
  const taskInput = safeQuery('.task-input')
  if (taskInput) steps.push({ element: taskInput, popover: { title: 'Add Tasks', description: 'Set title, description, points, frequency, then Add.', position: 'bottom' } })
  const filters = safeQuery('.task-filter-section')
  if (filters) steps.push({ element: filters, popover: { title: 'Filter Tasks', description: 'Filter by status/frequency or reset all to Pending.', position: 'bottom' } })
  const tasksList = safeQuery('.tasks-list')
  if (tasksList) steps.push({ element: tasksList, popover: { title: 'Manage Tasks', description: 'Mark success/fail, edit, delete, or reset status.', position: 'top' } })
  const historyDate = safeQuery('.history-tab .responsive-date-picker, .history-tab .el-date-editor')
  if (historyDate) steps.push({ element: historyDate, popover: { title: 'History', description: 'Pick a date to review completed tasks.', position: 'bottom' } })
  const trashClear = safeQuery('.trash-tab .clear-trash-btn')
  if (trashClear) steps.push({ element: trashClear, popover: { title: 'Trash', description: 'Restore or permanently delete; clear all trash here.', position: 'left' } })
  const analytics = safeQuery('.analytics-tab .analytics-controls')
  if (analytics) steps.push({ element: analytics, popover: { title: 'Analytics', description: 'Switch chart type to analyze monthly progress.', position: 'bottom' } })
  return steps
}

function collectYoutubeSteps() {
  const steps = []
  const modeSwitch = safeQuery('.youtube-page .ytb-mode-switch')
  if (modeSwitch) steps.push({ element: modeSwitch, popover: { title: 'YouTube Modes', description: 'Toggle between Favorites, Channel, and Player.', position: 'bottom' } })
  const channelHeader = safeQuery('#youtubeChannelManagerHead')
  if (channelHeader) steps.push({ element: channelHeader, popover: { title: 'Channel Manager', description: 'Manage channels and browse their videos.', position: 'bottom' } })
  const submitCard = safeQuery('.youtube-channel-manager .submit-card .input-with-submit')
  if (submitCard) steps.push({ element: submitCard, popover: { title: 'Add Channel', description: 'Paste a channel link or name, then submit.', position: 'bottom' } })
  const favTabs = safeQuery('.youtube-favorites .inner-tabs')
  if (favTabs) steps.push({ element: favTabs, popover: { title: 'Favorites', description: 'Switch between favorite Videos and Channels.', position: 'bottom' } })
  const urlInput = safeQuery('.youtube-player .url-input')
  if (urlInput) steps.push({ element: urlInput, popover: { title: 'Enter Video URL', description: 'Paste a YouTube URL and click Load.', position: 'bottom' } })
  const favBtn = safeQuery('.youtube-player .favorite-btn')
  if (favBtn) steps.push({ element: favBtn, popover: { title: 'Favorite Video', description: 'Toggle favorite for the current video.', position: 'left' } })
  const subsHeader = safeQuery('.youtube-player .subtitles-header')
  if (subsHeader) steps.push({ element: subsHeader, popover: { title: 'Subtitles Timeline', description: 'Scroll and click to jump; auto‑center available.', position: 'left' } })
  const transHeader = safeQuery('.youtube-player .translated-subtitles-header')
  if (transHeader) steps.push({ element: transHeader, popover: { title: 'Translated Subtitles', description: 'Stream translations and download when ready.', position: 'left' } })
  const splitter = safeQuery('.youtube-player .splitter')
  if (splitter) steps.push({ element: splitter, popover: { title: 'Resize Panels', description: 'Drag to adjust video vs. subtitles space.', position: 'left' } })
  return steps
}

function collectAiHistorySteps() {
  const steps = []
  const filtersCard = safeQuery('.ai-call-history .filter-card')
  if (filtersCard) steps.push({ element: filtersCard, popover: { title: 'Filter AI History', description: 'Filter by mode, language, and status; clear filters anytime.', position: 'bottom' } })
  const historyItem = safeQuery('.ai-call-history .history-item')
  if (historyItem) steps.push({ element: historyItem, popover: { title: 'History Items', description: 'Open details, copy prompts, re‑run, archive, or delete.', position: 'top' } })
  const paginator = safeQuery('.ai-call-history .pagination-container')
  if (paginator) steps.push({ element: paginator, popover: { title: 'Pagination', description: 'Navigate across pages of your AI calls.', position: 'top' } })
  return steps
}

function collectUserCenterSteps() {
  const steps = []
  const logoutBtn = safeQuery('.user-center-container .logout-button')
  if (logoutBtn) steps.push({ element: logoutBtn, popover: { title: 'Logout', description: 'Sign out from your account here.', position: 'left' } })
  const hotkeysBtn = safeQuery('.user-center-container .hotkeys-icon-btn')
  if (hotkeysBtn) steps.push({ element: hotkeysBtn, popover: { title: 'Search Mode Hotkeys', description: 'Configure keyboard shortcuts for Search modes.', position: 'left' } })
  const featureToggles = safeQuery('.user-center-container .feature-toggles')
  if (featureToggles) steps.push({ element: featureToggles, popover: { title: 'Feature Tabs', description: 'Show or hide To‑do, YouTube, About, and Collections tabs.', position: 'top' } })
  return steps
}

function driveSteps(steps) {
  return new Promise((resolve) => {
    if (!steps || steps.length === 0) return resolve(false)
    const drv = createDriverInstance()
    if (!drv) return resolve(false)
    try {
      if (typeof drv.setSteps === 'function') drv.setSteps(steps)
      drv.on && drv.on('destroyed', () => resolve(true))
      drv.on && drv.on('reset', () => resolve(true))
      if (typeof drv.drive === 'function') drv.drive()
      else if (typeof drv.start === 'function') drv.start()
      else resolve(false)
    } catch (e) {
      console.error('[tour] driveSteps failed:', e)
      resolve(false)
    }
  })
}

export async function startFullGuidedTour(router) {
  // Initial intro on current view
  const intro = []
  intro.push({ element: 'body', popover: { title: 'Welcome to Kason Tools', description: 'A quick tour to get you oriented.', position: 'center' } })
  if (elementExists('#main-tabs')) {
    intro.push({ element: '#main-tabs', popover: { title: 'Feature Tabs', description: 'Switch sections here. Some tabs require login or can be toggled in settings.', position: 'bottom' } })
  }
  const langSwitcher = safeQuery('.language-switcher-container, #language-switcher, [data-role="language-switcher"]')
  if (langSwitcher) intro.push({ element: langSwitcher, popover: { title: 'App Language', description: 'Change the interface language.', position: 'left' } })
  await driveSteps(intro)

  // Sections in order; each step set runs after auto-navigation and DOM ready
  const sections = [
    { name: 'search', waitFor: '#search-input', collect: collectSearchSteps },
    { name: 'starList', waitFor: '.starlist-container', collect: collectStarListSteps },
    { name: 'todo', waitFor: '.todo-gamification, .todo-view', collect: collectTodoSteps },
    { name: 'youtube', waitFor: '.youtube-page', collect: collectYoutubeSteps },
    { name: 'aiHistory', waitFor: '.ai-call-history', collect: collectAiHistorySteps },
    { name: 'userCenter', waitFor: '.user-center-container', collect: collectUserCenterSteps }
  ]

  for (const sec of sections) {
    // Skip if tab is not available
    if (!findTabItem(sec.name)) continue
    await activateTab(sec.name, router)
    const ok = await waitForSelector(sec.waitFor, 7000, 120)
    if (!ok) continue
    const steps = sec.collect()
    if (steps && steps.length) await driveSteps(steps)
  }

  // Final tip and Help button
  const outro = []
  const helpBtn = safeQuery('.help-tour-button')
  if (helpBtn) outro.push({ element: helpBtn, popover: { title: 'Help & Tour', description: 'Use this floating button anytime to re‑run or reset the guided tour.', position: 'left' } })
  outro.push({ element: '#main-tabs', popover: { title: 'Tip', description: 'You can re‑run this tour later from the Help button or via window.KiwiTour.', position: 'bottom' } })
  await driveSteps(outro)
}

export function startTourNow(router) {
  // Respect global toggle when starting explicitly as well
  if (!isTourGloballyEnabled()) return null
  try { return startFullGuidedTour(router) } catch (_) { return startOnboardingTour(router, false) }
}

export function maybeStartOnboardingTour(router) {
  try {
    if (localStorage.getItem(TOUR_STORAGE_KEY) === '1') return
    if (!isTourGloballyEnabled()) return
  } catch (_) { /* ignore storage errors */ }

  // Delay slightly to let the DOM settle
  setTimeout(() => {
    startOnboardingTour(router, true)
  }, 300)
}

export function resetOnboardingTour() {
  try { localStorage.removeItem(TOUR_STORAGE_KEY) } catch (_) {}
  // Also re-enable if the user explicitly resets
  setTourGloballyEnabled(true)
  setHelpIconVisible(true)
  try { window.dispatchEvent(new Event('tour-settings-updated')) } catch (_) {}
}

// Expose a simple console API for power users and support
// Usage: KiwiTour.reset(); KiwiTour.start();
try {
  if (typeof window !== 'undefined') {
    window.KiwiTour = {
      start: () => startOnboardingTour(null, false),
      reset: () => resetOnboardingTour()
    }
  }
} catch (_) {}
