'use client'

import React from 'react'
import { format } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GrowthRecord } from '@/api/growth'

interface GrowthTableProps {
  data: GrowthRecord[]
  onEdit?: (record: GrowthRecord) => void
  onDelete?: (id: string) => void
}

export function GrowthTable({ data, onEdit, onDelete }: GrowthTableProps) {
  const getStatus = (record: GrowthRecord, prevRecord: GrowthRecord | null): { label: string; color: string } => {
    if (!prevRecord) return { label: 'Baseline', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' }
    if (record.weight == null || prevRecord.weight == null) return { label: 'Unknown', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' }
    if (record.weight >= prevRecord.weight) return { label: 'Good Progress', color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' }
    return { label: 'Needs Review', color: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' }
  }

  const percentileLabel = (p: number | null): string => {
    if (p == null) return '--'
    if (p < 3) return '<3rd'
    if (p > 97) return '>97th'
    return `${Math.round(p)}th`
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-4 text-left font-semibold text-foreground">Date</th>
              <th className="px-6 py-4 text-left font-semibold text-foreground">Weight (kg)</th>
              <th className="px-6 py-4 text-left font-semibold text-foreground">Height (cm)</th>
              <th className="px-6 py-4 text-left font-semibold text-foreground">Head (cm)</th>
              <th className="px-6 py-4 text-left font-semibold text-foreground">Wt %ile</th>
              <th className="px-6 py-4 text-left font-semibold text-foreground">Ht %ile</th>
              <th className="px-6 py-4 text-left font-semibold text-foreground">Status</th>
              {(onEdit || onDelete) && <th className="px-6 py-4 text-right font-semibold text-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((record, index) => {
              const prevRecord = index > 0 ? data[index - 1] : null
              const weightTrend =
                prevRecord && record.weight != null && prevRecord.weight != null
                  ? record.weight > prevRecord.weight ? 'up' : record.weight < prevRecord.weight ? 'down' : 'stable'
                  : null
              const heightTrend =
                prevRecord && record.height != null && prevRecord.height != null
                  ? record.height > prevRecord.height ? 'up' : record.height < prevRecord.height ? 'down' : 'stable'
                  : null
              const status = getStatus(record, prevRecord)

              return (
                <tr key={record.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-foreground font-medium">
                    {format(new Date(record.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{record.weight ?? '--'}</span>
                      {weightTrend && (
                        <span className={`text-xs font-medium ${
                          weightTrend === 'up'
                            ? 'text-green-600 dark:text-green-400'
                            : weightTrend === 'down'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-muted-foreground'
                        }`}>
                          {weightTrend === 'up' ? '\u2191' : weightTrend === 'down' ? '\u2193' : '\u2192'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{record.height ?? '--'}</span>
                      {heightTrend && (
                        <span className={`text-xs font-medium ${
                          heightTrend === 'up'
                            ? 'text-green-600 dark:text-green-400'
                            : heightTrend === 'down'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-muted-foreground'
                        }`}>
                          {heightTrend === 'up' ? '\u2191' : heightTrend === 'down' ? '\u2193' : '\u2192'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {record.headCircumference ?? '--'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      record.weightPercentile != null && record.weightPercentile < 3
                        ? 'text-destructive'
                        : record.weightPercentile != null && record.weightPercentile > 97
                          ? 'text-destructive'
                          : 'text-foreground'
                    }`}>
                      {percentileLabel(record.weightPercentile)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      record.heightPercentile != null && record.heightPercentile < 3
                        ? 'text-destructive'
                        : record.heightPercentile != null && record.heightPercentile > 97
                          ? 'text-destructive'
                          : 'text-foreground'
                    }`}>
                      {percentileLabel(record.heightPercentile)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <Button variant="ghost" size="icon-xs" onClick={() => onEdit(record)} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button variant="ghost" size="icon-xs" onClick={() => onDelete(record.id)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
