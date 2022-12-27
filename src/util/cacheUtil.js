import kiwiConst from '@/const/kiwiConsts'
import {getStore, setStore} from './store'

export function put(key, value) {
    setStore({
        name: key,
        content: value,
        type: kiwiConst.STORE_TYPE.LOCAL
    })
}

export function get(key) {
    return getStore({name: key})
}

export function buildReviewAudioKey(sourceId, type) {
    return `audio_${sourceId}_${type}`
}

export default {
    put,
    get,
    buildReviewAudioKey
}