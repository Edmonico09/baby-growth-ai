'use client'

import { useEffect } from 'react'
import { StatCard } from '@/components/stat-card'
import { ChildProfileCard } from '@/components/child-profile-card'
import { Activity, Calendar, TrendingUp, Zap, Loader2 } from 'lucide-react'
import { useChildStore } from '@/store/child'
import { useGrowthStore } from '@/store/growth'

export default function Dashboard() {
  const { child, fetch: fetchChild, loading: childLoading } = useChildStore()
  const { records, fetch: fetchRecords, loading: recordsLoading } = useGrowthStore()

  useEffect(() => {
    fetchChild()
  }, [fetchChild])

  useEffect(() => {
    if (child) fetchRecords(child.id)
  }, [child, fetchRecords])

  const latestRecord = records[records.length - 1]

  const totalWeight =
    records.length >= 2 && records[records.length - 1].weight != null && records[0].weight != null
      ? records[records.length - 1].weight! - records[0].weight!
      : null

  const totalHeight =
    records.length >= 2 && records[records.length - 1].height != null && records[0].height != null
      ? records[records.length - 1].height! - records[0].height!
      : null

  const weightTrendPct =
    totalWeight != null && records[0].weight != null && records[0].weight! > 0
      ? Math.round((totalWeight / records[0].weight!) * 100)
      : null

  const heightTrendPct =
    totalHeight != null && records[0].height != null && records[0].height! > 0
      ? Math.round((totalHeight / records[0].height!) * 100)
      : null

  const healthStatus = (() => {
    if (records.length < 2) return 'Insufficient data'
    if (totalWeight != null && totalWeight < 0) return 'Needs attention'
    if (totalHeight != null && totalHeight < 0) return 'Needs attention'
    return 'Excellent'
  })()

  const healthIcon = healthStatus === 'Excellent' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'

  if (childLoading || (recordsLoading && records.length === 0)) {
    return (
      <main className="p-6 md:p-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Welcome Back!</h1>
            <p className="mt-2 text-muted-foreground">Track your child&apos;s growth journey</p>
          </div>
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 md:p-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Welcome Back!</h1>
              <p className="mt-2 text-muted-foreground">Track your child&apos;s growth journey</p>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
              <StatCard
                label="Current Weight"
                value={latestRecord ? String(latestRecord.weight) : '--'}
                unit="kg"
                icon={TrendingUp}
                trend={weightTrendPct != null ? { value: weightTrendPct, direction: weightTrendPct >= 0 ? 'up' : 'down' } : undefined}
              />
              <StatCard
                label="Current Height"
                value={latestRecord ? latestRecord.height?.toFixed(1) ?? '--' : '--'}
                unit="cm"
                icon={TrendingUp}
                trend={heightTrendPct != null ? { value: heightTrendPct, direction: heightTrendPct >= 0 ? 'up' : 'down' } : undefined}
              />
              <StatCard
                label="Total Records"
                value={String(records.length)}
                icon={Calendar}
              />
              <StatCard
                label="Health Status"
                value={healthStatus}
                icon={Activity}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                {child ? (
                  <ChildProfileCard
                    name={child.name}
                    dateOfBirth={child.dateOfBirth}
                    sex={(child.sex as 'male' | 'female') ?? ''}
                    weight={latestRecord?.weight ?? undefined}
                    height={latestRecord?.height ?? undefined}
                  />
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center text-muted-foreground">
                    No child profile yet
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 space-y-6">
                {latestRecord && (
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="font-semibold text-foreground mb-4">Latest Measurements</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Weight</p>
                        <p className="mt-2 text-3xl font-bold text-foreground">
                          {latestRecord.weight} <span className="text-base text-muted-foreground">kg</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Height</p>
                        <p className="mt-2 text-3xl font-bold text-foreground">
                          {latestRecord.height} <span className="text-base text-muted-foreground">cm</span>
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Last updated on{' '}
                      {new Date(latestRecord.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="flex items-center gap-2 font-semibold text-foreground mb-4">
                    <Zap className="h-5 w-5 text-primary" />
                    Growth Insights
                  </h3>
                  <ul className="space-y-3 text-sm">
                    {totalWeight != null ? (
                      <li className="flex items-start gap-3">
                        <span className={`mt-1 inline-block h-2 w-2 rounded-full flex-shrink-0 ${totalWeight >= 0 ? 'bg-primary' : 'bg-destructive'}`}></span>
                        <span className="text-foreground">
                          {totalWeight >= 0
                            ? `Weight gain of ${totalWeight.toFixed(1)} kg tracked so far`
                            : `Weight loss of ${Math.abs(totalWeight).toFixed(1)} kg detected`}
                        </span>
                      </li>
                    ) : (
                      <li className="flex items-start gap-3">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-muted flex-shrink-0"></span>
                        <span className="text-muted-foreground">Add growth records to see weight insights</span>
                      </li>
                    )}
                    {totalHeight != null ? (
                      <li className="flex items-start gap-3">
                        <span className={`mt-1 inline-block h-2 w-2 rounded-full flex-shrink-0 ${totalHeight >= 0 ? 'bg-accent' : 'bg-destructive'}`}></span>
                        <span className="text-foreground">
                          {totalHeight >= 0
                            ? `Height increase of ${totalHeight.toFixed(1)} cm tracked`
                            : `Height decrease of ${Math.abs(totalHeight).toFixed(1)} cm detected`}
                        </span>
                      </li>
                    ) : (
                      <li className="flex items-start gap-3">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-muted flex-shrink-0"></span>
                        <span className="text-muted-foreground">Add growth records to see height insights</span>
                      </li>
                    )}
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary flex-shrink-0"></span>
                      <span className="text-foreground">Keep monitoring growth trends monthly</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
    </main>
  )
}
