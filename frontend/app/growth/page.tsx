'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GrowthChart } from '@/components/growth-chart'
import { GrowthTable } from '@/components/growth-table'
import { GrowthRecordForm } from '@/components/growth-record-form'
import { useGrowthStore } from '@/store/growth'
import { useChildStore } from '@/store/child'
import { useChatStore } from '@/store/chat'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Sparkles, AlertTriangle, Info, AlertCircle, TrendingUp, Brain } from 'lucide-react'
import type { GrowthRecord, Alert, GrowthPrediction } from '@/api/growth'
import { growthApi } from '@/api/growth'

export default function GrowthPage() {
  const { child, fetch: fetchChild, loading: childLoading } = useChildStore()
  const { records, fetch: fetchRecords, create, update, remove, loading } = useGrowthStore()
  const { analyzeGrowth, analyzingGrowth, switchConversation } = useChatStore()
  const router = useRouter()

  const [formOpen, setFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [predictions, setPredictions] = useState<GrowthPrediction[]>([])
  const [predictionsLoading, setPredictionsLoading] = useState(false)
  const [generatingPrediction, setGeneratingPrediction] = useState(false)
  const [predictionsError, setPredictionsError] = useState<string | null>(null)

  useEffect(() => {
    fetchChild()
  }, [fetchChild])

  useEffect(() => {
    if (child) fetchRecords(child.id)
  }, [child, fetchRecords])

  useEffect(() => {
    if (child && records.length > 0) {
      growthApi.getPredictions(child.id).then(setPredictions).catch(() => {})
    }
  }, [child, records])

  const handleGeneratePrediction = useCallback(async () => {
    if (!child) return
    setGeneratingPrediction(true)
    setPredictionsError(null)
    try {
      const pred = await growthApi.predict(child.id)
      setPredictions((prev) => [pred, ...prev])
    } catch (e: any) {
      setPredictionsError(e.response?.data?.detail || e.message || 'Prediction failed')
    } finally {
      setGeneratingPrediction(false)
    }
  }, [child])

  const handleSave = useCallback(async (data: { date: string; weight: string; height: string; headCircumference: string; notes: string }) => {
    if (!child) return
    const payload = {
      childId: child.id,
      date: data.date,
      weight: data.weight ? parseFloat(data.weight) : undefined,
      height: data.height ? parseFloat(data.height) : undefined,
      headCircumference: data.headCircumference ? parseFloat(data.headCircumference) : undefined,
      notes: data.notes || undefined,
    }
    if (editingRecord) {
      await update(editingRecord.id, payload)
    } else {
      await create(payload)
    }
  }, [child, editingRecord, create, update])

  const handleEdit = useCallback((record: GrowthRecord) => {
    setEditingRecord(record)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await remove(id)
    }
  }, [remove])

  const openAddForm = useCallback(() => {
    setEditingRecord(null)
    setFormOpen(true)
  }, [])

  if (!child) {
    return (
      <main className="p-6 md:p-10">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground py-20">
          {childLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading...
            </div>
          ) : (
            'Please create a child profile first.'
          )}
        </div>
      </main>
    )
  }

  if (loading && records.length === 0) {
    return (
      <main className="p-6 md:p-10">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground py-20">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </div>
      </main>
    )
  }

  const firstRecord = records[0]
  const lastRecord = records[records.length - 1]
  const hasData = records.length >= 2

  const totalWeight = hasData && lastRecord.weight != null && firstRecord.weight != null
    ? lastRecord.weight - firstRecord.weight
    : null
  const totalHeight = hasData && lastRecord.height != null && firstRecord.height != null
    ? lastRecord.height - firstRecord.height
    : null

  const monthsElapsed = hasData && firstRecord.date && lastRecord.date
    ? (new Date(lastRecord.date).getTime() - new Date(firstRecord.date).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    : null

  const avgMonthlyWeightGain = monthsElapsed && totalWeight != null && monthsElapsed > 0
    ? (totalWeight / monthsElapsed).toFixed(2)
    : null

  const avgMonthlyHeightGain = monthsElapsed && totalHeight != null && monthsElapsed > 0
    ? (totalHeight / monthsElapsed).toFixed(2)
    : null

  const chartData = records.map((r) => ({
    date: r.date,
    weight: r.weight ?? undefined,
    height: r.height ?? undefined,
    headCircumference: r.headCircumference ?? undefined,
  }))

  const activeAlerts: Alert[] = []
  if (lastRecord) {
    const wZ = lastRecord.weightZscore
    const hZ = lastRecord.heightZscore
    if (wZ != null && wZ < -2) activeAlerts.push({ id: 'w-low', childId: child.id, recordId: lastRecord.id, alertType: 'low_weight', severity: wZ < -3 ? 'critical' : 'warning', message: wZ < -3 ? `Weight z-score: ${wZ.toFixed(2)} (severely below normal)` : `Weight z-score: ${wZ.toFixed(2)} (below normal)`, active: 'active', createdAt: '', resolvedAt: null })
    if (wZ != null && wZ > 2) activeAlerts.push({ id: 'w-high', childId: child.id, recordId: lastRecord.id, alertType: 'high_weight', severity: wZ > 3 ? 'critical' : 'warning', message: wZ > 3 ? `Weight z-score: ${wZ.toFixed(2)} (severely above normal)` : `Weight z-score: ${wZ.toFixed(2)} (above normal)`, active: 'active', createdAt: '', resolvedAt: null })
    if (hZ != null && hZ < -2) activeAlerts.push({ id: 'h-low', childId: child.id, recordId: lastRecord.id, alertType: 'stunting', severity: hZ < -3 ? 'critical' : 'warning', message: hZ < -3 ? `Height z-score: ${hZ.toFixed(2)} (severely below normal)` : `Height z-score: ${hZ.toFixed(2)} (below normal)`, active: 'active', createdAt: '', resolvedAt: null })
    if (hZ != null && hZ > 2) activeAlerts.push({ id: 'h-high', childId: child.id, recordId: lastRecord.id, alertType: 'high_length', severity: hZ > 3 ? 'critical' : 'warning', message: hZ > 3 ? `Height z-score: ${hZ.toFixed(2)} (severely above normal)` : `Height z-score: ${hZ.toFixed(2)} (above normal)`, active: 'active', createdAt: '', resolvedAt: null })
  }

  return (
    <main className="p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Growth Tracking</h1>
            <p className="mt-2 text-muted-foreground">Monitor your child&apos;s weight and height development</p>
          </div>
          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <Button
                onClick={async () => {
                  setAnalyzeError(null)
                  try {
                    const res = await analyzeGrowth(child.id)
                    await switchConversation(res.conversationId)
                    router.push('/assistant')
                  } catch (e: any) {
                    setAnalyzeError(e.message)
                  }
                }}
                disabled={analyzingGrowth}
                variant="outline"
                className="gap-2"
              >
                {analyzingGrowth ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Ask AI to Analyze
              </Button>
            )}
            <Button onClick={openAddForm} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <GrowthChart
            data={chartData}
            type="weight"
            title="Weight Growth Over Time"
          />
          <GrowthChart
            data={chartData}
            type="height"
            title="Height Growth Over Time"
          />
          <GrowthChart
            data={chartData}
            type="head"
            title="Head Circumference Over Time"
          />
        </div>

        {activeAlerts.length > 0 && (
          <div className="space-y-2">
            {activeAlerts.map((a) => (
              <div
                key={a.id}
                className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${
                  a.severity === 'critical'
                    ? 'bg-destructive/5 text-destructive'
                    : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                }`}
              >
                {a.severity === 'critical' ? (
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        )}

        {analyzeError && (
          <div className="rounded-lg bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {analyzeError}
          </div>
        )}

        <Tabs defaultValue="measurements" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="measurements">Measurement Records</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="predictions" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Predictions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="measurements">
            <GrowthTable
              data={records}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {hasData ? (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">Weight Analysis</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Starting Weight</p>
                      <p className="font-bold text-foreground">{firstRecord.weight} kg</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Weight</p>
                      <p className="font-bold text-foreground">{lastRecord.weight} kg</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Weight Gain</p>
                      <p className={totalWeight != null && totalWeight >= 0 ? 'font-bold text-green-600 dark:text-green-400' : 'font-bold text-destructive'}>
                        {totalWeight != null ? `${totalWeight >= 0 ? '+' : ''}${totalWeight.toFixed(1)} kg` : '--'}
                      </p>
                    </div>
                    {avgMonthlyWeightGain && (
                      <div className="border-t border-border pt-3 mt-3">
                        <p className="text-muted-foreground mb-2">Avg Monthly Gain</p>
                        <p className="font-bold text-foreground">{avgMonthlyWeightGain} kg/month</p>
                      </div>
                    )}
                    {lastRecord.weightPercentile != null && (
                      <div className="border-t border-border pt-3 mt-3 space-y-1">
                        <p className="text-muted-foreground">Percentile</p>
                        <p className="font-bold text-foreground">{lastRecord.weightPercentile.toFixed(1)}%</p>
                        <p className="text-muted-foreground text-xs">Z-score: {lastRecord.weightZscore?.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">Height Analysis</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Starting Height</p>
                      <p className="font-bold text-foreground">{firstRecord.height} cm</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Height</p>
                      <p className="font-bold text-foreground">{lastRecord.height} cm</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Height Growth</p>
                      <p className={totalHeight != null && totalHeight >= 0 ? 'font-bold text-green-600 dark:text-green-400' : 'font-bold text-destructive'}>
                        {totalHeight != null ? `${totalHeight >= 0 ? '+' : ''}${totalHeight.toFixed(1)} cm` : '--'}
                      </p>
                    </div>
                    {avgMonthlyHeightGain && (
                      <div className="border-t border-border pt-3 mt-3">
                        <p className="text-muted-foreground mb-2">Avg Monthly Growth</p>
                        <p className="font-bold text-foreground">{avgMonthlyHeightGain} cm/month</p>
                      </div>
                    )}
                    {lastRecord.heightPercentile != null && (
                      <div className="border-t border-border pt-3 mt-3 space-y-1">
                        <p className="text-muted-foreground">Percentile</p>
                        <p className="font-bold text-foreground">{lastRecord.heightPercentile.toFixed(1)}%</p>
                        <p className="text-muted-foreground text-xs">Z-score: {lastRecord.heightZscore?.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">Head Circumference</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Current</p>
                      <p className="font-bold text-foreground">{lastRecord.headCircumference ?? '--'} cm</p>
                    </div>
                    {lastRecord.headPercentile != null && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Percentile</p>
                        <p className="font-bold text-foreground">{lastRecord.headPercentile.toFixed(1)}%</p>
                        <p className="text-muted-foreground text-xs">Z-score: {lastRecord.headZscore?.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                Add at least two growth records to see analysis.
              </div>
            )}
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">ML Growth Predictions</h3>
                <p className="text-sm text-muted-foreground">
                  Predictions from our RandomForest model trained on WHO growth data
                </p>
              </div>
              <Button
                onClick={handleGeneratePrediction}
                disabled={generatingPrediction || records.length < 2}
                variant="outline"
                className="gap-2"
              >
                {generatingPrediction ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                Generate Prediction
              </Button>
            </div>

            {predictionsError && (
              <div className="rounded-lg bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {predictionsError}
              </div>
            )}

            {predictions.length === 0 && !predictionsLoading && (
              <div className="text-center text-muted-foreground py-10">
                No predictions yet. Click "Generate Prediction" to see future growth estimates.
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {predictions.slice(0, 1).map((pred) => (
                <React.Fragment key={pred.id}>
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Weight Forecast</h3>
                    </div>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center pb-3 border-b border-border">
                        <span className="text-muted-foreground">Current</span>
                        <span className="font-bold text-foreground">{lastRecord.weight ?? '--'} kg</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-border">
                        <span className="text-muted-foreground">Predicted (1 month)</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{pred.predictedWeight1Month ?? '--'} kg</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Predicted (3 months)</span>
                        <span className="font-bold text-primary">{pred.predictedWeight3Months ?? '--'} kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Height Forecast</h3>
                    </div>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center pb-3 border-b border-border">
                        <span className="text-muted-foreground">Current</span>
                        <span className="font-bold text-foreground">{lastRecord.height ?? '--'} cm</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-border">
                        <span className="text-muted-foreground">Predicted (1 month)</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{pred.predictedHeight1Month ?? '--'} cm</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Predicted (3 months)</span>
                        <span className="font-bold text-primary">{pred.predictedHeight3Months ?? '--'} cm</span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {predictions.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-semibold text-foreground mb-3">Model Confidence</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (predictions[0].confidenceScore ?? 0) >= 0.7
                          ? 'bg-green-500'
                          : (predictions[0].confidenceScore ?? 0) >= 0.4
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${((predictions[0].confidenceScore ?? 0) * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground min-w-[4rem] text-right">
                    {((predictions[0].confidenceScore ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {predictions[0].confidenceScore != null && predictions[0].confidenceScore >= 0.7
                    ? 'High confidence — the model has good data for this prediction.'
                    : predictions[0].confidenceScore != null && predictions[0].confidenceScore >= 0.4
                      ? 'Moderate confidence — prediction should be used with caution.'
                      : 'Low confidence — prediction is tentative. Add more growth records for better accuracy.'}
                </p>
              </div>
            )}

            {predictions.length > 1 && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-semibold text-foreground mb-3">Prediction History</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  {predictions.map((p) => (
                    <div key={p.id} className="flex justify-between items-center py-1 border-b border-border last:border-0">
                      <span>{new Date(p.predictionDate).toLocaleDateString()}</span>
                      <span>
                        W:{p.predictedWeight1Month ?? '--'}kg / H:{p.predictedHeight1Month ?? '--'}cm
                        {' '}(conf: {((p.confidenceScore ?? 0) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <GrowthRecordForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingRecord(null) }}
        onSave={handleSave}
        initial={editingRecord}
        title={editingRecord ? 'Edit Growth Record' : 'Add Growth Record'}
      />
    </main>
  )
}
