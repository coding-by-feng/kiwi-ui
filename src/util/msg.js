import { Message as ElementMessage, Notification as ElementNotification, MessageBox } from 'element-ui'
import { getStore } from '@/util/store'
import kiwiConst from '@/const/kiwiConsts'

const ALWAYS_VISIBLE_TYPES = new Set(['error'])
const DEFAULT_TOAST_OPTIONS = Object.freeze({
  center: true,
  offset: 200,
  duration: 3000,
  customClass: 'kiwi-message-toast'
})
const DEFAULT_POPUP_OPTIONS = Object.freeze({
  duration: 3000,
  position: 'top-right',
  showClose: true,
  customClass: 'kiwi-message-notify'
})

function isMessageHintsEnabled () {
  const preference = getStore({ name: kiwiConst.CONFIG_KEY.ENABLE_MSG_HINT })
  return preference !== kiwiConst.ENABLE_MSG_HINT.DISABLE
}

function shouldDisplay (type, { force } = {}) {
  if (force) return true
  if (ALWAYS_VISIBLE_TYPES.has(type)) return true
  return isMessageHintsEnabled()
}

function normalizeOptions (payload, overrides = {}) {
  let base = {}
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    base = { ...payload }
  } else if (payload !== undefined) {
    base = { message: payload }
  }
  return { ...base, ...overrides }
}

function extractContext (options) {
  if (!options) return { options, context: null }
  const { context, ...rest } = options
  return { options: rest, context: context || null }
}

function resolveTitle (context, fallback) {
  if (context && typeof context.$t === 'function') {
    try { return context.$t(fallback) } catch (e) { /* ignore */ }
  }
  return fallback
}

function showToast (payload, overrides = {}) {
  const normalized = normalizeOptions(payload, overrides)
  const { options } = extractContext(normalized)
  const { force } = options
  const type = options.type || overrides.type || 'info'

  if (!shouldDisplay(type, { force })) return null

  const finalOptions = { ...DEFAULT_TOAST_OPTIONS, ...options, type }
  delete finalOptions.force

  return ElementMessage(finalOptions)
}

function showPopup (payload, overrides = {}) {
  const normalized = normalizeOptions(payload, overrides)
  const { options } = extractContext(normalized)
  const { force } = options
  const type = options.type || overrides.type || 'info'

  if (!shouldDisplay(type, { force })) return null

  const finalOptions = { ...DEFAULT_POPUP_OPTIONS, ...options, type }

  if (type === 'error' && typeof finalOptions.duration === 'undefined') {
    finalOptions.duration = 0
  }

  delete finalOptions.force

  return ElementNotification(finalOptions)
}

function showConfirm (message, title, options) {
  let finalMessage = message
  let finalTitle = title
  let finalOptions = options || {}

  if (typeof title === 'object' && title !== null) {
    finalOptions = title
    finalTitle = title && title.title ? title.title : undefined
  }

  const mergedOptions = {
    confirmButtonClass: 'kiwi-confirm-button',
    cancelButtonClass: 'kiwi-cancel-button',
    ...finalOptions
  }

  return MessageBox.confirm(finalMessage, finalTitle, mergedOptions)
}

const messageCenter = {
  toast: showToast,
  popup: showPopup,
  success (payload, overrides = {}) {
    return showToast(payload, { ...overrides, type: 'success' })
  },
  warning (payload, overrides = {}) {
    return showToast(payload, { ...overrides, type: 'warning' })
  },
  info (payload, overrides = {}) {
    return showToast(payload, { ...overrides, type: 'info' })
  },
  error (payload, overrides = {}) {
    return showToast(payload, { ...overrides, type: 'error', force: true })
  },
  popupSuccess (payload, overrides = {}) {
    return showPopup(payload, { ...overrides, type: 'success' })
  },
  popupWarning (payload, overrides = {}) {
    return showPopup(payload, { ...overrides, type: 'warning' })
  },
  popupInfo (payload, overrides = {}) {
    return showPopup(payload, { ...overrides, type: 'info' })
  },
  popupError (payload, overrides = {}) {
    return showPopup(payload, { ...overrides, type: 'error', force: true })
  },
  closeMessages () {
    if (typeof ElementMessage.closeAll === 'function') {
      ElementMessage.closeAll()
    }
  },
  closeNotifications () {
    if (typeof ElementNotification.closeAll === 'function') {
      ElementNotification.closeAll()
    }
  },
  closeAll () {
    this.closeMessages()
    this.closeNotifications()
  },
  confirm: showConfirm,
  isMessageHintsEnabled,
  // Compatibility helpers used across the codebase
  msgWarning (context, msg, overrides = {}) {
    return showToast(msg, { ...overrides, type: 'warning', context })
  },
  msgError (context, msg, overrides = {}) {
    const title = resolveTitle(context, 'common.error')
    const localizedTitle = title && title !== 'common.error' ? title : 'Error'
    return showPopup({ title: localizedTitle, message: msg }, { ...overrides, type: 'error', context, force: true })
  },
  msgSuccess (context, msg, duration) {
    const extra = {}
    if (typeof duration !== 'undefined') extra.duration = duration
    return showToast(msg, { context, type: 'success', ...extra })
  },
  notifySuccess (context, title, msg, duration) {
    const fallback = context && context.$t ? context.$t('messages.dataLoadException') : 'Operation completed'
    const extra = {}
    if (typeof duration !== 'undefined') extra.duration = duration
    return showPopup({ title, message: msg || fallback }, { context, type: 'success', ...extra })
  },
  operateSuccess (context) {
    const message = context && context.$t ? context.$t('messages.operationSuccess') : 'Operation succeeded'
    return showToast(message, { context, type: 'success', duration: 2000 })
  },
  showLoginRequired (context) {
    const message = context && context.$t ? context.$t('messages.loginRequired') : 'Login required'
    return showToast(message, { context, type: 'warning' })
  },
  showSystemError (context) {
    const title = context && context.$t ? context.$t('common.error') : 'Error'
    const message = context && context.$t ? context.$t('messages.systemError') : 'System error'
    return showPopup({ title, message }, { context, type: 'error', force: true })
  },
  showOperationTooFrequent (context) {
    const message = context && context.$t ? context.$t('messages.operationTooFrequent') : 'Operation too frequent'
    return showToast(message, { context, type: 'warning' })
  },
  showNoPermission (context) {
    const message = context && context.$t ? context.$t('messages.noPermission') : 'No permission'
    return showToast(message, { context, type: 'warning' })
  },
  showResourceNotFound (context) {
    const message = context && context.$t ? context.$t('messages.resourceNotFound') : 'Resource not found'
    return showToast(message, { context, type: 'warning' })
  },
  confirmDelete (context, callback) {
    const message = context && context.$t ? context.$t('messages.confirmDelete') : 'Delete this item?'
    const title = context && context.$t ? context.$t('collections.deleteOperation') : 'Delete'
    return showConfirm(message, title, {
      confirmButtonText: context && context.$t ? context.$t('common.confirm') : 'Confirm',
      cancelButtonText: context && context.$t ? context.$t('common.cancel') : 'Cancel',
      type: 'warning'
    }).then(() => {
      if (typeof callback === 'function') callback()
    }).catch(() => {})
  },
  confirmClear (context, callback) {
    const message = context && context.$t ? context.$t('messages.confirmClear') : 'Clear all items?'
    const title = context && context.$t ? context.$t('messages.clearOperation') : 'Clear'
    return showConfirm(message, title, {
      confirmButtonText: context && context.$t ? context.$t('common.confirm') : 'Confirm',
      cancelButtonText: context && context.$t ? context.$t('common.cancel') : 'Cancel',
      type: 'warning'
    }).then(() => {
      if (typeof callback === 'function') callback()
    }).catch(() => {})
  }
}

export default messageCenter