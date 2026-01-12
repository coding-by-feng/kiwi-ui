import Vue from 'vue'
import StatusOverlay from '@/components/common/StatusOverlay.vue'

let instance = null
let mountNode = null
let hideTimer = null

function destroyInstance() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (instance) {
    try {
      // Clear content before destroying
      instance.visible = false
      instance.title = ''
      instance.message = ''
      instance.$destroy()
    } catch (e) { /* ignore */ }
    instance = null
  }
  if (mountNode) {
    try {
      // Remove all child elements first
      while (mountNode.firstChild) {
        mountNode.removeChild(mountNode.firstChild)
      }
      if (mountNode.parentNode) {
        mountNode.parentNode.removeChild(mountNode)
      }
    } catch (e) { /* ignore */ }
    mountNode = null
  }
  // Clean up any orphaned status-overlay or status-content elements from body
  try {
    // Remove orphaned status-overlay containers
    const orphanOverlays = document.querySelectorAll('body > div > .status-overlay')
    orphanOverlays.forEach(el => {
      if (el.parentNode && el.parentNode.parentNode === document.body) {
        document.body.removeChild(el.parentNode)
      }
    })
    // Remove orphaned status-content elements
    const orphanContents = document.querySelectorAll('body > div > .status-content')
    orphanContents.forEach(el => {
      if (el.parentNode && el.parentNode.parentNode === document.body) {
        document.body.removeChild(el.parentNode)
      }
    })
    // Remove any empty wrapper divs that might be left over
    const emptyWrappers = document.querySelectorAll('body > div:empty')
    emptyWrappers.forEach(el => {
      if (!el.id && !el.className) {
        document.body.removeChild(el)
      }
    })
  } catch (e) { /* ignore */ }
}

function createInstance() {
  // Always create fresh instance to avoid stale state
  destroyInstance()

  const Constructor = Vue.extend(StatusOverlay)
  instance = new Constructor({
    propsData: {
      visible: false,
      status: 'loading',
      title: '',
      message: '',
      backdrop: false,
      closable: false,
      duration: 0,
      position: 'absolute'
    }
  })

  mountNode = document.createElement('div')
  document.body.appendChild(mountNode)
  instance.$mount(mountNode)

  instance.$on('close', () => {
    // Destroy instance completely when closed to remove from DOM
    destroyInstance()
  })

  return instance
}

const StatusService = {
  show(options = {}) {
    const inst = createInstance()
    const {
      type = 'loading',
      title = '',
      message = '',
      duration = type === 'loading' ? 0 : 2000,  // Auto-close non-loading statuses after 2s
      backdrop = false,
      closable = false
    } = options

    inst.status = type
    // Don't show generic type name as title - only show explicit titles
    inst.title = (typeof title === 'string' && title.trim()) ? title.trim() : ''
    inst.message = (typeof message === 'string' && message.trim()) ? message.trim() : ''
    inst.duration = duration
    inst.backdrop = backdrop
    inst.closable = closable

    // Only show if there's explicit title or message - never show empty overlays
    const hasContent = inst.title || inst.message
    if (hasContent) {
      inst.visible = true
    } else {
      // Don't show empty overlays - destroy immediately
      destroyInstance()
      return { close: () => {} }
    }

    // Clear any existing timer
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }

    if (duration > 0) {
      hideTimer = setTimeout(() => {
        // Destroy instance completely to remove from DOM
        destroyInstance()
      }, duration)
    }

    return {
      close: () => {
        destroyInstance()
      }
    }
  },

  loading(options = {}) {
    return this.show({ ...options, type: 'loading' })
  },

  success(options = {}) {
    return this.show({ ...options, type: 'success', duration: options.duration || 2000 })
  },

  error(options = {}) {
    return this.show({ ...options, type: 'error', closable: true })
  },

  // Show status based on API response: response.data.success=true shows green, false shows red
  // Supports both { success, msg } and { success, message } response formats
  fromApiResponse(response, options = {}) {
    const data = response?.data || response || {}
    const isSuccess = data.success === true
    const msg = data.msg || data.message || ''
    return this.show({
      ...options,
      type: isSuccess ? 'success' : 'error',
      title: options.title || (isSuccess ? 'Success' : 'Error'),
      message: options.message || msg,
      duration: options.duration || 2000
    })
  },

  closeAll() {
    destroyInstance()
  },

  // Reset overlay to clean state
  reset() {
    destroyInstance()
  }
}

export default StatusService
