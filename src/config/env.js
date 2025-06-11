const env = process.env;

// Check if running in Electron
const isElectron = window.electronAPI !== undefined;

let baseUrl = '';
let codeUrl = `${window.location.host}/code`
let encodeKey = 'MyKiwiVocabulary'

// Configure API base URLs based on environment
if (isElectron) {
    // In Electron, we need to proxy to the backend server
    // Using your local server
    baseUrl = 'http://kason-server.local:9991'; // Your local server
    codeUrl = `${baseUrl}/code`;
} else {
    // Web version configuration
    if (env.NODE_ENV === 'development') {
        // Development configuration - also use your local server
        baseUrl = 'http://kason-server.local:9991';
        codeUrl = `${baseUrl}/code`;
    } else if (env.NODE_ENV === 'production') {
        // Production configuration - use your production server
        // baseUrl = 'https://your-production-server.com';
        baseUrl = 'http://kason-server.local:9991'; // or your production URL
        codeUrl = `${baseUrl}/code`;
    } else if (env.NODE_ENV === 'test') {
        // Test configuration
        baseUrl = 'http://kason-server.local:9991';
        codeUrl = `${baseUrl}/code`;
    }
}

export {
    baseUrl,
    codeUrl,
    isElectron
}