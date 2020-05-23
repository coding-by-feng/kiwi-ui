import router from './router/router'
import {getStore} from '@/util/store'

router.beforeEach(((to, from, next) => {
    let accessToken = getStore({
        name: 'access_token'
    });
    console.log('to.path=' + to.path + ', from.path=' + from.path + ', accessToken=' + accessToken)
    next()
    // if (accessToken) {
    //     next();
    // } else {
    //     if (to.path != '/login') {
    //         if (to.path == '/index' || to.path == '/wordDetail' || to.path == '/wordStarList') {
    //             next();
    //         } else {
    //             next('/login');
    //         }
    //     } else {
    //         next();
    //     }
    // }
}));

// Router.beforeEach((to, from, next) => {
//     if (to.matched.length > 0) {
//         console.log('exist to.path = ' + to.path)
//         console.log('exist from.path = ' + from.path)
//         next();
//     } else {
//         console.log(" this route does not exist to.path=" + to.path + ", from.path=" + from.path)
//         next(new Error(" this route does not exist"));
//     }
// });
