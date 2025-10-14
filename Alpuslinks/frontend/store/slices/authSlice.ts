import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiService } from '@/lib/api'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'publisher' | 'advertiser' | 'admin' | 'super admin' | 'supportor'
  avatar?: string
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'publisher' | 'advertiser'
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
}

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.login(email, password)
      if (response.data) {
        const data = response.data as any
        
        // Check if 2FA is required
        if (data.requires2FA) {
          return rejectWithValue('2FA_REQUIRED')
        }
        
        // Normal login success
        const { token, user } = data
        localStorage.setItem('auth_token', token)
        return { user, token }
      }
      throw new Error('Login failed')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData & { verificationCode?: string }, { rejectWithValue }) => {
    try {
      // First, get available roles to find the correct role ID
      const rolesResponse = await apiService.getRoles()
      if (!rolesResponse.data) {
        throw new Error('Failed to fetch roles')
      }
      
      const rolesData = rolesResponse.data as any
      const selectedRole = rolesData.roles.find((role: any) => 
        role.name.toLowerCase() === userData.role.toLowerCase()
      )
      
      if (!selectedRole) {
        throw new Error(`Selected role '${userData.role}' not found`)
      }
      
      const response = await apiService.register({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        role: selectedRole._id,
        verificationCode: userData.verificationCode
      })
      
      if (response.data) {
        const { token, user } = response.data as any
        localStorage.setItem('auth_token', token)
        return { user, token }
      }
      throw new Error('Registration failed')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed')
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getCurrentUser()
      if (response.data) {
        const userData = (response.data as any)?.user
        return userData
      }
      throw new Error('Failed to get user data')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get user data')
    }
  }
)

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (googleToken: string, { rejectWithValue }) => {
    try {
      const response = await apiService.googleLogin(googleToken)
      if (response.data) {
        const { token, user } = response.data as any
        localStorage.setItem('auth_token', token)
        return { user, token }
      }
      throw new Error('Google login failed')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Google login failed')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout()
      localStorage.removeItem('auth_token')
      return true
    } catch (error: any) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem('auth_token')
      return true
    }
  }
)

export const switchUserRole = createAsyncThunk(
  'auth/switchRole',
  async (targetRole: 'publisher' | 'advertiser', { rejectWithValue }) => {
    try {
      const response = await apiService.switchRole(targetRole)
      if (response.data) {
        const { token, user } = response.data as any
        localStorage.setItem('auth_token', token)
        return { user, token }
      }
      throw new Error('Role switch failed')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Role switch failed')
    }
  }
)

export const sendTwoFactorCode = createAsyncThunk(
  'auth/sendTwoFactorCode',
  async ({ email, purpose }: { email: string; purpose?: 'login' | 'register' | 'password_reset' }, { rejectWithValue }) => {
    try {
      const response = await apiService.sendTwoFactorCode(email, purpose || 'login')
      if (response.data) {
        return response.data
      }
      throw new Error('Failed to send verification code')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send verification code')
    }
  }
)

export const verifyTwoFactorCode = createAsyncThunk(
  'auth/verifyTwoFactorCode',
  async ({ email, code, purpose }: { email: string; code: string; purpose?: 'login' | 'register' | 'password_reset' }, { rejectWithValue }) => {
    try {
      const response = await apiService.verifyTwoFactorCode(email, code, purpose || 'login')
      if (response.data) {
        const { token, user } = response.data as any
        if (token) {
          localStorage.setItem('auth_token', token)
        }
        return { user, token, verified: true }
      }
      throw new Error('Verification failed')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Verification failed')
    }
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.refreshToken()
      if (response.data) {
        const { token, user } = response.data as any
        localStorage.setItem('auth_token', token)
        return { user, token }
      }
      throw new Error('Token refresh failed')
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    clearUser: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = {
          id: action.payload.id,
          firstName: action.payload.firstName,
          lastName: action.payload.lastName,
          email: action.payload.email,
          role: action.payload.role?.name || action.payload.role || 'admin',
          avatar: action.payload.avatar,
        }
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false
        state.user = null
        state.isAuthenticated = false
        state.error = action.payload as string
        
        // Clear token if authentication fails
        localStorage.removeItem('auth_token')
        
        // If it's a token expiration error, don't show error message
        const errorMessage = action.payload as string
        if (errorMessage.includes('expired') || errorMessage.includes('Token has expired') || errorMessage.includes('Invalid token')) {
          state.error = null
        }
        
        console.log('getCurrentUser rejected:', errorMessage)
      })

    // Google login
    builder
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = null
      })

    // Switch Role
    builder
      .addCase(switchUserRole.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(switchUserRole.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = {
          id: action.payload.user.id,
          firstName: action.payload.user.firstName,
          lastName: action.payload.user.lastName,
          email: action.payload.user.email,
          role: action.payload.user.role?.name || action.payload.user.role || 'publisher',
          avatar: action.payload.user.avatar,
        }
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(switchUserRole.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Send 2FA Code
    builder
      .addCase(sendTwoFactorCode.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(sendTwoFactorCode.fulfilled, (state) => {
        state.isLoading = false
        state.error = null
      })
      .addCase(sendTwoFactorCode.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Verify 2FA Code
    builder
      .addCase(verifyTwoFactorCode.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(verifyTwoFactorCode.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload.user && action.payload.token) {
          state.user = action.payload.user
          state.isAuthenticated = true
        }
        state.error = null
      })
      .addCase(verifyTwoFactorCode.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Refresh Token
    builder
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false
        state.user = null
        state.isAuthenticated = false
        state.error = action.payload as string
        localStorage.removeItem('auth_token')
      })
  },
})

export const { clearError, setUser, clearUser } = authSlice.actions
export default authSlice.reducer
