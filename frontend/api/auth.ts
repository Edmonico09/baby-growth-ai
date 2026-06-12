import { apiClient } from './client'

export interface User {
  id: string
  email: string
  name: string | null
  role: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface MessageResponse {
  message: string
}

export const authApi = {
  register: (data: { email: string; password: string; name?: string; role?: string }) =>
    apiClient.post<AuthResponse>('/api/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/api/auth/login', data).then((r) => r.data),

  logout: () =>
    apiClient.post<MessageResponse>('/api/auth/logout').then((r) => r.data),
}
