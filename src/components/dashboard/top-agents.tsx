'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Trophy } from 'lucide-react'
import type { AgentPerformance } from './types'

interface TopAgentsProps {
  agents: AgentPerformance[]
  loading: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function TopAgents({ agents, loading }: TopAgentsProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Top Operadores
        </CardTitle>
        <CardDescription>
          Maiores taxas de compliance individual
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-2 w-full bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aguardando dados...
          </p>
        ) : (
          agents.map((agent, index) => (
            <div key={agent.agentId} className="flex items-center gap-3">
              <span className="text-sm font-bold text-muted-foreground w-4 text-right">
                {index + 1}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                  {getInitials(agent.agentName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {agent.agentName}
                  </span>
                  <span className="text-sm font-bold ml-2">
                    {agent.complianceRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress
                    value={agent.complianceRate}
                    className="h-1.5"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {agent.teamName}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}