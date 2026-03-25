import client from './client'

export const getRooms = () => client.get('/rooms').then((r) => r.data)
export const getRoom = (id) => client.get(`/rooms/${id}`).then((r) => r.data)
export const createFloor = (data) => client.post('/floors', data).then((r) => r.data)
export const createRoom = (data) => client.post('/rooms', data).then((r) => r.data)
export const assignRoom = (data) => client.post('/rooms/assign', data).then((r) => r.data)
export const evictRoom = (data) => client.post('/rooms/evict', data).then((r) => r.data)
export const getFloorStats = (floorId) =>
  client.get(`/floors/${floorId}/stats`).then((r) => r.data)
