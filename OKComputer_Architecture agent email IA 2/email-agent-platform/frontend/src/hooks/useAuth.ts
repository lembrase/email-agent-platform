import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'

import { authService } from '../services/auth.service'
import { User } from '../types/user'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(true)

  // Fetch current user
  const { data: user } = useQuery(
    'currentUser',
    () => authService.getCurrentUser(),
    {
      enabled: !!localStorage.getItem('accessToken'),
      retry: false,
      onError: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      },
      onSettled: () => {
        setIsLoading(false)
      },
    }
  )

  // Login mutation
  const loginMutation = useMutation(
    (credentials: { email: string; password: string }) =>
      authService.login(credentials.email, credentials.password),
    {
      onSuccess: (data) => {
        localStorage.setItem('accessToken', data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.tokens.refreshToken)
        queryClient.setQueryData('currentUser', data.user)
        toast.success('Login successful!')
        navigate('/dashboard')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Login failed')
      },
    }
  )

  // Register mutation
  const registerMutation = useMutation(
    (data: RegisterData) => authService.register(data),
    {
      onSuccess: (data) => {
        localStorage.setItem('accessToken', data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.tokens.refreshToken)
        queryClient.setQueryData('currentUser', data.user)
        toast.success('Registration successful!')
        navigate('/dashboard')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Registration failed')
      },
    }
  )

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password })
  }

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    queryClient.clear()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}