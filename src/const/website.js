export default {
    title: 'kiwi-vocabulary',
    logo: 'kiwi-vocabulary',
    key: 'kiwi-vocabulary',   //配置主键,目前用于存储
    indexTitle: 'kiwi-vocabulary',
    whiteList: ['/login', '/404', '/401', '/lock'], // 配置无权限可以访问的页面
    whiteTagList: ['/login', '/404', '/401', '/lock'], // 配置不添加tags页面 （'/advanced-router/mutative-detail/*'——*为通配符）
    lockPage: '/lock',
    tokenTime: 6000,
    infoTitle: 'kiwi-vocabulary',
    statusWhiteList: [428],
    // 配置首页不可关闭
    isFirstPage: false,
    fistPage: {
        label: '首页',
        value: '/wordQueryIndex',
        params: {},
        query: {},
        group: [],
        close: false
    },
    // 配置菜单的属性
    menu: {
        props: {
            label: 'label',
            path: 'path',
            icon: 'icon',
            children: 'children'
        }
    },

    noAuthPath: {
        detail: '/index/vocabulary/detail'
    },

    auth: {
        login: '/index/vocabulary/detail?active=login',
        path: [
            '/index/vocabulary/detail?active=starList'
        ]
    },

    baiduTtsToken: "24.1464c329f0bba04ea149e2dc1dcdebf0.2592000.1658851309.282335-26553439",
    voicerssToken_163: "02df0a8f48b641548ec4224c24ebff0e",
    voicerssToken_132: "0e3c0a35570543249f743f74c027ef8b"
}
