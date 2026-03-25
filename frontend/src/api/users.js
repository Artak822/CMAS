import client from './client'

export const getUsers = () => client.get('/users').then((r) => r.data)
export const getUser = (id) => client.get(`/users/${id}`).then((r) => r.data)
export const getProfile = (id) => client.get(`/profile/${id}`).then((r) => r.data)
