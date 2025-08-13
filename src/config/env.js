const env = process.env;

// Check if running in Electron
const isElectron = window.electronAPI !== undefined;

let baseUrl = '';
let codeUrl = `${window.location.host}/code`
let encodeKey = 'MyKiwiVocabulary'

// Configure API base URLs based on environment
if (isElectron) {
    // In Electron, use environment variable or default local server
    baseUrl = process.env.KIWI_SERVER_URL || 'http://localhost:9991';
    codeUrl = `${baseUrl}/code`;
} else {
    // Web version configuration
    if (env.NODE_ENV === 'development') {
        // Development configuration - use local server
        baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:9991';
        codeUrl = `${baseUrl}/code`;
    } else if (env.NODE_ENV === 'production') {
        // Production configuration - use your production server
        baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:9991'; // Update this to your production URL
        codeUrl = `${baseUrl}/code`;
    } else if (env.NODE_ENV === 'test') {
        // Test configuration
        baseUrl = 'http://localhost:9991';
        codeUrl = `${baseUrl}/code`;
    }
}

export {
    baseUrl,
    codeUrl,
    isElectron
}