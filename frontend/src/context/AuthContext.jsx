import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    try { return raw ? JSON.parse(raw) : null } catch { return null }
  })

  const signIn = (tokenData) => {
    localStorage.setItem('token', tokenData.access_token)
    localStorage.setItem('user', JSON.stringify(tokenData.user))
    setToken(tokenData.access_token)
    setUser(tokenData.user)
  }

  const signOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  const isStaff = user?.role === 'commandant' || user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ token, user, isStaff, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
