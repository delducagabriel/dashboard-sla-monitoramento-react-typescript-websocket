'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { HistoryPoint } from './types'

interface ComplianceChartProps {
  data: HistoryPoint[]
  loading: boolean
}

const chartConfig = {
  complianceRate: {
    label: 'Compliance %',
    color: 'var(--chart-2)',
  },
} as const

export function ComplianceChart({ data, loading }: ComplianceChartProps) {
  // useMemo evita recalcular a cada re-render (atualiza a cada 3s via WS)
  const formattedData = useMemo(() =>
    data.map((d) => ({
      ...d,
      shortDate: d.date.slice(5),
    })),
    [data]
  )

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Compliance ao Longo do Tempo</CardTitle>
        <CardDescription>
          Taxa de atendimento dentro do SLA por dia
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={formattedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="shortDate"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Compliance']}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="complianceRate"
                stroke="var(--color-complianceRate)"
                strokeWidth={2}
                dot={false}
                // activeDot mostra o ponto quando hover → melhora usabilidade
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
              {/* Linha de referência do SLA mínimo (95%) */}
              <Line
                type="monotone"
                dataKey={() => 95}
                stroke="var(--chart-1)"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}