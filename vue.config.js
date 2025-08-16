// Vue CLI Configuration File - Central hub for all build and development settings
// This file controls how your Vue.js application is compiled, bundled, and served

const CompressionPlugin = require('compression-webpack-plugin');
const path = require('path');

// Environment Detection - Critical for different build behaviors
// isElectron: Detects if we're building for Electron desktop app vs web browser
// This affects CORS settings, proxy configuration, and API endpoints
const isElectron = process.env.IS_ELECTRON || process.env.npm_lifecycle_event?.includes('electron');
// isProduction: Determines if we're building for production (optimized) vs development (debug-friendly)
// Production builds are minified, have no source maps, use chunk splitting for caching
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  // PUBLIC PATH CONFIGURATION
  // publicPath: Controls how assets are referenced in the final build
  // './' = relative paths (good for Electron and CDN deployment)
  // '/' = absolute paths from domain root (good for standard web hosting)
  publicPath: isProduction ? './' : '/',

  // BUILD OUTPUT CONFIGURATION
  outputDir: 'dist',        // Where the final build files go
  assetsDir: 'static',      // Subdirectory for JS/CSS/images (creates /static folder)
  productionSourceMap: false, // Disable source maps in production (smaller bundle, less debug info)

  // CSS PROCESSING CONFIGURATION
  css: {
    // CSS Extraction Strategy:
    // extract: true = CSS in separate .css files (better caching, parallel loading)
    // extract: false = CSS injected via JavaScript (faster development builds)
    extract: isProduction,

    // Source Maps for CSS debugging (disabled for smaller builds)
    sourceMap: false,

    // SASS/SCSS CONFIGURATION - Critical for fixing deprecation warnings
    loaderOptions: {
      // SASS Configuration (indented syntax)
      sass: {
        implementation: require('sass'), // Use Dart Sass (modern, faster than Node Sass)
        sassOptions: {
          // CRITICAL FIX: Use modern API to prevent "legacy-js-api" deprecation warnings
          api: 'modern-compiler',
          // Silence specific deprecation warnings that don't affect functionality
          silenceDeprecations: ['legacy-js-api']
        }
      },
      // SCSS Configuration (CSS-like syntax with braces)
      scss: {
        implementation: require('sass'),
        sassOptions: {
          api: 'modern-compiler',
          silenceDeprecations: ['legacy-js-api']
        }
      }
    }
  },

  // DEVELOPMENT SERVER CONFIGURATION
  devServer: {
    port: 8080,           // Local development server port
    hot: true,            // Hot Module Replacement - updates code without full page reload
    compress: true,       // Enable gzip compression for faster loading

    // PROXY CONFIGURATION - Critical for development API calls
    // Conditional proxy setup: only enable for web browser (not Electron)
    // Electron has direct access to APIs, browsers need CORS proxy
    ...((!isElectron) ? {
      proxy: {
        // Each API endpoint is proxied to your backend server
        // This solves CORS (Cross-Origin Resource Sharing) issues in development
        '/auth': {
          target: 'http://localhost:9991',  // Your backend server
          changeOrigin: true,               // Changes the host header to match target
          ws: true                          // Enable WebSocket proxying for real-time features
        },
        '/wordBiz': {
          target: 'http://localhost:9991',
          changeOrigin: true,
          ws: true
        },
        '/ai-biz': {
          target: 'http://localhost:9991',
          changeOrigin: true,
          ws: true
        },
        '/code': {
          target: 'http://localhost:9991',
          changeOrigin: true,
          ws: true
        },
        '/admin': {
          target: 'http://localhost:9991',
          changeOrigin: true,
          ws: true
        }
      }
    } : {}) // Empty object for Electron (no proxy needed)
  },

  // WEBPACK CORE CONFIGURATION
  configureWebpack: {
    // MODULE RESOLUTION - How imports are resolved
    resolve: {
      alias: {
        // '@' alias allows clean imports: import Component from '@/components/MyComponent'
        // Instead of: import Component from '../../components/MyComponent'
        '@': path.resolve(__dirname, 'src')
      }
    },

    // WEBPACK PLUGINS - Additional build processing
    // Only add compression in production (reduces build time in development)
    plugins: isProduction ? [
      // GZIP Compression Plugin - Creates .gz files for faster serving
      new CompressionPlugin({
        test: /\.(js|css|html|svg)$/,    // Which files to compress
        threshold: 1024,                  // Only compress files > 1KB (smaller files not worth it)
        deleteOriginalAssets: false       // Keep original files (server can choose which to serve)
      })
    ] : [] // No extra plugins in development
  },

  // ADVANCED WEBPACK CONFIGURATION - Chain webpack config for fine-grained control
  chainWebpack: config => {
    // FONT HANDLING CONFIGURATION - Critical for Element UI icons
    // This rule processes font files (.woff, .woff2, .ttf, .eot, .otf)
    config.module
      .rule('fonts')                                           // Create a new rule named 'fonts'
      .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/)                 // Match font file extensions
      .use('url-loader')                                       // Use url-loader to process fonts
      .loader('url-loader')                                    // Specify the loader
      .options({
        limit: 10000,                                          // Files < 10KB become inline base64 (faster loading)
        name: 'fonts/[name].[hash:8].[ext]'                   // Larger files saved as: fonts/fontname.12345678.woff
        // [name] = original filename, [hash:8] = 8-char hash for cache busting, [ext] = file extension
      });

    // SPECIAL ELEMENT UI FONT HANDLING - Prevents the "fonts/fonts/" double directory issue
    config.module
      .rule('element-fonts')                                   // Separate rule for Element UI icons
      .test(/element-icons\.(woff2?|eot|ttf|otf)(\?.*)?$/)    // Match only Element UI icon fonts
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 10000,
        name: 'fonts/[name].[hash:8].[ext]',
        publicPath: '../'                                      // CRITICAL: Adjust CSS path references
        // publicPath '../' makes CSS reference fonts as ../fonts/icon.woff instead of fonts/icon.woff
      });

    // PRODUCTION OPTIMIZATIONS - Only run expensive optimizations in production builds
    if (isProduction) {
      // CODE SPLITTING STRATEGY - Breaks your app into optimal chunks for caching
      config.optimization.splitChunks({
        chunks: 'all',        // Split both sync and async chunks
        cacheGroups: {        // Define how to group modules into chunks

          // VENDOR LIBRARIES CHUNK - All third-party dependencies
          libs: {
            name: 'chunk-libs',                    // Output filename: chunk-libs.js
            test: /[\\/]node_modules[\\/]/,        // Match any file from node_modules
            priority: 10,                          // Higher priority = processed first
            chunks: 'initial'                      // Only initial chunks (not lazy-loaded)
            // This chunk contains: Vue, Axios, etc. - changes rarely, caches well
          },

          // ELEMENT UI CHUNK - Separate chunk for UI library
          elementUI: {
            name: 'chunk-elementui',               // Output: chunk-elementui.js
            priority: 20,                          // Higher priority than libs
            test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // Match Element UI files
            // Why separate: Element UI is large but stable, benefits from separate caching
          },

          // COMMON CODE CHUNK - Shared application code
          commons: {
            name: 'chunk-commons',                 // Output: chunk-commons.js
            test: /[\\/]src[\\/]/,                // Match files from your src directory
            minChunks: 2,                          // Must be imported by at least 2 modules
            priority: 5,                           // Lower priority than vendor chunks
            reuseExistingChunk: true              // Reuse existing chunks instead of duplicating
            // Contains: Shared components, utilities used across multiple pages
          }
        }
      });

      // CSS EXTRACTION FIX - Prevents CSS ordering warnings
      // Element UI and custom CSS sometimes conflict in order, this ignores those warnings
      config.plugin('extract-css').tap(args => {
        args[0].ignoreOrder = true;    // Ignore CSS chunk order warnings
        return args;                   // Return modified configuration
      });
    }
  },

  // ELECTRON-SPECIFIC CONFIGURATION
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,        // Allow Node.js APIs in renderer (your Vue app)
      contextIsolation: false,      // Disable context isolation for easier communication
      enableRemoteModule: true      // Enable Electron remote module (deprecated but still used)
      // Note: These settings are less secure but necessary for older Electron apps
    }
  }
};
