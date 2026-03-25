import client from './client'

export const login = (email, password) =>
  client.post('/login', { email, password }).then((r) => r.data)

export const register = (data) =>
  client.post('/register', data).then((r) => r.data)
