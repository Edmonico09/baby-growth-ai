'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

interface GrowthChartProps {
  data: Array<{
    date: string
    weight?: number
    height?: number
    headCircumference?: number
  }>
  type: 'weight' | 'height' | 'head'
  title: string
}

const LABELS = {
  weight: { key: 'weight', unit: 'kg', color: 'var(--color-primary)', name: 'Weight (kg)' },
  height: { key: 'height', unit: 'cm', color: 'var(--color-accent)', name: 'Height (cm)' },
  head: { key: 'headCircumference', unit: 'cm', color: 'var(--color-chart-3)', name: 'Head Circ. (cm)' },
}

export function GrowthChart({ data, type, title }: GrowthChartProps) {
  const config = LABELS[type]
  const chartData = data.map((item) => ({
    ...item,
    date: format(new Date(item.date), 'MMM d'),
  }))

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-semibold text-foreground">{title}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            stroke="var(--color-muted-foreground)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="var(--color-muted-foreground)"
            style={{ fontSize: '12px' }}
            label={{
              value: type === 'weight' ? 'Weight (kg)' : 'Height (cm)',
              angle: -90,
              position: 'insideLeft',
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
            }}
            cursor={{ stroke: 'var(--color-primary)', strokeWidth: 2 }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={config.key}
            stroke={config.color}
            strokeWidth={2}
            dot={{ fill: config.color, r: 5 }}
            activeDot={{ r: 7 }}
            name={config.name}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
