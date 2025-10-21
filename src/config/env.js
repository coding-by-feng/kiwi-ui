const env = process.env;

// Robust Electron detection and safe window access
const win = (typeof window !== 'undefined') ? window : undefined;
const isElectron = !!(win && win.electronAPI);
const isElectronDev = isElectron && !!(win && win.electronAPI && win.electronAPI.isDev);

// Helper to retrieve env var from Electron preload (whitelisted) or process.env fallback
function getEnv(key) {
    if (isElectron && win && win.electronAPI && typeof win.electronAPI.getEnvVar === 'function') {
        const v = win.electronAPI.getEnvVar(key);
        if (v !== undefined && v !== null && v !== '') return v;
    }
    // Note: in renderer, process.env is replaced at build-time for known keys via DefinePlugin
    return env && env[key];
}

let baseUrl = '';
let codeUrl = '/code';
let encodeKey = 'MyKiwiVocabulary';

// Configure API base URLs based on environment
if (isElectron) {
    // In Electron, allow explicit override via KIWI_SERVER_URL; avoid VUE_APP_API_URL during dev to prevent CORS
    if (isElectronDev) {
        const explicit = getEnv('KIWI_SERVER_URL');
        baseUrl = explicit || '';
        codeUrl = explicit ? `${explicit}/code` : '/code';
    } else {
        // Packaged Electron or production can honor either env var
        const explicit = getEnv('KIWI_SERVER_URL') || getEnv('VUE_APP_API_URL');
        baseUrl = explicit || 'http://localhost:9991';
        codeUrl = `${baseUrl}/code`;
    }
} else {
    // Web version configuration
    if (env.NODE_ENV === 'development') {
        // In web dev, if VUE_APP_API_URL is provided, use it; otherwise keep empty to leverage vue-dev-server proxy
        const provided = getEnv('VUE_APP_API_URL');
        baseUrl = provided || '';
        codeUrl = provided ? `${provided}/code` : '/code';
    } else if (env.NODE_ENV === 'production') {
        // Production configuration - use provided server URL or default local
        const provided = getEnv('VUE_APP_API_URL');
        baseUrl = provided || 'http://localhost:9991'; // Update to your production URL if needed
        codeUrl = `${baseUrl}/code`;
    } else if (env.NODE_ENV === 'test') {
        // Test configuration
        baseUrl = 'http://localhost:9991';
        codeUrl = `${baseUrl}/code`;
    }
}

// If running from a local dev server (any localhost/127.* port), force use of relative paths (proxy)
function isLocalDevServer() {
    try {
        if (typeof window === 'undefined' || !window.location) return false
        const { protocol, hostname, port } = window.location
        if (!/^https?:$/.test(protocol)) return false
        if (!(hostname === 'localhost' || hostname === '127.0.0.1')) return false
        return !!port // any non-empty port denotes dev server
    } catch (e) { return false }
}

if (isLocalDevServer()) {
    const explicit = getEnv('KIWI_SERVER_URL')
    if (!explicit) {
        baseUrl = ''
        codeUrl = '/code'
        console.log('[env] Local dev-server detected; using proxy (no baseUrl).')
    }
}

export {
    baseUrl,
    codeUrl,
    isElectron
}