const path = require('path');
const webpack = require('webpack')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const productionGzipExtensions = ['js', 'css']

// Determine if running in Electron
const isElectron = process.env.IS_ELECTRON === 'true' || process.env.npm_lifecycle_event === 'electron-dev';

// Backend URL - use localhost for Electron, or your production server
const url = isElectron ? 'http://kason-server.local:9991' : 'http://kiwi-microservice-local:9991'

// Set public path based on environment
let publicPath = isElectron ? './' : './'

module.exports = {
    publicPath: publicPath,
    lintOnSave: true,
    productionSourceMap: true,
    transpileDependencies: [
        'pdfjs-dist' // Make sure this line is present
    ],
    configureWebpack: {
        devtool: 'source-map',
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@i': path.resolve(__dirname, './src/assets'),
            }
        },
        plugins: [
            // Ignore all locale files of moment.js
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

            // Configure compression-webpack-plugin
            new CompressionWebpackPlugin({
                algorithm: 'gzip',
                test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
                threshold: 10240,
                minRatio: 0.8
            }),
            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 5,
                minChunkSize: 100
            })
        ],
        // Enable JS splitting
        optimization: {
            runtimeChunk: 'single',
            splitChunks: {
                chunks: 'all',
                maxInitialRequests: Infinity,
                minSize: 20000,
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name(module) {
                            const packages = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                            if (packages) {
                                const packageName = packages[1]
                                return `npm.${packageName.replace('@', '')}`
                            }
                        }
                    }
                }
            }
        }
    },
    devServer: {
        // Only configure proxy if not running in Electron
        ...(isElectron ? {} : {
            proxy: {
                '/auth': {
                    target: url,
                    ws: true,
                    pathRewrite: {
                        '^/auth': '/auth'
                    }
                },
                '/wordBiz': {
                    target: url,
                    ws: true,
                    pathRewrite: {
                        '^/wordBiz': '/wordBiz'
                    }
                },
                '/ai-biz': {
                    target: url,
                    ws: true,
                    pathRewrite: {
                        '^/ai-biz': '/ai-biz'
                    }
                },
                '/code': {
                    target: url,
                    ws: true,
                    pathRewrite: {
                        '^/code': '/code'
                    }
                },
                '/admin': {
                    target: url,
                    ws: true,
                    pathRewrite: {
                        '^/admin': '/admin'
                    }
                }
            }
        })
    }
}