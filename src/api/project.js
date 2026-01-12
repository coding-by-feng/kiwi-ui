// filepath: /src/api/project.js
import request from '@/router/axios'

const BASE = '/api/tools/project'

// Project Management
export function listProjects(params = {}) {
    return request({url: `${BASE}/projects`, method: 'get', params, headers: {isToken: true}})
}

export function getProject(id) {
    return request({url: `${BASE}/projects/${id}`, method: 'get', headers: {isToken: true}})
}

export function createProject(data) {
    return request({url: `${BASE}/projects`, method: 'post', data, headers: {isToken: true}})
}

export function updateProject(id, data) {
    return request({url: `${BASE}/projects/${id}`, method: 'put', data, headers: {isToken: true}})
}

export function patchProject(id, data) {
    return request({url: `${BASE}/projects/${id}`, method: 'patch', data, headers: {isToken: true}})
}

export function updateProjectStages(id, stages) {
    return request({url: `${BASE}/projects/${id}/stages`, method: 'patch', data: stages, headers: {isToken: true}})
}

export function archiveProject(id, archived = true) {
    return request({url: `${BASE}/projects/${id}/archive`, method: 'post', data: {archived}, headers: {isToken: true}})
}

export function deleteProject(id) {
    return request({url: `${BASE}/projects/${id}`, method: 'delete', headers: {isToken: true}})
}

// Project Photos
export function uploadPhoto(projectId, file) {
    const formData = new FormData()
    formData.append('file', file)
    return request({
        url: `${BASE}/projects/${projectId}/photo`,
        method: 'post',
        data: formData,
        headers: {isToken: true, 'Content-Type': 'multipart/form-data'}
    })
}

export function listPhotos(projectId) {
    return request({url: `${BASE}/projects/${projectId}/photos`, method: 'get', headers: {isToken: true}})
}

export function getPhotoUrl(projectId, token) {
    return `${BASE}/projects/${projectId}/photo/${token}`
}

export function deletePhotoById(projectId, photoId) {
    return request({url: `${BASE}/projects/${projectId}/photos/${photoId}`, method: 'delete', headers: {isToken: true}})
}

export function deletePhotoByToken(projectId, token) {
    return request({url: `${BASE}/projects/${projectId}/photo/${token}`, method: 'delete', headers: {isToken: true}})
}

export function deleteAllPhotos(projectId) {
    return request({url: `${BASE}/projects/${projectId}/photos`, method: 'delete', headers: {isToken: true}})
}

export default {
    listProjects,
    getProject,
    createProject,
    updateProject,
    patchProject,
    updateProjectStages,
    archiveProject,
    deleteProject,
    uploadPhoto,
    listPhotos,
    getPhotoUrl,
    deletePhotoById,
    deletePhotoByToken,
    deleteAllPhotos,
}
