'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { TeamInfo } from './types'
import { Activity } from 'lucide-react'

interface DashboardFiltersProps {
  teams: TeamInfo[]
  selectedTeamId: string | null
  onTeamChange: (teamId: string | null) => void
  isConnected: boolean
}

export function DashboardFilters({
  teams,
  selectedTeamId,
  onTeamChange,
  isConnected,
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Monitoramento de SLA
        </h2>
        <Badge
          variant={isConnected ? 'default' : 'destructive'}
          className="text-xs gap-1"
        >
          <Activity className={`h-3 w-3 ${isConnected ? 'text-emerald-500' : ''}`} />
          {isConnected ? 'Ao vivo' : 'Desconectado'}
        </Badge>
      </div>

      <Select
        value={selectedTeamId || '__all__'}
        onValueChange={(v) => onTeamChange(v === '__all__' ? null : v)}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Todas as equipes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todas as equipes</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
              <span className="text-muted-foreground ml-2 text-xs">
                ({team.sector})
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}