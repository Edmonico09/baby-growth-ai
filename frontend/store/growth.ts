import { create } from 'zustand'
import { growthApi, type GrowthRecord } from '@/api/growth'

interface GrowthState {
  records: GrowthRecord[]
  loading: boolean
  error: string | null

  fetch: (childId: string) => Promise<void>
  create: (data: { childId: string; date: string; weight?: number; height?: number; headCircumference?: number; notes?: string }) => Promise<void>
  update: (id: string, data: { date?: string; weight?: number; height?: number; headCircumference?: number; notes?: string }) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useGrowthStore = create<GrowthState>((set) => ({
  records: [],
  loading: false,
  error: null,

  fetch: async (childId) => {
    set({ loading: true, error: null })
    try {
      const records = await growthApi.list(childId)
      set({ records, loading: false })
    } catch {
      set({ error: 'Failed to load growth records', loading: false })
    }
  },

  create: async (data) => {
    set({ loading: true, error: null })
    try {
      const record = await growthApi.create(data)
      set((state) => ({ records: [...state.records, record], loading: false }))
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Failed to create record'
      set({ error: msg, loading: false })
      throw new Error(msg)
    }
  },

  update: async (id, data) => {
    set({ error: null })
    try {
      const updated = await growthApi.update(id, data)
      set((state) => ({
        records: state.records.map((r) => (r.id === id ? updated : r)),
      }))
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Failed to update record'
      set({ error: msg })
      throw new Error(msg)
    }
  },

  remove: async (id) => {
    set({ error: null })
    try {
      await growthApi.delete(id)
      set((state) => ({
        records: state.records.filter((r) => r.id !== id),
      }))
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Failed to delete record'
      set({ error: msg })
      throw new Error(msg)
    }
  },
}))
