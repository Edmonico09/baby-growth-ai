import { apiClient } from './client'

export interface GrowthRecord {
  id: string
  childId: string
  date: string
  weight: number | null
  height: number | null
  headCircumference: number | null
  notes: string | null
  createdAt: string | null
  updatedAt: string | null
  weightZscore: number | null
  heightZscore: number | null
  headZscore: number | null
  weightPercentile: number | null
  heightPercentile: number | null
  headPercentile: number | null
}

export interface Alert {
  id: string
  childId: string
  recordId: string | null
  alertType: string
  severity: string
  message: string
  active: string
  createdAt: string
  resolvedAt: string | null
}

export interface GrowthAnalysis {
  childId: string
  ageMonths: number
  lastRecord: GrowthRecord | null
  weightTrend: string | null
  heightTrend: string | null
  alerts: Alert[]
  weightVelocity: number | null
  heightVelocity: number | null
}

export interface GrowthTrendPoint {
  date: string
  weight: number | null
  height: number | null
  weightZscore: number | null
  heightZscore: number | null
  weightPercentile: number | null
  heightPercentile: number | null
}

export interface GrowthTrends {
  childId: string
  weightGainLastMonth: number | null
  heightGainLastMonth: number | null
  weightVelocity: number | null
  heightVelocity: number | null
  trend: GrowthTrendPoint[]
}

export interface MlFeatures {
  childId: string
  ageMonths: number
  sex: string | null
  birthWeight: number | null
  birthLength: number | null
  currentWeight: number | null
  currentHeight: number | null
  headCircumference: number | null
  weightPercentile: number | null
  heightPercentile: number | null
  headPercentile: number | null
  weightZscore: number | null
  heightZscore: number | null
  headZscore: number | null
  weightGainLastMonth: number | null
  heightGainLastMonth: number | null
  growthVelocity: number | null
}

export interface GrowthPrediction {
  id: string
  childId: string
  predictionDate: string
  predictedWeight1Month: number | null
  predictedWeight3Months: number | null
  predictedHeight1Month: number | null
  predictedHeight3Months: number | null
  confidenceScore: number | null
  createdAt: string | null
}

export interface MessageResponse {
  message: string
}

export const growthApi = {
  list: (childId: string) =>
    apiClient.get<GrowthRecord[]>('/api/growth', { params: { childId } }).then((r) => r.data),

  create: (data: {
    childId: string
    date: string
    weight?: number
    height?: number
    headCircumference?: number
    notes?: string
  }) =>
    apiClient.post<GrowthRecord>('/api/growth', data).then((r) => r.data),

  update: (id: string, data: {
    date?: string
    weight?: number
    height?: number
    headCircumference?: number
    notes?: string
  }) =>
    apiClient.put<GrowthRecord>(`/api/growth/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<MessageResponse>(`/api/growth/${id}`).then((r) => r.data),

  getAnalysis: (childId: string) =>
    apiClient.get<GrowthAnalysis>(`/api/children/${childId}/growth-analysis`).then((r) => r.data),

  getAlerts: (childId: string) =>
    apiClient.get<Alert[]>(`/api/children/${childId}/alerts`).then((r) => r.data),

  getTrends: (childId: string) =>
    apiClient.get<GrowthTrends>(`/api/children/${childId}/growth-trends`).then((r) => r.data),

  getMlFeatures: (childId: string) =>
    apiClient.get<MlFeatures>(`/api/children/${childId}/ml-features`).then((r) => r.data),

  getPredictions: (childId: string) =>
    apiClient.get<GrowthPrediction[]>(`/api/children/${childId}/predictions`).then((r) => r.data),

  predict: (childId: string) =>
    apiClient.post<GrowthPrediction>(`/api/children/${childId}/predict`).then((r) => r.data),
}
