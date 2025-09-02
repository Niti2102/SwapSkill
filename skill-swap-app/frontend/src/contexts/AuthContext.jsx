import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Configure axios defaults
  axios.defaults.baseURL = 'http://localhost:8000'

  // Add token to requests if it exists
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [])

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      
      if (token) {
        try {
          const response = await axios.get('/api/auth/profile')
          setUser(response.data)
        } catch (error) {
          localStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
          
          // Show a toast if the token was invalid
          if (error.response?.status === 401) {
            toast.error('Session expired. Please log in again.')
          }
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      
      toast.success('Login successful!')
      return true
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
      return false
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData)
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      
      toast.success('Registration successful!')
      return true
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/users/profile', profileData)
      setUser(response.data)
      toast.success('Profile updated successfully!')
      return true
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profile update failed')
      return false
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}


