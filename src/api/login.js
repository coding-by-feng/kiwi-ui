import request from '@/router/axios'
import {getStore} from '@/util/store'
import kiwiConsts from '@/const/kiwiConsts'

const scope = 'server'

export const loginByUsername = (username, password, code, randomStr) => {
    const grant_type = 'password'
    let encodedPassword = encodeURI(password);
    console.log('encodedPassword ' + encodedPassword)

    return request({
        url: `${kiwiConsts.API_BASE.AUTH}/token`,
        headers: {
            isToken: false,
            'Authorization': 'Basic dm9jYWJ1bGFyeTplbmhhbmNlcg=='
        },
        method: 'post',
        params: {
            username, password, randomStr, code, grant_type, scope
        }
    })
}

export const refreshToken = () => {
    const grant_type = 'refresh_token'
    let refreshToken = getStore({name: 'refresh_token'})
    return request({
        url: `${kiwiConsts.API_BASE.AUTH}/token`,
        headers: {
            'isToken': false,
            'Authorization': 'Basic dm9jYWJ1bGFyeTplbmhhbmNlcg=='
        },
        method: 'post',
        params: {refresh_token: refreshToken, grant_type: grant_type, scope: scope}
    })
}

export const logout = $ => {
    return request({
        url: `${kiwiConsts.API_BASE.AUTH}/logout`,
        headers: {
            isToken: true
        },
        method: 'delete'
    })
}
