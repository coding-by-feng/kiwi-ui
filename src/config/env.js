const env = process.env;

// Web-only environment utility (Electron removed)
function getEnv(key) {
    return env && env[key];
}

let baseUrl = '';
let codeUrl = '/code';

if (env.NODE_ENV === 'development') {
    const provided = getEnv('VUE_APP_API_URL');
    baseUrl = provided || '';
    codeUrl = provided ? `${provided}/code` : '/code';
} else if (env.NODE_ENV === 'production') {
    const provided = getEnv('VUE_APP_API_URL');
    baseUrl = provided || '';
    codeUrl = provided ? `${provided}/code` : '/code';
} else if (env.NODE_ENV === 'test') {
    baseUrl = 'http://localhost:9991';
    codeUrl = `${baseUrl}/code`;
}

// If running from a local dev server (localhost), force proxy-relative paths
function isLocalDevServer() {
    try {
        if (typeof window === 'undefined' || !window.location) return false
        const { protocol, hostname, port } = window.location
        if (!/^https?:$/.test(protocol)) return false
        if (!(hostname === 'localhost' || hostname === '127.0.0.1')) return false
        return !!port
    } catch (e) { return false }
}

if (isLocalDevServer()) {
    const provided = getEnv('VUE_APP_API_URL')
    if (!provided) {
        baseUrl = ''
        codeUrl = '/code'
        console.log('[env] Local dev-server detected; using proxy (no baseUrl).')
    }
}

export { baseUrl, codeUrl }
