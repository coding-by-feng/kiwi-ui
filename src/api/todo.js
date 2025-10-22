// filepath: /src/api/todo.js
import request from '@/router/axios'

const BASE = '/tools/todo'

// Tasks
export function listTasks(params = {}) {
    return request({url: `${BASE}/tasks`, method: 'get', params, headers: {isToken: true}})
}

export function createTask(body, {idempotencyKey} = {}) {
    const headers = {isToken: true}
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
    return request({url: `${BASE}/tasks`, method: 'post', data: body, headers})
}

export function getTask(id) {
    return request({url: `${BASE}/tasks/${id}`, method: 'get', headers: {isToken: true}})
}

export function updateTask(id, patch, {ifMatch} = {}) {
    const headers = {isToken: true}
    if (ifMatch) headers['If-Match'] = ifMatch
    return request({url: `${BASE}/tasks/${id}`, method: 'patch', data: patch, headers})
}

export function deleteTask(id) {
    return request({url: `${BASE}/tasks/${id}`, method: 'delete', headers: {isToken: true}})
}

export function completeTask(id, status, {idempotencyKey} = {}) {
    const headers = {isToken: true}
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
    return request({url: `${BASE}/tasks/${id}/complete`, method: 'post', data: {status}, headers})
}

export function resetTaskStatus(id) {
    return request({url: `${BASE}/tasks/${id}/reset-status`, method: 'post', headers: {isToken: true}})
}

export function resetAllTaskStatuses() {
    return request({url: `${BASE}/tasks/reset-statuses`, method: 'post', headers: {isToken: true}})
}

export function demoSeed() {
    return request({url: `${BASE}/tasks/demo`, method: 'post', headers: {isToken: true}})
}

// Trash
export function listTrash(params = {}) {
    return request({url: `${BASE}/trash`, method: 'get', params, headers: {isToken: true}})
}

export function clearTrash() {
    return request({url: `${BASE}/trash`, method: 'delete', headers: {isToken: true}})
}

export function deleteTrashItem(id) {
    return request({url: `${BASE}/trash/${id}`, method: 'delete', headers: {isToken: true}})
}

export function restoreTrashItem(id) {
    return request({url: `${BASE}/trash/${id}/restore`, method: 'post', headers: {isToken: true}})
}

// History
export function getHistory(date, params = {}) {
    return request({url: `${BASE}/history`, method: 'get', params: {date, ...params}, headers: {isToken: true}})
}

export function deleteHistory(id) {
    return request({url: `${BASE}/history/${id}`, method: 'delete', headers: {isToken: true}})
}

// Analytics
export function getAnalyticsMonthly(months = 6) {
    return request({url: `${BASE}/analytics/monthly`, method: 'get', params: {months}, headers: {isToken: true}})
}

export function getAnalyticsSummary(month /* YYYY-MM */) {
    return request({url: `${BASE}/analytics/summary`, method: 'get', params: {month}, headers: {isToken: true}})
}

// Ranking
export function getRankingCurrent() {
    return request({url: `${BASE}/ranking/current`, method: 'get', headers: {isToken: true}})
}

export function getRankingDefinitions() {
    return request({url: `${BASE}/ranking/ranks`, method: 'get', headers: {isToken: true}})
}

export default {
    listTasks,
    createTask,
    getTask,
    updateTask,
    deleteTask,
    completeTask,
    resetTaskStatus,
    resetAllTaskStatuses,
    demoSeed,
    listTrash,
    clearTrash,
    deleteTrashItem,
    restoreTrashItem,
    getHistory,
    deleteHistory,
    getAnalyticsMonthly,
    getAnalyticsSummary,
    getRankingCurrent,
    getRankingDefinitions,
}
