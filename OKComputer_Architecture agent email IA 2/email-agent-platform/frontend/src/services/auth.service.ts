import { apiClient } from './api'
import { LoginResponse, RegisterData, User } from '../types/user'

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiClient.post('/auth/login', { email, password })
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    return apiClient.post('/auth/register', data)
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get('/auth/me')
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return apiClient.post('/auth/refresh', { refreshToken })
  },

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/password/reset-request', { email })
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/password/reset', { token, newPassword })
  },

  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiClient.post('/auth/password/change', { oldPassword, newPassword })
  },
}