import { apiClient } from './client'

export interface ChildProfile {
  id: string
  name: string
  dateOfBirth: string
  sex: string | null
  birthWeight: number | null
  birthLength: number | null
  userId: string
  createdAt: string
}

export const childApi = {
  get: () =>
    apiClient.get<ChildProfile>('/api/child').then((r) => r.data),

  create: (data: { name: string; dateOfBirth: string; sex?: string; birthWeight?: number; birthLength?: number }) =>
    apiClient.post<ChildProfile>('/api/child', data).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ChildProfile>(`/api/child/${id}`).then((r) => r.data),
}
