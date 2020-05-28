const url = 'http://kiwi-microservice-local:9991'
// const url = 'http://localhost:9991'
let publicPath = './'

module.exports = {
    publicPath: publicPath,
    lintOnSave: true,
    productionSourceMap: false,
    chainWebpack: config => {
        const entry = config.entry('app')
        entry
            .add('babel-polyfill')
            .end()
        entry
            .add('classlist-polyfill')
            .end()
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
            '/code': {
                target: url,
                ws: true,
                pathRewrite: {
                    '^/code': '/code'
                }
            }
        }
    }
}
