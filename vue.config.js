const path = require('path');
const webpack = require('webpack')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const productionGzipExtensions = ['js', 'css']
const url = 'http://kiwi-microservice-local:9991'
// const url = 'http://localhost:9991'
let publicPath = './'

module.exports = {
    publicPath: publicPath,
    lintOnSave: true,
    productionSourceMap: false,
    configureWebpack: {
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@i': path.resolve(__dirname, './src/assets'),
            }
        },
        plugins: [
            // Ignore all locale files of moment.js
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

            // 配置compression-webpack-plugin压缩
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
        // 开启分离 js
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
                            // get the name. E.g. node_modules/packageName/not/this/part.js
                            // or node_modules/packageName
                            console.log(module.context)
                            const packages = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                            if (packages) {
                                console.log('packages-->');
                                console.log(packages)
                                const packageName = packages[1]
                                console.log('packageName-->')
                                console.log(packageName)
                                // npm package names are URL-safe, but some servers don't like @ symbols
                                return `npm.${packageName.replace('@', '')}`
                            }
                        }
                    }
                }
            }
        }
    },
    devServer: {
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
    }
}
