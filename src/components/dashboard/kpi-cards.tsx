'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Clock, AlertTriangle, TicketCheck, Users } from 'lucide-react'
import type { SlaSnapshot } from './types'
import { formatSeconds, formatPercent, complianceColor } from './types'

interface KpiCardsProps {
  snapshot: SlaSnapshot | null
}

// Cada card é um componente separado dentro do array para manter a responsabilidade única
// Se um card precisa de lógica diferente, isola sem afetar os outros

export function KpiCards({ snapshot }: KpiCardsProps) {
  if (!snapshot) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-6">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const totalBreached = snapshot.teams.reduce((acc, t) => acc + t.breached, 0)

  const cards = [
    {
      title: 'Taxa de Compliance',
      value: formatPercent(snapshot.globalCompliance),
      description: 'Dentro do SLA',
      icon: snapshot.globalCompliance >= 90 ? TrendingUp : TrendingDown,
      iconColor: complianceColor(snapshot.globalCompliance),
      bgColor: 'bg-emerald-50',
      iconBg: snapshot.globalCompliance >= 90 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600',
    },
    {
      title: 'Tempo Médio de Resposta',
      value: formatSeconds(snapshot.globalAvgResponseSec),
      description: 'Média global',
      icon: Clock,
      iconColor: 'text-slate-600',
      bgColor: 'bg-slate-50',
      iconBg: 'bg-slate-100 text-slate-600',
    },
    {
      title: 'Total de Tickets',
      value: snapshot.globalTotalTickets.toLocaleString('pt-BR'),
      description: `${snapshot.teams.length} equipes`,
      icon: TicketCheck,
      iconColor: 'text-slate-600',
      bgColor: 'bg-slate-50',
      iconBg: 'bg-slate-100 text-slate-600',
    },
    {
      title: 'Tickets Fora do SLA',
      value: totalBreached.toLocaleString('pt-BR'),
      description: ` ${(totalBreached / snapshot.globalTotalTickets * 100).toFixed(1)}% do total`,
      icon: AlertTriangle,
      iconColor: totalBreached > 50 ? 'text-red-600' : 'text-amber-600',
      bgColor: totalBreached > 50 ? 'bg-red-50' : 'bg-amber-50',
      iconBg: totalBreached > 50 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.iconBg}`}>
              <card.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.iconColor}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}