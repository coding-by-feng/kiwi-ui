import * as CryptoJS from 'crypto-js'

export const serialize = data => {
    let list = []
    Object.keys(data).forEach(ele => {
        list.push(`${ele}=${data[ele]}`)
    })
    return list.join('&')
}

/**
 * 生成随机len位数字
 */
export const randomLenNum = (len, date) => {
    let random = ''
    random = Math.ceil(Math.random() * 100000000000000).toString().substr(0, len || 4)
    if (date) random = random + Date.now()
    return random
}

/**
 *加密处理
 */
export const encryption = (params) => {
    let {
        data,
        type,
        param,
        key
    } = params
    const result = JSON.parse(JSON.stringify(data))
    if (type === 'Base64') {
        param.forEach(ele => {
            result[ele] = btoa(result[ele])
        })
    } else {
        param.forEach(ele => {
            var data = result[ele]
            key = CryptoJS.enc.Latin1.parse(key)
            var iv = key
            // 加密
            var encrypted = CryptoJS.AES.encrypt(
                data,
                key, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.ZeroPadding
                })
            result[ele] = encrypted.toString()
        })
    }
    return result
}

export function isObjectValueEqual(a, b) {
    let aProps = Object.getOwnPropertyNames(a)
    let bProps = Object.getOwnPropertyNames(b)

    if (aProps.length != bProps.length) {
        return false
    }

    for (let i = 0; i < aProps.length; i++) {
        let propName = aProps[i]
        let propA = a[propName]
        let propB = b[propName]
        if (propA !== propB) {
            return false
        }
    }
    return true
}

/**
 * JS沙箱
 * 创建一个沙箱环境动态执行JS脚本
 * @example
 * // returns true
 * const param = {
 * 	item:"foo"
 * }
 * const sandbox = util.compileCode("item==='foo'")
 * sandbox(param)
 * @param  {String} src 源代码
 * @return {Function} 代码执行环境
 */
export function compileCode(src) {
    src = 'with (sandbox) {return ' + src + '}'
    const code = new Function('sandbox', src)

    function has(target, key) {
        return true
    }

    function get(target, key) {
        if (key === Symbol.unscopables) return undefined
        return target[key]
    }

    return function (sandbox = {}) {
        if (!sandboxProxies.has(sandbox)) {
            const sandboxProxy = new Proxy(sandbox, {has, get})
            sandboxProxies.set(sandbox, sandboxProxy)
        }
        return code(sandboxProxies.get(sandbox))
    }
}

export function isMobile() {
    return navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)
}

export function isEmptyStr(obj) {
    return obj === undefined || obj === null || obj.trim() === ''
}

export function isNotEmptyStr(obj) {
    return !isEmptyStr(obj)
}

export function convertWord(word) {
    if (!isEmptyStr(word)) {
        return word.replaceAll('/', ')(');
    }
    return word;
}

export function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

export function removeBlankLines(str) {
    return str.replaceAll(/(\n[\s\t]*\r*\n)/g, '\n').replaceAll(/^[\n\r\n\t]*|[\n\r\n\t]*$/g, '')
}

export function mergeAndFilter(arr1, arr2) {
    let mergedArray = arr1.concat(arr2);

    return mergedArray.filter((item, index) => {
        return mergedArray.indexOf(item) === index;
    });
}

export default {
    isObjectValueEqual,
    isMobile,
    isEmptyStr,
    convertWord,
    sleep,
    mergeAndFilter
}

