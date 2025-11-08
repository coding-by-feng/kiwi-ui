import kiwiConst from '@/const/kiwiConsts'
import kiwiConsts from '@/const/kiwiConsts'

/**
 * 打开数据库
 * @param {object} dbName 数据库的名字
 * @param {string} storeName 仓库名称
 * @param {string} version 数据库的版本
 * @return {object} 该函数会返回一个数据库实例
 */
export function openDB(dbName, version = 1) {
    return new Promise((resolve, reject) => {
        //  兼容浏览器
        let indexedDB =
            window.indexedDB ||
            window.mozIndexedDB ||
            window.webkitIndexedDB ||
            window.msIndexedDB;
        let db;
        // 打开数据库，若没有则会创建
        const request = indexedDB.open(dbName, version);
        // 数据库打开成功回调
        request.onsuccess = function (event) {
            db = event.target.result; // 数据库对象
            console.log("数据库打开成功");
            resolve(db);
        };
        // 数据库打开失败的回调
        request.onerror = function (event) {
            console.log("数据库打开报错");
        };
        // 数据库有更新时候的回调
        request.onupgradeneeded = function (event) {
            // 数据库创建或升级的时候会触发
            console.log("onupgradeneeded");
            db = event.target.result; // 数据库对象
            var objectStore;
            // 创建存储库
            objectStore = db.createObjectStore(kiwiConst.DB_STORE_NAME, {
                keyPath: "sequenceKey" // 这是主键
            });
            // 创建索引，在后面查询数据的时候可以根据索引查
            objectStore.createIndex("sequenceKey", "sequenceKey", {unique: true});
        };
    });
}

export function cleanDbData(dbName, version = 1, storeName) {
    return new Promise((resolve, reject) => {
        // 打开 IndexedDB 数据库
        let request = window.indexedDB.open(dbName, version)

        request.onerror = function (event) {
            console.log("Database error: " + event.target.errorCode)
            reject()
        };

        request.onsuccess = function (event) {
            let db = event.target.result;

            // 检查指定的仓库是否存在
            if (db.objectStoreNames.contains(storeName)) {
                // 开启一个读写事务
                var transaction = db.transaction([storeName], "readwrite")

                // 删除指定的仓库
                transaction.objectStore(storeName).clear()

                console.log("Object store cleared.")
                resolve()
            } else {
                console.log("Object store not found.")
                resolve()
            }
        };
    });
}

/**
 * 新增数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {string} data 数据
 */
export function addData(db, storeName, data) {
    return new Promise((resolve, reject) => {
        let request = db
            .transaction([storeName], "readwrite") // 事务对象 指定表格名称和操作模式（"只读"或"读写"）
            .objectStore(storeName) // 仓库对象
            .add(data);

        request.onsuccess = function (event) {
            console.log("数据写入成功");
            resolve(kiwiConst.SUCCESS)
        };

        request.onerror = function (event) {
            console.log("数据写入失败");
            reject(kiwiConst.FAIL);
        };
    });
}

/**
 * 通过主键读取数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {string} key 主键值
 */
export function getDataByKey(db, storeName, key) {
    return new Promise((resolve, reject) => {
        let transaction = db.transaction([storeName]); // 事务
        let objectStore = transaction.objectStore(storeName); // 仓库对象
        let request = objectStore.get(key); // 通过主键获取数据

        request.onerror = function (event) {
            console.log("事务失败");
        };

        request.onsuccess = function (event) {
            console.log("主键查询结果: ", request.result);
            resolve(request.result);
        };
    });
}

/**
 * 通过游标读取数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 */
export function cursorGetData(db, storeName) {
    return new Promise((resolve, reject) => {
        let store = db
            .transaction([storeName]) // 事务
            .objectStore(storeName) // 仓库对象
        let request = store.openCursor() // 指针对象

        request.onerror = function (event) {
            console.log("游标读取失败")
            reject(event)
        };

        let allData = 0
        request.onsuccess = function (event) {
            // 游标开启成功，逐行读数据
            let cursor = event.target.result
            if (cursor) {
                // 必须要检查
                console.log(cursor.value)
                ++allData
                cursor.continue()
            } else {
                resolve(allData)
            }
        };
    })
}

export function buildDataKey(url, urlsKey) {
    let keyPrefix = url.replaceAll(`${kiwiConsts.API_BASE.WORD_BIZ}/review/downloadReviewAudio`, 'RA')
        .replaceAll(`${kiwiConsts.API_BASE.WORD_BIZ}/pronunciation/downloadVoice`, 'PA')
        .replaceAll(`${kiwiConsts.API_BASE.WORD_BIZ}/review/character/downloadReviewAudio`, 'CA');
    if (urlsKey) {
        return keyPrefix + '_' + urlsKey;
    }
    return keyPrefix;
}

export default {
    openDB,
    cleanDbData,
    addData,
    getDataByKey,
    buildDataKey,
    cursorGetData
}