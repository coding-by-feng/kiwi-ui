export default {
    title: 'kason English Tools',
    logo: 'kason English Tools',
    key: 'kason-tools',   //配置主键,目前用于存储
    indexTitle: 'kason-tools',
    whiteList: ['/login', '/404', '/401', '/lock'], // 配置无权限可以访问的页面
    whiteTagList: ['/login', '/404', '/401', '/lock'], // 配置不添加tags页面 （'/advanced-router/mutative-detail/*'——*为通配符）
    lockPage: '/lock',
    tokenTime: 6000,
    infoTitle: 'Kason English Tools',
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

    baiduTtsToken: "24.98b84c0d0f6a93e5969634e0c92db2d2.2592000.1667376639.282335-20116041",
}
