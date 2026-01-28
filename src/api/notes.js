// filepath: /src/api/notes.js
import request from '@/router/axios'

const BASE = '/api/notes'

// ============ Category APIs ============

export function listCategories() {
    return request({url: `${BASE}/category/list`, method: 'get', headers: {isToken: true}})
}

export function getCategory(id) {
    return request({url: `${BASE}/category/${id}`, method: 'get', headers: {isToken: true}})
}

export function createCategory(body) {
    return request({url: `${BASE}/category`, method: 'post', data: body, headers: {isToken: true}})
}

export function updateCategory(id, body) {
    return request({url: `${BASE}/category/${id}`, method: 'put', data: body, headers: {isToken: true}})
}

export function deleteCategory(id) {
    return request({url: `${BASE}/category/${id}`, method: 'delete', headers: {isToken: true}})
}

// ============ Note Item APIs ============

export function listItems(categoryId) {
    return request({url: `${BASE}/item/list/${categoryId}`, method: 'get', headers: {isToken: true}})
}

export function getItem(id) {
    return request({url: `${BASE}/item/${id}`, method: 'get', headers: {isToken: true}})
}

export function createItem(body) {
    return request({url: `${BASE}/item`, method: 'post', data: body, headers: {isToken: true}})
}

export function updateItem(id, body) {
    return request({url: `${BASE}/item/${id}`, method: 'put', data: body, headers: {isToken: true}})
}

export function deleteItem(id) {
    return request({url: `${BASE}/item/${id}`, method: 'delete', headers: {isToken: true}})
}

// ============ Navigation APIs ============

export function getNextItem(id) {
    return request({url: `${BASE}/item/${id}/next`, method: 'get', headers: {isToken: true}})
}

export function getPreviousItem(id) {
    return request({url: `${BASE}/item/${id}/previous`, method: 'get', headers: {isToken: true}})
}

export function reorderItems(categoryId, itemIds) {
    return request({url: `${BASE}/item/reorder/${categoryId}`, method: 'put', data: itemIds, headers: {isToken: true}})
}

export function moveItemUp(id) {
    return request({url: `${BASE}/item/${id}/move-up`, method: 'put', headers: {isToken: true}})
}

export function moveItemDown(id) {
    return request({url: `${BASE}/item/${id}/move-down`, method: 'put', headers: {isToken: true}})
}

// ============ Audio APIs ============

export function generateAudio(body) {
    // body: { noteItemId, accent?, voice? }
    return request({url: `${BASE}/item/audio/generate`, method: 'post', data: body, headers: {isToken: true}})
}

export function getAudioStreamUrl(itemId) {
    // Returns the URL for audio streaming (to be used with <audio> element)
    return `${BASE}/item/${itemId}/audio/stream`
}

export function deleteAudio(id) {
    return request({url: `${BASE}/item/${id}/audio`, method: 'delete', headers: {isToken: true}})
}

// ============ Image APIs ============

export function getImageStyles() {
    return request({url: `${BASE}/item/image/styles`, method: 'get', headers: {isToken: true}})
}

export function generateImage(body) {
    // body: { noteItemId, style? }
    return request({url: `${BASE}/item/image/generate`, method: 'post', data: body, headers: {isToken: true}})
}

export function getImageStreamUrl(itemId) {
    // Returns the URL for image streaming (to be used with <img> element)
    return `${BASE}/item/${itemId}/image/stream`
}

export function deleteImage(id) {
    return request({url: `${BASE}/item/${id}/image`, method: 'delete', headers: {isToken: true}})
}

// ============ Lock APIs ============

export function getLockStatus() {
    return request({url: `${BASE}/lock/status`, method: 'get', headers: {isToken: true}})
}

export function setPasscode(body) {
    // body: { newPasscode, currentPasscode? (required when changing existing passcode) }
    return request({url: `${BASE}/lock/passcode`, method: 'post', data: body, headers: {isToken: true}})
}

export function removePasscode(currentPasscode) {
    return request({url: `${BASE}/lock/passcode`, method: 'delete', params: { currentPasscode }, headers: {isToken: true}})
}

export function lockNotes() {
    return request({url: `${BASE}/lock`, method: 'post', headers: {isToken: true}})
}

export function unlockNotes(passcode) {
    return request({url: `${BASE}/lock/unlock`, method: 'post', data: { passcode }, headers: {isToken: true}})
}

export default {
    // Categories
    listCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    // Items
    listItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    // Navigation
    getNextItem,
    getPreviousItem,
    reorderItems,
    moveItemUp,
    moveItemDown,
    // Audio
    generateAudio,
    getAudioStreamUrl,
    deleteAudio,
    // Image
    getImageStyles,
    generateImage,
    getImageStreamUrl,
    deleteImage,
    // Lock
    getLockStatus,
    setPasscode,
    removePasscode,
    lockNotes,
    unlockNotes,
}
