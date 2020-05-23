import {getStore, setStore} from "@/util/store";
import {loginByUsername} from "@/api/login";
import {encryption} from "@/util/util";


const user = {
    store: {
        userInfo: {},
        permissions: {},
        roles: [],
        menu: getStore({
            name: 'menu'
        }) || [],
        menuAll: [],
        expires_in: getStore({
            name: 'expires_in'
        }) || '',
        access_token: getStore({
            name: 'access_token'
        }) || '',
        refresh_token: getStore({
            name: 'refresh_token'
        }) || ''
    },
    actions: {
        LoginByUsername({commit}, userInfo) {
            const user = encryption({
                data: userInfo,
                key: 'thanks,pig4cloud',
                param: ['password']
            });
            return new Promise((resolve, reject) => {
                loginByUsername(user.username, user.password, user.code, user.randomStr).then(response => {
                    const data = response.data
                    commit('setAccessToken', data.access_token)
                    commit('setRefreshToken', data.refresh_token)
                    commit('setExpiresIn', data.expires_in)
                    commit('clearLock')
                    resolve()
                }).catch(error => {
                    reject(error)
                })
            });

        }
    },

    mutations: {
        setAccessToken: (state, access_token) => {
            state.access_token = access_token;
            setStore({
                name: 'access_token',
                content: state.access_token,
                type: 'session'
            });
        },
        setRefreshToken: (state, refresh_token) => {
            state.refresh_token = refresh_token;
            setStore({
                name: 'refresh_token',
                content: state.refresh_token,
                type: 'session'
            })
        },
        setExpiresIn:(state, expires_in) => {
            state.expires_in = expires_in;
            setStore({
                name: 'expires_in',
                content: state.expires_in,
                type: 'session'
            })
        },

    }
}
export default user