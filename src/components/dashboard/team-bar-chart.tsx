'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { TeamKPI } from './types'

interface TeamBarChartProps {
  teams: TeamKPI[]
  loading: boolean
}

const chartConfig = {
  complianceRate: {
    label: 'Compliance %',
    color: 'var(--chart-2)',
  },
} as const

export function TeamBarChart({ teams, loading }: TeamBarChartProps) {
  // useMemo evita recriar array + sort a cada re-render
  const data = useMemo(() => {
    const sorted = [...teams].sort((a, b) => a.complianceRate - b.complianceRate)
    return sorted.map((t) => ({
      name: t.name,
      complianceRate: Math.round(t.complianceRate * 10) / 10,
      totalTickets: t.totalTickets,
      sector: t.sector,
    }))
  }, [teams])

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Compliance por Equipe</CardTitle>
        <CardDescription>
          Comparativo de taxa de atendimento dentro do SLA
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={90}
                tickLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => [
                      `${Number(value).toFixed(1)}%`,
                      `${item.payload.sector}`,
                    ]}
                  />
                }
              />
              <Bar dataKey="complianceRate" radius={[0, 4, 4, 0]} maxBarSize={32}>
                {data.map((entry, index) => (
                  // Cor condicional por compliance
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.complianceRate >= 95
                        ? 'var(--chart-2)'
                        : entry.complianceRate >= 85
                          ? 'var(--chart-4)'
                          : 'var(--chart-1)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}