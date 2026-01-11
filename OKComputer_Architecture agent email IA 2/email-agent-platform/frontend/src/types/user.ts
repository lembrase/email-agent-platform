export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: 'admin' | 'manager' | 'user' | 'viewer'
  isActive: boolean
  emailVerified: boolean
  mfaEnabled: boolean
  organization?: Organization
  organizationId?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface Organization {
  id: string
  name: string
  domain?: string
  plan: 'basic' | 'pro' | 'enterprise'
  maxUsers: number
  maxStorageGb: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  user: User
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}