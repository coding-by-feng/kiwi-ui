const path = require('path');
const webpack = require('webpack')
const CompressionWebpackPlugin = require('compression-webpack-plugin')

// Web-only: remove Electron detection logic
const isDevServer = (
    process.env.WEBPACK_DEV_SERVER === 'true' ||
    process.env.npm_lifecycle_event === 'serve' ||
    (process.argv && process.argv.join(' ').includes('serve'))
)
const isProduction = process.env.NODE_ENV === 'production'

// Backend URL handling (web only)
const devProxyTarget = process.env.VUE_APP_API_URL || 'http://localhost:9991'
const definedApiEnv = isDevServer
    ? devProxyTarget
    : (process.env.VUE_APP_API_URL || '')

console.log(`Building Web in ${isProduction ? 'Production' : 'Development'} mode.${isDevServer ? ' (Dev Server)' : ''}`);
console.log(`API URL set to: ${definedApiEnv || '(relative, same-origin)'}`);
console.log(`Public path set to: '/' (web-only)`);

// Always absolute path for web
let publicPath = '/'

module.exports = {
    publicPath: publicPath,
    lintOnSave: false,
    productionSourceMap: false,
    transpileDependencies: [
        '@smallwei/avue',
        'chart.js',
        '@opendocsg/pdf2md',
        'unpdf'
    ],
    configureWebpack: {
        devtool: false,
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@i': path.resolve(__dirname, './src/assets'),
                'unpdf/pdfjs$': 'unpdf/dist/pdfjs.mjs'
            },
            extensions: ['.js', '.vue', '.json']
        },
        externals: isProduction ? {} : {},
        plugins: [
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                    VUE_APP_API_URL: JSON.stringify(definedApiEnv)
                }
            }),
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
                maxAsyncRequests: 8,
                maxInitialRequests: 6,
                minSize: 15000,
                maxSize: 120000,
                cacheGroups: {
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
                        maxSize: 100000
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
                        maxSize: 80000
                    },
                    avue: {
                        test: /[\\/]node_modules[\\/]@smallwei[\\/]avue[\\/]/,
                        name: 'avue',
                        priority: 18,
                        maxSize: 120000
                    },
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
                        maxSize: 100000
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
            maxEntrypointSize: 250000,
            maxAssetSize: 200000,
            hints: isProduction ? 'warning' : false,
            assetFilter: function(assetFilename) {
                return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
            }
        }
    },
    chainWebpack: config => {
        config.plugins.delete('prefetch')
        config.module
            .rule('mjs-fix')
            .test(/\.mjs$/)
            .include.add(/node_modules\/(?:@opendocsg\/pdf2md|unpdf)/)
            .end()
            .type('javascript/auto')
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
                crossorigin: 'anonymous'
            }
            return args
        })
        config.plugin('resource-hints')
            .use(require('webpack').DefinePlugin, [{
                __EXTERNAL_ASSETS__: JSON.stringify({
                    youtubeApi: '/assets/external/youtube-iframe-api.js',
                    voiceRssImage: '/assets/external/info_dark_brown.gif'
                })
            }])
        config.module
            .rule('images')
            .use('url-loader')
            .loader('url-loader')
            .tap(options => Object.assign(options || {}, {
                limit: 8192,
                fallback: {
                    loader: 'file-loader',
                    options: {
                        name: 'img/[name].[contenthash:8].[ext]',
                        publicPath: '/',
                        outputPath: 'img/'
                    }
                }
            }))
        config.module
            .rule('fonts')
            .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
            .use('url-loader')
            .loader('url-loader')
            .options({
                limit: 10000,
                name: 'fonts/[name].[hash:7].[ext]'
            })
        config.module
            .rule('external-assets')
            .test(/[\\/]assets[\\/]external[\\/].*\.(js|gif|png|jpg|jpeg)$/i)
            .use('file-loader')
            .loader('file-loader')
            .options({
                name: 'assets/external/[name].[contenthash:8].[ext]',
                publicPath: '/',
                outputPath: 'assets/external/',
                postTransformPublicPath: (p) => `${p}?cache=1y`
            })
        if (isProduction) {
            config.resolve.alias.set('element-ui$', 'element-ui/lib/index.js')
            config.optimization.minimize(true)
            config.optimization.splitChunks({
                ...config.optimization.get('splitChunks'),
                cacheGroups: {
                    ...config.optimization.get('splitChunks').cacheGroups,
                    elementFonts: {
                        test: /[\\/]node_modules[\\/]element-ui[\\/].*\.(woff2?|eot|ttf|otf)$/,
                        name: 'element-fonts',
                        priority: 35,
                        chunks: 'all',
                        enforce: true
                    }
                }
            })
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
        extract: false,
        sourceMap: false,
        loaderOptions: {
            sass: { sassOptions: { precision: 5 } },
            scss: { sassOptions: { precision: 5 } }
        }
    },
    devServer: {
        port: 8080,
        hot: true,
        compress: true,
        proxy: {
            '/auth': { target: devProxyTarget, ws: true, changeOrigin: true, secure: false },
            '/wordBiz': { target: devProxyTarget, ws: true, changeOrigin: true, secure: false },
            '/ai-biz': { target: devProxyTarget, ws: true, changeOrigin: true, secure: false },
            '/code': { target: devProxyTarget, ws: true, changeOrigin: true, secure: false },
            '/admin': { target: devProxyTarget, ws: true, changeOrigin: true, secure: false },
            '/tools': { target: devProxyTarget, ws: true, changeOrigin: true, secure: false }
        }
    },

    parallel: require('os').cpus().length > 1
}