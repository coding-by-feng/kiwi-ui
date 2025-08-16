const path = require('path');
const webpack = require('webpack')
const CompressionWebpackPlugin = require('compression-webpack-plugin')

// Determine if running in Electron
const isElectron = process.env.IS_ELECTRON === 'true' || process.env.npm_lifecycle_event === 'electron-dev';
const isProduction = process.env.NODE_ENV === 'production'

// Backend URL
const url = process.env.VUE_APP_API_URL || 'http://localhost:9991'

// CRITICAL: Use absolute path for web deployment
let publicPath = isElectron ? './' : '/'

module.exports = {
    publicPath: publicPath,
    lintOnSave: false, // Disable linting in production builds for speed
    productionSourceMap: false, // MUST be false for production

    transpileDependencies: [
        '@smallwei/avue'
    ],

    configureWebpack: {
        devtool: false, // No source maps in production

        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@i': path.resolve(__dirname, './src/assets'),
            },
            extensions: ['.js', '.vue', '.json']
        },

        // Externalize heavy libraries if they're loaded from CDN
        externals: isProduction ? {
            // Only if you're loading these from CDN
            // 'axios': 'axios',
        } : {},

        plugins: [
            // Ignore all locale files of moment.js
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

            // Define plugin for environment variables
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                    VUE_APP_API_URL: JSON.stringify(process.env.VUE_APP_API_URL || url)
                }
            }),

            // Only compress in production
            ...(isProduction ? [
                new CompressionWebpackPlugin({
                    filename: '[path][base].gz',
                    algorithm: 'gzip',
                    test: /\.(js|css|html|svg)$/,
                    threshold: 10240,
                    minRatio: 0.8,
                    deleteOriginalAssets: false
                })
            ] : [])
        ],

        optimization: {
            runtimeChunk: false,
            moduleIds: 'hashed',

            splitChunks: {
                chunks: 'all',
                maxAsyncRequests: 8, // Increased for better chunk distribution
                maxInitialRequests: 6, // Increased for better initial loading
                minSize: 15000, // Reduced for more granular chunks
                maxSize: 120000, // Reduced max size for better iOS compatibility

                cacheGroups: {
                    // Split Element UI into more granular chunks
                    elementUICore: {
                        test: /[\\/]node_modules[\\/]element-ui[\\/]lib[\\/](utils|mixins|transitions|locale)[\\/]/,
                        name: 'element-ui-core',
                        priority: 30,
                        enforce: true,
                        chunks: 'all'
                    },
                    elementUIForms: {
                        test: /[\\/]node_modules[\\/]element-ui[\\/]lib[\\/](input|select|form|button|checkbox|radio)[\\/]/,
                        name: 'element-ui-forms',
                        priority: 28,
                        chunks: 'all',
                        maxSize: 80000
                    },
                    elementUILayouts: {
                        test: /[\\/]node_modules[\\/]element-ui[\\/]lib[\\/](row|col|container|header|aside|main|footer)[\\/]/,
                        name: 'element-ui-layouts',
                        priority: 26,
                        chunks: 'all'
                    },
                    elementUIComponents: {
                        test: /[\\/]node_modules[\\/]element-ui[\\/]lib[\\/](?!utils|mixins|transitions|locale|input|select|form|button|checkbox|radio|row|col|container|header|aside|main|footer)/,
                        name: 'element-ui-components',
                        priority: 24,
                        chunks: 'all',
                        maxSize: 100000 // Keep individual component chunks smaller
                    },
                    elementUIStyles: {
                        test: /[\\/]node_modules[\\/]element-ui[\\/].*\.css$/,
                        name: 'element-ui-styles',
                        priority: 22,
                        enforce: true
                    },
                    vue: {
                        test: /[\\/]node_modules[\\/](vue|vue-router|vuex|vue-i18n)[\\/]/,
                        name: 'vue-core',
                        priority: 20,
                        maxSize: 80000 // Keep Vue core small
                    },
                    avue: {
                        test: /[\\/]node_modules[\\/]@smallwei[\\/]avue[\\/]/,
                        name: 'avue',
                        priority: 18,
                        maxSize: 120000
                    },
                    // Split large vendors more granularly
                    vendorLarge: {
                        test: /[\\/]node_modules[\\/](axios|moment|lodash|pdf)[\\/]/,
                        name: 'vendor-large',
                        priority: 16,
                        maxSize: 80000
                    },
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendor',
                        priority: 10,
                        minSize: 15000,
                        maxSize: 100000 // Smaller vendor chunks for iOS Safari
                    },
                    common: {
                        name: 'common',
                        minChunks: 2,
                        priority: 5,
                        reuseExistingChunk: true,
                        maxSize: 60000
                    },
                    default: {
                        minChunks: 2,
                        priority: -20,
                        reuseExistingChunk: true,
                        maxSize: 40000
                    }
                }
            },

            minimize: isProduction
        },

        performance: {
            maxEntrypointSize: 250000, // Reduced for better performance
            maxAssetSize: 200000, // Reduced for better performance
            hints: isProduction ? 'warning' : false,
            assetFilter: function(assetFilename) {
                return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
            }
        }
    },

    chainWebpack: config => {
        // Remove prefetch plugin to reduce initial load
        config.plugins.delete('prefetch')

        // Optimize preload for critical resources
        config.plugin('preload').tap(args => {
            args[0] = {
                rel: 'preload',
                as(entry) {
                    if (/\.css$/.test(entry)) return 'style';
                    if (/\.woff2?$/.test(entry)) return 'font';
                    if (/\.png$/.test(entry)) return 'image';
                    if (/\.gif$/.test(entry)) return 'image';
                    if (/youtube-iframe-api\.js$/.test(entry)) return 'script';
                    return 'script';
                },
                include: 'initial',
                fileBlacklist: [/\.map$/, /hot-update\./, /runtime\./],
                crossorigin: 'anonymous' // Add crossorigin for external resources
            }
            return args
        })

        // Add resource hints for local external assets
        config.plugin('resource-hints')
            .use(require('webpack').DefinePlugin, [{
                __EXTERNAL_ASSETS__: JSON.stringify({
                    youtubeApi: '/assets/external/youtube-iframe-api.js',
                    voiceRssImage: '/assets/external/info_dark_brown.gif'
                })
            }])

        // Optimize images with better compression and caching
        config.module
            .rule('images')
            .use('url-loader')
            .loader('url-loader')
            .tap(options => Object.assign(options || {}, {
                limit: 8192, // Reduced limit to avoid large inline images
                fallback: {
                    loader: 'file-loader',
                    options: {
                        name: 'img/[name].[contenthash:8].[ext]',
                        publicPath: '/',
                        outputPath: 'img/'
                    }
                }
            }))

        // Enhanced font handling - revert to standard Element UI font handling
        config.module
            .rule('fonts')
            .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
            .use('url-loader')
            .loader('url-loader')
            .options({
                limit: 10000,
                name: 'fonts/[name].[hash:7].[ext]'
            })

        // Add rule for external assets to ensure proper caching
        config.module
            .rule('external-assets')
            .test(/[\\/]assets[\\/]external[\\/].*\.(js|gif|png|jpg|jpeg)$/i)
            .use('file-loader')
            .loader('file-loader')
            .options({
                name: 'assets/external/[name].[contenthash:8].[ext]',
                publicPath: '/',
                outputPath: 'assets/external/',
                // Add cache control headers
                postTransformPublicPath: (p) => `${p}?cache=1y`
            })

        // Production optimizations
        if (isProduction) {
            // Enable tree shaking for Element UI
            config.resolve.alias.set('element-ui$', 'element-ui/lib/index.js')

            // Minimize and optimize
            config.optimization.minimize(true)

            // Add long-term caching for chunks
            config.optimization.splitChunks({
                ...config.optimization.get('splitChunks'),
                cacheGroups: {
                    ...config.optimization.get('splitChunks').cacheGroups,
                    // Ensure Element UI fonts get proper caching
                    elementFonts: {
                        test: /[\\/]node_modules[\\/]element-ui[\\/].*\.(woff2?|eot|ttf|otf)$/,
                        name: 'element-fonts',
                        priority: 35,
                        chunks: 'all',
                        enforce: true
                    }
                }
            })

            // Bundle analyzer for debugging
            if (process.env.ANALYZE) {
                config.plugin('webpack-bundle-analyzer')
                    .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin, [{
                        analyzerMode: 'static',
                        openAnalyzer: false,
                        reportFilename: 'bundle-report.html'
                    }])
            }
        }
    },

    css: {
        extract: false, // Temporarily disable CSS extraction to fix build issue
        sourceMap: false,
        loaderOptions: {
            sass: {
                sassOptions: {
                    precision: 5
                }
            },
            scss: {
                sassOptions: {
                    precision: 5
                }
            }
        }
    },

    devServer: {
        port: 8080,
        hot: true,
        compress: true,
        ...((!isElectron) ? {
            proxy: {
                '/auth': { target: url, ws: true },
                '/wordBiz': { target: url, ws: true },
                '/ai-biz': { target: url, ws: true },
                '/code': { target: url, ws: true },
                '/admin': { target: url, ws: true }
            }
        } : {})
    },

    parallel: require('os').cpus().length > 1
}