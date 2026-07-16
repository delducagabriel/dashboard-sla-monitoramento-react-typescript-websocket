// Tipos centralizados do domínio SLA 
export interface TeamKPI {
  teamId: string
  teamName: string
  sector: string
  totalTickets: number
  completedWithinSLA: number
  breached: number
  complianceRate: number
  avgResponseTimeSec: number
  slaTargetSec: number
}

export interface SlaSnapshot {
  timestamp: string
  teams: TeamKPI[]
  globalCompliance: number
  globalAvgResponseSec: number
  globalTotalTickets: number
}

export interface AgentPerformance {
  agentId: string
  agentName: string
  teamName: string
  totalTickets: number
  complianceRate: number
  avgResponseTimeSec: number
}

export interface HistoryPoint {
  date: string
  totalTickets: number
  completed: number
  breached: number
  avgResponseSec: number | null
  complianceRate: number | null
}

export interface TeamInfo {
  id: string
  name: string
  sector: string
  _count: {
    agents: number
    records: number
  }
}

export interface DetailRecord {
  id: string
  ticketId: string
  agentName: string
  status: string
  slaTargetSec: number
  responseTimeSec: number
  isBreached: boolean
  createdAt: string
}

// Helpers de formatação de dados para exibição no dashboard
export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function complianceColor(rate: number): string {
  if (rate >= 95) return 'text-emerald-600'
  if (rate >= 85) return 'text-amber-600'
  return 'text-red-600'
}

export function complianceBg(rate: number): string {
  if (rate >= 95) return 'bg-emerald-50 border-emerald-200'
  if (rate >= 85) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}