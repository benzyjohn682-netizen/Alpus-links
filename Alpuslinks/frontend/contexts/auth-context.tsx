"use client"

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  getCurrentUser, 
  googleLogin,
  switchUserRole,
  sendTwoFactorCode,
  verifyTwoFactorCode,
  clearError 
} from '@/store/slices/authSlice'
import toast from 'react-hot-toast'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'publisher' | 'advertiser' | 'admin' | 'super admin' | 'supportor'
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
  googleSignIn: (token: string) => Promise<boolean>
  switchRole: (targetRole: 'publisher' | 'advertiser') => Promise<boolean>
  sendTwoFactorCode: (email: string, purpose?: 'login' | 'register' | 'password_reset') => Promise<boolean>
  verifyTwoFactorCode: (email: string, code: string, purpose?: 'login' | 'register' | 'password_reset') => Promise<boolean>
  error: string | null
  clearAuthError: () => void
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'publisher' | 'advertiser'
  verificationCode?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user, isLoading, isAuthenticated, error } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Wait for Redux Persist to rehydrate before checking auth
    const checkAuthAfterRehydration = () => {
      // Small delay to ensure Redux Persist has completed
      setTimeout(() => {
        checkAuth()
      }, 100)
    }
    
    // Listen for Redux Persist rehydration
    const handleRehydration = () => {
      checkAuthAfterRehydration()
    }
    
    // Check if we're in the browser and if Redux Persist has rehydrated
    if (typeof window !== 'undefined') {
      // Check if persistor has already rehydrated
      if ((window as any).__REDUX_PERSIST_STATE__) {
        checkAuthAfterRehydration()
      } else {
        // Listen for rehydration event
        window.addEventListener('redux-persist-rehydrated', handleRehydration)
      }
    } else {
      // Server-side, just check auth
      checkAuth()
    }
    
    // Listen for token expiration events
    const handleTokenExpired = (event: CustomEvent) => {
      console.log('Token expired event received:', event.detail)
      dispatch(logoutUser())
      router.push('/')
      toast.error('Your session has expired. Please log in again.')
    }
    
    window.addEventListener('tokenExpired', handleTokenExpired as EventListener)
    
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired as EventListener)
      if (typeof window !== 'undefined') {
        window.removeEventListener('redux-persist-rehydrated', handleRehydration)
      }
    }
  }, [dispatch, router])

  // Additional useEffect to handle Redux state changes
  useEffect(() => {
    // If we have a token but no user, try to fetch user data
    const token = localStorage.getItem('auth_token')
    if (token && !user && !isLoading) {
      console.log('Token exists but no user data, fetching user')
      dispatch(getCurrentUser())
    }
    
    // If we have user data but no token, clear the state
    if (!token && user) {
      console.log('No token but user data exists, clearing state')
      dispatch(logoutUser())
    }
  }, [user, isLoading, dispatch])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      console.log('Checking auth with token:', token ? 'exists' : 'missing')
      console.log('Current Redux auth state:', { user: !!user, isAuthenticated, isLoading })
      
      if (token) {
        // Check if token is expired before making the request
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const currentTime = Date.now() / 1000
          const isExpired = payload.exp < currentTime
          
          if (isExpired) {
            console.log('Token is expired, clearing auth state')
            localStorage.removeItem('auth_token')
            dispatch(logoutUser())
            return
          }
        } catch (error) {
          console.log('Invalid token format, clearing auth state')
          localStorage.removeItem('auth_token')
          dispatch(logoutUser())
          return
        }
        
        // If we already have user data in Redux state, don't fetch again
        if (user && isAuthenticated) {
          console.log('User already authenticated in Redux state')
          return
        }
        
        console.log('Token is valid, fetching current user')
        dispatch(getCurrentUser())
      } else {
        console.log('No token found, user not authenticated')
        // Clear any existing auth state if no token
        if (isAuthenticated || user) {
          console.log('Clearing auth state due to missing token')
          dispatch(logoutUser())
        }
      }
    } catch (error) {
      console.error('Error in checkAuth:', error)
      // Clear auth state on error
      localStorage.removeItem('auth_token')
      dispatch(logoutUser())
    }
  }

  const refreshUser = async () => {
    dispatch(getCurrentUser())
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await dispatch(loginUser({ email, password }))
      
      if (loginUser.fulfilled.match(result)) {
        const user = result.payload.user
        
        // Redirect by role
        const roleName = (user.role?.name || user.role || '').toLowerCase()
        if (roleName === 'super admin' || roleName === 'admin') {
          router.push('/alpus-admin/dashboard')
        } else if (roleName === 'publisher') {
          router.push('/publisher/dashboard')
        } else if (roleName === 'advertiser') {
          router.push('/advertiser/dashboard')
        } else if (roleName === 'supportor') {
          router.push('/supportor/account')
        } else {
          router.push('/')
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const result = await dispatch(registerUser(userData))
      
      if (registerUser.fulfilled.match(result)) {
        const user = result.payload.user
        
        // Redirect by role
        const roleName = (user.role?.name || userData.role || '').toLowerCase()
        if (roleName === 'super admin' || roleName === 'admin') {
          router.push('/alpus-admin/dashboard')
        } else if (roleName === 'publisher') {
          router.push('/publisher/dashboard')
        } else if (roleName === 'advertiser') {
          router.push('/advertiser/dashboard')
        } else if (roleName === 'supportor') {
          router.push('/supportor/account')
        } else {
          router.push('/')
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Registration failed:', error)
      return false
    }
  }

  const googleSignIn = async (token: string): Promise<boolean> => {
    try {
      const result = await dispatch(googleLogin(token))
      
      if (googleLogin.fulfilled.match(result)) {
        const user = result.payload.user
        
        // Redirect by role
        const roleName = (user.role?.name || user.role || '').toLowerCase()
        if (roleName === 'super admin' || roleName === 'admin') {
          router.push('/alpus-admin/dashboard')
        } else if (roleName === 'publisher') {
          router.push('/publisher/dashboard')
        } else if (roleName === 'advertiser') {
          router.push('/advertiser/dashboard')
        } else if (roleName === 'supportor') {
          router.push('/supportor/account')
        } else {
          router.push('/')
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Google login failed:', error)
      return false
    }
  }

  const logout = () => {
    dispatch(logoutUser())
    router.push('/')
    toast.success('Signed out successfully')
  }

  const switchRole = async (targetRole: 'publisher' | 'advertiser'): Promise<boolean> => {
    try {
      const result = await dispatch(switchUserRole(targetRole))
      
      if (switchUserRole.fulfilled.match(result)) {
        const user = result.payload.user
        
        // Redirect by new role
        const roleName = (user.role?.name || user.role || '').toLowerCase()
        if (roleName === 'publisher') {
          router.push('/publisher/dashboard')
        } else if (roleName === 'advertiser') {
          router.push('/advertiser/dashboard')
        } else {
          router.push('/')
        }
        
        toast.success(`Role switched to ${targetRole} successfully`)
        return true
      }
      return false
    } catch (error) {
      console.error('Role switch failed:', error)
      toast.error('Failed to switch role')
      return false
    }
  }

  const sendTwoFactorCodeHandler = async (email: string, purpose: 'login' | 'register' | 'password_reset' = 'login'): Promise<boolean> => {
    try {
      const result = await dispatch(sendTwoFactorCode({ email, purpose }))
      return sendTwoFactorCode.fulfilled.match(result)
    } catch (error) {
      console.error('Send 2FA code failed:', error)
      return false
    }
  }

  const verifyTwoFactorCodeHandler = async (email: string, code: string, purpose: 'login' | 'register' | 'password_reset' = 'login'): Promise<boolean> => {
    try {
      const result = await dispatch(verifyTwoFactorCode({ email, code, purpose }))
      
      if (verifyTwoFactorCode.fulfilled.match(result)) {
        const user = result.payload.user
        
        if (user) {
          // Redirect by role
          const roleName = (user.role?.name || user.role || '').toLowerCase()
          if (roleName === 'super admin' || roleName === 'admin') {
            router.push('/alpus-admin/dashboard')
          } else if (roleName === 'publisher') {
            router.push('/publisher/dashboard')
          } else if (roleName === 'advertiser') {
            router.push('/advertiser/dashboard')
          } else if (roleName === 'supportor') {
            router.push('/supportor/account')
          } else {
            router.push('/')
          }
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Verify 2FA code failed:', error)
      return false
    }
  }

  const clearAuthError = () => {
    dispatch(clearError())
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      isAuthenticated,
      refreshUser,
      googleSignIn,
      switchRole,
      sendTwoFactorCode: sendTwoFactorCodeHandler,
      verifyTwoFactorCode: verifyTwoFactorCodeHandler,
      error,
      clearAuthError
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
