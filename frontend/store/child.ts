import { create } from 'zustand'
import { childApi, type ChildProfile } from '@/api/child'

interface ChildState {
  child: ChildProfile | null
  loading: boolean
  error: string | null

  fetch: () => Promise<void>
  create: (data: { name: string; dateOfBirth: string; sex?: string; birthWeight?: number; birthLength?: number }) => Promise<void>
  clear: () => void
}

export const useChildStore = create<ChildState>((set) => ({
  child: null,
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null })
    try {
      const child = await childApi.get()
      set({ child, loading: false })
    } catch (e: any) {
      if (e.response?.status === 404) {
        set({ child: null, loading: false })
        return
      }
      set({ error: 'Failed to load child profile', loading: false })
    }
  },

  create: async (data) => {
    set({ loading: true, error: null })
    try {
      const child = await childApi.create(data)
      set({ child, loading: false })
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Failed to create profile'
      set({ error: msg, loading: false })
      throw new Error(msg)
    }
  },

  clear: () => set({ child: null, error: null }),
}))
