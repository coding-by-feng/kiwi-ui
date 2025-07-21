// Mobile debugging utility for OAuth issues
export const mobileDebugger = {
  // Detect mobile device
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },

  // Detect iOS Safari specifically
  isIOSSafari() {
    const ua = navigator.userAgent
    return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua)
  },

  // Log device and browser info
  logDeviceInfo() {
    console.log('📱 [MOBILE] Device Info:', {
      userAgent: navigator.userAgent,
      isMobile: this.isMobile(),
      isIOSSafari: this.isIOSSafari(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      url: window.location.href,
      timestamp: new Date().toISOString()
    })
  },

  // Log OAuth specific debugging info
  logOAuthDebug() {
    console.log('🔍 [OAUTH-DEBUG] OAuth Debug Info:', {
      currentUrl: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
      hasToken: window.location.href.includes('token='),
      hasUser: window.location.href.includes('user='),
      localStorage: {
        accessToken: !!localStorage.getItem('kason-tools-access_token'),
        userName: localStorage.getItem('kason-tools-user_name')
      }
    })
  },

  // Create a visual debug overlay for mobile
  createDebugOverlay(message, type = 'info') {
    if (!this.isMobile()) return

    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 12px;
      word-wrap: break-word;
    `
    overlay.textContent = `[${new Date().toLocaleTimeString()}] ${message}`
    
    document.body.appendChild(overlay)
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay)
      }
    }, 5000)
  }
}

// Auto-log device info when module loads
if (mobileDebugger.isMobile()) {
  mobileDebugger.logDeviceInfo()
}
