export function readFile(filePath) {
    // 创建一个新的xhr对象
    let xhr
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest()
    } else {
        // eslint-disable-next-line
        xhr = new ActiveXObject('Microsoft.XMLHTTP')
    }
    const okStatus = document.location.protocol === 'file' ? 0 : 200
    xhr.open('GET', filePath, false)
    xhr.overrideMimeType('text/html;charset=utf-8')
    xhr.send(null)
    return xhr.status === okStatus ? xhr.responseText : null
}

/**
 * @function escapeHTML 转义html脚本 < > & " '
 * @param a -
 *            字符串
 */
export function escapeHTML(a) {
    a = "" + a
    return a.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

/**
 * @function unescapeHTML 还原html脚本 < > & " '
 * @param a -
 *            字符串
 */
export function unescapeHTML(a) {
    a = "" + a
    return a.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
}

export default {
    readFile
}